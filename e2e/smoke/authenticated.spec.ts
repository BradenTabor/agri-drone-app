import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("authenticated smoke", () => {
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated tests.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");
  });

  test("dashboard loads with navigation", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Field-ready dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mix Records" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("mix records list loads", async ({ page }) => {
    await page.goto("/records");
    await expect(page.getByRole("heading", { name: "Mix Records" })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ New Mix Record" })).toBeVisible();
  });

  test("new mix record form loads", async ({ page }) => {
    await page.goto("/records/new");
    await expect(page.getByRole("heading", { name: "New Mix Record" })).toBeVisible();
    await expect(page.getByLabel("Date")).toBeVisible({ timeout: 15_000 });
  });

  test("customers list loads", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ New Customer" })).toBeVisible();
  });

  test("map view loads", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByRole("heading", { name: "Map View" })).toBeVisible();
  });

  test("sign out returns to login", async ({ page }) => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
