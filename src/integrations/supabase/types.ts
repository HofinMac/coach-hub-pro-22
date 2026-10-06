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
      client_intake: {
        Row: {
          age: number | null
          client_id: string
          created_at: string
          current_activity: string
          experience: string
          gender: string
          goal_detail: string
          goals: string[]
          height_cm: number | null
          injuries: string[]
          injury_detail: string
          preferred_days: string
          preferred_time: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          client_id: string
          created_at?: string
          current_activity?: string
          experience?: string
          gender?: string
          goal_detail?: string
          goals?: string[]
          height_cm?: number | null
          injuries?: string[]
          injury_detail?: string
          preferred_days?: string
          preferred_time?: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          client_id?: string
          created_at?: string
          current_activity?: string
          experience?: string
          gender?: string
          goal_detail?: string
          goals?: string[]
          height_cm?: number | null
          injuries?: string[]
          injury_detail?: string
          preferred_days?: string
          preferred_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_invites: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          coach_id: string
          created_at: string
          email: string
          email_sent_at: string | null
          id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          coach_id: string
          created_at?: string
          email: string
          email_sent_at?: string | null
          id?: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          coach_id?: string
          created_at?: string
          email?: string
          email_sent_at?: string | null
          id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      client_packages: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          expires_at: string | null
          id: string
          name: string
          price_czk: number
          remaining_credits: number
          status: string
          total_credits: number
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          name: string
          price_czk?: number
          remaining_credits: number
          status?: string
          total_credits: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          name?: string
          price_czk?: number
          remaining_credits?: number
          status?: string
          total_credits?: number
          updated_at?: string
        }
        Relationships: []
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
      coach_client_records: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          notes: string
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          notes?: string
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          notes?: string
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      coach_exercises: {
        Row: {
          category: string
          coach_id: string
          created_at: string
          default_notes: string
          id: string
          name: string
          video_url: string | null
        }
        Insert: {
          category: string
          coach_id?: string
          created_at?: string
          default_notes?: string
          id?: string
          name: string
          video_url?: string | null
        }
        Update: {
          category?: string
          coach_id?: string
          created_at?: string
          default_notes?: string
          id?: string
          name?: string
          video_url?: string | null
        }
        Relationships: []
      }
      coach_gyms: {
        Row: {
          coach_id: string
          created_at: string
          gym_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          gym_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          gym_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_gyms_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_slots: {
        Row: {
          booked_count: number
          capacity: number
          coach_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          recurrence_parent_id: string | null
          recurrence_rule: Json | null
          reminder_sent_at: string | null
          slot_type: string
          start_time: string
          status: string
        }
        Insert: {
          booked_count?: number
          capacity?: number
          coach_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          reminder_sent_at?: string | null
          slot_type?: string
          start_time: string
          status?: string
        }
        Update: {
          booked_count?: number
          capacity?: number
          coach_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          recurrence_parent_id?: string | null
          recurrence_rule?: Json | null
          reminder_sent_at?: string | null
          slot_type?: string
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_slots_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "coach_slots"
            referencedColumns: ["id"]
          },
        ]
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
      gym_reviews: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          gym_id: string
          id: string
          rating: number
        }
        Insert: {
          author_id?: string
          comment?: string
          created_at?: string
          gym_id: string
          id?: string
          rating: number
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          gym_id?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "gym_reviews_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
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
          description: string
          equipment: string[]
          id: string
          name: string
          opening_hours: string
          website: string | null
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          created_by?: string | null
          description?: string
          equipment?: string[]
          id?: string
          name: string
          opening_hours?: string
          website?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          created_by?: string | null
          description?: string
          equipment?: string[]
          id?: string
          name?: string
          opening_hours?: string
          website?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          client_id: string
          coach_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          attempts: number
          body: string
          category: string
          claimed_at: string | null
          created_at: string
          error: string | null
          id: string
          processed_at: string | null
          status: string
          tag: string | null
          title: string
          url: string
          user_id: string
        }
        Insert: {
          attempts?: number
          body?: string
          category: string
          claimed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          tag?: string | null
          title: string
          url?: string
          user_id: string
        }
        Update: {
          attempts?: number
          body?: string
          category?: string
          claimed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          tag?: string | null
          title?: string
          url?: string
          user_id?: string
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
      payments: {
        Row: {
          amount_czk: number
          client_id: string
          coach_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          package_id: string | null
          paid_at: string | null
          status: string
        }
        Insert: {
          amount_czk: number
          client_id: string
          coach_id: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          package_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount_czk?: number
          client_id?: string
          coach_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          package_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          assigned_coach_id: string | null
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
          assigned_coach_id?: string | null
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
          assigned_coach_id?: string | null
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
      progress_entries: {
        Row: {
          body_fat: number | null
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          logged_at: string
          notes: string
          weight: number | null
        }
        Insert: {
          body_fat?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          logged_at?: string
          notes?: string
          weight?: number | null
        }
        Update: {
          body_fat?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          logged_at?: string
          notes?: string
          weight?: number | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: []
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
      slot_bookings: {
        Row: {
          client_id: string
          created_at: string
          id: string
          reminder_sent_at: string | null
          slot_id: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          reminder_sent_at?: string | null
          slot_id: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          reminder_sent_at?: string | null
          slot_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "coach_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_share_log: {
        Row: {
          coach_id: string
          created_at: string
          external_emails: string[] | null
          id: string
          message: string | null
          recipient_ids: string[] | null
          share_type: string
          slot_ids: string[]
        }
        Insert: {
          coach_id: string
          created_at?: string
          external_emails?: string[] | null
          id?: string
          message?: string | null
          recipient_ids?: string[] | null
          share_type?: string
          slot_ids?: string[]
        }
        Update: {
          coach_id?: string
          created_at?: string
          external_emails?: string[] | null
          id?: string
          message?: string | null
          recipient_ids?: string[] | null
          share_type?: string
          slot_ids?: string[]
        }
        Relationships: []
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
          slot_reminder_enabled: boolean
          slot_reminder_frequency: string
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
          slot_reminder_enabled?: boolean
          slot_reminder_frequency?: string
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
          slot_reminder_enabled?: boolean
          slot_reminder_frequency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          client_id: string
          created_at: string
          duration_min: number | null
          id: string
          notes: string
          performed_at: string
          plan_id: string | null
          rpe: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          duration_min?: number | null
          id?: string
          notes?: string
          performed_at?: string
          plan_id?: string | null
          rpe?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          duration_min?: number | null
          id?: string
          notes?: string
          performed_at?: string
          plan_id?: string | null
          rpe?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          client_id: string | null
          coach_id: string
          completed_at: string | null
          created_at: string
          description: string
          exercises: Json
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          coach_id: string
          completed_at?: string | null
          created_at?: string
          description?: string
          exercises?: Json
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          coach_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          exercises?: Json
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_coach_slot: {
        Args: { _slot_id: string }
        Returns: {
          client_id: string
          created_at: string
          id: string
          reminder_sent_at: string | null
          slot_id: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "slot_bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_client_booking: {
        Args: { _booking_id: string }
        Returns: undefined
      }
      claim_notification_events: {
        Args: { _limit?: number }
        Returns: {
          attempts: number
          body: string
          category: string
          claimed_at: string | null
          created_at: string
          error: string | null
          id: string
          processed_at: string | null
          status: string
          tag: string | null
          title: string
          url: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notification_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      enqueue_due_reminders: { Args: never; Returns: number }
      enqueue_notification: {
        Args: {
          _body: string
          _category: string
          _tag?: string
          _title: string
          _url: string
          _user_id: string
        }
        Returns: undefined
      }
      get_assigned_coach_id: { Args: { _user_id: string }; Returns: string }
      get_client_last_activity: {
        Args: { _coach_id: string }
        Returns: {
          client_id: string
          last_activity: string
        }[]
      }
      get_invite_coach_name: { Args: { _token: string }; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      is_my_client: { Args: { _client_id: string }; Returns: boolean }
      is_slot_owner: { Args: { _slot_id: string }; Returns: boolean }
      mark_conversation_read: {
        Args: { _client_id: string; _coach_id: string }
        Returns: undefined
      }
      register_push_subscription: {
        Args: {
          _auth: string
          _endpoint: string
          _p256dh: string
          _user_agent?: string
        }
        Returns: undefined
      }
      send_test_notification: { Args: never; Returns: undefined }
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
