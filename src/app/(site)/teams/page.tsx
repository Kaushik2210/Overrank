import type { Metadata } from "next";
import { TeamCard } from "@/components/leaderboard/TeamCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Teams" };
export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await getRepo().getTeams();
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <PageHeader eyebrow="The houses" title="Pick a side" description="Open a team to see its members, contributors, achievements and history." className="mb-10" />
      <ol className="grid gap-4 md:grid-cols-2">
        {teams.map((t, i) => (
          <TeamCard key={t.id} team={t} leaderPoints={teams[0]?.points ?? 0} index={i} />
        ))}
      </ol>
    </div>
  );
}
