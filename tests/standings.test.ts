import { describe, expect, it } from "vitest";
import { rankBy, sumLedger } from "@/lib/standings";

describe("rankBy", () => {
  it("ranks by points descending", () => {
    const r = rankBy([{ n: "a", p: 5 }, { n: "b", p: 9 }, { n: "c", p: 1 }], (x) => x.p);
    expect(r.map((x) => x.n)).toEqual(["b", "a", "c"]);
    expect(r.map((x) => x.rank)).toEqual([1, 2, 3]);
  });

  it("gives ties the same rank and skips the next", () => {
    const r = rankBy([{ p: 10 }, { p: 10 }, { p: 4 }], (x) => x.p);
    expect(r.map((x) => x.rank)).toEqual([1, 1, 3]);
  });
});

describe("sumLedger", () => {
  it("skips pending rows but counts a reversed row together with its compensation", () => {
    const total = sumLedger([
      { amount: 50, status: "active" },
      { amount: 30, status: "reversed" },
      { amount: -30, status: "active" }, // compensating row
      { amount: 20, status: "pending" },
      { amount: -10, status: "active" },
    ]);
    expect(total).toBe(40);
  });
});
