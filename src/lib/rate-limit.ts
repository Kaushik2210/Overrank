import "server-only";

type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __hcRl?: Map<string, Bucket> };
const buckets = () => (g.__hcRl ??= new Map());

/** Fixed-window limiter, per process. Good enough to blunt abuse of submission endpoints. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const m = buckets();
  const b = m.get(key);
  if (!b || b.resetAt < now) {
    m.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= limit;
}
