"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin lime bar across the top that fills as the page scrolls. scaleX only. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[110] h-[3px] origin-left bg-accent shadow-[0_0_14px_var(--accent)]"
      style={{ scaleX }}
    />
  );
}
