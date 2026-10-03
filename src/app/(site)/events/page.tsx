import type { Metadata } from "next";
import { EventsBrowser } from "@/components/events/EventsBrowser";
import { PageHeader } from "@/components/ui/PageHeader";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const repo = getRepo();
  const [events, teams] = await Promise.all([repo.listEvents(), repo.getTeams()]);
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <PageHeader eyebrow="Calendar" title="Events and fixtures" description="See what is on, who won, and what is coming up." className="mb-10" />
      <EventsBrowser events={events} teams={teams} />
    </div>
  );
}
