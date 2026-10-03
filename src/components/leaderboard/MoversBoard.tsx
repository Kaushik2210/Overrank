"use client";

import { LayoutGroup, motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { TeamLogo } from "./TeamLogo";
import { spring } from "@/lib/motion";
import { teamVars } from "@/lib/team-style";
import { cn } from "@/lib/utils";
import type { TeamStanding } from "@/lib/data/types";

/** Who gained the most in the last seven days. Bars grow from a shared zero line in each direction. */
export function MoversBoard({ teams }: { teams: TeamStanding[] }) {
  const rows = [...teams].sort((a, b) => b.weeklyGrowth - a.weeklyGrowth || a.name.localeCompare(b.name));
  const span = Math.max(1, ...rows.map((t) => Math.abs(t.weeklyGrowth)));
  const any = rows.some((t) => t.weeklyGrowth !== 0);

  return (
    <div>
      {!any && <p className="mb-4 rounded-md border border-line bg-surface p-3 text-sm text-dim">Nobody has moved this week. Points scored in the last seven days show up here.</p>}
      <LayoutGroup>
        <ol aria-label="Weekly movers" className="space-y-2.5">
          {rows.map((t, i) => {
            const g = t.weeklyGrowth;
            const Icon = g > 0 ? ArrowUpRight : g < 0 ? ArrowDownRight : Minus;
            return (
              <motion.li key={t.id} layout transition={spring} style={teamVars(t)} className="list-none">
                <Link href={`/teams/${t.slug}`} className="glass flex items-center gap-4 rounded-lg p-3.5 transition-transform duration-200 hover:-translate-y-0.5 sm:p-4">
                  <span className="num w-6 text-center text-lg font-bold text-faint">{i + 1}</span>
                  <TeamLogo name={t.name} slug={t.slug} color={t.colorPrimary} glow={t.colorGlow} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.name}</p>
                    <div className="mt-2 grid grid-cols-2 items-center">
                      <div className="flex h-2.5 justify-end overflow-hidden rounded-l-full bg-white/[0.06]">
                        <motion.div className="h-full w-full origin-right rounded-l-full bg-danger" initial={{ scaleX: 0 }} whileInView={{ scaleX: g < 0 ? Math.abs(g) / span : 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.05 }} />
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-r-full bg-white/[0.06]">
                        <motion.div className="h-full w-full origin-left rounded-r-full" style={{ background: "linear-gradient(90deg, var(--team-primary), var(--team-glow))" }} initial={{ scaleX: 0 }} whileInView={{ scaleX: g > 0 ? g / span : 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.05 }} />
                      </div>
                    </div>
                  </div>
                  <span className={cn("num flex w-24 items-center justify-end gap-1 text-lg font-semibold", g > 0 ? "text-success" : g < 0 ? "text-danger" : "text-faint")}>
                    <Icon className="size-4" aria-hidden />
                    <AnimatedCounter value={g} signed duration={0.7} />
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ol>
      </LayoutGroup>
    </div>
  );
}
