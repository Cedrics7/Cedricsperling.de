export class InteractionManager {
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
                feedbackElement.className = data.ok ? 'success' : 'error';
                if (data.ok) form.reset();
            })
            .catch(error => {
                feedbackElement.textContent = 'Ein Netzwerkfehler ist aufgetreten.';
                feedbackElement.className = 'error';
            })
            .finally(() => {
                feedbackElement.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = 'Nachricht senden';
                setTimeout(() => { feedbackElement.style.display = 'none'; }, 6000);
            });
    }
}