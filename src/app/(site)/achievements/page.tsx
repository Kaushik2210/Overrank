import type { Metadata } from "next";
import { AchievementGallery, type GalleryItem } from "@/components/gamification/AchievementGallery";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/lib/auth";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const repo = getRepo();
  const session = await getSession();
  const studentId = session?.studentId ?? undefined;
  const [list, categories, detail] = await Promise.all([repo.listAchievements(studentId), repo.getCategories(), studentId ? repo.getStudent(studentId) : null]);
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const byCat = new Map(detail?.categoryBreakdown.map((c) => [c.categoryId, c.points]));

  const items: GalleryItem[] = list.map((a) => {
    const r = a.rule;
    let ruleText = "Awarded manually by faculty.";
    let progress: number | null = null;
    if (r.kind === "points") {
      ruleText = `Reach ${r.threshold.toLocaleString("en-IN")} personal points.`;
      if (detail) progress = Math.min(1, Math.max(0, detail.student.points / r.threshold));
    } else if (r.kind === "category") {
      ruleText = `Earn ${r.threshold} points in ${catName.get(r.categoryId) ?? "a category"}.`;
      if (detail) progress = Math.min(1, Math.max(0, (byCat.get(r.categoryId) ?? 0) / r.threshold));
    }
    return { ...a, ruleText, progress };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <PageHeader eyebrow="Trophy room" title="Badges and achievements" description="Some unlock automatically as you earn points. Others are handed out by faculty for the moments that matter." className="mb-10" />
      <AchievementGallery items={items} signedIn={!!session?.studentId} />
    </div>
  );
}
