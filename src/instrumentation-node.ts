import type { LookupFunction } from "node:net";

/**
 * Local development only. Some networks hijack plain DNS lookups for *.supabase.co (the lookup returns an
 * address that is not Supabase, and the connection is reset). When OVERRANK_DOH=1 the dev server resolves
 * the Supabase host over DNS-over-HTTPS instead, which cannot be intercepted that way.
 * Never runs in production builds.
 */
export async function registerDohResolver() {
  if (process.env.NODE_ENV === "production" || process.env.OVERRANK_DOH !== "1") return;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return;

  const host = new URL(base).hostname;
  const { Agent, setGlobalDispatcher } = await import("undici");
  const dns = await import("node:dns");

  let cache: { ips: string[]; at: number } | null = null;
  const resolve = async () => {
    if (cache && Date.now() - cache.at < 5 * 60_000) return cache.ips;
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${host}&type=A`, { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(10_000) });
    const json = (await res.json()) as { Answer?: { type: number; data: string }[] };
    const ips = (json.Answer ?? []).filter((a) => a.type === 1).map((a) => a.data);
    if (!ips.length) throw new Error(`DNS-over-HTTPS returned no address for ${host}`);
    cache = { ips, at: Date.now() };
    return ips;
  };

  const lookup: LookupFunction = (hostname, options, cb) => {
    if (hostname !== host) return dns.lookup(hostname, options, cb);
    resolve().then(
      (ips) => {
        if ("all" in options && options.all) (cb as unknown as (e: null, a: { address: string; family: number }[]) => void)(null, ips.map((address) => ({ address, family: 4 })));
        else cb(null, ips[0], 4);
      },
      (e: Error) => cb(e as NodeJS.ErrnoException, "", 4),
    );
  };

  setGlobalDispatcher(new Agent({ connect: { lookup } }));
  console.log(`[overrank] resolving ${host} over DNS-over-HTTPS (dev only)`);
}
