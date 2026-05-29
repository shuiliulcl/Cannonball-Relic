/**
 * Procedural Web Audio SFX palette.
 * No external audio files are required.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let limiter: DynamicsCompressorNode | null = null;

type AudioContextConstructor = typeof AudioContext;

type ToneOptions = {
  type: OscillatorType;
  frequency: number;
  frequencyEnd?: number;
  gain: number;
  start: number;
  duration: number;
  attack?: number;
  detune?: number;
  filter?: {
    type: BiquadFilterType;
    frequency: number;
    frequencyEnd?: number;
    q?: number;
  };
};

type NoiseOptions = {
  start: number;
  duration: number;
  gain: number;
  attack?: number;
  smooth?: number;
  filter: {
    type: BiquadFilterType;
    frequency: number;
    frequencyEnd?: number;
    q?: number;
  };
};

function clampAudio(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getAudioContextConstructor(): AudioContextConstructor {
  const audioWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
  const ctor = window.AudioContext ?? audioWindow.webkitAudioContext;
  if (!ctor) {
    throw new Error("Web Audio API is not supported.");
  }
  return ctor;
}

function getCtx(): AudioContext {
  if (!ctx) {
    const AudioContextCtor = getAudioContextConstructor();
    ctx = new AudioContextCtor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.34;

    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 16;
    limiter.ratio.value = 7;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.18;

    masterGain.connect(limiter);
    limiter.connect(ctx.destination);
  }
  return ctx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

function rampGain(gain: GainNode, start: number, peak: number, attack: number, duration: number): void {
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(Math.max(0.0001, peak), start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
}

function rampFrequency(param: AudioParam, start: number, from: number, to: number, duration: number): void {
  param.setValueAtTime(Math.max(0.001, from), start);
  param.exponentialRampToValueAtTime(Math.max(0.001, to), start + duration);
}

function playTone(c: AudioContext, options: ToneOptions): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  let output: AudioNode = osc;

  osc.type = options.type;
  if (options.detune !== undefined) {
    osc.detune.setValueAtTime(options.detune, options.start);
  }
  rampFrequency(osc.frequency, options.start, options.frequency, options.frequencyEnd ?? options.frequency, options.duration);

  if (options.filter) {
    const filter = c.createBiquadFilter();
    filter.type = options.filter.type;
    filter.Q.value = options.filter.q ?? 0.8;
    rampFrequency(filter.frequency, options.start, options.filter.frequency, options.filter.frequencyEnd ?? options.filter.frequency, options.duration);
    osc.connect(filter);
    output = filter;
  }

  output.connect(gain);
  gain.connect(getMaster());
  rampGain(gain, options.start, options.gain, options.attack ?? 0.004, options.duration);
  osc.start(options.start);
  osc.stop(options.start + options.duration + 0.05);
}

function makeNoiseBuffer(c: AudioContext, duration: number, smooth = 0): AudioBuffer {
  const bufferLength = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, bufferLength, c.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;
  const smoothing = clampAudio(smooth, 0, 0.98);

  for (let i = 0; i < bufferLength; i += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * smoothing + white * (1 - smoothing);
    data[i] = previous;
  }

  return buffer;
}

function playNoise(c: AudioContext, options: NoiseOptions): void {
  const source = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();

  source.buffer = makeNoiseBuffer(c, options.duration, options.smooth);
  filter.type = options.filter.type;
  filter.Q.value = options.filter.q ?? 0.9;
  rampFrequency(filter.frequency, options.start, options.filter.frequency, options.filter.frequencyEnd ?? options.filter.frequency, options.duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  rampGain(gain, options.start, options.gain, options.attack ?? 0.002, options.duration);
  source.start(options.start);
  source.stop(options.start + options.duration + 0.02);
}

/** Resume context on first user interaction. */
export function resumeAudio(): void {
  try {
    const c = getCtx();
    if (c.state === "suspended") {
      void c.resume().catch(() => undefined);
    }
  } catch {
    // ignore
  }
}

export function playFire(): void {
  try {
    const c = getCtx();
    const t = c.currentTime;

    playNoise(c, {
      start: t,
      duration: 0.13,
      gain: 0.18,
      smooth: 0.25,
      filter: { type: "bandpass", frequency: 1600, frequencyEnd: 460, q: 1.4 },
    });
    playTone(c, {
      type: "sawtooth",
      frequency: 520,
      frequencyEnd: 118,
      gain: 0.2,
      start: t,
      duration: 0.14,
      filter: { type: "lowpass", frequency: 1800, frequencyEnd: 420, q: 1 },
    });
    playTone(c, {
      type: "sine",
      frequency: 96,
      frequencyEnd: 52,
      gain: 0.16,
      start: t + 0.01,
      duration: 0.12,
      attack: 0.002,
    });
  } catch { /* ignore */ }
}

export function playBounce(): void {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const partials = [740, 1280, 1940];

    playNoise(c, {
      start: t,
      duration: 0.035,
      gain: 0.08,
      smooth: 0,
      filter: { type: "highpass", frequency: 2400, q: 0.8 },
    });
    partials.forEach((frequency, index) => {
      playTone(c, {
        type: "sine",
        frequency,
        frequencyEnd: frequency * (index === 0 ? 0.92 : 0.97),
        gain: 0.12 / (index + 1),
        start: t + index * 0.006,
        duration: 0.11 - index * 0.018,
        attack: 0.001,
      });
    });
  } catch { /* ignore */ }
}

export function playHit(): void {
  try {
    const c = getCtx();
    const t = c.currentTime;

    playTone(c, {
      type: "sine",
      frequency: 138,
      frequencyEnd: 44,
      gain: 0.24,
      start: t,
      duration: 0.17,
      attack: 0.003,
    });
    playNoise(c, {
      start: t,
      duration: 0.13,
      gain: 0.16,
      smooth: 0.45,
      filter: { type: "lowpass", frequency: 520, frequencyEnd: 150, q: 0.7 },
    });
    playTone(c, {
      type: "square",
      frequency: 360,
      frequencyEnd: 170,
      gain: 0.075,
      start: t,
      duration: 0.055,
      attack: 0.001,
      filter: { type: "bandpass", frequency: 840, frequencyEnd: 360, q: 1.2 },
    });
  } catch { /* ignore */ }
}

export function playExplosion(intensity = 1): void {
  try {
    const c = getCtx();
    const amount = clampAudio(intensity, 0.55, 1.95);
    const t = c.currentTime;
    const tail = 0.62 + amount * 0.18;

    playNoise(c, {
      start: t,
      duration: 0.16,
      gain: 0.62 * amount,
      smooth: 0.12,
      filter: { type: "bandpass", frequency: 2100, frequencyEnd: 280, q: 0.8 },
    });
    playNoise(c, {
      start: t + 0.018,
      duration: tail,
      gain: 0.34 * amount,
      smooth: 0.78,
      filter: { type: "lowpass", frequency: 680, frequencyEnd: 82, q: 0.65 },
    });
    playTone(c, {
      type: "sine",
      frequency: 58 + amount * 8,
      frequencyEnd: 26,
      gain: 0.58 * amount,
      start: t,
      duration: tail + 0.12,
      attack: 0.003,
    });
    playTone(c, {
      type: "triangle",
      frequency: 92,
      frequencyEnd: 38,
      gain: 0.26 * amount,
      start: t + 0.012,
      duration: 0.48 + amount * 0.08,
      attack: 0.006,
    });

    [82.41, 110, 146.83].forEach((frequency, index) => {
      playTone(c, {
        type: "sawtooth",
        frequency,
        frequencyEnd: frequency * 0.62,
        gain: (0.11 + index * 0.025) * amount,
        start: t + 0.014 + index * 0.008,
        duration: 0.32 + amount * 0.06,
        attack: 0.004,
        detune: (index - 1) * 5,
        filter: { type: "lowpass", frequency: 980, frequencyEnd: 240, q: 1.1 },
      });
    });

    [720, 940, 1280, 1680].forEach((frequency, index) => {
      playTone(c, {
        type: "square",
        frequency,
        frequencyEnd: frequency * 0.42,
        gain: 0.08 * amount,
        start: t + index * 0.012,
        duration: 0.06 + index * 0.006,
        attack: 0.001,
        filter: { type: "bandpass", frequency: frequency * 1.2, q: 2 },
      });
    });
  } catch { /* ignore */ }
}

export function playLightning(intensity = 1): void {
  try {
    const c = getCtx();
    const amount = clampAudio(intensity, 0.55, 1.6);
    const t = c.currentTime;

    playNoise(c, {
      start: t,
      duration: 0.12,
      gain: 0.24 * amount,
      smooth: 0,
      filter: { type: "highpass", frequency: 3200, frequencyEnd: 1100, q: 0.7 },
    });
    [2100, 3200, 4700].forEach((frequency, index) => {
      playTone(c, {
        type: index % 2 === 0 ? "square" : "sawtooth",
        frequency,
        frequencyEnd: frequency * 0.38,
        gain: 0.09 * amount,
        start: t + index * 0.018,
        duration: 0.07 + index * 0.012,
        attack: 0.001,
        filter: { type: "bandpass", frequency, frequencyEnd: frequency * 0.62, q: 3.2 },
      });
    });
    [392, 554.37, 830.61].forEach((frequency, index) => {
      playTone(c, {
        type: "triangle",
        frequency,
        frequencyEnd: frequency * 1.72,
        gain: 0.055 * amount,
        start: t + 0.025 + index * 0.023,
        duration: 0.12,
        attack: 0.002,
      });
    });
  } catch { /* ignore */ }
}

export function playFreeze(intensity = 1): void {
  try {
    const c = getCtx();
    const amount = clampAudio(intensity, 0.55, 1.55);
    const t = c.currentTime;

    playNoise(c, {
      start: t,
      duration: 0.38,
      gain: 0.09 * amount,
      smooth: 0.86,
      filter: { type: "highpass", frequency: 900, frequencyEnd: 2300, q: 0.6 },
    });
    [1567.98, 2093, 2637.02, 3135.96].forEach((frequency, index) => {
      playTone(c, {
        type: "sine",
        frequency,
        frequencyEnd: frequency * 1.012,
        gain: (0.055 - index * 0.006) * amount,
        start: t + index * 0.035,
        duration: 0.34 + index * 0.045,
        attack: 0.012,
      });
    });
    playTone(c, {
      type: "triangle",
      frequency: 246.94,
      frequencyEnd: 196,
      gain: 0.08 * amount,
      start: t,
      duration: 0.44,
      attack: 0.035,
      filter: { type: "lowpass", frequency: 1200, frequencyEnd: 520, q: 0.7 },
    });
  } catch { /* ignore */ }
}

export function playRicochet(intensity = 1): void {
  try {
    const c = getCtx();
    const amount = clampAudio(intensity, 0.55, 1.45);
    const t = c.currentTime;
    const notes = [880, 1318.51, 987.77, 1760];

    notes.forEach((frequency, index) => {
      playTone(c, {
        type: "sine",
        frequency,
        frequencyEnd: frequency * 0.93,
        gain: 0.08 * amount,
        start: t + index * 0.038,
        duration: 0.13,
        attack: 0.001,
      });
    });
    playNoise(c, {
      start: t,
      duration: 0.12,
      gain: 0.045 * amount,
      smooth: 0.1,
      filter: { type: "bandpass", frequency: 2600, frequencyEnd: 1200, q: 2 },
    });
  } catch { /* ignore */ }
}

export function playSplit(intensity = 1): void {
  try {
    const c = getCtx();
    const amount = clampAudio(intensity, 0.55, 1.45);
    const t = c.currentTime;

    [-0.16, 0, 0.16].forEach((offset, index) => {
      playTone(c, {
        type: "triangle",
        frequency: 520 + index * 160,
        frequencyEnd: 920 + index * 210,
        gain: 0.07 * amount,
        start: t + index * 0.018,
        duration: 0.12,
        attack: 0.002,
        detune: offset * 100,
      });
    });
    playNoise(c, {
      start: t,
      duration: 0.1,
      gain: 0.055 * amount,
      smooth: 0.18,
      filter: { type: "bandpass", frequency: 1900, frequencyEnd: 760, q: 1.5 },
    });
  } catch { /* ignore */ }
}

export function playPierce(intensity = 1): void {
  try {
    const c = getCtx();
    const amount = clampAudio(intensity, 0.55, 1.5);
    const t = c.currentTime;

    playTone(c, {
      type: "sawtooth",
      frequency: 1480,
      frequencyEnd: 310,
      gain: 0.11 * amount,
      start: t,
      duration: 0.18,
      attack: 0.001,
      filter: { type: "bandpass", frequency: 1850, frequencyEnd: 520, q: 2.6 },
    });
    playNoise(c, {
      start: t,
      duration: 0.16,
      gain: 0.08 * amount,
      smooth: 0.36,
      filter: { type: "highpass", frequency: 2600, frequencyEnd: 960, q: 1 },
    });
    playTone(c, {
      type: "sine",
      frequency: 73.42,
      frequencyEnd: 58.27,
      gain: 0.08 * amount,
      start: t + 0.012,
      duration: 0.2,
      attack: 0.004,
    });
  } catch { /* ignore */ }
}

export function playGoStone(intensity = 1): void {
  try {
    const c = getCtx();
    const amount = clampAudio(intensity, 0.5, 1.55);
    const t = c.currentTime;
    const notes = [392, 523.25, 587.33, 783.99, 880];

    playNoise(c, {
      start: t,
      duration: 0.07,
      gain: 0.11 * amount,
      smooth: 0.52,
      filter: { type: "bandpass", frequency: 620, frequencyEnd: 260, q: 1.7 },
    });
    notes.forEach((frequency, index) => {
      playTone(c, {
        type: "triangle",
        frequency,
        frequencyEnd: frequency * 0.985,
        gain: (index === 2 ? 0.075 : 0.045) * amount,
        start: t + index * 0.028,
        duration: 0.2 + index * 0.025,
        attack: 0.003,
      });
    });
  } catch { /* ignore */ }
}

let chargeOsc: OscillatorNode | null = null;
let chargeHarmonicOsc: OscillatorNode | null = null;
let chargeFilter: BiquadFilterNode | null = null;
let chargeGain: GainNode | null = null;

export function startCharge(): void {
  stopCharge();
  try {
    const c = getCtx();
    const t = c.currentTime;

    chargeOsc = c.createOscillator();
    chargeHarmonicOsc = c.createOscillator();
    chargeFilter = c.createBiquadFilter();
    chargeGain = c.createGain();

    chargeOsc.type = "sine";
    chargeHarmonicOsc.type = "triangle";
    chargeOsc.frequency.value = 150;
    chargeHarmonicOsc.frequency.value = 301;
    chargeFilter.type = "lowpass";
    chargeFilter.frequency.value = 860;
    chargeFilter.Q.value = 0.7;
    chargeGain.gain.setValueAtTime(0.0001, t);
    chargeGain.gain.linearRampToValueAtTime(0.13, t + 0.08);

    chargeOsc.connect(chargeFilter);
    chargeHarmonicOsc.connect(chargeFilter);
    chargeFilter.connect(chargeGain);
    chargeGain.connect(getMaster());

    chargeOsc.start(t);
    chargeHarmonicOsc.start(t);
  } catch { /* ignore */ }
}

export function updateCharge(ratio: number): void {
  try {
    if (!ctx || !chargeOsc || !chargeHarmonicOsc || !chargeGain || !chargeFilter) return;
    const chargeRatio = clampAudio(ratio, 0, 1);
    const t = ctx.currentTime;

    chargeOsc.frequency.setTargetAtTime(150 + chargeRatio * 370, t, 0.025);
    chargeHarmonicOsc.frequency.setTargetAtTime(301 + chargeRatio * 760, t, 0.025);
    chargeFilter.frequency.setTargetAtTime(860 + chargeRatio * 2200, t, 0.03);
    chargeGain.gain.setTargetAtTime(0.08 + chargeRatio * 0.2, t, 0.035);
  } catch { /* ignore */ }
}

export function stopCharge(): void {
  try {
    const t = ctx?.currentTime ?? 0;
    if (chargeGain && ctx) {
      chargeGain.gain.cancelScheduledValues(t);
      chargeGain.gain.setTargetAtTime(0.0001, t, 0.02);
    }
    for (const osc of [chargeOsc, chargeHarmonicOsc]) {
      if (!osc) continue;
      osc.stop(t + 0.06);
      osc.disconnect();
    }
    chargeFilter?.disconnect();
    chargeGain?.disconnect();
  } catch { /* ignore */ }
  chargeOsc = null;
  chargeHarmonicOsc = null;
  chargeFilter = null;
  chargeGain = null;
}

export function playWaveClear(): void {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    notes.forEach((frequency, index) => {
      playTone(c, {
        type: index % 2 === 0 ? "triangle" : "sine",
        frequency,
        frequencyEnd: frequency * 1.015,
        gain: 0.16,
        start: t + index * 0.075,
        duration: 0.22,
        attack: 0.004,
      });
    });
    playTone(c, {
      type: "sine",
      frequency: 261.63,
      frequencyEnd: 261.63,
      gain: 0.12,
      start: t,
      duration: 0.58,
      attack: 0.025,
    });
  } catch { /* ignore */ }
}

export function playCardSelect(): void {
  try {
    const c = getCtx();
    const t = c.currentTime;
    const notes = [659.25, 987.77, 1318.51];

    notes.forEach((frequency, index) => {
      playTone(c, {
        type: "sine",
        frequency,
        frequencyEnd: frequency * 1.008,
        gain: 0.12,
        start: t + index * 0.045,
        duration: 0.18,
        attack: 0.003,
      });
    });
    playNoise(c, {
      start: t,
      duration: 0.12,
      gain: 0.035,
      smooth: 0,
      filter: { type: "highpass", frequency: 4200, q: 0.8 },
    });
  } catch { /* ignore */ }
}

export function playDefeat(): void {
  try {
    const c = getCtx();
    const t = c.currentTime;

    [220, 164.81, 110].forEach((frequency, index) => {
      playTone(c, {
        type: "sawtooth",
        frequency,
        frequencyEnd: frequency * 0.48,
        gain: 0.13,
        start: t + index * 0.09,
        duration: 0.74,
        attack: 0.018,
        filter: { type: "lowpass", frequency: 720, frequencyEnd: 160, q: 0.8 },
      });
    });
    playNoise(c, {
      start: t + 0.08,
      duration: 0.86,
      gain: 0.13,
      smooth: 0.82,
      filter: { type: "lowpass", frequency: 420, frequencyEnd: 70, q: 0.6 },
    });
  } catch { /* ignore */ }
}
