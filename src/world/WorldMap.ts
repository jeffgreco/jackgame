import * as THREE from 'three';

/**
 * Creates the ground terrain for the starting region.
 * Flat grass plane with some visual variety.
 */
export function createTerrain(scene: THREE.Scene): void {
  // Main ground plane
  const groundGeom = new THREE.PlaneGeometry(80, 80, 40, 40);
  // Slight height variation for visual interest
  const posAttr = groundGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const noise = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.15
      + Math.sin(x * 0.7 + 1) * Math.cos(y * 0.5 + 2) * 0.08;
    posAttr.setZ(i, noise);
  }
  groundGeom.computeVertexNormals();

  const ground = new THREE.Mesh(
    groundGeom,
    new THREE.MeshStandardMaterial({
      color: 0x4a7a3b,
      roughness: 0.9,
      flatShading: true,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Decorative elements: rocks and trees
  addRocks(scene);
  addTrees(scene);
  addPath(scene);
}

function addRocks(scene: THREE.Scene): void {
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.8,
    flatShading: true,
  });

  for (let i = 0; i < 20; i++) {
    const size = 0.2 + Math.random() * 0.5;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(size, 0),
      rockMat
    );
    rock.position.set(
      (Math.random() - 0.5) * 60,
      size * 0.4,
      (Math.random() - 0.5) * 60
    );
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
}

function addTrees(scene: THREE.Scene): void {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6b1e, roughness: 0.8, flatShading: true });

  for (let i = 0; i < 25; i++) {
    const treeGroup = new THREE.Group();
    const height = 1.5 + Math.random() * 1.5;

    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, height, 6),
      trunkMat
    );
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Canopy (stacked cones for a pine-tree look)
    for (let j = 0; j < 3; j++) {
      const radius = 0.6 - j * 0.12;
      const coneHeight = 0.8 - j * 0.1;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(radius, coneHeight, 7),
        leafMat
      );
      cone.position.y = height + j * 0.45;
      cone.castShadow = true;
      treeGroup.add(cone);
    }

    // Place tree, avoid center area where player spawns
    let x: number, z: number;
    do {
      x = (Math.random() - 0.5) * 60;
      z = (Math.random() - 0.5) * 60;
    } while (Math.abs(x) < 5 && Math.abs(z) < 5);

    treeGroup.position.set(x, 0, z);
    treeGroup.rotation.y = Math.random() * Math.PI * 2;
    scene.add(treeGroup);
  }
}

function addPath(scene: THREE.Scene): void {
  // Simple dirt path from center outward
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 1 });
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 20),
    pathMat
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, -5);
  path.receiveShadow = true;
  scene.add(path);

  // Cross path
  const path2 = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 1.5),
    pathMat
  );
  path2.rotation.x = -Math.PI / 2;
  path2.position.set(3, 0.01, 2);
  path2.receiveShadow = true;
  scene.add(path2);
}
