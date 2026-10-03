"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef } from "react";
import { useIsTouch } from "@/hooks/useMediaQuery";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

/** Pulls its child toward the pointer when it gets close, then springs back. Desktop only. */
export function Magnetic({ children, strength = 0.28, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const touch = useIsTouch();
  const rm = useReducedMotionSafe();
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 18, mass: 0.5 });
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 18, mass: 0.5 });
  if (touch || rm) return <span className={className}>{children}</span>;
  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ x, y, display: "inline-flex" }}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
