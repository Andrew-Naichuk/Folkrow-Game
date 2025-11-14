/**
 * Manages canvas setup and resizing
 */
export class CanvasManager {
    constructor(canvasId, camera = null) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.camera = camera;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setCamera(camera) {
        this.camera = camera;
    }

    resizeCanvas() {
        const oldWidth = this.canvas.width || 0;
        const oldHeight = this.canvas.height || 0;
        
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        
        // Adjust camera position to maintain the same world position at center
        // When canvas resizes, the center moves. To keep the same world position at center,
        // we need to adjust camera by the negative of the center movement.
        // Formula: cameraX' = cameraX + (oldWidth - newWidth) / 2
        // This ensures: oldWidth/2 + cameraX = newWidth/2 + cameraX'
        if (this.camera && oldWidth > 0 && oldHeight > 0) {
            const centerDeltaX = (oldWidth - this.canvas.width) / 2;
            const centerDeltaY = (oldHeight - this.canvas.height) / 2;
            this.camera.move(centerDeltaX, centerDeltaY);
        }
    }

    getContext() {
        return this.ctx;
    }

    getCanvas() {
        return this.canvas;
    }

    getWidth() {
        return this.canvas.width;
    }

    getHeight() {
        return this.canvas.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

