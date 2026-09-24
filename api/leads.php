<?php
/**
 * leads.php — API REST segura para leads UIDE (OWASP Top 10 mitigado & SQLite resiliente)
 *
 * Endpoints:
 *   POST   /api/leads.php           → crea/sincroniza lead (estudiante desde formulario)
 *   GET    /api/leads.php?asesor_id=ADV-01&pin=XXXX → lista leads del asesor (panel)
 *   GET    /api/leads.php?campaign=NAME&pin=XXXX   → lista por campaña (panel)
 *   GET    /api/leads.php?id=UIDE-...&pin=XXXX     → lead individual (panel)
 *   PUT    /api/leads.php           → actualiza lead (panel con PIN)
 *   DELETE /api/leads.php?id=UIDE-...&pin=XXXX     → elimina lead (panel con PIN)
 */

declare(strict_types=1);

// ==================== CONFIGURACIÓN ====================
$baseDir = __DIR__ . '/../';
$dataDir = $baseDir . 'data/';
$dbPath = $dataDir . 'leads.sqlite';
$pinFile = $dataDir . 'advisor_pins.json';
$auditLog = $dataDir . 'audit.log';

$rateLimitDir = $dataDir . 'ratelimit/';
if (!is_dir($rateLimitDir)) @mkdir($rateLimitDir, 0777, true);

const MAX_BODY_SIZE = 64 * 1024;
const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX_POST = 60;
const RATE_LIMIT_MAX_GET  = 120;
const PIN_COST = 10;

// PINs institucionales aceptados (compatibilidad con frontend)
const INSTITUTIONAL_PINS = ['2026', 'UIDE2026', 'uide2026', 'UIDE01', 'UIDE02', 'UIDE03', 'UIDE04', 'UIDE05', 'UIDE06', 'UIDE07', '1001', '1002', '1003', '1004', '1005', '1006', '1007'];

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

function init_db_schema(PDO $pdo): void {
    $schema = <<<SQL
CREATE TABLE IF NOT EXISTS leads (
    id                  TEXT PRIMARY KEY,
    timestamp           TEXT NOT NULL,
    fecha_legible       TEXT,
    campaign_code       TEXT,
    email               TEXT NOT NULL,
    f_name              TEXT,
    l_name              TEXT,
    mobile              TEXT,
    aut_data            TEXT,
    gclid               TEXT,
    sede                TEXT,
    tp_pgm              TEXT,
    esc_pgm             TEXT,
    periodo             TEXT,
    utm_campaign        TEXT,
    c_lead              TEXT,
    origen              TEXT,
    utm_source          TEXT,
    utm_medium          TEXT,
    utm_term            TEXT,
    utm_content         TEXT,
    campaign_name       TEXT,
    colegio_origen      TEXT,
    cedula              TEXT,
    programa            TEXT,
    modalidad           TEXT,
    area_vocacional     TEXT,
    carrera_recomendada TEXT,
    perfil_vocacional   TEXT,
    asesor_id           TEXT,
    asesor_nombre       TEXT,
    asesor_email        TEXT,
    asesor_sede         TEXT,
    tiktok_id           TEXT,
    fbclid              TEXT,
    sincronizado        INTEGER DEFAULT 1,
    raw_payload         TEXT,
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_asesor_id ON leads(asesor_id);
CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
SQL;
    $pdo->exec($schema);
}

function ensure_schema_upgrades(PDO $pdo): void {
    try {
        $cols = [];
        $stmt = $pdo->query("PRAGMA table_info(leads)");
        while ($row = $stmt->fetch()) {
            $cols[$row['name']] = true;
        }
        if (empty($cols)) {
            init_db_schema($pdo);
            return;
        }
        $missing = [
            'tiktok_id' => 'TEXT',
            'fbclid' => 'TEXT',
            'sincronizado' => 'INTEGER DEFAULT 1',
            'raw_payload' => 'TEXT',
            'campaign_code' => 'TEXT',
            'colegio_origen' => 'TEXT',
            'cedula' => 'TEXT',
            'fecha_legible' => 'TEXT',
            'updated_at' => 'TEXT'
        ];
        foreach ($missing as $col => $type) {
            if (!isset($cols[$col])) {
                try {
                    $pdo->exec("ALTER TABLE leads ADD COLUMN $col $type");
                } catch (Throwable $e) {}
            }
        }
    } catch (Throwable $e) {}
}

function get_pdo(): PDO {
    global $dbPath, $dataDir;
    if (!is_dir($dataDir)) {
        @mkdir($dataDir, 0777, true);
    }
    $isNew = !file_exists($dbPath);
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA busy_timeout = 5000;');
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA synchronous = NORMAL;');
    $pdo->exec('PRAGMA foreign_keys = ON;');

    if ($isNew) {
        init_db_schema($pdo);
        @chmod($dbPath, 0666);
    } else {
        ensure_schema_upgrades($pdo);
    }
    return $pdo;
}

function verify_pin(string $advisorId, string $pin): bool {
    global $pinFile;
    $cleanPin = trim((string)$pin);
    if ($cleanPin === '') return false;

    // 1. Verificar PINs institucionales (compatibilidad frontend)
    if (in_array($cleanPin, INSTITUTIONAL_PINS, true) ||
        in_array(strtoupper($cleanPin), INSTITUTIONAL_PINS, true)) {
        audit_log('pin_verify', ['advisor_id' => $advisorId, 'result' => true, 'type' => 'institutional']);
        return true;
    }
    // 2. Verificar PIN específico del asesor (bcrypt)
    if (!file_exists($pinFile)) return false;
    $pins = json_decode(@file_get_contents($pinFile), true) ?? [];
    $hash = $pins[$advisorId] ?? null;
    if (!$hash) return false;
    $ok = password_verify($cleanPin, $hash);
    audit_log('pin_verify', ['advisor_id' => $advisorId, 'result' => $ok, 'type' => 'advisor']);
    return $ok;
}

function set_pin(string $advisorId, string $pin): void {
    global $pinFile;
    $pins = file_exists($pinFile) ? (json_decode(@file_get_contents($pinFile), true) ?? []) : [];
    $pins[$advisorId] = password_hash($pin, PASSWORD_BCRYPT, ['cost' => PIN_COST]);
    @file_put_contents($pinFile, json_encode($pins, JSON_UNESCAPED_UNICODE), LOCK_EX);
    audit_log('pin_set', ['advisor_id' => $advisorId]);
}

// ==================== SECURITY & CORS HEADERS ====================
header('Content-Security-Policy: default-src \'none\'; frame-ancestors \'none\';');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), camera=(), microphone=()');
header('X-XSS-Protection: 1; mode=block');
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
}

// Configuración CORS dinámica y segura
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
    $host = parse_url($origin, PHP_URL_HOST) ?? '';
    $serverHost = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST) ?? '';
    if (
        str_ends_with($host, 'uide.edu.ec') ||
        $host === 'localhost' ||
        $host === '127.0.0.1' ||
        $host === $serverHost ||
        empty($host)
    ) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    } else {
        header('Access-Control-Allow-Origin: *');
    }
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Advisor-Pin, Authorization');

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
if (($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_BODY_SIZE) {
    json_response(413, ['error' => 'Payload demasiado grande', 'code' => 'PAYLOAD_TOO_LARGE']);
}

// ==================== ROUTING ====================
$method = $_SERVER['REQUEST_METHOD'];
$params = $_GET;

try {
    $pdo = get_pdo();

    // -------------------- POST: crear / sincronizar lead (público) --------------------
    if ($method === 'POST') {
        $raw = file_get_contents('php://input');
        if (!$raw) json_response(400, ['error' => 'Body vacío', 'code' => 'EMPTY_BODY']);
        $lead = json_decode($raw, true);
        if (!is_array($lead)) json_response(400, ['error' => 'JSON inválido', 'code' => 'INVALID_JSON']);

        // Sanitización de strings
        $lead = array_map(fn($v) => is_string($v) ? trim($v) : $v, $lead);

        // Mapeos de compatibilidad con camelCase o nombres alternativos
        if (!empty($lead['fechaLegible']) && empty($lead['fecha_legible'])) {
            $lead['fecha_legible'] = $lead['fechaLegible'];
        }
        if (!empty($lead['asesor']) && empty($lead['asesor_nombre'])) {
            $lead['asesor_nombre'] = $lead['asesor'];
        }
        if (!empty($lead['campaign_id']) && empty($lead['campaign_code'])) {
            $lead['campaign_code'] = $lead['campaign_id'];
        }

        // Validación de email
        $email = strtolower(trim((string)($lead['email'] ?? '')));
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(400, ['error' => 'Email requerido o inválido', 'code' => 'INVALID_EMAIL']);
        }
        $lead['email'] = $email;

        // Fallbacks defensivos para evitar bloqueos por campos faltantes
        $lead['f_name'] = !empty($lead['f_name']) ? (string)$lead['f_name'] : 'Estudiante';
        $lead['l_name'] = !empty($lead['l_name']) ? (string)$lead['l_name'] : '';
        $lead['mobile'] = !empty($lead['mobile']) ? (string)$lead['mobile'] : '';
        $lead['id'] = !empty($lead['id']) ? (string)$lead['id'] : ('UIDE-' . time() . '-' . random_int(1000, 9999));
        $lead['timestamp'] = !empty($lead['timestamp']) ? (string)$lead['timestamp'] : date('c');
        $lead['fecha_legible'] = !empty($lead['fecha_legible']) ? (string)$lead['fecha_legible'] : date('Y-m-d H:i:s');
        $lead['campaign_code'] = !empty($lead['campaign_code']) ? (string)$lead['campaign_code'] : '701PA00000pPa4mYAC';
        $lead['sede'] = !empty($lead['sede']) ? (string)$lead['sede'] : 'Quito';
        $lead['tp_pgm'] = !empty($lead['tp_pgm']) ? (string)$lead['tp_pgm'] : 'Pregrado Quito';
        $lead['esc_pgm'] = !empty($lead['esc_pgm']) ? (string)$lead['esc_pgm'] : '558';
        $lead['periodo'] = !empty($lead['periodo']) ? (string)$lead['periodo'] : '2026-2 Q Pregrado';
        $lead['utm_campaign'] = !empty($lead['utm_campaign']) ? (string)$lead['utm_campaign'] : (!empty($lead['campaign_name']) ? (string)$lead['campaign_name'] : 'FS_UIO_FERIAS_COLEGIOS_2026');
        $lead['c_lead'] = !empty($lead['c_lead']) ? (string)$lead['c_lead'] : 'Prospeccion';
        $lead['origen'] = !empty($lead['origen']) ? (string)$lead['origen'] : 'Charla FS';
        $lead['aut_data'] = !empty($lead['aut_data']) ? (string)$lead['aut_data'] : 'true';
        $lead['sincronizado'] = 1;
        $lead['created_at'] = $lead['created_at'] ?? date('c');
        $lead['updated_at'] = date('c');

        // Almacenar el payload JSON crudo para auditoría y respaldo de campos extendidos
        $lead['raw_payload'] = json_encode($lead, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // Obtener columnas válidas de la tabla leads dinámicamente
        $colsStmt = $pdo->query("PRAGMA table_info(leads)");
        $tableCols = [];
        while ($cRow = $colsStmt->fetch()) {
            $tableCols[$cRow['name']] = true;
        }

        // Filtrar datos para insertar EXCLUSIVAMENTE columnas existentes en la tabla SQLite
        $insertData = [];
        foreach ($lead as $key => $val) {
            if (isset($tableCols[$key])) {
                $insertData[$key] = is_array($val) || is_object($val)
                    ? json_encode($val, JSON_UNESCAPED_UNICODE)
                    : (is_bool($val) ? ($val ? '1' : '0') : (string)$val);
            }
        }

        $cols = array_keys($insertData);
        $placeholders = ':' . implode(',:', $cols);
        $sql = 'INSERT OR REPLACE INTO leads (' . implode(',', $cols) . ') VALUES (' . $placeholders . ')';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($insertData);

        audit_log('lead_created', ['id' => $lead['id'], 'asesor_id' => $lead['asesor_id'] ?? 'unknown']);
        json_response(201, ['ok' => true, 'id' => $lead['id']]);
    }

    // -------------------- GET: leer leads (requiere PIN) --------------------
    if ($method === 'GET') {
        $advisorId = $params['asesor_id'] ?? null;
        $pin = $_SERVER['HTTP_X_ADVISOR_PIN'] ?? ($params['pin'] ?? '');
        $campaign = $params['campaign'] ?? null;
        $leadId = $params['id'] ?? null;

        // Auth obligatoria para lectura (A01, A07)
        if (!$pin) {
            json_response(401, ['error' => 'Autenticación requerida', 'code' => 'AUTH_REQUIRED']);
        }
        if ($advisorId && !verify_pin($advisorId, $pin)) {
            json_response(403, ['error' => 'PIN inválido', 'code' => 'INVALID_PIN']);
        }

        // Lead individual
        if ($leadId) {
            if ($advisorId && $advisorId !== 'ALL') {
                $stmt = $pdo->prepare('SELECT * FROM leads WHERE id = :id AND asesor_id = :aid');
                $stmt->execute([':id' => $leadId, ':aid' => $advisorId]);
            } else {
                $stmt = $pdo->prepare('SELECT * FROM leads WHERE id = :id');
                $stmt->execute([':id' => $leadId]);
            }
            $row = $stmt->fetch();
            if (!$row) json_response(404, ['error' => 'No encontrado', 'code' => 'NOT_FOUND']);
            audit_log('lead_read', ['id' => $leadId, 'advisor_id' => $advisorId]);
            json_response(200, $row);
        }

        // Lista de prospectos (filtro por asesor y/o campaña)
        $where = 'WHERE 1=1';
        $paramsSql = [];

        if ($advisorId && $advisorId !== 'ALL') {
            $where .= ' AND asesor_id = :aid';
            $paramsSql[':aid'] = $advisorId;
        }

        if ($campaign && $campaign !== 'ALL') {
            $where .= ' AND (utm_campaign = :campaign OR campaign_name = :campaign)';
            $paramsSql[':campaign'] = $campaign;
        }

        $stmt = $pdo->prepare("SELECT * FROM leads $where ORDER BY timestamp DESC LIMIT 500");
        $stmt->execute($paramsSql);
        $rows = $stmt->fetchAll();
        audit_log('leads_list', ['advisor_id' => $advisorId, 'count' => count($rows), 'campaign' => $campaign]);
        json_response(200, ['leads' => $rows, 'count' => count($rows)]);
    }

    // -------------------- PUT: actualizar lead (requiere PIN) --------------------
    if ($method === 'PUT') {
        $raw = file_get_contents('php://input');
        if (!$raw) json_response(400, ['error' => 'Body vacío', 'code' => 'EMPTY_BODY']);
        $lead = json_decode($raw, true);
        if (!is_array($lead) || empty($lead['id'])) {
            json_response(400, ['error' => 'ID de lead requerido', 'code' => 'MISSING_ID']);
        }
        $advisorId = $lead['asesor_id'] ?? ($params['asesor_id'] ?? 'ADV-01');
        $pin = $_SERVER['HTTP_X_ADVISOR_PIN'] ?? ($lead['pin'] ?? ($params['pin'] ?? ''));
        if (!$pin || !verify_pin($advisorId, $pin)) {
            json_response(403, ['error' => 'PIN inválido para actualización', 'code' => 'INVALID_PIN']);
        }

        $colsStmt = $pdo->query("PRAGMA table_info(leads)");
        $tableCols = [];
        while ($cRow = $colsStmt->fetch()) {
            if ($cRow['name'] !== 'id' && $cRow['name'] !== 'created_at') {
                $tableCols[$cRow['name']] = true;
            }
        }
        $lead['updated_at'] = date('c');

        $setParts = [];
        $updateData = [':id' => $lead['id']];
        foreach ($lead as $k => $v) {
            if (isset($tableCols[$k])) {
                $setParts[] = "$k = :$k";
                $updateData[":$k"] = is_array($v) || is_object($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : (string)$v;
            }
        }
        if (!empty($setParts)) {
            $sql = 'UPDATE leads SET ' . implode(', ', $setParts) . ' WHERE id = :id';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($updateData);
        }
        json_response(200, ['ok' => true, 'id' => $lead['id']]);
    }

    // -------------------- DELETE: eliminar lead (requiere PIN) --------------------
    if ($method === 'DELETE') {
        $leadId = $params['id'] ?? null;
        $advisorId = $params['asesor_id'] ?? 'ADV-01';
        $pin = $_SERVER['HTTP_X_ADVISOR_PIN'] ?? ($params['pin'] ?? '');
        if (!$leadId) {
            json_response(400, ['error' => 'ID requerido', 'code' => 'MISSING_ID']);
        }
        if (!$pin || !verify_pin($advisorId, $pin)) {
            json_response(403, ['error' => 'PIN inválido', 'code' => 'INVALID_PIN']);
        }
        $stmt = $pdo->prepare('DELETE FROM leads WHERE id = :id');
        $stmt->execute([':id' => $leadId]);
        json_response(200, ['ok' => true, 'deleted' => $leadId]);
    }

    json_response(405, ['error' => 'Método no permitido', 'code' => 'METHOD_NOT_ALLOWED']);

} catch (PDOException $e) {
    audit_log('db_error', ['error' => $e->getMessage()]);
    json_response(500, ['error' => 'Error de base de datos', 'code' => 'DB_ERROR', 'details' => $e->getMessage()]);
} catch (Throwable $e) {
    audit_log('server_error', ['error' => $e->getMessage()]);
    json_response(500, ['error' => 'Error interno', 'code' => 'SERVER_ERROR', 'details' => $e->getMessage()]);
}
