-- =============================================================
-- RLS Smoke Tests for 0001_initial.sql
-- =============================================================
-- Purpose: verify role-based access control behaves correctly
-- after the migration is pushed.
--
-- Prerequisites:
--   1. Migration 0001_initial.sql has been pushed.
--   2. Two users created via Supabase Auth (Authentication > Users):
--        applicator@test.local
--        admin@test.local
--   3. Promote admin AS POSTGRES (run before any tests below):
--        update public.profiles
--        set role = 'admin'
--        where email = 'admin@test.local';
--
-- How to run:
--   Open Supabase SQL Editor. Run sections one at a time and
--   inspect output. Each section is wrapped in a transaction
--   so changes roll back — your DB stays clean.
--
-- Each section uses set_config() to impersonate a user. This
-- mirrors how Supabase API requests inject JWT claims.
-- =============================================================

-- =============================================================
-- SETUP — capture the test user UUIDs for reuse
-- =============================================================
select id, email, role
from public.profiles
where email in ('applicator@test.local', 'admin@test.local');

-- =============================================================
-- TEST 1: current_user_role() returns the right value
-- =============================================================
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'applicator@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);
  select 'should be applicator: ' || public.current_user_role() as result;
rollback;

begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'admin@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);
  select 'should be admin: ' || public.current_user_role() as result;
rollback;

-- =============================================================
-- TEST 2: Applicator can read all profiles (team visibility)
-- =============================================================
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'applicator@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);
  select 'visible profile count (expect 2): ' || count(*)::text
  from public.profiles;
rollback;

-- =============================================================
-- TEST 3: Applicator CANNOT update another user's profile
-- =============================================================
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'applicator@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);

  with upd as (
    update public.profiles
    set full_name = 'HACKED'
    where email = 'admin@test.local'
    returning 1
  )
  select 'rows updated (expect 0): ' || count(*)::text from upd;
rollback;

-- =============================================================
-- TEST 4: Admin CAN update another user's profile
-- =============================================================
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'admin@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);

  with upd as (
    update public.profiles
    set full_name = 'Updated by admin'
    where email = 'applicator@test.local'
    returning 1
  )
  select 'rows updated (expect 1): ' || count(*)::text from upd;
rollback;

-- =============================================================
-- TEST 5: Applicator can insert a customer
-- =============================================================
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'applicator@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);

  insert into public.customers (name, contact_name)
  values ('Test Farm Co', 'Jane Smith')
  returning 'customer inserted: ' || name as result;
rollback;

-- =============================================================
-- TEST 6: Snapshot trigger populates customer/field names
-- =============================================================
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'applicator@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);

  with c as (
    insert into public.customers (name) values ('Snapshot Test Farm')
    returning id
  ),
  f as (
    insert into public.fields (customer_id, name)
    select id, 'North 40' from c
    returning id, customer_id
  )
  insert into public.mix_records (
    record_date, time_mixed, customer_id, field_id,
    mix_lat, mix_lng, tank_size_gal, target_gpa, water_gal,
    total_mix_gal, expected_acres,
    wind_speed_mph, wind_direction,
    signed_typed_name, signature_attested
  )
  select
    current_date, '12:00'::time, f.customer_id, f.id,
    36.37, -93.29, 150, 3.0, 125,
    150, 50,
    8, 'NW',
    'Test Applicator', true
  from f;

  select
    'snapshots populated: ' ||
    (customer_name_snapshot is not null and field_name_snapshot is not null)::text
    as result
  from public.mix_records
  order by created_at desc
  limit 1;

  select
    'submitted_by set: ' || (submitted_by is not null)::text as result
  from public.mix_records
  order by created_at desc
  limit 1;
rollback;

-- =============================================================
-- TEST 7: Snapshot trigger rejects field/customer mismatch
-- =============================================================
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'applicator@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);

  with ca as (insert into public.customers (name) values ('Customer A') returning id),
       cb as (insert into public.customers (name) values ('Customer B') returning id),
       fa as (
         insert into public.fields (customer_id, name)
         select id, 'A Field' from ca
         returning id
       )
  insert into public.mix_records (
    record_date, time_mixed,
    customer_id, field_id,
    mix_lat, mix_lng, tank_size_gal, target_gpa, water_gal,
    total_mix_gal, expected_acres,
    wind_speed_mph, wind_direction,
    signed_typed_name, signature_attested
  )
  select
    current_date, '12:00'::time,
    (select id from cb), (select id from fa),
    36.37, -93.29, 150, 3.0, 125,
    150, 50,
    8, 'NW',
    'Test', true;

  select 'TRIGGER FAILED — mismatch was allowed' as result;
exception when others then
  select 'trigger correctly rejected mismatch: ' || sqlerrm as result;
rollback;

-- =============================================================
-- TEST 8 (CORRECTED): Applicator can soft-delete OWN records
-- =============================================================
begin;
  do $$
  declare
    v_customer_id uuid;
    v_field_id uuid;
    v_mix_record_id uuid;
    v_deleted_count int;
  begin
    perform set_config(
      'request.jwt.claims',
      json_build_object(
        'sub', (select id from public.profiles where email = 'applicator@test.local'),
        'role', 'authenticated'
      )::text,
      true
    );
    perform set_config('role', 'authenticated', true);

    insert into public.customers (name)
    values ('Soft Delete Test')
    returning id into v_customer_id;

    insert into public.fields (customer_id, name)
    values (v_customer_id, 'F1')
    returning id into v_field_id;

    insert into public.mix_records (
      record_date, time_mixed, customer_id, field_id,
      mix_lat, mix_lng, tank_size_gal, target_gpa, water_gal,
      total_mix_gal, expected_acres,
      wind_speed_mph, wind_direction,
      signed_typed_name, signature_attested
    )
    values (
      current_date, '12:00'::time, v_customer_id, v_field_id,
      36, -93, 150, 3, 125, 150, 50,
      8, 'N', 'Test', true
    )
    returning id into v_mix_record_id;

    update public.mix_records
    set deleted_at = now()
    where id = v_mix_record_id
      and deleted_at is null;

    get diagnostics v_deleted_count = row_count;
    raise notice 'rows soft-deleted (expect 1): %', v_deleted_count;
  end;
  $$;
rollback;

-- =============================================================
-- TEST 9: Wind direction check constraint
-- =============================================================
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'admin@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);

  with c as (insert into public.customers (name) values ('WD Test') returning id),
       f as (
         insert into public.fields (customer_id, name)
         select id, 'F1' from c returning id
       )
  insert into public.mix_records (
    record_date, time_mixed,
    customer_id, field_id,
    mix_lat, mix_lng, tank_size_gal, target_gpa, water_gal,
    total_mix_gal, expected_acres,
    wind_speed_mph, wind_direction,
    signed_typed_name, signature_attested
  )
  select
    current_date, '12:00'::time,
    (select id from c), (select id from f),
    36, -93, 150, 3, 125, 150, 50,
    8, 'NORTH-NORTHEAST',
    'Test', true;

  select 'CHECK CONSTRAINT FAILED — invalid direction was allowed' as result;
exception when others then
  select 'check constraint correctly rejected: ' || sqlerrm as result;
rollback;

-- =============================================================
-- TEST 10a (CORRECTED): valid storage path accepted
-- =============================================================
begin;
  do $$
  declare
    v_customer_id uuid;
    v_field_id uuid;
    v_mix_record_id uuid;
    v_path text;
  begin
    perform set_config(
      'request.jwt.claims',
      json_build_object(
        'sub', (select id from public.profiles where email = 'applicator@test.local'),
        'role', 'authenticated'
      )::text,
      true
    );
    perform set_config('role', 'authenticated', true);

    insert into public.customers (name)
    values ('Photo Test Positive')
    returning id into v_customer_id;

    insert into public.fields (customer_id, name)
    values (v_customer_id, 'F1')
    returning id into v_field_id;

    insert into public.mix_records (
      record_date, time_mixed, customer_id, field_id,
      mix_lat, mix_lng, tank_size_gal, target_gpa, water_gal,
      total_mix_gal, expected_acres,
      wind_speed_mph, wind_direction,
      signed_typed_name, signature_attested
    )
    values (
      current_date, '12:00'::time, v_customer_id, v_field_id,
      36, -93, 150, 3, 125, 150, 50,
      8, 'N', 'Test', true
    )
    returning id into v_mix_record_id;

    v_path := v_mix_record_id::text || '/' || gen_random_uuid()::text || '.jpg';

    insert into public.mix_record_photos (mix_record_id, storage_path)
    values (v_mix_record_id, v_path);

    raise notice 'valid path accepted: %', v_path;
  end;
  $$;
rollback;

-- =============================================================
-- TEST 10b (CORRECTED): invalid storage path rejected
-- =============================================================
begin;
  do $$
  declare
    v_customer_id uuid;
    v_field_id uuid;
    v_mix_record_id uuid;
  begin
    perform set_config(
      'request.jwt.claims',
      json_build_object(
        'sub', (select id from public.profiles where email = 'applicator@test.local'),
        'role', 'authenticated'
      )::text,
      true
    );
    perform set_config('role', 'authenticated', true);

    insert into public.customers (name)
    values ('Photo Test Negative')
    returning id into v_customer_id;

    insert into public.fields (customer_id, name)
    values (v_customer_id, 'F1')
    returning id into v_field_id;

    insert into public.mix_records (
      record_date, time_mixed, customer_id, field_id,
      mix_lat, mix_lng, tank_size_gal, target_gpa, water_gal,
      total_mix_gal, expected_acres,
      wind_speed_mph, wind_direction,
      signed_typed_name, signature_attested
    )
    values (
      current_date, '12:00'::time, v_customer_id, v_field_id,
      36, -93, 150, 3, 125, 150, 50,
      8, 'N', 'Test', true
    )
    returning id into v_mix_record_id;

    begin
      insert into public.mix_record_photos (mix_record_id, storage_path)
      values (v_mix_record_id, 'not-a-uuid/also-not.jpg');

      raise notice 'CHECK FAILED — invalid path was accepted';
    exception when others then
      raise notice 'invalid path correctly rejected: %', sqlerrm;
    end;
  end;
  $$;
rollback;

-- =============================================================
-- TEST 11: Full-text search works against snapshots + notes
-- =============================================================
begin;
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', (select id from public.profiles where email = 'admin@test.local'),
      'role', 'authenticated'
    )::text,
    true
  );
  select set_config('role', 'authenticated', true);

  with c as (insert into public.customers (name) values ('Widner Farms') returning id),
       f as (
         insert into public.fields (customer_id, name)
         select id, 'Combs' from c returning id
       )
  insert into public.mix_records (
    record_date, time_mixed, customer_id, field_id,
    mix_lat, mix_lng, tank_size_gal, target_gpa, water_gal,
    total_mix_gal, expected_acres,
    wind_speed_mph, wind_direction,
    signed_typed_name, signature_attested,
    notes
  )
  select
    current_date, '12:00'::time,
    (select id from c), (select id from f),
    36, -93, 150, 3, 125, 150, 50,
    8, 'N', 'Test', true,
    'fence row treatment'
  from c, f;

  select 'search for "widner" hits: ' || count(*)::text
  from public.mix_records
  where search_vector @@ to_tsquery('english', 'widner');

  select 'search for "fence" hits: ' || count(*)::text
  from public.mix_records
  where search_vector @@ to_tsquery('english', 'fence');

  select 'search for "missing-word" hits: ' || count(*)::text
  from public.mix_records
  where search_vector @@ to_tsquery('english', 'xyzzy');
rollback;

-- =============================================================
-- Done. If every test produced its expected success/failure
-- message, RLS + triggers + constraints are working as designed.
-- =============================================================
