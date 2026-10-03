"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

type Props = {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: React.ReactNode;
  caption?: string;
  className?: string;
  "aria-label"?: string;
};

export function ProgressRing({ value, size = 96, stroke = 8, color = "var(--team-primary)", label, caption, className, ...aria }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const rm = useReducedMotionSafe();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={aria["aria-label"] ?? `${Math.round(v * 100)} percent`}
        className="-rotate-90"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: rm ? c * (1 - v) : c }}
          animate={{ strokeDashoffset: inView ? c * (1 - v) : c }}
          transition={rm ? { duration: 0 } : { duration: 1, ease: ease.out }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="num text-lg leading-none font-semibold">{label}</div>
          {caption && <div className="mt-1 text-[10px] tracking-wider text-faint uppercase">{caption}</div>}
        </div>
      </div>
    </div>
  );
}
