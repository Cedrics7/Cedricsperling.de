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

        document.getElementById('authModalClose').addEventListener('click', () => this.hideModal());
        document.getElementById('profileModalClose').addEventListener('click', () => this.hideProfileModal());

        document.getElementById('showRegister').addEventListener('click', (e) => { e.preventDefault(); this.toggleForms(true); });
        document.getElementById('showLogin').addEventListener('click', (e) => { e.preventDefault(); this.toggleForms(false); });

        document.getElementById('loginForm').addEventListener('submit', (e) => this.login(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.register(e));
        document.getElementById('profileForm').addEventListener('submit', (e) => this.updateProfile(e));
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
        const result = await this.apiCall('login', { email, password });
        if (result && result.success) {
            this.user = { firstname: result.user_firstname };
            this.updateUI();
            this.hideModal();
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
        }
    }

    async updateProfile(e) {
        e.preventDefault();
        const data = {
            firstname: document.getElementById('profileFirstname').value,
            lastname: document.getElementById('profileLastname').value,
            street: document.getElementById('profileStreet').value,
            house_nr: document.getElementById('profileHouseNr').value,
            zip: document.getElementById('profileZip').value,
            city: document.getElementById('profileCity').value
        };
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