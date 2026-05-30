create table if not exists public.pricing_config (
  id uuid primary key default gen_random_uuid(),
  aerial_rate_per_acre numeric,
  minimum_job_fee numeric,
  travel_fee_per_mile numeric,
  setup_fee numeric,
  product_markup_pct numeric,
  markup_cap numeric,
  payment_terms text,
  special_rates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_pricing_config_updated_at
  before update on public.pricing_config
  for each row execute function public.set_updated_at();

alter table public.pricing_config enable row level security;

create policy "Authenticated users can read pricing config"
  on public.pricing_config for select
  to authenticated using (true);

create policy "Authenticated users can upsert pricing config"
  on public.pricing_config for all
  to authenticated using (true) with check (true);

insert into public.pricing_config (id) values ('00000000-0000-0000-0000-000000000001')
  on conflict (id) do nothing;
