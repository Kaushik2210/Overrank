"use client";

import { motion } from "motion/react";
import { ArrowRight, Users } from "lucide-react";
import { GridBackground } from "@/components/background/GridBackground";
import { ParticleField } from "@/components/background/ParticleField";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { Button } from "@/components/ui/Button";
import { ease } from "@/lib/motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

type Stat = { label: string; value: number };

const line = (i: number, rm: boolean) => ({
  initial: rm ? { opacity: 0 } : { opacity: 0, y: "110%" },
  animate: rm ? { opacity: 1 } : { opacity: 1, y: "0%" },
  transition: { duration: 0.6, ease: ease.out, delay: 0.25 + i * 0.12 },
});

export function Hero({ stats }: { stats: Stat[] }) {
  const rm = useReducedMotionSafe();
  return (
    <section className="noise relative isolate overflow-hidden">
      <GridBackground />
      <ParticleField />
      {/* scanline */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(0deg,transparent_0_3px,#fff_3px_4px)]" />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="num inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[11px] tracking-[0.25em] text-accent uppercase"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden /> Season live
        </motion.p>

        <h1 className="mt-6 font-display text-[2.6rem] leading-[0.98] font-bold tracking-tight sm:text-7xl lg:text-[5.5rem]">
          {["THE CAMPUS", "COMPETITION", "HAS BEGUN."].map((t, i) => (
            <span key={t} className="block overflow-hidden pb-1">
              <motion.span {...line(i, rm)} className={i === 2 ? "block bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent" : "block"}>
                {t}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5, ease: ease.out }}
          className="mt-6 max-w-xl text-lg text-dim sm:text-xl"
        >
          Every achievement counts. Every point matters.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5, ease: ease.out }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Button href="/leaderboard" size="lg">
            VIEW LEADERBOARD <ArrowRight className="size-4" />
          </Button>
          <Button href="/teams" size="lg" variant="outline">
            <Users className="size-4" /> MEET THE TEAMS
          </Button>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5, ease: ease.out }}
          className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-lg px-4 py-4">
              <dd className="text-3xl font-semibold sm:text-4xl">
                <AnimatedCounter value={s.value} />
              </dd>
              <dt className="mt-1 text-[11px] tracking-[0.18em] text-faint uppercase">{s.label}</dt>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
