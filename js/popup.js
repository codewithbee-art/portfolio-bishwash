// Custom Popup Modal System
class PopupManager {
    constructor() {
        this.createPopupContainer();
        this.init();
    }

    createPopupContainer() {
        // Create popup overlay if it doesn't exist
        if (!document.getElementById('popup-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'popup-overlay';
            overlay.className = 'popup-overlay';
            overlay.innerHTML = `
                <div class="popup-modal">
                    <div class="popup-icon">
                        <i data-lucide="info"></i>
                    </div>
                    <h3 class="popup-title"></h3>
                    <p class="popup-message"></p>
                    <div class="popup-buttons"></div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Initialize Lucide icons for popup immediately
            if (typeof lucide !== 'undefined') {
                setTimeout(() => {
                    lucide.createIcons();
                }, 10);
            }
        }
    }

    init() {
        this.overlay = document.getElementById('popup-overlay');
        if (!this.overlay) {
            console.error('Popup overlay not found');
            return;
        }
        
        this.modal = this.overlay.querySelector('.popup-modal');
        this.icon = this.overlay.querySelector('.popup-icon i');
        this.title = this.overlay.querySelector('.popup-title');
        this.message = this.overlay.querySelector('.popup-message');
        this.buttonsContainer = this.overlay.querySelector('.popup-buttons');
        
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.hide();
            }
        });
    }

    show(options = {}) {
        const {
            type = 'info',
            title = 'Notice',
            message = '',
            icon = 'info',
            buttons = [{ text: 'OK', action: () => this.hide() }],
            autoClose = null
        } = options;

        // Ensure popup exists and is initialized
        this.createPopupContainer();
        this.init();
        
        // Set content first
        if (this.title) this.title.textContent = title;
        if (this.message) this.message.textContent = message;
        
        // Set icon and type
        this.setIcon(type, icon);
        
        // Set buttons
        this.setButtons(buttons);
        
        // Show popup
        if (this.overlay) {
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Auto close if specified
        if (autoClose) {
            setTimeout(() => this.hide(), autoClose);
        }
        
        return new Promise((resolve) => {
            this.currentResolve = resolve;
        });
    }

    setIcon(type, iconName) {
        const iconElement = this.icon;
        const iconContainer = iconElement ? iconElement.parentElement : null;
        
        if (!iconElement || !iconContainer) {
            console.warn('Popup icon elements not found, using fallback');
            return;
        }
        
        // Remove all type classes
        iconContainer.className = 'popup-icon';
        iconContainer.classList.add(type);
        
        // Set icon with fallback
        const finalIconName = (iconName && iconName !== '') ? iconName : this.getDefaultIcon(type);
        iconElement.setAttribute('data-lucide', finalIconName);
        
        // Re-create Lucide icons after setting the new icon
        if (typeof lucide !== 'undefined') {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                lucide.createIcons();
            }, 10);
        }
    }
    
    getDefaultIcon(type) {
        const defaultIcons = {
            success: 'check-circle',
            error: 'x-circle', 
            info: 'info',
            warning: 'alert-triangle'
        };
        return defaultIcons[type] || 'info';
    }

    setButtons(buttons) {
        this.buttonsContainer.innerHTML = '';
        
        buttons.forEach((button, index) => {
            const btn = document.createElement('button');
            btn.className = 'popup-button';
            if (button.secondary) {
                btn.classList.add('secondary');
            }
            btn.textContent = button.text;
            
            btn.addEventListener('click', () => {
                if (button.action) {
                    button.action();
                } else {
                    this.hide();
                }
            });
            
            this.buttonsContainer.appendChild(btn);
        });
    }

    hide() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        if (this.currentResolve) {
            this.currentResolve();
            this.currentResolve = null;
        }
    }

    // Convenience methods
    success(title, message, options = {}) {
        return this.show({
            type: 'success',
            title: title || 'Success!',
            message: message || 'Operation completed successfully.',
            icon: 'check-circle',
            autoClose: options.autoClose || 3000,
            ...options
        });
    }

    error(title, message, options = {}) {
        return this.show({
            type: 'error',
            title: title || 'Error',
            message: message || 'Something went wrong.',
            icon: 'x-circle',
            ...options
        });
    }

    info(title, message, options = {}) {
        return this.show({
            type: 'info',
            title: title || 'Info',
            message: message || '',
            icon: 'info',
            ...options
        });
    }

    confirm(title, message, options = {}) {
        return this.show({
            type: 'info',
            title: title || 'Confirm',
            message: message || 'Are you sure?',
            icon: 'help-circle',
            buttons: [
                { 
                    text: options.cancelText || 'Cancel', 
                    secondary: true, 
                    action: () => this.hide() 
                },
                { 
                    text: options.confirmText || 'Confirm', 
                    action: () => {
                        if (options.onConfirm) options.onConfirm();
                        this.hide();
                    }
                }
            ],
            ...options
        });
    }
}

// Global popup instance
let popupManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    popupManager = new PopupManager();
    
    // Make it globally available
    window.showPopup = (options) => popupManager.show(options);
    window.showSuccess = (title, message, options) => popupManager.success(title, message, options);
    window.showError = (title, message, options) => popupManager.error(title, message, options);
    window.showInfo = (title, message, options) => popupManager.info(title, message, options);
    window.showConfirm = (title, message, options) => popupManager.confirm(title, message, options);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopupManager;
}
