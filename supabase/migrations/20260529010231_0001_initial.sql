create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'applicator' check (role in ('applicator', 'admin')),
  license_cert_no text,
  default_units text not null default 'us' check (default_units in ('us', 'metric')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  name text not null,
  default_lat numeric,
  default_lng numeric,
  acres numeric,
  boundary jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  type text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  epa_number text,
  manufacturer text,
  label_min_rate numeric,
  label_max_rate numeric,
  rate_unit text check (rate_unit in ('oz', 'fl_oz', 'gal', 'lb')),
  documents jsonb not null default '[]'::jsonb,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.mix_records (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  time_mixed time not null,
  applicator_id uuid references public.profiles(id),
  applicator_name_override text,
  license_cert_no text,
  equipment_id uuid references public.equipment(id),
  customer_id uuid not null references public.customers(id),
  field_id uuid not null references public.fields(id),
  customer_name_snapshot text,
  field_name_snapshot text,
  mix_lat numeric not null,
  mix_lng numeric not null,
  tank_size_gal numeric not null,
  target_gpa numeric not null,
  water_gal numeric not null,
  surfactant_name text,
  surfactant_amount numeric,
  surfactant_unit text check (surfactant_unit in ('oz', 'fl_oz', 'gal', '%')),
  total_mix_gal numeric not null,
  expected_acres numeric not null,
  actual_acres numeric,
  wind_speed_mph numeric not null,
  wind_direction text not null check (wind_direction in ('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW')),
  temp_f numeric,
  humidity_pct numeric,
  signed_typed_name text not null,
  signature_attested boolean not null default false,
  notes text,
  submitted_by uuid references public.profiles(id),
  submitted_at timestamptz not null default now(),
  last_modified_by uuid references public.profiles(id),
  last_modified_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(customer_name_snapshot, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(field_name_snapshot, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(applicator_name_override, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(surfactant_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(notes, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on column public.mix_records.customer_name_snapshot is
  'Point-in-time snapshot of customer name at submission/edit time.';

comment on column public.mix_records.field_name_snapshot is
  'Point-in-time snapshot of field name at submission/edit time.';

create table if not exists public.mix_record_products (
  id uuid primary key default gen_random_uuid(),
  mix_record_id uuid not null references public.mix_records(id) on delete cascade,
  product_id uuid references public.products(id),
  amount_added numeric not null,
  amount_unit text not null check (amount_unit in ('gal', 'oz', 'fl_oz', 'lb')),
  rate_per_acre numeric,
  rate_unit text check (rate_unit in ('oz', 'fl_oz', 'gal', 'lb')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.mix_record_photos (
  id uuid primary key default gen_random_uuid(),
  mix_record_id uuid not null references public.mix_records(id) on delete cascade,
  storage_path text not null check (storage_path ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.[A-Za-z0-9]+$'),
  caption text,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_mix_records_record_date_desc on public.mix_records (record_date desc);
create index if not exists idx_mix_records_customer_date_desc on public.mix_records (customer_id, record_date desc);
create index if not exists idx_mix_records_applicator_date_desc on public.mix_records (applicator_id, record_date desc);
create index if not exists idx_mix_records_search_vector on public.mix_records using gin (search_vector);
create index if not exists idx_mix_record_products_mix_record_id on public.mix_record_products (mix_record_id);
create index if not exists idx_mix_record_photos_mix_record_id on public.mix_record_photos (mix_record_id);
create index if not exists idx_fields_customer_id on public.fields (customer_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.sync_mix_record_snapshots()
returns trigger
language plpgsql
as $$
declare
  v_customer_name text;
  v_field_name text;
  v_field_customer_id uuid;
begin
  select c.name
  into v_customer_name
  from public.customers c
  where c.id = new.customer_id;

  select f.name, f.customer_id
  into v_field_name, v_field_customer_id
  from public.fields f
  where f.id = new.field_id;

  if v_customer_name is null then
    raise exception 'Invalid customer_id % for mix record', new.customer_id;
  end if;

  if v_field_name is null then
    raise exception 'Invalid field_id % for mix record', new.field_id;
  end if;

  if v_field_customer_id <> new.customer_id then
    raise exception 'Field % does not belong to customer %', new.field_id, new.customer_id;
  end if;

  new.customer_name_snapshot := v_customer_name;
  new.field_name_snapshot := v_field_name;

  if tg_op = 'INSERT' then
    new.submitted_by := coalesce(new.submitted_by, auth.uid());
    new.submitted_at := coalesce(new.submitted_at, now());
  else
    new.last_modified_by := auth.uid();
    new.last_modified_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists mix_records_snapshot_sync on public.mix_records;
create trigger mix_records_snapshot_sync
before insert or update
on public.mix_records
for each row execute procedure public.sync_mix_record_snapshots();

create or replace function public.enforce_mix_record_soft_delete_owner()
returns trigger
language plpgsql
as $$
declare
  v_role text;
begin
  if new.deleted_at is distinct from old.deleted_at then
    v_role := public.current_user_role();
    if v_role = 'admin' then
      return new;
    end if;
    if old.submitted_by <> auth.uid() then
      raise exception 'Only original submitter can soft-delete this record.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists mix_records_soft_delete_owner on public.mix_records;
create trigger mix_records_soft_delete_owner
before update on public.mix_records
for each row execute procedure public.enforce_mix_record_soft_delete_owner();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute procedure public.set_updated_at();

drop trigger if exists fields_set_updated_at on public.fields;
create trigger fields_set_updated_at
before update on public.fields
for each row execute procedure public.set_updated_at();

drop trigger if exists equipment_set_updated_at on public.equipment;
create trigger equipment_set_updated_at
before update on public.equipment
for each row execute procedure public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

drop trigger if exists mix_records_set_updated_at on public.mix_records;
create trigger mix_records_set_updated_at
before update on public.mix_records
for each row execute procedure public.set_updated_at();

drop trigger if exists mix_record_products_set_updated_at on public.mix_record_products;
create trigger mix_record_products_set_updated_at
before update on public.mix_record_products
for each row execute procedure public.set_updated_at();

drop trigger if exists mix_record_photos_set_updated_at on public.mix_record_photos;
create trigger mix_record_photos_set_updated_at
before update on public.mix_record_photos
for each row execute procedure public.set_updated_at();

drop trigger if exists saved_filters_set_updated_at on public.saved_filters;
create trigger saved_filters_set_updated_at
before update on public.saved_filters
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.fields enable row level security;
alter table public.equipment enable row level security;
alter table public.products enable row level security;
alter table public.mix_records enable row level security;
alter table public.mix_record_products enable row level security;
alter table public.mix_record_photos enable row level security;
alter table public.saved_filters enable row level security;

create policy "profiles_select_team"
on public.profiles
for select
using (id = auth.uid() or public.current_user_role() in ('applicator', 'admin'));

create policy "profiles_insert_self"
on public.profiles
for insert
with check (id = auth.uid());

create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (id = auth.uid() or public.current_user_role() = 'admin')
with check (id = auth.uid() or public.current_user_role() = 'admin');

create policy "customers_read_team"
on public.customers
for select
using (public.current_user_role() in ('applicator', 'admin'));

create policy "customers_write_team"
on public.customers
for all
using (public.current_user_role() in ('applicator', 'admin'))
with check (public.current_user_role() in ('applicator', 'admin'));

create policy "fields_read_team"
on public.fields
for select
using (public.current_user_role() in ('applicator', 'admin'));

create policy "fields_write_team"
on public.fields
for all
using (public.current_user_role() in ('applicator', 'admin'))
with check (public.current_user_role() in ('applicator', 'admin'));

create policy "equipment_read_team"
on public.equipment
for select
using (public.current_user_role() in ('applicator', 'admin'));

create policy "equipment_write_team"
on public.equipment
for all
using (public.current_user_role() in ('applicator', 'admin'))
with check (public.current_user_role() in ('applicator', 'admin'));

create policy "products_read_team"
on public.products
for select
using (public.current_user_role() in ('applicator', 'admin'));

create policy "products_write_team"
on public.products
for all
using (public.current_user_role() in ('applicator', 'admin'))
with check (public.current_user_role() in ('applicator', 'admin'));

create policy "mix_records_read_team"
on public.mix_records
for select
using (public.current_user_role() in ('applicator', 'admin'));

create policy "mix_records_insert_team"
on public.mix_records
for insert
with check (
  public.current_user_role() in ('applicator', 'admin')
  and submitted_by = auth.uid()
);

create policy "mix_records_update_team"
on public.mix_records
for update
using (public.current_user_role() in ('applicator', 'admin'))
with check (public.current_user_role() in ('applicator', 'admin'));

create policy "mix_records_delete_admin_only"
on public.mix_records
for delete
using (public.current_user_role() = 'admin');

create policy "mix_record_products_read_team"
on public.mix_record_products
for select
using (
  public.current_user_role() in ('applicator', 'admin')
  and exists (
    select 1
    from public.mix_records mr
    where mr.id = mix_record_products.mix_record_id
  )
);

create policy "mix_record_products_write_team"
on public.mix_record_products
for all
using (public.current_user_role() in ('applicator', 'admin'))
with check (
  public.current_user_role() in ('applicator', 'admin')
  and exists (
    select 1
    from public.mix_records mr
    where mr.id = mix_record_products.mix_record_id
  )
);

create policy "mix_record_photos_read_team"
on public.mix_record_photos
for select
using (public.current_user_role() in ('applicator', 'admin'));

create policy "mix_record_photos_write_team"
on public.mix_record_photos
for all
using (public.current_user_role() in ('applicator', 'admin'))
with check (
  public.current_user_role() in ('applicator', 'admin')
  and exists (
    select 1
    from public.mix_records mr
    where mr.id = mix_record_photos.mix_record_id
      and mr.id::text = split_part(mix_record_photos.storage_path, '/', 1)
  )
);

create policy "saved_filters_select_own"
on public.saved_filters
for select
using (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "saved_filters_insert_own"
on public.saved_filters
for insert
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "saved_filters_update_own"
on public.saved_filters
for update
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "saved_filters_delete_own"
on public.saved_filters
for delete
using (user_id = auth.uid() or public.current_user_role() = 'admin');

insert into storage.buckets (id, name, public)
values ('mix-record-photos', 'mix-record-photos', false)
on conflict (id) do nothing;

create policy "storage_read_mix_record_photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'mix-record-photos'
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.[A-Za-z0-9]+$'
  and exists (
    select 1
    from public.mix_records mr
    where mr.id::text = split_part(name, '/', 1)
      and mr.deleted_at is null
      and public.current_user_role() in ('applicator', 'admin')
  )
);

create policy "storage_insert_mix_record_photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mix-record-photos'
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.[A-Za-z0-9]+$'
  and exists (
    select 1
    from public.mix_records mr
    where mr.id::text = split_part(name, '/', 1)
      and mr.deleted_at is null
      and public.current_user_role() in ('applicator', 'admin')
  )
);

create policy "storage_update_mix_record_photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'mix-record-photos'
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.[A-Za-z0-9]+$'
  and exists (
    select 1
    from public.mix_records mr
    where mr.id::text = split_part(name, '/', 1)
      and mr.deleted_at is null
      and public.current_user_role() in ('applicator', 'admin')
  )
)
with check (
  bucket_id = 'mix-record-photos'
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.[A-Za-z0-9]+$'
  and exists (
    select 1
    from public.mix_records mr
    where mr.id::text = split_part(name, '/', 1)
      and mr.deleted_at is null
      and public.current_user_role() in ('applicator', 'admin')
  )
);

create policy "storage_delete_mix_record_photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mix-record-photos'
  and exists (
    select 1
    from public.mix_records mr
    where mr.id::text = split_part(name, '/', 1)
      and (
        public.current_user_role() = 'admin'
        or mr.submitted_by = auth.uid()
      )
  )
);
