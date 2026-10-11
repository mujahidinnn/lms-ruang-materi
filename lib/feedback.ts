import confetti from "canvas-confetti";

// Answer feedback: short synthesized sounds (Web Audio, no files) and
// pastel confetti. Called from click handlers, so browsers allow the audio.
// Sound can be muted (remembered per browser); confetti stays off when the
// device asks for reduced motion.

const KEY = "ruang-materi:suara";
const COLORS = ["#e6e0ff", "#d4f0e6", "#fbefb8", "#fcddea", "#dceafd", "#23957e", "#ea7a17"];

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "mati";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    if (on) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, "mati");
  } catch {}
}

let audio: AudioContext | null = null;

// One note: frequency in Hz, start and length in seconds from now.
function notes(list: [number, number, number][], type: OscillatorType, volume = 0.12) {
  if (!soundOn() || typeof window === "undefined" || !("AudioContext" in window)) return;
  audio ??= new AudioContext();
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  for (const [freq, start, length] of list) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
    osc.connect(gain).connect(audio.destination);
    osc.start(now + start);
    osc.stop(now + start + length + 0.02);
  }
}

// A bright two-note "ting" up a sixth.
export function playCorrect() {
  notes([[784, 0, 0.12], [1319, 0.08, 0.22]], "triangle");
}

// A soft low "dum", never harsh.
export function playWrong() {
  notes([[196, 0, 0.22], [165, 0.1, 0.28]], "sine", 0.1);
}

// A short fanfare: C E G up to a held high C.
export function playWin() {
  notes([[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.14], [1047, 0.36, 0.5], [784, 0.36, 0.5]], "triangle", 0.11);
}

// A small burst from the element that was answered.
export function burstFrom(el: Element | null) {
  const r = el?.getBoundingClientRect();
  const origin = r ? { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } : { x: 0.5, y: 0.6 };
  confetti({ particleCount: 36, spread: 70, startVelocity: 26, scalar: 0.8, ticks: 120, origin, colors: COLORS, disableForReducedMotion: true });
}

// The "dorr": two cannons from the bottom corners and one burst overhead.
export function celebrate() {
  const base = { colors: COLORS, disableForReducedMotion: true, ticks: 220, scalar: 1.05 };
  confetti({ ...base, particleCount: 90, angle: 60, spread: 70, startVelocity: 62, origin: { x: 0, y: 0.95 } });
  confetti({ ...base, particleCount: 90, angle: 120, spread: 70, startVelocity: 62, origin: { x: 1, y: 0.95 } });
  setTimeout(() => confetti({ ...base, particleCount: 140, spread: 120, startVelocity: 40, origin: { x: 0.5, y: 0.35 } }), 250);
}
