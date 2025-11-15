// Building data definitions
// To use a sprite, add a 'sprite' property with the path to your PNG or WebP file
// Example: sprite: 'sprites/house1.png'
// If a sprite is provided, it will be used instead of procedural rendering
//
// Properties:
//   - name: Display name shown in the UI
//   - color: Base color for procedural rendering (fallback if no sprite)
//   - roofColor: Roof color for procedural rendering (buildings only)
//   - height: Building height in pixels (affects sprite scaling)
//   - width: Building width in tiles (currently always 1)
//   - cost: Purchase cost
//   - demolitionCostMultiplier: Multiplier for demolition cost (default: 0.5 = half price)
//   - sprite: Optional path to sprite file (PNG or WebP)
//   - offsetY: Vertical offset for sprite positioning (default: 0)
//   - incomeAmount: Optional income generated per interval (for income-generating buildings)
//   - incomeInterval: Optional interval in milliseconds for income generation (default: 5000)
//   - allowAdjacentPlacement: If true, allows placing items of the same type/id next to each other (default: false)
//   - unemployedRequired: Optional number of unemployed villagers required to build this building (default: 0)
export const BUILDING_DATA = {
    house1: { 
        name: 'House',
        color: '#8b4513', 
        roofColor: '#8b0000', 
        height: 18, 
        width: 1,
        cost: 300,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/house1.png',
        offsetY: 0,
        population: 2
    },
    house2: { 
        name: 'House 2',
        color: '#4682b4', 
        roofColor: '#2f4f4f', 
        height: 20, 
        width: 1,
        cost: 500,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/house2.png',
        offsetY: 0,
        population: 4
    },
    timberman: {
        name: 'Timberman',
        color: '#8b4513',
        roofColor: '#b8860b',
        height: 20,
        width: 1,
        cost: 1000,
        demolitionCostMultiplier: 0.5,
        incomeAmount: 10,
        incomeInterval: 5000,
        unemployedRequired: 2,
        sprite: 'sprites/timberman.png',
        offsetY: 0,
    },
    blacksmith: { 
        name: 'Blacksmith',
        color: '#2f2f2f', 
        roofColor: '#1a1a1a', 
        height: 20, 
        width: 1,
        cost: 1850,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/blacksmith.png',
        offsetY: 0,
        incomeAmount: 20,
        incomeInterval: 5000,
        unemployedRequired: 4
    },
    wheat: {
        name: 'Wheat',
        color: '#f0e68c',
        roofColor: '#ddaa00',
        height: 15,
        width: 1,
        cost: 100,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/wheat.png',
        incomeAmount: 5,
        incomeInterval: 5000,
        unemployedRequired: 1,
        offsetY: 6,
        allowAdjacentPlacement: true
    },
    shop: { 
        name: 'Shop',
        color: '#daa520', 
        roofColor: '#b8860b', 
        height: 20, 
        width: 1,
        cost: 650,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/shop.png',
        offsetY: 5,
        incomeAmount: 7,
        incomeInterval: 5000,
        allowAdjacentPlacement: true,
        unemployedRequired: 1
    },
    campfire: { 
        name: 'Campfire',
        color: '#8b4513', 
        roofColor: '#ff4500', 
        height: 20, 
        width: 1,
        cost: 50,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/campfire.png',
        offsetY: 10,
        allowAdjacentPlacement: true
    },
    well: { 
        name: 'Well',
        color: '#696969', 
        roofColor: '#ffd700', 
        height: 20, 
        width: 1,
        cost: 100,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/well.png',
        offsetY: 4,
        allowAdjacentPlacement: true
    }
};

// Decoration data definitions
// To use a sprite, add a 'sprite' property with the path to your PNG or WebP file
//
// Properties:
//   - name: Display name shown in the UI
//   - color: Base color for procedural rendering (fallback if no sprite)
//   - topColor: Top/secondary color (for tree, bush)
//   - trunkColor: Trunk color (for tree)
//   - lightColor: Light color (for lamp)
//   - size: Size in pixels for procedural rendering
//   - cost: Purchase cost
//   - demolitionCostMultiplier: Multiplier for demolition cost (default: 0.5 = half price)
//   - sprite: Optional path to sprite file (PNG or WebP)
//   - offsetY: Vertical offset for sprite positioning (default: 0)
//   - allowAdjacentPlacement: If true, allows placing items of the same type/id next to each other (default: false)
export const DECORATION_DATA = {
    tree: { 
        name: 'Tree',
        color: '#228b22', 
        topColor: '#32cd32', 
        trunkColor: '#8b4513', 
        size: 12,
        cost: 20,
        offsetY: -8,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        sprite: 'sprites/tree.png',
        resource: "wood"
    },
    pine: { 
        name: 'Pine Tree',
        color: '#708090', 
        size: 8,
        cost: 45,
        offsetY: -8,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        sprite: 'sprites/pine.png',
        resource: "wood"
    },
    bush: { 
        name: 'Bush',
        color: '#2d5016', 
        topColor: '#3d6b1f', 
        size: 10,
        cost: 15,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        offsetY: 5,
        sprite: 'sprites/bush.png'
    },
    lamp: { 
        name: 'Lamp',
        color: '#2f2f2f', 
        lightColor: '#ffd700', 
        size: 6,
        cost: 75,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        offsetY: 5,
        sprite: 'sprites/lamp.png'
    },
    bench: {
        name: 'Bench',
        color: '#8b4513',
        topColor: '#b8860b',
        size: 10,
        cost: 120,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        offsetY: 5,
        sprite: 'sprites/bench.png'
    }
};

// Road data definitions
// To use a sprite, add a 'sprite' property with the path to your PNG or WebP file
//
// Properties:
//   - name: Display name shown in the UI
//   - color: Base color for procedural rendering (fallback if no sprite)
//   - lineColor: Line/marking color for procedural rendering
//   - pattern: Pattern type (solid, dirt, stone, highway) for procedural rendering
//   - cost: Purchase cost
//   - demolitionCostMultiplier: Multiplier for demolition cost (default: 0.5 = half price)
//   - sprite: Optional path to sprite file (PNG or WebP)
//   - offsetY: Vertical offset for sprite positioning (default: -1 for roads)
//   - allowAdjacentPlacement: If true, allows placing items of the same type/id next to each other (default: false)
export const ROAD_DATA = {
    dirt: { 
        name: 'Dirt',
        color: '#8b7355', 
        lineColor: '#6b5d3f',
        height: 17,
        cost: 10,
        demolitionCostMultiplier: 0.5,
        offsetY: 10,
        allowAdjacentPlacement: true,
        sprite: 'sprites/dirt.png'
    },
    stone: { 
        name: 'Stone',
        color: '#a0a0a0', 
        lineColor: '#808080',
        height: 17,
        cost: 50,
        demolitionCostMultiplier: 0.5,
        offsetY: 10,
        allowAdjacentPlacement: true,
        sprite: 'sprites/stone.png'
    }
};

