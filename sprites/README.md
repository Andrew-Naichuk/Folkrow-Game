# Sprites Directory

This directory is for storing PNG or WebP sprite images for placeable items in the game.

## How to Use

1. Add your sprite files (PNG or WebP) to this directory
2. Update the item data in `js/data/itemData.js` to reference your sprite:
   ```javascript
   house1: {
       color: '#8b4513',
       roofColor: '#8b0000',
       height: 20,
       width: 1,
       cost: 500,
       sprite: 'sprites/house1.png' // Add this line
   }
   ```

## Sprite Guidelines

- **Format**: PNG or WebP files are supported
- **Naming**: Use descriptive names (e.g., `house1.png`, `tree.png`, `road_basic.png`)
- **Dimensions**: Sprites will be automatically scaled to fit the isometric tile size
- **Transparency**: PNG files with transparency are fully supported
- **Orientation**: Sprites should be designed for isometric perspective (diamond/top-down view)

## Example Sprite Paths

- Buildings: `sprites/house1.png`, `sprites/tower.png`, `sprites/shop.png`
- Decorations: `sprites/tree.png`, `sprites/rock.png`, `sprites/bush.png`, `sprites/lamp.png`
- Roads: `sprites/road_basic.png`, `sprites/road_dirt.png`, `sprites/road_stone.png`, `sprites/road_highway.png`

## Fallback Behavior

If a sprite is not found or fails to load, the game will automatically fall back to the procedural rendering system (the original colored shapes).

