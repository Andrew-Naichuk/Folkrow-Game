import { CONFIG } from '../config.js';
import { tileToWorld, worldToScreen } from '../utils/coordinateUtils.js';
import { ItemRenderer } from './ItemRenderer.js';

/**
 * Renders the isometric grid
 */
export class GridRenderer {
    constructor(ctx, canvasWidth, canvasHeight, camera) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.camera = camera;
        this.itemRenderer = new ItemRenderer(ctx, canvasWidth, canvasHeight, camera);
    }

    /**
     * Draw the ground grid
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
        this.ctx.lineWidth = 1;
        
        const zoom = this.camera.getZoom();
        for (let x = -CONFIG.GRID_SIZE; x <= CONFIG.GRID_SIZE; x++) {
            for (let y = -CONFIG.GRID_SIZE; y <= CONFIG.GRID_SIZE; y++) {
                const world = tileToWorld(x, y);
                const screen = worldToScreen(
                    world.x, world.y,
                    this.canvasWidth, this.canvasHeight,
                    this.camera.getX(), this.camera.getY(),
                    zoom
                );
                const tileX = screen.x;
                const tileY = screen.y;
                
                // Draw ground tile
                const distance = Math.sqrt(x * x + y * y);
                const brightness = 0.3 + (1 - Math.min(distance / CONFIG.GRID_SIZE, 1)) * 0.2;
                const groundColor = `rgba(34, 139, 34, ${brightness})`;
                
                this.itemRenderer.drawIsometricTile(x, y, groundColor, 0);
            }
        }
    }
}

