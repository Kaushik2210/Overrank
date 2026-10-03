"use client";

import { MotionConfig } from "motion/react";
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
        {children}
      </ToastProvider>
    </MotionConfig>
  );
}
