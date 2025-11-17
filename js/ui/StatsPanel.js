import { CONFIG } from '../config.js';
import { interpolateColor } from '../utils/colorUtils.js';

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
        this.productionElement = document.getElementById('production-display');
        this.productionWarningElement = document.getElementById('production-warning');
        
        // Time gauge elements
        this.timeGaugeDay = document.querySelector('.time-gauge-day');
        this.timeGaugeNight = document.querySelector('.time-gauge-night');
        this.timeGaugeIndicator = document.querySelector('.time-gauge-indicator');
        this.timeStatusElement = document.getElementById('time-status');
        
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
            this.budgetElement.textContent = `Budget: ⍱${budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            
            // Add visual feedback for low budget
            if (budget < 500) {
                this.budgetElement.classList.add('low-budget');
            } else {
                this.budgetElement.classList.remove('low-budget');
            }
        }

        if (this.incomeElement) {
            const income = this.gameState.getTotalIncomePerInterval();
            // Apply night multiplier if it's night
            const nightMultiplier = this.gameState.isDay ? 1 : CONFIG.NIGHT_PRODUCTION_MULTIPLIER;
            const adjustedIncome = income * nightMultiplier;
            this.incomeElement.textContent = `Income: ⍱${adjustedIncome.toFixed(2)}`;
        }

        if (this.expensesElement) {
            const expenses = this.gameState.getTotalExpensesPerInterval();
            this.expensesElement.textContent = `Expenses: ⍱${expenses.toFixed(2)}`;
        }

        if (this.populationElement) {
            const population = this.gameState.getPopulation();
            this.populationElement.textContent = `Population: ${population.toLocaleString()}`;
        }

        if (this.unemployedElement) {
            const unemployed = this.gameState.getUnemployedPopulation();
            this.unemployedElement.textContent = `Unemployed: ${unemployed.toLocaleString()}`;
        }

        if (this.productionElement) {
            const productionMultiplier = this.gameState.getProductionMultiplier();
            // Apply night multiplier if it's night
            const nightMultiplier = this.gameState.isDay ? 1 : CONFIG.NIGHT_PRODUCTION_MULTIPLIER;
            const finalProductionMultiplier = productionMultiplier * nightMultiplier;
            const productionPercent = (finalProductionMultiplier * 100).toFixed(2);
            this.productionElement.textContent = `Production: ${productionPercent}%`;
        }

        // Show/hide production warning based on production multiplier
        if (this.productionWarningElement) {
            const productionMultiplier = this.gameState.getProductionMultiplier();
            if (productionMultiplier < 1) {
                this.productionWarningElement.style.display = 'block';
            } else {
                this.productionWarningElement.style.display = 'none';
            }
        }

        // Update time gauge
        this.updateTimeGauge();
        
        // Update canvas background color based on time cycle
        this.updateCanvasBackground();
    }

    /**
     * Update the time gauge display
     */
    updateTimeGauge() {
        const timeInfo = this.gameState.getTimeCycleInfo();
        const cycleLength = CONFIG.DAY_LENGTH + CONFIG.NIGHT_LENGTH;
        
        // Calculate the position of the indicator (0 to 100%)
        // Clamp to ensure indicator stays within bounds (accounting for indicator width)
        let indicatorPosition = (timeInfo.tick / cycleLength) * 100;
        indicatorPosition = Math.max(0, Math.min(100, indicatorPosition));
        
        // Update indicator position
        if (this.timeGaugeIndicator) {
            this.timeGaugeIndicator.style.left = `${indicatorPosition}%`;
        }
        
        // Update status text
        if (this.timeStatusElement) {
            this.timeStatusElement.textContent = timeInfo.isDay ? 'Day' : 'Night, village resting';
        }
        
        // The day and night sections are already sized correctly in CSS
        // They don't need dynamic updates since the proportions are fixed
    }

    /**
     * Update the canvas background color based on the time cycle
     * Smoothly interpolates between day and night colors throughout the entire cycle
     * Day color peaks at the middle of day, night color peaks at the middle of night
     */
    updateCanvasBackground() {
        const timeInfo = this.gameState.getTimeCycleInfo();
        
        // Day color:rgb(41, 105, 64) (green) - peaks at middle of day
        const dayColor = '#143f24';
        // Night color: #040225 (dark blue) - peaks at middle of night
        const nightColor = '#030e26';
        
        // Calculate interpolation factor (0 = day color, 1 = night color)
        // Based on distance from phase centers
        let interpolationFactor;
        
        const dayMiddleTick = CONFIG.DAY_LENGTH / 2; // Tick 8 (middle of day)
        const nightMiddleTick = CONFIG.DAY_LENGTH + (CONFIG.NIGHT_LENGTH / 2); // Tick 19 (middle of night)
        
        if (timeInfo.isDay) {
            // Day phase: tick 0 to (DAY_LENGTH - 1)
            // For continuity: at end of previous night (tick 21), factor = 0 (day color)
            // At start of day (tick 0), we need factor = 0 to match
            // At middle of day (tick 8), we want factor = 0 (peak day)
            // At end of day (tick 15), we want factor = 1 (transition to night)
            
            if (timeInfo.tick <= dayMiddleTick) {
                // First half of day (tick 0-8): maintain day color
                // This ensures continuity with end of previous night
                interpolationFactor = 0;
            } else {
                // Second half of day (tick 9-15): transition from day to night
                const secondHalfDistance = timeInfo.tick - dayMiddleTick;
                const secondHalfMax = CONFIG.DAY_LENGTH / 1.7;
                const secondHalfNormalized = Math.min(1, secondHalfDistance / secondHalfMax);
                interpolationFactor = secondHalfNormalized;
            }
        } else {
            // Night phase: tick DAY_LENGTH to (DAY_LENGTH + NIGHT_LENGTH - 1)
            // Distance from middle of night (tick 19)
            const distanceFromNightMiddle = Math.abs(timeInfo.tick - nightMiddleTick);
            const maxNightDistance = CONFIG.NIGHT_LENGTH / 2; // Maximum distance (at tick 16 or 21)
            
            // Normalize: 0 at middle, 1 at edges
            const normalizedDistance = Math.min(1, distanceFromNightMiddle / maxNightDistance);
            
            // For continuity: at end of day (tick 15), factor = 1
            // At start of night (tick 16), we need factor = 1 to match
            // At middle of night (tick 19), we want factor = 1 (peak night)
            // At end of night (tick 21), we want factor = 0 (transition to day)
            
            // The issue: at tick 16, normalizedDistance = 1, so 1 - 1 = 0 (day color)
            // But we need factor = 1 (night color) to match end of day
            
            // Solution: use a curve that maintains factor = 1 from start to middle of night,
            // then transitions to 0 in the second half
            if (timeInfo.tick <= nightMiddleTick) {
                // First half of night (tick 16-19): maintain night color
                interpolationFactor = 1;
            } else {
                // Second half of night (tick 20-21): transition from night to day
                const secondHalfDistance = timeInfo.tick - nightMiddleTick;
                const secondHalfMax = CONFIG.NIGHT_LENGTH / 1.7;
                const secondHalfNormalized = Math.min(1, secondHalfDistance / secondHalfMax);
                interpolationFactor = 1 - secondHalfNormalized;
            }
        }
        
        // Clamp factor to ensure it's between 0 and 1
        interpolationFactor = Math.max(0, Math.min(1, interpolationFactor));
        
        // Interpolate between day and night colors
        const currentColor = interpolateColor(dayColor, nightColor, interpolationFactor);
        
        // Update CSS variable with smooth transition
        document.documentElement.style.setProperty('--color-canvas-bg', currentColor);
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
        incomeIndicator.textContent = `+⍱${incomeAmount.toFixed(2)}`;
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

