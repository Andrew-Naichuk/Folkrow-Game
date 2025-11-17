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
        this.workersRequired = 0; // Total workers required by all placed items
        this.productionMultiplier = 1; // Production multiplier (1 = full production, <1 = reduced)
        
        // Day/night cycle tracking
        this.currentTick = 0; // Current tick in the cycle (0 to DAY_LENGTH + NIGHT_LENGTH - 1)
        this.isDay = true; // Whether it's currently day or night
        
        // Load saved state from localStorage
        const hasSavedState = this.loadFromLocalStorage();
        
        // If no saved state exists, initialize the game with initial map items
        if (!hasSavedState) {
            this.initializeInitialMap();
        }
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
     * Requirement checkers - maps requirement type to a checker function
     * Each checker returns { met: boolean, current: value, required: value, label: string }
     * Extend this object to add new requirement types
     */
    getRequirementCheckers() {
        return {
            population: (required) => ({
                met: this.population >= required,
                current: this.population,
                required: required,
                label: 'Population'
            }),
            budget: (required) => ({
                met: this.budget >= required,
                current: this.budget,
                required: required,
                label: 'Budget'
            }),
            unemployedPopulation: (required) => ({
                met: this.unemployedPopulation >= required,
                current: this.unemployedPopulation,
                required: required,
                label: 'Workers'
            }),
            building: (required) => {
                const buildingId = required;
                const hasBuilding = this.hasBuilding(buildingId);
                const buildingData = BUILDING_DATA[buildingId];
                const buildingName = buildingData ? buildingData.name : buildingId;
                return {
                    met: hasBuilding,
                    current: hasBuilding ? 1 : 0,
                    required: 1,
                    label: buildingName
                };
            }
        };
    }

    /**
     * Check if requirements are met for placing an item
     * Supports all item types (building, decoration, road) and any requirement type
     * @param {string} type - Item type
     * @param {string} id - Item ID
     * @returns {{met: boolean, missing: Object}} Object with 'met' boolean and 'missing' requirements object
     */
    checkRequirements(type, id) {
        let itemData = null;
        if (type === 'building' && BUILDING_DATA[id]) {
            itemData = BUILDING_DATA[id];
        } else if (type === 'decoration' && DECORATION_DATA[id]) {
            itemData = DECORATION_DATA[id];
        } else if (type === 'road' && ROAD_DATA[id]) {
            itemData = ROAD_DATA[id];
        }

        if (!itemData || !itemData.requires) {
            return { met: true, missing: null };
        }

        const requirements = itemData.requires;
        const missing = {};
        const checkers = this.getRequirementCheckers();

        // Check each requirement type dynamically
        for (const [reqType, requiredValue] of Object.entries(requirements)) {
            const checker = checkers[reqType];
            if (checker) {
                const result = checker(requiredValue);
                if (!result.met) {
                    missing[reqType] = result;
                }
            } else {
                // Unknown requirement type - block placement since we can't verify it's met
                console.warn(`Unknown requirement type: ${reqType} for item ${type}:${id} - blocking placement`);
                missing[reqType] = {
                    met: false,
                    current: 'unknown',
                    required: requiredValue,
                    label: reqType.charAt(0).toUpperCase() + reqType.slice(1)
                };
            }
        }

        // Check if any requirements are missing
        const met = Object.keys(missing).length === 0;
        return { met, missing: met ? null : missing };
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
        
        // Check if item has requirements that must be met
        const requirementsCheck = this.checkRequirements(type, id);
        if (!requirementsCheck.met) {
            return false;
        }
        
        // Get item data to check for unemployedPopulation requirement
        let itemData = null;
        if (type === 'building' && BUILDING_DATA[id]) {
            itemData = BUILDING_DATA[id];
        } else if (type === 'decoration' && DECORATION_DATA[id]) {
            itemData = DECORATION_DATA[id];
        } else if (type === 'road' && ROAD_DATA[id]) {
            itemData = ROAD_DATA[id];
        }
        
        // Get the new item's worker requirement (if any)
        const newItemWorkerRequirement = (itemData && itemData.requires && itemData.requires.unemployedPopulation) 
            ? itemData.requires.unemployedPopulation 
            : 0;
        
        // Calculate workers required AFTER placing the item (to check for shortage)
        const workersRequiredBefore = this.calculateWorkersRequired();
        const workersRequiredAfter = workersRequiredBefore + newItemWorkerRequirement;
        const currentWorkers = this.population - this.unemployedPopulation;
        
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
        if (type === 'building' && itemData && itemData.population) {
            const newPopulation = itemData.population;
            this.population += newPopulation;
            
            // Calculate shortage AFTER including the new item's requirement
            const shortageAfter = Math.max(0, workersRequiredAfter - currentWorkers);
            
            // If there's a worker shortage, assign new people to work instead of unemployed
            if (shortageAfter > 0) {
                const workersToAssign = Math.min(newPopulation, shortageAfter);
                // Assign workersToAssign to work, rest to unemployed
                this.unemployedPopulation += (newPopulation - workersToAssign);
            } else {
                // No shortage, all new population is unemployed
                this.unemployedPopulation += newPopulation;
            }
        }
        
        // Handle item placement - convert unemployed villagers to workers if required
        if (newItemWorkerRequirement > 0) {
            // Convert required number of unemployed villagers to workers
            this.unemployedPopulation = Math.max(0, this.unemployedPopulation - newItemWorkerRequirement);
        }
        
        // Safety check: ensure unemployed never exceeds total population
        this.unemployedPopulation = Math.min(this.population, this.unemployedPopulation);
        
        // Save state to localStorage
        this.saveToLocalStorage();
        
        return true;
    }

    /**
     * Complete game reset - resets everything to initial state
     * This includes clearing all items, resetting budget, population, and regenerating the map
     */
    resetGame() {
        // Clear all placed items
        this.placedItems = [];
        
        // Reset budget to initial value
        this.budget = CONFIG.INITIAL_BUDGET;
        
        // Reset population
        this.population = 0;
        this.unemployedPopulation = 0;
        this.workersRequired = 0;
        this.productionMultiplier = 1;
        
        // Reset time cycle
        this.currentTick = 0;
        this.isDay = true;
        
        // Clear selected tool
        this.clearSelectedTool();
        
        // Clear localStorage to ensure a fresh start
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
        
        // Regenerate the initial map
        this.initializeInitialMap();
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
        
        // Check if trying to destroy a tree, pine, stump, or roots - requires Woodcutter or Timberman
        if (item.type === 'decoration' && (item.id === 'tree' || item.id === 'pine' || item.id === 'stump' || item.id === 'roots')) {
            if (!this.hasWoodcutterOrTimberman()) {
                return false;
            }
        }
        
        // Check if trying to destroy rocks or boulder - requires Stonecutter
        if (item.type === 'decoration' && (item.id === 'rocks' || item.id === 'boulder')) {
            if (!this.hasStonecutter()) {
                return false;
            }
        }
        
        // Get demolition cost from item data
        const demolitionCost = this.getDemolitionCost(item.type, item.id);
        
        // Check if player can afford the demolition cost
        if (this.budget < demolitionCost) {
            return false;
        }
        
        // Deduct demolition cost
        this.budget -= demolitionCost;
        
        // Get item data before removal
        let itemData = null;
        if (item.type === 'building' && BUILDING_DATA[item.id]) {
            itemData = BUILDING_DATA[item.id];
        } else if (item.type === 'decoration' && DECORATION_DATA[item.id]) {
            itemData = DECORATION_DATA[item.id];
        } else if (item.type === 'road' && ROAD_DATA[item.id]) {
            itemData = ROAD_DATA[item.id];
        }
        
        // Get the item's worker requirement (if any) before removal
        const itemWorkerRequirement = (itemData && itemData.requires && itemData.requires.unemployedPopulation) 
            ? itemData.requires.unemployedPopulation 
            : 0;
        
        // Get the item's population (if it's a house) before removal
        const itemPopulation = (item.type === 'building' && itemData && itemData.population) 
            ? itemData.population 
            : 0;
        
        // Remove the item first to calculate workersRequired after removal
        this.placedItems.splice(itemIndex, 1);
        
        // Calculate workers required after removal
        const workersRequiredAfter = this.calculateWorkersRequired();
        
        // Subtract population if this is a house
        if (itemPopulation > 0) {
            this.population = Math.max(0, this.population - itemPopulation);
            
            // When removing a house, we need to account for workers that were assigned from that house
            // If the building required workers, some of the house's population were working
            // We should only reduce unemployed by the number who were actually unemployed
            // Since we don't track per-house assignments, we use a heuristic:
            // - If there's a worker requirement, assume those workers came from this house
            // - Reduce unemployed by (house population - worker requirement), but not less than 0
            const unemployedFromHouse = Math.max(0, itemPopulation - itemWorkerRequirement);
            this.unemployedPopulation = Math.max(0, this.unemployedPopulation - unemployedFromHouse);
        }
        
        // Handle item demolition - restore workers to unemployed (only if there's population left)
        if (itemWorkerRequirement > 0) {
            // The workers that were assigned to this building are now free
            // Restore them to unemployed if there's still population
            if (this.population > 0) {
                this.unemployedPopulation = Math.min(this.population, this.unemployedPopulation + itemWorkerRequirement);
            }
            
            // Check if there's still a worker shortage after removal
            // If so, reassign the newly unemployed workers back to work
            const currentWorkers = this.population - this.unemployedPopulation;
            
            if (workersRequiredAfter > currentWorkers) {
                const shortage = workersRequiredAfter - currentWorkers;
                const workersToReassign = Math.min(this.unemployedPopulation, shortage);
                // Reassign workers back to work
                this.unemployedPopulation = Math.max(0, this.unemployedPopulation - workersToReassign);
            }
        }
        
        // Safety check: ensure unemployed never exceeds total population
        this.unemployedPopulation = Math.min(this.population, this.unemployedPopulation);
        
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
     * Place an item at the specified position without cost (for environment events)
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {string} type - Item type
     * @param {string} id - Item ID
     * @param {boolean} flipped - Whether the item should be horizontally flipped
     * @returns {boolean} True if item was placed successfully
     */
    placeItemFree(isoX, isoY, type, id, flipped = false) {
        // Check if position is valid (but skip cost and budget checks)
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
        
        // For trees, we allow adjacent placement (they have allowAdjacentPlacement: true)
        // But we still check if the exact position is free
        
        this.placedItems.push({
            type: type,
            id: id,
            isoX: isoX,
            isoY: isoY,
            flipped: flipped || false
        });
        
        // Save state to localStorage
        this.saveToLocalStorage();
        
        return true;
    }

    /**
     * Remove an item at the specified position without cost (for environment events)
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {boolean} True if an item was removed
     */
    removeItemFree(isoX, isoY) {
        const itemIndex = this.placedItems.findIndex(item => 
            item.isoX === isoX && item.isoY === isoY
        );
        
        if (itemIndex === -1) {
            return false;
        }
        
        // Remove the item (no cost, no population changes for environment events)
        this.placedItems.splice(itemIndex, 1);
        
        // Save state to localStorage
        this.saveToLocalStorage();
        
        return true;
    }

    /**
     * Find a random empty cell on the map
     * @returns {{isoX: number, isoY: number}|null} Random empty cell or null if no empty cells found
     */
    findRandomEmptyCell() {
        const maxAttempts = 1000; // Limit attempts to avoid infinite loops
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const isoX = Math.floor(Math.random() * (CONFIG.GRID_SIZE * 2 + 1)) - CONFIG.GRID_SIZE;
            const isoY = Math.floor(Math.random() * (CONFIG.GRID_SIZE * 2 + 1)) - CONFIG.GRID_SIZE;
            
            // Check if position is empty
            if (!this.placedItems.some(item => 
                item.isoX === isoX && item.isoY === isoY
            )) {
                return { isoX, isoY };
            }
            
            attempts++;
        }
        
        return null; // No empty cell found after max attempts
    }

    /**
     * Find a random tree on the map
     * @returns {Object|null} Random tree item object or null if no trees found
     */
    findRandomTree() {
        const trees = this.placedItems.filter(item => 
            item.type === 'decoration' && (item.id === 'tree' || item.id === 'pine')
        );
        
        if (trees.length === 0) {
            return null;
        }
        
        const randomTree = trees[Math.floor(Math.random() * trees.length)];
        return randomTree;
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
     * Calculate total workers required by all placed items
     * @returns {number} Total workers required
     */
    calculateWorkersRequired() {
        let totalWorkers = 0;
        
        this.placedItems.forEach(item => {
            let itemData = null;
            if (item.type === 'building' && BUILDING_DATA[item.id]) {
                itemData = BUILDING_DATA[item.id];
            } else if (item.type === 'decoration' && DECORATION_DATA[item.id]) {
                itemData = DECORATION_DATA[item.id];
            } else if (item.type === 'road' && ROAD_DATA[item.id]) {
                itemData = ROAD_DATA[item.id];
            }
            
            if (itemData && itemData.requires && itemData.requires.unemployedPopulation) {
                totalWorkers += itemData.requires.unemployedPopulation;
            }
        });
        
        return totalWorkers;
    }

    /**
     * Calculate production multiplier based on population and workers required
     * @returns {number} Production multiplier (1 if enough workers, <1 if insufficient)
     */
    calculateProductionMultiplier() {
        this.workersRequired = this.calculateWorkersRequired();
        
        // Calculate actual available workers (population minus unemployed)
        const availableWorkers = this.population - this.unemployedPopulation;
        
        // Handle edge cases
        if (this.workersRequired === 0) {
            // No workers required, full production
            return 1;
        }
        
        if (availableWorkers <= 0) {
            // No available workers, no production
            return 0;
        }
        
        if (this.workersRequired > availableWorkers) {
            // If more workers required than available, production is reduced proportionally
            return availableWorkers / this.workersRequired;
        } else {
            // If enough or more available workers than required, full production
            return 1;
        }
    }

    /**
     * Get current workers required
     * @returns {number} Current workers required
     */
    getWorkersRequired() {
        return this.workersRequired;
    }

    /**
     * Get current production multiplier
     * Recalculates it to ensure it's up to date
     * @returns {number} Current production multiplier
     */
    getProductionMultiplier() {
        // Recalculate to ensure it's always up to date
        this.productionMultiplier = this.calculateProductionMultiplier();
        return this.productionMultiplier;
    }

    /**
     * Calculate total income generated per interval from all placed buildings
     * Applies production multiplier if workers are insufficient
     * @returns {number} Total income per interval (after production multiplier)
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
        
        // Update production multiplier based on current state
        this.productionMultiplier = this.calculateProductionMultiplier();
        
        // Apply production multiplier to income
        return totalIncome * this.productionMultiplier;
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
     * Get expense data for an item (building or road)
     * @param {string} type - Item type
     * @param {string} id - Item ID
     * @returns {number|null} Expense amount or null if item doesn't have expenses
     */
    getItemExpenseData(type, id) {
        if (type === 'building' && BUILDING_DATA[id] && BUILDING_DATA[id].expenseAmount) {
            return BUILDING_DATA[id].expenseAmount;
        } else if (type === 'road' && ROAD_DATA[id] && ROAD_DATA[id].expenseAmount) {
            return ROAD_DATA[id].expenseAmount;
        }
        return null;
    }

    /**
     * Calculate total expenses per interval from all placed buildings and roads
     * @returns {number} Total expenses per interval
     */
    getTotalExpensesPerInterval() {
        let totalExpenses = 0;
        
        this.placedItems.forEach(item => {
            if (item.type === 'building' || item.type === 'road') {
                const expenseAmount = this.getItemExpenseData(item.type, item.id);
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
     * Advance the day/night cycle by one tick
     * Called when income generation interval occurs
     */
    advanceTimeCycle() {
        this.currentTick++;
        const cycleLength = CONFIG.DAY_LENGTH + CONFIG.NIGHT_LENGTH;
        
        // Reset tick when cycle completes
        if (this.currentTick >= cycleLength) {
            this.currentTick = 0;
        }
        
        // Determine if it's day or night
        this.isDay = this.currentTick < CONFIG.DAY_LENGTH;
    }

    /**
     * Get current time cycle information
     * @returns {{isDay: boolean, progress: number, tick: number}} Time cycle info
     */
    getTimeCycleInfo() {
        const cycleLength = CONFIG.DAY_LENGTH + CONFIG.NIGHT_LENGTH;
        const currentPhaseLength = this.isDay ? CONFIG.DAY_LENGTH : CONFIG.NIGHT_LENGTH;
        const phaseTick = this.isDay ? this.currentTick : (this.currentTick - CONFIG.DAY_LENGTH);
        const progress = phaseTick / currentPhaseLength; // 0 to 1
        
        return {
            isDay: this.isDay,
            progress: progress,
            tick: this.currentTick,
            phaseTick: phaseTick,
            phaseLength: currentPhaseLength
        };
    }

    /**
     * Check if player has at least one Woodcutter or Timberman building
     * @returns {boolean} True if player has at least one Woodcutter or Timberman
     */
    hasWoodcutterOrTimberman() {
        return this.placedItems.some(item => 
            item.type === 'building' && (item.id === 'woodcutter' || item.id === 'timberman')
        );
    }

    /**
     * Check if player has at least one Stonecutter building
     * @returns {boolean} True if player has at least one Stonecutter
     */
    hasStonecutter() {
        return this.hasBuilding('stonecutter');
    }

    /**
     * Check if player has at least one building of the specified type
     * @param {string} buildingId - The building ID to check for
     * @returns {boolean} True if player has at least one building of this type
     */
    hasBuilding(buildingId) {
        return this.placedItems.some(item => 
            item.type === 'building' && item.id === buildingId
        );
    }

    /**
     * Count how many buildings of the specified type the player has
     * @param {string} buildingId - The building ID to count
     * @returns {number} Number of buildings of this type
     */
    countBuildings(buildingId) {
        return this.placedItems.filter(item => 
            item.type === 'building' && item.id === buildingId
        ).length;
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
                unemployedPopulation: this.unemployedPopulation,
                currentTick: this.currentTick
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save game state to localStorage:', error);
        }
    }

    /**
     * Load game state from localStorage
     * @returns {boolean} True if a saved state was found and loaded, false otherwise
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
                    // Start with total population, then subtract workers from items that require unemployed
                    this.unemployedPopulation = this.population;
                    this.placedItems.forEach(item => {
                        let itemData = null;
                        if (item.type === 'building' && BUILDING_DATA[item.id]) {
                            itemData = BUILDING_DATA[item.id];
                        } else if (item.type === 'decoration' && DECORATION_DATA[item.id]) {
                            itemData = DECORATION_DATA[item.id];
                        } else if (item.type === 'road' && ROAD_DATA[item.id]) {
                            itemData = ROAD_DATA[item.id];
                        }
                        
                        if (itemData && itemData.requires && itemData.requires.unemployedPopulation) {
                            const required = itemData.requires.unemployedPopulation;
                            this.unemployedPopulation = Math.max(0, this.unemployedPopulation - required);
                        }
                    });
                }
                
                // Safety check: ensure unemployed never exceeds total population
                this.unemployedPopulation = Math.min(this.population, this.unemployedPopulation);
                
                // Restore time cycle state if saved
                if (typeof state.currentTick === 'number' && state.currentTick >= 0) {
                    this.currentTick = state.currentTick % (CONFIG.DAY_LENGTH + CONFIG.NIGHT_LENGTH);
                    this.isDay = this.currentTick < CONFIG.DAY_LENGTH;
                }
                
                return true; // Saved state was found and loaded
            }
        } catch (error) {
            console.warn('Failed to load game state from localStorage:', error);
            // If loading fails, use default values (already set in constructor)
        }
        
        return false; // No saved state found
    }

    /**
     * Initialize the game with initial map items randomly placed on the map
     */
    initializeInitialMap() {
        // Place trees
        const treeTypes = ['tree', 'pine'];
        const targetTreeCount = CONFIG.INITIAL_TREES;
        let treesPlaced = 0;
        let attempts = 0;
        const maxAttempts = targetTreeCount * 10; // Limit attempts to avoid infinite loops
        
        while (treesPlaced < targetTreeCount && attempts < maxAttempts) {
            const emptyCell = this.findRandomEmptyCell();
            
            if (emptyCell) {
                // Randomly choose between 'tree' and 'pine'
                const randomTreeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                
                // Place the tree without cost
                if (this.placeItemFree(emptyCell.isoX, emptyCell.isoY, 'decoration', randomTreeType)) {
                    treesPlaced++;
                }
            }
            
            attempts++;
        }
        
        // Place rocks
        const targetRocksCount = CONFIG.INITIAL_ROCKS;
        let rocksPlaced = 0;
        attempts = 0;
        const maxRocksAttempts = targetRocksCount * 10;
        
        while (rocksPlaced < targetRocksCount && attempts < maxRocksAttempts) {
            const emptyCell = this.findRandomEmptyCell();
            
            if (emptyCell) {
                if (this.placeItemFree(emptyCell.isoX, emptyCell.isoY, 'decoration', 'rocks')) {
                    rocksPlaced++;
                }
            }
            
            attempts++;
        }
        
        // Place boulders
        const targetBouldersCount = CONFIG.INITIAL_BOULDERS;
        let bouldersPlaced = 0;
        attempts = 0;
        const maxBouldersAttempts = targetBouldersCount * 10;
        
        while (bouldersPlaced < targetBouldersCount && attempts < maxBouldersAttempts) {
            const emptyCell = this.findRandomEmptyCell();
            
            if (emptyCell) {
                if (this.placeItemFree(emptyCell.isoX, emptyCell.isoY, 'decoration', 'boulder')) {
                    bouldersPlaced++;
                }
            }
            
            attempts++;
        }
        
        // Place roots
        const targetRootsCount = CONFIG.INITIAL_ROOTS;
        let rootsPlaced = 0;
        attempts = 0;
        const maxRootsAttempts = targetRootsCount * 10;
        
        while (rootsPlaced < targetRootsCount && attempts < maxRootsAttempts) {
            const emptyCell = this.findRandomEmptyCell();
            
            if (emptyCell) {
                if (this.placeItemFree(emptyCell.isoX, emptyCell.isoY, 'decoration', 'roots')) {
                    rootsPlaced++;
                }
            }
            
            attempts++;
        }
        
        // Place stumps
        const targetStumpsCount = CONFIG.INITIAL_STUMPS;
        let stumpsPlaced = 0;
        attempts = 0;
        const maxStumpsAttempts = targetStumpsCount * 10;
        
        while (stumpsPlaced < targetStumpsCount && attempts < maxStumpsAttempts) {
            const emptyCell = this.findRandomEmptyCell();
            
            if (emptyCell) {
                if (this.placeItemFree(emptyCell.isoX, emptyCell.isoY, 'decoration', 'stump')) {
                    stumpsPlaced++;
                }
            }
            
            attempts++;
        }
        
        // Save the initial state with all map items
        this.saveToLocalStorage();
    }
}

