// Controls: keyboard state plus a drag-to-look mouse offset for the chase
// camera. Arrow keys / WASD fly; W/S throttle; Space brakes; P pauses;
// R restarts; Enter starts from the title screen.
export function createControls() {
  const keys = new Set();
  const state = {
    mouseLookX: 0,
    mouseLookY: 0,
    dragging: false,
  };

  const KEYMAP = {
    ArrowUp: 'pitchUp',
    KeyW: 'throttleUp',
    ArrowDown: 'pitchDown',
    KeyS: 'throttleDown',
    ArrowLeft: 'rollLeft',
    KeyA: 'rollLeft',
    ArrowRight: 'rollRight',
    KeyD: 'rollRight',
    Space: 'brake',
  };

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') e.preventDefault();
    keys.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  let lastX = 0;
  let lastY = 0;
  window.addEventListener('mousedown', (e) => {
    state.dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('mouseup', () => {
    state.dragging = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (!state.dragging) return;
    state.mouseLookX = Math.min(1, Math.max(-1, state.mouseLookX + (e.clientX - lastX) * 0.004));
    state.mouseLookY = Math.min(0.6, Math.max(-0.4, state.mouseLookY + (e.clientY - lastY) * 0.003));
    lastX = e.clientX;
    lastY = e.clientY;
  });

  function held(action) {
    for (const [code, name] of Object.entries(KEYMAP)) {
      if (name === action && keys.has(code)) return true;
    }
    return false;
  }

  return {
    state,
    pressed(code) {
      return keys.has(code);
    },
    // Flight input for physics.stepFlight, sampled once per frame.
    flightInput() {
      return {
        pitch: (held('pitchUp') ? 1 : 0) - (held('pitchDown') ? 1 : 0),
        roll: (held('rollRight') ? 1 : 0) - (held('rollLeft') ? 1 : 0),
        throttleUp: held('throttleUp'),
        throttleDown: held('throttleDown'),
        brake: held('brake'),
      };
    },
  };
}
