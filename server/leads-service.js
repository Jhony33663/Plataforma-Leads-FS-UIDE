/**
 * server/leads-service.js
 * Principios SOLID:
 * - SRP: Exclusivamente responsable de la persistencia y consulta de leads en disco.
 * - DIP: Inyección del formateador a través de abstractions.
 */

const fs = require('fs');
const path = require('path');
const { defaultRegistry } = require('./formatters');

class LeadsService {
    constructor(dataDir, formatterRegistry = defaultRegistry) {
        this.dataDir = dataDir;
        this.formatterRegistry = formatterRegistry;
        this.ensureDirExists();
    }

    ensureDirExists() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    getAllLeads() {
        const file = path.join(this.dataDir, 'leads.json');
        if (!fs.existsSync(file)) return [];
        try {
            const raw = fs.readFileSync(file, 'utf8');
            return JSON.parse(raw);
        } catch (e) {
            console.error('Error al leer leads en disco:', e);
            return [];
        }
    }

    getLeadsByAdvisor(advisorId) {
        const all = this.getAllLeads();
        if (!advisorId || advisorId.toUpperCase() === 'ALL') return all;
        const target = String(advisorId).trim().toUpperCase();
        return all.filter(l => (l.asesor_id || '').trim().toUpperCase() === target);
    }

    getLeadsByCampaign(campaignName) {
        const all = this.getAllLeads();
        if (!campaignName || campaignName.toUpperCase() === 'ALL') return all;
        const target = String(campaignName).trim();
        return all.filter(l => (l.utm_campaign || l.campaign_name || 'GENERAL_2026').trim() === target);
    }

    getCampaignsList() {
        const all = this.getAllLeads();
        const campaigns = new Set();
        all.forEach(l => {
            const cmp = (l.utm_campaign || l.campaign_name || '').trim();
            if (cmp) campaigns.add(cmp);
        });
        return Array.from(campaigns);
    }

    persistAllLeads(allLeads) {
        this.ensureDirExists();

        // Formateadores
        const csvFmt = this.formatterRegistry.get('csv');
        const officialCsvFmt = this.formatterRegistry.get('official_csv');
        const jsonFmt = this.formatterRegistry.get('json');
        const mdFmt = this.formatterRegistry.get('md');
        const xlsxFmt = this.formatterRegistry.get('xlsx');

        // 1. Guardar archivos consolidados globales (JSON, CSV, MD, XLSX)
        fs.writeFileSync(path.join(this.dataDir, 'leads.json'), jsonFmt.format(allLeads), 'utf8');
        fs.writeFileSync(path.join(this.dataDir, 'leads.csv'), csvFmt.format(allLeads), 'utf8');
        fs.writeFileSync(path.join(this.dataDir, 'leads_oficial.csv'), officialCsvFmt.format(allLeads), 'utf8');
        fs.writeFileSync(path.join(this.dataDir, 'leads.md'), mdFmt.format(allLeads, { title: 'Consolidado General' }), 'utf8');
        if (xlsxFmt) {
            fs.writeFileSync(path.join(this.dataDir, 'leads.xlsx'), xlsxFmt.format(allLeads, { sheetName: 'Consolidado General' }));
        }

        // 2. Agrupar y guardar archivos por CAMPAÑA (XLSX y CSV liviano oficial con 21 columnas)
        const campaignMap = new Map();
        allLeads.forEach(l => {
            const cmp = String(l.utm_campaign || l.campaign_name || 'GENERAL_2026').trim();
            if (!campaignMap.has(cmp)) campaignMap.set(cmp, []);
            campaignMap.get(cmp).push(l);
        });

        campaignMap.forEach((leads, campaignName) => {
            const campaignSlug = campaignName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'GENERAL_2026';
            if (xlsxFmt) {
                fs.writeFileSync(
                    path.join(this.dataDir, `leads_${campaignSlug}.xlsx`),
                    xlsxFmt.format(leads, { sheetName: campaignName.slice(0, 31) })
                );
            }
            if (officialCsvFmt) {
                fs.writeFileSync(
                    path.join(this.dataDir, `leads_${campaignSlug}.csv`),
                    officialCsvFmt.format(leads),
                    'utf8'
                );
            }
        });

        // 3. Agrupar y guardar archivos por ASESOR
        const advisorMap = new Map();
        allLeads.forEach(l => {
            const advId = String(l.asesor_id || 'ADV-01').trim().toUpperCase();
            if (!advisorMap.has(advId)) advisorMap.set(advId, []);
            advisorMap.get(advId).push(l);
        });

        advisorMap.forEach((leads, advId) => {
            const safeAdvId = advId.replace(/[^a-zA-Z0-9_-]/g, '_');
            const sample = leads[0] || {};
            const advTitle = `${sample.asesor_nombre || 'Asesor'} (${advId})`;

            fs.writeFileSync(path.join(this.dataDir, `leads_${safeAdvId}.json`), jsonFmt.format(leads), 'utf8');
            fs.writeFileSync(path.join(this.dataDir, `leads_${safeAdvId}.csv`), csvFmt.format(leads), 'utf8');
            fs.writeFileSync(path.join(this.dataDir, `leads_${safeAdvId}.md`), mdFmt.format(leads, { title: advTitle }), 'utf8');
            if (xlsxFmt) {
                fs.writeFileSync(path.join(this.dataDir, `leads_${safeAdvId}.xlsx`), xlsxFmt.format(leads, { sheetName: advTitle.slice(0, 31) }));
            }
        });
    }

    saveLead(leadData) {
        this.ensureDirExists();
        const allLeads = this.getAllLeads();

        const newLead = {
            id: leadData.id || ('UIDE-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
            timestamp: leadData.timestamp || new Date().toISOString(),
            fechaLegible: leadData.fechaLegible || new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
            ...leadData
        };

        // Eliminar duplicados si ya existía el mismo ID
        const updatedAll = allLeads.filter(l => l.id !== newLead.id);
        updatedAll.unshift(newLead);

        this.persistAllLeads(updatedAll);

        const campaign = String(newLead.utm_campaign || newLead.campaign_name || 'GENERAL_2026').trim();
        const campaignSlug = campaign.replace(/[^a-zA-Z0-9_-]/g, '_') || 'GENERAL_2026';
        const advisorLeads = updatedAll.filter(l => (l.asesor_id || '').toUpperCase() === (newLead.asesor_id || '').toUpperCase());
        const campaignLeads = updatedAll.filter(l => String(l.utm_campaign || l.campaign_name || 'GENERAL_2026').trim() === campaign);

        return {
            lead: newLead,
            total: updatedAll.length,
            advisorTotal: advisorLeads.length,
            campaignTotal: campaignLeads.length,
            campaignSlug
        };
    }

    updateLead(leadId, updatedData) {
        this.ensureDirExists();
        const allLeads = this.getAllLeads();
        const index = allLeads.findIndex(l => l.id === leadId);
        if (index === -1) {
            throw new Error(`Prospecto con ID '${leadId}' no encontrado`);
        }

        const existing = allLeads[index];
        const merged = {
            ...existing,
            ...updatedData,
            id: existing.id, // ID inmutable
            updated_at: new Date().toISOString()
        };

        allLeads[index] = merged;
        this.persistAllLeads(allLeads);

        return {
            success: true,
            lead: merged,
            total: allLeads.length
        };
    }

    deleteLead(leadId) {
        this.ensureDirExists();
        const allLeads = this.getAllLeads();
        const target = allLeads.find(l => l.id === leadId);
        if (!target) {
            throw new Error(`Prospecto con ID '${leadId}' no encontrado`);
        }

        const filtered = allLeads.filter(l => l.id !== leadId);
        this.persistAllLeads(filtered);

        return {
            success: true,
            deletedId: leadId,
            deletedLead: target,
            total: filtered.length
        };
    }

    cascadeCampaignRename(oldName, newName) {
        this.ensureDirExists();
        const allLeads = this.getAllLeads();
        const targetOld = String(oldName || '').trim().toUpperCase();
        const targetNew = String(newName || '').trim();

        let updatedCount = 0;
        const updated = allLeads.map(l => {
            const curCmp = String(l.utm_campaign || l.campaign_name || '').trim().toUpperCase();
            if (curCmp === targetOld) {
                updatedCount++;
                return {
                    ...l,
                    utm_campaign: targetNew,
                    campaign_name: targetNew
                };
            }
            return l;
        });

        if (updatedCount > 0) {
            this.persistAllLeads(updated);

            // Opcionalmente eliminar el archivo viejo de la campaña
            const oldSlug = oldName.replace(/[^a-zA-Z0-9_-]/g, '_');
            const oldXlsx = path.join(this.dataDir, `leads_${oldSlug}.xlsx`);
            const oldCsv = path.join(this.dataDir, `leads_${oldSlug}.csv`);
            if (fs.existsSync(oldXlsx)) {
                try { fs.unlinkSync(oldXlsx); } catch (e) { /* ignore */ }
            }
            if (fs.existsSync(oldCsv)) {
                try { fs.unlinkSync(oldCsv); } catch (e) { /* ignore */ }
            }
        }

        return {
            success: true,
            updatedCount: updatedCount,
            total: updated.length
        };
    }
}

module.exports = { LeadsService };
