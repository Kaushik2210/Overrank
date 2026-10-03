import { beforeEach, describe, expect, it } from "vitest";
import { buildStore } from "@/lib/data/seed";
import { memoryRepo as repo } from "@/lib/data/memory";
import type { Session } from "@/lib/data/types";

const admin: Session = { userId: "admin", role: "admin", name: "Test Admin", studentId: null, teamId: null };
const student = (id: string, teamId: string): Session => ({ userId: id, role: "student", name: "S", studentId: id, teamId });

beforeEach(() => {
  (globalThis as unknown as { __hc: unknown }).__hc = buildStore({ demo: false });
});

describe("roster", () => {
  it("loads 6 teams and 60 students at zero points", async () => {
    const teams = await repo.getTeams();
    const students = await repo.getStudents();
    expect(teams).toHaveLength(6);
    expect(students).toHaveLength(60);
    expect(teams.every((t) => t.points === 0 && t.memberCount === 10)).toBe(true);
    expect(students.every((x) => x.points === 0)).toBe(true);
  });
});

describe("awarding points", () => {
  it("adds to the student and the team, and updates rank", async () => {
    const res = await repo.awardPoints(admin, { studentIds: ["2647109"], amount: 80, categoryId: "cat_sports", reason: "Won the sprint" });
    expect(res.teamAfter.points).toBe(80);
    expect(res.teamAfter.rank).toBe(1);
    expect(res.leaderChanged).toBe(true);
    const s = (await repo.getStudents()).find((x) => x.id === "2647109")!;
    expect(s.points).toBe(80);
    expect(s.level).toBe(1);
  });

  it("unlocks threshold achievements automatically", async () => {
    const res = await repo.awardPoints(admin, { studentIds: ["2647109"], amount: 120, categoryId: "cat_sports", reason: "Tournament" });
    const names = res.unlocked.map((u) => u.achievement.name);
    expect(names).toContain("First Blood");
    expect(names).toContain("Century");
    expect(names).toContain("Sportsperson");
  });

  it("refuses students", async () => {
    await expect(
      repo.awardPoints(student("2647109", "team_tech-titans"), { studentIds: ["2647109"], amount: 50, categoryId: "cat_other", reason: "me" }),
    ).rejects.toThrow("Not allowed");
  });

  it("rejects zero amounts and unknown students", async () => {
    await expect(repo.awardPoints(admin, { studentIds: ["2647109"], amount: 0, categoryId: "cat_other", reason: "x" })).rejects.toThrow();
    await expect(repo.awardPoints(admin, { studentIds: ["nope"], amount: 5, categoryId: "cat_other", reason: "x" })).rejects.toThrow();
  });
});

describe("reversal", () => {
  it("appends a compensating row and keeps history", async () => {
    const { transactions } = await repo.awardPoints(admin, { studentIds: ["2647102"], amount: 40, categoryId: "cat_academics", reason: "Top mark" });
    await repo.reverseTransaction(admin, transactions[0].id, "entered twice");
    const { rows } = await repo.listTransactions({ studentId: "2647102" });
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.id === transactions[0].id)!.status).toBe("reversed");
    expect((await repo.getStudents()).find((x) => x.id === "2647102")!.points).toBe(0);
  });

  it("cannot reverse twice", async () => {
    const { transactions } = await repo.awardPoints(admin, { studentIds: ["2647102"], amount: 40, categoryId: "cat_academics", reason: "x" });
    await repo.reverseTransaction(admin, transactions[0].id, "");
    await expect(repo.reverseTransaction(admin, transactions[0].id, "")).rejects.toThrow();
  });
});

describe("disputes and suggestions", () => {
  it("only lets a student dispute their own transaction", async () => {
    const { transactions } = await repo.awardPoints(admin, { studentIds: ["2647102"], amount: 10, categoryId: "cat_other", reason: "x" });
    await expect(
      repo.createDispute(student("2647101", "team_slytherin"), { transactionId: transactions[0].id, reason: "not mine", evidenceUrl: null }),
    ).rejects.toThrow();
    const d = await repo.createDispute(student("2647102", "team_slytherin"), { transactionId: transactions[0].id, reason: "wrong", evidenceUrl: null });
    expect(d.status).toBe("pending");
  });

  it("awards points when a suggestion is approved", async () => {
    const sug = await repo.createSuggestion(student("2647102", "team_slytherin"), {
      activity: "Ran a workshop",
      description: "d",
      categoryId: "cat_events",
      suggestedPoints: 30,
      evidenceUrl: null,
    });
    await repo.reviewSuggestion(admin, sug.id, "approved", 25, "ok");
    expect((await repo.getStudents()).find((x) => x.id === "2647102")!.points).toBe(25);
  });
});

describe("roster import", () => {
  it("flags duplicates, unknown teams and bad ids", async () => {
    const p = await repo.previewRoster([
      { team: "Slytherin", studentId: "2647999", name: "New Kid" },
      { team: "Slytherin", studentId: "2647999", name: "Dupe" },
      { team: "Hufflepuff", studentId: "2647998", name: "Nobody" },
      { team: "Slytherin", studentId: "12", name: "Short" },
      { team: "Anakonda", studentId: "2647113", name: "Ankit Anand" },
    ]);
    expect(p.adds).toBe(1);
    expect(p.updates).toBe(1);
    expect(p.issues.map((i) => i.row)).toEqual([3, 4, 5]);
  });
});

describe("audit log", () => {
  it("records admin actions", async () => {
    await repo.awardPoints(admin, { studentIds: ["2647109"], amount: 5, categoryId: "cat_other", reason: "x" });
    const log = await repo.listAudit(5);
    expect(log[0].action).toBe("points.award");
    expect(log[0].actorName).toBe("Test Admin");
  });
});
