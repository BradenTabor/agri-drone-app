create table if not exists public.surfactants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  manufacturer text,
  epa_number text,
  default_unit text check (default_unit in ('oz', 'fl_oz', 'gal', '%')),
  unit_cost numeric,
  cost_unit text check (cost_unit in ('gal', 'oz', 'fl_oz', 'lb')),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.surfactants enable row level security;

drop trigger if exists surfactants_set_updated_at on public.surfactants;
create trigger surfactants_set_updated_at
before update on public.surfactants
for each row execute procedure public.set_updated_at();

create policy "surfactants_read_team"
on public.surfactants
for select
using (public.current_user_role() in ('applicator', 'admin'));

create policy "surfactants_write_team"
on public.surfactants
for all
using (public.current_user_role() in ('applicator', 'admin'))
with check (public.current_user_role() in ('applicator', 'admin'));
