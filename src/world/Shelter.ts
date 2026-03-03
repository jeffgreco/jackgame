import * as THREE from 'three';
import type { ResourceType } from './ResourceNode';

export interface ShelterUpgrade {
  name: string;
  description: string;
  cost: Partial<Record<ResourceType, number>>;
  applied: boolean;
  effect: () => void;
}

const ENTRY_RADIUS = 3.0;

export class Shelter {
  readonly group: THREE.Group;
  readonly position: THREE.Vector3;
  private glowRing: THREE.Mesh;
  private glowPhase = 0;

  constructor(position: THREE.Vector3) {
    this.position = position.clone();
    this.group = new THREE.Group();

    this.buildStructure();
    this.glowRing = this.buildEntryGlow();

    this.group.position.copy(position);
  }

  private buildStructure(): void {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x9a7b5a,
      roughness: 0.85,
      flatShading: true,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x8b3a3a,
      roughness: 0.7,
      flatShading: true,
    });
    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x5a3a1a,
      roughness: 0.9,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x7a6a4a,
      roughness: 1,
    });

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.03;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2.5, 0.2),
      wallMat
    );
    backWall.position.set(0, 1.25, -2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.group.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2.5, 4),
      wallMat
    );
    leftWall.position.set(-2, 1.25, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2.5, 4),
      wallMat
    );
    rightWall.position.set(2, 1.25, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // Front wall left half (doorway gap)
    const frontLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.5, 0.2),
      wallMat
    );
    frontLeft.position.set(-1.4, 1.25, 2);
    frontLeft.castShadow = true;
    this.group.add(frontLeft);

    // Front wall right half
    const frontRight = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.5, 0.2),
      wallMat
    );
    frontRight.position.set(1.4, 1.25, 2);
    frontRight.castShadow = true;
    this.group.add(frontRight);

    // Lintel above door
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.3, 0.25),
      darkWoodMat
    );
    lintel.position.set(0, 2.2, 2);
    lintel.castShadow = true;
    this.group.add(lintel);

    // Roof (pyramid shape using a cone)
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.4, 1.8, 4),
      roofMat
    );
    roof.position.y = 3.4;
    roof.rotation.y = Math.PI / 4; // align square base with walls
    roof.castShadow = true;
    this.group.add(roof);

    // Corner posts (dark wood)
    for (const cx of [-1.9, 1.9]) {
      for (const cz of [-1.9, 1.9]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 2.6, 0.15),
          darkWoodMat
        );
        post.position.set(cx, 1.3, cz);
        post.castShadow = true;
        this.group.add(post);
      }
    }

    // Interior: workbench
    const benchTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.1, 0.6),
      darkWoodMat
    );
    benchTop.position.set(-0.8, 0.75, -1.3);
    this.group.add(benchTop);

    // Bench legs
    for (const lx of [-1.35, -0.25]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.75, 0.08),
        darkWoodMat
      );
      leg.position.set(lx, 0.375, -1.3);
      this.group.add(leg);
    }

    // Interior: fire pit (glowing)
    const firePit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.1, 8),
      new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 1,
      })
    );
    firePit.position.set(0.5, 0.05, -0.5);
    this.group.add(firePit);

    // Fire glow
    const fireGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 6),
      new THREE.MeshStandardMaterial({
        color: 0xff6622,
        emissive: 0xff4400,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.8,
      })
    );
    fireGlow.position.set(0.5, 0.25, -0.5);
    this.group.add(fireGlow);

    // Small point light inside
    const fireLight = new THREE.PointLight(0xff6633, 0.6, 6);
    fireLight.position.set(0.5, 0.5, -0.5);
    this.group.add(fireLight);
  }

  private buildEntryGlow(): THREE.Mesh {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.6, 24),
      new THREE.MeshBasicMaterial({
        color: 0x66aaff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.group.add(ring);
    return ring;
  }

  update(dt: number): void {
    this.glowPhase += dt * 2;
    const mat = this.glowRing.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.15 + Math.sin(this.glowPhase) * 0.08;
  }

  isPlayerInside(playerPos: THREE.Vector3): boolean {
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    return dx * dx + dz * dz < ENTRY_RADIUS * ENTRY_RADIUS;
  }
}

export class ShelterSystem {
  shelters: Shelter[] = [];
  playerInShelter = false;
  private scene: THREE.Scene;
  onEnter?: () => void;
  onExit?: () => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /** Place shelters at fixed strategic positions across the map. */
  spawnShelters(): void {
    const positions = [
      new THREE.Vector3(15, 0, -12),
      new THREE.Vector3(-18, 0, 14),
      new THREE.Vector3(-20, 0, -22),
      new THREE.Vector3(25, 0, 18),
    ];

    for (const pos of positions) {
      const shelter = new Shelter(pos);
      this.shelters.push(shelter);
      this.scene.add(shelter.group);
    }
  }

  update(playerPos: THREE.Vector3, dt: number): void {
    let inside = false;
    for (const s of this.shelters) {
      s.update(dt);
      if (s.isPlayerInside(playerPos)) {
        inside = true;
      }
    }

    if (inside && !this.playerInShelter) {
      this.playerInShelter = true;
      this.onEnter?.();
    } else if (!inside && this.playerInShelter) {
      this.playerInShelter = false;
      this.onExit?.();
    }
  }

  reset(): void {
    for (const s of this.shelters) {
      this.scene.remove(s.group);
    }
    this.shelters.length = 0;
    this.playerInShelter = false;
    this.spawnShelters();
  }
}
