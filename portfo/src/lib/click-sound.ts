/**
 * Click tick, played from public/audio/switch.mp3.
 *
 * Decoded once into an AudioBuffer and played through a fresh source node per
 * click, rather than via an <audio> element. A single <audio> restarts itself
 * when re-triggered, so rapid clicks would cut each other off; buffer sources
 * overlap cleanly and start with far less latency.
 */

const SRC = "/audio/switch.mp3";
/** Playback gain. The file has its own level; this scales it. */
const VOLUME = 0.5;

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let loading: Promise<void> | null = null;
/** Start of the transient, in seconds — the file's lead-in is skipped. */
let onset = 0;
/** How much of the file to play from `onset`, in seconds. */
let duration = 0;

/**
 * Where the actual transient starts, in seconds.
 *
 * The threshold is a fraction of the file's own peak rather than an absolute
 * level. Recordings often open with room tone well above any fixed floor —
 * switch.mp3 sits at ~0.01 for its first 800ms before the real hit — so an
 * absolute threshold locks onto the hiss and the sound lands late.
 */
function findRegion(buf: AudioBuffer): { onset: number; duration: number } {
  let peak = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const a = Math.abs(data[i]);
      if (a > peak) peak = a;
    }
  }
  if (peak <= 0) return { onset: 0, duration: buf.duration };

  const hi = peak * 0.15;
  const lo = peak * 0.05;
  let first = buf.length;
  let last = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < first; i++) {
      if (Math.abs(data[i]) > hi) {
        first = i;
        break;
      }
    }
    for (let i = data.length - 1; i > last; i--) {
      if (Math.abs(data[i]) > lo) {
        last = i;
        break;
      }
    }
  }
  if (first >= buf.length) return { onset: 0, duration: buf.duration };

  const sr = buf.sampleRate;
  // Back off a few ms so the attack isn't clipped off the front, and stop once
  // the sound has decayed rather than playing the room tone that follows it.
  const start = Math.max(0, (first - sr * 0.004) / sr);
  const end = Math.min(buf.duration, last / sr + 0.04);
  return { onset: start, duration: Math.max(0.05, end - start) };
}

function context(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/**
 * Fetch and decode ahead of time so the first click isn't silent. Safe to call
 * before any gesture: the context starts suspended and decoding doesn't need it
 * to be running.
 */
export function primeClick(): void {
  if (buffer || loading) return;
  const ac = context();
  if (!ac) return;
  loading = fetch(SRC)
    .then((r) => {
      const type = r.headers.get("content-type") || "";
      // SPA hosts answer unknown paths with index.html and a 200.
      if (!r.ok || type.includes("text/html")) throw new Error("missing");
      return r.arrayBuffer();
    })
    .then((buf) => ac.decodeAudioData(buf))
    .then((decoded) => {
      buffer = decoded;
      const region = findRegion(decoded);
      onset = region.onset;
      duration = region.duration;
    })
    .catch(() => {
      buffer = null;
    });
}

/**
 * Resume the context. Worth calling on the first gesture of any kind: a context
 * created before user interaction starts suspended, and scheduling a source on a
 * suspended context loses it, because its clock is frozen.
 */
export function unlockClick(): void {
  const ac = context();
  if (ac && ac.state === "suspended") void ac.resume();
}

function fire(ac: AudioContext, strength: number): void {
  if (!buffer) return;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const gain = ac.createGain();
  const level = VOLUME * strength;
  gain.gain.value = level;
  src.connect(gain).connect(ac.destination);

  // Start past the lead-in so the tick lands with the press, and stop once the
  // sound has decayed. A short ramp avoids a click at the cut.
  const t = ac.currentTime;
  const fade = Math.min(0.02, duration * 0.25);
  gain.gain.setValueAtTime(level, t + duration - fade);
  gain.gain.linearRampToValueAtTime(0, t + duration);
  src.start(t, onset, duration);
  src.stop(t + duration + 0.01);
}

export function playClick(strength = 1): void {
  const ac = context();
  if (!ac || !buffer) {
    // Not decoded yet — prime it so the next click lands.
    primeClick();
    return;
  }
  if (ac.state === "suspended") {
    // Wait for the clock to actually start, otherwise this play is swallowed.
    void ac.resume().then(() => fire(ac, strength));
    return;
  }
  fire(ac, strength);
}
