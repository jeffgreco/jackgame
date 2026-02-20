import * as THREE from 'three';
import { Player } from '../player/Player';
import { Enemy } from './Enemy';
import { Arrow } from './Arrow';

const SWORD_HIT_RADIUS = 1.2;
const SWORD_DAMAGE = 15;
const ARROW_HIT_RADIUS = 0.5;
const ARROW_DAMAGE = 20;

export class CombatSystem {
  enemies: Enemy[] = [];
  arrows: Arrow[] = [];
  private scene: THREE.Scene;
  onKill?: () => void;
  onPlayerHit?: (damage: number) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnEnemy(position: THREE.Vector3, health?: number): void {
    const enemy = new Enemy(position, health);
    this.enemies.push(enemy);
    this.scene.add(enemy.mesh);
  }

  update(player: Player, dt: number): void {
    // Fire bow
    if (player.fireBow) {
      const arrow = new Arrow(
        player.group.position.clone(),
        player.facing.clone()
      );
      this.arrows.push(arrow);
      this.scene.add(arrow.mesh);
    }

    // Update arrows
    for (const arrow of this.arrows) {
      arrow.update(dt);
      // Check arrow vs enemies
      if (!arrow.isDone) {
        for (const enemy of this.enemies) {
          if (enemy.isDead) continue;
          const dist = arrow.mesh.position.distanceTo(enemy.mesh.position);
          if (dist < ARROW_HIT_RADIUS) {
            enemy.takeDamage(ARROW_DAMAGE);
            arrow.isDone = true;
            if (enemy.isDead) this.onKill?.();
            break;
          }
        }
      }
    }

    // Remove dead arrows
    this.arrows = this.arrows.filter(a => {
      if (a.isDone) {
        this.scene.remove(a.mesh);
        return false;
      }
      return true;
    });

    // Sword hit detection (only on frames where swing is active)
    if (player.isSwinging) {
      const hitCenter = player.getSwordHitCenter();
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dist = hitCenter.distanceTo(enemy.mesh.position);
        if (dist < SWORD_HIT_RADIUS) {
          enemy.takeDamage(SWORD_DAMAGE);
          if (enemy.isDead) this.onKill?.();
        }
      }
    }

    // Update enemies and check their attacks
    for (const enemy of this.enemies) {
      const result = enemy.update(player.group.position, dt);
      if (result.didAttack) {
        this.onPlayerHit?.(Enemy.ATTACK_DAMAGE);
      }
    }

    // Remove dead enemies (after a brief delay for visual feedback)
    this.enemies = this.enemies.filter(e => {
      if (e.isDead && e.health <= -100) {
        // Already cleaned up
        return false;
      }
      if (e.isDead) {
        // Shrink and remove
        e.mesh.scale.multiplyScalar(0.9);
        if (e.mesh.scale.x < 0.05) {
          this.scene.remove(e.mesh);
          e.health = -101; // mark for removal
          return false;
        }
      }
      return true;
    });
  }

  get aliveEnemyCount(): number {
    return this.enemies.filter(e => !e.isDead).length;
  }
}
