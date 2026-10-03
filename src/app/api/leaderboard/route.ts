import { NextResponse } from "next/server";
import { getRepo } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Public leaderboard snapshot. Polled by the live view when Realtime isn't available. */
export async function GET() {
  const teams = await getRepo().getTeams();
  return NextResponse.json({ teams }, { headers: { "Cache-Control": "no-store" } });
}
