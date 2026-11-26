// Missions: the ring course and the landing. Rings are flown in order;
// each one passed adds score and lights the next. After the last ring the
// mission becomes "land on the runway" — a gentle touchdown there finishes
// the sortie.
import { CONFIG } from './config.js';

export function buildRings(THREE) {
  const group = new THREE.Group();
  const meshes = [];
  CONFIG.rings.forEach((ring, i) => {
    const geo = new THREE.TorusGeometry(CONFIG.ringRadius, 1.6, 12, 40);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffb020 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(ring.x, ring.y, ring.z);
    // Face the ring along the course direction (toward the next ring).
    const next = CONFIG.rings[(i + 1) % CONFIG.rings.length];
    mesh.lookAt(next.x, next.y, next.z);
    mesh.userData.index = i;
    group.add(mesh);
    // A small floating number plate so the pilot can read the order.
    const plate = makeLabel(i + 1);
    plate.position.set(ring.x, ring.y + CONFIG.ringRadius + 8, ring.z);
    group.add(plate);
    meshes.push(mesh);
  });
  group.userData.meshes = meshes;
  return group;
}

function makeLabel(n) {
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd34d';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), 32, 34);
  const tex = new THREE.CanvasTexture(cv);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true }),
  );
  sprite.scale.set(10, 10, 1);
  return sprite;
}

export function createMission() {
  return {
    ringIndex: 0, // next ring to fly through
    ringsPassed: 0,
    score: 0,
    phase: 'rings', // 'rings' -> 'land' -> 'done'
    message: '',
    messageUntil: 0,
  };
}

// Returns 'ring' when a ring was just passed, else null. Call every frame.
export function checkRing(mission, state, now) {
  if (mission.phase !== 'rings') return null;
  const ring = CONFIG.rings[mission.ringIndex];
  const dx = state.x - ring.x;
  const dy = state.y - ring.y;
  const dz = state.z - ring.z;
  if (Math.hypot(dx, dy, dz) < CONFIG.ringRadius - 1) {
    mission.ringsPassed++;
    mission.score += CONFIG.ringScore;
    mission.ringIndex++;
    mission.message = `RING ${mission.ringsPassed}/${CONFIG.rings.length}  +${CONFIG.ringScore}`;
    mission.messageUntil = now + 2200;
    if (mission.ringIndex >= CONFIG.rings.length) {
      mission.phase = 'land';
      mission.message = 'ALL RINGS CLEAR — LAND ON THE RUNWAY';
      mission.messageUntil = now + 4000;
    }
    return 'ring';
  }
  return null;
}

export function missionText(mission) {
  if (mission.phase === 'rings') {
    return `MISSION 1 — RING RUN: fly through ring ${mission.ringIndex + 1} of ${CONFIG.rings.length}`;
  }
  if (mission.phase === 'land') {
    return 'MISSION 2 — LAND: gentle touchdown on the runway (slow, level, on the strip)';
  }
  return 'SORTIE COMPLETE — Merpati Ridge is yours';
}

// Colour the rings: passed = green, next = amber + pulsing, later = dim grey.
export function paintRings(ringGroup, mission, now) {
  for (const mesh of ringGroup.userData.meshes) {
    const i = mesh.userData.index;
    if (i < mission.ringIndex) mesh.material.color.setHex(0x2fbf5a);
    else if (i === mission.ringIndex) {
      const pulse = 0.75 + 0.25 * Math.sin(now / 160);
      mesh.material.color.setRGB(1 * pulse, 0.69 * pulse, 0.12 * pulse);
      mesh.scale.setScalar(1 + 0.03 * Math.sin(now / 160));
    } else mesh.material.color.setHex(0x5a6470);
  }
}
