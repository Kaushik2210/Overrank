"use client";

import { LayoutGroup, motion, useInView } from "motion/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { TeamLogo } from "./TeamLogo";
import { spring } from "@/lib/motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import type { Analytics, TeamStanding } from "@/lib/data/types";

/**
 * Bar-chart race through the season. Press play, or drag the slider to scrub week by week.
 * Bars re-rank with shared-layout animation; widths use scaleX so only transforms animate.
 */
export function SeasonRace({ teams, series }: { teams: TeamStanding[]; series: Analytics["pointsOverTime"] }) {
  const rm = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const last = series.length - 1;
  const [week, setWeek] = useState(rm ? last : 0);
  const [playing, setPlaying] = useState(false);
  const started = useRef(false);

  // autoplay once, the first time the race scrolls into view
  useEffect(() => {
    if (inView && !started.current && !rm) {
      started.current = true;
      setPlaying(true);
    }
  }, [inView, rm]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setWeek((w) => {
        if (w >= last) {
          setPlaying(false);
          return last;
        }
        return w + 1;
      });
    }, 1100);
    return () => window.clearInterval(id);
  }, [playing, last]);

  const rows = useMemo(() => {
    const point = series[week] ?? {};
    const max = Math.max(1, ...series.flatMap((s) => teams.map((t) => Number(s[t.slug] ?? 0))));
    return {
      max,
      list: teams.map((t) => ({ team: t, value: Number(point[t.slug] ?? 0) })).sort((a, b) => b.value - a.value),
    };
  }, [series, teams, week]);

  const label = String(series[week]?.date ?? "");

  return (
    <div ref={ref} className="glass rounded-xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            if (week >= last) setWeek(0);
            setPlaying((p) => !p);
          }}
          aria-label={playing ? "Pause the season replay" : "Play the season replay"}
          className="grid size-11 place-items-center rounded-full bg-accent text-bg-0 shadow-[0_0_24px_-4px_var(--accent)] transition-transform hover:scale-105 active:scale-95"
        >
          {playing ? <Pause className="size-5" /> : week >= last ? <RotateCcw className="size-5" /> : <Play className="size-5 translate-x-px" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="num text-[11px] tracking-[0.25em] text-faint uppercase">Week {week} of {last}</p>
          <p className="font-display text-xl font-bold">{label}</p>
        </div>
        <label className="flex min-w-[10rem] flex-1 items-center gap-3 sm:max-w-sm">
          <span className="sr-only">Scrub through the season</span>
          <input
            type="range"
            min={0}
            max={last}
            value={week}
            onChange={(e) => {
              setPlaying(false);
              setWeek(Number(e.target.value));
            }}
            className="h-11 w-full cursor-pointer accent-[var(--accent)]"
          />
        </label>
      </div>

      <LayoutGroup>
        <ol aria-label={`Standings for ${label}`} className="space-y-2.5">
          {rows.list.map(({ team: t, value }, i) => (
            <motion.li key={t.id} layout transition={rm ? { duration: 0 } : spring} className="flex items-center gap-3">
              <span className="num w-5 text-center text-sm font-bold text-faint">{i + 1}</span>
              <TeamLogo name={t.name} slug={t.slug} color={t.colorPrimary} glow={t.colorGlow} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold">{t.name}</span>
                  <span className="num text-sm font-semibold" style={{ color: t.colorGlow }}>
                    <AnimatedCounter value={value} duration={0.8} />
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <motion.div
                    className="h-full w-full origin-left rounded-full"
                    style={{ background: `linear-gradient(90deg, ${t.colorPrimary}, ${t.colorGlow})`, boxShadow: `0 0 14px ${t.colorPrimary}88` }}
                    animate={{ scaleX: Math.max(0.015, value / rows.max) }}
                    transition={rm ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </LayoutGroup>
    </div>
  );
}
