-- vyaparmarg initial schema hardening
-- purpose: close the public execute path for the auth trigger and add
-- covering indexes for foreign keys identified by Supabase advisors.

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create index applications_scheme_id_idx on public.applications(scheme_id);
create index conversations_business_profile_id_idx on public.conversations(business_profile_id);
create index messages_user_id_idx on public.messages(user_id);
create index recommendation_items_scheme_id_idx on public.recommendation_items(scheme_id);
create index recommendations_conversation_id_idx on public.recommendations(conversation_id);
