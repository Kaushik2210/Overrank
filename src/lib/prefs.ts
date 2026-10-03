"use client";

import { useSyncExternalStore } from "react";

export type Prefs = { sound: boolean; motion: "system" | "reduce" | "full" };
export const DEFAULT_PREFS: Prefs = { sound: false, motion: "system" };
const KEY = "hc_prefs";
const EVENT = "hc-prefs-change";

let cachedRaw: string | null | undefined;
let cached: Prefs = DEFAULT_PREFS;

/** Per-browser preferences. Storage can be blocked, so every access is guarded. */
export function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cached = raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    }
    return cached;
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
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Live view of the saved preferences, safe for server rendering. */
export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, readPrefs, () => DEFAULT_PREFS);
}
