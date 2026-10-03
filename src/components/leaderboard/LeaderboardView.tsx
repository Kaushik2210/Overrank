"use client";

import { LayoutGroup } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Podium } from "./Podium";
import { TeamCard } from "./TeamCard";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard";
import { useToast } from "@/components/ui/Toast";
import type { TeamStanding } from "@/lib/data/types";

/**
 * The live leaderboard: podium for the top three, ranked cards for everyone else.
 * Reorders with shared-layout animations and announces rank changes.
 */
export function LeaderboardView({ initial, live = true }: { initial: TeamStanding[]; live?: boolean }) {
  const polled = useRealtimeLeaderboard(initial);
  const teams = live ? polled : initial;
  const { toast } = useToast();
  const prev = useRef(new Map(initial.map((t) => [t.id, t])));
  const [newLeader, setNewLeader] = useState<{ id: string; gain: number } | null>(null);

  useEffect(() => {
    const before = prev.current;
    const leaderBefore = [...before.values()].sort((a, b) => a.rank - b.rank)[0];
    const leaderNow = teams[0];

    if (leaderBefore && leaderNow && leaderBefore.id !== leaderNow.id) {
      const gain = leaderNow.points - (before.get(leaderNow.id)?.points ?? leaderNow.points);
      setNewLeader({ id: leaderNow.id, gain });
      window.setTimeout(() => setNewLeader(null), 3800);
    }
    for (const t of teams) {
      const old = before.get(t.id);
      if (old && t.rank < old.rank) {
        toast({ kind: "rank", title: `RANK UPDATE: ${t.name} up to #${t.rank}`, body: `${t.points.toLocaleString("en-IN")} points` });
      }
    }
    prev.current = new Map(teams.map((t) => [t.id, t]));
  }, [teams, toast]);

  const podium = teams.slice(0, 3);
  const rest = teams.slice(3);
  const leaderPoints = teams[0]?.points ?? 0;

  return (
    <LayoutGroup>
      <div className="space-y-8">
        <Podium teams={podium} newLeaderId={newLeader?.id} leaderGain={newLeader?.gain} />
        {rest.length > 0 && (
          <ol aria-label="Remaining teams" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((t, i) => (
              <TeamCard key={t.id} team={t} leaderPoints={leaderPoints} index={i} />
            ))}
          </ol>
        )}
      </div>
    </LayoutGroup>
  );
}
