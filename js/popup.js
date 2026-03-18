// Simple working popup system
class SimplePopup {
    constructor() {
        this.createPopupContainer();
        this.init();
    }

    createPopupContainer() {
        if (!document.getElementById('simple-popup-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'simple-popup-overlay';
            overlay.innerHTML = `
                <div class="simple-popup-modal">
                    <div class="simple-popup-icon">
                        <span class="simple-popup-icon-text">ℹ️</span>
                    </div>
                    <h3 class="simple-popup-title"></h3>
                    <p class="simple-popup-message"></p>
                    <button class="simple-popup-button">OK</button>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }

    init() {
        this.overlay = document.getElementById('simple-popup-overlay');
        this.icon = this.overlay.querySelector('.simple-popup-icon-text');
        this.title = this.overlay.querySelector('.simple-popup-title');
        this.message = this.overlay.querySelector('.simple-popup-message');
        this.button = this.overlay.querySelector('.simple-popup-button');

        // Close handlers
        this.button.addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.hide();
            }
        });
    }

    show(type, title, message) {
        // Set icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        this.icon.textContent = icons[type] || 'ℹ️';

        // Set content
        this.title.textContent = title;
        this.message.textContent = message;

        // Show popup
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.simplePopup = new SimplePopup();
    
    // Global functions
    window.showSuccess = (title, message) => window.simplePopup.show('success', title, message);
    window.showError = (title, message) => window.simplePopup.show('error', title, message);
    window.showInfo = (title, message) => window.simplePopup.show('info', title, message);
});
