import type { Metadata } from "next";
import { AchievementsManager } from "@/components/admin/AchievementsManager";
import { AdminHeader } from "@/components/admin/bits";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

export default async function AdminAchievements() {
  const repo = getRepo();
  const [items, categories] = await Promise.all([repo.listAchievements(), repo.getCategories()]);
  return (
    <div className="mx-auto max-w-5xl">
      <AdminHeader title="Achievements" description="Automatic badges unlock on thresholds. Manual ones are granted by faculty." />
      <AchievementsManager items={items} categories={categories} />
    </div>
  );
}
