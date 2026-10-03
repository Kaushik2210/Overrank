import { cn } from "@/lib/utils";

export type TimelineItem = { id: string; title: string; detail?: string; at?: string; icon?: React.ReactNode; tone?: "default" | "success" | "danger" };

/** Vertical timeline with a connector line. */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-5 border-l border-line pl-6", className)}>
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span
            aria-hidden
            className={cn("absolute top-0.5 -left-[2.1rem] grid size-5 place-items-center rounded-full border bg-bg-1 text-[10px]", it.tone === "success" ? "border-success text-success" : it.tone === "danger" ? "border-danger text-danger" : "border-accent text-accent")}
          >
            {it.icon ?? <span className="size-1.5 rounded-full bg-current" />}
          </span>
          <p className="text-sm font-medium">{it.title}</p>
          {it.detail && <p className="text-sm text-dim">{it.detail}</p>}
          {it.at && <p className="num mt-0.5 text-xs text-faint">{it.at}</p>}
        </li>
      ))}
    </ol>
  );
}
