/**
 * LeadsStorage - Gestor de almacenamiento local para prospección UIDE
 * Permite respaldar los leads capturados en eventos (Charla FS, Ferias FS, Visita a campus)
 * garantizando que ningún dato se pierda en caso de mala conexión celular.
 */

const LeadsStorage = (function() {
    const STORAGE_KEY = 'uide_prospectos_leads';
    // Fallback en memoria para tests en Node.js (sin localStorage)
    const memoryStore = [];

    function getStore() {
        if (typeof localStorage !== 'undefined') return null; // usa localStorage real
        return memoryStore;
    }

    function getAllLeads() {
        const mem = getStore();
        if (mem !== null) return [...mem];
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error al leer leads de localStorage', e);
            return [];
        }
    }

    function setAllLeads(leads) {
        const mem = getStore();
        if (mem !== null) {
            mem.length = 0;
            mem.push(...leads);
            return;
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
        } catch (e) {
            console.error('Error al guardar leads en localStorage', e);
        }
    }

    function getLeadsByAdvisor(advisorId) {
        const all = getAllLeads();
        if (!advisorId || advisorId === 'ALL') return all;
        const target = advisorId.trim().toUpperCase();
        return all.filter(l => (l.asesor_id || '').trim().toUpperCase() === target);
    }

    async function saveLeadToServer(leadData) {
        try {
            if (typeof window === 'undefined' || !window.location) {
                return { ok: false, error: 'No window context' };
            }
            const endpoint = getApiUrl();
            const payload = JSON.stringify(leadData);

            console.log('[LeadsStorage] Saving lead to server:', leadData.id);

            if (typeof fetch === 'undefined') {
                return { ok: false, error: 'fetch not available' };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            });

            if (response.ok) {
                const resData = await response.json();
                console.log('✓ Lead guardado en SQLite:', resData.id || leadData.id);
                return { ok: true, id: resData.id || leadData.id, serverData: resData };
            } else {
                const errBody = await response.text();
                console.warn(`[SQLite Save] Error HTTP ${response.status}:`, errBody);
                return { ok: false, error: `HTTP ${response.status}: ${errBody}` };
            }
        } catch (e) {
            console.warn('[SQLite Save Network] Error al conectar con servidor:', e);
            return { ok: false, error: String(e) };
        }
    }

    async function saveLead(leadData) {
        try {
            const activeCmpCode = (typeof CampaignsManager !== 'undefined' && CampaignsManager.getActiveCampaignCode)
                ? CampaignsManager.getActiveCampaignCode()
                : '701PA00000pPa4mYAC';
            const codeVal = (leadData && (leadData.campaign_code || leadData.campaign_id || leadData.code)) || activeCmpCode;

            const newLead = {
                id: leadData.id || ('UIDE-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
                timestamp: leadData.timestamp || new Date().toISOString(),
                fechaLegible: leadData.fechaLegible || new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
                fecha_legible: leadData.fecha_legible || leadData.fechaLegible || new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
                campaign_code: codeVal,
                ...leadData,
                sincronizado: false
            };

            // En entorno de test (Node.js sin fetch) o sin ventana: ir directo a modo offline
            const isTestEnv = typeof window === 'undefined' || typeof fetch === 'undefined';
            if (isTestEnv) {
                const leads = getAllLeads();
                leads.unshift(newLead);
                setAllLeads(leads);
                return { ok: true, id: newLead.id, lead: newLead, synced: false, offline: true };
            }

            // 1. Intento POST real-time al servidor (fuente de verdad)
            const serverResult = await saveLeadToServer(newLead);

            if (serverResult.ok) {
                const serverId = serverResult.id;
                if (serverId && serverId !== newLead.id) {
                    newLead.id = serverId;
                }
                newLead.sincronizado = true;
                const leads = getAllLeads();
                leads.unshift(newLead);
                setAllLeads(leads);
                return { ok: true, id: serverId || newLead.id, lead: newLead, synced: true };
            }

            // 2. Fallback offline: guardar en localStorage con sincronizado:false
            const leads = getAllLeads();
            leads.unshift(newLead);
            setAllLeads(leads);
            console.warn('Lead guardado localmente (offline), se sincronizará al recuperar conexión');
            return { ok: true, id: newLead.id, lead: newLead, synced: false, offline: true };
        } catch (e) {
            console.error('Error al guardar lead:', e);
            return { ok: false, error: String(e) };
        }
    }

    function getApiUrl(subpath = 'api/leads.php') {
        if (typeof window === 'undefined' || !window.location) return subpath;
        let dir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        if (dir.endsWith('/dist/')) {
            dir = dir.slice(0, -5);
        }
        return `${window.location.origin}${dir}${subpath}`;
    }

    // Obtiene PIN de sesión del asesor autenticado
    function getAuthPin() {
        try {
            return sessionStorage.getItem('uide_advisor_authenticated_session') || 
                   (typeof AdvisorAuth !== 'undefined' && AdvisorAuth.getAdvisorPin ? AdvisorAuth.getAdvisorPin() : '2026');
        } catch (e) { return '2026'; }
    }

    function updateLeadSyncStatus(leadId, isSynced) {
        if (!leadId) return;
        try {
            const leads = getAllLeads();
            const idx = leads.findIndex(l => l.id === leadId);
            if (idx !== -1) {
                leads[idx].sincronizado = Boolean(isSynced);
                setAllLeads(leads);
            }
        } catch (e) {}
    }

    // Carga leads del asesor desde la API central (SQLite) y sincroniza localStorage
    async function syncLeadsFromServer(advisorId) {
        const pin = getAuthPin();
        const targetAdv = advisorId || 'ALL';
        try {
            // Sincronizar primero los prospectos pendientes que no hayan llegado a SQLite
            await syncPendingLeads();

            const url = `${getApiUrl()}?asesor_id=${encodeURIComponent(targetAdv)}&pin=${encodeURIComponent(pin)}`;
            const resp = await fetch(url, {
                headers: {
                    'X-Advisor-Pin': pin
                }
            });
            if (!resp.ok) return [];
            const data = await resp.json();
            const serverLeads = data.leads || [];
            // Mezclar con localStorage: solo pendientes OFFLINE (sincronizado:false)
            // para no revivir leads ya sincronizados y eliminados del servidor
            const localLeads = getAllLeads();
            const merged = [...serverLeads];
            const serverIds = new Set(serverLeads.map(l => l.id));
            localLeads.forEach(l => {
                if (!serverIds.has(l.id) && l.sincronizado === false) merged.push(l);
            });
            merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setAllLeads(merged);
            return serverLeads;
        } catch (e) {
            console.warn('Sync from server failed:', e);
            return [];
        }
    }

    async function syncPendingLeads() {
        try {
            const leads = getAllLeads();
            const pending = leads.filter(l => l.sincronizado === false);
            if (pending.length === 0) return 0;
            let count = 0;
            for (const pLead of pending) {
                const ok = await syncWithServer(pLead);
                if (ok) count++;
            }
            return count;
        } catch (e) {
            return 0;
        }
    }

    async function syncWithServer(leadData) {
        try {
            if (typeof window !== 'undefined' && window.location) {
                const endpoint = getApiUrl();
                const payload = JSON.stringify(leadData);

                console.log('[LeadsStorage] Syncing lead to server:', leadData.id);

                if (typeof fetch !== 'undefined') {
                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: payload,
                            keepalive: true
                        });
                        if (response.ok) {
                            const resData = await response.json();
                            console.log('✓ Lead guardado y sincronizado en SQLite:', resData.id || leadData.id);
                            updateLeadSyncStatus(leadData.id, true);
                            if (typeof showToast === 'function') {
                                showToast('✓ Lead sincronizado con servidor');
                            }
                            return true;
                        } else {
                            const errBody = await response.text();
                            console.warn(`[SQLite Sync] Error HTTP ${response.status}:`, errBody);
                            updateLeadSyncStatus(leadData.id, false);
                            if (typeof showToast === 'function') {
                                showToast(`⚠ Error sincronizando: HTTP ${response.status}`);
                            }
                        }
                    } catch (fetchErr) {
                        console.warn('[SQLite Sync Network] Error al conectar con servidor SQLite:', fetchErr);
                        updateLeadSyncStatus(leadData.id, false);
                        if (typeof showToast === 'function') {
                            showToast('⚠ Error de red al sincronizar');
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Sync server warning:', e);
            if (typeof showToast === 'function') {
                showToast('⚠ Error inesperado al sincronizar');
            }
        }
        return false;
    }

    function getStats(advisorId = null) {
        const leads = advisorId ? getLeadsByAdvisor(advisorId) : getAllLeads();
        const hoy = new Date().toISOString().slice(0, 10);
        
        let totalHoy = 0;
        let charlaCount = 0;
        let feriasCount = 0;
        let campusCount = 0;

        leads.forEach(l => {
            if (l.timestamp && l.timestamp.startsWith(hoy)) {
                totalHoy++;
            }
            if (l.origen === 'Charla FS') charlaCount++;
            else if (l.origen === 'Ferias FS') feriasCount++;
            else if (l.origen === 'Visita a campus') campusCount++;
        });

        return {
            total: leads.length,
            totalHoy: totalHoy,
            charlaFS: charlaCount,
            feriasFS: feriasCount,
            visitaCampus: campusCount
        };
    }

    const ALL_HEADERS = [
        'id', 'fechaLegible', 'asesor_id', 'asesor_nombre', 'asesor_email', 'asesor_sede',
        'email', 'f_name', 'l_name', 'mobile', 'cedula', 'colegio_origen', 'aut_data',
        'gclid', 'sede', 'tp_pgm', 'esc_pgm', 'programa', 'periodo', 'c_lead', 'origen',
        'utm_campaign', 'campaign_code', 'utm_source', 'utm_medium', 'utm_term', 'utm_content',
        'area_vocacional', 'carrera_recomendada', 'perfil_vocacional'
    ];

    function sanitizeMD(str) {
        if (!str) return '';
        return String(str).replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
    }

    function generateCSV(advisorId = null) {
        const leads = advisorId ? getLeadsByAdvisor(advisorId) : getAllLeads();
        if (!leads.length) return '';
        const headerRow = ALL_HEADERS.map(escapeCSV).join(',');
        const rows = leads.map(l => ALL_HEADERS.map(h => escapeCSV(l[h] || '')).join(','));
        return '\uFEFF' + [headerRow, ...rows].join('\r\n');
    }

    function exportToCSV(advisorId = null) {
        const csvContent = generateCSV(advisorId);
        if (!csvContent) {
            alert('No hay prospectos registrados aún para exportar en CSV.');
            return;
        }
        const advSuffix = advisorId && advisorId !== 'ALL' ? `_${advisorId}` : '_General';
        const fechaStr = new Date().toISOString().slice(0, 10);
        downloadFile(csvContent, `UIDE_Prospectos${advSuffix}_${fechaStr}.csv`, 'text/csv;charset=utf-8;');
    }

    function generateJSON(advisorId = null) {
        const leads = advisorId ? getLeadsByAdvisor(advisorId) : getAllLeads();
        if (!leads.length) return '[]';
        return JSON.stringify(leads, null, 2);
    }

    function exportToJSON(advisorId = null) {
        const jsonContent = generateJSON(advisorId);
        if (!jsonContent || jsonContent === '[]') {
            alert('No hay prospectos registrados aún para exportar en JSON.');
            return;
        }
        const advSuffix = advisorId && advisorId !== 'ALL' ? `_${advisorId}` : '_General';
        const fechaStr = new Date().toISOString().slice(0, 10);
        downloadFile(jsonContent, `UIDE_Prospectos${advSuffix}_${fechaStr}.json`, 'application/json;charset=utf-8;');
    }

    function generateMD(advisorId = null) {
        const leads = advisorId ? getLeadsByAdvisor(advisorId) : getAllLeads();
        if (!leads.length) return '';
        const advTitle = advisorId && advisorId !== 'ALL' ? `Asesor ${advisorId}` : 'Consolidado General';
        const title = `# Registro Oficial de Prospectos UIDE - ${advTitle}\nActualizado: ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}\nTotal Registros: ${leads.length}\n\n`;
        const tableHeader = '| # | Fecha | Asesor | Prospecto | Cédula | Email | Celular | Colegio | Programa | Sede | Evento (Origen) | Área Vocacional | Carrera Recomendada | Campaña | UTM Content |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
        const tableRows = leads.map((l, i) => {
            const nombre = sanitizeMD(`${l.f_name || ''} ${l.l_name || ''}`.trim() || 'N/A');
            const asesor = sanitizeMD(`${l.asesor_nombre || ''} (${l.asesor_id || ''})`.trim() || 'N/A');
            const areaVoc = sanitizeMD(l.area_vocacional || 'General');
            const carrRec = sanitizeMD(l.carrera_recomendada || l.programa || 'N/A');
            return `| ${i + 1} | ${sanitizeMD(l.fechaLegible || l.timestamp || '')} | ${asesor} | ${nombre} | ${sanitizeMD(l.cedula || '')} | ${sanitizeMD(l.email || '')} | ${sanitizeMD(l.mobile || '')} | ${sanitizeMD(l.colegio_origen || '')} | ${sanitizeMD(l.programa || '')} | ${sanitizeMD(l.sede || '')} | ${sanitizeMD(l.origen || '')} | ${areaVoc} | ${carrRec} | ${sanitizeMD(l.utm_campaign || '')} | ${sanitizeMD(l.utm_content || '')} |`;
        }).join('\n');
        return title + tableHeader + tableRows + '\n';
    }

    function exportToMD(advisorId = null) {
        const mdContent = generateMD(advisorId);
        if (!mdContent) {
            alert('No hay prospectos registrados aún para exportar en Markdown.');
            return;
        }
        const advSuffix = advisorId && advisorId !== 'ALL' ? `_${advisorId}` : '_General';
        const fechaStr = new Date().toISOString().slice(0, 10);
        downloadFile(mdContent, `UIDE_Prospectos${advSuffix}_${fechaStr}.md`, 'text/markdown;charset=utf-8;');
    }

    /**
     * 21 Cabeceras Oficiales requeridas para el Excel (.xlsx) de Prospección UIDE
     */
    const OFFICIAL_XLSX_HEADERS = [
        'FirstName',
        'LastName',
        'Phone',
        'Email',
        'LeadSource',
        'pi__campaign__c',
        'Sede__c',
        'Tipo_de_Programa__c',
        'Escoge_tu_programa1__c',
        'Periodo_de_ingreso1__c',
        'Nombre_de_la_campa_a__c',
        'Leads_channel__c',
        'TIKTOK_ID__c',
        'ID_LEAD_FACEBOOK__c',
        'Campaign__c',
        'Validado Número',
        'Validado Telefono',
        'Cargado',
        'ID Teléfono',
        'Id Correo',
        'ID'
    ];

    /**
     * 21 Cabeceras Oficiales de la plantilla "FORMATO CARGA DE LEADS.xlsx" (Hoja BORRADOR)
     * Donde Celdas F, G, H son fijas e inmutables:
     * - Col F: Tipo_de_documento__c = 1 (Cédula de identidad)
     * - Col G: Leads_channel__c = 'Prospeccion'
     * - Col H: LeadSource = 'Charla FS' / 'Ferias FS' / 'Visita a campus'
     */
    const OFFICIAL_BORRADOR_HEADERS = [
        'Fecha',
        'FirstName',
        'MiddleName',
        'LastName',
        'C_dula_de_identidad__c',
        'Tipo_de_documento__c',
        'Leads_channel__c',
        'LeadSource',
        'Phone',
        'Email',
        'Sede__c',
        'Tipo_de_Programa__c',
        'Escoge_tu_programa1__c',
        'Periodo_de_ingreso1__c',
        'Campaign__c',
        'Nombre_de_la_campa_a__c',
        'CARRERA',
        'Colegio__c',
        'MobilePhone',
        'Curso_en_el_que_esta_Colegio__c',
        'COLEGIO'
    ];

    /**
     * Catálogo Oficial de Campañas Salesforce UIDE
     */
    const OFFICIAL_CAMPAIGNS_CATALOG = [
        {
            'ACTIVIDAD': 'CHARLA',
            'NOMBRE DE CAMPAÑA ': 'FS_UIO _UG_MF_LEADS _GENERAL _CHARLAS COLEGIOS_CHARLA FS_JULIO_IT 1 _2027',
            'ID DE CAMPAÑA ': '701PA00000pPa4mYAC'
        },
        {
            'ACTIVIDAD': 'FERIA',
            'NOMBRE DE CAMPAÑA ': 'FS_UIO _UG_MF_LEADS _GENERAL _FERIA COLEGIOS _FERIA FS_JULIO_IT 1 _2027',
            'ID DE CAMPAÑA ': '701PA00000pQcp3YAC'
        },
        {
            'ACTIVIDAD': 'TEST',
            'NOMBRE DE CAMPAÑA ': 'FS_UIO _UG_MF_LEADS _GENERAL _CHARLAS COLEGIOS_TEST OVP FS_JULIO_IT 1 _2027',
            'ID DE CAMPAÑA ': '701PA00000pQ3WNYA0'
        }
    ];

    function mapLeadToXlsxRow(lead) {
        const mobileDigits = String(lead.mobile || '').replace(/\D/g, '');
        const cleanEmail = String(lead.email || '').trim().toLowerCase();
        const campaignVal = String(lead.utm_campaign || lead.campaign_name || 'GENERAL_2026').trim();
        const campaignCode = String(lead.campaign_code || lead.campaign_id || lead.code || campaignVal).trim();
        const phoneValid = mobileDigits.length >= 9 && mobileDigits.length <= 15 ? 'SI' : 'NO';

        return {
            'FirstName': String(lead.f_name || '').trim(),
            'LastName': String(lead.l_name || '').trim(),
            'Phone': String(lead.mobile || '').trim(),
            'Email': cleanEmail,
            'LeadSource': String(lead.origen || 'Charla FS').trim(),
            'pi__campaign__c': campaignCode,
            'Sede__c': String(lead.sede || 'Quito').trim(),
            'Tipo_de_Programa__c': String(lead.tp_pgm || 'Pregrado Quito').trim(),
            'Escoge_tu_programa1__c': String(lead.esc_pgm || '').trim(),
            'Periodo_de_ingreso1__c': String(lead.periodo || '').trim(),
            'Nombre_de_la_campa_a__c': campaignVal,
            'Leads_channel__c': String(lead.c_lead || 'Prospeccion').trim(),
            'TIKTOK_ID__c': String(lead.tiktok_id || lead.ttclid || '').trim(),
            'ID_LEAD_FACEBOOK__c': String(lead.fbclid || lead.facebook_id || '').trim(),
            'Campaign__c': campaignCode,
            'Validado Número': phoneValid,
            'Validado Telefono': phoneValid,
            'Cargado': 'NO',
            'ID Teléfono': mobileDigits,
            'Id Correo': cleanEmail,
            'ID': String(lead.id || ('UIDE-' + Date.now())).trim()
        };
    }

    function mapLeadToBorradorRow(lead) {
        const mobileDigits = String(lead.mobile || '').replace(/\D/g, '');
        const cleanPhone = mobileDigits.startsWith('593')
            ? `+${mobileDigits}`
            : (mobileDigits.startsWith('0') ? `+593${mobileDigits.slice(1)}` : `+593${mobileDigits}`);
        const cleanEmail = String(lead.email || '').trim().toLowerCase();
        const campaignVal = String(lead.utm_campaign || lead.campaign_name || 'GENERAL_2026').trim();
        
        let defaultCode = '701PA00000pPa4mYAC';
        const originLower = String(lead.origen || '').toLowerCase();
        if (originLower.includes('feria')) defaultCode = '701PA00000pQcp3YAC';
        else if (originLower.includes('test') || originLower.includes('campus')) defaultCode = '701PA00000pQ3WNYA0';
        const campaignCode = String(lead.campaign_code || lead.campaign_id || lead.code || defaultCode).trim();

        return {
            'Fecha': lead.fechaLegible || new Date().toISOString().slice(0, 10),
            'FirstName': String(lead.f_name || '').trim().toUpperCase(),
            'MiddleName': '',
            'LastName': String(lead.l_name || '').trim().toUpperCase(),
            'C_dula_de_identidad__c': String(lead.cedula || '').trim(),
            'Tipo_de_documento__c': 1, // CELDA F: FIJA INMUTABLE (1 = Cédula)
            'Leads_channel__c': 'Prospeccion', // CELDA G: FIJA INMUTABLE (Prospección)
            'LeadSource': String(lead.origen || 'Charla FS').trim(), // CELDA H: FIJA INMUTABLE (Origen de Evento)
            'Phone': cleanPhone,
            'Email': cleanEmail,
            'Sede__c': String(lead.sede || 'Quito').trim(),
            'Tipo_de_Programa__c': String(lead.tp_pgm || 'Pregrado Quito').trim(),
            'Escoge_tu_programa1__c': String(lead.esc_pgm || '1').trim(),
            'Periodo_de_ingreso1__c': String(lead.periodo || '2026-2 Q Pregrado').trim(),
            'Campaign__c': campaignCode,
            'Nombre_de_la_campa_a__c': campaignVal,
            'CARRERA': String(lead.programa || '').trim().toUpperCase(),
            'Colegio__c': String(lead.colegio_id || '0014100001Flp8pAAB').trim(),
            'MobilePhone': cleanPhone,
            'Curso_en_el_que_esta_Colegio__c': '3ro bachillerato',
            'COLEGIO': String(lead.colegio_origen || 'General').trim().toUpperCase()
        };
    }

    function getLeadsByCampaign(campaignName) {
        const all = getAllLeads();
        if (!campaignName || campaignName.toUpperCase() === 'ALL') return all;
        const target = String(campaignName).trim();
        return all.filter(l => String(l.utm_campaign || l.campaign_name || 'GENERAL_2026').trim() === target);
    }

    function getUniqueCampaigns() {
        const all = getAllLeads();
        const campaigns = new Set();
        all.forEach(l => {
            const cmp = String(l.utm_campaign || l.campaign_name || '').trim();
            if (cmp) campaigns.add(cmp);
        });
        return Array.from(campaigns);
    }

    function generateOfficialCSV(campaignName = null) {
        const leads = campaignName ? getLeadsByCampaign(campaignName) : getAllLeads();
        if (!leads || !leads.length) return '';
        const headerRow = OFFICIAL_XLSX_HEADERS.map(escapeCSV).join(',');
        const rows = leads.map(l => {
            const mapped = mapLeadToXlsxRow(l);
            return OFFICIAL_XLSX_HEADERS.map(h => escapeCSV(mapped[h] !== undefined ? mapped[h] : '')).join(',');
        });
        return '\uFEFF' + [headerRow, ...rows].join('\r\n');
    }

    function exportOfficialCSV(campaignName = null) {
        const leads = campaignName ? getLeadsByCampaign(campaignName) : getAllLeads();
        if (!leads || !leads.length) {
            alert('No hay prospectos registrados para exportar en esta campaña.');
            return;
        }

        const csvContent = generateOfficialCSV(campaignName);
        const safeCamp = (campaignName && campaignName !== 'ALL')
            ? String(campaignName).replace(/[^a-zA-Z0-9_-]/g, '_')
            : 'General';
        const fileName = `UIDE_Prospectos_${safeCamp}.csv`;

        downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
        if (typeof showToast === 'function') {
            showToast('✓ Descargando archivo CSV (compatible con Excel)');
        }
    }

    function updateLead(leadId, updatedData) {
        try {
            const leads = getAllLeads();
            const index = leads.findIndex(l => l.id === leadId);
            if (index === -1) return null;

            const existing = leads[index];
            const updated = {
                ...existing,
                ...updatedData,
                id: existing.id,
                updated_at: new Date().toISOString()
            };

            leads[index] = updated;
            setAllLeads(leads);

            // Sincronizar con el servidor (requiere PIN)
            if (typeof window !== 'undefined' && window.location) {
                const pin = sessionStorage.getItem('uide_advisor_authenticated_session') || '';
                const advisorId = updated.asesor_id || 'ADV-01';
                const payload = JSON.stringify({ ...updated, pin, asesor_id: advisorId });
                fetch(getApiUrl(), {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        ...(pin ? { 'X-Advisor-Pin': pin } : {})
                    },
                    body: payload
                }).catch(err => console.warn('Sync update lead notice:', err));
            }

            return updated;
        } catch (e) {
            console.error('Error al actualizar lead en localStorage:', e);
            return null;
        }
    }

    function deleteLead(leadId) {
        try {
            const leads = getAllLeads();
            const target = leads.find(l => l.id === leadId);
            if (!target) return false;

            const remaining = leads.filter(l => l.id !== leadId);
            setAllLeads(remaining);

            // Sincronizar con el servidor (requiere PIN)
            if (typeof window !== 'undefined' && window.location) {
                const pin = sessionStorage.getItem('uide_advisor_authenticated_session') || '';
                const advisorId = target.asesor_id || 'ADV-01';
                const url = `${getApiUrl()}?id=${encodeURIComponent(leadId)}&asesor_id=${encodeURIComponent(advisorId)}&pin=${encodeURIComponent(pin)}`;
                fetch(url, {
                    method: 'DELETE',
                    headers: pin ? { 'X-Advisor-Pin': pin } : {}
                }).catch(err => console.warn('Sync delete lead notice:', err));
            }

            return true;
        } catch (e) {
            console.error('Error al eliminar lead en localStorage:', e);
            return false;
        }
    }

    function cascadeCampaignRename(oldName, newName) {
        try {
            const leads = getAllLeads();
            const targetOld = String(oldName || '').trim().toUpperCase();
            const targetNew = String(newName || '').trim();

            let count = 0;
            const updated = leads.map(l => {
                const curCmp = String(l.utm_campaign || l.campaign_name || '').trim().toUpperCase();
                if (curCmp === targetOld) {
                    count++;
                    return {
                        ...l,
                        utm_campaign: targetNew,
                        campaign_name: targetNew
                    };
                }
                return l;
            });

            if (count > 0) {
                setAllLeads(updated);
            }
            return count;
        } catch (e) {
            console.error('Error en cascadeCampaignRename en cliente:', e);
            return 0;
        }
    }

    function exportToXLSX(campaignName = null) {
        // Redirige al exportador CSV nativo oficial (ultraliviano y compatible con Excel/Salesforce)
        return exportOfficialCSV(campaignName);
    }

    function downloadFile(content, filename, mimeType) {
        if (typeof document === 'undefined') return;
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function escapeCSV(text) {
        if (text === null || text === undefined) return '""';
        const str = String(text).replace(/"/g, '""');
        return `"${str}"`;
    }

    function clearAllLeads(advisorId = null) {
        const msg = advisorId && advisorId !== 'ALL'
            ? `¿Estás seguro de vaciar los prospectos de ${advisorId}? Asegúrate de haber descargado el respaldo.`
            : '¿Estás seguro de que deseas vaciar TODOS los prospectos locales? Asegúrate de haber exportado antes.';

        if (confirm(msg)) {
            if (!advisorId || advisorId === 'ALL') {
                setAllLeads([]);
            } else {
                const target = advisorId.trim().toUpperCase();
                const remaining = getAllLeads().filter(l => (l.asesor_id || '').trim().toUpperCase() !== target);
                setAllLeads(remaining);
            }
            return true;
        }
        return false;
    }

    async function fetchServerLeads(advisorId = null, format = 'json') {
        try {
            if (typeof window === 'undefined' || !window.location) return null;
            let url = `${getApiUrl()}?format=${encodeURIComponent(format)}`;
            if (advisorId && advisorId !== 'ALL') {
                url += `&asesor_id=${encodeURIComponent(advisorId)}`;
            }
            const headers = (typeof AdvisorAuth !== 'undefined') ? AdvisorAuth.getAuthHeaders() : {};
            const res = await fetch(url, { headers });
            if (!res.ok) {
                console.warn('Acceso no autorizado al servidor de leads:', res.status);
                return null;
            }
            return (format === 'json') ? await res.json() : await res.text();
        } catch (e) {
            console.error('Error al consultar leads del servidor:', e);
            return null;
        }
    }

    return {
        getAllLeads,
        getLeadsByAdvisor,
        getLeadsByCampaign,
        getUniqueCampaigns,
        saveLead,
        updateLead,
        deleteLead,
        cascadeCampaignRename,
        syncWithServer,
        fetchServerLeads,
        getStats,
        generateCSV,
        generateOfficialCSV,
        generateJSON,
        generateMD,
        exportToCSV,
        exportOfficialCSV,
        exportToJSON,
        exportToMD,
        exportToXLSX,
        clearAllLeads,
        syncLeadsFromServer,
        syncPendingLeads,
        ALL_HEADERS,
        OFFICIAL_XLSX_HEADERS,
        OFFICIAL_BORRADOR_HEADERS,
        OFFICIAL_CAMPAIGNS_CATALOG,
        mapLeadToXlsxRow,
        mapLeadToBorradorRow
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LeadsStorage };
}
