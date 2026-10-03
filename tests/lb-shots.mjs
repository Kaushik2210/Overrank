import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://localhost:3100/leaderboard", { waitUntil: "networkidle" });
await p.waitForTimeout(3500);
await p.screenshot({ path: "screenshots/lb-grid.png" });
for (const t of ["Players", "Movers", "Season replay"]) {
  await p.getByRole("tab", { name: t }).click();
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `screenshots/lb-${t.split(" ")[0].toLowerCase()}.png` });
}
console.log("errors:", errs.length ? errs : "none");
await b.close();
