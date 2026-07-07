alter table public.quotes
  add column if not exists surfactant_id uuid references public.surfactants(id);

create index if not exists idx_quotes_surfactant on public.quotes (surfactant_id);
