import { CONFIG } from '../config.js';

/**
 * Convert screen coordinates to isometric coordinates
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {number} zoom - Camera zoom level (default: 1.0)
 * @returns {{x: number, y: number}} Isometric coordinates
 */
export function screenToIso(screenX, screenY, canvasWidth, canvasHeight, cameraX, cameraY, zoom = 1.0) {
    const x = (screenX - canvasWidth / 2 - cameraX) / zoom;
    const y = (screenY - canvasHeight / 2 - cameraY) / zoom;
    const isoX = (x / CONFIG.TILE_WIDTH + y / CONFIG.TILE_HEIGHT) / 2;
    const isoY = (y / CONFIG.TILE_HEIGHT - x / CONFIG.TILE_WIDTH) / 2;
    return { x: Math.floor(isoX), y: Math.floor(isoY) };
}

/**
 * Convert isometric coordinates to screen coordinates
 * @param {number} isoX - Isometric X coordinate
 * @param {number} isoY - Isometric Y coordinate
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @param {number} zoom - Camera zoom level (default: 1.0)
 * @returns {{x: number, y: number}} Screen coordinates
 */
export function isoToScreen(isoX, isoY, canvasWidth, canvasHeight, cameraX, cameraY, zoom = 1.0) {
    const screenX = ((isoX - isoY) * CONFIG.TILE_WIDTH / 2) * zoom + canvasWidth / 2 + cameraX;
    const screenY = ((isoX + isoY) * CONFIG.TILE_HEIGHT / 2) * zoom + canvasHeight / 2 + cameraY;
    return { x: screenX, y: screenY };
}

