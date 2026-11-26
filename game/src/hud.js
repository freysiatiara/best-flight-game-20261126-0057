// HUD: the instrument panel the pilot reads — altitude, speed, heading,
// throttle and fuel bars, score, mission line, a compass strip, an attitude
// ball, and the centre message banner. All DOM, so it stays crisp at any size.
import { CONFIG } from './config.js';
import { terrainHeight } from './terrain.js';

export function buildHud() {
  const hud = document.getElementById('hud');
  hud.innerHTML = `
    <div class="panel" id="panel-left">
      <div class="row"><span>ALT</span><b id="hud-alt">0 m</b></div>
      <div class="row"><span>SPD</span><b id="hud-spd">0 kt</b></div>
      <div class="row"><span>HDG</span><b id="hud-hdg">000°</b></div>
      <div class="row"><span>SCORE</span><b id="hud-score">0</b></div>
    </div>
    <div class="panel" id="panel-right">
      <div class="bar-label">THROTTLE <b id="hud-thr">70%</b></div>
      <div class="bar"><div id="bar-thr"></div></div>
      <div class="bar-label">FUEL <b id="hud-fuel">100%</b></div>
      <div class="bar"><div id="bar-fuel"></div></div>
      <div class="row"><span>RINGS</span><b id="hud-rings">0/6</b></div>
    </div>
    <div id="compass"></div>
    <canvas id="attitude" width="120" height="120"></canvas>
    <div id="mission"></div>
    <div id="banner"></div>
    <div id="crosshair">+</div>
  `;
  return {
    alt: document.getElementById('hud-alt'),
    spd: document.getElementById('hud-spd'),
    hdg: document.getElementById('hud-hdg'),
    score: document.getElementById('hud-score'),
    thr: document.getElementById('hud-thr'),
    fuel: document.getElementById('hud-fuel'),
    barThr: document.getElementById('bar-thr'),
    barFuel: document.getElementById('bar-fuel'),
    rings: document.getElementById('hud-rings'),
    compass: document.getElementById('compass'),
    mission: document.getElementById('mission'),
    banner: document.getElementById('banner'),
    attitude: document.getElementById('attitude'),
  };
}

function compassText(headingDeg) {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(headingDeg / 45) % 8;
  let strip = '';
  for (let d = -60; d <= 60; d += 15) {
    const deg = ((Math.round(headingDeg) + d + 360) % 360);
    const label = deg % 45 === 0 ? points[Math.round(deg / 45) % 8] : String(deg).padStart(3, '0');
    strip += d === 0 ? `[${label}] ` : `${label} `;
  }
  return strip.trim();
}

export function updateHud(els, state, mission, now) {
  const headingDeg = ((state.heading * 180 / Math.PI) % 360 + 360) % 360;
  // Altitude above the ground below, not above sea level: what a pilot reads.
  const agl = Math.max(0, state.y - terrainHeight(state.x, state.z));
  els.alt.textContent = `${Math.round(agl)} m`;
  els.spd.textContent = `${Math.round(state.speed * 1.94)} kt`;
  els.hdg.textContent = `${String(Math.round(headingDeg)).padStart(3, '0')}°`;
  els.score.textContent = String(mission.score);
  els.thr.textContent = `${Math.round(state.throttle * 100)}%`;
  els.fuel.textContent = `${Math.round(state.fuel)}%`;
  els.barThr.style.width = `${state.throttle * 100}%`;
  els.barFuel.style.width = `${state.fuel}%`;
  els.barFuel.style.background = state.fuel < 25 ? '#e5484d' : '#ffd34d';
  els.rings.textContent = `${mission.ringsPassed}/${CONFIG.rings.length}`;
  els.compass.textContent = compassText(headingDeg);
  els.mission.textContent = mission.phase === 'done'
    ? 'SORTIE COMPLETE'
    : (mission.phase === 'rings'
      ? `MISSION 1 — RING RUN · ring ${mission.ringIndex + 1}/${CONFIG.rings.length}`
      : 'MISSION 2 — LAND ON THE RUNWAY');
  els.banner.textContent = now < mission.messageUntil ? mission.message : '';
  drawAttitude(els.attitude, state);
}

// Attitude ball: blue sky / brown ground, rolled with the aircraft.
function drawAttitude(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(cx, cy, 56, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(-state.bank);
  const pitchPx = Math.max(-40, Math.min(40, state.pitch * 70));
  ctx.translate(0, pitchPx);
  ctx.fillStyle = '#3f8fd2';
  ctx.fillRect(-60, -100, 120, 100);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(-60, 0, 120, 100);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-60, 0);
  ctx.lineTo(60, 0);
  ctx.stroke();
  ctx.restore();
  // Fixed wings marker.
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy);
  ctx.lineTo(cx - 10, cy);
  ctx.moveTo(cx + 10, cy);
  ctx.lineTo(cx + 34, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 56, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff88';
  ctx.lineWidth = 2;
  ctx.stroke();
}
