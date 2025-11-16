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
        this.element.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 10001;
            display: none;
            padding: 10px 14px;
            background: linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%);
            color: #3d2f1f;
            border: 3px double #8b8b8b;
            border-radius: 8px;
            font-family: 'Kalam', cursive;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 
                inset 0 2px 4px rgba(0, 0, 0, 0.1),
                0 4px 12px rgba(0, 0, 0, 0.3);
            max-width: 300px;
            word-wrap: break-word;
            white-space: normal;
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.2s ease, transform 0.2s ease;
        `;
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

        this.element.textContent = text;
        this.element.style.display = 'block';
        this.isVisible = true;

        // Position tooltip near cursor with offset
        const offsetX = 15;
        const offsetY = 15;
        
        // Get tooltip dimensions (need to force a layout calculation)
        // If already visible, we can measure directly, otherwise measure off-screen
        if (!wasVisible) {
            this.element.style.left = '-9999px';
            this.element.style.top = '-9999px';
            this.element.style.opacity = '0';
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
        finalX = Math.max(10, finalX);
        finalY = Math.max(10, finalY);

        this.element.style.left = finalX + 'px';
        this.element.style.top = finalY + 'px';
        
        // Only trigger fade-in animation if tooltip wasn't already visible
        if (!wasVisible) {
            requestAnimationFrame(() => {
                this.element.style.opacity = '1';
                this.element.style.transform = 'scale(1)';
            });
        }
    }

    /**
     * Hide the tooltip
     */
    hide() {
        if (this.element) {
            // Fade out animation
            this.element.style.opacity = '0';
            this.element.style.transform = 'scale(0.9)';
            
            // Remove from display after animation
            setTimeout(() => {
                if (this.element) {
                    this.element.style.display = 'none';
                    this.isVisible = false;
                }
            }, 200); // Match transition duration
        }
    }
}

