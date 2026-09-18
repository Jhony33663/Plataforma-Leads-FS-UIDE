/**
 * App - Controlador principal de la aplicación móvil de prospección UIDE
 * Maneja sesión multi-asesor (1 al 4), pantalla frontal con QR independiente,
 * portal Linktree para estudiantes y envío a DataLayer sin alterar UTM sources.
 */

const App = (function() {
    // 4 Cuentas de Asesores Educativos Institucionales Oficiales UIDE
    const ADVISOR_ACCOUNTS = {
        'asesoreducativo1@uide.edu.ec': {
            id: 'ADV-01',
            nombre: 'Andrés Ruiz',
            email: 'asesoreducativo1@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234561',
            whatsapp: '593991234561',
            sede: 'Quito'
        },
        'asesoreducativo2@uide.edu.ec': {
            id: 'ADV-02',
            nombre: 'Andrés Mancero',
            email: 'asesoreducativo2@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234562',
            whatsapp: '593991234562',
            sede: 'Quito'
        },
        'asesoreducativo3@uide.edu.ec': {
            id: 'ADV-03',
            nombre: 'Andrew Figueroa',
            email: 'asesoreducativo3@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234563',
            whatsapp: '593991234563',
            sede: 'Quito'
        },
        'asesoreducativo4@uide.edu.ec': {
            id: 'ADV-04',
            nombre: 'Ghandi Tobar',
            email: 'asesoreducativo4@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234564',
            whatsapp: '593991234564',
            sede: 'Quito'
        },
        // Alias de compatibilidad por nombres y correos institucionales
        'andres.ruiz@uide.edu.ec': {
            id: 'ADV-01',
            nombre: 'Andrés Ruiz',
            email: 'asesoreducativo1@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234561',
            whatsapp: '593991234561',
            sede: 'Quito'
        },
        'andres.mancero@uide.edu.ec': {
            id: 'ADV-02',
            nombre: 'Andrés Mancero',
            email: 'asesoreducativo2@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234562',
            whatsapp: '593991234562',
            sede: 'Quito'
        },
        'andrew.figueroa@uide.edu.ec': {
            id: 'ADV-03',
            nombre: 'Andrew Figueroa',
            email: 'asesoreducativo3@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234563',
            whatsapp: '593991234563',
            sede: 'Quito'
        },
        'ghandi.tobar@uide.edu.ec': {
            id: 'ADV-04',
            nombre: 'Ghandi Tobar',
            email: 'asesoreducativo4@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234564',
            whatsapp: '593991234564',
            sede: 'Quito'
        },
        // Alias numéricos anteriores
        'asesor1@uide.edu.ec': {
            id: 'ADV-01',
            nombre: 'Andrés Ruiz',
            email: 'asesoreducativo1@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234561',
            whatsapp: '593991234561',
            sede: 'Quito'
        },
        'asesor2@uide.edu.ec': {
            id: 'ADV-02',
            nombre: 'Andrés Mancero',
            email: 'asesoreducativo2@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234562',
            whatsapp: '593991234562',
            sede: 'Quito'
        },
        'asesor3@uide.edu.ec': {
            id: 'ADV-03',
            nombre: 'Andrew Figueroa',
            email: 'asesoreducativo3@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234563',
            whatsapp: '593991234563',
            sede: 'Quito'
        },
        'asesor4@uide.edu.ec': {
            id: 'ADV-04',
            nombre: 'Ghandi Tobar',
            email: 'asesoreducativo4@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234564',
            whatsapp: '593991234564',
            sede: 'Quito'
        },
        'andy': {
            id: 'ADV-01',
            nombre: 'Andrés Ruiz',
            email: 'asesoreducativo1@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234561',
            whatsapp: '593991234561',
            sede: 'Quito'
        },
        'andresito': {
            id: 'ADV-02',
            nombre: 'Andrés Mancero',
            email: 'asesoreducativo2@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234562',
            whatsapp: '593991234562',
            sede: 'Quito'
        },
        'andrew': {
            id: 'ADV-03',
            nombre: 'Andrew Figueroa',
            email: 'asesoreducativo3@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234563',
            whatsapp: '593991234563',
            sede: 'Quito'
        },
        'gandy': {
            id: 'ADV-04',
            nombre: 'Ghandi Tobar',
            email: 'asesoreducativo4@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234564',
            whatsapp: '593991234564',
            sede: 'Quito'
        }
    };

    let currentAdvisor = { ...ADVISOR_ACCOUNTS['asesoreducativo1@uide.edu.ec'] };
    let currentEventType = 'Charla FS'; // 'Charla FS' | 'Ferias FS' | 'Visita a campus'
    let currentRole = 'cliente'; // 'cliente' (stand con QR) | 'asesor' (herramientas)
    let currentQrTargetUrl = '';
    let leadsFilterMode = 'my'; // 'my' (solo del asesor creador) | 'all' (todos los asesores)

    /* Normalización de número WhatsApp para generar wa.link / wa.me directo */
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

    function getStoredAdvisor(email) {
        const key = (email || '').toLowerCase();
        const base = ADVISOR_ACCOUNTS[key] || {
            id: 'ADV-01',
            nombre: 'Andrés Ruiz',
            email: key || 'asesoreducativo1@uide.edu.ec',
            titulo: 'Asesor Educativo',
            telefono: '+593991234561',
            whatsapp: '593991234561',
            sede: 'Quito'
        };
        try {
            const saved = localStorage.getItem('uide_adv_custom_' + key);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...base, ...parsed };
            }
        } catch(e) {}
        return { ...base };
    }

    function persistAdvisorCustomization(adv) {
        if (!adv || !adv.email) return;
        const key = adv.email.toLowerCase();
        try {
            localStorage.setItem('uide_adv_custom_' + key, JSON.stringify({
                nombre: adv.nombre,
                titulo: adv.titulo,
                telefono: adv.telefono,
                whatsapp: adv.whatsapp,
                sede: adv.sede
            }));
            if (ADVISOR_ACCOUNTS[key]) {
                ADVISOR_ACCOUNTS[key] = { ...ADVISOR_ACCOUNTS[key], ...adv };
            }
        } catch(e) {}
    }

    function sanitizeSlug(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function sanitizeCampaignName(str) {
        if (!str) return '';
        return str
            .toUpperCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function getMediumForEventType(tipo) {
        if (!tipo) return 'charla_colegios';
        const t = tipo.toLowerCase();
        if (t.includes('feria')) return 'ferias_colegios';
        if (t.includes('visita') || t.includes('campus')) return 'visita_campus';
        return 'charla_colegios';
    }

    function generateDefaultUtms(advisor, eventType, eventName) {
        const medium = getMediumForEventType(eventType || 'Charla FS');
        const term = `${advisor && advisor.id ? advisor.id : 'ADV-01'}_${((advisor && advisor.nombre) || 'Asesor').replace(/\s+/g, '_')}`;
        
        const cleanEvent = sanitizeCampaignName(eventName);
        let prefix = 'CHARLA_FS';
        const evLower = (eventType || '').toLowerCase();
        if (evLower.includes('feria')) prefix = 'FERIAS_FS';
        else if (evLower.includes('visita') || evLower.includes('campus')) prefix = 'VISITA_CAMPUS';

        const campaign = cleanEvent 
            ? `PROSPECCION_${prefix}_${cleanEvent}_2026` 
            : `PROSPECCION_${prefix}_GENERAL_2026`;

        const content = eventName ? sanitizeSlug(eventName) : 'general';

        return {
            utm_source: 'prospeccion',
            utm_medium: medium,
            utm_campaign: campaign,
            utm_term: term,
            utm_content: content
        };
    }

    function getStoredAdvisorCampaign(email) {
        if (!email) return null;
        try {
            const raw = localStorage.getItem('uide_adv_campaign_' + email.toLowerCase());
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    function persistAdvisorCampaign(email, data) {
        if (!email || !data) return;
        try {
            localStorage.setItem('uide_adv_campaign_' + email.toLowerCase(), JSON.stringify(data));
        } catch (e) {}
    }

    function init() {
        loadSession();
        bindNavigation();
        bindEventSelector();
        bindRoleSwitcher();
        bindAdvisorDropdownMenu();
        bindLoginModal();
        bindAdvisorModal();
        bindLeadsModal();
        bindCampaignsManager();
        bindLeadEditModal();
        bindQrSharing();
        updateAdvisorUI();
        selectEventType(currentEventType);
        checkUrlParams();
        updateQrCode();
        updateStatsUI();
        UIDEForm.init();
        UIDEForm.syncAdvisorData(currentAdvisor);
    }

    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Tipo de evento
        const tipo = urlParams.get('tipo');
        if (tipo) {
            if (tipo.toLowerCase().includes('charla')) selectEventType('Charla FS');
            else if (tipo.toLowerCase().includes('feria')) selectEventType('Ferias FS');
            else if (tipo.toLowerCase().includes('visita') || tipo.toLowerCase().includes('campus')) selectEventType('Visita a campus');
            else selectEventType(tipo);
        }

        // Asesor por email o ID desde URL
        const emailParam = urlParams.get('asesor_email');
        if (emailParam && ADVISOR_ACCOUNTS[emailParam.toLowerCase()]) {
            currentAdvisor = getStoredAdvisor(emailParam.toLowerCase());
        } else {
            const asesorParam = urlParams.get('asesor') || urlParams.get('asesor_nombre');
            if (asesorParam) currentAdvisor.nombre = decodeURIComponent(asesorParam);
            const idParam = urlParams.get('asesor_id');
            if (idParam) currentAdvisor.id = idParam;
        }

        const wsParam = urlParams.get('ws');
        if (wsParam) {
            const cleanWs = normalizeWhatsAppNumber(wsParam);
            currentAdvisor.whatsapp = cleanWs;
            currentAdvisor.telefono = '+' + cleanWs;
        }

        // Modo de arranque y soporte de enlaces compartidos para todos los módulos
        const modo = (urlParams.get('modo') || urlParams.get('view') || urlParams.get('modulo') || '').toLowerCase();
        if (modo === 'linktree' || modo === 'cliente' || modo === 'portal') {
            switchView('linktree-view');
        } else if (modo === 'vocacional' || modo === 'test' || modo === 'carrera' || modo === 'orientacion') {
            if (typeof VocationalTest !== 'undefined') {
                VocationalTest.startTest();
            } else {
                switchView('vocational-view');
            }
        } else if (modo === 'form' || modo === 'formulario' || modo === 'registro') {
            switchView('form-view');
        } else if (modo === 'leads' || modo === 'prospectos') {
            if (typeof AdvisorAuth !== 'undefined' && AdvisorAuth.isAuthenticated()) {
                setRole('asesor');
                switchView('leads-view');
            } else {
                setRole('cliente');
                switchView('stand-view');
                if (typeof AdvisorAuth !== 'undefined') {
                    AdvisorAuth.openPinModal(() => {
                        setRole('asesor');
                        switchView('leads-view');
                    });
                }
            }
        } else if (modo === 'asesor' || modo === 'panel') {
            if (typeof AdvisorAuth !== 'undefined' && AdvisorAuth.isAuthenticated()) {
                setRole('asesor');
                switchView('stand-view');
            } else {
                setRole('cliente');
                switchView('stand-view');
                if (typeof AdvisorAuth !== 'undefined') {
                    AdvisorAuth.openPinModal(() => {
                        setRole('asesor');
                    });
                }
            }
        } else {
            setRole('cliente');
            switchView('stand-view');
        }

        // Soporte de enlace directo a modal de configuración de asesor
        const modalParam = (urlParams.get('modal') || urlParams.get('config') || '').toLowerCase();
        if (modalParam === 'advisor' || modalParam === 'config' || modalParam === 'perfil' || modalParam === 'true') {
            const advModal = document.getElementById('advisor_modal');
            if (advModal) {
                if (typeof AdvisorAuth !== 'undefined') {
                    AdvisorAuth.requireAuth(() => advModal.classList.add('active'));
                } else {
                    advModal.classList.add('active');
                }
            }
        }
    }

    function loadSession() {
        try {
            const savedEmail = localStorage.getItem('uide_active_advisor_email') || 'asesoreducativo1@uide.edu.ec';
            currentAdvisor = getStoredAdvisor(savedEmail);
        } catch (e) {
            console.error(e);
            currentAdvisor = getStoredAdvisor('asesoreducativo1@uide.edu.ec');
        }
    }

    function switchAdvisor(email) {
        currentAdvisor = getStoredAdvisor(email);
        try {
            localStorage.setItem('uide_active_advisor_email', email);
        } catch (e) {}

        updateAdvisorUI();
        updateQrCode();
        UIDEForm.syncAdvisorData(currentAdvisor);
        renderLeadsTable();
        updateStatsUI();
        showToast(`Sesión activa: ${currentAdvisor.nombre} (${currentAdvisor.id})`);
    }

    function updateAdvisorUI() {
        const nameEl = document.getElementById('profile_advisor_name');
        const titleEl = document.getElementById('profile_advisor_title');
        const ltNameEl = document.getElementById('linktree_advisor_name');
        const ltTitleEl = document.getElementById('linktree_advisor_title');
        const sessionBadge = document.getElementById('session_advisor_badge');
        const metaEl = document.getElementById('credential_advisor_meta_text');
        const dropdownAdvName = document.getElementById('dropdown_active_advisor_name');

        if (nameEl) nameEl.textContent = currentAdvisor.nombre;
        if (titleEl) titleEl.textContent = currentAdvisor.titulo;
        if (ltNameEl) ltNameEl.textContent = currentAdvisor.nombre;
        if (ltTitleEl) ltTitleEl.textContent = `${currentAdvisor.titulo} (${currentAdvisor.sede})`;
        if (sessionBadge) sessionBadge.textContent = `${currentAdvisor.id}`;
        if (dropdownAdvName) dropdownAdvName.textContent = `${currentAdvisor.id} • ${currentAdvisor.nombre}`;
        if (metaEl) metaEl.textContent = `${currentAdvisor.email} • ${currentAdvisor.sede}`;

        // Marcado activo en el modal de login y actualización de números
        document.querySelectorAll('.advisor-select-card').forEach(card => {
            const email = card.dataset.email;
            card.classList.toggle('active', email === currentAdvisor.email);
            if (email) {
                const adv = getStoredAdvisor(email);
                const descSpan = card.querySelector('.card-details span');
                if (descSpan) {
                    const cleanWs = normalizeWhatsAppNumber(adv.whatsapp || adv.telefono);
                    descSpan.textContent = `${adv.email} • ${adv.sede} • 💬 ${cleanWs ? '+' + cleanWs : 'Configurar'}`;
                }
            }
        });

        // Generar enlace directo wa.me / walink para Linktree
        const wsNumber = normalizeWhatsAppNumber(currentAdvisor.whatsapp || currentAdvisor.telefono);
        const wsLink = generateWhatsAppLink(wsNumber, currentAdvisor.nombre);
        
        const ltWsBtn = document.getElementById('btn_linktree_whatsapp');
        if (ltWsBtn) ltWsBtn.href = wsLink;

        updateLinktreeOutgoingLinks();
    }

    // Actualiza los enlaces del Linktree para propagar el tracking del asesor hacia la web UIDE
    function updateLinktreeOutgoingLinks() {
        const utmParams = `utm_source=prospeccion&utm_medium=asesor_qr&utm_campaign=TRAFICO_GENERAL_OTROS_MEDIOS_IT1_2026&utm_term=${currentAdvisor.id}`;
        
        const links = [
            { id: 'link_uide_carreras', base: 'https://www.uide.edu.ec/programas-academicos/' },
            { id: 'link_uide_campus', base: 'https://www.uide.edu.ec/campus-quito/' }
        ];

        links.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                const sep = item.base.includes('?') ? '&' : '?';
                el.href = `${item.base}${sep}${utmParams}`;
            }
        });
    }

    function updateQrCode() {
        const qrImg = document.getElementById('front_qr_image');
        const qrHint = document.getElementById('front_qr_hint_url');
        if (!qrImg) return;

        const wsNumber = normalizeWhatsAppNumber(currentAdvisor.whatsapp || currentAdvisor.telefono);

        // Obtener configuración de campaña personalizada o generar valores por defecto
        const savedCampaign = getStoredAdvisorCampaign(currentAdvisor.email);
        const eventName = savedCampaign ? (savedCampaign.eventName || '') : '';
        const defaultUtms = generateDefaultUtms(currentAdvisor, currentEventType, eventName);

        const utmCampaign = (savedCampaign && savedCampaign.utmCampaign) ? savedCampaign.utmCampaign : defaultUtms.utm_campaign;
        const utmContent = (savedCampaign && savedCampaign.utmContent) ? savedCampaign.utmContent : defaultUtms.utm_content;
        const utmMedium = defaultUtms.utm_medium;
        const utmTerm = defaultUtms.utm_term;
        const utmSource = 'prospeccion';

        // URL independiente para el QR de cada asesor con todos los parámetros UTM y colegio
        const baseUrl = window.location.origin + window.location.pathname;
        let targetUrl = `${baseUrl}?modo=linktree&tipo=${encodeURIComponent(currentEventType)}&asesor_id=${encodeURIComponent(currentAdvisor.id)}&asesor_email=${encodeURIComponent(currentAdvisor.email)}&asesor_nombre=${encodeURIComponent(currentAdvisor.nombre)}&asesor_sede=${encodeURIComponent(currentAdvisor.sede)}&ws=${encodeURIComponent(wsNumber)}&utm_source=${encodeURIComponent(utmSource)}&utm_medium=${encodeURIComponent(utmMedium)}&utm_campaign=${encodeURIComponent(utmCampaign)}&utm_term=${encodeURIComponent(utmTerm)}&utm_content=${encodeURIComponent(utmContent)}`;

        if (eventName) {
            targetUrl += `&colegio=${encodeURIComponent(eventName)}`;
        }

        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&color=002d72&bgcolor=ffffff&data=${encodeURIComponent(targetUrl)}`;
        qrImg.src = qrApiUrl;
        if (qrHint) qrHint.textContent = targetUrl;
        currentQrTargetUrl = targetUrl;
    }

    function bindQrSharing() {
        const shareBtn = document.getElementById('btn_share_qr');
        const copyBtn = document.getElementById('btn_copy_qr_link');

        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const shareUrl = currentQrTargetUrl || window.location.href;
                const shareTitle = `UIDE - Admisiones (${currentAdvisor.nombre})`;
                const shareText = `¡Hola! Conéctate con la UIDE y tu Asesor Educativo ${currentAdvisor.nombre} para conocer nuestras carreras, becas y admisiones:`;

                if (navigator.share) {
                    navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: shareUrl
                    }).catch(() => {});
                } else {
                    // Fallback directo a WhatsApp
                    const waMsg = encodeURIComponent(`${shareText} ${shareUrl}`);
                    window.open(`https://api.whatsapp.com/send?text=${waMsg}`, '_blank');
                }
                showToast(`Compartiendo QR de ${currentAdvisor.nombre}`);
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const shareUrl = currentQrTargetUrl || window.location.href;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        showToast('¡Enlace del QR copiado al portapapeles!');
                    }).catch(() => {
                        prompt('Copia este enlace de tu evento:', shareUrl);
                    });
                } else {
                    prompt('Copia este enlace de tu evento:', shareUrl);
                }
            });
        }
    }

    function bindRoleSwitcher() {
        const toggleBtn = document.getElementById('btn_toggle_role');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                if (currentRole === 'cliente') {
                    if (typeof AdvisorAuth !== 'undefined') {
                        AdvisorAuth.requireAuth(() => {
                            setRole('asesor');
                        }, null, currentAdvisor.email);
                    } else {
                        setRole('asesor');
                    }
                } else {
                    setRole('cliente');
                }
            });
        }
    }

    function bindAdvisorDropdownMenu() {
        const menuToggle = document.getElementById('btn_advisor_menu_toggle');
        const dropdown = document.getElementById('advisor_dropdown_menu');
        const configProfileBtn = document.getElementById('btn_menu_config_profile');
        const editAdvisorBtn = document.getElementById('btn_edit_advisor');

        if (menuToggle && dropdown) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.toggle('active');
                menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });

            // Cerrar menú al hacer clic en cualquiera de las opciones del menú
            dropdown.querySelectorAll('.dropdown-menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    dropdown.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                });
            });

            // Cerrar al hacer clic en cualquier lugar fuera del menú
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target) && !menuToggle.contains(e.target)) {
                    dropdown.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });

            // Cerrar con la tecla Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && dropdown.classList.contains('active')) {
                    dropdown.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }

        if (configProfileBtn && editAdvisorBtn) {
            configProfileBtn.addEventListener('click', () => {
                editAdvisorBtn.click();
            });
        }

        const menuCampaignsBtn = document.getElementById('btn_menu_manage_campaigns');
        if (menuCampaignsBtn) {
            menuCampaignsBtn.addEventListener('click', () => {
                const crudBtn = document.getElementById('btn_open_campaigns_crud');
                if (crudBtn) crudBtn.click();
            });
        }
    }

    function setRole(role) {
        currentRole = role;
        const roleLabel = document.getElementById('current_role_label');
        const roleBtn = document.getElementById('btn_toggle_role');
        const navLeadsTab = document.getElementById('tab_leads_nav');
        const eventSelectorBar = document.getElementById('lead_type_selector_bar');
        const bottomNav = document.querySelector('.bottom-nav-bar');
        const appWrapper = document.querySelector('.phone-mockup-wrapper');
        const lockBtn = document.getElementById('btn_lock_advisor_session');

        if (role === 'asesor') {
            if (appWrapper) {
                appWrapper.classList.remove('stand-mode');
                appWrapper.classList.add('advisor-mode');
            }
            if (roleLabel) roleLabel.innerHTML = '👨‍💼 Modo: <strong>Asesor</strong>';
            if (roleBtn) roleBtn.textContent = 'Ver Stand 👁️';
            if (navLeadsTab) navLeadsTab.style.display = 'flex';
            if (eventSelectorBar) eventSelectorBar.style.display = 'block';
            if (bottomNav) bottomNav.style.display = 'flex';
            if (lockBtn) lockBtn.style.display = 'flex';
            showToast('Modo Asesor activado');
        } else {
            if (appWrapper) {
                appWrapper.classList.add('stand-mode');
                appWrapper.classList.remove('advisor-mode');
            }
            if (roleLabel) roleLabel.innerHTML = '🪪 Modo: <strong>Stand QR</strong>';
            if (roleBtn) roleBtn.textContent = 'Panel Asesor ⚙️';
            if (navLeadsTab) navLeadsTab.style.display = 'none';
            if (eventSelectorBar) eventSelectorBar.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
            if (lockBtn) lockBtn.style.display = 'none';
            switchView('stand-view');
            showToast('Modo Stand: Foto, Nombre y QR');
        }
    }

    function bindLoginModal() {
        const modal = document.getElementById('login_modal');
        const openBtn = document.getElementById('btn_open_login');
        const closeBtn = document.getElementById('btn_close_login_modal');
        const cards = document.querySelectorAll('.advisor-select-card');
        const customForm = document.getElementById('custom_login_form');

        if (openBtn && modal) {
            openBtn.addEventListener('click', () => {
                if (typeof AdvisorAuth !== 'undefined') {
                    AdvisorAuth.requireAuth(() => modal.classList.add('active'));
                } else {
                    modal.classList.add('active');
                }
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        }

        cards.forEach(card => {
            card.addEventListener('click', () => {
                const email = card.dataset.email;
                if (email) {
                    switchAdvisor(email);
                    modal.classList.remove('active');
                }
            });
        });

        const configCurrentBtn = document.getElementById('btn_modal_config_current');
        if (configCurrentBtn && modal) {
            configCurrentBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                const editAdvBtn = document.getElementById('btn_edit_advisor');
                if (editAdvBtn) editAdvBtn.click();
            });
        }

        if (customForm && modal) {
            customForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const customEmail = document.getElementById('custom_advisor_email').value.trim().toLowerCase();
                if (ADVISOR_ACCOUNTS[customEmail]) {
                    switchAdvisor(customEmail);
                } else if (customEmail.includes('@uide.edu.ec')) {
                    const customAdv = {
                        id: 'ADV-CUSTOM',
                        nombre: customEmail.split('@')[0].replace('.', ' ').toUpperCase(),
                        email: customEmail,
                        titulo: 'Asesor Educativo • Admisiones UIDE',
                        telefono: '+593991234560',
                        whatsapp: '593991234560',
                        sede: 'Quito'
                    };
                    ADVISOR_ACCOUNTS[customEmail] = customAdv;
                    switchAdvisor(customEmail);
                } else {
                    alert('Por favor ingresa un correo institucional @uide.edu.ec');
                    return;
                }
                modal.classList.remove('active');
            });
        }
    }

    function bindNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetView = tab.dataset.view;
                if (targetView === 'leads-view') {
                    if (typeof AdvisorAuth !== 'undefined' && !AdvisorAuth.isAuthenticated()) {
                        AdvisorAuth.requireAuth(() => switchView('leads-view'), null, currentAdvisor.email);
                        return;
                    }
                }
                switchView(targetView);
            });
        });

        // Abrir Linktree desde botón de prueba en stand
        const testLtBtn = document.getElementById('btn_open_linktree_view');
        if (testLtBtn) {
            testLtBtn.addEventListener('click', () => switchView('linktree-view'));
        }

        // Botón 1 en Linktree: Ir al Formulario designado para el evento
        const ltFormBtn = document.getElementById('btn_linktree_to_form');
        if (ltFormBtn) {
            ltFormBtn.addEventListener('click', () => switchView('form-view'));
        }

        // Botón volver de Formulario a Linktree
        const backLtBtn = document.getElementById('btn_back_to_linktree');
        if (backLtBtn) {
            backLtBtn.addEventListener('click', () => switchView('linktree-view'));
        }

        // Botón iniciar test vocacional desde el stand
        const standVocBtn = document.getElementById('btn_stand_start_vocational');
        if (standVocBtn) {
            standVocBtn.addEventListener('click', () => {
                if (typeof VocationalTest !== 'undefined') {
                    VocationalTest.startTest();
                } else {
                    switchView('vocational-view');
                }
            });
        }

        // Botón volver de Test Vocacional a Linktree
        const backVocBtn = document.getElementById('btn_back_voc_to_lt');
        if (backVocBtn) {
            backVocBtn.addEventListener('click', () => switchView('linktree-view'));
        }

        // Botón 2 en Linktree: Ver Links (despliega / oculta enlaces y redes sociales)
        const toggleLinksBtn = document.getElementById('btn_lt_ver_links');
        const linksWrapper = document.getElementById('linktree_links_wrapper');
        const arrowLinks = document.getElementById('arrow_lt_links');

        if (toggleLinksBtn && linksWrapper) {
            toggleLinksBtn.addEventListener('click', () => {
                const isOpen = linksWrapper.classList.toggle('open');
                if (arrowLinks) {
                    arrowLinks.textContent = isOpen ? '▲' : '▼';
                }
                if (isOpen) {
                    linksWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }
    }

    function switchView(viewId) {
        if (viewId === 'leads-view' && typeof AdvisorAuth !== 'undefined' && !AdvisorAuth.isAuthenticated()) {
            AdvisorAuth.requireAuth(() => switchView('leads-view'), null, currentAdvisor.email);
            return;
        }

        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === viewId);
        });

        const activePanel = document.getElementById(viewId);
        if (activePanel) {
            activePanel.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (viewId === 'leads-view') {
            renderLeadsTable();
            updateStatsUI();
        }
        if (viewId === 'form-view' && typeof UIDEForm !== 'undefined') {
            UIDEForm.syncAdvisorData(currentAdvisor);
        }
    }

    function bindEventSelector() {
        const chips = document.querySelectorAll('.event-chip, .stand-event-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const tipo = chip.dataset.tipo;
                if (tipo) {
                    selectEventType(tipo);
                    showToast(`Canal Prospección: ${tipo}`);
                }
            });
        });
    }

    function selectEventType(tipo) {
        currentEventType = tipo;
        
        // Sincronizar todos los chips (panel asesor y stand)
        document.querySelectorAll('.event-chip, .stand-event-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.tipo === tipo);
        });

        // Actualizar input oculto para envío Pardot
        const origenHidden = document.getElementById('origen');
        if (origenHidden) origenHidden.value = tipo;

        // Icono representativo
        let icon = '🎓';
        if (tipo.includes('Feria')) icon = '🎪';
        else if (tipo.includes('Visita') || tipo.includes('campus')) icon = '🏛️';

        // 1. Etiqueta visual en el Stand
        const standLabel = document.getElementById('stand_qr_event_label');
        if (standLabel) standLabel.textContent = `${icon} ${tipo}`;

        // 2. Banner informativo en el Linktree
        const ltEventName = document.getElementById('linktree_event_name');
        if (ltEventName) ltEventName.textContent = `${icon} ${tipo}`;

        // 3. Subtítulo del Botón 1 de acción en el Linktree
        const btnFormDesc = document.getElementById('btn_form_desc');
        if (btnFormDesc) btnFormDesc.textContent = `Registro oficial para ${tipo}`;

        // 4. Badge en la parte superior del formulario
        const formBadge = document.getElementById('form_event_badge_tag');
        if (formBadge) formBadge.textContent = `${icon} ${tipo}`;

        // 5. Encabezado explicativo en el formulario
        const formHeaderHint = document.getElementById('form_header_event_hint');
        if (formHeaderHint) formHeaderHint.innerHTML = `Estás registrándote para: <strong>${tipo}</strong>`;

        // 6. Banner general en el modo asesor
        const bannerTipo = document.getElementById('current_lead_type_banner');
        if (bannerTipo) bannerTipo.textContent = tipo;

        // Actualizar QR con el tipo de evento codificado
        updateQrCode();
    }

    function bindAdvisorModal() {
        const modal = document.getElementById('advisor_modal');
        const editBtn = document.getElementById('btn_edit_advisor');
        const closeBtn = document.getElementById('btn_close_advisor_modal');
        const form = document.getElementById('advisor_form');
        const phoneInput = document.getElementById('input_adv_phone');
        const previewText = document.getElementById('advisor_walink_preview_text');
        const previewBtn = document.getElementById('btn_test_walink');
        const sedeInput = document.getElementById('input_adv_sede');

        // Controles de Campaña & UTMs
        const eventNameInput = document.getElementById('input_adv_event_name');
        const utmCampaignInput = document.getElementById('input_adv_utm_campaign');
        const campaignCodeInput = document.getElementById('input_adv_campaign_code');
        const utmContentInput = document.getElementById('input_adv_utm_content');

        const previewMed = document.getElementById('preview_utm_medium_text');
        const previewCmp = document.getElementById('preview_utm_campaign_text');
        const previewTrm = document.getElementById('preview_utm_term_text');
        const previewCnt = document.getElementById('preview_utm_content_text');
        const previewCode = document.getElementById('preview_campaign_code_text');

        let isCustomCampaignUserEdited = false;

        function updateModalUtmPreview() {
            const evName = eventNameInput ? eventNameInput.value.trim() : '';
            const gen = generateDefaultUtms(currentAdvisor, currentEventType, evName);

            const userCmp = utmCampaignInput ? utmCampaignInput.value.trim() : '';
            const userCnt = utmContentInput ? utmContentInput.value.trim() : '';
            const userCode = campaignCodeInput ? campaignCodeInput.value.trim() : '';

            const activeCmp = userCmp || gen.utm_campaign;
            const activeCnt = userCnt || gen.utm_content;
            const activeCode = userCode || (typeof CampaignsManager !== 'undefined' ? CampaignsManager.getActiveCampaignCode() : '701PA00000pPa4mYAC');

            if (previewMed) previewMed.textContent = gen.utm_medium;
            if (previewCmp) previewCmp.textContent = activeCmp;
            if (previewTrm) previewTrm.textContent = gen.utm_term;
            if (previewCnt) previewCnt.textContent = activeCnt;
            if (previewCode) previewCode.textContent = activeCode;
        }

        if (eventNameInput) {
            eventNameInput.addEventListener('input', () => {
                const evName = eventNameInput.value.trim();
                const gen = generateDefaultUtms(currentAdvisor, currentEventType, evName);
                if (!isCustomCampaignUserEdited && utmCampaignInput) {
                    utmCampaignInput.value = gen.utm_campaign;
                }
                if (utmContentInput && (!utmContentInput.value || utmContentInput.value === 'general' || !isCustomCampaignUserEdited)) {
                    utmContentInput.value = gen.utm_content;
                }
                updateModalUtmPreview();
            });
        }

        if (utmCampaignInput) {
            utmCampaignInput.addEventListener('input', () => {
                isCustomCampaignUserEdited = true;
                updateModalUtmPreview();
            });
        }

        if (utmContentInput) {
            utmContentInput.addEventListener('input', updateModalUtmPreview);
        }

        if (campaignCodeInput) {
            campaignCodeInput.addEventListener('input', updateModalUtmPreview);
        }

        function updateModalWalinkPreview() {
            if (!phoneInput) return;
            const raw = phoneInput.value;
            const clean = normalizeWhatsAppNumber(raw);
            const link = generateWhatsAppLink(clean, currentAdvisor.nombre);
            if (previewText) {
                previewText.textContent = clean ? `wa.me/${clean}` : 'Ingresa tu número celular...';
            }
            if (previewBtn) {
                previewBtn.href = clean ? link : '#';
                previewBtn.style.opacity = clean ? '1' : '0.4';
                previewBtn.style.pointerEvents = clean ? 'auto' : 'none';
            }
        }

        if (phoneInput) {
            phoneInput.addEventListener('input', updateModalWalinkPreview);
        }

        if (editBtn && modal) {
            editBtn.addEventListener('click', () => {
                const openEditModal = () => {
                    document.getElementById('input_adv_name').value = currentAdvisor.nombre;
                    document.getElementById('input_adv_title').value = currentAdvisor.titulo;
                    document.getElementById('input_adv_phone').value = currentAdvisor.telefono || currentAdvisor.whatsapp;
                    document.getElementById('input_adv_email').value = currentAdvisor.email;
                    if (sedeInput) sedeInput.value = currentAdvisor.sede || 'Quito';

                    // Cargar datos de campaña almacenados para este asesor
                    const savedCampaign = getStoredAdvisorCampaign(currentAdvisor.email);
                    const evName = savedCampaign ? (savedCampaign.eventName || '') : '';
                    const gen = generateDefaultUtms(currentAdvisor, currentEventType, evName);

                    if (eventNameInput) eventNameInput.value = evName;
                    if (utmCampaignInput) {
                        utmCampaignInput.value = (savedCampaign && savedCampaign.utmCampaign) ? savedCampaign.utmCampaign : gen.utm_campaign;
                    }
                    if (campaignCodeInput) {
                        const defaultCode = (typeof CampaignsManager !== 'undefined' ? CampaignsManager.getActiveCampaignCode() : '701PA00000pPa4mYAC');
                        campaignCodeInput.value = (savedCampaign && savedCampaign.campaignCode) ? savedCampaign.campaignCode : defaultCode;
                    }
                    if (utmContentInput) {
                        utmContentInput.value = (savedCampaign && savedCampaign.utmContent) ? savedCampaign.utmContent : gen.utm_content;
                    }

                    isCustomCampaignUserEdited = !!(savedCampaign && savedCampaign.utmCampaign && savedCampaign.utmCampaign !== gen.utm_campaign);

                    const pinField = document.getElementById('input_adv_pin');
                    if (pinField && typeof AdvisorAuth !== 'undefined') {
                        pinField.value = AdvisorAuth.getAdvisorPin(currentAdvisor.email);
                    }

                    updateModalWalinkPreview();
                    updateModalUtmPreview();
                    modal.classList.add('active');
                };

                if (typeof AdvisorAuth !== 'undefined') {
                    AdvisorAuth.requireAuth(openEditModal, null, currentAdvisor.email);
                } else {
                    openEditModal();
                }
            });
        }

        const copyFormBtn = document.getElementById('btn_copy_advisor_form_link');
        if (copyFormBtn) {
            copyFormBtn.addEventListener('click', () => {
                const evName = eventNameInput ? eventNameInput.value.trim() : '';
                const gen = generateDefaultUtms(currentAdvisor, currentEventType, evName);
                const activeCmp = (utmCampaignInput && utmCampaignInput.value.trim()) || gen.utm_campaign;
                const activeCnt = (utmContentInput && utmContentInput.value.trim()) || gen.utm_content;
                const origin = window.location.origin || '';
                const pathname = window.location.pathname || '';
                const formUrl = `${origin}${pathname}?modo=form&asesor_id=${encodeURIComponent(currentAdvisor.id)}&asesor_email=${encodeURIComponent(currentAdvisor.email)}&utm_campaign=${encodeURIComponent(activeCmp)}&utm_content=${encodeURIComponent(activeCnt)}`;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(formUrl).then(() => {
                        showToast(`Enlace al formulario de ${currentAdvisor.nombre} copiado 📋`);
                    }).catch(() => {
                        prompt('Copia el enlace directo a tu formulario:', formUrl);
                    });
                } else {
                    prompt('Copia el enlace directo a tu formulario:', formUrl);
                }
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        }

        if (form && modal) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const rawPhone = document.getElementById('input_adv_phone').value.trim();
                const cleanWs = normalizeWhatsAppNumber(rawPhone);

                currentAdvisor.nombre = document.getElementById('input_adv_name').value.trim();
                currentAdvisor.titulo = document.getElementById('input_adv_title').value.trim();
                currentAdvisor.telefono = rawPhone;
                currentAdvisor.whatsapp = cleanWs;
                currentAdvisor.email = document.getElementById('input_adv_email').value.trim();
                if (sedeInput) currentAdvisor.sede = sedeInput.value;

                // Guardar personalización de PIN del asesor
                const pinField = document.getElementById('input_adv_pin');
                if (pinField && typeof AdvisorAuth !== 'undefined') {
                    const newPin = pinField.value.trim();
                    if (newPin) {
                        AdvisorAuth.setAdvisorPin(currentAdvisor.email, newPin);
                    }
                }

                // Guardar personalización de campaña
                const evName = eventNameInput ? eventNameInput.value.trim() : '';
                const utmCmp = utmCampaignInput ? utmCampaignInput.value.trim() : '';
                const utmCnt = utmContentInput ? utmContentInput.value.trim() : '';
                const utmCode = campaignCodeInput ? campaignCodeInput.value.trim() : '';
                const gen = generateDefaultUtms(currentAdvisor, currentEventType, evName);
                const defaultCode = (typeof CampaignsManager !== 'undefined' ? CampaignsManager.getActiveCampaignCode() : '701PA00000pPa4mYAC');

                persistAdvisorCampaign(currentAdvisor.email, {
                    eventName: evName,
                    utmCampaign: utmCmp || gen.utm_campaign,
                    utmContent: utmCnt || gen.utm_content,
                    campaignCode: utmCode || defaultCode
                });

                persistAdvisorCustomization(currentAdvisor);
                updateAdvisorUI();
                updateQrCode();
                UIDEForm.syncAdvisorData(currentAdvisor);
                modal.classList.remove('active');
                showToast(`Perfil y campaña de ${currentAdvisor.nombre} guardados`);
            });
        }
    }

    function bindLeadsModal() {
        const exportCsvBtn = document.getElementById('btn_export_csv');
        const exportJsonBtn = document.getElementById('btn_export_json');
        const exportMdBtn = document.getElementById('btn_export_md');
        const clearBtn = document.getElementById('btn_clear_leads');
        const filterMyBtn = document.getElementById('btn_filter_my_leads');
        const filterAllBtn = document.getElementById('btn_filter_all_leads');
        const syncBtn = document.getElementById('btn_sync_leads');

        if (filterMyBtn) {
            filterMyBtn.addEventListener('click', () => {
                leadsFilterMode = 'my';
                filterMyBtn.classList.add('active');
                if (filterAllBtn) filterAllBtn.classList.remove('active');
                renderLeadsTable();
                updateStatsUI();
            });
        }

        if (filterAllBtn) {
            filterAllBtn.addEventListener('click', () => {
                leadsFilterMode = 'all';
                filterAllBtn.classList.add('active');
                if (filterMyBtn) filterMyBtn.classList.remove('active');
                renderLeadsTable();
                updateStatsUI();
            });
        }

        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                const targetAdv = leadsFilterMode === 'my' ? currentAdvisor.id : null;
                if (targetAdv && typeof LeadsStorage !== 'undefined' && LeadsStorage.syncLeadsFromServer) {
                    syncBtn.classList.add('syncing');
                    syncBtn.disabled = true;
                    LeadsStorage.syncLeadsFromServer(targetAdv)
                        .finally(() => {
                            syncBtn.classList.remove('syncing');
                            syncBtn.disabled = false;
                            renderLeadsTable();
                            updateStatsUI();
                        });
                }
            });
        }

        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                const targetAdv = leadsFilterMode === 'my' ? currentAdvisor.id : null;
                LeadsStorage.exportToCSV(targetAdv);
            });
        }

        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                const targetAdv = leadsFilterMode === 'my' ? currentAdvisor.id : null;
                LeadsStorage.exportToJSON(targetAdv);
            });
        }

        if (exportMdBtn) {
            exportMdBtn.addEventListener('click', () => {
                const targetAdv = leadsFilterMode === 'my' ? currentAdvisor.id : null;
                LeadsStorage.exportToMD(targetAdv);
            });
        }

        const exportXlsxBtn = document.getElementById('btn_export_xlsx_campaign');
        const exportCsvCampaignBtn = document.getElementById('btn_export_csv_campaign');
        const campaignFilterSelect = document.getElementById('select_leads_campaign_filter');

        if (exportXlsxBtn) {
            exportXlsxBtn.addEventListener('click', () => {
                const selCamp = campaignFilterSelect ? campaignFilterSelect.value : 'ALL';
                const target = (selCamp && selCamp !== 'ALL') ? selCamp : (leadsFilterMode === 'my' ? currentAdvisor.id : null);
                LeadsStorage.exportToXLSX(target);
            });
        }

        if (exportCsvCampaignBtn) {
            exportCsvCampaignBtn.addEventListener('click', () => {
                const selCamp = campaignFilterSelect ? campaignFilterSelect.value : 'ALL';
                const target = (selCamp && selCamp !== 'ALL') ? selCamp : (leadsFilterMode === 'my' ? currentAdvisor.id : null);
                LeadsStorage.exportOfficialCSV(target);
            });
        }

        if (campaignFilterSelect) {
            campaignFilterSelect.addEventListener('change', () => {
                renderLeadsTable();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const targetAdv = leadsFilterMode === 'my' ? currentAdvisor.id : null;
                if (LeadsStorage.clearAllLeads(targetAdv)) {
                    renderLeadsTable();
                    updateStatsUI();
                    showToast(targetAdv ? `Prospectos de ${currentAdvisor.id} eliminados` : 'Todos los prospectos eliminados');
                }
            });
        }
    }

    function updateStatsUI() {
        const targetAdv = leadsFilterMode === 'my' ? currentAdvisor.id : null;
        const stats = LeadsStorage.getStats(targetAdv);
        const statTotal = document.getElementById('stat_total_leads');
        const statHoy = document.getElementById('stat_hoy_leads');
        const statCharla = document.getElementById('stat_charla_leads');
        const statFeria = document.getElementById('stat_feria_leads');
        const statCampus = document.getElementById('stat_campus_leads');

        if (statTotal) statTotal.textContent = stats.total;
        if (statHoy) statHoy.textContent = stats.totalHoy;
        if (statCharla) statCharla.textContent = stats.charlaFS;
        if (statFeria) statFeria.textContent = stats.feriasFS;
        if (statCampus) statCampus.textContent = stats.visitaCampus;

        const badgeCount = document.getElementById('leads_nav_badge');
        if (badgeCount) {
            const myStats = LeadsStorage.getStats(currentAdvisor.id);
            badgeCount.textContent = myStats.total;
        }

        const advLabel = document.getElementById('leads_active_advisor_label');
        if (advLabel) {
            if (leadsFilterMode === 'my') {
                advLabel.textContent = `${currentAdvisor.nombre} (${currentAdvisor.id})`;
            } else {
                advLabel.textContent = `Todos los Asesores (Consolidado)`;
            }
        }
    }

    function renderLeadsTable() {
        const container = document.getElementById('leads_table_body');
        if (!container) return;

        const targetAdv = leadsFilterMode === 'my' ? currentAdvisor.id : null;

        // 1. Mostrar loading inmediato
        container.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">⏳ Cargando prospectos...</td></tr>';

        // 2. Renderizar leads locales INSTANTÁNEO (sin await)
        const localLeads = targetAdv ? LeadsStorage.getLeadsByAdvisor(targetAdv) : LeadsStorage.getAllLeads();
        renderLeadsRows(localLeads, targetAdv);

        // 3. Si no hay leads locales, sincronizar desde servidor en background
        if (localLeads.length === 0 && targetAdv && typeof LeadsStorage !== 'undefined' && LeadsStorage.syncLeadsFromServer) {
            LeadsStorage.syncLeadsFromServer(targetAdv)
                .then(() => {
                    const syncedLeads = targetAdv ? LeadsStorage.getLeadsByAdvisor(targetAdv) : LeadsStorage.getAllLeads();
                    renderLeadsRows(syncedLeads, targetAdv);
                })
                .catch(() => {}); // Silencioso, ya mostramos lo local
        }
    }

    function renderLeadsRows(leads, targetAdv) {
        const container = document.getElementById('leads_table_body');
        if (!container) return;

        const campaignFilterSelect = document.getElementById('select_leads_campaign_filter');
        let selectedCampaign = 'ALL';
        if (campaignFilterSelect) {
            selectedCampaign = campaignFilterSelect.value || 'ALL';
            const uniqueCampaigns = LeadsStorage.getUniqueCampaigns ? LeadsStorage.getUniqueCampaigns() : [];
            const prevVal = selectedCampaign;
            campaignFilterSelect.innerHTML = '<option value="ALL">Todas las Campañas</option>' +
                uniqueCampaigns.map(c => `<option value="${escapeHtml(c)}"${c === prevVal ? ' selected' : ''}>${escapeHtml(c)}</option>`).join('');
            selectedCampaign = campaignFilterSelect.value;
        }

        // Filtrar por campaña si se seleccionó una
        let filteredLeads = leads;
        if (selectedCampaign && selectedCampaign !== 'ALL') {
            filteredLeads = leads.filter(l => String(l.utm_campaign || l.campaign_name || 'GENERAL_2026').trim() === selectedCampaign);
        } else {
            filteredLeads = leads;
        }

        if (filteredLeads.length === 0) {
            const emptyMsg = leadsFilterMode === 'my'
                ? `Aún no hay prospectos registrados para ${escapeHtml(currentAdvisor.nombre)} (${escapeHtml(currentAdvisor.id)}).`
                : (selectedCampaign !== 'ALL' ? `No hay prospectos en la campaña "${escapeHtml(selectedCampaign)}".` : 'Aún no se han registrado prospectos en este dispositivo.');
            container.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#888;">${emptyMsg}</td></tr>`;
            return;
        }

        container.innerHTML = filteredLeads.map((lead, idx) => `
            <tr>
                <td><strong>#${filteredLeads.length - idx}</strong></td>
                <td>
                    <div style="font-weight:600; color:#002d72;">${escapeHtml(lead.f_name)} ${escapeHtml(lead.l_name)}</div>
                    <div style="font-size:11px; color:#666;">CI: ${escapeHtml(lead.cedula || 'N/A')}</div>
                    <div style="font-size:10px; color:#888;">👤 ${escapeHtml(lead.asesor_nombre || currentAdvisor.nombre)} (${escapeHtml(lead.asesor_id || currentAdvisor.id)})</div>
                </td>
                <td>
                    <div>${escapeHtml(lead.mobile)}</div>
                    <div style="font-size:11px; color:#888;">${escapeHtml(lead.email)}</div>
                </td>
                <td>
                    <span class="program-badge">${escapeHtml(lead.programa || lead.sede)}</span>
                    <div style="font-size:10px; color:#555;">${escapeHtml(lead.colegio_origen || 'Particular')}</div>
                    <div style="font-size:9.5px; color:#1e3a8a; margin-top:2px;">🎯 ${escapeHtml(lead.utm_campaign || lead.campaign_name || 'General')}</div>
                    <div style="font-size:9px; color:#475569;"><span style="background:#e0e7ff; color:#3730a3; padding:1px 4px; border-radius:3px; font-family:monospace;">${escapeHtml(lead.campaign_code || '701PA00000pPa4mYAC')}</span></div>
                </td>
                <td>
                    <span class="origin-badge ${getBadgeClass(lead.origen)}">${escapeHtml(lead.origen || 'Charla FS')}</span>
                    <div style="font-size:9px; color:#64748b; margin-top:2px;" title="Celdas F, G, H fijas del formato de carga">F: 1 | G: Prospeccion | H: ${escapeHtml(lead.origen || 'Charla FS')}</div>
                </td>
                <td>
                    <div style="display:flex; gap:4px; align-items:center;">
                        <a href="https://wa.me/${(lead.mobile || '').replace(/\D/g, '')}?text=${encodeURIComponent('¡Hola ' + (lead.f_name || '') + '! Un gusto saludarte desde la UIDE. Te saluda ' + (lead.asesor_nombre || currentAdvisor.nombre) + '. Con gusto te asesoro sobre la carrera de ' + (lead.programa || 'tu interés') + '.')}" target="_blank" class="table-ws-btn" title="Escribir por WhatsApp">💬</a>
                        <button type="button" class="btn-leads-action btn-edit-lead" data-id="${escapeHtml(lead.id)}" style="background:#f1f5f9; color:#0f172a; padding:4px 6px; border:1px solid #cbd5e1; border-radius:4px; font-size:11px; cursor:pointer;" title="Editar este prospecto">✏️</button>
                        <button type="button" class="btn-leads-action btn-delete-lead" data-id="${escapeHtml(lead.id)}" style="background:#fef2f2; color:#b91c1c; padding:4px 6px; border:1px solid #fca5a5; border-radius:4px; font-size:11px; cursor:pointer;" title="Eliminar este prospecto">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function getBadgeClass(origen) {
        if (origen === 'Charla FS') return 'badge-charla';
        if (origen === 'Ferias FS') return 'badge-feria';
        return 'badge-campus';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function showSuccessScreen(leadData) {
        const modal = document.getElementById('success_modal');
        if (!modal) return;

        document.getElementById('success_lead_name').textContent = `${leadData.f_name} ${leadData.l_name}`;
        document.getElementById('success_lead_program').textContent = leadData.programa || 'Programa Académico UIDE';
        document.getElementById('success_lead_campus').textContent = `${leadData.sede}`;
        
        const campDisplay = document.getElementById('success_lead_campaign');
        if (campDisplay) campDisplay.textContent = `🎯 Campaña: ${leadData.utm_campaign || 'General'}`;

        const idDisplay = document.getElementById('success_lead_id');
        if (idDisplay) idDisplay.textContent = `ID: ${leadData.id || ''}`;

        const wsFollowBtn = document.getElementById('btn_success_whatsapp');
        if (wsFollowBtn) {
            const cleanPhone = leadData.mobile.replace(/\D/g, '');
            const msg = encodeURIComponent(`¡Hola ${leadData.f_name}! Un gusto contactarte desde la UIDE. Te saluda ${currentAdvisor.nombre}. Registramos tu interés en ${leadData.programa || 'nuestros programas'}. ¿En qué te puedo asesorar hoy?`);
            wsFollowBtn.href = `https://wa.me/${cleanPhone}?text=${msg}`;
        }

        modal.classList.add('active');

        const vocRecapBtn = document.getElementById('btn_success_voc_recap');
        if (vocRecapBtn) {
            const hasVocResult = typeof VocationalTest !== 'undefined' && VocationalTest.hasPendingResult && VocationalTest.hasPendingResult();
            vocRecapBtn.style.display = hasVocResult ? 'flex' : 'none';
            vocRecapBtn.onclick = () => {
                modal.classList.remove('active');
                if (typeof VocationalTest !== 'undefined' && VocationalTest.revealResult) {
                    VocationalTest.revealResult(leadData);
                    switchView('vocational-view');
                }
            };
        }

        const btnAnother = document.getElementById('btn_success_another');
        if (btnAnother) {
            btnAnother.onclick = () => {
                modal.classList.remove('active');
                resetLeadForm();
                switchView('form-view');
            };
        }

        updateStatsUI();
        showToast('¡Prospecto registrado con éxito!');
    }

    function resetLeadForm() {
        const form = document.getElementById('pardot-form');
        if (form) form.reset();
        document.getElementById('carrera_container').style.display = 'none';
        document.getElementById('modalidad_container').style.display = 'none';
        document.getElementById('tp_pgm').disabled = true;
        document.getElementById('tp_pgm').innerHTML = '<option value="">Tipo de programa *</option>';
        document.getElementById('carrera_select').innerHTML = '<option value="">Selecciona tu programa *</option>';
        document.getElementById('origen').value = currentEventType;
        UIDEForm.syncAdvisorData(currentAdvisor);
        UIDEForm.updatePeriodo();
    }

    function showToast(msg) {
        const toast = document.getElementById('toast_message');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3200);
    }
    function bindCampaignsManager() {
        const crudModal = document.getElementById('campaigns_crud_modal');
        const formModal = document.getElementById('campaign_form_modal');
        const openMenuBtn = document.getElementById('btn_menu_manage_campaigns');
        const openCrudBtn = document.getElementById('btn_open_campaigns_crud');
        const quickNewBtn = document.getElementById('btn_create_campaign_quick');
        const openNewBtn = document.getElementById('btn_open_new_campaign_modal');
        const closeCrudBtn = document.getElementById('btn_close_campaigns_crud_modal');
        const closeFormBtn = document.getElementById('btn_close_campaign_form_modal');
        const searchInput = document.getElementById('input_search_campaigns');
        const campaignForm = document.getElementById('campaign_edit_form');
        const tableBody = document.getElementById('campaigns_table_body');

        function openCrud() {
            if (typeof AdvisorAuth !== 'undefined' && !AdvisorAuth.isAuthenticated()) {
                AdvisorAuth.requireAuth(() => {
                    if (crudModal) crudModal.classList.add('active');
                    renderCampaignsTable();
                }, null, currentAdvisor.email);
                return;
            }
            if (crudModal) crudModal.classList.add('active');
            renderCampaignsTable();
        }

        if (openMenuBtn) openMenuBtn.addEventListener('click', openCrud);
        if (openCrudBtn) openCrudBtn.addEventListener('click', openCrud);
        if (closeCrudBtn && crudModal) {
            closeCrudBtn.addEventListener('click', () => crudModal.classList.remove('active'));
        }

        function openNewCampaign() {
            if (campaignForm) campaignForm.reset();
            const idField = document.getElementById('input_cmp_id');
            if (idField) idField.value = '';
            const codeField = document.getElementById('input_cmp_code');
            if (codeField) codeField.value = '';
            const titleField = document.getElementById('campaign_modal_title');
            if (titleField) titleField.textContent = 'Crear Nueva Campaña';
            const advSelect = document.getElementById('select_cmp_advisor');
            if (advSelect) advSelect.value = currentAdvisor.id;
            const sedeSelect = document.getElementById('select_cmp_sede');
            if (sedeSelect) sedeSelect.value = currentAdvisor.sede;
            const originSelect = document.getElementById('select_cmp_origin');
            if (originSelect) originSelect.value = currentEventType;
            if (formModal) formModal.classList.add('active');
        }

        if (openNewBtn) openNewBtn.addEventListener('click', openNewCampaign);
        if (quickNewBtn) quickNewBtn.addEventListener('click', openNewCampaign);
        if (closeFormBtn && formModal) {
            closeFormBtn.addEventListener('click', () => formModal.classList.remove('active'));
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderCampaignsTable(searchInput.value.trim());
            });
        }

        if (campaignForm) {
            campaignForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const cmpId = (document.getElementById('input_cmp_id').value || '').trim();
                const rawName = document.getElementById('input_cmp_name').value.trim();
                const eventName = document.getElementById('input_cmp_event').value.trim();
                const code = (document.getElementById('input_cmp_code').value || '').trim();
                const origin = document.getElementById('select_cmp_origin').value;
                const sede = document.getElementById('select_cmp_sede').value;
                const advisorId = document.getElementById('select_cmp_advisor').value;
                const status = document.getElementById('select_cmp_status').value;
                const cascadeCheck = document.getElementById('check_cmp_cascade');
                const cascade = cascadeCheck ? cascadeCheck.checked : true;

                try {
                    if (cmpId) {
                        CampaignsManager.updateCampaign(cmpId, {
                            name: rawName,
                            event_name: eventName,
                            code,
                            origin,
                            sede,
                            asesor_id: advisorId,
                            status
                        }, cascade);
                        showToast('Campaña actualizada exitosamente');
                    } else {
                        const created = CampaignsManager.createCampaign({
                            name: rawName,
                            event_name: eventName,
                            code,
                            origin,
                            sede,
                            asesor_id: advisorId,
                            status
                        });
                        CampaignsManager.setActiveCampaign(created.name);
                        showToast(`Campaña ${created.name} creada y activada`);
                    }

                    if (formModal) formModal.classList.remove('active');
                    renderCampaignsTable();
                    renderLeadsTable();
                    updateStatsUI();
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const btnActivate = e.target.closest('.btn-activate-cmp');
                const btnEdit = e.target.closest('.btn-edit-cmp');
                const btnXlsx = e.target.closest('.btn-xlsx-cmp');
                const btnCsv = e.target.closest('.btn-csv-cmp');
                const btnDelete = e.target.closest('.btn-delete-cmp');

                if (btnActivate) {
                    const cmpId = btnActivate.dataset.id;
                    const active = CampaignsManager.setActiveCampaign(cmpId);
                    showToast(`Campaña activa: ${active}`);
                    renderCampaignsTable();
                    updateQrCode();
                    UIDEForm.syncManualCampaign();
                } else if (btnEdit) {
                    const cmpId = btnEdit.dataset.id;
                    const cmp = CampaignsManager.getById(cmpId);
                    if (!cmp) return;
                    document.getElementById('input_cmp_id').value = cmp.id;
                    document.getElementById('input_cmp_name').value = cmp.name;
                    document.getElementById('input_cmp_event').value = cmp.event_name || '';
                    const codeInp = document.getElementById('input_cmp_code');
                    if (codeInp) codeInp.value = cmp.code || '';
                    document.getElementById('select_cmp_origin').value = cmp.origin || 'Ferias FS';
                    document.getElementById('select_cmp_sede').value = cmp.sede || 'Quito';
                    document.getElementById('select_cmp_advisor').value = cmp.asesor_id || 'ALL';
                    document.getElementById('select_cmp_status').value = cmp.status || 'ACTIVA';
                    document.getElementById('campaign_modal_title').textContent = 'Editar Campaña';
                    if (formModal) formModal.classList.add('active');
                } else if (btnXlsx) {
                    const cmpName = btnXlsx.dataset.name;
                    LeadsStorage.exportToXLSX(cmpName);
                } else if (btnCsv) {
                    const cmpName = btnCsv.dataset.name;
                    LeadsStorage.exportOfficialCSV(cmpName);
                } else if (btnDelete) {
                    const cmpId = btnDelete.dataset.id;
                    const cmp = CampaignsManager.getById(cmpId);
                    if (!cmp) return;
                    if (confirm(`¿Estás seguro de eliminar la campaña "${cmp.name}"?`)) {
                        CampaignsManager.deleteCampaign(cmpId);
                        showToast(`Campaña ${cmp.name} eliminada`);
                        renderCampaignsTable();
                        renderLeadsTable();
                    }
                }
            });
        }
    }

    function renderCampaignsTable(filterText = '') {
        const tableBody = document.getElementById('campaigns_table_body');
        if (!tableBody) return;

        let campaigns = typeof CampaignsManager !== 'undefined' ? CampaignsManager.getAll() : [];
        if (filterText) {
            const query = filterText.toLowerCase();
            campaigns = campaigns.filter(c =>
                (c.name || '').toLowerCase().includes(query) ||
                (c.event_name || '').toLowerCase().includes(query)
            );
        }

        const activeName = typeof CampaignsManager !== 'undefined' ? CampaignsManager.getActiveCampaignName() : '';

        if (campaigns.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No se encontraron campañas.</td></tr>';
            return;
        }

        tableBody.innerHTML = campaigns.map(c => {
            const isActive = c.name === activeName;
            const statusBadge = c.status === 'ACTIVA'
                ? '<span style="background:#dcfce7; color:#15803d; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">🟢 ACTIVA</span>'
                : '<span style="background:#f1f5f9; color:#64748b; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">⚪ INACTIVA</span>';
            
            return `
                <tr style="${isActive ? 'background:#f0fdf4;' : ''}">
                    <td>
                        <div style="font-weight:700; color:var(--uide-navy); font-size:12px;">
                            ${isActive ? '⚡ ' : ''}${escapeHtml(c.name)}
                        </div>
                        <div style="font-size:11px; color:#64748b;">${escapeHtml(c.event_name || 'Evento general')}</div>
                        <div style="font-size:10px; color:#475569; margin-top:2px;">🏷️ Código: <code style="background:#e0e7ff; color:#3730a3; padding:1px 4px; border-radius:3px; font-family:monospace;">${escapeHtml(c.code || '701PA00000pPa4mYAC')}</code></div>
                    </td>
                    <td>
                        <div><span class="origin-badge ${getBadgeClass(c.origin)}">${escapeHtml(c.origin || 'Ferias FS')}</span></div>
                        <div style="font-size:10px; color:#64748b; margin-top:2px;">${escapeHtml(c.sede || 'Quito')}</div>
                    </td>
                    <td>
                        <span style="font-size:11px; font-weight:600; color:#334155;">${escapeHtml(c.asesor_id || 'ALL')}</span>
                    </td>
                    <td style="text-align:center;">
                        <span style="background:#e0f2fe; color:#0369a1; font-weight:700; font-size:11px; padding:3px 8px; border-radius:10px;">${c.total_leads || 0}</span>
                    </td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td style="text-align:center;">
                        <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">
                            <button type="button" class="btn-activate-cmp" data-id="${escapeHtml(c.id)}" style="background:${isActive ? '#15803d' : '#f1f5f9'}; color:${isActive ? '#fff' : '#0f172a'}; border:1px solid #cbd5e1; border-radius:4px; padding:3px 6px; font-size:11px; cursor:pointer;" title="${isActive ? 'Campaña actualmente activa' : 'Activar para este stand y formulario'}">
                                ${isActive ? 'Activa ✓' : '⚡ Activar'}
                            </button>
                            <button type="button" class="btn-edit-cmp" data-id="${escapeHtml(c.id)}" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; padding:3px 6px; font-size:11px; cursor:pointer;" title="Editar parámetros de la campaña">✏️</button>
                            <button type="button" class="btn-xlsx-cmp" data-name="${escapeHtml(c.name)}" style="background:#107c41; color:#fff; border:none; border-radius:4px; padding:3px 6px; font-size:11px; cursor:pointer;" title="Descargar Excel (.xlsx) con 21 cabeceras">📗</button>
                            <button type="button" class="btn-csv-cmp" data-name="${escapeHtml(c.name)}" style="background:#0284c7; color:#fff; border:none; border-radius:4px; padding:3px 6px; font-size:11px; cursor:pointer;" title="Descargar CSV liviano con 21 cabeceras">📊</button>
                            <button type="button" class="btn-delete-cmp" data-id="${escapeHtml(c.id)}" style="background:#fef2f2; color:#b91c1c; border:1px solid #fca5a5; border-radius:4px; padding:3px 6px; font-size:11px; cursor:pointer;" title="Eliminar campaña">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function bindLeadEditModal() {
        const modal = document.getElementById('lead_edit_modal');
        const form = document.getElementById('lead_edit_form');
        const closeBtn = document.getElementById('btn_close_lead_edit_modal');
        const deleteBtn = document.getElementById('btn_delete_lead_from_modal');
        const sedeSelect = document.getElementById('select_edit_lead_sede');
        const programSelect = document.getElementById('select_edit_lead_program');
        const campaignSelect = document.getElementById('select_edit_lead_campaign');
        const tableBody = document.getElementById('leads_table_body');

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        }

        function populateProgramsForSede(sede) {
            if (!programSelect) return;
            const catalog = (typeof UIDEForm !== 'undefined' && UIDEForm.PROGRAMAS_DATA) ? UIDEForm.PROGRAMAS_DATA : null;
            let programs = [];
            if (catalog) {
                const key = sede === 'Guayaquil' ? 'pregrado_guayaquil' : (sede === 'Loja' ? 'pregrado_loja' : (sede === 'Online' ? 'online_pregrado' : 'pregrado_quito'));
                programs = catalog[key] || catalog.pregrado_quito || [];
            } else {
                programs = [
                    { id: '558', nombre: 'Administración de Empresas' },
                    { id: '557', nombre: 'Marketing' },
                    { id: '5', nombre: 'Negocios Internacionales' },
                    { id: '52', nombre: 'Medicina' },
                    { id: '8', nombre: 'Ingeniería Automotriz' }
                ];
            }
            programSelect.innerHTML = programs.map(p => `<option value="${escapeHtml(p.id)}|${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)}</option>`).join('');
        }

        function populateCampaigns() {
            if (!campaignSelect) return;
            const campaigns = typeof CampaignsManager !== 'undefined' ? CampaignsManager.getAll() : [];
            const uniqueNames = new Set();
            campaigns.forEach(c => { if (c.name) uniqueNames.add(c.name); });
            const leadCamps = (typeof LeadsStorage !== 'undefined' && LeadsStorage.getUniqueCampaigns) ? LeadsStorage.getUniqueCampaigns() : [];
            leadCamps.forEach(c => uniqueNames.add(c));

            campaignSelect.innerHTML = Array.from(uniqueNames).map(name =>
                `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`
            ).join('');
        }

        if (sedeSelect) {
            sedeSelect.addEventListener('change', () => {
                populateProgramsForSede(sedeSelect.value);
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const btnEdit = e.target.closest('.btn-edit-lead');
                const btnDelete = e.target.closest('.btn-delete-lead');

                if (btnEdit) {
                    const leadId = btnEdit.dataset.id;
                    const lead = LeadsStorage.getAllLeads().find(l => l.id === leadId);
                    if (!lead) return;

                    document.getElementById('input_edit_lead_id').value = lead.id;
                    document.getElementById('input_edit_lead_fname').value = lead.f_name || '';
                    document.getElementById('input_edit_lead_lname').value = lead.l_name || '';
                    document.getElementById('input_edit_lead_cedula').value = lead.cedula || '';
                    document.getElementById('input_edit_lead_phone').value = lead.mobile || '';
                    document.getElementById('input_edit_lead_email').value = lead.email || '';
                    document.getElementById('input_edit_lead_colegio').value = lead.colegio_origen || '';

                    if (sedeSelect) sedeSelect.value = lead.sede || 'Quito';
                    populateProgramsForSede(lead.sede || 'Quito');

                    if (programSelect) {
                        for (let i = 0; i < programSelect.options.length; i++) {
                            const opt = programSelect.options[i];
                            if (opt.value.includes(lead.esc_pgm) || opt.text === lead.programa) {
                                programSelect.selectedIndex = i;
                                break;
                            }
                        }
                    }

                    populateCampaigns();
                    if (campaignSelect) {
                        const curCamp = lead.utm_campaign || lead.campaign_name || 'GENERAL_2026';
                        campaignSelect.value = curCamp;
                    }

                    const editCodeInp = document.getElementById('input_edit_lead_campaign_code');
                    if (editCodeInp) {
                        editCodeInp.value = lead.campaign_code || lead.Campaign__c || '701PA00000pPa4mYAC';
                    }

                    if (modal) modal.classList.add('active');
                } else if (btnDelete) {
                    const leadId = btnDelete.dataset.id;
                    if (confirm('¿Estás seguro de eliminar este prospecto?')) {
                        LeadsStorage.deleteLead(leadId);
                        showToast('Prospecto eliminado');
                        renderLeadsTable();
                        updateStatsUI();
                    }
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const leadId = document.getElementById('input_edit_lead_id').value;
                const fname = document.getElementById('input_edit_lead_fname').value.trim();
                const lname = document.getElementById('input_edit_lead_lname').value.trim();
                const cedula = document.getElementById('input_edit_lead_cedula').value.trim();
                const phone = document.getElementById('input_edit_lead_phone').value.trim();
                const email = document.getElementById('input_edit_lead_email').value.trim().toLowerCase();
                const colegio = document.getElementById('input_edit_lead_colegio').value.trim();
                const sede = document.getElementById('select_edit_lead_sede').value;
                const progVal = document.getElementById('select_edit_lead_program').value;
                const [escPgm, progName] = progVal.split('|');
                const campaign = document.getElementById('select_edit_lead_campaign').value;
                const campaignCode = document.getElementById('input_edit_lead_campaign_code')
                    ? document.getElementById('input_edit_lead_campaign_code').value.trim()
                    : '701PA00000pPa4mYAC';

                LeadsStorage.updateLead(leadId, {
                    f_name: fname,
                    l_name: lname,
                    cedula,
                    mobile: phone,
                    email,
                    colegio_origen: colegio,
                    sede,
                    esc_pgm: escPgm || '558',
                    programa: progName || 'Programa Académico',
                    utm_campaign: campaign,
                    campaign_name: campaign,
                    campaign_code: campaignCode || '701PA00000pPa4mYAC'
                });

                if (modal) modal.classList.remove('active');
                renderLeadsTable();
                updateStatsUI();
                showToast(`Prospecto ${fname} ${lname} actualizado ✨`);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const leadId = document.getElementById('input_edit_lead_id').value;
                if (!leadId) return;
                if (confirm('¿Confirmas que deseas eliminar este prospecto permanentemente?')) {
                    LeadsStorage.deleteLead(leadId);
                    if (modal) modal.classList.remove('active');
                    renderLeadsTable();
                    updateStatsUI();
                    showToast('Prospecto eliminado permanentemente');
                }
            });
        }
    }
    return {
        init,
        switchView,
        switchAdvisor,
        setRole,
        showSuccessScreen,
        showToast,
        generateDefaultUtms,
        getStoredAdvisorCampaign,
        persistAdvisorCampaign,
        getStoredAdvisor: () => ({ ...currentAdvisor }),
        renderCampaignsTable,
        bindCampaignsManager
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
}
