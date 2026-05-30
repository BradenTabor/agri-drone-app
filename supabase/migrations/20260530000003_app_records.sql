create table if not exists public.app_records (
  id uuid primary key default gen_random_uuid(),

  job_date date not null,
  applicator_name text not null,
  customer_name text not null,
  site_address text,
  job_site_id text,

  location_lat numeric,
  location_lng numeric,

  temp_f numeric,
  wind_speed_mph numeric,
  wind_direction text check (wind_direction in ('N','NE','E','SE','S','SW','W','NW')),
  sky_condition text,

  target_vegetation jsonb not null default '[]'::jsonb,
  target_veg_other text,

  app_method text check (app_method in ('backpack','boom','handgun','utv','truck_rig','drone')),

  start_time time,
  end_time time,

  total_gallons numeric,
  gallons_per_acre numeric,
  acres_treated numeric,
  tank_mix_record text,

  equipment_notes text,
  truck_id text,
  nozzle_type text,

  rei text,
  safe_reentry_date date,

  additional_notes text,
  cert_attested boolean not null default false,
  applicator_sig text,
  license_cert_no text,

  submitted_by uuid references public.profiles(id),
  submitted_at timestamptz not null default now(),
  last_modified_by uuid references public.profiles(id),
  last_modified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.app_record_pesticides (
  id uuid primary key default gen_random_uuid(),
  app_record_id uuid not null references public.app_records(id) on delete cascade,
  sort_order int not null default 0,
  is_surfactant boolean not null default false,
  epa_reg_number text,
  product_name text not null,
  active_ingredient text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_app_records_updated_at
  before update on public.app_records
  for each row execute function public.set_updated_at();

create index if not exists idx_app_records_job_date_desc on public.app_records (job_date desc);
create index if not exists idx_app_record_pesticides_record_id on public.app_record_pesticides (app_record_id);

alter table public.app_records enable row level security;
alter table public.app_record_pesticides enable row level security;

create policy "Authenticated users can manage app_records"
  on public.app_records for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage app_record_pesticides"
  on public.app_record_pesticides for all to authenticated using (true) with check (true);
