export class NavigationManager {
    constructor() {
        this.navToggle = document.getElementById('navToggle');
        this.navMenu = document.getElementById('navMenu');
        this.pages = document.querySelectorAll('.page');
        this.navLinks = document.querySelectorAll('.nav__link');
        this.navigationTriggers = document.querySelectorAll('[data-page], [data-page-link], #homeBtn');
        this.currentPage = 'startseite';
        this.body = document.body;
        this.init();
    }
    init() {
        this.navigationTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = trigger.getAttribute('data-page') || trigger.getAttribute('data-page-link') || 'startseite';
                this.showPage(pageId);
            });
        });
        if (this.navToggle) { this.navToggle.addEventListener('click', () => this.toggleMobileMenu()); }
        this.showPage('startseite');
    }
    toggleMobileMenu() {
        if (this.navToggle && this.navMenu) {
            this.navToggle.classList.toggle('active');
            this.navMenu.classList.toggle('active');
        }
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
        this.updateActiveNavLink();
        if (pageId === 'shop') {
            this.body.classList.add('shop-active');
        } else {
            this.body.classList.remove('shop-active');
        }
    }
    updateActiveNavLink() {
        this.navLinks.forEach(link => {
            link.getAttribute('data-page') === this.currentPage ? link.classList.add('active') : link.classList.remove('active');
        });
    }
}