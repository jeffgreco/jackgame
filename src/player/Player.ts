import * as THREE from 'three';
import { InputManager } from '../game/InputManager';
import { createPlayerModel, createSwordModel, createBowModel } from './PlayerRenderer';

const MOVE_SPEED = 6;
const SWORD_COOLDOWN = 0.4;
const SWORD_DURATION = 0.25;
const BOW_COOLDOWN = 0.6;

export class Player {
  readonly group: THREE.Group;
  private model: THREE.Group;
  private sword: THREE.Group;
  private bow: THREE.Group;

  health = 100;
  maxHealth = 100;
  readonly position: THREE.Vector3;
  /** Direction the player is facing (normalized XZ). */
  readonly facing = new THREE.Vector3(0, 0, -1);

  // Sword state
  private swordTimer = 0;
  private swordCooldown = 0;
  isSwinging = false;

  // Bow state
  private bowCooldown = 0;
  fireBow = false; // flag read by combat system to spawn arrow

  // Movement velocity for animation
  isMoving = false;
  private bobPhase = 0;

  constructor() {
    this.group = new THREE.Group();
    this.model = createPlayerModel();
    this.group.add(this.model);

    // Sword — attached to right side, hidden by default
    this.sword = createSwordModel();
    this.sword.position.set(0.65, 0.7, 0);
    this.sword.visible = false;
    this.group.add(this.sword);

    // Bow — attached to left side, always visible
    this.bow = createBowModel();
    this.bow.position.set(-0.65, 0.9, 0);
    this.bow.visible = true;
    this.group.add(this.bow);

    this.position = this.group.position;
  }

  update(input: InputManager, dt: number): void {
    this.updateMovement(input, dt);
    this.updateSword(input, dt);
    this.updateBow(input, dt);
    this.updateAnimation(dt);
  }

  private updateMovement(input: InputManager, dt: number): void {
    const dir = new THREE.Vector3();

    // Movement: Arrow keys or W/S/Q/E (A and B reserved for combat per design notes)
    if (input.isDown('w') || input.isDown('arrowup')) dir.z -= 1;
    if (input.isDown('s') || input.isDown('arrowdown')) dir.z += 1;
    if (input.isDown('q') || input.isDown('arrowleft')) dir.x -= 1;
    if (input.isDown('d') || input.isDown('e') || input.isDown('arrowright')) dir.x += 1;

    this.isMoving = dir.lengthSq() > 0;

    if (this.isMoving) {
      dir.normalize();
      this.facing.copy(dir);
      this.group.position.addScaledVector(dir, MOVE_SPEED * dt);

      // Rotate model to face movement direction
      const angle = Math.atan2(dir.x, dir.z);
      this.group.rotation.y = angle;
    }
  }

  private updateSword(input: InputManager, dt: number): void {
    this.swordCooldown = Math.max(0, this.swordCooldown - dt);

    if (input.wasPressed('a') && this.swordCooldown <= 0) {
      this.isSwinging = true;
      this.swordTimer = SWORD_DURATION;
      this.swordCooldown = SWORD_COOLDOWN;
      this.sword.visible = true;
    }

    if (this.swordTimer > 0) {
      this.swordTimer -= dt;
      // Swing animation: rotate sword forward
      const t = 1 - this.swordTimer / SWORD_DURATION;
      this.sword.rotation.z = -Math.PI * 0.5 + Math.sin(t * Math.PI) * Math.PI * 0.8;
    } else {
      this.isSwinging = false;
      this.sword.visible = false;
      this.sword.rotation.z = 0;
    }
  }

  private updateBow(input: InputManager, dt: number): void {
    this.bowCooldown = Math.max(0, this.bowCooldown - dt);
    this.fireBow = false;

    if (input.wasPressed('b') && this.bowCooldown <= 0) {
      this.fireBow = true;
      this.bowCooldown = BOW_COOLDOWN;
    }
  }

  private updateAnimation(dt: number): void {
    if (this.isMoving) {
      this.bobPhase += dt * 10;
      this.model.position.y = Math.sin(this.bobPhase) * 0.05;
    } else {
      this.model.position.y = 0;
      this.bobPhase = 0;
    }
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  /** World-space position of the sword hitbox center. */
  getSwordHitCenter(): THREE.Vector3 {
    const offset = this.facing.clone().multiplyScalar(1.0);
    return this.group.position.clone().add(offset);
  }
}
