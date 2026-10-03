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

/** Sum active transactions only. Reversals are separate compensating rows, so they net out naturally. */
export function sumActive<T extends { amount: number; status: string }>(txs: T[]) {
  return txs.reduce((n, t) => (t.status === "active" ? n + t.amount : n), 0);
}
