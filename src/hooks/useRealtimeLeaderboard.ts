"use client";

import { useEffect, useState } from "react";
import type { TeamStanding } from "@/lib/data/types";

const hasRealtime = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Keeps standings fresh. With Supabase it listens for ledger changes and refetches;
 * in preview mode it polls. Either way it pauses while the tab is hidden.
 */
export function useRealtimeLeaderboard(initial: TeamStanding[], pollMs = 6000) {
  const [teams, setTeams] = useState(initial);

  useEffect(() => {
    let alive = true;
    const refetch = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { teams: TeamStanding[] };
        if (alive) setTeams(json.teams);
      } catch {
        /* offline; try again on the next tick */
      }
    };

    let cleanup = () => {};
    if (hasRealtime) {
      import("@/lib/supabase/client").then(({ createClient }) => {
        if (!alive) return;
        const supabase = createClient();
        const channel = supabase
          .channel("leaderboard")
          .on("postgres_changes", { event: "*", schema: "public", table: "point_transactions" }, refetch)
          .subscribe();
        cleanup = () => void supabase.removeChannel(channel);
      });
    } else {
      const id = window.setInterval(refetch, pollMs);
      cleanup = () => window.clearInterval(id);
    }
    const onVis = () => !document.hidden && refetch();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      cleanup();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pollMs]);

  return teams;
}
