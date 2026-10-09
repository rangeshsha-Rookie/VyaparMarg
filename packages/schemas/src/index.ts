export const languages = ["mr", "hi", "en", "hinglish"] as const;
export type Language = (typeof languages)[number];

export type BusinessProfileCreate = {
  business_name?: string | null;
  business_type: string;
  state: string;
  district?: string | null;
  pincode?: string | null;
  annual_turnover?: number | null;
  employee_count?: number | null;
  registration_status?: string | null;
  profile_data?: Record<string, unknown>;
};

export type AssistantMessageRequest = {
  business_profile_id: string;
  message: string;
  language: Language;
  conversation_id?: string | null;
};

export type RecommendationItem = {
  scheme_id: string;
  rank: number;
  eligibility_status: "eligible" | "likely" | "ineligible" | "needs_information";
  score?: number | null;
  reasons: string[];
  missing_requirements: string[];
};

export type AssistantMessageResponse = {
  conversation_id: string;
  message_id: string;
  assistant_message: string;
  extracted_profile: Record<string, unknown>;
  recommendations: RecommendationItem[];
  engine_status: "not_connected" | "ready";
};
