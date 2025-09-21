// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.themeToggle = document.getElementById('themeToggle');
        this.body = document.body;
        this.init();
    }
    init() {
        this.setTheme('dark');
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
    setTheme(theme) {
        this.currentTheme = theme;
        this.body.setAttribute('data-color-scheme', theme);
    }
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
}

// Navigation Management
class NavigationManager {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav__link');
        this.pageLinkButtons = document.querySelectorAll('[data-page-link]');
        this.pages = document.querySelectorAll('.page');
        this.mobileToggle = document.getElementById('navToggle');
        this.mobileMenu = document.getElementById('navMenu');
        this.homeBtn = document.getElementById('homeBtn');
        this.currentPage = 'startseite';
        this.init();
    }

    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                this.showPage(pageId);
                this.setActiveLink(link);
                this.closeMobileMenu();
            });
        });

        this.pageLinkButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = button.getAttribute('data-page-link');
                this.showPage(pageId);
                const correspondingNavLink = document.querySelector(`.nav__link[data-page="${pageId}"]`);
                if (correspondingNavLink) this.setActiveLink(correspondingNavLink);
                this.closeMobileMenu();
            });
        });

        if (this.homeBtn) {
            this.homeBtn.addEventListener('click', () => {
                this.showPage('startseite');
                const homeLink = document.querySelector('.nav__link[data-page="startseite"]');
                this.setActiveLink(homeLink);
            });
        }

        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        this.showPage('startseite');
    }

    showPage(pageId) {
        if (!pageId) return;
        this.pages.forEach(page => page.classList.remove('page--active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('page--active');
            this.currentPage = pageId;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    setActiveLink(activeLink) {
        this.navLinks.forEach(link => link.classList.remove('active'));
        if (activeLink) activeLink.classList.add('active');
    }

    toggleMobileMenu() {
        // Logik für das mobile Menü
    }

    closeMobileMenu() {
        // Logik zum Schließen des mobilen Menüs
    }
}

// Interaction Management (mit PHP-Anbindung)
class InteractionManager {
    constructor() {
        this.init();
    }

    init() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }
    }

    handleContactSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const feedbackElement = document.getElementById('form-feedback');
        const submitButton = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);

        submitButton.disabled = true;
        submitButton.textContent = 'Sende...';

        fetch('send_mail.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.text().then(text => ({ ok: response.ok, text })))
            .then(data => {
                feedbackElement.textContent = data.text;
                if (data.ok) {
                    feedbackElement.className = 'success';
                    form.reset();
                } else {
                    feedbackElement.className = 'error';
                }
            })
            .catch(error => {
                feedbackElement.textContent = 'Ein Netzwerkfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
                feedbackElement.className = 'error';
                console.error('Fetch Error:', error);
            })
            .finally(() => {
                feedbackElement.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = 'Nachricht senden';

                setTimeout(() => { feedbackElement.style.display = 'none'; }, 6000);
            });
    }
}

// Main Application
class App {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => this.initializeManagers());
    }

    initializeManagers() {
        try {
            new ThemeManager();
            new NavigationManager();
            new InteractionManager();
            console.log('Website successfully initialized');
        } catch (error) {
            console.error('Error initializing website:', error);
        }
    }
}

// Initialize the application
const app = new App();