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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      jobs: {
        Row: {
          applied_at: string | null
          company: string
          confidence: string | null
          contract_type: string | null
          cover_letter: string | null
          created_at: string
          description: string | null
          fit_reasoning: string | null
          follow_up_at: string | null
          id: string
          interview_prep: string | null
          keywords: Json | null
          learning_gaps: Json | null
          location: string | null
          match_score: number | null
          matched_skills: Json | null
          missing_skills: Json | null
          notes: string | null
          posted_at: string | null
          recruiter_message: string | null
          remote_type: string | null
          source: string | null
          status: Database["public"]["Enums"]["job_status"]
          tailored_resume: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          confidence?: string | null
          contract_type?: string | null
          cover_letter?: string | null
          created_at?: string
          description?: string | null
          fit_reasoning?: string | null
          follow_up_at?: string | null
          id?: string
          interview_prep?: string | null
          keywords?: Json | null
          learning_gaps?: Json | null
          location?: string | null
          match_score?: number | null
          matched_skills?: Json | null
          missing_skills?: Json | null
          notes?: string | null
          posted_at?: string | null
          recruiter_message?: string | null
          remote_type?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tailored_resume?: string | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          confidence?: string | null
          contract_type?: string | null
          cover_letter?: string | null
          created_at?: string
          description?: string | null
          fit_reasoning?: string | null
          follow_up_at?: string | null
          id?: string
          interview_prep?: string | null
          keywords?: Json | null
          learning_gaps?: Json | null
          location?: string | null
          match_score?: number | null
          matched_skills?: Json | null
          missing_skills?: Json | null
          notes?: string | null
          posted_at?: string | null
          recruiter_message?: string | null
          remote_type?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tailored_resume?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          candidate_summary: string | null
          created_at: string
          daily_target: number | null
          degree: string | null
          email: string | null
          expected_graduation: string | null
          full_name: string | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          phone: string | null
          portfolio_url: string | null
          preferred_locations: string | null
          resume_text: string | null
          role_keywords: string | null
          skills: Json | null
          university: string | null
          updated_at: string
          work_authorization: string | null
        }
        Insert: {
          candidate_summary?: string | null
          created_at?: string
          daily_target?: number | null
          degree?: string | null
          email?: string | null
          expected_graduation?: string | null
          full_name?: string | null
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          preferred_locations?: string | null
          resume_text?: string | null
          role_keywords?: string | null
          skills?: Json | null
          university?: string | null
          updated_at?: string
          work_authorization?: string | null
        }
        Update: {
          candidate_summary?: string | null
          created_at?: string
          daily_target?: number | null
          degree?: string | null
          email?: string | null
          expected_graduation?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          preferred_locations?: string | null
          resume_text?: string | null
          role_keywords?: string | null
          skills?: Json | null
          university?: string | null
          updated_at?: string
          work_authorization?: string | null
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
      job_status:
        | "saved"
        | "to_apply"
        | "applied"
        | "interview"
        | "rejected"
        | "offer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      job_status: [
        "saved",
        "to_apply",
        "applied",
        "interview",
        "rejected",
        "offer",
      ],
    },
  },
} as const
