import { describe, expect, it } from "vitest";
import { awardSchema, disputeSchema, suggestionSchema, teamSchema } from "@/lib/validators";
import { inspectEvidence } from "@/lib/storage";

describe("awardSchema", () => {
  const base = { studentIds: ["2647101"], amount: 25, categoryId: "cat_sports", reason: "Won the sprint" };
  it("accepts a valid award and coerces strings", () => {
    expect(awardSchema.parse({ ...base, amount: "25" }).amount).toBe(25);
  });
  it("accepts deductions", () => {
    expect(awardSchema.safeParse({ ...base, amount: -10 }).success).toBe(true);
  });
  it("rejects zero, huge and fractional amounts", () => {
    expect(awardSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(awardSchema.safeParse({ ...base, amount: 5000 }).success).toBe(false);
    expect(awardSchema.safeParse({ ...base, amount: 2.5 }).success).toBe(false);
  });
  it("rejects empty or malformed student lists", () => {
    expect(awardSchema.safeParse({ ...base, studentIds: [] }).success).toBe(false);
    expect(awardSchema.safeParse({ ...base, studentIds: ["abc"] }).success).toBe(false);
  });
});

describe("student submissions", () => {
  it("requires meaningful text", () => {
    expect(suggestionSchema.safeParse({ activity: "x", description: "short", categoryId: "c", suggestedPoints: 10 }).success).toBe(false);
    expect(disputeSchema.safeParse({ transactionId: "t", reason: "too short" }).success).toBe(false);
  });
  it("caps suggested points", () => {
    expect(suggestionSchema.safeParse({ activity: "Hackathon win", description: "We won the hack.", categoryId: "c", suggestedPoints: 9999 }).success).toBe(false);
  });
});

describe("teamSchema", () => {
  it("only allows hex colours", () => {
    const t = { id: "t", name: "Team", motto: "", colorPrimary: "#22C55E", colorGlow: "#4ADE80" };
    expect(teamSchema.safeParse(t).success).toBe(true);
    expect(teamSchema.safeParse({ ...t, colorPrimary: "red" }).success).toBe(false);
  });
});

describe("evidence inspection", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]);
  it("accepts a real PNG", () => {
    expect(inspectEvidence(png, "image/png").ext).toBe("png");
  });
  it("rejects a mislabelled file", () => {
    expect(() => inspectEvidence(Buffer.from("<script>alert(1)</script>"), "image/png")).toThrow();
    expect(() => inspectEvidence(png, "application/pdf")).toThrow();
  });
  it("rejects empty and oversized files", () => {
    expect(() => inspectEvidence(Buffer.alloc(0), "image/png")).toThrow();
    expect(() => inspectEvidence(Buffer.concat([png, Buffer.alloc(6 * 1024 * 1024)]), "image/png")).toThrow(/5 MB/);
  });
});
