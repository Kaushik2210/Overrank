import { readPrefs } from "./prefs";

type Tone = "award" | "rank" | "unlock";
const NOTES: Record<Tone, number[]> = { award: [660, 880], rank: [523, 659, 784], unlock: [523, 659, 784, 1047] };

/** Short synthesised blips. Silent unless the user enabled sound, and only called from user-driven events. */
export function playSound(tone: Tone) {
  if (typeof window === "undefined" || !readPrefs().sound) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    NOTES[tone].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.25);
    });
    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    /* audio unavailable */
  }
}
