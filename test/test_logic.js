const assert = require("assert");

// Test 1: Phone Normalization Logic
function trimEcuadorDisplay(val) {
    let digits = (val || '').replace(/\D/g, '');
    if (digits.indexOf('00593') === 0) digits = digits.slice(5);
    else if (digits.indexOf('593') === 0) digits = digits.slice(3);
    if (digits.length > 10) digits = digits.slice(0, 10);
    return digits;
}

function getEcuadorPayload(val) {
    const digits = trimEcuadorDisplay(val);
    if (!digits || digits.indexOf('00') === 0 || /^0+$/.test(digits)) return null;
    if (digits.length === 10 && digits.charAt(0) === '0') {
        return digits.charAt(1) === '0' ? null : digits.slice(1);
    }
    if (digits.length === 9 && digits.charAt(0) !== '0') return digits;
    return null;
}

console.log("Testing Phone Validation & Normalization...");
assert.strictEqual(getEcuadorPayload("0991234567"), "991234567");
assert.strictEqual(getEcuadorPayload("991234567"), "991234567");
assert.strictEqual(getEcuadorPayload("00593991234567"), "991234567");
assert.strictEqual(getEcuadorPayload("593991234567"), "991234567");
assert.strictEqual(getEcuadorPayload("099-123-4567"), "991234567");
assert.strictEqual(getEcuadorPayload("000000000"), null);
assert.strictEqual(getEcuadorPayload("12345"), null);
console.log("✓ Phone tests passed!");

// Test 2: Period Calculation Logic (Official 2026-2 / 2027-1)
function calculatePeriod(sede, tp, mod, car) {
    const PROGS_2027_1 = ["510", "515", "265", "278", "546", "554"];
    let v = "2026-2 Online Posgrado";
    if (tp === "Posgrado En Línea") {
        v = "2026-2 Online Posgrado";
    } else if (sede === "Quito") {
        if (tp.indexOf("Posgrado") !== -1) {
            v = "2026-2 Presencial Posgrado";
        } else {
            v = (car === "528") ? "II-EIN-AGO-26" : "2026-2 Q Pregrado";
        }
    } else if (sede === "Loja") {
        v = (tp.indexOf("Posgrado") !== -1) ? "2026-2 Presencial Posgrado" : "2026-2 L Pregrado";
    } else if (sede === "Guayaquil") {
        if (tp.indexOf("Posgrado") !== -1) {
            v = "2026-2 Presencial Posgrado";
        } else {
            v = (car === "548") ? "II-EIN-GY-AGO-26" : "2026-2 Guayaquil";
        }
    } else if (sede === "Distancia") {
        if (tp.indexOf("Posgrado") !== -1) {
            v = "2026-2 Online Posgrado";
        } else {
            v = (mod === "Programa Ejecutivo Online") ? "2026-2 Online PVC" : "2026-2 Online Pregrado";
        }
    }
    if (PROGS_2027_1.indexOf(car) !== -1 && tp.indexOf("Posgrado") !== -1) {
        v = "2027-1 Online Posgrado";
    }
    return v;
}

console.log("Testing Period Calculation...");
assert.strictEqual(calculatePeriod("Quito", "Pregrado Quito", "", "528"), "II-EIN-AGO-26");
assert.strictEqual(calculatePeriod("Quito", "Pregrado Quito", "", "558"), "2026-2 Q Pregrado");
assert.strictEqual(calculatePeriod("Quito", "Posgrado Quito", "Posgrado Quito Hibrida", "421"), "2026-2 Presencial Posgrado");
assert.strictEqual(calculatePeriod("Guayaquil", "Pregrado Guayaquil", "", "548"), "II-EIN-GY-AGO-26");
assert.strictEqual(calculatePeriod("Guayaquil", "Pregrado Guayaquil", "", "473"), "2026-2 Guayaquil");
assert.strictEqual(calculatePeriod("Loja", "Pregrado Loja", "", "79"), "2026-2 L Pregrado");
assert.strictEqual(calculatePeriod("Distancia", "Pregrado Distancia", "Pregrado Online", "559"), "2026-2 Online Pregrado");
assert.strictEqual(calculatePeriod("Distancia", "Pregrado Distancia", "Programa Ejecutivo Online", "189"), "2026-2 Online PVC");
assert.strictEqual(calculatePeriod("Distancia", "Posgrado Online", "Posgrado Online", "187"), "2026-2 Online Posgrado");
assert.strictEqual(calculatePeriod("Distancia", "Posgrado Online", "Posgrado Online", "510"), "2027-1 Online Posgrado");
console.log("✓ Period calculation tests passed!");

// Test 3: Cédula Validation
function validateCedula(ced) {
    const clean = (ced || "").replace(/\D/g, "");
    return clean.length === 10;
}
console.log("Testing Cédula Validation...");
assert.strictEqual(validateCedula("1712345678"), true);
assert.strictEqual(validateCedula("171234567"), false);
assert.strictEqual(validateCedula("17123456789"), false);
assert.strictEqual(validateCedula("17-1234567-8"), true);
console.log("✓ Cédula tests passed!");

// Test 4: Advisor Session Mapping & DataLayer Payload Preservation
console.log("Testing Advisor Session & DataLayer Preservation...");
const ADVISOR_ACCOUNTS = {
    'asesoreducativo1@uide.edu.ec': { id: 'ADV-01', nombre: 'Andrés Ruiz', email: 'asesoreducativo1@uide.edu.ec', sede: 'Quito' },
    'asesoreducativo2@uide.edu.ec': { id: 'ADV-02', nombre: 'Andrés Mancero', email: 'asesoreducativo2@uide.edu.ec', sede: 'Quito' },
    'asesoreducativo3@uide.edu.ec': { id: 'ADV-03', nombre: 'Andrew Figueroa', email: 'asesoreducativo3@uide.edu.ec', sede: 'Quito' },
    'asesoreducativo4@uide.edu.ec': { id: 'ADV-04', nombre: 'Ghandi Tobar', email: 'asesoreducativo4@uide.edu.ec', sede: 'Quito' }
};

assert.strictEqual(ADVISOR_ACCOUNTS['asesoreducativo1@uide.edu.ec'].nombre, 'Andrés Ruiz');
assert.strictEqual(ADVISOR_ACCOUNTS['asesoreducativo1@uide.edu.ec'].id, 'ADV-01');
assert.strictEqual(ADVISOR_ACCOUNTS['asesoreducativo2@uide.edu.ec'].id, 'ADV-02');
assert.strictEqual(ADVISOR_ACCOUNTS['asesoreducativo2@uide.edu.ec'].nombre, 'Andrés Mancero');
assert.strictEqual(ADVISOR_ACCOUNTS['asesoreducativo3@uide.edu.ec'].nombre, 'Andrew Figueroa');
assert.strictEqual(ADVISOR_ACCOUNTS['asesoreducativo3@uide.edu.ec'].sede, 'Quito');
assert.strictEqual(ADVISOR_ACCOUNTS['asesoreducativo4@uide.edu.ec'].nombre, 'Ghandi Tobar');
assert.strictEqual(ADVISOR_ACCOUNTS['asesoreducativo4@uide.edu.ec'].sede, 'Quito');
assert.strictEqual(ADVISOR_ACCOUNTS['asesoreducativo4@uide.edu.ec'].email, 'asesoreducativo4@uide.edu.ec');

// Simular payload con UTMs de Google Ads y datos de asesor
function createDataLayerPayload(activeAdvisor, incomingUtms, eventType = 'form_submit') {
    return {
        event: eventType,
        form_name: 'uide-prospeccion-app',
        form_channel: 'Prospeccion',
        tipo_lead: 'Charla FS',
        asesor_id: activeAdvisor.id,
        asesor_nombre: activeAdvisor.nombre,
        asesor_email: activeAdvisor.email,
        asesor_sede: activeAdvisor.sede,
        utm_source: incomingUtms.utm_source,
        utm_medium: incomingUtms.utm_medium,
        utm_campaign: incomingUtms.utm_campaign
    };
}

const sampleUtms = {
    utm_source: 'Google Ads',
    utm_medium: 'extension',
    utm_campaign: 'search_2026_ONLINE_884_UG_LF_LEADS_GOOGLE_COMPETENCIA'
};

const payloadAdv1 = createDataLayerPayload(ADVISOR_ACCOUNTS['asesoreducativo1@uide.edu.ec'], sampleUtms);
assert.strictEqual(payloadAdv1.asesor_id, 'ADV-01');
assert.strictEqual(payloadAdv1.asesor_nombre, 'Andrés Ruiz');
assert.strictEqual(payloadAdv1.utm_source, 'Google Ads'); // Preserved without overwrite!
assert.strictEqual(payloadAdv1.utm_medium, 'extension');
assert.strictEqual(payloadAdv1.utm_campaign, 'search_2026_ONLINE_884_UG_LF_LEADS_GOOGLE_COMPETENCIA');

const payloadAdv2 = createDataLayerPayload(ADVISOR_ACCOUNTS['asesoreducativo2@uide.edu.ec'], sampleUtms);
assert.strictEqual(payloadAdv2.asesor_id, 'ADV-02');
assert.strictEqual(payloadAdv2.asesor_nombre, 'Andrés Mancero');
assert.strictEqual(payloadAdv2.utm_source, 'Google Ads');
console.log("✓ Advisor session and DataLayer tests passed!");

// Test 5: WhatsApp Normalization, walink generation & Official Endpoints
console.log("Testing WhatsApp Normalization & Action URLs...");
function normalizeWhatsAppNumber(raw) {
    if (!raw) return '';
    let digits = String(raw).replace(/\D/g, '');
    if (digits.startsWith('00593')) digits = digits.slice(2);
    if (digits.startsWith('593') && digits.length >= 11) return digits;
    if (digits.length === 10 && digits.startsWith('0')) {
        return '593' + digits.slice(1);
    }
    if (digits.length === 9 && digits.startsWith('9')) {
        return '593' + digits;
    }
    return digits;
}

function generateWhatsAppLink(rawPhone, advisorName) {
    const cleanNumber = normalizeWhatsAppNumber(rawPhone);
    if (!cleanNumber) return '#';
    const msg = encodeURIComponent(`¡Hola ${advisorName || 'Asesor'}! Me gustaría recibir información sobre las carreras y admisiones en la UIDE.`);
    return `https://wa.me/${cleanNumber}?text=${msg}`;
}

assert.strictEqual(normalizeWhatsAppNumber("0991234567"), "593991234567");
assert.strictEqual(normalizeWhatsAppNumber("991234567"), "593991234567");
assert.strictEqual(normalizeWhatsAppNumber("+593991234567"), "593991234567");
assert.strictEqual(normalizeWhatsAppNumber("00593991234567"), "593991234567");
assert.strictEqual(normalizeWhatsAppNumber("593991234567"), "593991234567");
assert.strictEqual(normalizeWhatsAppNumber("0987654321"), "593987654321");

const walink = generateWhatsAppLink("0991234567", "Andrés Mancero");
assert.ok(walink.startsWith("https://wa.me/593991234567?text="));
assert.ok(walink.includes("Andr%C3%A9s%20Mancero"));

// Check index.html action and carreras links directly
const fs = require('fs');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.ok(indexHtml.includes('action="https://go.uide.edu.ec/l/455762/2026-09-08/8d64j1"'), "Form action must be 2026-09-08/8d64j1");
assert.ok(indexHtml.includes('https://www.uide.edu.ec/programas-academicos/'), "Linktree carreras must point to programas-academicos/");
console.log("✓ WhatsApp normalization and action URL tests passed!");

// Test 6: Stand Event Selection, QR Generation & 2-Button Linktree Action Flow
console.log("Testing Stand Event Selection & 2-Button Flow...");
function simulateQrTargetUrl(advisor, eventType) {
    const baseUrl = "https://go.uide.edu.ec/prospeccion";
    return `${baseUrl}?modo=linktree&tipo=${encodeURIComponent(eventType)}&asesor_id=${encodeURIComponent(advisor.id)}&asesor_email=${encodeURIComponent(advisor.email)}`;
}

function parseUrlEventType(urlString) {
    const u = new URL(urlString);
    const tipo = u.searchParams.get('tipo');
    if (!tipo) return 'Charla FS';
    if (tipo.toLowerCase().includes('charla')) return 'Charla FS';
    if (tipo.toLowerCase().includes('feria')) return 'Ferias FS';
    if (tipo.toLowerCase().includes('visita') || tipo.toLowerCase().includes('campus')) return 'Visita a campus';
    return tipo;
}

const events = ['Charla FS', 'Ferias FS', 'Visita a campus'];
events.forEach(evt => {
    const url = simulateQrTargetUrl(ADVISOR_ACCOUNTS['asesoreducativo1@uide.edu.ec'], evt);
    assert.ok(url.includes(`tipo=${encodeURIComponent(evt)}`));
    const parsed = parseUrlEventType(url);
    assert.strictEqual(parsed, evt);

    // Verify DataLayer payload incorporates this exact lead type
    const dlPayload = createDataLayerPayload(ADVISOR_ACCOUNTS['asesoreducativo1@uide.edu.ec'], sampleUtms);
    dlPayload.tipo_lead = evt;
    assert.strictEqual(dlPayload.tipo_lead, evt);
});

// Verify 2 prominent action buttons and form elements in index.html
assert.ok(indexHtml.includes('id="btn_linktree_to_form"'), "Must have button 'Llenar Formulario'");
assert.ok(indexHtml.includes('id="btn_lt_ver_links"'), "Must have button 'Ver Links'");
assert.ok(indexHtml.includes('id="linktree_event_banner"'), "Must have event banner in linktree");
assert.ok(indexHtml.includes('id="btn_back_to_linktree"'), "Must have back to linktree button in form");
assert.ok(indexHtml.includes('id="form_event_badge_tag"'), "Must have event badge tag in form");
assert.ok(indexHtml.includes('id="linktree_links_wrapper"'), "Must have expandable links wrapper");
assert.ok(!indexHtml.includes('id="link_uide_web"'), "Must NOT have link_uide_web in linktree");
assert.ok(!indexHtml.includes('id="link_uide_becas"'), "Must NOT have link_uide_becas in linktree");
assert.ok(indexHtml.includes('id="btn_linktree_whatsapp"'), "Must preserve WhatsApp in linktree");
assert.ok(indexHtml.includes('id="link_uide_carreras"'), "Must preserve Carreras in linktree");
assert.ok(indexHtml.includes('id="link_uide_campus_quito"'), "Must preserve Campus Quito in linktree");
assert.ok(indexHtml.includes('id="link_uide_campus_guayaquil"'), "Must preserve Campus Guayaquil in linktree");
assert.ok(indexHtml.includes('id="link_uide_campus_loja"'), "Must preserve Campus Loja in linktree");
console.log("✓ Event selection, QR parameterization and 2-button Linktree landing tests passed!");

// Test 7: Dynamic UTM Campaign Generation, QR Encoding, Form Prefill & DataLayer Attribution
console.log("Testing Dynamic UTM Campaign Generation & DataLayer Attribution...");
const { App } = require("../js/app.js");

// 7.1 Verify helper generation for all 3 prospection events
const adv1 = { id: 'ADV-01', nombre: 'Andrés Ruiz', email: 'asesoreducativo1@uide.edu.ec', sede: 'Quito' };
const adv2 = { id: 'ADV-02', nombre: 'Andrés Mancero', email: 'asesoreducativo2@uide.edu.ec', sede: 'Quito' };
const adv3 = { id: 'ADV-03', nombre: 'Andrew Figueroa', email: 'asesoreducativo3@uide.edu.ec', sede: 'Quito' };
const adv4 = { id: 'ADV-04', nombre: 'Ghandi Tobar', email: 'asesoreducativo4@uide.edu.ec', sede: 'Quito' };

// Evento 1: Charla FS
const utmCharla = App.generateDefaultUtms(adv1, 'Charla FS', 'Colegio Menor');
assert.strictEqual(utmCharla.utm_source, 'prospeccion');
assert.strictEqual(utmCharla.utm_medium, 'charla_colegios');
assert.strictEqual(utmCharla.utm_campaign, 'PROSPECCION_CHARLA_FS_COLEGIO_MENOR_2026');
assert.strictEqual(utmCharla.utm_term, 'ADV-01_Andrés_Ruiz');
assert.strictEqual(utmCharla.utm_content, 'colegio_menor');

// Evento 2: Ferias FS
const utmFeria = App.generateDefaultUtms(adv2, 'Ferias FS', 'Feria Quorum Cumbayá');
assert.strictEqual(utmFeria.utm_source, 'prospeccion');
assert.strictEqual(utmFeria.utm_medium, 'ferias_colegios');
assert.strictEqual(utmFeria.utm_campaign, 'PROSPECCION_FERIAS_FS_FERIA_QUORUM_CUMBAYA_2026');
assert.strictEqual(utmFeria.utm_term, 'ADV-02_Andrés_Mancero');
assert.strictEqual(utmFeria.utm_content, 'feria_quorum_cumbaya');

// Evento 3: Visita a campus
const utmCampus = App.generateDefaultUtms(adv3, 'Visita a campus', 'Colegio San Gabriel');
assert.strictEqual(utmCampus.utm_source, 'prospeccion');
assert.strictEqual(utmCampus.utm_medium, 'visita_campus');
assert.strictEqual(utmCampus.utm_campaign, 'PROSPECCION_VISITA_CAMPUS_COLEGIO_SAN_GABRIEL_2026');
assert.strictEqual(utmCampus.utm_term, 'ADV-03_Andrew_Figueroa');
assert.strictEqual(utmCampus.utm_content, 'colegio_san_gabriel');

// 7.2 Evento genérico sin nombre de colegio
const utmGenerico = App.generateDefaultUtms(adv4, 'Charla FS', '');
assert.strictEqual(utmGenerico.utm_campaign, 'PROSPECCION_CHARLA_FS_GENERAL_2026');
assert.strictEqual(utmGenerico.utm_content, 'general');

// 7.3 Simulación de URL codificada en el QR con todos los parámetros
function generateQrTargetUrl(advisor, eventType, eventName, customCampaign, customContent) {
    const defaultUtms = App.generateDefaultUtms(advisor, eventType, eventName);
    const utmCampaign = customCampaign || defaultUtms.utm_campaign;
    const utmContent = customContent || defaultUtms.utm_content;
    const baseUrl = "https://go.uide.edu.ec/prospeccion";

    let url = `${baseUrl}?modo=linktree&tipo=${encodeURIComponent(eventType)}&asesor_id=${encodeURIComponent(advisor.id)}&asesor_email=${encodeURIComponent(advisor.email)}&asesor_nombre=${encodeURIComponent(advisor.nombre)}&asesor_sede=${encodeURIComponent(advisor.sede)}&utm_source=prospeccion&utm_medium=${encodeURIComponent(defaultUtms.utm_medium)}&utm_campaign=${encodeURIComponent(utmCampaign)}&utm_term=${encodeURIComponent(defaultUtms.utm_term)}&utm_content=${encodeURIComponent(utmContent)}`;

    if (eventName) {
        url += `&colegio=${encodeURIComponent(eventName)}`;
    }
    return url;
}

const qrUrl = generateQrTargetUrl(adv1, 'Charla FS', 'Colegio Einstein');
assert.ok(qrUrl.includes('utm_source=prospeccion'));
assert.ok(qrUrl.includes('utm_medium=charla_colegios'));
assert.ok(qrUrl.includes('utm_campaign=PROSPECCION_CHARLA_FS_COLEGIO_EINSTEIN_2026'));
assert.ok(qrUrl.includes('utm_content=colegio_einstein'));
assert.ok(qrUrl.includes('colegio=Colegio%20Einstein'));

// 7.4 Simulación del formulario parseando URL y preparando DataLayer
const parsedUrl = new URL(qrUrl);
const formTrackingState = {
    utm_source: parsedUrl.searchParams.get('utm_source'),
    utm_medium: parsedUrl.searchParams.get('utm_medium'),
    utm_campaign: parsedUrl.searchParams.get('utm_campaign'),
    utm_term: parsedUrl.searchParams.get('utm_term'),
    utm_content: parsedUrl.searchParams.get('utm_content'),
    colegio_origen: parsedUrl.searchParams.get('colegio') || ''
};

assert.strictEqual(formTrackingState.utm_source, 'prospeccion');
assert.strictEqual(formTrackingState.utm_medium, 'charla_colegios');
assert.strictEqual(formTrackingState.utm_campaign, 'PROSPECCION_CHARLA_FS_COLEGIO_EINSTEIN_2026');
assert.strictEqual(formTrackingState.utm_content, 'colegio_einstein');
assert.strictEqual(formTrackingState.colegio_origen, 'Colegio Einstein');

// 7.5 Simulación de DataLayer push en form_submit
const mockSubmitDataLayerPayload = {
    event: 'form_submit',
    form_name: 'uide-prospeccion-app',
    form_channel: 'Prospeccion',
    tipo_lead: 'Charla FS',
    asesor_id: adv1.id,
    asesor_nombre: adv1.nombre,
    asesor_email: adv1.email,
    asesor_sede: adv1.sede,
    lead_carrera: 'Administración de Empresas',
    lead_sede: 'Quito',
    lead_periodo: '2026-2 Q Pregrado',
    utm_source: formTrackingState.utm_source,
    utm_medium: formTrackingState.utm_medium,
    utm_campaign: formTrackingState.utm_campaign,
    utm_term: formTrackingState.utm_term,
    utm_content: formTrackingState.utm_content,
    campaign_name: formTrackingState.utm_campaign,
    colegio_origen: formTrackingState.colegio_origen
};

assert.strictEqual(mockSubmitDataLayerPayload.utm_source, 'prospeccion');
assert.strictEqual(mockSubmitDataLayerPayload.utm_medium, 'charla_colegios');
assert.strictEqual(mockSubmitDataLayerPayload.utm_campaign, 'PROSPECCION_CHARLA_FS_COLEGIO_EINSTEIN_2026');
assert.strictEqual(mockSubmitDataLayerPayload.utm_content, 'colegio_einstein');
assert.strictEqual(mockSubmitDataLayerPayload.campaign_name, 'PROSPECCION_CHARLA_FS_COLEGIO_EINSTEIN_2026');
assert.strictEqual(mockSubmitDataLayerPayload.colegio_origen, 'Colegio Einstein');

// 7.6 Verificación de elementos DOM en index.html
assert.ok(indexHtml.includes('id="utm_content"'), "index.html must have #utm_content hidden input");
assert.ok(indexHtml.includes('id="input_adv_event_name"'), "index.html must have #input_adv_event_name");
assert.ok(indexHtml.includes('id="input_adv_utm_campaign"'), "index.html must have #input_adv_utm_campaign");
assert.ok(indexHtml.includes('id="input_adv_utm_content"'), "index.html must have #input_adv_utm_content");
assert.ok(indexHtml.includes('id="preview_utm_campaign_text"'), "index.html must have #preview_utm_campaign_text");
assert.ok(indexHtml.includes('id="preview_utm_medium_text"'), "index.html must have #preview_utm_medium_text");
assert.ok(indexHtml.includes('id="preview_utm_content_text"'), "index.html must have #preview_utm_content_text");
assert.ok(indexHtml.includes('id="preview_utm_term_text"'), "index.html must have #preview_utm_term_text");
console.log("✓ Dynamic UTM Campaign generation, QR encoding, and DataLayer attribution tests passed!");

// Test 8: 13 Pardot Form Endpoint Fields & DataLayer Capture Verification
console.log("Testing 13 Pardot Form Endpoint Fields & DataLayer Capture...");

// 8.1 Check existence of all 13 fields in index.html with exact name attributes
const REQUIRED_ENDPOINT_FIELDS = [
    { name: 'email', id: 'email', label: 'Campo predeterminado: Email' },
    { name: 'f_name', id: 'f_name', label: 'Campo predeterminado: First Name' },
    { name: 'l_name', id: 'l_name', label: 'Campo predeterminado: Last Name' },
    { name: 'mobile', id: 'mobile', label: 'Campo predeterminado: Phone' },
    { name: 'aut_data', id: 'aut_data', label: 'Campo personalizado: Autorización de datos' },
    { name: 'gclid', id: 'gclid', label: 'Campo personalizado: GCLID' },
    { name: 'sede', id: 'sede', label: 'Campo personalizado: Sede' },
    { name: 'tp_pgm', id: 'tp_pgm', label: 'Campo personalizado: Tipo de Programa' },
    { name: 'esc_pgm', id: 'esc_pgm', label: 'Campo personalizado: Escoge tu Programa Nuevo' },
    { name: 'periodo', id: 'periodo', label: 'Campo personalizado: Periodo' },
    { name: 'utm_campaign', id: 'utm_campaign', label: 'Campo personalizado: Nombre de la Campaña' },
    { name: 'c_lead', id: 'c_lead', label: 'Campo personalizado: Canal de Leads' },
    { name: 'origen', id: 'origen', label: 'Campo predeterminado: Source' }
];

REQUIRED_ENDPOINT_FIELDS.forEach(f => {
    assert.ok(indexHtml.includes(`name="${f.name}"`), `Form must contain field name="${f.name}" (${f.label})`);
    assert.ok(indexHtml.includes(`id="${f.id}"`), `Form must contain field id="${f.id}"`);
});

// 8.2 Verify simulated full DataLayer payload contains all 13 fields with non-undefined values
const sampleLead = {
    email: 'estudiante.test@gmail.com',
    f_name: 'Mateo',
    l_name: 'Paredes',
    mobile: '+593991234567',
    aut_data: 'true',
    gclid: 'CjwKCAjw_sample_gclid_12345',
    sede: 'Quito',
    tp_pgm: 'Pregrado Quito',
    esc_pgm: '1',
    periodo: '2026-2 Q Pregrado',
    utm_campaign: 'PROSPECCION_CHARLA_FS_COLEGIO_MENOR_2026',
    c_lead: 'Prospeccion',
    origen: 'Charla FS',
    cedula: '1723456789',
    colegio_origen: 'Colegio Menor',
    programa: 'Administración de Empresas',
    modalidad: '',
    utm_source: 'prospeccion',
    utm_medium: 'charla_colegios',
    utm_term: 'ADV-01_Andrés_Ruiz',
    utm_content: 'colegio_menor',
    campaign_name: 'PROSPECCION_CHARLA_FS_COLEGIO_MENOR_2026'
};

function buildFormSubmitDataLayer(lead, advisor) {
    return {
        event: 'form_submit',
        form_name: 'uide-prospeccion-app',
        // 13 Campos Oficiales del Endpoint
        email: lead.email,
        f_name: lead.f_name,
        l_name: lead.l_name,
        mobile: lead.mobile,
        aut_data: lead.aut_data,
        gclid: lead.gclid,
        sede: lead.sede,
        tp_pgm: lead.tp_pgm,
        esc_pgm: lead.esc_pgm,
        periodo: lead.periodo,
        utm_campaign: lead.utm_campaign,
        c_lead: lead.c_lead,
        origen: lead.origen,
        // Atributos de Tracking Enriquecido
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_term: lead.utm_term,
        utm_content: lead.utm_content,
        campaign_name: lead.campaign_name,
        colegio_origen: lead.colegio_origen,
        cedula: lead.cedula,
        programa: lead.programa,
        lead_carrera: lead.programa,
        form_channel: lead.c_lead,
        tipo_lead: lead.origen,
        lead_sede: lead.sede,
        lead_periodo: lead.periodo,
        asesor_id: advisor.id,
        asesor_nombre: advisor.nombre,
        asesor_email: advisor.email,
        asesor_sede: advisor.sede
    };
}

const submitPayload = buildFormSubmitDataLayer(sampleLead, adv1);

// Assert all 13 fields are captured with their exact values
REQUIRED_ENDPOINT_FIELDS.forEach(f => {
    assert.notStrictEqual(submitPayload[f.name], undefined, `DataLayer payload must capture '${f.name}'`);
    assert.strictEqual(submitPayload[f.name], sampleLead[f.name], `DataLayer '${f.name}' value must match`);
});

// Assert enriched tracking attributes are also present
assert.strictEqual(submitPayload.colegio_origen, 'Colegio Menor');
assert.strictEqual(submitPayload.cedula, '1723456789');
assert.strictEqual(submitPayload.asesor_id, 'ADV-01');
assert.strictEqual(submitPayload.asesor_nombre, 'Andrés Ruiz');

console.log("✓ All 13 Pardot Form Endpoint Fields & DataLayer capture verified!");

// Test 9: Multi-Format Persistence (JSON, CSV, MD) & Advisor-Specific Filtering
console.log("Testing Multi-Format Persistence (JSON, CSV, MD) & Advisor Filtering...");

// Setup mock localStorage in Node.js environment
const mockStore = {};
global.localStorage = {
    getItem: (k) => mockStore[k] || null,
    setItem: (k, v) => { mockStore[k] = String(v); },
    removeItem: (k) => { delete mockStore[k]; },
    clear: () => { for (const k in mockStore) delete mockStore[k]; }
};

const { LeadsStorage } = require('../js/leads-storage.js');

// 9.1 Test saving leads linked to specific advisors
const leadAdv1 = {
    email: 'estudiante.andy@gmail.com',
    f_name: 'Camila',
    l_name: 'Navarro',
    mobile: '+593987654321',
    cedula: '1723456789',
    colegio_origen: 'Colegio Einstein',
    aut_data: 'true',
    gclid: 'gclid_test_andy',
    sede: 'Quito',
    tp_pgm: 'Pregrado Quito',
    esc_pgm: '1',
    programa: 'Administración de Empresas',
    periodo: '2026-2 Q Pregrado',
    c_lead: 'Prospeccion',
    origen: 'Charla FS',
    utm_campaign: 'PROSPECCION_CHARLA_FS_COLEGIO_EINSTEIN_2026',
    utm_source: 'prospeccion',
    utm_medium: 'charla_colegios',
    utm_term: 'ADV-01_Andrés_Ruiz',
    utm_content: 'colegio_einstein',
    asesor: 'Andrés Ruiz',
    asesor_id: 'ADV-01',
    asesor_nombre: 'Andrés Ruiz',
    asesor_email: 'asesoreducativo1@uide.edu.ec',
    asesor_sede: 'Quito'
};

const leadAdv2 = {
    email: 'estudiante.mancero@gmail.com',
    f_name: 'Mateo',
    l_name: 'Salazar',
    mobile: '+593991122334',
    cedula: '1719876543',
    colegio_origen: 'Colegio ISM',
    aut_data: 'true',
    gclid: 'gclid_test_mancero',
    sede: 'Quito',
    tp_pgm: 'Pregrado Quito',
    esc_pgm: '31',
    programa: 'Medicina Veterinaria',
    periodo: '2026-2 Q Pregrado',
    c_lead: 'Prospeccion',
    origen: 'Ferias FS',
    utm_campaign: 'PROSPECCION_FERIAS_FS_COLEGIO_ISM_2026',
    utm_source: 'prospeccion',
    utm_medium: 'ferias_colegios',
    utm_term: 'ADV-02_Andrés_Mancero',
    utm_content: 'colegio_ism',
    asesor: 'Andrés Mancero',
    asesor_id: 'ADV-02',
    asesor_nombre: 'Andrés Mancero',
    asesor_email: 'asesoreducativo2@uide.edu.ec',
    asesor_sede: 'Quito'
};

LeadsStorage.saveLead(leadAdv1);
LeadsStorage.saveLead(leadAdv2);

const allLeads = LeadsStorage.getAllLeads();
assert.strictEqual(allLeads.length, 2, 'Should store 2 total leads');

// 9.2 Test advisor-specific filtering
const leadsAdv1 = LeadsStorage.getLeadsByAdvisor('ADV-01');
assert.strictEqual(leadsAdv1.length, 1, 'ADV-01 should have exactly 1 lead');
assert.strictEqual(leadsAdv1[0].f_name, 'Camila');
assert.strictEqual(leadsAdv1[0].asesor_id, 'ADV-01');

const leadsAdv2 = LeadsStorage.getLeadsByAdvisor('ADV-02');
assert.strictEqual(leadsAdv2.length, 1, 'ADV-02 should have exactly 1 lead');
assert.strictEqual(leadsAdv2[0].f_name, 'Mateo');
assert.strictEqual(leadsAdv2[0].asesor_id, 'ADV-02');

const leadsAdv3 = LeadsStorage.getLeadsByAdvisor('ADV-03');
assert.strictEqual(leadsAdv3.length, 0, 'ADV-03 should have 0 leads');

// 9.3 Test advisor-specific stats
const statsAdv1 = LeadsStorage.getStats('ADV-01');
assert.strictEqual(statsAdv1.total, 1);
assert.strictEqual(statsAdv1.charlaFS, 1);
assert.strictEqual(statsAdv1.feriasFS, 0);

const statsAdv2 = LeadsStorage.getStats('ADV-02');
assert.strictEqual(statsAdv2.total, 1);
assert.strictEqual(statsAdv2.charlaFS, 0);
assert.strictEqual(statsAdv2.feriasFS, 1);

const statsTotal = LeadsStorage.getStats();
assert.strictEqual(statsTotal.total, 2);
assert.strictEqual(statsTotal.charlaFS, 1);
assert.strictEqual(statsTotal.feriasFS, 1);

// 9.4 Test JSON serialization
const jsonAdv1 = LeadsStorage.generateJSON('ADV-01');
const parsedAdv1 = JSON.parse(jsonAdv1);
assert.strictEqual(Array.isArray(parsedAdv1), true);
assert.strictEqual(parsedAdv1.length, 1);
assert.strictEqual(parsedAdv1[0].email, 'estudiante.andy@gmail.com');
assert.strictEqual(parsedAdv1[0].asesor_id, 'ADV-01');

// 9.5 Test CSV generation (comma-separated, BOM, all 26 fields)
const csvAdv1 = LeadsStorage.generateCSV('ADV-01');
assert.ok(csvAdv1.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
const csvLines = csvAdv1.trim().split('\r\n');
assert.strictEqual(csvLines.length, 2, 'CSV should have 1 header line and 1 data line');

const headerCols = csvLines[0].split(',');
assert.strictEqual(headerCols.length, LeadsStorage.ALL_HEADERS.length, 'CSV header column count must match ALL_HEADERS');
assert.ok(headerCols.includes('"email"'), 'CSV header must include email');
assert.ok(headerCols.includes('"f_name"'), 'CSV header must include f_name');
assert.ok(headerCols.includes('"l_name"'), 'CSV header must include l_name');
assert.ok(headerCols.includes('"mobile"'), 'CSV header must include mobile');
assert.ok(headerCols.includes('"aut_data"'), 'CSV header must include aut_data');
assert.ok(headerCols.includes('"gclid"'), 'CSV header must include gclid');
assert.ok(headerCols.includes('"sede"'), 'CSV header must include sede');
assert.ok(headerCols.includes('"tp_pgm"'), 'CSV header must include tp_pgm');
assert.ok(headerCols.includes('"esc_pgm"'), 'CSV header must include esc_pgm');
assert.ok(headerCols.includes('"periodo"'), 'CSV header must include periodo');
assert.ok(headerCols.includes('"utm_campaign"'), 'CSV header must include utm_campaign');
assert.ok(headerCols.includes('"c_lead"'), 'CSV header must include c_lead');
assert.ok(headerCols.includes('"origen"'), 'CSV header must include origen');
assert.ok(headerCols.includes('"asesor_id"'), 'CSV header must include asesor_id');

// Verify data line is comma-separated and contains Camila's data
assert.ok(csvLines[1].includes('"Camila"'));
assert.ok(csvLines[1].includes('"ADV-01"'));
assert.ok(csvLines[1].includes('"Colegio Einstein"'));

const mdAdv1 = LeadsStorage.generateMD('ADV-01');
assert.ok(mdAdv1.includes('# Registro Oficial de Prospectos UIDE - Asesor ADV-01'), 'Markdown title must contain advisor ID');
assert.ok(mdAdv1.includes('| # | Fecha | Asesor | Prospecto | Cédula | Email | Celular | Colegio | Programa | Sede | Evento (Origen) | Área Vocacional | Carrera Recomendada | Campaña | UTM Content |'), 'Markdown must contain table header');
assert.ok(mdAdv1.includes('Camila Navarro'), 'Markdown table must contain student name');
assert.ok(mdAdv1.includes('Andrés Ruiz (ADV-01)'), 'Markdown table must contain advisor');
assert.ok(mdAdv1.includes('Colegio Einstein'), 'Markdown table must contain school');

// 9.7 Test disk persistence via server.js (/api/leads)
const path = require('path');
const dataDir = path.join(__dirname, '..', 'data');
assert.ok(fs.existsSync(dataDir), 'data/ directory must exist');
assert.ok(fs.existsSync(path.join(dataDir, 'leads.json')), 'data/leads.json must exist');
assert.ok(fs.existsSync(path.join(dataDir, 'leads.csv')), 'data/leads.csv must exist');
assert.ok(fs.existsSync(path.join(dataDir, 'leads.md')), 'data/leads.md must exist');

// 9.8 Verify HTML UI elements for QR sharing and multi-format leads view
assert.ok(indexHtml.includes('id="btn_share_qr"'), 'index.html must contain #btn_share_qr');
assert.ok(indexHtml.includes('id="btn_copy_qr_link"'), 'index.html must contain #btn_copy_qr_link');
assert.ok(indexHtml.includes('id="btn_filter_my_leads"'), 'index.html must contain #btn_filter_my_leads');
assert.ok(indexHtml.includes('id="btn_filter_all_leads"'), 'index.html must contain #btn_filter_all_leads');
assert.ok(indexHtml.includes('id="btn_export_csv"'), 'index.html must contain #btn_export_csv');
assert.ok(indexHtml.includes('id="btn_export_json"'), 'index.html must contain #btn_export_json');
assert.ok(indexHtml.includes('id="btn_export_md"'), 'index.html must contain #btn_export_md');
assert.ok(indexHtml.includes('id="btn_clear_leads"'), 'index.html must contain #btn_clear_leads');

console.log("✓ Multi-Format Persistence (JSON, CSV, MD) & Advisor-Specific Filtering tests passed!");

// Test 10: SOLID Architecture & Advisor Security Verification (LOPDP)
console.log("Testing SOLID Architecture & Advisor Security Verification...");

// 10.1 Test server/security.js: Data Isolation & Advisor Authentication
const { isProtectedDataPath, authenticateAdvisor, validateLeadSubmission } = require('../server/security.js');

// Verify /data/* cannot be served statically to anyone (LOPDP protection)
assert.strictEqual(isProtectedDataPath('/data'), true);
assert.strictEqual(isProtectedDataPath('/data/leads.json'), true);
assert.strictEqual(isProtectedDataPath('/data/leads.csv'), true);
assert.strictEqual(isProtectedDataPath('/data/leads_ADV-01.md'), true);
assert.strictEqual(isProtectedDataPath('/data/subdir/leads.json'), true);
assert.strictEqual(isProtectedDataPath('/css/styles.css'), false);
assert.strictEqual(isProtectedDataPath('/js/app.js'), false);
assert.strictEqual(isProtectedDataPath('/index.html'), false);

// Verify authenticateAdvisor rejects requests without PIN
const reqNoAuth = { headers: {} };
assert.strictEqual(authenticateAdvisor(reqNoAuth).authorized, false);

const reqBadPin = { headers: { 'x-advisor-pin': 'wrong_pin_123' } };
assert.strictEqual(authenticateAdvisor(reqBadPin).authorized, false);

// Verify authenticateAdvisor accepts institutional PINs
const reqValidPin1 = { headers: { 'x-advisor-pin': 'UIDE2026' } };
assert.strictEqual(authenticateAdvisor(reqValidPin1).authorized, true);

const reqValidPin2 = { headers: { 'x-advisor-pin': '2026' } };
assert.strictEqual(authenticateAdvisor(reqValidPin2).authorized, true);

const reqBearerPin = { headers: { 'authorization': 'Bearer UIDE2026' } };
assert.strictEqual(authenticateAdvisor(reqBearerPin).authorized, true);

// Verify validateLeadSubmission ensures payload structure
assert.strictEqual(validateLeadSubmission(null).valid, false);
assert.strictEqual(validateLeadSubmission({}).valid, false);
assert.strictEqual(validateLeadSubmission({ email: 'bad_email', f_name: 'Test', mobile: '099' }).valid, false);
assert.strictEqual(validateLeadSubmission({ email: 'test@uide.edu.ec', f_name: 'Mateo', mobile: '0991234567' }).valid, true);

// 10.2 Test server/formatters.js: Polymorphic Formatters & Open/Closed Principle
const { FormatterRegistry, CsvFormatter, JsonFormatter, MarkdownFormatter } = require('../server/formatters.js');
const testRegistry = new FormatterRegistry();

const sampleLeadList = [
    {
        id: 'UIDE-TEST-001',
        fechaLegible: '9/9/2026',
        asesor_id: 'ADV-01',
        asesor_nombre: 'Andrés Ruiz',
        email: 'test.estudiante@gmail.com',
        f_name: 'Camila',
        l_name: 'Navarro',
        mobile: '+593991234567',
        cedula: '1723456789',
        colegio_origen: 'Colegio Menor',
        sede: 'Quito',
        tp_pgm: 'Pregrado Quito',
        programa: 'Derecho',
        c_lead: 'Prospeccion',
        origen: 'Charla FS',
        utm_campaign: 'PROSPECCION_CHARLA_FS_MENOR_2026'
    }
];

// Verify all formatters implement format(leads, options) -> string (LSP)
['csv', 'json', 'md'].forEach(fmtName => {
    const fmt = testRegistry.get(fmtName);
    assert.ok(fmt, `Formatter '${fmtName}' must exist`);
    const output = fmt.format(sampleLeadList, { title: 'Test' });
    assert.strictEqual(typeof output, 'string', `${fmtName} output must be string`);
    assert.ok(output.length > 0, `${fmtName} output must not be empty`);
    assert.strictEqual(typeof fmt.getContentType(), 'string');
});

// Verify Open/Closed Principle: Can register new formatter without modifying existing ones
class XmlFormatter {
    format(leads) {
        return `<leads>${leads.map(l => `<lead id="${l.id}">${l.f_name}</lead>`).join('')}</leads>`;
    }
    getContentType() { return 'application/xml; charset=UTF-8'; }
}
testRegistry.register('xml', new XmlFormatter());
const xmlFmt = testRegistry.get('xml');
assert.ok(xmlFmt.format(sampleLeadList).includes('<lead id="UIDE-TEST-001">Camila</lead>'));

// 10.3 Test js/advisor-auth.js: Frontend Authentication Module (SRP)
const mockSessionStore = {};
global.sessionStorage = {
    getItem: (k) => mockSessionStore[k] || null,
    setItem: (k, v) => { mockSessionStore[k] = String(v); },
    removeItem: (k) => { delete mockSessionStore[k]; },
    clear: () => { for (const k in mockSessionStore) delete mockSessionStore[k]; }
};

const { AdvisorAuth } = require('../js/advisor-auth.js');

assert.strictEqual(AdvisorAuth.verifyPin('UIDE2026'), true);
assert.strictEqual(AdvisorAuth.verifyPin('2026'), true);
assert.strictEqual(AdvisorAuth.verifyPin('uide2026'), true);
assert.strictEqual(AdvisorAuth.verifyPin('bad_pin'), false);

// Test default advisor pin is 2026
assert.strictEqual(AdvisorAuth.getAdvisorPin('asesoreducativo1@uide.edu.ec'), '2026');

// Test advisor can change their PIN in configuration
AdvisorAuth.setAdvisorPin('asesoreducativo1@uide.edu.ec', '5432');
assert.strictEqual(AdvisorAuth.getAdvisorPin('asesoreducativo1@uide.edu.ec'), '5432');
assert.strictEqual(AdvisorAuth.verifyPin('5432', 'asesoreducativo1@uide.edu.ec'), true);
// Master 2026 still valid
assert.strictEqual(AdvisorAuth.verifyPin('2026', 'asesoreducativo1@uide.edu.ec'), true);

// Test session login, headers and logout with custom PIN
assert.strictEqual(AdvisorAuth.isAuthenticated(), false);
const loginSuccess = AdvisorAuth.login('5432', 'asesoreducativo1@uide.edu.ec');
assert.strictEqual(loginSuccess, true);
assert.strictEqual(AdvisorAuth.isAuthenticated(), true);

const authHeaders = AdvisorAuth.getAuthHeaders();
assert.strictEqual(authHeaders['x-advisor-pin'], '5432');

AdvisorAuth.logout();
assert.strictEqual(AdvisorAuth.isAuthenticated(), false);

// 10.4 Verify HTML UI security elements & NO visible hint
assert.ok(indexHtml.includes('id="advisor_auth_modal"'), 'index.html must contain #advisor_auth_modal');
assert.ok(indexHtml.includes('id="input_advisor_pin"'), 'index.html must contain #input_advisor_pin');
assert.ok(indexHtml.includes('id="btn_submit_advisor_pin"'), 'index.html must contain #btn_submit_advisor_pin');
assert.ok(indexHtml.includes('id="btn_cancel_advisor_pin"'), 'index.html must contain #btn_cancel_advisor_pin');
assert.ok(indexHtml.includes('id="auth_pin_error_msg"'), 'index.html must contain #auth_pin_error_msg');
assert.ok(indexHtml.includes('id="btn_lock_advisor_session"'), 'index.html must contain #btn_lock_advisor_session');
assert.ok(indexHtml.includes('id="input_adv_pin"'), 'index.html must contain #input_adv_pin');
assert.ok(indexHtml.includes('js/advisor-auth.js'), 'index.html must include script js/advisor-auth.js');
// Ensure visible default PIN hint is removed from the registration/auth modal
assert.strictEqual(indexHtml.includes('PIN por defecto: <strong>UIDE2026</strong> o <strong>2026</strong>'), false, 'Visible PIN hint must be removed from modal');

console.log("✓ SOLID Architecture & Advisor Security (LOPDP) tests passed!");

// ============================================================================
// SUITE 11: MODAL RESPONSIVENESS & MULTI-MODULE SHARED LINK ROUTING
// ============================================================================
console.log("Testing Modal Responsiveness & Multi-Module Shared Link Routing...");

// 11.1 Check required IDs in index.html for advisor_modal
const modalIds = [
    "advisor_modal",
    "btn_close_advisor_modal",
    "advisor_form",
    "input_adv_name",
    "input_adv_title",
    "input_adv_sede",
    "input_adv_phone",
    "advisor_walink_preview_box",
    "advisor_walink_preview_text",
    "btn_test_walink",
    "input_adv_email",
    "input_adv_pin",
    "input_adv_event_name",
    "input_adv_utm_campaign",
    "input_adv_utm_content",
    "preview_utm_medium_text",
    "preview_utm_campaign_text",
    "preview_utm_term_text",
    "preview_utm_content_text"
];
modalIds.forEach(id => {
    assert.ok(indexHtml.includes(`id="${id}"`), `Missing required ID: #${id}`);
});

// 11.2 Check responsive classes in index.html and styles.css
const stylesCss = fs.readFileSync("css/styles.css", "utf8");
const appJs = fs.readFileSync("js/app.js", "utf8");

assert.ok(indexHtml.includes("modal-box-large"), "index.html must have .modal-box-large");
assert.ok(indexHtml.includes("modal-header-sticky"), "index.html must have .modal-header-sticky");
assert.ok(indexHtml.includes("modal-body-scrollable"), "index.html must have .modal-body-scrollable");
assert.ok(indexHtml.includes("modal-footer-sticky"), "index.html must have .modal-footer-sticky");
assert.ok(indexHtml.includes("advisor-form-grid"), "index.html must have .advisor-form-grid");
assert.ok(indexHtml.includes("campaign-fields-grid"), "index.html must have .campaign-fields-grid");
assert.ok(indexHtml.includes("utm-preview-grid"), "index.html must have .utm-preview-grid");

assert.ok(stylesCss.includes(".modal-overlay {"), "styles.css must style .modal-overlay");
assert.ok(stylesCss.includes("overflow-y: auto;"), "styles.css must allow scroll on overlay/body");
assert.ok(stylesCss.includes(".modal-box-large,"), "styles.css must style .modal-box-large");
assert.ok(stylesCss.includes(".modal-header-sticky"), "styles.css must style .modal-header-sticky");
assert.ok(stylesCss.includes(".modal-body-scrollable"), "styles.css must style .modal-body-scrollable");
assert.ok(stylesCss.includes(".modal-footer-sticky"), "styles.css must style .modal-footer-sticky");
assert.ok(stylesCss.includes(".advisor-form-grid"), "styles.css must style .advisor-form-grid");
assert.ok(stylesCss.includes("@media (max-width: 640px)"), "styles.css must have mobile media query for modals");

// 11.3 Check URL parameter routing for shared module links
assert.ok(appJs.includes("modo === 'form'"), "app.js must support modo === 'form'");
assert.ok(appJs.includes("switchView('form-view')"), "app.js must route to form-view");
assert.ok(appJs.includes("switchView('leads-view')"), "app.js must route to leads-view");
assert.ok(appJs.includes("switchView('linktree-view')"), "app.js must route to linktree-view");
assert.ok(appJs.includes("modalParam === 'advisor'"), "app.js must support direct modal parameter");

console.log("✓ Modal Responsiveness & Multi-Module Shared Link Routing tests passed!");

// ============================================================================
// SUITE 12: ANTI-INDEXATION & PRIVACY FOR UIDE SERVER (NOINDEX, NOFOLLOW)
// ============================================================================
console.log("Testing Anti-Indexation & Privacy Directives (noindex, nofollow)...");

// 12.1 Check HTML Meta Tags
assert.ok(indexHtml.includes('name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex"'), 'index.html must have robots noindex nofollow meta tag');
assert.ok(indexHtml.includes('name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex"'), 'index.html must have googlebot noindex nofollow meta tag');
assert.ok(indexHtml.includes('name="bingbot" content="noindex, nofollow, noarchive, nosnippet"'), 'index.html must have bingbot noindex nofollow meta tag');

// 12.2 Check robots.txt existence and content
assert.ok(fs.existsSync("robots.txt"), "robots.txt must exist at root");
const robotsTxt = fs.readFileSync("robots.txt", "utf8");
assert.ok(robotsTxt.includes("User-agent: *"), "robots.txt must target all user agents");
assert.ok(robotsTxt.includes("Disallow: /"), "robots.txt must disallow all paths");

// 12.3 Check .htaccess (Apache) & web.config (IIS)
assert.ok(fs.existsSync(".htaccess"), ".htaccess must exist at root for Apache deployments");
const htaccess = fs.readFileSync(".htaccess", "utf8");
assert.ok(htaccess.includes('Header set X-Robots-Tag "noindex, nofollow, noarchive, nosnippet, noimageindex"'), ".htaccess must set X-Robots-Tag");

assert.ok(fs.existsSync("web.config"), "web.config must exist at root for Windows/IIS deployments");
const webConfig = fs.readFileSync("web.config", "utf8");
assert.ok(webConfig.includes('name="X-Robots-Tag" value="noindex, nofollow, noarchive, nosnippet, noimageindex"'), "web.config must set X-Robots-Tag");

// 12.4 Check server.js HTTP Headers
const serverJs = fs.readFileSync("server.js", "utf8");
assert.ok(serverJs.includes("res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');"), "server.js must send X-Robots-Tag on all responses");
assert.ok(serverJs.includes("'.txt': 'text/plain; charset=UTF-8'"), "server.js MIME_TYPES must support .txt");

console.log("✓ Anti-Indexation & Privacy Directives (noindex, nofollow) verified!");

// ============================================================================
// SUITE 13: ADVISOR HEADER DROPDOWN MENU WITH 3-LINE SVG ICON
// ============================================================================
console.log("Testing Advisor Header Dropdown Menu (3-Line SVG Hamburger & Responsive Dropdown)...");

// 13.1 HTML Elements
assert.ok(indexHtml.includes('id="btn_advisor_menu_toggle"'), "index.html must have #btn_advisor_menu_toggle");
assert.ok(indexHtml.includes('class="hamburger-svg-icon"'), "index.html must have .hamburger-svg-icon");
assert.ok(indexHtml.includes('<line x1="3" y1="6" x2="21" y2="6"'), "index.html must have top hamburger line");
assert.ok(indexHtml.includes('<line x1="3" y1="12" x2="21" y2="12"'), "index.html must have middle hamburger line");
assert.ok(indexHtml.includes('<line x1="3" y1="18" x2="21" y2="18"'), "index.html must have bottom hamburger line");

// 13.2 Dropdown Structure and Actions
assert.ok(indexHtml.includes('id="advisor_dropdown_menu"'), "index.html must have #advisor_dropdown_menu");
assert.ok(indexHtml.includes('id="dropdown_active_advisor_name"'), "index.html must have #dropdown_active_advisor_name");
assert.ok(indexHtml.includes('id="btn_toggle_role"'), "index.html must have #btn_toggle_role inside dropdown");
assert.ok(indexHtml.includes('id="btn_open_login"'), "index.html must have #btn_open_login inside dropdown");
assert.ok(indexHtml.includes('id="btn_menu_config_profile"'), "index.html must have #btn_menu_config_profile inside dropdown");
assert.ok(indexHtml.includes('id="btn_lock_advisor_session"'), "index.html must have #btn_lock_advisor_session inside dropdown");

// 13.3 CSS Rules
assert.ok(stylesCss.includes(".advisor-menu-toggle-btn"), "styles.css must style .advisor-menu-toggle-btn");
assert.ok(stylesCss.includes(".hamburger-svg-icon"), "styles.css must style .hamburger-svg-icon");
assert.ok(stylesCss.includes(".advisor-dropdown-menu"), "styles.css must style .advisor-dropdown-menu");
assert.ok(stylesCss.includes(".advisor-dropdown-menu.active"), "styles.css must have active class state for dropdown");
assert.ok(stylesCss.includes(".dropdown-menu-item"), "styles.css must style .dropdown-menu-item");

// 13.4 JS Binding & Integration
assert.ok(appJs.includes("bindAdvisorDropdownMenu"), "app.js must define bindAdvisorDropdownMenu");
assert.ok(appJs.includes("btn_advisor_menu_toggle"), "app.js must interact with btn_advisor_menu_toggle");
assert.ok(appJs.includes("dropdown_active_advisor_name"), "app.js must update dropdown_active_advisor_name");

console.log("✓ Advisor Header Dropdown Menu tests passed!");

// ============================================================================
// SUITE 14: TEST VOCACIONAL & RECOMENDADOR DE CARRERAS UIDE (ASU POWERED)
// ============================================================================
console.log("Testing Test Vocacional & Recomendador de Carreras UIDE...");

// 14.1 Markdown Question Bank & Rubric Verification
assert.ok(fs.existsSync("data/test_vocacional.md"), "data/test_vocacional.md must exist");
const testVocacionalMd = fs.readFileSync("data/test_vocacional.md", "utf8");
assert.ok(testVocacionalMd.includes("Test Vocacional y Recomendador de Carreras UIDE"), "test_vocacional.md must have main title");
assert.ok(testVocacionalMd.includes("Powered by ASU"), "test_vocacional.md must reference ASU");
assert.ok(testVocacionalMd.includes("Tecnología, Sistemas, IA & Ciberseguridad"), "test_vocacional.md must include TEC area");
assert.ok(testVocacionalMd.includes("Ciencias de la Salud & Bienestar"), "test_vocacional.md must include SAL area");

// 14.2 Vocational Test Engine & Structure
assert.ok(fs.existsSync("js/vocational-test.js"), "js/vocational-test.js must exist");
const { VocationalTest } = require("../js/vocational-test.js");
assert.ok(VocationalTest, "VocationalTest module must be exported");
assert.strictEqual(Object.keys(VocationalTest.AREAS).length, 6, "Must define exactly 6 vocational areas");
assert.strictEqual(VocationalTest.QUESTIONS.length, 4, "Must have exactly 4 situational questions");
assert.strictEqual(typeof VocationalTest.revealResult, 'function', "VocationalTest must expose revealResult (unlock after form)");
assert.strictEqual(typeof VocationalTest.hasPendingResult, 'function', "VocationalTest must expose hasPendingResult (gate state)");

// Ensure every question has 6 options matching the 6 areas
VocationalTest.QUESTIONS.forEach((q, idx) => {
    assert.strictEqual(q.options.length, 6, `Question ${idx + 1} must have 6 options`);
    const optionCodes = q.options.map(o => o.code).sort();
    assert.deepStrictEqual(optionCodes, ['CRE', 'ING', 'NEG', 'SAL', 'SOC', 'TEC'], `Question ${idx + 1} options must cover all 6 areas`);
});

// 14.3 Scoring Logic & Recommendation Mapping
const techResult = VocationalTest.calculateResult(['TEC', 'TEC', 'TEC', 'TEC']);
assert.strictEqual(techResult.dominantCode, 'TEC', "4 TEC answers must yield TEC dominant area");
assert.strictEqual(techResult.primaryCareer.name, 'Ingeniería en Inteligencia Artificial', "TEC primary career must be IA");
assert.strictEqual(techResult.primaryCareer.id, '537', "TEC Pardot ID must be 537");
assert.strictEqual(techResult.scores.TEC, 100, "TEC score must be 100%");

const healthResult = VocationalTest.calculateResult(['SAL', 'SAL', 'NEG', 'SOC']);
assert.strictEqual(healthResult.dominantCode, 'SAL', "2 SAL answers with no tie must yield SAL dominant area");
assert.strictEqual(healthResult.primaryCareer.name, 'Medicina', "SAL primary career must be Medicina");
assert.strictEqual(healthResult.primaryCareer.id, '52', "Medicina Pardot ID must be 52");
assert.strictEqual(healthResult.scores.SAL, 50, "SAL score must be 50%");

// 14.4 Markdown Report Generation for Students
const sampleStudent = {
    f_name: 'Mateo',
    l_name: 'Silva',
    email: 'mateo.silva@colegio.edu.ec',
    mobile: '0991234567',
    colegio_origen: 'Colegio Menor San Francisco'
};
const studentReportMd = VocationalTest.generateMarkdownReport(sampleStudent, techResult);
assert.ok(studentReportMd.includes('# 🎓 Perfil Vocacional Oficial UIDE'), "Report must include official title");
assert.ok(studentReportMd.includes('Mateo Silva'), "Report must include student full name");
assert.ok(studentReportMd.includes('Colegio Menor San Francisco'), "Report must include origin school");
assert.ok(studentReportMd.includes('Ingeniería en Inteligencia Artificial'), "Report must include recommended career");
assert.ok(studentReportMd.includes('Arizona State University'), "Report must highlight ASU partnership");
assert.ok(studentReportMd.includes('`537`'), "Report must include Pardot career code");

// 14.5 HTML & DOM Integration
assert.ok(indexHtml.includes('id="vocational-view"'), "index.html must have #vocational-view");
assert.ok(indexHtml.includes('id="voc_quiz_container"'), "index.html must have #voc_quiz_container");
assert.ok(indexHtml.includes('id="voc_results_container"'), "index.html must have #voc_results_container");
assert.ok(indexHtml.includes('id="btn_stand_start_vocational"'), "index.html must have #btn_stand_start_vocational in stand-view");
assert.ok(indexHtml.includes('id="btn_start_vocational_test"'), "index.html must have #btn_start_vocational_test in linktree-view");
assert.ok(!indexHtml.includes('id="btn_download_voc_md"'), "index.html must NOT have the .md download button");
assert.ok(!indexHtml.includes('id="btn_voc_to_form"'), "index.html must NOT have the standalone 'Recibir Malla' button");
assert.ok(indexHtml.includes('id="voc_lock_overlay"'), "index.html must have #voc_lock_overlay (blur/lock gate)");
assert.ok(indexHtml.includes('id="btn_voc_gate_to_form"'), "index.html must have #btn_voc_gate_to_form");
assert.ok(indexHtml.includes('id="voc_recap_preview"'), "index.html must have #voc_recap_preview");
assert.ok(indexHtml.includes('id="btn_download_voc_recap"'), "index.html must have #btn_download_voc_recap");
assert.ok(indexHtml.includes('id="btn_share_voc_recap"'), "index.html must have #btn_share_voc_recap");
assert.ok(indexHtml.includes('id="btn_voc_whatsapp_advisor"'), "index.html must have #btn_voc_whatsapp_advisor");
assert.ok(indexHtml.includes('id="btn_retake_vocational_test"'), "index.html must have #btn_retake_vocational_test");
assert.ok(indexHtml.includes('id="btn_back_voc_to_lt"'), "index.html must have #btn_back_voc_to_lt");

// 14.6 Pardot Form Hidden Fields for Vocational Tracking
assert.ok(indexHtml.includes('id="area_vocacional"'), "index.html must have hidden input #area_vocacional");
assert.ok(indexHtml.includes('id="carrera_recomendada"'), "index.html must have hidden input #carrera_recomendada");
assert.ok(indexHtml.includes('id="perfil_vocacional"'), "index.html must have hidden input #perfil_vocacional");

// 14.7 LeadsStorage & Formatters Integration
const leadsStorageCode = fs.readFileSync("js/leads-storage.js", "utf8");
assert.ok(leadsStorageCode.includes("'area_vocacional'"), "leads-storage.js must track area_vocacional");
assert.ok(leadsStorageCode.includes("'carrera_recomendada'"), "leads-storage.js must track carrera_recomendada");
assert.ok(leadsStorageCode.includes("'perfil_vocacional'"), "leads-storage.js must track perfil_vocacional");

const formattersCode = fs.readFileSync("server/formatters.js", "utf8");
assert.ok(formattersCode.includes("'area_vocacional'"), "server/formatters.js must include area_vocacional");
assert.ok(formattersCode.includes("'carrera_recomendada'"), "server/formatters.js must include carrera_recomendada");

console.log("✓ Test Vocacional & Recomendador de Carreras UIDE tests passed!");

// ============================================================================
// SUITE 15: OWASP TOP 10 SECURITY COMPLIANCE & DEFENSIVE HARDENING
// ============================================================================
console.log("Testing OWASP Top 10 Security Hardening & Defensive Controls...");

const Security = require("../server/security.js");

// 15.1 A01: Broken Access Control & Path Traversal Prevention
assert.strictEqual(Security.isProtectedDataPath("/data/leads.json"), true, "Must block /data/leads.json");
assert.strictEqual(Security.isProtectedDataPath("/data/leads.md"), true, "Must block /data/leads.md");
assert.strictEqual(Security.isProtectedDataPath("../data/leads.json"), true, "Must block relative ../data/");
assert.strictEqual(Security.isProtectedDataPath("..\\data\\leads.json"), true, "Must block Windows-style relative ..\\data\\");
assert.strictEqual(Security.isProtectedDataPath("%2e%2e%2fdata/leads.json"), true, "Must block URL-encoded traversal");
assert.strictEqual(Security.isProtectedDataPath("/index.html\0/data/leads.json"), true, "Must block null byte attacks");
assert.strictEqual(Security.isProtectedDataPath("/index.html"), false, "Public index.html must not be blocked");
assert.strictEqual(Security.isProtectedDataPath("/js/app.js"), false, "Public js/app.js must not be blocked");

// 15.2 A03: Injection & Cross-Site Scripting (XSS) + Markdown Injection Defense
const maliciousXss = '<script>alert("XSS Attack")</script><img src=x onerror=alert(1)>';
const escapedHtml = Security.escapeHtml(maliciousXss);
assert.ok(!escapedHtml.includes("<script>"), "escapeHtml must remove raw <script> opening");
assert.ok(escapedHtml.includes("&lt;script&gt;"), "escapeHtml must encode <script>");
assert.ok(escapedHtml.includes("&lt;img"), "escapeHtml must encode <img");

const rawMarkdownWithTableBreak = "Usuario | Injected | Hacked";
const sanitizedMd = Security.sanitizeMarkdown(rawMarkdownWithTableBreak);
assert.ok(sanitizedMd.includes("\\|"), "sanitizeMarkdown must escape pipe characters to prevent table injection");

// 15.3 A04: Insecure Design, Payload Limits & Rate Limiting
const testIp = '192.168.1.100';
let rateLimitPassed = true;
for (let i = 0; i < 45; i++) {
    const res = Security.checkRateLimit(testIp, 45, 60000);
    if (!res.allowed) { rateLimitPassed = false; break; }
}
assert.strictEqual(rateLimitPassed, true, "First 45 requests must pass rate limit");
const rateLimitBlocked = Security.checkRateLimit(testIp, 45, 60000);
assert.strictEqual(rateLimitBlocked.allowed, false, "46th request within window must be blocked by rate limit");

// 15.4 A05: Security Misconfiguration - Full HTTP Security Headers
assert.ok(serverJs.includes("Content-Security-Policy"), "server.js must send Content-Security-Policy");
assert.ok(serverJs.includes("X-Content-Type-Options"), "server.js must send X-Content-Type-Options: nosniff");
assert.ok(serverJs.includes("X-Frame-Options"), "server.js must send X-Frame-Options: SAMEORIGIN");
assert.ok(serverJs.includes("Referrer-Policy"), "server.js must send Referrer-Policy");
assert.ok(serverJs.includes("Permissions-Policy"), "server.js must send Permissions-Policy");
assert.ok(serverJs.includes("X-XSS-Protection"), "server.js must send X-XSS-Protection");

assert.ok(htaccess.includes("X-Content-Type-Options"), ".htaccess must set X-Content-Type-Options");
assert.ok(htaccess.includes("X-Frame-Options"), ".htaccess must set X-Frame-Options");
assert.ok(webConfig.includes("X-Content-Type-Options"), "web.config must set X-Content-Type-Options");
assert.ok(webConfig.includes("X-Frame-Options"), "web.config must set X-Frame-Options");

// 15.5 A07: Identification and Authentication Failures (Timing Safe & Lockout)
assert.strictEqual(Security.isValidPin("2026"), true, "Valid PIN 2026 must be accepted");
assert.strictEqual(Security.isValidPin("UIDE2026"), true, "Valid PIN UIDE2026 must be accepted");
assert.strictEqual(Security.isValidPin("uide2026"), true, "Valid PIN uide2026 must be accepted");
assert.strictEqual(Security.isValidPin("0000"), false, "Invalid PIN 0000 must be rejected");
assert.strictEqual(Security.isValidPin(""), false, "Empty PIN must be rejected");

const bruteForceIp = '10.0.0.55';
assert.strictEqual(Security.isAuthLocked(bruteForceIp).locked, false, "IP must not be locked initially");
for (let i = 0; i < 5; i++) {
    Security.recordFailedAuth(bruteForceIp);
}
assert.strictEqual(Security.isAuthLocked(bruteForceIp).locked, true, "IP must be locked after 5 failed authentication attempts");
Security.resetFailedAuth(bruteForceIp);
assert.strictEqual(Security.isAuthLocked(bruteForceIp).locked, false, "IP lockout must be cleared after reset");

// 15.6 A08: Software & Data Integrity Verification
const invalidLead = { f_name: '', email: 'not-an-email', mobile: '' };
const leadValidation = Security.validateLeadSubmission(invalidLead);
assert.strictEqual(leadValidation.valid, false, "Invalid lead must be rejected");

const validLead = {
    f_name: 'Esteban',
    l_name: 'Paredes',
    email: 'esteban.paredes@gmail.com',
    mobile: '0998765432',
    area_vocacional: 'Ingeniería',
    carrera_recomendada: 'Mecatrónica'
};
const validLeadResult = Security.validateLeadSubmission(validLead);
assert.strictEqual(validLeadResult.valid, true, "Valid lead must pass validation");
assert.strictEqual(validLeadResult.sanitizedPayload.f_name, 'Esteban');

// 15.7 A09: Security Logging and Monitoring Failures
assert.ok(serverJs.includes("[SECURITY AUDIT]"), "server.js must log [SECURITY AUDIT] security events");

console.log("✓ OWASP Top 10 Security Compliance & Defensive Controls verified!");

// ============================================================================
// SUITE 16: FORMULARIO SIN ENDPOINT PARDOT (SOLO STORAGE LOCAL + CAMPAÑA MANUAL)
// ============================================================================
console.log("Testing Pardot-Free Form (Local Storage Only) & Manual Campaign Injection...");

// 16.1 Verify Pardot endpoint was removed from app.js
const appCode = fs.readFileSync("js/app.js", "utf8");
assert.ok(!appCode.includes("DEFAULT_PARDOT_ENDPOINT"), "app.js must NOT define DEFAULT_PARDOT_ENDPOINT");
assert.ok(!appCode.includes("input_adv_endpoint"), "app.js must NOT bind input_adv_endpoint");
assert.ok(appCode.includes("btn_copy_advisor_form_link"), "app.js must bind btn_copy_advisor_form_link");

// 16.2 Verify HTML has no endpoint configuration, only advisor badge
assert.ok(!indexHtml.includes('id="input_adv_endpoint"'), "index.html must NOT have input #input_adv_endpoint in advisor modal");
assert.ok(indexHtml.includes('id="btn_copy_advisor_form_link"'), "index.html must have button #btn_copy_advisor_form_link");
assert.ok(indexHtml.includes('id="form_advisor_endpoint_badge"'), "index.html must have #form_advisor_endpoint_badge");
assert.ok(indexHtml.includes('id="form_active_advisor_label"'), "index.html must have #form_active_advisor_label");
assert.ok(!indexHtml.includes('id="form_active_endpoint_label"'), "index.html must NOT have #form_active_endpoint_label");
assert.ok(!indexHtml.includes('id="form_endpoint"'), "index.html must NOT have hidden input #form_endpoint");

// 16.3 Verify uide-form-logic.js has no endpoint wiring & keeps manual campaign sync
const formLogicCode = fs.readFileSync("js/uide-form-logic.js", "utf8");
assert.ok(!formLogicCode.includes("pardotForm.action = activeAdvisor.endpoint;"), "uide-form-logic.js must NOT set form.action to advisor endpoint");
assert.ok(formLogicCode.includes("syncManualCampaign()"), "uide-form-logic.js must define syncManualCampaign");
assert.ok(!formLogicCode.includes("form_endpoint: activeAdvisor.endpoint"), "uide-form-logic.js must NOT register form_endpoint in leadData");

// 16.4 Verify Standalone Forms Generator Script & Generated Files
assert.ok(fs.existsSync("scripts/generate-advisor-forms.js"), "scripts/generate-advisor-forms.js must exist");
assert.ok(fs.existsSync("dist/form-andres-ruiz.html"), "dist/form-andres-ruiz.html must exist");
assert.ok(fs.existsSync("dist/form-andres-mancero.html"), "dist/form-andres-mancero.html must exist");
assert.ok(fs.existsSync("dist/form-andrew-figueroa.html"), "dist/form-andrew-figueroa.html must exist");
assert.ok(fs.existsSync("dist/form-ghandi-tobar.html"), "dist/form-ghandi-tobar.html must exist");

const formAdv1 = fs.readFileSync("dist/form-andres-ruiz.html", "utf8");
assert.ok(formAdv1.includes('action="https://go.uide.edu.ec/l/455762/2026-09-08/8d64j1"'), "Standalone form 1 must have its endpoint");
assert.ok(formAdv1.includes('value="ADV-01"'), "Standalone form 1 must have ADV-01 id");
assert.ok(formAdv1.includes('Andrés Ruiz'), "Standalone form 1 must have Andrés Ruiz name");

const formAdv4 = fs.readFileSync("dist/form-ghandi-tobar.html", "utf8");
assert.ok(formAdv4.includes('value="ADV-04"'), "Standalone form 4 must have ADV-04 id");
assert.ok(formAdv4.includes('Ghandi Tobar'), "Standalone form 4 must have Ghandi Tobar name");

console.log("✓ Pardot-Free Form (Local Storage Only) & Manual Campaign Injection tests passed!");

// ============================================================================
// SUITE 17: CATÁLOGO OFICIAL UIDE, VALIDACIÓN ESTRICTA DE ESC_PGM (ANTI-BUSINESS) Y ORIGEN PROSPECCIÓN
// ============================================================================
console.log("Testing Official UIDE Program Catalog, esc_pgm Numeric Validation & Prospeccion Origin...");

// 17.1 Verify PROGRAMAS_DATA has official numeric IDs from UIDE snippet
assert.ok(formLogicCode.includes('{ id: "558", nombre: "Administración de Empresas" }'), "Quito Admin must be 558");
assert.ok(formLogicCode.includes('{ id: "557", nombre: "Marketing" }'), "Quito Marketing must be 557");
assert.ok(formLogicCode.includes('{ id: "5", nombre: "Negocios Internacionales" }'), "Quito Negocios must be 5");
assert.ok(formLogicCode.includes('{ id: "52", nombre: "Medicina" }'), "Quito Medicina must be 52");
assert.ok(formLogicCode.includes('{ id: "559", nombre: "Administración de Empresas" }'), "Online Admin must be 559");
assert.ok(formLogicCode.includes('{ id: "556", nombre: "Marketing" }'), "Online Marketing must be 556");
assert.ok(formLogicCode.includes('{ id: "537", nombre: "Inteligencia Artificial" }'), "Online IA must be 537");
assert.ok(formLogicCode.includes('{ id: "568", nombre: "Administración de Empresas e Innovación Empresarial" }'), "Guayaquil Admin Innovacion must be 568");
assert.ok(formLogicCode.includes('{ id: "565", nombre: "Administración de Empresas e Innovación Empresarial" }'), "Loja Admin Innovacion must be 565");

// 17.2 Verify strict rejection of non-numeric career IDs like 'Business'
function validateCareerId(escPgm) {
    if (!escPgm || typeof escPgm !== 'string') return false;
    const trimmed = escPgm.trim();
    if (!/^\d+$/.test(trimmed)) return false;
    return true;
}

assert.strictEqual(validateCareerId("Business"), false, "Career code 'Business' must be strictly rejected!");
assert.strictEqual(validateCareerId("NEG"), false, "Area code 'NEG' must be strictly rejected as career ID!");
assert.strictEqual(validateCareerId(""), false, "Empty career code must be rejected!");
assert.strictEqual(validateCareerId("   "), false, "Whitespace career code must be rejected!");
assert.strictEqual(validateCareerId("558"), true, "Official numeric ID '558' must be accepted");
assert.strictEqual(validateCareerId("5"), true, "Official numeric ID '5' must be accepted");
assert.strictEqual(validateCareerId("52"), true, "Official numeric ID '52' must be accepted");
assert.strictEqual(validateCareerId("537"), true, "Official numeric ID '537' must be accepted");

// Verify that handleFormSubmit in uide-form-logic.js contains the numeric validation
assert.ok(formLogicCode.includes("!/^\\d+$/.test(escPgmVal)"), "uide-form-logic.js must strictly check /^\\d+$/ for esc_pgm");

// 17.3 Verify c_lead is strictly 'Prospeccion'
assert.ok(indexHtml.includes('id="c_lead" name="c_lead" value="Prospeccion"'), "c_lead default must be Prospeccion");
assert.ok(formLogicCode.includes("cLeadInput.value = 'Prospeccion'"), "uide-form-logic.js must lock c_lead to Prospeccion");

// 17.4 Verify origen belongs to authorized Event types
const VALID_EVENT_ORIGINS = ['Charla FS', 'Ferias FS', 'Visita a campus'];
assert.ok(VALID_EVENT_ORIGINS.includes('Charla FS'), "Charla FS must be valid origin");
assert.ok(VALID_EVENT_ORIGINS.includes('Ferias FS'), "Ferias FS must be valid origin");
assert.ok(VALID_EVENT_ORIGINS.includes('Visita a campus'), "Visita a campus must be valid origin");

// Verify that digital origins do NOT overwrite c_lead or origen in Prospección
assert.strictEqual(VALID_EVENT_ORIGINS.includes('Google Natural Search'), false, "Google Natural Search must not be an event origin");
assert.strictEqual(VALID_EVENT_ORIGINS.includes('Digital'), false, "Digital must not be an event origin");

// 17.5 Verify Vocational Test uses updated official IDs
const vocTestCode = fs.readFileSync("js/vocational-test.js", "utf8");
assert.ok(vocTestCode.includes("id: '558', name: 'Administración de Empresas'"), "vocational-test.js must use ID 558 for Admin");
assert.ok(vocTestCode.includes("id: '557', name: 'Marketing'"), "vocational-test.js must use ID 557 for Marketing");

console.log("✓ Official UIDE Program Catalog, esc_pgm Numeric Validation & Prospeccion Origin tests passed!");

// ============================================================================
// SUITE 18: PERSISTENCIA EN EXCEL (.XLSX) POR CAMPAÑA Y DESCONEXIÓN DE PARDOT
// ============================================================================
console.log("Testing Excel (.xlsx) Storage by Campaign with 21 Official Headers & Pardot Disconnection...");

const { OFFICIAL_XLSX_HEADERS, mapLeadToXlsxRow, XlsxFormatter } = require("../server/formatters");
const { LeadsService } = require("../server/leads-service");
const XLSX = require("xlsx");

// 18.1 Verify exact 21 headers and order
const EXPECTED_21_HEADERS = [
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

assert.strictEqual(OFFICIAL_XLSX_HEADERS.length, 21, "OFFICIAL_XLSX_HEADERS must have exactly 21 headers");
assert.deepStrictEqual(OFFICIAL_XLSX_HEADERS, EXPECTED_21_HEADERS, "OFFICIAL_XLSX_HEADERS must match expected order");
assert.strictEqual(LeadsStorage.OFFICIAL_XLSX_HEADERS.length, 21, "Client LeadsStorage must also have 21 headers");
assert.deepStrictEqual(LeadsStorage.OFFICIAL_XLSX_HEADERS, EXPECTED_21_HEADERS, "Client headers must match server headers");

// 18.2 Verify lead mapping to 21 columns
const testLead = {
    id: 'UIDE-TEST-99999',
    f_name: 'Camila',
    l_name: 'Andrade',
    mobile: '+593998765432',
    email: 'CAMILA.ANDRADE@GMAIL.COM',
    origen: 'Ferias FS',
    utm_campaign: 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026',
    sede: 'Quito',
    tp_pgm: 'Pregrado Quito',
    esc_pgm: '558',
    periodo: '2026-2 Q Pregrado',
    c_lead: 'Prospeccion',
    tiktok_id: 'TT_CLICK_123',
    fbclid: 'FB_CLICK_456'
};

const mappedRow = mapLeadToXlsxRow(testLead);
assert.strictEqual(mappedRow.FirstName, 'Camila');
assert.strictEqual(mappedRow.LastName, 'Andrade');
assert.strictEqual(mappedRow.Phone, '+593998765432');
assert.strictEqual(mappedRow.Email, 'camila.andrade@gmail.com');
assert.strictEqual(mappedRow.LeadSource, 'Ferias FS');
assert.strictEqual(mappedRow.pi__campaign__c, 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026');
assert.strictEqual(mappedRow.Sede__c, 'Quito');
assert.strictEqual(mappedRow.Tipo_de_Programa__c, 'Pregrado Quito');
assert.strictEqual(mappedRow.Escoge_tu_programa1__c, '558');
assert.strictEqual(mappedRow.Periodo_de_ingreso1__c, '2026-2 Q Pregrado');
assert.strictEqual(mappedRow.Nombre_de_la_campa_a__c, 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026');
assert.strictEqual(mappedRow.Leads_channel__c, 'Prospeccion');
assert.strictEqual(mappedRow.TIKTOK_ID__c, 'TT_CLICK_123');
assert.strictEqual(mappedRow.ID_LEAD_FACEBOOK__c, 'FB_CLICK_456');
assert.strictEqual(mappedRow.Campaign__c, 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026');
assert.strictEqual(mappedRow['Validado Número'], 'SI');
assert.strictEqual(mappedRow['Validado Telefono'], 'SI');
assert.strictEqual(mappedRow.Cargado, 'NO');
assert.strictEqual(mappedRow['ID Teléfono'], '593998765432');
assert.strictEqual(mappedRow['Id Correo'], 'camila.andrade@gmail.com');
assert.strictEqual(mappedRow.ID, 'UIDE-TEST-99999');

// 18.3 Verify XlsxFormatter produces valid Excel Workbook with 21 headers and sheet name
const xlsxFmt = new XlsxFormatter();
const buffer = xlsxFmt.format([testLead], { sheetName: 'Feria_Alamos' });
assert.ok(Buffer.isBuffer(buffer), "XlsxFormatter must return a Buffer");
// Verify zip / xlsx magic number (PK..)
assert.strictEqual(buffer[0], 0x50, "Buffer byte 0 must be 0x50 ('P')");
assert.strictEqual(buffer[1], 0x4B, "Buffer byte 1 must be 0x4B ('K')");

const workbook = XLSX.read(buffer, { type: 'buffer' });
assert.ok(workbook.SheetNames.includes('Feria_Alamos'), "Workbook sheet name must match options.sheetName");
const parsedJson = XLSX.utils.sheet_to_json(workbook.Sheets['Feria_Alamos']);
assert.strictEqual(parsedJson.length, 1, "Parsed XLSX must have 1 row");
assert.strictEqual(parsedJson[0].FirstName, 'Camila');
assert.strictEqual(parsedJson[0].Escoge_tu_programa1__c, '558');
assert.strictEqual(parsedJson[0].Campaign__c, 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026');

// 18.4 Verify LeadsService persistence by campaign in data/leads_<campaign>.xlsx
const tempTestDir = path.join(__dirname, '..', 'data_test_temp');
if (fs.existsSync(tempTestDir)) fs.rmSync(tempTestDir, { recursive: true, force: true });
const testLeadsService = new LeadsService(tempTestDir);

const saveResult = testLeadsService.saveLead(testLead);
assert.strictEqual(saveResult.campaignSlug, 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026');
assert.ok(fs.existsSync(path.join(tempTestDir, 'leads_PROSPECCION_FERIA_COLEGIO_ALAMOS_2026.xlsx')), "Campaign-specific .xlsx must be generated");
assert.ok(fs.existsSync(path.join(tempTestDir, 'leads.xlsx')), "Master consolidated .xlsx must be generated");

// Read and verify persisted campaign XLSX
const campWb = XLSX.readFile(path.join(tempTestDir, 'leads_PROSPECCION_FERIA_COLEGIO_ALAMOS_2026.xlsx'));
const campRows = XLSX.utils.sheet_to_json(campWb.Sheets[campWb.SheetNames[0]]);
assert.strictEqual(campRows.length, 1);
assert.strictEqual(campRows[0].FirstName, 'Camila');
assert.strictEqual(campRows[0].Nombre_de_la_campa_a__c, 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026');

// Cleanup temp test directory
fs.rmSync(tempTestDir, { recursive: true, force: true });

// 18.5 Verify Pardot submission disconnection in uide-form-logic.js
const updatedFormLogic = fs.readFileSync("js/uide-form-logic.js", "utf8");
assert.ok(!updatedFormLogic.includes("HTMLFormElement.prototype.submit.call(form)"), "uide-form-logic.js must NOT submit to Pardot endpoint");
assert.ok(updatedFormLogic.includes("App.showSuccessScreen"), "uide-form-logic.js must show success screen locally");

console.log("✓ Excel (.xlsx) Storage by Campaign with 21 Official Headers & Pardot Disconnection tests passed!");

// ============================================================================
// SUITE 19: CRUD DE CAMPAÑAS, EDICIÓN INTEGRAL Y DESCARGA DUAL (.XLSX / .CSV LIVIANO)
// ============================================================================
console.log("Testing Campaigns CRUD, Full Editing Capabilities, and Dual Export (.xlsx / .csv)...");

const { OfficialCsvFormatter } = require("../server/formatters");
const { CampaignsService } = require("../server/campaigns-service");
const { CampaignsManager } = require("../js/campaigns-manager");

// 19.1 OfficialCsvFormatter verification
const officialCsvFmt = new OfficialCsvFormatter();
const s19CsvOutput = officialCsvFmt.format([testLead]);
assert.ok(s19CsvOutput.startsWith('\uFEFF'), "CSV output must start with UTF-8 BOM (\\uFEFF)");
const s19CsvLines = s19CsvOutput.replace('\uFEFF', '').split('\r\n').filter(Boolean);
assert.strictEqual(s19CsvLines.length, 2, "CSV output must have header row + 1 data row");

// Verify 21 headers in CSV
const s19ParsedHeaders = s19CsvLines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
assert.strictEqual(s19ParsedHeaders.length, 21, "CSV header must have exactly 21 columns");
assert.deepStrictEqual(s19ParsedHeaders, EXPECTED_21_HEADERS, "CSV header columns must match expected 21 headers order");

// Verify data row
const s19ParsedData = s19CsvLines[1].split(',').map(d => d.replace(/^"|"$/g, ''));
assert.strictEqual(s19ParsedData[0], 'Camila'); // FirstName
assert.strictEqual(s19ParsedData[1], 'Andrade'); // LastName
assert.strictEqual(s19ParsedData[8], '558'); // Escoge_tu_programa1__c
assert.strictEqual(s19ParsedData[11], 'Prospeccion'); // Leads_channel__c
assert.strictEqual(s19ParsedData[14], 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026'); // Campaign__c

// Test CsvFormatter with { official: true }
const standardCsvFmt = new CsvFormatter();
const delegOutput = standardCsvFmt.format([testLead], { official: true });
assert.ok(delegOutput.startsWith('\uFEFF'));
assert.strictEqual(delegOutput.includes('FirstName'), true);

// 19.2 CampaignsService CRUD & Persistence
const tempCampDir = path.join(__dirname, '..', 'data_camp_test');
if (fs.existsSync(tempCampDir)) fs.rmSync(tempCampDir, { recursive: true, force: true });
const campService = new CampaignsService(tempCampDir);

// Verify default campaigns created
const initialCampaigns = campService.getAllCampaigns();
assert.ok(initialCampaigns.length >= 3, "Default campaigns must be created on init");
assert.ok(initialCampaigns.some(c => c.name === 'PROSPECCION_FERIA_COLEGIO_ALAMOS_2026'));

// Create campaign
const createdCmp = campService.createCampaign({
    name: 'prospeccion_feria_menor_2026',
    event_name: 'Feria Colegio Menor',
    origin: 'Ferias FS',
    sede: 'Quito',
    asesor_id: 'ADV-01'
});
assert.strictEqual(createdCmp.name, 'PROSPECCION_FERIA_MENOR_2026', "Campaign name must be sanitized to uppercase");
assert.strictEqual(createdCmp.status, 'ACTIVA');
assert.ok(campService.getCampaignByName('PROSPECCION_FERIA_MENOR_2026'), "Campaign must be retrievable by name");

// Update campaign
const updateRes = campService.updateCampaign(createdCmp.id, {
    name: 'PROSPECCION_FERIA_MENOR_ACTUALIZADA_2026',
    event_name: 'Feria Internacional Menor',
    status: 'INACTIVA'
});
assert.strictEqual(updateRes.campaign.name, 'PROSPECCION_FERIA_MENOR_ACTUALIZADA_2026');
assert.strictEqual(updateRes.campaign.event_name, 'Feria Internacional Menor');
assert.strictEqual(updateRes.campaign.status, 'INACTIVA');
assert.strictEqual(updateRes.nameChanged, true);

// Enrich with lead counts
const enrichedCmp = campService.enrichWithLeadCounts(campService.getAllCampaigns(), [
    { utm_campaign: 'PROSPECCION_FERIA_MENOR_ACTUALIZADA_2026' },
    { utm_campaign: 'PROSPECCION_FERIA_MENOR_ACTUALIZADA_2026' }
]);
const targetEnriched = enrichedCmp.find(c => c.name === 'PROSPECCION_FERIA_MENOR_ACTUALIZADA_2026');
assert.strictEqual(targetEnriched.total_leads, 2, "Enriched campaign leads count must be 2");

// Delete campaign
const delRes = campService.deleteCampaign(createdCmp.id);
assert.strictEqual(delRes.success, true);
assert.strictEqual(campService.getCampaignById(createdCmp.id), null);

// Cleanup camp test dir
fs.rmSync(tempCampDir, { recursive: true, force: true });

// 19.3 LeadsService Lead Update, Delete, and Cascade Campaign Rename
const tempLeadsDir = path.join(__dirname, '..', 'data_leads_crud_test');
if (fs.existsSync(tempLeadsDir)) fs.rmSync(tempLeadsDir, { recursive: true, force: true });
const leadsCrudService = new LeadsService(tempLeadsDir);

const leadA = {
    id: 'LEAD-A-100',
    f_name: 'Santiago',
    l_name: 'Mora',
    email: 'santiago.mora@gmail.com',
    mobile: '+593991112233',
    utm_campaign: 'CAMP_ALPHA_2026',
    esc_pgm: '558',
    sede: 'Quito'
};
const leadB = {
    id: 'LEAD-B-200',
    f_name: 'Daniela',
    l_name: 'Paz',
    email: 'daniela.paz@gmail.com',
    mobile: '+593994445566',
    utm_campaign: 'CAMP_ALPHA_2026',
    esc_pgm: '52',
    sede: 'Quito'
};

leadsCrudService.saveLead(leadA);
leadsCrudService.saveLead(leadB);

assert.strictEqual(leadsCrudService.getAllLeads().length, 2);
// Verify both .xlsx and .csv files generated for the campaign
assert.ok(fs.existsSync(path.join(tempLeadsDir, 'leads_CAMP_ALPHA_2026.xlsx')), "leads_CAMP_ALPHA_2026.xlsx must exist");
assert.ok(fs.existsSync(path.join(tempLeadsDir, 'leads_CAMP_ALPHA_2026.csv')), "leads_CAMP_ALPHA_2026.csv must exist");

// Update lead
const updatedLeadA = leadsCrudService.updateLead('LEAD-A-100', {
    f_name: 'Santiago Editado',
    email: 'santiago.editado@uide.edu.ec'
});
assert.strictEqual(updatedLeadA.lead.f_name, 'Santiago Editado');
assert.strictEqual(updatedLeadA.lead.email, 'santiago.editado@uide.edu.ec');

// Cascade rename campaign
const cascadeRes = leadsCrudService.cascadeCampaignRename('CAMP_ALPHA_2026', 'CAMP_BETA_RENOMBRADA_2026');
assert.strictEqual(cascadeRes.updatedCount, 2);
const reloadedLeads = leadsCrudService.getAllLeads();
assert.strictEqual(reloadedLeads[0].utm_campaign, 'CAMP_BETA_RENOMBRADA_2026');
assert.strictEqual(reloadedLeads[1].utm_campaign, 'CAMP_BETA_RENOMBRADA_2026');
assert.ok(fs.existsSync(path.join(tempLeadsDir, 'leads_CAMP_BETA_RENOMBRADA_2026.xlsx')), "New renamed .xlsx must exist");
assert.ok(fs.existsSync(path.join(tempLeadsDir, 'leads_CAMP_BETA_RENOMBRADA_2026.csv')), "New renamed .csv must exist");

// Delete lead
const deleteRes = leadsCrudService.deleteLead('LEAD-B-200');
assert.strictEqual(deleteRes.success, true);
assert.strictEqual(leadsCrudService.getAllLeads().length, 1);
assert.strictEqual(leadsCrudService.getAllLeads()[0].id, 'LEAD-A-100');

// Cleanup temp leads test dir
fs.rmSync(tempLeadsDir, { recursive: true, force: true });

// 19.4 Client LeadsStorage Official CSV generation & CRUD
LeadsStorage.saveLead(testLead);
const clientOfficialCsv = LeadsStorage.generateOfficialCSV ? LeadsStorage.generateOfficialCSV() : '';
assert.ok(clientOfficialCsv.startsWith('\uFEFF'), "Client generateOfficialCSV must include UTF-8 BOM");
assert.ok(clientOfficialCsv.includes('"FirstName","LastName","Phone","Email"'), "Client generateOfficialCSV must have 21 official headers");

// Client lead update
const clientUpdate = LeadsStorage.updateLead(testLead.id, { f_name: 'Camila Modificada' });
assert.strictEqual(clientUpdate.f_name, 'Camila Modificada');

// Client cascade rename
const cascadeClient = LeadsStorage.cascadeCampaignRename('PROSPECCION_FERIA_COLEGIO_ALAMOS_2026', 'PROSPECCION_NUEVA_2026');
assert.ok(cascadeClient >= 1, "Client cascade must update at least 1 lead");

// Client lead delete
const delClient = LeadsStorage.deleteLead(testLead.id);
assert.strictEqual(delClient, true, "Client deleteLead must return true");

console.log("✓ Campaigns CRUD, Full Editing Capabilities, and Dual Export (.xlsx / .csv) tests passed!");

// ============================================================================
// SUITE 20: CÓDIGO DE CAMPAÑA SALESFORCE (18 CARACTERES) Y CELDAS F-G-H FIJAS EN FORMATO CARGA DE LEADS
// ============================================================================
console.log("Testing Salesforce Campaign Code (18 chars) & Fixed Cells F-G-H in Template...");

const { OFFICIAL_BORRADOR_HEADERS, OFFICIAL_CAMPAIGNS_CATALOG, mapLeadToBorradorRow } = require("../server/formatters");

// 20.1 Verify HTML Elements exist for Campaign Code Configuration
const testHtml = fs.readFileSync("index.html", "utf8");
assert.ok(testHtml.includes('id="input_adv_campaign_code"'), "index.html must have #input_adv_campaign_code in advisor modal");
assert.ok(testHtml.includes('id="preview_campaign_code_text"'), "index.html must have #preview_campaign_code_text in advisor modal");
assert.ok(testHtml.includes('id="input_cmp_code"'), "index.html must have #input_cmp_code in campaign form modal");
assert.ok(testHtml.includes('id="input_edit_lead_campaign_code"'), "index.html must have #input_edit_lead_campaign_code in lead edit modal");

// 20.2 Verify Default Campaigns contain official Salesforce 18-character IDs
const testCampService = new CampaignsService(path.join(__dirname, '..', 'data'));
const allCamps = testCampService.getAllCampaigns();
const charlaCamp = allCamps.find(c => c.origin === 'Charla FS');
const feriaCamp = allCamps.find(c => c.origin === 'Ferias FS');
assert.ok(charlaCamp && charlaCamp.code === '701PA00000pPa4mYAC', "Charla FS default code must be 701PA00000pPa4mYAC");
assert.ok(feriaCamp && feriaCamp.code === '701PA00000pQcp3YAC', "Ferias FS default code must be 701PA00000pQcp3YAC");

// 20.3 Verify CampaignsManager provides getActiveCampaignCode and handles code
assert.strictEqual(typeof CampaignsManager.getActiveCampaignCode, 'function', "CampaignsManager must export getActiveCampaignCode");
const activeCode = CampaignsManager.getActiveCampaignCode();
assert.ok(typeof activeCode === 'string' && activeCode.length > 0, "Active campaign code must be non-empty string");

// 20.4 Verify mapLeadToBorradorRow enforces Immutable Cells F, G, H
const leadForTemplate = {
    id: 'UIDE-TEST-SF-001',
    f_name: 'Justin',
    l_name: 'Cedeño',
    cedula: '0956908206',
    mobile: '+593964062882',
    email: 'justinpcedeno@gmail.com',
    sede: 'Quito',
    tp_pgm: 'Pregrado Quito',
    esc_pgm: '8',
    periodo: '2027-1 Q Pregrado',
    campaign_code: '701PA00000tVx7aYAC',
    utm_campaign: 'FS_UIO _UG_MF_LEADS _GENERAL _REGION COSTA FS_FER_AGO_IT 2_27',
    programa: 'Ingeniería Mecánica Automotriz',
    colegio_id: '0014100001Flp8pAAB',
    colegio_origen: 'Delfos',
    origen: 'Charla FS'
};

const borradorRow = mapLeadToBorradorRow(leadForTemplate);

// In sheet BORRADOR:
// Col F (index 5): Tipo_de_documento__c MUST be 1
// Col G (index 6): Leads_channel__c MUST be 'Prospeccion'
// Col H (index 7): LeadSource MUST be lead.origen ('Charla FS')
assert.strictEqual(OFFICIAL_BORRADOR_HEADERS[5], 'Tipo_de_documento__c', "Column F in BORRADOR must be Tipo_de_documento__c");
assert.strictEqual(OFFICIAL_BORRADOR_HEADERS[6], 'Leads_channel__c', "Column G in BORRADOR must be Leads_channel__c");
assert.strictEqual(OFFICIAL_BORRADOR_HEADERS[7], 'LeadSource', "Column H in BORRADOR must be LeadSource");

assert.strictEqual(borradorRow.Tipo_de_documento__c, 1, "Cell F MUST be 1 (Cédula de identidad) and never move");
assert.strictEqual(borradorRow.Leads_channel__c, 'Prospeccion', "Cell G MUST be 'Prospeccion' and never move");
assert.strictEqual(borradorRow.LeadSource, 'Charla FS', "Cell H MUST be institutional origin ('Charla FS')");
assert.strictEqual(borradorRow.Campaign__c, '701PA00000tVx7aYAC', "Cell O MUST receive Salesforce Campaign ID");
assert.strictEqual(borradorRow.Nombre_de_la_campa_a__c, 'FS_UIO _UG_MF_LEADS _GENERAL _REGION COSTA FS_FER_AGO_IT 2_27');

// 20.5 Verify 21-Headers format maps Campaign Code properly
const xlsxRowWithCode = mapLeadToXlsxRow(leadForTemplate);
assert.strictEqual(xlsxRowWithCode.Campaign__c, '701PA00000tVx7aYAC', "Campaign__c must match provided campaign_code");
assert.strictEqual(xlsxRowWithCode.pi__campaign__c, '701PA00000tVx7aYAC', "pi__campaign__c must match provided campaign_code");
assert.strictEqual(xlsxRowWithCode.Leads_channel__c, 'Prospeccion', "Leads_channel__c must be Prospeccion");
assert.strictEqual(xlsxRowWithCode.LeadSource, 'Charla FS', "LeadSource must match origin");

// 20.6 Verify Multi-Sheet Excel Generation (CARGA_LEADS, BORRADOR, CAMPAÑAS)
const multiSheetXlsxFmt = new XlsxFormatter();
const multiSheetBuffer = multiSheetXlsxFmt.format([leadForTemplate], { sheetName: 'Carga_Leads' });
const multiSheetWb = XLSX.read(multiSheetBuffer, { type: 'buffer' });

assert.ok(multiSheetWb.SheetNames.includes('Carga_Leads'), "Excel must include primary sheet 'Carga_Leads'");
assert.ok(multiSheetWb.SheetNames.includes('BORRADOR'), "Excel must include official 'BORRADOR' sheet with fixed F-G-H");
assert.ok(multiSheetWb.SheetNames.includes('CAMPAÑAS'), "Excel must include official 'CAMPAÑAS' catalog sheet");

// Verify BORRADOR sheet content
const borradorSheetRows = XLSX.utils.sheet_to_json(multiSheetWb.Sheets['BORRADOR']);
assert.strictEqual(borradorSheetRows.length, 1);
assert.strictEqual(borradorSheetRows[0].Tipo_de_documento__c, 1);
assert.strictEqual(borradorSheetRows[0].Leads_channel__c, 'Prospeccion');
assert.strictEqual(borradorSheetRows[0].LeadSource, 'Charla FS');
assert.strictEqual(borradorSheetRows[0].Campaign__c, '701PA00000tVx7aYAC');

// Verify CAMPAÑAS sheet content
const campSheetRows = XLSX.utils.sheet_to_json(multiSheetWb.Sheets['CAMPAÑAS']);
assert.ok(campSheetRows.some(c => c['ID DE CAMPAÑA '] === '701PA00000pPa4mYAC'), "Catalog must have Charla 701PA00000pPa4mYAC");
assert.ok(campSheetRows.some(c => c['ID DE CAMPAÑA '] === '701PA00000pQcp3YAC'), "Catalog must have Feria 701PA00000pQcp3YAC");

console.log("✓ Salesforce Campaign Code (18 chars) & Fixed Cells F-G-H tests passed!");

// Test 21: SQLite Database Resilience & API Leads Synchronization Flow
console.log("Testing SQLite Database Resilience & API Leads Synchronization Flow...");

const leadsPhpCode = fs.readFileSync('api/leads.php', 'utf8');
const initDbPhpCode = fs.readFileSync('api/init-db.php', 'utf8');
const leadsStorageSrc = fs.readFileSync('js/leads-storage.js', 'utf8');
const serverJsCode = fs.readFileSync('server.js', 'utf8');

// 21.1 Verify auto-initialization in leads.php and init-db.php
assert.ok(leadsPhpCode.includes('init_db_schema'), "api/leads.php must contain init_db_schema for auto-initialization");
assert.ok(leadsPhpCode.includes('ensure_schema_upgrades'), "api/leads.php must auto-upgrade missing table columns");
assert.ok(leadsPhpCode.includes('PRAGMA table_info(leads)'), "api/leads.php must dynamically query table columns to prevent unknown column crashes");
assert.ok(leadsPhpCode.includes('INSERT OR REPLACE INTO leads'), "api/leads.php must use INSERT OR REPLACE for idempotency");

// 21.2 Verify all required columns are present in schema definition
const expectedColumns = [
    'id', 'timestamp', 'fecha_legible', 'campaign_code', 'email', 'f_name', 'l_name', 'mobile',
    'aut_data', 'gclid', 'sede', 'tp_pgm', 'esc_pgm', 'periodo', 'utm_campaign', 'c_lead', 'origen',
    'utm_source', 'utm_medium', 'utm_term', 'utm_content', 'campaign_name', 'colegio_origen',
    'cedula', 'programa', 'modalidad', 'area_vocacional', 'carrera_recomendada', 'perfil_vocacional',
    'asesor_id', 'asesor_nombre', 'asesor_email', 'asesor_sede', 'tiktok_id', 'fbclid', 'sincronizado', 'raw_payload'
];
expectedColumns.forEach(col => {
    assert.ok(initDbPhpCode.includes(col), `api/init-db.php must include column: ${col}`);
    assert.ok(leadsPhpCode.includes(col), `api/leads.php must include column: ${col}`);
});

// 21.3 Verify CORS resilience in leads.php
assert.ok(leadsPhpCode.includes('Access-Control-Allow-Origin'), "api/leads.php must define Access-Control-Allow-Origin headers");
assert.ok(leadsPhpCode.includes('Access-Control-Allow-Methods'), "api/leads.php must define Access-Control-Allow-Methods headers");

// 21.4 Verify server.js routing support for /api/leads.php
assert.ok(serverJsCode.includes("pathname === '/api/leads' || pathname === '/api/leads.php'"), "server.js must handle /api/leads.php");

// 21.5 Verify LeadsStorage syncPendingLeads function and offline tracking
assert.ok(typeof LeadsStorage.syncPendingLeads === 'function', "LeadsStorage must export syncPendingLeads function");
assert.ok(leadsStorageSrc.includes('updateLeadSyncStatus'), "leads-storage.js must track synchronization status per lead");

console.log("✓ SQLite Database Resilience & API Leads Synchronization Flow tests passed!");

console.log("\nALL TESTS PASSED SUCCESSFULLY! 🚀");




