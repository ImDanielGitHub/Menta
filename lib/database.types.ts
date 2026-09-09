export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      app_flow_returns: {
        Row: {
          blocked_action: string | null;
          consumed_at: string | null;
          created_at: string;
          expires_at: string;
          flow_key: string;
          id: string;
          payload: Json;
          return_path: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          blocked_action?: string | null;
          consumed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          flow_key: string;
          id?: string;
          payload?: Json;
          return_path?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          blocked_action?: string | null;
          consumed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          flow_key?: string;
          id?: string;
          payload?: Json;
          return_path?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      app_update_policies: {
        Row: {
          android_minimum_version: string;
          android_store_available: boolean;
          enabled: boolean;
          ios_minimum_version: string;
          ios_store_available: boolean;
          key: string;
          mode: string;
          release: string;
          schema_version: number;
          updated_at: string;
        };
        Insert: {
          android_minimum_version: string;
          android_store_available?: boolean;
          enabled?: boolean;
          ios_minimum_version: string;
          ios_store_available?: boolean;
          key: string;
          mode?: string;
          release: string;
          schema_version?: number;
          updated_at?: string;
        };
        Update: {
          android_minimum_version?: string;
          android_store_available?: boolean;
          enabled?: boolean;
          ios_minimum_version?: string;
          ios_store_available?: boolean;
          key?: string;
          mode?: string;
          release?: string;
          schema_version?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      blocked_users: {
        Row: {
          blocked_user_id: string;
          blocker_id: string;
          created_at: string;
          reason: string | null;
        };
        Insert: {
          blocked_user_id: string;
          blocker_id: string;
          created_at?: string;
          reason?: string | null;
        };
        Update: {
          blocked_user_id?: string;
          blocker_id?: string;
          created_at?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blocked_users_blocked_user_id_fkey';
            columns: ['blocked_user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocked_users_blocked_user_id_fkey';
            columns: ['blocked_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocked_users_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocked_users_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      buddy_streaks: {
        Row: {
          buddy_user_id: string | null;
          challenge_id: string | null;
          created_at: string;
          current_count: number;
          id: string;
          last_nudged_at: string | null;
          owner_user_id: string;
          payload: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          buddy_user_id?: string | null;
          challenge_id?: string | null;
          created_at?: string;
          current_count?: number;
          id?: string;
          last_nudged_at?: string | null;
          owner_user_id: string;
          payload?: Json;
          status?: string;
          updated_at?: string;
        };
        Update: {
          buddy_user_id?: string | null;
          challenge_id?: string | null;
          created_at?: string;
          current_count?: number;
          id?: string;
          last_nudged_at?: string | null;
          owner_user_id?: string;
          payload?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      catalog_items: {
        Row: {
          category: string | null;
          cost: number;
          created_at: string;
          description: string | null;
          id: string;
          is_available: boolean;
          is_disabled: boolean;
          name: string;
          price: number;
          sku: string | null;
          unlock_streak_days: number | null;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          cost?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          is_disabled?: boolean;
          name: string;
          price?: number;
          sku?: string | null;
          unlock_streak_days?: number | null;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          cost?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          is_disabled?: boolean;
          name?: string;
          price?: number;
          sku?: string | null;
          unlock_streak_days?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      challenge_participants: {
        Row: {
          at_risk: boolean;
          challenge_id: string;
          completion_percentage: number;
          current_streak: number;
          id: string;
          joined_at: string;
          last_check_in: string | null;
          last_check_in_local_date: string | null;
          last_check_in_tz: string | null;
          last_freeze_used: string | null;
          last_submission_date: string | null;
          longest_streak: number;
          milestone_reached: number;
          status: string;
          streak_count: number | null;
          streak_freezes_remaining: number;
          streak_outcome_tracking_started_at: string | null;
          updated_at: string;
          used_extensions: number;
          user_id: string;
        };
        Insert: {
          at_risk?: boolean;
          challenge_id: string;
          completion_percentage?: number;
          current_streak?: number;
          id?: string;
          joined_at?: string;
          last_check_in?: string | null;
          last_check_in_local_date?: string | null;
          last_check_in_tz?: string | null;
          last_freeze_used?: string | null;
          last_submission_date?: string | null;
          longest_streak?: number;
          milestone_reached?: number;
          status?: string;
          streak_count?: number | null;
          streak_freezes_remaining?: number;
          streak_outcome_tracking_started_at?: string | null;
          updated_at?: string;
          used_extensions?: number;
          user_id: string;
        };
        Update: {
          at_risk?: boolean;
          challenge_id?: string;
          completion_percentage?: number;
          current_streak?: number;
          id?: string;
          joined_at?: string;
          last_check_in?: string | null;
          last_check_in_local_date?: string | null;
          last_check_in_tz?: string | null;
          last_freeze_used?: string | null;
          last_submission_date?: string | null;
          longest_streak?: number;
          milestone_reached?: number;
          status?: string;
          streak_count?: number | null;
          streak_freezes_remaining?: number;
          streak_outcome_tracking_started_at?: string | null;
          updated_at?: string;
          used_extensions?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'challenge_participants_challenge_id_fkey';
            columns: ['challenge_id'];
            isOneToOne: false;
            referencedRelation: 'challenges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      challenge_submissions: {
        Row: {
          challenge_id: string;
          client_event_id: string;
          id: string;
          local_day: string;
          media_type: string | null;
          media_url: string | null;
          replaces_submission_id: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          reviewer_id: string | null;
          status: string;
          submission_date: string;
          submission_text: string | null;
          submission_type: string | null;
          user_id: string;
          verification_date: string | null;
        };
        Insert: {
          challenge_id: string;
          client_event_id?: string;
          id?: string;
          local_day: string;
          media_type?: string | null;
          media_url?: string | null;
          replaces_submission_id?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewer_id?: string | null;
          status?: string;
          submission_date?: string;
          submission_text?: string | null;
          submission_type?: string | null;
          user_id: string;
          verification_date?: string | null;
        };
        Update: {
          challenge_id?: string;
          client_event_id?: string;
          id?: string;
          local_day?: string;
          media_type?: string | null;
          media_url?: string | null;
          replaces_submission_id?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          reviewer_id?: string | null;
          status?: string;
          submission_date?: string;
          submission_text?: string | null;
          submission_type?: string | null;
          user_id?: string;
          verification_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'challenge_submissions_challenge_id_fkey';
            columns: ['challenge_id'];
            isOneToOne: false;
            referencedRelation: 'challenges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_submissions_replaces_submission_id_fkey';
            columns: ['replaces_submission_id'];
            isOneToOne: false;
            referencedRelation: 'challenge_submissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_submissions_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_submissions_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_submissions_reviewer_id_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_submissions_reviewer_id_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_submissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenge_submissions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      challenges: {
        Row: {
          allow_extensions: boolean;
          allow_self_review: boolean;
          category: string | null;
          completion_status: string;
          created_at: string;
          creator_id: string;
          deadline_type: string;
          description: string | null;
          difficulty: string;
          duration: number | null;
          end_date: string | null;
          extension_count: number;
          id: string;
          invite_code: string | null;
          is_expired: boolean;
          is_public: boolean;
          max_extensions: number;
          points_value: number;
          start_date: string | null;
          status: string;
          streak_timezone: string | null;
          submission_expectations: Json | null;
          submission_text: string | null;
          title: string;
          updated_at: string;
          verification_description: string | null;
          verification_frequency: string;
          verification_type: string;
        };
        Insert: {
          allow_extensions?: boolean;
          allow_self_review?: boolean;
          category?: string | null;
          completion_status?: string;
          created_at?: string;
          creator_id: string;
          deadline_type?: string;
          description?: string | null;
          difficulty?: string;
          duration?: number | null;
          end_date?: string | null;
          extension_count?: number;
          id?: string;
          invite_code?: string | null;
          is_expired?: boolean;
          is_public?: boolean;
          max_extensions?: number;
          points_value?: number;
          start_date?: string | null;
          status?: string;
          streak_timezone?: string | null;
          submission_expectations?: Json | null;
          submission_text?: string | null;
          title: string;
          updated_at?: string;
          verification_description?: string | null;
          verification_frequency: string;
          verification_type: string;
        };
        Update: {
          allow_extensions?: boolean;
          allow_self_review?: boolean;
          category?: string | null;
          completion_status?: string;
          created_at?: string;
          creator_id?: string;
          deadline_type?: string;
          description?: string | null;
          difficulty?: string;
          duration?: number | null;
          end_date?: string | null;
          extension_count?: number;
          id?: string;
          invite_code?: string | null;
          is_expired?: boolean;
          is_public?: boolean;
          max_extensions?: number;
          points_value?: number;
          start_date?: string | null;
          status?: string;
          streak_timezone?: string | null;
          submission_expectations?: Json | null;
          submission_text?: string | null;
          title?: string;
          updated_at?: string;
          verification_description?: string | null;
          verification_frequency?: string;
          verification_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'challenges_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'challenges_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      content_reports: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          reason: string;
          reporter_id: string | null;
          status: string;
          target_id: string;
          target_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          reason: string;
          reporter_id?: string | null;
          status?: string;
          target_id: string;
          target_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          reason?: string;
          reporter_id?: string | null;
          status?: string;
          target_id?: string;
          target_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'content_reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'content_reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      creation_attempts: {
        Row: {
          created_at: string;
          data: Json;
          error: string | null;
          id: number;
          success: boolean;
          timestamp: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          error?: string | null;
          id?: number;
          success?: boolean;
          timestamp?: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json;
          error?: string | null;
          id?: number;
          success?: boolean;
          timestamp?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      daily_challenge_panels: {
        Row: {
          challenge_id: string | null;
          created_at: string;
          id: string;
          panel_date: string;
          payload: Json;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          challenge_id?: string | null;
          created_at?: string;
          id?: string;
          panel_date?: string;
          payload?: Json;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          challenge_id?: string | null;
          created_at?: string;
          id?: string;
          panel_date?: string;
          payload?: Json;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      edge_rate_limits: {
        Row: {
          actor_key: string;
          created_at: string;
          endpoint: string;
          request_count: number;
          updated_at: string;
          window_start: string;
        };
        Insert: {
          actor_key: string;
          created_at?: string;
          endpoint: string;
          request_count?: number;
          updated_at?: string;
          window_start: string;
        };
        Update: {
          actor_key?: string;
          created_at?: string;
          endpoint?: string;
          request_count?: number;
          updated_at?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      equipped_items: {
        Row: {
          category: string;
          equipped_at: string;
          item_id: string;
          user_id: string;
        };
        Insert: {
          category?: string;
          equipped_at?: string;
          item_id: string;
          user_id: string;
        };
        Update: {
          category?: string;
          equipped_at?: string;
          item_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'equipped_items_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'equipped_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'equipped_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      event_action_receipts: {
        Row: {
          action: string;
          actor_id: string;
          client_event_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          outcome:
            | Database['public']['Enums']['menta_event_action_outcome']
            | null;
          request_hash: string;
          response: Json | null;
        };
        Insert: {
          action: string;
          actor_id: string;
          client_event_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          outcome?:
            | Database['public']['Enums']['menta_event_action_outcome']
            | null;
          request_hash: string;
          response?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string;
          client_event_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          outcome?:
            | Database['public']['Enums']['menta_event_action_outcome']
            | null;
          request_hash?: string;
          response?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'event_action_receipts_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_action_receipts_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      event_attendances: {
        Row: {
          checkin_id: string | null;
          consent_version: string;
          consented_at: string;
          created_at: string;
          id: string;
          joined_at: string;
          left_at: string | null;
          occurrence_id: string;
          state: Database['public']['Enums']['menta_event_attendance_state'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          checkin_id?: string | null;
          consent_version: string;
          consented_at: string;
          created_at?: string;
          id?: string;
          joined_at?: string;
          left_at?: string | null;
          occurrence_id: string;
          state?: Database['public']['Enums']['menta_event_attendance_state'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          checkin_id?: string | null;
          consent_version?: string;
          consented_at?: string;
          created_at?: string;
          id?: string;
          joined_at?: string;
          left_at?: string | null;
          occurrence_id?: string;
          state?: Database['public']['Enums']['menta_event_attendance_state'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_attendances_checkin_id_fkey';
            columns: ['checkin_id'];
            isOneToOne: false;
            referencedRelation: 'event_checkins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_attendances_occurrence_id_fkey';
            columns: ['occurrence_id'];
            isOneToOne: false;
            referencedRelation: 'event_occurrences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_attendances_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_attendances_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      event_audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          event_id: string;
          id: string;
          metadata: Json;
          occurrence_id: string | null;
          target_id: string | null;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          metadata?: Json;
          occurrence_id?: string | null;
          target_id?: string | null;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          metadata?: Json;
          occurrence_id?: string | null;
          target_id?: string | null;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_audit_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_audit_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_audit_log_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'event_events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_audit_log_occurrence_id_fkey';
            columns: ['occurrence_id'];
            isOneToOne: false;
            referencedRelation: 'event_occurrences';
            referencedColumns: ['id'];
          },
        ];
      };
      event_checkin_token_redemptions: {
        Row: {
          attendance_id: string;
          id: string;
          redeemed_at: string;
          token_id: string;
          user_id: string;
        };
        Insert: {
          attendance_id: string;
          id?: string;
          redeemed_at?: string;
          token_id: string;
          user_id: string;
        };
        Update: {
          attendance_id?: string;
          id?: string;
          redeemed_at?: string;
          token_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_checkin_token_redemptions_attendance_id_fkey';
            columns: ['attendance_id'];
            isOneToOne: false;
            referencedRelation: 'event_attendances';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkin_token_redemptions_token_id_fkey';
            columns: ['token_id'];
            isOneToOne: false;
            referencedRelation: 'event_checkin_tokens';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkin_token_redemptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkin_token_redemptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      event_checkin_tokens: {
        Row: {
          consumed_at: string | null;
          consumed_by: string | null;
          created_at: string;
          created_by: string | null;
          expires_at: string;
          id: string;
          issued_to_user_id: string | null;
          kind: Database['public']['Enums']['menta_event_checkin_token_kind'];
          occurrence_id: string;
          revoked_at: string | null;
          token_hash: string;
        };
        Insert: {
          consumed_at?: string | null;
          consumed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          expires_at: string;
          id?: string;
          issued_to_user_id?: string | null;
          kind: Database['public']['Enums']['menta_event_checkin_token_kind'];
          occurrence_id: string;
          revoked_at?: string | null;
          token_hash: string;
        };
        Update: {
          consumed_at?: string | null;
          consumed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          issued_to_user_id?: string | null;
          kind?: Database['public']['Enums']['menta_event_checkin_token_kind'];
          occurrence_id?: string;
          revoked_at?: string | null;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_checkin_tokens_consumed_by_fkey';
            columns: ['consumed_by'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkin_tokens_consumed_by_fkey';
            columns: ['consumed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkin_tokens_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkin_tokens_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkin_tokens_issued_to_user_id_fkey';
            columns: ['issued_to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkin_tokens_issued_to_user_id_fkey';
            columns: ['issued_to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkin_tokens_occurrence_id_fkey';
            columns: ['occurrence_id'];
            isOneToOne: false;
            referencedRelation: 'event_occurrences';
            referencedColumns: ['id'];
          },
        ];
      };
      event_checkins: {
        Row: {
          attendance_id: string;
          checked_in_at: string;
          id: string;
          method: Database['public']['Enums']['menta_event_checkin_token_kind'];
          revoked_at: string | null;
          token_id: string;
        };
        Insert: {
          attendance_id: string;
          checked_in_at?: string;
          id?: string;
          method: Database['public']['Enums']['menta_event_checkin_token_kind'];
          revoked_at?: string | null;
          token_id: string;
        };
        Update: {
          attendance_id?: string;
          checked_in_at?: string;
          id?: string;
          method?: Database['public']['Enums']['menta_event_checkin_token_kind'];
          revoked_at?: string | null;
          token_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_checkins_attendance_id_fkey';
            columns: ['attendance_id'];
            isOneToOne: true;
            referencedRelation: 'event_attendances';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_checkins_token_id_fkey';
            columns: ['token_id'];
            isOneToOne: false;
            referencedRelation: 'event_checkin_tokens';
            referencedColumns: ['id'];
          },
        ];
      };
      event_events: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          organiser_id: string | null;
          share_token_hash: string | null;
          status: Database['public']['Enums']['menta_event_status'];
          time_zone: string;
          title: string;
          updated_at: string;
          venue_name: string | null;
          visibility: Database['public']['Enums']['menta_event_visibility'];
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          organiser_id?: string | null;
          share_token_hash?: string | null;
          status?: Database['public']['Enums']['menta_event_status'];
          time_zone?: string;
          title: string;
          updated_at?: string;
          venue_name?: string | null;
          visibility?: Database['public']['Enums']['menta_event_visibility'];
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          organiser_id?: string | null;
          share_token_hash?: string | null;
          status?: Database['public']['Enums']['menta_event_status'];
          time_zone?: string;
          title?: string;
          updated_at?: string;
          venue_name?: string | null;
          visibility?: Database['public']['Enums']['menta_event_visibility'];
        };
        Relationships: [
          {
            foreignKeyName: 'event_events_organiser_id_fkey';
            columns: ['organiser_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_events_organiser_id_fkey';
            columns: ['organiser_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      event_invites: {
        Row: {
          created_at: string;
          created_by: string | null;
          event_id: string;
          expires_at: string | null;
          id: string;
          issued_to_user_id: string | null;
          max_uses: number;
          occurrence_id: string | null;
          revoked_at: string | null;
          token_hash: string;
          use_count: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          event_id: string;
          expires_at?: string | null;
          id?: string;
          issued_to_user_id?: string | null;
          max_uses?: number;
          occurrence_id?: string | null;
          revoked_at?: string | null;
          token_hash: string;
          use_count?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          event_id?: string;
          expires_at?: string | null;
          id?: string;
          issued_to_user_id?: string | null;
          max_uses?: number;
          occurrence_id?: string | null;
          revoked_at?: string | null;
          token_hash?: string;
          use_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'event_invites_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_invites_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_invites_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'event_events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_invites_issued_to_user_id_fkey';
            columns: ['issued_to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_invites_issued_to_user_id_fkey';
            columns: ['issued_to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_invites_occurrence_id_fkey';
            columns: ['occurrence_id'];
            isOneToOne: false;
            referencedRelation: 'event_occurrences';
            referencedColumns: ['id'];
          },
        ];
      };
      event_occurrences: {
        Row: {
          capacity: number | null;
          checkin_closes_at: string;
          checkin_opens_at: string;
          consent_version: string;
          created_at: string;
          ends_at: string;
          event_id: string;
          id: string;
          posting_closes_at: string;
          posting_opens_at: string;
          reserved_count: number;
          starts_at: string;
          state: Database['public']['Enums']['menta_event_occurrence_state'];
          updated_at: string;
        };
        Insert: {
          capacity?: number | null;
          checkin_closes_at: string;
          checkin_opens_at: string;
          consent_version: string;
          created_at?: string;
          ends_at: string;
          event_id: string;
          id?: string;
          posting_closes_at: string;
          posting_opens_at: string;
          reserved_count?: number;
          starts_at: string;
          state?: Database['public']['Enums']['menta_event_occurrence_state'];
          updated_at?: string;
        };
        Update: {
          capacity?: number | null;
          checkin_closes_at?: string;
          checkin_opens_at?: string;
          consent_version?: string;
          created_at?: string;
          ends_at?: string;
          event_id?: string;
          id?: string;
          posting_closes_at?: string;
          posting_opens_at?: string;
          reserved_count?: number;
          starts_at?: string;
          state?: Database['public']['Enums']['menta_event_occurrence_state'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_occurrences_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'event_events';
            referencedColumns: ['id'];
          },
        ];
      };
      event_posts: {
        Row: {
          caption: string | null;
          client_event_id: string;
          created_at: string;
          deleted_at: string | null;
          expected_byte_size: number;
          expected_content_type: string;
          id: string;
          media_path: string | null;
          occurrence_id: string;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          revision: number;
          status: Database['public']['Enums']['menta_event_post_status'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          caption?: string | null;
          client_event_id: string;
          created_at?: string;
          deleted_at?: string | null;
          expected_byte_size: number;
          expected_content_type: string;
          id?: string;
          media_path?: string | null;
          occurrence_id: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          revision?: number;
          status?: Database['public']['Enums']['menta_event_post_status'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          caption?: string | null;
          client_event_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          expected_byte_size?: number;
          expected_content_type?: string;
          id?: string;
          media_path?: string | null;
          occurrence_id?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          revision?: number;
          status?: Database['public']['Enums']['menta_event_post_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_posts_occurrence_id_fkey';
            columns: ['occurrence_id'];
            isOneToOne: false;
            referencedRelation: 'event_occurrences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_posts_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_posts_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_posts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_posts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_daily_status: {
        Row: {
          group_id: string;
          last_computed_at: string;
          local_date: string;
          participants_count: number;
          participation_rate: number;
          submissions_count: number;
        };
        Insert: {
          group_id: string;
          last_computed_at?: string;
          local_date: string;
          participants_count?: number;
          participation_rate?: number;
          submissions_count?: number;
        };
        Update: {
          group_id?: string;
          last_computed_at?: string;
          local_date?: string;
          participants_count?: number;
          participation_rate?: number;
          submissions_count?: number;
        };
        Relationships: [];
      };
      group_freeze_usages: {
        Row: {
          challenge_id: string | null;
          created_at: string;
          group_id: string;
          id: string;
          used_by: string;
          used_for_date: string;
        };
        Insert: {
          challenge_id?: string | null;
          created_at?: string;
          group_id: string;
          id?: string;
          used_by: string;
          used_for_date: string;
        };
        Update: {
          challenge_id?: string | null;
          created_at?: string;
          group_id?: string;
          id?: string;
          used_by?: string;
          used_for_date?: string;
        };
        Relationships: [];
      };
      group_streak_tracking: {
        Row: {
          created_at: string | null;
          current_streak: number | null;
          group_id: string;
          last_success_date: string | null;
          longest_streak: number | null;
          total_successful_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_streak?: number | null;
          group_id: string;
          last_success_date?: string | null;
          longest_streak?: number | null;
          total_successful_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_streak?: number | null;
          group_id?: string;
          last_success_date?: string | null;
          longest_streak?: number | null;
          total_successful_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'group_streak_tracking_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: true;
            referencedRelation: 'group_stats';
            referencedColumns: ['group_id'];
          },
          {
            foreignKeyName: 'group_streak_tracking_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: true;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      inventory_items: {
        Row: {
          created_at: string;
          id: string;
          is_equipped: boolean;
          item_sku: string;
          quantity: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_equipped?: boolean;
          item_sku: string;
          quantity?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_equipped?: boolean;
          item_sku?: string;
          quantity?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invite_codes: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          ref_id: string;
          type: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          ref_id: string;
          type: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          ref_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invite_codes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invite_codes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      invite_handoffs: {
        Row: {
          claimed_at: string | null;
          created_at: string;
          expires_at: string;
          handoff_token: string;
          id: string;
          invite_code: string | null;
          invite_url: string | null;
          payload: Json;
          status: string;
          target_id: string | null;
          target_type: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          claimed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          handoff_token?: string;
          id?: string;
          invite_code?: string | null;
          invite_url?: string | null;
          payload?: Json;
          status?: string;
          target_id?: string | null;
          target_type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          claimed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          handoff_token?: string;
          id?: string;
          invite_code?: string | null;
          invite_url?: string | null;
          payload?: Json;
          status?: string;
          target_id?: string | null;
          target_type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          issue_type: string | null;
          metadata: Json | null;
          status: string;
          title: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          issue_type?: string | null;
          metadata?: Json | null;
          status?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          issue_type?: string | null;
          metadata?: Json | null;
          status?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'issues_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'issues_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      legal_acceptance_enforcement_settings: {
        Row: {
          activated_at: string | null;
          enforcement_mode: string;
          scope: string;
          updated_at: string;
        };
        Insert: {
          activated_at?: string | null;
          enforcement_mode?: string;
          scope: string;
          updated_at?: string;
        };
        Update: {
          activated_at?: string | null;
          enforcement_mode?: string;
          scope?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      legal_acceptance_receipts: {
        Row: {
          acceptance_surface: string;
          accepted_at: string;
          app_build: string;
          app_platform: string;
          app_version: string;
          community_standards_url: string;
          community_standards_version: string;
          id: string;
          locale: string | null;
          privacy_policy_url: string;
          privacy_policy_version: string;
          terms_url: string;
          terms_version: string;
          user_id: string;
        };
        Insert: {
          acceptance_surface: string;
          accepted_at?: string;
          app_build: string;
          app_platform: string;
          app_version: string;
          community_standards_url: string;
          community_standards_version: string;
          id?: string;
          locale?: string | null;
          privacy_policy_url: string;
          privacy_policy_version: string;
          terms_url: string;
          terms_version: string;
          user_id: string;
        };
        Update: {
          acceptance_surface?: string;
          accepted_at?: string;
          app_build?: string;
          app_platform?: string;
          app_version?: string;
          community_standards_url?: string;
          community_standards_version?: string;
          id?: string;
          locale?: string | null;
          privacy_policy_url?: string;
          privacy_policy_version?: string;
          terms_url?: string;
          terms_version?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      legal_document_versions: {
        Row: {
          document_type: string;
          document_url: string;
          document_version: string;
          effective_at: string;
          published_at: string;
          retired_at: string | null;
        };
        Insert: {
          document_type: string;
          document_url: string;
          document_version: string;
          effective_at: string;
          published_at?: string;
          retired_at?: string | null;
        };
        Update: {
          document_type?: string;
          document_url?: string;
          document_version?: string;
          effective_at?: string;
          published_at?: string;
          retired_at?: string | null;
        };
        Relationships: [];
      };
      maintenance_logs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          execution_time_ms: number | null;
          id: string;
          job_type: string;
          results: Json | null;
          status: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          job_type: string;
          results?: Json | null;
          status: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          job_type?: string;
          results?: Json | null;
          status?: string;
        };
        Relationships: [];
      };
      maintenance_runs: {
        Row: {
          created_at: string | null;
          details: Json | null;
          id: string;
          run_timestamp: string;
          status: string;
        };
        Insert: {
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          run_timestamp?: string;
          status: string;
        };
        Update: {
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          run_timestamp?: string;
          status?: string;
        };
        Relationships: [];
      };
      notification_jobs: {
        Row: {
          attempts: number;
          created_at: string;
          id: number;
          idempotency_key: string;
          job_type: string;
          last_error: string | null;
          notification_id: number | null;
          payload: Json;
          scheduled_for: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          id?: number;
          idempotency_key: string;
          job_type: string;
          last_error?: string | null;
          notification_id?: number | null;
          payload?: Json;
          scheduled_for?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          id?: number;
          idempotency_key?: string;
          job_type?: string;
          last_error?: string | null;
          notification_id?: number | null;
          payload?: Json;
          scheduled_for?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_jobs_notification_id_fkey';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'notifications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_jobs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_jobs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          challenge_reminders: boolean;
          created_at: string;
          device_permission_checked_at: string | null;
          device_permission_status: string | null;
          email_enabled: boolean;
          marketing_email_opt_in: boolean;
          marketing_email_opted_at: string | null;
          marketing_email_provider_sync_pending: boolean;
          expo_push_token: string | null;
          group_updates: boolean;
          ignore_coach_until: string | null;
          preferred_reminder_time: string | null;
          push_app_build: number | null;
          push_platform: string | null;
          push_enabled: boolean;
          push_token_status: string | null;
          push_token_updated_at: string | null;
          quiet_hours_end: string | null;
          quiet_hours_start: string | null;
          remote_coach_activated_at: string | null;
          remote_coach_contract_version: number;
          streak_alerts: boolean;
          timezone: string | null;
          typical_proof_hour: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          challenge_reminders?: boolean;
          created_at?: string;
          device_permission_checked_at?: string | null;
          device_permission_status?: string | null;
          email_enabled?: boolean;
          marketing_email_opt_in?: boolean;
          marketing_email_opted_at?: string | null;
          marketing_email_provider_sync_pending?: boolean;
          expo_push_token?: string | null;
          group_updates?: boolean;
          ignore_coach_until?: string | null;
          preferred_reminder_time?: string | null;
          push_app_build?: number | null;
          push_platform?: string | null;
          push_enabled?: boolean;
          push_token_status?: string | null;
          push_token_updated_at?: string | null;
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          remote_coach_activated_at?: string | null;
          remote_coach_contract_version?: number;
          streak_alerts?: boolean;
          timezone?: string | null;
          typical_proof_hour?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          challenge_reminders?: boolean;
          created_at?: string;
          device_permission_checked_at?: string | null;
          device_permission_status?: string | null;
          email_enabled?: boolean;
          marketing_email_opt_in?: boolean;
          marketing_email_opted_at?: string | null;
          marketing_email_provider_sync_pending?: boolean;
          expo_push_token?: string | null;
          group_updates?: boolean;
          ignore_coach_until?: string | null;
          preferred_reminder_time?: string | null;
          push_app_build?: number | null;
          push_platform?: string | null;
          push_enabled?: boolean;
          push_token_status?: string | null;
          push_token_updated_at?: string | null;
          quiet_hours_end?: string | null;
          quiet_hours_start?: string | null;
          remote_coach_activated_at?: string | null;
          remote_coach_contract_version?: number;
          streak_alerts?: boolean;
          timezone?: string | null;
          typical_proof_hour?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_templates: {
        Row: {
          body: string;
          created_at: string | null;
          id: number;
          template_key: string;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          body: string;
          created_at?: string | null;
          id?: never;
          template_key: string;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string | null;
          id?: never;
          template_key?: string;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          delivered_at: string | null;
          delivery_attempts: number;
          delivery_error: string | null;
          delivery_failed_at: string | null;
          delivery_fallback_reason: string | null;
          delivery_provider: string | null;
          id: number;
          is_read: boolean;
          metadata: Json | null;
          notification_type: string | null;
          opened_at: string | null;
          payload: Json | null;
          priority: number;
          provider_accepted_at: string | null;
          provider_delivered_at: string | null;
          provider_message_id: string | null;
          provider_opened_at: string | null;
          provider_receipt_checked_at: string | null;
          provider_status: string | null;
          provider_token_fingerprint: string | null;
          scheduled_for: string | null;
          title: string | null;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          delivery_attempts?: number;
          delivery_error?: string | null;
          delivery_failed_at?: string | null;
          delivery_fallback_reason?: string | null;
          delivery_provider?: string | null;
          id?: never;
          is_read?: boolean;
          metadata?: Json | null;
          notification_type?: string | null;
          opened_at?: string | null;
          payload?: Json | null;
          priority?: number;
          provider_accepted_at?: string | null;
          provider_delivered_at?: string | null;
          provider_message_id?: string | null;
          provider_opened_at?: string | null;
          provider_receipt_checked_at?: string | null;
          provider_status?: string | null;
          provider_token_fingerprint?: string | null;
          scheduled_for?: string | null;
          title?: string | null;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          delivery_attempts?: number;
          delivery_error?: string | null;
          delivery_failed_at?: string | null;
          delivery_fallback_reason?: string | null;
          delivery_provider?: string | null;
          id?: never;
          is_read?: boolean;
          metadata?: Json | null;
          notification_type?: string | null;
          opened_at?: string | null;
          payload?: Json | null;
          priority?: number;
          provider_accepted_at?: string | null;
          provider_delivered_at?: string | null;
          provider_message_id?: string | null;
          provider_opened_at?: string | null;
          provider_receipt_checked_at?: string | null;
          provider_status?: string | null;
          provider_token_fingerprint?: string | null;
          scheduled_for?: string | null;
          title?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      power_up_usage: {
        Row: {
          challenge_id: string | null;
          client_event_id: string | null;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          item_sku: string;
          result_payload: Json | null;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          challenge_id?: string | null;
          client_event_id?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          item_sku: string;
          result_payload?: Json | null;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          challenge_id?: string | null;
          client_event_id?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          item_sku?: string;
          result_payload?: Json | null;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          has_completed_onboarding: boolean;
          id: string;
          is_approved: boolean;
          is_pro: boolean;
          momenta_balance: number;
          onboarded_at: string | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          has_completed_onboarding?: boolean;
          id: string;
          is_approved?: boolean;
          is_pro?: boolean;
          momenta_balance?: number;
          onboarded_at?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          has_completed_onboarding?: boolean;
          id?: string;
          is_approved?: boolean;
          is_pro?: boolean;
          momenta_balance?: number;
          onboarded_at?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      proof_encouragements: {
        Row: {
          created_at: string;
          submission_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          submission_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          submission_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'proof_encouragements_submission_id_fkey';
            columns: ['submission_id'];
            isOneToOne: false;
            referencedRelation: 'challenge_submissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'proof_encouragements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_receipt_states: {
        Row: {
          acknowledged_at: string | null;
          created_at: string;
          id: string;
          payload: Json;
          product_id: string;
          status: string;
          store: string;
          transaction_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          created_at?: string;
          id?: string;
          payload?: Json;
          product_id: string;
          status?: string;
          store?: string;
          transaction_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          created_at?: string;
          id?: string;
          payload?: Json;
          product_id?: string;
          status?: string;
          store?: string;
          transaction_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          item_id: string;
          purchased_at: string;
          user_id: string;
        };
        Insert: {
          item_id: string;
          purchased_at?: string;
          user_id: string;
        };
        Update: {
          item_id?: string;
          purchased_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchases_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchases_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchases_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      queued_proof_submissions: {
        Row: {
          challenge_id: string | null;
          client_uuid: string;
          created_at: string;
          id: string;
          last_error: string | null;
          payload: Json;
          proof_type: string;
          status: string;
          submitted_at: string | null;
          team_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          challenge_id?: string | null;
          client_uuid: string;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          proof_type: string;
          status?: string;
          submitted_at?: string | null;
          team_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          challenge_id?: string | null;
          client_uuid?: string;
          created_at?: string;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          proof_type?: string;
          status?: string;
          submitted_at?: string | null;
          team_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      rc_credit_mappings: {
        Row: {
          created_at: string;
          credits: number;
          id: number;
          product_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          credits: number;
          id?: number;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          credits?: number;
          id?: number;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rc_entitlements: {
        Row: {
          created_at: string;
          ends_at: string | null;
          entitlement_key: string;
          id: number;
          is_active: boolean;
          last_event_at: string | null;
          last_provider_event_at: string | null;
          last_provider_event_id: string | null;
          source: string | null;
          starts_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          ends_at?: string | null;
          entitlement_key: string;
          id?: number;
          is_active: boolean;
          last_event_at?: string | null;
          last_provider_event_at?: string | null;
          last_provider_event_id?: string | null;
          source?: string | null;
          starts_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string | null;
          entitlement_key?: string;
          id?: number;
          is_active?: boolean;
          last_event_at?: string | null;
          last_provider_event_at?: string | null;
          last_provider_event_id?: string | null;
          source?: string | null;
          starts_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      rc_receipts: {
        Row: {
          amount_cents: number | null;
          app_id: string | null;
          created_at: string;
          currency: string | null;
          expires_at: string | null;
          id: number;
          original_transaction_id: string | null;
          payload: Json | null;
          product_id: string;
          purchase_at: string | null;
          store: string;
          transaction_id: string;
          user_id: string | null;
        };
        Insert: {
          amount_cents?: number | null;
          app_id?: string | null;
          created_at?: string;
          currency?: string | null;
          expires_at?: string | null;
          id?: number;
          original_transaction_id?: string | null;
          payload?: Json | null;
          product_id: string;
          purchase_at?: string | null;
          store: string;
          transaction_id: string;
          user_id?: string | null;
        };
        Update: {
          amount_cents?: number | null;
          app_id?: string | null;
          created_at?: string;
          currency?: string | null;
          expires_at?: string | null;
          id?: number;
          original_transaction_id?: string | null;
          payload?: Json | null;
          product_id?: string;
          purchase_at?: string | null;
          store?: string;
          transaction_id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      rc_webhook_events: {
        Row: {
          attempt_count: number;
          entitlement_keys: string[];
          event_at: string | null;
          event_type: string;
          ignored_reason: string | null;
          last_attempt_at: string;
          payload: Json;
          processed_at: string | null;
          processing_status: string;
          provider_event_id: string;
          received_at: string;
          reconciliation_keys: string[];
          store: string;
          target_user_id: string | null;
          transaction_id: string | null;
          user_id: string | null;
        };
        Insert: {
          attempt_count?: number;
          entitlement_keys?: string[];
          event_at?: string | null;
          event_type: string;
          ignored_reason?: string | null;
          last_attempt_at?: string;
          payload: Json;
          processed_at?: string | null;
          processing_status?: string;
          provider_event_id: string;
          received_at?: string;
          reconciliation_keys?: string[];
          store: string;
          target_user_id?: string | null;
          transaction_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          attempt_count?: number;
          entitlement_keys?: string[];
          event_at?: string | null;
          event_type?: string;
          ignored_reason?: string | null;
          last_attempt_at?: string;
          payload?: Json;
          processed_at?: string | null;
          processing_status?: string;
          provider_event_id?: string;
          received_at?: string;
          reconciliation_keys?: string[];
          store?: string;
          target_user_id?: string | null;
          transaction_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'rc_webhook_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rc_webhook_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      referral_codes: {
        Row: {
          code: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'referral_codes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referral_codes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      shop_purchase_receipts: {
        Row: {
          client_event_id: string;
          cost: number;
          created_at: string;
          item_id: string;
          item_name: string;
          item_sku: string;
          new_balance: number;
          quantity: number;
          result_payload: Json;
          user_id: string;
        };
        Insert: {
          client_event_id: string;
          cost: number;
          created_at?: string;
          item_id: string;
          item_name: string;
          item_sku: string;
          new_balance: number;
          quantity: number;
          result_payload: Json;
          user_id: string;
        };
        Update: {
          client_event_id?: string;
          cost?: number;
          created_at?: string;
          item_id?: string;
          item_name?: string;
          item_sku?: string;
          new_balance?: number;
          quantity?: number;
          result_payload?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shop_purchase_receipts_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shop_purchase_receipts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shop_purchase_receipts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      streak_checkin_applications: {
        Row: {
          application_type: string;
          applied_at: string;
          challenge_id: string;
          day_status: string;
          effective_timezone: string;
          freeze_used: boolean;
          freezes_remaining: number;
          id: string;
          local_day: string;
          previous_streak: number;
          resulting_streak: number;
          submission_id: string;
          user_id: string;
        };
        Insert: {
          application_type: string;
          applied_at?: string;
          challenge_id: string;
          day_status: string;
          effective_timezone: string;
          freeze_used?: boolean;
          freezes_remaining: number;
          id?: string;
          local_day: string;
          previous_streak: number;
          resulting_streak: number;
          submission_id: string;
          user_id: string;
        };
        Update: {
          application_type?: string;
          applied_at?: string;
          challenge_id?: string;
          day_status?: string;
          effective_timezone?: string;
          freeze_used?: boolean;
          freezes_remaining?: number;
          id?: string;
          local_day?: string;
          previous_streak?: number;
          resulting_streak?: number;
          submission_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'streak_checkin_applications_challenge_id_fkey';
            columns: ['challenge_id'];
            isOneToOne: false;
            referencedRelation: 'challenges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'streak_checkin_applications_submission_id_fkey';
            columns: ['submission_id'];
            isOneToOne: true;
            referencedRelation: 'challenge_submissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'streak_checkin_applications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'streak_checkin_applications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      streak_day_outcomes: {
        Row: {
          challenge_id: string;
          created_at: string;
          effective_timezone: string;
          freeze_used: boolean;
          freezes_remaining: number;
          id: string;
          local_day: string;
          outcome: string;
          previous_streak: number;
          resulting_streak: number;
          user_id: string;
        };
        Insert: {
          challenge_id: string;
          created_at?: string;
          effective_timezone: string;
          freeze_used?: boolean;
          freezes_remaining: number;
          id?: string;
          local_day: string;
          outcome: string;
          previous_streak: number;
          resulting_streak: number;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          created_at?: string;
          effective_timezone?: string;
          freeze_used?: boolean;
          freezes_remaining?: number;
          id?: string;
          local_day?: string;
          outcome?: string;
          previous_streak?: number;
          resulting_streak?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'streak_day_outcomes_challenge_id_fkey';
            columns: ['challenge_id'];
            isOneToOne: false;
            referencedRelation: 'challenges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'streak_day_outcomes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'streak_day_outcomes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      streak_freeze_log: {
        Row: {
          challenge_id: string;
          days_saved: number | null;
          freeze_type: string | null;
          id: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          challenge_id: string;
          days_saved?: number | null;
          freeze_type?: string | null;
          id?: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          days_saved?: number | null;
          freeze_type?: string | null;
          id?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      streak_unlock_receipts: {
        Row: {
          days: number;
          granted_at: string;
          sku: string;
          user_id: string;
        };
        Insert: {
          days: number;
          granted_at?: string;
          sku: string;
          user_id: string;
        };
        Update: {
          days?: number;
          granted_at?: string;
          sku?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'streak_unlock_receipts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'streak_unlock_receipts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      system_config: {
        Row: {
          created_at: string | null;
          key: string;
          updated_at: string | null;
          value: string;
        };
        Insert: {
          created_at?: string | null;
          key: string;
          updated_at?: string | null;
          value: string;
        };
        Update: {
          created_at?: string | null;
          key?: string;
          updated_at?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      system_logs: {
        Row: {
          created_at: string | null;
          details: Json | null;
          event_type: string;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          details?: Json | null;
          event_type: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          details?: Json | null;
          event_type?: string;
          id?: string;
        };
        Relationships: [];
      };
      team_challenges: {
        Row: {
          challenge_id: string;
          created_at: string;
          group_id: string;
        };
        Insert: {
          challenge_id: string;
          created_at?: string;
          group_id: string;
        };
        Update: {
          challenge_id?: string;
          created_at?: string;
          group_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_challenges_challenge_id_fkey';
            columns: ['challenge_id'];
            isOneToOne: false;
            referencedRelation: 'challenges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_challenges_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'group_stats';
            referencedColumns: ['group_id'];
          },
          {
            foreignKeyName: 'team_challenges_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      team_members: {
        Row: {
          group_id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'group_stats';
            referencedColumns: ['group_id'];
          },
          {
            foreignKeyName: 'team_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      team_notification_preferences: {
        Row: {
          created_at: string;
          group_id: string;
          notify_all: boolean;
          notify_daily_summary: boolean;
          notify_mentions: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          notify_all?: boolean;
          notify_daily_summary?: boolean;
          notify_mentions?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          notify_all?: boolean;
          notify_daily_summary?: boolean;
          notify_mentions?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_notification_preferences_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'group_stats';
            referencedColumns: ['group_id'];
          },
          {
            foreignKeyName: 'team_notification_preferences_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          archived_at: string | null;
          cooldown_until: string | null;
          created_at: string;
          current_streak: number;
          description: string | null;
          duration_days: number;
          end_date: string | null;
          id: string;
          image_url: string | null;
          invite_code: string | null;
          kind: string;
          name: string;
          notify_on_member_miss: boolean;
          owner_id: string;
          privacy: string;
          status: string;
          start_date: string | null;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          cooldown_until?: string | null;
          created_at?: string;
          current_streak?: number;
          description?: string | null;
          duration_days?: number;
          end_date?: string | null;
          id?: string;
          image_url?: string | null;
          invite_code?: string | null;
          kind?: string;
          name: string;
          notify_on_member_miss?: boolean;
          owner_id: string;
          privacy?: string;
          status?: string;
          start_date?: string | null;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          cooldown_until?: string | null;
          created_at?: string;
          current_streak?: number;
          description?: string | null;
          duration_days?: number;
          end_date?: string | null;
          id?: string;
          image_url?: string | null;
          invite_code?: string | null;
          kind?: string;
          name?: string;
          notify_on_member_miss?: boolean;
          owner_id?: string;
          privacy?: string;
          status?: string;
          start_date?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teams_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_flags: {
        Row: {
          created_at: string | null;
          updated_at: string | null;
          user_id: string;
          welcome_bonus_dismissed: boolean | null;
          welcome_bonus_dismissed_at: string | null;
          welcome_bonus_granted: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          updated_at?: string | null;
          user_id: string;
          welcome_bonus_dismissed?: boolean | null;
          welcome_bonus_dismissed_at?: string | null;
          welcome_bonus_granted?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
          welcome_bonus_dismissed?: boolean | null;
          welcome_bonus_dismissed_at?: string | null;
          welcome_bonus_granted?: boolean | null;
        };
        Relationships: [];
      };
      user_referrals: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          referral_code: string;
          referred_user_id: string;
          referrer_user_id: string;
          reward_granted: boolean;
          reward_outcome: string;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          referral_code: string;
          referred_user_id: string;
          referrer_user_id: string;
          reward_granted?: boolean;
          reward_outcome?: string;
          status?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          referral_code?: string;
          referred_user_id?: string;
          referrer_user_id?: string;
          reward_granted?: boolean;
          reward_outcome?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_referrals_referred_profile_fkey';
            columns: ['referred_user_id'];
            isOneToOne: true;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_referrals_referred_profile_fkey';
            columns: ['referred_user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_referrals_referrer_code_fkey';
            columns: ['referrer_user_id', 'referral_code'];
            isOneToOne: false;
            referencedRelation: 'referral_codes';
            referencedColumns: ['user_id', 'code'];
          },
          {
            foreignKeyName: 'user_referrals_referrer_profile_fkey';
            columns: ['referrer_user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_referrals_referrer_profile_fkey';
            columns: ['referrer_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      wallet_transactions: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          external_reference_id: string | null;
          id: number;
          reason: string | null;
          reference_id: string | null;
          source_uuid: string | null;
          transaction_type: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          external_reference_id?: string | null;
          id?: never;
          reason?: string | null;
          reference_id?: string | null;
          source_uuid?: string | null;
          transaction_type?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          external_reference_id?: string | null;
          id?: never;
          reason?: string | null;
          reference_id?: string | null;
          source_uuid?: string | null;
          transaction_type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wallet_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profile_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wallet_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      weekly_recap_snapshots: {
        Row: {
          created_at: string;
          group_count: number;
          id: string;
          payload: Json;
          proof_days: number;
          review_count: number;
          status: string;
          updated_at: string;
          user_id: string;
          week_start: string;
        };
        Insert: {
          created_at?: string;
          group_count?: number;
          id?: string;
          payload?: Json;
          proof_days?: number;
          review_count?: number;
          status?: string;
          updated_at?: string;
          user_id: string;
          week_start: string;
        };
        Update: {
          created_at?: string;
          group_count?: number;
          id?: string;
          payload?: Json;
          proof_days?: number;
          review_count?: number;
          status?: string;
          updated_at?: string;
          user_id?: string;
          week_start?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      group_stats: {
        Row: {
          active_challenges: number | null;
          active_members: number | null;
          age_days: number | null;
          completed_challenges: number | null;
          completion_rate: number | null;
          created_at: string | null;
          current_streak: number | null;
          daily_active_members: number | null;
          duration_days: number | null;
          end_date: string | null;
          group_id: string | null;
          health_score: number | null;
          is_expired: boolean | null;
          last_success_date: string | null;
          longest_streak: number | null;
          name: string | null;
          participation_rate: number | null;
          recent_verifications: number | null;
          start_date: string | null;
          status: string | null;
          streak_goal: number | null;
          total_challenges: number | null;
          total_members: number | null;
          total_successful_days: number | null;
        };
        Relationships: [];
      };
      profile_directory: {
        Row: {
          avatar_url: string | null;
          display_name: string | null;
          id: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          display_name?: string | null;
          id?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          display_name?: string | null;
          id?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_first_miss_recovery_v1: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      claim_first_miss_recovery_v1: {
        Args: { p_outcome_id: string };
        Returns: Json;
      };
      accept_current_legal_documents: {
        Args: {
          p_acceptance_surface: string;
          p_app_build: string;
          p_app_platform: string;
          p_app_version: string;
          p_community_standards_version: string;
          p_expected_user_id: string;
          p_locale?: string;
          p_privacy_policy_version: string;
          p_terms_version: string;
        };
        Returns: Json;
      };
      accept_referral_v2: { Args: { p_referral_code: string }; Returns: Json };
      activate_power_up:
        | {
            Args: {
              p_challenge_id?: string;
              p_item_sku: string;
              p_user_id: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_challenge_id?: string;
              p_duration_hours?: number;
              p_item_sku: string;
              p_user_id: string;
            };
            Returns: boolean;
          }
        | {
            Args: { power_up_sku: string; target_user_id: string };
            Returns: undefined;
          };
      activate_remote_coach_v1: {
        Args: { p_contract_version?: number; p_user_id: string };
        Returns: boolean;
      };
      active_memberships_for_user: {
        Args: { p_user_id: string };
        Returns: number;
      };
      add_momenta_currency:
        | {
            Args: {
              p_amount: number;
              p_description?: string;
              p_user_id: string;
            };
            Returns: string;
          }
        | {
            Args: {
              currency_amount: number;
              reason_text?: string;
              target_user_id: string;
              transaction_type_input?: string;
            };
            Returns: undefined;
          };
      add_momenta_transaction: {
        Args: {
          p_amount: number;
          p_reason: string;
          p_reference_id?: string;
          p_transaction_type: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      add_user_momenta: {
        Args: { p_amount: number; p_reason?: string; p_user_id: string };
        Returns: Json;
      };
      advance_deadline: {
        Args: { p_challenge_id: string; p_hours: number };
        Returns: undefined;
      };
      anchor_unapplied_approved_checkin: {
        Args: {
          p_challenge_id: string;
          p_exclude_submission_id?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      anonymize_current_user: { Args: never; Returns: undefined };
      apply_approved_streak_checkin: {
        Args: {
          p_challenge_id: string;
          p_effective_tz: string;
          p_local_day: string;
          p_submission_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      apply_double_points: {
        Args: { p_challenge_id: string; p_user_id: string };
        Returns: Json;
      };
      apply_group_shield: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: Json;
      };
      apply_revenuecat_webhook_event: {
        Args: {
          p_amount_cents: number;
          p_credit_amount: number;
          p_credit_description: string;
          p_credit_external_reference_id: string;
          p_credit_reason: string;
          p_credit_transaction_type: string;
          p_currency: string;
          p_entitlement_keys: string[];
          p_entitlement_state: boolean;
          p_event_at: string;
          p_event_type: string;
          p_expires_at: string;
          p_original_transaction_id: string;
          p_payload: Json;
          p_product_id: string;
          p_provider_event_id: string;
          p_purchase_at: string;
          p_store: string;
          p_transaction_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      apply_streak_freeze: {
        Args: {
          p_challenge_id: string;
          p_duration_hours?: number;
          p_user_id: string;
        };
        Returns: Json;
      };
      archive_completed_challenges: { Args: never; Returns: Json };
      archive_failed_group: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: Json;
      };
      award_momenta: {
        Args: {
          p_base_amount: number;
          p_reason: string;
          p_reference_id?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      block_user_v1: {
        Args: {
          p_blocked_user_id: string;
          p_client_event_id: string;
          p_expected_blocker_id: string;
          p_reason?: string;
        };
        Returns: Json;
      };
      calculate_challenge_completion_reward: {
        Args: { p_challenge_id: string };
        Returns: number;
      };
      calculate_group_streak: { Args: { group_uuid: string }; Returns: number };
      calculate_points_with_multipliers: {
        Args: {
          p_base_points: number;
          p_challenge_id: string;
          p_user_id: string;
        };
        Returns: number;
      };
      can_join_challenge: {
        Args: { p_challenge_id: string; p_user_id: string };
        Returns: boolean;
      };
      can_send_notification_to_user: {
        Args: {
          p_notification_type: string;
          p_priority?: number;
          p_user_id: string;
        };
        Returns: boolean;
      };
      cancel_pending_referral_v2: { Args: never; Returns: Json };
      check_challenge_deadline: {
        Args: { p_challenge_id: string; p_check_time?: string };
        Returns: Json;
      };
      check_power_up_inventory:
        | {
            Args: { p_user_id: string };
            Returns: {
              count: number;
              name: string;
              sku: string;
            }[];
          }
        | { Args: { p_item_sku: string; p_user_id: string }; Returns: Json };
      check_power_up_inventory_for_sku: {
        Args: { p_item_sku: string; p_user_id: string };
        Returns: Json;
      };
      check_submission_rate_limit: {
        Args: { p_ip_address: unknown };
        Returns: boolean;
      };
      check_welcome_bonus_status: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      claim_momenta_reward: {
        Args: {
          p_reference_id?: string;
          p_reward_type: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      claim_proof_ad_break: {
        Args: { p_submission_id: string };
        Returns: Json;
      };
      claim_notification_batch_v1: {
        Args: { p_batch_size?: number; p_lease_seconds?: number };
        Returns: {
          body: string;
          claimed_job_id: number;
          delivery_attempts: number;
          metadata: Json;
          notification_id: number;
          notification_type: string;
          payload: Json;
          priority: number;
          target_user_id: string;
          title: string;
        }[];
      };
      claim_referral_code: {
        Args: { p_referral_code: string };
        Returns: {
          already_claimed: boolean;
          referral_id: string;
          result_code: string;
          reward_granted: boolean;
          status: string;
          success: boolean;
        }[];
      };
      claim_streak_shop_unlocks: { Args: never; Returns: Json };
      cleanup_expired_power_ups: { Args: never; Returns: undefined };
      cleanup_old_creation_attempts: { Args: never; Returns: undefined };
      cleanup_user_session:
        | { Args: never; Returns: undefined }
        | { Args: { user_uuid: string }; Returns: undefined };
      consume_edge_rate_limit: {
        Args: {
          p_actor_key_hash: string;
          p_endpoint: string;
          p_max_requests: number;
          p_window_minutes: number;
        };
        Returns: {
          allowed: boolean;
          request_count: number;
          retry_after_seconds: number;
        }[];
      };
      create_accountability_challenge: {
        Args: {
          p_allow_extensions?: boolean;
          p_allow_self_review?: boolean;
          p_category?: string;
          p_cost?: number;
          p_deadline_type?: string;
          p_description?: string;
          p_difficulty?: string;
          p_duration?: number;
          p_end_date?: string;
          p_group_id?: string;
          p_is_public?: boolean;
          p_max_extensions?: number;
          p_points?: number;
          p_start_date?: string;
          p_submission_text?: string;
          p_title: string;
          p_verification_description?: string;
          p_verification_frequency?: string;
          p_verification_type?: string;
        };
        Returns: Json;
      };
      create_accountability_challenge_without_legal_gate: {
        Args: {
          p_allow_extensions?: boolean;
          p_allow_self_review?: boolean;
          p_category?: string;
          p_cost?: number;
          p_deadline_type?: string;
          p_description?: string;
          p_difficulty?: string;
          p_duration?: number;
          p_end_date?: string;
          p_group_id?: string;
          p_is_public?: boolean;
          p_max_extensions?: number;
          p_points?: number;
          p_start_date?: string;
          p_submission_text?: string;
          p_title: string;
          p_verification_description?: string;
          p_verification_frequency?: string;
          p_verification_type?: string;
        };
        Returns: Json;
      };
      create_accountability_group: {
        Args: {
          p_cost?: number;
          p_description?: string;
          p_duration_days?: number;
          p_name: string;
          p_privacy?: string;
        };
        Returns: Json;
      };
      create_accountability_group_v2: {
        Args: {
          p_cost?: number;
          p_description?: string;
          p_duration_days?: number;
          p_image_preset?: string;
          p_name: string;
          p_privacy?: string;
        };
        Returns: Json;
      };
      create_accountability_group_v3: {
        Args: {
          p_client_event_id: string;
          p_description?: string | null;
          p_duration_days?: number;
          p_image_preset?: string | null;
          p_name: string;
          p_notify_on_member_miss?: boolean;
          p_privacy?: string;
        };
        Returns: Json;
      };
      begin_promise_accountability_invite_v1: {
        Args: { p_challenge_id: string; p_role: string };
        Returns: Json;
      };
      create_onboarding_group_with_first_promise_v1: {
        Args: {
          p_description?: string;
          p_first_promise_id: string;
          p_image_preset?: string;
          p_member_nudges?: boolean;
          p_name: string;
          p_privacy?: string;
        };
        Returns: Json;
      };
      ensure_promise_accountability_v1: {
        Args: { p_challenge_id: string; p_role?: string };
        Returns: Json;
      };
      get_promise_accountability_v1: {
        Args: { p_challenge_id: string };
        Returns: Json;
      };
      get_promise_accountability_invite_preview_v1: {
        Args: { p_invite_code: string };
        Returns: Json;
      };
      create_challenge_with_payment: {
        Args: {
          p_allow_extensions: boolean;
          p_allow_self_review: boolean;
          p_category: string;
          p_cost: number;
          p_deadline_type: string;
          p_description: string;
          p_difficulty: string;
          p_duration: number;
          p_end_date: string;
          p_group_id: string;
          p_is_public: boolean;
          p_max_extensions: number;
          p_points: number;
          p_start_date: string;
          p_submission_text: string;
          p_title: string;
          p_user_id: string;
          p_verification_description: string;
          p_verification_frequency: string;
          p_verification_type: string;
        };
        Returns: Json;
      };
      create_group_with_payment: {
        Args: {
          p_cost: number;
          p_description: string;
          p_duration_days: number;
          p_name: string;
          p_privacy?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      create_group_with_streak_rules: {
        Args: {
          p_allow_recovery?: boolean;
          p_daily_summaries?: boolean;
          p_description?: string;
          p_failure_threshold_days?: number;
          p_min_participation_rate?: number;
          p_name: string;
          p_notify_on_member_miss?: boolean;
          p_owner_id: string;
          p_privacy_level?: string;
          p_streak_goal?: number;
        };
        Returns: string;
      };
      create_test_group_with_members: {
        Args: { p_member_count: number; p_owner_id: string };
        Returns: {
          created_members: number;
          group_id: string;
        }[];
      };
      current_session_is_active: { Args: never; Returns: boolean };
      current_utc_end_of_day: { Args: never; Returns: string };
      daily_group_processing: { Args: never; Returns: undefined };
      daily_maintenance: { Args: never; Returns: Json };
      debit_user_momenta_if_sufficient: {
        Args: {
          p_amount: number;
          p_reason: string;
          p_reference_id?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      delete_auth_user: { Args: never; Returns: undefined };
      delete_my_account: { Args: never; Returns: Json };
      detect_suspicious_activity: { Args: never; Returns: undefined };
      dismiss_welcome_bonus: { Args: { p_user_id: string }; Returns: Json };
      ensure_first_promise_v1: {
        Args: {
          p_allow_extensions?: boolean;
          p_allow_self_review?: boolean;
          p_category?: string;
          p_cost?: number;
          p_deadline_type?: string;
          p_description?: string;
          p_difficulty?: string;
          p_duration?: number;
          p_end_date?: string;
          p_group_id?: string;
          p_is_public?: boolean;
          p_max_extensions?: number;
          p_points?: number;
          p_start_date?: string;
          p_submission_text?: string;
          p_title: string;
          p_verification_description?: string;
          p_verification_frequency?: string;
          p_verification_type?: string;
        };
        Returns: Json;
      };
      equip_owned_item: {
        Args: { p_category: string; p_item_id: string; p_user_id: string };
        Returns: Json;
      };
      event_can_read_own_media_v1: {
        Args: { p_path: string };
        Returns: boolean;
      };
      event_complete_post_delete_v1: {
        Args: {
          p_actor_id: string;
          p_client_event_id: string;
          p_post_id: string;
          p_request_hash: string;
        };
        Returns: Json;
      };
      event_create_v1: {
        Args: {
          p_access_token: string;
          p_access_token_hash: string;
          p_actor_id: string;
          p_capacity: number;
          p_checkin_token: string;
          p_checkin_token_hash: string;
          p_client_event_id: string;
          p_description: string;
          p_ends_at: string;
          p_request_hash: string;
          p_starts_at: string;
          p_time_zone: string;
          p_title: string;
          p_venue_name: string;
          p_visibility: Database['public']['Enums']['menta_event_visibility'];
        };
        Returns: Json;
      };
      event_finalise_post_v1: {
        Args: {
          p_actor_id: string;
          p_client_event_id: string;
          p_post_id: string;
          p_request_hash: string;
        };
        Returns: Json;
      };
      event_get_attendee_album_v1: {
        Args: { p_occurrence_id: string };
        Returns: Json;
      };
      event_get_event_summary_v1: {
        Args: {
          p_event_id: string;
          p_invite_token_hash?: string;
          p_share_token_hash?: string;
        };
        Returns: Json;
      };
      event_get_my_occurrence_v1: {
        Args: { p_actor_id: string; p_occurrence_id: string };
        Returns: Json;
      };
      event_get_organiser_recap_v1: {
        Args: { p_event_id: string };
        Returns: Json;
      };
      event_get_organiser_review_queue_v1: {
        Args: { p_occurrence_id: string };
        Returns: Json;
      };
      event_join_v1: {
        Args: {
          p_actor_id: string;
          p_client_event_id: string;
          p_consent_version: string;
          p_invite_token_hash?: string;
          p_occurrence_id: string;
          p_request_hash: string;
          p_share_token_hash?: string;
        };
        Returns: Json;
      };
      event_leave_v1: {
        Args: {
          p_actor_id: string;
          p_client_event_id: string;
          p_occurrence_id: string;
          p_request_hash: string;
        };
        Returns: Json;
      };
      event_list_public_summaries_v1: { Args: never; Returns: Json };
      event_media_path_parts: {
        Args: { p_path: string };
        Returns: {
          occurrence_id: string;
          owner_id: string;
          post_id: string;
        }[];
      };
      event_prepare_post_delete_v1: {
        Args: {
          p_actor_id: string;
          p_client_event_id: string;
          p_post_id: string;
          p_request_hash: string;
        };
        Returns: Json;
      };
      event_prepare_post_upload_v1: {
        Args: {
          p_actor_id: string;
          p_byte_size: number;
          p_caption: string;
          p_client_event_id: string;
          p_content_type: string;
          p_occurrence_id: string;
          p_request_hash: string;
        };
        Returns: Json;
      };
      event_reconcile_occurrence_lifecycle_v1: { Args: never; Returns: number };
      event_redeem_checkin_v1: {
        Args: {
          p_actor_id: string;
          p_client_event_id: string;
          p_occurrence_id: string;
          p_request_hash: string;
          p_token_hash: string;
        };
        Returns: Json;
      };
      event_review_post_v1: {
        Args: {
          p_actor_id: string;
          p_client_event_id: string;
          p_decision: string;
          p_expected_revision: number;
          p_note?: string;
          p_post_id: string;
          p_request_hash: string;
        };
        Returns: Json;
      };
      event_safe_uuid: { Args: { p_value: string }; Returns: string };
      extend_challenge_duration: {
        Args: {
          p_additional_days?: number;
          p_challenge_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      extend_group_duration: {
        Args: {
          p_additional_days?: number;
          p_group_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      fix_schedule_alignment: {
        Args: { p_fix_strategy?: string; p_group_id: string };
        Returns: {
          action_taken: string;
          challenge_id: string;
          group_id: string;
          new_end_date: string;
          new_start_date: string;
          old_end_date: string;
          old_start_date: string;
        }[];
      };
      fn_set_user_approval: {
        Args: { p_approved: boolean; p_user_id: string };
        Returns: undefined;
      };
      force_challenge_completion: {
        Args: { p_challenge_id: string };
        Returns: undefined;
      };
      force_expire_challenge: {
        Args: { p_challenge_id: string };
        Returns: undefined;
      };
      force_group_streak_failure: {
        Args: { p_group_id: string };
        Returns: undefined;
      };
      generate_test_submissions: {
        Args: { p_challenge_id: string; p_count: number };
        Returns: number;
      };
      generate_user_referral_code: { Args: never; Returns: string };
      get_active_power_ups: {
        Args: { p_user_id: string };
        Returns: {
          challenge_id: string;
          challenge_name: string;
          expires_at: string;
          item_sku: string;
        }[];
      };
      get_available_streak_freezes: {
        Args: { p_user_id: string };
        Returns: number;
      };
      get_challenge_completion_percentage: {
        Args: { challenge_id_param: string; user_id_param: string };
        Returns: Json;
      };
      get_challenge_status_summary: {
        Args: { p_challenge_id: string };
        Returns: {
          approved_submissions: number;
          challenge_title: string;
          days_remaining: number;
          participation_rate: number;
          pending_submissions: number;
          rejected_submissions: number;
          status: string;
          total_participants: number;
          total_submissions: number;
        }[];
      };
      get_challenges_expiring_soon: {
        Args: never;
        Returns: {
          challenge_id: string;
          current_streak: number;
          hours_until_expiry: number;
          title: string;
          user_id: string;
          username: string;
        }[];
      };
      get_coach_messages_due: {
        Args: never;
        Returns: {
          challenge_id: string;
          challenge_title: string;
          freeze_remaining: number;
          hours_remaining: number;
          idempotency_key: string;
          local_day: string;
          open_promise_count: number;
          proof_due_label: string;
          reminder_kind: string;
          streak_length: number;
          user_id: string;
          username: string;
        }[];
      };
      get_coach_messages_due_unfiltered_v1: {
        Args: never;
        Returns: {
          challenge_id: string;
          challenge_title: string;
          freeze_remaining: number;
          hours_remaining: number;
          idempotency_key: string;
          local_day: string;
          open_promise_count: number;
          proof_due_label: string;
          reminder_kind: string;
          streak_length: number;
          user_id: string;
          username: string;
        }[];
      };
      get_create_group_cost: { Args: never; Returns: number };
      get_creation_attempt_stats: {
        Args: { p_hours?: number; p_user_id?: string };
        Returns: {
          common_errors: string[];
          failed_attempts: number;
          success_rate: number;
          successful_attempts: number;
          total_attempts: number;
        }[];
      };
      get_cron_job_status: {
        Args: never;
        Returns: {
          active: boolean;
          jobname: string;
          last_run: string;
          next_run: string;
          schedule: string;
        }[];
      };
      get_current_legal_document_versions: { Args: never; Returns: Json };
      get_economy_contract_v1: { Args: never; Returns: Json };
      get_effective_streak_timezone: {
        Args: {
          p_challenge_id: string;
          p_client_tz?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      get_group_accountability_board: {
        Args: { p_group_id: string };
        Returns: {
          avatar_url: string;
          display_name: string;
          is_current_user: boolean;
          media_type: string;
          submission_id: string;
          submission_status: string;
          submitted_at: string;
          user_id: string;
          username: string;
        }[];
      };
      get_group_daily_status: {
        Args: { p_group_id: string };
        Returns: {
          end_of_day_utc: string;
          group_at_risk: boolean;
          group_id: string;
          misses_to_break_streak: number;
          pending_reviews: number;
          pending_submissions: number;
          seconds_remaining: number;
          submitted_today: number;
          total_members: number;
        }[];
      };
      get_group_health_status: {
        Args: { p_group_id: string };
        Returns: {
          active_challenges: number;
          active_members: number;
          group_health_status: string;
          group_name: string;
          recent_activity_rate: number;
          total_members: number;
        }[];
      };
      get_group_risk_data: { Args: { p_group_id: string }; Returns: Json };
      get_last_maintenance_run: {
        Args: never;
        Returns: {
          details: Json;
          run_timestamp: string;
          status: string;
        }[];
      };
      get_my_account_activation_v1: { Args: never; Returns: Json };
      get_my_legal_acceptance_status: {
        Args: { p_expected_user_id: string };
        Returns: Json;
      };
      get_my_pro_authority: {
        Args: never;
        Returns: {
          is_pro: boolean;
          reconciliation_pending: boolean;
        }[];
      };
      get_my_profile: {
        Args: never;
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          email: string;
          has_completed_onboarding: boolean;
          id: string;
          is_approved: boolean;
          is_pro: boolean;
          momenta_balance: number;
          updated_at: string;
          username: string;
        }[];
      };
      get_my_referral_program_v2: { Args: never; Returns: Json };
      get_my_revenuecat_ad_reward_receipt: {
        Args: { p_client_transaction_id: string };
        Returns: Json;
      };
      get_my_referral_stats: {
        Args: never;
        Returns: {
          cancelled_referrals: number;
          completed_referrals: number;
          pending_referrals: number;
          referral_code: string;
          rewards_granted: number;
          total_referrals: number;
        }[];
      };
      get_notification_preferences: {
        Args: { p_timezone?: string; p_user_id: string };
        Returns: Json;
      };
      get_proof_ad_break_hint: {
        Args: { p_submission_id: string };
        Returns: Json;
      };
      get_or_create_my_referral_code: {
        Args: never;
        Returns: {
          created_at: string;
          referral_code: string;
        }[];
      };
      get_pending_review_reminders: {
        Args: never;
        Returns: {
          challenge_id: string;
          challenge_title: string;
          pending_count: number;
          reviewer_id: string;
          reviewer_username: string;
          submitter_name: string;
        }[];
      };
      get_popular_search_terms: {
        Args: { days_back?: number; limit_count?: number };
        Returns: {
          avg_result_count: number;
          query: string;
          search_count: number;
        }[];
      };
      get_quota_limit: { Args: { p_key: string }; Returns: number };
      get_recently_expired_challenges: {
        Args: never;
        Returns: {
          challenge_id: string;
          current_streak: number;
          hours_until_expiry: number;
          title: string;
          user_id: string;
          username: string;
        }[];
      };
      get_schedule_alignment_info: {
        Args: { p_challenge_id?: string; p_group_id?: string };
        Returns: {
          alignment_status: string;
          challenge_end_date: string;
          challenge_id: string;
          challenge_start_date: string;
          challenge_title: string;
          group_end_date: string;
          group_id: string;
          group_name: string;
          group_start_date: string;
          warnings: string[];
        }[];
      };
      get_search_suggestions: {
        Args: { limit_count?: number; partial_query: string };
        Returns: {
          popularity_score: number;
          suggestion: string;
        }[];
      };
      get_server_time: { Args: never; Returns: string };
      get_server_utc_time: { Args: never; Returns: Json };
      get_submission_status_for_day: {
        Args: { p_challenge_id: string; p_date: string; p_user_id: string };
        Returns: {
          media_url: string;
          status: string;
        }[];
      };
      get_submit_reminders_due: {
        Args: never;
        Returns: {
          challenge_id: string;
          challenge_title: string;
          idempotency_key: string;
          reminder_kind: string;
          user_id: string;
          username: string;
        }[];
      };
      get_today_accountability_v2: {
        Args: { p_timezone: string };
        Returns: {
          at_risk: boolean;
          challenge_id: string;
          challenge_title: string;
          correction_reason: string;
          current_streak: number;
          days_since_accepted_check_in: number;
          duration: number;
          effective_timezone: string;
          freeze_used: boolean;
          freezes_remaining: number;
          group_id: string;
          group_name: string;
          is_solo: boolean;
          local_day: string;
          longest_streak: number;
          outcome_local_day: string;
          previous_streak: number;
          proof_status: string;
          resulting_streak: number;
          start_date: string;
          streak_outcome: string;
          submission_id: string;
          verification_type: string;
        }[];
      };
      get_today_home_v1: { Args: { p_timezone: string }; Returns: Json };
      get_today_obligations: {
        Args: { p_timezone: string };
        Returns: {
          challenge_id: string;
          challenge_title: string;
          correction_reason: string;
          current_streak: number;
          duration: number;
          group_id: string;
          group_name: string;
          is_solo: boolean;
          local_day: string;
          proof_status: string;
          start_date: string;
          submission_id: string;
          verification_type: string;
        }[];
      };
      get_today_pending_reviews: {
        Args: { p_timezone: string };
        Returns: {
          challenge_id: string;
          challenge_title: string;
          group_id: string;
          group_name: string;
          review_id: string;
          submitted_at: string;
          submitter_name: string;
        }[];
      };
      get_todays_submission_status: {
        Args: { p_challenge_id: string; p_tz?: string; p_user_id: string };
        Returns: {
          has_submitted: boolean;
          submission_status: string;
          submission_url: string;
        }[];
      };
      get_user_by_referral_code: {
        Args: { p_referral_code: string };
        Returns: {
          id: string;
          username: string;
        }[];
      };
      get_user_notification_preferences: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      get_welcome_bonus_status: { Args: { p_user_id: string }; Returns: Json };
      grant_momenta_credit: {
        Args: {
          p_amount: number;
          p_description?: string;
          p_external_reference_id?: string;
          p_reason?: string;
          p_transaction_type?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      grant_pro_period_freeze_v1: {
        Args: { p_period_reference: string; p_user_id: string };
        Returns: Json;
      };
      grant_pro_period_freeze_v2: {
        Args: {
          p_user_id: string;
          p_period_reference: string;
          p_quantity: number;
        };
        Returns: Json;
      };
      grant_welcome_bonus_once: {
        Args: { p_amount?: number; p_user_id: string };
        Returns: Json;
      };
      group_day_window: {
        Args: { p_at?: string; p_group_id: string };
        Returns: {
          window_end_utc: string;
          window_start_utc: string;
        }[];
      };
      groups_health_check: { Args: never; Returns: Json };
      has_submitted_today:
        | {
            Args: { p_challenge_id: string; p_tz?: string; p_user_id: string };
            Returns: boolean;
          }
        | { Args: { params: Json }; Returns: boolean };
      invoke_daily_maintenance: { Args: never; Returns: undefined };
      is_approved_user: { Args: never; Returns: boolean };
      is_current_user_admin: { Args: never; Returns: boolean };
      is_current_user_team_admin: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
      is_current_user_team_member: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
      is_current_user_team_owner: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
      is_email_approved: { Args: { p_email: string }; Returns: boolean };
      is_group_accessible: { Args: { p_group_id: string }; Returns: Json };
      is_streak_freeze_sku: { Args: { p_item_sku: string }; Returns: boolean };
      is_user_member: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_valid_uuid: { Args: { input_text: string }; Returns: boolean };
      join_accountability_group: {
        Args: { p_cost?: number; p_invite_code: string };
        Returns: Json;
      };
      join_challenge: {
        Args: { p_challenge_id: string; p_invite_code?: string };
        Returns: {
          at_risk: boolean;
          challenge_id: string;
          completion_percentage: number;
          current_streak: number;
          id: string;
          joined_at: string;
          last_check_in: string | null;
          last_check_in_local_date: string | null;
          last_check_in_tz: string | null;
          last_freeze_used: string | null;
          last_submission_date: string | null;
          longest_streak: number;
          milestone_reached: number;
          status: string;
          streak_count: number | null;
          streak_freezes_remaining: number;
          streak_outcome_tracking_started_at: string | null;
          updated_at: string;
          used_extensions: number;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'challenge_participants';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      join_challenge_with_funding_v1: {
        Args: {
          p_challenge_id: string;
          p_client_event_id: string;
          p_invite_code: string;
          p_quote_id: string;
        };
        Returns: Json;
      };
      join_promise_accountability_v2: {
        Args: {
          p_challenge_id: string;
          p_client_event_id: string;
          p_invite_code: string;
          p_quote_id: string;
        };
        Returns: Json;
      };
      join_group_with_payment: {
        Args: { p_cost: number; p_invite_code: string; p_user_id: string };
        Returns: Json;
      };
      join_public_group_v2: {
        Args: { p_group_id: string; p_expected_cost: number };
        Returns: Json;
      };
      cancel_account_deletion_v1: {
        Args: { p_actor_id: string; p_client_event_id: string };
        Returns: Json;
      };
      commit_account_deletion_v1: {
        Args: { p_actor_id: string; p_client_event_id: string };
        Returns: Json;
      };
      delete_accountability_challenge_v2: {
        Args: {
          p_challenge_id: string;
          p_check_only?: boolean;
          p_client_event_id: string;
        };
        Returns: Json;
      };
      prepare_account_deletion_v1: {
        Args: { p_actor_id: string; p_client_event_id: string };
        Returns: Json;
      };
      leave_accountability_challenge_v1: {
        Args: { p_challenge_id: string };
        Returns: Json;
      };
      leave_promise_accountability_v1: {
        Args: { p_challenge_id: string };
        Returns: Json;
      };
      leave_promise_accountability_v2: {
        Args: {
          p_challenge_id: string;
          p_check_only?: boolean;
          p_client_event_id: string;
        };
        Returns: Json;
      };
      manage_promise_accountability_member_v1: {
        Args: {
          p_challenge_id: string;
          p_member_id: string;
          p_remove?: boolean;
          p_role?: string;
        };
        Returns: Json;
      };
      leave_challenge: {
        Args: { p_challenge_id: string };
        Returns: {
          at_risk: boolean;
          challenge_id: string;
          completion_percentage: number;
          current_streak: number;
          id: string;
          joined_at: string;
          last_check_in: string | null;
          last_check_in_local_date: string | null;
          last_check_in_tz: string | null;
          last_freeze_used: string | null;
          last_submission_date: string | null;
          longest_streak: number;
          milestone_reached: number;
          status: string;
          streak_count: number | null;
          streak_freezes_remaining: number;
          streak_outcome_tracking_started_at: string | null;
          updated_at: string;
          used_extensions: number;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'challenge_participants';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      list_authorized_challenge_participants: {
        Args: { p_challenge_id: string };
        Returns: {
          avatar_url: string;
          current_streak: number;
          joined_at: string;
          user_id: string;
          username: string;
        }[];
      };
      list_authorized_group_members: {
        Args: { p_group_id: string };
        Returns: {
          avatar_url: string;
          display_name: string;
          joined_at: string;
          role: string;
          user_id: string;
          username: string;
        }[];
      };
      list_my_referrals: {
        Args: { p_limit?: number };
        Returns: {
          completed_at: string;
          created_at: string;
          referral_id: string;
          reward_granted: boolean;
          status: string;
        }[];
      };
      list_my_referrals_v2: {
        Args: { p_limit?: number };
        Returns: {
          completed_at: string;
          created_at: string;
          inviter_reward_amount: number;
          referral_id: string;
          reward_granted: boolean;
          reward_outcome: string;
          status: string;
        }[];
      };
      list_orphaned_proof_media: {
        Args: { p_limit?: number; p_older_than?: string };
        Returns: {
          object_name: string;
        }[];
      };
      list_streak_maintenance_candidates: {
        Args: {
          p_after_challenge_id?: string;
          p_after_user_id?: string;
          p_limit?: number;
        };
        Returns: {
          challenge_id: string;
          user_id: string;
        }[];
      };
      log_maintenance_run: {
        Args: {
          p_error_message?: string;
          p_execution_time_ms?: number;
          p_job_type: string;
          p_results?: Json;
          p_status: string;
        };
        Returns: string;
      };
      log_security_event: {
        Args: { details?: Json; event_type: string; user_id: string };
        Returns: undefined;
      };
      maintain_streak_participant: {
        Args: { p_challenge_id: string; p_user_id: string };
        Returns: Json;
      };
      notify_group_member_missed_streak: {
        Args: never;
        Returns: {
          notifications_sent: number;
        }[];
      };
      notify_group_streak_warning: {
        Args: never;
        Returns: {
          notifications_sent: number;
        }[];
      };
      notify_verification_approval: {
        Args: { p_reviewer_id: string; p_verification_id: string };
        Returns: Json;
      };
      notify_verification_rejection: {
        Args: {
          p_review_notes: string;
          p_reviewer_id: string;
          p_verification_id: string;
        };
        Returns: Json;
      };
      preview_group_invite_guest_v1: {
        Args: { p_invite_code: string };
        Returns: Json;
      };
      preview_group_invite_v2: {
        Args: { p_invite_code: string };
        Returns: Json;
      };
      process_expired_challenges: { Args: never; Returns: undefined };
      process_expired_groups: { Args: never; Returns: undefined };
      process_group_failures: {
        Args: never;
        Returns: {
          processed_count: number;
        }[];
      };
      process_group_failures_enhanced: {
        Args: never;
        Returns: {
          failure_reason: string;
          group_id: string;
          group_name: string;
          new_status: string;
          previous_status: string;
          status_changed: boolean;
        }[];
      };
      purchase_shop_item:
        | { Args: { p_item_id: string; p_user_id: string }; Returns: Json }
        | {
            Args: {
              p_client_event_id: string;
              p_item_id: string;
              p_user_id: string;
            };
            Returns: Json;
          }
        | { Args: { p_item_sku: string; p_user_id: string }; Returns: boolean };
      purge_expired_edge_rate_limits: {
        Args: { p_retention?: string };
        Returns: number;
      };
      quota_status: { Args: { p_user_id?: string }; Returns: Json };
      quote_challenge_join_v1: {
        Args: { p_challenge_id?: string; p_invite_code?: string };
        Returns: Json;
      };
      quote_promise_accountability_join_v2: {
        Args: { p_challenge_id?: string; p_invite_code?: string };
        Returns: Json;
      };
      read_challenge_join_status_v1: {
        Args: { p_challenge_id: string; p_client_event_id: string };
        Returns: Json;
      };
      read_promise_accountability_join_status_v2: {
        Args: { p_challenge_id: string; p_client_event_id: string };
        Returns: Json;
      };
      read_saved_group_creation_status_v1: {
        Args: { p_client_event_id: string };
        Returns: Json;
      };
      require_current_legal_acceptance: {
        Args: { p_scope?: string };
        Returns: undefined;
      };
      set_promise_accountability_invite_role_v1: {
        Args: {
          p_challenge_id: string;
          p_invite_code: string;
          p_role: string;
        };
        Returns: Json;
      };
      request_test_notification_v1: {
        Args: never;
        Returns: {
          notification_id: number;
          status: string;
        }[];
      };
      reset_all_test_data: {
        Args: never;
        Returns: {
          records_deleted: number;
          table_name: string;
        }[];
      };
      reset_challenge_for_testing: {
        Args: { p_challenge_id: string };
        Returns: Json;
      };
      reset_challenge_progress: {
        Args: { p_challenge_id: string };
        Returns: undefined;
      };
      reset_group_for_testing: { Args: { p_group_id: string }; Returns: Json };
      reset_missed_streaks: {
        Args: never;
        Returns: {
          at_risk_count: number;
          reset_count: number;
        }[];
      };
      resolve_streak_day_outcomes: {
        Args: {
          p_challenge_id: string;
          p_effective_tz?: string;
          p_through_local_day?: string;
          p_user_id: string;
        };
        Returns: {
          missed_count: number;
          protected_count: number;
          resolved_count: number;
        }[];
      };
      review_challenge_verification: {
        Args: {
          p_review_notes?: string;
          p_status: string;
          p_verification_id: string;
        };
        Returns: Json;
      };
      run_complete_group_scenario: {
        Args: { p_group_id: string };
        Returns: {
          result: string;
          scenario_step: string;
          step_timestamp: string;
        }[];
      };
      run_daily_maintenance: { Args: never; Returns: Json };
      safe_add_group_member: {
        Args: { p_group_id: string; p_role?: string; p_user_id: string };
        Returns: boolean;
      };
      search_all: {
        Args: {
          limit_count?: number;
          offset_count?: number;
          query_text: string;
        };
        Returns: {
          created_at: string;
          description: string;
          id: string;
          rank: number;
          title: string;
          type: string;
        }[];
      };
      search_challenges: {
        Args: {
          limit_count?: number;
          offset_count?: number;
          query_text: string;
        };
        Returns: {
          category: string;
          created_at: string;
          description: string;
          difficulty: string;
          id: string;
          points_value: number;
          rank: number;
          title: string;
        }[];
      };
      search_groups: {
        Args: {
          limit_count?: number;
          offset_count?: number;
          query_text: string;
        };
        Returns: {
          created_at: string;
          current_streak: number;
          description: string;
          id: string;
          member_count: number;
          name: string;
          privacy: string;
          rank: number;
        }[];
      };
      set_config: {
        Args: {
          is_local?: boolean;
          setting_name: string;
          setting_value: string;
        };
        Returns: undefined;
      };
      setup_test_data: { Args: never; Returns: Json };
      should_reset_group_streak: { Args: { gid: string }; Returns: boolean };
      simulate_challenge_expiration: {
        Args: { p_challenge_id: string; p_days_ago?: number };
        Returns: Json;
      };
      simulate_group_submissions: {
        Args: { p_group_id: string; p_participation_rate: number };
        Returns: {
          actual_rate: number;
          group_streak_maintained: boolean;
          submitted_count: number;
          total_members: number;
        }[];
      };
      simulate_last_minute_submission: {
        Args: { p_challenge_id: string; p_user_id: string };
        Returns: string;
      };
      simulate_missed_deadline: {
        Args: { p_challenge_id: string; p_user_id: string };
        Returns: undefined;
      };
      simulate_missed_streak:
        | {
            Args: {
              p_challenge_id: string;
              p_days_missed?: number;
              p_user_id: string;
            };
            Returns: Json;
          }
        | {
            Args: {
              p_challenge_id: string;
              p_days_missed?: number;
              p_group_id: string;
              p_user_id: string;
            };
            Returns: Json;
          };
      simulate_power_up_usage: {
        Args: { p_power_up_sku: string; p_user_id: string };
        Returns: {
          activation_success: boolean;
          effect_description: string;
          power_up_name: string;
        }[];
      };
      simulate_time_passage: { Args: { p_days: number }; Returns: undefined };
      snooze_coach_messages: { Args: { p_hours?: number }; Returns: Json };
      submit_challenge_verification: {
        Args: {
          p_challenge_id: string;
          p_client_event_id?: string;
          p_client_tz?: string;
          p_media_type?: string;
          p_media_url?: string;
          p_submission_text?: string;
        };
        Returns: Json;
      };
      submit_challenge_with_validation: {
        Args: {
          p_challenge_id: string;
          p_submission_time?: string;
          p_user_id: string;
          p_verification_id: string;
        };
        Returns: Json;
      };
      submit_content_report_v1: {
        Args: {
          p_client_event_id: string;
          p_expected_reporter_id: string;
          p_facts: Json;
          p_reason: string;
          p_target_id: string;
          p_target_type: string;
        };
        Returns: Json;
      };
      test_daily_maintenance: { Args: never; Returns: Json };
      test_deadline_edge_cases: {
        Args: { p_challenge_id: string };
        Returns: {
          result: string;
          success: boolean;
          test_case: string;
        }[];
      };
      test_enhanced_group_creation: {
        Args: { p_name?: string; p_owner_id: string };
        Returns: Json;
      };
      test_group_failure_scenario: {
        Args: { p_failure_reason?: string; p_group_id: string };
        Returns: Json;
      };
      test_shop_functionality: {
        Args: { p_item_sku?: string; p_user_id: string };
        Returns: Json;
      };
      test_verification_rejection: {
        Args: {
          p_challenge_id: string;
          p_reviewer_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      track_reviewer_badges: { Args: { p_reviewer_id: string }; Returns: Json };
      trigger_daily_maintenance: { Args: never; Returns: Json };
      unequip_item: {
        Args: { p_category: string; p_user_id: string };
        Returns: Json;
      };
      update_all_group_streaks: { Args: never; Returns: undefined };
      update_global_user_streaks: { Args: never; Returns: undefined };
      update_my_profile: {
        Args: { p_patch: Json };
        Returns: {
          avatar_url: string;
          created_at: string;
          display_name: string;
          email: string;
          has_completed_onboarding: boolean;
          id: string;
          is_approved: boolean;
          is_pro: boolean;
          momenta_balance: number;
          updated_at: string;
          username: string;
        }[];
      };
      update_user_profile: {
        Args: { p_avatar_url?: string; p_username?: string };
        Returns: undefined;
      };
      update_user_streak: { Args: { user_uuid: string }; Returns: Json };
      use_group_freeze: {
        Args: {
          p_challenge_id: string;
          p_for_date?: string;
          p_group_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      use_power_up: {
        Args: {
          p_challenge_id?: string;
          p_client_event_id?: string;
          p_item_sku: string;
          p_target_data?: Json;
          p_user_id: string;
        };
        Returns: Json;
      };
      use_streak_freeze_for_user: {
        Args: { p_challenge_id: string; p_user_id: string };
        Returns: Json;
      };
      user_is_pro: { Args: { p_user_id: string }; Returns: boolean };
      validate_submission_timing: {
        Args: {
          p_challenge_id: string;
          p_submission_timestamp?: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      validate_waitlist_email: { Args: { p_email: string }; Returns: boolean };
    };
    Enums: {
      gc_course_version_status: 'draft' | 'pending' | 'verified';
      menta_event_action_outcome: 'completed' | 'failed';
      menta_event_attendance_state: 'joined' | 'left' | 'removed';
      menta_event_checkin_token_kind: 'rotating_qr' | 'roster_single_use';
      menta_event_occurrence_state:
        | 'scheduled'
        | 'live'
        | 'ended'
        | 'cancelled';
      menta_event_post_status:
        | 'upload_pending'
        | 'pending_review'
        | 'approved'
        | 'rejected'
        | 'deleting'
        | 'deleted';
      menta_event_status: 'draft' | 'published' | 'cancelled' | 'archived';
      menta_event_visibility: 'public' | 'unlisted' | 'invite_only';
      report_reason_code:
        | 'spam'
        | 'inappropriate'
        | 'harassment'
        | 'copyright'
        | 'misleading'
        | 'other';
      report_status: 'open' | 'reviewed' | 'dismissed' | 'actioned';
      report_target_type: 'verification' | 'group' | 'challenge' | 'user';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      gc_course_version_status: ['draft', 'pending', 'verified'],
      menta_event_action_outcome: ['completed', 'failed'],
      menta_event_attendance_state: ['joined', 'left', 'removed'],
      menta_event_checkin_token_kind: ['rotating_qr', 'roster_single_use'],
      menta_event_occurrence_state: ['scheduled', 'live', 'ended', 'cancelled'],
      menta_event_post_status: [
        'upload_pending',
        'pending_review',
        'approved',
        'rejected',
        'deleting',
        'deleted',
      ],
      menta_event_status: ['draft', 'published', 'cancelled', 'archived'],
      menta_event_visibility: ['public', 'unlisted', 'invite_only'],
      report_reason_code: [
        'spam',
        'inappropriate',
        'harassment',
        'copyright',
        'misleading',
        'other',
      ],
      report_status: ['open', 'reviewed', 'dismissed', 'actioned'],
      report_target_type: ['verification', 'group', 'challenge', 'user'],
    },
  },
} as const;
