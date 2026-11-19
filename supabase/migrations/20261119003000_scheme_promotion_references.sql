-- Add explicit verification status compatibility and preserve staging provenance
-- on promoted public scheme records.

alter table public.scheme_import_staging
  add column if not exists verification_status text;

update public.scheme_import_staging
set verification_status = status
where verification_status is null;

alter table public.scheme_import_staging
  alter column verification_status set default 'pending',
  alter column verification_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'scheme_import_staging_verification_status_check'
  ) then
    alter table public.scheme_import_staging
      add constraint scheme_import_staging_verification_status_check
      check (verification_status in ('pending', 'verified', 'rejected'));
  end if;
end
$$;

alter table public.schemes
  add column if not exists source_document_id uuid
    references public.scheme_import_documents(id) on delete set null,
  add column if not exists source_document_sha256 char(64);

create index if not exists schemes_source_document_id_idx
  on public.schemes(source_document_id);
