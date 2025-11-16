import { CONFIG } from '../config.js';

/**
 * Convert tile (grid) coordinates to world (iso) coordinates
 * @param {number} tx - Tile X coordinate
 * @param {number} ty - Tile Y coordinate
 * @returns {{x: number, y: number}} World coordinates in iso space
 */
export function tileToWorld(tx, ty) {
    const x = (tx - ty) * (CONFIG.TILE_WIDTH / 2);
    const y = (tx + ty) * (CONFIG.TILE_HEIGHT / 2);
    return { x, y };
}

/**
 * Convert world (iso) coordinates to screen coordinates
 * @param {number} wx - World X coordinate
 * @param {number} wy - World Y coordinate
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} cameraX - Camera X position in world space
 * @param {number} cameraY - Camera Y position in world space
 * @param {number} zoom - Camera zoom level
 * @returns {{x: number, y: number}} Screen coordinates
 */
export function worldToScreen(wx, wy, canvasWidth, canvasHeight, cameraX, cameraY, zoom) {
    const sx = (wx - cameraX) * zoom + canvasWidth / 2;
    const sy = (wy - cameraY) * zoom + canvasHeight / 2;
    return { x: sx, y: sy };
}

/**
 * Convert screen coordinates to world (iso) coordinates
 * @param {number} sx - Screen X coordinate
 * @param {number} sy - Screen Y coordinate
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} cameraX - Camera X position in world space
 * @param {number} cameraY - Camera Y position in world space
 * @param {number} zoom - Camera zoom level
 * @returns {{x: number, y: number}} World coordinates in iso space
 */
export function screenToWorld(sx, sy, canvasWidth, canvasHeight, cameraX, cameraY, zoom) {
    const wx = (sx - canvasWidth / 2) / zoom + cameraX;
    const wy = (sy - canvasHeight / 2) / zoom + cameraY;
    return { x: wx, y: wy };
}

/**
 * Convert screen coordinates to tile (grid) coordinates
 * @param {number} sx - Screen X coordinate
 * @param {number} sy - Screen Y coordinate
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} cameraX - Camera X position in world space
 * @param {number} cameraY - Camera Y position in world space
 * @param {number} zoom - Camera zoom level
 * @returns {{x: number, y: number}} Tile coordinates
 */
export function screenToTile(sx, sy, canvasWidth, canvasHeight, cameraX, cameraY, zoom) {
    const world = screenToWorld(sx, sy, canvasWidth, canvasHeight, cameraX, cameraY, zoom);
    const wx = world.x;
    const wy = world.y;

    const tw = CONFIG.TILE_WIDTH / 2;
    const th = CONFIG.TILE_HEIGHT / 2;

    const tx = Math.floor((wy / th + wx / tw) / 2);
    const ty = Math.floor((wy / th - wx / tw) / 2);
    return { x: tx, y: ty };
}

