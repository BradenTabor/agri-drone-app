# Mix Record QA Checklist (V1 Candidate)

Run this checklist top-to-bottom without fixing issues during execution.  
Record failures with exact failed step, observed behavior, expected behavior, console errors, and screenshots.

## 1) Auth & Access

| # | Scenario | Steps | Expected result | Pass/Fail/Notes |
|---|---|---|---|---|
| 1 | Login smoke and redirect | 1. Open `/login` while logged out.<br>2. Sign in with a valid applicator account.<br>3. Observe post-login destination. | User signed in successfully and was redirected to the protected app (records dashboard/list), not left on `/login`. |  |
| 2 | Protected-route redirect while logged out | 1. Log out.<br>2. Open `/records` directly.<br>3. Open `/records/new` directly. | Logged-out access to protected pages was denied and redirected to `/login`. |  |
| 3 | RLS smoke (applicator create baseline record) | 1. Log in as applicator.<br>2. Open `/records/new`.<br>3. Create a minimal valid mix record and save.<br>4. Copy the new record URL/ID for later checks. | Applicator created a record successfully and landed on `/records/[id]`. |  |
| 4 | RLS smoke (admin visibility of applicator record) | 1. Log out.<br>2. Log in as admin.<br>3. Open `/records`.<br>4. Locate the applicator-created record from Scenario 3. | Admin saw the applicator-created record in `/records` and could open the detail page. |  |
| 5 | RLS smoke (admin edit + delete of applicator record) | 1. As admin, open the applicator-created record.<br>2. Edit one field (for example `wind_speed_mph`) and save.<br>3. Delete the same record. | Admin edited and deleted the applicator-created record successfully. |  |
| 6 | RLS smoke (applicator cannot delete admin-submitted record) | 1. As admin, create a fresh valid record.<br>2. Log out and log in as applicator.<br>3. Open admin-created record detail page.<br>4. Attempt delete from detail page. | Applicator delete attempt on admin-submitted record was rejected by ownership/RLS rule (record remained undeleted). |  |

## 2) Create Flow

| # | Scenario | Steps | Expected result | Pass/Fail/Notes |
|---|---|---|---|---|
| 7 | Create with one product line and no photos | 1. Open `/records/new`.<br>2. Fill all required fields with valid values.<br>3. Keep exactly one product line.<br>4. Do not upload photos.<br>5. Submit. | Form submitted successfully and redirected to `/records/[id]` with saved values visible on detail page. |  |
| 8 | Create with multiple product lines and two photos | 1. Open `/records/new`.<br>2. Fill all required fields.<br>3. Click `+ Add product` and enter at least two product lines.<br>4. Upload exactly two valid image files.<br>5. Submit and open detail photos section. | Record saved successfully and both product lines and both photos were present on detail page. |  |
| 9 | Rate guardrail violation still allows save (above max) | 1. Open `/records/new`.<br>2. Select a product with a known max rate (example max 32 oz).<br>3. Enter `ratePerAcre = 40` and unit `oz`.<br>4. Verify warning appears.<br>5. Submit form. | Guardrail warning was shown before submit, and submission still succeeded with redirect to detail page. |  |
| 10 | Zod: no product lines | 1. Open `/records/new`.<br>2. Remove extra lines until none remain (or force empty payload path if UI allows).<br>3. Fill other required fields validly.<br>4. Submit. | Submission was blocked and error message indicated at least one product line was required. |  |
| 11 | Zod: attestation unchecked | 1. Open `/records/new`.<br>2. Fill all required fields, including product line.<br>3. Leave attestation checkbox unchecked.<br>4. Submit. | Submission was blocked and attestation-required error message was shown. |  |
| 12 | Zod: missing wind speed | 1. Open `/records/new`.<br>2. Fill all required fields except `windSpeedMph`.<br>3. Submit. | Submission was blocked and wind-speed validation error message was shown. |  |
| 13 | Zod: customer selected with missing field | 1. Open `/records/new`.<br>2. Select a customer.<br>3. Leave field empty.<br>4. Fill other required fields and submit. | Submission was blocked and field-required validation error message was shown. |  |
| 14 | Cross-field: customer change invalidates prior field | 1. Open `/records/new`.<br>2. Select Customer A.<br>3. Select a field that belongs to Customer A.<br>4. Change customer to Customer B.<br>5. Check field dropdown state.<br>6. Attempt submit without reselecting a valid field. | Prior field selection was cleared or became invalid/invisible, and form did not submit an orphaned customer/field pair. |  |
| 15 | Guardrail: below min warning (example min 28 oz, enter 5 oz) | 1. Open `/records/new`.<br>2. Select product with min label rate (example 28 oz).<br>3. Enter `ratePerAcre = 5`, unit `oz`.<br>4. Observe warning. | Below-min warning was shown for the selected product/rate pair. |  |
| 16 | Guardrail: above max warning (enter 100 oz) | 1. Keep same product from prior scenario.<br>2. Enter `ratePerAcre = 100`, unit `oz`.<br>3. Observe warning. | Above-max warning was shown for the selected product/rate pair. |  |
| 17 | Guardrail: in-range rate shows no warning (enter 30 oz) | 1. Keep same product from prior scenario.<br>2. Enter `ratePerAcre = 30`, unit `oz`.<br>3. Observe warning area. | No guardrail warning was shown for in-range rate. |  |
| 18 | Guardrail: product with no label rate shows no warning | 1. Select a product where min/max label rates are null.<br>2. Enter any rate and unit.<br>3. Observe warning area. | No guardrail warning was shown because label constraints were absent. |  |
| 19 | Photo validation: oversized file (20MB) | 1. Open `/records/new`.<br>2. Fill minimal valid fields.<br>3. Upload one image file larger than 15MB (example 20MB).<br>4. Submit. | Submission was blocked and oversized-photo error message was shown. |  |
| 20 | Photo validation: 9 photos | 1. Open `/records/new`.<br>2. Fill minimal valid fields.<br>3. Upload 9 valid image files.<br>4. Submit. | Submission was blocked and max-photo-count error message was shown. |  |
| 21 | Photo validation: non-image file | 1. Open `/records/new`.<br>2. Fill minimal valid fields.<br>3. Upload a non-image file (example PDF).<br>4. Submit. | Submission was blocked and non-image upload error message was shown. |  |
| 22 | iPhone: GPS capture spinner behavior before geolocation prompt | 1. On iPhone Safari, open `/records/new`.<br>2. Trigger GPS capture (`Re-capture GPS` or auto-capture path).<br>3. Observe loading state timing versus iOS permission prompt. | Capturing/loading indicator rendered and remained understandable during geolocation permission flow. |  |
| 23 | iPhone: long product list and page scrolling | 1. On iPhone Safari, open `/records/new`.<br>2. Add many product lines to make a long section.<br>3. Scroll within form from top to signature and back. | Page scrolled smoothly with no trapped scroll area and no blocked access to lower sections. |  |
| 24 | iPhone: date/time/sig input behavior | 1. On iPhone Safari, open `/records/new`.<br>2. Tap date input.<br>3. Tap time input.<br>4. Tap typed signature input.<br>5. Check keyboard/autocomplete behavior. | iOS date/time pickers opened correctly, and typed signature field focused cleanly with usable keyboard/autocomplete. |  |

## 3) Read Flow

| # | Scenario | Steps | Expected result | Pass/Fail/Notes |
|---|---|---|---|---|
| 25 | List filters: date range | 1. Open `/records` with multiple test records present.<br>2. Set `dateFrom` and `dateTo` to narrow range.<br>3. Click `Filter`.<br>4. Inspect returned rows. | Date-range filter returned only records inside the selected range. |  |
| 26 | List filters: customer | 1. On `/records`, pick one customer in filter dropdown.<br>2. Click `Filter`.<br>3. Inspect results. | Customer filter returned only records tied to selected customer. |  |
| 27 | List filters: product | 1. On `/records`, pick one product in filter dropdown.<br>2. Click `Filter`.<br>3. Open at least one result detail page to confirm product line presence. | Product filter returned only non-deleted records that contained selected product in line items. |  |
| 28 | List filters: search text | 1. On `/records`, enter text known to exist in notes/customer/field.<br>2. Click `Filter`.<br>3. Verify result relevance.<br>4. Clear search and re-filter. | Text search returned matching records and clearing search restored broader results. |  |
| 29 | Saved filter chips restore URL params | 1. Set a non-trivial filter combination (`q`, date, customer, product).<br>2. Enter name in `Save current filter as...` and save.<br>3. Click created filter chip.<br>4. Inspect URL params and form control values. | Saved filter chip restored URL query params and corresponding filter control states. |  |
| 30 | Detail page integrity after create/edit | 1. Open a recently created record detail page.<br>2. Verify header snapshots, products, conditions, signature, and photos sections.<br>3. Compare against known entered values. | Detail page displayed persisted values consistently across sections. |  |

## 4) Update Flow

| # | Scenario | Steps | Expected result | Pass/Fail/Notes |
|---|---|---|---|---|
| 31 | Edit wind speed and verify list reflects change | 1. Open existing record edit page `/records/[id]/edit`.<br>2. Change wind speed.<br>3. Save.<br>4. Return to `/records` and locate record. | Edit saved successfully and list/detail reflected updated wind speed value. |  |
| 32 | Edit: add one new photo | 1. Open existing record edit page.<br>2. Upload one new valid photo.<br>3. Save.<br>4. Open detail page photos section. | New photo appeared on detail page after save. |  |
| 33 | Edit: remove one existing photo | 1. Open existing record edit page with existing photos.<br>2. Select one photo’s remove checkbox.<br>3. Save.<br>4. Open detail page photos section. | Selected photo was removed and no longer appeared on detail page. |  |
| 34 | Edit: remove existing photo and upload new photo in same save | 1. Open existing record edit page with at least one existing photo.<br>2. Select one existing photo for removal.<br>3. Upload one new valid photo.<br>4. Save.<br>5. Open detail page photos section. | Save completed with both operations applied in one submission: selected old photo absent and new photo present. |  |
| 35 | Concurrent state: two-tab last-write-wins behavior | 1. Open same record edit page in Tab 1 and Tab 2.<br>2. In Tab 1, change value A and save.<br>3. In Tab 2 (stale), change value B and save.<br>4. Reopen detail page fresh. | Second save completed without fatal error, and reopened detail reflected last-write-wins state. |  |
| 36 | Existing photo remove control wording clarity | 1. Open edit page with existing photos.<br>2. Observe remove label text before checking any box.<br>3. Check one box and re-read label semantics. | Removal control copy used selection-language and did not imply unchecked photos were already removed. |  |

## 5) Delete Flow

| # | Scenario | Steps | Expected result | Pass/Fail/Notes |
|---|---|---|---|---|
| 37 | Soft-delete behavior and direct URL 404 | 1. Open a test record detail page.<br>2. Delete record using detail action.<br>3. Confirm redirect to `/records`.<br>4. Verify record absent from list.<br>5. Re-open deleted record URL directly. | Record was soft-deleted, removed from list, and direct detail URL returned not-found behavior (404 page). |  |

## Execution Notes

- Browser console capture (desktop):
- iOS Safari remote-debug capture:
- Screenshot paths:
- Overall pass rate:
- Overall verdict:
