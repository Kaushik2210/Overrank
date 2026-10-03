// usage: node tests/shoot.mjs <path> <width> [height] [out]
import { chromium } from "@playwright/test";
const [path = "/", w = "1440", h = "900", out] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://localhost:3100/" + path.replace(/^[/]/, ""), { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
const file = out ?? `screenshots/${path.replace(/\W+/g, "_") || "home"}-${w}.png`;
await p.screenshot({ path: file, fullPage: true });
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log(file, "overflowX:", overflow, "errors:", errs.length ? errs : "none");
await b.close();
