export type Prefs = { sound: boolean; motion: "system" | "reduce" | "full" };
export const DEFAULT_PREFS: Prefs = { sound: false, motion: "system" };
const KEY = "hc_prefs";

/** Per-browser preferences. Storage can be blocked, so every access is guarded. */
export function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function applyPrefs(p: Prefs) {
  const el = document.documentElement;
  if (p.motion === "reduce") el.dataset.motion = "reduce";
  else delete el.dataset.motion;
}

export function writePrefs(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
  applyPrefs(p);
}
