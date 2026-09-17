/**
 * server/campaigns-service.js
 * Principios SOLID:
 * - SRP: Exclusivamente responsable de la persistencia y CRUD de campañas en disco.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_CAMPAIGNS = [
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

class CampaignsService {
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.filePath = path.join(this.dataDir, 'campaigns.json');
        this.ensureDirExists();
        this.initDefaultCampaigns();
    }

    ensureDirExists() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    initDefaultCampaigns() {
        if (!fs.existsSync(this.filePath)) {
            try {
                fs.writeFileSync(this.filePath, JSON.stringify(DEFAULT_CAMPAIGNS, null, 2), 'utf8');
            } catch (e) {
                console.error('Error al inicializar campañas por defecto:', e);
            }
        }
    }

    getAllCampaigns() {
        try {
            if (!fs.existsSync(this.filePath)) return [...DEFAULT_CAMPAIGNS];
            const raw = fs.readFileSync(this.filePath, 'utf8');
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error al leer campañas en disco:', e);
            return [...DEFAULT_CAMPAIGNS];
        }
    }

    getCampaignById(id) {
        const all = this.getAllCampaigns();
        return all.find(c => c.id === id) || null;
    }

    getCampaignByName(name) {
        if (!name) return null;
        const target = String(name).trim().toUpperCase();
        const all = this.getAllCampaigns();
        return all.find(c => String(c.name).trim().toUpperCase() === target) || null;
    }

    createCampaign(campaignData) {
        this.ensureDirExists();
        const all = this.getAllCampaigns();

        const rawName = String(campaignData.name || '').trim();
        if (!rawName) {
            throw new Error('El nombre de la campaña es obligatorio');
        }

        // Sanitizar el nombre a mayúsculas y caracteres seguros para UTM y archivos
        const cleanName = rawName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_-]/g, '');
        if (all.some(c => c.name.toUpperCase() === cleanName)) {
            throw new Error(`Ya existe una campaña con el nombre '${cleanName}'`);
        }

        // Determinar código de campaña (Salesforce 18-char ID)
        let defaultCode = '701PA00000pPa4mYAC';
        const originVal = String(campaignData.origin || 'Ferias FS').trim();
        if (originVal.toLowerCase().includes('feria')) defaultCode = '701PA00000pQcp3YAC';
        else if (originVal.toLowerCase().includes('charla')) defaultCode = '701PA00000pPa4mYAC';
        else if (originVal.toLowerCase().includes('test') || originVal.toLowerCase().includes('visita')) defaultCode = '701PA00000pQ3WNYA0';

        const newCampaign = {
            id: campaignData.id || ('CMP-' + Date.now()),
            code: String(campaignData.code || defaultCode).trim(),
            name: cleanName,
            event_name: String(campaignData.event_name || cleanName).trim(),
            origin: originVal,
            sede: String(campaignData.sede || 'Quito').trim(),
            asesor_id: String(campaignData.asesor_id || 'ALL').trim(),
            status: (String(campaignData.status || 'ACTIVA').toUpperCase() === 'INACTIVA') ? 'INACTIVA' : 'ACTIVA',
            created_at: campaignData.created_at || new Date().toISOString()
        };

        all.unshift(newCampaign);
        fs.writeFileSync(this.filePath, JSON.stringify(all, null, 2), 'utf8');
        return newCampaign;
    }

    updateCampaign(id, updateData) {
        this.ensureDirExists();
        const all = this.getAllCampaigns();
        const index = all.findIndex(c => c.id === id);
        if (index === -1) {
            throw new Error(`Campaña con ID '${id}' no encontrada`);
        }

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
        fs.writeFileSync(this.filePath, JSON.stringify(all, null, 2), 'utf8');

        return {
            campaign: updatedCampaign,
            oldName: oldName,
            nameChanged: oldName !== newName
        };
    }

    deleteCampaign(id) {
        this.ensureDirExists();
        const all = this.getAllCampaigns();
        const target = all.find(c => c.id === id);
        if (!target) {
            throw new Error(`Campaña con ID '${id}' no encontrada`);
        }

        const filtered = all.filter(c => c.id !== id);
        fs.writeFileSync(this.filePath, JSON.stringify(filtered, null, 2), 'utf8');
        return { success: true, deleted: target };
    }

    enrichWithLeadCounts(campaigns, leads) {
        const counts = {};
        (leads || []).forEach(l => {
            const cmp = String(l.utm_campaign || l.campaign_name || 'GENERAL_2026').trim().toUpperCase();
            counts[cmp] = (counts[cmp] || 0) + 1;
        });

        return (campaigns || []).map(c => {
            const key = String(c.name || '').trim().toUpperCase();
            return {
                ...c,
                total_leads: counts[key] || 0
            };
        });
    }
}

module.exports = { CampaignsService, DEFAULT_CAMPAIGNS };
