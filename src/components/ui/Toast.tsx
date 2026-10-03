"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Info, TrendingUp, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "info" | "rank";
type Toast = { id: number; kind: Kind; title: string; body?: string };
type Ctx = { toast: (t: Omit<Toast, "id">, ms?: number) => void };

const ToastCtx = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

const icons = { success: CheckCircle2, error: AlertTriangle, info: Info, rank: TrendingUp };
const tone: Record<Kind, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-accent",
  rank: "text-warn",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback<Ctx["toast"]>(
    (t, ms = 4500) => {
      const id = ++seq.current;
      setItems((l) => [...l.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {/* polite live region so rank updates and confirmations are announced */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = icons[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
                transition={spring}
                className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg p-3.5 shadow-2xl"
              >
                <Icon className={cn("mt-0.5 size-5 shrink-0", tone[t.kind])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{t.title}</p>
                  {t.body && <p className="mt-0.5 text-sm text-dim">{t.body}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="-m-2 grid size-11 place-items-center rounded text-faint hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
