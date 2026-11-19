const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000/api/v1";

export type SchemeRecommendation = {
  scheme_id: string;
  rank: number;
  eligibility_status: "eligible" | "likely" | "ineligible" | "needs_information";
  score: number | null;
  reasons: string[];
  missing_requirements: string[];
  scheme: { slug: string; name: string; short_description: string; official_portal_url: string };
};

export type Application = {
  id: string;
  business_profile_id: string;
  scheme_id: string;
  status: "planned" | "started" | "in_progress" | "submitted" | "completed" | "abandoned";
  official_application_id: string | null;
  portal_url: string;
  last_step: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessProfile = {
  id: string;
  business_name: string | null;
  business_type: string;
  state: string;
  district: string | null;
  annual_turnover?: number;
  category?: string;
  gender?: string;
};

export type BusinessProfileInput = {
  business_name: string;
  business_type: string;
  state: string;
  district: string;
  pincode?: string;
  annual_turnover?: number;
  employee_count?: number;
  registration_status?: string;
};

export type Marketplace = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  onboarding_url: string;
  commission_model: string;
  benefits: string[];
};

export type DigitalTool = {
  id: string;
  slug: string;
  name: string;
  tool_type: string;
  pricing_tier: string;
  description: string;
  best_for: string;
  official_url: string;
  features: string[];
};

export type PortalGuide = {
  portal_slug: string;
  portal_name: string;
  official_url: string;
  department: string;
  state: string;
  description: string;
  steps: { step_number: number; title: string; description: string; tip?: string }[];
  prerequisites: string[];
  helpdesk_contact?: string;
};

export type LogisticsQuote = {
  origin_district: string;
  destination_district: string;
  weight_kg: number;
  cargo_type: string;
  estimated_distance_km: number;
  available_carriers: {
    carrier_name: string;
    vehicle_type: string;
    estimated_cost_inr: number;
    estimated_delivery_hours: number;
    best_for: string;
  }[];
  recommended_carrier: string;
  integrated_module: string;
};

export type GrowthDashboard = {
  business_name: string;
  district: string;
  annual_turnover_inr: number;
  digital_readiness_score: number;
  readiness_factors: string[];
  potential_subsidy_inr: number;
  active_applications_count: number;
  suggested_actions: string[];
  integrated_module: string;
};

export type DocumentChecklistItem = {
  key: string;
  name_en: string;
  name_mr: string;
  issuing_portal: string;
  authority: string;
  help_text: string;
  mandatory: boolean;
  status: string;
  is_ready: boolean;
};

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const getProfiles = (token: string) => request<BusinessProfile[]>("/business-profiles", token);
export const createProfile = (token: string, profile: BusinessProfileInput) =>
  request<BusinessProfile>("/business-profiles", token, {
    method: "POST",
    body: JSON.stringify(profile),
  });
export const updateProfile = (token: string, profileId: string, profile: BusinessProfileInput) =>
  request<BusinessProfile>(`/business-profiles/${profileId}`, token, {
    method: "PATCH",
    body: JSON.stringify(profile),
  });

export const getRecommendations = (token: string, profileId: string) =>
  request<SchemeRecommendation[]>(`/business-profiles/${profileId}/recommendations`, token);

export const sendAssistantMessage = (token: string, profileId: string, message: string, language: string = "mr") =>
  request<{
    assistant_message: string;
    extracted_profile: Record<string, any>;
    recommendations: SchemeRecommendation[];
  }>("/assistant/messages", token, {
    method: "POST",
    body: JSON.stringify({ business_profile_id: profileId, message, language }),
  });

export const getApplications = (token: string) => request<Application[]>("/applications", token);

export const createApplication = (token: string, businessProfileId: string, schemeId: string) =>
  request<Application>("/applications", token, {
    method: "POST",
    body: JSON.stringify({ business_profile_id: businessProfileId, scheme_id: schemeId }),
  });

export const updateApplication = (
  token: string,
  applicationId: string,
  status: Application["status"],
  lastStep?: string,
) =>
  request<Application>(`/applications/${applicationId}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(lastStep ? { last_step: lastStep } : {}),
    }),
  });

export const getMarketplaces = (token: string) => request<Marketplace[]>("/marketplaces", token);
export const getDigitalTools = (token: string) => request<DigitalTool[]>("/digital-tools", token);
export const getPortals = (token: string) => request<PortalGuide[]>("/portals", token);
export const getPortal = (token: string, slug: string) => request<PortalGuide>(`/portals/${slug}`, token);
export const getDocumentChecklist = (token: string, slug: string, profileId?: string) =>
  request<DocumentChecklistItem[]>(`/schemes/${slug}/document-checklist${profileId ? `?profile_id=${profileId}` : ""}`, token);

export const getLogisticsQuote = (token: string, origin: string, dest: string, weightKg: number) =>
  request<LogisticsQuote>("/integrations/logistics/quote", token, {
    method: "POST",
    body: JSON.stringify({
      origin_district: origin,
      destination_district: dest,
      weight_kg: weightKg,
    }),
  });

export const getGrowthDashboard = (token: string, profileId: string) =>
  request<GrowthDashboard>(`/business-profiles/${profileId}/dashboard-summary`, token);
