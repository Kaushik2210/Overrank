"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsTouch = () => useMediaQuery("(hover: none), (pointer: coarse)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
