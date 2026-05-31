create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text,
  status text not null default 'draft'
    check (status in ('draft','sent','accepted','declined')),
  customer_id uuid references public.customers(id),
  field_id uuid references public.fields(id),
  customer_name text not null,
  source_app_record_id uuid references public.app_records(id),
  quote_date date not null,
  valid_until date,
  acres numeric,
  notes text,
  terms text,
  subtotal numeric not null default 0,
  total numeric not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  sort_order int not null default 0,
  kind text not null default 'custom'
    check (kind in ('aerial','product','fee','custom')),
  product_id uuid references public.products(id),
  description text not null,
  basis text not null default 'flat'
    check (basis in ('per_acre','flat')),
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_quotes_updated_at on public.quotes;
create trigger set_quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

drop trigger if exists set_quote_line_items_updated_at on public.quote_line_items;
create trigger set_quote_line_items_updated_at
  before update on public.quote_line_items
  for each row execute function public.set_updated_at();

create index if not exists idx_quotes_customer on public.quotes (customer_id);
create index if not exists idx_quotes_status_date on public.quotes (status, quote_date desc);
create index if not exists idx_quote_line_items_quote on public.quote_line_items (quote_id, sort_order);

alter table public.quotes enable row level security;
alter table public.quote_line_items enable row level security;

drop policy if exists "Authenticated users can manage quotes" on public.quotes;
create policy "Authenticated users can manage quotes"
  on public.quotes for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage quote line items" on public.quote_line_items;
create policy "Authenticated users can manage quote line items"
  on public.quote_line_items for all to authenticated using (true) with check (true);
