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
        this.navLinks = document.querySelectorAll('.nav__link, .nav__brand-link');
        // KORRIGIERT: Separate Abfrage für Buttons, die Seiten wechseln
        this.pageLinkButtons = document.querySelectorAll('[data-page-link]');
        this.pages = document.querySelectorAll('.page');
        this.mobileToggle = document.getElementById('navToggle');
        this.mobileMenu = document.getElementById('navMenu');
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

        // KORRIGIERT: Eigene Event-Listener für die Buttons
        this.pageLinkButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = button.getAttribute('data-page-link');
                this.showPage(pageId);
                // NEU: Setzt den passenden Nav-Link aktiv
                const correspondingNavLink = document.querySelector(`.nav__link[data-page="${pageId}"]`);
                if (correspondingNavLink) {
                    this.setActiveLink(correspondingNavLink);
                }
                this.closeMobileMenu();
            });
        });

        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        this.showPage('startseite');
        console.log('Navigation manager initialized');
    }

    showPage(pageId) {
        if (!pageId) return;

        console.log(`Attempting to show page: ${pageId}`);
        this.pages.forEach(page => {
            page.classList.remove('page--active');
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('page--active');
            this.currentPage = pageId;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.error(`Page with ID "${pageId}" not found.`);
        }
    }

    setActiveLink(activeLink) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    toggleMobileMenu() {
        this.mobileMenu.classList.toggle('active');
        this.mobileToggle.classList.toggle('active');
    }

    closeMobileMenu() {
        if (this.mobileMenu.classList.contains('active')) {
            this.toggleMobileMenu();
        }
    }
}

// Interaction Management (für Formular und visuelle Effekte)
class InteractionManager {
    constructor() {
        this.init();
    }

    init() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }

        // Visueller Klick-Effekt für Buttons
        const allButtons = document.querySelectorAll('.btn');
        allButtons.forEach(button => {
            button.addEventListener('mousedown', () => button.style.transform = 'scale(0.98)');
            button.addEventListener('mouseup', () => button.style.transform = 'scale(1)');
            button.addEventListener('mouseleave', () => button.style.transform = 'scale(1)');
        });
    }

    handleContactSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const feedbackElement = document.getElementById('form-feedback');

        feedbackElement.textContent = 'Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.';
        feedbackElement.className = 'success';
        feedbackElement.style.display = 'block';

        form.reset();

        setTimeout(() => {
            feedbackElement.style.display = 'none';
        }, 5000);
    }
}

// Main Application
class App {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => this.initializeManagers());
    }

    initializeManagers() {
        try {
            console.log('Initializing website managers...');
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