<?php
/**
 * init-db.php — Inicializa SQLite para leads UIDE
 * Ejecutar UNA vez: php api/init-db.php
 * Crea /home/toor/UIDE/Plataforma-Leads-FS-UIDE/data/leads.sqlite
 */

declare(strict_types=1);

$baseDir = __DIR__ . '/../';
$dataDir = $baseDir . 'data/';
$dbPath = $dataDir . 'leads.sqlite';

if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0750, true)) {
        fwrite(STDERR, "ERROR: No se pudo crear $dataDir\n");
        exit(1);
    }
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
    id              TEXT PRIMARY KEY,
    timestamp       TEXT NOT NULL,
    fecha_legible   TEXT,
    campaign_code   TEXT,
    -- 13 campos oficiales
    email           TEXT NOT NULL,
    f_name          TEXT,
    l_name          TEXT,
    mobile          TEXT,
    aut_data        TEXT,
    gclid           TEXT,
    sede            TEXT,
    tp_pgm          TEXT,
    esc_pgm         TEXT,
    periodo         TEXT,
    utm_campaign    TEXT,
    c_lead          TEXT,
    origen          TEXT,
    -- Atribución y tracking
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_term        TEXT,
    utm_content     TEXT,
    campaign_name   TEXT,
    colegio_origen  TEXT,
    cedula          TEXT,
    programa        TEXT,
    modalidad       TEXT,
    -- Vocacional
    area_vocacional     TEXT,
    carrera_recomendada TEXT,
    perfil_vocacional   TEXT,
    -- Asesor
    asesor_id       TEXT,
    asesor_nombre   TEXT,
    asesor_email    TEXT,
    asesor_sede     TEXT,
    -- Metadatos
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_asesor_id ON leads(asesor_id);
CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
SQL;

    $pdo->exec($schema);
    echo "OK: SQLite inicializado en $dbPath\n";
} catch (PDOException $e) {
    fwrite(STDERR, "ERROR PDO: " . $e->getMessage() . "\n");
    exit(1);
}