import { tileToWorld, worldToScreen } from '../utils/coordinateUtils.js';

/**
 * Manages smoke particle animations for buildings like campfire and blacksmith
 * Creates a subtle, looping animation of semitransparent smoke
 */
export class SmokeAnimation {
    constructor(isoX, isoY) {
        this.isoX = isoX;
        this.isoY = isoY;
        this.particles = [];
        this.particleCount = 8; // Subtle amount of particles
        this.maxParticles = 12; // Maximum particles at once
        this.spawnInterval = 400; // Spawn new particle every 400ms
        this.lastSpawnTime = Date.now();
        this.isActive = true;
        
        // Initialize with some particles
        this.createInitialParticles();
    }
    
    /**
     * Create initial particles for immediate visual effect
     */
    createInitialParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.spawnParticle();
        }
    }
    
    /**
     * Spawn a new smoke particle
     */
    spawnParticle() {
        // Random starting position around the center (slight variation)
        const startOffsetX = (Math.random() - 0.5) * 8;
        const startOffsetY = (Math.random() - 0.5) * 4;
        
        // Random upward angle with slight variation
        const baseAngle = -Math.PI / 2; // Upward
        const angleVariation = (Math.random() - 0.5) * 0.3; // Slight left/right drift
        const angle = baseAngle + angleVariation;
        
        // Random speed (slow and subtle)
        const speed = 0.3 + Math.random() * 0.4;
        
        // Random size (small particles)
        const size = 3 + Math.random() * 4;
        
        // Random lifetime (how long particle exists)
        const lifetime = 2000 + Math.random() * 2000; // 2-4 seconds
        
        // Smoke color - gray with slight brown tint
        const grayValue = 80 + Math.random() * 40; // 80-120 range for subtle gray
        
        this.particles.push({
            x: startOffsetX,
            y: startOffsetY,
            angle: angle,
            speed: speed,
            size: size,
            maxSize: size * 1.5, // Particles grow slightly as they rise
            lifetime: lifetime,
            age: 0,
            colorR: grayValue,
            colorG: grayValue * 0.9, // Slightly darker
            colorB: grayValue * 0.85,
            opacity: 0.3 + Math.random() * 0.2, // Start with low opacity (0.3-0.5)
            maxOpacity: 0.4 + Math.random() * 0.2, // Max opacity (0.4-0.6)
            driftX: (Math.random() - 0.5) * 0.1 // Horizontal drift
        });
    }
    
    /**
     * Update animation state
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        const currentTime = Date.now();
        
        // Spawn new particles periodically
        if (this.particles.length < this.maxParticles && 
            currentTime - this.lastSpawnTime >= this.spawnInterval) {
            this.spawnParticle();
            this.lastSpawnTime = currentTime;
        }
        
        // Update existing particles
        this.particles.forEach(particle => {
            particle.age += deltaTime;
            
            // Update position based on angle and speed
            particle.x += Math.cos(particle.angle) * particle.speed + particle.driftX;
            particle.y += Math.sin(particle.angle) * particle.speed;
            
            // Particles slow down as they rise (simulate air resistance)
            particle.speed *= 0.998;
            
            // Particles grow slightly as they rise
            const growthProgress = Math.min(particle.age / particle.lifetime, 1);
            particle.size = particle.maxSize * (0.7 + 0.3 * growthProgress);
            
            // Fade in then fade out
            const fadeInDuration = particle.lifetime * 0.2; // Fade in for first 20%
            const fadeOutDuration = particle.lifetime * 0.3; // Fade out for last 30%
            
            if (particle.age < fadeInDuration) {
                // Fade in
                const fadeProgress = particle.age / fadeInDuration;
                particle.opacity = particle.maxOpacity * fadeProgress;
            } else if (particle.age > particle.lifetime - fadeOutDuration) {
                // Fade out
                const fadeProgress = (particle.lifetime - particle.age) / fadeOutDuration;
                particle.opacity = particle.maxOpacity * fadeProgress;
            } else {
                // Full opacity
                particle.opacity = particle.maxOpacity;
            }
        });
        
        // Remove particles that have exceeded their lifetime
        this.particles = this.particles.filter(particle => particle.age < particle.lifetime);
    }
    
    /**
     * Draw the smoke animation
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @param {number} cameraX - Camera X offset
     * @param {number} cameraY - Camera Y offset
     * @param {number} zoom - Camera zoom level
     */
    draw(ctx, canvasWidth, canvasHeight, cameraX, cameraY, zoom = 1.0) {
        if (!this.isActive || this.particles.length === 0) return;
        
        const world = tileToWorld(this.isoX, this.isoY);
        const screen = worldToScreen(
            world.x, world.y,
            canvasWidth, canvasHeight,
            cameraX, cameraY,
            zoom
        );
        
        // Base position - slightly above the building center
        const baseX = screen.x;
        const baseY = screen.y - 10 * zoom; // Slightly above center
        
        // Draw particles
        this.particles.forEach(particle => {
            const x = baseX + particle.x * zoom;
            const y = baseY + particle.y * zoom;
            
            // Draw smoke particle as a soft circle with gradient
            const smokeColor = `rgba(${Math.floor(particle.colorR)}, ${Math.floor(particle.colorG)}, ${Math.floor(particle.colorB)}, ${particle.opacity})`;
            
            // Create gradient for softer appearance
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * zoom);
            gradient.addColorStop(0, `rgba(${Math.floor(particle.colorR)}, ${Math.floor(particle.colorG)}, ${Math.floor(particle.colorB)}, ${particle.opacity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(${Math.floor(particle.colorR)}, ${Math.floor(particle.colorG)}, ${Math.floor(particle.colorB)}, ${particle.opacity * 0.4})`);
            gradient.addColorStop(1, `rgba(${Math.floor(particle.colorR)}, ${Math.floor(particle.colorG)}, ${Math.floor(particle.colorB)}, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, particle.size * zoom, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    /**
     * Check if animation is finished (never true for looping smoke)
     * @returns {boolean} Always false for looping animations
     */
    isFinished() {
        return !this.isActive; // Return true only if stopped
    }
    
    /**
     * Stop the smoke animation
     */
    stop() {
        this.isActive = false;
    }
}

