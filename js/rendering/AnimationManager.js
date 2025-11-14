import { DustCloudAnimation } from './DustCloudAnimation.js';
import { SmokeAnimation } from './SmokeAnimation.js';

/**
 * Manages all active animations
 */
export class AnimationManager {
    constructor() {
        this.animations = [];
        this.smokeAnimations = new Map(); // Map of smoke animations keyed by position string "isoX,isoY"
        this.lastUpdateTime = Date.now();
    }
    
    /**
     * Add a new dust cloud animation
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {string} type - Animation type ('add' or 'destroy')
     */
    addDustCloud(isoX, isoY, type = 'destroy') {
        this.animations.push(new DustCloudAnimation(isoX, isoY, type));
    }
    
    /**
     * Add or get a smoke animation for a specific position
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {SmokeAnimation} The smoke animation instance
     */
    addSmoke(isoX, isoY) {
        const key = `${isoX},${isoY}`;
        if (!this.smokeAnimations.has(key)) {
            this.smokeAnimations.set(key, new SmokeAnimation(isoX, isoY));
        }
        return this.smokeAnimations.get(key);
    }
    
    /**
     * Remove smoke animation at a specific position
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     */
    removeSmoke(isoX, isoY) {
        const key = `${isoX},${isoY}`;
        const smoke = this.smokeAnimations.get(key);
        if (smoke) {
            smoke.stop();
            this.smokeAnimations.delete(key);
        }
    }
    
    /**
     * Clean up smoke animations that are no longer needed
     * @param {Set<string>} validPositions - Set of position strings (format: "isoX,isoY") that should have smoke
     */
    cleanupOrphanedSmoke(validPositions) {
        const keysToRemove = [];
        this.smokeAnimations.forEach((smoke, key) => {
            if (!validPositions.has(key)) {
                keysToRemove.push(key);
            }
        });
        
        keysToRemove.forEach(key => {
            const smoke = this.smokeAnimations.get(key);
            if (smoke) {
                smoke.stop();
            }
            this.smokeAnimations.delete(key);
        });
    }
    
    /**
     * Update all animations
     */
    update() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        // Update all temporary animations
        this.animations.forEach(animation => {
            animation.update(deltaTime);
        });
        
        // Remove completed animations
        this.animations = this.animations.filter(animation => !animation.isFinished());
        
        // Update all smoke animations (persistent/looping)
        this.smokeAnimations.forEach(smoke => {
            smoke.update(deltaTime);
        });
    }
    
    /**
     * Draw all animations
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @param {number} cameraX - Camera X offset
     * @param {number} cameraY - Camera Y offset
     * @param {number} zoom - Camera zoom level
     */
    draw(ctx, canvasWidth, canvasHeight, cameraX, cameraY, zoom = 1.0) {
        // Draw temporary animations first (dust clouds, etc.)
        this.animations.forEach(animation => {
            animation.draw(ctx, canvasWidth, canvasHeight, cameraX, cameraY, zoom);
        });
        
        // Draw smoke animations on top
        this.smokeAnimations.forEach(smoke => {
            smoke.draw(ctx, canvasWidth, canvasHeight, cameraX, cameraY, zoom);
        });
    }
    
    /**
     * Clear all animations
     */
    clear() {
        this.animations = [];
        // Stop all smoke animations
        this.smokeAnimations.forEach(smoke => {
            smoke.stop();
        });
        this.smokeAnimations.clear();
    }
}

