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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.mix_records (
    record_date,
    time_mixed,
    applicator_id,
    applicator_name_override,
    license_cert_no,
    equipment_id,
    customer_id,
    field_id,
    mix_lat,
    mix_lng,
    tank_size_gal,
    target_gpa,
    water_gal,
    surfactant_name,
    surfactant_amount,
    surfactant_unit,
    total_mix_gal,
    expected_acres,
    actual_acres,
    wind_speed_mph,
    wind_direction,
    temp_f,
    humidity_pct,
    notes,
    signed_typed_name,
    signature_attested,
    submitted_by
  )
  values (
    (p_record->>'record_date')::date,
    (p_record->>'time_mixed')::time,
    nullif(p_record->>'applicator_id', '')::uuid,
    nullif(p_record->>'applicator_name_override', ''),
    nullif(p_record->>'license_cert_no', ''),
    nullif(p_record->>'equipment_id', '')::uuid,
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
    (p_record->>'wind_speed_mph')::numeric,
    (p_record->>'wind_direction'),
    nullif(p_record->>'temp_f', '')::numeric,
    nullif(p_record->>'humidity_pct', '')::numeric,
    nullif(p_record->>'notes', ''),
    (p_record->>'signed_typed_name'),
    coalesce((p_record->>'signature_attested')::boolean, false),
    auth.uid()
  )
  returning id into v_record_id;

  insert into public.mix_record_products (
    mix_record_id,
    product_id,
    amount_added,
    amount_unit,
    rate_per_acre,
    rate_unit,
    sort_order
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
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.mix_records
  set
    record_date = (p_record->>'record_date')::date,
    time_mixed = (p_record->>'time_mixed')::time,
    applicator_id = nullif(p_record->>'applicator_id', '')::uuid,
    applicator_name_override = nullif(p_record->>'applicator_name_override', ''),
    license_cert_no = nullif(p_record->>'license_cert_no', ''),
    equipment_id = nullif(p_record->>'equipment_id', '')::uuid,
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
    wind_speed_mph = (p_record->>'wind_speed_mph')::numeric,
    wind_direction = (p_record->>'wind_direction'),
    temp_f = nullif(p_record->>'temp_f', '')::numeric,
    humidity_pct = nullif(p_record->>'humidity_pct', '')::numeric,
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

  -- V1 intentionally treats line items as an atomic child set of the record.
  -- We replace all rows on edit (instead of soft-deleting per line) because
  -- V1 tracks only record-level last-modified metadata, not line-level history.
  delete from public.mix_record_products
  where mix_record_id = p_record_id;

  insert into public.mix_record_products (
    mix_record_id,
    product_id,
    amount_added,
    amount_unit,
    rate_per_acre,
    rate_unit,
    sort_order
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

  return true;
end;
$$;

grant execute on function public.create_mix_record_with_lines(jsonb, jsonb) to authenticated;
grant execute on function public.update_mix_record_with_lines(uuid, jsonb, jsonb) to authenticated;
