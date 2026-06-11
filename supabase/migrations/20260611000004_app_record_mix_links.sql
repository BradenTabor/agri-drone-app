create table if not exists public.app_record_mix_records (
  id uuid primary key default gen_random_uuid(),
  app_record_id uuid not null references public.app_records(id) on delete cascade,
  mix_record_id uuid not null references public.mix_records(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Exclusivity: one mix record belongs to at most one application record
create unique index if not exists uq_app_record_mix_records_mix_record_id
  on public.app_record_mix_records (mix_record_id);

create index if not exists idx_app_record_mix_records_app_record_id
  on public.app_record_mix_records (app_record_id);

alter table public.app_record_mix_records enable row level security;

create policy "Authenticated users can manage app_record_mix_records"
  on public.app_record_mix_records for all to authenticated using (true) with check (true);

-- ============================================================
-- Atomic create RPC (mirrors create_mix_record_with_lines)
-- ============================================================
create or replace function public.create_app_record_with_children(
  p_record jsonb,
  p_pesticides jsonb,
  p_mix_record_ids jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_record_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.app_records (
    job_date, applicator_name, customer_name, site_address, job_site_id,
    location_lat, location_lng,
    temp_f, wind_speed_mph, wind_direction, sky_condition,
    target_vegetation, target_veg_other, app_method, app_type,
    start_time, end_time,
    total_gallons, gallons_per_acre, acres_treated, tank_mix_record,
    equipment_notes, truck_id, nozzle_type,
    rei, safe_reentry_date,
    additional_notes, cert_attested, applicator_sig, license_cert_no,
    submitted_by
  )
  values (
    (p_record->>'job_date')::date,
    (p_record->>'applicator_name'),
    (p_record->>'customer_name'),
    nullif(p_record->>'site_address', ''),
    nullif(p_record->>'job_site_id', ''),
    nullif(p_record->>'location_lat', '')::numeric,
    nullif(p_record->>'location_lng', '')::numeric,
    nullif(p_record->>'temp_f', '')::numeric,
    nullif(p_record->>'wind_speed_mph', '')::numeric,
    nullif(p_record->>'wind_direction', ''),
    nullif(p_record->>'sky_condition', ''),
    coalesce(p_record->'target_vegetation', '[]'::jsonb),
    nullif(p_record->>'target_veg_other', ''),
    nullif(p_record->>'app_method', ''),
    nullif(p_record->>'app_type', ''),
    nullif(p_record->>'start_time', '')::time,
    nullif(p_record->>'end_time', '')::time,
    nullif(p_record->>'total_gallons', '')::numeric,
    nullif(p_record->>'gallons_per_acre', '')::numeric,
    nullif(p_record->>'acres_treated', '')::numeric,
    nullif(p_record->>'tank_mix_record', ''),
    nullif(p_record->>'equipment_notes', ''),
    nullif(p_record->>'truck_id', ''),
    nullif(p_record->>'nozzle_type', ''),
    nullif(p_record->>'rei', ''),
    nullif(p_record->>'safe_reentry_date', '')::date,
    nullif(p_record->>'additional_notes', ''),
    coalesce((p_record->>'cert_attested')::boolean, false),
    (p_record->>'applicator_sig'),
    nullif(p_record->>'license_cert_no', ''),
    auth.uid()
  )
  returning id into v_record_id;

  insert into public.app_record_pesticides (
    app_record_id, sort_order, is_surfactant,
    epa_reg_number, product_name, active_ingredient
  )
  select
    v_record_id,
    coalesce((line->>'sort_order')::int, ordinality - 1),
    coalesce((line->>'is_surfactant')::boolean, false),
    nullif(line->>'epa_reg_number', ''),
    (line->>'product_name'),
    nullif(line->>'active_ingredient', '')
  from jsonb_array_elements(coalesce(p_pesticides, '[]'::jsonb))
    with ordinality as entry(line, ordinality);

  -- Validate attached mixes exist and are not soft-deleted (trust boundary;
  -- also converts would-be raw FK violations into a clean message)
  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_mix_record_ids, '[]'::jsonb)) as entry(elem)
    left join public.mix_records mr
      on mr.id = (entry.elem #>> '{}')::uuid
     and mr.deleted_at is null
    where mr.id is null
  ) then
    raise exception 'One or more selected mix records no longer exist.';
  end if;

  begin
    insert into public.app_record_mix_records (app_record_id, mix_record_id, sort_order)
    select
      v_record_id,
      (elem #>> '{}')::uuid,
      ordinality - 1
    from jsonb_array_elements(coalesce(p_mix_record_ids, '[]'::jsonb))
      with ordinality as entry(elem, ordinality);
  exception
    when unique_violation then
      raise exception 'One or more mix records are already attached to another application record.';
  end;

  return v_record_id;
end;
$$;

-- ============================================================
-- Atomic update RPC (mirrors update_mix_record_with_lines)
-- ============================================================
create or replace function public.update_app_record_with_children(
  p_record_id uuid,
  p_record jsonb,
  p_pesticides jsonb,
  p_mix_record_ids jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.app_records set
    job_date = (p_record->>'job_date')::date,
    applicator_name = (p_record->>'applicator_name'),
    customer_name = (p_record->>'customer_name'),
    site_address = nullif(p_record->>'site_address', ''),
    job_site_id = nullif(p_record->>'job_site_id', ''),
    location_lat = nullif(p_record->>'location_lat', '')::numeric,
    location_lng = nullif(p_record->>'location_lng', '')::numeric,
    temp_f = nullif(p_record->>'temp_f', '')::numeric,
    wind_speed_mph = nullif(p_record->>'wind_speed_mph', '')::numeric,
    wind_direction = nullif(p_record->>'wind_direction', ''),
    sky_condition = nullif(p_record->>'sky_condition', ''),
    target_vegetation = coalesce(p_record->'target_vegetation', '[]'::jsonb),
    target_veg_other = nullif(p_record->>'target_veg_other', ''),
    app_method = nullif(p_record->>'app_method', ''),
    app_type = nullif(p_record->>'app_type', ''),
    start_time = nullif(p_record->>'start_time', '')::time,
    end_time = nullif(p_record->>'end_time', '')::time,
    total_gallons = nullif(p_record->>'total_gallons', '')::numeric,
    gallons_per_acre = nullif(p_record->>'gallons_per_acre', '')::numeric,
    acres_treated = nullif(p_record->>'acres_treated', '')::numeric,
    tank_mix_record = nullif(p_record->>'tank_mix_record', ''),
    equipment_notes = nullif(p_record->>'equipment_notes', ''),
    truck_id = nullif(p_record->>'truck_id', ''),
    nozzle_type = nullif(p_record->>'nozzle_type', ''),
    rei = nullif(p_record->>'rei', ''),
    safe_reentry_date = nullif(p_record->>'safe_reentry_date', '')::date,
    additional_notes = nullif(p_record->>'additional_notes', ''),
    cert_attested = coalesce((p_record->>'cert_attested')::boolean, false),
    applicator_sig = (p_record->>'applicator_sig'),
    license_cert_no = nullif(p_record->>'license_cert_no', ''),
    last_modified_by = auth.uid(),
    last_modified_at = now()
  where id = p_record_id
    and deleted_at is null;

  if not found then
    raise exception 'Application record not found';
  end if;

  delete from public.app_record_pesticides where app_record_id = p_record_id;

  insert into public.app_record_pesticides (
    app_record_id, sort_order, is_surfactant,
    epa_reg_number, product_name, active_ingredient
  )
  select
    p_record_id,
    coalesce((line->>'sort_order')::int, ordinality - 1),
    coalesce((line->>'is_surfactant')::boolean, false),
    nullif(line->>'epa_reg_number', ''),
    (line->>'product_name'),
    nullif(line->>'active_ingredient', '')
  from jsonb_array_elements(coalesce(p_pesticides, '[]'::jsonb))
    with ordinality as entry(line, ordinality);

  delete from public.app_record_mix_records where app_record_id = p_record_id;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_mix_record_ids, '[]'::jsonb)) as entry(elem)
    left join public.mix_records mr
      on mr.id = (entry.elem #>> '{}')::uuid
     and mr.deleted_at is null
    where mr.id is null
  ) then
    raise exception 'One or more selected mix records no longer exist.';
  end if;

  begin
    insert into public.app_record_mix_records (app_record_id, mix_record_id, sort_order)
    select
      p_record_id,
      (elem #>> '{}')::uuid,
      ordinality - 1
    from jsonb_array_elements(coalesce(p_mix_record_ids, '[]'::jsonb))
      with ordinality as entry(elem, ordinality);
  exception
    when unique_violation then
      raise exception 'One or more mix records are already attached to another application record.';
  end;
end;
$$;
