"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { cn, formatPoints } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

type Props = {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Show an explicit + for positive numbers. */
  signed?: boolean;
  decimals?: number;
};

/**
 * Counts up when scrolled into view and tweens between values afterwards.
 * Tabular numerals keep the width steady; the real value is exposed to screen readers.
 */
export function AnimatedCounter({ value, duration = 1.1, className, prefix = "", suffix = "", signed, decimals = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const shown = useRef(0);
  const rm = useReducedMotionSafe();

  const fmt = (n: number) => {
    const v = decimals ? n.toFixed(decimals) : formatPoints(Math.round(n));
    return `${prefix}${signed && n > 0 ? "+" : ""}${v}${suffix}`;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (rm || !inView) {
      if (rm) {
        shown.current = value;
        el.textContent = fmt(value);
      }
      return;
    }
    const c = animate(shown.current, value, {
      duration,
      ease: ease.out,
      onUpdate: (v) => {
        shown.current = v;
        el.textContent = fmt(v);
      },
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, rm, duration]);

  return (
    <>
      <span ref={ref} aria-hidden className={cn("num", className)}>
        {fmt(rm ? value : 0)}
      </span>
      <span className="sr-only">{fmt(value)}</span>
    </>
  );
}
