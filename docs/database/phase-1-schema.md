# VyaparMarg Phase 1 database schema

The migration in `supabase/migrations/20261008170541_initial_schema.sql` supports the first vertical slice.

## Ownership model

- `profiles`, `business_profiles`, `documents`, `conversations`, `messages`, `recommendations`, and `applications` are user-owned.
- `schemes`, `scheme_requirements`, and `scheme_rules` are a public read-only catalog maintained by the backend/admin path.
- Every public table has RLS enabled.
- The mobile app and extension must never receive the Supabase service-role key.

## First slice tables

1. `profiles` — language and identity preferences.
2. `business_profiles` — structured rural-business information.
3. `schemes` — verified official scheme catalog.
4. `scheme_requirements` and `scheme_rules` — explainable eligibility inputs and rules.
5. `recommendations` and `recommendation_items` — deterministic recommendation results with reasons.
6. `applications` — portal navigation and progress state.
7. `documents` — metadata only; file bytes belong in Supabase Storage.
8. `conversations` and `messages` — assistant history.
