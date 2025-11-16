import { tileToWorld, worldToScreen } from '../utils/coordinateUtils.js';

/**
 * Manages dust cloud particle animations
 */
export class DustCloudAnimation {
    constructor(isoX, isoY, type = 'destroy') {
        this.isoX = isoX;
        this.isoY = isoY;
        this.type = type; // 'add' or 'destroy'
        this.particles = [];
        this.duration = 800; // Animation duration in milliseconds
        this.startTime = Date.now();
        this.isComplete = false;
        
        // Create particles
        this.createParticles();
    }
    
    /**
     * Create particle system for dust cloud
     */
    createParticles() {
        const particleCount = this.type === 'destroy' ? 25 : 20;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 0.5 + Math.random() * 1.5;
            const size = 2 + Math.random() * 4;
            
            // Generate dust color based on type
            const baseR = this.type === 'destroy' 
                ? 120 + Math.random() * 30 
                : 180 + Math.random() * 40;
            const baseG = this.type === 'destroy' 
                ? 100 + Math.random() * 20 
                : 160 + Math.random() * 40;
            const baseB = this.type === 'destroy' 
                ? 80 + Math.random() * 20 
                : 140 + Math.random() * 40;
            
            this.particles.push({
                angle: angle,
                speed: speed,
                size: size,
                distance: 0,
                maxDistance: 15 + Math.random() * 25,
                opacity: 0.9,
                colorR: baseR,
                colorG: baseG,
                colorB: baseB
            });
        }
    }
    
    /**
     * Update animation state
     * @param {number} deltaTime - Time elapsed since last update (not used, kept for compatibility)
     */
    update(deltaTime) {
        if (this.isComplete) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        // Update particles based on elapsed time (frame-rate independent)
        this.particles.forEach(particle => {
            // Calculate distance based on progress and particle speed
            // Particles move outward over the entire animation
            particle.distance = particle.maxDistance * progress * (particle.speed / 2);
        });
        
        // Check if animation is complete
        if (progress >= 1) {
            this.isComplete = true;
        }
    }
    
    /**
     * Draw the dust cloud animation
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @param {number} cameraX - Camera X offset
     * @param {number} cameraY - Camera Y offset
     * @param {number} zoom - Camera zoom level
     */
    draw(ctx, canvasWidth, canvasHeight, cameraX, cameraY, zoom = 1.0) {
        if (this.isComplete) return;
        
        const world = tileToWorld(this.isoX, this.isoY);
        const screen = worldToScreen(
            world.x, world.y,
            canvasWidth, canvasHeight,
            cameraX, cameraY,
            zoom
        );
        
        const centerX = screen.x;
        const centerY = screen.y + 16 * zoom; // Slightly below center for ground effect
        
        // Draw particles
        this.particles.forEach(particle => {
            if (particle.distance > particle.maxDistance) return;
            
            const x = centerX + Math.cos(particle.angle) * particle.distance * zoom;
            const y = centerY + Math.sin(particle.angle) * particle.distance * 0.6 * zoom; // Flatten for isometric view
            
            // Draw simple particle as a circle
            const dustColor = `rgba(${particle.colorR}, ${particle.colorG}, ${particle.colorB}, ${particle.opacity})`;
            
            ctx.fillStyle = dustColor;
            ctx.beginPath();
            ctx.arc(x, y, particle.size * zoom, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    /**
     * Check if animation is complete
     * @returns {boolean} True if animation is complete
     */
    isFinished() {
        return this.isComplete;
    }
}

