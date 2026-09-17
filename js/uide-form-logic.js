/**
 * UIDE Form Logic - Prospección 2026
 * Adaptado de form-b2b-actualizado.html y CRM UIDE.
 * Canales: c_lead = "Prospeccion"
 * Tipos de lead (origen): "Charla FS", "Ferias FS", "Visita a campus"
 * Integración con DataLayer GTM por Asesor Educativo (1 al 4) sin alterar UTM source.
 */

const UIDEForm = (function() {
    let activeAdvisor = {
        id: "ADV-01",
        nombre: "Andrés Ruiz",
        email: "asesoreducativo1@uide.edu.ec",
        sede: "Quito"
    };

    // Catálogo completo y oficial extraído de form-b2b-actualizado.html y referencia oficial UIDE
    const PROGRAMAS_DATA = {
        pregrado_quito: [
            { id: "558", nombre: "Administración de Empresas" },
            { id: "16", nombre: "Arquitectura" },
            { id: "500", nombre: "Comunicación y Medios Digitales" },
            { id: "18", nombre: "Derecho" },
            { id: "507", nombre: "Ciencias Politicas y Relaciones Internacionales" },
            { id: "24", nombre: "Gastronomía" },
            { id: "324", nombre: "Diseño Gráfico" },
            { id: "341", nombre: "Enfermería" },
            { id: "528", nombre: "Enfermería Internacional" },
            { id: "325", nombre: "Fisioterapia" },
            { id: "8", nombre: "Ingeniería Automotriz" },
            { id: "292", nombre: "Ingeniería Civil" },
            { id: "318", nombre: "Ingeniería en Sistemas" },
            { id: "257", nombre: "Ingeniería Industrial" },
            { id: "64", nombre: "Ingeniería Mecatrónica" },
            { id: "5", nombre: "Negocios Internacionales" },
            { id: "71", nombre: "Nutrición" },
            { id: "52", nombre: "Medicina" },
            { id: "463", nombre: "Multimedia y Producción AudioVisual" },
            { id: "293", nombre: "Medicina Veterinaria" },
            { id: "53", nombre: "Odontología" },
            { id: "520", nombre: "Psicología Clínica" },
            { id: "412", nombre: "Finanzas y Negocios Digitales" },
            { id: "557", nombre: "Marketing" }
        ],
        posgrado_quito_semipresencial: [
            { id: "343", nombre: "Maestría en Gastronomía con mención en Gestión e Innovación" }
        ],
        posgrado_quito_hibrida: [
            { id: "421", nombre: "Maestría en Diseño de Interiores" },
            { id: "502", nombre: "Maestría en Bienestar Animal" },
            { id: "501", nombre: "Maestría en Producción Animal" }
        ],
        pregrado_guayaquil: [
            { id: "473", nombre: "Administración de Empresas" },
            { id: "568", nombre: "Administración de Empresas e Innovación Empresarial" },
            { id: "525", nombre: "Comercio exterior y aduanas" },
            { id: "413", nombre: "Finanzas y Negocios Digitales" },
            { id: "95", nombre: "Ingeniería Automotriz" },
            { id: "564", nombre: "Validación de conocimientos en Ingeniería Automotriz (Presencial Guayaquil)" },
            { id: "478", nombre: "Ingeniería Industrial" },
            { id: "320", nombre: "Ingeniería en Sistemas" },
            { id: "108", nombre: "Marketing" },
            { id: "567", nombre: "Marketing en Inteligencia de Mercados" },
            { id: "107", nombre: "Negocios Internacionales" },
            { id: "526", nombre: "Psicología" },
            { id: "548", nombre: "Enfermería Internacional" }
        ],
        pregrado_loja: [
            { id: "79", nombre: "Administración de Empresas" },
            { id: "565", nombre: "Administración de Empresas e Innovación Empresarial" },
            { id: "93", nombre: "Arquitectura" },
            { id: "81", nombre: "Derecho-L" },
            { id: "321", nombre: "Ingeniería en Tecnologias de la Informacion y la Comunicacion" },
            { id: "86", nombre: "Marketing" },
            { id: "566", nombre: "Marketing en Inteligencia de Mercados" },
            { id: "87", nombre: "Negocios Internacionales" },
            { id: "522", nombre: "Psicologia Clínica" }
        ],
        pregrado_online: [
            { id: "559", nombre: "Administración de Empresas" },
            { id: "499", nombre: "Comunicación y Medios Digitales" },
            { id: "100", nombre: "Contabilidad y Auditoría-Contador Autorizado" },
            { id: "535", nombre: "Comercio exterior y aduanas" },
            { id: "260", nombre: "Derecho" },
            { id: "461", nombre: "Finanzas" },
            { id: "521", nombre: "Gastronomía" },
            { id: "481", nombre: "Ingeniería en Ciberseguridad" },
            { id: "317", nombre: "Ingeniería en Sistemas de Información" },
            { id: "479", nombre: "Ingeniería en Software" },
            { id: "537", nombre: "Inteligencia Artificial" },
            { id: "556", nombre: "Marketing" },
            { id: "457", nombre: "Multimedia y producción audiovisual" },
            { id: "96", nombre: "Negocios Internacionales" },
            { id: "315", nombre: "Psicología Organizacional" },
            { id: "532", nombre: "Seguridad y Salud Ocupacional" },
            { id: "531", nombre: "Telecomunicaciones" },
            { id: "482", nombre: "Trabajo Social" },
            { id: "480", nombre: "Administración Pública" },
            { id: "547", nombre: "Ingeniería en Ciencia de Datos" }
        ],
        programa_ejecutivo_online: [
            { id: "189", nombre: "Programa Ejecutivo Administración de Empresas" },
            { id: "190", nombre: "Programa Ejecutivo Comunicación" },
            { id: "186", nombre: "Programa Ejecutivo Contabilidad y Auditoria" },
            { id: "411", nombre: "Programa Ejecutivo Derecho" },
            { id: "197", nombre: "Programa Ejecutivo Marketing" },
            { id: "446", nombre: "Programa Ejecutivo Riesgos y Desastres" },
            { id: "523", nombre: "Programa Ejecutivo Gastronomía" },
            { id: "536", nombre: "Programa Ejecutivo Telecomunicaciones" },
            { id: "538", nombre: "Programa Ejecutivo en Logística y Transporte" },
            { id: "553", nombre: "Programa Ejecutivo en Psicología Organizacional" }
        ],
        posgrado_online: [
            { id: "187", nombre: "Maestría en cadenas de suministro supply chain" },
            { id: "225", nombre: "Maestría en Criminalística" },
            { id: "267", nombre: "Maestría En Gerencia De Salud" },
            { id: "268", nombre: "Maestría En Salud Pública" },
            { id: "228", nombre: "Maestría en Gestión de Riesgos" },
            { id: "230", nombre: "Maestría en Ciberseguridad" },
            { id: "516", nombre: "Maestría En Inteligencia Artificial Aplicada-Online-PG" },
            { id: "503", nombre: "Maestría en Ingeniería Automotriz" },
            { id: "235", nombre: "Maestría en Gestión del Transporte con mención en Tráfico, Movilidad y Seguridad Víal" },
            { id: "477", nombre: "Maestría en Seguridad y Salud Ocupacional" },
            { id: "266", nombre: "Maestría en Energías Renovables" },
            { id: "424", nombre: "Maestría En Desarrollo Sostenible y Responsabilidad Social Organizacional" },
            { id: "544", nombre: "Maestría en Educación Tecnología e Innovación" },
            { id: "546", nombre: "Maestría en Educación Básica - O" },
            { id: "524", nombre: "Maestría en Protección de datos" },
            { id: "511", nombre: "Maestría en Derecho laboral y seguridad social" },
            { id: "277", nombre: "Maestría en Derecho Procesal Penal y Litigación Oral" },
            { id: "515", nombre: "Maestría En Dirección Publicitaria Y Creativa-Online-PG" },
            { id: "265", nombre: "Maestría en marketing y comunicación" },
            { id: "246", nombre: "Maestría en Gestión de Proyectos" },
            { id: "258", nombre: "Maestría en Marketing, Mención Estrategia Digital" },
            { id: "422", nombre: "Maestría En Inteligencia de Negocios y Comportamiento del Consumidor" },
            { id: "396", nombre: "Maestría En Neuromarketing" },
            { id: "282", nombre: "Maestría en Nutrición y Dietética con mención en Enfermedades Metabólicas, Obesidad y Diabetes" },
            { id: "514", nombre: "Maestría En Gestión Pública" },
            { id: "216", nombre: "Maestría En Administración de empresas MBA" },
            { id: "261", nombre: "Maestría en Gerencia del Talento Humano" },
            { id: "294", nombre: "Maestría en Gestión Integral de seguros" },
            { id: "345", nombre: "Maestría en Finanzas Corporativas" },
            { id: "347", nombre: "Maestría en Dirección Financiera con mención en mercados Internacionales" },
            { id: "278", nombre: "Maestría en Gestión Deportiva" },
            { id: "510", nombre: "Maestría en Planificación y Diseño Urbano con Mención en ciudades inteligentes" },
            { id: "541", nombre: "Maestría en Gestión de la Seguridad Privada" },
            { id: "542", nombre: "Maestría en Gestión Educativa" },
            { id: "554", nombre: "Maestría en Derecho de Empresa" },
            { id: "555", nombre: "Maestría en Contabilidad y Auditoría" }
        ]
    };

    const PHONE_RULES = {
        '+593': { min: 9, max: 10, name: 'Ecuador' },
        '+1':   { min: 10, max: 10, name: 'USA/Canadá' },
        '+52':  { min: 10, max: 10, name: 'México' },
        '+57':  { min: 10, max: 10, name: 'Colombia' },
        '+51':  { min: 9, max: 9, name: 'Perú' },
        '+56':  { min: 9, max: 9, name: 'Chile' },
        '+54':  { min: 10, max: 10, name: 'Argentina' },
        '+55':  { min: 11, max: 11, name: 'Brasil' },
        '+34':  { min: 9, max: 9, name: 'España' },
        '+44':  { min: 10, max: 10, name: 'Reino Unido' }
    };

    function init() {
        bindEvents();
        initUtmTracking();
        initGclid();
        triggerDataLayerVisible();
    }

    function syncAdvisorData(adv) {
        if (!adv) return;
        activeAdvisor = {
            id: adv.id || activeAdvisor.id,
            nombre: adv.nombre || activeAdvisor.nombre,
            email: adv.email || activeAdvisor.email,
            sede: adv.sede || activeAdvisor.sede
        };

        const idInp = document.getElementById('asesor_id');
        const nomInp = document.getElementById('asesor_nombre');
        const emlInp = document.getElementById('asesor_email');
        const sedInp = document.getElementById('asesor_sede');

        if (idInp) idInp.value = activeAdvisor.id;
        if (nomInp) nomInp.value = activeAdvisor.nombre;
        if (emlInp) emlInp.value = activeAdvisor.email;
        if (sedInp) sedInp.value = activeAdvisor.sede;

        const activeAdvLabel = document.getElementById('form_active_advisor_label');
        if (activeAdvLabel) activeAdvLabel.textContent = activeAdvisor.nombre;

        // Inyección directa de campaña manual del asesor
        syncManualCampaign();
    }

    function syncManualCampaign() {
        if (!activeAdvisor || !activeAdvisor.email) return;
        try {
            let savedCampaign = null;
            if (typeof App !== 'undefined' && App.getStoredAdvisorCampaign) {
                savedCampaign = App.getStoredAdvisorCampaign(activeAdvisor.email);
            } else {
                const raw = localStorage.getItem('uide_adv_campaign_' + activeAdvisor.email.toLowerCase());
                if (raw) savedCampaign = JSON.parse(raw);
            }

            if (savedCampaign && savedCampaign.utmCampaign) {
                const cmpField = document.getElementById('utm_campaign');
                if (cmpField) {
                    cmpField.value = savedCampaign.utmCampaign;
                }
            }
            if (savedCampaign && savedCampaign.utmContent) {
                const cntField = document.getElementById('utm_content');
                if (cntField && (!cntField.value || cntField.value === 'general')) {
                    cntField.value = savedCampaign.utmContent;
                }
            }
        } catch(e) {}
    }

    function bindEvents() {
        const sedeSelect = document.getElementById('sede');
        if (sedeSelect) sedeSelect.addEventListener('change', onSedeChange);

        const tpSelect = document.getElementById('tp_pgm');
        if (tpSelect) tpSelect.addEventListener('change', onTipoProgramaChange);

        const modSelect = document.getElementById('modalidad_posgrado');
        if (modSelect) modSelect.addEventListener('change', onModalidadChange);

        const pgmSelect = document.getElementById('carrera_select');
        if (pgmSelect) pgmSelect.addEventListener('change', onCarreraChange);

        const phoneInput = document.getElementById('mobile');
        if (phoneInput) {
            phoneInput.addEventListener('input', onPhoneInput);
            phoneInput.addEventListener('blur', validatePhone);
        }

        const countrySelect = document.getElementById('country_code');
        if (countrySelect) countrySelect.addEventListener('change', onCountryChange);

        const cedulaInput = document.getElementById('cedula');
        if (cedulaInput) {
            cedulaInput.addEventListener('input', onCedulaInput);
            cedulaInput.addEventListener('blur', validateCedula);
        }

        const form = document.getElementById('pardot-form');
        if (form) form.addEventListener('submit', handleFormSubmit);
    }

    /* ---------- LÓGICA DE CASCADA ---------- */
    function onSedeChange() {
        const sede = document.getElementById('sede').value;
        const tpSelect = document.getElementById('tp_pgm');
        const modContainer = document.getElementById('modalidad_container');
        const carreraContainer = document.getElementById('carrera_container');
        const carreraSelect = document.getElementById('carrera_select');

        tpSelect.innerHTML = '<option value="">Tipo de programa *</option>';
        carreraSelect.innerHTML = '<option value="">Selecciona tu programa *</option>';
        modContainer.style.display = 'none';
        carreraContainer.style.display = 'none';

        if (!sede) {
            tpSelect.disabled = true;
            updatePeriodo();
            return;
        }

        tpSelect.disabled = false;
        let options = [];

        if (sede === 'Quito') {
            options = [
                { value: 'Pregrado Quito', text: 'Pregrado Quito' },
                { value: 'Posgrado Quito', text: 'Posgrado Quito' }
            ];
        } else if (sede === 'Guayaquil') {
            options = [
                { value: 'Pregrado Guayaquil', text: 'Pregrado Guayaquil' },
                { value: 'Posgrado En Línea', text: 'Posgrado En Línea' }
            ];
        } else if (sede === 'Loja') {
            options = [
                { value: 'Pregrado Loja', text: 'Pregrado Loja' },
                { value: 'Posgrado En Línea', text: 'Posgrado En Línea' }
            ];
        } else if (sede === 'Distancia') {
            options = [
                { value: 'Pregrado Distancia', text: 'Pregrado En Línea' },
                { value: 'Posgrado Online', text: 'Posgrado En Línea' }
            ];
        }

        options.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt.value;
            el.textContent = opt.text;
            tpSelect.appendChild(el);
        });

        updatePeriodo();
    }

    function onTipoProgramaChange(e) {
        const val = e.target.value;
        const sede = document.getElementById('sede').value;
        const modContainer = document.getElementById('modalidad_container');
        const modSelect = document.getElementById('modalidad_posgrado');
        const carreraContainer = document.getElementById('carrera_container');

        modContainer.style.display = 'none';
        carreraContainer.style.display = 'none';
        modSelect.innerHTML = '<option value="">Seleccione modalidad *</option>';

        if (!val) {
            updatePeriodo();
            return;
        }

        if (val.includes('Posgrado')) {
            modContainer.style.display = 'block';
            let modalidades = [];
            if (sede === 'Quito') {
                modalidades = [
                    { value: 'Posgrado Quito Hibrida', text: 'Híbrida' },
                    { value: 'Posgrado Quito Semipresencial', text: 'Semipresencial' }
                ];
            } else {
                modalidades = [
                    { value: 'Posgrado Online', text: 'Online' }
                ];
            }
            modalidades.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.value;
                opt.textContent = m.text;
                modSelect.appendChild(opt);
            });
        } else if (val.includes('Pregrado')) {
            if (sede === 'Distancia') {
                modContainer.style.display = 'block';
                const modalidades = [
                    { value: 'Pregrado Online', text: 'General' },
                    { value: 'Programa Ejecutivo Online', text: 'Validación de Conocimientos' }
                ];
                modalidades.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.value;
                    opt.textContent = m.text;
                    modSelect.appendChild(opt);
                });
            } else {
                poblarProgramas(val);
            }
        }
        updatePeriodo();
    }

    function onModalidadChange(e) {
        const val = e.target.value;
        if (val) {
            poblarProgramas(val);
        } else {
            document.getElementById('carrera_container').style.display = 'none';
        }
        updatePeriodo();
    }

    function poblarProgramas(claveOrigen) {
        const carreraContainer = document.getElementById('carrera_container');
        const carreraSelect = document.getElementById('carrera_select');
        carreraSelect.innerHTML = '<option value="">Selecciona tu programa *</option>';

        let key = '';
        if (claveOrigen === 'Pregrado Quito') key = 'pregrado_quito';
        else if (claveOrigen === 'Posgrado Quito Semipresencial') key = 'posgrado_quito_semipresencial';
        else if (claveOrigen === 'Posgrado Quito Hibrida') key = 'posgrado_quito_hibrida';
        else if (claveOrigen === 'Pregrado Guayaquil') key = 'pregrado_guayaquil';
        else if (claveOrigen === 'Pregrado Loja') key = 'pregrado_loja';
        else if (claveOrigen === 'Pregrado Online' || claveOrigen === 'Pregrado Distancia') key = 'pregrado_online';
        else if (claveOrigen === 'Programa Ejecutivo Online') key = 'programa_ejecutivo_online';
        else if (claveOrigen === 'Posgrado Online' || claveOrigen === 'Posgrado En Línea') key = 'posgrado_online';

        const lista = PROGRAMAS_DATA[key] || [];
        if (lista.length > 0) {
            lista.forEach(prog => {
                const opt = document.createElement('option');
                opt.value = prog.id;
                opt.textContent = prog.nombre;
                carreraSelect.appendChild(opt);
            });
            carreraContainer.style.display = 'block';
            carreraSelect.setAttribute('required', 'true');
        } else {
            carreraContainer.style.display = 'none';
            carreraSelect.removeAttribute('required');
        }
    }

    function onCarreraChange(e) {
        const select = e.target;
        const val = select.value;
        const text = select.options[select.selectedIndex] ? select.options[select.selectedIndex].text : '';

        const escPgm = document.getElementById('esc_pgm');
        const carreraHidden = document.getElementById('carrera_hidden');
        const programaHidden = document.getElementById('programa_hidden');

        if (escPgm) escPgm.value = val;
        if (carreraHidden) carreraHidden.value = val;
        if (programaHidden) programaHidden.value = text;

        if (val && /^\d+$/.test(val)) {
            select.setCustomValidity('');
        }

        updatePeriodo();
    }

    /* ---------- CÁLCULO DE PERÍODO DETERMINÍSTICO OFICIAL UIDE (2026-2 / 2027-1) ---------- */
    function updatePeriodo() {
        const sede = document.getElementById('sede') ? document.getElementById('sede').value : '';
        const tp = document.getElementById('tp_pgm') ? document.getElementById('tp_pgm').value : '';
        const mod = document.getElementById('modalidad_posgrado') ? document.getElementById('modalidad_posgrado').value : '';
        const car = document.getElementById('esc_pgm') ? document.getElementById('esc_pgm').value : '';
        const PROGS_2027_1 = ["510", "515", "265", "278", "546", "554"];
        let v = '2026-2 Online Posgrado';

        if (tp === 'Posgrado En Línea') {
            v = '2026-2 Online Posgrado';
        } else if (sede === 'Quito') {
            if (tp.indexOf('Posgrado') !== -1) {
                v = '2026-2 Presencial Posgrado';
            } else {
                v = (car === '528') ? 'II-EIN-AGO-26' : '2026-2 Q Pregrado';
            }
        } else if (sede === 'Loja') {
            v = (tp.indexOf('Posgrado') !== -1) ? '2026-2 Presencial Posgrado' : '2026-2 L Pregrado';
        } else if (sede === 'Guayaquil') {
            if (tp.indexOf('Posgrado') !== -1) {
                v = '2026-2 Presencial Posgrado';
            } else {
                v = (car === '548') ? 'II-EIN-GY-AGO-26' : '2026-2 Guayaquil';
            }
        } else if (sede === 'Distancia') {
            if (tp.indexOf('Posgrado') !== -1) {
                v = '2026-2 Online Posgrado';
            } else {
                v = (mod === 'Programa Ejecutivo Online') ? '2026-2 Online PVC' : '2026-2 Online Pregrado';
            }
        }

        if (PROGS_2027_1.indexOf(car) !== -1 && tp.indexOf('Posgrado') !== -1) {
            v = '2027-1 Online Posgrado';
        }

        const periodoInput = document.getElementById('periodo');
        if (periodoInput) periodoInput.value = v;

        const badge = document.getElementById('periodo_badge');
        if (badge) badge.textContent = v;
        return v;
    }

    /* ---------- VALIDACIÓN DE TELÉFONO (+593) ---------- */
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

    function onPhoneInput(e) {
        const cc = document.getElementById('country_code').value;
        if (cc === '+593') {
            e.target.value = trimEcuadorDisplay(e.target.value);
        } else {
            e.target.value = e.target.value.replace(/\D/g, '');
        }
        validatePhone();
    }

    function onCountryChange() {
        const phone = document.getElementById('mobile');
        if (phone && phone.value) {
            onPhoneInput({ target: phone });
        }
    }

    function validatePhone() {
        const phoneField = document.getElementById('mobile');
        const cc = document.getElementById('country_code').value;
        const raw = phoneField.value.trim();

        if (!raw) {
            phoneField.setCustomValidity('El celular es obligatorio');
            return false;
        }

        if (cc === '+593') {
            const payload = getEcuadorPayload(raw);
            if (!payload) {
                phoneField.setCustomValidity('Ingresa 9 dígitos sin cero inicial (ej: 991234567)');
                return false;
            }
            phoneField.setCustomValidity('');
            return true;
        }

        const rule = PHONE_RULES[cc];
        const digits = raw.replace(/\D/g, '');
        if (rule && (digits.length < rule.min || digits.length > rule.max)) {
            phoneField.setCustomValidity(`El número para ${rule.name} debe tener ${rule.min} dígitos`);
            return false;
        }

        phoneField.setCustomValidity('');
        return true;
    }

    /* ---------- VALIDACIÓN DE CÉDULA ---------- */
    function onCedulaInput(e) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 10) val = val.substring(0, 10);
        e.target.value = val;
        validateCedula();
    }

    function validateCedula() {
        const cedulaField = document.getElementById('cedula');
        const val = cedulaField.value.replace(/\D/g, '');
        if (val.length !== 10) {
            cedulaField.setCustomValidity('La cédula ecuatoriana debe tener 10 dígitos');
            return false;
        }
        cedulaField.setCustomValidity('');
        return true;
    }

    /* ---------- UTM & GCLID TRACKING ---------- */
    function getParam(p) {
        const match = RegExp('[?&]' + p + '=([^&]*)').exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    }

    function initUtmTracking() {
        const srcF = document.getElementById('utm_source');
        const medF = document.getElementById('utm_medium');
        const cmpF = document.getElementById('utm_campaign');
        const trmF = document.getElementById('utm_term');
        const cntF = document.getElementById('utm_content');
        const colF = document.getElementById('colegio_origen');

        const urlSrc = getParam('utm_source');
        const urlMed = getParam('utm_medium');
        const urlCmp = getParam('utm_campaign');
        const urlTrm = getParam('utm_term');
        const urlCnt = getParam('utm_content');
        const urlCol = getParam('colegio') || getParam('colegio_origen');

        // Preserva fielmente los UTMs entrantes (ej. Google Ads, QR, etc.)
        if (urlSrc && srcF) srcF.value = urlSrc;
        if (urlMed && medF) medF.value = urlMed;
        if (urlCmp && cmpF) cmpF.value = urlCmp;
        if (urlTrm && trmF) trmF.value = urlTrm;
        if (urlCnt && cntF) cntF.value = urlCnt;

        // Si viene colegio en el QR/URL y el campo está vacío, precargarlo dejando posibilidad de edición
        if (urlCol && colF && !colF.value) {
            colF.value = urlCol;
        }
    }

    function initGclid() {
        const gclidParam = getParam('gclid');
        if (gclidParam) {
            const record = { value: gclidParam, expiryDate: new Date().getTime() + (90 * 24 * 60 * 60 * 1000) };
            try { localStorage.setItem('gclid', JSON.stringify(record)); } catch(e) {}
        }
        try {
            const saved = JSON.parse(localStorage.getItem('gclid'));
            if (saved && new Date().getTime() < saved.expiryDate) {
                const gVal = saved.value;
                const gField = document.getElementById('gclid');
                const gFieldAlt = document.getElementById('gclid_field');
                const gFieldH = document.getElementById('gclid_h');
                if (gField) gField.value = gVal;
                if (gFieldAlt) gFieldAlt.value = gVal;
                if (gFieldH) gFieldH.value = gVal;
            }
        } catch(e) {}
    }

    /* ---------- DATALAYER GTM CON DATOS DEL ASESOR (1 AL 4) ---------- */
    function triggerDataLayerVisible() {
        const gclidVal = document.getElementById('gclid') ? document.getElementById('gclid').value : (document.getElementById('gclid_field') ? document.getElementById('gclid_field').value : '');
        const autDataEl = document.getElementById('aut_data');
        const autDataVal = autDataEl ? (autDataEl.checked ? 'true' : 'false') : 'true';

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'form_visible',
            form_name: 'uide-prospeccion-app',
            
            // --- 13 Campos Oficiales del Endpoint del Formulario ---
            c_lead: document.getElementById('c_lead') ? document.getElementById('c_lead').value : 'Prospeccion',
            origen: document.getElementById('origen') ? document.getElementById('origen').value : 'Charla FS',
            sede: document.getElementById('sede') ? document.getElementById('sede').value : '',
            tp_pgm: document.getElementById('tp_pgm') ? document.getElementById('tp_pgm').value : '',
            periodo: document.getElementById('periodo') ? document.getElementById('periodo').value : '',
            utm_campaign: document.getElementById('utm_campaign') ? document.getElementById('utm_campaign').value : '',
            gclid: gclidVal,
            aut_data: autDataVal,

            // --- Atribución & Tracking Enriquecido ---
            form_channel: document.getElementById('c_lead') ? document.getElementById('c_lead').value : 'Prospeccion',
            tipo_lead: document.getElementById('origen') ? document.getElementById('origen').value : 'Charla FS',
            utm_source: document.getElementById('utm_source') ? document.getElementById('utm_source').value : '',
            utm_medium: document.getElementById('utm_medium') ? document.getElementById('utm_medium').value : '',
            utm_term: document.getElementById('utm_term') ? document.getElementById('utm_term').value : '',
            utm_content: document.getElementById('utm_content') ? document.getElementById('utm_content').value : '',
            campaign_name: document.getElementById('utm_campaign') ? document.getElementById('utm_campaign').value : '',
            colegio_origen: document.getElementById('colegio_origen') ? document.getElementById('colegio_origen').value : '',
            
            // --- Asesor Educativo Asignado (1 al 4) ---
            asesor_id: activeAdvisor.id,
            asesor_nombre: activeAdvisor.nombre,
            asesor_email: activeAdvisor.email,
            asesor_sede: activeAdvisor.sede
        });
    }

    function triggerDataLayerIdentified(leadData) {
        window.dataLayer = window.dataLayer || [];
        const gclidVal = leadData && leadData.gclid !== undefined ? leadData.gclid : (document.getElementById('gclid') ? document.getElementById('gclid').value : (document.getElementById('gclid_field') ? document.getElementById('gclid_field').value : ''));
        const autDataVal = leadData && leadData.aut_data !== undefined ? leadData.aut_data : (document.getElementById('aut_data') ? (document.getElementById('aut_data').checked ? 'true' : 'false') : 'true');

        window.dataLayer.push({
            event: 'user_identified',
            form_name: 'uide-prospeccion-app',
            
            // --- 13 Campos Oficiales del Registro ---
            email: leadData ? leadData.email : (document.getElementById('email') ? document.getElementById('email').value.trim() : ''),
            f_name: leadData ? leadData.f_name : (document.getElementById('f_name') ? document.getElementById('f_name').value.trim() : ''),
            l_name: leadData ? leadData.l_name : (document.getElementById('l_name') ? document.getElementById('l_name').value.trim() : ''),
            mobile: leadData ? leadData.mobile : (document.getElementById('mobile') ? document.getElementById('mobile').value.trim() : ''),
            aut_data: autDataVal,
            gclid: gclidVal,
            sede: leadData ? leadData.sede : (document.getElementById('sede') ? document.getElementById('sede').value : ''),
            tp_pgm: leadData ? leadData.tp_pgm : (document.getElementById('tp_pgm') ? document.getElementById('tp_pgm').value : ''),
            esc_pgm: leadData ? leadData.esc_pgm : (document.getElementById('esc_pgm') ? document.getElementById('esc_pgm').value : ''),
            periodo: leadData ? leadData.periodo : (document.getElementById('periodo') ? document.getElementById('periodo').value : ''),
            utm_campaign: leadData ? leadData.utm_campaign : (document.getElementById('utm_campaign') ? document.getElementById('utm_campaign').value : ''),
            c_lead: leadData ? leadData.c_lead : (document.getElementById('c_lead') ? document.getElementById('c_lead').value : 'Prospeccion'),
            origen: leadData ? leadData.origen : (document.getElementById('origen') ? document.getElementById('origen').value : 'Charla FS'),

            // --- Atribución & Tracking Enriquecido ---
            cedula: leadData ? leadData.cedula : (document.getElementById('cedula') ? document.getElementById('cedula').value.trim() : ''),
            colegio_origen: leadData ? leadData.colegio_origen : (document.getElementById('colegio_origen') ? document.getElementById('colegio_origen').value.trim() : ''),
            utm_source: leadData ? leadData.utm_source : (document.getElementById('utm_source') ? document.getElementById('utm_source').value : ''),
            utm_medium: leadData ? leadData.utm_medium : (document.getElementById('utm_medium') ? document.getElementById('utm_medium').value : ''),
            utm_term: leadData ? leadData.utm_term : (document.getElementById('utm_term') ? document.getElementById('utm_term').value : ''),
            utm_content: leadData ? leadData.utm_content : (document.getElementById('utm_content') ? document.getElementById('utm_content').value : ''),
            campaign_name: leadData ? leadData.campaign_name : (document.getElementById('utm_campaign') ? document.getElementById('utm_campaign').value : ''),

            // --- Asesor Educativo Asignado (1 al 4) ---
            asesor_id: activeAdvisor.id,
            asesor_nombre: activeAdvisor.nombre,
            asesor_email: activeAdvisor.email,
            asesor_sede: activeAdvisor.sede
        });
    }

    /* ---------- SUBMIT DEL FORMULARIO ---------- */
    function handleFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        if (!validatePhone() || !validateCedula()) {
            form.reportValidity();
            return false;
        }

        // Validación estricta del código numérico oficial de carrera (esc_pgm)
        const escPgmEl = document.getElementById('esc_pgm');
        const escPgmVal = escPgmEl ? escPgmEl.value.trim() : '';
        if (!escPgmVal || !/^\d+$/.test(escPgmVal)) {
            const carreraSelect = document.getElementById('carrera_select');
            if (carreraSelect) {
                carreraSelect.focus();
                carreraSelect.setCustomValidity('Por favor selecciona una carrera o programa académico oficial válido.');
                carreraSelect.reportValidity();
            } else {
                alert('Por favor selecciona una carrera o programa académico oficial de la lista.');
            }
            return false;
        }

        // Asegurar c_lead inmutable para plataforma Prospección FS
        const cLeadInput = document.getElementById('c_lead');
        if (cLeadInput) cLeadInput.value = 'Prospeccion';

        const phoneField = document.getElementById('mobile');
        const cc = document.getElementById('country_code').value;
        let formattedPhone = phoneField.value;

        if (cc === '+593') {
            const payload = getEcuadorPayload(phoneField.value);
            formattedPhone = '+593' + payload;
        } else {
            const digits = phoneField.value.replace(/\D/g, '');
            formattedPhone = cc + digits;
        }

        const autDataEl = document.getElementById('aut_data');
        const autDataVal = autDataEl ? (autDataEl.checked ? 'true' : 'false') : 'true';
        const gclidVal = document.getElementById('gclid') ? document.getElementById('gclid').value : (document.getElementById('gclid_field') ? document.getElementById('gclid_field').value : '');

        const vocResult = (typeof VocationalTest !== 'undefined' && VocationalTest.getCurrentResult) ? VocationalTest.getCurrentResult() : null;
        const areaVocEl = document.getElementById('area_vocacional');
        const carrRecEl = document.getElementById('carrera_recomendada');
        const perfVocEl = document.getElementById('perfil_vocacional');

        const areaVocVal = (areaVocEl && areaVocEl.value) ? areaVocEl.value : (vocResult && vocResult.dominantArea ? vocResult.dominantArea.name : '');
        const carrRecVal = (carrRecEl && carrRecEl.value) ? carrRecEl.value : (vocResult && vocResult.primaryCareer ? vocResult.primaryCareer.name : '');
        const perfVocVal = (perfVocEl && perfVocEl.value) ? perfVocEl.value : (vocResult && vocResult.dominantArea ? vocResult.dominantArea.badge : '');

        syncManualCampaign();
        const activeCampaign = (document.getElementById('utm_campaign') && document.getElementById('utm_campaign').value.trim())
            ? document.getElementById('utm_campaign').value.trim()
            : 'TRAFICO_GENERAL_OTROS_MEDIOS_IT1_2026';

        let activeCampaignCode = '701PA00000pPa4mYAC';
        if (typeof CampaignsManager !== 'undefined' && CampaignsManager.getActiveCampaignCode) {
            activeCampaignCode = CampaignsManager.getActiveCampaignCode();
        } else if (document.getElementById('input_adv_campaign_code') && document.getElementById('input_adv_campaign_code').value.trim()) {
            activeCampaignCode = document.getElementById('input_adv_campaign_code').value.trim();
        }

        const leadData = {
            // --- 13 Campos Oficiales del Registro ---
            email: document.getElementById('email').value.trim(),
            f_name: document.getElementById('f_name').value.trim(),
            l_name: document.getElementById('l_name').value.trim(),
            mobile: formattedPhone,
            aut_data: autDataVal,
            gclid: gclidVal,
            sede: document.getElementById('sede').value,
            tp_pgm: document.getElementById('tp_pgm').value,
            esc_pgm: document.getElementById('esc_pgm').value,
            periodo: document.getElementById('periodo').value,
            utm_campaign: activeCampaign,
            c_lead: document.getElementById('c_lead').value || 'Prospeccion',
            origen: document.getElementById('origen').value || 'Charla FS',

            // --- Atribución & Tracking Enriquecido ---
            campaign_code: activeCampaignCode,
            cedula: document.getElementById('cedula').value.trim(),
            colegio_origen: document.getElementById('colegio_origen') ? document.getElementById('colegio_origen').value.trim() : '',
            modalidad: document.getElementById('modalidad_posgrado').value,
            programa: document.getElementById('programa_hidden').value,
            utm_source: document.getElementById('utm_source') ? document.getElementById('utm_source').value : 'prospeccion',
            utm_medium: document.getElementById('utm_medium') ? document.getElementById('utm_medium').value : '',
            utm_term: document.getElementById('utm_term') ? document.getElementById('utm_term').value : '',
            utm_content: document.getElementById('utm_content') ? document.getElementById('utm_content').value : '',
            campaign_name: activeCampaign,
            tiktok_id: getParam('ttclid') || getParam('tiktok_id') || '',
            fbclid: getParam('fbclid') || getParam('fbc') || '',

            // --- Orientación Vocacional (Test Vocacional / Recomendador) ---
            area_vocacional: areaVocVal,
            carrera_recomendada: carrRecVal,
            perfil_vocacional: perfVocVal,

            // --- Asesor Educativo Asignado (1 al 4) ---
            asesor: activeAdvisor.nombre,
            asesor_id: activeAdvisor.id,
            asesor_nombre: activeAdvisor.nombre,
            asesor_email: activeAdvisor.email,
            asesor_sede: activeAdvisor.sede
        };

        // Guardar localmente y sincronizar en Excel (.xlsx) en el servidor
        if (window.LeadsStorage) {
            LeadsStorage.saveLead(leadData);
        }

        // Enviar DataLayer con todos los campos oficiales del registro y tracking enriquecido
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'form_submit',
            form_name: 'uide-prospeccion-app',

            // --- 13 Campos Oficiales del Endpoint del Formulario ---
            email: leadData.email,
            f_name: leadData.f_name,
            l_name: leadData.l_name,
            mobile: leadData.mobile,
            aut_data: leadData.aut_data,
            gclid: leadData.gclid,
            sede: leadData.sede,
            tp_pgm: leadData.tp_pgm,
            esc_pgm: leadData.esc_pgm,
            periodo: leadData.periodo,
            utm_campaign: leadData.utm_campaign,
            c_lead: leadData.c_lead,
            origen: leadData.origen,

            // --- Campos de Compatibilidad y Atribución Enriquecida ---
            utm_source: leadData.utm_source,
            utm_medium: leadData.utm_medium,
            utm_term: leadData.utm_term,
            utm_content: leadData.utm_content,
            campaign_name: leadData.campaign_name,
            colegio_origen: leadData.colegio_origen,
            cedula: leadData.cedula,
            programa: leadData.programa,
            lead_carrera: leadData.programa,
            modalidad: leadData.modalidad,
            form_channel: leadData.c_lead,
            tipo_lead: leadData.origen,
            lead_sede: leadData.sede,
            lead_periodo: leadData.periodo,

            // --- Datos Vocacionales ---
            area_vocacional: leadData.area_vocacional,
            carrera_recomendada: leadData.carrera_recomendada,
            perfil_vocacional: leadData.perfil_vocacional,

            // --- Asesor Educativo Asignado (1 al 4) ---
            asesor_id: activeAdvisor.id,
            asesor_nombre: activeAdvisor.nombre,
            asesor_email: activeAdvisor.email,
            asesor_sede: activeAdvisor.sede
        });

        triggerDataLayerIdentified(leadData);

        // Desconexión de Pardot: almacenamiento directo en XLSX y confirmación visual
        phoneField.value = formattedPhone;

        if (typeof App !== 'undefined' && App.showSuccessScreen) {
            App.showSuccessScreen(leadData);
        } else {
            alert(`✅ ¡Registro Guardado con Éxito!\n\nProspecto: ${leadData.f_name} ${leadData.l_name}\nCampaña: ${leadData.utm_campaign}\nAlmacenado en Excel (.xlsx).`);
            form.reset();
            syncAdvisorData(activeAdvisor);
            syncManualCampaign();
            updatePeriodo();
        }
    }

    return {
        init,
        syncAdvisorData,
        updatePeriodo,
        validatePhone,
        validateCedula,
        PROGRAMAS_DATA
    };
})();
