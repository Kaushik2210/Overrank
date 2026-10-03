"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useRef } from "react";
import { useIsTouch } from "@/hooks/useMediaQuery";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  max?: number;
  glare?: boolean;
};

/**
 * Pointer-driven 3D tilt with a moving glare. Children can lift off the card with
 * `[transform:translateZ(40px)]`. Transform and opacity only; off on touch and reduced motion.
 */
export function Tilt3D({ children, className, max = 9, glare = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const touch = useIsTouch();
  const rm = useReducedMotionSafe();
  const off = touch || rm;

  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareOpacity = useMotionValue(0);
  const bg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgb(255 255 255 / 0.22), transparent 55%)`;

  const move = (e: React.PointerEvent) => {
    if (off || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
    glareOpacity.set(1);
  };
  const leave = () => {
    rx.set(0);
    ry.set(0);
    glareOpacity.set(0);
  };

  return (
    <div className={cn("[perspective:900px]", className)} onPointerMove={move} onPointerLeave={leave}>
      <motion.div ref={ref} style={off ? undefined : { rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className="relative h-full will-change-transform">
        {children}
        {glare && !off && <motion.span aria-hidden style={{ background: bg, opacity: glareOpacity }} className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay" />}
      </motion.div>
    </div>
  );
}
