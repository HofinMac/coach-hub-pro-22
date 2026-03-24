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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      campaign_rules: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          metric_key: string | null
          operator: string
          rule_type: string
          threshold: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          metric_key?: string | null
          operator?: string
          rule_type: string
          threshold?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metric_key?: string | null
          operator?: string
          rule_type?: string
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      client_challenges: {
        Row: {
          campaign_id: string
          client_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          goal_target: number
          id: string
          promo_code: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          goal_target?: number
          id?: string
          promo_code?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          goal_target?: number
          id?: string
          promo_code?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_challenges_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_benefits: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campaign_id: string
          coach_id: string
          created_at: string
          id: string
          promo_code: string | null
          status: string
          valid_until: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id: string
          coach_id: string
          created_at?: string
          id?: string
          promo_code?: string | null
          status?: string
          valid_until?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          promo_code?: string | null
          status?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_benefits_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_certificates: {
        Row: {
          certificate_url: string
          coach_id: string
          created_at: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          certificate_url: string
          coach_id: string
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          certificate_url?: string
          coach_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      eligibility: {
        Row: {
          campaign_id: string
          created_at: string
          eligible: boolean
          evaluated_at: string
          expires_at: string | null
          id: string
          rule_results: Json
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          eligible?: boolean
          evaluated_at?: string
          expires_at?: string | null
          id?: string
          rule_results?: Json
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          eligible?: boolean
          evaluated_at?: string
          expires_at?: string | null
          id?: string
          rule_results?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string
          city: string
          created_at: string
          created_by: string | null
          equipment: string[]
          id: string
          name: string
          website: string | null
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          created_by?: string | null
          equipment?: string[]
          id?: string
          name: string
          website?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          created_by?: string | null
          equipment?: string[]
          id?: string
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      partner_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          website: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          website?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bg_preset: string | null
          bio: string | null
          brand_name: string | null
          certifications: string[] | null
          city: string | null
          cover_photo_url: string | null
          created_at: string
          email: string | null
          full_name: string
          group_max_size: number | null
          id: string
          logo_url: string | null
          max_clients: number | null
          offer_group: boolean | null
          onboarding_done: boolean | null
          phone: string | null
          profile_photo_url: string | null
          role: string
          session_length: number | null
          session_price: number | null
          specialties: string[] | null
          theme: string | null
          training_location: string | null
          updated_at: string
          years_experience: string | null
        }
        Insert: {
          bg_preset?: string | null
          bio?: string | null
          brand_name?: string | null
          certifications?: string[] | null
          city?: string | null
          cover_photo_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          group_max_size?: number | null
          id: string
          logo_url?: string | null
          max_clients?: number | null
          offer_group?: boolean | null
          onboarding_done?: boolean | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: string
          session_length?: number | null
          session_price?: number | null
          specialties?: string[] | null
          theme?: string | null
          training_location?: string | null
          updated_at?: string
          years_experience?: string | null
        }
        Update: {
          bg_preset?: string | null
          bio?: string | null
          brand_name?: string | null
          certifications?: string[] | null
          city?: string | null
          cover_photo_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          group_max_size?: number | null
          id?: string
          logo_url?: string | null
          max_clients?: number | null
          offer_group?: boolean | null
          onboarding_done?: boolean | null
          phone?: string | null
          profile_photo_url?: string | null
          role?: string
          session_length?: number | null
          session_price?: number | null
          specialties?: string[] | null
          theme?: string | null
          training_location?: string | null
          updated_at?: string
          years_experience?: string | null
        }
        Relationships: []
      }
      promo_campaigns: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          goal_type: string
          goal_value: number | null
          id: string
          partner_id: string
          promo_code: string | null
          requires_approval: boolean
          reward_type: string
          reward_value: string
          target_group: string
          title: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          goal_type?: string
          goal_value?: number | null
          id?: string
          partner_id: string
          promo_code?: string | null
          requires_approval?: boolean
          reward_type?: string
          reward_value?: string
          target_group?: string
          title: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          goal_type?: string
          goal_value?: number | null
          id?: string
          partner_id?: string
          promo_code?: string | null
          requires_approval?: boolean
          reward_type?: string
          reward_value?: string
          target_group?: string
          title?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_campaigns_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean
          assigned_to: string | null
          campaign_id: string
          code: string
          created_at: string
          current_uses: number
          expires_at: string | null
          id: string
          is_personal: boolean
          max_uses: number | null
        }
        Insert: {
          active?: boolean
          assigned_to?: string | null
          campaign_id: string
          code: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_personal?: boolean
          max_uses?: number | null
        }
        Update: {
          active?: boolean
          assigned_to?: string | null
          campaign_id?: string
          code?: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_personal?: boolean
          max_uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          campaign_id: string
          id: string
          notes: string | null
          promo_code_id: string | null
          redeemed_at: string
          source: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          id?: string
          notes?: string | null
          promo_code_id?: string | null
          redeemed_at?: string
          source?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          id?: string
          notes?: string | null
          promo_code_id?: string | null
          redeemed_at?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_history: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          promo_code: string | null
          redeemed: boolean
          redeemed_at: string | null
          reward_type: string
          reward_value: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          promo_code?: string | null
          redeemed?: boolean
          redeemed_at?: string | null
          reward_type: string
          reward_value?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          promo_code?: string | null
          redeemed?: boolean
          redeemed_at?: string | null
          reward_type?: string
          reward_value?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          bg_preset: string
          created_at: string
          email: string
          id: string
          notification_settings: Json
          phone: string
          reminder_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bg_preset?: string
          created_at?: string
          email?: string
          id?: string
          notification_settings?: Json
          phone?: string
          reminder_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bg_preset?: string
          created_at?: string
          email?: string
          id?: string
          notification_settings?: Json
          phone?: string
          reminder_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
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
    Enums: {},
  },
} as const
