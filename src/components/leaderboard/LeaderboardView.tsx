"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ChevronsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Podium } from "./Podium";
import { StartingGrid } from "./StartingGrid";
import { TeamCard } from "./TeamCard";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard";
import { useToast } from "@/components/ui/Toast";
import { playSound } from "@/lib/sound";
import { spring } from "@/lib/motion";
import type { TeamStanding } from "@/lib/data/types";

type Overtake = { id: number; who: TeamStanding; passed: TeamStanding | null };

/**
 * The live leaderboard: podium for the top three, ranked cards for everyone else.
 * Before anyone has scored it shows the starting grid. Reorders with shared-layout motion,
 * announces rank changes, and flashes a broadcast-style banner when one team overtakes another.
 */
export function LeaderboardView({ initial, live = true }: { initial: TeamStanding[]; live?: boolean }) {
  const polled = useRealtimeLeaderboard(initial);
  const teams = live ? polled : initial;
  const { toast } = useToast();
  const prev = useRef(new Map(initial.map((t) => [t.id, t])));
  const [newLeader, setNewLeader] = useState<{ id: string; gain: number } | null>(null);
  const [banner, setBanner] = useState<Overtake | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const before = prev.current;
    const leaderBefore = [...before.values()].sort((a, b) => a.rank - b.rank)[0];
    const leaderNow = teams[0];
    const scoredBefore = [...before.values()].some((t) => t.points !== 0);

    if (scoredBefore && leaderBefore && leaderNow && leaderBefore.id !== leaderNow.id) {
      const gain = leaderNow.points - (before.get(leaderNow.id)?.points ?? leaderNow.points);
      setNewLeader({ id: leaderNow.id, gain });
      window.setTimeout(() => setNewLeader(null), 3800);
    }
    for (const t of teams) {
      const old = before.get(t.id);
      if (!old || t.rank >= old.rank || !scoredBefore) continue;
      // the team that used to hold the rank this one now holds is who it just passed
      const passed = [...before.values()].find((x) => x.id !== t.id && x.rank === t.rank) ?? null;
      playSound("rank");
      toast({ kind: "rank", title: `RANK UPDATE: ${t.name} up to #${t.rank}`, body: `${t.points.toLocaleString("en-IN")} points` });
      const id = ++seq.current;
      setBanner({ id, who: t, passed });
      window.setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), 3600);
      break; // one banner per update; the toasts cover the rest
    }
    prev.current = new Map(teams.map((t) => [t.id, t]));
  }, [teams, toast]);

  const started = teams.some((t) => t.points !== 0);
  if (!started) return <StartingGrid teams={teams} />;

  const podium = teams.slice(0, 3);
  const rest = teams.slice(3);
  const leaderPoints = teams[0]?.points ?? 0;

  return (
    <LayoutGroup>
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.id}
            role="status"
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, transition: { duration: 0.25 } }}
            transition={spring}
            className="pointer-events-none fixed top-20 left-1/2 z-[105] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2"
          >
            <div className="glass flex items-center gap-4 overflow-hidden rounded-xl p-4 shadow-[0_20px_60px_-10px_rgb(0_0_0/0.8)]" style={{ boxShadow: `0 0 0 1px ${banner.who.colorPrimary}88, 0 0 60px -10px ${banner.who.colorPrimary}` }}>
              <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.9 }} className="grid size-11 shrink-0 place-items-center rounded-full text-bg-0" style={{ background: banner.who.colorPrimary }}>
                <ChevronsUp className="size-6" aria-hidden />
              </motion.span>
              <div className="min-w-0">
                <p className="num text-[10px] tracking-[0.3em] text-faint uppercase">Overtake</p>
                <p className="truncate font-display text-lg font-bold">
                  {banner.who.name} <span className="text-dim">{banner.passed ? "passes" : "climbs to"}</span> {banner.passed ? banner.passed.name : `#${banner.who.rank}`}
                </p>
              </div>
              <span className="num ml-auto text-2xl font-bold" style={{ color: banner.who.colorGlow }}>#{banner.who.rank}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
