// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark'; // Start in dark mode as requested
        this.themeToggle = document.getElementById('themeToggle');
        this.body = document.body;
        
        this.init();
    }
    
    init() {
        // Set initial theme to dark mode
        this.setTheme('dark');
        
        // Add event listener for theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        this.body.setAttribute('data-color-scheme', theme);
        document.documentElement.setAttribute('data-color-scheme', theme);
        
        // Update button aria-label
        if (this.themeToggle) {
            const label = theme === 'dark' ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln';
            this.themeToggle.setAttribute('aria-label', label);
        }
        
        console.log(`Theme switched to: ${theme}`);
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Add a subtle animation effect to the toggle button
        if (this.themeToggle) {
            this.themeToggle.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.themeToggle.style.transform = 'scale(1)';
            }, 150);
        }
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Navigation Management
class NavigationManager {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav__link');
        this.pages = document.querySelectorAll('.page');
        this.mobileToggle = document.getElementById('navToggle');
        this.mobileMenu = document.getElementById('navMenu');
        this.currentPage = 'startseite';
        
        this.init();
    }
    
    init() {
        // Add event listeners for navigation links
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavClick(e);
            });
        });
        
        // Add event listener for mobile menu toggle
        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileMenu();
            });
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Set initial active page
        this.showPage('startseite');
        console.log('Navigation manager initialized');
    }
    
    handleNavClick(e) {
        e.preventDefault();
        const link = e.currentTarget;
        const pageId = link.getAttribute('data-page');
        
        console.log(`Navigation clicked: ${pageId}`);
        
        if (pageId && pageId !== this.currentPage) {
            this.showPage(pageId);
            this.setActiveLink(link);
            
            // Close mobile menu if open
            this.closeMobileMenu();
        }
    }
    
    showPage(pageId) {
        console.log(`Showing page: ${pageId}`);
        
        // Hide all pages
        this.pages.forEach(page => {
            page.classList.remove('page--active');
        });
        
        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('page--active');
            this.currentPage = pageId;
            
            // Scroll to top smoothly
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            console.log(`Successfully switched to page: ${pageId}`);
        } else {
            console.error(`Page not found: ${pageId}`);
        }
    }
    
    setActiveLink(activeLink) {
        // Remove active class from all links
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    toggleMobileMenu() {
        if (this.mobileMenu && this.mobileToggle) {
            const isOpen = this.mobileMenu.classList.contains('active');
            
            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }
    
    openMobileMenu() {
        if (this.mobileMenu && this.mobileToggle) {
            this.mobileMenu.classList.add('active');
            this.mobileToggle.classList.add('active');
            this.mobileToggle.setAttribute('aria-label', 'Menü schließen');
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
            console.log('Mobile menu opened');
        }
    }
    
    closeMobileMenu() {
        if (this.mobileMenu && this.mobileToggle) {
            this.mobileMenu.classList.remove('active');
            this.mobileToggle.classList.remove('active');
            this.mobileToggle.setAttribute('aria-label', 'Menü öffnen');
            
            // Restore body scroll
            document.body.style.overflow = '';
            console.log('Mobile menu closed');
        }
    }
    
    handleOutsideClick(e) {
        const isClickInsideNav = e.target.closest('.nav');
        const isMobileMenuOpen = this.mobileMenu && this.mobileMenu.classList.contains('active');
        
        if (!isClickInsideNav && isMobileMenuOpen) {
            this.closeMobileMenu();
        }
    }
    
    handleResize() {
        // Close mobile menu on resize to larger screen
        if (window.innerWidth > 768 && this.mobileMenu && this.mobileMenu.classList.contains('active')) {
            this.closeMobileMenu();
        }
    }
}

// Button Interactions
class InteractionManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add click handlers for hero buttons
        const heroButtons = document.querySelectorAll('.hero__actions .btn');
        heroButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleButtonClick(e);
            });
        });
        
        // Add hover effects for feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', () => this.addCardHover(card));
            card.addEventListener('mouseleave', () => this.removeCardHover(card));
        });
        
        // Add focus handling for accessibility
        this.handleFocusManagement();
        
        console.log('Interaction manager initialized');
    }
    
    handleButtonClick(e) {
        const button = e.currentTarget;
        const buttonText = button.textContent.trim();
        
        console.log(`Button clicked: ${buttonText}`);
        
        // Add visual feedback
        button.style.transform = 'scale(0.98)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
        
        // Handle different button actions
        if (buttonText === 'Mehr erfahren') {
            // Scroll to features section
            const features = document.querySelector('.features');
            if (features) {
                features.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                console.log('Scrolled to features section');
            }
        } else if (buttonText === 'Kontakt') {
            // Show alert for now - in real app would open contact form
            alert('Kontakt-Funktion würde hier implementiert werden. Vielen Dank für Ihr Interesse!');
            console.log('Contact button action triggered');
        }
    }
    
    addCardHover(card) {
        card.style.transform = 'translateY(-4px)';
    }
    
    removeCardHover(card) {
        card.style.transform = 'translateY(0)';
    }
    
    handleFocusManagement() {
        // Improve keyboard navigation
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach(element => {
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && element.classList.contains('nav__link')) {
                    e.preventDefault();
                    element.click();
                }
            });
        });
    }
}

// Performance and Animation Manager
class PerformanceManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Handle reduced motion preference
        this.handleReducedMotion();
        
        // Optimize background animations based on device capabilities
        this.optimizeAnimations();
        
        // Preload critical resources
        this.preloadResources();
        
        console.log('Performance manager initialized');
    }
    
    handleReducedMotion() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (prefersReducedMotion.matches) {
            document.body.classList.add('reduced-motion');
        }
        
        // Listen for changes
        prefersReducedMotion.addEventListener('change', () => {
            if (prefersReducedMotion.matches) {
                document.body.classList.add('reduced-motion');
            } else {
                document.body.classList.remove('reduced-motion');
            }
        });
    }
    
    optimizeAnimations() {
        // Reduce animations on low-end devices
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
        const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
        
        if (isLowEndDevice || hasLimitedMemory) {
            const background = document.querySelector('.animated-background');
            if (background) {
                background.style.opacity = '0.3';
                console.log('Reduced background animation for low-end device');
            }
        }
    }
    
    preloadResources() {
        // Only preload if link doesn't already exist
        const existingPreload = document.querySelector('link[href*="FKGroteskNeue"]');
        if (!existingPreload) {
            const fontLink = document.createElement('link');
            fontLink.rel = 'preload';
            fontLink.href = 'https://r2cdn.perplexity.ai/fonts/FKGroteskNeue.woff2';
            fontLink.as = 'font';
            fontLink.type = 'font/woff2';
            fontLink.crossOrigin = 'anonymous';
            document.head.appendChild(fontLink);
        }
    }
}

// Main Application
class App {
    constructor() {
        this.themeManager = null;
        this.navigationManager = null;
        this.interactionManager = null;
        this.performanceManager = null;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeManagers());
        } else {
            this.initializeManagers();
        }
    }
    
    initializeManagers() {
        try {
            console.log('Initializing website managers...');
            
            // Initialize all managers in proper order
            this.performanceManager = new PerformanceManager();
            this.themeManager = new ThemeManager();
            this.navigationManager = new NavigationManager();
            this.interactionManager = new InteractionManager();
            
            // Add global error handling
            this.addErrorHandling();
            
            // Debug: Log current state
            setTimeout(() => {
                console.log('Current theme:', this.themeManager?.getCurrentTheme());
                console.log('Current page:', this.navigationManager?.currentPage);
                console.log('Theme toggle element:', document.getElementById('themeToggle'));
                console.log('Nav links count:', document.querySelectorAll('.nav__link').length);
            }, 100);
            
            console.log('Website successfully initialized');
        } catch (error) {
            console.error('Error initializing website:', error);
        }
    }
    
    addErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
    }
}

// Initialize the application
const app = new App();