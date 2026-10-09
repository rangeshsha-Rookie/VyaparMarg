insert into public.schemes (
  id,
  slug,
  name,
  short_description,
  authority,
  official_portal_url,
  supported_languages,
  source_url,
  last_verified_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'pmegp',
    'Prime Minister''s Employment Generation Programme',
    'Credit-linked support for eligible new micro-enterprises in manufacturing and services.',
    'Khadi and Village Industries Commission',
    'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
    array['hi', 'en'],
    'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp',
    timezone('utc', now())
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'pmfme',
    'PM Formalisation of Micro Food Processing Enterprises',
    'Credit-linked support and formalisation assistance for eligible micro food-processing units.',
    'Ministry of Food Processing Industries',
    'https://pmfme.mofpi.gov.in/pmfme/',
    array['hi', 'en'],
    'https://pmfme.mofpi.gov.in/pmfme/',
    timezone('utc', now())
  );

insert into public.scheme_requirements (scheme_id, requirement_key, label, data_type, required, help_text)
values
  ('11111111-1111-1111-1111-111111111111', 'business_type', 'Business activity type', 'text', true, 'Used to check whether the proposed activity fits the scheme.'),
  ('11111111-1111-1111-1111-111111111111', 'state', 'Business state', 'text', true, 'State is required for portal and nodal-agency guidance.'),
  ('22222222-2222-2222-2222-222222222222', 'business_type', 'Business activity type', 'text', true, 'Food-processing activity is required for this starter match.'),
  ('22222222-2222-2222-2222-222222222222', 'state', 'Business state', 'text', true, 'State is required for portal and nodal-agency guidance.');

insert into public.scheme_rules (scheme_id, rule_key, operator, expected_value, explanation, priority)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'business_type',
    'in',
    '["manufacturing", "service", "retail", "dairy", "food_processing"]'::jsonb,
    'The activity is in the starter set of micro-enterprise categories supported by this catalog entry.',
    10
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'business_type',
    'in',
    '["food_processing", "dairy", "bakery", "spices", "pickle", "snacks"]'::jsonb,
    'The business activity is in the starter set of food-processing categories.',
    10
  );
