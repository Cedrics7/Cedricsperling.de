import { ThemeManager } from './managers/ThemeManager.js';
import { NavigationManager } from './managers/NavigationManager.js';
import { InteractionManager } from './managers/InteractionManager.js';
import { ChessPuzzleManager } from './managers/ChessPuzzleManager.js';
import { AuthManager } from './managers/AuthManager.js';
import { ShopManager } from './managers/ShopManager.js';
import { CookieManager } from './managers/CookieManager.js';

class App {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => this.initializeManagers());
    }

    initializeManagers() {
        try {
            this.themeManager = new ThemeManager();
            this.navigationManager = new NavigationManager();
            this.interactionManager = new InteractionManager();
            this.authManager = new AuthManager();
            this.shopManager = new ShopManager(this.authManager);
            this.cookieManager = new CookieManager();

            // Defer Chess Puzzle Manager until jQuery and other scripts are ready
            $(document).ready(() => {
                this.chessPuzzleManager = new ChessPuzzleManager();
            });

            // Make managers globally accessible for easy inter-manager communication
            window.app = {
                shopManager: this.shopManager,
                cookieManager: this.cookieManager,
                authManager: this.authManager
            };

        } catch (error) {
            console.error('Error initializing website:', error);
        }
    }
}

// Initialize the application
const app = new App();