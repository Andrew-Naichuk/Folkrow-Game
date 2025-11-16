// Building data definitions
// To use a sprite, add a 'sprite' property with the path to your PNG or WebP file
// Example: sprite: 'sprites/house1.png'
//
// Properties:
//   - name: Display name shown in the UI
//   - height: Building height in pixels (affects sprite scaling)
//   - width: Building width in tiles (currently always 1)
//   - cost: Purchase cost
//   - demolitionCostMultiplier: Multiplier for demolition cost (default: 0.5 = half price)
//   - sprite: Optional path to sprite file (PNG or WebP)
//   - offsetY: Vertical offset for sprite positioning (default: 0)
//   - population: Number of villagers this building houses (for houses)
//   - incomeAmount: Optional income generated per interval (for income-generating buildings)
//   - expenseAmount: Optional maintenance cost per interval (for buildings that require maintenance)
//   - allowAdjacentPlacement: If true, allows placing items of the same type/id next to each other (default: false)
//   - requires: Optional requirements object (e.g., { population: 10, unemployedPopulation: 3 })
export const BUILDING_DATA = {
    house1: { 
        name: 'Basic house',
        description: 'A tiny roof, two dreams and just enough room to argue',
        height: 18, 
        width: 1,
        cost: 300,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/house1.png',
        offsetY: 0,
        population: 2,
        expenseAmount: 2
    },
    house2: { 
        name: 'Stone house',
        description: 'Solid walls, soft beds and gossip that lasts generations',
        height: 20, 
        width: 1,
        cost: 600,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/house2.png',
        offsetY: 0,
        population: 4,
        expenseAmount: 3,
        requires: {
            population: 10,
        }
    },
    timberman: {
        name: 'Timberman',
        description: 'Turns trees into planks and planks into pure profit',
        height: 20,
        width: 1,
        cost: 1000,
        demolitionCostMultiplier: 0.5,
        incomeAmount: 14,
        expenseAmount: 5,
        sprite: 'sprites/timberman.png',
        offsetY: 0,
        requires: {
            population: 20,
            unemployedPopulation: 3,
        }
    },
    blacksmith: { 
        name: 'Blacksmith',
        description: 'Where metal screams, sparks dance and coins change pockets',
        height: 20, 
        width: 1,
        cost: 1800,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/blacksmith.png',
        offsetY: 0,
        incomeAmount: 26,
        expenseAmount: 9,
        requires: {
            population: 40,
            unemployedPopulation: 4
        }
    },
    wheat: {
        name: 'Wheat',
        description: 'A humble patch of grain that keeps bellies and coffers full',
        height: 15,
        width: 1,
        cost: 120,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/wheat.png',
        incomeAmount: 3,
        expenseAmount: 1,
        offsetY: 4,
        allowAdjacentPlacement: true,
        requires: {
            unemployedPopulation: 1
        }
    },
    shop: { 
        name: 'Shop',
        description: 'Villagers come for goods and leave with lighter pockets',
        height: 20, 
        width: 1,
        cost: 700,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/shop.png',
        offsetY: 5,
        incomeAmount: 9,
        expenseAmount: 3,
        allowAdjacentPlacement: true,
        requires: {
            unemployedPopulation: 2
        }
    },
    woodcutter: { 
        name: 'Woodcutter',
        description: 'Chopping down trees and clearing paths',
        height: 20, 
        width: 1,
        cost: 170,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/woodcutter.png',
        offsetY: 7,
        expenseAmount: 0.5,
        requires: {
            unemployedPopulation: 1
        }
    },
    campfire: { 
        name: 'Campfire',
        description: 'Stories get taller as the fire burns brighter',
        height: 20, 
        width: 1,
        cost: 75,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/campfire.png',
        offsetY: 10,
        expenseAmount: 1,
        allowAdjacentPlacement: true
    },
    well: { 
        name: 'Well',
        description: 'Cool water, fresh rumors and a meeting point for everyone',
        height: 20, 
        width: 1,
        cost: 150,
        demolitionCostMultiplier: 0.5,
        sprite: 'sprites/well.png',
        offsetY: 4,
        expenseAmount: 1,
        allowAdjacentPlacement: true
    }
};

// Decoration data definitions
// To use a sprite, add a 'sprite' property with the path to your PNG or WebP file
//
// Properties:
//   - name: Display name shown in the UI
//   - cost: Purchase cost
//   - demolitionCostMultiplier: Multiplier for demolition cost (default: 0.5 = half price)
//   - sprite: Optional path to sprite file (PNG or WebP)
//   - offsetY: Vertical offset for sprite positioning (default: 0)
//   - allowAdjacentPlacement: If true, allows placing items of the same type/id next to each other (default: false)
//   - resource: Optional resource type that this decoration provides when harvested (e.g., "wood")
export const DECORATION_DATA = {
    tree: { 
        name: 'Tree',
        description: 'A tall, majestic tree that provides shade and wood. Can fall on itself but requires a woodcutter or timberman to remove',
        cost: 20,
        offsetY: -8,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        sprite: 'sprites/tree.png',
    },
    pine: { 
        name: 'Pine Tree',
        description: 'Smells like distant mountains and quiet snow. Can fall on itself but requires a woodcutter or timberman to remove',
        cost: 45,
        offsetY: -8,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        sprite: 'sprites/pine.png',
    },
    stump: { 
        name: 'Stump',
        description: 'A sad, dead tree that only creates problems. Requires a woodcutter or timberman to remove',
        cost: 5,
        offsetY: 5,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: false,
        sprite: 'sprites/stump.png',
    },
    roots: { 
        name: 'Roots',
        description: 'A bunch of roots that look like they couldn\'t be any more annoying. Requires a woodcutter or timberman to remove',
        cost: 5,
        offsetY: 9,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: false,
        sprite: 'sprites/roots.png',
    },
    rocks: { 
        name: 'Rocks',
        description: 'Hard, heavy and cool',
        cost: 20,
        offsetY: 8,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        sprite: 'sprites/rocks.png',
    },
    boulder: { 
        name: 'Boulder',
        description: 'Big and not very friendly',
        cost: 30,
        offsetY: 4,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        sprite: 'sprites/boulder.png',
    },
    bush: { 
        name: 'Bush',
        description: 'Small, leafy and suspiciously good at hiding things',
        cost: 15,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        offsetY: 5,
        sprite: 'sprites/bush.png'
    },
    lamp: { 
        name: 'Lamp',
        description: 'A warm glow, a cozy spot and stories that never end',
        cost: 75,
        demolitionCostMultiplier: 0.5,
        allowAdjacentPlacement: true,
        offsetY: 5,
        sprite: 'sprites/lamp.png'
    },
    bench: {
        name: 'Bench',
        description: 'Sit, sigh, chat and watch the village slowly grow',
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
//   - height: Road height in pixels (affects sprite scaling)
//   - cost: Purchase cost
//   - demolitionCostMultiplier: Multiplier for demolition cost (default: 0.5 = half price)
//   - sprite: Optional path to sprite file (PNG or WebP)
//   - offsetY: Vertical offset for sprite positioning (default: 10 for roads)
//   - allowAdjacentPlacement: If true, allows placing items of the same type/id next to each other (default: false)
export const ROAD_DATA = {
    dirt: { 
        name: 'Dirt',
        description: 'The first path every village draws with its footsteps',
        height: 17,
        cost: 10,
        demolitionCostMultiplier: 0.5,
        offsetY: 10,
        allowAdjacentPlacement: true,
        sprite: 'sprites/dirt.png'
    },
    gravel: { 
        name: 'Gravel',
        description: 'Crunchy steps and sturdy routes for busy feet',
        height: 17,
        cost: 20,
        demolitionCostMultiplier: 0.5,
        offsetY: 10,
        allowAdjacentPlacement: true,
        expenseAmount: 0.1,
        sprite: 'sprites/gravel.png'
    },
    stone: { 
        name: 'Stone',
        description: 'Grand roads for serious boots and serious business',
        height: 17,
        cost: 50,
        demolitionCostMultiplier: 0.5,
        offsetY: 10,
        allowAdjacentPlacement: true,
        expenseAmount: 0.3,
        sprite: 'sprites/stone.png'
    },
    planks: { 
        name: 'Planks',
        description: 'A creaky walkway that keeps feet dry and stories lively',
        height: 17,
        cost: 35,
        demolitionCostMultiplier: 0.5,
        offsetY: 10,
        allowAdjacentPlacement: true,
        expenseAmount: 0.3,
        sprite: 'sprites/planks.png'
    }
};