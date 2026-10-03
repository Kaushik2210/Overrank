"use client";

import { motion } from "motion/react";
import { Crown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { Tilt3D } from "@/components/ui/Tilt3D";
import { RankDelta } from "./RankDelta";
import { TeamLogo } from "./TeamLogo";
import { spring } from "@/lib/motion";
import { teamVars } from "@/lib/team-style";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { TeamStanding } from "@/lib/data/types";

type Props = {
  teams: TeamStanding[]; // already sorted, length 1..3
  /** team id that just took the lead, if any */
  newLeaderId?: string | null;
  leaderGain?: number;
};

// Presentation order on wide screens: 2nd, 1st, 3rd. On phones they stack 1st to 3rd.
const SLOT = [
  { order: "md:order-2", pedestal: "h-28", logo: 92, delay: 0.5, num: "text-5xl md:text-6xl" },
  { order: "md:order-1", pedestal: "h-20", logo: 68, delay: 0.3, num: "text-3xl md:text-4xl" },
  { order: "md:order-3", pedestal: "h-14", logo: 60, delay: 0.1, num: "text-3xl md:text-4xl" },
];

export function Podium({ teams, newLeaderId, leaderGain }: Props) {
  const rm = useReducedMotionSafe();
  const top = teams.slice(0, 3);

  return (
    <ol aria-label="Top three teams" className="grid items-end gap-4 md:grid-cols-3 md:gap-6">
      {top.map((t, i) => {
        const slot = SLOT[i];
        const first = i === 0;
        return (
          <motion.li
            key={t.id}
            layout
            layoutId={`team-${t.id}`}
            style={teamVars(t)}
            initial={rm ? { opacity: 0 } : { opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: rm ? 0 : slot.delay }}
            className={cn("group relative list-none", slot.order)}
          >
            {first && !rm && (
              <div aria-hidden className="pointer-events-none absolute inset-x-[-20%] -top-44 h-[26rem] overflow-hidden max-md:hidden [mask-image:linear-gradient(to_bottom,#000_10%,transparent)]">
                <motion.div className="absolute top-0 left-1/2 h-full w-[140%] origin-top -translate-x-1/2" style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 0deg, color-mix(in srgb, var(--team-primary) 38%, transparent) 14deg, transparent 28deg, transparent 332deg, color-mix(in srgb, var(--team-primary) 38%, transparent) 346deg, transparent 360deg)" }} animate={{ rotate: [-7, 7, -7] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
              </div>
            )}
            <Tilt3D max={7}>
            <Link
              href={`/teams/${t.slug}`}
              className={cn(
                "glass team-glow relative block overflow-hidden rounded-xl p-5 text-center transition-transform duration-300 hover:-translate-y-1.5 md:p-6",
                first && "md:pt-9",
              )}
            >
              <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-40 transition-opacity duration-300 group-hover:opacity-80" style={{ background: "radial-gradient(closest-side, var(--team-primary), transparent)" }} />

              <div className="relative flex items-center justify-between max-md:mb-1">
                <span className="num inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-0/60 px-2.5 py-1 text-xs text-dim">
                  {first && <Crown className="size-3.5 text-warn" aria-hidden />}#{t.rank}
                </span>
                <RankDelta rank={t.rank} previous={t.previousRank} />
              </div>

              <div className="relative mt-2 flex flex-col items-center max-md:flex-row max-md:gap-4 max-md:text-left">
                <span className="[transform:translateZ(46px)]"><TeamLogo name={t.name} slug={t.slug} color={t.colorPrimary} glow={t.colorGlow} size={slot.logo} /></span>
                <div className="max-md:flex-1 md:mt-3">
                  <h3 className={cn("font-display font-bold", first ? "text-2xl md:text-3xl" : "text-xl md:text-2xl")}>{t.name}</h3>
                  <p className="mt-0.5 hidden text-xs text-faint md:block">{t.motto}</p>
                  <div className={cn("mt-2 leading-none font-semibold md:mt-4", slot.num)} style={{ color: "var(--team-glow)" }}>
                    <AnimatedCounter value={t.points} duration={1.2} />
                  </div>
                  <p className="mt-1 text-[11px] tracking-[0.2em] text-faint uppercase">points</p>
                </div>
              </div>

              <div className="relative mt-4 flex items-center justify-center gap-4 text-xs text-dim">
                <span className={cn("num inline-flex items-center gap-1", t.weeklyGrowth > 0 ? "text-success" : t.weeklyGrowth < 0 ? "text-danger" : "")}>
                  <TrendingUp className="size-3.5" aria-hidden />
                  {t.weeklyGrowth > 0 ? "+" : ""}
                  {t.weeklyGrowth} this week
                </span>
                <span className="max-sm:hidden">{t.memberCount} members</span>
              </div>

              {newLeaderId === t.id && first && (
                <motion.div
                  aria-hidden
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 1.05] }}
                  transition={{ duration: 3.6, times: [0, 0.1, 0.8, 1] }}
                  className="pointer-events-none absolute inset-0 grid place-items-center bg-bg-0/55"
                >
                  <div className="text-center">
                    {!rm &&
                      Array.from({ length: 18 }, (_, k) => {
                        const a = (k / 18) * Math.PI * 2;
                        return <motion.span key={k} className="absolute top-1/2 left-1/2 size-1.5 rounded-full" style={{ background: k % 2 ? "var(--team-glow)" : "#fbbf24" }} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(a) * 130, y: Math.sin(a) * 90, opacity: 0, scale: 0.4 }} transition={{ duration: 1.3, ease: "easeOut", delay: 0.1 }} />;
                      })}
                    <p className="font-display text-sm font-bold tracking-[0.3em] text-warn">NEW LEADER</p>
                    {!!leaderGain && <p className="num mt-1 text-2xl text-success">+{leaderGain}</p>}
                  </div>
                </motion.div>
              )}
            </Link>
            </Tilt3D>

            {/* pedestal, hidden on phones */}
            <motion.div
              aria-hidden
              initial={rm ? { opacity: 0 } : { scaleY: 0 }}
              animate={rm ? { opacity: 1 } : { scaleY: 1 }}
              transition={{ ...spring, delay: rm ? 0 : slot.delay + 0.1 }}
              className={cn("relative mx-3 hidden origin-bottom md:block", slot.pedestal)}
            >
              {/* top face, tipped back for depth */}
              <div className="absolute inset-x-0 -top-3 h-3 origin-bottom [transform:perspective(160px)_rotateX(52deg)]" style={{ background: "color-mix(in srgb, var(--team-glow) 55%, #fff 0%)" }} />
              {/* front face */}
              <div className="grid size-full place-items-center border border-t-0 border-white/10" style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--team-primary) 55%, #05070d), color-mix(in srgb, var(--team-primary) 18%, #05070d))", boxShadow: "8px 10px 0 -2px rgb(0 0 0 / 0.5)" }}>
                <span className="num text-5xl font-bold text-black/40">{t.rank}</span>
              </div>
            </motion.div>
          </motion.li>
        );
      })}
    </ol>
  );
}
