import { BUILDING_DATA, DECORATION_DATA, ROAD_DATA } from '../data/itemData.js';

    /**
     * Handles tool selection UI
     */
export class ToolSelector {
    constructor(gameState, renderer, mouseHandler, spriteManager) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.mouseHandler = mouseHandler;
        this.spriteManager = spriteManager;
        this.sidebar = document.querySelector('.sidebar');
        this.generateToolItems();
        this.setupEventListeners();
    }
    
    /**
     * Disable UI interaction when tool is selected
     */
    disableUIInteraction() {
        if (this.mouseHandler) {
            this.mouseHandler.disableUIInteraction();
        } else if (this.sidebar) {
            this.sidebar.style.pointerEvents = 'none';
            this.sidebar.style.opacity = '0.6';
        }
    }
    
    /**
     * Enable UI interaction when tool is deselected
     */
    enableUIInteraction() {
        if (this.mouseHandler) {
            this.mouseHandler.enableUIInteraction();
        } else if (this.sidebar) {
            this.sidebar.style.pointerEvents = 'auto';
            this.sidebar.style.opacity = '1';
        }
    }

    /**
     * Generate tool items dynamically from itemData
     */
    generateToolItems() {
        // Generate building items
        const buildingsGrid = document.getElementById('buildings-grid');
        if (buildingsGrid) {
            Object.keys(BUILDING_DATA).forEach(id => {
                const itemElement = this.createToolItem('building', id, BUILDING_DATA[id]);
                buildingsGrid.appendChild(itemElement);
            });
        }

        // Generate decoration items
        const decorationsGrid = document.getElementById('decorations-grid');
        if (decorationsGrid) {
            Object.keys(DECORATION_DATA).forEach(id => {
                const itemElement = this.createToolItem('decoration', id, DECORATION_DATA[id]);
                decorationsGrid.appendChild(itemElement);
            });
        }

        // Generate road items
        const roadsGrid = document.getElementById('roads-grid');
        if (roadsGrid) {
            Object.keys(ROAD_DATA).forEach(id => {
                const itemElement = this.createToolItem('road', id, ROAD_DATA[id]);
                roadsGrid.appendChild(itemElement);
            });
        }
    }

    /**
     * Create a tool item element
     * @param {string} type - Item type (building, decoration, road)
     * @param {string} id - Item ID
     * @param {Object} itemData - Item data from itemData.js
     * @returns {HTMLElement} Created tool item element
     */
    createToolItem(type, id, itemData) {
        const toolItem = document.createElement('div');
        toolItem.className = 'tool-item';
        toolItem.setAttribute('data-type', type);
        toolItem.setAttribute('data-id', id);

        // Create preview div
        const previewDiv = document.createElement('div');
        previewDiv.className = 'tool-preview';
        
        // If item has a sprite, we'll create a canvas preview later
        // For now, just add the preview div
        toolItem.appendChild(previewDiv);

        // Create name span
        const nameSpan = document.createElement('span');
        nameSpan.textContent = itemData.name || id;
        toolItem.appendChild(nameSpan);

        // Add cost label if cost exists
        if (itemData.cost && itemData.cost > 0) {
            const costElement = document.createElement('span');
            costElement.className = 'tool-cost';
            costElement.textContent = `⍱${itemData.cost}`;
            toolItem.appendChild(costElement);
        }

        // Setup sprite preview if sprite exists
        if (itemData.sprite) {
            this.setupSpritePreviewForItem(toolItem, itemData.sprite, type);
        }

        return toolItem;
    }

    /**
     * Setup sprite preview for a tool item
     * @param {HTMLElement} toolItem - Tool item element
     * @param {string} spritePath - Path to sprite file
     * @param {string} type - Item type
     */
    setupSpritePreviewForItem(toolItem, spritePath, type) {
        const previewDiv = toolItem.querySelector('.tool-preview');
        if (previewDiv) {
            // Replace the preview div with a canvas
            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            canvas.className = 'tool-preview-canvas';
            previewDiv.replaceWith(canvas);
            
            // Render sprite on canvas when it's loaded
            this.renderSpritePreview(canvas, spritePath, type);
        }
    }

    /**
     * Get item data for a given type and id
     * @param {string} type - Item type (building, decoration, road)
     * @param {string} id - Item ID
     * @returns {Object|null} Item data or null if not found
     */
    getItemData(type, id) {
        if (type === 'building' && BUILDING_DATA[id]) {
            return BUILDING_DATA[id];
        } else if (type === 'decoration' && DECORATION_DATA[id]) {
            return DECORATION_DATA[id];
        } else if (type === 'road' && ROAD_DATA[id]) {
            return ROAD_DATA[id];
        }
        return null;
    }


    /**
     * Render a sprite on a preview canvas
     * @param {HTMLCanvasElement} canvas - Canvas element to draw on
     * @param {string} spritePath - Path to the sprite file
     * @param {string} type - Item type (building, decoration, road)
     */
    renderSpritePreview(canvas, spritePath, type) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Check if sprite is loaded
        const sprite = this.spriteManager ? this.spriteManager.getSprite(spritePath) : null;
        
        if (sprite) {
            // Calculate sprite dimensions to fit nicely in the preview
            // For isometric sprites, they're typically taller than wide
            const spriteAspectRatio = sprite.width / sprite.height;
            let spriteWidth, spriteHeight;
            
            // Scale to fit within the preview area while maintaining aspect ratio
            if (spriteAspectRatio > 1) {
                // Wider than tall
                spriteWidth = width * 0.9;
                spriteHeight = spriteWidth / spriteAspectRatio;
            } else {
                // Taller than wide (typical for isometric sprites)
                spriteHeight = height * 1.2; // Allow sprite to extend slightly beyond
                spriteWidth = spriteHeight * spriteAspectRatio;
            }
            
            // Center the sprite horizontally, align bottom with canvas bottom
            const x = (width - spriteWidth) / 2;
            const y = height - spriteHeight;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(sprite, x, y, spriteWidth, spriteHeight);
        } else {
            // If sprite not loaded yet, try loading it and then render
            if (this.spriteManager) {
                this.spriteManager.loadSprite(spritePath)
                    .then(() => {
                        // Re-render once sprite is loaded
                        this.renderSpritePreview(canvas, spritePath, type);
                    })
                    .catch(() => {
                        // If sprite fails to load, keep the CSS preview
                        console.warn(`Failed to load sprite for preview: ${spritePath}`);
                    });
            }
        }
    }

    setupEventListeners() {
        // Use event delegation to handle dynamically added items
        document.addEventListener('click', (e) => {
            const toolItem = e.target.closest('.tool-item');
            if (!toolItem) return;

            // Check if clicking on the same tool (deselect)
            const isCurrentlySelected = toolItem.classList.contains('active');
            
            if (isCurrentlySelected) {
                // Deselect the tool
                toolItem.classList.remove('active');
                this.gameState.clearSelectedTool();
                this.enableUIInteraction();
            } else {
                // Remove active class from all items
                document.querySelectorAll('.tool-item').forEach(i => 
                    i.classList.remove('active')
                );
                
                // Add active class to clicked item
                toolItem.classList.add('active');
                
                // Select the tool
                this.gameState.setSelectedTool(
                    toolItem,
                    toolItem.dataset.type,
                    toolItem.dataset.id
                );
                this.disableUIInteraction();
            }
            
            // Update cursor to align with preview when tool is selected
            if (this.mouseHandler) {
                this.mouseHandler.updateCursor();
            }
            
            this.renderer.render();
        });
    }
}

