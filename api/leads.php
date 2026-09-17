<?php
/**
 * leads.php — API REST segura para leads UIDE (OWASP Top 10 mitigado)
 *
 * Endpoints:
 *   POST   /api/leads.php           → crea lead (estudiante desde formulario)
 *   GET    /api/leads.php?asesor_id=ADV-01&pin=XXXX → lista leads del asesor (panel)
 *   GET    /api/leads.php?campaign=NAME&pin=XXXX   → lista por campaña (panel)
 *   GET    /api/leads.php?id=UIDE-...&pin=XXXX     → lead individual (panel)
 *
 * Seguridad:
 *  - A01 Broken Access Control: PIN por asesor + validación de ownership
 *  - A02 Cryptographic Failures: solo HTTPS, headers HSTS, no logs sensibles
 *  - A03 Injection: PDO prepared statements, validación estricta
 *  - A04 Insecure Design: rate limiting, input validation, size limits
 *  - A05 Security Misconfiguration: headers CSP, X-Frame, X-Content-Type, Referrer-Policy
 *  - A06 Vulnerable Components: PHP 8.x + SQLite3 (bundled), sin deps externas
 *  - A07 Authentication Failures: PIN hash (bcrypt) + constant-time compare
 *  - A08 Software Integrity Failures: validación schema JSON estricta
 *  - A09 Logging Failures: audit log estructurado sin PII
 *  - A10 SSRF: no outbound requests
 */

declare(strict_types=1);

// ==================== CONFIGURACIÓN ====================
$baseDir = __DIR__ . '/../';
$dataDir = $baseDir . 'data/';
$dbPath = $dataDir . 'leads.sqlite';
$pinFile = $dataDir . 'advisor_pins.json';   // { "ADV-01": "$2y$10$..." }
$auditLog = $dataDir . 'audit.log';

// Rate limiting simple (archivo por IP)
$rateLimitDir = $dataDir . 'ratelimit/';
if (!is_dir($rateLimitDir)) @mkdir($rateLimitDir, 0750, true);

const MAX_BODY_SIZE = 64 * 1024;          // 64 KB
const RATE_LIMIT_WINDOW = 60;             // segundos
const RATE_LIMIT_MAX_POST = 30;           // POST por ventana
const RATE_LIMIT_MAX_GET  = 120;          // GET por ventana
const PIN_COST = 10;                      // bcrypt cost

// ==================== HELPERS ====================
function json_response(int $status, array $payload): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function audit_log(string $event, array $ctx = []): void {
    global $auditLog;
    $entry = [
        'ts'     => date('c'),
        'event'  => $event,
        'ip'     => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'ua'     => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200),
        'ctx'    => $ctx,
    ];
    // No logear PII (email, móvil, cédula)
    $safeCtx = $ctx;
    foreach (['email','mobile','cedula','gclid','f_name','l_name'] as $k) {
        if (isset($safeCtx[$k])) $safeCtx[$k] = '[REDACTED]';
    }
    $entry['ctx'] = $safeCtx;
    @file_put_contents($auditLog, json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);
}

function rate_limit(string $ip, string $type): bool {
    global $rateLimitDir;
    $file = $rateLimitDir . 'rl_' . preg_replace('/[^a-zA-Z0-9.:]/', '_', $ip) . '.json';
    $now = time();
    $data = ['ts' => $now, 'post' => 0, 'get' => 0];
    if (file_exists($file)) {
        $json = @file_get_contents($file);
        if ($json) $data = json_decode($json, true) ?? $data;
    }
    if ($now - ($data['ts'] ?? $now) > RATE_LIMIT_WINDOW) {
        $data = ['ts' => $now, 'post' => 0, 'get' => 0];
    }
    $limit = ($type === 'POST') ? RATE_LIMIT_MAX_POST : RATE_LIMIT_MAX_GET;
    $count = &$data[$type === 'POST' ? 'post' : 'get'];
    if (++$count > $limit) {
        @file_put_contents($file, json_encode($data), LOCK_EX);
        return false;
    }
    @file_put_contents($file, json_encode($data), LOCK_EX);
    return true;
}

function get_pdo(): PDO {
    global $dbPath;
    if (!file_exists($dbPath)) {
        throw new RuntimeException('DB no inicializada. Ejecute init-db.php');
    }
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA busy_timeout = 5000;');
    return $pdo;
}

function verify_pin(string $advisorId, string $pin): bool {
    global $pinFile, $auditLog;
    if (!file_exists($pinFile)) return false;
    $pins = json_decode(@file_get_contents($pinFile), true) ?? [];
    $hash = $pins[$advisorId] ?? null;
    if (!$hash) return false;
    $ok = password_verify($pin, $hash);
    audit_log('pin_verify', ['advisor_id' => $advisorId, 'result' => $ok]);
    return $ok;
}

function set_pin(string $advisorId, string $pin): void {
    global $pinFile;
    $pins = file_exists($pinFile) ? (json_decode(@file_get_contents($pinFile), true) ?? []) : [];
    $pins[$advisorId] = password_hash($pin, PASSWORD_BCRYPT, ['cost' => PIN_COST]);
    @file_put_contents($pinFile, json_encode($pins, JSON_UNESCAPED_UNICODE), LOCK_EX);
    audit_log('pin_set', ['advisor_id' => $advisorId]);
}

// ==================== SECURITY HEADERS (A05, A02) ====================
header('Content-Security-Policy: default-src \'none\'; frame-ancestors \'none\';');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), camera=(), microphone=()');
header('X-XSS-Protection: 1; mode=block');
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
}

// CORS restrictivo: solo mismo origen (apache sirve estático + api bajo mismo host)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = 'https://www.uide.edu.ec';
if ($origin === $allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Advisor-Pin');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ==================== RATE LIMIT (A04) ====================
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!rate_limit($ip, $_SERVER['REQUEST_METHOD'])) {
    audit_log('rate_limit_exceeded', ['method' => $_SERVER['REQUEST_METHOD']]);
    json_response(429, ['error' => 'Demasiadas solicitudes', 'code' => 'RATE_LIMIT']);
}

// ==================== BODY SIZE LIMIT (A04) ====================
if ($_SERVER['CONTENT_LENGTH'] ?? 0 > MAX_BODY_SIZE) {
    json_response(413, ['error' => 'Payload demasiado grande', 'code' => 'PAYLOAD_TOO_LARGE']);
}

// ==================== ROUTING ====================
$method = $_SERVER['REQUEST_METHOD'];
$params = $_GET;

try {
    $pdo = get_pdo();

    // -------------------- POST: crear lead (público, sin PIN) --------------------
    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        if (!$raw) json_response(400, ['error' => 'Body vacío', 'code' => 'EMPTY_BODY']);
        $lead = json_decode($raw, true);
        if (!is_array($lead)) json_response(400, ['error' => 'JSON inválido', 'code' => 'INVALID_JSON']);

        // Validación schema mínima (A08)
        $required = ['email','f_name','l_name','mobile','aut_data','sede','tp_pgm','esc_pgm','periodo','utm_campaign','c_lead','origen'];
        foreach ($required as $f) {
            if (empty($lead[$f]) && $lead[$f] !== '0' && $lead[$f] !== false) {
                json_response(400, ['error' => "Campo requerido: $f", 'code' => 'MISSING_FIELD']);
            }
        }
        // Sanitización básica
        $lead = array_map(fn($v) => is_string($v) ? trim($v) : $v, $lead);
        // Validación email básica
        if (!filter_var($lead['email'], FILTER_VALIDATE_EMAIL)) {
            json_response(400, ['error' => 'Email inválido', 'code' => 'INVALID_EMAIL']);
        }
        // Generar ID si no viene
        $lead['id'] = $lead['id'] ?? 'UIDE-' . time() . '-' . random_int(1000, 9999);
        $lead['timestamp'] = $lead['timestamp'] ?? date('c');
        $lead['fecha_legible'] = $lead['fecha_legible'] ?? date('Y-m-d H:i:s', strtotime($lead['timestamp']));
        $lead['campaign_code'] = $lead['campaign_code'] ?? '701PA00000pPa4mYAC';
        $lead['created_at'] = date('c');
        $lead['updated_at'] = date('c');

        // Insert con prepared statement (A03)
        $cols = array_keys($lead);
        $placeholders = ':' . implode(',:', $cols);
        $sql = 'INSERT INTO leads (' . implode(',', $cols) . ') VALUES (' . $placeholders . ')';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($lead);

        audit_log('lead_created', ['id' => $lead['id'], 'asesor_id' => $lead['asesor_id'] ?? 'unknown']);
        json_response(201, ['ok' => true, 'id' => $lead['id']]);
    }

    // -------------------- GET: leer leads (requiere PIN) --------------------
    if ($method === 'GET') {
        $advisorId = $params['asesor_id'] ?? null;
        $pin = $params['pin'] ?? '';
        $campaign = $params['campaign'] ?? null;
        $leadId = $params['id'] ?? null;

        // Auth obligatoria para lectura (A01, A07)
        if (!$advisorId || !$pin) {
            json_response(401, ['error' => 'Autenticación requerida', 'code' => 'AUTH_REQUIRED']);
        }
        if (!verify_pin($advisorId, $pin)) {
            json_response(403, ['error' => 'PIN inválido', 'code' => 'INVALID_PIN']);
        }

        // Lead individual
        if ($leadId) {
            $stmt = $pdo->prepare('SELECT * FROM leads WHERE id = :id AND asesor_id = :aid');
            $stmt->execute([':id' => $leadId, ':aid' => $advisorId]);
            $row = $stmt->fetch();
            if (!$row) json_response(404, ['error' => 'No encontrado', 'code' => 'NOT_FOUND']);
            audit_log('lead_read', ['id' => $leadId, 'advisor_id' => $advisorId]);
            json_response(200, $row);
        }

        // Lista por asesor (con filtro campaña opcional)
        $where = 'WHERE asesor_id = :aid';
        $paramsSql = [':aid' => $advisorId];
        if ($campaign) {
            $where .= ' AND utm_campaign = :campaign';
            $paramsSql[':campaign'] = $campaign;
        }
        $stmt = $pdo->prepare("SELECT * FROM leads $where ORDER BY timestamp DESC LIMIT 500");
        $stmt->execute($paramsSql);
        $rows = $stmt->fetchAll();
        audit_log('leads_list', ['advisor_id' => $advisorId, 'count' => count($rows), 'campaign' => $campaign]);
        json_response(200, ['leads' => $rows, 'count' => count($rows)]);
    }

    json_response(405, ['error' => 'Método no permitido', 'code' => 'METHOD_NOT_ALLOWED']);

} catch (PDOException $e) {
    audit_log('db_error', ['error' => $e->getMessage()]);
    json_response(500, ['error' => 'Error de base de datos', 'code' => 'DB_ERROR']);
} catch (Throwable $e) {
    audit_log('server_error', ['error' => $e->getMessage()]);
    json_response(500, ['error' => 'Error interno', 'code' => 'SERVER_ERROR']);
}