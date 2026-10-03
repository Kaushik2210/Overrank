import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SuggestionCard } from "@/components/feedback/Cards";
import { SuggestionForm } from "@/components/feedback/Forms";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { evidenceHref } from "@/lib/storage";

export const metadata: Metadata = { title: "Suggestions" };
export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const session = await requireSession();
  if (!session.studentId) redirect("/admin/suggestions");
  const repo = getRepo();
  const [categories, mine] = await Promise.all([repo.getCategories(), repo.listSuggestions({ studentId: session.studentId })]);
  const hrefs = await Promise.all(mine.map((s) => evidenceHref(s.evidenceUrl)));
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <PageHeader eyebrow="Your voice" title="Suggest an achievement" description="Did something worth points that we missed? Tell faculty and attach proof." className="mb-10" />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SuggestionForm categories={categories} />
        </div>
        <div className="space-y-4 lg:col-span-3">
          <h2 className="font-display text-xl font-bold">Your submissions</h2>
          {mine.length === 0 ? (
            <p className="glass rounded-lg p-8 text-center text-dim">Nothing submitted yet. Your first suggestion will appear here with its review status.</p>
          ) : (
            mine.map((s, i) => <SuggestionCard key={s.id} s={s} evidenceHref={hrefs[i]} />)
          )}
        </div>
      </div>
    </div>
  );
}
