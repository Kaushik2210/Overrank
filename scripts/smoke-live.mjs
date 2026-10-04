/**
 * Read-only smoke test for a deployed site.
 *   BASE=https://your-site.vercel.app EMAIL=you@example.com PASSWORD=... node scripts/smoke-live.mjs
 * Checks the public pages, the locked admin area and (if credentials are given) a faculty sign-in.
 * It never writes data.
 */
import { chromium } from "@playwright/test";

const base = (process.env.BASE ?? "http://localhost:3000").replace(/\/$/, "");
const { EMAIL, PASSWORD } = process.env;
let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
  if (!ok) failed++;
};

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

for (const path of ["/", "/leaderboard", "/teams", "/events", "/achievements", "/about", "/login"]) {
  const res = await page.goto(base + path, { waitUntil: "networkidle" });
  check(`${path} loads`, res?.status() === 200, String(res?.status()));
}

await page.goto(base + "/admin", { waitUntil: "networkidle" });
check("/admin redirects signed-out visitors to login", page.url().includes("/login"));
const ledger = await page.request.get(base + "/api/admin/ledger");
check("ledger export refuses anonymous requests", ledger.status() === 403, String(ledger.status()));

if (EMAIL && PASSWORD) {
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', "definitely-wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const rejected = await page.getByText("do not match").waitFor({ timeout: 15000 }).then(() => true, () => false);
  check("a wrong password is rejected", rejected);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/admin/, { timeout: 30000 }).catch(() => {});
  check("faculty sign-in reaches the command center", /\/admin/.test(page.url()), page.url());
}

check("no uncaught page errors", errors.length === 0, errors.join(" | "));
await browser.close();
process.exit(failed ? 1 : 0);
