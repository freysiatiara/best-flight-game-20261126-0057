// Shots: deterministic stills for the four screenshots. Each preset places
// the aircraft, the camera and the mission state so one frame already tells
// the story — cover, valley pass, final approach, ring through-flight.
// These run inside the game itself; the screenshots are real renders.
import { CONFIG, riverZ } from './config.js';
import { terrainHeight } from './terrain.js';

export function applyShot(name, state, mission, now) {
  const set = (x, y, z, heading, speed, throttle) => {
    state.x = x;
    state.y = y;
    state.z = z;
    state.heading = heading;
    state.speed = speed;
    state.throttle = throttle;
    state.pitch = 0;
    state.bank = 0;
    state.fuel = 78;
  };
  if (name === 'cover') {
    // Chase view mid-flight: ring 1 dead ahead, runway far below the nose.
    set(0, 128, -980, 0, 62, 0.75);
    mission.ringIndex = 0;
    mission.ringsPassed = 0;
    mission.score = 0;
    mission.phase = 'rings';
  } else if (name === 'valley') {
    // Low banking pass down the river itself: the water runs ahead under
    // the wing, hills on both sides. Heading follows the river's course;
    // the aircraft sits just off the water so the river reads in frame.
    const x = -626;
    const z = riverZ(x) - 50;
    set(x, terrainHeight(x, z) + 28, z, 1.12, 66, 0.7);
    state.bank = -0.35;
    mission.ringIndex = 4;
    mission.ringsPassed = 4;
    mission.score = 400;
    mission.phase = 'rings';
    mission.message = 'LOW PASS — RIVER VALLEY';
    mission.messageUntil = now + 90000;
  } else if (name === 'approach') {
    // Final approach: lined up on the runway, gear down, flaps out.
    set(4, 42, -520, 0, 38, 0.32);
    state.pitch = -0.05;
    mission.ringIndex = 6;
    mission.ringsPassed = 6;
    mission.score = 600;
    mission.phase = 'land';
    mission.message = 'FINAL — RUNWAY AHEAD';
    mission.messageUntil = now + 90000;
  } else if (name === 'ring') {
    // Just before ring 3, on the course line from ring 2: the torus fills
    // the frame as the aircraft flies through it and the score pops.
    const ring = CONFIG.rings[2];
    const prev = CONFIG.rings[1];
    const dx = ring.x - prev.x;
    const dz = ring.z - prev.z;
    const len = Math.hypot(dx, dz);
    const ux = dx / len;
    const uz = dz / len;
    set(ring.x - ux * 45, ring.y + 1, ring.z - uz * 45, Math.atan2(ux, uz), 64, 0.72);
    mission.ringIndex = 2;
    mission.ringsPassed = 2;
    mission.score = 200;
    mission.phase = 'rings';
    mission.message = 'RING 3/6  +100';
    mission.messageUntil = now + 90000;
  }
  return true;
}

export const SHOT_NAMES = ['cover', 'valley', 'approach', 'ring'];
