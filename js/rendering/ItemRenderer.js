import { CONFIG } from '../config.js';
import { tileToWorld, worldToScreen } from '../utils/coordinateUtils.js';
import { adjustBrightness } from '../utils/colorUtils.js';
import { BUILDING_DATA, DECORATION_DATA, ROAD_DATA } from '../data/itemData.js';

/**
 * Renders individual items (buildings, decorations, roads)
 */
export class ItemRenderer {
    constructor(ctx, canvasWidth, canvasHeight, camera, spriteManager = null) {
        this.ctx = ctx;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.camera = camera;
        this.spriteManager = spriteManager;
    }

    /**
     * Draw a sprite image at isometric coordinates
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {string} spritePath - Path to the sprite file
     * @param {number} offsetY - Vertical offset for the sprite
     * @param {number} heightScale - Height scale factor (1.0 = default, higher = taller)
     * @param {boolean} flipped - Whether to horizontally flip the sprite
     * @returns {boolean} True if sprite was drawn, false if sprite not available
     */
    drawSprite(isoX, isoY, spritePath, offsetY = 0, heightScale = 1.0, flipped = false) {
        if (!this.spriteManager || !spritePath) {
            return false;
        }

        const sprite = this.spriteManager.getSprite(spritePath);
        if (!sprite) {
            return false;
        }

        const zoom = this.camera.getZoom();
        const world = tileToWorld(isoX, isoY);
        const screen = worldToScreen(
            world.x, world.y,
            this.canvasWidth, this.canvasHeight,
            this.camera.getX(), this.camera.getY(),
            zoom
        );
        const x = screen.x;
        const y = screen.y; // Top point of the isometric diamond

        // Calculate sprite dimensions based on tile size
        const tileW = CONFIG.TILE_WIDTH * zoom;
        const tileH = CONFIG.TILE_HEIGHT * zoom;
        
        // Base sprite dimensions - scaled by heightScale to match building height
        const baseSpriteHeight = tileH * 2; // Default height for standard buildings
        const spriteWidth = tileW;
        const spriteHeight = baseSpriteHeight * heightScale;
        
        // Position sprite so its bottom aligns with the bottom of the tile
        // Bottom of tile is at: y + tileH
        // Top of sprite should be at: (y + tileH) - spriteHeight + offsetY
        const spriteY = y + tileH - spriteHeight + (offsetY * zoom);
        
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Apply horizontal flip if needed
        if (flipped) {
            this.ctx.translate(x, spriteY);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(
                sprite,
                -spriteWidth / 2,
                0,
                spriteWidth,
                spriteHeight
            );
        } else {
            this.ctx.drawImage(
                sprite,
                x - spriteWidth / 2,
                spriteY,
                spriteWidth,
                spriteHeight
            );
        }
        
        this.ctx.restore();
        
        return true;
    }

    /**
     * Draw an isometric tile
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {string} color - Tile color
     * @param {number} height - Height offset
     */
    drawIsometricTile(isoX, isoY, color, height = 0) {
        const zoom = this.camera.getZoom();
        const world = tileToWorld(isoX, isoY);
        const screen = worldToScreen(
            world.x, world.y, 
            this.canvasWidth, this.canvasHeight,
            this.camera.getX(), this.camera.getY(),
            zoom
        );
        const x = screen.x;
        const y = screen.y - height * zoom;
        
        const tileW = CONFIG.TILE_WIDTH * zoom;
        const tileH = CONFIG.TILE_HEIGHT * zoom;
        
        // Draw isometric tile (diamond shape)
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + tileW / 2, y + tileH / 2);
        this.ctx.lineTo(x, y + tileH);
        this.ctx.lineTo(x - tileW / 2, y + tileH / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    /**
     * Draw a building
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {string} id - Building ID
     * @param {boolean} flipped - Whether to horizontally flip the sprite
     */
    drawBuilding(isoX, isoY, id, flipped = false) {
        const data = BUILDING_DATA[id] || BUILDING_DATA.house1;
        
        // Calculate height scale based on building height
        // Use house1 (height 20) as the reference base height
        const baseHeight = 20;
        const heightScale = data.height ? data.height / baseHeight : 1.0;
        
        // Try to draw sprite first, fallback to procedural rendering
        // Get offsetY from item data (default: 0)
        const offsetY = data.offsetY !== undefined ? data.offsetY : 0;
        // Pass heightScale to scale sprite based on building height
        if (data.sprite && this.drawSprite(isoX, isoY, data.sprite, offsetY, heightScale, flipped)) {
            return;
        }
        
        const zoom = this.camera.getZoom();
        const world = tileToWorld(isoX, isoY);
        const screen = worldToScreen(
            world.x, world.y,
            this.canvasWidth, this.canvasHeight,
            this.camera.getX(), this.camera.getY(),
            zoom
        );
        const x = screen.x;
        const y = screen.y;
        
        // Draw building base
        this.drawIsometricTile(isoX, isoY, data.color, 0);
        
        // Draw building walls (isometric cube)
        const wallHeight = data.height * zoom;
        const tileW = CONFIG.TILE_WIDTH * zoom / 2;
        const tileH = CONFIG.TILE_HEIGHT * zoom / 2;
        
        const tileHeight = CONFIG.TILE_HEIGHT * zoom;
    }

    /**
     * Draw a decoration
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {string} id - Decoration ID
     * @param {boolean} flipped - Whether to horizontally flip the sprite
     */
    drawDecoration(isoX, isoY, id, flipped = false) {
        const data = DECORATION_DATA[id] || DECORATION_DATA.tree;
        
        // Try to draw sprite first, fallback to procedural rendering
        // Get offsetY from item data (default: 0)
        const offsetY = data.offsetY !== undefined ? data.offsetY : 0;
        if (data.sprite && this.drawSprite(isoX, isoY, data.sprite, offsetY, 1.0, flipped)) {
            return;
        }
        
        const zoom = this.camera.getZoom();
        const world = tileToWorld(isoX, isoY);
        const screen = worldToScreen(
            world.x, world.y,
            this.canvasWidth, this.canvasHeight,
            this.camera.getX(), this.camera.getY(),
            zoom
        );
        const x = screen.x;
        const y = screen.y;
        
        const tileHeight = CONFIG.TILE_HEIGHT * zoom;
        
        if (id === 'tree') {
            // Trunk
            this.ctx.fillStyle = data.trunkColor;
            this.ctx.fillRect(x - 2 * zoom, y + tileHeight - 8 * zoom, 4 * zoom, 8 * zoom);
            
            // Leaves (top)
            this.ctx.fillStyle = data.topColor;
            this.ctx.beginPath();
            this.ctx.arc(x, y + tileHeight / 2, data.size * zoom, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Leaves (bottom)
            this.ctx.beginPath();
            this.ctx.arc(x, y + tileHeight / 2 + 4 * zoom, (data.size - 2) * zoom, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (id === 'rock') {
            this.ctx.fillStyle = data.color;
            this.ctx.beginPath();
            this.ctx.ellipse(x, y + tileHeight / 2, data.size * zoom, data.size * 0.7 * zoom, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = adjustBrightness(data.color, 0.2);
            this.ctx.beginPath();
            this.ctx.ellipse(x - 2 * zoom, y + tileHeight / 2 - 2 * zoom, data.size * 0.6 * zoom, data.size * 0.4 * zoom, 0, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (id === 'bush') {
            this.ctx.fillStyle = data.color;
            this.ctx.beginPath();
            this.ctx.arc(x - 4 * zoom, y + tileHeight / 2, data.size * zoom, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = data.topColor;
            this.ctx.beginPath();
            this.ctx.arc(x + 4 * zoom, y + tileHeight / 2, data.size * zoom, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(x, y + tileHeight / 2 + 2 * zoom, (data.size - 2) * zoom, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (id === 'lamp') {
            // Post
            this.ctx.fillStyle = data.color;
            this.ctx.fillRect(x - 2 * zoom, y + tileHeight / 2, 4 * zoom, 12 * zoom);
            
            // Light
            this.ctx.fillStyle = data.lightColor;
            this.ctx.beginPath();
            this.ctx.arc(x, y + tileHeight / 2, data.size * zoom, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Glow effect
            this.ctx.shadowBlur = 10 * zoom;
            this.ctx.shadowColor = data.lightColor;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    /**
     * Draw a road
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {string} id - Road ID
     * @param {boolean} flipped - Whether to horizontally flip the sprite
     */
    drawRoad(isoX, isoY, id, flipped = false) {
        const data = ROAD_DATA[id] || ROAD_DATA.basic;
        
        // Calculate height scale based on road height
        // Use house1 (height 20) as the reference base height
        const baseHeight = 20;
        const heightScale = data.height ? data.height / baseHeight : 1.0;
        
        // Try to draw sprite first, fallback to procedural rendering
        // Get offsetY from item data (default: 0)
        const offsetY = data.offsetY !== undefined ? data.offsetY : 0;
        // Pass heightScale to scale sprite based on road height
        if (data.sprite && this.drawSprite(isoX, isoY, data.sprite, offsetY, heightScale, flipped)) {
            return;
        }
        
        // Fallback to procedural rendering with reduced opacity
        this.ctx.save();
        this.ctx.globalAlpha = 1;
        
        const zoom = this.camera.getZoom();
        const world = tileToWorld(isoX, isoY);
        const screen = worldToScreen(
            world.x, world.y,
            this.canvasWidth, this.canvasHeight,
            this.camera.getX(), this.camera.getY(),
            zoom
        );
        const x = screen.x;
        const y = screen.y;
        
        // Draw road base (isometric tile) - solid color only
        this.drawIsometricTile(isoX, isoY, data.color, -1);
        
        // Restore opacity
        this.ctx.restore();
    }
}

