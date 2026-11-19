-- VyaparMarg scheme import staging
-- Derived data is isolated from public scheme records until separately verified.

create or replace function public.is_vyaparmarg_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke execute on function public.is_vyaparmarg_admin() from public, anon, authenticated;
grant execute on function public.is_vyaparmarg_admin() to authenticated;

create table public.scheme_import_documents (
  id uuid primary key default gen_random_uuid(),
  source_path text not null,
  source_name text not null,
  sha256 char(64) not null,
  size_bytes bigint not null check (size_bytes >= 0),
  page_count integer check (page_count is null or page_count >= 0),
  text_chars integer check (text_chars is null or text_chars >= 0),
  source_url text,
  retrieved_at timestamptz,
  raw_snapshot_path text,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'completed', 'failed')),
  extraction_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (sha256)
);

create index scheme_import_documents_sha256_idx
  on public.scheme_import_documents(sha256);
create index scheme_import_documents_extraction_status_idx
  on public.scheme_import_documents(extraction_status);

create table public.scheme_import_staging (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null
    references public.scheme_import_documents(id) on delete cascade,
  proposed_slug text,
  proposed_name text,
  extracted_sections jsonb not null default '{}'::jsonb,
  proposed_record jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index scheme_import_staging_document_id_idx
  on public.scheme_import_staging(document_id);
create index scheme_import_staging_status_idx
  on public.scheme_import_staging(status);

create table public.scheme_import_reviews (
  id uuid primary key default gen_random_uuid(),
  staging_id uuid not null
    references public.scheme_import_staging(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  status text not null check (status in ('pending', 'verified', 'rejected')),
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index scheme_import_reviews_staging_id_idx
  on public.scheme_import_reviews(staging_id);
create index scheme_import_reviews_reviewer_id_idx
  on public.scheme_import_reviews(reviewer_id);

create trigger scheme_import_documents_set_updated_at
  before update on public.scheme_import_documents
  for each row execute function public.set_updated_at();

create trigger scheme_import_staging_set_updated_at
  before update on public.scheme_import_staging
  for each row execute function public.set_updated_at();

alter table public.scheme_import_documents enable row level security;
alter table public.scheme_import_staging enable row level security;
alter table public.scheme_import_reviews enable row level security;

alter table public.scheme_import_documents force row level security;
alter table public.scheme_import_staging force row level security;
alter table public.scheme_import_reviews force row level security;

create policy scheme_import_documents_admin_select
  on public.scheme_import_documents for select to authenticated
  using (public.is_vyaparmarg_admin());

create policy scheme_import_documents_admin_insert
  on public.scheme_import_documents for insert to authenticated
  with check (public.is_vyaparmarg_admin());

create policy scheme_import_documents_admin_update
  on public.scheme_import_documents for update to authenticated
  using (public.is_vyaparmarg_admin())
  with check (public.is_vyaparmarg_admin());

create policy scheme_import_staging_admin_select
  on public.scheme_import_staging for select to authenticated
  using (public.is_vyaparmarg_admin());

create policy scheme_import_staging_admin_insert
  on public.scheme_import_staging for insert to authenticated
  with check (public.is_vyaparmarg_admin());

create policy scheme_import_staging_admin_update
  on public.scheme_import_staging for update to authenticated
  using (public.is_vyaparmarg_admin())
  with check (public.is_vyaparmarg_admin());

create policy scheme_import_reviews_admin_select
  on public.scheme_import_reviews for select to authenticated
  using (public.is_vyaparmarg_admin());

create policy scheme_import_reviews_admin_insert
  on public.scheme_import_reviews for insert to authenticated
  with check (
    public.is_vyaparmarg_admin()
    and reviewer_id = (select auth.uid())
  );

create policy scheme_import_reviews_admin_update
  on public.scheme_import_reviews for update to authenticated
  using (
    public.is_vyaparmarg_admin()
    and reviewer_id = (select auth.uid())
  )
  with check (
    public.is_vyaparmarg_admin()
    and reviewer_id = (select auth.uid())
  );

grant select, insert, update on public.scheme_import_documents
  to authenticated;
grant select, insert, update on public.scheme_import_staging
  to authenticated;
grant select, insert, update on public.scheme_import_reviews
  to authenticated;

-- Deliberately no foreign key or promotion procedure targets public.schemes.
