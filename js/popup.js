// Simple, bulletproof popup system
class SimplePopup {
    constructor() {
        this.createPopupContainer();
        this.bindEvents();
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

    bindEvents() {
        const overlay = document.getElementById('simple-popup-overlay');
        const button = overlay.querySelector('.simple-popup-button');
        
        button.addEventListener('click', () => this.hide());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.hide();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                this.hide();
            }
        });
    }

    show(type, title, message) {
        const overlay = document.getElementById('simple-popup-overlay');
        const icon = overlay.querySelector('.simple-popup-icon-text');
        const titleEl = overlay.querySelector('.simple-popup-title');
        const messageEl = overlay.querySelector('.simple-popup-message');

        // Set icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        icon.textContent = icons[type] || 'ℹ️';

        // Set content
        titleEl.textContent = title;
        messageEl.textContent = message;

        // Show popup
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hide() {
        const overlay = document.getElementById('simple-popup-overlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const popup = new SimplePopup();
    
    // Global functions
    window.showSuccess = (title, message) => popup.show('success', title, message);
    window.showError = (title, message) => popup.show('error', title, message);
    window.showInfo = (title, message) => popup.show('info', title, message);
});
