/**
 * Manages loading and caching of sprite images
 */
export class SpriteManager {
    constructor() {
        this.sprites = new Map(); // Cache of loaded sprites
        this.loadingPromises = new Map(); // Track loading promises to avoid duplicate loads
    }

    /**
     * Load a sprite image
     * @param {string} path - Path to the sprite file (PNG or WebP)
     * @returns {Promise<HTMLImageElement>} Promise that resolves to the loaded image
     */
    async loadSprite(path) {
        // Return cached sprite if already loaded
        if (this.sprites.has(path)) {
            return this.sprites.get(path);
        }

        // Return existing loading promise if already loading
        if (this.loadingPromises.has(path)) {
            return this.loadingPromises.get(path);
        }

        // Create new loading promise
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites.set(path, img);
                this.loadingPromises.delete(path);
                resolve(img);
            };
            img.onerror = () => {
                this.loadingPromises.delete(path);
                reject(new Error(`Failed to load sprite: ${path}`));
            };
            img.src = path;
        });

        this.loadingPromises.set(path, promise);
        return promise;
    }

    /**
     * Get a sprite if it's already loaded
     * @param {string} path - Path to the sprite file
     * @returns {HTMLImageElement|null} The sprite image or null if not loaded
     */
    getSprite(path) {
        return this.sprites.get(path) || null;
    }

    /**
     * Check if a sprite is loaded
     * @param {string} path - Path to the sprite file
     * @returns {boolean} True if the sprite is loaded
     */
    isLoaded(path) {
        return this.sprites.has(path);
    }

    /**
     * Preload multiple sprites
     * @param {string[]} paths - Array of sprite paths to preload
     * @returns {Promise<void>} Promise that resolves when all sprites are loaded
     */
    async preloadSprites(paths) {
        const promises = paths
            .filter(path => path) // Filter out null/undefined paths
            .map(path => this.loadSprite(path).catch(err => {
                console.warn(`Failed to preload sprite: ${path}`, err);
                return null; // Continue loading other sprites even if one fails
            }));
        
        await Promise.all(promises);
    }

    /**
     * Clear all cached sprites
     */
    clearCache() {
        this.sprites.clear();
        this.loadingPromises.clear();
    }
}

