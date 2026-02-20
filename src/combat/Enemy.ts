import * as THREE from 'three';

const ENEMY_SPEED = 2.5;
const ATTACK_RANGE = 1.3;
const ATTACK_COOLDOWN = 1.2;
const ATTACK_DAMAGE = 10;

export class Enemy {
  readonly mesh: THREE.Group;
  health: number;
  maxHealth: number;
  isDead = false;
  private attackCooldown = 0;
  private bobPhase = Math.random() * Math.PI * 2;
  private bodyMesh: THREE.Mesh;
  private healthBarFill: THREE.Mesh;

  constructor(position: THREE.Vector3, health = 30) {
    this.health = health;
    this.maxHealth = health;
    this.mesh = new THREE.Group();

    // Enemy body — dark hostile look
    this.bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.8, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x553333, roughness: 0.6 })
    );
    this.bodyMesh.position.y = 0.5;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x442222, roughness: 0.6 })
    );
    head.position.y = 1.15;
    head.castShadow = true;
    this.mesh.add(head);

    // Eyes (red, menacing)
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.06, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.5 })
      );
      eye.position.set(side * 0.12, 1.2, 0.24);
      this.mesh.add(eye);
    }

    // Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.4, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x443333 })
      );
      leg.position.set(side * 0.15, 0.2, 0);
      this.mesh.add(leg);
    }

    // Health bar background
    const healthBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide })
    );
    healthBarBg.position.set(0, 1.65, 0);
    this.mesh.add(healthBarBg);

    // Health bar fill
    this.healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.76, 0.07),
      new THREE.MeshBasicMaterial({ color: 0xcc3333, side: THREE.DoubleSide })
    );
    this.healthBarFill.position.set(0, 1.65, 0.01);
    this.mesh.add(this.healthBarFill);

    this.mesh.position.copy(position);
  }

  update(playerPos: THREE.Vector3, dt: number): { didAttack: boolean } {
    if (this.isDead) return { didAttack: false };

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    let didAttack = false;

    if (dist > ATTACK_RANGE) {
      // Move toward player
      const dir = toPlayer.normalize();
      this.mesh.position.addScaledVector(dir, ENEMY_SPEED * dt);
      // Face player
      const angle = Math.atan2(dir.x, dir.z);
      this.mesh.rotation.y = angle;
    } else if (this.attackCooldown <= 0) {
      // Attack
      didAttack = true;
      this.attackCooldown = ATTACK_COOLDOWN;
    }

    // Bob animation
    this.bobPhase += dt * 6;
    this.bodyMesh.position.y = 0.5 + Math.sin(this.bobPhase) * 0.04;

    // Update health bar
    const healthFrac = this.health / this.maxHealth;
    this.healthBarFill.scale.x = Math.max(0, healthFrac);
    this.healthBarFill.position.x = -(1 - healthFrac) * 0.38;

    // Make health bar face camera (billboard)
    // We'll do a simple Y-rotation reset
    this.healthBarFill.parent!.children.forEach(c => {
      if (c === this.healthBarFill || (c.position.y > 1.6 && c.position.y < 1.7)) {
        // Will be billboarded in the render loop
      }
    });

    return { didAttack };
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    // Flash red
    const mat = this.bodyMesh.material as THREE.MeshStandardMaterial;
    mat.emissive.set(0xff0000);
    mat.emissiveIntensity = 0.8;
    setTimeout(() => {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }, 100);

    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  static ATTACK_DAMAGE = ATTACK_DAMAGE;
}
