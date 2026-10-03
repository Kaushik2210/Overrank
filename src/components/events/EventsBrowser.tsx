"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { EventCard } from "./EventCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { registerForEventAction } from "@/lib/actions/events";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import type { EventItem, EventStatus, Team } from "@/lib/data/types";

type Filter = "all" | EventStatus;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

function RegisterButton({ event, registered, canRegister }: { event: EventItem; registered: boolean; canRegister: boolean }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(registered);
  const { toast } = useToast();
  if (event.status === "past") return null;
  if (!canRegister) return <p className="text-xs text-faint">Sign in as a student to register.</p>;
  if (done)
    return (
      <p className="flex h-11 items-center gap-2 text-sm text-success">
        <Check className="size-4" aria-hidden /> You are registered
      </p>
    );
  return (
    <Button
      loading={pending}
      variant="team"
      className="w-full bg-accent text-bg-0"
      onClick={() =>
        start(async () => {
          const r = await registerForEventAction(event.id);
          if (r.ok) {
            setDone(true);
            toast({ kind: "success", title: "Registered", body: event.title });
          } else toast({ kind: "error", title: "Could not register", body: r.error });
        })
      }
    >
      Register
    </Button>
  );
}

export function EventsBrowser({ events, teams, registeredIds, canRegister }: { events: EventItem[]; teams: Team[]; registeredIds: string[]; canRegister: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = events.filter((e) => filter === "all" || e.status === filter);
  const counts = (f: Filter) => (f === "all" ? events.length : events.filter((e) => e.status === f).length);

  return (
    <div>
      <div role="tablist" aria-label="Filter events" className="mb-8 inline-flex rounded-full border border-line bg-surface p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn("relative h-10 rounded-full px-4 text-sm font-medium transition-colors", filter === f.id ? "text-bg-0" : "text-dim hover:text-ink")}
          >
            {filter === f.id && <motion.span layoutId="event-filter" transition={spring} className="absolute inset-0 rounded-full bg-accent" />}
            <span className="relative">
              {f.label} <span className="num text-xs opacity-70">{counts(f.id)}</span>
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-dim">Nothing here yet. Check back soon.</div>
      ) : (
        <LayoutGroup>
          <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((e) => (
                <motion.div key={e.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={spring}>
                  <EventCard event={e} teams={teams} action={<RegisterButton event={e} registered={registeredIds.includes(e.id)} canRegister={canRegister} />} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}
    </div>
  );
}
