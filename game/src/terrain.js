// Terrain: one height function shared by the mesh builder and the flight
// model, so the ground you see is exactly the ground you can hit.
// Hills from layered sines, a carved river valley, a flattened runway strip,
// and rising ridges toward the map edge.
import { CONFIG, riverZ } from './config.js';

function smoothstep(a, b, t) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

export function terrainHeight(x, z) {
  // Rolling hills.
  let h =
    Math.sin(x * 0.0016) * Math.cos(z * 0.0013) * 38 +
    Math.sin(x * 0.004 + 1.7) * Math.cos(z * 0.0031) * 14 +
    Math.sin((x + z) * 0.0007) * 22 +
    Math.sin(x * 0.00023 - z * 0.00031) * 30;
  // River valley carve.
  const dRiver = Math.abs(z - riverZ(x));
  h -= 26 * Math.exp(-((dRiver / 95) ** 2));
  // Ridges near the map edge frame the valley.
  const r = Math.max(Math.abs(x), Math.abs(z));
  h += 70 * smoothstep(1450, 2000, r);
  // Flat runway pad: blend the height to zero near the strip.
  const rw = CONFIG.runway;
  const dx = Math.max(Math.abs(x - rw.x) - rw.width / 2 - 60, 0);
  const dz = Math.max(Math.abs(z - rw.z) - rw.length / 2 - 60, 0);
  const dPad = Math.hypot(dx, dz);
  const flat = 1 - smoothstep(0, 140, dPad);
  h *= 1 - flat;
  return h;
}

export function onRunway(x, z) {
  const rw = CONFIG.runway;
  return (
    Math.abs(x - rw.x) <= rw.width / 2 + 2 &&
    Math.abs(z - rw.z) <= rw.length / 2 + 2
  );
}

// Deterministic pseudo-random helper (mulberry32) so trees and rocks land
// the same way every load.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildTerrain(THREE) {
  const group = new THREE.Group();
  const size = CONFIG.worldSize;
  const segments = 128;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
  }
  geo.computeVertexNormals();

  // Colour the ground by height and wetness: green fields, sandy riverbank,
  // grey rock on the high ridges, pale dirt near the runway.
  const colours = new Float32Array(pos.count * 3);
  const cField = new THREE.Color(0x4d7a3a);
  const cField2 = new THREE.Color(0x6d8f3f);
  const cSand = new THREE.Color(0x9c8a5e);
  const cRock = new THREE.Color(0x6f6a63);
  const cDirt = new THREE.Color(0x8a7a52);
  const tmp = new THREE.Color();
  const rand = mulberry32(20261126);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const patch = Math.sin(x * 0.021 + z * 0.017) * 0.5 + 0.5;
    tmp.copy(cField).lerp(cField2, patch);
    if (y > 55) tmp.lerp(cRock, smoothstep(55, 95, y));
    const dRiver = Math.abs(z - riverZ(x));
    if (dRiver < 26 && y < 8) tmp.lerp(cSand, 0.8);
    if (onRunway(x, z)) tmp.copy(cDirt);
    // A little per-vertex jitter so fields read as patchwork, not flat paint.
    const j = 0.92 + rand() * 0.16;
    colours[i * 3] = tmp.r * j;
    colours[i * 3 + 1] = tmp.g * j;
    colours[i * 3 + 2] = tmp.b * j;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  const ground = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true }),
  );
  group.add(ground);

  // River water: a ribbon following the valley, hugging the carved ground
  // so it stays visible instead of sinking under a hill.
  const riverGeo = new THREE.PlaneGeometry(size, 46, 128, 1);
  riverGeo.rotateX(-Math.PI / 2);
  const rp = riverGeo.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    const x = rp.getX(i);
    const z = rp.getZ(i) + riverZ(x);
    rp.setZ(i, z);
    rp.setY(i, terrainHeight(x, z) + 0.8);
  }
  riverGeo.computeVertexNormals();
  const river = new THREE.Mesh(
    riverGeo,
    new THREE.MeshLambertMaterial({
      color: 0x3f7fb8,
      transparent: true,
      opacity: 0.88,
    }),
  );
  group.add(river);

  // Runway: dark strip, white centre dashes, edge lights, threshold bars.
  const rw = CONFIG.runway;
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(rw.width, rw.length),
    new THREE.MeshLambertMaterial({ color: 0x2c2f36 }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(rw.x, 0.6, rw.z);
  group.add(strip);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xf2f2e8 });
  for (let z = -rw.length / 2 + 40; z < rw.length / 2 - 20; z += 60) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(3, 28), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(rw.x, 0.7, rw.z + z);
    group.add(dash);
  }
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffd34d });
  const lightGeo = new THREE.SphereGeometry(1.1, 8, 6);
  for (const side of [-1, 1]) {
    for (let z = -rw.length / 2 + 10; z <= rw.length / 2 - 10; z += 70) {
      const lamp = new THREE.Mesh(lightGeo, lightMat);
      lamp.position.set(rw.x + side * (rw.width / 2 + 4), 1.2, rw.z + z);
      group.add(lamp);
    }
  }

  // Trees: instanced cones on trunks, kept off the runway, river and rings.
  const treeRand = mulberry32(77);
  const trunkGeo = new THREE.CylinderGeometry(0.7, 1, 5, 6);
  const coneGeo = new THREE.ConeGeometry(4.2, 13, 7);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4126 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2f5d2a });
  const count = 520;
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const crowns = new THREE.InstancedMesh(coneGeo, leafMat, count);
  const dummy = new THREE.Object3D();
  let placed = 0;
  let guard = 0;
  while (placed < count && guard++ < 8000) {
    const x = (treeRand() - 0.5) * 3800;
    const z = (treeRand() - 0.5) * 3800;
    const y = terrainHeight(x, z);
    if (y < 4 || y > 70) continue;
    if (onRunway(x, z)) continue;
    if (Math.abs(z - riverZ(x)) < 34) continue;
    const s = 0.8 + treeRand() * 0.9;
    dummy.position.set(x, y + 2.5 * s, z);
    dummy.scale.setScalar(s);
    dummy.rotation.y = treeRand() * Math.PI * 2;
    dummy.updateMatrix();
    trunks.setMatrixAt(placed, dummy.matrix);
    dummy.position.y = y + (2.5 + 6) * s;
    dummy.updateMatrix();
    crowns.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  trunks.count = placed;
  crowns.count = placed;
  group.add(trunks);
  group.add(crowns);

  // Scattered boulders on the high ground.
  const rockRand = mulberry32(913);
  const rockGeo = new THREE.DodecahedronGeometry(3, 0);
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x77716a });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 90);
  for (let i = 0; i < 90; i++) {
    const x = (rockRand() - 0.5) * 3800;
    const z = (rockRand() - 0.5) * 3800;
    const y = terrainHeight(x, z);
    dummy.position.set(x, y + 1, z);
    dummy.scale.set(0.7 + rockRand() * 1.6, 0.5 + rockRand(), 0.7 + rockRand() * 1.6);
    dummy.rotation.set(rockRand() * 3, rockRand() * 3, rockRand() * 3);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  group.add(rocks);
  return group;
}
