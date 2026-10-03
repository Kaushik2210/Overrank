import { LifeBuoy, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Countdown } from "@/components/events/Countdown";
import { StudentProfileView } from "@/components/profile/StudentProfileView";
import { requireSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "My dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  if (!session.studentId) redirect("/admin");
  const repo = getRepo();
  const [detail, students, events] = await Promise.all([repo.getStudent(session.studentId), repo.getStudents(), repo.listEvents()]);
  if (!detail) notFound();
  const next = events.find((e) => e.status === "upcoming" && detail.registeredEventIds.includes(e.id)) ?? events.find((e) => e.status === "upcoming");

  return (
    <StudentProfileView detail={detail} totalStudents={students.length} txHref={(id) => `/transactions/${id}`}>
      <div className="grid gap-4 md:grid-cols-3">
        {next && (
          <div className="glass rounded-lg p-5 md:col-span-1">
            <p className="text-xs tracking-wider text-faint uppercase">Next event</p>
            <Link href="/events" className="mt-1 block font-display text-lg font-bold hover:text-accent">
              {next.title}
            </Link>
            <Countdown to={next.startsAt} compact className="mt-3" />
          </div>
        )}
        <Link href="/suggestions" className="glass flex items-center gap-4 rounded-lg p-5 transition-colors hover:border-line-strong">
          <Lightbulb className="size-8 text-warn" aria-hidden />
          <div>
            <p className="font-semibold">Suggest an achievement</p>
            <p className="text-sm text-dim">Did something worth points? Tell faculty.</p>
          </div>
        </Link>
        <Link href="/disputes" className="glass flex items-center gap-4 rounded-lg p-5 transition-colors hover:border-line-strong">
          <LifeBuoy className="size-8 text-accent" aria-hidden />
          <div>
            <p className="font-semibold">Dispute a transaction</p>
            <p className="text-sm text-dim">Spot something wrong? Report it.</p>
          </div>
        </Link>
      </div>
    </StudentProfileView>
  );
}
