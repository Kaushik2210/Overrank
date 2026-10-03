import { expect, test, type Page } from "@playwright/test";
import { signInAdmin } from "./helpers";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1366, 1440, 1920];
const PUBLIC = ["/", "/leaderboard", "/teams", "/teams/slytherin", "/events", "/achievements", "/about", "/settings", "/students/2647109", "/login"];
const ADMIN = ["/admin", "/admin/points", "/admin/students", "/admin/analytics", "/admin/events", "/admin/achievements", "/admin/settings"];

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  // scroll through so scroll-triggered reveals and lazy charts render, then back to the top
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

async function audit(page: Page, path: string, width: number) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
  await page.goto(path);
  await settle(page);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${path} @${width}: horizontal overflow`).toBeLessThanOrEqual(0);
  expect(errors, `${path} @${width}: page errors`).toEqual([]);

  // clipped text: any element whose content is wider than its box while overflow is hidden on a leaf text node
  if (width <= 430) {
    const small = await page.evaluate(() => {
      const bad: string[] = [];
      const sel = "a[href], button, input:not([type=hidden]):not([type=file]), select, textarea, [role=tab], [role=radio], [role=switch]";
      for (const el of document.querySelectorAll<HTMLElement>(sel)) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none") continue;
        if (el.closest("[aria-hidden=true]") || el.closest("nextjs-portal")) continue;
        if (el.classList.contains("sr-only") || el.closest(".sr-only")) continue;
        // inline links inside running prose are exempt (WCAG inline exception)
        if (el.tagName === "A" && cs.display === "inline") continue;
        if (r.height < 43.5 || r.width < 43.5) bad.push(`${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      return bad;
    });
    expect(small, `${path} @${width}: touch targets under 44px`).toEqual([]);
  }
}

test.describe("responsive: public pages", () => {
  for (const path of PUBLIC) {
    for (const w of WIDTHS) {
      test(`${path} @${w}`, async ({ page }) => {
        await audit(page, path, w);
        if (w === 320 || w === 1440) await page.screenshot({ path: `screenshots/qa${path.replace(/\W+/g, "_")}-${w}.png`, fullPage: true });
      });
    }
  }
});

test.describe("responsive: faculty pages", () => {
  for (const path of ADMIN) {
    for (const w of WIDTHS) {
      test(`${path} @${w}`, async ({ page }) => {
        await signInAdmin(page);
        await audit(page, path, w);
        if (w === 390 || w === 1440) await page.screenshot({ path: `screenshots/qa${path.replace(/\W+/g, "_")}-${w}.png`, fullPage: true });
      });
    }
  }
});
