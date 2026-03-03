import * as THREE from 'three';
import { InputManager } from './game/InputManager';
import { CameraController } from './camera/CameraController';
import { Player } from './player/Player';
import { CombatSystem } from './combat/CombatSystem';
import { createTerrain } from './world/WorldMap';
import { ResourceSystem } from './world/ResourceNode';
import { ShelterSystem } from './world/Shelter';
import { HUD, type UpgradeDef } from './ui/HUD';
import { TouchControls } from './ui/TouchControls';
import type { ResourceType } from './world/ResourceNode';

// ---- Setup ----
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 40, 90);

// ---- Lighting ----
const ambientLight = new THREE.AmbientLight(0x8899bb, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 60;
sunLight.shadow.bias = -0.002;
scene.add(sunLight);

// Hemisphere light for natural outdoor feel
const hemiLight = new THREE.HemisphereLight(0x88aadd, 0x557733, 0.4);
scene.add(hemiLight);

// ---- World ----
createTerrain(scene);

// ---- Player ----
const player = new Player();
scene.add(player.group);

// ---- Camera ----
const cameraCtrl = new CameraController(window.innerWidth / window.innerHeight);

// ---- Input ----
const input = new InputManager();

// ---- Touch Controls (mobile) ----
new TouchControls(input);

// ---- Resources ----
const resources = new ResourceSystem(scene);
resources.spawnInitial();

// ---- Shelters ----
const shelters = new ShelterSystem(scene);
shelters.spawnShelters();

// ---- Combat ----
const combat = new CombatSystem(scene);

// ---- HUD ----
const hud = new HUD();
let kills = 0;

// ---- Upgrades ----
let swordDamageBonus = 0;
let arrowDamageBonus = 0;
let maxHealthBonus = 0;
let healAvailable = true;

function getUpgrades(): UpgradeDef[] {
  return [
    {
      id: 'sharpen',
      name: 'Sharpen Sword',
      description: '+5 sword damage',
      cost: { iron: 2, stone: 1 },
      applied: swordDamageBonus >= 10, // max 2 applications
    },
    {
      id: 'fletch',
      name: 'Better Arrows',
      description: '+5 arrow damage',
      cost: { wood: 3, iron: 1 },
      applied: arrowDamageBonus >= 10,
    },
    {
      id: 'reinforce',
      name: 'Reinforce Armor',
      description: '+25 max health',
      cost: { iron: 3, stone: 2 },
      applied: maxHealthBonus >= 50,
    },
    {
      id: 'heal',
      name: 'Rest & Heal',
      description: 'Restore full health',
      cost: { wood: 1 },
      applied: !healAvailable,
    },
  ];
}

function applyUpgrade(id: string): void {
  const inv = resources.inventory;

  const upgrade = getUpgrades().find(u => u.id === id);
  if (!upgrade || upgrade.applied) return;

  // Check cost
  for (const [res, amt] of Object.entries(upgrade.cost)) {
    if (inv[res as ResourceType] < (amt as number)) return;
  }

  // Deduct
  for (const [res, amt] of Object.entries(upgrade.cost)) {
    inv[res as ResourceType] -= amt as number;
  }

  // Apply effect
  switch (id) {
    case 'sharpen':
      swordDamageBonus += 5;
      combat.swordDamageBonus = swordDamageBonus;
      break;
    case 'fletch':
      arrowDamageBonus += 5;
      combat.arrowDamageBonus = arrowDamageBonus;
      break;
    case 'reinforce':
      maxHealthBonus += 25;
      player.maxHealth = 100 + maxHealthBonus;
      player.health = Math.min(player.health, player.maxHealth);
      hud.updateHealth(player.health, player.maxHealth);
      break;
    case 'heal':
      player.health = player.maxHealth;
      hud.updateHealth(player.health, player.maxHealth);
      healAvailable = false;
      // Restore heal after 60 seconds
      setTimeout(() => { healAvailable = true; }, 60000);
      break;
  }

  hud.updateResources(inv);
  // Re-render the upgrade panel
  hud.renderUpgrades(getUpgrades(), inv);
}

hud.onUpgrade = applyUpgrade;

// ---- Screen elements ----
const titleScreen = document.getElementById('title-screen')!;
const gameoverScreen = document.getElementById('gameover-screen')!;
const gameoverStats = document.getElementById('gameover-stats')!;
const hudEl = document.getElementById('hud')!;

// ---- Game state ----
type GameScreen = 'title' | 'playing' | 'gameover';
let screen: GameScreen = 'title';

resources.onCollect = () => {
  hud.updateResources(resources.inventory);
  hud.flashPickup();
  // Update shelter panel if visible
  if (shelters.playerInShelter) {
    hud.renderUpgrades(getUpgrades(), resources.inventory);
  }
};

shelters.onEnter = () => {
  hud.showShelterPanel(getUpgrades(), resources.inventory);
};

shelters.onExit = () => {
  hud.hideShelterPanel();
};

combat.onKill = () => {
  kills++;
  hud.updateKills(kills);
};

combat.onPlayerHit = (damage: number) => {
  if (screen !== 'playing') return;
  // Safe in shelter — no damage
  if (shelters.playerInShelter) return;

  player.takeDamage(damage);
  hud.updateHealth(player.health, player.maxHealth);
  hud.flashDamage();

  if (player.health <= 0) {
    showGameOver();
  }
};

// ---- Enemy Spawning ----
const SPAWN_RADIUS_MIN = 14;
const SPAWN_RADIUS_MAX = 30;
const MAX_ENEMIES = 8;
const SPAWN_INTERVAL = 4; // seconds
let spawnTimer = 2; // first spawn sooner

function spawnEnemyNearPlayer(): void {
  const angle = Math.random() * Math.PI * 2;
  const dist = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN);
  const pos = new THREE.Vector3(
    player.group.position.x + Math.cos(angle) * dist,
    0,
    player.group.position.z + Math.sin(angle) * dist
  );
  // Scale difficulty slightly with kills
  const health = 30 + Math.floor(kills / 3) * 5;
  combat.spawnEnemy(pos, health);
}

// ---- Shadow follow player ----
function updateSunTarget(): void {
  sunLight.target.position.copy(player.group.position);
  sunLight.position.set(
    player.group.position.x + 10,
    20,
    player.group.position.z + 10
  );
  sunLight.target.updateMatrixWorld();
}

// ---- Screen transitions ----
function startGame(): void {
  screen = 'playing';
  titleScreen.style.display = 'none';
  gameoverScreen.style.display = 'none';
  hudEl.style.display = '';
  resetGame();
}

function showGameOver(): void {
  screen = 'gameover';
  hud.hideShelterPanel();
  gameoverStats.textContent = `Enemies defeated: ${kills}`;
  gameoverScreen.style.display = 'flex';
}

function resetGame(): void {
  // Reset player
  player.health = 100;
  player.maxHealth = 100;
  player.group.position.set(0, 0, 0);
  player.group.rotation.set(0, 0, 0);

  // Clear all enemies and arrows
  for (const enemy of combat.enemies) {
    scene.remove(enemy.mesh);
  }
  for (const arrow of combat.arrows) {
    scene.remove(arrow.mesh);
  }
  combat.enemies.length = 0;
  combat.arrows.length = 0;
  combat.swordDamageBonus = 0;
  combat.arrowDamageBonus = 0;

  // Reset upgrades
  swordDamageBonus = 0;
  arrowDamageBonus = 0;
  maxHealthBonus = 0;
  healAvailable = true;

  // Reset resources
  resources.reset();

  // Reset shelters
  shelters.reset();
  hud.hideShelterPanel();

  // Reset counters
  kills = 0;
  spawnTimer = 2;
  hud.updateHealth(player.health, player.maxHealth);
  hud.updateKills(0);
  hud.updateResources(resources.inventory);
}

// ---- Button handlers ----
document.getElementById('start-btn')!.addEventListener('click', startGame);
document.getElementById('restart-btn')!.addEventListener('click', startGame);

// ---- Game Loop ----
let lastTime = performance.now();

function gameLoop(now: number): void {
  const dt = Math.min((now - lastTime) / 1000, 0.05); // cap delta for tab-away
  lastTime = now;

  if (screen === 'playing') {
    // Spawn enemies (not when player is in shelter)
    spawnTimer -= dt;
    if (spawnTimer <= 0 && combat.aliveEnemyCount < MAX_ENEMIES) {
      spawnEnemyNearPlayer();
      spawnTimer = SPAWN_INTERVAL;
    }

    // Update
    player.update(input, dt);
    combat.update(player, dt, shelters);
    resources.update(player.group.position, dt);
    shelters.update(player.group.position, dt);
  }

  cameraCtrl.update(player.group.position, dt);
  updateSunTarget();

  // End-of-frame
  input.endFrame();

  // Render
  renderer.render(scene, cameraCtrl.camera);
  requestAnimationFrame(gameLoop);
}

// ---- Resize ----
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  cameraCtrl.resize(window.innerWidth / window.innerHeight);
});

// ---- Start render loop (title screen is shown, game waits for click) ----
requestAnimationFrame(gameLoop);
