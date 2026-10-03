"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { fadeUp, reduced, stagger } from "@/lib/motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

/** Scroll-triggered container whose StaggerItem children rise in one after another. */
export function StaggerGroup({ gap = 0.06, children, ...rest }: HTMLMotionProps<"div"> & { gap?: number }) {
  return (
    <motion.div variants={stagger(gap)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} {...rest}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...rest }: HTMLMotionProps<"div">) {
  const rm = useReducedMotionSafe();
  return (
    <motion.div variants={rm ? reduced.fadeUp : fadeUp} {...rest}>
      {children}
    </motion.div>
  );
}
