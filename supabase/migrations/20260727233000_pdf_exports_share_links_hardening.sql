-- Harden PDF export share storage: size cap + expiry index for cleanup jobs.
update storage.buckets
set file_size_limit = 26214400
where id = 'pdf-exports';

create index if not exists idx_document_share_links_expires_at
  on public.document_share_links (expires_at);
