alter table public.app_records
  add column if not exists app_type text check (app_type in ('spraying', 'spreading'));
