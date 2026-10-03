import type { Metadata } from "next";
import { AchievementGallery, type GalleryItem } from "@/components/gamification/AchievementGallery";
import { PageHeader } from "@/components/ui/PageHeader";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const repo = getRepo();
  const [list, categories] = await Promise.all([repo.listAchievements(), repo.getCategories()]);
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  const items: GalleryItem[] = list.map((a) => {
    const r = a.rule;
    let ruleText = "Awarded manually by faculty.";
    if (r.kind === "points") {
      ruleText = `Reach ${r.threshold.toLocaleString("en-IN")} personal points.`;
    } else if (r.kind === "category") {
      ruleText = `Earn ${r.threshold} points in ${catName.get(r.categoryId) ?? "a category"}.`;
    }
    return { ...a, ruleText, progress: null };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <PageHeader eyebrow="Trophy room" title="Badges and achievements" description="Some unlock automatically as you earn points. Others are handed out by faculty for the moments that matter." className="mb-10" />
      <AchievementGallery items={items} signedIn={false} />
    </div>
  );
}
