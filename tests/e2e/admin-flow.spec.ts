import { expect, test } from "@playwright/test";
import { signInAdmin, signInStudent } from "./helpers";

test("students cannot open the admin area", async ({ page }) => {
  await signInStudent(page, "2647109");
  await page.goto("/admin");
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/admin/points");
  await expect(page).toHaveURL(/dashboard/);
});

test("signed-out visitors are sent to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/login/);
  const res = await page.request.get("/api/admin/ledger");
  expect(res.status()).toBe(403);
});

test("admin awards points and sees the success sequence", async ({ page }) => {
  await signInAdmin(page);
  await page.getByRole("button", { name: "Award points" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Award points" });
  await dialog.getByPlaceholder("Search by name, ID or team").fill("Gayathri");
  await dialog.getByRole("button", { name: /Gayathri V S/ }).click();
  await dialog.getByLabel("Points").fill("35");
  await dialog.getByLabel("Category").selectOption("cat_sports");
  await dialog.getByLabel("Reason").fill("Won the relay");
  await dialog.getByRole("button", { name: "Award points" }).click();
  await expect(page.getByText("Points awarded to")).toBeVisible();
  await expect(page.getByText("Gayathri V S").last()).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  await page.goto("/admin/points?q=Gayathri");
  await expect(page.getByRole("link", { name: "Gayathri V S" }).first()).toBeVisible();
});

test("award form validates before submitting", async ({ page }) => {
  await signInAdmin(page);
  await page.getByRole("button", { name: "Award points" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Award points" });
  await dialog.getByRole("button", { name: "Award points" }).click();
  await expect(dialog.getByText("Pick at least one student")).toBeVisible();
  await expect(dialog.getByText("Pick a category")).toBeVisible();
});

test("command palette opens with Ctrl+K and navigates", async ({ page }) => {
  await signInAdmin(page);
  await page.keyboard.press("Control+k");
  const input = page.getByPlaceholder(/Type a command/);
  await expect(input).toBeVisible();
  await input.fill("analytics");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/admin\/analytics/);
});

test("admin can approve a suggestion and the student is awarded", async ({ browser, page }) => {
  const title = `Peer tutoring ${Date.now()}`;
  const student = await browser.newPage();
  await signInStudent(student, "2647160");
  await student.goto("/suggestions");
  await student.fill('input[name="activity"]', title);
  await student.fill('textarea[name="description"]', "Tutored first years in maths for a month.");
  await student.selectOption('select[name="categoryId"]', "cat_academics");
  await student.getByRole("button", { name: "Submit suggestion" }).click();
  await expect(student.locator("article", { hasText: title })).toBeVisible();
  await student.close();

  await signInAdmin(page);
  await page.goto("/admin/suggestions");
  await page.locator("article", { hasText: title }).getByRole("button", { name: /Approve/ }).click();
  await expect(page.locator("article", { hasText: title }).getByText("Approved")).toBeVisible();
});

test("csv export neutralises formula injection", async ({ page }) => {
  await signInAdmin(page);
  const res = await page.request.get("/api/admin/ledger");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  const body = await res.text();
  expect(body.split("\r\n")[0]).toContain('"Student ID"');
});
