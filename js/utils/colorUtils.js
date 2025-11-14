/**
 * Adjust the brightness of a hex color
 * @param {string} color - Hex color string (e.g., '#ff0000')
 * @param {number} amount - Brightness adjustment (-1 to 1)
 * @returns {string} RGB color string
 */
export function adjustBrightness(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount * 255));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount * 255));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount * 255));
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}

