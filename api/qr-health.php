<?php
/**
 * qr-health.php — Health-check del generador QR externo (api.qrserver.com)
 * GET /api/qr-health.php → { ok: true, latency_ms: 120, status: 200 }
 * Se usa desde frontend para health-check periódico.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: https://www.uide.edu.ec');
header('Access-Control-Allow-Methods: GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$testUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=10x10&data=test';
$start = microtime(true);

$ctx = stream_context_create([
    'http' => [
        'method' => 'HEAD',
        'timeout' => 3,
        'ignore_errors' => true,
        'user_agent' => 'UIDE-QR-HealthCheck/1.0'
    ],
    'ssl' => ['verify_peer' => true, 'verify_peer_name' => true]
]);

$ok = false;
$status = 0;
$body = '';
try {
    $resp = @file_get_contents($testUrl, false, $ctx);
    $httpCode = 0;
    if (isset($http_response_header)) {
        foreach ($http_response_header as $h) {
            if (preg_match('/^HTTP\/\d\.\d\s+(\d{3})/', $h, $m)) { $status = (int)$m[1]; break; }
        }
    }
    $ok = ($status >= 200 && $status < 400);
} catch (Throwable $e) {
    $ok = false;
    $status = 0;
}

$latency = round((microtime(true) - $start) * 1000);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
echo json_encode([
    'ok' => $ok,
    'status' => $status,
    'latency_ms' => $latency,
    'timestamp' => date('c'),
    'service' => 'api.qrserver.com'
], JSON_UNESCAPED_UNICODE);