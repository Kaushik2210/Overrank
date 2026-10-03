"use client";

import { motion, type Variants } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } };
const word: Variants = {
  hidden: { opacity: 0, y: "0.6em", filter: "blur(8px)" },
  show: { opacity: 1, y: "0em", filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/** Heading that rises word by word, with a blur-in, when it scrolls into view. */
export function SplitText({ text, className, as: Tag = "span" }: { text: string; className?: string; as?: "span" | "h2" | "h1" | "p" }) {
  const rm = useReducedMotionSafe();
  const M = motion[Tag];
  if (rm) return <Tag className={className}>{text}</Tag>;
  return (
    <M className={cn("inline-block", className)} variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden className="mr-[0.25em] inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span variants={word} className="inline-block">
            {w}
          </motion.span>
        </span>
      ))}
    </M>
  );
}
