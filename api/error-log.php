<?php
/**
 * error-log.php — Receptor de errores JS del frontend (best effort)
 * No autenticación (público), rate-limit por IP, sanitización básica.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: https://www.uide.edu.ec');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$dataDir = __DIR__ . '/../data/';
$logFile = $dataDir . 'js_errors.log';
if (!is_dir($dataDir)) @mkdir($dataDir, 0750, true);

$raw = file_get_contents('php://input');
if (!$raw) { http_response_code(400); exit; }

$payload = json_decode($raw, true);
if (!is_array($payload)) { http_response_code(400); exit; }

// Sanitización básica
$allowed = ['ts','msg','src','line','col','stack','ua','url','role','advisor'];
$clean = array_intersect_key($payload, array_flip($allowed));
$clean['ip'] = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$clean['received_at'] = date('c');

// Rate limit simple (archivo por IP)
$rlDir = $dataDir . 'ratelimit/';
if (!is_dir($rlDir)) @mkdir($rlDir, 0750, true);
$ip = preg_replace('/[^a-zA-Z0-9.:]/', '_', $clean['ip']);
$rlFile = $rlDir . 'err_' . $ip . '.json';
$now = time();
$data = ['ts' => $now, 'count' => 0];
if (file_exists($rlFile)) { $json = @file_get_contents($rlFile); if ($json) $data = json_decode($json, true) ?? $data; }
if ($now - ($data['ts'] ?? $now) > 60) { $data = ['ts' => $now, 'count' => 0]; }
if (++$data['count'] > 20) { @file_put_contents($rlFile, json_encode($data), LOCK_EX); http_response_code(429); exit; }
@file_put_contents($rlFile, json_encode($data), LOCK_EX);

// Persistir
$line = json_encode($clean, JSON_UNESCAPED_UNICODE) . "\n";
@file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);

http_response_code(202);
echo json_encode(['ok' => true]);