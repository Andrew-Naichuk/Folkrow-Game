/**
 * Handles the clear button functionality
 */
export class ClearButton {
    constructor(gameState, renderer, villagerManager, camera) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.villagerManager = villagerManager;
        this.camera = camera;
        this.dialog = null;
        this.confirmBtn = null;
        this.cancelBtn = null;
        this.setupDialog();
        this.setupEventListeners();
    }

    setupDialog() {
        this.dialog = document.getElementById('start-over-dialog');
        this.confirmBtn = document.getElementById('dialog-confirm-btn');
        this.cancelBtn = document.getElementById('dialog-cancel-btn');

        if (this.dialog && this.confirmBtn && this.cancelBtn) {
            // Handle confirm button
            this.confirmBtn.addEventListener('click', () => {
                this.performReset();
                this.hideDialog();
            });

            // Handle cancel button
            this.cancelBtn.addEventListener('click', () => {
                this.hideDialog();
            });

            // Close dialog when clicking on overlay (but not on the dialog itself)
            this.dialog.addEventListener('click', (e) => {
                if (e.target === this.dialog) {
                    this.hideDialog();
                }
            });

            // Close dialog with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.dialog.style.display !== 'none') {
                    this.hideDialog();
                }
            });
        }
    }

    showDialog() {
        if (this.dialog) {
            this.dialog.style.display = 'flex';
            // Focus the cancel button for keyboard navigation
            if (this.cancelBtn) {
                this.cancelBtn.focus();
            }
        }
    }

    hideDialog() {
        if (this.dialog) {
            this.dialog.style.display = 'none';
        }
    }

    performReset() {
        // Reset game state (clears items, resets budget/population, regenerates map)
        this.gameState.resetGame();
        
        // Clear all villagers
        if (this.villagerManager) {
            this.villagerManager.clear();
        }
        
        // Reset camera to initial position
        if (this.camera) {
            this.camera.x = 0;
            this.camera.y = 0;
            this.camera.zoom = 1.0;
            this.camera.targetZoom = 1.0;
        }
        
        // Re-render the scene
        this.renderer.render();
    }

    setupEventListeners() {
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.showDialog();
            });
        }
    }
}

