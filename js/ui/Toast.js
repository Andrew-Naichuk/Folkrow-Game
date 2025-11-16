/**
 * Universal toast message component
 * Displays messages at the center bottom of the screen with roll-in/roll-out animations
 */
export class Toast {
    constructor() {
        this.container = null;
        this.activeToasts = new Set();
        this.createContainer();
    }

    /**
     * Create the toast container element
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast message
     * @param {string} message - The message to display
     * @param {string} type - Type of toast: 'neutral', 'success', or 'warning'
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    show(message, type = 'neutral', duration = 3000) {
        if (!this.container) {
            this.createContainer();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add to container
        this.container.appendChild(toast);
        this.activeToasts.add(toast);

        // Trigger roll-in animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-enter');
        });

        // Remove toast after duration
        setTimeout(() => {
            this.hide(toast);
        }, duration);
    }

    /**
     * Hide a toast message with roll-out animation
     * @param {HTMLElement} toast - The toast element to hide
     */
    hide(toast) {
        if (!toast || !this.activeToasts.has(toast)) {
            return;
        }

        // Trigger roll-out animation
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.activeToasts.delete(toast);
        }, 300); // Match animation duration
    }

    /**
     * Convenience methods for different toast types
     */
    neutral(message, duration = 3000) {
        this.show(message, 'neutral', duration);
    }

    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    warning(message, duration = 3000) {
        this.show(message, 'warning', duration);
    }
}

