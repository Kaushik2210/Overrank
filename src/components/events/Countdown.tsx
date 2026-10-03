"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

function Digit({ value }: { value: string }) {
  return (
    <span className="relative inline-block h-[1.2em] w-[0.62em] overflow-hidden text-center align-bottom">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Unit({ value, label, compact }: { value: number; label: string; compact?: boolean }) {
  const str = String(value).padStart(2, "0");
  return (
    <div className={cn("flex flex-col items-center rounded-md border border-line bg-bg-0/60", compact ? "px-2 py-1" : "px-3 py-2")}>
      <span className={cn("num font-semibold", compact ? "text-sm" : "text-2xl")} aria-hidden>
        {[...str].map((c, i) => (
          <Digit key={i} value={c} />
        ))}
      </span>
      <span className={cn("tracking-widest text-faint uppercase", compact ? "text-[8px]" : "text-[10px]")}>{label}</span>
    </div>
  );
}

/** Flip-style countdown. Renders blank until mounted so server and client markup agree. */
export function Countdown({ to, compact, className }: { to: string; compact?: boolean; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const target = new Date(to).getTime();
  const p = parts(now === null ? 0 : target - now);
  const label = `${p.d} days ${p.h} hours ${p.m} minutes`;

  return (
    <div role="timer" aria-label={`Starts in ${label}`} className={cn("flex gap-1.5", className)} style={{ visibility: now === null ? "hidden" : "visible" }}>
      <Unit value={p.d} label="days" compact={compact} />
      <Unit value={p.h} label="hrs" compact={compact} />
      <Unit value={p.m} label="min" compact={compact} />
      {!compact && <Unit value={p.s} label="sec" />}
    </div>
  );
}
