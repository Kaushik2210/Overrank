"use client";

import { motion } from "motion/react";
import { Award, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { AnimatedProgressBar } from "@/components/gamification/AnimatedProgressBar";
import { RankDelta } from "./RankDelta";
import { TeamLogo } from "./TeamLogo";
import { spring } from "@/lib/motion";
import { teamVars } from "@/lib/team-style";
import { cn } from "@/lib/utils";
import type { TeamStanding } from "@/lib/data/types";

/** Ranked card for everyone beyond the podium (and for the Teams page). */
export function TeamCard({ team: t, leaderPoints, index = 0, className }: { team: TeamStanding; leaderPoints: number; index?: number; className?: string }) {
  const share = leaderPoints > 0 ? Math.max(0, t.points) / leaderPoints : 0;
  return (
    <motion.li
      layout
      layoutId={`team-${t.id}`}
      style={teamVars(t)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.55 + index * 0.06 }}
      className={cn("list-none", className)}
    >
      <Link
        href={`/teams/${t.slug}`}
        className="glass group relative block overflow-hidden rounded-lg p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--team-primary)_55%,transparent),0_0_40px_-10px_var(--team-primary)] sm:p-5"
      >
        <div aria-hidden className="absolute -top-16 -right-16 size-44 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-50" style={{ background: "var(--team-primary)" }} />
        <div className="relative flex items-center gap-4">
          <div className="grid w-10 shrink-0 place-items-center">
            <span className="num text-3xl font-bold text-faint">{t.rank}</span>
            <RankDelta rank={t.rank} previous={t.previousRank} />
          </div>
          <TeamLogo name={t.name} slug={t.slug} color={t.colorPrimary} glow={t.colorGlow} size={52} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-bold">{t.name}</h3>
            <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-faint">
              <span className="inline-flex items-center gap-1">
                <Users className="size-3" aria-hidden />
                {t.memberCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Award className="size-3" aria-hidden />
                {t.achievementCount}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl leading-none font-semibold sm:text-3xl" style={{ color: "var(--team-glow)" }}>
              <AnimatedCounter value={t.points} />
            </div>
            <div className={cn("num mt-1 inline-flex items-center gap-1 text-xs", t.weeklyGrowth > 0 ? "text-success" : t.weeklyGrowth < 0 ? "text-danger" : "text-faint")}>
              <TrendingUp className="size-3" aria-hidden />
              {t.weeklyGrowth > 0 ? "+" : ""}
              {t.weeklyGrowth}
            </div>
          </div>
        </div>
        <div className="relative mt-4">
          <AnimatedProgressBar value={share} label={`${t.name} points relative to the leader`} height={6} />
        </div>
      </Link>
    </motion.li>
  );
}
