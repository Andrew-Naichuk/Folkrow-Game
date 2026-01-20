/**
 * Tooltip component for displaying hover text over items
 */
export class Tooltip {
    constructor() {
        this.element = null;
        this.isVisible = false;
        this.createElement();
    }

    /**
     * Create the tooltip element
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'tooltip';
        document.body.appendChild(this.element);
    }

    /**
     * Show tooltip at the specified position
     * @param {string} text - The text to display
     * @param {number} x - X coordinate (clientX)
     * @param {number} y - Y coordinate (clientY)
     */
    show(text, x, y) {
        if (!this.element) {
            this.createElement();
        }

        const wasVisible = this.isVisible;
        const offset = this.getCssNumber('--size-tooltip-offset', 15);
        const safeOffset = this.getCssNumber('--size-tooltip-safe-offset', 10);
        const hiddenOffset = this.getCssNumber('--size-tooltip-offset-hidden', -9999);

        this.element.textContent = text;
        this.element.style.display = 'block';
        this.isVisible = true;

        // Position tooltip near cursor with offset
        const offsetX = offset;
        const offsetY = offset;
        
        // Get tooltip dimensions (need to force a layout calculation)
        // If already visible, we can measure directly, otherwise measure off-screen
        if (!wasVisible) {
            this.element.style.left = `${hiddenOffset}px`;
            this.element.style.top = `${hiddenOffset}px`;
            this.element.classList.remove('is-visible');
        }
        const rect = this.element.getBoundingClientRect();
        const tooltipWidth = rect.width;
        const tooltipHeight = rect.height;

        // Adjust position to keep tooltip within viewport
        let finalX = x + offsetX;
        let finalY = y + offsetY;

        // Check if tooltip would go off right edge
        if (finalX + tooltipWidth > window.innerWidth) {
            finalX = x - tooltipWidth - offsetX;
        }

        // Check if tooltip would go off bottom edge
        if (finalY + tooltipHeight > window.innerHeight) {
            finalY = y - tooltipHeight - offsetY;
        }

        // Ensure tooltip doesn't go off left or top edges
        finalX = Math.max(safeOffset, finalX);
        finalY = Math.max(safeOffset, finalY);

        this.element.style.left = finalX + 'px';
        this.element.style.top = finalY + 'px';
        
        // Only trigger fade-in animation if tooltip wasn't already visible
        if (!wasVisible) {
            requestAnimationFrame(() => {
                this.element.classList.add('is-visible');
            });
        } else {
            this.element.classList.add('is-visible');
        }
    }

    /**
     * Hide the tooltip
     */
    hide() {
        if (this.element) {
            const duration = this.getCssDuration('--duration-tooltip', 200);

            // Fade out animation
            this.element.classList.remove('is-visible');
            
            // Remove from display after animation
            setTimeout(() => {
                if (this.element) {
                    this.element.style.display = 'none';
                    this.isVisible = false;
                }
            }, duration); // Match transition duration
        }
    }

    getCssNumber(variableName, fallback) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    getCssDuration(variableName, fallbackMs) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
        if (!value) {
            return fallbackMs;
        }
        if (value.endsWith('ms')) {
            const parsed = Number.parseFloat(value);
            return Number.isNaN(parsed) ? fallbackMs : parsed;
        }
        if (value.endsWith('s')) {
            const parsed = Number.parseFloat(value);
            return Number.isNaN(parsed) ? fallbackMs : parsed * 1000;
        }
        const parsed = Number.parseFloat(value);
        return Number.isNaN(parsed) ? fallbackMs : parsed;
    }
}
