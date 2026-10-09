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
export const getRecommendations = (token: string, profileId: string) =>
  request<SchemeRecommendation[]>(`/business-profiles/${profileId}/recommendations`, token);
export const sendAssistantMessage = (token: string, profileId: string, message: string) =>
  request<{ assistant_message: string; recommendations: SchemeRecommendation[] }>("/assistant/messages", token, {
    method: "POST",
    body: JSON.stringify({ business_profile_id: profileId, message, language: "en" }),
  });

export const getApplications = (token: string) => request<Application[]>("/applications", token);

export const createApplication = (token: string, businessProfileId: string, schemeId: string) =>
  request<Application>("/applications", token, {
    method: "POST",
    body: JSON.stringify({ business_profile_id: businessProfileId, scheme_id: schemeId }),
  });
