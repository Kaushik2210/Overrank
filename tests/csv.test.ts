import { describe, expect, it } from "vitest";
import { parseCsv, parseRosterCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("handles quotes, commas and CRLF", () => {
    expect(parseCsv('a,"b, c",d\r\n1,"say ""hi""",3\r\n')).toEqual([["a", "b, c", "d"], ["1", 'say "hi"', "3"]]);
  });
  it("skips blank lines and a BOM", () => {
    expect(parseCsv("﻿x,y\n\n1,2\n")).toEqual([["x", "y"], ["1", "2"]]);
  });
});

describe("parseRosterCsv", () => {
  it("maps columns by header name in any order", () => {
    const { rows } = parseRosterCsv("name,team,studentId\nAda Lovelace,Slytherin,2647101");
    expect(rows).toEqual([{ team: "Slytherin", studentId: "2647101", name: "Ada Lovelace" }]);
  });
  it("reports a bad header", () => {
    expect(parseRosterCsv("a,b,c\n1,2,3").error).toMatch(/Header/);
  });
  it("round-trips the shipped roster", async () => {
    const fs = await import("node:fs");
    const { rows, error } = parseRosterCsv(fs.readFileSync("data/roster.csv", "utf8"));
    expect(error).toBeUndefined();
    expect(rows).toHaveLength(60);
  });
});
