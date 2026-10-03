"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, ChartTooltip, axisProps, useChartActive } from "./ChartFrame";
import { cn } from "@/lib/utils";

type Series = { key: string; name: string; color: string };

function Grid() {
  return <CartesianGrid stroke="rgb(255 255 255 / 0.06)" vertical={false} />;
}

export function TrendChart({
  title,
  subtitle,
  data,
  xKey,
  series,
  area,
  cumulativeLabel,
  height,
  className,
}: {
  title: string;
  subtitle?: string;
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  area?: boolean;
  cumulativeLabel?: string;
  height?: number;
  className?: string;
}) {
  return (
    <ChartFrame
      title={title}
      subtitle={subtitle ?? cumulativeLabel}
      className={className}
      height={height}
      table={{ head: [xKey, ...series.map((s) => s.name)], rows: data.map((d) => [d[xKey], ...series.map((s) => d[s.key])]) }}
    >
      <Inner data={data} xKey={xKey} series={series} area={area} />
    </ChartFrame>
  );
}

function Inner({ data, xKey, series, area }: { data: Record<string, string | number>[]; xKey: string; series: Series[]; area?: boolean }) {
  const active = useChartActive();
  const common = { data, margin: { top: 8, right: 8, left: -12, bottom: 0 } };
  const axes = (
    <>
      <Grid />
      <XAxis dataKey={xKey} {...axisProps} />
      <YAxis {...axisProps} width={44} />
      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgb(255 255 255 / 0.15)" }} />
    </>
  );
  return (
    <ResponsiveContainer width="100%" height="100%">
      {area ? (
        <AreaChart {...common}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={s.color} stopOpacity={0.45} />
                <stop offset="1" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {axes}
          {series.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} fill={`url(#g-${s.key})`} isAnimationActive={active} animationDuration={900} />
          ))}
        </AreaChart>
      ) : (
        <LineChart {...common}>
          {axes}
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} isAnimationActive={active} animationDuration={900} />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}

export function BarsChart({
  title,
  subtitle,
  data,
  valueLabel = "Points",
  className,
  height,
  layout = "horizontal",
}: {
  title: string;
  subtitle?: string;
  data: { name: string; value: number; color: string }[];
  valueLabel?: string;
  className?: string;
  height?: number;
  layout?: "horizontal" | "vertical";
}) {
  return (
    <ChartFrame title={title} subtitle={subtitle} className={className} height={height} minWidth={layout === "vertical" ? 320 : 420} table={{ head: ["Name", valueLabel], rows: data.map((d) => [d.name, d.value]) }}>
      <BarsInner data={data} valueLabel={valueLabel} layout={layout} />
    </ChartFrame>
  );
}

function BarsInner({ data, valueLabel, layout }: { data: { name: string; value: number; color: string }[]; valueLabel: string; layout: "horizontal" | "vertical" }) {
  const active = useChartActive();
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={vertical ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, left: vertical ? 24 : -12, bottom: 0 }}>
        <CartesianGrid stroke="rgb(255 255 255 / 0.06)" horizontal={!vertical} vertical={vertical} />
        {vertical ? (
          <>
            <XAxis type="number" {...axisProps} />
            <YAxis type="category" dataKey="name" {...axisProps} width={90} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" {...axisProps} interval={0} />
            <YAxis {...axisProps} width={44} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgb(255 255 255 / 0.04)" }} />
        <Bar dataKey="value" name={valueLabel} radius={vertical ? [0, 6, 6, 0] : [6, 6, 0, 0]} isAnimationActive={active} animationDuration={800}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  title,
  subtitle,
  data,
  className,
  height = 260,
}: {
  title: string;
  subtitle?: string;
  data: { name: string; value: number; color: string }[];
  className?: string;
  height?: number;
}) {
  const total = data.reduce((n, d) => n + d.value, 0);
  return (
    <ChartFrame title={title} subtitle={subtitle} className={className} height={height} minWidth={300} table={{ head: ["Category", "Points"], rows: data.map((d) => [d.name, d.value]) }}>
      <DonutInner data={data} total={total} />
    </ChartFrame>
  );
}

function DonutInner({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  const active = useChartActive();
  return (
    <div className="flex h-full items-center gap-4">
      <div className="relative h-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={active} animationDuration={900}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="num text-2xl font-semibold">{total.toLocaleString("en-IN")}</p>
            <p className="text-[10px] tracking-widest text-faint uppercase">total</p>
          </div>
        </div>
      </div>
      <ul className="w-36 space-y-1.5 text-xs">
        {data.slice(0, 7).map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-dim">
            <span className="size-2 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden />
            <span className="truncate">{d.name}</span>
            <span className="num ml-auto text-ink">{Math.round((d.value / (total || 1)) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Team x category heatmap built from plain elements (no chart lib needed). */
export function Heatmap({ rows, className }: { rows: { team: string; color: string; cells: { category: string; points: number }[] }[]; className?: string }) {
  const max = Math.max(1, ...rows.flatMap((r) => r.cells.map((c) => c.points)));
  const cats = rows[0]?.cells.map((c) => c.category) ?? [];
  return (
    <ChartFrame
      title="Team by category heatmap"
      subtitle="Darker means more points"
      className={className}
      minWidth={640}
      height={rows.length * 38 + 40}
      table={{ head: ["Team", ...cats], rows: rows.map((r) => [r.team, ...r.cells.map((c) => c.points)]) }}
    >
      <div className="grid gap-1" style={{ gridTemplateColumns: `110px repeat(${cats.length}, minmax(0, 1fr))` }}>
        <span />
        {cats.map((c) => (
          <span key={c} className="truncate text-center text-[10px] text-faint" title={c}>
            {c.slice(0, 5)}
          </span>
        ))}
        {rows.map((r) => (
          <HeatRow key={r.team} row={r} max={max} />
        ))}
      </div>
    </ChartFrame>
  );
}

function HeatRow({ row, max }: { row: { team: string; color: string; cells: { category: string; points: number }[] }; max: number }) {
  const active = useChartActive();
  return (
    <>
      <span className="flex items-center gap-2 truncate text-xs text-dim">
        <span className="size-2 shrink-0 rounded-full" style={{ background: row.color }} aria-hidden />
        {row.team}
      </span>
      {row.cells.map((c, i) => (
        <span
          key={c.category}
          title={`${row.team} · ${c.category}: ${c.points}`}
          className={cn("h-8 rounded-sm transition-opacity duration-500", active ? "opacity-100" : "opacity-0")}
          style={{
            background: c.points > 0 ? row.color : "rgb(255 255 255 / 0.04)",
            opacity: active ? (c.points > 0 ? 0.15 + 0.85 * (c.points / max) : 1) : 0,
            transitionDelay: `${i * 25}ms`,
          }}
        />
      ))}
    </>
  );
}
