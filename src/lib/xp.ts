import type { XpSettings } from "@/lib/data/types";

export const DEFAULT_XP: XpSettings = {
  xpPerPoint: 1,
  thresholds: [100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000],
};

export type LevelInfo = {
  xp: number;
  level: number;
  levelProgress: number;
  xpToNext: number;
  levelFloor: number;
  levelCeil: number;
};

/** Cumulative xp needed to *reach* `level` (level 1 needs 0). Past the table, the last gap repeats. */
export function xpForLevel(level: number, s: XpSettings = DEFAULT_XP) {
  if (level <= 1) return 0;
  const t = s.thresholds;
  if (level - 2 < t.length) return t[level - 2];
  const gap = t.length > 1 ? t[t.length - 1] - t[t.length - 2] : t[0] ?? 100;
  return t[t.length - 1] + gap * (level - 1 - t.length);
}

export function levelFromPoints(points: number, s: XpSettings = DEFAULT_XP): LevelInfo {
  const xp = Math.max(0, Math.round(points * s.xpPerPoint));
  let level = 1;
  while (xpForLevel(level + 1, s) <= xp && level < 999) level++;
  const levelFloor = xpForLevel(level, s);
  const levelCeil = xpForLevel(level + 1, s);
  return {
    xp,
    level,
    levelFloor,
    levelCeil,
    levelProgress: levelCeil === levelFloor ? 1 : (xp - levelFloor) / (levelCeil - levelFloor),
    xpToNext: levelCeil - xp,
  };
}
