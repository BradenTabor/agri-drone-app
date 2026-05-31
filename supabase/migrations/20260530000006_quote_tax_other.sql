alter table public.quotes
  add column if not exists service_for text,
  add column if not exists tax_rate numeric not null default 0,
  add column if not exists other_label text,
  add column if not exists other_amount numeric not null default 0;
