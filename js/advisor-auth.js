/**
 * js/advisor-auth.js
 * Principio SOLID: Responsabilidad Única (SRP) para la seguridad y control de acceso del Asesor.
 * Protege la visualización de prospectos (datos personales LOPDP) mediante PIN personalizable por asesor.
 */

const AdvisorAuth = (function() {
    const AUTH_SESSION_KEY = 'uide_advisor_authenticated_session';
    const DEFAULT_MASTER_PIN = '2026';
    const INSTITUTIONAL_PINS = ['2026', 'UIDE2026', 'uide2026', 'UIDE01', 'UIDE02', 'UIDE03', 'UIDE04', '1001', '1002', '1003', '1004'];

    let pendingSuccessCallback = null;
    let pendingCancelCallback = null;
    let pendingAdvisorEmail = null;

    function getAdvisorPin(email) {
        if (!email) return DEFAULT_MASTER_PIN;
        try {
            const saved = localStorage.getItem('uide_adv_pin_' + email.toLowerCase().trim());
            if (saved && saved.trim()) return saved.trim();
        } catch (e) {}
        return DEFAULT_MASTER_PIN;
    }

    function setAdvisorPin(email, newPin) {
        if (!email || !newPin) return false;
        try {
            const cleanPin = String(newPin).trim();
            localStorage.setItem('uide_adv_pin_' + email.toLowerCase().trim(), cleanPin);
            return true;
        } catch (e) {
            return false;
        }
    }

    function isAuthenticated() {
        try {
            const token = sessionStorage.getItem(AUTH_SESSION_KEY);
            return Boolean(token && token.length > 0);
        } catch (e) {
            return false;
        }
    }

    function verifyPin(pin, advisorEmail = null) {
        if (!pin) return false;
        const normalized = String(pin).trim();

        // 1. Clave personalizada del asesor en sesión o especificado
        if (advisorEmail) {
            const advisorPin = getAdvisorPin(advisorEmail);
            if (normalized === advisorPin || normalized.toUpperCase() === advisorPin.toUpperCase()) {
                return true;
            }
        }

        // 2. Claves institucionales por defecto (2026 o UIDE2026)
        if (INSTITUTIONAL_PINS.includes(normalized) || INSTITUTIONAL_PINS.includes(normalized.toUpperCase())) {
            return true;
        }

        // 3. Claves personalizadas almacenadas para cualquier otro asesor
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('uide_adv_pin_')) {
                    const val = localStorage.getItem(key);
                    if (val && val.trim() === normalized) {
                        return true;
                    }
                }
            }
        } catch (e) {}

        return false;
    }

    function login(pin, advisorEmail = null) {
        if (verifyPin(pin, advisorEmail)) {
            try {
                const normalized = String(pin).trim();
                sessionStorage.setItem(AUTH_SESSION_KEY, normalized);
            } catch (e) {}
            return true;
        }
        return false;
    }

    function logout() {
        try {
            sessionStorage.removeItem(AUTH_SESSION_KEY);
        } catch (e) {}
    }

    function getAuthHeaders() {
        const token = sessionStorage.getItem(AUTH_SESSION_KEY) || DEFAULT_MASTER_PIN;
        return {
            'x-advisor-pin': token
        };
    }

    function openPinModal(onSuccess = null, onCancel = null, advisorEmail = null) {
        pendingSuccessCallback = onSuccess;
        pendingCancelCallback = onCancel;
        pendingAdvisorEmail = advisorEmail;

        const modal = document.getElementById('advisor_auth_modal');
        const pinInput = document.getElementById('input_advisor_pin');
        const errorMsg = document.getElementById('auth_pin_error_msg');

        if (errorMsg) errorMsg.style.display = 'none';
        if (pinInput) {
            pinInput.value = '';
            pinInput.classList.remove('input-error');
        }

        if (modal) {
            modal.classList.add('active');
            setTimeout(() => {
                if (pinInput) pinInput.focus();
            }, 100);
        }
    }

    function closePinModal() {
        const modal = document.getElementById('advisor_auth_modal');
        if (modal) modal.classList.remove('active');
        pendingSuccessCallback = null;
        pendingCancelCallback = null;
        pendingAdvisorEmail = null;
    }

    function requireAuth(onSuccess, onCancel, advisorEmail = null) {
        if (isAuthenticated()) {
            if (typeof onSuccess === 'function') onSuccess();
            return true;
        }
        openPinModal(onSuccess, onCancel, advisorEmail);
        return false;
    }

    function init() {
        const modal = document.getElementById('advisor_auth_modal');
        const submitBtn = document.getElementById('btn_submit_advisor_pin');
        const cancelBtn = document.getElementById('btn_cancel_advisor_pin');
        const pinInput = document.getElementById('input_advisor_pin');
        const errorMsg = document.getElementById('auth_pin_error_msg');
        const lockBtn = document.getElementById('btn_lock_advisor_session');

        function handlePinSubmission() {
            if (!pinInput) return;
            const entered = pinInput.value.trim();
            if (login(entered, pendingAdvisorEmail)) {
                if (errorMsg) errorMsg.style.display = 'none';
                if (modal) modal.classList.remove('active');
                if (typeof pendingSuccessCallback === 'function') {
                    const cb = pendingSuccessCallback;
                    pendingSuccessCallback = null;
                    pendingAdvisorEmail = null;
                    cb();
                }
            } else {
                if (errorMsg) {
                    errorMsg.textContent = 'PIN incorrecto. Ingresa tu clave de Asesor Educativo.';
                    errorMsg.style.display = 'block';
                }
                pinInput.classList.add('input-error');
                pinInput.focus();
                pinInput.select();
            }
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handlePinSubmission();
            });
        }

        if (pinInput) {
            pinInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePinSubmission();
                }
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                closePinModal();
                if (typeof pendingCancelCallback === 'function') {
                    pendingCancelCallback();
                }
            });
        }

        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                logout();
                if (typeof App !== 'undefined' && App.setRole) {
                    App.setRole('cliente');
                }
                if (typeof App !== 'undefined' && App.showToast) {
                    App.showToast('🔒 Sesión de Asesor bloqueada. Modo Stand protegido.');
                }
            });
        }
    }

    return {
        init,
        isAuthenticated,
        verifyPin,
        login,
        logout,
        requireAuth,
        openPinModal,
        closePinModal,
        getAuthHeaders,
        getAdvisorPin,
        setAdvisorPin,
        DEFAULT_MASTER_PIN,
        INSTITUTIONAL_PINS
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvisorAuth };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        AdvisorAuth.init();
    });
}
