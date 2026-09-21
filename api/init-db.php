<?php
/**
 * init-db.php — Inicializa y migra la base de datos SQLite para leads UIDE
 * Puede ejecutarse por CLI (php api/init-db.php) o vía HTTP (/api/init-db.php)
 * Garantiza la estructura de datos para la ingesta y consulta de prospectos.
 */

declare(strict_types=1);

$isCli = (php_sapi_name() === 'cli');

$baseDir = __DIR__ . '/../';
$dataDir = $baseDir . 'data/';
$dbPath = $dataDir . 'leads.sqlite';

if (!is_dir($dataDir)) {
    if (!@mkdir($dataDir, 0777, true)) {
        $msg = "ERROR: No se pudo crear el directorio de datos: $dataDir";
        if ($isCli) {
            fwrite(STDERR, "$msg\n");
            exit(1);
        } else {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['ok' => false, 'error' => $msg]);
            exit;
        }
    }
    @chmod($dataDir, 0777);
}

try {
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // WAL mode para concurrencia lectora/escritora
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA synchronous = NORMAL;');
    $pdo->exec('PRAGMA foreign_keys = ON;');
    $pdo->exec('PRAGMA busy_timeout = 5000;');

    $schema = <<<SQL
CREATE TABLE IF NOT EXISTS leads (
    id                  TEXT PRIMARY KEY,
    timestamp           TEXT NOT NULL,
    fecha_legible       TEXT,
    campaign_code       TEXT,
    -- 13 campos oficiales
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
    -- Atribución y tracking
    utm_source          TEXT,
    utm_medium          TEXT,
    utm_term            TEXT,
    utm_content         TEXT,
    campaign_name       TEXT,
    colegio_origen      TEXT,
    cedula              TEXT,
    programa            TEXT,
    modalidad           TEXT,
    -- Vocacional
    area_vocacional     TEXT,
    carrera_recomendada TEXT,
    perfil_vocacional   TEXT,
    -- Asesor
    asesor_id           TEXT,
    asesor_nombre       TEXT,
    asesor_email        TEXT,
    asesor_sede         TEXT,
    -- Tracking digital adicional
    tiktok_id           TEXT,
    fbclid              TEXT,
    sincronizado        INTEGER DEFAULT 1,
    raw_payload         TEXT,
    -- Metadatos
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_asesor_id ON leads(asesor_id);
CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
SQL;

    $pdo->exec($schema);

    // Migraciones automáticas para bases de datos preexistentes
    $stmt = $pdo->query("PRAGMA table_info(leads)");
    $existingCols = [];
    while ($row = $stmt->fetch()) {
        $existingCols[$row['name']] = true;
    }

    $requiredUpgrades = [
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

    $addedCols = [];
    foreach ($requiredUpgrades as $col => $type) {
        if (!isset($existingCols[$col])) {
            try {
                $pdo->exec("ALTER TABLE leads ADD COLUMN $col $type");
                $addedCols[] = $col;
            } catch (Throwable $e) {}
        }
    }

    @chmod($dbPath, 0666);

    $msg = "OK: SQLite inicializado correctamente en $dbPath";
    if (!empty($addedCols)) {
        $msg .= " (Columnas migradas: " . implode(', ', $addedCols) . ")";
    }

    if ($isCli) {
        echo "$msg\n";
    } else {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'ok' => true,
            'message' => $msg,
            'dbPath' => $dbPath,
            'migrated' => $addedCols
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
} catch (PDOException $e) {
    $err = "ERROR PDO: " . $e->getMessage();
    if ($isCli) {
        fwrite(STDERR, "$err\n");
        exit(1);
    } else {
        http_response_code(500);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => false, 'error' => $err]);
        exit;
    }
}