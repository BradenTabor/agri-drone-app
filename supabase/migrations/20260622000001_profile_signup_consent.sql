alter table public.profiles
add column if not exists data_consent_at timestamptz;

comment on column public.profiles.data_consent_at is
  'Timestamp when the user consented to data storage and operational communications.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_license text;
  v_consent boolean;
begin
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  v_license := nullif(trim(coalesce(new.raw_user_meta_data->>'license_cert_no', '')), '');
  v_consent := coalesce((new.raw_user_meta_data->>'data_consent')::boolean, false);

  insert into public.profiles (id, email, phone, license_cert_no, data_consent_at)
  values (
    new.id,
    new.email,
    v_phone,
    v_license,
    case when v_consent then now() else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
