"use client";

import { LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { AchievementBadge, RARITY } from "./AchievementBadge";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { Achievement, AchievementRarity } from "@/lib/data/types";

export type GalleryItem = Achievement & { unlockedAt: string | null; unlockedBy: number; progress: number | null; ruleText: string };

const TABS: ("all" | AchievementRarity)[] = ["all", "common", "rare", "epic", "legendary"];

export function AchievementGallery({ items, signedIn }: { items: GalleryItem[]; signedIn: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const shown = items.filter((a) => tab === "all" || a.rarity === tab);
  const got = items.filter((a) => a.unlockedAt).length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Filter by rarity" className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("relative h-10 rounded-full px-4 text-sm font-medium capitalize transition-colors", tab === t ? "text-bg-0" : "text-dim hover:text-ink")}>
              {tab === t && <motion.span layoutId="rarity-tab" transition={spring} className="absolute inset-0 rounded-full bg-accent" />}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>
        {signedIn && (
          <p className="num text-sm text-dim">
            {got} / {items.length} unlocked
          </p>
        )}
      </div>

      <LayoutGroup>
        <motion.ul layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => {
            const locked = signedIn && !a.unlockedAt;
            return (
              <motion.li key={a.id} layout transition={spring} className={cn("glass flex gap-4 rounded-lg p-5", locked && "opacity-70")}>
                <AchievementBadge icon={a.icon} rarity={a.rarity} locked={locked} size={72} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg leading-tight font-bold">{a.name}</h3>
                    <span className="num shrink-0 text-[10px] tracking-wider uppercase" style={{ color: RARITY[a.rarity].color }}>
                      {RARITY[a.rarity].label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-dim">{a.description}</p>
                  <p className="mt-2 text-xs text-faint">{a.ruleText}</p>
                  {locked && a.progress !== null && <AnimatedProgressBar value={a.progress} label={`${a.name} progress`} className="mt-3" height={6} color={RARITY[a.rarity].color} />}
                  <p className="num mt-2 flex justify-between text-xs text-faint">
                    <span>+{a.xp} XP</span>
                    <span>{a.unlockedBy} unlocked</span>
                  </p>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </LayoutGroup>
    </div>
  );
}
