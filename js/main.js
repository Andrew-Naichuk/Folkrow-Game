import { CanvasManager } from './core/CanvasManager.js';
import { Camera } from './core/Camera.js';
import { GameState } from './core/GameState.js';
import { VillagerManager } from './core/VillagerManager.js';
import { Renderer } from './rendering/Renderer.js';
import { MouseHandler } from './input/MouseHandler.js';
import { KeyboardHandler } from './input/KeyboardHandler.js';
import { ToolSelector } from './ui/ToolSelector.js';
import { ClearButton } from './ui/ClearButton.js';
import { AddBudgetButton } from './ui/AddBudgetButton.js';
import { StatsPanel } from './ui/StatsPanel.js';
import { SpriteManager } from './utils/SpriteManager.js';
import { BUILDING_DATA, DECORATION_DATA, ROAD_DATA } from './data/itemData.js';

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
        
        // Initialize input handlers
        const cursorInfo = document.getElementById('cursor-info');
        this.mouseHandler = new MouseHandler(
            this.canvasManager.getCanvas(),
            this.renderer,
            this.gameState,
            cursorInfo
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
        this.addBudgetButton = new AddBudgetButton(this.gameState, this.renderer);
        this.clearButton = new ClearButton(this.gameState, this.renderer);
        this.statsPanel = new StatsPanel(this.gameState, this.renderer);
        
        // Start income generation system
        this.startIncomeGeneration();
        
        // Initialize game loop timing
        this.lastFrameTime = Date.now();
        
        // Start game loop
        this.gameLoop();
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
     * Start the income generation system
     * Buildings with incomeAmount property generate income at their specified intervals
     */
    startIncomeGeneration() {
        // Create income generators for each building type that generates income
        const incomeGenerators = new Map();
        
        // Find all buildings that generate income
        Object.keys(BUILDING_DATA).forEach(buildingId => {
            const incomeData = this.gameState.getBuildingIncomeData(buildingId);
            if (incomeData) {
                incomeGenerators.set(buildingId, incomeData);
            }
        });
        
        // If no income-generating buildings, return early
        if (incomeGenerators.size === 0) {
            return;
        }
        
        // Use the shortest interval as the main loop interval
        const minInterval = Math.min(...Array.from(incomeGenerators.values()).map(d => d.interval));
        
        // Track last generation time for each building type
        const lastGeneration = new Map();
        incomeGenerators.forEach((data, buildingId) => {
            lastGeneration.set(buildingId, 0);
        });
        
        setInterval(() => {
            const now = Date.now();
            const placedItems = this.gameState.getPlacedItems();
            
            // Process each income-generating building type
            incomeGenerators.forEach((incomeData, buildingId) => {
                // Check if enough time has passed since last generation
                const lastGen = lastGeneration.get(buildingId);
                if (now - lastGen >= incomeData.interval) {
                    // Count buildings of this type
                    const buildingCount = placedItems.filter(item => 
                        item.type === 'building' && item.id === buildingId
                    ).length;
                    
                    if (buildingCount > 0) {
                        const totalIncome = buildingCount * incomeData.amount;
                        this.gameState.addBudget(totalIncome);
                        
                        // Trigger budget display animation
                        this.statsPanel.animateUpdate(totalIncome);
                        
                        // Update last generation time
                        lastGeneration.set(buildingId, now);
                    }
                }
            });
        }, minInterval);
    }

    gameLoop() {
        // Calculate delta time
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Update camera based on keyboard input
        this.camera.update(this.keyboardHandler.getKeys());
        
        // Update villagers
        this.villagerManager.update(deltaTime);
        
        // Render the scene
        this.renderer.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Game();
    });
} else {
    new Game();
}

