export class AuthManager {
    constructor() {
        this.user = null;
        this.authModal = document.getElementById('authModal');
        this.profileModal = document.getElementById('profileModal');
        this.authBtn = document.getElementById('authBtn');
        this.profileBtn = document.getElementById('profileBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userInfo = document.getElementById('userInfo');
        this.init();
    }
    init() {
        this.authBtn.addEventListener('click', () => this.showModal());
        this.profileBtn.addEventListener('click', () => this.showProfileModal());
        this.logoutBtn.addEventListener('click', () => this.logout());
        this.checkLoginState();
        document.getElementById('authModalClose').addEventListener('click', () => this.hideModal());
        document.getElementById('profileModalClose').addEventListener('click', () => this.hideProfileModal());

        document.getElementById('showRegister').addEventListener('click', (e) => { e.preventDefault(); this.toggleForms(true); });
        document.getElementById('showLogin').addEventListener('click', (e) => { e.preventDefault(); this.toggleForms(false); });

        document.getElementById('loginForm').addEventListener('submit', (e) => this.login(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.register(e));
        document.getElementById('profileForm').addEventListener('submit', (e) => this.updateProfile(e));
        document.getElementById('profileShippingSameAsBilling').addEventListener('change', (e) => {
            document.getElementById('profileShippingAddressContainer').style.display = e.target.checked ? 'none' : 'block';
        });

    }

    showModal() { this.authModal.style.display = 'block'; }
    hideModal() { this.authModal.style.display = 'none'; }
    showProfileModal() { this.profileModal.style.display = 'block'; this.loadProfile(); }
    hideProfileModal() { this.profileModal.style.display = 'none'; }

    toggleForms(showRegister) {
        document.getElementById('loginFormContainer').style.display = showRegister ? 'none' : 'block';
        document.getElementById('registerFormContainer').style.display = showRegister ? 'block' : 'none';
    }

    async apiCall(action, data, method = 'POST') {
        try {
            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (method === 'POST') {
                options.body = JSON.stringify(data);
            }
            const response = await fetch(`api.php?action=${action}`, options);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Ein Fehler ist aufgetreten.');
            return result;
        } catch (error) {
            this.showToast(`Fehler: ${error.message}`, 'error');
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
            this.showToast('Registrierung erfolgreich! Bitte melden Sie sich jetzt an.', 'success');
            this.toggleForms(false);
        }
    }
    async login(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        // Hier wird der Status der Checkbox ausgelesen
        const rememberMe = document.getElementById('rememberMe').checked;
        // Und hier an die API gesendet
        const result = await this.apiCall('login', { email, password, rememberMe });
        if (result && result.success) {
            this.user = { firstname: result.user_firstname };
            this.updateUI();
            this.hideModal();
            window.app.shopManager.loadCart();
        }
    }

    // Neue Funktion in AuthManager.js
    async checkLoginState() {
        const result = await this.apiCall('checkLoginState', null, 'GET');
        if (result && result.loggedIn) {
            this.user = { firstname: result.user_firstname };
            this.updateUI();
            window.app.shopManager.loadCart();
        }
    }



    async logout() {
        const result = await this.apiCall('logout', {});
        if (result && result.success) {
            this.user = null;
            this.updateUI();
            window.app.shopManager.clearCart();
        }
    }

    async loadProfile() {
        const result = await this.apiCall('getUserProfile', null, 'GET');
        if (result && result.success) {
            const user = result.user;
            document.getElementById('profileFirstname').value = user.firstname || '';
            document.getElementById('profileLastname').value = user.lastname || '';
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profileStreet').value = user.street || '';
            document.getElementById('profileHouseNr').value = user.house_nr || '';
            document.getElementById('profileZip').value = user.zip || '';
            document.getElementById('profileCity').value = user.city || '';
            document.getElementById('profileShippingStreet').value = user.shipping_street || '';
            document.getElementById('profileShippingHouseNr').value = user.shipping_house_nr || '';
            document.getElementById('profileShippingZip').value = user.shipping_zip || '';
            document.getElementById('profileShippingCity').value = user.shipping_city || '';

            // Checkbox-Logik
            const hasSeparateShipping = user.shipping_street || user.shipping_house_nr || user.shipping_zip || user.shipping_city;
            const checkbox = document.getElementById('profileShippingSameAsBilling');
            checkbox.checked = !hasSeparateShipping;
            document.getElementById('profileShippingAddressContainer').style.display = hasSeparateShipping ? 'block' : 'none';
        }
    }

    async updateProfile(e) {
        e.preventDefault();
        const isSameAddress = document.getElementById('profileShippingSameAsBilling').checked;

        const data = {
            firstname: document.getElementById('profileFirstname').value,
            lastname: document.getElementById('profileLastname').value,
            street: document.getElementById('profileStreet').value,
            house_nr: document.getElementById('profileHouseNr').value,
            zip: document.getElementById('profileZip').value,
            city: document.getElementById('profileCity').value,
            shipping_street: '',
            shipping_house_nr: '',
            shipping_zip: '',
            shipping_city: ''
        };

        if (!isSameAddress) {
            data.shipping_street = document.getElementById('profileShippingStreet').value;
            data.shipping_house_nr = document.getElementById('profileShippingHouseNr').value;
            data.shipping_zip = document.getElementById('profileShippingZip').value;
            data.shipping_city = document.getElementById('profileShippingCity').value;
        }

        const result = await this.apiCall('updateUserProfile', data);
        if (result && result.success) {
            this.showToast('Profil erfolgreich aktualisiert!', 'success');
            this.hideProfileModal();
            this.userInfo.textContent = `Hallo, ${data.firstname}`;
        }
    }

    updateUI() {
        if (this.user) {
            this.userInfo.textContent = `Hallo, ${this.user.firstname}`;
            this.authBtn.style.display = 'none';
            this.profileBtn.style.display = 'block';
            this.logoutBtn.style.display = 'block';
        } else {
            this.userInfo.textContent = '';
            this.authBtn.style.display = 'block';
            this.profileBtn.style.display = 'none';
            this.logoutBtn.style.display = 'none';
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast--visible');
        }, 50);

        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}