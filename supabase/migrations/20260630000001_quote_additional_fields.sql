-- Add new optional fields to quotes table
alter table public.quotes
  add column if not exists adjuvant_surfactant text,
  add column if not exists price_per_acre numeric,
  add column if not exists mileage numeric;

-- Add helpful comments
comment on column public.quotes.adjuvant_surfactant is 'Optional adjuvant or surfactant used for this quote';
comment on column public.quotes.price_per_acre is 'Optional price per acre for spraying service (e.g. $15.00/acre)';
comment on column public.quotes.mileage is 'Optional mileage for travel calculation';

-- Add check constraints to ensure values are sensible
alter table public.quotes
  add constraint check_price_per_acre_non_negative 
    check (price_per_acre is null or price_per_acre >= 0);

alter table public.quotes
  add constraint check_mileage_non_negative 
    check (mileage is null or mileage >= 0);
