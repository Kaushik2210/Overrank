"use client";

import { motion } from "motion/react";
import { AchievementBadge, RARITY } from "./AchievementBadge";
import { AnimatedCounter } from "./AnimatedCounter";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { ease } from "@/lib/motion";
import type { Achievement } from "@/lib/data/types";

/** Celebration shown when a badge is earned. One restrained glow, no confetti. */
export function AchievementUnlockModal({ achievement, open, onClose }: { achievement: Achievement | null; open: boolean; onClose: () => void }) {
  const rm = useReducedMotionSafe();
  if (!achievement) return null;
  const color = RARITY[achievement.rarity].color;
  return (
    <Modal open={open} onClose={onClose} title="Achievement unlocked" bare className="sm:max-w-sm">
      <div className="relative overflow-hidden px-6 py-10 text-center">
        <motion.div
          aria-hidden
          className="absolute top-14 left-1/2 size-64 -translate-x-1/2 rounded-full"
          style={{ background: `radial-gradient(closest-side, ${color}66, transparent)` }}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: rm ? 1 : [0.2, 1.4, 1.1], opacity: 1 }}
          transition={{ duration: 0.9, ease: ease.out }}
        />
        <motion.div className="relative mx-auto w-fit" initial={{ scale: rm ? 1 : 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.15 }}>
          <AchievementBadge icon={achievement.icon} rarity={achievement.rarity} size={132} />
        </motion.div>
        <motion.p
          className="num relative mt-6 text-[11px] font-semibold tracking-[0.35em]"
          style={{ color }}
          initial={{ opacity: 0, y: 8, letterSpacing: "0.1em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.35em" }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          ACHIEVEMENT UNLOCKED
        </motion.p>
        <motion.h3 className="relative mt-2 font-display text-3xl font-bold" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          {achievement.name}
        </motion.h3>
        <motion.p className="relative mt-2 text-sm text-dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          {achievement.description}
        </motion.p>
        <motion.div className="relative mt-5 text-3xl font-semibold text-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}>
          <AnimatedCounter value={achievement.xp} prefix="+" suffix=" XP" duration={0.9} />
        </motion.div>
        <Button className="relative mt-8 w-full" onClick={onClose} data-autofocus>
          Nice
        </Button>
      </div>
    </Modal>
  );
}
