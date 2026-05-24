/**
 * Lightweight Web Audio API sound synthesizer.
 * All sounds are procedurally generated — no external audio files needed.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.25;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

/** Resume context on first user interaction (required by most browsers). */
export function resumeAudio(): void {
  try {
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  } catch {
    // ignore
  }
}

/** Short pop/whoosh — marble fired. */
export function playFire(): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(getMaster());
    osc.type = "sawtooth";
    const t = c.currentTime;
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch { /* ignore */ }
}

/** Metallic click — marble bounces off wall or obstacle. */
export function playBounce(): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(getMaster());
    osc.type = "square";
    const t = c.currentTime;
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.06);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t);
    osc.stop(t + 0.09);
  } catch { /* ignore */ }
}

/** Thud impact — marble hits monster. */
export function playHit(): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(getMaster());
    osc.type = "sine";
    const t = c.currentTime;
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.13);
  } catch { /* ignore */ }
}

/** Rising hum while charging, frequency scales with chargeRatio (0–1). */
let chargeOsc: OscillatorNode | null = null;
let chargeGain: GainNode | null = null;

export function startCharge(): void {
  stopCharge();
  try {
    const c = getCtx();
    chargeOsc = c.createOscillator();
    chargeGain = c.createGain();
    chargeOsc.connect(chargeGain);
    chargeGain.connect(getMaster());
    chargeOsc.type = "sine";
    chargeOsc.frequency.value = 220;
    chargeGain.gain.value = 0;
    chargeGain.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.05);
    chargeOsc.start();
  } catch { /* ignore */ }
}

export function updateCharge(ratio: number): void {
  try {
    if (!chargeOsc || !chargeGain) return;
    chargeOsc.frequency.value = 220 + ratio * 320;
    chargeGain.gain.value = 0.08 + ratio * 0.18;
  } catch { /* ignore */ }
}

export function stopCharge(): void {
  try {
    if (chargeOsc) {
      chargeOsc.stop();
      chargeOsc.disconnect();
      chargeOsc = null;
    }
    if (chargeGain) {
      chargeGain.disconnect();
      chargeGain = null;
    }
  } catch { /* ignore */ }
}

/** Short ascending arpeggio — wave cleared. */
export function playWaveClear(): void {
  try {
    const c = getCtx();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.connect(g);
      g.connect(getMaster());
      osc.type = "triangle";
      const t = c.currentTime + i * 0.11;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.27);
    });
  } catch { /* ignore */ }
}

/** Soft ascending chime — upgrade card selected. */
export function playCardSelect(): void {
  try {
    const c = getCtx();
    const notes = [880, 1047];
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.connect(g);
      g.connect(getMaster());
      osc.type = "sine";
      const t = c.currentTime + i * 0.07;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch { /* ignore */ }
}

/** Defeat low drone. */
export function playDefeat(): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(getMaster());
    osc.type = "sawtooth";
    const t = c.currentTime;
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.8);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    osc.start(t);
    osc.stop(t + 0.9);
  } catch { /* ignore */ }
}
