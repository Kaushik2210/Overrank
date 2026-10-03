import { randomInt, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

/** Short one-time first-login code, e.g. "K7QM-2XPD". Avoids look-alike characters. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generateLoginCode() {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)];
  return `${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}`;
}

export const normaliseCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

export function hashLoginCode(code: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(normaliseCode(code), salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyLoginCode(code: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(normaliseCode(code), Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export const studentEmail = (studentId: string) => `${studentId}@housecore.local`;
