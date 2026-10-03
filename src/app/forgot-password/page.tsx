import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GridBackground } from "@/components/background/GridBackground";
import { Logo } from "@/components/nav/Logo";
import { ForgotPasswordForm } from "@/app/login/AuthForms";
import { hasSupabase } from "@/lib/data";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!hasSupabase) redirect("/login"); // preview mode has no passwords to reset
  const { error } = await searchParams;
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <GridBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glass rounded-xl p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">Forgot your password?</h1>
          <p className="mt-1 text-sm text-dim">Enter your faculty email and we will send you a link to choose a new one.</p>
          <ForgotPasswordForm linkExpired={error === "link"} />
        </div>
      </div>
    </main>
  );
}
