import { describe, expect, it } from "vitest";
import { levelFromPoints, xpForLevel } from "@/lib/xp";

describe("xp levels", () => {
  it("starts at level 1 with zero xp", () => {
    const l = levelFromPoints(0);
    expect(l.level).toBe(1);
    expect(l.levelProgress).toBe(0);
    expect(l.xpToNext).toBe(100);
  });

  it("levels up at the thresholds", () => {
    expect(levelFromPoints(99).level).toBe(1);
    expect(levelFromPoints(100).level).toBe(2);
    expect(levelFromPoints(249).level).toBe(2);
    expect(levelFromPoints(250).level).toBe(3);
  });

  it("reports progress inside a level", () => {
    const l = levelFromPoints(175); // level 2 spans 100..250
    expect(l.level).toBe(2);
    expect(l.levelProgress).toBeCloseTo(0.5);
    expect(l.xpToNext).toBe(75);
  });

  it("extends past the table using the last gap", () => {
    expect(xpForLevel(11)).toBe(4000);
    expect(xpForLevel(12)).toBe(4800);
  });

  it("honours a custom xp-per-point multiplier", () => {
    const l = levelFromPoints(50, { xpPerPoint: 2, thresholds: [100] });
    expect(l.xp).toBe(100);
    expect(l.level).toBe(2);
  });

  it("never goes below level 1 for negative points", () => {
    expect(levelFromPoints(-40).level).toBe(1);
  });
});
