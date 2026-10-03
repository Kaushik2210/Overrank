"use client";

import { motion } from "motion/react";
import { tween } from "@/lib/motion";

/** Re-mounts on every navigation, giving a short fade and rise between routes. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={tween("base")}>
      {children}
    </motion.div>
  );
}
