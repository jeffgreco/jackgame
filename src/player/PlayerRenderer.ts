import * as THREE from 'three';

/**
 * Procedurally builds Bob the Knight as a group of simple geometries.
 * Knight with usual armor + red feather on top of helmet.
 */
export function createPlayerModel(): THREE.Group {
  const group = new THREE.Group();
  const armorColor = 0x888888;
  const darkArmor = 0x666666;

  // Body (torso)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.9, 0.5),
    new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.6, roughness: 0.4 })
  );
  body.position.y = 0.85;
  body.castShadow = true;
  group.add(body);

  // Legs
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.5, 0.3),
      new THREE.MeshStandardMaterial({ color: darkArmor, metalness: 0.5, roughness: 0.5 })
    );
    leg.position.set(side * 0.2, 0.25, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  // Arms
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.7, 0.25),
      new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.6, roughness: 0.4 })
    );
    arm.position.set(side * 0.55, 0.85, 0);
    arm.castShadow = true;
    group.add(arm);
  }

  // Head / helmet
  const helmet = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: darkArmor, metalness: 0.7, roughness: 0.3 })
  );
  helmet.position.y = 1.6;
  helmet.castShadow = true;
  group.add(helmet);

  // Helmet visor slit
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.08, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  visor.position.set(0, 1.58, 0.26);
  group.add(visor);

  // Red feather on top of helmet
  const featherGroup = new THREE.Group();
  featherGroup.position.set(0, 1.85, 0);

  // Feather shaft
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0xcc2222 })
  );
  shaft.position.y = 0.25;
  featherGroup.add(shaft);

  // Feather plume (wider at top)
  const plume = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.35, 6),
    new THREE.MeshStandardMaterial({ color: 0xff3333 })
  );
  plume.position.y = 0.45;
  plume.rotation.z = 0.15;
  featherGroup.add(plume);

  group.add(featherGroup);

  return group;
}

/**
 * Creates sword mesh (child of player, shown when attacking).
 */
export function createSwordModel(): THREE.Group {
  const group = new THREE.Group();

  // Handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.25, 6),
    new THREE.MeshStandardMaterial({ color: 0x6b4226 })
  );
  handle.position.y = 0;
  group.add(handle);

  // Guard
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.04, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.7, roughness: 0.3 })
  );
  guard.position.y = 0.13;
  group.add(guard);

  // Blade
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.6, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xccccdd, metalness: 0.8, roughness: 0.2 })
  );
  blade.position.y = 0.45;
  group.add(blade);

  return group;
}

/**
 * Creates a bow mesh.
 */
export function createBowModel(): THREE.Group {
  const group = new THREE.Group();

  // Bow arc (using a torus segment)
  const bow = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.025, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x8B5E3C })
  );
  bow.rotation.z = Math.PI / 2;
  group.add(bow);

  // String
  const stringGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -0.3, 0),
    new THREE.Vector3(0, 0.3, 0),
  ]);
  const bowString = new THREE.Line(
    stringGeom,
    new THREE.LineBasicMaterial({ color: 0xdddddd })
  );
  group.add(bowString);

  return group;
}
