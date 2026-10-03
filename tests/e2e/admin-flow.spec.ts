import { expect, test } from "@playwright/test";
import { signInAdmin } from "./helpers";

test.describe("public site needs no login", () => {
  for (const path of ["/", "/leaderboard", "/teams", "/teams/tech-titans", "/events", "/achievements", "/about", "/settings"]) {
    test(`${path} loads for a visitor`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("link", { name: "Faculty login" }).first()).toBeVisible();
    });
  }

  test("a player profile is public", async ({ page }) => {
    await page.goto("/students/2647109");
    await expect(page.getByRole("heading", { name: "Aman Sah" })).toBeVisible();
  });

  test("there is no student sign-in or student-only pages", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Student ID")).toHaveCount(0);
    for (const path of ["/dashboard", "/suggestions", "/disputes"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
    }
  });
});

test.describe("faculty area is protected", () => {
  test("signed-out visitors are sent to login", async ({ page }) => {
    for (const path of ["/admin", "/admin/points", "/admin/settings", "/transactions/anything"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/login/);
    }
  });

  test("private endpoints refuse anonymous requests", async ({ page }) => {
    expect((await page.request.get("/api/admin/ledger")).status()).toBe(403);
    expect((await page.request.get("/api/evidence/someone/file.png")).status()).toBe(401);
  });
});

test.describe("faculty flows", () => {
  test("admin awards points and sees the success sequence", async ({ page }) => {
    await signInAdmin(page);
    await page.getByRole("button", { name: "Award points" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Award points" });
    await dialog.getByPlaceholder("Search by name, ID or team").fill("Gayathri");
    await dialog.getByRole("button", { name: /Gayathri V S/ }).click();
    await dialog.getByLabel("Points").fill("35");
    await dialog.getByLabel("Category").selectOption({ label: "Sports" });
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

  test("a reversal adds a compensating entry and keeps history", async ({ page }) => {
    await signInAdmin(page);
    await page.getByRole("button", { name: "Award points" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Award points" });
    await dialog.getByPlaceholder("Search by name, ID or team").fill("Jacinta");
    await dialog.getByRole("button", { name: /Jacinta Joseph/ }).click();
    await dialog.getByLabel("Points").fill("15");
    await dialog.getByLabel("Category").selectOption({ label: "Other" });
    await dialog.getByLabel("Reason").fill("Entered by mistake e2e");
    await dialog.getByRole("button", { name: "Award points" }).click();
    await page.getByRole("button", { name: "Done" }).click();

    await page.goto("/admin/points?q=Entered by mistake e2e");
    await page.getByRole("link", { name: "Jacinta Joseph" }).first().click();
    await page.getByRole("button", { name: "Reverse" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Reverse" }).click();
    await expect(page.getByText("Transaction reversed")).toBeVisible();

    await page.goto("/admin/points?q=Entered by mistake e2e");
    await expect(page.locator("tbody").getByText("Reversal: Entered by mistake e2e").first()).toBeVisible();
    await expect(page.locator("tbody").getByText("reversed", { exact: true }).first()).toBeVisible();
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

  test("csv export works for faculty", async ({ page }) => {
    await signInAdmin(page);
    const res = await page.request.get("/api/admin/ledger");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    expect((await res.text()).split("\r\n")[0]).toContain('"Student ID"');
  });

  test("signing out returns to the public site and locks the admin area", async ({ page }) => {
    await signInAdmin(page);
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/localhost:3100\/?$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/);
  });
});
