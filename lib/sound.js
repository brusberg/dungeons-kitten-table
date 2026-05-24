let audioContext;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  audioContext ||= new AudioContext();
  return audioContext;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
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
  const duration = randomBetween(0.035, 0.075);
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
  gain.gain.exponentialRampToValueAtTime(randomBetween(0.045, 0.1) * strength, startTime + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  source.connect(filter);
  filter.connect(gain);
  if (panner) {
    panner.pan.setValueAtTime(randomBetween(-0.45, 0.45), startTime);
    gain.connect(panner);
    panner.connect(context.destination);
  } else {
    gain.connect(context.destination);
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
  gain.gain.exponentialRampToValueAtTime(randomBetween(0.018, 0.04), startTime + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
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

export function playDiceRollSound({ diceCount = 3, reroll = false } = {}) {
  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      context.resume().then(() => scheduleDiceRoll(context, { diceCount, reroll })).catch(() => {});
      return;
    }

    scheduleDiceRoll(context, { diceCount, reroll });
  } catch {
    // Audio should never block a roll.
  }
}
