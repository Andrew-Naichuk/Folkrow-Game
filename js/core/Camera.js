import { CONFIG } from '../config.js';
import { screenToWorld } from '../utils/coordinateUtils.js';

/**
 * Manages camera position and movement
 * Camera position is in world coordinates (iso space)
 */
export class Camera {
    constructor() {
        // Camera position in world coordinates (iso space)
        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 2.5;
        this.panSpeed = 500; // pixels per second (for keyboard)
    }

    /**
     * Move camera by delta in world space
     * @param {number} deltaX - Delta X in world space
     * @param {number} deltaY - Delta Y in world space
     */
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
     * Zoom towards a specific point on screen (zooms around cursor)
     * @param {number} deltaY - Mouse wheel deltaY
     * @param {number} mouseX - Mouse X position on canvas
     * @param {number} mouseY - Mouse Y position on canvas
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    zoomAtPoint(deltaY, mouseX, mouseY, canvasWidth, canvasHeight) {
        const preZoomWorld = screenToWorld(mouseX, mouseY, canvasWidth, canvasHeight, this.x, this.y, this.zoom);

        const zoomFactor = deltaY < 0 ? 1.1 : 0.9;
        this.zoom *= zoomFactor;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));

        const postZoomWorld = screenToWorld(mouseX, mouseY, canvasWidth, canvasHeight, this.x, this.y, this.zoom);

        this.x += preZoomWorld.x - postZoomWorld.x;
        this.y += preZoomWorld.y - postZoomWorld.y;
    }

    /**
     * Update camera based on keyboard input
     * @param {Object} keys - Object with key states
     * @param {number} dt - Delta time in seconds
     */
    update(keys, dt) {
        const speed = this.panSpeed / this.zoom; // adjust for zoom level
        if (keys['ArrowUp'] || keys['w'] || keys['W']) this.y -= speed * dt;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) this.y += speed * dt;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) this.x -= speed * dt;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) this.x += speed * dt;
    }
}

