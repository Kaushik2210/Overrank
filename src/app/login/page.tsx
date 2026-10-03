import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GridBackground } from "@/components/background/GridBackground";
import { Logo } from "@/components/nav/Logo";
import { Button } from "@/components/ui/Button";
import { AdminLoginForm } from "./AdminLoginForm";
import { previewSignInAction } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";

export const metadata: Metadata = { title: "Faculty sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <GridBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glass rounded-xl p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">Faculty sign in</h1>
          <p className="mt-1 text-sm text-dim">Only faculty sign in, to award points and manage the season. Everyone else can browse the leaderboard freely.</p>

          {hasSupabase ? (
            <AdminLoginForm />
          ) : (
            <>
              <div className="mt-6 rounded-md border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
                Preview mode: no Supabase project is connected, so there is no password. Connect Supabase to turn real authentication on.
              </div>
              <form action={previewSignInAction} className="mt-4">
                <Button className="w-full">
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
