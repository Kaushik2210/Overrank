import { expect, test } from "@playwright/test";
import { PNG, signInStudent } from "./helpers";

test("student can sign in, send a suggestion with evidence, and sees it pending", async ({ page }) => {
  await signInStudent(page, "2647109");
  await page.goto("/suggestions");
  await page.fill('input[name="activity"]', "Ran a robotics workshop");
  await page.fill('textarea[name="description"]', "Taught twenty first years how to build a line follower.");
  await page.selectOption('select[name="categoryId"]', "cat_events");
  await page.setInputFiles('input[name="evidence"]', { name: "proof.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: "Submit suggestion" }).click();
  const card = page.locator("article", { hasText: "Ran a robotics workshop" });
  await expect(card).toBeVisible();
  await expect(card.getByText("Pending")).toBeVisible();
  await expect(card.getByRole("link", { name: "Evidence" })).toBeVisible();
});

test("validation errors show before anything is sent", async ({ page }) => {
  await signInStudent(page, "2647109");
  await page.goto("/suggestions");
  await page.getByRole("button", { name: "Submit suggestion" }).click();
  await expect(page.getByText("Name the activity")).toBeVisible();
});

test("rejects a disguised non-image upload", async ({ page }) => {
  await signInStudent(page, "2647110");
  await page.goto("/suggestions");
  await page.fill('input[name="activity"]', "Sneaky upload test");
  await page.fill('textarea[name="description"]', "This should be rejected by the server.");
  await page.selectOption('select[name="categoryId"]', "cat_other");
  await page.setInputFiles('input[name="evidence"]', { name: "x.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") });
  await page.getByRole("button", { name: "Submit suggestion" }).click();
  await expect(page.getByText(/PNG, JPG, WebP or PDF/).first()).toBeVisible();
  await expect(page.locator("article", { hasText: "Sneaky upload test" })).toHaveCount(0);
});
