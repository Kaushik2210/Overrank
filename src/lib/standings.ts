/** Rank rows by points desc; ties share a rank (1,2,2,4). Stable on the incoming order. */
export function rankBy<T>(rows: T[], points: (r: T) => number): (T & { rank: number })[] {
  const sorted = [...rows].sort((a, b) => points(b) - points(a));
  let prev = Number.NaN;
  let rank = 0;
  return sorted.map((r, i) => {
    if (points(r) !== prev) {
      rank = i + 1;
      prev = points(r);
    }
    return { ...r, rank };
  });
}

/**
 * The ledger is append-only. A reversed row keeps its amount and is flagged "reversed";
 * its compensating row (opposite sign) cancels it out, so both count. Only pending rows
 * (awaiting approval) are left out of totals.
 */
export function sumLedger<T extends { amount: number; status: string }>(txs: T[]) {
  return txs.reduce((n, t) => (t.status === "pending" ? n : n + t.amount), 0);
}
