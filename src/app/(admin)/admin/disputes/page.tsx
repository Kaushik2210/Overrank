import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/bits";
import { DisputeReview } from "@/components/admin/ReviewControls";
import { DisputeCard } from "@/components/feedback/Cards";
import { getRepo } from "@/lib/data";
import { evidenceHref } from "@/lib/storage";

export const metadata: Metadata = { title: "Disputes" };
export const dynamic = "force-dynamic";

export default async function AdminDisputes() {
  const all = await getRepo().listDisputes();
  const hrefs = await Promise.all(all.map((d) => evidenceHref(d.evidenceUrl)));
  const rows = all.map((d, i) => ({ d, href: hrefs[i] }));
  const pending = rows.filter((r) => r.d.status === "pending");
  const resolved = rows.filter((r) => r.d.status !== "pending");
  return (
    <div className="mx-auto max-w-4xl">
      <AdminHeader title="Disputes" description="Students questioning a ledger entry. Every outcome is written to the audit log." />
      <h2 className="mb-4 font-display text-lg font-semibold">Open ({pending.length})</h2>
      <div className="space-y-4">
        {pending.length === 0 && <p className="glass rounded-lg p-8 text-center text-dim">No open disputes.</p>}
        {pending.map(({ d, href }) => (
          <DisputeCard key={d.id} d={d} evidenceHref={href} footer={<DisputeReview id={d.id} currentAmount={d.transaction?.amount ?? 0} />} />
        ))}
      </div>
      {resolved.length > 0 && (
        <>
          <h2 className="mt-12 mb-4 font-display text-lg font-semibold">Resolved</h2>
          <div className="space-y-4">
            {resolved.map(({ d, href }) => (
              <DisputeCard key={d.id} d={d} evidenceHref={href} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
