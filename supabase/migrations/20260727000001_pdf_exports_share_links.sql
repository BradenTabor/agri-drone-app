-- Time-limited PDF export storage for shareable links (no login required for recipients).
-- Files live under {user_id}/{token}.pdf; signed URLs are minted by the app API.
-- Note: revoked_at is audit-only; invalidating access requires deleting the storage object
-- (signed URLs remain valid until their TTL expires).

insert into storage.buckets (id, name, public, file_size_limit)
values ('pdf-exports', 'pdf-exports', false, 26214400)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit;

drop policy if exists "pdf_exports_select_own" on storage.objects;
create policy "pdf_exports_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pdf-exports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "pdf_exports_insert_own" on storage.objects;
create policy "pdf_exports_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pdf-exports'
  and (storage.foldername(name))[1] = auth.uid()::text
  and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.pdf$'
);

drop policy if exists "pdf_exports_update_own" on storage.objects;
create policy "pdf_exports_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'pdf-exports'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'pdf-exports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "pdf_exports_delete_own" on storage.objects;
create policy "pdf_exports_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pdf-exports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Optional metadata for audit (signed URLs still work from storage alone).
create table if not exists public.document_share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_kind text not null check (document_kind in ('mix_record', 'app_record', 'quote')),
  document_id uuid not null,
  storage_path text not null,
  filename text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_document_share_links_user_id
  on public.document_share_links (user_id);

create index if not exists idx_document_share_links_document
  on public.document_share_links (document_kind, document_id);

create index if not exists idx_document_share_links_expires_at
  on public.document_share_links (expires_at);

alter table public.document_share_links enable row level security;

drop policy if exists "document_share_links_select_own" on public.document_share_links;
create policy "document_share_links_select_own"
on public.document_share_links
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "document_share_links_insert_own" on public.document_share_links;
create policy "document_share_links_insert_own"
on public.document_share_links
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "document_share_links_update_own" on public.document_share_links;
create policy "document_share_links_update_own"
on public.document_share_links
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "document_share_links_delete_own" on public.document_share_links;
create policy "document_share_links_delete_own"
on public.document_share_links
for delete
to authenticated
using (user_id = auth.uid());
