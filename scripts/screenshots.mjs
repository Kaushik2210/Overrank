/**
 * Regenerates the images in docs/screenshots from a running preview server with demo data:
 *   OVERRANK_DEMO=1 npm run dev:preview      (in one terminal)
 *   node scripts/screenshots.mjs             (in another)
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3100";
const out = "docs/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const shot = async (page, name, opts = {}) => {
  await page.waitForTimeout(opts.wait ?? 1800);
  await page.screenshot({ path: `${out}/${name}.jpg`, type: "jpeg", quality: 82, ...opts.screenshot });
  console.log("saved", `${out}/${name}.jpg`);
};

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desktop.goto(base + "/", { waitUntil: "networkidle" });
await desktop.waitForTimeout(3200); // let the intro finish
await shot(desktop, "home");

await desktop.goto(base + "/leaderboard", { waitUntil: "networkidle" });
await shot(desktop, "leaderboard", { wait: 2600 });
await desktop.getByRole("tab", { name: "Players" }).click();
await shot(desktop, "players");
await desktop.getByRole("tab", { name: "Season replay" }).click();
await shot(desktop, "replay", { wait: 3600 });

await desktop.goto(base + "/teams/tech-titans", { waitUntil: "networkidle" });
await shot(desktop, "team", { wait: 2200, screenshot: { fullPage: false } });

await desktop.goto(base + "/login", { waitUntil: "networkidle" });
await desktop.getByRole("button", { name: /faculty admin/i }).click();
await desktop.waitForURL(/admin/);
await desktop.waitForLoadState("networkidle");
await shot(desktop, "admin", { wait: 2600 });

const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await phone.goto(base + "/leaderboard", { waitUntil: "networkidle" });
await shot(phone, "mobile", { wait: 3200 });

await browser.close();
