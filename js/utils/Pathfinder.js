import { CONFIG } from '../config.js';

/**
 * Pathfinding utility for finding valid road tiles
 */
export class Pathfinder {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Check if a position is a road tile
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {boolean} True if position is a road tile
     */
    isRoadTile(isoX, isoY) {
        const placedItems = this.gameState.getPlacedItems();
        return placedItems.some(item => 
            item.type === 'road' && item.isoX === isoX && item.isoY === isoY
        );
    }

    /**
     * Check if a position is occupied by a building or decoration
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {boolean} True if position is occupied
     */
    isPositionOccupied(isoX, isoY) {
        const placedItems = this.gameState.getPlacedItems();
        return placedItems.some(item => 
            item.isoX === isoX && item.isoY === isoY && item.type !== 'road'
        );
    }

    /**
     * Check if a position is within bounds
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {boolean} True if position is within bounds
     */
    isWithinBounds(isoX, isoY) {
        return isoX >= -CONFIG.GRID_SIZE && isoX <= CONFIG.GRID_SIZE &&
               isoY >= -CONFIG.GRID_SIZE && isoY <= CONFIG.GRID_SIZE;
    }

    /**
     * Check if a position is a valid road tile for villager movement
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {boolean} True if position is a valid road tile
     */
    isValidRoadTile(isoX, isoY) {
        return this.isWithinBounds(isoX, isoY) && 
               this.isRoadTile(isoX, isoY) && 
               !this.isPositionOccupied(isoX, isoY);
    }

    /**
     * Get all adjacent road tiles (4 cardinal directions)
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {Array} Array of {isoX, isoY} positions
     */
    getAdjacentRoadTiles(isoX, isoY) {
        const adjacent = [
            { isoX: isoX + 1, isoY: isoY },     // Right
            { isoX: isoX - 1, isoY: isoY },     // Left
            { isoX: isoX, isoY: isoY + 1 },     // Down
            { isoX: isoX, isoY: isoY - 1 }      // Up
        ];

        return adjacent.filter(pos => this.isValidRoadTile(pos.isoX, pos.isoY));
    }

    /**
     * Get a random adjacent road tile
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @returns {{isoX: number, isoY: number}|null} Random adjacent road tile or null
     */
    getRandomAdjacentRoadTile(isoX, isoY) {
        const adjacent = this.getAdjacentRoadTiles(isoX, isoY);
        if (adjacent.length === 0) {
            return null;
        }
        return adjacent[Math.floor(Math.random() * adjacent.length)];
    }

    /**
     * Get all road tiles
     * @returns {Array} Array of {isoX, isoY} positions
     */
    getAllRoadTiles() {
        const placedItems = this.gameState.getPlacedItems();
        return placedItems
            .filter(item => item.type === 'road')
            .map(item => ({ isoX: item.isoX, isoY: item.isoY }))
            .filter(pos => !this.isPositionOccupied(pos.isoX, pos.isoY));
    }

    /**
     * Get a random road tile
     * @returns {{isoX: number, isoY: number}|null} Random road tile or null
     */
    getRandomRoadTile() {
        const roadTiles = this.getAllRoadTiles();
        if (roadTiles.length === 0) {
            return null;
        }
        return roadTiles[Math.floor(Math.random() * roadTiles.length)];
    }

    /**
     * Find a path from start to target using simple pathfinding
     * Returns the next step towards the target
     * @param {number} startX - Start X coordinate
     * @param {number} startY - Start Y coordinate
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @returns {{isoX: number, isoY: number}|null} Next step or null if no path
     */
    findNextStep(startX, startY, targetX, targetY) {
        // Simple approach: try to move in the direction of the target
        // Check adjacent tiles and pick the one closest to target
        
        const adjacent = this.getAdjacentRoadTiles(startX, startY);
        if (adjacent.length === 0) {
            return null;
        }

        // Find the adjacent tile closest to the target
        let bestTile = null;
        let bestDistance = Infinity;

        adjacent.forEach(tile => {
            const dx = tile.isoX - targetX;
            const dy = tile.isoY - targetY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bestDistance) {
                bestDistance = distance;
                bestTile = tile;
            }
        });

        return bestTile;
    }

    /**
     * Find a random reachable road tile within a certain distance
     * Uses breadth-first search to find reachable tiles
     * @param {number} startX - Start X coordinate
     * @param {number} startY - Start Y coordinate
     * @param {number} maxDistance - Maximum distance to search
     * @returns {{isoX: number, isoY: number}|null} Random reachable road tile or null
     */
    findRandomReachableTile(startX, startY, maxDistance = 10) {
        if (!this.isValidRoadTile(startX, startY)) {
            return null;
        }

        const visited = new Set();
        const queue = [{ isoX: startX, isoY: startY, distance: 0 }];
        const reachable = [];

        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.isoX},${current.isoY}`;

            if (visited.has(key)) {
                continue;
            }
            visited.add(key);

            if (current.distance > 0) {
                reachable.push({ isoX: current.isoX, isoY: current.isoY });
            }

            if (current.distance < maxDistance) {
                const adjacent = this.getAdjacentRoadTiles(current.isoX, current.isoY);
                adjacent.forEach(tile => {
                    const tileKey = `${tile.isoX},${tile.isoY}`;
                    if (!visited.has(tileKey)) {
                        queue.push({ ...tile, distance: current.distance + 1 });
                    }
                });
            }
        }

        if (reachable.length === 0) {
            return null;
        }

        return reachable[Math.floor(Math.random() * reachable.length)];
    }
}

