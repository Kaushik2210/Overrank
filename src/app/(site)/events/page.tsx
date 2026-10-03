import type { Metadata } from "next";
import { EventsBrowser } from "@/components/events/EventsBrowser";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const repo = getRepo();
  const session = await getSession();
  const [events, teams, me] = await Promise.all([repo.listEvents(), repo.getTeams(), session?.studentId ? repo.getStudent(session.studentId) : null]);
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <PageHeader eyebrow="Calendar" title="Events and fixtures" description="Register, show up and bring points home for your house." className="mb-10" />
      <EventsBrowser events={events} teams={teams} registeredIds={me?.registeredEventIds ?? []} canRegister={session?.role === "student"} />
    </div>
  );
}
