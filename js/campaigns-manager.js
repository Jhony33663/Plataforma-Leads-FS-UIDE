/**
 * js/campaigns-manager.js
 * Gestor del CRUD de Campañas UIDE en el cliente.
 * Permite crear, listar, editar, activar y eliminar campañas tanto localmente (localStorage)
 * como de manera sincronizada con el servidor Node (/api/campaigns).
 */

const CampaignsManager = (function() {
    const STORAGE_KEY = 'uide_campaigns_list';
    const ACTIVE_CAMPAIGN_KEY = 'uide_active_campaign_name';

    const INITIAL_DEFAULT_CAMPAIGNS = [
        {
            id: 'CMP-FERIA-ALAMOS-2026',
            code: '701PA00000pQcp3YAC',
            name: 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026',
            event_name: 'Feria de Universidades Colegio Álamos',
            origin: 'Ferias FS',
            sede: 'Quito',
            asesor_id: 'ALL',
            status: 'ACTIVA',
            created_at: new Date().toISOString()
        },
        {
            id: 'CMP-CHARLA-FS-2026',
            code: '701PA00000pPa4mYAC',
            name: 'PROSPECCION_CHARLA_FS_2026',
            event_name: 'Charla Informativa Colegios',
            origin: 'Charla FS',
            sede: 'Quito',
            asesor_id: 'ADV-01',
            status: 'ACTIVA',
            created_at: new Date().toISOString()
        },
        {
            id: 'CMP-VISITA-CAMPUS-2026',
            code: '701PA00000pQ3WNYA0',
            name: 'PROSPECCION_VISITA_CAMPUS_2026',
            event_name: 'Visita Guiada a Campus UIDE',
            origin: 'Visita a campus',
            sede: 'Quito',
            asesor_id: 'ALL',
            status: 'ACTIVA',
            created_at: new Date().toISOString()
        }
    ];

    function initStorage() {
        if (typeof localStorage === 'undefined') return;
        try {
            const existing = localStorage.getItem(STORAGE_KEY);
            if (!existing) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_CAMPAIGNS));
            }
            if (!localStorage.getItem(ACTIVE_CAMPAIGN_KEY)) {
                localStorage.setItem(ACTIVE_CAMPAIGN_KEY, INITIAL_DEFAULT_CAMPAIGNS[0].name);
            }
        } catch (e) {
            console.warn('Error inicializando localStorage de campañas:', e);
        }
    }

    initStorage();

    function getAll() {
        let campaigns = [];
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem(STORAGE_KEY);
                campaigns = raw ? JSON.parse(raw) : [...INITIAL_DEFAULT_CAMPAIGNS];
            } else {
                campaigns = [...INITIAL_DEFAULT_CAMPAIGNS];
            }
        } catch (e) {
            campaigns = [...INITIAL_DEFAULT_CAMPAIGNS];
        }

        // Enriquecer con contadores reales de leads si LeadsStorage existe
        if (typeof LeadsStorage !== 'undefined' && typeof LeadsStorage.getAllLeads === 'function') {
            const allLeads = LeadsStorage.getAllLeads();
            const counts = {};
            allLeads.forEach(l => {
                const cmp = String(l.utm_campaign || l.campaign_name || 'GENERAL_2026').trim().toUpperCase();
                counts[cmp] = (counts[cmp] || 0) + 1;
            });

            return campaigns.map(c => ({
                ...c,
                total_leads: counts[String(c.name || '').trim().toUpperCase()] || 0
            }));
        }

        return campaigns;
    }

    function getById(id) {
        const all = getAll();
        return all.find(c => c.id === id) || null;
    }

    function getByName(name) {
        if (!name) return null;
        const target = String(name).trim().toUpperCase();
        const all = getAll();
        return all.find(c => String(c.name).trim().toUpperCase() === target) || null;
    }

    function getActiveCampaignName() {
        try {
            if (typeof localStorage !== 'undefined') {
                const active = localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
                if (active) return active;
            }
        } catch (e) { /* ignore */ }
        return 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026';
    }

    function getActiveCampaign() {
        const activeName = getActiveCampaignName();
        return getByName(activeName) || {
            id: 'CMP-ACTIVE',
            code: '701PA00000pPa4mYAC',
            name: activeName,
            event_name: 'Evento Activo',
            origin: 'Ferias FS',
            sede: 'Quito',
            status: 'ACTIVA'
        };
    }

    function getActiveCampaignCode() {
        const active = getActiveCampaign();
        return (active && active.code) ? active.code : '701PA00000pPa4mYAC';
    }

    function setActiveCampaign(campaignIdOrName) {
        const campaign = getById(campaignIdOrName) || getByName(campaignIdOrName);
        const nameToSet = campaign ? campaign.name : String(campaignIdOrName).trim();
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(ACTIVE_CAMPAIGN_KEY, nameToSet);
            }
        } catch (e) { /* ignore */ }

        // Sincronizar con el perfil del asesor si los campos existen
        if (typeof document !== 'undefined') {
            const utmField = document.getElementById('input_adv_utm_campaign');
            if (utmField) utmField.value = nameToSet;
            const eventField = document.getElementById('input_adv_event_name');
            if (eventField && campaign && campaign.event_name) {
                eventField.value = campaign.event_name;
            }
            const codeField = document.getElementById('input_adv_campaign_code');
            if (codeField && campaign && campaign.code) {
                codeField.value = campaign.code;
            }
        }

        return nameToSet;
    }

    function saveAllLocal(campaigns) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
            }
        } catch (e) {
            console.error('Error guardando campañas en localStorage:', e);
        }
    }

    function createCampaign(data) {
        const rawName = String(data.name || '').trim();
        if (!rawName) throw new Error('El nombre de la campaña es obligatorio');

        const cleanName = rawName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_-]/g, '');
        const all = getAll();
        if (all.some(c => c.name.toUpperCase() === cleanName)) {
            throw new Error(`Ya existe una campaña llamada '${cleanName}'`);
        }

        let defaultCode = '701PA00000pPa4mYAC';
        const originVal = String(data.origin || 'Ferias FS').trim();
        if (originVal.toLowerCase().includes('feria')) defaultCode = '701PA00000pQcp3YAC';
        else if (originVal.toLowerCase().includes('charla')) defaultCode = '701PA00000pPa4mYAC';
        else if (originVal.toLowerCase().includes('test') || originVal.toLowerCase().includes('visita')) defaultCode = '701PA00000pQ3WNYA0';

        const newCampaign = {
            id: data.id || ('CMP-' + Date.now()),
            code: String(data.code || defaultCode).trim(),
            name: cleanName,
            event_name: String(data.event_name || cleanName).trim(),
            origin: originVal,
            sede: String(data.sede || 'Quito').trim(),
            asesor_id: String(data.asesor_id || 'ALL').trim(),
            status: (String(data.status || 'ACTIVA').toUpperCase() === 'INACTIVA') ? 'INACTIVA' : 'ACTIVA',
            created_at: data.created_at || new Date().toISOString()
        };

        const updated = [newCampaign, ...all];
        saveAllLocal(updated);

        // Sincronizar asíncronamente con el servidor
        syncApiCall('api/campaigns', 'POST', newCampaign);

        return newCampaign;
    }

    function updateCampaign(id, updateData, cascade = true) {
        const all = getAll();
        const index = all.findIndex(c => c.id === id);
        if (index === -1) throw new Error(`Campaña '${id}' no encontrada`);

        const oldCampaign = all[index];
        const oldName = oldCampaign.name;

        let newName = oldName;
        if (updateData.name && String(updateData.name).trim()) {
            const candidate = String(updateData.name).trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_-]/g, '');
            if (candidate !== oldName.toUpperCase() && all.some(c => c.id !== id && c.name.toUpperCase() === candidate)) {
                throw new Error(`Ya existe otra campaña con el nombre '${candidate}'`);
            }
            newName = candidate;
        }

        const updatedCampaign = {
            ...oldCampaign,
            code: updateData.code !== undefined ? String(updateData.code).trim() : (oldCampaign.code || '701PA00000pPa4mYAC'),
            name: newName,
            event_name: updateData.event_name !== undefined ? String(updateData.event_name).trim() : oldCampaign.event_name,
            origin: updateData.origin !== undefined ? String(updateData.origin).trim() : oldCampaign.origin,
            sede: updateData.sede !== undefined ? String(updateData.sede).trim() : oldCampaign.sede,
            asesor_id: updateData.asesor_id !== undefined ? String(updateData.asesor_id).trim() : oldCampaign.asesor_id,
            status: updateData.status !== undefined ? (String(updateData.status).toUpperCase() === 'INACTIVA' ? 'INACTIVA' : 'ACTIVA') : oldCampaign.status,
            updated_at: new Date().toISOString()
        };

        all[index] = updatedCampaign;
        saveAllLocal(all);

        // Si cambió el nombre y la campaña era la activa, actualizarla
        if (oldName !== newName && getActiveCampaignName() === oldName) {
            setActiveCampaign(newName);
        }

        // Si cambió el nombre y se solicitó cascada, actualizar los leads en LeadsStorage
        if (oldName !== newName && cascade && typeof LeadsStorage !== 'undefined' && typeof LeadsStorage.cascadeCampaignRename === 'function') {
            LeadsStorage.cascadeCampaignRename(oldName, newName);
        }

        // Sincronizar asíncronamente con el servidor
        syncApiCall('api/campaigns', 'PUT', { ...updatedCampaign, cascade: cascade !== false });

        return {
            campaign: updatedCampaign,
            oldName: oldName,
            nameChanged: oldName !== newName
        };
    }

    function deleteCampaign(id) {
        const all = getAll();
        const target = all.find(c => c.id === id);
        if (!target) throw new Error(`Campaña '${id}' no encontrada`);

        const remaining = all.filter(c => c.id !== id);
        saveAllLocal(remaining);

        // Si era la activa, asignar la primera que quede
        if (getActiveCampaignName() === target.name && remaining.length > 0) {
            setActiveCampaign(remaining[0].name);
        }

        // Sincronizar asíncronamente con el servidor
        syncApiCall(`api/campaigns?id=${encodeURIComponent(id)}`, 'DELETE');

        return { success: true, deleted: target };
    }

    function syncApiCall(endpoint, method, body = null) {
        try {
            if (typeof window === 'undefined' || !window.location) return;
            const url = endpoint.startsWith('http') ? endpoint : `${window.location.origin}/${endpoint.replace(/^\//, '')}`;
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (body && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(body);
            }
            fetch(url, options).catch(err => console.warn(`Sync API ${method} ${endpoint} notice:`, err));
        } catch (e) {
            console.warn('Sync API call error:', e);
        }
    }

    async function fetchServerCampaigns() {
        try {
            if (typeof window === 'undefined' || !window.location) return null;
            const res = await fetch(`${window.location.origin}/api/campaigns`);
            if (!res.ok) return null;
            const data = await res.json();
            if (data && data.success && Array.isArray(data.campaigns)) {
                saveAllLocal(data.campaigns);
                return data.campaigns;
            }
            return null;
        } catch (e) {
            console.warn('Error fetching server campaigns:', e);
            return null;
        }
    }

    return {
        getAll,
        getById,
        getByName,
        getActiveCampaign,
        getActiveCampaignName,
        getActiveCampaignCode,
        setActiveCampaign,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        fetchServerCampaigns,
        INITIAL_DEFAULT_CAMPAIGNS
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CampaignsManager };
}
