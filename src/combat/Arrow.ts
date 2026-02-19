import * as THREE from 'three';

const ARROW_SPEED = 18;
const ARROW_MAX_DIST = 30;

export class Arrow {
  readonly mesh: THREE.Group;
  private direction: THREE.Vector3;
  private distanceTraveled = 0;
  isDone = false;

  constructor(origin: THREE.Vector3, direction: THREE.Vector3) {
    this.direction = direction.clone().normalize();
    this.mesh = new THREE.Group();

    // Arrow shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x8B5E3C })
    );
    shaft.rotation.x = Math.PI / 2;
    this.mesh.add(shaft);

    // Arrow head
    const head = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.12, 4),
      new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.7 })
    );
    head.rotation.x = -Math.PI / 2;
    head.position.z = -0.3;
    this.mesh.add(head);

    this.mesh.position.copy(origin);
    this.mesh.position.y = 0.8;

    // Orient arrow in travel direction
    const angle = Math.atan2(this.direction.x, this.direction.z);
    this.mesh.rotation.y = angle;
  }

  update(dt: number): void {
    const move = ARROW_SPEED * dt;
    this.mesh.position.addScaledVector(this.direction, move);
    this.distanceTraveled += move;
    if (this.distanceTraveled > ARROW_MAX_DIST) {
      this.isDone = true;
    }
  }
}
