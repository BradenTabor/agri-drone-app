alter table public.products
  add column if not exists unit_cost numeric,
  add column if not exists cost_unit text check (cost_unit in ('gal', 'oz', 'fl_oz', 'lb'));
