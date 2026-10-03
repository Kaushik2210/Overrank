import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
for (const [name, y] of [["a-top", 0], ["b-mid", 700], ["c-late", 1500], ["d-after", 2500]]) {
  await p.evaluate((yy) => scrollTo(0, yy), y);
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `screenshots/hero-${name}.png` });
}
console.log("errors:", errs.length ? errs : "none");
await b.close();
