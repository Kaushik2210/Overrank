import type { Page } from "@playwright/test";

export async function signInStudent(page: Page, id: string) {
  await page.goto("/login");
  await page.fill('input[name="studentId"]', id);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/dashboard/);
}

export async function signInAdmin(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /faculty admin/i }).click();
  await page.waitForURL(/admin/);
}

// 1x1 transparent PNG
export const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
