"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useIsTouch } from "@/hooks/useMediaQuery";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

/**
 * Desktop-only cursor layer: a soft page-wide spotlight that trails the pointer, plus a small
 * dot and ring that swell over anything clickable. Transform and opacity only.
 */
export function CursorFx() {
  const touch = useIsTouch();
  const rm = useReducedMotionSafe();
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const glowX = useSpring(x, { stiffness: 90, damping: 22, mass: 0.6 });
  const glowY = useSpring(y, { stiffness: 90, damping: 22, mass: 0.6 });
  const ringX = useSpring(x, { stiffness: 420, damping: 32 });
  const ringY = useSpring(y, { stiffness: 420, damping: 32 });
  const [hot, setHot] = useState(false);
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (touch || rm) return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as Element | null;
      setHot(!!el?.closest("a, button, [role=button], [role=tab], input, select, textarea, label, summary"));
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", dn);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
    };
  }, [touch, rm, x, y]);

  if (touch || rm) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[120] max-lg:hidden">
      <motion.div
        className="absolute top-0 left-0 size-[34rem] rounded-full"
        style={{ x: glowX, y: glowY, translateX: "-50%", translateY: "-50%", background: "radial-gradient(closest-side, rgb(212 255 58 / 0.10), transparent)" }}
      />
      <motion.div
        className="absolute top-0 left-0 rounded-full border border-accent/70"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: hot ? 54 : 30, height: hot ? 54 : 30, opacity: down ? 0.5 : 1, backgroundColor: hot ? "rgb(212 255 58 / 0.12)" : "rgb(212 255 58 / 0)" }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      />
      <motion.div className="absolute top-0 left-0 size-1.5 rounded-full bg-accent" style={{ x, y, translateX: "-50%", translateY: "-50%" }} />
    </div>
  );
}
