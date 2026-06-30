import { expect, test } from "@playwright/test";

import {
  E2E_SUPABASE_UNREACHABLE_SKIP_REASON,
  isE2eSupabaseReachable,
} from "../lib/e2e-supabase-reachability";
import { clearServerFormDraft } from "../lib/form-draft-cleanup";
import { E2E_ALLOWED_SUPABASE_PROJECT_REF } from "../lib/supabase-project-guard";
import {
  attachMixRecordViaPicker,
  discardAppDraftIfPresent,
  discardMixDraftIfPresent,
  expectAppRecordDetailCustomerName,
  expectFormDraftResumeBanner,
  expectNativeFieldInvalid,
  expectNoFormDraftResumeBanner,
  fillAppRecordForm,
  fillMixRecordForm,
  fillPartialAppRecordDraft,
  fillPartialMixRecordDraft,
  injectEmptyAppPesticidesOnSubmit,
  injectEmptyMixProductLinesOnSubmit,
  injectMixRecordIdOnSubmit,
  login,
  softDeleteMixRecordFromDetail,
  submitAppRecordForm,
  submitAppRecordFormExpectingServerError,
  submitMixRecordForm,
  submitMixRecordFormExpectingServerError,
  trackFormDraftWriteRequests,
  typeCharactersQuickly,
  waitForDraftAutosave,
} from "../lib/record-form-helpers";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const e2eProjectReady = Boolean(E2E_ALLOWED_SUPABASE_PROJECT_REF.trim());

test.describe("authenticated record write flows", () => {
  test.skip(
    !email || !password || !e2eProjectReady,
    "Set E2E_EMAIL, E2E_PASSWORD, and E2E_ALLOWED_SUPABASE_PROJECT_REF (dedicated non-prod project) to run record write E2E tests.",
  );

  test.beforeEach(async () => {
    test.skip(!(await isE2eSupabaseReachable()), E2E_SUPABASE_UNREACHABLE_SKIP_REASON);
  });

  test.beforeEach(async ({ page }) => {
    await login(page, email!, password!);
  });

  test.describe("mix record form drafts", () => {
    test.beforeEach(async ({ page }) => {
      await clearServerFormDraft(page, "mix-record");
      await discardMixDraftIfPresent(page);
    });

    test("failed submit preserves draft", async ({ page }) => {
      await fillPartialMixRecordDraft(page);
      await waitForDraftAutosave(page);
      await page.getByRole("button", { name: "Create Mix Record" }).click();

      await expect(page).toHaveURL("/records/new");
      await expectNativeFieldInvalid(page, "#fieldId");

      await page.reload();
      await expect(page.getByLabel("Date")).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("#customerId")).not.toHaveValue("");

      await page.goto("/records");
      await expectFormDraftResumeBanner(page, "mix record");
      await page.reload();
      await expectFormDraftResumeBanner(page, "mix record");
    });

    test("successful submit clears draft", async ({ page }) => {
      await fillMixRecordForm(page);
      await submitMixRecordForm(page);

      await page.goto("/records/new");
      await expect(page.getByText("Your previous progress was restored.")).not.toBeVisible();
      await page.goto("/records");
      await expectNoFormDraftResumeBanner(page, "mix record");
    });

    test("server-side validation error preserves draft and fires saveNow", async ({ page }) => {
      await fillMixRecordForm(page);
      await injectEmptyMixProductLinesOnSubmit(page);
      await submitMixRecordFormExpectingServerError(page);

      await expect(page.getByText("Please correct the highlighted fields.", { exact: true })).toBeVisible();

      await page.reload();
      await expect(page.getByLabel("Date")).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("#customerId")).not.toHaveValue("");

      await page.goto("/records");
      await expectFormDraftResumeBanner(page, "mix record");
    });

    test("no per-keystroke draft writes after failed submit", async ({ page }) => {
      await fillMixRecordForm(page);
      await injectEmptyMixProductLinesOnSubmit(page);
      await submitMixRecordFormExpectingServerError(page);
      await expect(page.getByText("Please correct the highlighted fields.", { exact: true })).toBeVisible();
      await page.waitForTimeout(900);

      const tracker = trackFormDraftWriteRequests(page);
      await typeCharactersQuickly(page, page.getByLabel("Notes"), "0123456789");
      await page.waitForTimeout(1_000);
      tracker.stop();

      expect(tracker.getCount()).toBeLessThanOrEqual(2);
    });
  });

  test.describe("app record form drafts", () => {
    test.beforeEach(async ({ page }) => {
      await clearServerFormDraft(page, "app-record");
      await discardAppDraftIfPresent(page);
    });

    test("failed submit preserves draft", async ({ page }) => {
      await fillPartialAppRecordDraft(page);
      await waitForDraftAutosave(page);
      await page.getByRole("button", { name: "Submit Application Record" }).click();

      await expect(page).toHaveURL("/app-records/new");
      await expectNativeFieldInvalid(page, "#applicatorName");

      await page.reload();
      await expect(page.getByLabel("Job date")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByLabel("Customer name")).toHaveValue("E2E Draft Customer");

      await page.goto("/app-records");
      await expectFormDraftResumeBanner(page, "application record");
      await page.reload();
      await expectFormDraftResumeBanner(page, "application record");
    });

    test("successful submit clears draft", async ({ page }) => {
      await fillAppRecordForm(page);
      await submitAppRecordForm(page);

      await page.goto("/app-records/new");
      await expect(page.getByText("Your previous progress was restored.")).not.toBeVisible();
      await page.goto("/app-records");
      await expectNoFormDraftResumeBanner(page, "application record");
    });

    test("no per-keystroke draft writes after failed submit", async ({ page }) => {
      await fillAppRecordForm(page);
      await injectEmptyAppPesticidesOnSubmit(page);
      await submitAppRecordFormExpectingServerError(page);
      await expect(page.getByText("Please correct the highlighted fields.", { exact: true })).toBeVisible();
      await page.waitForTimeout(900);

      const tracker = trackFormDraftWriteRequests(page);
      await typeCharactersQuickly(page, page.getByLabel("Additional notes"), "0123456789");
      await page.waitForTimeout(1_000);
      tracker.stop();

      expect(tracker.getCount()).toBeLessThanOrEqual(2);
    });
  });

  test("mix record happy path creates detail page with customer and product", async ({ page }) => {
    await discardMixDraftIfPresent(page);
    const { customerName, productName } = await fillMixRecordForm(page);
    await submitMixRecordForm(page);

    await expect(page.getByText(customerName, { exact: false })).toBeVisible();
    await expect(page.getByText(productName, { exact: false })).toBeVisible();
  });

  test("app record happy path with attached mix", async ({ page }) => {
    await discardAppDraftIfPresent(page);
    const mix = await fillMixRecordForm(page);
    const mixRecordId = await submitMixRecordForm(page);
    await expect(page.getByText(mix.customerName, { exact: false })).toBeVisible();

    await fillAppRecordForm(page, {
      customerName: mix.customerName,
      applicatorName: mix.signedTypedName,
    });
    await attachMixRecordViaPicker(page, mixRecordId);
    const appRecordId = await submitAppRecordForm(page);

    await expect(page).toHaveURL(`/app-records/${appRecordId}`);
    await expectAppRecordDetailCustomerName(page, mix.customerName);
    await expect(page.locator(`a[href="/records/${mixRecordId}"]`)).toBeVisible();
  });

  test("mix exclusivity surfaces friendly error on second app record", async ({ page }) => {
    await discardAppDraftIfPresent(page);
    const mix = await fillMixRecordForm(page);
    const mixRecordId = await submitMixRecordForm(page);

    await fillAppRecordForm(page, {
      customerName: mix.customerName,
      applicatorName: mix.signedTypedName,
    });
    await attachMixRecordViaPicker(page, mixRecordId);
    await submitAppRecordForm(page);

    await fillAppRecordForm(page, {
      customerName: mix.customerName,
      applicatorName: mix.signedTypedName,
    });
    await injectMixRecordIdOnSubmit(page, mixRecordId);
    await page.getByRole("button", { name: "Submit Application Record" }).click();

    await expect(
      page.getByText("already attached to another application record", { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL("/app-records/new");
  });

  test("soft-delete removes mix record from list", async ({ page }) => {
    await fillMixRecordForm(page);
    const mixRecordId = await submitMixRecordForm(page);

    await softDeleteMixRecordFromDetail(page);

    await expect(page.locator(`a[href="/records/${mixRecordId}"]`)).toHaveCount(0);
  });
});
