"use client";

import { useEffect, useState } from "react";
import { AchievementUnlockModal } from "./AchievementUnlockModal";
import type { Achievement } from "@/lib/data/types";

/**
 * Remembers which badges a student has already seen (per browser). The first visit just records
 * what they hold; afterwards any new badge opens the unlock modal.
 */
export function UnlockWatcher({ studentId, unlocked }: { studentId: string; unlocked: Achievement[] }) {
  const [queue, setQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    const key = `hc_seen_${studentId}`;
    const ids = unlocked.map((a) => a.id);
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        localStorage.setItem(key, JSON.stringify(ids));
        return;
      }
      const seen = new Set<string>(JSON.parse(raw));
      const fresh = unlocked.filter((a) => !seen.has(a.id));
      if (fresh.length) {
        setQueue(fresh);
        localStorage.setItem(key, JSON.stringify(ids));
      }
    } catch {
      /* storage unavailable: skip the celebration rather than break the page */
    }
  }, [studentId, unlocked]);

  return <AchievementUnlockModal achievement={queue[0] ?? null} open={queue.length > 0} onClose={() => setQueue((q) => q.slice(1))} />;
}
