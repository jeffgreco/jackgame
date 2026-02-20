import * as THREE from 'three';

export type ResourceType = 'wood' | 'stone' | 'iron' | 'gold';

interface ResourceDef {
  color: number;
  emissive: number;
  emissiveIntensity: number;
  geometry: () => THREE.BufferGeometry;
  yOffset: number;
}

const RESOURCE_DEFS: Record<ResourceType, ResourceDef> = {
  wood: {
    color: 0x8B5E3C,
    emissive: 0x000000,
    emissiveIntensity: 0,
    geometry: () => new THREE.CylinderGeometry(0.12, 0.15, 0.5, 6),
    yOffset: 0.25,
  },
  stone: {
    color: 0x888888,
    emissive: 0x000000,
    emissiveIntensity: 0,
    geometry: () => new THREE.DodecahedronGeometry(0.25, 0),
    yOffset: 0.2,
  },
  iron: {
    color: 0x9999aa,
    emissive: 0x334455,
    emissiveIntensity: 0.2,
    geometry: () => new THREE.OctahedronGeometry(0.22, 0),
    yOffset: 0.25,
  },
  gold: {
    color: 0xddaa22,
    emissive: 0xffcc00,
    emissiveIntensity: 0.3,
    geometry: () => new THREE.OctahedronGeometry(0.2, 0),
    yOffset: 0.25,
  },
};

const PICKUP_RADIUS = 1.5;

export class ResourceNode {
  readonly mesh: THREE.Group;
  readonly type: ResourceType;
  collected = false;
  private bobPhase: number;

  constructor(type: ResourceType, position: THREE.Vector3) {
    this.type = type;
    this.bobPhase = Math.random() * Math.PI * 2;

    const def = RESOURCE_DEFS[type];
    this.mesh = new THREE.Group();

    // Resource object
    const obj = new THREE.Mesh(
      def.geometry(),
      new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.emissive,
        emissiveIntensity: def.emissiveIntensity,
        roughness: 0.6,
        metalness: type === 'iron' || type === 'gold' ? 0.6 : 0.1,
        flatShading: true,
      })
    );
    obj.position.y = def.yOffset;
    obj.castShadow = true;
    this.mesh.add(obj);

    // Glowing ring on ground
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.45, 16),
      new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.mesh.add(ring);

    this.mesh.position.copy(position);
  }

  update(dt: number): void {
    if (this.collected) return;
    this.bobPhase += dt * 3;
    // Gentle hover and spin
    this.mesh.children[0].position.y = RESOURCE_DEFS[this.type].yOffset + Math.sin(this.bobPhase) * 0.1;
    this.mesh.children[0].rotation.y += dt * 1.5;
  }

  isPlayerInRange(playerPos: THREE.Vector3): boolean {
    if (this.collected) return false;
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    return dx * dx + dz * dz < PICKUP_RADIUS * PICKUP_RADIUS;
  }
}

export class ResourceSystem {
  nodes: ResourceNode[] = [];
  inventory: Record<ResourceType, number> = { wood: 0, stone: 0, iron: 0, gold: 0 };
  private scene: THREE.Scene;
  onCollect?: (type: ResourceType) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnInitial(): void {
    const types: ResourceType[] = ['wood', 'stone', 'iron', 'gold'];
    // Weighted distribution: more wood/stone, less iron/gold
    const weights = [5, 4, 2, 1];
    const total = weights.reduce((a, b) => a + b, 0);

    for (let i = 0; i < 30; i++) {
      // Pick type by weight
      let r = Math.random() * total;
      let type: ResourceType = 'wood';
      for (let t = 0; t < types.length; t++) {
        r -= weights[t];
        if (r <= 0) { type = types[t]; break; }
      }

      // Place avoiding center spawn area
      let x: number, z: number;
      do {
        x = (Math.random() - 0.5) * 55;
        z = (Math.random() - 0.5) * 55;
      } while (Math.abs(x) < 4 && Math.abs(z) < 4);

      const node = new ResourceNode(type, new THREE.Vector3(x, 0, z));
      this.nodes.push(node);
      this.scene.add(node.mesh);
    }
  }

  update(playerPos: THREE.Vector3, dt: number): void {
    for (const node of this.nodes) {
      node.update(dt);

      if (node.isPlayerInRange(playerPos)) {
        node.collected = true;
        this.inventory[node.type]++;
        this.onCollect?.(node.type);
        // Collect animation: quick scale down
        this.animateCollect(node);
      }
    }
  }

  private animateCollect(node: ResourceNode): void {
    let t = 0;
    const tick = () => {
      t += 0.05;
      if (t >= 1) {
        this.scene.remove(node.mesh);
        return;
      }
      const s = 1 - t;
      node.mesh.scale.set(s, s, s);
      node.mesh.position.y += 0.08;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  reset(): void {
    for (const node of this.nodes) {
      this.scene.remove(node.mesh);
    }
    this.nodes.length = 0;
    this.inventory = { wood: 0, stone: 0, iron: 0, gold: 0 };
    this.spawnInitial();
  }
}
