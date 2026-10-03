import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GridBackground } from "@/components/background/GridBackground";
import { Logo } from "@/components/nav/Logo";
import { ResetPasswordForm } from "@/app/login/AuthForms";
import { getSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  if (!hasSupabase) redirect("/login");
  // only reachable with the session the emailed link just created
  if (!(await getSession())) redirect("/forgot-password?error=link");
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <GridBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glass rounded-xl p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
          <p className="mt-1 text-sm text-dim">You are verified by email. Pick something you have not used elsewhere.</p>
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
