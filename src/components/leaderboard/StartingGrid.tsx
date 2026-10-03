"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TeamLogo } from "./TeamLogo";
import { Tilt3D } from "@/components/ui/Tilt3D";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { spring } from "@/lib/motion";
import { teamVars } from "@/lib/team-style";
import { cn } from "@/lib/utils";
import type { TeamStanding } from "@/lib/data/types";

/** Five race-start lights that switch on one by one, hold, then go out together, on a loop. */
function StartLights({ active }: { active: boolean }) {
  const rm = useReducedMotionSafe();
  const [lit, setLit] = useState(rm ? 5 : 0);
  useEffect(() => {
    if (rm) return;
    let n = 0;
    const id = window.setInterval(() => {
      n = (n + 1) % 8; // 0..5 lights, a beat of full red, then a beat dark
      setLit(n <= 5 ? n : n === 6 ? 5 : 0);
    }, active ? 260 : 520);
    return () => window.clearInterval(id);
  }, [rm, active]);
  return (
    <div className="flex justify-center gap-2.5" role="img" aria-label="Race start lights: the season has not started yet">
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span
          key={i}
          className={cn("size-4 rounded-full border border-white/10 sm:size-5", i < lit ? "bg-danger" : "bg-white/[0.06]")}
          animate={{ boxShadow: i < lit ? "0 0 22px 4px rgb(248 113 113 / 0.65)" : "0 0 0px 0px rgb(248 113 113 / 0)" }}
          transition={{ duration: 0.18 }}
        />
      ))}
    </div>
  );
}

/**
 * Shown while nobody has scored. A podium of six tied teams would mislead, so the teams line up
 * on a starting grid under the race lights instead, in the same order the leaderboard will use.
 */
export function StartingGrid({ teams }: { teams: TeamStanding[] }) {
  const [hot, setHot] = useState(false);
  return (
    <div className="space-y-10" onPointerEnter={() => setHot(true)} onPointerLeave={() => setHot(false)}>
      <div className="text-center">
        <StartLights active={hot} />
        <p className="num mt-5 text-xs tracking-[0.35em] text-accent uppercase">Awaiting the first point</p>
        <h2 className="mt-2 font-display text-4xl font-bold sm:text-6xl">THE GRID IS SET.</h2>
        <p className="mx-auto mt-3 max-w-md text-dim">Six houses, zero points. The moment faculty award the first one, this board comes alive.</p>
      </div>

      <ol aria-label="Starting grid" className="mx-auto grid max-w-4xl gap-x-6 gap-y-3 sm:grid-cols-2">
        {teams.map((t, i) => (
          <motion.li
            key={t.id}
            style={teamVars(t)}
            initial={{ opacity: 0, x: i % 2 ? 40 : -40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ ...spring, delay: 0.1 + i * 0.09 }}
            className={cn("list-none", i % 2 ? "sm:mt-8" : "")}
          >
            <Tilt3D max={7}>
              <Link
                href={`/teams/${t.slug}`}
                className="glass group relative flex items-center gap-4 overflow-hidden rounded-lg p-4 transition-shadow duration-300 hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--team-primary)_60%,transparent),0_0_46px_-8px_var(--team-primary)]"
              >
                <span className="num w-10 text-center text-xs font-bold tracking-widest text-faint">P{i + 1}</span>
                <span className="[transform:translateZ(36px)]">
                  <TeamLogo name={t.name} slug={t.slug} color={t.colorPrimary} glow={t.colorGlow} size={56} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-xl font-bold">{t.name}</span>
                  <span className="block truncate text-xs text-faint">{t.motto}</span>
                </span>
                <span className="num rounded-full border border-line px-2.5 py-1 text-[10px] tracking-widest text-dim uppercase transition-colors group-hover:border-[var(--team-primary)] group-hover:text-ink">Ready</span>
                <span aria-hidden className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100" style={{ background: "var(--team-primary)" }} />
              </Link>
            </Tilt3D>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
