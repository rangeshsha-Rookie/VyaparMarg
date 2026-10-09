-- vyaparmarg initial schema
-- purpose: support the rural business assistant vertical slice
-- security: every public table has row level security enabled

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'hi' check (preferred_language in ('mr', 'hi', 'en', 'hinglish')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text,
  business_type text not null,
  state text not null,
  district text,
  pincode text,
  annual_turnover numeric(14, 2),
  employee_count integer check (employee_count is null or employee_count >= 0),
  registration_status text,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index business_profiles_user_id_idx on public.business_profiles(user_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id) on delete cascade,
  document_type text not null,
  storage_bucket text not null default 'user-documents',
  storage_path text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  extracted_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index documents_user_id_idx on public.documents(user_id);
create index documents_business_profile_id_idx on public.documents(business_profile_id);

create table public.schemes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null,
  authority text,
  official_portal_url text not null,
  supported_languages text[] not null default array['hi', 'en'],
  active boolean not null default true,
  source_url text,
  last_verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index schemes_active_idx on public.schemes(active);

create table public.scheme_requirements (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  requirement_key text not null,
  label text not null,
  data_type text not null default 'text',
  required boolean not null default true,
  help_text text,
  unique (scheme_id, requirement_key)
);

create table public.scheme_rules (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  rule_key text not null,
  operator text not null check (operator in ('equals', 'not_equals', 'in', 'gte', 'lte', 'contains', 'exists')),
  expected_value jsonb not null,
  explanation text not null,
  priority integer not null default 100,
  unique (scheme_id, rule_key)
);

create index scheme_requirements_scheme_id_idx on public.scheme_requirements(scheme_id);
create index scheme_rules_scheme_id_idx on public.scheme_rules(scheme_id);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id) on delete set null,
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index conversations_user_id_idx on public.conversations(user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  language text,
  structured_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index messages_conversation_id_created_at_idx on public.messages(conversation_id, created_at);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  query_text text not null,
  query_language text,
  extracted_profile jsonb not null default '{}'::jsonb,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default timezone('utc', now())
);

create index recommendations_user_id_idx on public.recommendations(user_id);
create index recommendations_business_profile_id_idx on public.recommendations(business_profile_id);

create table public.recommendation_items (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  scheme_id uuid not null references public.schemes(id) on delete restrict,
  rank integer not null check (rank > 0),
  score numeric(5, 2),
  eligibility_status text not null check (eligibility_status in ('eligible', 'likely', 'ineligible', 'needs_information')),
  reasons jsonb not null default '[]'::jsonb,
  missing_requirements text[] not null default '{}',
  unique (recommendation_id, scheme_id)
);

create index recommendation_items_recommendation_id_rank_idx on public.recommendation_items(recommendation_id, rank);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  scheme_id uuid not null references public.schemes(id) on delete restrict,
  status text not null default 'planned' check (status in ('planned', 'started', 'in_progress', 'submitted', 'completed', 'abandoned')),
  official_application_id text,
  portal_url text not null,
  last_step text,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index applications_user_id_idx on public.applications(user_id);
create index applications_business_profile_id_idx on public.applications(business_profile_id);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger business_profiles_set_updated_at before update on public.business_profiles
for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents
for each row execute function public.set_updated_at();
create trigger schemes_set_updated_at before update on public.schemes
for each row execute function public.set_updated_at();
create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications
for each row execute function public.set_updated_at();

-- Keep a public profile row synchronized with Supabase Auth users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS is enabled for every exposed table.
alter table public.profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.documents enable row level security;
alter table public.schemes enable row level security;
alter table public.scheme_requirements enable row level security;
alter table public.scheme_rules enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.recommendations enable row level security;
alter table public.recommendation_items enable row level security;
alter table public.applications enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy business_profiles_select_own on public.business_profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy business_profiles_insert_own on public.business_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy business_profiles_update_own on public.business_profiles for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy business_profiles_delete_own on public.business_profiles for delete to authenticated
using ((select auth.uid()) = user_id);

create policy documents_select_own on public.documents for select to authenticated
using ((select auth.uid()) = user_id);
create policy documents_insert_own on public.documents for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy documents_update_own on public.documents for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy documents_delete_own on public.documents for delete to authenticated
using ((select auth.uid()) = user_id);

create policy schemes_read_active on public.schemes for select to anon, authenticated
using (active = true);
create policy scheme_requirements_read on public.scheme_requirements for select to anon, authenticated
using (exists (select 1 from public.schemes where schemes.id = scheme_requirements.scheme_id and schemes.active));
create policy scheme_rules_read on public.scheme_rules for select to anon, authenticated
using (exists (select 1 from public.schemes where schemes.id = scheme_rules.scheme_id and schemes.active));

create policy conversations_select_own on public.conversations for select to authenticated
using ((select auth.uid()) = user_id);
create policy conversations_insert_own on public.conversations for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy conversations_update_own on public.conversations for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy conversations_delete_own on public.conversations for delete to authenticated
using ((select auth.uid()) = user_id);

create policy messages_select_own on public.messages for select to authenticated
using ((select auth.uid()) = user_id);
create policy messages_insert_own on public.messages for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy recommendations_select_own on public.recommendations for select to authenticated
using ((select auth.uid()) = user_id);
create policy recommendations_insert_own on public.recommendations for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy recommendation_items_select_own on public.recommendation_items for select to authenticated
using (exists (select 1 from public.recommendations where recommendations.id = recommendation_items.recommendation_id and recommendations.user_id = (select auth.uid())));

create policy applications_select_own on public.applications for select to authenticated
using ((select auth.uid()) = user_id);
create policy applications_insert_own on public.applications for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy applications_update_own on public.applications for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy applications_delete_own on public.applications for delete to authenticated
using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.schemes, public.scheme_requirements, public.scheme_rules to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.business_profiles, public.documents, public.conversations, public.messages, public.recommendations, public.recommendation_items, public.applications to authenticated;
