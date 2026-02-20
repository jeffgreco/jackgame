import * as THREE from 'three';

/**
 * Top-down camera that follows the player with a slight isometric angle.
 * Provides the "civ-style view" described in the design notes.
 */
export class CameraController {
  readonly camera: THREE.PerspectiveCamera;
  /** Offset from the player position. */
  private offset = new THREE.Vector3(0, 18, 12);
  private lerpFactor = 5;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 500);
    this.camera.position.set(0, 18, 12);
    this.camera.lookAt(0, 0, 0);
  }

  update(targetPos: THREE.Vector3, dt: number): void {
    const desired = new THREE.Vector3().copy(targetPos).add(this.offset);
    this.camera.position.lerp(desired, 1 - Math.exp(-this.lerpFactor * dt));
    this.camera.lookAt(targetPos);
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
