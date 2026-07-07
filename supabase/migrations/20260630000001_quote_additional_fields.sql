-- Additive, non-destructive: adds optional adjuvant price + mileage inputs to quotes.
-- All columns are nullable with no backfill, so existing rows are unaffected and the
-- migration is safe to run against populated staging/prod data. Idempotent on re-run.
alter table public.quotes
  add column if not exists adjuvant_price numeric
    constraint quotes_adjuvant_price_nonneg check (adjuvant_price is null or adjuvant_price >= 0),
  add column if not exists mileage numeric
    constraint quotes_mileage_nonneg check (mileage is null or mileage >= 0);

comment on column public.quotes.adjuvant_price is 'Optional adjuvant price captured on the quote (USD).';
comment on column public.quotes.mileage is 'Optional travel mileage captured on the quote (miles).';
