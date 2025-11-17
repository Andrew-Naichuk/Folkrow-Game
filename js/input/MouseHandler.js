import { screenToTile, tileToWorld, worldToScreen, screenToWorld } from '../utils/coordinateUtils.js';
import { CONFIG } from '../config.js';
import { BUILDING_DATA, DECORATION_DATA, ROAD_DATA } from '../data/itemData.js';

/**
 * Handles mouse input events
 */
export class MouseHandler {
    constructor(canvas, renderer, gameState, toast = null, tooltip = null) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.gameState = gameState;
        this.toast = toast;
        this.tooltip = tooltip;
        this.mouseX = 0;
        this.mouseY = 0;
        this.globalMouseX = 0;
        this.globalMouseY = 0;
        
        // Middle mouse button drag state
        this.isDragging = false;
        this.dragStart = null;
        
        // Hover state for tooltip
        this.hoveredItem = null;
        
        // Create custom cursor element
        this.customCursor = this.createCustomCursor();
        
        // Get sidebar reference for UI interaction control
        this.sidebar = document.querySelector('.sidebar');
        
        // AbortController for cleanup of global event listeners
        this.abortController = new AbortController();
        
        this.setupEventListeners();
        this.setupGlobalMouseTracking();
    }
    
    /**
     * Setup global mouse tracking to track position even when over sidebar
     */
    setupGlobalMouseTracking() {
        // Track mouse position globally so preview can follow cursor even over sidebar
        document.addEventListener('mousemove', (e) => {
            this.globalMouseX = e.clientX;
            this.globalMouseY = e.clientY;
            
            // If tool is selected, trigger render to update preview position
            if (this.gameState.getSelectedTool() && !this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const canvasX = e.clientX - rect.left;
                const canvasY = e.clientY - rect.top;
                
                // Update canvas mouse position if mouse is over canvas
                if (canvasX >= 0 && canvasX <= this.canvas.width && 
                    canvasY >= 0 && canvasY <= this.canvas.height) {
                    this.mouseX = canvasX;
                    this.mouseY = canvasY;
                    this.renderer.updateMousePosition(this.mouseX, this.mouseY);
                    
                    // Check for demolition tooltip if demolition tool is selected
                    const selectedTool = this.gameState.getSelectedTool();
                    const isDemolitionTool = selectedTool && selectedTool.type === 'tool' && selectedTool.id === 'bulldozer';
                    if (isDemolitionTool && this.tooltip) {
                        const canvasWidth = this.canvas.width;
                        const canvasHeight = this.canvas.height;
                        const camera = this.renderer.camera;
                        const zoom = camera.getZoom();
                        const iso = screenToTile(
                            this.mouseX, this.mouseY,
                            canvasWidth, canvasHeight,
                            camera.getX(), camera.getY(),
                            zoom
                        );
                        this.checkHoverForTooltip(iso.x, iso.y, e.clientX, e.clientY);
                    }
                } else {
                    // Mouse is outside canvas, hide tooltip if demolition tool is selected
                    const selectedTool = this.gameState.getSelectedTool();
                    const isDemolitionTool = selectedTool && selectedTool.type === 'tool' && selectedTool.id === 'bulldozer';
                    if (isDemolitionTool && this.tooltip && this.hoveredItem) {
                        this.tooltip.hide();
                        this.hoveredItem = null;
                    }
                }
                
                // Update custom cursor position
                this.updateCustomCursorPosition(e.clientX, e.clientY);
                
                // Render to update preview position
                this.renderer.render();
            }
        }, { signal: this.abortController.signal });
    }
    
    /**
     * Disable UI interaction when tool is selected
     * Note: Tool items remain clickable to allow deselection
     */
    disableUIInteraction() {
        if (this.sidebar) {
            this.sidebar.classList.add('tool-selected');
            this.sidebar.style.opacity = '0.6';
        }
    }
    
    /**
     * Enable UI interaction when tool is deselected
     */
    enableUIInteraction() {
        if (this.sidebar) {
            this.sidebar.classList.remove('tool-selected');
            this.sidebar.style.opacity = '1';
        }
    }
    
    /**
     * Create a custom cursor element
     */
    createCustomCursor() {
        const cursor = document.createElement('div');
        cursor.id = 'custom-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 16px;
            height: 16px;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            display: none;
        `;
        
        // Create cursor visual (crosshair)
        const cursorInner = document.createElement('div');
        cursorInner.style.cssText = `
            width: 100%;
            height: 100%;
            border: 2px solid #fff;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.5);
            box-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
        `;
        cursor.appendChild(cursorInner);
        
        document.body.appendChild(cursor);
        return cursor;
    }
    
    /**
     * Update custom cursor position to align with preview
     */
    updateCustomCursorPosition(clientX, clientY) {
        const selectedTool = this.gameState.getSelectedTool();
        if (!selectedTool || this.isDragging) {
            this.customCursor.style.display = 'none';
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;
        
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const camera = this.renderer.camera;
        const zoom = camera.getZoom();
        
        // Convert mouse position to tile coordinates
        const mouseIso = screenToTile(
            canvasX, canvasY,
            canvasWidth, canvasHeight,
            camera.getX(), camera.getY(),
            zoom
        );
        
        // Get screen position of the preview tile
        const world = tileToWorld(mouseIso.x, mouseIso.y);
        const screen = worldToScreen(
            world.x, world.y,
            canvasWidth, canvasHeight,
            camera.getX(), camera.getY(),
            zoom
        );
        
        // Calculate bottom center of the preview tile
        // Bottom center is at: (screen.x, screen.y + CONFIG.TILE_HEIGHT * zoom)
        const cursorX = screen.x + rect.left;
        const cursorY = screen.y + CONFIG.TILE_HEIGHT * zoom + rect.top;
        
        // Position the custom cursor
        this.customCursor.style.left = cursorX + 'px';
        this.customCursor.style.top = cursorY + 'px';
        this.customCursor.style.display = 'block';
    }

    setupEventListeners() {
        // Middle mouse button down - start dragging
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle mouse button
                e.preventDefault(); // Prevent default scrolling behavior
                this.isDragging = true;
                const rect = this.canvas.getBoundingClientRect();
                const canvasWidth = this.canvas.width;
                const canvasHeight = this.canvas.height;
                const camera = this.renderer.camera;
                const zoom = camera.getZoom();
                
                // Store drag start state (screen position and camera position)
                this.dragStart = {
                    screenX: e.clientX,
                    screenY: e.clientY,
                    camX: camera.getX(),
                    camY: camera.getY()
                };
                this.canvas.style.cursor = 'grabbing';
            }
        });

        // Middle mouse button up - stop dragging
        window.addEventListener('mouseup', (e) => {
            if (e.button === 1) { // Middle mouse button
                this.isDragging = false;
                this.dragStart = null;
                // Update cursor based on tool selection state
                this.updateCursor();
            }
        });
        
        // In case cursor leaves the window while dragging
        window.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.dragStart = null;
        });

        // Mouse move - handle dragging and cursor updates
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.globalMouseX = e.clientX;
            this.globalMouseY = e.clientY;
            
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;
            const camera = this.renderer.camera;
            
            // Handle middle mouse button dragging
            if (this.isDragging && this.dragStart) {
                const dx = (e.clientX - this.dragStart.screenX) / camera.getZoom();
                const dy = (e.clientY - this.dragStart.screenY) / camera.getZoom();
                camera.x = this.dragStart.camX - dx;
                camera.y = this.dragStart.camY - dy;
                
                // Ensure cursor is set to grabbing while dragging
                this.canvas.style.cursor = 'grabbing';
                this.customCursor.style.display = 'none';
            } else {
                // Hide cursor when tool is selected, otherwise show grab cursor
                if (this.gameState.getSelectedTool()) {
                    this.canvas.style.cursor = 'none';
                    // Update custom cursor position to align with preview
                    this.updateCustomCursorPosition(e.clientX, e.clientY);
                } else {
                    this.canvas.style.cursor = 'grab';
                    this.customCursor.style.display = 'none';
                }
            }
            
            const zoom = camera.getZoom();
            const iso = screenToTile(
                this.mouseX, this.mouseY,
                canvasWidth, canvasHeight,
                camera.getX(), camera.getY(),
                zoom
            );
            
            // Check for hover over items with hoverText
            this.checkHoverForTooltip(iso.x, iso.y, e.clientX, e.clientY);
            
            this.renderer.updateMousePosition(this.mouseX, this.mouseY);
            this.renderer.render();
        });

        // Handle mouse leaving canvas - stop dragging and hide tooltip
        this.canvas.addEventListener('mouseleave', (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                this.dragStart = null;
                this.canvas.style.cursor = 'default';
            } else {
                this.canvas.style.cursor = 'default';
            }
            this.customCursor.style.display = 'none';
            // Hide tooltip when leaving canvas
            if (this.tooltip) {
                this.tooltip.hide();
            }
            this.hoveredItem = null;
        });

        // Set cursor on mouse enter
        this.canvas.addEventListener('mouseenter', (e) => {
            if (!this.isDragging) {
                // Hide cursor when tool is selected, otherwise show grab cursor
                if (this.gameState.getSelectedTool()) {
                    this.canvas.style.cursor = 'none';
                    this.updateCustomCursorPosition(e.clientX, e.clientY);
                } else {
                    this.canvas.style.cursor = 'grab';
                    this.customCursor.style.display = 'none';
                }
            }
        });

        // Handle right mouse button to cancel tool selection
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right mouse button
                e.preventDefault(); // Prevent context menu
                this.cancelToolSelection();
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent context menu
        });

        // Handle mouse wheel for zooming (zoom around cursor)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault(); // Prevent page scrolling
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;
            
            // Zoom towards mouse position
            this.renderer.camera.zoomAtPoint(e.deltaY, mouseX, mouseY, canvasWidth, canvasHeight);
            
            // Update mouse position and render
            this.mouseX = mouseX;
            this.mouseY = mouseY;
            this.renderer.updateMousePosition(this.mouseX, this.mouseY);
            this.renderer.render();
        }, { passive: false });

        this.canvas.addEventListener('click', (e) => {
            const selectedTool = this.gameState.getSelectedTool();
            if (!selectedTool) return;
            
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;
            const camera = this.renderer.camera;
            
            const zoom = camera.getZoom();
            const iso = screenToTile(
                this.mouseX, this.mouseY,
                canvasWidth, canvasHeight,
                camera.getX(), camera.getY(),
                zoom
            );
            
            // Check if bulldozer tool is selected
            if (selectedTool.type === 'tool' && selectedTool.id === 'bulldozer') {
                // Check if there's an item at this position and if player can afford demolition
                const placedItems = this.gameState.getPlacedItems();
                const item = placedItems.find(item => 
                    item.isoX === iso.x && item.isoY === iso.y
                );
                
                if (item) {
                    // Check if trying to destroy a tree, pine, stump, or roots - requires Woodcutter or Timberman
                    if (item.type === 'decoration' && (item.id === 'tree' || item.id === 'pine' || item.id === 'stump' || item.id === 'roots')) {
                        if (!this.gameState.hasWoodcutterOrTimberman()) {
                            if (this.toast) {
                                this.toast.warning('You need at least one Woodcutter or Timberman to remove trees, stumps, or roots!');
                            }
                            return;
                        }
                    }
                    
                    // Check if trying to destroy rocks or boulder - requires Stonecutter
                    if (item.type === 'decoration' && (item.id === 'rocks' || item.id === 'boulder')) {
                        if (!this.gameState.hasStonecutter()) {
                            if (this.toast) {
                                this.toast.warning('You need at least one Stonecutter to remove rocks or boulders!');
                            }
                            return;
                        }
                    }
                    
                    const demolitionCost = this.gameState.getDemolitionCost(item.type, item.id);
                    const budget = this.gameState.getBudget();
                    
                    if (budget < demolitionCost) {
                        // Show feedback that player can't afford demolition
                        if (this.toast) {
                            this.toast.warning(`Insufficient funds! Demolition costs ⍱${demolitionCost}, have ⍱${budget.toFixed(2)}`);
                        }
                        return;
                    }
                }
                
                if (this.gameState.clearCell(iso.x, iso.y)) {
                    // Trigger destroy animation
                    this.renderer.getAnimationManager().addDustCloud(iso.x, iso.y, 'destroy');
                    this.renderer.render();
                }
            } else {
                // Check if player can afford the item
                if (!this.gameState.canAfford(selectedTool.type, selectedTool.id)) {
                    // Show feedback that player can't afford the item
                    const cost = this.gameState.getItemCost(selectedTool.type, selectedTool.id);
                    const budget = this.gameState.getBudget();
                    if (this.toast) {
                        this.toast.warning(`Insufficient funds! Need ⍱${cost}, have ⍱${budget.toFixed(2)}`);
                    }
                    return;
                }
                
                // Check if item has requirements that must be met
                const requirementsCheck = this.gameState.checkRequirements(selectedTool.type, selectedTool.id);
                if (!requirementsCheck.met) {
                    let errorMessage = 'Requirements not met! ';
                    const missing = requirementsCheck.missing;
                    
                    // Build error message for all missing requirements
                    const missingMessages = [];
                    for (const [reqType, reqData] of Object.entries(missing)) {
                        if (reqData && reqData.label) {
                            missingMessages.push(`${reqData.label}: need ${reqData.required}, have ${reqData.current}`);
                        }
                    }
                    
                    if (missingMessages.length > 0) {
                        errorMessage += missingMessages.join('; ');
                    } else {
                        errorMessage += 'One or more requirements not met.';
                    }
                    
                    if (this.toast) {
                        this.toast.warning(errorMessage);
                    }
                    return;
                }
                
                // Place item normally with rotation state
                const flipped = selectedTool.flipped || false;
                if (this.gameState.placeItem(iso.x, iso.y, selectedTool.type, selectedTool.id, flipped)) {
                    // Trigger add animation
                    this.renderer.getAnimationManager().addDustCloud(iso.x, iso.y, 'add');
                    this.renderer.render();
                } else if (!this.gameState.isValidPosition(iso.x, iso.y, selectedTool.type, selectedTool.id)) {
                    // Position is invalid (occupied or out of bounds)
                    if (this.toast) {
                        this.toast.warning('Invalid position!');
                    }
                }
            }
        });
    }

    getMouseX() {
        return this.mouseX;
    }

    getMouseY() {
        return this.mouseY;
    }
    
    getGlobalMouseX() {
        return this.globalMouseX;
    }
    
    getGlobalMouseY() {
        return this.globalMouseY;
    }

    /**
     * Cancel tool selection and reset cursor
     */
    cancelToolSelection() {
        if (this.gameState.getSelectedTool()) {
            this.gameState.clearSelectedTool();
            // Reset cursor to initial state (grab when not dragging)
            if (!this.isDragging) {
                this.canvas.style.cursor = 'grab';
            }
            this.customCursor.style.display = 'none';
            // Hide tooltip if it was showing demolition cost
            if (this.tooltip && this.hoveredItem) {
                this.tooltip.hide();
                this.hoveredItem = null;
            }
            // Re-enable UI interaction
            this.enableUIInteraction();
            // Tooltip will be shown again on next mousemove if hovering over item with hoverText
            this.renderer.render();
        }
    }

    /**
     * Check for hover over items with hoverText and show/hide tooltip
     * @param {number} isoX - Isometric X coordinate
     * @param {number} isoY - Isometric Y coordinate
     * @param {number} clientX - Mouse client X coordinate
     * @param {number} clientY - Mouse client Y coordinate
     */
    checkHoverForTooltip(isoX, isoY, clientX, clientY) {
        if (!this.tooltip) {
            return;
        }

        const selectedTool = this.gameState.getSelectedTool();
        const isDemolitionTool = selectedTool && selectedTool.type === 'tool' && selectedTool.id === 'bulldozer';

        // Find item at this position
        const placedItems = this.gameState.getPlacedItems();
        const item = placedItems.find(item => 
            item.isoX === isoX && item.isoY === isoY
        );

        // If demolition tool is selected and hovering over an item, show demolition cost
        if (isDemolitionTool && item && !this.isDragging) {
            const demolitionCost = this.gameState.getDemolitionCost(item.type, item.id);
            const itemKey = `${item.isoX},${item.isoY}`;
            
            if (this.hoveredItem !== itemKey) {
                this.hoveredItem = itemKey;
                this.tooltip.show(`Demolition: ⍱${demolitionCost.toFixed(2)}`, clientX, clientY);
            } else {
                // Update tooltip position in case mouse moved
                this.tooltip.show(`Demolition: ⍱${demolitionCost.toFixed(2)}`, clientX, clientY);
            }
            return;
        }

        // Don't show tooltip while dragging or when tool is selected (but not demolition)
        if (this.isDragging || selectedTool) {
            if (this.hoveredItem) {
                this.tooltip.hide();
                this.hoveredItem = null;
            }
            return;
        }

        if (item) {
            // Get item data
            let itemData = null;
            if (item.type === 'building' && BUILDING_DATA[item.id]) {
                itemData = BUILDING_DATA[item.id];
            } else if (item.type === 'decoration' && DECORATION_DATA[item.id]) {
                itemData = DECORATION_DATA[item.id];
            } else if (item.type === 'road' && ROAD_DATA[item.id]) {
                itemData = ROAD_DATA[item.id];
            }

            // Check if item has hoverText
            if (itemData && itemData.hoverText) {
                // Check if this is the same item we're already hovering
                const itemKey = `${item.isoX},${item.isoY}`;
                if (this.hoveredItem !== itemKey) {
                    this.hoveredItem = itemKey;
                    this.tooltip.show(itemData.hoverText, clientX, clientY);
                } else {
                    // Update tooltip position in case mouse moved
                    this.tooltip.show(itemData.hoverText, clientX, clientY);
                }
                return;
            }
        }

        // No item with hoverText at this position
        if (this.hoveredItem) {
            this.tooltip.hide();
            this.hoveredItem = null;
        }
    }

    /**
     * Update cursor based on tool selection state
     */
    updateCursor() {
        if (this.isDragging) {
            this.canvas.style.cursor = 'grabbing';
            this.customCursor.style.display = 'none';
        } else if (this.gameState.getSelectedTool()) {
            this.canvas.style.cursor = 'none';
            // Update custom cursor position if we have mouse coordinates
            if (this.mouseX !== 0 || this.mouseY !== 0) {
                const rect = this.canvas.getBoundingClientRect();
                this.updateCustomCursorPosition(
                    this.mouseX + rect.left,
                    this.mouseY + rect.top
                );
            }
        } else {
            this.canvas.style.cursor = 'grab';
            this.customCursor.style.display = 'none';
        }
    }
    
    /**
     * Cleanup method to remove event listeners and prevent memory leaks
     */
    destroy() {
        // Abort all event listeners using AbortController
        this.abortController.abort();
        
        // Remove custom cursor element from DOM
        if (this.customCursor && this.customCursor.parentNode) {
            this.customCursor.parentNode.removeChild(this.customCursor);
        }
    }
}

