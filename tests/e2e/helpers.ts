import type { Page } from "@playwright/test";

/** Preview mode has a single faculty sign-in button. With Supabase this would fill email and password instead. */
export async function signInAdmin(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /faculty admin/i }).click();
  await page.waitForURL(/admin/);
}
