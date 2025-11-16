import { CONFIG } from '../config.js';
import { tileToWorld, worldToScreen } from '../utils/coordinateUtils.js';

/**
 * Renders villagers on the canvas
 */
export class VillagerRenderer {
    constructor(ctx, canvasWidth, canvasHeight, camera) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.camera = camera;
    }

    /**
     * Draw a single villager
     * @param {Object} villager - Villager object with position and properties
     */
    drawVillager(villager) {
        const zoom = this.camera.getZoom();
        const world = tileToWorld(villager.isoX, villager.isoY);
        const screen = worldToScreen(
            world.x, world.y,
            this.canvasWidth, this.canvasHeight,
            this.camera.getX(), this.camera.getY(),
            zoom
        );
        const x = screen.x;
        const y = screen.y;
        const tileH = CONFIG.TILE_HEIGHT * zoom;

        // Base position on the tile (bottom of tile)
        const baseY = y + tileH;

        this.ctx.save();

        // Draw villager (simple procedural rendering)
        // Body (shirt)
        const bodyHeight = 12 * zoom;
        const bodyWidth = 8 * zoom;
        this.ctx.fillStyle = villager.shirtColor;
        this.ctx.fillRect(
            x - bodyWidth / 2,
            baseY - bodyHeight - 4 * zoom,
            bodyWidth,
            bodyHeight
        );

        // Head
        const headRadius = 4 * zoom;
        this.ctx.fillStyle = villager.color; // Skin color
        this.ctx.beginPath();
        this.ctx.arc(
            x,
            baseY - bodyHeight - 4 * zoom - headRadius,
            headRadius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Legs
        const legWidth = 2 * zoom;
        const legHeight = 8 * zoom;
        this.ctx.fillStyle = '#2f2f2f'; // Dark pants
        this.ctx.fillRect(
            x - bodyWidth / 2 + 1 * zoom,
            baseY - 4 * zoom - legHeight,
            legWidth,
            legHeight
        );
        this.ctx.fillRect(
            x + bodyWidth / 2 - legWidth - 1 * zoom,
            baseY - 4 * zoom - legHeight,
            legWidth,
            legHeight
        );

        // Simple direction indicator (optional - can be removed)
        // Draw a small dot showing facing direction
        if (villager.isMoving) {
            const dirX = Math.cos(villager.direction) * 6 * zoom;
            const dirY = Math.sin(villager.direction) * 6 * zoom;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(
                x + dirX,
                baseY - bodyHeight / 2 + dirY,
                2 * zoom,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    /**
     * Draw all villagers
     * @param {Array} villagers - Array of villager objects
     */
    drawVillagers(villagers) {
        // Sort villagers by depth (same as items)
        const sortedVillagers = [...villagers].sort((a, b) => {
            const depthA = a.isoX + a.isoY;
            const depthB = b.isoX + b.isoY;
            if (depthA !== depthB) {
                return depthA - depthB;
            }
            return a.isoY - b.isoY;
        });

        sortedVillagers.forEach(villager => {
            this.drawVillager(villager);
        });
    }
}

