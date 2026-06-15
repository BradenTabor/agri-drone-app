import { expect, test } from "@playwright/test";

const protectedRoutes = [
  "/",
  "/records",
  "/records/new",
  "/app-records",
  "/customers",
  "/products",
  "/quotes",
  "/equipment",
  "/map",
  "/pricing",
] as const;

test.describe("auth guards", () => {
  for (const route of protectedRoutes) {
    test(`redirects unauthenticated ${route} to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("pdf api returns 401 when unauthenticated", async ({ request }) => {
    const response = await request.get(
      "/api/pdf/c2d42c9f-fd01-4a42-96e7-93cef32acb16",
    );
    expect(response.status()).toBe(401);
  });

  test("app record pdf api returns 401 when unauthenticated", async ({ request }) => {
    const response = await request.get("/api/app-record-pdf/test-id");
    expect(response.status()).toBe(401);
  });

  test("quote pdf api returns 401 when unauthenticated", async ({ request }) => {
    const response = await request.get("/api/quote-pdf/test-id");
    expect(response.status()).toBe(401);
  });
});
