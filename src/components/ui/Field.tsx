"use client";

import { AnimatePresence, motion } from "motion/react";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: (a: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
  className?: string;
};

/** Label + control + animated error message. Controls get the id and aria wiring. */
export function Field({ label, error, hint, children, className }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-xs font-medium tracking-wide text-dim uppercase">
        {label}
      </label>
      <motion.div animate={error ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }} transition={{ duration: 0.3 }} key={error ? "err" : "ok"}>
        {children({ id, describedBy: error || hint ? msgId : undefined, invalid: Boolean(error) })}
      </motion.div>
      <AnimatePresence initial={false} mode="wait">
        {(error || hint) && (
          <motion.p
            key={error ? "e" : "h"}
            id={msgId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn("text-xs", error ? "text-danger" : "text-faint")}
            role={error ? "alert" : undefined}
          >
            {error ?? hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const control =
  "w-full rounded-md border bg-bg-2/80 px-3.5 text-sm text-ink placeholder:text-faint transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgb(212_255_58/0.2)] disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input(
  { className, invalid, ...p },
  ref,
) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-11", invalid ? "border-danger" : "border-line", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea(
  { className, invalid, ...p },
  ref,
) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(control, "min-h-24 py-3", invalid ? "border-danger" : "border-line", className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select(
  { className, invalid, children, ...p },
  ref,
) {
  return (
    <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%239aa4bb%22 stroke-width=%222%22><path d=%22m4 6 4 4 4-4%22/></svg>')] bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10", invalid ? "border-danger" : "border-line", className)} {...p}>
      {children}
    </select>
  );
});
