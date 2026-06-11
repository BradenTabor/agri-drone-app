alter table public.products
  add column if not exists ingredients text[] not null default '{}'::text[];
