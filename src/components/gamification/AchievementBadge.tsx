import { Icon, Lock } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { AchievementRarity } from "@/lib/data/types";

export const RARITY: Record<AchievementRarity, { color: string; label: string }> = {
  common: { color: "#94a3b8", label: "Common" },
  rare: { color: "#38bdf8", label: "Rare" },
  epic: { color: "#a78bfa", label: "Epic" },
  legendary: { color: "#fbbf24", label: "Legendary" },
};

type Props = {
  icon: string;
  rarity: AchievementRarity;
  locked?: boolean;
  size?: number;
  className?: string;
};

/** Hexagonal badge. Locked badges are greyed out with a padlock. */
export function AchievementBadge({ icon, rarity, locked, size = 72, className }: Props) {
  const c = locked ? "#475069" : RARITY[rarity].color;
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size, ["--bs" as string]: `${size * 0.36}px`, filter: locked ? "none" : `drop-shadow(0 0 12px ${c}77)` }}
    >
      <svg viewBox="0 0 64 64" className="absolute inset-0" aria-hidden>
        <path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill={`${c}22`} stroke={c} strokeWidth="2" strokeLinejoin="round" />
        <path d="M32 9 52 20.5v23L32 55 12 43.5v-23z" fill="none" stroke={c} strokeOpacity=".35" strokeWidth="1" />
      </svg>
      <span className="relative" style={{ color: c }}>
        {locked ? <Lock className="size-[34%]" style={{ width: size * 0.3, height: size * 0.3 }} aria-hidden /> : <span style={{ display: "grid" }} className="[&>svg]:size-[var(--bs)]"><Icon name={icon} /></span>}
      </span>
    </span>
  );
}
