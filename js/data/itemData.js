// Building data definitions
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
        demolitionCostMultiplier: 0.2,
        sprite: 'sprites/house1.png',
        offsetY: 0,
        population: 2,
        expenseAmount: 1.3
    },
    house2: { 
        name: 'Stone house',
        description: 'Solid walls, soft beds and gossip that lasts generations',
        height: 20, 
        width: 1,
        cost: 600,
        demolitionCostMultiplier: 0.3,
        sprite: 'sprites/house2.png',
        offsetY: 0,
        population: 4,
        expenseAmount: 2.2,
        requires: {
            population: 8,
        }
    },
    timberman: {
        name: 'Timberman',
        description: 'Turns trees into planks and planks into pure profit',
        height: 20,
        width: 1,
        cost: 1000,
        demolitionCostMultiplier: 0.3,
        incomeAmount: 14,
        expenseAmount: 5,
        sprite: 'sprites/timberman.png',
        offsetY: 0,
        requires: {
            population: 14,
            unemployedPopulation: 3,
        }
        // allows to remove trees, pine, stump, and roots from the map
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
            population: 24,
            unemployedPopulation: 4
        }
    },
    wheat: {
        name: 'Wheat',
        description: 'A humble patch of grain that keeps bellies and coffers full',
        height: 15,
        width: 1,
        cost: 110,
        demolitionCostMultiplier: 0.1,
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
        demolitionCostMultiplier: 0.2,
        sprite: 'sprites/shop.png',
        offsetY: 5,
        incomeAmount: 9,
        expenseAmount: 3,
        allowAdjacentPlacement: true,
        requires: {
            population: 8,
            unemployedPopulation: 2
        }
    },
    woodcutter: { 
        name: 'Woodcutter',
        description: 'Chopping down trees and clearing paths',
        height: 20, 
        width: 1,
        cost: 170,
        demolitionCostMultiplier: 0.1,
        sprite: 'sprites/woodcutter.png',
        offsetY: 7,
        expenseAmount: 0.3,
        requires: {
            unemployedPopulation: 1
        },
        // allows to remove trees, pine, stump, and roots, allows to place planks roads
    },
    stonecutter: { 
        name: 'Stonecutter',
        description: 'Removing stones and boulders',
        height: 20, 
        width: 1,
        cost: 200,
        demolitionCostMultiplier: 0.3,
        sprite: 'sprites/stonecutter.png',
        offsetY: -2,
        expenseAmount: 0.3,
        requires: {
            unemployedPopulation: 1
        },
        // allows to remove stones and boulders, allows to place gravel and stone roards
    },
    campfire: { 
        name: 'Campfire',
        description: 'Stories get taller as the fire burns brighter',
        height: 20, 
        width: 1,
        cost: 75,
        demolitionCostMultiplier: 0.1,
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
        demolitionCostMultiplier: 0.1,
        sprite: 'sprites/well.png',
        offsetY: 4,
        expenseAmount: 1,
        allowAdjacentPlacement: true
    }
};



export const DECORATION_DATA = {
    tree: { 
        name: 'Tree',
        description: 'A tall, majestic tree that provides shade and wood. Can fall on itself but requires a woodcutter or timberman to remove',
        hoverText: 'Needs proper tools to remove',
        cost: 20,
        offsetY: -8,
        demolitionCostMultiplier: 0.2,
        allowAdjacentPlacement: true,
        sprite: 'sprites/tree.png',
        // requires a woodcutter or timberman to remove
    },
    pine: { 
        name: 'Pine Tree',
        description: 'Smells like distant mountains and quiet snow. Can fall on itself but requires a woodcutter or timberman to remove',
        hoverText: 'Needs proper tools to remove',
        cost: 45,
        offsetY: -8,
        demolitionCostMultiplier: 0.2,
        allowAdjacentPlacement: true,
        sprite: 'sprites/pine.png',
        // requires a woodcutter or timberman to remove
    },
    stump: { 
        name: 'Stump',
        description: 'What’s left of an old tree. Requires a woodcutter or timberman to remove',
        hoverText: 'Needs proper tools to remove',
        cost: 5,
        offsetY: 5,
        demolitionCostMultiplier: 0.8,
        allowAdjacentPlacement: false,
        sprite: 'sprites/stump.png',
        // requires a woodcutter or timberman to remove
    },
    roots: { 
        name: 'Roots',
        description: 'Overgrown roots tangled in the soil. Requires a woodcutter or timberman to remove',
        hoverText: 'Needs proper tools to remove',
        cost: 5,
        offsetY: 9,
        demolitionCostMultiplier: 0.8,
        allowAdjacentPlacement: false,
        sprite: 'sprites/roots.png',
        // requires a woodcutter or timberman to remove
    },
    rocks: { 
        name: 'Rocks',
        description: 'Hard, heavy and cool. Requires a stonecutter to remove',
        hoverText: 'Needs proper tools to remove',
        cost: 20,
        offsetY: 8,
        demolitionCostMultiplier: 0.8,
        allowAdjacentPlacement: true,
        sprite: 'sprites/rocks.png',
    },
    boulder: { 
        name: 'Boulder',
        description: 'Big and not very friendly. Requires a stonecutter to remove',
        hoverText: 'Needs proper tools to remove',
        cost: 30,
        offsetY: 4,
        demolitionCostMultiplier: 0.8,
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
        demolitionCostMultiplier: 0.3,
        allowAdjacentPlacement: true,
        offsetY: 5,
        sprite: 'sprites/lamp.png'
    },
    bench: {
        name: 'Bench',
        description: 'Sit, sigh, chat and watch the village slowly grow',
        cost: 120,
        demolitionCostMultiplier: 0.3,
        allowAdjacentPlacement: true,
        offsetY: 5,
        sprite: 'sprites/bench.png'
    }
};



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
        sprite: 'sprites/gravel.png',
        requires: {
            building: 'stonecutter'
        }
    },
    stone: { 
        name: 'Stone',
        description: 'Grand roads for serious boots and serious business',
        height: 17,
        cost: 50,
        demolitionCostMultiplier: 0.3,
        offsetY: 10,
        allowAdjacentPlacement: true,
        expenseAmount: 0.3,
        sprite: 'sprites/stone.png',
        requires: {
            building: 'stonecutter'
        }
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
        sprite: 'sprites/planks.png',
        requires: {
            building: 'woodcutter'
        }
    }
};