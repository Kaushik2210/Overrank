"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { fadeIn, fadeUp, reduced } from "@/lib/motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

type Props = HTMLMotionProps<"div"> & { delay?: number };

/** Scroll-triggered entrance. Falls back to a plain fade under reduced motion. */
export function Reveal({ delay = 0, children, ...rest }: Props) {
  const rm = useReducedMotionSafe();
  return (
    <motion.div
      variants={rm ? reduced.fadeUp : fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={delay ? { delay } : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export { fadeIn };
