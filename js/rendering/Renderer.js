import { CONFIG } from '../config.js';
import { screenToIso, isoToScreen } from '../utils/coordinateUtils.js';
import { GridRenderer } from './GridRenderer.js';
import { ItemRenderer } from './ItemRenderer.js';
import { AnimationManager } from './AnimationManager.js';
import { VillagerRenderer } from './VillagerRenderer.js';

/**
 * Main renderer that coordinates all rendering operations
 */
export class Renderer {
    constructor(canvasManager, camera, gameState, spriteManager = null) {
        this.canvasManager = canvasManager;
        this.camera = camera;
        this.gameState = gameState;
        this.ctx = canvasManager.getContext();
        
        this.gridRenderer = new GridRenderer(
            this.ctx,
            canvasManager.getWidth(),
            canvasManager.getHeight(),
            camera
        );
        
        this.itemRenderer = new ItemRenderer(
            this.ctx,
            canvasManager.getWidth(),
            canvasManager.getHeight(),
            camera,
            spriteManager
        );
        
        this.villagerRenderer = new VillagerRenderer(
            this.ctx,
            canvasManager.getWidth(),
            canvasManager.getHeight(),
            camera
        );
        
        this.animationManager = new AnimationManager();
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.villagerManager = null; // Will be set by setVillagerManager
        this.mouseHandler = null; // Will be set by setMouseHandler
    }
    
    /**
     * Set the mouse handler
     * @param {MouseHandler} mouseHandler - The mouse handler instance
     */
    setMouseHandler(mouseHandler) {
        this.mouseHandler = mouseHandler;
    }

    /**
     * Update mouse position
     * @param {number} x - Mouse X coordinate
     * @param {number} y - Mouse Y coordinate
     */
    updateMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }

    /**
     * Render the entire scene
     */
    render() {
        // Update renderer dimensions in case canvas was resized
        const width = this.canvasManager.getWidth();
        const height = this.canvasManager.getHeight();
        const zoom = this.camera.getZoom();
        
        this.gridRenderer.canvasWidth = width;
        this.gridRenderer.canvasHeight = height;
        this.itemRenderer.canvasWidth = width;
        this.itemRenderer.canvasHeight = height;
        this.villagerRenderer.canvasWidth = width;
        this.villagerRenderer.canvasHeight = height;
        
        this.canvasManager.clear();
        
        // Draw grid
        this.gridRenderer.drawGrid();
        
        // Draw all placed items and villagers, sorted by depth (back to front)
        // In isometric view, screenY = (isoX + isoY) * TILE_HEIGHT / 2
        // Items with lower screenY (lower isoX + isoY) are further back and should be drawn first
        // Items with higher screenY (higher isoX + isoY) are in front and should be drawn last
        const placedItems = this.gameState.getPlacedItems();
        const villagers = this.villagerManager ? this.villagerManager.getVillagers() : [];
        
        // Combine items and villagers for depth sorting
        // Add render priority: roads (0), decorations (1), buildings (2), villagers (3)
        const allEntities = [
            ...placedItems.map(item => ({ 
                type: 'item', 
                data: item,
                renderPriority: item.type === 'road' ? 0 : (item.type === 'decoration' ? 1 : 2)
            })),
            ...villagers.map(villager => ({ 
                type: 'villager', 
                data: villager,
                renderPriority: 3 // Villagers always render on top
            }))
        ];
        
        const sortedEntities = allEntities.sort((a, b) => {
            const depthA = a.data.isoX + a.data.isoY;
            const depthB = b.data.isoX + b.data.isoY;
            // Sort by depth (ascending - lower depth = draw first)
            if (depthA !== depthB) {
                return depthA - depthB;
            }
            // If depth is the same, sort by render priority (lower = draw first)
            // This ensures roads are drawn before villagers on the same tile
            if (a.renderPriority !== b.renderPriority) {
                return a.renderPriority - b.renderPriority;
            }
            // If priority is also the same, sort by isoY (ascending - lower Y = draw first)
            return a.data.isoY - b.data.isoY;
        });
        
        // Draw entities in sorted order
        sortedEntities.forEach(entity => {
            if (entity.type === 'item') {
                const item = entity.data;
                const flipped = item.flipped || false;
                if (item.type === 'building') {
                    this.itemRenderer.drawBuilding(item.isoX, item.isoY, item.id, flipped);
                    
                    // Add smoke effect for campfire and blacksmith
                    if (item.id === 'campfire' || item.id === 'blacksmith') {
                        this.animationManager.addSmoke(item.isoX, item.isoY);
                    }
                } else if (item.type === 'decoration') {
                    this.itemRenderer.drawDecoration(item.isoX, item.isoY, item.id, flipped);
                } else if (item.type === 'road') {
                    this.itemRenderer.drawRoad(item.isoX, item.isoY, item.id, flipped);
                }
            } else if (entity.type === 'villager') {
                this.villagerRenderer.drawVillager(entity.data);
            }
        });
        
        // Clean up smoke animations for removed items
        // Get all positions that should have smoke
        const smokePositions = new Set();
        placedItems.forEach(item => {
            if (item.type === 'building' && (item.id === 'campfire' || item.id === 'blacksmith')) {
                smokePositions.add(`${item.isoX},${item.isoY}`);
            }
        });
        
        // Remove smoke from positions that no longer have campfire/blacksmith
        // We need to check all smoke animations and remove ones that shouldn't exist
        // Since we can't easily iterate the map, we'll add a cleanup method to AnimationManager
        this.animationManager.cleanupOrphanedSmoke(smokePositions);
        
        // Draw preview at mouse position
        const selectedTool = this.gameState.getSelectedTool();
        if (selectedTool) {
            // Always use global mouse position when tool is selected to get accurate cursor position
            // This ensures preview follows cursor even when over sidebar or outside canvas
            let previewX = this.mouseX;
            let previewY = this.mouseY;
            
            if (this.mouseHandler) {
                const globalX = this.mouseHandler.getGlobalMouseX();
                const globalY = this.mouseHandler.getGlobalMouseY();
                const canvasRect = this.canvasManager.getCanvas().getBoundingClientRect();
                
                // Convert global position to canvas coordinates
                const canvasX = globalX - canvasRect.left;
                const canvasY = globalY - canvasRect.top;
                
                // Always use global position when tool is selected to keep preview close to cursor
                previewX = canvasX;
                previewY = canvasY;
            }
            
            const mouseIso = screenToIso(
                previewX, previewY,
                width, height,
                this.camera.getX(), this.camera.getY(),
                zoom
            );
            const isValid = this.gameState.isValidPosition(
                mouseIso.x, mouseIso.y, 
                selectedTool.type, selectedTool.id
            );
            const canAfford = this.gameState.canAfford(selectedTool.type, selectedTool.id);
            const isPlaceable = isValid && canAfford;
            
            // Draw preview with transparency
            this.ctx.globalAlpha = isPlaceable ? 0.6 : 0.3;
            
            const flipped = selectedTool.flipped || false;
            if (selectedTool.type === 'building') {
                this.itemRenderer.drawBuilding(mouseIso.x, mouseIso.y, selectedTool.id, flipped);
            } else if (selectedTool.type === 'decoration') {
                this.itemRenderer.drawDecoration(mouseIso.x, mouseIso.y, selectedTool.id, flipped);
            } else if (selectedTool.type === 'road') {
                this.itemRenderer.drawRoad(mouseIso.x, mouseIso.y, selectedTool.id, flipped);
            }
            
            this.ctx.globalAlpha = 1.0;
            
            // Draw validity indicator
            const screen = isoToScreen(
                mouseIso.x, mouseIso.y,
                width, height,
                this.camera.getX(), this.camera.getY(),
                zoom
            );
            // Green if valid and affordable, yellow if valid but unaffordable, red if invalid
            this.ctx.strokeStyle = isPlaceable ? '#00ff00' : (isValid ? '#ffaa00' : '#ff0000');
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x, screen.y);
            this.ctx.lineTo(screen.x + CONFIG.TILE_WIDTH / 2 * zoom, screen.y + CONFIG.TILE_HEIGHT / 2 * zoom);
            this.ctx.lineTo(screen.x, screen.y + CONFIG.TILE_HEIGHT * zoom);
            this.ctx.lineTo(screen.x - CONFIG.TILE_WIDTH / 2 * zoom, screen.y + CONFIG.TILE_HEIGHT / 2 * zoom);
            this.ctx.closePath();
            this.ctx.stroke();
        }
        
        // Update and draw animations
        this.animationManager.update();
        this.animationManager.draw(
            this.ctx,
            width,
            height,
            this.camera.getX(),
            this.camera.getY(),
            zoom
        );
    }
    
    /**
     * Get the animation manager
     * @returns {AnimationManager} The animation manager
     */
    getAnimationManager() {
        return this.animationManager;
    }

    /**
     * Set the villager manager
     * @param {VillagerManager} villagerManager - The villager manager instance
     */
    setVillagerManager(villagerManager) {
        this.villagerManager = villagerManager;
    }
}

