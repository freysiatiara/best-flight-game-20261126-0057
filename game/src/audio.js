// Audio: every sound is synthesized with WebAudio — an engine hum that
// follows the throttle, a two-note chime for rings, a thud for touchdown
// and a noise burst for a crash. No audio files, no network.
export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let started = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 55;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOsc.start();
      return true;
    } catch {
      return false;
    }
  }

  function unlock() {
    if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
    started = true;
  }
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });

  function tone(freq, at, dur, type, vol) {
    if (!ctx || !started) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + at);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + at);
    osc.stop(ctx.currentTime + at + dur + 0.05);
  }

  return {
    unlock,
    engine(throttle, flying) {
      if (!ctx || !started) return;
      const target = flying ? 0.05 + throttle * 0.09 : 0;
      engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
      engineOsc.frequency.setTargetAtTime(48 + throttle * 70, ctx.currentTime, 0.1);
    },
    ring() {
      tone(880, 0, 0.25, 'sine', 0.22);
      tone(1318, 0.09, 0.35, 'sine', 0.2);
    },
    touchdown() {
      tone(180, 0, 0.18, 'triangle', 0.3);
      tone(90, 0.05, 0.25, 'sine', 0.3);
    },
    crash() {
      if (!ctx || !started) return;
      const len = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.4;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      tone(70, 0, 0.5, 'sawtooth', 0.25);
    },
    fanfare() {
      tone(523, 0, 0.22, 'sine', 0.22);
      tone(659, 0.18, 0.22, 'sine', 0.22);
      tone(784, 0.36, 0.4, 'sine', 0.24);
    },
  };
}
