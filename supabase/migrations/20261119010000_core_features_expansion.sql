-- VyaparMarg Core Features Expansion Migration
-- Adds Marketplaces, Digital Tools, Portal Guidance, District Indicators, and Expanded Maharashtra Schemes

-- 1. Marketplaces Table
create table if not exists public.marketplaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null, -- 'b2b', 'b2c', 'government_procurement', 'handicrafts_rural'
  description text not null,
  target_sectors text[] not null default '{}',
  onboarding_url text not null,
  commission_model text not null,
  benefits text[] not null default '{}',
  required_documents text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketplaces_active_idx on public.marketplaces(active);
create index if not exists marketplaces_category_idx on public.marketplaces(category);

-- 2. Digital Tools Table
create table if not exists public.digital_tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tool_type text not null, -- 'accounting_invoicing', 'digital_payments', 'logistics_shipping', 'marketing'
  pricing_tier text not null, -- 'free', 'freemium', 'paid'
  description text not null,
  best_for text not null,
  official_url text not null,
  supported_languages text[] not null default array['mr', 'hi', 'en'],
  features text[] not null default '{}',
  offline_support boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists digital_tools_active_idx on public.digital_tools(active);
create index if not exists digital_tools_tool_type_idx on public.digital_tools(tool_type);

-- 3. Portal Guidance Table
create table if not exists public.portal_guides (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null unique,
  portal_name text not null,
  official_url text not null,
  department text not null,
  state text not null default 'Maharashtra',
  description text not null,
  steps jsonb not null default '[]'::jsonb,
  prerequisites text[] not null default '{}',
  helpdesk_contact text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 4. District Indicators Table (Open Government Data - Maharashtra Clusters)
create table if not exists public.district_indicators (
  id uuid primary key default gen_random_uuid(),
  state text not null default 'Maharashtra',
  district text not null,
  indicator_key text not null,
  indicator_name text not null,
  indicator_value text not null,
  unit text,
  period text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique(state, district, indicator_key, period)
);

create index if not exists district_indicators_district_idx on public.district_indicators(state, district);

-- Enable RLS
alter table public.marketplaces enable row level security;
alter table public.digital_tools enable row level security;
alter table public.portal_guides enable row level security;
alter table public.district_indicators enable row level security;

-- Read policies for authenticated and anon users
create policy "Allow read on active marketplaces" on public.marketplaces for select using (active = true);
create policy "Allow read on active digital tools" on public.digital_tools for select using (active = true);
create policy "Allow read on active portal guides" on public.portal_guides for select using (active = true);
create policy "Allow read on district indicators" on public.district_indicators for select using (true);

-- 5. Seed Verified Maharashtra & Central Schemes
insert into public.schemes (id, slug, name, short_description, authority, official_portal_url, supported_languages, source_url, last_verified_at)
values
  (
    '33333333-3333-3333-3333-333333333333',
    'cmegp-mah',
    'Chief Minister Employment Generation Programme (CMEGP Maharashtra)',
    'Government of Maharashtra subsidy providing up to 50 Lakh for manufacturing & 10 Lakh for service micro-units with 15% to 35% margin money assistance.',
    'Directorate of Industries, Government of Maharashtra',
    'https://mahadiscom.in/cmegp/',
    array['mr', 'hi', 'en'],
    'https://mahadiscom.in/cmegp/',
    timezone('utc', now())
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'pmsvanidhi',
    'PM Street Vendor''s AtmaNirbhar Nidhi (PM SVANidhi)',
    'Special micro-credit facility providing affordable collateral-free working capital loan up to 50,000 INR with 7% interest subsidy for micro vendors.',
    'Ministry of Housing and Urban Affairs',
    'https://pmsvanidhi.mohua.gov.in/',
    array['hi', 'en', 'mr'],
    'https://pmsvanidhi.mohua.gov.in/',
    timezone('utc', now())
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'mudra-shishu-kishore',
    'Pradhan Mantri MUDRA Yojana (PMMY)',
    'Institutional collateral-free micro-credit for non-corporate micro-enterprises up to 10 Lakh INR under Shishu, Kishore, and Tarun categories.',
    'MUDRA Ltd / Department of Financial Services',
    'https://www.mudra.org.in/',
    array['hi', 'en', 'mr'],
    'https://www.mudra.org.in/',
    timezone('utc', now())
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'stand-up-india',
    'Stand-Up India Scheme for Women and SC/ST Entrepreneurs',
    'Bank loan between 10 Lakh INR and 1 Crore INR to at least one SC/ST and one Woman borrower per bank branch for setting up greenfield enterprises.',
    'Department of Financial Services / SIDBI',
    'https://www.standupmitra.in/',
    array['hi', 'en', 'mr'],
    'https://www.standupmitra.in/',
    timezone('utc', now())
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'mahadbt-agro-processing',
    'MahaDBT Rural Agro-Processing & Farm Mechanization Subsidy',
    'Financial capital assistance up to 50% for farmers and rural agri-enterprises setting up primary agro-processing and post-harvest facilities in Maharashtra.',
    'Department of Agriculture, Government of Maharashtra',
    'https://mahadbt.maharashtra.gov.in/',
    array['mr', 'en'],
    'https://mahadbt.maharashtra.gov.in/',
    timezone('utc', now())
  )
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  authority = excluded.authority,
  official_portal_url = excluded.official_portal_url,
  supported_languages = excluded.supported_languages,
  last_verified_at = timezone('utc', now());

-- Requirements for new schemes
insert into public.scheme_requirements (scheme_id, requirement_key, label, data_type, required, help_text)
values
  ('33333333-3333-3333-3333-333333333333', 'business_type', 'Business activity type', 'text', true, 'Manufacturing or service micro-enterprise.'),
  ('33333333-3333-3333-3333-333333333333', 'state', 'Business state', 'text', true, 'Must be established in Maharashtra.'),
  ('44444444-4444-4444-4444-444444444444', 'business_type', 'Business activity type', 'text', true, 'Retail, street vending, or micro-service.'),
  ('55555555-5555-5555-5555-555555555555', 'business_type', 'Business activity type', 'text', true, 'Any income-generating micro-business in non-farming sector.'),
  ('66666666-6666-6666-6666-666666666666', 'business_type', 'Business activity type', 'text', true, 'Manufacturing, services, or trading greenfield enterprise.'),
  ('77777777-7777-7777-7777-777777777777', 'business_type', 'Business activity type', 'text', true, 'Agro-processing, food preservation, or farm machinery.'),
  ('77777777-7777-7777-7777-777777777777', 'state', 'Business state', 'text', true, 'Must operate within Maharashtra rural districts.')
on conflict (scheme_id, requirement_key) do nothing;

-- Rules for new schemes
insert into public.scheme_rules (scheme_id, rule_key, operator, expected_value, explanation, priority)
values
  (
    '33333333-3333-3333-3333-333333333333',
    'state',
    'equals',
    '"maharashtra"'::jsonb,
    'CMEGP requires applicant and enterprise location to be in Maharashtra.',
    1
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'business_type',
    'in',
    '["manufacturing", "service", "retail", "dairy", "food_processing", "agro_processing", "handicraft", "textile"]'::jsonb,
    'Business activity qualifies for CMEGP Maharashtra funding.',
    5
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'business_type',
    'in',
    '["retail", "vending", "street_vendor", "micro_retail", "handicraft", "service"]'::jsonb,
    'Qualifies for PM SVANidhi micro-credit working capital loan.',
    10
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'business_type',
    'in',
    '["manufacturing", "service", "retail", "dairy", "food_processing", "agro_processing", "handicraft", "textile", "vending"]'::jsonb,
    'Micro-enterprises qualify for PMMY MUDRA collateral-free loan.',
    10
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'business_type',
    'in',
    '["manufacturing", "service", "retail", "food_processing", "agro_processing"]'::jsonb,
    'Qualifies for Stand-Up India financing for eligible women/SC/ST entrepreneurs.',
    10
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'state',
    'equals',
    '"maharashtra"'::jsonb,
    'MahaDBT agro schemes apply exclusively to Maharashtra.',
    1
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'business_type',
    'in',
    '["agro_processing", "food_processing", "dairy", "farming", "agriculture", "horticulture", "spices", "jaggery"]'::jsonb,
    'Activity qualifies for MahaDBT rural agro-processing subsidy.',
    5
  )
on conflict (scheme_id, rule_key) do nothing;

-- 6. Seed Marketplaces
insert into public.marketplaces (slug, name, category, description, target_sectors, onboarding_url, commission_model, benefits, required_documents)
values
  (
    'ondc',
    'Open Network for Digital Commerce (ONDC)',
    'b2c',
    'Government-backed open e-commerce protocol allowing rural sellers to sell across multiple buyer apps (Paytm, Magicpin, Mystore) with minimal commission.',
    array['retail', 'grocery', 'agro_processing', 'handicraft', 'food_processing'],
    'https://ondc.org/seller-network/',
    'Low network fee (1-3%) compared to traditional 15-25% private e-commerce',
    array['Zero lock-in with single platforms', 'Direct customer relationship', 'Local neighborhood and nationwide delivery'],
    array['Udyam Registration', 'GSTIN (or PAN exemption for micro-turnover)', 'Bank Account Details']
  ),
  (
    'gem',
    'Government e-Marketplace (GeM)',
    'government_procurement',
    'National procurement portal where rural entrepreneurs, SHGs, and MSMEs directly sell goods and services to central and state government departments.',
    array['manufacturing', 'furniture', 'handicraft', 'textile', 'office_supplies', 'agro_products'],
    'https://gem.gov.in/',
    '0% transaction fee for orders up to ₹20 Lakh',
    array['Mandatory 25% annual government procurement from MSMEs', 'Special Womaniya and Saras SHG storefronts', 'Direct timely payments into verified bank accounts'],
    array['Udyam Certificate', 'PAN Card', 'GSTIN', 'Cancelled Cheque']
  ),
  (
    'amazon-karigar',
    'Amazon Karigar & Saheli',
    'handicrafts_rural',
    'Dedicated storefront for rural artisans, weavers, and women micro-entrepreneurs across Maharashtra with subsidized fees and cataloging support.',
    array['handicraft', 'handloom', 'textile', 'pottery', 'woodcraft', 'organic_food'],
    'https://www.amazon.in/b?node=12415848031',
    'Subsidized referral fee for initial 12 months for registered rural artisans',
    array['National visibility to 100M+ customers', 'Free product photography & listing assistance', 'Amazon Prime delivery access'],
    array['Artisan Card / Udyam / SHG Certificate', 'Bank Account', 'PAN Card']
  ),
  (
    'indiamart',
    'IndiaMART Rural Wholesale B2B',
    'b2b',
    'Leading Indian B2B marketplace to find wholesale buyers, bulk retailers, and distributors for rural agricultural and manufactured goods.',
    array['manufacturing', 'agro_processing', 'jaggery', 'spices', 'dairy', 'packaging'],
    'https://seller.indiamart.com/',
    'Free basic tier; subscription fee for verified buyer lead calls',
    array['High-volume wholesale bulk inquiries', 'Verified business leads', 'Direct buyer contact via call and WhatsApp'],
    array['Business PAN', 'GSTIN or Business Registration', 'Bank Details']
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  onboarding_url = excluded.onboarding_url,
  commission_model = excluded.commission_model;

-- 7. Seed Digital Tools
insert into public.digital_tools (slug, name, tool_type, pricing_tier, description, best_for, official_url, supported_languages, features, offline_support)
values
  (
    'khatabook',
    'Khatabook (खाताबुक)',
    'accounting_invoicing',
    'freemium',
    'Digital ledger app for micro-merchants and rural shopkeepers to record credit (Udhar), generate payment reminder WhatsApp messages, and track receivables.',
    'Daily bookkeeping, Udhar credit tracking, and automatic customer collection reminders in regional languages.',
    'https://khatabook.com/',
    array['mr', 'hi', 'en'],
    array['Automated WhatsApp Udhar reminders', 'PDF customer statements', 'UPI collection QR code integration', 'Automatic cloud backup'],
    true
  ),
  (
    'vyapar-app',
    'Vyapar App (व्यापार)',
    'accounting_invoicing',
    'freemium',
    'Simplified GST and non-GST billing, inventory management, and profit-and-loss accounting software designed for small Indian businesses.',
    'Inventory stock management, barcode scanning, print invoices on mobile thermal printers, and GST reports.',
    'https://vyaparapp.in/',
    array['mr', 'hi', 'en'],
    array['Thermal invoice printing', 'Stock low-inventory alerts', 'GSTR-1 & GSTR-3B report generation', 'Works 100% offline'],
    true
  ),
  (
    'google-pay-business',
    'Google Pay for Business (व्यापारी पेमेंट)',
    'digital_payments',
    'free',
    'Zero-fee QR payment acceptance for micro-retailers with instant audio soundbox confirmation and daily automatic bank settlement.',
    'Instant contactless payments, zero MDR fees on UPI, customer loyalty stamps, and access to quick merchant credit lines.',
    'https://pay.google.com/intl/en_in/about/business/',
    array['mr', 'hi', 'en'],
    array['Soundbox voice alert in Marathi and Hindi', '0% MDR on UPI payments', 'Daily instant settlement into savings or current account'],
    false
  ),
  (
    'shiprocket',
    'Shiprocket Rural Logistics Aggregator',
    'logistics_shipping',
    'freemium',
    'Multi-carrier automated shipping platform (Delhivery, BlueDart, DTDC, India Post Speed Post) with door pickup in rural talukas.',
    'Shipping manufactured or packaged products directly to customers across India with Cash on Delivery (COD) collection.',
    'https://www.shiprocket.in/',
    array['hi', 'en'],
    array['Automated courier rate comparison', 'Cash on Delivery (COD) processing with fast remittance', 'Doorstep pickup in tier-2/3/4 towns', 'Post office integration'],
    false
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  best_for = excluded.best_for,
  official_url = excluded.official_url;

-- 8. Seed Portal Guides
insert into public.portal_guides (portal_slug, portal_name, official_url, department, state, description, steps, prerequisites, helpdesk_contact)
values
  (
    'aaple-sarkar',
    'Aaple Sarkar Portal (आपले सरकार)',
    'https://aaplesarkar.mahaonline.gov.in/',
    'Revenue & Industries Department, Maharashtra',
    'Maharashtra',
    'The unified citizen and business service portal for Government of Maharashtra, providing domicile certificates, caste certificates, and shop act licenses.',
    '[
      {"step_number": 1, "title": "Citizen Registration", "description": "Create an account using your Aadhaar-linked mobile number on aaplesarkar.mahaonline.gov.in."},
      {"step_number": 2, "title": "Select Department", "description": "Choose Revenue Department for Domicile/Caste Certificate or Industries Department for business clearances."},
      {"step_number": 3, "title": "Fill Application Form", "description": "Enter business applicant details, address, and taluka. Verify all Marathi spelling translations."},
      {"step_number": 4, "title": "Upload Verified Documents", "description": "Upload scanned copy of Ration Card/Electricity Bill, School Leaving Certificate, and Self-Declaration."},
      {"step_number": 5, "title": "Payment & Token", "description": "Pay government nominal fee (₹23 - ₹33) online and save the Application ID / Token Number for tracking."}
    ]'::jsonb,
    array['Aadhaar Card with active mobile link', 'Maharashtra Address Proof', 'School Leaving Certificate', 'Passport Photo (under 50KB)'],
    '1800-120-8040 (Toll Free MahaOnline Helpdesk)'
  ),
  (
    'mahadbt',
    'MahaDBT Farmer & Agro Portal (महाडीबीटी)',
    'https://mahadbt.maharashtra.gov.in/',
    'Agriculture Department, Maharashtra',
    'Maharashtra',
    'Direct Benefit Transfer portal of Maharashtra for agricultural subsidies, farm equipment, micro-irrigation, and agro-processing schemes.',
    '[
      {"step_number": 1, "title": "Aadhaar Authentication", "description": "Login with your Aadhaar number and OTP verification."},
      {"step_number": 2, "title": "Link Land Records (7/12 & 8A)", "description": "Verify your digital 7/12 extract from MahaBhulekh within the portal."},
      {"step_number": 3, "title": "Select Scheme Category", "description": "Choose Agriculture Mechanization (कृषी यांत्रिकीकरण) or Agro-Processing."},
      {"step_number": 4, "title": "Lottery & Allotment", "description": "Applications are selected via automated computer lottery. Receive SMS upon allotment."},
      {"step_number": 5, "title": "Pre-Sanction & Purchase", "description": "Upload quotation from registered dealer, obtain Pre-Sanction, purchase machinery, and upload invoice for direct subsidy disbursement."}
    ]'::jsonb,
    array['Digital 7/12 and 8A Extract', 'Aadhaar Linked Bank Passbook', 'Caste Certificate (if claiming SC/ST bonus)'],
    '022-49150800'
  ),
  (
    'udyam',
    'Udyam Registration Portal (उद्यम नोंदणी)',
    'https://udyamregistration.gov.in/',
    'Ministry of MSME, Govt of India',
    'All India',
    'The 100% free official government portal for registering micro, small, and medium enterprises. Essential for all bank loans, subsidies, and GeM procurement.',
    '[
      {"step_number": 1, "title": "Aadhaar Verification", "description": "Enter proprietor Aadhaar number and name as per Aadhaar. Verify with mobile OTP."},
      {"step_number": 2, "title": "PAN Verification", "description": "Provide business or personal PAN. System validates PAN with Income Tax database."},
      {"step_number": 3, "title": "Business Location & Activity", "description": "Enter enterprise name, unit address, district, and select 2/4/5-digit NIC Code (e.g., 1079 for food manufacturing)."},
      {"step_number": 4, "title": "Employment & Bank Details", "description": "Enter employee count, bank IFSC, account number, and past financial year turnover."},
      {"step_number": 5, "title": "Instant Certificate Generation", "description": "Submit with final OTP. Your official Udyam Certificate with QR code is generated instantly at zero cost."}
    ]'::jsonb,
    array['Aadhaar Card', 'PAN Card', 'Bank Account Number & IFSC', 'NIC Activity Code'],
    '011-23063800'
  )
on conflict (portal_slug) do update set
  portal_name = excluded.portal_name,
  official_url = excluded.official_url,
  description = excluded.description,
  steps = excluded.steps;
