import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { PageHeader } from "@/components/ui/PageHeader";
import { GridBackground } from "@/components/background/GridBackground";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const teams = await getRepo().getTeams();
  return (
    <div className="relative">
      <GridBackground glow={teams[0]?.colorPrimary} />
      <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
        <PageHeader eyebrow="Live standings" title="The race for #1" description="Every point counts. Standings update the moment the ledger does." className="mb-10 sm:mb-14" />
        <LeaderboardView initial={teams} />
      </div>
    </div>
  );
}
