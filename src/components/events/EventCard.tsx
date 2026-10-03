import { CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { Countdown } from "./Countdown";
import { cn } from "@/lib/utils";
import type { EventItem, Team } from "@/lib/data/types";

const status = {
  live: "border-success/40 bg-success/10 text-success",
  upcoming: "border-accent/40 bg-accent/10 text-accent",
  past: "border-line bg-surface text-faint",
};

const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

type Props = {
  event: EventItem;
  teams: Team[];
  action?: React.ReactNode;
  className?: string;
};

export function EventCard({ event: e, teams, action, className }: Props) {
  const winner = teams.find((t) => t.id === e.winnerTeamId);
  const participating = teams.filter((t) => e.teamIds.includes(t.id));
  return (
    <article className={cn("glass group relative flex h-full flex-col rounded-lg p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgb(110_231_249/0.35)]", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("num inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] tracking-wider uppercase", status[e.status])}>
          {e.status === "live" && <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden />}
          {e.status}
        </span>
        <span className="num inline-flex items-center gap-1 text-sm font-semibold text-warn">
          <Trophy className="size-4" aria-hidden />
          {e.points} pts
        </span>
      </div>

      <h3 className="mt-4 font-display text-xl leading-tight font-bold">{e.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-dim">{e.description}</p>

      <dl className="mt-4 space-y-1.5 text-sm text-dim">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-faint" aria-hidden />
          <dt className="sr-only">When</dt>
          <dd>{fmt.format(new Date(e.startsAt))}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-faint" aria-hidden />
          <dt className="sr-only">Where</dt>
          <dd>{e.location}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4 shrink-0 text-faint" aria-hidden />
          <dt className="sr-only">Registered</dt>
          <dd>{e.registeredCount} registered</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-dim">{e.categoryName}</span>
        {participating.length > 0 && (
          <span className="flex -space-x-1.5" aria-label={`${participating.length} teams participating`}>
            {participating.map((t) => (
              <span key={t.id} title={t.name} className="size-4 rounded-full ring-2 ring-bg-1" style={{ background: t.colorPrimary }} />
            ))}
          </span>
        )}
      </div>

      <div className="mt-auto pt-5">
        {e.status === "upcoming" && <Countdown to={e.startsAt} compact className="mb-4" />}
        {e.status === "past" && winner && (
          <p className="mb-4 flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: winner.colorPrimary }} aria-hidden />
            <span className="text-faint">Won by</span> <strong>{winner.name}</strong>
          </p>
        )}
        {action}
      </div>
    </article>
  );
}
