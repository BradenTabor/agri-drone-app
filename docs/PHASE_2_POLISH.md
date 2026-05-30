# Phase 2 Polish Backlog

- [x] Add shared `Input`, `Textarea`, `Label`, `Card`, and `FormAlert` primitives for consistent foundation styling.
- [x] Replace raw auth/customer/field form controls with shared input primitives.
- [x] Extend shared input primitives into equipment/product forms for consistent validation styling.
- [x] Add semantic `role="alert"` treatment for form-level error/success states.
- [x] Align `--font-sans` / `--font-mono` theme tokens with Geist font variables in root globals.
- [x] Add active-route highlighting in `Nav`.
- [x] Replace remaining `rounded-lg border bg-card p-5` wrappers with shared `Card` usage across app pages.
- [x] Replace `window.confirm` destructive flow with accessible dialog-based confirmation.
- [x] Add customer list search/filter UX with responsive table/card support.
- [x] Add equipment and product list search/filter UX with shared list search toolbar.
- [x] Polish records list filters and cards with shared `Input`/`Select`/`Card` primitives.
- [x] Harmonize MixRecordForm selects with shared `Select` primitive.
- [x] Add shared `Checkbox` primitive and canonical `checkboxValue` server-action helper.
- [x] Extract shared `DecimalInput` primitive for acres/tank/GPA and other numeric fields.
- [x] Polish record detail product rows and photo tiles with nested `Card` styling.
- [x] Wrap MixRecordForm sections in shared `Card` for visual consistency.
- [x] Mobile-first pass: collapsible nav, touch targets, wrapping headers, scrollable tables, stacked field rows.
- [x] Polish auth shell and customer detail field cards with shared `Card` primitive.
- [x] Add an `error.tsx` boundary in the protected app group.
- [x] Create ongoing scoring + gate + batch-report execution log (`docs/FRONTEND_DESIGN_EXECUTION.md`).
- [x] Expand `Nav` with Records route (Map/Settings remain backlog until routes exist).
- Add admin "restore deleted" UI for `deleted_at` records.
- Add global handling for transient `getUser()` errors vs missing-session redirects.
- Add a `0002` migration to move `mix_record_photos` path-prefix matching into a table `CHECK` constraint and simplify photo write RLS role-gating.
- Migration `0002` candidates: move `mix_record_photos` path-prefix check from RLS to table `CHECK`; add `equipment.type` CHECK constraint (`type in ('truck','sprayer','drone') OR type IS NULL`).
- Optional: Map/Settings nav entries when routes exist.
- Clarify `submitted_by` vs `applicator_id` in record detail UX (`submitted_by` = who saved, `applicator_id` = who performed application); show both when they differ.
- Improve total-mix hint math for non-gallon units (`oz`, `fl_oz`, `lb`) with explicit conversion assumptions.
- Extend mix-record photo preview signed URL expiry strategy (or refresh-on-demand) so edit/detail previews do not break on long-lived sessions.

## Pending device verification

- iOS minus-sign accessibility on `DmsDecimalInput` numeric keypad (test: enter `-93.29` for longitude on a real iPhone). Fallback if broken: Hemisphere dropdown (`N/S`, `E/W`) + positive decimal input.

## Operational discipline

- Session-start drift check: before any code work in a new session, run `ls -1 supabase/migrations/` and compare with `select version, name from supabase_migrations.schema_migrations order by version;` from the live database.
- During the same check, verify form field names, schema validation keys, Server Action input shapes, and RPC signatures all reference the same column names.
- Treat any mismatch across these layers as a stop-and-fix issue before continuing feature work.
