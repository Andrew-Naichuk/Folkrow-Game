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
        this.infoPanel = null;
        this.currentHoveredItem = null;
        this.generateToolItems();
        this.createInfoPanel();
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

        // Add hover event listeners for info panel
        this.setupHoverListeners(toolItem, type, id);

        return toolItem;
    }

    /**
     * Setup hover event listeners for a tool item
     * @param {HTMLElement} toolItem - Tool item element
     * @param {string} type - Item type
     * @param {string} id - Item ID
     */
    setupHoverListeners(toolItem, type, id) {
        let hoverTimeout = null;

        toolItem.addEventListener('mouseenter', () => {
            if (type === 'tool') return; // Skip tools like bulldozer
            
            const itemData = this.getItemData(type, id);
            if (itemData) {
                // Clear any pending hide timeout
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                this.currentHoveredItem = toolItem;
                this.showInfoPanel(toolItem, itemData);
            }
        });

        toolItem.addEventListener('mouseleave', () => {
            if (type === 'tool') return;
            
            // Delay hiding to allow moving to the info panel
            hoverTimeout = setTimeout(() => {
                if (this.currentHoveredItem === toolItem) {
                    this.hideInfoPanel();
                }
            }, 150);
        });
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

    /**
     * Create the info panel element
     */
    createInfoPanel() {
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'item-info-panel';
        this.infoPanel.style.display = 'none';
        document.body.appendChild(this.infoPanel);
    }

    /**
     * Show info panel with item details
     * @param {HTMLElement} toolItem - The tool item being hovered
     * @param {Object} itemData - Item data
     */
    showInfoPanel(toolItem, itemData) {
        if (!this.infoPanel || !itemData) return;

        // Get type and id from toolItem
        const type = toolItem.dataset.type;
        const id = toolItem.dataset.id;

        // Build the content
        let content = `<div class="info-panel-title">${itemData.name || 'Unknown Item'}</div>`;
        
        let hasContentAfterTitle = false;
        
        // Helper function to add divider between sections
        const addDivider = () => {
            content += `<div class="info-panel-divider-light"></div>`;
        };
        
        // Description (if available)
        if (itemData.description) {
            if (hasContentAfterTitle) addDivider();
            content += `<div class="info-panel-row"><span class="info-value-description">${itemData.description}</span></div>`;
            hasContentAfterTitle = true;
        }
        
        // Cost
        if (itemData.cost !== undefined) {
            if (hasContentAfterTitle) addDivider();
            content += `<div class="info-panel-row"><span class="info-label">Cost:</span><span class="info-value">⍱${itemData.cost}</span></div>`;
            hasContentAfterTitle = true;
        }
        
        // Requirements (if any) - dynamically display all requirement types
        if (itemData.requires) {
            const requirementsCheck = this.gameState.checkRequirements(type, id);
            const requirements = itemData.requires;
            const missing = requirementsCheck.missing;
            const checkers = this.gameState.getRequirementCheckers();
            
            if (hasContentAfterTitle) addDivider();
            content += `<div class="info-panel-row" style="margin-top: 4px; padding-top: 8px;"><span class="info-label" style="font-weight: 700;">Requirements:</span></div>`;
            
            // Display all requirements dynamically
            for (const [reqType, requiredValue] of Object.entries(requirements)) {
                const checker = checkers[reqType];
                if (checker) {
                    const result = checker(requiredValue);
                    const isMet = !missing || !missing[reqType];
                    const statusClass = isMet ? 'info-value' : 'info-value requirement-not-met';
                    const statusText = isMet ? '✓' : '✗';
                    content += `<div class="info-panel-requirement-row"><span class="info-label">${result.label}:</span><span class="${statusClass}">${statusText} ${result.current} / ${result.required}</span></div>`;
                } else {
                    // Fallback for unknown requirement types
                    const isMet = !missing || !missing[reqType];
                    const statusClass = isMet ? 'info-value' : 'info-value requirement-not-met';
                    const statusText = isMet ? '✓' : '✗';
                    const label = reqType.charAt(0).toUpperCase() + reqType.slice(1);
                    content += `<div class="info-panel-requirement-row"><span class="info-label">${label}:</span><span class="${statusClass}">${statusText} ${requiredValue}</span></div>`;
                }
            }
            hasContentAfterTitle = true;
        }
        
        // Income, Expense, and Population - grouped together with light dividers between them
        const financialRows = [];
        if (itemData.incomeAmount !== undefined && itemData.incomeAmount > 0) {
            financialRows.push(`<div class="info-panel-row"><span class="info-label">Income:</span><span class="info-value income">⍱${itemData.incomeAmount} / interval</span></div>`);
        }
        if (itemData.expenseAmount !== undefined && itemData.expenseAmount > 0) {
            financialRows.push(`<div class="info-panel-row"><span class="info-label">Expense:</span><span class="info-value expense">⍱${itemData.expenseAmount} / interval</span></div>`);
        }
        if (itemData.population !== undefined && itemData.population > 0) {
            financialRows.push(`<div class="info-panel-row"><span class="info-label">Houses:</span><span class="info-value">${itemData.population} villagers</span></div>`);
        }
        
        if (financialRows.length > 0) {
            if (hasContentAfterTitle) addDivider();
            // Add dividers between financial rows
            for (let i = 0; i < financialRows.length; i++) {
                if (i > 0) addDivider();
                content += financialRows[i];
            }
        }

        this.infoPanel.innerHTML = content;
        this.infoPanel.style.display = 'block';
        this.infoPanel.style.visibility = 'hidden'; // Hide temporarily to measure

        // Position the panel near the hovered item
        this.positionInfoPanel(toolItem);
    }

    /**
     * Position the info panel relative to the hovered item
     * @param {HTMLElement} toolItem - The tool item being hovered
     */
    positionInfoPanel(toolItem) {
        if (!this.infoPanel || !toolItem) return;

        // Use requestAnimationFrame to ensure the panel is rendered before calculating position
        requestAnimationFrame(() => {
            const rect = toolItem.getBoundingClientRect();
            const sidebarRect = this.sidebar.getBoundingClientRect();
            const panelRect = this.infoPanel.getBoundingClientRect();

            // Position to the right of the sidebar, or to the left if not enough space
            let left = sidebarRect.right + 15;
            let top = rect.top;

            // If panel would go off screen to the right, position it to the left of the sidebar
            if (left + panelRect.width > window.innerWidth - 15) {
                left = sidebarRect.left - panelRect.width - 15;
            }

            // If panel would go off screen at the bottom, adjust top
            if (top + panelRect.height > window.innerHeight - 15) {
                top = window.innerHeight - panelRect.height - 15;
            }

            // If panel would go off screen at the top, adjust top
            if (top < 15) {
                top = 15;
            }

            this.infoPanel.style.left = `${left}px`;
            this.infoPanel.style.top = `${top}px`;
            this.infoPanel.style.visibility = 'visible'; // Make visible after positioning
        });
    }

    /**
     * Hide the info panel
     */
    hideInfoPanel() {
        if (this.infoPanel) {
            this.infoPanel.style.display = 'none';
        }
        this.currentHoveredItem = null;
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

        // Keep panel visible when hovering over it
        if (this.infoPanel) {
            let panelHoverTimeout = null;
            
            this.infoPanel.addEventListener('mouseenter', () => {
                // Clear any pending hide timeout
                if (panelHoverTimeout) {
                    clearTimeout(panelHoverTimeout);
                    panelHoverTimeout = null;
                }
            });
            
            this.infoPanel.addEventListener('mouseleave', () => {
                // Delay hiding when leaving the panel
                panelHoverTimeout = setTimeout(() => {
                    this.hideInfoPanel();
                }, 100);
            });
        }
    }
}

