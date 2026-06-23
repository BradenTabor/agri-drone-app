-- =============================================================================
-- E2E fixture seed (idempotent)
-- =============================================================================
--
-- Purpose: minimum reference rows for authenticated Playwright form specs.
-- Does NOT insert mix_records, app_records, or other spec-owned write data.
--
-- Fixture map (stable UUIDs):
--   e2e00001-…0001  customers   "E2E Customer"
--   e2e00002-…0002  fields      "E2E Field North" (belongs to E2E Customer)
--   e2e00003-…0003  equipment   "E2E Drone A" (active)
--   e2e00004-…0004  products    "E2E Herbicide" (active)
--   e2e00005-…0005  surfactants "E2E Surfactant" (active)
--
-- Spec dependencies:
--   e2e/smoke/records.authenticated.spec.ts
--     - fillMixRecordForm / fillPartialMixRecordDraft / selectMixCustomerWithFields:
--       customer + field (customer must have ≥1 field in #fieldId dropdown)
--     - fillMixRecordForm / fillAppRecordForm pesticide table:
--       active product in dropdown
--     - surfactant row: optional for current specs; seeded for form completeness
--   e2e/smoke/authenticated.spec.ts
--     - navigation-only today; fixtures improve local/E2E parity if lists gain
--       data-bound assertions later
--
-- Apply AFTER schema replay is green (do not run against prod):
--
--   # Dedicated E2E project (wxftkrdwvzpggjrdntdf) — after login → link → db push:
--   cd agri-drone-app
--   psql "postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
--     -f supabase/seed.sql
--
--   # Or: Supabase Dashboard → SQL Editor → paste and run this file
--
--   # Local dev (runs automatically after migrations):
--   supabase db reset
--
-- Safe to re-run: ON CONFLICT upserts restore active rows and clear soft deletes.
-- =============================================================================

insert into public.customers (
  id,
  name,
  contact_name,
  city,
  state,
  notes
)
values (
  'e2e00001-0001-4001-8001-000000000001',
  'E2E Customer',
  'E2E Contact',
  'Austin',
  'TX',
  'Disposable fixture for Playwright authenticated form specs.'
)
on conflict (id) do update set
  name = excluded.name,
  contact_name = excluded.contact_name,
  city = excluded.city,
  state = excluded.state,
  notes = excluded.notes,
  deleted_at = null,
  updated_at = now();

insert into public.fields (
  id,
  customer_id,
  name,
  default_lat,
  default_lng,
  acres,
  notes
)
values (
  'e2e00002-0002-4002-8002-000000000002',
  'e2e00001-0001-4001-8001-000000000001',
  'E2E Field North',
  30.2672,
  -97.7431,
  20,
  'Disposable fixture field for mix/app record E2E specs.'
)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  name = excluded.name,
  default_lat = excluded.default_lat,
  default_lng = excluded.default_lng,
  acres = excluded.acres,
  notes = excluded.notes,
  deleted_at = null,
  updated_at = now();

insert into public.equipment (
  id,
  identifier,
  type,
  notes,
  active
)
values (
  'e2e00003-0003-4003-8003-000000000003',
  'E2E Drone A',
  'drone',
  'Disposable fixture equipment for mix record forms.',
  true
)
on conflict (id) do update set
  identifier = excluded.identifier,
  type = excluded.type,
  notes = excluded.notes,
  active = excluded.active,
  deleted_at = null,
  updated_at = now();

insert into public.products (
  id,
  name,
  epa_number,
  manufacturer,
  restricted_use,
  ingredients,
  notes,
  active
)
values (
  'e2e00004-0004-4004-8004-000000000004',
  'E2E Herbicide',
  'E2E-EPA-0001',
  'E2E Manufacturer',
  false,
  array['E2E active ingredient']::text[],
  'Disposable fixture product for mix/app record pesticide dropdowns.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  epa_number = excluded.epa_number,
  manufacturer = excluded.manufacturer,
  restricted_use = excluded.restricted_use,
  ingredients = excluded.ingredients,
  notes = excluded.notes,
  active = excluded.active,
  deleted_at = null,
  updated_at = now();

insert into public.surfactants (
  id,
  name,
  manufacturer,
  epa_number,
  default_unit,
  notes,
  active
)
values (
  'e2e00005-0005-4005-8005-000000000005',
  'E2E Surfactant',
  'E2E Manufacturer',
  'E2E-EPA-SF-0001',
  'oz',
  'Disposable fixture surfactant for mix/app record forms.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  manufacturer = excluded.manufacturer,
  epa_number = excluded.epa_number,
  default_unit = excluded.default_unit,
  notes = excluded.notes,
  active = excluded.active,
  deleted_at = null,
  updated_at = now();
