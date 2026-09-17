/**
 * server/security.js
 * Responsabilidad Única (SRP): Control de acceso, autenticación de asesores,
 * prevención de fugas de datos confidenciales (LOPDP) y blindaje OWASP TOP 10.
 * 
 * Cumplimiento OWASP Top 10:
 * - A01: Broken Access Control (Path traversal prevention & canonical path validation)
 * - A03: Injection (XSS entity escaping & Markdown injection sanitization)
 * - A04: Insecure Design (Rate limiting & payload boundary validation)
 * - A07: Identification & Auth Failures (Constant-time PIN comparison & brute-force lockout)
 * - A08: Software & Data Integrity (Strict schema & length verification)
 * - A09: Security Logging & Monitoring (Audit logging for security incidents)
 */

const path = require('path');
const crypto = require('crypto');

// PINs institucionales válidos para asesores UIDE
const DEFAULT_PINS = ['UIDE2026', '2026', 'uide2026'];
const ENV_PIN = process.env.ADVISOR_SECRET_PIN;
if (ENV_PIN) {
    DEFAULT_PINS.push(ENV_PIN.trim());
}

// In-memory rate limiting and brute force protection
const ipRequestCounts = new Map();     // ip -> { count, resetTime }
const failedAuthAttempts = new Map();   // ip -> { count, lockUntil }

/**
 * A01: Broken Access Control & Path Traversal Prevention
 * Verifica si una ruta HTTP intenta acceder o fugar archivos de la carpeta /data/.
 */
function isProtectedDataPath(pathname, projectRoot) {
    if (!pathname) return false;

    // Decodificar URI y normalizar separadores
    let decoded = '';
    try {
        decoded = decodeURIComponent(pathname);
    } catch (e) {
        // Petición con caracteres malformados -> bloquear
        return true;
    }

    // Detección de bytes nulos (Null Byte Injection)
    if (decoded.includes('\0') || decoded.includes('%00')) {
        return true;
    }

    const clean = decoded.replace(/\\/g, '/').toLowerCase();
    
    // Bloqueo directo de patrones /data
    if (clean === '/data' || clean.startsWith('/data/') || clean.includes('/data/')) {
        return true;
    }

    // Doble verificación canónica resolviendo la ruta física absoluta en disco
    if (projectRoot) {
        const normalizedRoot = path.normalize(projectRoot);
        const resolvedPath = path.resolve(normalizedRoot, clean.replace(/^\//, ''));
        const dataFolder = path.resolve(normalizedRoot, 'data');

        if (resolvedPath === dataFolder || resolvedPath.startsWith(dataFolder + path.sep)) {
            return true;
        }

        // Bloquear cualquier intento de salir del directorio raíz (Directory Traversal)
        if (!resolvedPath.startsWith(normalizedRoot)) {
            return true;
        }
    }

    return false;
}

/**
 * A07: Constant-time PIN verification (Timing Attack Prevention)
 */
function isValidPin(pin) {
    if (!pin) return false;
    const normalized = String(pin).trim();
    
    for (const valid of DEFAULT_PINS) {
        const bufA = Buffer.from(normalized);
        const bufB = Buffer.from(valid);
        if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
            return true;
        }
    }
    return false;
}

/**
 * A04 & A07: Brute-Force Lockout Tracker
 */
function isAuthLocked(ip) {
    const record = failedAuthAttempts.get(ip);
    if (!record) return { locked: false };
    
    const now = Date.now();
    if (now < record.lockUntil) {
        const remainingSecs = Math.ceil((record.lockUntil - now) / 1000);
        return { locked: true, remainingSecs };
    }
    
    // Si expiró el tiempo de bloqueo, limpiar
    if (now >= record.lockUntil) {
        failedAuthAttempts.delete(ip);
    }
    return { locked: false };
}

function recordFailedAuth(ip) {
    const record = failedAuthAttempts.get(ip) || { count: 0, lockUntil: 0 };
    record.count++;
    if (record.count >= 5) {
        // Bloquear por 60 segundos después de 5 intentos fallidos
        record.lockUntil = Date.now() + 60000;
        console.warn(`[SECURITY AUDIT] IP ${ip} bloqueada por 60s tras 5 intentos fallidos de autenticación.`);
    }
    failedAuthAttempts.set(ip, record);
    return record;
}

function resetFailedAuth(ip) {
    failedAuthAttempts.delete(ip);
}

/**
 * A04: Rate Limiting por IP
 */
function checkRateLimit(ip, maxRequests = 60, windowMs = 60000) {
    const now = Date.now();
    const client = ipRequestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > client.resetTime) {
        client.count = 1;
        client.resetTime = now + windowMs;
        ipRequestCounts.set(ip, client);
        return { allowed: true, remaining: maxRequests - 1 };
    }

    client.count++;
    ipRequestCounts.set(ip, client);

    if (client.count > maxRequests) {
        const retryAfter = Math.ceil((client.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    return { allowed: true, remaining: maxRequests - client.count };
}

/**
 * Autentica si la solicitud HTTP proviene de un Asesor Educativo UIDE autorizado.
 */
function authenticateAdvisor(req, parsedUrl = null) {
    const headers = req.headers || {};
    const ip = req.socket ? (req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';

    // Verificar si la IP está bloqueada por fuerza bruta
    const lockStatus = isAuthLocked(ip);
    if (lockStatus.locked) {
        return {
            authorized: false,
            locked: true,
            remainingSecs: lockStatus.remainingSecs,
            error: `Demasiados intentos fallidos. Acceso temporalmente bloqueado. Intenta en ${lockStatus.remainingSecs} segundos.`
        };
    }
    
    // 1. Cabecera personalizada 'x-advisor-pin'
    const headerPin = headers['x-advisor-pin'];
    if (headerPin) {
        if (isValidPin(headerPin)) {
            resetFailedAuth(ip);
            return { authorized: true, method: 'header-pin' };
        } else {
            recordFailedAuth(ip);
        }
    }

    // 2. Cabecera Authorization: Bearer <token/pin>
    const authHeader = headers['authorization'] || '';
    if (authHeader.toLowerCase().startsWith('bearer ')) {
        const token = authHeader.slice(7).trim();
        if (isValidPin(token)) {
            resetFailedAuth(ip);
            return { authorized: true, method: 'bearer-token' };
        } else {
            recordFailedAuth(ip);
        }
    }

    // 3. Parámetro query 'pin'
    if (parsedUrl && parsedUrl.searchParams) {
        const queryPin = parsedUrl.searchParams.get('pin');
        if (queryPin) {
            if (isValidPin(queryPin)) {
                resetFailedAuth(ip);
                return { authorized: true, method: 'query-pin' };
            } else {
                recordFailedAuth(ip);
            }
        }
    }

    return {
        authorized: false,
        error: 'Acceso no autorizado: Se requiere PIN institucional de Asesor Educativo UIDE'
    };
}

/**
 * A03: Injection Prevention (XSS & Markdown Sanitization)
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sanitizeMarkdown(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/\|/g, '\\|')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, ' ')
        .trim();
}

/**
 * A08: Validación e Integridad Estructural del Lead & Test Vocacional
 */
function validateLeadSubmission(payload) {
    if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'El cuerpo de la solicitud debe ser un objeto JSON válido' };
    }

    // Longitud máxima de cadenas para prevenir ataques de saturación
    const MAX_LEN = 150;
    for (const [key, val] of Object.entries(payload)) {
        if (typeof val === 'string' && val.length > 500) {
            return { valid: false, error: `El campo ${key} excede la longitud máxima permitida` };
        }
    }

    // Campos mínimos requeridos
    if (!payload.email || typeof payload.email !== 'string' || !payload.email.includes('@') || payload.email.length > MAX_LEN) {
        return { valid: false, error: 'Correo electrónico válido requerido (máx. 150 caracteres)' };
    }
    if (!payload.f_name || typeof payload.f_name !== 'string' || payload.f_name.trim().length === 0 || payload.f_name.length > MAX_LEN) {
        return { valid: false, error: 'Nombre del prospecto requerido' };
    }
    if (!payload.mobile || typeof payload.mobile !== 'string' || payload.mobile.trim().length === 0 || payload.mobile.length > 30) {
        return { valid: false, error: 'Número de celular requerido' };
    }

    // Sanitizar campos de texto para evitar XSS y Markdown Injection
    payload.f_name = escapeHtml(payload.f_name.trim());
    payload.l_name = escapeHtml((payload.l_name || '').trim());
    payload.email = payload.email.trim().toLowerCase();
    payload.colegio_origen = escapeHtml((payload.colegio_origen || '').trim());
    if (payload.area_vocacional) payload.area_vocacional = escapeHtml(String(payload.area_vocacional).trim());
    if (payload.carrera_recomendada) payload.carrera_recomendada = escapeHtml(String(payload.carrera_recomendada).trim());

    return { valid: true, sanitizedPayload: payload };
}

module.exports = {
    DEFAULT_PINS,
    isProtectedDataPath,
    authenticateAdvisor,
    isValidPin,
    isAuthLocked,
    recordFailedAuth,
    resetFailedAuth,
    checkRateLimit,
    escapeHtml,
    sanitizeMarkdown,
    validateLeadSubmission
};
