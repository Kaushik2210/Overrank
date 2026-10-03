"use client";

import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

type Variant = "primary" | "ghost" | "outline" | "danger" | "team";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-bg-0 font-semibold shadow-[0_0_0_1px_rgb(255_255_255/0.2)_inset,0_10px_30px_-10px_var(--accent)] hover:brightness-110",
  team: "bg-team text-white font-semibold shadow-[0_10px_30px_-10px_var(--team-primary)] hover:brightness-110",
  ghost: "text-ink/80 hover:bg-surface-2 hover:text-ink",
  outline: "border border-line-strong text-ink hover:bg-surface-2 hover:border-ink/30",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2", // 44px touch target
  lg: "h-12 px-7 text-base gap-2",
};

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Briefly swaps the label for a check or cross. */
  status?: "idle" | "success" | "error";
  children?: React.ReactNode;
  href?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, status = "idle", className, children, disabled, href, ...rest },
  ref,
) {
  const cls = cn(
    "shine relative inline-flex select-none items-center justify-center rounded-md whitespace-nowrap transition-[colors,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

  const inner = (
    <AnimatePresence mode="wait" initial={false}>
      {loading ? (
        <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          <span className="sr-only">Loading</span>
        </motion.span>
      ) : status === "success" ? (
        <motion.span key="s" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2">
          <Check className="size-4" aria-hidden /> Done
        </motion.span>
      ) : status === "error" ? (
        <motion.span key="e" initial={{ x: -6, opacity: 0 }} animate={{ x: [0, -5, 5, -3, 3, 0], opacity: 1 }} className="inline-flex items-center gap-2">
          <X className="size-4" aria-hidden /> Try again
        </motion.span>
      ) : (
        <motion.span key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2">
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );

  if (href) {
    return (
      <motion.span whileTap={{ scale: 0.97 }} transition={springSnappy} className="inline-flex">
        <Link href={href} className={cls}>
          {children}
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {inner}
    </motion.button>
  );
});
