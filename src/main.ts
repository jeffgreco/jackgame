import * as THREE from 'three';
import { InputManager } from './game/InputManager';
import { CameraController } from './camera/CameraController';
import { Player } from './player/Player';
import { CombatSystem } from './combat/CombatSystem';
import { createTerrain } from './world/WorldMap';
import { HUD } from './ui/HUD';

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
scene.fog = new THREE.Fog(0x87CEEB, 30, 60);

// ---- Lighting ----
const ambientLight = new THREE.AmbientLight(0x8899bb, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -25;
sunLight.shadow.camera.right = 25;
sunLight.shadow.camera.top = 25;
sunLight.shadow.camera.bottom = -25;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 50;
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

// ---- Combat ----
const combat = new CombatSystem(scene);

// ---- HUD ----
const hud = new HUD();
let kills = 0;

combat.onKill = () => {
  kills++;
  hud.updateKills(kills);
};

combat.onPlayerHit = (damage: number) => {
  player.takeDamage(damage);
  hud.updateHealth(player.health, player.maxHealth);
  hud.flashDamage();
};

// ---- Enemy Spawning ----
const SPAWN_RADIUS_MIN = 12;
const SPAWN_RADIUS_MAX = 25;
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

// ---- Game Loop ----
let lastTime = performance.now();

function gameLoop(now: number): void {
  const dt = Math.min((now - lastTime) / 1000, 0.05); // cap delta for tab-away
  lastTime = now;

  // Spawn enemies
  spawnTimer -= dt;
  if (spawnTimer <= 0 && combat.aliveEnemyCount < MAX_ENEMIES) {
    spawnEnemyNearPlayer();
    spawnTimer = SPAWN_INTERVAL;
  }

  // Update
  player.update(input, dt);
  combat.update(player, dt);
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

// ---- Start ----
hud.updateHealth(player.health, player.maxHealth);
hud.updateKills(0);
requestAnimationFrame(gameLoop);
