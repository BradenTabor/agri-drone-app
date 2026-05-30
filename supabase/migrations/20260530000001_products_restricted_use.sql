alter table public.products
  add column if not exists restricted_use boolean not null default false;

alter table public.products
  drop column if exists label_min_rate,
  drop column if exists label_max_rate,
  drop column if exists rate_unit;
