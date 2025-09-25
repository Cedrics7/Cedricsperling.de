export class CookieManager {
    constructor() {
        this.banner = document.getElementById('cookie-consent-banner');
        this.modal = document.getElementById('cookie-modal');
        if (!this.banner) return;

        this.acceptAllBtn = document.getElementById('cookie-accept-all');
        this.customizeBtn = document.getElementById('cookie-customize');
        this.rejectAllBtn = document.getElementById('cookie-reject-all');
        this.closeModalBtn = document.getElementById('cookie-modal-close');
        this.prefsForm = document.getElementById('cookie-prefs-form');
        this.settingsTrigger = document.getElementById('cookie-settings-trigger');

        this.consentCookieName = 'user_cookie_consent';
        this.init();
    }

    init() {
        const consent = this.getCookie(this.consentCookieName);
        if (consent) {
            this.banner.style.display = 'none';
            // Skripte basierend auf gespeicherter Einwilligung laden
            this.loadScripts(consent);
        } else {
            setTimeout(() => this.showBanner(), 500);
        }

        this.acceptAllBtn.addEventListener('click', () => this.acceptAll());
        this.rejectAllBtn.addEventListener('click', () => this.rejectAll());
        this.customizeBtn.addEventListener('click', () => this.showModal());
        this.closeModalBtn.addEventListener('click', () => this.hideModal());
        this.prefsForm.addEventListener('submit', (e) => this.savePreferences(e));

        if (this.settingsTrigger) {
            this.settingsTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal();
            });
        }
    }

    setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (JSON.stringify(value) || "") + expires + "; path=/; SameSite=Lax";
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return JSON.parse(c.substring(nameEQ.length, c.length));
                } catch (e) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
        }
        return null;
    }

    showBanner() {
        this.banner.classList.add('visible');
    }

    hideBanner() {
        this.banner.classList.remove('visible');
    }

    showModal() {
        // Lade die aktuellen Einstellungen ins Modal, bevor es angezeigt wird
        const consent = this.getCookie(this.consentCookieName) || {};
        document.getElementById('cookie-functional').checked = !!consent.functional;
        document.getElementById('cookie-analytics').checked = !!consent.analytics;
        document.getElementById('cookie-marketing').checked = !!consent.marketing;
        this.modal.style.display = 'block';
    }

    hideModal() {
        this.modal.style.display = 'none';
    }

    acceptAll() {
        const prefs = {
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString()
        };
        this.setCookie(this.consentCookieName, prefs, 365);
        this.hideBanner();
        this.loadScripts(prefs);
    }

    rejectAll() {
        const prefs = {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString()
        };
        this.setCookie(this.consentCookieName, prefs, 365);
        this.hideBanner();
        this.loadScripts(prefs);
    }

    savePreferences(e) {
        e.preventDefault();
        const prefs = {
            necessary: true,
            functional: document.getElementById('cookie-functional').checked,
            analytics: document.getElementById('cookie-analytics').checked,
            marketing: document.getElementById('cookie-marketing').checked,
            timestamp: new Date().toISOString()
        };
        this.setCookie(this.consentCookieName, prefs, 365);
        this.hideBanner();
        this.hideModal();
        this.loadScripts(prefs);
    }

    hasConsent(category) {
        const consent = this.getCookie(this.consentCookieName);
        return consent && consent[category];
    }

    loadScripts(prefs) {
        console.log("Cookie-Einwilligung erteilt:", prefs);
        if (prefs.analytics) {
            console.log("Lade Analyse-Skripte...");
        }
        if (prefs.marketing) {
            console.log("Lade Marketing-Skripte...");
        }
    }
}