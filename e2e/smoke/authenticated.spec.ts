import { expect, test } from "@playwright/test";

import { E2E_ALLOWED_SUPABASE_PROJECT_REF } from "../lib/supabase-project-guard";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

const skipAuthenticated =
  !email ||
  !password ||
  !E2E_ALLOWED_SUPABASE_PROJECT_REF.trim();

test.describe("authenticated smoke", () => {
  test.skip(
    skipAuthenticated,
    "Set E2E_EMAIL, E2E_PASSWORD, and E2E_ALLOWED_SUPABASE_PROJECT_REF to run authenticated tests.",
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("/", { timeout: 20_000 });
  });

  test("dashboard loads with navigation", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Operations Command" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New Mix Record" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Mix Records", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Account menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
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
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
