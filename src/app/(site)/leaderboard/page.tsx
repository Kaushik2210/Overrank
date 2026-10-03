import type { Metadata } from "next";
import { LeaderboardTabs } from "@/components/leaderboard/LeaderboardTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { GridBackground } from "@/components/background/GridBackground";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const repo = getRepo();
  const [teams, students, analytics] = await Promise.all([repo.getTeams(), repo.getStudents(), repo.getAnalytics()]);
  const started = teams.some((t) => t.points !== 0);
  return (
    <div className="relative">
      <GridBackground glow={started ? teams[0]?.colorPrimary : undefined} />
      <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <PageHeader
          eyebrow={started ? "Live standings" : "Pre-season"}
          title={started ? "The race for #1" : "Ready. Set. Rank."}
          description="Every point counts. Standings update the moment the ledger does."
          className="mb-10 sm:mb-12"
        />
        <LeaderboardTabs teams={teams} students={students} series={analytics.pointsOverTime} />
      </div>
    </div>
  );
}
