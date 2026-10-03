"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AchievementUnlockModal } from "./AchievementUnlockModal";
import type { Achievement } from "@/lib/data/types";

const EVENT = "hc-seen-change";
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, ids: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable: skip the celebration rather than break the page */
  }
};
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Remembers which badges a student has already seen (per browser). The first visit just records
 * what they hold; afterwards any new badge opens the unlock modal.
 */
export function UnlockWatcher({ studentId, unlocked }: { studentId: string; unlocked: Achievement[] }) {
  const key = `hc_seen_${studentId}`;
  // "ssr" while rendering on the server so nothing opens before hydration
  const raw = useSyncExternalStore(subscribe, () => read(key) ?? "none", () => "ssr");

  // first ever visit: record current badges silently
  useEffect(() => {
    if (raw === "none") write(key, unlocked.map((a) => a.id));
  }, [raw, key, unlocked]);

  let seen: string[] = [];
  if (raw !== "none" && raw !== "ssr") {
    try {
      seen = JSON.parse(raw);
    } catch {
      seen = [];
    }
  }
  const fresh = raw === "none" || raw === "ssr" ? [] : unlocked.filter((a) => !seen.includes(a.id));
  const current = fresh[0] ?? null;

  return <AchievementUnlockModal achievement={current} open={!!current} onClose={() => current && write(key, [...seen, current.id])} />;
}
