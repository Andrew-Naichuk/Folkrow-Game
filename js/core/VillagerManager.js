import { CONFIG } from '../config.js';
import { Pathfinder } from '../utils/Pathfinder.js';

/**
 * Manages villager entities that hang around roads
 */
export class VillagerManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.pathfinder = new Pathfinder(gameState);
        this.villagers = [];
        this.spawnInterval = 3000; // Spawn a new villager every 5 seconds
        this.lastSpawnTime = Date.now();
    }

    /**
     * Snap a position to the nearest road tile
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {{isoX: number, isoY: number}|null} Snapped position or null
     */
    snapToRoadTile(isoX, isoY) {
        // Round to nearest integer tile
        const snappedX = Math.round(isoX);
        const snappedY = Math.round(isoY);
        
        if (this.pathfinder.isValidRoadTile(snappedX, snappedY)) {
            return { isoX: snappedX, isoY: snappedY };
        }
        
        return null;
    }

    /**
     * Spawn a new villager on a road tile
     */
    spawnVillager() {
        // At night, use total population; during day, use unemployed population
        const maxVillagers = this.gameState.isDay 
            ? this.gameState.getUnemployedPopulation()
            : this.gameState.getPopulation();
        
        // Don't spawn if population is 0 or we've reached the population limit
        if (maxVillagers === 0 || this.villagers.length >= maxVillagers) {
            return;
        }

        // Spawn only on valid road tiles
        const position = this.pathfinder.getRandomRoadTile();
        if (!position) {
            return;
        }

        // Random villager properties
        const colors = ['#533518', '#C1733C', '#E4AA81', '#E6BEA2']; // skin shades
        const shirtColors = ['#4169e1', '#228b22', '#8b0000', '#ff6347', '#9370db', 'E7D236']; // Various colors
        
        const villager = {
            id: Date.now() + Math.random(), // Unique ID
            isoX: position.isoX,
            isoY: position.isoY,
            targetTileX: position.isoX, // Target tile (discrete)
            targetTileY: position.isoY,
            currentTileX: position.isoX, // Current tile (discrete)
            currentTileY: position.isoY,
            progress: 0, // Progress from current tile to target tile (0-1)
            speed: 0.001 + Math.random() * 0.0005, // Movement speed (progress per ms)
            color: colors[Math.floor(Math.random() * colors.length)],
            shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
            direction: Math.random() * Math.PI * 2, // Random initial direction
            idleTime: 0,
            maxIdleTime: 2000 + Math.random() * 3000, // 2-5 seconds idle
            isMoving: false,
            moveTimer: 0,
            maxMoveTime: 3000 + Math.random() * 2000 // 3-5 seconds moving
        };

        this.villagers.push(villager);
    }

    /**
     * Update all villagers (movement, behavior)
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        // At night, use total population; during day, use unemployed population
        const maxVillagers = this.gameState.isDay 
            ? this.gameState.getUnemployedPopulation()
            : this.gameState.getPopulation();
        
        // Spawn new villagers periodically (only if population > 0)
        const now = Date.now();
        if (maxVillagers > 0 && now - this.lastSpawnTime >= this.spawnInterval && this.villagers.length < maxVillagers) {
            this.spawnVillager();
            this.lastSpawnTime = now;
        }
        
        // Remove excess villagers if population decreased
        if (this.villagers.length > maxVillagers) {
            const excess = this.villagers.length - maxVillagers;
            this.villagers.splice(0, excess);
        }

        // Update each villager
        this.villagers.forEach(villager => {
            // Ensure villager is on a valid road tile
            if (!this.pathfinder.isValidRoadTile(villager.currentTileX, villager.currentTileY)) {
                // Try to snap to nearest road tile
                const snapped = this.snapToRoadTile(villager.currentTileX, villager.currentTileY);
                if (snapped) {
                    villager.currentTileX = snapped.isoX;
                    villager.currentTileY = snapped.isoY;
                    villager.targetTileX = snapped.isoX;
                    villager.targetTileY = snapped.isoY;
                    villager.progress = 0;
                } else {
                    // No valid road tile nearby, mark for removal
                    villager.markedForRemoval = true;
                    return;
                }
            }

            // Update idle/move timer
            if (villager.isMoving) {
                villager.moveTimer += deltaTime;
                if (villager.moveTimer >= villager.maxMoveTime) {
                    // Switch to idle
                    villager.isMoving = false;
                    villager.idleTime = 0;
                    villager.moveTimer = 0;
                }
            } else {
                villager.idleTime += deltaTime;
                if (villager.idleTime >= villager.maxIdleTime) {
                    // Switch to moving
                    villager.isMoving = true;
                    villager.idleTime = 0;
                    villager.moveTimer = 0;
                    
                    // Choose a new target tile - find a random reachable road tile
                    const newTarget = this.pathfinder.findRandomReachableTile(
                        villager.currentTileX, 
                        villager.currentTileY,
                        5 // Max 5 tiles away
                    );
                    
                    if (newTarget) {
                        // Find next step towards target
                        const nextStep = this.pathfinder.findNextStep(
                            villager.currentTileX,
                            villager.currentTileY,
                            newTarget.isoX,
                            newTarget.isoY
                        );
                        
                        if (nextStep) {
                            villager.targetTileX = nextStep.isoX;
                            villager.targetTileY = nextStep.isoY;
                        }
                    } else {
                        // Try to find any adjacent road tile
                        const adjacent = this.pathfinder.getRandomAdjacentRoadTile(
                            villager.currentTileX,
                            villager.currentTileY
                        );
                        if (adjacent) {
                            villager.targetTileX = adjacent.isoX;
                            villager.targetTileY = adjacent.isoY;
                        } else {
                            // No adjacent tiles, stay idle
                            villager.isMoving = false;
                        }
                    }
                }
            }

            // Move towards target tile if moving
            if (villager.isMoving) {
                // Check if we've reached the target tile
                if (villager.currentTileX === villager.targetTileX && 
                    villager.currentTileY === villager.targetTileY) {
                    // Reached target, find next adjacent tile or switch to idle
                    const nextTile = this.pathfinder.getRandomAdjacentRoadTile(
                        villager.currentTileX,
                        villager.currentTileY
                    );
                    
                    if (nextTile) {
                        villager.targetTileX = nextTile.isoX;
                        villager.targetTileY = nextTile.isoY;
                        villager.progress = 0;
                    } else {
                        // No adjacent tiles, switch to idle
                        villager.isMoving = false;
                        villager.idleTime = 0;
                    }
                } else {
                    // Move towards target tile
                    villager.progress += villager.speed * deltaTime;
                    
                    if (villager.progress >= 1.0) {
                        // Reached target tile
                        villager.currentTileX = villager.targetTileX;
                        villager.currentTileY = villager.targetTileY;
                        villager.progress = 0;
                        villager.isoX = villager.currentTileX;
                        villager.isoY = villager.currentTileY;
                    } else {
                        // Interpolate position between current and target tile
                        villager.isoX = villager.currentTileX + 
                            (villager.targetTileX - villager.currentTileX) * villager.progress;
                        villager.isoY = villager.currentTileY + 
                            (villager.targetTileY - villager.currentTileY) * villager.progress;
                        
                        // Update direction towards target
                        const dx = villager.targetTileX - villager.currentTileX;
                        const dy = villager.targetTileY - villager.currentTileY;
                        if (dx !== 0 || dy !== 0) {
                            villager.direction = Math.atan2(dy, dx);
                        }
                    }
                }
            } else {
                // Idle - ensure position matches current tile
                villager.isoX = villager.currentTileX;
                villager.isoY = villager.currentTileY;
            }
        });

        // Remove villagers that are marked for removal or not on valid road tiles
        this.villagers = this.villagers.filter(villager => {
            if (villager.markedForRemoval) {
                return false;
            }
            return this.pathfinder.isValidRoadTile(villager.currentTileX, villager.currentTileY);
        });
    }

    /**
     * Get all villagers
     * @returns {Array} Array of villager objects
     */
    getVillagers() {
        return this.villagers;
    }

    /**
     * Clear all villagers
     */
    clear() {
        this.villagers = [];
    }
}

