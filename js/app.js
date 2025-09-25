import { ThemeManager } from './managers/ThemeManager.js';
import { NavigationManager } from './managers/NavigationManager.js';
import { InteractionManager } from './managers/InteractionManager.js';
import { ChessPuzzleManager } from './managers/ChessPuzzleManager.js';
import { AuthManager } from './managers/AuthManager.js';
import { ShopManager } from './managers/ShopManager.js';

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

            // Defer Chess Puzzle Manager until jQuery and other scripts are ready
            $(document).ready(() => {
                this.chessPuzzleManager = new ChessPuzzleManager();
            });

            // Make managers accessible for inline event handlers
            window.app = {
                shopManager: this.shopManager
            };

        } catch (error) {
            console.error('Error initializing website:', error);
        }
    }
}

// Initialize the application
const app = new App();