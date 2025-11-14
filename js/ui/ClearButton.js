/**
 * Handles the clear button functionality
 */
export class ClearButton {
    constructor(gameState, renderer) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear all placed items?')) {
                    this.gameState.clearAll();
                    this.renderer.render();
                }
            });
        }
    }
}

