/**
 * Handles stats panel UI (budget and population display)
 */
export class StatsPanel {
    constructor(gameState, renderer) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.budgetElement = document.getElementById('budget-display');
        this.incomeElement = document.getElementById('income-display');
        this.expensesElement = document.getElementById('expenses-display');
        this.populationElement = document.getElementById('population-display');
        this.unemployedElement = document.getElementById('unemployed-display');
        
        // Initial update
        this.update();
        
        // Update stats display whenever renderer renders (after state changes)
        this.setupUpdateListener();
    }

    setupUpdateListener() {
        // Store original render method
        const originalRender = this.renderer.render.bind(this.renderer);
        
        // Override render to update stats display
        this.renderer.render = () => {
            originalRender();
            this.update();
        };
    }

    /**
     * Update the stats display
     */
    update() {
        if (this.budgetElement) {
            const budget = this.gameState.getBudget();
            this.budgetElement.textContent = `Budget: ⍱${budget.toLocaleString()}`;
            
            // Add visual feedback for low budget
            if (budget < 500) {
                this.budgetElement.classList.add('low-budget');
            } else {
                this.budgetElement.classList.remove('low-budget');
            }
        }

        if (this.incomeElement) {
            const income = this.gameState.getTotalIncomePerInterval();
            this.incomeElement.textContent = `Income: ⍱${income.toLocaleString()}`;
        }

        if (this.expensesElement) {
            const expenses = this.gameState.getTotalExpensesPerInterval();
            this.expensesElement.textContent = `Expenses: ⍱${expenses.toLocaleString()}`;
        }

        if (this.populationElement) {
            const population = this.gameState.getPopulation();
            this.populationElement.textContent = `Population: ${population.toLocaleString()}`;
        }

        if (this.unemployedElement) {
            const unemployed = this.gameState.getUnemployedPopulation();
            this.unemployedElement.textContent = `Unemployed: ${unemployed.toLocaleString()}`;
        }
    }

    /**
     * Animate budget update when income is generated
     * @param {number} incomeAmount - Amount of income generated
     */
    animateUpdate(incomeAmount) {
        if (!this.budgetElement) return;
        
        // Update the budget display
        this.update();
        
        // Add animation class
        this.budgetElement.classList.add('income-update');
        
        // Create a temporary element to show the income gain
        const incomeIndicator = document.createElement('div');
        incomeIndicator.className = 'income-indicator';
        incomeIndicator.textContent = `+⍱${incomeAmount}`;
        this.budgetElement.appendChild(incomeIndicator);
        
        // Remove animation class and indicator after animation completes
        setTimeout(() => {
            this.budgetElement.classList.remove('income-update');
            if (incomeIndicator.parentNode) {
                incomeIndicator.parentNode.removeChild(incomeIndicator);
            }
        }, 1000);
    }
}

