import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DisputeCard } from "@/components/feedback/Cards";
import { DisputeForm } from "@/components/feedback/Forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { evidenceHref } from "@/lib/storage";

export const metadata: Metadata = { title: "Disputes" };
export const dynamic = "force-dynamic";

export default async function DisputesPage({ searchParams }: { searchParams: Promise<{ tx?: string }> }) {
  const session = await requireSession();
  if (!session.studentId) redirect("/admin/disputes");
  const sp = await searchParams;
  const repo = getRepo();
  const [{ rows }, mine] = await Promise.all([repo.listTransactions({ studentId: session.studentId, pageSize: 100 }), repo.listDisputes({ studentId: session.studentId })]);
  const disputable = rows.filter((t) => t.status === "active" && !t.reversesId);
  const hrefs = await Promise.all(mine.map((d) => evidenceHref(d.evidenceUrl)));
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <PageHeader eyebrow="Fair play" title="Dispute a transaction" description="If a point entry looks wrong, report it. A teacher reviews every dispute and the outcome is recorded." className="mb-10" />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {disputable.length === 0 ? <p className="glass rounded-lg p-6 text-dim">You have no transactions to dispute yet.</p> : <DisputeForm transactions={disputable} defaultTx={sp.tx} />}
        </div>
        <div className="space-y-4 lg:col-span-3">
          <h2 className="font-display text-xl font-bold">Your disputes</h2>
          {mine.length === 0 ? <p className="glass rounded-lg p-8 text-center text-dim">No disputes filed.</p> : mine.map((d, i) => <DisputeCard key={d.id} d={d} evidenceHref={hrefs[i]} />)}
        </div>
      </div>
    </div>
  );
}
