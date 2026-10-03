import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      <PageHeader eyebrow="Preferences" title="Settings" className="mb-8" />
      <SettingsForm />
    </div>
  );
}
