// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cursorInfo = document.getElementById('cursor-info');

// Set canvas size
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Isometric grid settings
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const GRID_SIZE = 50; // 50x50 grid

// Camera offset for centering
let cameraX = 0;
let cameraY = 0;

// Game state
const placedItems = [];
let selectedTool = null;
let selectedType = null;
let selectedId = null;

// Isometric coordinate conversion
function screenToIso(screenX, screenY) {
    const x = screenX - canvas.width / 2 - cameraX;
    const y = screenY - canvas.height / 2 - cameraY;
    const isoX = (x / TILE_WIDTH + y / TILE_HEIGHT) / 2;
    const isoY = (y / TILE_HEIGHT - x / TILE_WIDTH) / 2;
    return { x: Math.floor(isoX), y: Math.floor(isoY) };
}

function isoToScreen(isoX, isoY) {
    const screenX = (isoX - isoY) * TILE_WIDTH / 2 + canvas.width / 2 + cameraX;
    const screenY = (isoX + isoY) * TILE_HEIGHT / 2 + canvas.height / 2 + cameraY;
    return { x: screenX, y: screenY };
}

// Check if position is valid for placement
function isValidPosition(isoX, isoY, type, id) {
    // Check bounds
    if (isoX < -GRID_SIZE || isoX > GRID_SIZE || isoY < -GRID_SIZE || isoY > GRID_SIZE) {
        return false;
    }
    
    // Check if position is already occupied
    return !placedItems.some(item => item.isoX === isoX && item.isoY === isoY);
}

// Pixel art drawing functions
function drawPixelArtTile(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

function drawIsometricTile(isoX, isoY, color, height = 0) {
    const screen = isoToScreen(isoX, isoY);
    const x = screen.x;
    const y = screen.y - height;
    
    // Draw isometric tile (diamond shape)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawBuilding(isoX, isoY, id) {
    const screen = isoToScreen(isoX, isoY);
    const x = screen.x;
    const y = screen.y;
    
    const buildingData = {
        house1: { color: '#8b4513', roofColor: '#8b0000', height: 20, width: 1 },
        house2: { color: '#4682b4', roofColor: '#2f4f4f', height: 25, width: 1 },
        tower: { color: '#696969', roofColor: '#ffd700', height: 40, width: 1 },
        shop: { color: '#daa520', roofColor: '#b8860b', height: 22, width: 1 }
    };
    
    const data = buildingData[id] || buildingData.house1;
    
    // Draw building base
    drawIsometricTile(isoX, isoY, data.color, 0);
    
    // Draw building walls (isometric cube)
    const wallHeight = data.height;
    const tileW = TILE_WIDTH / 2;
    const tileH = TILE_HEIGHT / 2;
    
    // Left wall
    ctx.fillStyle = adjustBrightness(data.color, -0.2);
    ctx.beginPath();
    ctx.moveTo(x - tileW, y + tileH);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x, y + TILE_HEIGHT - wallHeight);
    ctx.lineTo(x - tileW, y + tileH - wallHeight);
    ctx.closePath();
    ctx.fill();
    
    // Right wall
    ctx.fillStyle = adjustBrightness(data.color, -0.1);
    ctx.beginPath();
    ctx.moveTo(x + tileW, y + tileH);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x, y + TILE_HEIGHT - wallHeight);
    ctx.lineTo(x + tileW, y + tileH - wallHeight);
    ctx.closePath();
    ctx.fill();
    
    // Roof
    ctx.fillStyle = data.roofColor;
    ctx.beginPath();
    ctx.moveTo(x, y - wallHeight);
    ctx.lineTo(x + tileW, y + tileH - wallHeight);
    ctx.lineTo(x, y + TILE_HEIGHT - wallHeight);
    ctx.lineTo(x - tileW, y + tileH - wallHeight);
    ctx.closePath();
    ctx.fill();
    
    // Roof highlight
    ctx.fillStyle = adjustBrightness(data.roofColor, 0.2);
    ctx.beginPath();
    ctx.moveTo(x, y - wallHeight);
    ctx.lineTo(x + tileW, y + tileH - wallHeight);
    ctx.lineTo(x, y + TILE_HEIGHT - wallHeight);
    ctx.closePath();
    ctx.fill();
    
    // Tower special: add golden top
    if (id === 'tower') {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y - wallHeight - 5, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Shop special: add window
    if (id === 'shop') {
        ctx.fillStyle = '#ff6347';
        ctx.fillRect(x - 8, y + tileH - 5, 16, 12);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x - 8, y + tileH - 5, 16, 12);
    }
}

function drawDecoration(isoX, isoY, id) {
    const screen = isoToScreen(isoX, isoY);
    const x = screen.x;
    const y = screen.y;
    
    const decorationData = {
        tree: { color: '#228b22', topColor: '#32cd32', trunkColor: '#8b4513', size: 12 },
        rock: { color: '#708090', size: 8 },
        bush: { color: '#2d5016', topColor: '#3d6b1f', size: 10 },
        lamp: { color: '#2f2f2f', lightColor: '#ffd700', size: 6 }
    };
    
    const data = decorationData[id] || decorationData.tree;
    
    if (id === 'tree') {
        // Trunk
        ctx.fillStyle = data.trunkColor;
        ctx.fillRect(x - 2, y + TILE_HEIGHT - 8, 4, 8);
        
        // Leaves (top)
        ctx.fillStyle = data.topColor;
        ctx.beginPath();
        ctx.arc(x, y + TILE_HEIGHT / 2, data.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Leaves (bottom)
        ctx.beginPath();
        ctx.arc(x, y + TILE_HEIGHT / 2 + 4, data.size - 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (id === 'rock') {
        ctx.fillStyle = data.color;
        ctx.beginPath();
        ctx.ellipse(x, y + TILE_HEIGHT / 2, data.size, data.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = adjustBrightness(data.color, 0.2);
        ctx.beginPath();
        ctx.ellipse(x - 2, y + TILE_HEIGHT / 2 - 2, data.size * 0.6, data.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (id === 'bush') {
        ctx.fillStyle = data.color;
        ctx.beginPath();
        ctx.arc(x - 4, y + TILE_HEIGHT / 2, data.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = data.topColor;
        ctx.beginPath();
        ctx.arc(x + 4, y + TILE_HEIGHT / 2, data.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + TILE_HEIGHT / 2 + 2, data.size - 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (id === 'lamp') {
        // Post
        ctx.fillStyle = data.color;
        ctx.fillRect(x - 2, y + TILE_HEIGHT / 2, 4, 12);
        
        // Light
        ctx.fillStyle = data.lightColor;
        ctx.beginPath();
        ctx.arc(x, y + TILE_HEIGHT / 2, data.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = data.lightColor;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawRoad(isoX, isoY, id) {
    const screen = isoToScreen(isoX, isoY);
    const x = screen.x;
    const y = screen.y;
    
    const roadData = {
        basic: { 
            color: '#4a4a4a', 
            lineColor: '#ffffff', 
            pattern: 'solid' 
        },
        dirt: { 
            color: '#8b7355', 
            lineColor: '#6b5d3f', 
            pattern: 'dirt' 
        },
        stone: { 
            color: '#a0a0a0', 
            lineColor: '#808080', 
            pattern: 'stone' 
        },
        highway: { 
            color: '#2a2a2a', 
            lineColor: '#ffd700', 
            pattern: 'highway' 
        }
    };
    
    const data = roadData[id] || roadData.basic;
    
    // Draw road base (isometric tile)
    drawIsometricTile(isoX, isoY, data.color, -1);
    
    // Draw road pattern based on type
    if (data.pattern === 'solid') {
        // Basic road - simple center line
        ctx.strokeStyle = data.lineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - TILE_WIDTH / 4, y + TILE_HEIGHT / 2);
        ctx.lineTo(x + TILE_WIDTH / 4, y + TILE_HEIGHT / 2);
        ctx.stroke();
    } else if (data.pattern === 'dirt') {
        // Dirt road - irregular patches
        ctx.fillStyle = adjustBrightness(data.color, 0.15);
        ctx.beginPath();
        ctx.ellipse(x - 8, y + TILE_HEIGHT / 2 - 4, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 8, y + TILE_HEIGHT / 2 + 4, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = adjustBrightness(data.color, -0.15);
        ctx.beginPath();
        ctx.ellipse(x, y + TILE_HEIGHT / 2, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    } else if (data.pattern === 'stone') {
        // Stone road - cobblestone pattern (deterministic based on position)
        const stoneSize = 6;
        for (let i = -TILE_WIDTH / 2; i < TILE_WIDTH / 2; i += stoneSize) {
            for (let j = 0; j < TILE_HEIGHT; j += stoneSize) {
                const offsetX = x + i;
                const offsetY = y + j;
                // Use position-based hash for deterministic variation
                const hash = ((isoX * 7 + isoY * 11 + i * 3 + j * 5) % 10) / 10;
                ctx.fillStyle = adjustBrightness(data.color, (hash - 0.5) * 0.2);
                ctx.fillRect(offsetX - 2, offsetY, stoneSize - 2, stoneSize - 2);
            }
        }
    } else if (data.pattern === 'highway') {
        // Highway - double yellow lines
        ctx.strokeStyle = data.lineColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - TILE_WIDTH / 4, y + TILE_HEIGHT / 2 - 2);
        ctx.lineTo(x + TILE_WIDTH / 4, y + TILE_HEIGHT / 2 - 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - TILE_WIDTH / 4, y + TILE_HEIGHT / 2 + 2);
        ctx.lineTo(x + TILE_WIDTH / 4, y + TILE_HEIGHT / 2 + 2);
        ctx.stroke();
        
        // Add edge markings
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x - TILE_WIDTH / 2 + 4, y + TILE_HEIGHT / 2);
        ctx.lineTo(x + TILE_WIDTH / 2 - 4, y + TILE_HEIGHT / 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function adjustBrightness(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount * 255));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount * 255));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount * 255));
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}

// Draw ground grid
function drawGrid() {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = -GRID_SIZE; x <= GRID_SIZE; x++) {
        for (let y = -GRID_SIZE; y <= GRID_SIZE; y++) {
            const screen = isoToScreen(x, y);
            const tileX = screen.x;
            const tileY = screen.y;
            
            // Draw ground tile
            const distance = Math.sqrt(x * x + y * y);
            const brightness = 0.3 + (1 - Math.min(distance / GRID_SIZE, 1)) * 0.2;
            const groundColor = `rgba(34, 139, 34, ${brightness})`;
            
            drawIsometricTile(x, y, groundColor, 0);
        }
    }
}

// Render all items
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw all placed items
    placedItems.forEach(item => {
        if (item.type === 'building') {
            drawBuilding(item.isoX, item.isoY, item.id);
        } else if (item.type === 'decoration') {
            drawDecoration(item.isoX, item.isoY, item.id);
        } else if (item.type === 'road') {
            drawRoad(item.isoX, item.isoY, item.id);
        }
    });
    
    // Draw preview at mouse position
    if (selectedTool) {
        const mouseIso = screenToIso(mouseX, mouseY);
        const isValid = isValidPosition(mouseIso.x, mouseIso.y, selectedType, selectedId);
        
        // Draw preview with transparency
        ctx.globalAlpha = isValid ? 0.6 : 0.3;
        
        if (selectedType === 'building') {
            drawBuilding(mouseIso.x, mouseIso.y, selectedId);
        } else if (selectedType === 'decoration') {
            drawDecoration(mouseIso.x, mouseIso.y, selectedId);
        } else if (selectedType === 'road') {
            drawRoad(mouseIso.x, mouseIso.y, selectedId);
        }
        
        ctx.globalAlpha = 1.0;
        
        // Draw validity indicator
        const screen = isoToScreen(mouseIso.x, mouseIso.y);
        ctx.strokeStyle = isValid ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
        ctx.lineTo(screen.x, screen.y + TILE_HEIGHT);
        ctx.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
        ctx.closePath();
        ctx.stroke();
    }
}

// Mouse tracking
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    const iso = screenToIso(mouseX, mouseY);
    cursorInfo.textContent = `Grid: (${iso.x}, ${iso.y})`;
    
    render();
});

canvas.addEventListener('click', (e) => {
    if (!selectedTool) return;
    
    const iso = screenToIso(mouseX, mouseY);
    
    if (isValidPosition(iso.x, iso.y, selectedType, selectedId)) {
        placedItems.push({
            type: selectedType,
            id: selectedId,
            isoX: iso.x,
            isoY: iso.y
        });
        render();
    }
});

// Tool selection
document.querySelectorAll('.tool-item').forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all items
        document.querySelectorAll('.tool-item').forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        selectedTool = item;
        selectedType = item.dataset.type;
        selectedId = item.dataset.id;
        
        render();
    });
});

// Clear button
document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Clear all placed items?')) {
        placedItems.length = 0;
        render();
    }
});

// Keyboard controls for camera
let keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function updateCamera() {
    const speed = 5;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) cameraX -= speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) cameraX += speed;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) cameraY -= speed;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) cameraY += speed;
}

// Animation loop
function gameLoop() {
    updateCamera();
    render();
    requestAnimationFrame(gameLoop);
}

// Initial render
render();
gameLoop();


