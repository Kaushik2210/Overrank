import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GridBackground } from "@/components/background/GridBackground";
import { Logo } from "@/components/nav/Logo";
import { Button } from "@/components/ui/Button";
import { PreviewSignInForm } from "./PreviewSignInForm";
import { SupabaseSignInForm } from "./SupabaseSignInForm";
import { previewSignInAction } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [session, sp] = await Promise.all([getSession(), searchParams]);
  if (session) redirect(session.role === "student" ? "/dashboard" : "/admin");

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <GridBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glass rounded-xl p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-dim">Sign in with your student ID to see your points, team and badges.</p>

          {hasSupabase ? (
            <SupabaseSignInForm />
          ) : (
            <>
              <PreviewSignInForm error={sp.error === "id"} />
              <div className="mt-6 rounded-md border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
                Preview mode: no Supabase project is connected, so any roster student ID can sign in without a password. Connect Supabase to turn real authentication on.
              </div>
              <form action={previewSignInAction} className="mt-4">
                <input type="hidden" name="who" value="admin" />
                <Button variant="outline" className="w-full">
                  <ShieldCheck className="size-4" /> Enter as faculty admin (preview)
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
