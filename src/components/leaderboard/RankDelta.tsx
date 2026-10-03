import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rank movement versus a week ago. */
export function RankDelta({ rank, previous, className }: { rank: number; previous: number; className?: string }) {
  const d = previous - rank;
  const Icon = d > 0 ? ArrowUp : d < 0 ? ArrowDown : Minus;
  return (
    <span
      className={cn("num inline-flex items-center gap-0.5 text-xs", d > 0 ? "text-success" : d < 0 ? "text-danger" : "text-faint", className)}
      title={d === 0 ? "No change this week" : `${d > 0 ? "Up" : "Down"} ${Math.abs(d)} since last week`}
    >
      <Icon className="size-3" aria-hidden />
      {d !== 0 && Math.abs(d)}
      <span className="sr-only">{d === 0 ? "No rank change" : `${d > 0 ? "Up" : "Down"} ${Math.abs(d)} places this week`}</span>
    </span>
  );
}
