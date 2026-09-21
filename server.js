const http = require('http');
const fs = require('fs');
const path = require('path');
const { isProtectedDataPath, authenticateAdvisor, validateLeadSubmission, checkRateLimit } = require('./server/security');
const { defaultRegistry } = require('./server/formatters');
const { LeadsService } = require('./server/leads-service');
const { CampaignsService } = require('./server/campaigns-service');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.txt': 'text/plain; charset=UTF-8',
    '.md': 'text/markdown; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const leadsService = new LeadsService(DATA_DIR, defaultRegistry);
const campaignsService = new CampaignsService(DATA_DIR);

const server = http.createServer((req, res) => {
    // Configuración CORS universal
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-advisor-pin, Authorization');

    // OWASP A05: Security Headers
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' https://pi.pardot.com https://*.uide.edu.ec https://api.qrserver.com https://wa.me; img-src 'self' data: https:; frame-src 'self' https://go.uide.edu.ec;");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Directiva Anti-Indexación y Privacidad para Servidor UIDE (noindex, nofollow)
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const clientIp = req.socket ? (req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // =========================================================================
    // REGLA DE SEGURIDAD LOPDP & OWASP A01: Aislar estrictamente la carpeta /data/
    // Impide descargas directas de leads.json, leads.csv, leads.md sin autenticación
    // =========================================================================
    if (isProtectedDataPath(pathname, __dirname)) {
        console.warn(`[SECURITY AUDIT] Intento de acceso denegado a ruta protegida ${pathname} desde ${clientIp}`);
        res.writeHead(403, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
            error: '403 Forbidden: Acceso denegado a datos de prospectos',
            code: 'DATA_ISOLATION_PROTECTED'
        }));
        return;
    }

    // =========================================================================
    // API ENDPOINT: /api/leads
    // =========================================================================
    if (pathname === '/api/leads' || pathname === '/api/leads.php') {
        // OWASP A04: Rate Limiting
        const rateLimit = checkRateLimit(clientIp, 45, 60000);
        if (!rateLimit.allowed) {
            console.warn(`[SECURITY AUDIT] Rate limit excedido para IP ${clientIp} en /api/leads`);
            res.writeHead(429, { 'Content-Type': 'application/json; charset=UTF-8', 'Retry-After': String(rateLimit.retryAfter) });
            res.end(JSON.stringify({ error: 'Demasiadas solicitudes. Por favor espera unos momentos.', code: 'RATE_LIMIT_EXCEEDED' }));
            return;
        }

        // Ingesta pública de prospectos (Formulario de estudiante o Test Vocacional)
        if (req.method === 'POST') {
            let body = '';
            let payloadTooLarge = false;

            req.on('data', chunk => {
                body += chunk;
                // OWASP A08: Límite de carga útil a 64KB para prevenir DoS
                if (body.length > 65536) {
                    payloadTooLarge = true;
                    req.destroy();
                }
            });

            req.on('end', () => {
                if (payloadTooLarge) {
                    res.writeHead(413, { 'Content-Type': 'application/json; charset=UTF-8' });
                    res.end(JSON.stringify({ error: 'Payload demasiado grande (máx 64KB)' }));
                    return;
                }

                try {
                    const leadData = JSON.parse(body);
                    const validation = validateLeadSubmission(leadData);
                    if (!validation.valid) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                        res.end(JSON.stringify({ error: validation.error }));
                        return;
                    }

                    const sanitized = validation.sanitizedPayload || leadData;
                    const result = leadsService.saveLead(sanitized);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
                    res.end(JSON.stringify({
                        success: true,
                        id: result.lead.id,
                        asesor_id: result.lead.asesor_id,
                        totals: { total: result.total, advisorTotal: result.advisorTotal }
                    }));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                    res.end(JSON.stringify({ error: 'Payload JSON inválido', details: err.message }));
                }
            });
            return;
        }

        // Consulta y exportación de prospectos: EXCLUSIVO PARA ASESORES AUTORIZADOS
        if (req.method === 'GET') {
            const authResult = authenticateAdvisor(req, parsedUrl);
            if (!authResult.authorized) {
                console.warn(`[SECURITY AUDIT] Intento no autorizado en GET /api/leads desde ${clientIp}`);
                res.writeHead(401, { 'Content-Type': 'application/json; charset=UTF-8' });
                res.end(JSON.stringify({
                    error: authResult.error || 'Acceso restringido a Asesores Educativos UIDE',
                    code: 'ADVISOR_AUTH_REQUIRED'
                }));
                return;
            }

            const advFilter = parsedUrl.searchParams.get('asesor_id');
            const cmpFilter = parsedUrl.searchParams.get('campaign');
            let format = (parsedUrl.searchParams.get('format') || 'json').toLowerCase();
            const isOfficial = parsedUrl.searchParams.get('official') === 'true';

            let leads = [];
            let exportTitle = 'Todos los Prospectos';

            if (cmpFilter && cmpFilter.toUpperCase() !== 'ALL') {
                leads = leadsService.getLeadsByCampaign(cmpFilter);
                exportTitle = `Campaña ${cmpFilter}`;
                if (format === 'csv' && isOfficial !== false) {
                    format = 'official_csv';
                }
            } else if (advFilter && advFilter.toUpperCase() !== 'ALL') {
                leads = leadsService.getLeadsByAdvisor(advFilter);
                exportTitle = `Asesor ${advFilter}`;
            } else {
                leads = leadsService.getAllLeads();
            }

            if (isOfficial && format === 'csv') {
                format = 'official_csv';
            }

            const formatter = defaultRegistry.get(format);
            const formattedContent = formatter.format(leads, {
                title: exportTitle,
                sheetName: (cmpFilter || advFilter || 'Prospectos').slice(0, 31)
            });

            const safeName = (cmpFilter || advFilter || 'General').replace(/[^a-zA-Z0-9_-]/g, '_');
            if (format === 'xlsx') {
                res.setHeader('Content-Disposition', `attachment; filename="UIDE_Prospectos_${safeName}.xlsx"`);
            } else if (format === 'csv' || format === 'official_csv') {
                res.setHeader('Content-Disposition', `attachment; filename="UIDE_Prospectos_${safeName}.csv"`);
            }

            res.writeHead(200, { 'Content-Type': formatter.getContentType() });
            res.end(formattedContent);
            return;
        }

        // Actualización de un prospecto existente (Edición completa)
        if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const updatePayload = JSON.parse(body);
                    const leadId = updatePayload.id || parsedUrl.searchParams.get('id');
                    if (!leadId) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                        res.end(JSON.stringify({ error: 'El parámetro id del prospecto es obligatorio' }));
                        return;
                    }
                    const result = leadsService.updateLead(leadId, updatePayload);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
                    res.end(JSON.stringify({ success: true, lead: result.lead }));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        // Eliminación de un prospecto por ID
        if (req.method === 'DELETE') {
            const leadId = parsedUrl.searchParams.get('id');
            if (!leadId) {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                    try {
                        const parsed = body ? JSON.parse(body) : {};
                        const targetId = parsed.id;
                        if (!targetId) {
                            res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                            res.end(JSON.stringify({ error: 'El parámetro id del prospecto es obligatorio' }));
                            return;
                        }
                        const result = leadsService.deleteLead(targetId);
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
                        res.end(JSON.stringify(result));
                    } catch (err) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });
                return;
            }
            try {
                const result = leadsService.deleteLead(leadId);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
                res.end(JSON.stringify(result));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                res.end(JSON.stringify({ error: err.message }));
            }
            return;
        }
    }

    // =========================================================================
    // API ENDPOINT: /api/campaigns (CRUD de Campañas de Prospección UIDE)
    // =========================================================================
    if (pathname === '/api/campaigns') {
        // Listar todas las campañas enriquecidas con métricas de prospectos
        if (req.method === 'GET') {
            const allCampaigns = campaignsService.getAllCampaigns();
            const allLeads = leadsService.getAllLeads();
            const enriched = campaignsService.enrichWithLeadCounts(allCampaigns, allLeads);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end(JSON.stringify({ success: true, campaigns: enriched }));
            return;
        }

        // Crear nueva campaña
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const created = campaignsService.createCampaign(data);
                    res.writeHead(201, { 'Content-Type': 'application/json; charset=UTF-8' });
                    res.end(JSON.stringify({ success: true, campaign: created }));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        // Actualizar campaña existente (con opción de actualización en cascada de leads)
        if (req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const campaignId = data.id || parsedUrl.searchParams.get('id');
                    if (!campaignId) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                        res.end(JSON.stringify({ error: 'El ID de la campaña es obligatorio' }));
                        return;
                    }
                    const updateResult = campaignsService.updateCampaign(campaignId, data);
                    let cascadeResult = null;
                    if (updateResult.nameChanged && data.cascade !== false) {
                        cascadeResult = leadsService.cascadeCampaignRename(updateResult.oldName, updateResult.campaign.name);
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
                    res.end(JSON.stringify({
                        success: true,
                        campaign: updateResult.campaign,
                        nameChanged: updateResult.nameChanged,
                        cascade: cascadeResult
                    }));
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        // Eliminar campaña
        if (req.method === 'DELETE') {
            const campaignId = parsedUrl.searchParams.get('id');
            if (!campaignId) {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                    try {
                        const parsed = body ? JSON.parse(body) : {};
                        const targetId = parsed.id;
                        if (!targetId) {
                            res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                            res.end(JSON.stringify({ error: 'El ID de la campaña es obligatorio' }));
                            return;
                        }
                        const result = campaignsService.deleteCampaign(targetId);
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
                        res.end(JSON.stringify(result));
                    } catch (err) {
                        res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });
                return;
            }
            try {
                const result = campaignsService.deleteCampaign(campaignId);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
                res.end(JSON.stringify(result));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                res.end(JSON.stringify({ error: err.message }));
            }
            return;
        }
    }

    // =========================================================================
    // SERVIR ARCHIVOS ESTÁTICOS PÚBLICOS (HTML, CSS, JS, IMÁGENES)
    // =========================================================================
    let safeUrl = '';
    try {
        safeUrl = decodeURIComponent(pathname);
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('400 Bad Request');
        return;
    }

    // OWASP A01: Canonical path traversal defense
    const normalizedTarget = path.normalize(safeUrl === '/' ? '/index.html' : safeUrl);
    const filePath = path.join(__dirname, normalizedTarget);

    // Evitar directory traversal fuera del directorio raíz
    if (!filePath.startsWith(__dirname)) {
        console.warn(`[SECURITY AUDIT] Path traversal bloqueado para ${safeUrl} desde ${clientIp}`);
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
            res.end('404 No Encontrado');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Servidor UIDE FS-Platform corriendo en: http://localhost:${PORT}`);
    console.log(`🔒 Protección LOPDP & OWASP Top 10: Archivos en data/ y GET /api/leads restringidos con PIN de Asesor.`);
});

module.exports = { server, leadsService };
