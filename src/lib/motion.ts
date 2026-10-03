"use client";

import type { Transition, Variants } from "motion/react";

/** Durations in seconds. Nothing longer than `slow` outside the hero sequence. */
export const duration = { fast: 0.15, base: 0.25, slow: 0.45, hero: 0.9 } as const;

export const ease = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const spring: Transition = { type: "spring", stiffness: 300, damping: 30 };
export const springSnappy: Transition = { type: "spring", stiffness: 520, damping: 32, mass: 0.7 };

export const tween = (d: keyof typeof duration = "base"): Transition => ({
  duration: duration[d],
  ease: ease.out,
});

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: tween("base") },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: tween("slow") },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: spring },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: tween("slow") },
};

/** Parent variant that staggers its children. */
export const stagger = (container = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: container, delayChildren: delay } },
});

/** Reduced-motion versions: opacity only, no transforms. */
export const reduced = {
  fadeUp: fadeIn,
  scaleIn: fadeIn,
  slideInLeft: fadeIn,
} satisfies Record<string, Variants>;

export const press = { whileTap: { scale: 0.97 }, transition: springSnappy };
export const lift = { whileHover: { y: -4 }, transition: spring };
