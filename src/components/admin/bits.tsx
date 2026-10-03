import { AnimatedCounter } from "@/components/gamification/AnimatedCounter";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && <p className="mt-1.5 text-dim">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, icon, hint, className }: { label: string; value: number; icon: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={cn("glass relative overflow-hidden rounded-lg p-5", className)}>
      <div aria-hidden className="absolute -top-8 -right-8 size-28 rounded-full bg-accent/10 blur-2xl" />
      <div className="relative flex items-center justify-between text-faint">
        <p className="text-[11px] tracking-[0.2em] uppercase">{label}</p>
        {icon}
      </div>
      <p className="relative mt-3 text-4xl font-semibold">
        <AnimatedCounter value={value} />
      </p>
      {hint && <p className="relative mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("glass rounded-lg", className)}>
      <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {action}
      </header>
      <div className="p-2">{children}</div>
    </section>
  );
}
