/* ==========================================================================
   sound.js  -  all sounds are generated with the Web Audio API (no audio files).
   Browsers only allow sound after the first click, which is fine for this game.
   ========================================================================== */

let audioContext = null;

function getAudioContext() {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

/* Play one short beep. `slideTo` makes the pitch glide up or down. */
function playTone(frequency, duration, waveType = 'sine', volume = 0.08, slideTo = null) {
  if (state.muted) return;
  try {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  } catch (error) { /* audio not available, stay silent */ }
}

/* A burst of fading noise = glass breaking. */
function playCrashNoise() {
  if (state.muted) return;
  try {
    const context = getAudioContext();
    const length = context.sampleRate * 0.5;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = 0.25;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  } catch (error) { /* stay silent */ }
}

/* Named sound effects used everywhere else. */
const sounds = {
  pop()   { playTone(300 + state.level * 60 + randomBetween(0, 80), 0.09, 'triangle', 0.07, 120); },
  honk()  { playTone(180, 0.3, 'sawtooth', 0.09, 120); },
  boing() { playTone(200, 0.4, 'sine', 0.1, 700); },
  sad()   { playTone(330, 0.5, 'triangle', 0.08, 110); },
  crash() { playCrashNoise(); playTone(900, 0.25, 'square', 0.04, 120); },

  levelUp() {
    [0, 1, 2, 3].forEach((step) => {
      setTimeout(() => playTone(380 * Math.pow(1.26, step), 0.16, 'square', 0.05), step * 90);
    });
  },
  achievement() {
    [0, 1, 2].forEach((step) => {
      setTimeout(() => playTone(660 * Math.pow(1.34, step), 0.2, 'triangle', 0.07), step * 110);
    });
  },
};
