"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

type Props = {
  /** 0..1 */
  value: number;
  color?: string;
  className?: string;
  height?: number;
  label: string;
};

/** Fills via scaleX from the left so only a transform animates. */
export function AnimatedProgressBar({ value, color = "var(--team-primary)", className, height = 8, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const rm = useReducedMotionSafe();
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn("w-full overflow-hidden rounded-full bg-white/[0.07]", className)}
      style={{ height }}
    >
      <motion.div
        className="h-full w-full origin-left rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, var(--team-glow, ${color}))`, boxShadow: `0 0 12px ${color}` }}
        initial={{ scaleX: rm ? v : 0 }}
        animate={{ scaleX: inView ? v : 0 }}
        transition={rm ? { duration: 0 } : { duration: 0.9, ease: ease.out }}
      />
    </div>
  );
}
