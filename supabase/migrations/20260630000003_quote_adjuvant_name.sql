-- Additive, non-destructive: records which adjuvant/surfactant was chosen on a quote.
-- The column is nullable with no backfill, so existing rows are unaffected and the
-- migration is safe to run against populated staging/prod data. Idempotent on re-run.
alter table public.quotes
  add column if not exists adjuvant_name text;

comment on column public.quotes.adjuvant_name is 'Optional adjuvant/surfactant name snapshot captured on the quote.';
