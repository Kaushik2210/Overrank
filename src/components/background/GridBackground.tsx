"use client";

import { motion } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

/** Static grid + slow drifting blobs. Transform/opacity only. */
export function GridBackground({ glow = "#6366f1" }: { glow?: string }) {
  const rm = useReducedMotionSafe();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grid-lines absolute inset-0" />
      <motion.div
        className="absolute -top-40 left-[8%] h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl will-change-transform"
        style={{ background: `radial-gradient(circle, ${glow}, transparent 65%)` }}
        animate={rm ? undefined : { x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 h-[26rem] w-[26rem] rounded-full bg-cyan-400/20 opacity-30 blur-3xl will-change-transform max-md:hidden"
        animate={rm ? undefined : { x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent,var(--bg-0)_75%)]" />
    </div>
  );
}
