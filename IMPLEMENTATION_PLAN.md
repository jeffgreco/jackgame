# Castles and Kings - Browser Implementation Plan

## Overview

A browser-based 3D action/exploration game built with Three.js. The player controls Bob, a knight from Featherhood village, on a quest to save the king. The game combines a top-down exploration view with Minecraft Dungeons-style combat encounters.

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| 3D Engine | **Three.js** | Mature, well-documented, large ecosystem. Handles the 3D rendering the notes call for. |
| Physics | **Cannon-es** | Lightweight physics for combat and collision detection |
| UI/HUD | **HTML/CSS overlays** | Health bars, inventory, menus rendered as DOM elements over the canvas |
| State Management | **Plain JS modules** | No framework needed; game state is managed in a simple store pattern |
| Asset Pipeline | **GLTF/GLB models** | Standard format for web 3D. Can use free assets initially, replace later. |
| Build Tool | **Vite** | Fast dev server with hot reload, handles JS modules and asset imports |
| Language | **TypeScript** | Catches bugs early in a project with complex game state |

## Architecture

```
src/
  main.ts              # Entry point, game loop setup
  game/
    Game.ts            # Top-level game orchestrator (init, update, render loop)
    GameState.ts       # Central state: player stats, unlocks, world progress
    InputManager.ts    # Keyboard/mouse/touch input handling (A=sword, B=bow)
  world/
    WorldMap.ts        # Top-down overworld with regions, castles, Featherhood village
    Region.ts          # Individual explorable area (terrain, resources, enemies)
    Castle.ts          # Castle structure and associated battle encounter
    ResourceNode.ts    # Collectible resources scattered in the land
  player/
    Player.ts          # Bob: position, health, inventory, equipped weapon
    PlayerController.ts# Movement and camera follow logic
    PlayerRenderer.ts  # 3D model, animations, skin system
    Skins.ts           # Unlockable skin definitions and unlock conditions
  combat/
    CombatSystem.ts    # Battle state machine (enter battle, fight, victory/defeat)
    MeleeAttack.ts     # Sword (A key) attack logic and hitbox
    RangedAttack.ts    # Bow (B key) projectile logic
    Enemy.ts           # Base enemy class (health, AI, attack patterns)
    EnemyTypes.ts      # Specific enemy definitions per region/castle
  camera/
    CameraController.ts# Top-down camera with zoom, follows player, adjusts for combat
  ui/
    HUD.ts             # Health, equipped weapon, resource counts
    Menu.ts            # Main menu, pause, settings
    SkinSelector.ts    # View and equip unlocked skins
    WorldMapUI.ts      # Shows unlocked regions and castles
  assets/
    models/            # GLTF/GLB 3D models
    textures/          # Terrain, character textures
    audio/             # Sound effects and music
  utils/
    AssetLoader.ts     # Preloads models, textures, audio
    MathUtils.ts       # Common vector/collision helpers
index.html             # Single HTML page host
```

## Phase 1 - Playable Prototype

**Goal:** Bob walks around a single region, swings a sword, shoots a bow, and fights basic enemies.

### 1.1 Project Scaffold
- Initialize Vite + TypeScript project
- Set up Three.js scene, camera (top-down perspective), renderer
- Create the game loop (`requestAnimationFrame` with fixed timestep)
- Render a flat ground plane with a grid texture

### 1.2 Player Character
- Load or procedurally generate a knight model (box geometry placeholder is fine)
  - Armor body, helmet with **red feather** on top
- WASD movement on the ground plane
- Camera follows player from above (isometric-ish angle, ~60 degrees)
- Smooth camera tracking

### 1.3 Combat - Sword (A key)
- Press A to swing sword
- Melee hitbox in front of player for a short duration
- Simple swing animation (rotate sword model)
- Enemies in hitbox take damage

### 1.4 Combat - Bow (B key)
- Press B to fire an arrow projectile
- Arrow travels in the direction the player faces
- Arrow collides with enemies, deals damage, then despawns
- Short cooldown between shots

### 1.5 Basic Enemies
- Simple enemy type: walks toward player, attacks on contact
- Health bar above enemy
- Drops nothing yet (just disappears on death)
- Spawn a few on the map for testing

### 1.6 Player HUD
- Health bar (HTML overlay, top-left)
- Current weapon indicator (sword/bow)
- Simple damage flash when hit

**Phase 1 deliverable:** A page you can open in a browser where Bob runs around and fights enemies with sword and bow.

---

## Phase 2 - World and Exploration

**Goal:** Multiple regions with terrain variety, resources, and a world map.

### 2.1 Terrain System
- Chunked terrain with height variation (low-poly style)
- Different biomes per region: grass, forest, desert, snow
- Simple ground textures or vertex coloring

### 2.2 Featherhood Village (Starting Area)
- Small village hub: a few buildings, NPCs (non-interactive initially)
- Player spawns here on game start
- Acts as safe zone (no enemies)

### 2.3 Resource System
- Resource nodes on the map: wood, stone, iron, gold
- Player walks up and presses interact key to collect
- Resources stored in inventory (simple count display in HUD)
- Resources used later for upgrades (Phase 4)

### 2.4 World Map / Region Unlocking
- World divided into regions, each containing one castle
- Initially only Featherhood village region is unlocked
- Defeating a castle's enemies unlocks adjacent regions
- World map UI shows locked/unlocked regions

### 2.5 Region Transitions
- Walk to edge of region to move to the next (if unlocked)
- Loading screen or fade transition between regions

---

## Phase 3 - Castles and Battles

**Goal:** Castle encounters with structured battles (Minecraft Dungeons feel).

### 3.1 Castle Structures
- Each region has a castle: a 3D structure the player can enter
- Entering a castle triggers a battle encounter

### 3.2 Battle Encounters
- Wave-based combat inside castle areas
- Multiple enemy types per castle (melee, ranged, heavy)
- Increasing difficulty per castle
- Victory condition: clear all waves

### 3.3 Enemy Variety
- Melee grunt: charges at player
- Archer: keeps distance, fires arrows
- Heavy: slow, high HP, strong attacks
- Each castle has a themed enemy set

### 3.4 Battle Rewards
- Defeating a castle grants: skin unlock, world expansion, resources
- Victory screen showing rewards

### 3.5 Boss Encounters (optional stretch)
- Final wave of each castle has a boss enemy
- Unique attack patterns per boss

---

## Phase 4 - Progression and Polish

**Goal:** Skin system, upgrades, save/load, and visual polish.

### 4.1 Skin System
- Skins unlocked by completing battles (as notes specify)
- Skin selector UI in menu or at Featherhood village
- Skins change player model appearance (color variations, armor styles)
- Track battle completion per castle

### 4.2 Save System
- Save game state to `localStorage`
- Auto-save on region transitions and battle victories
- Load on game start if save exists
- Save data: unlocked regions, skins, resources, player stats

### 4.3 Player Upgrades
- Spend resources to upgrade: health, sword damage, bow damage, move speed
- Upgrade NPC or station in Featherhood village

### 4.4 Visual Polish
- Particle effects: sword slash, arrow trail, enemy death
- Simple lighting: directional sun + ambient
- Shadow maps for player and enemies
- Minimap in corner showing nearby area

### 4.5 Audio
- Background music per region type
- Combat sounds: sword swing, bow fire, arrow impact, enemy hit/death
- UI sounds: menu click, item pickup

---

## Phase 5 - The King

**Goal:** Endgame content - the quest to save the king.

### 5.1 Final Castle
- Last region contains the king's castle
- Multi-stage battle with the strongest enemies
- Rescuing the king is the win condition

### 5.2 Story Beats
- Brief text/dialogue at key moments:
  - Game start: Bob leaves Featherhood village to save the king
  - Each castle: clue about the king's location
  - Final castle: rescue and victory

### 5.3 End Screen
- Victory screen with stats: battles won, skins unlocked, time played
- Option to continue exploring or start new game

---

## Immediate Next Steps

To start Phase 1.1 (Project Scaffold):

1. `npm create vite@latest . -- --template vanilla-ts`
2. `npm install three @types/three`
3. `npm install cannon-es` (can defer to Phase 1.5)
4. Set up `src/main.ts` with Three.js scene, top-down camera, ground plane
5. Get the game loop running with a placeholder cube as the player
6. Verify it renders in browser at `localhost:5173`

## Key Design Decisions

- **Why Three.js over a game engine (Babylon, PlayCanvas, Phaser)?** Three.js gives full control without engine lock-in. The game's scope doesn't need a full engine's scene editor or built-in physics pipeline. Lighter bundle size for browser delivery.
- **Why top-down 3D instead of pure 2D?** The notes specifically call for 3D and Minecraft Dungeons-style combat. A top-down 3D camera achieves both the "civ style view" for exploration and the depth needed for combat.
- **Placeholder art first.** Use colored box geometries and simple shapes initially. Replace with proper GLTF models when gameplay is solid. This avoids blocking development on art assets.
- **TypeScript from the start.** Game state gets complex fast. Type safety prevents entire categories of bugs around player stats, inventory, and unlock tracking.
