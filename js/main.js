import { CanvasManager } from './core/CanvasManager.js';
import { Camera } from './core/Camera.js';
import { GameState } from './core/GameState.js';
import { VillagerManager } from './core/VillagerManager.js';
import { Renderer } from './rendering/Renderer.js';
import { MouseHandler } from './input/MouseHandler.js';
import { KeyboardHandler } from './input/KeyboardHandler.js';
import { ToolSelector } from './ui/ToolSelector.js';
import { ClearButton } from './ui/ClearButton.js';
import { StatsPanel } from './ui/StatsPanel.js';
import { Toast } from './ui/Toast.js';
import { Tooltip } from './ui/Tooltip.js';
import { SpriteManager } from './utils/SpriteManager.js';
import { BUILDING_DATA, DECORATION_DATA, ROAD_DATA } from './data/itemData.js';
import { CONFIG } from './config.js';
import { tileToWorld } from './utils/coordinateUtils.js';

/**
 * Main application entry point
 */
class Game {
    constructor() {
        // Initialize core systems
        this.camera = new Camera();
        this.canvasManager = new CanvasManager('gameCanvas', this.camera);
        this.gameState = new GameState();
        this.villagerManager = new VillagerManager(this.gameState);
        
        // Center camera on middle of the map
        this.initCamera();
        
        // Initialize sprite manager
        this.spriteManager = new SpriteManager();
        
        // Preload sprites from item data
        this.preloadSprites();
        
        // Initialize renderer
        this.renderer = new Renderer(
            this.canvasManager,
            this.camera,
            this.gameState,
            this.spriteManager
        );
        
        // Set villager manager in renderer
        this.renderer.setVillagerManager(this.villagerManager);
        
        // Initialize UI components
        this.toast = new Toast();
        this.tooltip = new Tooltip();
        
        // Initialize input handlers
        this.mouseHandler = new MouseHandler(
            this.canvasManager.getCanvas(),
            this.renderer,
            this.gameState,
            this.toast,
            this.tooltip
        );
        // Set mouse handler in renderer so it can access global mouse position
        this.renderer.setMouseHandler(this.mouseHandler);
        this.keyboardHandler = new KeyboardHandler(
            this.gameState,
            this.renderer,
            this.canvasManager.getCanvas()
        );
        
        // Initialize UI
        this.toolSelector = new ToolSelector(this.gameState, this.renderer, this.mouseHandler, this.spriteManager);
        this.clearButton = new ClearButton(this.gameState, this.renderer, this.villagerManager, this.camera);
        this.statsPanel = new StatsPanel(this.gameState, this.renderer);
        
        // Initialize income generation system (now integrated into game loop)
        this.initializeIncomeGeneration();
        
        // Start environment events system
        this.startEnvironmentEvents();
        
        // Initialize game loop timing
        this.lastFrameTime = performance.now();
        
        // Start game loop
        this.gameLoop();
    }

    /**
     * Initialize camera position to center on the map
     */
    initCamera() {
        const midTileX = (CONFIG.GRID_SIZE - 1) / 2;
        const midTileY = (CONFIG.GRID_SIZE - 1) / 2;
        const centerWorld = tileToWorld(midTileX, midTileY);
        this.camera.x = centerWorld.x;
        this.camera.y = centerWorld.y;
    }

    /**
     * Preload all sprites defined in item data
     */
    async preloadSprites() {
        const spritePaths = [];
        
        // Collect sprite paths from all item types
        Object.values(BUILDING_DATA).forEach(data => {
            if (data.sprite) spritePaths.push(data.sprite);
        });
        Object.values(DECORATION_DATA).forEach(data => {
            if (data.sprite) spritePaths.push(data.sprite);
        });
        Object.values(ROAD_DATA).forEach(data => {
            if (data.sprite) spritePaths.push(data.sprite);
        });
        
        // Preload all sprites
        if (spritePaths.length > 0) {
            try {
                await this.spriteManager.preloadSprites(spritePaths);
                console.log(`Loaded ${spritePaths.length} sprite(s)`);
            } catch (error) {
                console.warn('Some sprites failed to load:', error);
            }
        }
    }

    /**
     * Initialize the income generation and expense system
     * Buildings with incomeAmount property generate income at the universal interval defined in CONFIG
     * Buildings with expenseAmount property incur expenses at the same interval
     * This is now integrated into the game loop using delta time for frame-rate independence
     */
    initializeIncomeGeneration() {
        // Create income generators for each building type that generates income
        this.incomeGenerators = new Map();
        
        // Find all buildings that generate income
        Object.keys(BUILDING_DATA).forEach(buildingId => {
            const incomeData = this.gameState.getBuildingIncomeData(buildingId);
            if (incomeData) {
                this.incomeGenerators.set(buildingId, incomeData);
            }
        });
        
        // Use the universal interval from config
        this.incomeInterval = CONFIG.INCOME_GENERATION_INTERVAL;
        
        // Track accumulated time for income/expense processing
        this.incomeAccumulatedTime = 0;
    }

    /**
     * Process income generation and expenses based on accumulated delta time
     * This is called from the game loop to ensure frame-rate independence
     * @param {number} deltaTime - Time elapsed since last frame in milliseconds
     */
    processIncomeGeneration(deltaTime) {
        // Accumulate time
        this.incomeAccumulatedTime += deltaTime;
        
        // Process when interval is reached
        if (this.incomeAccumulatedTime >= this.incomeInterval) {
            // Advance the day/night cycle
            this.gameState.advanceTimeCycle();
            
            const placedItems = this.gameState.getPlacedItems();
            
            // Get production multiplier to apply to all income/expenses
            const productionMultiplier = this.gameState.getProductionMultiplier();
            
            // Apply night multiplier if it's night
            const nightMultiplier = this.gameState.isDay ? 1 : CONFIG.NIGHT_PRODUCTION_MULTIPLIER;
            const finalMultiplier = productionMultiplier * nightMultiplier;
            
            // Process income generation
            if (this.incomeGenerators.size > 0) {
                this.incomeGenerators.forEach((incomeData, buildingId) => {
                    // Count buildings of this type
                    const buildingCount = placedItems.filter(item => 
                        item.type === 'building' && item.id === buildingId
                    ).length;
                    
                    if (buildingCount > 0) {
                        // Apply production multiplier and night multiplier to income
                        const totalIncome = buildingCount * incomeData.amount * finalMultiplier;
                        this.gameState.addBudget(totalIncome);
                        
                        // Trigger budget display animation
                        this.statsPanel.animateUpdate(totalIncome);
                    }
                });
            }
            
            // Process expenses (maintenance costs) - always processed together with income
            const totalExpenses = this.gameState.getTotalExpensesPerInterval();
            if (totalExpenses > 0) {
                // Deduct expenses from budget (can go negative)
                this.gameState.addBudget(-totalExpenses);
            }
            
            // Reset accumulated time, but keep any overflow to maintain precision
            this.incomeAccumulatedTime -= this.incomeInterval;
        }
    }

    /**
     * Start the environment events system
     * Every 1 minute, spawns a random tree at an empty cell and removes a random tree
     * This keeps the total balance of trees the same while making them appear/disappear dynamically
     */
    startEnvironmentEvents() {
        const ENVIRONMENT_EVENT_INTERVAL = 60000; // 1 minute in milliseconds
        
        setInterval(() => {
            // Find a random empty cell to spawn a tree
            const emptyCell = this.gameState.findRandomEmptyCell();
            
            // Find a random existing tree to remove
            const treeToRemove = this.gameState.findRandomTree();
            
            // Only proceed if we have both an empty cell and a tree to remove
            // This ensures the total balance of trees stays the same
            if (emptyCell && treeToRemove) {
                // Randomly choose between 'tree' and 'pine' for the new tree
                const treeTypes = ['tree', 'pine'];
                const randomTreeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                
                // Remove the old tree first
                this.gameState.removeItemFree(treeToRemove.isoX, treeToRemove.isoY);
                
                // Spawn a new tree at the empty cell
                this.gameState.placeItemFree(emptyCell.isoX, emptyCell.isoY, 'decoration', randomTreeType);
                
                console.log(`Environment event: Tree removed at (${treeToRemove.isoX}, ${treeToRemove.isoY}), new ${randomTreeType} spawned at (${emptyCell.isoX}, ${emptyCell.isoY})`);
            }
            // If either condition is not met, do nothing to maintain tree balance
        }, ENVIRONMENT_EVENT_INTERVAL);
    }

    /**
     * Reset the current game using updated config values
     */
    resetForNewConfig() {
        this.gameState.resetGame();
        
        if (this.villagerManager) {
            this.villagerManager.clear();
        }
        
        this.incomeAccumulatedTime = 0;
        this.initCamera();
        
        if (this.renderer) {
            this.renderer.render();
        }
    }

    gameLoop() {
        // Calculate delta time using performance.now() for better precision
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Process income generation and expenses (frame-rate independent)
        this.processIncomeGeneration(deltaTime);
        
        // Update camera based on keyboard input (deltaTime in seconds)
        this.camera.update(this.keyboardHandler.getKeys(), deltaTime / 1000);
        
        // Update villagers
        this.villagerManager.update(deltaTime);
        
        // Render the scene
        this.renderer.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

const DEFAULT_SETUP = {
    gridSize: CONFIG.GRID_SIZE,
    budget: CONFIG.INITIAL_BUDGET,
    dayLength: CONFIG.DAY_LENGTH,
    nightLength: CONFIG.NIGHT_LENGTH
};

let activeGame = null;

function initializeSetupModal() {
    const modal = document.getElementById('setup-modal');
    if (!modal) {
        activeGame = new Game();
        return;
    }

    const mapSizeInput = document.getElementById('setup-map-size');
    const budgetInput = document.getElementById('setup-budget');
    const dayLengthInput = document.getElementById('setup-day-length');
    const nightLengthInput = document.getElementById('setup-night-length');
    const mapSizeValue = document.getElementById('setup-map-size-value');
    const budgetValue = document.getElementById('setup-budget-value');
    const dayLengthValue = document.getElementById('setup-day-length-value');
    const nightLengthValue = document.getElementById('setup-night-length-value');
    const startButton = document.getElementById('setup-start-btn');
    const defaultsButton = document.getElementById('setup-defaults-btn');

    const updateValueDisplay = () => {
        if (mapSizeValue) mapSizeValue.textContent = `${mapSizeInput.value} x ${mapSizeInput.value}`;
        if (budgetValue) budgetValue.textContent = `⍱${Number(budgetInput.value).toLocaleString()}`;
        if (dayLengthValue) dayLengthValue.textContent = `${dayLengthInput.value} ticks`;
        if (nightLengthValue) nightLengthValue.textContent = `${nightLengthInput.value} ticks`;
    };

    const setDefaults = () => {
        mapSizeInput.value = DEFAULT_SETUP.gridSize;
        budgetInput.value = DEFAULT_SETUP.budget;
        dayLengthInput.value = DEFAULT_SETUP.dayLength;
        nightLengthInput.value = DEFAULT_SETUP.nightLength;
        updateValueDisplay();
    };

    const setCurrentValues = () => {
        mapSizeInput.value = CONFIG.GRID_SIZE;
        budgetInput.value = CONFIG.INITIAL_BUDGET;
        dayLengthInput.value = CONFIG.DAY_LENGTH;
        nightLengthInput.value = CONFIG.NIGHT_LENGTH;
        updateValueDisplay();
    };

    setDefaults();

    [mapSizeInput, budgetInput, dayLengthInput, nightLengthInput].forEach(input => {
        input.addEventListener('input', updateValueDisplay);
    });

    defaultsButton.addEventListener('click', setDefaults);
    startButton.addEventListener('click', () => {
        CONFIG.GRID_SIZE = Number.parseInt(mapSizeInput.value, 10);
        CONFIG.INITIAL_BUDGET = Number.parseInt(budgetInput.value, 10);
        CONFIG.DAY_LENGTH = Number.parseInt(dayLengthInput.value, 10);
        CONFIG.NIGHT_LENGTH = Number.parseInt(nightLengthInput.value, 10);

        try {
            localStorage.removeItem('isometric_game_state');
        } catch (error) {
            console.warn('Failed to clear saved game state:', error);
        }

        modal.style.display = 'none';
        if (activeGame) {
            activeGame.resetForNewConfig();
        } else {
            activeGame = new Game();
        }
    });

    const openSetupModal = ({ useCurrentValues = false } = {}) => {
        if (useCurrentValues) {
            setCurrentValues();
        } else {
            setDefaults();
        }
        modal.style.display = 'flex';
    };

    document.addEventListener('game:openSetup', () => {
        openSetupModal({ useCurrentValues: true });
    });

    return { openSetupModal };
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeSetupModal();
    });
} else {
    initializeSetupModal();
}

