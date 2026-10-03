"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Medal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { AnimatedProgressBar } from "@/components/gamification/AnimatedProgressBar";
import { StudentAvatar } from "@/components/gamification/StudentAvatar";
import { spring } from "@/lib/motion";
import { teamVars } from "@/lib/team-style";
import { cn } from "@/lib/utils";
import type { StudentStanding, Team } from "@/lib/data/types";

const MEDAL = ["#fbbf24", "#cbd5e1", "#d97706"];

/** Top players. Team chips filter the list and the rows re-rank with shared-layout motion. */
export function PlayersBoard({ students, teams }: { students: StudentStanding[]; teams: Team[] }) {
  const [team, setTeam] = useState<string>("all");

  const rows = useMemo(() => {
    const list = students.filter((s) => team === "all" || s.teamId === team);
    return [...list].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)).slice(0, 10);
  }, [students, team]);
  const top = Math.max(1, rows[0]?.points ?? 1);
  const anyScore = rows.some((r) => r.points !== 0);

  return (
    <div>
      <div role="tablist" aria-label="Filter players by team" className="mb-6 flex flex-wrap gap-2">
        {[{ id: "all", name: "Everyone", colorPrimary: "var(--accent)" }, ...teams].map((t) => {
          const on = team === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setTeam(t.id)}
              className={cn("relative flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors", on ? "border-transparent text-bg-0" : "border-line text-dim hover:text-ink")}
            >
              {on && <motion.span layoutId="player-chip" transition={spring} className="absolute inset-0 rounded-full" style={{ background: t.colorPrimary }} />}
              <span className="relative flex items-center gap-2">
                {!on && t.id !== "all" && <span className="size-2 rounded-full" style={{ background: t.colorPrimary }} aria-hidden />}
                {t.name}
              </span>
            </button>
          );
        })}
      </div>

      {!anyScore && <p className="mb-4 rounded-md border border-line bg-surface p-3 text-sm text-dim">No player has scored yet. This list fills in as soon as faculty award points.</p>}

      <LayoutGroup>
        <ol aria-label="Top players" className="space-y-2.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {rows.map((s, i) => (
              <motion.li key={s.id} layout initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={spring} style={teamVars({ colorPrimary: s.teamColor, colorGlow: s.teamGlow })} className="list-none">
                <Link href={`/students/${s.id}`} className="glass group relative flex items-center gap-4 overflow-hidden rounded-lg p-3.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--team-primary)_55%,transparent),0_14px_40px_-16px_var(--team-primary)] sm:p-4">
                  <span className="grid w-9 shrink-0 place-items-center">
                    {rows[i].points > 0 && i < 3 ? <Medal className="size-6" style={{ color: MEDAL[i] }} aria-label={`Rank ${i + 1}`} /> : <span className="num text-xl font-bold text-faint">{i + 1}</span>}
                  </span>
                  <StudentAvatar name={s.name} color={s.teamColor} glow={s.teamGlow} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-semibold">{s.name}</p>
                      <p className="num shrink-0 text-xl font-semibold" style={{ color: "var(--team-glow)" }}>
                        <AnimatedCounter value={s.points} duration={0.7} />
                      </p>
                    </div>
                    <p className="num truncate text-xs text-faint">
                      <span style={{ color: s.teamColor }}>{s.teamName}</span> · Level {s.level} · {s.xp} XP
                    </p>
                    <AnimatedProgressBar value={s.points > 0 ? s.points / top : 0} label={`${s.name} points relative to the leader`} height={5} className="mt-2" />
                  </div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </LayoutGroup>
    </div>
  );
}
