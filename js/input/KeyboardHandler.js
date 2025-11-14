/**
 * Handles keyboard input events
 */
export class KeyboardHandler {
    constructor(gameState, renderer, canvas) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.canvas = canvas;
        this.keys = {};
        // Get sidebar reference for UI interaction control
        this.sidebar = document.querySelector('.sidebar');
        this.setupEventListeners();
    }
    
    /**
     * Enable UI interaction when tool is deselected
     */
    enableUIInteraction() {
        if (this.sidebar) {
            this.sidebar.style.pointerEvents = 'auto';
            this.sidebar.style.opacity = '1';
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Handle Escape key to cancel tool selection
            if (e.key === 'Escape') {
                this.cancelToolSelection();
            }
            
            // Handle R key to toggle rotation when tool is selected
            if (e.key === 'r' || e.key === 'R') {
                const selectedTool = this.gameState.getSelectedTool();
                if (selectedTool) {
                    this.gameState.toggleRotation();
                    this.renderer.render();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    /**
     * Cancel tool selection and reset cursor
     */
    cancelToolSelection() {
        if (this.gameState.getSelectedTool()) {
            this.gameState.clearSelectedTool();
            // Reset cursor to initial state (grab when not dragging)
            this.canvas.style.cursor = 'grab';
            // Re-enable UI interaction
            this.enableUIInteraction();
            this.renderer.render();
        }
    }

    getKeys() {
        return this.keys;
    }

    isKeyPressed(key) {
        return !!this.keys[key];
    }
}

