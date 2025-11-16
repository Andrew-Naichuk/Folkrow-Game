# Folkrow - Village Building Game

## 🎮 About the Game

A simple isometric village builder where you design and manage your own thriving settlement. Build houses, create infrastructure, manage your economy, and watch your villagers come to life as they walk the streets of your creation. Folkrow is a browser-based village building game built with vanilla JavaScript and HTML5 Canvas. Create your dream village by placing buildings, decorating the landscape, and connecting everything with roads. Manage your budget, grow your population, and unlock new buildings as your village expands.

![Folkrow Game](https://img.shields.io/badge/Status-Playable-brightgreen) ![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-blue)

### Key Features

- **🏗️ Building System**: Construct various buildings including houses, shops, workshops, and more
- **🛣️ Road Network**: Build roads to connect your village
- **🌳 Dynamic Environment**: Watch as trees naturally spawn and disappear over time
- **👥 Population Management**: Houses add villagers to your population, and buildings require workers
- **💰 Economic System**: Manage income and expenses - some buildings generate money, others require maintenance
- **🚶 Living Villagers**: Watch villagers walk around your roads
- **🎨 Beautiful Isometric Graphics**: Minimalistic style with little of animations
- **💾 Auto-Save**: Your progress is automatically saved to your browser

## 🎯 How to Play

### Getting Started

1. **Open the Game**: Simply open `https://folkrow.net` in a modern web browser
2. **Start Building**: Click on a building in the sidebar to select it, then click on the map to place it
3. **Build Roads First**: Most buildings require a nearby road to be placed
4. **Manage Your Budget**: Watch your income and expenses in the stats panel
5. **Grow Your Village**: Build houses to increase population, then use that population to unlock advanced buildings

### Controls

- **Mouse**: Click to place selected items, click again to place
- **Arrow Keys / WASD / mouse**: Pan the camera around the map
- **R Key**: Rotate selected building (if supported)

### Game Mechanics

#### Buildings

- **Houses**: Add population to your village
  - Basic House: Houses 2 villagers, costs ⍱300
  - Stone House: Houses 4 villagers, costs ⍱600, requires 10 population

- **Income Buildings**: Generate money over time
  - Shop: ⍱9 income, requires 2 workers
  - Wheat Field: ⍱3 income, requires 1 worker
  - Timberman: ⍱14 income, requires 3 workers, unlocks at 20 population
  - Blacksmith: ⍱26 income, requires 4 workers, unlocks at 40 population

- **Utility Buildings**:
  - Woodcutter: Required to remove trees, stumps, and roots
  - Well: Decorative water source
  - Campfire: Cozy gathering spot

#### Roads

Build roads to connect your village. Buildings must be placed within 1 tile of a road.

- **Dirt**: Basic road, costs ⍱10
- **Gravel**: Sturdier road, costs ⍱20, maintenance ⍱0.1/interval
- **Stone**: Grand road, costs ⍱50, maintenance ⍱0.3/interval
- **Planks**: Wooden walkway, costs ⍱35, maintenance ⍱0.3/interval

#### Economy

- **Starting Budget**: ⍱800, very little, so plan carefuly
- **Income Generation**: Every interval income-generating buildings produce money
- **Expenses**: Buildings and roads may have maintenance costs deducted each interval
- **Demolition**: Removing items costs a portion of the original purchase price

#### Population & Workers

- **Population**: Grows when you build houses
- **Unemployed**: Villagers not assigned to work buildings
- **Workers**: Required by many buildings - they convert unemployed villagers into workers
- **Villager Visualization**: Unemployed villagers appear walking on your roads

#### Requirements System

Many buildings have requirements that must be met before placement:
- **Population**: Minimum total population needed
- **Workers**: Minimum unemployed villagers available
- **Budget**: Sufficient funds

Hover over any building in the sidebar to see its requirements, costs, and stats.

## 🏗️ Building Types

### Buildings
- Basic House, Stone House
- Shop, Wheat Field
- Timberman, Blacksmith
- Woodcutter, Well, Campfire

### Decorations
- Trees (Tree, Pine)
- Rocks & Boulders
- Bushes, Stumps, Roots
- Lamps, Benches

### Roads
- Dirt, Gravel, Stone, Planks

## 🛠️ Technical Details

### Built With

- **Vanilla JavaScript**
- **HTML5 Canvas** for rendering
- **CSS3** for UI styling
- **LocalStorage** for game state persistence

## 📝 License

<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://folkrow.net">Folkrow</a> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://naich.uk">Andrii Naichuk</a> is licensed under <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC-SA 4.0</a></p>

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-nc-sa/4.0/).

- Website: [naich.uk](https://naich.uk)
- Game: [folkrow.net](https://folkrow.net)

---

**Enjoy building your village!** 🏘️✨
