// VyaparMarg Mobile API Client

declare const process: { env: Record<string, string | undefined> };

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}, token?: string) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[VyaparMarg API] Request to ${endpoint} failed:`, error);
    throw error;
  }
}

export async function getProfiles(token: string) {
  return fetchWithAuth("/business-profiles", { method: "GET" }, token);
}

export async function createProfile(
  payload: {
    business_name: string;
    business_type: string;
    state: string;
    district: string;
    annual_turnover?: number;
  },
  token: string
) {
  return fetchWithAuth("/business-profiles", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function getSchemes(token?: string) {
  return fetchWithAuth("/schemes", { method: "GET" }, token);
}

export async function getSchemeRecommendations(profileId: string, token: string) {
  return fetchWithAuth(`/business-profiles/${profileId}/recommendations`, { method: "GET" }, token);
}

export async function getMarketplaces(token?: string) {
  return fetchWithAuth("/marketplaces", { method: "GET" }, token);
}

export async function getDigitalTools(token?: string) {
  return fetchWithAuth("/digital-tools", { method: "GET" }, token);
}

export async function getDocumentChecklist(schemeSlug: string, profileId?: string, token?: string) {
  const query = profileId ? `?profile_id=${profileId}` : "";
  return fetchWithAuth(`/schemes/${schemeSlug}/document-checklist${query}`, { method: "GET" }, token);
}

export async function getApplications(token: string) {
  return fetchWithAuth("/applications", { method: "GET" }, token);
}

export async function createApplication(
  payload: {
    business_profile_id: string;
    scheme_id: string;
  },
  token: string
) {
  return fetchWithAuth("/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function sendAssistantMessage(
  payload: {
    business_profile_id: string;
    message: string;
    language: string;
    conversation_id?: string;
  },
  token?: string
) {
  return fetchWithAuth("/assistant/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function getLogisticsQuote(
  payload: {
    origin_district: string;
    destination_district: string;
    weight_kg: number;
  },
  token?: string
) {
  return fetchWithAuth("/integrations/logistics/quote", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function getDashboardSummary(profileId: string, token?: string) {
  return fetchWithAuth(`/business-profiles/${profileId}/dashboard-summary`, { method: "GET" }, token);
}
