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

        // KORREKTUR: Steuert die Sichtbarkeit der Header-Buttons
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


class ChessPuzzleManager {
    constructor() {
        this.board = null;
        this.game = new Chess();
        this.puzzle = null;
        this.currentMove = 0;
        this.statusElement = $('.puzzle-status');
        this.solutionBtn = $('#showSolutionBtn');
        this.dailyPuzzleButton = $('#dailyPuzzleBtn'); // Wählt nur noch den einen Button aus
        this.init();
    }

    init() {
        // Event-Listener für den Lösungs-Button
        this.solutionBtn.on('click', () => this.showSolution());

        // Event-Listener für den "Tagesrätsel laden"-Button
        this.dailyPuzzleButton.on('click', (e) => {
            e.preventDefault();
            this.fetcher('https://lichess.org/api/puzzle/daily');
        });

        // Beobachtet, wann die Rätsel-Seite sichtbar wird, um Darstellungsfehler zu beheben
        const puzzlePage = document.getElementById('schach-raetsel');
        if (puzzlePage) {
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isVisible = mutation.target.classList.contains('page--active');
                        if (isVisible && this.board) {
                            setTimeout(() => this.board.resize(), 50);
                        }
                    }
                }
            });
            observer.observe(puzzlePage, { attributes: true });
        }

        // Lädt das erste Rätsel automatisch, wenn die Seite initialisiert wird.
        this.dailyPuzzleButton.click();
    }

    async fetcher(url) {
        this.statusElement.text('Lade neues Rätsel...');
        this.solutionBtn.hide();
        if (this.board) {
            this.board.destroy();
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Netzwerk-Antwort war nicht OK`);
            const data = await response.json();
            this.setupPuzzle(data);
        } catch (error) {
            this.statusElement.text('Fehler: Rätsel konnte nicht geladen werden.');
        }
    }

    setupPuzzle(data) {
        if (!data || !data.game || (!data.game.fen && !data.game.pgn)) {
            this.statusElement.text('Fehler: Ungültige Rätsel-Daten erhalten.');
            return;
        }

        data.game.fen ? this.game.load(data.game.fen) : this.game.load_pgn(data.game.pgn);
        this.puzzle = data;
        this.currentMove = 0;

        const turn = this.game.turn();
        const orientation = (turn === 'w') ? 'white' : 'black';

        const config = {
            draggable: true,
            position: this.game.fen(),
            orientation: orientation,
            pieceTheme: 'chesspieces/wikipedia/{piece}.png',
            onDrop: (source, target) => {
                const move = this.game.move({ from: source, to: target, promotion: 'q' });
                if (move === null) return 'snapback';
                this.checkSolution(move);
            }
        };

        this.board = Chessboard('puzzleBoard', config);
        this.statusElement.text(`${orientation === 'white' ? 'Weiß' : 'Schwarz'} am Zug.`);
        this.solutionBtn.show();
    }

    checkSolution(userMove) {
        const solution = this.puzzle.puzzle.solution;
        const expectedMove = solution[this.currentMove];
        if (`${userMove.from}${userMove.to}` === expectedMove) {
            this.statusElement.text('Korrekt!');
            this.currentMove++;
            setTimeout(() => {
                if (this.currentMove < solution.length) {
                    this.game.move(solution[this.currentMove], { sloppy: true });
                    this.board.position(this.game.fen());
                    this.currentMove++;
                    this.statusElement.text('Dein Zug.');
                } else {
                    this.statusElement.text('Rätsel gelöst!');
                    this.solutionBtn.hide();
                }
            }, 500);
        } else {
            this.statusElement.text('Falsch, versuche es erneut.');
            setTimeout(() => {
                this.game.undo();
                this.board.position(this.game.fen());
            }, 500);
        }
    }

    showSolution() {
        let moveIndex = this.currentMove;
        const playNextMove = () => {
            if (moveIndex < this.puzzle.puzzle.solution.length) {
                this.game.move(this.puzzle.puzzle.solution[moveIndex], { sloppy: true });
                this.board.position(this.game.fen());
                moveIndex++;
                setTimeout(playNextMove, 1000);
            } else {
                this.statusElement.text('Rätsel gelöst!');
            }
        };
        playNextMove();
        this.solutionBtn.hide();
    }
}

class AuthManager {
    constructor() {
        this.user = null;
        this.authModal = document.getElementById('authModal');
        this.authBtn = document.getElementById('authBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userInfo = document.getElementById('userInfo');
        this.init();
    }
    init() {
        this.authBtn.addEventListener('click', () => this.showModal());
        this.logoutBtn.addEventListener('click', () => this.logout());
        document.getElementById('authModalClose').addEventListener('click', () => this.hideModal());
        document.getElementById('showRegister').addEventListener('click', (e) => { e.preventDefault(); this.toggleForms(true); });
        document.getElementById('showLogin').addEventListener('click', (e) => { e.preventDefault(); this.toggleForms(false); });
        document.getElementById('loginForm').addEventListener('submit', (e) => this.login(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.register(e));
    }
    showModal() { this.authModal.style.display = 'block'; }
    hideModal() { this.authModal.style.display = 'none'; }
    toggleForms(showRegister) {
        document.getElementById('loginFormContainer').style.display = showRegister ? 'none' : 'block';
        document.getElementById('registerFormContainer').style.display = showRegister ? 'block' : 'none';
    }
    async apiCall(action, data) {
        try {
            const response = await fetch(`api.php?action=${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Ein Fehler ist aufgetreten.');
            return result;
        } catch (error) {
            alert(`Fehler: ${error.message}`);
            return null;
        }
    }
    async register(e) {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const firstname = document.getElementById('registerFirstname').value;
        const lastname = document.getElementById('registerLastname').value;
        const result = await this.apiCall('register', { email, password, firstname, lastname });
        if (result) {
            alert('Registrierung erfolgreich! Bitte melden Sie sich jetzt an.');
            this.toggleForms(false);
        }
    }
    async login(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const result = await this.apiCall('login', { email, password });
        if (result && result.success) {
            this.user = { firstname: result.user_firstname };
            this.updateUI();
            this.hideModal();
            app.shopManager.loadCart();
        }
    }
    async logout() {
        const result = await this.apiCall('logout', {});
        if (result && result.success) {
            this.user = null;
            this.updateUI();
            app.shopManager.clearCart();
        }
    }
    updateUI() {
        if (this.user) {
            this.userInfo.textContent = `Hallo, ${this.user.firstname}`;
            this.authBtn.style.display = 'none';
            this.logoutBtn.style.display = 'block';
        } else {
            this.userInfo.textContent = '';
            this.authBtn.style.display = 'block';
            this.logoutBtn.style.display = 'none';
        }
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

            new ChessPuzzleManager();
            this.authManager = new AuthManager();
            this.shopManager = new ShopManager();
        } catch (error) {
            console.error('Error initializing website:', error);
        }
    }
}

// Shop Management
class ShopManager {
    constructor() {
        this.shopGrid = document.getElementById('shopGrid');
        this.cartModal = document.getElementById('cartModal');
        this.cartBtn = document.getElementById('cartBtn');
        this.cartCounter = document.getElementById('cartCounter');
        this.cartItemsContainer = document.getElementById('cartItemsContainer');
        this.cartTotalEl = document.getElementById('cartTotal');
        this.checkoutBtn = document.getElementById('checkoutBtn');
        this.cart = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.cartBtn.addEventListener('click', () => this.showCart());
        document.getElementById('cartModalClose').addEventListener('click', () => this.hideCart());
        this.checkoutBtn.addEventListener('click', () => this.checkout());
        this.loadCart();
    }

    showCart() { this.cartModal.style.display = 'block'; }
    hideCart() { this.cartModal.style.display = 'none'; }

    async loadProducts() {
        if (!this.shopGrid) return;
        try {
            const response = await fetch('api.php?action=getProducts');
            if (!response.ok) throw new Error('Netzwerk-Antwort war nicht OK');
            const products = await response.json();
            this.renderProducts(products);
        } catch (error) {
            console.error('Fehler beim Laden der Produkte:', error);
            this.shopGrid.innerHTML = '<p>Produkte konnten leider nicht geladen werden.</p>';
        }
    }

    renderProducts(products) {
        this.shopGrid.innerHTML = '';
        if (products.length === 0) {
            this.shopGrid.innerHTML = '<p>Aktuell sind keine Produkte verfügbar.</p>';
            return;
        }
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            // ACHTUNG: Der onclick-Aufruf wird hier entfernt und durch einen Event-Listener ersetzt
            productCard.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" class="product-card__image">
                <h3 class="product-card__title">${product.name}</h3>
                <p class="product-card__description">${product.description}</p>
                <div class="product-card__footer">
                    <span class="product-card__price">€ ${product.price}</span>
                    <button class="btn btn--primary add-to-cart-btn" data-product-id="${product.id}">In den Warenkorb</button>
                </div>
            `;
            this.shopGrid.appendChild(productCard);
        });

        // Event-Listener für alle "In den Warenkorb"-Buttons hinzufügen
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                this.addToCart(productId, event.target);
            });
        });
    }

    async addToCart(productId, buttonElement) {
        // 1. Animation starten
        const productCard = buttonElement.closest('.product-card');
        if (productCard) {
            const productImage = productCard.querySelector('.product-card__image');
            if (productImage) {
                this.flyToCartAnimation(productImage);
            }
        }

        // 2. Produkt zum Warenkorb hinzufügen (ohne alert)
        try {
            const response = await fetch('api.php?action=addToCart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            if (response.ok) {
                this.loadCart(); // Warenkorb im Hintergrund aktualisieren
            } else {
                const result = await response.json();
                console.error('Fehler:', result.error);
            }
        } catch (error) {
            console.error(`Fehler beim Hinzufügen zum Warenkorb: ${error.message}`);
        }
    }

    flyToCartAnimation(element) {
        const cartIcon = document.getElementById('cartBtn');
        const flyingEl = element.cloneNode(true);
        const rect = element.getBoundingClientRect();

        flyingEl.style.position = 'fixed';
        flyingEl.style.left = `${rect.left}px`;
        flyingEl.style.top = `${rect.top}px`;
        flyingEl.style.width = `${rect.width}px`;
        flyingEl.style.height = `${rect.height}px`;
        flyingEl.style.transition = 'all 0.8s ease-in-out';
        flyingEl.style.zIndex = '2000';
        flyingEl.style.borderRadius = '15px';
        flyingEl.style.opacity = '0.8';

        document.body.appendChild(flyingEl);

        setTimeout(() => {
            const cartRect = cartIcon.getBoundingClientRect();
            flyingEl.style.left = `${cartRect.left + cartRect.width / 2}px`;
            flyingEl.style.top = `${cartRect.top + cartRect.height / 2}px`;
            flyingEl.style.width = '0px';
            flyingEl.style.height = '0px';
            flyingEl.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            document.body.removeChild(flyingEl);
            // NEU: Fügt den Pop-Effekt hinzu, anstatt nur zu schütteln
            cartIcon.classList.add('pop');
            setTimeout(() => cartIcon.classList.remove('pop'), 400);
        }, 850);
    }

    // Die restlichen Funktionen (updateCart, removeFromCart, checkout, etc.) bleiben unverändert
    async updateCart(productId, quantity) {
        try {
            await fetch('api.php?action=updateCart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity }) });
            this.loadCart();
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Warenkorbs:', error);
        }
    }

    async removeFromCart(productId) {
        try {
            await fetch('api.php?action=removeFromCart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId}) });
            this.loadCart();
        } catch (error) {
            console.error('Fehler beim Entfernen aus dem Warenkorb:', error);
        }
    }

    async checkout() {
        let orderData = {};
        // Wenn der User nicht eingeloggt ist, frage nach Name und E-Mail
        if (!app.authManager.user) {
            const name = prompt("Bitte geben Sie Ihren Namen ein:", "");
            const email = prompt("Bitte geben Sie Ihre E-Mail-Adresse für die Bestätigung ein:", "");
            if (name === null || email === null || name === "" || email === "") {
                alert("Bestellvorgang abgebrochen.");
                return;
            }
            orderData.name = name;
            orderData.email = email;
        }

        try {
            const response = await fetch('api.php?action=placeOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Ein Fehler ist aufgetreten.');
            }

            const result = await response.json();
            if (result.success) {
                alert(`Vielen Dank für Ihre Bestellung! Ihre Bestellnummer ist #${result.order_id}. Eine Bestätigung wurde an Ihre E-Mail-Adresse gesendet.`);
                this.clearCart();
                this.hideCart();
            }
        } catch (error) {
            alert(`Fehler bei der Bestellung: ${error.message}`);
        }
    }

    async loadCart() {
        try {
            const response = await fetch('api.php?action=getCart');
            if (!response.ok) throw new Error('Warenkorb konnte nicht geladen werden.');
            this.cart = await response.json();
            this.renderCart();
        } catch (error) { console.error(error.message); }
    }

// Ersetze die renderCart-Funktion in app.js

    renderCart() {
        this.cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalItems = 0; // Zähler für die Gesamtanzahl der Artikel

        if (this.cart.length === 0) {
            this.cartItemsContainer.innerHTML = '<p>Ihr Warenkorb ist leer.</p>';
            this.checkoutBtn.style.display = 'none';
        } else {
            this.cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}" class="cart-item__image">
                <div class="cart-item__info">
                    <h4 class="cart-item__name">${item.name}</h4>
                    <p class="cart-item__price">${(item.price * item.quantity).toFixed(2)} €</p>
                </div>
                <div class="cart-item__actions">
                    <button class="btn--icon" onclick="app.shopManager.updateCart(${item.id}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn--icon" onclick="app.shopManager.updateCart(${item.id}, ${item.quantity + 1})">+</button>
                    <button class="btn--icon" onclick="app.shopManager.removeFromCart(${item.id})"><i class="bi bi-trash"></i></button>
                </div>`;
                this.cartItemsContainer.appendChild(itemEl);
                total += item.price * item.quantity;
                totalItems += item.quantity; // Addiere die Menge jedes Artikels
            });
            this.checkoutBtn.style.display = 'block';
        }

        this.cartTotalEl.textContent = total.toFixed(2);

        // Zähler aktualisieren
        if (totalItems > 0) {
            this.cartCounter.textContent = totalItems;
            this.cartCounter.classList.remove('hidden');
        } else {
            this.cartCounter.classList.add('hidden');
        }
    }

    clearCart() {
        this.cart = [];
        this.renderCart();
    }
}

// Initialize the application
const app = new App();