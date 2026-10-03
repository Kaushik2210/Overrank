import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/bits";
import { SuggestionReview } from "@/components/admin/ReviewControls";
import { SuggestionCard } from "@/components/feedback/Cards";
import { getRepo } from "@/lib/data";
import { evidenceHref } from "@/lib/storage";

export const metadata: Metadata = { title: "Suggestions" };
export const dynamic = "force-dynamic";

export default async function AdminSuggestions() {
  const all = await getRepo().listSuggestions();
  const hrefs = await Promise.all(all.map((s) => evidenceHref(s.evidenceUrl)));
  const rows = all.map((s, i) => ({ s, href: hrefs[i] }));
  const pending = rows.filter((r) => r.s.status === "pending");
  const reviewed = rows.filter((r) => r.s.status !== "pending");
  return (
    <div className="mx-auto max-w-4xl">
      <AdminHeader title="Suggestions" description="Student-submitted achievements waiting for a decision." />
      <h2 className="mb-4 font-display text-lg font-semibold">Pending ({pending.length})</h2>
      <div className="space-y-4">
        {pending.length === 0 && <p className="glass rounded-lg p-8 text-center text-dim">Nothing to review. Nice.</p>}
        {pending.map(({ s, href }) => (
          <SuggestionCard key={s.id} s={s} evidenceHref={href} footer={<SuggestionReview id={s.id} suggested={s.suggestedPoints} />} />
        ))}
      </div>
      {reviewed.length > 0 && (
        <>
          <h2 className="mt-12 mb-4 font-display text-lg font-semibold">Reviewed</h2>
          <div className="space-y-4">
            {reviewed.map(({ s, href }) => (
              <SuggestionCard key={s.id} s={s} evidenceHref={href} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
