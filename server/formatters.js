/**
 * server/formatters.js
 * Principios SOLID:
 * - SRP: Exclusivamente responsable de transformar colecciones de leads a representaciones de texto/exportación.
 * - OCP: Nuevos formatos pueden registrarse en FormatterRegistry sin modificar los existentes.
 * - LSP: Todos los formateadores implementan la interfaz común `format(leads, options)`.
 */

const { sanitizeMarkdown } = require('./security');

const CSV_HEADERS = [
    'id', 'fechaLegible', 'asesor_id', 'asesor_nombre', 'asesor_email', 'asesor_sede',
    'email', 'f_name', 'l_name', 'mobile', 'cedula', 'colegio_origen', 'aut_data',
    'gclid', 'sede', 'tp_pgm', 'esc_pgm', 'programa', 'periodo', 'c_lead', 'origen',
    'utm_campaign', 'utm_source', 'utm_medium', 'utm_term', 'utm_content',
    'area_vocacional', 'carrera_recomendada', 'perfil_vocacional'
];

function escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
}

/**
 * Formateador de CSV estándar separado estrictamente por comas y con BOM UTF-8
 */
class CsvFormatter {
    format(leads, options = {}) {
        if (options.official) {
            const officialFmt = new OfficialCsvFormatter();
            return officialFmt.format(leads, options);
        }
        const headerRow = CSV_HEADERS.map(escapeCSV).join(',');
        const rows = (leads || []).map(l => CSV_HEADERS.map(h => escapeCSV(l[h] || '')).join(','));
        return '\uFEFF' + [headerRow, ...rows].join('\r\n');
    }
    getContentType() {
        return 'text/csv; charset=UTF-8';
    }
}

/**
 * Formateador CSV Oficial Liviano con las 21 cabeceras requeridas para Prospección UIDE
 */
class OfficialCsvFormatter {
    format(leads, options = {}) {
        const headerRow = OFFICIAL_XLSX_HEADERS.map(escapeCSV).join(',');
        const rows = (leads || []).map(lead => {
            const mapped = mapLeadToXlsxRow(lead);
            return OFFICIAL_XLSX_HEADERS.map(h => escapeCSV(mapped[h] !== undefined ? mapped[h] : '')).join(',');
        });
        return '\uFEFF' + [headerRow, ...rows].join('\r\n');
    }
    getContentType() {
        return 'text/csv; charset=UTF-8';
    }
}

/**
 * Formateador JSON estructurado y liviano
 */
class JsonFormatter {
    format(leads, options = {}) {
        return JSON.stringify(leads || [], null, options.pretty !== false ? 2 : 0);
    }
    getContentType() {
        return 'application/json; charset=UTF-8';
    }
}

/**
 * Formateador Markdown con encabezados legibles y tabla alineada
 */
class MarkdownFormatter {
    format(leads, options = {}) {
        const advisorTitle = options.title || 'Todos los Asesores';
        const list = leads || [];
        const title = `# Registro Oficial de Prospectos UIDE - ${advisorTitle}\nActualizado: ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}\nTotal Registros: ${list.length}\n\n`;
        const tableHeader = '| # | Fecha | Asesor | Prospecto | Cédula | Email | Celular | Colegio | Programa | Sede | Evento (Origen) | Área Vocacional | Carrera Recomendada | Campaña | UTM Content |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
        const tableRows = list.map((l, i) => {
            const nombre = sanitizeMarkdown(`${l.f_name || ''} ${l.l_name || ''}`.trim() || 'N/A');
            const asesor = sanitizeMarkdown(`${l.asesor_nombre || ''} (${l.asesor_id || ''})`.trim() || 'N/A');
            const areaVoc = sanitizeMarkdown(l.area_vocacional || 'General');
            const carrRec = sanitizeMarkdown(l.carrera_recomendada || l.programa || 'N/A');
            return `| ${i + 1} | ${sanitizeMarkdown(l.fechaLegible || l.timestamp || '')} | ${asesor} | ${nombre} | ${sanitizeMarkdown(l.cedula || '')} | ${sanitizeMarkdown(l.email || '')} | ${sanitizeMarkdown(l.mobile || '')} | ${sanitizeMarkdown(l.colegio_origen || '')} | ${sanitizeMarkdown(l.programa || '')} | ${sanitizeMarkdown(l.sede || '')} | ${sanitizeMarkdown(l.origen || '')} | ${areaVoc} | ${carrRec} | ${sanitizeMarkdown(l.utm_campaign || '')} | ${sanitizeMarkdown(l.utm_content || '')} |`;
        }).join('\n');
        return title + tableHeader + tableRows + '\n';
    }
    getContentType() {
        return 'text/markdown; charset=UTF-8';
    }
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
 * Catálogo Oficial de Campañas Salesforce UIDE (Hoja CAMPAÑAS del template oficial)
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

/**
 * Mapea el objeto lead a un objeto con las 21 cabeceras oficiales
 */
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

/**
 * Mapea el objeto lead a una fila exacta de la hoja BORRADOR de FORMATO CARGA DE LEADS.xlsx
 * con Celdas F-G-H fijas e inmutables:
 * F = 1 (Tipo de documento: Cédula)
 * G = 'Prospeccion' (Canal de leads)
 * H = lead.origen (Origen del evento)
 */
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

/**
 * Formateador Excel .xlsx nativo multi-hoja con compatibilidad total:
 * - Hoja principal: nombrada según la campaña solicitada con las 21 cabeceras oficiales.
 * - Hoja BORRADOR: con las 21 columnas del template institucional y Celdas F-G-H fijas.
 * - Hoja CAMPAÑAS: catálogo de campañas con los IDs de Salesforce.
 */
class XlsxFormatter {
    format(leads, options = {}) {
        const XLSX = require('xlsx');
        const rows = (leads || []).map(mapLeadToXlsxRow);
        const worksheet = XLSX.utils.json_to_sheet(rows, { header: OFFICIAL_XLSX_HEADERS });
        const workbook = XLSX.utils.book_new();
        const rawSheetName = String(options.sheetName || options.title || 'Prospectos').replace(/[:\\/?*[\]]/g, '_');
        const sheetName = rawSheetName.slice(0, 31) || 'Prospectos';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Generar Hoja BORRADOR oficial (con Celdas F, G, H fijas)
        try {
            const borradorRows = (leads || []).map(mapLeadToBorradorRow);
            const borradorWorksheet = XLSX.utils.json_to_sheet(borradorRows, { header: OFFICIAL_BORRADOR_HEADERS });
            XLSX.utils.book_append_sheet(workbook, borradorWorksheet, 'BORRADOR');
        } catch (e) {
            console.warn('Error agregando hoja BORRADOR:', e);
        }

        // Generar Hoja CAMPAÑAS de referencia
        try {
            const campWorksheet = XLSX.utils.json_to_sheet(OFFICIAL_CAMPAIGNS_CATALOG);
            XLSX.utils.book_append_sheet(workbook, campWorksheet, 'CAMPAÑAS');
        } catch (e) {
            console.warn('Error agregando hoja CAMPAÑAS:', e);
        }

        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    getContentType() {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }
}

/**
 * Registro abierto para extensión (OCP)
 */
class FormatterRegistry {
    constructor() {
        this.formatters = new Map();
        this.register('csv', new CsvFormatter());
        this.register('official_csv', new OfficialCsvFormatter());
        this.register('csv_official', new OfficialCsvFormatter());
        this.register('json', new JsonFormatter());
        this.register('md', new MarkdownFormatter());
        this.register('markdown', new MarkdownFormatter());
        this.register('xlsx', new XlsxFormatter());
    }

    register(name, formatter) {
        if (!formatter || typeof formatter.format !== 'function') {
            throw new Error(`El formateador para '${name}' debe implementar el método format(leads, options)`);
        }
        this.formatters.set(name.toLowerCase(), formatter);
    }

    get(name) {
        return this.formatters.get((name || 'json').toLowerCase()) || this.formatters.get('json');
    }
}

const defaultRegistry = new FormatterRegistry();

module.exports = {
    CSV_HEADERS,
    OFFICIAL_XLSX_HEADERS,
    OFFICIAL_BORRADOR_HEADERS,
    OFFICIAL_CAMPAIGNS_CATALOG,
    mapLeadToXlsxRow,
    mapLeadToBorradorRow,
    escapeCSV,
    CsvFormatter,
    OfficialCsvFormatter,
    JsonFormatter,
    MarkdownFormatter,
    XlsxFormatter,
    FormatterRegistry,
    defaultRegistry
};
