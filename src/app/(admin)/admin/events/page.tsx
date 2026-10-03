import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/bits";
import { EventsManager } from "@/components/admin/EventsManager";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const sp = await searchParams;
  const repo = getRepo();
  const [events, teams, categories] = await Promise.all([repo.listEvents(), repo.getTeams(), repo.getCategories()]);
  return (
    <div className="mx-auto max-w-5xl">
      <AdminHeader title="Events" description="Create, edit and close out events. Winners can trigger point awards." />
      <EventsManager events={events} teams={teams} categories={categories} openNew={sp.new === "1"} />
    </div>
  );
}
