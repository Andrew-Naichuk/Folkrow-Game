/**
 * Handles the add budget button functionality
 */
export class AddBudgetButton {
    constructor(gameState, renderer) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const addBudgetBtn = document.getElementById('add-budget-btn');
        if (addBudgetBtn) {
            addBudgetBtn.addEventListener('click', () => {
                this.gameState.addBudget(1000);
                this.renderer.render();
            });
        }
    }
}

