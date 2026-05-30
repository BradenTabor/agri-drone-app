# Agri Drone Operations Platform — V1 Build Plan

> **Audience**: This document is the source-of-truth spec for Cursor. Every decision below has been pre-made — Cursor should treat them as fixed unless explicitly told otherwise.

---

## 1. Mission

Replace the drone company's current paper / Word-doc Tank-Mix & Calibration Record process with a mobile-first web app (PWA) that:

1. **Speeds up field data capture** — applicator can log a mix faster than they could on paper, with auto-captured GPS, time, applicator, and EPA numbers.
2. **Produces audit-ready records** — every mix record is searchable, exportable as a branded PDF, and tied to a customer + job.
3. **Centralizes everything** — one searchable place for all mixes, customers, products, and equipment.

The app is being built greenfield. V1 is the mixing record + records management + customers + products. Architecture is designed to extend to additional form types in phase 2+.

---

## 2. Decisions Matrix (locked answers)

| Area | Decision |
|---|---|
| **Primary user** | Applicator in the field (iPhone) |
| **Secondary user** | Admin (desktop, same login) |
| **Customers** | Not logged in. Receive PDF downloads only. |
| **User count Y1** | 1–5 |
| **Roles** | `applicator`, `admin` |
| **Org model** | Single-tenant |
| **Auth** | Email + password |
| **Devices** | iPhone primary. Truly responsive for desktop admin. |
| **Offline mode** | Not needed |
| **Delivery** | PWA (installable to home screen) |
| **Frontend** | Next.js App Router |
| **Backend / DB** | Supabase (Postgres + Auth + Storage) |
| **Hosting** | Vercel |
| **Map provider** | Mapbox |
| **Design vibe** | Industrial ag-tech (greens, earthy neutrals, solid weight). Themed via CSS variables — easy to re-brand later. |
| **GPS capture** | Auto-capture on form open, manual override allowed. Store decimal degrees; offer DMS display toggle. |
| **Date/time** | Auto on open, editable. |
| **Applicator field** | Auto from logged-in user, editable. |
| **Truck/Sprayer ID** | Dropdown from saved equipment list + "add new" inline. |
| **Job/Site ID** | Dropdown from saved customer→field hierarchy. |
| **Product library** | User-built (no pre-seed). EPA # bound to product, auto-populated when product selected. |
| **Rate suggestion** | Suggest with label-range min/max as guardrails. Warn if outside range. |
| **Surfactant** | Free text per record. |
| **Total Mix calc** | Live calculated value shown alongside manual entry as sanity check. |
| **Expected Acres calc** | Live calculated suggestion (`tank_size ÷ target_gpa`) shown alongside manual entry. |
| **Actual Acres** | Manual field in V1 (stopgap for phase-2 flight log integration). |
| **Product amounts** | Manual entry. |
| **Units** | Toggle US ↔ metric (default US). |
| **Signature** | Typed name + attestation checkbox. |
| **License/Cert #** | Stored on user profile, editable per-form. |
| **Wind speed/direction** | **Required and prominent.** |
| **Other weather** | Manual entry (temp, humidity). |
| **Photos** | Optional, multiple per record. Not emphasized. |
| **Label/SDS attachments** | Phase 2. Schema includes `documents[]` field on `products` from day one. |
| **Photo annotation** | Not needed. |
| **Landing view** | Hybrid: `+ New Record` CTA + recent records list. Admins also see a compact stats strip. |
| **Search** | Date + applicator + customer + product + full-text + saved filters. |
| **Edit old records** | Anyone, anytime. Last-modified timestamp stored. *(See risks §10.)* |
| **Deletion** | Anyone can delete their own. Implemented as soft-delete under the hood. |
| **PDF** | Auto-styled, brand-matched. |
| **Sharing** | Manual — applicator downloads PDF, shares however. |
| **Bulk export** | Not in V1. |
| **Map view** | Pin map of past records in V1. |
| **Field boundaries** | Phase 2. Schema includes nullable `boundary` field on `fields` from day one. |
| **Geofence alerts** | Not needed. |
| **Flight log integration** | Phase 2 (DJI etc.). |
| **Customer DB** | Full CRM-lite (name, contact, address, fields, jobs, notes). |
| **Recurring jobs** | Phase 2. |
| **Compliance templates** | Not in V1. Generic PDF is enough. |
| **State-specific fields** | Start generic. |

---

## 3. Tech Stack

```
Frontend:  Next.js 15 (App Router) + TypeScript + Tailwind CSS
UI:        shadcn/ui (components), lucide-react (icons), sonner (toasts)
Forms:     react-hook-form + zod
State:     React Server Components + TanStack Query for client-side mutations
Backend:   Supabase
  - Postgres
  - Supabase Auth (email/password)
  - Supabase Storage (photos, future label PDFs)
  - Row Level Security policies
Map:       Mapbox GL JS + react-map-gl
PDF:       @react-pdf/renderer (server-side render via API route)
PWA:       next-pwa or manual service worker + manifest
Hosting:   Vercel
Env vars:  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
           SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_MAPBOX_TOKEN
```

---

## 4. Architecture Overview

**Pattern**: Next.js App Router with Server Components for reads, Server Actions for mutations, and a thin client layer for interactive form widgets (GPS capture, signature, map).

**Data flow**:
- Page renders on the server, fetches data via Supabase server client (uses cookies for session).
- Mutations go through Server Actions, which validate via Zod, then write to Supabase.
- Real-time updates not needed in V1 (small user base, no concurrent editing concerns).

**Auth**:
- `@supabase/ssr` package for SSR-friendly session handling.
- Middleware refreshes session on every request.
- Row Level Security policies enforce role-based access at the DB level (not just in the app).

**PWA**:
- `public/manifest.json` with brand colors + icon set.
- Service worker registered for "Add to Home Screen" install prompt + basic caching of the app shell.
- No offline sync (per Q12).

**Theming**:
- All colors defined as CSS variables in `globals.css` under `:root`.
- Tailwind config references these via `hsl(var(--primary))` etc.
- Default palette = industrial ag-tech (see §8).
- Brand swap = edit one file (`globals.css`) + drop in a logo SVG.

---

## 5. Data Model (Postgres / Supabase)

> All tables include `id uuid pk`, `created_at timestamptz default now()`, `updated_at timestamptz`, and `deleted_at timestamptz` (soft delete). RLS is enabled on every table.

### `profiles`
Extends `auth.users`. Created via trigger on signup.
```
id              uuid (FK auth.users.id)
email           text
full_name       text
role            text  -- 'applicator' | 'admin'
license_cert_no text
default_units   text  -- 'us' | 'metric'
phone           text
```

### `customers`
```
id              uuid pk
name            text not null
contact_name    text
email           text
phone           text
address         text
city            text
state           text
zip             text
notes           text
created_by      uuid (FK profiles.id)
```

### `fields`
Multiple fields can belong to one customer.
```
id              uuid pk
customer_id     uuid (FK customers.id) not null
name            text not null
default_lat     numeric        -- center point for map pin
default_lng     numeric
acres           numeric        -- known/quoted acreage
boundary        jsonb          -- GeoJSON polygon, NULL in V1 (phase 2 fills this)
notes           text
```

### `equipment` (trucks / sprayers)
```
id              uuid pk
identifier      text not null  -- e.g. "Truck #1"
type            text           -- 'truck' | 'sprayer' | 'drone'
notes           text
active          boolean default true
```

### `products`
User-built library of chemicals.
```
id                uuid pk
name              text not null
epa_number        text
manufacturer      text
label_min_rate    numeric        -- per acre, label minimum
label_max_rate    numeric        -- per acre, label maximum
rate_unit         text           -- 'oz' | 'fl_oz' | 'gal' | 'lb'
documents         jsonb          -- [{url, filename, type}] — phase 2 fills this
notes             text
active            boolean default true
```

### `mix_records` (the core form)
```
id                       uuid pk
record_date              date not null         -- the "Date" field
time_mixed               time not null         -- "Time Mixed"
applicator_id            uuid (FK profiles.id)
applicator_name_override text                  -- if applicator field was edited
license_cert_no          text                  -- snapshot at submit time
equipment_id             uuid (FK equipment.id)
customer_id              uuid (FK customers.id) not null
field_id                 uuid (FK fields.id) not null

mix_lat                  numeric not null      -- decimal degrees
mix_lng                  numeric not null

tank_size_gal            numeric not null
target_gpa               numeric not null
water_gal                numeric not null

surfactant_name          text                  -- free text
surfactant_amount        numeric
surfactant_unit          text                  -- 'oz' | 'gal' | '%'

total_mix_gal            numeric not null      -- manual; calculated value shown for QA
expected_acres           numeric not null
actual_acres             numeric               -- V1 manual; phase 2 auto from flight log

wind_speed_mph           numeric not null      -- REQUIRED
wind_direction           text not null         -- REQUIRED ('N','NE','E',...)
temp_f                   numeric
humidity_pct             numeric

signed_typed_name        text not null
signature_attested       boolean not null default false

notes                    text

submitted_by             uuid (FK profiles.id)
submitted_at             timestamptz default now()
last_modified_by         uuid (FK profiles.id)
last_modified_at         timestamptz
```

### `mix_record_products`
Join table — a mix record can include multiple products.
```
id              uuid pk
mix_record_id   uuid (FK mix_records.id) on delete cascade
product_id      uuid (FK products.id)
amount_added    numeric not null
amount_unit     text not null              -- 'gal' | 'oz' | 'fl_oz' | 'lb'
rate_per_acre   numeric                    -- e.g. 32 oz/acre
rate_unit       text                       -- 'oz' | 'fl_oz' | 'gal' | 'lb'
sort_order      int default 0
```

### `mix_record_photos`
```
id              uuid pk
mix_record_id   uuid (FK mix_records.id) on delete cascade
storage_path    text not null              -- Supabase Storage path
caption         text
uploaded_at     timestamptz default now()
```

### `saved_filters` (for the records search page)
```
id              uuid pk
user_id         uuid (FK profiles.id)
name            text not null
filters         jsonb                       -- serialized filter state
```

### Indexes
- `mix_records (record_date desc)` for the default sort.
- `mix_records (customer_id, record_date desc)`.
- `mix_records (applicator_id, record_date desc)`.
- GIN full-text index on `mix_records.notes` and on a generated tsvector across key text fields.

### Row Level Security (high level)
- `applicator`: can read all, write own, edit any (per Q38), soft-delete own.
- `admin`: full read/write/delete on everything.
- Customers: no access (no login).

---

## 6. Screens & User Flows

### 6.1 Auth
- `/login` — email + password.
- `/signup` — admin-only invite flow (admin creates user accounts in V1; no public signup).
- `/forgot-password` — Supabase Auth handles it.

### 6.2 Landing (`/`)
**Applicator view:**
- Large `+ New Mix Record` button (primary CTA).
- "Your recent records" list (last 10).
- Search bar at top.

**Admin view:**
- Compact stats strip: records this week, total acres this month, active customers count.
- Same `+ New Mix Record` button.
- "Recent team records" list (last 15, all users).

### 6.3 New / Edit Mix Record (`/records/new`, `/records/[id]/edit`)
Single-page form, broken into logical sections (collapsed by default on mobile, accordion-style):

1. **Header** (auto-filled, expand to edit)
   - Date, time, applicator, truck/sprayer, license #
2. **Location**
   - GPS lat/lng (auto-captured, "📍 Re-capture" button, manual override)
   - DMS / decimal display toggle
   - Customer dropdown → Field dropdown (cascading)
3. **Mix details**
   - Tank size (gal), Target GPA, Water (gal)
   - Products: add-row UI. Each row = product dropdown + amount + unit + rate + rate unit. EPA # auto-fills, rate guardrail warning if outside label range.
   - Surfactant: name + amount + unit (free text)
4. **Totals**
   - Total Mix (manual) — calculated value shown as `Σ = 150 gal ✓` in muted text beside the field
   - Expected Acres (manual) — calculated suggestion shown beside it
   - Actual Acres (manual, optional)
5. **Conditions**
   - Wind speed* (mph or m/s based on units toggle)
   - Wind direction* (dropdown: N, NE, E, …)
   - Temp, humidity (optional)
6. **Photos** (optional, multi-upload)
7. **Notes** (optional textarea)
8. **Signature**
   - Typed name field
   - "I attest the above is accurate" checkbox (required)
9. **Submit** → success toast → redirect to `/records/[id]`

### 6.4 Records List (`/records`)
- Filter bar: date range, applicator, customer, product, full-text search.
- Save current filters as a named filter.
- Table view on desktop, card list on mobile.
- Each row: date, customer, field, applicator, total gal, acres, status icons (photos? notes?).
- Click → record detail.

### 6.5 Record Detail (`/records/[id]`)
- Read-only view of the full record, beautifully formatted.
- Top-right actions: `Edit`, `Download PDF`, `Delete` (with confirm).
- Map snippet showing the mix GPS pin.
- Last-modified-by + timestamp shown at bottom.

### 6.6 Map View (`/map`)
- Mapbox satellite layer.
- Pins for every mix record (in date range / filter scope).
- Click pin → mini-card with date, customer, link to record.
- Date range filter at top.

### 6.7 Customers (`/customers`)
- List with search.
- Detail page: customer info + list of fields + list of recent jobs.
- Add/edit customer.
- Add/edit field under customer.

### 6.8 Products (`/products`)
- List.
- Detail/edit: name, EPA #, manufacturer, label min/max rate, rate unit, notes.
- `+ Add Product`.

### 6.9 Equipment (`/equipment`)
- Same shape as Products. Simpler fields.

### 6.10 Settings (`/settings`)
- Profile (name, email, license #, default units, phone).
- Admin-only: User management (invite, change role, deactivate).

---

## 7. File / Folder Structure

```
app/
  (auth)/
    login/page.tsx
    forgot-password/page.tsx
  (app)/
    layout.tsx                 # authenticated shell w/ nav
    page.tsx                   # landing
    records/
      page.tsx                 # list
      new/page.tsx
      [id]/
        page.tsx               # detail
        edit/page.tsx
    map/page.tsx
    customers/
      page.tsx
      new/page.tsx
      [id]/
        page.tsx
        edit/page.tsx
        fields/
          new/page.tsx
          [fieldId]/edit/page.tsx
    products/
      page.tsx
      new/page.tsx
      [id]/edit/page.tsx
    equipment/
      page.tsx
      new/page.tsx
      [id]/edit/page.tsx
    settings/
      page.tsx
      users/page.tsx           # admin only
  api/
    pdf/[recordId]/route.ts    # server-rendered PDF
  globals.css                  # theme tokens here
  layout.tsx
  manifest.ts                  # PWA manifest

components/
  ui/                          # shadcn primitives
  forms/
    MixRecordForm.tsx
    ProductPicker.tsx
    GpsCapture.tsx
    UnitToggle.tsx
    DmsDecimalInput.tsx
    SignatureBlock.tsx
  records/
    RecordCard.tsx
    RecordsTable.tsx
    FilterBar.tsx
  customers/
    CustomerForm.tsx
    FieldForm.tsx
  shared/
    AppShell.tsx
    Nav.tsx
    StatsStrip.tsx

lib/
  supabase/
    client.ts                  # browser client
    server.ts                  # server client (cookies)
    proxy.ts                   # session refresh helper for root proxy.ts
  pdf/
    MixRecordPdf.tsx           # @react-pdf/renderer component
  validation/
    schemas.ts                 # zod schemas (single source of truth)
  calculations/
    mix.ts                     # totalMix, expectedAcres, rateChecks
  formatting/
    coordinates.ts             # decimal ↔ DMS
    units.ts                   # US ↔ metric
  constants.ts                 # wind directions, etc.

types/
  database.ts                  # generated via supabase gen types
  domain.ts                    # app-level types

proxy.ts                       # Next.js request proxy for auth session refresh

supabase/
  migrations/
    0001_initial.sql           # tables, RLS, indexes
    0002_seed_dev.sql          # optional dev seed data
```

---

## 8. Default Theme Tokens

`globals.css` — easy to replace when brand is defined.

```css
:root {
  /* Industrial ag-tech palette */
  --background: 60 8% 97%;            /* warm off-white */
  --foreground: 120 8% 12%;           /* near-black with green undertone */

  --primary: 142 38% 28%;             /* deep field green */
  --primary-foreground: 60 8% 97%;

  --secondary: 35 25% 88%;            /* warm tan */
  --secondary-foreground: 120 8% 12%;

  --accent: 142 50% 42%;              /* brighter green for CTAs */
  --accent-foreground: 0 0% 100%;

  --muted: 60 6% 92%;
  --muted-foreground: 120 4% 40%;

  --destructive: 0 65% 45%;
  --destructive-foreground: 0 0% 100%;

  --border: 60 6% 85%;
  --input: 60 6% 90%;
  --ring: 142 50% 42%;

  --radius: 0.5rem;

  --font-sans: ui-sans-serif, system-ui, -apple-system, "Inter", sans-serif;
  --font-mono: ui-monospace, "JetBrains Mono", monospace;
}
```

Typography: clean sans (Inter is fine as a default). Heavy weights for headers, comfortable line-height, generous touch targets (min 44px) on mobile.

---

## 9. Build Sequence (phased)

### Phase 0 — Foundation (1–2 days of focused work)
1. Init Next.js 15 with TypeScript + Tailwind + App Router.
2. Install shadcn/ui, configure theme tokens.
3. Set up Supabase project. Configure Auth (email/password, disable signup).
4. Write `supabase/migrations/0001_initial.sql` — all tables, RLS, indexes from §5.
5. Wire up `@supabase/ssr` client + proxy session refresh.
6. Build basic AppShell (nav, auth-gated layout).
7. Login / forgot-password pages.

### Phase 1 — Records core (the biggest chunk)
8. Customer CRUD (list, create, edit, detail with fields).
9. Field CRUD (under customer).
10. Equipment CRUD.
11. Product CRUD (with rate guardrails on save).
12. Mix Record form — start with header + location + mix sections.
13. Mix Record form — products array, surfactant, totals (with live calculation hints).
14. Mix Record form — conditions, photos, notes, signature.
15. Mix Record list page with filtering.
16. Mix Record detail page.
17. Mix Record edit flow.
18. Soft-delete flow.

### Phase 2 — Polish & differentiators
19. PDF generation (`/api/pdf/[id]`) using @react-pdf/renderer.
20. Map view (Mapbox satellite, pins).
21. Saved filters.
22. Stats strip on admin landing.
23. Settings page + admin user management.
24. PWA manifest + service worker + install prompt.
25. Responsive polish pass (desktop admin views, mobile field views).
26. Empty states, loading skeletons, error toasts.

### Phase 3 — Post-V1 backlog (deferred per Q&A)
- Label PDF / SDS attachment to products (schema already supports).
- Field boundary drawing (Mapbox GL Draw → fills `fields.boundary`).
- Auto-acres from boundary.
- Recurring/duplicate job workflow.
- Drone flight log import (DJI etc.) → auto-populates `actual_acres` + flight path.
- Auto weather pull (e.g. Open-Meteo).
- In-app email / shareable record links.
- Bulk CSV / PDF export.
- State-specific compliance templates.
- Full audit log table (see risks below).

---

## 10. Known Risks & Future Considerations

1. **Audit trail thinness.** Per Q38 + Q39, any user can edit any record at any time, and we're only storing last-modified timestamps. This is the right call for V1 speed but is a real compliance gap. If the drone company ever faces a regulator dispute about what a record originally said, there's no defensible history. *Mitigation*: add an `audit_log` table in phase 3 that captures every UPDATE with old/new diff + user + timestamp. Schema is straightforward; UI to view diffs is the harder lift.

2. **Single-tenant assumption.** If the drone company later wants to sell this to other ops, retrofitting multi-tenancy means adding `org_id` to nearly every table and rewriting RLS. *Mitigation*: now is the cheapest time to add `org_id` even with only one org. Worth a 30-minute call to decide.

3. **No offline mode.** Per Q12 they always have signal. If field conditions ever change, this becomes a notable rebuild.

4. **Photos in Supabase Storage.** Free tier is 1GB. At ~2MB per photo and ~5 photos per record, that's ~100 records/GB. Monitor and upgrade tier when needed (~$25/month for 100GB).

---

## 11. Cursor Master Prompt (paste-ready)

> Paste this into Cursor's composer at the start of the project to give it context. Reference this entire `agri_drone_app_build_plan.md` file in the prompt.

```
You are helping me build the Agri Drone Operations Platform. Read the
entire `agri_drone_app_build_plan.md` file in this repo before doing
anything else — every architectural decision is already made there.

Strict rules:
1. Stack is fixed: Next.js 15 App Router + TypeScript + Tailwind +
   shadcn/ui + Supabase (Postgres / Auth / Storage) + Mapbox +
   @react-pdf/renderer. Do not propose alternatives.
2. The data model in §5 is the source of truth. If you need a new
   table or column, propose a migration first, do not improvise.
3. Zod schemas in `lib/validation/schemas.ts` are the single source of
   truth for validation. Form components and Server Actions both
   import from there.
4. All mutations go through Server Actions, never direct Supabase
   calls from client components.
5. Server Components for reads. Use the server Supabase client.
6. Theme via CSS variables in `globals.css` — never hardcode colors.
7. Mobile-first. Min touch target 44px. Test layouts at 375px width.
8. RLS is non-negotiable — every table has policies before we ship.
9. When in doubt about scope, default to "is this in V1 per §9?"
   If no, stub it or skip it.

Start with Phase 0 from §9. Confirm each step with me before moving
to the next one. Do not skip ahead. Do not write more than one
migration without me reviewing it.
```

---

## 12. Next Steps (your move)

Once you've reviewed this:

1. **Confirm** the decisions matrix in §2 — anything you want to change before Cursor starts?
2. **Provide brand assets** when ready (logo SVG, primary/accent hex codes, font preference). Until then we run on the industrial ag-tech default in §8.
3. **Set up the Supabase project** (free tier is fine). Send me the `URL` and `anon key` if you want help with the initial migration, or hand them to Cursor with the master prompt above.
4. **Set up the Mapbox account** and generate a public access token.
5. **Init the Next.js project locally** and paste the master prompt from §11 into Cursor to kick off Phase 0.

When you're ready for me to write the actual SQL migration file or any specific component, just say the word and I'll generate it.
