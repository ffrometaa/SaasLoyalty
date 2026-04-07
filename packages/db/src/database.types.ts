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
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
          rarity: Database["public"]["Enums"]["badge_rarity"]
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: Database["public"]["Enums"]["badge_rarity"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          body: string | null
          bonus_multiplier: number | null
          bonus_points: number | null
          clicked_count: number
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          cta_text: string | null
          cta_url: string | null
          delivered_count: number
          description: string | null
          id: string
          image_url: string | null
          name: string
          opened_count: number
          recipients_count: number
          redeemed_count: number
          scheduled_at: string | null
          segment: string | null
          sent_at: string | null
          started_at: string | null
          stats: Json | null
          status: Database["public"]["Enums"]["campaign_status"]
          subject: string | null
          target_segment: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          bonus_multiplier?: number | null
          bonus_points?: number | null
          clicked_count?: number
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          delivered_count?: number
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          opened_count?: number
          recipients_count?: number
          redeemed_count?: number
          scheduled_at?: string | null
          segment?: string | null
          sent_at?: string | null
          started_at?: string | null
          stats?: Json | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string | null
          target_segment?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          bonus_multiplier?: number | null
          bonus_points?: number | null
          clicked_count?: number
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          delivered_count?: number
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          opened_count?: number
          recipients_count?: number
          redeemed_count?: number
          scheduled_at?: string | null
          segment?: string | null
          sent_at?: string | null
          started_at?: string | null
          stats?: Json | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string | null
          target_segment?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          badge_id: string | null
          bonus_points: number
          created_at: string | null
          description: string | null
          ends_at: string | null
          goal_value: number
          id: string
          name: string
          starts_at: string | null
          status: Database["public"]["Enums"]["challenge_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["challenge_type"]
          updated_at: string | null
        }
        Insert: {
          badge_id?: string | null
          bonus_points?: number
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          goal_value: number
          id?: string
          name: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["challenge_type"]
          updated_at?: string | null
        }
        Update: {
          badge_id?: string | null
          bonus_points?: number
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          goal_value?: number
          id?: string
          name?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["challenge_status"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["challenge_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_challenges_badge"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_interventions: {
        Row: {
          churn_score: number
          id: string
          intervention_type: string
          member_id: string
          metadata: Json
          resolved_at: string | null
          status: Database["public"]["Enums"]["intervention_status"]
          tenant_id: string
          triggered_at: string
        }
        Insert: {
          churn_score: number
          id?: string
          intervention_type: string
          member_id: string
          metadata?: Json
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["intervention_status"]
          tenant_id: string
          triggered_at?: string
        }
        Update: {
          churn_score?: number
          id?: string
          intervention_type?: string
          member_id?: string
          metadata?: Json
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["intervention_status"]
          tenant_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "churn_interventions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_interventions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_interventions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_interventions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_alerts: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          tenant_id: string
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          tenant_id: string
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          tenant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          business_name: string
          business_type: string
          converted_at: string | null
          converted_tenant_slug: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          message: string | null
          owner_name: string
          phone: string | null
          status: string | null
        }
        Insert: {
          business_name: string
          business_type: string
          converted_at?: string | null
          converted_tenant_slug?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          message?: string | null
          owner_name: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          business_name?: string
          business_type?: string
          converted_at?: string | null
          converted_tenant_slug?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          message?: string | null
          owner_name?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      dynamic_challenges: {
        Row: {
          bonus_points: number
          completed_at: string | null
          created_at: string
          current_value: number
          description: string | null
          expires_at: string
          goal_value: number
          id: string
          is_dismissed: boolean
          member_id: string
          name: string
          tenant_id: string
          type: Database["public"]["Enums"]["challenge_type"]
        }
        Insert: {
          bonus_points?: number
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          expires_at: string
          goal_value: number
          id?: string
          is_dismissed?: boolean
          member_id: string
          name: string
          tenant_id: string
          type: Database["public"]["Enums"]["challenge_type"]
        }
        Update: {
          bonus_points?: number
          completed_at?: string | null
          created_at?: string
          current_value?: number
          description?: string | null
          expires_at?: string
          goal_value?: number
          id?: string
          is_dismissed?: boolean
          member_id?: string
          name?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["challenge_type"]
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_challenges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      engine_activity_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          members_affected: number
          payload: Json
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_type: string
          id?: string
          members_affected?: number
          payload?: Json
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          members_affected?: number
          payload?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engine_activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engine_activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engine_activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_logs: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          impersonation_level: string
          ip_address: unknown
          reason: string | null
          started_at: string
          super_admin_id: string
          target_auth_user_id: string
          target_member_id: string | null
          target_tenant_id: string | null
          token_hash: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          impersonation_level: string
          ip_address?: unknown
          reason?: string | null
          started_at?: string
          super_admin_id: string
          target_auth_user_id: string
          target_member_id?: string | null
          target_tenant_id?: string | null
          token_hash: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          impersonation_level?: string
          ip_address?: unknown
          reason?: string | null
          started_at?: string
          super_admin_id?: string
          target_auth_user_id?: string
          target_member_id?: string | null
          target_tenant_id?: string | null
          token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_logs_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonation_logs_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonation_logs_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonation_logs_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonation_logs_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: string
          status?: string
          tenant_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          entries: Json
          generated_at: string
          id: string
          period_key: string
          period_type: string
          tenant_id: string
        }
        Insert: {
          entries?: Json
          generated_at?: string
          id?: string
          period_key: string
          period_type: string
          tenant_id: string
        }
        Update: {
          entries?: Json
          generated_at?: string
          id?: string
          period_key?: string
          period_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      login_otps: {
        Row: {
          auth_user_id: string
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          used_at: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          used_at?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          used_at?: string | null
        }
        Relationships: []
      }
      member_activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          member_id: string
          points_delta: number | null
          resource_id: string | null
          resource_type: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          member_id: string
          points_delta?: number | null
          resource_id?: string | null
          resource_type: string
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          member_id?: string
          points_delta?: number | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_activity_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      member_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          member_id: string
          tenant_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          member_id: string
          tenant_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          member_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      member_behavior_scores: {
        Row: {
          churn_score: number
          days_since_visit: number
          engagement_score: number
          id: string
          member_id: string
          motivation_type: Database["public"]["Enums"]["motivation_type"]
          points_velocity: number
          scored_at: string
          tenant_id: string
          visit_velocity: number
        }
        Insert: {
          churn_score?: number
          days_since_visit?: number
          engagement_score?: number
          id?: string
          member_id: string
          motivation_type?: Database["public"]["Enums"]["motivation_type"]
          points_velocity?: number
          scored_at?: string
          tenant_id: string
          visit_velocity?: number
        }
        Update: {
          churn_score?: number
          days_since_visit?: number
          engagement_score?: number
          id?: string
          member_id?: string
          motivation_type?: Database["public"]["Enums"]["motivation_type"]
          points_velocity?: number
          scored_at?: string
          tenant_id?: string
          visit_velocity?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_behavior_scores_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_behavior_scores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_behavior_scores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_behavior_scores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      member_challenge_progress: {
        Row: {
          bonus_awarded: boolean
          challenge_id: string
          completed_at: string | null
          created_at: string | null
          current_value: number
          id: string
          member_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          bonus_awarded?: boolean
          challenge_id: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number
          id?: string
          member_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          bonus_awarded?: boolean
          challenge_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number
          id?: string
          member_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_challenge_progress_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_challenge_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_challenge_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_challenge_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      member_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          member_id: string | null
          name: string | null
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          member_id?: string | null
          name?: string | null
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          member_id?: string | null
          name?: string | null
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_invitations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      member_mission_progress: {
        Row: {
          bonus_awarded: boolean
          completed_at: string | null
          created_at: string
          id: string
          member_id: string
          mission_id: string
          steps_completed: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bonus_awarded?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          member_id: string
          mission_id: string
          steps_completed?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bonus_awarded?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          member_id?: string
          mission_id?: string
          steps_completed?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_mission_progress_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_mission_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_mission_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_mission_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          accepts_email: boolean | null
          accepts_push: boolean | null
          auth_user_id: string | null
          birth_day: number | null
          birth_month: number | null
          birthday: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          last_visit_at: string | null
          locale: string
          member_code: string
          name: string
          phone: string | null
          points_balance: number
          points_lifetime: number
          referrer_member_id: string | null
          status: Database["public"]["Enums"]["member_status"]
          tenant_id: string
          tier: Database["public"]["Enums"]["member_tier"]
          updated_at: string | null
          visits_total: number
        }
        Insert: {
          accepts_email?: boolean | null
          accepts_push?: boolean | null
          auth_user_id?: string | null
          birth_day?: number | null
          birth_month?: number | null
          birthday?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_visit_at?: string | null
          locale?: string
          member_code: string
          name: string
          phone?: string | null
          points_balance?: number
          points_lifetime?: number
          referrer_member_id?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          tenant_id: string
          tier?: Database["public"]["Enums"]["member_tier"]
          updated_at?: string | null
          visits_total?: number
        }
        Update: {
          accepts_email?: boolean | null
          accepts_push?: boolean | null
          auth_user_id?: string | null
          birth_day?: number | null
          birth_month?: number | null
          birthday?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_visit_at?: string | null
          locale?: string
          member_code?: string
          name?: string
          phone?: string | null
          points_balance?: number
          points_lifetime?: number
          referrer_member_id?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          tenant_id?: string
          tier?: Database["public"]["Enums"]["member_tier"]
          updated_at?: string | null
          visits_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "members_referrer_member_id_fkey"
            columns: ["referrer_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_steps: {
        Row: {
          challenge_id: string
          id: string
          mission_id: string
          step_order: number
        }
        Insert: {
          challenge_id: string
          id?: string
          mission_id: string
          step_order?: number
        }
        Update: {
          challenge_id?: string
          id?: string
          mission_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "mission_steps_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_steps_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          badge_id: string | null
          bonus_points: number
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          starts_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          badge_id?: string | null
          bonus_points?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          starts_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          badge_id?: string | null
          bonus_points?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          campaign_id: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          clicked_at: string | null
          content: string | null
          created_at: string | null
          data: Json | null
          delivered_at: string | null
          error_message: string | null
          id: string
          image_url: string | null
          member_id: string | null
          onesignal_id: string | null
          opened_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          subject: string | null
          tenant_id: string | null
          title: string | null
          type: string
        }
        Insert: {
          campaign_id?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          clicked_at?: string | null
          content?: string | null
          created_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          member_id?: string | null
          onesignal_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          tenant_id?: string | null
          title?: string | null
          type: string
        }
        Update: {
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          clicked_at?: string | null
          content?: string | null
          created_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          member_id?: string | null
          onesignal_id?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          tenant_id?: string | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_overrides: {
        Row: {
          admin_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          original_plan: string
          override_plan: string
          reason: string | null
          tenant_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          original_plan: string
          override_plan: string
          reason?: string | null
          tenant_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          original_plan?: string
          override_plan?: string
          reason?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_overrides_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          grace_period_days: number
          id: string
          max_payment_retries: number
          points_expiry_days: number
          reactivation_threshold_days: number
          trial_period_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          grace_period_days?: number
          id?: string
          max_payment_retries?: number
          points_expiry_days?: number
          reactivation_threshold_days?: number
          trial_period_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          grace_period_days?: number
          id?: string
          max_payment_retries?: number
          points_expiry_days?: number
          reactivation_threshold_days?: number
          trial_period_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_events: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_events_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      point_multipliers: {
        Row: {
          condition: Database["public"]["Enums"]["multiplier_condition"]
          created_at: string
          ends_at: string
          id: string
          is_active: boolean
          multiplier: number
          name: string
          starts_at: string
          tenant_id: string
        }
        Insert: {
          condition?: Database["public"]["Enums"]["multiplier_condition"]
          created_at?: string
          ends_at: string
          id?: string
          is_active?: boolean
          multiplier?: number
          name: string
          starts_at: string
          tenant_id: string
        }
        Update: {
          condition?: Database["public"]["Enums"]["multiplier_condition"]
          created_at?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          multiplier?: number
          name?: string
          starts_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_multipliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_multipliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_multipliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reactivation_sequences: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          current_step_at: string | null
          id: string
          member_id: string
          started_at: string | null
          tenant_id: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          current_step_at?: string | null
          id?: string
          member_id: string
          started_at?: string | null
          tenant_id: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          current_step_at?: string | null
          id?: string
          member_id?: string
          started_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactivation_sequences_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactivation_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactivation_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactivation_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          activity_log_id: string | null
          alphanumeric_code: string
          created_at: string | null
          expires_at: string
          id: string
          member_id: string
          points_spent: number
          qr_code: string
          reward_id: string
          status: Database["public"]["Enums"]["redemption_status"]
          tenant_id: string
          used_at: string | null
        }
        Insert: {
          activity_log_id?: string | null
          alphanumeric_code: string
          created_at?: string | null
          expires_at: string
          id?: string
          member_id: string
          points_spent: number
          qr_code: string
          reward_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
          tenant_id: string
          used_at?: string | null
        }
        Update: {
          activity_log_id?: string | null
          alphanumeric_code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          member_id?: string
          points_spent?: number
          qr_code?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
          tenant_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "member_activity_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_redemptions: number | null
          name: string
          points_required: number
          redemption_count: number | null
          tenant_id: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          name: string
          points_required: number
          redemption_count?: number | null
          tenant_id: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_redemptions?: number | null
          name?: string
          points_required?: number
          redemption_count?: number | null
          tenant_id?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          processed_at: string | null
          type: string
        }
        Insert: {
          id: string
          processed_at?: string | null
          type: string
        }
        Update: {
          id?: string
          processed_at?: string | null
          type?: string
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tenant_users: {
        Row: {
          auth_user_id: string
          created_at: string | null
          email: string
          id: string
          invited_by: string | null
          role: string
          tenant_id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          email: string
          id?: string
          invited_by?: string | null
          role?: string
          tenant_id: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          api_key: string | null
          auth_user_id: string | null
          brand_app_name: string | null
          brand_color_primary: string | null
          brand_color_secondary: string | null
          brand_logo_url: string | null
          business_address: string | null
          business_name: string
          business_phone: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string | null
          deleted_at: string | null
          id: string
          join_code: string | null
          max_campaigns_per_month: number | null
          max_members: number | null
          owner_email: string | null
          owner_first_name: string | null
          owner_last_name: string | null
          owner_phone: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          plan_status: Database["public"]["Enums"]["plan_status"]
          points_expiration_days: number | null
          points_per_dollar: number | null
          secondary_contact_email: string | null
          secondary_contact_first_name: string | null
          secondary_contact_last_name: string | null
          secondary_contact_phone: string | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          auth_user_id?: string | null
          brand_app_name?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          brand_logo_url?: string | null
          business_address?: string | null
          business_name: string
          business_phone?: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          join_code?: string | null
          max_campaigns_per_month?: number | null
          max_members?: number | null
          owner_email?: string | null
          owner_first_name?: string | null
          owner_last_name?: string | null
          owner_phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_status?: Database["public"]["Enums"]["plan_status"]
          points_expiration_days?: number | null
          points_per_dollar?: number | null
          secondary_contact_email?: string | null
          secondary_contact_first_name?: string | null
          secondary_contact_last_name?: string | null
          secondary_contact_phone?: string | null
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          auth_user_id?: string | null
          brand_app_name?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          brand_logo_url?: string | null
          business_address?: string | null
          business_name?: string
          business_phone?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          join_code?: string | null
          max_campaigns_per_month?: number | null
          max_members?: number | null
          owner_email?: string | null
          owner_first_name?: string | null
          owner_last_name?: string | null
          owner_phone?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_status?: Database["public"]["Enums"]["plan_status"]
          points_expiration_days?: number | null
          points_per_dollar?: number | null
          secondary_contact_email?: string | null
          secondary_contact_first_name?: string | null
          secondary_contact_last_name?: string | null
          secondary_contact_phone?: string | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          activity_log_id: string | null
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          member_id: string
          points: number
          reference_id: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          activity_log_id?: string | null
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          member_id: string
          points: number
          reference_id?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          activity_log_id?: string | null
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          member_id?: string
          points?: number
          reference_id?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "member_activity_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          auth_user_id: string
          created_at: string
          device_id: string
          device_name: string | null
          id: string
          last_seen_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          device_id: string
          device_name?: string | null
          id?: string
          last_seen_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          device_id?: string
          device_name?: string | null
          id?: string
          last_seen_at?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          amount: number | null
          created_at: string | null
          day_of_week: number | null
          hour_of_day: number | null
          id: string
          member_id: string
          points_earned: number | null
          tenant_id: string
          transaction_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          day_of_week?: number | null
          hour_of_day?: number | null
          id?: string
          member_id: string
          points_earned?: number | null
          tenant_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          day_of_week?: number | null
          hour_of_day?: number | null
          id?: string
          member_id?: string
          points_earned?: number | null
          tenant_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_tenant_overview: {
        Row: {
          active_redemptions: number | null
          business_name: string | null
          business_type: Database["public"]["Enums"]["business_type"] | null
          campaign_count: number | null
          campaigns_this_month: number | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          last_activity_at: string | null
          member_count: number | null
          mrr_cents: number | null
          plan: Database["public"]["Enums"]["plan_type"] | null
          plan_status: Database["public"]["Enums"]["plan_status"] | null
          slug: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
        }
        Insert: {
          active_redemptions?: never
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          campaign_count?: never
          campaigns_this_month?: never
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          last_activity_at?: never
          member_count?: never
          mrr_cents?: never
          plan?: Database["public"]["Enums"]["plan_type"] | null
          plan_status?: Database["public"]["Enums"]["plan_status"] | null
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          active_redemptions?: never
          business_name?: string | null
          business_type?: Database["public"]["Enums"]["business_type"] | null
          campaign_count?: never
          campaigns_this_month?: never
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          last_activity_at?: never
          member_count?: never
          mrr_cents?: never
          plan?: Database["public"]["Enums"]["plan_type"] | null
          plan_status?: Database["public"]["Enums"]["plan_status"] | null
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
        }
        Relationships: []
      }
      campaign_stats: {
        Row: {
          clicked_count: number | null
          created_at: string | null
          delivered_count: number | null
          id: string | null
          name: string | null
          open_rate: number | null
          opened_count: number | null
          recipients_count: number | null
          redeemed_count: number | null
          redemption_rate: number | null
          scheduled_at: string | null
          segment: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          tenant_id: string | null
          type: Database["public"]["Enums"]["campaign_type"] | null
        }
        Insert: {
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          id?: string | null
          name?: string | null
          open_rate?: never
          opened_count?: number | null
          recipients_count?: number | null
          redeemed_count?: number | null
          redemption_rate?: never
          scheduled_at?: string | null
          segment?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["campaign_type"] | null
        }
        Update: {
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          id?: string | null
          name?: string | null
          open_rate?: never
          opened_count?: number | null
          recipients_count?: number | null
          redeemed_count?: number | null
          redemption_rate?: never
          scheduled_at?: string | null
          segment?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["campaign_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "admin_tenant_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_public_info: {
        Row: {
          brand_app_name: string | null
          brand_color_primary: string | null
          brand_color_secondary: string | null
          brand_logo_url: string | null
          business_name: string | null
          id: string | null
          join_code: string | null
          slug: string | null
        }
        Insert: {
          brand_app_name?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          brand_logo_url?: string | null
          business_name?: string | null
          id?: string | null
          join_code?: string | null
          slug?: string | null
        }
        Update: {
          brand_app_name?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          brand_logo_url?: string | null
          business_name?: string | null
          id?: string | null
          join_code?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_member_id: { Args: never; Returns: string }
      auth_tenant_id: { Args: never; Returns: string }
      calculate_tier: {
        Args: { points_lifetime: number }
        Returns: Database["public"]["Enums"]["member_tier"]
      }
      can_redeem_reward: {
        Args: { p_member_id: string; p_reward_id: string }
        Returns: {
          can_redeem: boolean
          current_balance: number
          points_required: number
          reason: string
        }[]
      }
      check_email_registered:
        | { Args: { p_email: string }; Returns: boolean }
        | { Args: { p_email: string; p_tenant_id: string }; Returns: Json }
      current_member_id: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      generate_join_code: { Args: never; Returns: string }
      generate_member_code: { Args: { tenant_slug: string }; Returns: string }
      generate_redemption_codes: {
        Args: never
        Returns: {
          alphanumeric: string
          qr_code: string
        }[]
      }
      get_impersonation_summary: {
        Args: { p_days?: number }
        Returns: {
          avg_duration_seconds: number
          date: string
          total_impersonations: number
          unique_super_admins: number
          unique_targets: number
        }[]
      }
      get_member_engine_stats: {
        Args: { p_tenant_id: string }
        Returns: {
          challenges_completed: number
          id: string
          last_visit_at: string
          member_since: string
          points_earned_30d: number
          points_lifetime: number
          status: string
          tenant_id: string
          tier: string
          visit_count_30d: number
        }[]
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_owner: { Args: { p_tenant_id: string }; Returns: boolean }
      log_member_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_member_id: string
          p_points_delta?: number
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      points_for_next_tier: {
        Args: { points_lifetime: number }
        Returns: number
      }
    }
    Enums: {
      badge_rarity: "common" | "rare" | "epic" | "legendary"
      business_type: "spa" | "restaurant" | "gym" | "retail" | "hotel" | "salon"
      campaign_status:
        | "draft"
        | "scheduled"
        | "running"
        | "completed"
        | "paused"
        | "error"
      campaign_type: "reactivation" | "birthday" | "custom" | "launch" | "inapp"
      challenge_status: "active" | "draft" | "archived"
      challenge_type:
        | "visit_count"
        | "points_earned"
        | "referral"
        | "spend_amount"
        | "streak"
      intervention_status: "pending" | "sent" | "dismissed" | "converted"
      member_status: "active" | "inactive" | "blocked"
      member_tier: "bronze" | "silver" | "gold" | "platinum"
      motivation_type: "achiever" | "socializer" | "explorer" | "competitor"
      multiplier_condition:
        | "always"
        | "tier_bronze"
        | "tier_silver"
        | "tier_gold"
        | "tier_platinum"
        | "new_member"
        | "at_risk"
      notification_channel: "email" | "push" | "in_app"
      notification_status:
        | "pending"
        | "sent"
        | "delivered"
        | "opened"
        | "failed"
      plan_status: "trialing" | "active" | "past_due" | "canceled"
      plan_type: "starter" | "pro" | "scale" | "enterprise"
      redemption_status: "pending" | "used" | "expired"
      transaction_type:
        | "earn"
        | "redeem"
        | "expire"
        | "bonus"
        | "referral"
        | "birthday"
        | "adjustment"
        | "refund"
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
      badge_rarity: ["common", "rare", "epic", "legendary"],
      business_type: ["spa", "restaurant", "gym", "retail", "hotel", "salon"],
      campaign_status: [
        "draft",
        "scheduled",
        "running",
        "completed",
        "paused",
        "error",
      ],
      campaign_type: ["reactivation", "birthday", "custom", "launch", "inapp"],
      challenge_status: ["active", "draft", "archived"],
      challenge_type: [
        "visit_count",
        "points_earned",
        "referral",
        "spend_amount",
        "streak",
      ],
      intervention_status: ["pending", "sent", "dismissed", "converted"],
      member_status: ["active", "inactive", "blocked"],
      member_tier: ["bronze", "silver", "gold", "platinum"],
      motivation_type: ["achiever", "socializer", "explorer", "competitor"],
      multiplier_condition: [
        "always",
        "tier_bronze",
        "tier_silver",
        "tier_gold",
        "tier_platinum",
        "new_member",
        "at_risk",
      ],
      notification_channel: ["email", "push", "in_app"],
      notification_status: ["pending", "sent", "delivered", "opened", "failed"],
      plan_status: ["trialing", "active", "past_due", "canceled"],
      plan_type: ["starter", "pro", "scale", "enterprise"],
      redemption_status: ["pending", "used", "expired"],
      transaction_type: [
        "earn",
        "redeem",
        "expire",
        "bonus",
        "referral",
        "birthday",
        "adjustment",
        "refund",
      ],
    },
  },
} as const
