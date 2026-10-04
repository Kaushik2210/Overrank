"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "./useMediaQuery";

/**
 * True when the OS asks for reduced motion, the user switched it on in settings
 * (stored on <html data-motion="reduce">), or the screen is a phone: phones get the static design.
 */
export function useReducedMotionSafe() {
  const os = useReducedMotion();
  const phone = useMediaQuery("(max-width: 767px)");
  const [override, setOverride] = useState(false);

  useEffect(() => {
    const read = () => setOverride(document.documentElement.dataset.motion === "reduce");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => mo.disconnect();
  }, []);

  return Boolean(os) || override || phone;
}
