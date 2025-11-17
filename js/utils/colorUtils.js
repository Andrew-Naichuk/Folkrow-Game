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

/**
 * Interpolate between two hex colors
 * @param {string} color1 - First hex color string (e.g., '#143f24')
 * @param {string} color2 - Second hex color string (e.g., '#040225')
 * @param {number} factor - Interpolation factor (0 to 1, where 0 = color1, 1 = color2)
 * @returns {string} Interpolated hex color string
 */
export function interpolateColor(color1, color2, factor) {
    // Clamp factor between 0 and 1
    factor = Math.max(0, Math.min(1, factor));
    
    // Remove # if present
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    // Parse RGB components
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    // Interpolate each component
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    // Convert back to hex
    const toHex = (n) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

