import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/** Email links land here. Exchanges the one-time code for a session, then moves on to a fixed page. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  // only ever redirect to our own known page, never to a caller-supplied address
  const next = url.searchParams.get("next") === "/reset-password" ? "/reset-password" : "/admin";
  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/forgot-password?error=link", url.origin));
}
