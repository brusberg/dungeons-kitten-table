let audioContext;
let diceRollBuffer;
let diceRollBufferPromise;
let masterGain;

const diceRollAssetCandidates = [
  "/sounds/dice-roll.mp3",
  "/sounds/dice-roll.wav",
  "/sounds/dice-roll.webm",
  "/sounds/dice-roll.ogg"
];

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function getMasterGain(context) {
  if (!masterGain) {
    masterGain = context.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(context.destination);
  }

  return masterGain;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

async function loadDiceRollBuffer(context) {
  if (diceRollBuffer) return diceRollBuffer;
  if (diceRollBufferPromise) return diceRollBufferPromise;

  diceRollBufferPromise = (async () => {
    for (const asset of diceRollAssetCandidates) {
      try {
        const response = await fetch(asset, { cache: "force-cache" });
        if (!response.ok) continue;

        const audioData = await response.arrayBuffer();
        const decoded = await context.decodeAudioData(audioData);
        diceRollBuffer = decoded;
        return decoded;
      } catch {
        // Try the next supported extension, then fall back to synthesized audio.
      }
    }

    return null;
  })();

  return diceRollBufferPromise;
}

function preloadDiceRollAsset(context) {
  loadDiceRollBuffer(context).catch(() => {});
}

function primeAudioOutput(context) {
  const source = context.createBufferSource();
  const gain = context.createGain();
  const buffer = context.createBuffer(1, 1, context.sampleRate);

  source.buffer = buffer;
  gain.gain.value = 0.0001;
  source.connect(gain);
  gain.connect(getMasterGain(context));
  source.start(context.currentTime);
  source.stop(context.currentTime + 0.01);
}

function scheduleRecordedRoll(context, { diceCount, reroll }) {
  if (!diceRollBuffer) return false;

  const startTime = context.currentTime + 0.01;
  const source = context.createBufferSource();
  const gain = context.createGain();
  const panner = context.createStereoPanner?.();
  const playbackRate = randomBetween(reroll ? 1.04 : 0.92, reroll ? 1.2 : 1.08);
  const maxDuration = reroll ? 0.72 : randomBetween(1, Math.min(1.8, 0.75 + diceCount * 0.24));

  source.buffer = diceRollBuffer;
  source.playbackRate.value = playbackRate;
  gain.gain.setValueAtTime(randomBetween(0.68, 0.88), startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(maxDuration, diceRollBuffer.duration / playbackRate));

  if (panner) {
    panner.pan.setValueAtTime(randomBetween(-0.18, 0.18), startTime);
    source.connect(gain);
    gain.connect(panner);
    panner.connect(getMasterGain(context));
  } else {
    source.connect(gain);
    gain.connect(getMasterGain(context));
  }

  source.start(startTime);
  source.stop(startTime + Math.min(maxDuration, diceRollBuffer.duration / playbackRate));
  return true;
}

function makeNoiseBuffer(context, duration) {
  const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const output = buffer.getChannelData(0);

  for (let index = 0; index < sampleCount; index += 1) {
    const fade = 1 - index / sampleCount;
    output[index] = randomBetween(-1, 1) * fade * fade;
  }

  return buffer;
}

function scheduleClack(context, startTime, strength = 1) {
  const duration = randomBetween(0.045, 0.09);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const panner = context.createStereoPanner?.();

  source.buffer = makeNoiseBuffer(context, duration);
  source.playbackRate.value = randomBetween(0.78, 1.32);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(randomBetween(850, 2700), startTime);
  filter.Q.setValueAtTime(randomBetween(0.7, 1.8), startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(randomBetween(0.24, 0.42) * strength, startTime + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  source.connect(filter);
  filter.connect(gain);
  if (panner) {
    panner.pan.setValueAtTime(randomBetween(-0.45, 0.45), startTime);
    gain.connect(panner);
    panner.connect(getMasterGain(context));
  } else {
    gain.connect(getMasterGain(context));
  }

  source.start(startTime);
  source.stop(startTime + duration + 0.02);
}

function scheduleThock(context, startTime) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const duration = randomBetween(0.045, 0.08);

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(randomBetween(120, 220), startTime);
  oscillator.frequency.exponentialRampToValueAtTime(randomBetween(55, 90), startTime + duration);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(randomBetween(0.1, 0.18), startTime + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(getMasterGain(context));
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function scheduleDiceRoll(context, { diceCount, reroll }) {
  const hitCount = reroll ? 2 : Math.max(4, diceCount + 2);
  let cursor = context.currentTime + 0.01;

  for (let index = 0; index < hitCount; index += 1) {
    const strength = 1 - index / (hitCount * 1.8);
    scheduleClack(context, cursor, strength);
    if (index % 2 === 0) {
      scheduleThock(context, cursor + randomBetween(0.003, 0.014));
    }
    cursor += randomBetween(0.028, 0.065);
  }
}

function scheduleBestRoll(context, options) {
  preloadDiceRollAsset(context);
  if (!scheduleRecordedRoll(context, options)) {
    scheduleDiceRoll(context, options);
  }
}

function vibrateForRoll({ reroll }) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(reroll ? 18 : [14, 24, 18]);
    }
  } catch {
    // Vibration is only a mobile assist; ignore unsupported browsers.
  }
}

export function playDiceRollSound({ diceCount = 3, reroll = false } = {}) {
  try {
    const context = getAudioContext();
    if (!context) return;

    vibrateForRoll({ reroll });
    if (context.state !== "running") {
      scheduleBestRoll(context, { diceCount, reroll });
      context.resume().catch(() => {});
      return;
    }

    scheduleBestRoll(context, { diceCount, reroll });
  } catch {
    // Audio should never block a roll.
  }
}

export function unlockDiceAudio() {
  try {
    const context = getAudioContext();
    if (context && context.state !== "running") {
      primeAudioOutput(context);
      context.resume().catch(() => {});
    }
    if (context) preloadDiceRollAsset(context);
  } catch {
    // Audio unlock is best-effort.
  }
}
