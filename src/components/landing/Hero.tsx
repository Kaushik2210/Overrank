"use client";

import { motion, useMotionTemplate, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ChevronDown, Users } from "lucide-react";
import { useRef } from "react";
import { GridBackground } from "@/components/background/GridBackground";
import { ParticleField } from "@/components/background/ParticleField";
import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { Magnetic } from "@/components/fx/Magnetic";
import { Button } from "@/components/ui/Button";
import { ease } from "@/lib/motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

type Stat = { label: string; value: number };

const HEX = "M50 4 92 27v46L50 96 8 73V27z";
const PLATES = [
  { fill: "rgb(212 255 58 / 0.05)", stroke: "rgb(212 255 58 / 0.35)", label: "" },
  { fill: "rgb(212 255 58 / 0.09)", stroke: "rgb(212 255 58 / 0.55)", label: "" },
  { fill: "rgb(212 255 58 / 0.15)", stroke: "rgb(212 255 58 / 0.85)", label: "" },
  { fill: "#d4ff3a", stroke: "#f5ff9e", label: "OR" },
];

const line = (i: number, rm: boolean) => ({
  initial: rm ? { opacity: 0 } : { opacity: 0, y: "110%" },
  animate: rm ? { opacity: 1 } : { opacity: 1, y: "0%" },
  transition: { duration: 0.6, ease: ease.out, delay: 0.25 + i * 0.12 },
});

/**
 * Scroll-pinned hero. The section is tall; the stage inside is sticky. As you scroll, the camera
 * dives: the hex plates fly apart along Z, tilt up to face you, and the headline swaps to its second line.
 */
export function Hero({ stats }: { stats: Stat[] }) {
  const rm = useReducedMotionSafe();
  const ref = useRef<HTMLElement>(null);
  // follows the scroll directly (the old spring trailed behind the page and read as lag)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const rotX = useTransform(p, [0, 1], [62, 14]);
  const rotY = useTransform(p, [0, 0.5, 1], [-26, 8, 30]);
  const scale = useTransform(p, [0, 1], [1, 1.45]);
  const plateOpacity = useTransform(p, [0, 0.85, 1], [1, 1, 0.15]);
  const copyA = useTransform(p, [0, 0.2, 0.36], [1, 1, 0]);
  const copyAy = useTransform(p, [0, 0.36], [0, -90]);
  const copyAblur = useTransform(p, [0.2, 0.36], [0, 12]);
  const copyAfilter = useMotionTemplate`blur(${copyAblur}px)`;
  const copyB = useTransform(p, [0.4, 0.58, 1], [0, 1, 1]);
  const copyBy = useTransform(p, [0.4, 0.58], [70, 0]);
  const floorY = useTransform(p, [0, 1], [0, 160]);
  const cue = useTransform(p, [0, 0.12], [1, 0]);

  return (
    <section ref={ref} className={`noise relative isolate ${rm ? "" : "h-[260vh]"}`}>
      <div className={`${rm ? "relative py-20" : "sticky top-0 h-dvh"} overflow-hidden`}>
        <GridBackground />
        <ParticleField />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(0deg,transparent_0_3px,#fff_3px_4px)]" />
        <div aria-hidden className="aurora pointer-events-none absolute -top-1/4 -left-1/4 size-[60rem] rounded-full bg-[radial-gradient(closest-side,rgb(212_255_58/0.10),transparent)]" />

        {/* perspective floor that rushes toward you as you scroll */}
        <motion.div aria-hidden style={rm ? undefined : { y: floorY }} className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] will-change-transform [perspective:520px] max-md:opacity-60">
          <div className="absolute inset-x-[-40%] bottom-0 h-[220%] origin-bottom [transform:rotateX(68deg)] [mask-image:linear-gradient(to_top,#000_15%,transparent_85%)]">
            <div
              className={rm ? "h-full w-full" : "floor-run h-[calc(100%+56px)] w-full -translate-y-[56px]"}
              style={{ backgroundImage: "linear-gradient(to right, rgb(212 255 58 / 0.28) 1px, transparent 1px), linear-gradient(to bottom, rgb(212 255 58 / 0.28) 1px, transparent 1px)", backgroundSize: "56px 56px" }}
            />
          </div>
        </motion.div>

        {/* 3D plate stack */}
        <div aria-hidden className="pointer-events-none absolute top-1/2 right-[6%] size-[28rem] -translate-y-[56%] [perspective:1200px] max-lg:right-[-14%] max-md:top-[24%] max-md:right-[-3rem] max-md:size-[12rem] max-md:opacity-30">
          <motion.div className="preserve-3d relative size-full will-change-transform" style={rm ? undefined : { rotateX: rotX, rotateY: rotY, scale }}>
            {PLATES.map((pl, i) => (
              <Plate key={i} i={i} progress={p} fade={plateOpacity} fill={pl.fill} stroke={pl.stroke} label={pl.label} still={rm} />
            ))}
          </motion.div>
        </div>

        {/* copy, layer A */}
        <motion.div style={rm ? undefined : { opacity: copyA, y: copyAy, filter: copyAfilter }} className={`px-4 sm:px-6 ${rm ? "relative" : "absolute inset-0 grid content-center will-change-[transform,opacity,filter]"}`}>
          <div className="mx-auto w-full max-w-6xl">
            <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="num inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[11px] tracking-[0.25em] text-accent uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden /> Season live
            </motion.p>
            <h1 className="mt-6 font-display text-[2.6rem] leading-[0.98] font-bold tracking-tight sm:text-7xl lg:text-[5.5rem]">
              {["THE CAMPUS", "COMPETITION", "HAS BEGUN."].map((t, i) => (
                <span key={t} className="block overflow-hidden pb-1">
                  {rm ? (
                    <span className={i === 2 ? "block text-accent [text-shadow:4px_4px_0_rgb(0_0_0/0.6)]" : "block"}>{t}</span>
                  ) : (
                    <motion.span {...line(i, rm)} className={i === 2 ? "block text-accent [text-shadow:4px_4px_0_rgb(0_0_0/0.6)]" : "block"}>
                      {t}
                    </motion.span>
                  )}
                </span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5, ease: ease.out }} className="mt-6 max-w-xl text-lg text-dim sm:text-xl">
              Every achievement counts. Every point matters.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5, ease: ease.out }} className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Button href="/leaderboard" size="lg">
                  VIEW LEADERBOARD <ArrowRight className="size-4" />
                </Button>
              </Magnetic>
              <Magnetic>
                <Button href="/teams" size="lg" variant="outline">
                  <Users className="size-4" /> MEET THE TEAMS
                </Button>
              </Magnetic>
            </motion.div>
            <motion.dl initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5, ease: ease.out }} className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        </motion.div>

        {/* copy, layer B (scroll only) */}
        {!rm && (
          <motion.div style={{ opacity: copyB, y: copyBy }} className="pointer-events-none absolute inset-0 grid content-center px-4 sm:px-6">
            <div className="mx-auto w-full max-w-6xl">
              <p className="num text-xs tracking-[0.3em] text-accent uppercase">Six houses</p>
              <h2 className="mt-4 max-w-3xl font-display text-5xl leading-[0.95] font-bold sm:text-7xl lg:text-8xl">
                ONE CLIMB.
                <span className="block text-accent [text-shadow:4px_4px_0_rgb(0_0_0/0.6)]">NO SHORTCUTS.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg text-dim">Points are earned on the ground and verified by faculty. Scroll on and watch the race unfold.</p>
            </div>
          </motion.div>
        )}

        {!rm && (
          <motion.div aria-hidden style={{ opacity: cue }} className="absolute bottom-6 left-1/2 -translate-x-1/2 text-faint">
            <div className="flex flex-col items-center gap-1 text-[10px] tracking-[0.3em] uppercase">
              Scroll
              <ChevronDown className="size-4 animate-bounce" />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function Plate({ i, progress, fade, fill, stroke, label, still }: { i: number; progress: MotionValue<number>; fade: MotionValue<number>; fill: string; stroke: string; label: string; still: boolean }) {
  // plates start close together and fly apart along Z as the hero scrolls
  const z = useTransform(progress, (s) => (i - 1.5) * (60 + s * 260));
  return (
    <motion.div className="preserve-3d absolute inset-0" style={still ? { transform: `translateZ(${(i - 1.5) * 60}px)` } : { z }}>
      {/* opacity lives here, not on the preserve-3d parent: any opacity below 1 there flattens the stack and kills the Z flight */}
      <motion.div className={still ? "" : "bob"} style={{ animationDelay: `${i * -0.7}s`, opacity: still ? 1 : fade }}>
        <svg viewBox="0 0 100 100" className="size-full drop-shadow-[0_18px_30px_rgb(0_0_0/0.55)]">
          <path d={HEX} fill={fill} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          {label && (
            <text x="50" y="62" textAnchor="middle" fontSize="30" fontWeight="800" fill="#05070d" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              {label}
            </text>
          )}
        </svg>
      </motion.div>
    </motion.div>
  );
}
