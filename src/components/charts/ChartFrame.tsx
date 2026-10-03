"use client";

import { useInView } from "motion/react";
import { createContext, useContext, useRef } from "react";
import { cn } from "@/lib/utils";

const InViewCtx = createContext(true);
/** Charts read this to start their draw animation only once they are on screen. */
export const useChartActive = () => useContext(InViewCtx);

type Props = {
  title: string;
  subtitle?: string;
  /** Text alternative: column headers and rows. Rendered visually hidden. */
  table: { head: string[]; rows: (string | number)[][] };
  children: React.ReactNode;
  className?: string;
  /** Minimum inner width so axes stay legible on a 320px phone; the card scrolls sideways. */
  minWidth?: number;
  height?: number;
};

export function ChartFrame({ title, subtitle, table, children, className, minWidth = 460, height = 260 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <figure ref={ref} className={cn("glass rounded-lg p-4 sm:p-5", className)}>
      <figcaption className="mb-4">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-faint">{subtitle}</p>}
      </figcaption>
      <div className="-mx-1 overflow-x-auto px-1">
        <div style={{ minWidth, height }} role="img" aria-label={`${title}. ${subtitle ?? ""} Data table follows.`}>
          <InViewCtx.Provider value={inView}>{inView ? children : null}</InViewCtx.Provider>
        </div>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            {table.head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-md bg-bg-1/95 px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-medium text-ink">{label}</p>}
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-dim">
            <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
            {p.name ?? p.dataKey}
            <span className="num ml-auto pl-3 font-semibold text-ink">{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const axisProps = {
  tick: { fill: "#6b768f", fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const;
