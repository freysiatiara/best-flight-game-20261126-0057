// Merpati Ridge — Ring Runner: every tunable number for the game lives here,
// so balancing never means hunting through the flight code.
export const CONFIG = {
  name: 'Merpati Ridge — Ring Runner',
  worldSize: 4000, // terrain spans x,z in [-2000, 2000]
  maxSpeed: 96, // m/s at full throttle
  cruiseSpeed: 58,
  minFlySpeed: 24, // below this the aircraft starts to sink
  maxPitch: 0.62, // radians, nose up/down clamp
  maxBank: 1.05, // radians of roll
  pitchRate: 1.15, // rad/s at full stick
  rollRate: 2.4, // rad/s at full stick
  turnFactor: 0.55, // how much bank turns the heading
  throttleStep: 0.55, // per second of holding W / S
  brakeDecel: 34, // m/s^2 while Space (air brake / flaps) is held
  fuelCapacity: 100,
  fuelBurn: 0.42, // per second at full throttle
  startFuel: 100,
  ringRadius: 16,
  ringScore: 100,
  landingScore: 500,
  runway: { x: 0, z: 0, length: 700, width: 46, heading: 0 },
  // Course: six glowing rings, then a landing on the ridge runway.
  rings: [
    { x: 0, y: 112, z: -700 },
    { x: 300, y: 122, z: -350 },
    { x: 560, y: 142, z: 150 },
    { x: 200, y: 112, z: 700 },
    { x: -350, y: 122, z: 450 },
    { x: -150, y: 92, z: -150 },
  ],
  start: { x: 0, y: 150, z: -1200, heading: 0, speed: 55, throttle: 0.7 },
  crashVerticalSpeed: 7.5, // touching ground faster than this (down) is a crash
  crashGroundSpeed: 42, // touching rough ground faster than this is a crash
  safeBank: 0.28, // max bank for a survivable runway touchdown
  safePitch: 0.18, // max |pitch| for a survivable runway touchdown
};

// River path: the valley the river follows across the map (used by terrain
// and by the low-level valley screenshot).
export function riverZ(x) {
  return 300 * Math.sin(x * 0.0009) + 120 * Math.sin(x * 0.0021 + 1.3);
}
