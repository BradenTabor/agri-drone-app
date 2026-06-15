create table if not exists public.form_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  form_type text not null check (form_type in ('mix-record', 'app-record')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, form_type)
);

create trigger set_form_drafts_updated_at
  before update on public.form_drafts
  for each row execute function public.set_updated_at();

create index if not exists idx_form_drafts_user_type on public.form_drafts (user_id, form_type);

alter table public.form_drafts enable row level security;

create policy "Users manage own form drafts"
  on public.form_drafts for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
