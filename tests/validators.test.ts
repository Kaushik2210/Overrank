import { describe, expect, it } from "vitest";
import { awardSchema, colorSchema, iconSchema, idSchema, studentIdSchema, teamSchema } from "@/lib/validators";
import { inspectEvidence } from "@/lib/storage";

/** Classic payloads. None of them may get past input validation. */
const HOSTILE = [
  "'; DROP TABLE point_transactions; --",
  "1 OR 1=1",
  "' OR '1'='1",
  "x\"; select pg_sleep(10); --",
  "1;delete from students",
  "../../etc/passwd",
  "..\\..\\windows\\system32",
  "<script>alert(1)</script>",
  "id.eq.1,or(role.eq.admin)",
  "a b",
  "a/b",
  "%27%20OR%201=1",
  "x".repeat(65),
  "",
];

describe("awardSchema", () => {
  const base = { studentIds: ["2647101"], amount: 25, categoryId: "cat_sports", reason: "Won the sprint" };
  it("accepts a valid award and coerces strings", () => {
    expect(awardSchema.parse({ ...base, amount: "25" }).amount).toBe(25);
  });
  it("accepts uuids as well as preview ids", () => {
    expect(awardSchema.safeParse({ ...base, categoryId: "3f2b8f64-5717-4562-b3fc-2c963f66afa6" }).success).toBe(true);
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
  it("rejects hostile category, event and student values", () => {
    for (const bad of HOSTILE) {
      expect(awardSchema.safeParse({ ...base, categoryId: bad }).success, `categoryId ${bad}`).toBe(false);
      if (bad) expect(awardSchema.safeParse({ ...base, eventId: bad }).success, `eventId ${bad}`).toBe(false);
      expect(awardSchema.safeParse({ ...base, studentIds: [bad] }).success, `studentId ${bad}`).toBe(false);
    }
  });
  it("caps the reason length", () => {
    expect(awardSchema.safeParse({ ...base, reason: "x".repeat(201) }).success).toBe(false);
  });
});

describe("identifier schemas", () => {
  it("only allow plain characters", () => {
    for (const bad of HOSTILE) expect(idSchema.safeParse(bad).success, bad).toBe(false);
    expect(idSchema.safeParse("team_slytherin").success).toBe(true);
  });
  it("student ids are digits only", () => {
    for (const bad of HOSTILE) expect(studentIdSchema.safeParse(bad).success, bad).toBe(false);
    expect(studentIdSchema.safeParse("2647101").success).toBe(true);
  });
  it("icons and colours are allow-listed patterns", () => {
    expect(iconSchema.safeParse("Trophy").success).toBe(true);
    expect(iconSchema.safeParse("Trophy'); alert(1);//").success).toBe(false);
    expect(colorSchema.safeParse("#22C55E").success).toBe(true);
    expect(colorSchema.safeParse("red;background:url(javascript:alert(1))").success).toBe(false);
  });
});

describe("teamSchema", () => {
  const t = { id: "t", name: "Team", motto: "", colorPrimary: "#22C55E", colorGlow: "#4ADE80" };
  it("only allows hex colours", () => {
    expect(teamSchema.safeParse(t).success).toBe(true);
    expect(teamSchema.safeParse({ ...t, colorPrimary: "red" }).success).toBe(false);
  });
  it("rejects a hostile id", () => {
    expect(teamSchema.safeParse({ ...t, id: "'; drop table teams;--" }).success).toBe(false);
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
  it("rejects an SVG, which can carry script", () => {
    expect(() => inspectEvidence(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "image/svg+xml")).toThrow();
  });
  it("rejects empty and oversized files", () => {
    expect(() => inspectEvidence(Buffer.alloc(0), "image/png")).toThrow();
    expect(() => inspectEvidence(Buffer.concat([png, Buffer.alloc(6 * 1024 * 1024)]), "image/png")).toThrow(/5 MB/);
  });
});
