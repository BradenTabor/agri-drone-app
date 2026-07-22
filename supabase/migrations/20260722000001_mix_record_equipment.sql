-- Allow mix records to attach multiple equipment items via a junction table.
-- Existing single equipment_id values are backfilled; equipment_id remains as
-- the first selected item for backward-compatible readers.

create table if not exists public.mix_record_equipment (
  id uuid primary key default gen_random_uuid(),
  mix_record_id uuid not null references public.mix_records(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_mix_record_equipment_mix_and_equipment
  on public.mix_record_equipment (mix_record_id, equipment_id);

create index if not exists idx_mix_record_equipment_mix_record_id
  on public.mix_record_equipment (mix_record_id);

create index if not exists idx_mix_record_equipment_equipment_id
  on public.mix_record_equipment (equipment_id);

alter table public.mix_record_equipment enable row level security;

create policy "mix_record_equipment_read_team"
on public.mix_record_equipment
for select
using (
  public.current_user_role() in ('applicator', 'admin')
  and exists (
    select 1
    from public.mix_records mr
    where mr.id = mix_record_equipment.mix_record_id
  )
);

create policy "mix_record_equipment_write_team"
on public.mix_record_equipment
for all
using (public.current_user_role() in ('applicator', 'admin'))
with check (
  public.current_user_role() in ('applicator', 'admin')
  and exists (
    select 1
    from public.mix_records mr
    where mr.id = mix_record_equipment.mix_record_id
  )
);

-- Backfill from legacy single equipment_id
insert into public.mix_record_equipment (mix_record_id, equipment_id, sort_order)
select mr.id, mr.equipment_id, 0
from public.mix_records mr
where mr.equipment_id is not null
  and not exists (
    select 1
    from public.mix_record_equipment link
    where link.mix_record_id = mr.id
      and link.equipment_id = mr.equipment_id
  );

create or replace function public.create_mix_record_with_lines(
  p_record jsonb,
  p_lines jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_record_id uuid;
  v_equipment_ids jsonb;
  v_first_equipment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_equipment_ids := coalesce(p_record->'equipment_ids', '[]'::jsonb);

  -- Prefer explicit equipment_ids array; fall back to legacy equipment_id.
  if jsonb_typeof(v_equipment_ids) <> 'array' or jsonb_array_length(v_equipment_ids) = 0 then
    if nullif(p_record->>'equipment_id', '') is not null then
      v_equipment_ids := jsonb_build_array(p_record->>'equipment_id');
    else
      v_equipment_ids := '[]'::jsonb;
    end if;
  end if;

  if jsonb_array_length(v_equipment_ids) > 0 then
    v_first_equipment_id := (v_equipment_ids->>0)::uuid;
  else
    v_first_equipment_id := null;
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(v_equipment_ids) as entry(equipment_id)
    left join public.equipment e
      on e.id = entry.equipment_id::uuid
     and e.deleted_at is null
    where e.id is null
  ) then
    raise exception 'One or more selected equipment items no longer exist.';
  end if;

  insert into public.mix_records (
    record_date, time_mixed, applicator_id, applicator_name_override, license_cert_no,
    equipment_id, customer_id, field_id, mix_lat, mix_lng, tank_size_gal, target_gpa,
    water_gal, surfactant_name, surfactant_amount, surfactant_unit, total_mix_gal,
    expected_acres, actual_acres, wind_speed_mph, wind_direction, temp_f, humidity_pct,
    notes, signed_typed_name, signature_attested, submitted_by
  )
  values (
    (p_record->>'record_date')::date,
    (p_record->>'time_mixed')::time,
    nullif(p_record->>'applicator_id', '')::uuid,
    nullif(p_record->>'applicator_name_override', ''),
    nullif(p_record->>'license_cert_no', ''),
    v_first_equipment_id,
    (p_record->>'customer_id')::uuid,
    (p_record->>'field_id')::uuid,
    (p_record->>'mix_lat')::numeric,
    (p_record->>'mix_lng')::numeric,
    (p_record->>'tank_size_gal')::numeric,
    (p_record->>'target_gpa')::numeric,
    (p_record->>'water_gal')::numeric,
    nullif(p_record->>'surfactant_name', ''),
    nullif(p_record->>'surfactant_amount', '')::numeric,
    nullif(p_record->>'surfactant_unit', ''),
    (p_record->>'total_mix_gal')::numeric,
    (p_record->>'expected_acres')::numeric,
    nullif(p_record->>'actual_acres', '')::numeric,
    nullif(p_record->>'wind_speed_mph', '')::numeric,
    nullif(p_record->>'wind_direction', ''),
    nullif(p_record->>'temp_f', '')::numeric,
    nullif(p_record->>'humidity_pct', '')::numeric,
    nullif(p_record->>'notes', ''),
    (p_record->>'signed_typed_name'),
    coalesce((p_record->>'signature_attested')::boolean, false),
    auth.uid()
  )
  returning id into v_record_id;

  insert into public.mix_record_products (
    mix_record_id, product_id, amount_added, amount_unit, rate_per_acre, rate_unit, sort_order
  )
  select
    v_record_id,
    nullif(line->>'product_id', '')::uuid,
    (line->>'amount_added')::numeric,
    (line->>'amount_unit'),
    nullif(line->>'rate_per_acre', '')::numeric,
    nullif(line->>'rate_unit', ''),
    coalesce((line->>'sort_order')::int, ordinality - 1)
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) with ordinality as entry(line, ordinality);

  insert into public.mix_record_equipment (mix_record_id, equipment_id, sort_order)
  select
    v_record_id,
    entry.equipment_id::uuid,
    ordinality - 1
  from jsonb_array_elements_text(v_equipment_ids) with ordinality as entry(equipment_id, ordinality);

  return v_record_id;
end;
$$;

create or replace function public.update_mix_record_with_lines(
  p_record_id uuid,
  p_record jsonb,
  p_lines jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_equipment_ids jsonb;
  v_first_equipment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_equipment_ids := coalesce(p_record->'equipment_ids', '[]'::jsonb);

  if jsonb_typeof(v_equipment_ids) <> 'array' or jsonb_array_length(v_equipment_ids) = 0 then
    if nullif(p_record->>'equipment_id', '') is not null then
      v_equipment_ids := jsonb_build_array(p_record->>'equipment_id');
    else
      v_equipment_ids := '[]'::jsonb;
    end if;
  end if;

  if jsonb_array_length(v_equipment_ids) > 0 then
    v_first_equipment_id := (v_equipment_ids->>0)::uuid;
  else
    v_first_equipment_id := null;
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(v_equipment_ids) as entry(equipment_id)
    left join public.equipment e
      on e.id = entry.equipment_id::uuid
     and e.deleted_at is null
    where e.id is null
  ) then
    raise exception 'One or more selected equipment items no longer exist.';
  end if;

  update public.mix_records
  set
    record_date = (p_record->>'record_date')::date,
    time_mixed = (p_record->>'time_mixed')::time,
    applicator_id = nullif(p_record->>'applicator_id', '')::uuid,
    applicator_name_override = nullif(p_record->>'applicator_name_override', ''),
    license_cert_no = nullif(p_record->>'license_cert_no', ''),
    equipment_id = v_first_equipment_id,
    customer_id = (p_record->>'customer_id')::uuid,
    field_id = (p_record->>'field_id')::uuid,
    mix_lat = (p_record->>'mix_lat')::numeric,
    mix_lng = (p_record->>'mix_lng')::numeric,
    tank_size_gal = (p_record->>'tank_size_gal')::numeric,
    target_gpa = (p_record->>'target_gpa')::numeric,
    water_gal = (p_record->>'water_gal')::numeric,
    surfactant_name = nullif(p_record->>'surfactant_name', ''),
    surfactant_amount = nullif(p_record->>'surfactant_amount', '')::numeric,
    surfactant_unit = nullif(p_record->>'surfactant_unit', ''),
    total_mix_gal = (p_record->>'total_mix_gal')::numeric,
    expected_acres = (p_record->>'expected_acres')::numeric,
    actual_acres = nullif(p_record->>'actual_acres', '')::numeric,
    -- Preserve historical weather when the client omits these keys
    -- (conditions UI was removed; missing keys must not wipe existing values).
    wind_speed_mph = case
      when p_record ? 'wind_speed_mph' then nullif(p_record->>'wind_speed_mph', '')::numeric
      else wind_speed_mph
    end,
    wind_direction = case
      when p_record ? 'wind_direction' then nullif(p_record->>'wind_direction', '')
      else wind_direction
    end,
    temp_f = case
      when p_record ? 'temp_f' then nullif(p_record->>'temp_f', '')::numeric
      else temp_f
    end,
    humidity_pct = case
      when p_record ? 'humidity_pct' then nullif(p_record->>'humidity_pct', '')::numeric
      else humidity_pct
    end,
    notes = nullif(p_record->>'notes', ''),
    signed_typed_name = (p_record->>'signed_typed_name'),
    signature_attested = coalesce((p_record->>'signature_attested')::boolean, false),
    last_modified_by = auth.uid(),
    last_modified_at = now()
  where id = p_record_id
    and deleted_at is null;

  if not found then
    return false;
  end if;

  delete from public.mix_record_products where mix_record_id = p_record_id;

  insert into public.mix_record_products (
    mix_record_id, product_id, amount_added, amount_unit, rate_per_acre, rate_unit, sort_order
  )
  select
    p_record_id,
    nullif(line->>'product_id', '')::uuid,
    (line->>'amount_added')::numeric,
    (line->>'amount_unit'),
    nullif(line->>'rate_per_acre', '')::numeric,
    nullif(line->>'rate_unit', ''),
    coalesce((line->>'sort_order')::int, ordinality - 1)
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) with ordinality as entry(line, ordinality);

  delete from public.mix_record_equipment where mix_record_id = p_record_id;

  insert into public.mix_record_equipment (mix_record_id, equipment_id, sort_order)
  select
    p_record_id,
    entry.equipment_id::uuid,
    ordinality - 1
  from jsonb_array_elements_text(v_equipment_ids) with ordinality as entry(equipment_id, ordinality);

  return true;
end;
$$;

grant execute on function public.create_mix_record_with_lines(jsonb, jsonb) to authenticated;
grant execute on function public.update_mix_record_with_lines(uuid, jsonb, jsonb) to authenticated;
