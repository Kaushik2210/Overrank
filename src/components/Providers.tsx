"use client";

import { MotionConfig } from "motion/react";
import { CursorFx } from "@/components/fx/CursorFx";
import { Intro } from "@/components/fx/Intro";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { PrefsApplier } from "@/components/settings/SettingsForm";
import { ToastProvider } from "@/components/ui/Toast";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

/** Global client providers: toasts plus a MotionConfig that respects the reduced-motion setting. */
export function Providers({ children }: { children: React.ReactNode }) {
  const rm = useReducedMotionSafe();
  return (
    <MotionConfig reducedMotion={rm ? "always" : "user"}>
      <ToastProvider>
        <PrefsApplier />
        <Intro />
        <ScrollProgress />
        <CursorFx />
        {children}
      </ToastProvider>
    </MotionConfig>
  );
}
