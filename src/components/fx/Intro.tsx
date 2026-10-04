"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const SEEN = "or_intro_seen";

/** One-time-per-session intro: the mark draws itself, then the curtain lifts. About 1.3 seconds. */
export function Intro() {
  const [show, setShow] = useState(false);

  // Runs once on mount. Reduced-motion users skip it; everyone else sees it once per browser session.
  useEffect(() => {
    let skip = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px)").matches || document.documentElement.dataset.motion === "reduce";
    try {
      if (sessionStorage.getItem(SEEN)) skip = true;
      else sessionStorage.setItem(SEEN, "1");
    } catch {
      skip = true;
    }
    if (skip) return;
    const open = window.setTimeout(() => setShow(true), 0);
    const close = window.setTimeout(() => setShow(false), 1350);
    return () => {
      window.clearTimeout(open);
      window.clearTimeout(close);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[300] grid place-items-center bg-bg-0"
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
        >
          <div className="text-center">
            <svg width="84" height="84" viewBox="0 0 40 40" className="mx-auto">
              <motion.path d="M20 2 36 11v18L20 38 4 29V11z" fill="none" stroke="#d4ff3a" strokeWidth="2" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: "easeInOut" }} />
              <motion.path d="M11.5 27 20 18.5 28.5 27" fill="none" stroke="#d4ff3a" strokeOpacity=".5" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
              <motion.path d="M11.5 20 20 11.5 28.5 20" fill="none" stroke="#d4ff3a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.5 }} />
            </svg>
            <motion.p className="mt-5 font-display text-2xl font-bold tracking-[0.3em] text-ink" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
              OVER<span className="text-accent">RANK</span>
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
