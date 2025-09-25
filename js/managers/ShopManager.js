export class ShopManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.shopGrid = document.getElementById('shopGrid');
        this.cartModal = document.getElementById('cartModal');
        this.guestCheckoutModal = document.getElementById('guestCheckoutModal');
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
        document.getElementById('guestCheckoutModalClose').addEventListener('click', () => this.hideGuestCheckout());
        this.checkoutBtn.addEventListener('click', () => this.checkout());
        document.getElementById('guestCheckoutForm').addEventListener('submit', (e) => this.handleGuestCheckout(e));
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideGuestCheckout();
            this.authManager.showModal();
            this.authManager.toggleForms(false);
        });
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideGuestCheckout();
            this.authManager.showModal();
            this.authManager.toggleForms(true);
        });
        document.getElementById('shippingSameAsBilling').addEventListener('change', (e) => {
            document.getElementById('shippingAddressContainer').style.display = e.target.checked ? 'none' : 'block';
        });

        this.loadCart();
    }
    showCart() { this.cartModal.style.display = 'block'; }
    hideCart() { this.cartModal.style.display = 'none'; }
    showGuestCheckout() { this.guestCheckoutModal.style.display = 'block'; }
    hideGuestCheckout() { this.guestCheckoutModal.style.display = 'none'; }


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

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                this.addToCart(productId, event.target);
            });
        });
    }

    async addToCart(productId, buttonElement) {
        const productCard = buttonElement.closest('.product-card');
        if (productCard) {
            const productImage = productCard.querySelector('.product-card__image');
            if (productImage) {
                this.flyToCartAnimation(productImage);
            }
        }

        try {
            const response = await fetch('api.php?action=addToCart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            if (response.ok) {
                this.loadCart();
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
            cartIcon.classList.add('pop');
            setTimeout(() => cartIcon.classList.remove('pop'), 400);
        }, 850);
    }

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
        if (this.authManager.user) {
            // For logged-in user, check for address first
            const profile = await this.authManager.apiCall('getUserProfile', null, 'GET');
            if (profile && profile.success && profile.user.street && profile.user.city) {
                // Address exists, place order directly
                this.placeOrder();
            } else {
                // Address does not exist, prompt to update profile
                this.authManager.showToast('Bitte vervollständigen Sie Ihre Adresse im Profil.', 'error');
                this.hideCart();
                this.authManager.showProfileModal();
            }
        } else {
            // Guest checkout
            this.hideCart();
            this.showGuestCheckout();
        }
    }

    async placeOrder(orderData = {}) {
        const result = await this.authManager.apiCall('placeOrder', orderData);
        if (result && result.success) {
            this.authManager.showToast(`Bestellung #${result.order_id} erfolgreich! Eine Bestätigung wurde gesendet.`, 'success');
            this.clearCart();
            this.hideCart();
            this.hideGuestCheckout();
        }
    }

    async handleGuestCheckout(e) {
        e.preventDefault();
        const isSameAddress = document.getElementById('shippingSameAsBilling').checked;

        const orderData = {
            firstname: document.getElementById('guestFirstname').value,
            lastname: document.getElementById('guestLastname').value,
            email: document.getElementById('guestEmail').value,
            street: document.getElementById('guestStreet').value,
            house_nr: document.getElementById('guestHouseNr').value,
            zip: document.getElementById('guestZip').value,
            city: document.getElementById('guestCity').value,
        };

        if (isSameAddress) {
            orderData.shipping_firstname = orderData.firstname;
            orderData.shipping_lastname = orderData.lastname;
            orderData.shipping_street = orderData.street;
            orderData.shipping_house_nr = orderData.house_nr;
            orderData.shipping_zip = orderData.zip;
            orderData.shipping_city = orderData.city;
        } else {
            orderData.shipping_firstname = document.getElementById('shippingFirstname').value;
            orderData.shipping_lastname = document.getElementById('shippingLastname').value;
            orderData.shipping_street = document.getElementById('shippingStreet').value;
            orderData.shipping_house_nr = document.getElementById('shippingHouseNr').value;
            orderData.shipping_zip = document.getElementById('shippingZip').value;
            orderData.shipping_city = document.getElementById('shippingCity').value;
        }
        this.placeOrder(orderData);
    }


    async loadCart() {
        try {
            const response = await fetch('api.php?action=getCart');
            if (!response.ok) throw new Error('Warenkorb konnte nicht geladen werden.');
            this.cart = await response.json();
            this.renderCart();
        } catch (error) { console.error(error.message); }
    }

    renderCart() {
        this.cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalItems = 0;

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
                    <button class="btn--icon cart-action-btn" data-product-id="${item.id}" data-action="decrease"><i class="bi bi-dash-lg"></i></button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="btn--icon cart-action-btn" data-product-id="${item.id}" data-action="increase"><i class="bi bi-plus-lg"></i></button>
                    <button class="btn--icon cart-action-btn" data-product-id="${item.id}" data-action="remove"><i class="bi bi-trash"></i></button>
                </div>`;
                this.cartItemsContainer.appendChild(itemEl);
                total += item.price * item.quantity;
                totalItems += item.quantity;
            });
            this.checkoutBtn.style.display = 'block';
        }

        this.cartItemsContainer.querySelectorAll('.cart-item__actions button').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.productId;
                const action = e.currentTarget.dataset.action;
                const item = this.cart.find(cartItem => cartItem.id == productId);

                if (action === 'increase') {
                    this.updateCart(productId, item.quantity + 1);
                } else if (action === 'decrease') {
                    this.updateCart(productId, item.quantity - 1);
                } else if (action === 'remove') {
                    this.removeFromCart(productId);
                }
            });
        });

        this.cartTotalEl.textContent = total.toFixed(2);

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