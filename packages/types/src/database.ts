export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          business_profile_id: string
          created_at: string
          id: string
          last_seen_at: string | null
          last_step: string | null
          official_application_id: string | null
          portal_url: string
          scheme_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_profile_id: string
          created_at?: string
          id?: string
          last_seen_at?: string | null
          last_step?: string | null
          official_application_id?: string | null
          portal_url: string
          scheme_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_profile_id?: string
          created_at?: string
          id?: string
          last_seen_at?: string | null
          last_step?: string | null
          official_application_id?: string | null
          portal_url?: string
          scheme_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          annual_turnover: number | null
          business_name: string | null
          business_type: string
          created_at: string
          district: string | null
          employee_count: number | null
          id: string
          pincode: string | null
          profile_data: Json
          registration_status: string | null
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_turnover?: number | null
          business_name?: string | null
          business_type: string
          created_at?: string
          district?: string | null
          employee_count?: number | null
          id?: string
          pincode?: string | null
          profile_data?: Json
          registration_status?: string | null
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_turnover?: number | null
          business_name?: string | null
          business_type?: string
          created_at?: string
          district?: string | null
          employee_count?: number | null
          id?: string
          pincode?: string | null
          profile_data?: Json
          registration_status?: string | null
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          business_profile_id: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_profile_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_profile_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          business_profile_id: string | null
          created_at: string
          document_type: string
          extracted_data: Json
          id: string
          status: string
          storage_bucket: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_profile_id?: string | null
          created_at?: string
          document_type: string
          extracted_data?: Json
          id?: string
          status?: string
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_profile_id?: string | null
          created_at?: string
          document_type?: string
          extracted_data?: Json
          id?: string
          status?: string
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          language: string | null
          role: string
          structured_data: Json
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          language?: string | null
          role: string
          structured_data?: Json
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          language?: string | null
          role?: string
          structured_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendation_items: {
        Row: {
          eligibility_status: string
          id: string
          missing_requirements: string[]
          rank: number
          reasons: Json
          recommendation_id: string
          scheme_id: string
          score: number | null
        }
        Insert: {
          eligibility_status: string
          id?: string
          missing_requirements?: string[]
          rank: number
          reasons?: Json
          recommendation_id: string
          scheme_id: string
          score?: number | null
        }
        Update: {
          eligibility_status?: string
          id?: string
          missing_requirements?: string[]
          rank?: number
          reasons?: Json
          recommendation_id?: string
          scheme_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_items_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_items_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          business_profile_id: string
          conversation_id: string | null
          created_at: string
          extracted_profile: Json
          id: string
          query_language: string | null
          query_text: string
          status: string
          user_id: string
        }
        Insert: {
          business_profile_id: string
          conversation_id?: string | null
          created_at?: string
          extracted_profile?: Json
          id?: string
          query_language?: string | null
          query_text: string
          status?: string
          user_id: string
        }
        Update: {
          business_profile_id?: string
          conversation_id?: string | null
          created_at?: string
          extracted_profile?: Json
          id?: string
          query_language?: string | null
          query_text?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheme_requirements: {
        Row: {
          data_type: string
          help_text: string | null
          id: string
          label: string
          required: boolean
          requirement_key: string
          scheme_id: string
        }
        Insert: {
          data_type?: string
          help_text?: string | null
          id?: string
          label: string
          required?: boolean
          requirement_key: string
          scheme_id: string
        }
        Update: {
          data_type?: string
          help_text?: string | null
          id?: string
          label?: string
          required?: boolean
          requirement_key?: string
          scheme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheme_requirements_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      scheme_rules: {
        Row: {
          expected_value: Json
          explanation: string
          id: string
          operator: string
          priority: number
          rule_key: string
          scheme_id: string
        }
        Insert: {
          expected_value: Json
          explanation: string
          id?: string
          operator: string
          priority?: number
          rule_key: string
          scheme_id: string
        }
        Update: {
          expected_value?: Json
          explanation?: string
          id?: string
          operator?: string
          priority?: number
          rule_key?: string
          scheme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheme_rules_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes: {
        Row: {
          active: boolean
          authority: string | null
          created_at: string
          id: string
          last_verified_at: string | null
          name: string
          official_portal_url: string
          short_description: string
          slug: string
          source_url: string | null
          supported_languages: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          authority?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          name: string
          official_portal_url: string
          short_description: string
          slug: string
          source_url?: string | null
          supported_languages?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          authority?: string | null
          created_at?: string
          id?: string
          last_verified_at?: string | null
          name?: string
          official_portal_url?: string
          short_description?: string
          slug?: string
          source_url?: string | null
          supported_languages?: string[]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

