import { CONFIG } from '../config.js';

/**
 * Manages camera position and movement
 */
export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        this.zoomSpeed = 0.1;
        this.zoomSmoothness = 0.15; // Lower = smoother, higher = faster
    }

    move(deltaX, deltaY) {
        this.x += deltaX;
        this.y += deltaY;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getZoom() {
        return this.zoom;
    }

    /**
     * Set target zoom level (will smoothly interpolate to it)
     * @param {number} zoom - Target zoom level
     */
    setTargetZoom(zoom) {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }

    /**
     * Zoom towards a specific point on screen
     * @param {number} deltaZoom - Change in zoom (positive = zoom in, negative = zoom out)
     * @param {number} mouseX - Mouse X position on canvas
     * @param {number} mouseY - Mouse Y position on canvas
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    zoomAtPoint(deltaZoom, mouseX, mouseY, canvasWidth, canvasHeight) {
        const currentZoom = this.zoom;
        const newTargetZoom = Math.max(
            this.minZoom, 
            Math.min(this.maxZoom, this.targetZoom + deltaZoom)
        );
        
        // Calculate world position of mouse before zoom (using current zoom)
        const worldX = (mouseX - canvasWidth / 2 - this.x) / currentZoom;
        const worldY = (mouseY - canvasHeight / 2 - this.y) / currentZoom;
        
        // Set new target zoom
        this.targetZoom = newTargetZoom;
        
        // Adjust camera position so the point under mouse stays fixed
        this.x = mouseX - canvasWidth / 2 - worldX * newTargetZoom;
        this.y = mouseY - canvasHeight / 2 - worldY * newTargetZoom;
    }

    /**
     * Update camera (smooth zoom interpolation)
     */
    updateZoom() {
        // Smoothly interpolate zoom towards target
        const zoomDiff = this.targetZoom - this.zoom;
        if (Math.abs(zoomDiff) > 0.001) {
            this.zoom += zoomDiff * this.zoomSmoothness;
        } else {
            this.zoom = this.targetZoom;
        }
    }

    update(keys) {
        const speed = CONFIG.CAMERA_SPEED;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) this.x -= speed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) this.x += speed;
        if (keys['ArrowUp'] || keys['w'] || keys['W']) this.y -= speed;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) this.y += speed;
        
        // Update zoom interpolation
        this.updateZoom();
    }
}

