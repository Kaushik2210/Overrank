import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GridBackground } from "@/components/background/GridBackground";
import { Logo } from "@/components/nav/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { AdminLoginForm } from "./AdminLoginForm";
import { previewSignInAction } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/data";

export const metadata: Metadata = { title: "Faculty sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const prod = process.env.NODE_ENV === "production";
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
                Preview mode: no Supabase project is connected. Data lives in memory and resets when the server restarts.
              </div>
              {prod && !process.env.PREVIEW_ADMIN_PASSWORD ? (
                <p role="alert" className="mt-4 text-sm text-danger">Faculty sign-in is switched off on this deployment until a password is configured.</p>
              ) : (
                <form action={previewSignInAction} className="mt-4 space-y-3">
                  {prod && <Input name="password" type="password" autoComplete="current-password" placeholder="Faculty password" aria-label="Faculty password" required />}
                  {error === "password" && <p role="alert" className="text-sm text-danger">Wrong password.</p>}
                  {error === "rate" && <p role="alert" className="text-sm text-danger">Too many attempts. Wait a few minutes.</p>}
                  <Button className="w-full">
                    <ShieldCheck className="size-4" /> {prod ? "Sign in" : "Enter as faculty admin (preview)"}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
