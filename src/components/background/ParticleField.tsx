"use client";

import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useIsTouch } from "@/hooks/useMediaQuery";

type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };

/** Small canvas particle field. Capped count, paused off-screen, reacts to the mouse on desktop only. */
export function ParticleField({ color = "212,255,58" }: { color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rm = useReducedMotionSafe();
  const touch = useIsTouch();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || rm) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = touch ? 12 : 36;
    let w = 0;
    let h = 0;
    const mouse = { x: -999, y: -999 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ps: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.05 - Math.random() * 0.2,
      r: 0.6 + Math.random() * 1.4,
      a: 0.15 + Math.random() * 0.5,
    }));

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        if (!touch) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 9000) {
            p.x += dx * 0.002;
            p.y += dy * 0.002;
          }
        }
        if (p.y < -4) p.y = h + 4;
        if (p.x < -4) p.x = w + 4;
        if (p.x > w + 4) p.x = -4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color},${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    tick();

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    if (!touch) window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [rm, touch, color]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
