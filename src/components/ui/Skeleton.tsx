import { cn } from "@/lib/utils";

/** Shimmering placeholder. Pure CSS, transform only. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden rounded-md bg-surface-2", className)}
    >
      <div className="skeleton-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div role="status" aria-label="Loading leaderboard" className="space-y-6">
      <div className="grid items-end gap-4 md:grid-cols-3">
        <Skeleton className="h-56 md:order-1" />
        <Skeleton className="h-72 md:order-2" />
        <Skeleton className="h-48 md:order-3" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" className="space-y-6">
      <Skeleton className="h-56" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-72 w-full", className)} />;
}
