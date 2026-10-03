import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readLocalEvidence } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Preview-mode evidence viewer. Faculty only. */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { path } = await ctx.params;
  try {
    const { buf, mime } = await readLocalEvidence(path.join("/"));
    return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": mime, "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=0" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
