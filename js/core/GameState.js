import { CONFIG } from '../config.js';
import { BUILDING_DATA, DECORATION_DATA, ROAD_DATA } from '../data/itemData.js';

const STORAGE_KEY = 'isometric_game_state';

/**
 * Manages game state (placed items, selected tool, etc.)
 */
export class GameState {
    constructor() {
        this.placedItems = [];
        this.selectedTool = null;
        this.selectedType = null;
        this.selectedId = null;
        this.selectedFlipped = false; // Track rotation state for selected tool
        this.budget = CONFIG.INITIAL_BUDGET;
        this.population = 0; // Initial population is 0
        this.unemployedPopulation = 0; // Initial unemployed population is 0 (equals population by default)
        
        // Load saved state from localStorage
        this.loadFromLocalStorage();
    }

    /**
     * Check if a position is valid for placement
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {string} type - Item type
     * @param {string} id - Item ID
     * @returns {boolean} True if position is valid
     */
    isValidPosition(isoX, isoY, type, id) {
        // Check bounds
        if (isoX < -CONFIG.GRID_SIZE || isoX > CONFIG.GRID_SIZE || 
            isoY < -CONFIG.GRID_SIZE || isoY > CONFIG.GRID_SIZE) {
            return false;
        }
        
        // Check if position is already occupied
        if (this.placedItems.some(item => 
            item.isoX === isoX && item.isoY === isoY
        )) {
            return false;
        }
        
        // Check if item data allows adjacent placement
        let allowAdjacent = false;
        if (type === 'building' && BUILDING_DATA[id]) {
            allowAdjacent = BUILDING_DATA[id].allowAdjacentPlacement === true;
        } else if (type === 'decoration' && DECORATION_DATA[id]) {
            allowAdjacent = DECORATION_DATA[id].allowAdjacentPlacement === true;
        } else if (type === 'road' && ROAD_DATA[id]) {
            allowAdjacent = ROAD_DATA[id].allowAdjacentPlacement === true;
        }
        
        // If adjacent placement is not allowed, enforce minimum 1-tile gap (including diagonally)
        if (!allowAdjacent) {
            // Check all 8 neighboring positions (4 cardinal + 4 diagonal)
            // An item cannot be placed if there's another item of the same type/id within 1 tile
            const hasNearbyItem = this.placedItems.some(item => {
                // Only check items of the same type and id
                if (item.type !== type || item.id !== id) {
                    return false;
                }
                
                const dx = Math.abs(item.isoX - isoX);
                const dy = Math.abs(item.isoY - isoY);
                
                // Check if within 1 tile distance (Chebyshev distance <= 1)
                // This includes cardinal (dx=1,dy=0 or dx=0,dy=1) and diagonal (dx=1,dy=1)
                return dx <= 1 && dy <= 1 && (dx !== 0 || dy !== 0);
            });
            
            if (hasNearbyItem) {
                return false;
            }
        }
        
        // For buildings, check if there's a road tile nearby (within 1 tile in any direction)
        if (type === 'building') {
            const hasNearbyRoad = this.placedItems.some(item => {
                if (item.type !== 'road') {
                    return false;
                }
                
                const dx = Math.abs(item.isoX - isoX);
                const dy = Math.abs(item.isoY - isoY);
                
                // Check if road is within 1 tile distance (Chebyshev distance <= 1)
                // This includes cardinal (dx=1,dy=0 or dx=0,dy=1) and diagonal (dx=1,dy=1)
                return dx <= 1 && dy <= 1;
            });
            
            if (!hasNearbyRoad) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get the cost of an item
     * @param {string} type - Item type
     * @param {string} id - Item ID
     * @returns {number} Cost of the item, or 0 if not found
     */
    getItemCost(type, id) {
        if (type === 'building' && BUILDING_DATA[id]) {
            return BUILDING_DATA[id].cost || 0;
        } else if (type === 'decoration' && DECORATION_DATA[id]) {
            return DECORATION_DATA[id].cost || 0;
        } else if (type === 'road' && ROAD_DATA[id]) {
            return ROAD_DATA[id].cost || 0;
        }
        return 0;
    }

    /**
     * Get the demolition cost of an item
     * @param {string} type - Item type
     * @param {string} id - Item ID
     * @returns {number} Demolition cost of the item, or 0 if not found
     */
    getDemolitionCost(type, id) {
        const cost = this.getItemCost(type, id);
        if (cost === 0) return 0;
        
        let multiplier = 0.5; // Default multiplier
        if (type === 'building' && BUILDING_DATA[id]) {
            multiplier = BUILDING_DATA[id].demolitionCostMultiplier ?? 0.5;
        } else if (type === 'decoration' && DECORATION_DATA[id]) {
            multiplier = DECORATION_DATA[id].demolitionCostMultiplier ?? 0.5;
        } else if (type === 'road' && ROAD_DATA[id]) {
            multiplier = ROAD_DATA[id].demolitionCostMultiplier ?? 0.5;
        }
        
        return Math.floor(cost * multiplier);
    }

    /**
     * Check if player can afford an item
     * @param {string} type - Item type
     * @param {string} id - Item ID
     * @returns {boolean} True if player can afford the item
     */
    canAfford(type, id) {
        const cost = this.getItemCost(type, id);
        return this.budget >= cost;
    }

    /**
     * Place an item at the specified position
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {string} type - Item type
     * @param {string} id - Item ID
     * @param {boolean} flipped - Whether the item should be horizontally flipped
     * @returns {boolean} True if item was placed successfully
     */
    placeItem(isoX, isoY, type, id, flipped = false) {
        // Check if position is valid
        if (!this.isValidPosition(isoX, isoY, type, id)) {
            return false;
        }
        
        // Check if player can afford the item
        if (!this.canAfford(type, id)) {
            return false;
        }
        
        // Check if building requires unemployed villagers (check before deducting cost)
        if (type === 'building' && BUILDING_DATA[id] && BUILDING_DATA[id].unemployedRequired) {
            const required = BUILDING_DATA[id].unemployedRequired;
            if (this.unemployedPopulation < required) {
                return false;
            }
        }
        
        // Deduct cost and place item
        const cost = this.getItemCost(type, id);
        this.budget -= cost;
        
        this.placedItems.push({
            type: type,
            id: id,
            isoX: isoX,
            isoY: isoY,
            flipped: flipped || false
        });
        
        // Add population if this is a house
        if (type === 'building' && BUILDING_DATA[id] && BUILDING_DATA[id].population) {
            this.population += BUILDING_DATA[id].population;
            this.unemployedPopulation += BUILDING_DATA[id].population; // New population is unemployed by default
        }
        
        // Handle building placement - convert unemployed villagers to workers if required
        if (type === 'building' && BUILDING_DATA[id] && BUILDING_DATA[id].unemployedRequired) {
            const required = BUILDING_DATA[id].unemployedRequired;
            // Convert required number of unemployed villagers to workers
            this.unemployedPopulation = Math.max(0, this.unemployedPopulation - required);
        }
        
        // Safety check: ensure unemployed never exceeds total population
        this.unemployedPopulation = Math.min(this.population, this.unemployedPopulation);
        
        // Save state to localStorage
        this.saveToLocalStorage();
        
        return true;
    }

    /**
     * Clear all placed items
     */
    clearAll() {
        this.placedItems = [];
        this.population = 0; // Reset population when clearing all
        this.unemployedPopulation = 0; // Reset unemployed population when clearing all
        
        // Save state to localStorage
        this.saveToLocalStorage();
    }

    /**
     * Clear item at a specific cell position
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {boolean} True if an item was removed
     */
    clearCell(isoX, isoY) {
        const itemIndex = this.placedItems.findIndex(item => 
            item.isoX === isoX && item.isoY === isoY
        );
        
        if (itemIndex === -1) {
            return false;
        }
        
        const item = this.placedItems[itemIndex];
        
        // Get demolition cost from item data
        const demolitionCost = this.getDemolitionCost(item.type, item.id);
        
        // Check if player can afford the demolition cost
        if (this.budget < demolitionCost) {
            return false;
        }
        
        // Deduct demolition cost
        this.budget -= demolitionCost;
        
        // Subtract population if this is a house
        if (item.type === 'building' && BUILDING_DATA[item.id] && BUILDING_DATA[item.id].population) {
            this.population = Math.max(0, this.population - BUILDING_DATA[item.id].population);
            this.unemployedPopulation = Math.max(0, this.unemployedPopulation - BUILDING_DATA[item.id].population);
        }
        
        // Handle building demolition - restore unemployed villagers (only if there's population left)
        if (item.type === 'building' && BUILDING_DATA[item.id] && BUILDING_DATA[item.id].unemployedRequired) {
            const required = BUILDING_DATA[item.id].unemployedRequired;
            // Only restore unemployed if there's still population
            // The workers were part of the population, so we can restore them to unemployed
            // But we need to ensure unemployed doesn't exceed total population
            if (this.population > 0) {
                this.unemployedPopulation = Math.min(this.population, this.unemployedPopulation + required);
            }
        }
        
        // Safety check: ensure unemployed never exceeds total population
        this.unemployedPopulation = Math.min(this.population, this.unemployedPopulation);
        
        // Remove the item
        this.placedItems.splice(itemIndex, 1);
        
        // Save state to localStorage
        this.saveToLocalStorage();
        
        return true;
    }

    /**
     * Get all placed items
     * @returns {Array} Array of placed items
     */
    getPlacedItems() {
        return this.placedItems;
    }

    /**
     * Set selected tool
     * @param {HTMLElement} tool - Tool element
     * @param {string} type - Item type
     * @param {string} id - Item ID
     */
    setSelectedTool(tool, type, id) {
        this.selectedTool = tool;
        this.selectedType = type;
        this.selectedId = id;
        this.selectedFlipped = false; // Reset rotation when selecting a new tool
    }

    /**
     * Clear selected tool
     */
    clearSelectedTool() {
        // Remove active class from tool item if it exists
        if (this.selectedTool) {
            this.selectedTool.classList.remove('active');
        }
        this.selectedTool = null;
        this.selectedType = null;
        this.selectedId = null;
        this.selectedFlipped = false;
    }

    /**
     * Get selected tool info
     * @returns {{tool: HTMLElement, type: string, id: string, flipped: boolean}|null}
     */
    getSelectedTool() {
        if (!this.selectedTool) return null;
        return {
            tool: this.selectedTool,
            type: this.selectedType,
            id: this.selectedId,
            flipped: this.selectedFlipped
        };
    }

    /**
     * Toggle rotation state for selected tool
     */
    toggleRotation() {
        if (this.selectedTool) {
            this.selectedFlipped = !this.selectedFlipped;
        }
    }

    /**
     * Get current budget
     * @returns {number} Current budget
     */
    getBudget() {
        return this.budget;
    }

    /**
     * Add money to the budget
     * @param {number} amount - Amount to add
     */
    addBudget(amount) {
        this.budget += amount;
        // Save state to localStorage
        this.saveToLocalStorage();
    }

    /**
     * Get income generation data for a building
     * @param {string} id - Building ID
     * @returns {{amount: number}|null} Income data or null if building doesn't generate income
     */
    getBuildingIncomeData(id) {
        if (BUILDING_DATA[id] && BUILDING_DATA[id].incomeAmount) {
            return {
                amount: BUILDING_DATA[id].incomeAmount
            };
        }
        return null;
    }

    /**
     * Calculate total income generated per interval from all placed buildings
     * @returns {number} Total income per interval
     */
    getTotalIncomePerInterval() {
        let totalIncome = 0;
        
        this.placedItems.forEach(item => {
            if (item.type === 'building') {
                const incomeData = this.getBuildingIncomeData(item.id);
                if (incomeData) {
                    totalIncome += incomeData.amount;
                }
            }
        });
        
        return totalIncome;
    }

    /**
     * Get expense data for a building
     * @param {string} id - Building ID
     * @returns {number|null} Expense amount or null if building doesn't have expenses
     */
    getBuildingExpenseData(id) {
        if (BUILDING_DATA[id] && BUILDING_DATA[id].expenseAmount) {
            return BUILDING_DATA[id].expenseAmount;
        }
        return null;
    }

    /**
     * Calculate total expenses per interval from all placed buildings
     * @returns {number} Total expenses per interval
     */
    getTotalExpensesPerInterval() {
        let totalExpenses = 0;
        
        this.placedItems.forEach(item => {
            if (item.type === 'building') {
                const expenseAmount = this.getBuildingExpenseData(item.id);
                if (expenseAmount !== null) {
                    totalExpenses += expenseAmount;
                }
            }
        });
        
        return totalExpenses;
    }

    /**
     * Get current population
     * @returns {number} Current population
     */
    getPopulation() {
        return this.population;
    }

    /**
     * Get current unemployed population
     * @returns {number} Current unemployed population
     */
    getUnemployedPopulation() {
        return this.unemployedPopulation;
    }

    /**
     * Save current game state to localStorage
     */
    saveToLocalStorage() {
        try {
            const state = {
                placedItems: this.placedItems,
                budget: this.budget,
                population: this.population,
                unemployedPopulation: this.unemployedPopulation
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save game state to localStorage:', error);
        }
    }

    /**
     * Load game state from localStorage
     */
    loadFromLocalStorage() {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Validate and restore placed items
                if (Array.isArray(state.placedItems)) {
                    this.placedItems = state.placedItems;
                }
                
                // Validate and restore budget
                if (typeof state.budget === 'number' && state.budget >= 0) {
                    this.budget = state.budget;
                }
                
                // Validate and restore population, or recalculate from placed items
                if (typeof state.population === 'number' && state.population >= 0) {
                    this.population = state.population;
                } else {
                    // Recalculate population from placed items if not in saved state
                    this.population = 0;
                    this.placedItems.forEach(item => {
                        if (item.type === 'building' && BUILDING_DATA[item.id] && BUILDING_DATA[item.id].population) {
                            this.population += BUILDING_DATA[item.id].population;
                        }
                    });
                }
                
                // Validate and restore unemployed population, or recalculate from placed items
                if (typeof state.unemployedPopulation === 'number' && state.unemployedPopulation >= 0) {
                    this.unemployedPopulation = state.unemployedPopulation;
                } else {
                    // Recalculate unemployed population from placed items if not in saved state
                    // Start with total population, then subtract workers from buildings that require unemployed
                    this.unemployedPopulation = this.population;
                    this.placedItems.forEach(item => {
                        if (item.type === 'building' && BUILDING_DATA[item.id] && BUILDING_DATA[item.id].unemployedRequired) {
                            const required = BUILDING_DATA[item.id].unemployedRequired;
                            this.unemployedPopulation = Math.max(0, this.unemployedPopulation - required);
                        }
                    });
                }
                
                // Safety check: ensure unemployed never exceeds total population
                this.unemployedPopulation = Math.min(this.population, this.unemployedPopulation);
            }
        } catch (error) {
            console.warn('Failed to load game state from localStorage:', error);
            // If loading fails, use default values (already set in constructor)
        }
    }
}

