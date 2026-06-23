import { expect, type Page } from "@playwright/test";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MixRecordFormFillResult = {
  customerName: string;
  productName: string;
  signedTypedName: string;
};

export type AppRecordFormFillResult = {
  customerName: string;
  applicatorName: string;
};

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });
}

export async function expectFormDraftResumeBanner(page: Page, label: string): Promise<void> {
  await expect(page.getByText(`You have an unfinished ${label} draft`)).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue draft" })).toBeVisible();
}

export async function expectNoFormDraftResumeBanner(page: Page, label: string): Promise<void> {
  await expect(page.getByText(`You have an unfinished ${label} draft`)).not.toBeVisible();
}

export function trackFormDraftWriteRequests(page: Page): { getCount: () => number; stop: () => void } {
  let count = 0;

  const handler = (request: { method: () => string; url: () => string }) => {
    const method = request.method();
    if ((method === "POST" || method === "PATCH") && request.url().includes("form_drafts")) {
      count += 1;
    }
  };

  page.on("request", handler);

  return {
    getCount: () => count,
    stop: () => page.off("request", handler),
  };
}

export async function discardMixDraftIfPresent(page: Page): Promise<void> {
  await page.goto("/records/new");
  await expect(page.getByRole("heading", { name: "New Mix Record" })).toBeVisible();
  const discard = page.getByRole("button", { name: "Discard draft" });
  if (await discard.isVisible()) {
    await discard.click();
    await expect(discard).not.toBeVisible();
  }
}

export async function discardAppDraftIfPresent(page: Page): Promise<void> {
  await page.goto("/app-records/new");
  await expect(page.getByRole("heading", { name: "New Application Record" })).toBeVisible();
  const discard = page.getByRole("button", { name: "Discard draft" });
  if (await discard.isVisible()) {
    await discard.click();
    await expect(discard).not.toBeVisible();
  }
}

/** Scoped assertion: customer on the app record detail Job Information card (not header or mix link). */
export async function expectAppRecordDetailCustomerName(
  page: Page,
  customerName: string,
): Promise<void> {
  const jobInfoCard = page.locator("div").filter({
    has: page.getByRole("heading", { name: "Job Information" }),
  });
  await expect(jobInfoCard.getByText(customerName, { exact: true })).toBeVisible();
}

async function selectMixCustomerWithFields(page: Page): Promise<void> {
  const customerSelect = page.locator("#customerId");
  const optionCount = await customerSelect.locator("option").count();

  for (let index = 1; index < optionCount; index += 1) {
    const value = await customerSelect.locator("option").nth(index).getAttribute("value");
    if (!value) {
      continue;
    }

    await customerSelect.selectOption(value);
    const fieldOptionCount = await page.locator("#fieldId").locator("option").count();
    if (fieldOptionCount > 1) {
      return;
    }
  }

  throw new Error("No customer with fields found in the E2E database.");
}

/**
 * Fills a mix record draft with a tracked customer and realistic values, leaving field unset.
 */
export async function fillPartialMixRecordDraft(page: Page): Promise<void> {
  await page.goto("/records/new");
  await expect(page.getByRole("heading", { name: "New Mix Record" })).toBeVisible();
  await expect(page.getByLabel("Date")).toBeVisible({ timeout: 15_000 });

  await selectMixCustomerWithFields(page);
  await page.locator("#tankSizeGal").fill("100");
  await page.locator("#targetGpa").fill("2");
  await page.locator("#waterGal").fill("95");
}

/**
 * Fills an app record draft with customer/job date, leaving applicator name unset.
 */
export async function fillPartialAppRecordDraft(page: Page): Promise<void> {
  await page.goto("/app-records/new");
  await expect(page.getByRole("heading", { name: "New Application Record" })).toBeVisible();
  await expect(page.getByLabel("Job date")).toBeVisible({ timeout: 15_000 });

  await page.locator("#customerName").fill("E2E Draft Customer");
  await page.locator("#jobDate").fill("2026-06-19");
}

export async function typeCharactersQuickly(
  page: Page,
  locator: ReturnType<Page["locator"]>,
  text: string,
): Promise<void> {
  await locator.click();
  for (const character of text) {
    await page.keyboard.type(character, { delay: 30 });
  }
}

async function selectFirstNonEmptyOption(
  page: Page,
  selectLocator: ReturnType<Page["locator"]>,
): Promise<{ value: string; label: string }> {
  const options = selectLocator.locator("option");
  const count = await options.count();

  for (let index = 0; index < count; index += 1) {
    const option = options.nth(index);
    const value = await option.getAttribute("value");
    const label = (await option.textContent())?.trim() ?? "";
    if (value && value.length > 0) {
      await selectLocator.selectOption(value);
      return { value, label };
    }
  }

  throw new Error("No selectable options found in dropdown.");
}

/**
 * Fills a valid mix record form. Omits signature fields when `skipSignature` is true
 * (validation bounce scenarios).
 */
export async function fillMixRecordForm(
  page: Page,
  options?: { skipSignature?: boolean; signedTypedName?: string },
): Promise<MixRecordFormFillResult> {
  await page.goto("/records/new");
  await expect(page.getByRole("heading", { name: "New Mix Record" })).toBeVisible();
  await expect(page.getByLabel("Date")).toBeVisible({ timeout: 15_000 });

  const customerSelect = page.locator("#customerId");
  const { label: customerName } = await selectFirstNonEmptyOption(page, customerSelect);

  await expect(page.locator("#fieldId")).toBeEnabled({ timeout: 10_000 });
  await selectFirstNonEmptyOption(page, page.locator("#fieldId"));

  await page.locator("#mixLat").fill("30.2672");
  await page.locator("#mixLng").fill("-97.7431");

  await page.locator("#tankSizeGal").fill("300");
  await page.locator("#targetGpa").fill("15");
  await page.locator("#waterGal").fill("285");

  const productsSection = page.locator("div.border-dashed").filter({ hasText: "Products" });
  const productSelect = productsSection.locator("select").first();
  const { label: productName } = await selectFirstNonEmptyOption(page, productSelect);
  await productsSection.locator("input").first().fill("2");

  await page.locator("#totalMixGal").fill("300");
  await page.locator("#expectedAcres").fill("20");
  await page.locator("#windSpeedMph").fill("5");
  await page.locator("#windDirection").selectOption("N");

  const signedTypedName = options?.signedTypedName ?? "E2E Applicator";

  if (!options?.skipSignature) {
    await page.locator("#signedTypedName").fill(signedTypedName);
    await page.getByLabel("I attest the above is accurate. (required)").check();
  }

  return { customerName, productName, signedTypedName };
}

export async function submitMixRecordForm(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Create Mix Record" }).click();
  await expect(page).toHaveURL(/\/records\/[0-9a-f-]{36}$/i, { timeout: 20_000 });
  const id = page.url().split("/records/")[1]?.split(/[?#]/)[0] ?? "";
  expect(id).toMatch(UUID_RE);
  return id;
}

export async function fillAppRecordForm(
  page: Page,
  options?: { customerName?: string; applicatorName?: string },
): Promise<AppRecordFormFillResult> {
  await page.goto("/app-records/new");
  await expect(page.getByRole("heading", { name: "New Application Record" })).toBeVisible();

  const customerName = options?.customerName ?? "E2E Customer";
  const applicatorName = options?.applicatorName ?? "E2E Applicator";

  await page.locator("#jobDate").fill(new Date().toISOString().slice(0, 10));
  await page.locator("#applicatorName").fill(applicatorName);
  await page.locator("#customerName").fill(customerName);

  await page.getByRole("checkbox", { name: "Broadleaf" }).check();

  const productSelect = page.locator("#pesticide-product-0");
  await selectFirstNonEmptyOption(page, productSelect);

  await page.getByLabel(/I certify this application was made/).check();
  await page.locator("#applicatorSig").fill(applicatorName);

  return { customerName, applicatorName };
}

export async function attachMixRecordViaPicker(page: Page, mixRecordId: string): Promise<void> {
  await page.getByRole("button", { name: "+ Attach Mix Record" }).click();
  await expect(page.getByRole("heading", { name: "Attach Mix Record" })).toBeVisible();

  const mixOption = page.getByTestId(`mix-picker-option-${mixRecordId}`);
  await expect(mixOption).toBeVisible({ timeout: 15_000 });
  await mixOption.click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId(`attached-mix-${mixRecordId}`)).toBeVisible();
}

export async function submitAppRecordForm(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Submit Application Record" }).click();
  await expect(page).toHaveURL(/\/app-records\/[0-9a-f-]{36}$/i, { timeout: 20_000 });
  const id = page.url().split("/app-records/")[1]?.split(/[?#]/)[0] ?? "";
  expect(id).toMatch(UUID_RE);
  return id;
}

export async function softDeleteMixRecordFromDetail(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("heading", { name: "Are you sure?" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page).toHaveURL("/records", { timeout: 15_000 });
}

export function injectMixRecordIdOnSubmit(page: Page, mixRecordId: string): Promise<void> {
  return page.evaluate((mixId) => {
    const OriginalFormData = window.FormData;
    const PatchedFormData = function (this: FormData, form?: HTMLFormElement, submitter?: HTMLElement | null) {
      const formData = new OriginalFormData(form, submitter);
      if (form?.elements.namedItem("mixRecordIds")) {
        formData.set("mixRecordIds", JSON.stringify([mixId]));
      }
      return formData;
    };
    PatchedFormData.prototype = OriginalFormData.prototype;
    window.FormData = PatchedFormData as unknown as typeof window.FormData;
  }, mixRecordId);
}

export async function waitForDraftAutosave(page: Page, ms = 900): Promise<void> {
  await page.waitForTimeout(ms);
}

export function injectEmptyMixProductLinesOnSubmit(page: Page): Promise<void> {
  return page.evaluate(() => {
    const OriginalFormData = window.FormData;
    const PatchedFormData = function (this: FormData, form?: HTMLFormElement, submitter?: HTMLElement | null) {
      const formData = new OriginalFormData(form, submitter);
      if (form?.elements.namedItem("productLinesJson")) {
        formData.set("productLinesJson", "[]");
      }
      return formData;
    };
    PatchedFormData.prototype = OriginalFormData.prototype;
    window.FormData = PatchedFormData as unknown as typeof window.FormData;
  });
}

export function injectEmptyAppPesticidesOnSubmit(page: Page): Promise<void> {
  return page.evaluate(() => {
    const OriginalFormData = window.FormData;
    const PatchedFormData = function (this: FormData, form?: HTMLFormElement, submitter?: HTMLElement | null) {
      const formData = new OriginalFormData(form, submitter);
      if (form?.elements.namedItem("pesticides")) {
        formData.set("pesticides", "[]");
      }
      return formData;
    };
    PatchedFormData.prototype = OriginalFormData.prototype;
    window.FormData = PatchedFormData as unknown as typeof window.FormData;
  });
}

export async function expectNativeFieldInvalid(
  page: Page,
  selector: string,
): Promise<void> {
  await expect(page.locator(selector)).toHaveJSProperty("validity.valid", false);
}

export async function submitMixRecordFormExpectingServerError(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Create Mix Record" }).click();
  await expect(page).toHaveURL("/records/new", { timeout: 15_000 });
}

export async function submitAppRecordFormExpectingServerError(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Submit Application Record" }).click();
  await expect(page).toHaveURL("/app-records/new", { timeout: 15_000 });
}
