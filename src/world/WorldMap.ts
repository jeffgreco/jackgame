import * as THREE from 'three';

// ---- Noise helper (simple multi-octave value noise) ----
function hash(x: number, y: number): number {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x: number, y: number, octaves = 4): number {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2;
  }
  return val;
}

// ---- Terrain biome coloring ----
function biomeColor(x: number, z: number): THREE.Color {
  const dist = Math.sqrt(x * x + z * z);

  // Base grass
  const base = new THREE.Color(0x4a7a3b);
  // Darker forest green at edges
  const forest = new THREE.Color(0x2d5a22);
  // Sandy near paths
  const sandy = new THREE.Color(0x8a7a55);
  // Rocky patches
  const rocky = new THREE.Color(0x6a6a5a);

  // Noise-driven patches
  const n1 = fbm(x * 0.08, z * 0.08, 3);
  const n2 = fbm(x * 0.05 + 50, z * 0.05 + 50, 2);

  const result = base.clone();

  // Blend toward forest at distance
  const edgeFactor = Math.min(1, Math.max(0, (dist - 20) / 40));
  result.lerp(forest, edgeFactor * 0.6);

  // Rocky patches
  if (n1 > 0.6) {
    result.lerp(rocky, (n1 - 0.6) * 2.5);
  }

  // Sandy patches
  if (n2 > 0.65) {
    result.lerp(sandy, (n2 - 0.65) * 2.8);
  }

  // Slight random variation
  const variation = (hash(x * 3.7, z * 3.7) - 0.5) * 0.08;
  result.r = Math.max(0, Math.min(1, result.r + variation));
  result.g = Math.max(0, Math.min(1, result.g + variation));
  result.b = Math.max(0, Math.min(1, result.b + variation));

  return result;
}

/**
 * Creates the ground terrain — larger, more varied, with vertex colors.
 */
export function createTerrain(scene: THREE.Scene): void {
  const SIZE = 160;
  const SEGMENTS = 80;
  const groundGeom = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
  const posAttr = groundGeom.attributes.position;

  // Height variation using fbm
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);

    // Multi-scale hills
    const height = fbm(x * 0.04, y * 0.04, 4) * 1.2
      + fbm(x * 0.1, y * 0.1, 2) * 0.3
      - 0.4; // slight sink so center is near 0

    // Flatten center spawn area
    const dist = Math.sqrt(x * x + y * y);
    const flattenFactor = Math.max(0, 1 - dist / 8);
    const finalHeight = height * (1 - flattenFactor);

    posAttr.setZ(i, finalHeight);
  }
  groundGeom.computeVertexNormals();

  // Vertex colors for biome variety
  const colors = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const c = biomeColor(x, y);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  groundGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const ground = new THREE.Mesh(
    groundGeom,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      flatShading: true,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Decorative elements
  addRocks(scene);
  addTrees(scene);
  addPaths(scene);
  addGrass(scene);
}

function addRocks(scene: THREE.Scene): void {
  const rockMats = [
    new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x6a6a5a, roughness: 0.9, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.7, flatShading: true }),
  ];

  for (let i = 0; i < 50; i++) {
    const size = 0.2 + Math.random() * 0.6;
    const mat = rockMats[Math.floor(Math.random() * rockMats.length)];
    const geom = Math.random() > 0.5
      ? new THREE.DodecahedronGeometry(size, 0)
      : new THREE.IcosahedronGeometry(size, 0);
    const rock = new THREE.Mesh(geom, mat);
    rock.position.set(
      (Math.random() - 0.5) * 120,
      size * 0.3,
      (Math.random() - 0.5) * 120
    );
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.set(1, 0.6 + Math.random() * 0.4, 1); // squish some rocks flat
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }

  // A few large boulders
  for (let i = 0; i < 8; i++) {
    const size = 0.8 + Math.random() * 1.0;
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(size, 1),
      rockMats[0]
    );
    let x: number, z: number;
    do {
      x = (Math.random() - 0.5) * 100;
      z = (Math.random() - 0.5) * 100;
    } while (Math.abs(x) < 8 && Math.abs(z) < 8);
    boulder.position.set(x, size * 0.35, z);
    boulder.rotation.set(Math.random(), Math.random(), Math.random());
    boulder.scale.y = 0.5 + Math.random() * 0.3;
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    scene.add(boulder);
  }
}

function addTrees(scene: THREE.Scene): void {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x2d6b1e, roughness: 0.8, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x3a7a28, roughness: 0.8, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x226618, roughness: 0.8, flatShading: true }),
  ];

  for (let i = 0; i < 60; i++) {
    const treeGroup = new THREE.Group();
    const height = 1.5 + Math.random() * 2.0;
    const leafMat = leafMats[Math.floor(Math.random() * leafMats.length)];
    const isPine = Math.random() > 0.3;

    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 + Math.random() * 0.06, 0.12 + Math.random() * 0.06, height, 6),
      trunkMat
    );
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    if (isPine) {
      // Pine tree: stacked cones
      const layers = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < layers; j++) {
        const radius = (0.7 - j * 0.12) * (0.8 + Math.random() * 0.4);
        const coneHeight = (0.9 - j * 0.1) * (0.8 + Math.random() * 0.4);
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(radius, coneHeight, 6 + Math.floor(Math.random() * 3)),
          leafMat
        );
        cone.position.y = height + j * 0.45;
        cone.castShadow = true;
        treeGroup.add(cone);
      }
    } else {
      // Round tree: sphere canopy
      const canopySize = 0.8 + Math.random() * 0.6;
      const canopy = new THREE.Mesh(
        new THREE.IcosahedronGeometry(canopySize, 1),
        leafMat
      );
      canopy.position.y = height + canopySize * 0.5;
      canopy.scale.y = 0.7 + Math.random() * 0.3;
      canopy.castShadow = true;
      treeGroup.add(canopy);
    }

    // Place, avoiding center
    let x: number, z: number;
    do {
      x = (Math.random() - 0.5) * 120;
      z = (Math.random() - 0.5) * 120;
    } while (Math.abs(x) < 6 && Math.abs(z) < 6);

    treeGroup.position.set(x, 0, z);
    treeGroup.rotation.y = Math.random() * Math.PI * 2;
    scene.add(treeGroup);
  }
}

function addPaths(scene: THREE.Scene): void {
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 1 });

  // Main north-south path
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 40), pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.02, -10);
  path.receiveShadow = true;
  scene.add(path);

  // East-west crossroad
  const path2 = new THREE.Mesh(new THREE.PlaneGeometry(35, 2), pathMat);
  path2.rotation.x = -Math.PI / 2;
  path2.position.set(5, 0.02, 2);
  path2.receiveShadow = true;
  scene.add(path2);

  // Diagonal path to northeast
  const path3 = new THREE.Mesh(new THREE.PlaneGeometry(2, 30), pathMat);
  path3.rotation.x = -Math.PI / 2;
  path3.rotation.z = Math.PI / 4;
  path3.position.set(18, 0.02, -15);
  path3.receiveShadow = true;
  scene.add(path3);
}

function addGrass(scene: THREE.Scene): void {
  // Small grass tufts scattered around for ground-level detail
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x55883a,
    roughness: 0.9,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 200; i++) {
    const tuft = new THREE.Group();
    const blades = 2 + Math.floor(Math.random() * 3);
    for (let b = 0; b < blades; b++) {
      const h = 0.15 + Math.random() * 0.25;
      const blade = new THREE.Mesh(
        new THREE.PlaneGeometry(0.05, h),
        grassMat
      );
      blade.position.set(
        (Math.random() - 0.5) * 0.15,
        h / 2,
        (Math.random() - 0.5) * 0.15
      );
      blade.rotation.y = Math.random() * Math.PI;
      blade.rotation.z = (Math.random() - 0.5) * 0.3;
      tuft.add(blade);
    }
    tuft.position.set(
      (Math.random() - 0.5) * 130,
      0,
      (Math.random() - 0.5) * 130
    );
    scene.add(tuft);
  }
}
