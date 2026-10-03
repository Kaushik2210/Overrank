"use client";

import { AnimatePresence, motion } from "motion/react";
import { Flame, Play, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { LeaderboardView } from "./LeaderboardView";
import { MoversBoard } from "./MoversBoard";
import { PlayersBoard } from "./PlayersBoard";
import { SeasonRace } from "./SeasonRace";
import { spring } from "@/lib/motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import type { Analytics, StudentStanding, TeamStanding } from "@/lib/data/types";

const ALL_TABS = [
  { id: "teams", label: "Teams", icon: Trophy },
  { id: "players", label: "Players", icon: Users },
  { id: "movers", label: "Movers", icon: Flame },
  { id: "replay", label: "Season replay", icon: Play },
] as const;
type Tab = (typeof ALL_TABS)[number]["id"];

/** One leaderboard, four views. The tab indicator glides and each view slides in from the direction of travel. */
export function LeaderboardTabs({ teams, students, series }: { teams: TeamStanding[]; students: StudentStanding[]; series: Analytics["pointsOverTime"] }) {
  const rm = useReducedMotionSafe();
  // a replay of an empty season says nothing, so that view appears once the first points land
  const TABS = teams.some((t) => t.points !== 0) ? ALL_TABS : ALL_TABS.filter((t) => t.id !== "replay");
  const [tab, setTab] = useState<Tab>("teams");
  const [dir, setDir] = useState(1);
  const idx = TABS.findIndex((t) => t.id === tab);

  const go = (next: Tab) => {
    setDir(TABS.findIndex((t) => t.id === next) > idx ? 1 : -1);
    setTab(next);
  };

  return (
    <div>
      <div role="tablist" aria-label="Leaderboard views" className="mb-8 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 [scrollbar-width:none] sm:inline-flex">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              id={`lb-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`lb-panel-${t.id}`}
              onClick={() => go(t.id)}
              className={cn("relative flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors", on ? "text-bg-0" : "text-dim hover:text-ink")}
            >
              {on && <motion.span layoutId="lb-tab" transition={spring} className="absolute inset-0 rounded-full bg-accent shadow-[0_0_24px_-6px_var(--accent)]" />}
              <t.icon className="relative size-4" aria-hidden />
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={tab}
          id={`lb-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`lb-tab-${tab}`}
          custom={dir}
          initial={rm ? { opacity: 0 } : { opacity: 0, x: dir * 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={rm ? { opacity: 0 } : { opacity: 0, x: dir * -48 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "teams" && <LeaderboardView initial={teams} />}
          {tab === "players" && <PlayersBoard students={students} teams={teams} />}
          {tab === "movers" && <MoversBoard teams={teams} />}
          {tab === "replay" && <SeasonRace teams={teams} series={series} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
