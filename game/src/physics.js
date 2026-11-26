// Physics: an arcade flight model. Bank to turn, pitch to climb and dive,
// throttle sets speed, and slow flight sinks. Fuel burns with throttle;
// touching the ground is a landing only when it is gentle, level and on the
// runway — anything else is a crash.
import { CONFIG } from './config.js';
import { terrainHeight, onRunway } from './terrain.js';

export function createFlightState() {
  const s = CONFIG.start;
  return {
    x: s.x,
    y: s.y,
    z: s.z,
    heading: s.heading, // radians, 0 = +Z
    pitch: 0,
    bank: 0,
    speed: s.speed,
    throttle: s.throttle,
    fuel: CONFIG.startFuel,
    damage: 0,
    verticalSpeed: 0,
    grounded: false,
  };
}

// input: { pitch: -1..1 (up positive), roll: -1..1 (right positive),
//          throttleUp, throttleDown, brake } — all from controls.js.
export function stepFlight(state, input, dt) {
  const prevY = state.y;

  if (state.fuel > 0) {
    if (input.throttleUp) state.throttle += CONFIG.throttleStep * dt;
    if (input.throttleDown) state.throttle -= CONFIG.throttleStep * dt;
    state.throttle = Math.min(1, Math.max(0, state.throttle));
    state.fuel = Math.max(0, state.fuel - state.throttle * CONFIG.fuelBurn * dt);
  } else {
    state.throttle = 0; // out of fuel: glide only
  }

  // Speed chases the throttle setting; the brake / flaps kill speed fast.
  const targetSpeed = state.throttle * CONFIG.maxSpeed;
  const accel = targetSpeed > state.speed ? 9 : 14;
  state.speed += Math.min(1, Math.max(-1, targetSpeed - state.speed)) * accel * dt;
  if (input.brake) state.speed = Math.max(0, state.speed - CONFIG.brakeDecel * dt);

  // Attitude: pitch and bank ease toward the stick, then hold.
  state.pitch += input.pitch * CONFIG.pitchRate * dt;
  state.pitch = Math.min(CONFIG.maxPitch, Math.max(-CONFIG.maxPitch, state.pitch));
  state.pitch *= Math.pow(0.35, dt); // stick centres itself gently
  state.bank += input.roll * CONFIG.rollRate * dt;
  state.bank = Math.min(CONFIG.maxBank, Math.max(-CONFIG.maxBank, state.bank));
  state.bank *= Math.pow(0.3, dt);

  // Bank turns the heading; pitch trades speed for climb.
  state.heading += -state.bank * CONFIG.turnFactor * (state.speed / CONFIG.maxSpeed) * dt * 2.2;
  let climb = Math.sin(state.pitch) * state.speed;
  if (state.speed < CONFIG.minFlySpeed) {
    climb -= (CONFIG.minFlySpeed - state.speed) * 0.55; // slow flight sinks
  }
  const fx = Math.sin(state.heading);
  const fz = Math.cos(state.heading);
  state.x += fx * state.speed * Math.cos(state.pitch) * dt;
  state.z += fz * state.speed * Math.cos(state.pitch) * dt;
  state.y += climb * dt;
  state.verticalSpeed = (state.y - prevY) / Math.max(dt, 1e-6);

  // Soft world edge: steer back instead of hitting an invisible wall.
  const edge = 1950;
  if (Math.abs(state.x) > edge || Math.abs(state.z) > edge) {
    state.heading += Math.PI * dt * 0.4;
  }
  if (state.y > 420) {
    state.y = 420;
    state.pitch = Math.min(state.pitch, 0);
  }

  // Ground contact only counts while descending; resting or rolling on the
  // strip is taxiing, not a fresh landing every frame.
  const ground = terrainHeight(state.x, state.z);
  if (state.y <= ground + 1.5) {
    state.y = ground + 1.5;
    if (state.verticalSpeed >= -0.3) return 'flying';
    const gentle =
      state.verticalSpeed > -CONFIG.crashVerticalSpeed &&
      state.speed < CONFIG.crashGroundSpeed &&
      Math.abs(state.bank) < CONFIG.safeBank &&
      Math.abs(state.pitch) < CONFIG.safePitch;
    if (gentle) return onRunway(state.x, state.z) ? 'landed' : 'field';
    return 'crashed';
  }
  return 'flying';
}
