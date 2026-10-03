import { describe, expect, it } from "vitest";
import { generateLoginCode, hashLoginCode, normaliseCode, verifyLoginCode } from "@/lib/login-code";

describe("login codes", () => {
  it("generates readable codes without look-alike characters", () => {
    for (let i = 0; i < 50; i++) expect(generateLoginCode()).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
  });
  it("verifies the right code regardless of case or dashes", () => {
    const h = hashLoginCode("K7QM-2XPD");
    expect(verifyLoginCode("k7qm2xpd", h)).toBe(true);
    expect(verifyLoginCode("K7QM-2XPE", h)).toBe(false);
  });
  it("salts every hash and never stores the code", () => {
    const a = hashLoginCode("ABCD-EFGH");
    expect(a).not.toBe(hashLoginCode("ABCD-EFGH"));
    expect(a).not.toContain("ABCD");
  });
  it("normalises input", () => {
    expect(normaliseCode(" ab-cd 12 ")).toBe("ABCD12");
  });
});
