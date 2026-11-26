// Main: boots the renderer, owns the game loop and the chase camera, and
// wires physics, missions, HUD, audio and the screen states together.
// States: title -> flying -> paused | crashed | landed | complete.
import { CONFIG } from './config.js';
import { buildTerrain, terrainHeight } from './terrain.js';
import { buildAircraft } from './aircraft.js';
import { buildSky, updateSky } from './sky.js';
import { createFlightState, stepFlight } from './physics.js';
import { createControls } from './controls.js';
import { buildHud, updateHud } from './hud.js';
import { buildRings, createMission, checkRing, paintRings } from './missions.js';
import { createAudio } from './audio.js';
import { applyShot, SHOT_NAMES } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const isShot = SHOT_NAMES.includes(shotName);

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfe0ee, 500, 3400);
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 8000);

const sunLight = new THREE.DirectionalLight(0xfff2d0, 1.25);
sunLight.position.set(-1800, 1400, -1200);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0xbfd4e6, 0.75));

const terrain = buildTerrain(THREE);
scene.add(terrain);
const sky = buildSky(THREE);
scene.add(sky);
const aircraft = buildAircraft(THREE);
scene.add(aircraft);
const rings = buildRings(THREE);
scene.add(rings);

// A soft blob shadow under the aircraft, so height above ground reads.
const shadowTex = (() => {
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
})();
const blobShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(16, 16),
  new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
);
blobShadow.rotation.x = -Math.PI / 2;
scene.add(blobShadow);

// Next-ring beacon: a thin light pillar over the ring you must fly to next,
// so the course is readable from anywhere.
const beacon = new THREE.Mesh(
  new THREE.CylinderGeometry(2.5, 2.5, 500, 10, 1, true),
  new THREE.MeshBasicMaterial({
    color: 0xffb020,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
);
scene.add(beacon);

const controls = createControls();
const audio = createAudio();
const hud = buildHud();

let state = createFlightState();
let mission = createMission();
let screen = 'title'; // title | flying | paused | crashed | landed | complete
let finalScore = 0;
let elapsed = 0;

const overlay = document.getElementById('overlay');
const statusLine = document.getElementById('status');

function showOverlay(html) {
  overlay.innerHTML = html;
  overlay.style.display = html ? 'flex' : 'none';
}

function titleHtml() {
  return `<div class="card">
    <h1>MERPATI RIDGE</h1>
    <h2>Ring Runner</h2>
    <p>Fly the ridge course: six glowing rings, then bring her home onto the
    runway. Watch your fuel — a heavy throttle drinks it fast.</p>
    <table>
      <tr><td>↑ / ↓</td><td>pitch up / down</td></tr>
      <tr><td>← / → or A / D</td><td>bank &amp; turn</td></tr>
      <tr><td>W / S</td><td>throttle up / down</td></tr>
      <tr><td>Space</td><td>air brake / flaps</td></tr>
      <tr><td>Drag mouse</td><td>look around</td></tr>
      <tr><td>P pause · R restart</td><td></td></tr>
    </table>
    <p class="cta">Press ENTER or click to fly</p>
  </div>`;
}

function endHtml(kind, score) {
  if (kind === 'crashed') {
    return `<div class="card"><h1>CRASHED</h1>
      <p>The ridge claims another one. Score ${score} — press R to fly again.</p></div>`;
  }
  if (kind === 'landed') {
    return `<div class="card"><h1>LANDED</h1>
      <p>Wheels on the strip, rings still to fly? No — every ring is done.
      Score ${score}. Press R to fly the course again.</p></div>`;
  }
  return `<div class="card"><h1>SORTIE COMPLETE</h1>
    <p>All six rings and a runway landing. Final score ${score}.</p>
    <p class="cta">Press R to fly again</p></div>`;
}

function startFlying() {
  if (screen === 'title' || screen === 'crashed' || screen === 'landed' || screen === 'complete') {
    state = createFlightState();
    mission = createMission();
    screen = 'flying';
    showOverlay('');
    audio.unlock();
  } else if (screen === 'paused') {
    screen = 'flying';
    showOverlay('');
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' || e.code === 'Space') {
    if (screen === 'title') startFlying();
  }
  if (e.code === 'KeyR') startFlying();
  if (e.code === 'KeyP') {
    if (screen === 'flying') {
      screen = 'paused';
      showOverlay('<div class="card"><h1>PAUSED</h1><p class="cta">Press P to keep flying</p></div>');
    } else if (screen === 'paused') {
      screen = 'flying';
      showOverlay('');
    }
  }
});
overlay.addEventListener('click', () => {
  if (screen === 'title') startFlying();
});

// Screenshot mode: skip the title, place the aircraft, keep flying.
if (isShot) {
  state = createFlightState();
  mission = createMission();
  screen = 'flying';
  showOverlay('');
  applyShot(shotName, state, mission, performance.now());
} else {
  showOverlay(titleHtml());
}

function placeAircraft() {
  aircraft.position.set(state.x, state.y, state.z);
  aircraft.rotation.order = 'YXZ';
  aircraft.rotation.y = state.heading;
  aircraft.rotation.x = state.pitch;
  aircraft.rotation.z = state.bank;
  aircraft.userData.propeller.rotation.z += 0.25 + state.throttle * 0.9;
  const ground = terrainHeight(state.x, state.z);
  blobShadow.position.set(state.x, ground + 1.8, state.z);
  const heightAbove = Math.max(0, state.y - ground);
  const s = Math.max(0.4, Math.min(1.4, 1.4 - heightAbove / 260));
  blobShadow.scale.setScalar(s);
  blobShadow.material.opacity = Math.max(0.12, 0.85 - heightAbove / 300);
}

function placeCamera(dt) {
  const fx = Math.sin(state.heading);
  const fz = Math.cos(state.heading);
  const look = controls.state;
  // Chase position: behind and above, swung slightly by bank and mouse-look.
  const back = 24;
  const up = 8;
  const side = -state.bank * 6 + look.mouseLookX * 10;
  const tx = state.x - fx * back - fz * side;
  const ty = state.y + up + look.mouseLookY * 6;
  const tz = state.z - fz * back + fx * side;
  const k = 1 - Math.pow(0.001, dt); // smooth follow, framerate-independent
  camera.position.x += (tx - camera.position.x) * k;
  camera.position.y += (ty - camera.position.y) * k;
  camera.position.z += (tz - camera.position.z) * k;
  camera.lookAt(
    state.x + fx * 42,
    state.y + Math.sin(state.pitch) * 30 + 2,
    state.z + fz * 42,
  );
}

// Start the camera glued behind the aircraft so the first frame is framed.
camera.position.set(
  state.x - Math.sin(state.heading) * 24,
  state.y + 8,
  state.z - Math.cos(state.heading) * 24,
);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Debug handle for play-testing (read-only state for automated checks).
window.__merpati = {
  get state() { return state; },
  get mission() { return mission; },
  get screen() { return screen; },
};

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  elapsed += dt;

  if (screen === 'flying') {
    const result = stepFlight(state, controls.flightInput(), dt);
    const ringHit = checkRing(mission, state, now);
    if (ringHit === 'ring') audio.ring();
    if (result === 'crashed') {
      screen = 'crashed';
      finalScore = mission.score;
      audio.crash();
      audio.engine(0, false);
      showOverlay(endHtml('crashed', finalScore));
      statusLine.textContent = `Crashed. Score ${finalScore}. Press R to fly again.`;
    } else if (result === 'landed' || result === 'field') {
      audio.touchdown();
      if (result === 'landed' && mission.phase === 'land') {
        mission.phase = 'done';
        mission.score += CONFIG.landingScore;
        mission.message = `LANDED  +${CONFIG.landingScore}`;
        mission.messageUntil = now + 4000;
        screen = 'complete';
        finalScore = mission.score;
        audio.fanfare();
        showOverlay(endHtml('complete', finalScore));
        statusLine.textContent = `Sortie complete. Score ${finalScore}.`;
      } else {
        // Touched down mid-course (or in a field, gently): refuel and take
        // off again. Only a runway landing after the last ring finishes.
        state.fuel = CONFIG.startFuel;
        mission.message = result === 'field'
          ? 'ROUGH FIELD LANDING — REFUELLED, BACK IN THE AIR'
          : 'REFUELLED — BACK IN THE AIR';
        mission.messageUntil = now + 3000;
        state.y = terrainHeight(state.x, state.z) + 3;
        state.speed = Math.max(state.speed, 30);
        state.pitch = 0.12;
        audio.touchdown();
      }
    }
  }

  updateSky(sky, dt);
  placeAircraft();
  placeCamera(dt);
  paintRings(rings, mission, now);
  const nextRing = CONFIG.rings[Math.min(mission.ringIndex, CONFIG.rings.length - 1)];
  beacon.position.set(nextRing.x, nextRing.y + 220, nextRing.z);
  beacon.visible = mission.phase === 'rings';
  audio.engine(state.throttle, screen === 'flying');
  updateHud(hud, state, mission, now);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
