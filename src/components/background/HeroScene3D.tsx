"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { useIsTouch } from "@/hooks/useMediaQuery";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

const HEX = "M50 4 92 27v46L50 96 8 73V27z";

/**
 * Real 3D: a perspective grid floor running toward the viewer, and a stack of hex plates
 * separated along Z that swing with the pointer. Transform-only, hidden on small screens.
 */
export function HeroScene3D() {
  const touch = useIsTouch();
  const rm = useReducedMotionSafe();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 18 });
  const sy = useSpring(my, { stiffness: 80, damping: 18 });
  const rotY = useTransform(sx, [-1, 1], [-24, 24]);
  const rotX = useTransform(sy, [-1, 1], [64, 44]);

  useEffect(() => {
    if (touch || rm) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [touch, rm, mx, my]);

  const plates = [
    { z: -90, fill: "rgb(212 255 58 / 0.06)", stroke: "rgb(212 255 58 / 0.35)", label: "" },
    { z: -30, fill: "rgb(212 255 58 / 0.10)", stroke: "rgb(212 255 58 / 0.6)", label: "" },
    { z: 30, fill: "rgb(212 255 58 / 0.16)", stroke: "#d4ff3a", label: "" },
    { z: 90, fill: "#d4ff3a", stroke: "#f5ff9e", label: "OR" },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden max-md:hidden">
      {/* perspective floor */}
      <div className="absolute inset-x-0 bottom-0 h-[55%] [perspective:520px]">
        <div className="absolute inset-x-[-40%] bottom-0 h-[220%] origin-bottom [transform:rotateX(68deg)] [mask-image:linear-gradient(to_top,#000_15%,transparent_85%)]">
          <div
            className={rm ? "h-full w-full" : "floor-run h-[calc(100%+56px)] w-full -translate-y-[56px]"}
            style={{
              backgroundImage: "linear-gradient(to right, rgb(212 255 58 / 0.28) 1px, transparent 1px), linear-gradient(to bottom, rgb(212 255 58 / 0.28) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>
      </div>

      {/* floating plate stack */}
      <div className="absolute top-1/2 right-[7%] size-[26rem] -translate-y-[58%] [perspective:1100px] max-lg:right-[-6%] max-lg:opacity-60">
        <motion.div className="preserve-3d relative size-full" style={{ rotateX: rotX, rotateY: rotY }}>
          {plates.map((p, i) => (
            <div key={i} className="preserve-3d absolute inset-0" style={{ transform: `translateZ(${p.z}px)` }}>
              <div className={rm ? "" : "bob"} style={{ animationDelay: `${i * -0.7}s` }}>
                <svg viewBox="0 0 100 100" className="size-full drop-shadow-[0_18px_30px_rgb(0_0_0/0.55)]">
                  <path d={HEX} fill={p.fill} stroke={p.stroke} strokeWidth="1.4" strokeLinejoin="round" />
                  {p.label && (
                    <text x="50" y="62" textAnchor="middle" fontSize="30" fontWeight="800" fill="#05070d" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                      {p.label}
                    </text>
                  )}
                </svg>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
