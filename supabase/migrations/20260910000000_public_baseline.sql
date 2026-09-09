-- Menta portable, schema-only baseline. Contains no customer records or credentials.

-- Apply only to a new, independent Supabase project.

SET check_function_bodies = false;

CREATE SCHEMA IF NOT EXISTS private;

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT USAGE ON SCHEMA private TO service_role;

CREATE TYPE "public"."gc_course_version_status" AS ENUM ('draft', 'pending', 'verified');

CREATE TYPE "public"."menta_event_action_outcome" AS ENUM ('completed', 'failed');

CREATE TYPE "public"."menta_event_attendance_state" AS ENUM ('joined', 'left', 'removed');

CREATE TYPE "public"."menta_event_checkin_token_kind" AS ENUM ('rotating_qr', 'roster_single_use');

CREATE TYPE "public"."menta_event_occurrence_state" AS ENUM ('scheduled', 'live', 'ended', 'cancelled');

CREATE TYPE "public"."menta_event_post_status" AS ENUM ('upload_pending', 'pending_review', 'approved', 'rejected', 'deleting', 'deleted');

CREATE TYPE "public"."menta_event_status" AS ENUM ('draft', 'published', 'cancelled', 'archived');

CREATE TYPE "public"."menta_event_visibility" AS ENUM ('public', 'unlisted', 'invite_only');

CREATE TYPE "public"."report_reason_code" AS ENUM ('spam', 'inappropriate', 'harassment', 'copyright', 'misleading', 'other');

CREATE TYPE "public"."report_status" AS ENUM ('open', 'reviewed', 'dismissed', 'actioned');

CREATE TYPE "public"."report_target_type" AS ENUM ('verification', 'group', 'challenge', 'user');

CREATE SEQUENCE "public"."creation_attempts_id_seq" AS integer;

CREATE SEQUENCE "public"."rc_receipts_id_seq" AS bigint;

CREATE SEQUENCE "public"."rc_entitlements_id_seq" AS bigint;

CREATE SEQUENCE "public"."rc_credit_mappings_id_seq" AS bigint;

CREATE SEQUENCE "public"."notification_jobs_id_seq" AS bigint;

CREATE TABLE "private"."account_activation_receipts" (
  "user_id" uuid NOT NULL,
  "first_promise_id" uuid NOT NULL,
  "first_promise_title" text,
  "first_promise_next_due_at" timestamp with time zone,
  "activated_at" timestamp with time zone NOT NULL,
  "source" text NOT NULL,
  "welcome_reward_outcome" text NOT NULL,
  "welcome_reward_amount" integer NOT NULL,
  "welcome_ledger_reference" text,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."account_deletion_guards_v1" (
  "actor_id" uuid NOT NULL,
  "client_event_id" uuid NOT NULL,
  "prepared_at" timestamp with time zone NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."challenge_join_receipts" (
  "id" uuid NOT NULL,
  "actor_id" uuid NOT NULL,
  "client_event_id" uuid NOT NULL,
  "challenge_id" uuid NOT NULL,
  "quote_id" uuid NOT NULL,
  "request_hash" text NOT NULL,
  "response" jsonb,
  "created_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE TABLE "private"."content_report_submission_receipts_v1" (
  "reporter_id" uuid NOT NULL,
  "client_event_id" uuid NOT NULL,
  "target_type" text NOT NULL,
  "target_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "immutable_facts" jsonb NOT NULL,
  "facts_hash" text NOT NULL,
  "report_id" uuid,
  "result_payload" jsonb NOT NULL,
  "received_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."economy_creation_events_v1" (
  "user_id" uuid NOT NULL,
  "action" text NOT NULL,
  "entity_id" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."first_creation_use_v1" (
  "user_id" uuid NOT NULL,
  "action" text NOT NULL,
  "consumed_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."first_miss_recovery_receipts" (
  "user_id" uuid NOT NULL,
  "outcome_id" uuid NOT NULL,
  "original_outcome" jsonb NOT NULL,
  "result_payload" jsonb NOT NULL,
  "claimed_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."first_participation_join_v1" (
  "user_id" uuid NOT NULL,
  "consumed_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."group_invite_replacements" (
  "invite_code" text NOT NULL,
  "group_id" uuid NOT NULL,
  "replaced_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."onboarding_group_first_promise_receipts" (
  "user_id" uuid NOT NULL,
  "first_promise_id" uuid NOT NULL,
  "group_id" uuid NOT NULL,
  "request_name" text NOT NULL,
  "request_description" text,
  "request_privacy" text NOT NULL,
  "request_image_preset" text,
  "request_member_nudges" boolean NOT NULL,
  "group_name" text NOT NULL,
  "group_description" text,
  "group_privacy" text NOT NULL,
  "group_image_url" text,
  "group_duration_days" integer NOT NULL,
  "group_start_date" date NOT NULL,
  "group_end_date" date NOT NULL,
  "group_notify_on_member_miss" boolean NOT NULL,
  "first_promise_title" text NOT NULL,
  "first_promise_expectations" jsonb NOT NULL,
  "economy_cost" integer NOT NULL,
  "economy_balance" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."promise_accountability_invite_roles" (
  "invite_code" text NOT NULL,
  "challenge_id" uuid NOT NULL,
  "role" text NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."promise_accountability_members" (
  "challenge_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" text NOT NULL,
  "invited_by" uuid,
  "joined_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."promise_mutation_receipts_v1" (
  "actor_id" uuid NOT NULL,
  "client_event_id" uuid NOT NULL,
  "challenge_id" uuid NOT NULL,
  "operation" text NOT NULL,
  "result_payload" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."promise_saved_group_link_receipts_v1" (
  "id" uuid NOT NULL,
  "actor_id" uuid NOT NULL,
  "client_event_id" uuid NOT NULL,
  "challenge_id" uuid NOT NULL,
  "group_id" uuid NOT NULL,
  "request_hash" text NOT NULL,
  "response" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."proof_ad_break_cadence" (
  "submission_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "ordinal" bigint NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "claimed_at" timestamp with time zone
);

CREATE TABLE "private"."revenuecat_ad_reward_receipts" (
  "client_transaction_id" text NOT NULL,
  "provider_event_id" text NOT NULL,
  "virtual_currency_transaction_id" text NOT NULL,
  "target_user_id" uuid NOT NULL,
  "user_id" uuid,
  "currency_code" text NOT NULL,
  "amount" integer NOT NULL,
  "status" text NOT NULL,
  "reason" text,
  "new_balance" integer,
  "event_at" timestamp with time zone,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."saved_group_creation_receipts" (
  "id" uuid NOT NULL,
  "actor_id" uuid NOT NULL,
  "client_event_id" uuid NOT NULL,
  "canonical_client_event_id" uuid NOT NULL,
  "request_hash" text NOT NULL,
  "state" text NOT NULL,
  "group_id" uuid,
  "response" jsonb,
  "created_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE TABLE "private"."storage_upload_usage_v1" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id" uuid NOT NULL,
  "bucket_id" text NOT NULL,
  "byte_size" bigint NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "private"."user_block_submission_receipts_v1" (
  "blocker_id" uuid NOT NULL,
  "client_event_id" uuid NOT NULL,
  "blocked_user_id" uuid NOT NULL,
  "reason" text,
  "facts_hash" text NOT NULL,
  "result_payload" jsonb NOT NULL,
  "received_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."app_flow_returns" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "flow_key" text NOT NULL,
  "blocked_action" text,
  "return_path" text,
  "payload" jsonb NOT NULL,
  "consumed_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."app_update_policies" (
  "key" text NOT NULL,
  "schema_version" integer NOT NULL,
  "enabled" boolean NOT NULL,
  "mode" text NOT NULL,
  "release" text NOT NULL,
  "ios_minimum_version" text NOT NULL,
  "ios_store_available" boolean NOT NULL,
  "android_minimum_version" text NOT NULL,
  "android_store_available" boolean NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."beta_waitlist" (
  "id" uuid NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "platform" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."blocked_users" (
  "blocker_id" uuid NOT NULL,
  "blocked_user_id" uuid NOT NULL,
  "reason" text,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."buddy_streaks" (
  "id" uuid NOT NULL,
  "owner_user_id" uuid NOT NULL,
  "buddy_user_id" uuid,
  "challenge_id" uuid,
  "status" text NOT NULL,
  "current_count" integer NOT NULL,
  "last_nudged_at" timestamp with time zone,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."catalog_items" (
  "id" uuid NOT NULL,
  "sku" text,
  "category" text,
  "name" text NOT NULL,
  "description" text,
  "cost" integer NOT NULL,
  "price" integer NOT NULL,
  "is_available" boolean NOT NULL,
  "is_disabled" boolean NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "unlock_streak_days" integer
);

CREATE TABLE "public"."challenge_participants" (
  "id" uuid NOT NULL,
  "challenge_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "status" text NOT NULL,
  "joined_at" timestamp with time zone NOT NULL,
  "completion_percentage" integer NOT NULL,
  "current_streak" integer NOT NULL,
  "longest_streak" integer NOT NULL,
  "last_check_in_local_date" date,
  "last_check_in_tz" text,
  "at_risk" boolean NOT NULL,
  "streak_freezes_remaining" integer NOT NULL,
  "used_extensions" integer NOT NULL,
  "last_check_in" date,
  "streak_count" integer,
  "last_submission_date" timestamp with time zone,
  "updated_at" timestamp with time zone NOT NULL,
  "milestone_reached" integer NOT NULL,
  "last_freeze_used" timestamp with time zone,
  "streak_outcome_tracking_started_at" timestamp with time zone
);

CREATE TABLE "public"."challenge_submissions" (
  "id" uuid NOT NULL,
  "challenge_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "media_url" text,
  "media_type" text,
  "status" text NOT NULL,
  "submission_date" timestamp with time zone NOT NULL,
  "reviewer_id" uuid,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "review_notes" text,
  "submission_text" text,
  "local_day" date NOT NULL,
  "client_event_id" uuid NOT NULL,
  "submission_type" text,
  "verification_date" timestamp with time zone,
  "replaces_submission_id" uuid
);

CREATE TABLE "public"."challenges" (
  "id" uuid NOT NULL,
  "creator_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "category" text,
  "verification_type" text NOT NULL,
  "verification_frequency" text NOT NULL,
  "submission_text" text,
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "is_public" boolean NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "streak_timezone" text,
  "duration" integer,
  "completion_status" text NOT NULL,
  "is_expired" boolean NOT NULL,
  "difficulty" text NOT NULL,
  "points_value" integer NOT NULL,
  "verification_description" text,
  "allow_extensions" boolean NOT NULL,
  "max_extensions" integer NOT NULL,
  "deadline_type" text NOT NULL,
  "extension_count" integer NOT NULL,
  "allow_self_review" boolean NOT NULL,
  "submission_expectations" jsonb,
  "invite_code" text
);

CREATE TABLE "public"."content_reports" (
  "id" uuid NOT NULL,
  "reporter_id" uuid,
  "target_type" text NOT NULL,
  "target_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "status" text NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."creation_attempts" (
  "id" integer NOT NULL,
  "type" character varying(20) NOT NULL,
  "user_id" uuid NOT NULL,
  "data" jsonb NOT NULL,
  "timestamp" timestamp with time zone NOT NULL,
  "success" boolean NOT NULL,
  "error" text,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."daily_challenge_panels" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "challenge_id" uuid,
  "panel_date" date NOT NULL,
  "status" text NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."edge_rate_limits" (
  "endpoint" text NOT NULL,
  "actor_key" text NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "request_count" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."equipped_items" (
  "user_id" uuid NOT NULL,
  "item_id" uuid NOT NULL,
  "equipped_at" timestamp with time zone NOT NULL,
  "category" text NOT NULL
);

CREATE TABLE "public"."event_action_receipts" (
  "id" uuid NOT NULL,
  "actor_id" uuid NOT NULL,
  "action" text NOT NULL,
  "client_event_id" uuid NOT NULL,
  "request_hash" text NOT NULL,
  "outcome" menta_event_action_outcome,
  "response" jsonb,
  "created_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE TABLE "public"."event_attendances" (
  "id" uuid NOT NULL,
  "occurrence_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "state" menta_event_attendance_state NOT NULL,
  "consent_version" text NOT NULL,
  "consented_at" timestamp with time zone NOT NULL,
  "joined_at" timestamp with time zone NOT NULL,
  "left_at" timestamp with time zone,
  "checkin_id" uuid,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."event_audit_log" (
  "id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "occurrence_id" uuid,
  "actor_id" uuid,
  "action" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" uuid,
  "metadata" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."event_checkin_token_redemptions" (
  "id" uuid NOT NULL,
  "token_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "attendance_id" uuid NOT NULL,
  "redeemed_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."event_checkin_tokens" (
  "id" uuid NOT NULL,
  "occurrence_id" uuid NOT NULL,
  "token_hash" text NOT NULL,
  "kind" menta_event_checkin_token_kind NOT NULL,
  "issued_to_user_id" uuid,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "consumed_at" timestamp with time zone,
  "consumed_by" uuid,
  "created_by" uuid,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."event_checkins" (
  "id" uuid NOT NULL,
  "attendance_id" uuid NOT NULL,
  "token_id" uuid NOT NULL,
  "method" menta_event_checkin_token_kind NOT NULL,
  "checked_in_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone
);

CREATE TABLE "public"."event_events" (
  "id" uuid NOT NULL,
  "organiser_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "venue_name" text,
  "time_zone" text NOT NULL,
  "visibility" menta_event_visibility NOT NULL,
  "share_token_hash" text,
  "status" menta_event_status NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."event_invites" (
  "id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "occurrence_id" uuid,
  "token_hash" text NOT NULL,
  "issued_to_user_id" uuid,
  "max_uses" integer NOT NULL,
  "use_count" integer NOT NULL,
  "expires_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_by" uuid,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."event_occurrences" (
  "id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "state" menta_event_occurrence_state NOT NULL,
  "capacity" integer,
  "reserved_count" integer NOT NULL,
  "consent_version" text NOT NULL,
  "checkin_opens_at" timestamp with time zone NOT NULL,
  "checkin_closes_at" timestamp with time zone NOT NULL,
  "posting_opens_at" timestamp with time zone NOT NULL,
  "posting_closes_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."event_posts" (
  "id" uuid NOT NULL,
  "occurrence_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "client_event_id" uuid NOT NULL,
  "media_path" text,
  "expected_content_type" text NOT NULL,
  "expected_byte_size" bigint NOT NULL,
  "caption" text,
  "status" menta_event_post_status NOT NULL,
  "revision" integer NOT NULL,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "review_note" text,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."feature_requests" (
  "id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "value_statement" text,
  "tags" text[] NOT NULL,
  "t_shirt_size" text,
  "acceptance_criteria" text,
  "epic" text,
  "sprint_priority" integer,
  "vote_count" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."feature_votes" (
  "id" uuid NOT NULL,
  "feature_request_id" uuid NOT NULL,
  "user_identifier" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."group_daily_status" (
  "group_id" uuid NOT NULL,
  "local_date" date NOT NULL,
  "submissions_count" integer NOT NULL,
  "participants_count" integer NOT NULL,
  "participation_rate" numeric(5,4) NOT NULL,
  "last_computed_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."group_freeze_usages" (
  "id" uuid NOT NULL,
  "group_id" uuid NOT NULL,
  "challenge_id" uuid,
  "used_by" uuid NOT NULL,
  "used_for_date" date NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."group_streak_tracking" (
  "group_id" uuid NOT NULL,
  "current_streak" integer,
  "longest_streak" integer,
  "total_successful_days" integer,
  "last_success_date" date,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone
);

CREATE TABLE "public"."inventory_items" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "item_sku" text NOT NULL,
  "quantity" integer NOT NULL,
  "is_equipped" boolean NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."invite_codes" (
  "code" text NOT NULL,
  "type" text NOT NULL,
  "ref_id" uuid NOT NULL,
  "expires_at" timestamp with time zone,
  "created_by" uuid,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."invite_handoffs" (
  "id" uuid NOT NULL,
  "handoff_token" uuid NOT NULL,
  "user_id" uuid,
  "invite_code" text,
  "invite_url" text,
  "target_type" text NOT NULL,
  "target_id" uuid,
  "status" text NOT NULL,
  "payload" jsonb NOT NULL,
  "claimed_at" timestamp with time zone,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."issues" (
  "id" uuid NOT NULL,
  "user_id" uuid,
  "issue_type" text,
  "title" text,
  "description" text,
  "metadata" jsonb,
  "status" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."legal_acceptance_enforcement_settings" (
  "scope" text NOT NULL,
  "enforcement_mode" text NOT NULL,
  "activated_at" timestamp with time zone,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."legal_acceptance_receipts" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "terms_version" text NOT NULL,
  "privacy_policy_version" text NOT NULL,
  "community_standards_version" text NOT NULL,
  "terms_url" text NOT NULL,
  "privacy_policy_url" text NOT NULL,
  "community_standards_url" text NOT NULL,
  "acceptance_surface" text NOT NULL,
  "app_version" text NOT NULL,
  "app_build" text NOT NULL,
  "app_platform" text NOT NULL,
  "locale" text,
  "accepted_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."legal_document_versions" (
  "document_type" text NOT NULL,
  "document_version" text NOT NULL,
  "document_url" text NOT NULL,
  "effective_at" timestamp with time zone NOT NULL,
  "published_at" timestamp with time zone NOT NULL,
  "retired_at" timestamp with time zone
);

CREATE TABLE "public"."maintenance_logs" (
  "id" uuid NOT NULL,
  "job_type" text NOT NULL,
  "status" text NOT NULL,
  "results" jsonb,
  "error_message" text,
  "execution_time_ms" integer,
  "created_at" timestamp with time zone
);

CREATE TABLE "public"."maintenance_runs" (
  "id" uuid NOT NULL,
  "run_timestamp" timestamp with time zone NOT NULL,
  "status" text NOT NULL,
  "details" jsonb,
  "created_at" timestamp with time zone
);

CREATE TABLE "public"."notification_jobs" (
  "id" bigint NOT NULL,
  "user_id" uuid NOT NULL,
  "job_type" text NOT NULL,
  "payload" jsonb NOT NULL,
  "scheduled_for" timestamp with time zone NOT NULL,
  "idempotency_key" text NOT NULL,
  "status" text NOT NULL,
  "attempts" integer NOT NULL,
  "last_error" text,
  "notification_id" bigint,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."notification_preferences" (
  "user_id" uuid NOT NULL,
  "push_enabled" boolean NOT NULL,
  "email_enabled" boolean NOT NULL,
  "challenge_reminders" boolean NOT NULL,
  "group_updates" boolean NOT NULL,
  "streak_alerts" boolean NOT NULL,
  "preferred_reminder_time" time without time zone,
  "timezone" text,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "expo_push_token" text,
  "typical_proof_hour" time without time zone,
  "ignore_coach_until" timestamp with time zone,
  "quiet_hours_start" time without time zone,
  "quiet_hours_end" time without time zone,
  "device_permission_status" text,
  "device_permission_checked_at" timestamp with time zone,
  "push_token_status" text,
  "push_token_updated_at" timestamp with time zone,
  "remote_coach_contract_version" integer NOT NULL,
  "remote_coach_activated_at" timestamp with time zone,
  "push_app_build" integer,
  "marketing_email_opt_in" boolean NOT NULL,
  "marketing_email_opted_at" timestamp with time zone,
  "push_platform" text,
  "marketing_email_provider_sync_pending" boolean NOT NULL
);

CREATE TABLE "public"."notification_templates" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "template_key" text NOT NULL,
  "title" text,
  "body" text NOT NULL,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone
);

CREATE TABLE "public"."notifications" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id" uuid NOT NULL,
  "payload" jsonb,
  "is_read" boolean NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "notification_type" text,
  "title" text,
  "body" text,
  "metadata" jsonb,
  "priority" integer NOT NULL,
  "opened_at" timestamp with time zone,
  "scheduled_for" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  "delivery_failed_at" timestamp with time zone,
  "delivery_error" text,
  "delivery_attempts" integer NOT NULL,
  "delivery_provider" text,
  "provider_message_id" text,
  "provider_accepted_at" timestamp with time zone,
  "provider_delivered_at" timestamp with time zone,
  "provider_opened_at" timestamp with time zone,
  "provider_status" text,
  "provider_token_fingerprint" text,
  "provider_receipt_checked_at" timestamp with time zone,
  "delivery_fallback_reason" text
);

CREATE TABLE "public"."power_up_usage" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "item_sku" text NOT NULL,
  "challenge_id" uuid,
  "used_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone,
  "is_active" boolean,
  "client_event_id" uuid,
  "result_payload" jsonb,
  "obligation_local_day" date,
  "proof_due_at" timestamp with time zone,
  "effective_timezone" text
);

CREATE TABLE "public"."profiles" (
  "id" uuid NOT NULL,
  "email" text,
  "username" text,
  "display_name" text,
  "avatar_url" text,
  "momenta_balance" integer NOT NULL,
  "has_completed_onboarding" boolean NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "is_pro" boolean NOT NULL,
  "is_approved" boolean NOT NULL,
  "onboarded_at" timestamp with time zone
);

CREATE TABLE "public"."proof_encouragements" (
  "submission_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."purchase_receipt_states" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "store" text NOT NULL,
  "product_id" text NOT NULL,
  "transaction_id" text,
  "status" text NOT NULL,
  "payload" jsonb NOT NULL,
  "acknowledged_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."purchases" (
  "user_id" uuid NOT NULL,
  "item_id" uuid NOT NULL,
  "purchased_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."queued_proof_submissions" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "challenge_id" uuid,
  "team_id" uuid,
  "client_uuid" text NOT NULL,
  "proof_type" text NOT NULL,
  "payload" jsonb NOT NULL,
  "status" text NOT NULL,
  "last_error" text,
  "submitted_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."rc_credit_mappings" (
  "id" bigint NOT NULL,
  "product_id" text NOT NULL,
  "credits" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."rc_entitlements" (
  "id" bigint NOT NULL,
  "user_id" uuid NOT NULL,
  "entitlement_key" text NOT NULL,
  "is_active" boolean NOT NULL,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "source" text,
  "last_event_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "last_provider_event_at" timestamp with time zone,
  "last_provider_event_id" text
);

CREATE TABLE "public"."rc_receipts" (
  "id" bigint NOT NULL,
  "app_id" text,
  "store" text NOT NULL,
  "product_id" text NOT NULL,
  "transaction_id" text NOT NULL,
  "original_transaction_id" text,
  "user_id" uuid,
  "purchase_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "amount_cents" integer,
  "currency" text,
  "payload" jsonb,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."rc_webhook_events" (
  "provider_event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "event_at" timestamp with time zone,
  "target_user_id" uuid,
  "user_id" uuid,
  "store" text NOT NULL,
  "transaction_id" text,
  "entitlement_keys" text[] NOT NULL,
  "reconciliation_keys" text[] NOT NULL,
  "processing_status" text NOT NULL,
  "ignored_reason" text,
  "payload" jsonb NOT NULL,
  "attempt_count" integer NOT NULL,
  "received_at" timestamp with time zone NOT NULL,
  "last_attempt_at" timestamp with time zone NOT NULL,
  "processed_at" timestamp with time zone
);

CREATE TABLE "public"."referral_codes" (
  "user_id" uuid NOT NULL,
  "code" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."shop_purchase_receipts" (
  "user_id" uuid NOT NULL,
  "client_event_id" uuid NOT NULL,
  "item_id" uuid NOT NULL,
  "item_sku" text NOT NULL,
  "item_name" text NOT NULL,
  "cost" integer NOT NULL,
  "new_balance" integer NOT NULL,
  "quantity" integer NOT NULL,
  "result_payload" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."streak_checkin_applications" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "challenge_id" uuid NOT NULL,
  "local_day" date NOT NULL,
  "submission_id" uuid NOT NULL,
  "application_type" text NOT NULL,
  "effective_timezone" text NOT NULL,
  "previous_streak" integer NOT NULL,
  "resulting_streak" integer NOT NULL,
  "freeze_used" boolean NOT NULL,
  "freezes_remaining" integer NOT NULL,
  "day_status" text NOT NULL,
  "applied_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."streak_day_outcomes" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "challenge_id" uuid NOT NULL,
  "local_day" date NOT NULL,
  "effective_timezone" text NOT NULL,
  "outcome" text NOT NULL,
  "previous_streak" integer NOT NULL,
  "resulting_streak" integer NOT NULL,
  "freeze_used" boolean NOT NULL,
  "freezes_remaining" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."streak_freeze_log" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "challenge_id" uuid NOT NULL,
  "used_at" timestamp without time zone,
  "freeze_type" text,
  "days_saved" integer
);

CREATE TABLE "public"."streak_unlock_receipts" (
  "user_id" uuid NOT NULL,
  "sku" text NOT NULL,
  "days" integer NOT NULL,
  "granted_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."system_config" (
  "key" text NOT NULL,
  "value" text NOT NULL,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone
);

CREATE TABLE "public"."system_logs" (
  "id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "details" jsonb,
  "created_at" timestamp with time zone
);

CREATE TABLE "public"."team_challenges" (
  "group_id" uuid NOT NULL,
  "challenge_id" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."team_members" (
  "group_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" text NOT NULL,
  "joined_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."team_notification_preferences" (
  "user_id" uuid NOT NULL,
  "group_id" uuid NOT NULL,
  "notify_all" boolean NOT NULL,
  "notify_mentions" boolean NOT NULL,
  "notify_daily_summary" boolean NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."teams" (
  "id" uuid NOT NULL,
  "owner_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "privacy" text NOT NULL,
  "status" text NOT NULL,
  "cooldown_until" timestamp with time zone,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "duration_days" integer NOT NULL,
  "invite_code" text,
  "current_streak" integer NOT NULL,
  "image_url" text,
  "start_date" date,
  "end_date" date,
  "notify_on_member_miss" boolean NOT NULL,
  "kind" text NOT NULL
);

CREATE TABLE "public"."user_flags" (
  "user_id" uuid NOT NULL,
  "welcome_bonus_granted" boolean,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "welcome_bonus_dismissed" boolean,
  "welcome_bonus_dismissed_at" timestamp with time zone
);

CREATE TABLE "public"."user_referrals" (
  "id" uuid NOT NULL,
  "referrer_user_id" uuid NOT NULL,
  "referred_user_id" uuid NOT NULL,
  "referral_code" text NOT NULL,
  "status" character varying(20) NOT NULL,
  "reward_granted" boolean NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "completed_at" timestamp with time zone,
  "reward_outcome" text NOT NULL
);

CREATE TABLE "public"."waitlist_emails" (
  "id" uuid NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);

CREATE TABLE "public"."wallet_transactions" (
  "id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id" uuid NOT NULL,
  "amount" integer NOT NULL,
  "reason" text,
  "source_uuid" uuid,
  "transaction_type" text,
  "description" text,
  "reference_id" uuid,
  "created_at" timestamp with time zone NOT NULL,
  "external_reference_id" text
);

CREATE TABLE "public"."weekly_recap_snapshots" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "week_start" date NOT NULL,
  "proof_days" integer NOT NULL,
  "review_count" integer NOT NULL,
  "group_count" integer NOT NULL,
  "status" text NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

CREATE OR REPLACE FUNCTION private.event_posting_is_open_v1(p_occurrence event_occurrences)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select
    p_occurrence.state in ('scheduled', 'live', 'ended')
    and now() >= p_occurrence.posting_opens_at
    and now() <= p_occurrence.posting_closes_at
$function$;

CREATE OR REPLACE FUNCTION public.apply_revenuecat_ad_reward_v1(p_provider_event_id text, p_event_at timestamp with time zone, p_user_id uuid, p_virtual_currency_transaction_id text, p_client_transaction_id text, p_currency_code text, p_amount integer, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_expected_code text := 'MNT';
  v_expected_amount integer := 10;
  v_daily_limit integer := 5;
  v_cooldown_seconds integer := 120;
  v_profile_exists boolean := false;
  v_existing private.revenuecat_ad_reward_receipts%rowtype;
  v_recent_count integer := 0;
  v_latest_reward timestamptz;
  v_credit jsonb;
  v_new_balance integer;
  v_reference text;
  v_now timestamptz := pg_catalog.now();
begin
  if p_provider_event_id is null
     or pg_catalog.btrim(p_provider_event_id) = ''
     or p_virtual_currency_transaction_id is null
     or pg_catalog.btrim(p_virtual_currency_transaction_id) = ''
     or p_client_transaction_id is null
     or pg_catalog.btrim(p_client_transaction_id) = ''
  then
    raise exception 'REVENUECAT_AD_REWARD_ID_REQUIRED';
  end if;

  if p_user_id is null then
    raise exception 'REVENUECAT_AD_REWARD_USER_REQUIRED';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'revenuecat-ad-reward:' || p_user_id::text,
      0
    )
  );

  select receipt.*
  into v_existing
  from private.revenuecat_ad_reward_receipts receipt
  where receipt.client_transaction_id = p_client_transaction_id
     or receipt.provider_event_id = p_provider_event_id
     or receipt.virtual_currency_transaction_id =
       p_virtual_currency_transaction_id
  order by receipt.created_at
  limit 1
  for update;

  if found and v_existing.status <> 'retry' then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'duplicate', true,
      'status', v_existing.status,
      'reason', v_existing.reason,
      'amount', v_existing.amount,
      'new_balance', v_existing.new_balance
    );
  end if;

  select exists (
    select 1
    from public.profiles profile
    where profile.id = p_user_id
  ) into v_profile_exists;

  insert into public.rc_webhook_events (
    provider_event_id,
    event_type,
    event_at,
    target_user_id,
    user_id,
    store,
    transaction_id,
    entitlement_keys,
    processing_status,
    payload
  )
  values (
    p_provider_event_id,
    'VIRTUAL_CURRENCY_TRANSACTION',
    p_event_at,
    p_user_id,
    case when v_profile_exists then p_user_id else null end,
    'revenuecat_ads',
    p_virtual_currency_transaction_id,
    '{}'::text[],
    case when v_profile_exists then 'accepted' else 'retry' end,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (provider_event_id) do update
  set
    attempt_count = public.rc_webhook_events.attempt_count + 1,
    last_attempt_at = v_now,
    payload = excluded.payload;

  insert into private.revenuecat_ad_reward_receipts (
    client_transaction_id,
    provider_event_id,
    virtual_currency_transaction_id,
    target_user_id,
    user_id,
    currency_code,
    amount,
    status,
    reason,
    event_at,
    payload
  )
  values (
    p_client_transaction_id,
    p_provider_event_id,
    p_virtual_currency_transaction_id,
    p_user_id,
    case when v_profile_exists then p_user_id else null end,
    coalesce(pg_catalog.btrim(p_currency_code), ''),
    greatest(coalesce(p_amount, 0), 0),
    'retry',
    case when v_profile_exists then null else 'profile_not_found' end,
    p_event_at,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (client_transaction_id) do update
  set
    payload = excluded.payload,
    updated_at = v_now;

  if not v_profile_exists then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'status', 'retry',
      'reason', 'profile_not_found'
    );
  end if;

  update private.revenuecat_ad_reward_receipts receipt
  set user_id = p_user_id
  where receipt.client_transaction_id = p_client_transaction_id
    and receipt.user_id is null;

  begin
    select config.value
    into v_expected_code
    from public.system_config config
    where config.key = 'revenuecat_momenta_currency_code'
    limit 1;

    select
      greatest(
        1,
        coalesce((config.value::jsonb #>> '{ads,reward}')::integer, 10)
      ),
      greatest(
        1,
        coalesce((config.value::jsonb #>> '{ads,dailyLimit}')::integer, 5)
      ),
      greatest(
        0,
        coalesce((config.value::jsonb #>> '{ads,cooldownSeconds}')::integer, 120)
      )
    into v_expected_amount, v_daily_limit, v_cooldown_seconds
    from public.system_config config
    where config.key = 'economy_contract_v1'
    limit 1;
  exception when others then
    v_expected_code := 'MNT';
    v_expected_amount := 10;
    v_daily_limit := 5;
    v_cooldown_seconds := 120;
  end;

  if pg_catalog.btrim(coalesce(p_currency_code, '')) <>
     pg_catalog.btrim(coalesce(v_expected_code, 'MNT'))
  then
    update private.revenuecat_ad_reward_receipts receipt
    set
      status = 'ignored',
      reason = 'currency_mismatch',
      amount = 0,
      updated_at = v_now
    where receipt.client_transaction_id = p_client_transaction_id;

    update public.rc_webhook_events event
    set
      processing_status = 'ignored',
      ignored_reason = 'currency_mismatch',
      processed_at = v_now
    where event.provider_event_id = p_provider_event_id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'status', 'ignored',
      'reason', 'currency_mismatch'
    );
  end if;

  if p_amount is distinct from v_expected_amount then
    update private.revenuecat_ad_reward_receipts receipt
    set
      status = 'ignored',
      reason = 'amount_mismatch',
      amount = 0,
      updated_at = v_now
    where receipt.client_transaction_id = p_client_transaction_id;

    update public.rc_webhook_events event
    set
      processing_status = 'ignored',
      ignored_reason = 'amount_mismatch',
      processed_at = v_now
    where event.provider_event_id = p_provider_event_id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'status', 'ignored',
      'reason', 'amount_mismatch'
    );
  end if;

  select count(*), max(transaction.created_at)
  into v_recent_count, v_latest_reward
  from public.wallet_transactions transaction
  where transaction.user_id = p_user_id
    and transaction.transaction_type = 'bonus'
    and transaction.reason = 'Ad reward'
    and transaction.created_at >= v_now - interval '1 day';

  if coalesce(v_recent_count, 0) >= v_daily_limit then
    update private.revenuecat_ad_reward_receipts receipt
    set
      status = 'ignored',
      reason = 'daily_limit',
      amount = 0,
      updated_at = v_now
    where receipt.client_transaction_id = p_client_transaction_id;

    update public.rc_webhook_events event
    set
      processing_status = 'ignored',
      ignored_reason = 'daily_limit',
      processed_at = v_now
    where event.provider_event_id = p_provider_event_id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'status', 'ignored',
      'reason', 'daily_limit'
    );
  end if;

  if v_latest_reward is not null
     and v_latest_reward >
       v_now - pg_catalog.make_interval(secs => v_cooldown_seconds)
  then
    update private.revenuecat_ad_reward_receipts receipt
    set
      status = 'ignored',
      reason = 'cooldown',
      amount = 0,
      updated_at = v_now
    where receipt.client_transaction_id = p_client_transaction_id;

    update public.rc_webhook_events event
    set
      processing_status = 'ignored',
      ignored_reason = 'cooldown',
      processed_at = v_now
    where event.provider_event_id = p_provider_event_id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'status', 'ignored',
      'reason', 'cooldown'
    );
  end if;

  v_reference := 'rc:ad_reward:' || p_client_transaction_id;
  select public.grant_momenta_credit(
    p_user_id,
    v_expected_amount,
    'Ad reward',
    'bonus',
    v_reference,
    'RevenueCat verified ad reward'
  ) into v_credit;

  if coalesce((v_credit ->> 'success')::boolean, false) is not true then
    raise exception 'REVENUECAT_AD_REWARD_GRANT_FAILED';
  end if;

  v_new_balance := nullif(v_credit ->> 'new_balance', '')::integer;

  update private.revenuecat_ad_reward_receipts receipt
  set
    status = 'applied',
    reason = null,
    amount = v_expected_amount,
    new_balance = v_new_balance,
    updated_at = v_now
  where receipt.client_transaction_id = p_client_transaction_id;

  update public.rc_webhook_events event
  set
    processing_status = 'applied',
    ignored_reason = null,
    processed_at = v_now
  where event.provider_event_id = p_provider_event_id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'duplicate', coalesce((v_credit ->> 'duplicate')::boolean, false),
    'status', 'applied',
    'amount', v_expected_amount,
    'new_balance', v_new_balance
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.capture_replaced_group_invite_v2()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if old.type = 'group'
    and exists (
      select 1
      from public.invite_codes replacement
      where replacement.type = 'group'
        and replacement.ref_id = old.ref_id
        and replacement.code <> old.code
    )
  then
    insert into private.group_invite_replacements (
      invite_code,
      group_id,
      replaced_at
    )
    values (
      pg_catalog.upper(pg_catalog.btrim(old.code)),
      old.ref_id,
      now()
    )
    on conflict (invite_code) do update
      set
        group_id = excluded.group_id,
        replaced_at = excluded.replaced_at;
  end if;

  return old;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_revenuecat_ad_reward_receipt(p_client_transaction_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_receipt private.revenuecat_ad_reward_receipts%rowtype;
begin
  if v_user_id is null
     or not public.current_session_is_active()
     or p_client_transaction_id is null
     or pg_catalog.btrim(p_client_transaction_id) = ''
  then
    return pg_catalog.jsonb_build_object(
      'status', 'pending',
      'amount', 0,
      'newBalance', null,
      'reason', null
    );
  end if;

  select receipt.*
  into v_receipt
  from private.revenuecat_ad_reward_receipts receipt
  where receipt.client_transaction_id = p_client_transaction_id
    and receipt.target_user_id = v_user_id;

  if not found or v_receipt.status = 'retry' then
    return pg_catalog.jsonb_build_object(
      'status', 'pending',
      'amount', 0,
      'newBalance', null,
      'reason', v_receipt.reason
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'status', v_receipt.status,
    'amount', v_receipt.amount,
    'newBalance', v_receipt.new_balance,
    'reason', v_receipt.reason
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.list_orphaned_proof_media(p_older_than interval DEFAULT '1 day'::interval, p_limit integer DEFAULT 500)
 RETURNS TABLE(object_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED' using errcode = '42501';
  end if;

  if p_older_than < interval '1 hour'
    or p_older_than > interval '30 days'
    or p_limit not between 1 and 1000
  then
    raise exception 'INVALID_ORPHAN_SCAN_ARGUMENTS' using errcode = '22023';
  end if;

  return query
  select o.name
  from storage.objects o
  where o.bucket_id = 'challenge-verifications'
    and o.created_at < now() - p_older_than
    and not exists (
      select 1
      from public.challenge_submissions cs
      where cs.media_url = o.name
    )
  order by o.created_at
  limit p_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION private.event_occurrence_apply_lifecycle_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_at timestamptz := statement_timestamp();
  v_basis public.menta_event_occurrence_state;
begin
  -- Cancellation is the only explicit state change. Every lifecycle change is
  -- derived from server time and the stored occurrence window. Existing
  -- terminal states cannot be reopened by a later write.
  if tg_op = 'INSERT' then
    v_basis := case
      when new.state = 'cancelled'
        then 'cancelled'::public.menta_event_occurrence_state
      else 'scheduled'::public.menta_event_occurrence_state
    end;
  elsif old.state in ('cancelled', 'ended') then
    v_basis := old.state;
  elsif new.state = 'cancelled' then
    v_basis := 'cancelled'::public.menta_event_occurrence_state;
  else
    v_basis := old.state;
  end if;

  new.state := private.event_occurrence_state_at_v1(
    v_basis,
    new.starts_at,
    new.ends_at,
    v_at
  );

  if tg_op = 'UPDATE' and new.state is distinct from old.state then
    new.updated_at := v_at;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_power_ups()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Mark expired power-ups as inactive
  UPDATE power_up_usage
  SET is_active = false
  WHERE expires_at < NOW()
  AND is_active = true;
END;
$function$;

CREATE OR REPLACE FUNCTION private.event_summary_json_v1(p_event event_events, p_occurrence event_occurrences)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'eventId', p_event.id,
    'occurrenceId', p_occurrence.id,
    'title', p_event.title,
    'description', p_event.description,
    'venueName', p_event.venue_name,
    'startsAt', p_occurrence.starts_at,
    'endsAt', p_occurrence.ends_at,
    'timeZone', p_event.time_zone,
    'consentVersion', p_occurrence.consent_version,
    'visibility', p_event.visibility,
    'occurrenceState', private.event_occurrence_state_at_v1(
      p_occurrence.state,
      p_occurrence.starts_at,
      p_occurrence.ends_at,
      statement_timestamp()
    ),
    'capacity', p_occurrence.capacity,
    'reservedCount', p_occurrence.reserved_count
  );
$function$;

CREATE OR REPLACE FUNCTION public.event_reconcile_occurrence_lifecycle_v1()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_at timestamptz := statement_timestamp();
  v_scheduled_count integer := 0;
  v_live_count integer := 0;
begin
  -- A scheduled row can advance directly to ended if the service was not
  -- called during its live window. The row trigger independently recomputes
  -- the same target state before each update is stored.
  with transitioned as (
    update public.event_occurrences as occurrence
    set
      state = private.event_occurrence_state_at_v1(
        occurrence.state,
        occurrence.starts_at,
        occurrence.ends_at,
        v_at
      ),
      updated_at = v_at
    where occurrence.state = 'scheduled'
      and occurrence.starts_at <= v_at
    returning occurrence.id, occurrence.event_id, occurrence.state
  )
  insert into public.event_audit_log (
    event_id,
    occurrence_id,
    actor_id,
    action,
    target_type,
    target_id,
    metadata
  )
  select
    transitioned.event_id,
    transitioned.id,
    null,
    'event.occurrence_lifecycle_reconciled',
    'event_occurrence',
    transitioned.id,
    jsonb_build_object(
      'from', 'scheduled',
      'to', transitioned.state,
      'reconciledAt', v_at
    )
  from transitioned;

  get diagnostics v_scheduled_count = row_count;

  with transitioned as (
    update public.event_occurrences as occurrence
    set
      state = private.event_occurrence_state_at_v1(
        occurrence.state,
        occurrence.starts_at,
        occurrence.ends_at,
        v_at
      ),
      updated_at = v_at
    where occurrence.state = 'live'
      and occurrence.ends_at <= v_at
    returning occurrence.id, occurrence.event_id, occurrence.state
  )
  insert into public.event_audit_log (
    event_id,
    occurrence_id,
    actor_id,
    action,
    target_type,
    target_id,
    metadata
  )
  select
    transitioned.event_id,
    transitioned.id,
    null,
    'event.occurrence_lifecycle_reconciled',
    'event_occurrence',
    transitioned.id,
    jsonb_build_object(
      'from', 'live',
      'to', transitioned.state,
      'reconciledAt', v_at
    )
  from transitioned;

  get diagnostics v_live_count = row_count;

  return v_scheduled_count + v_live_count;
end;
$function$;

CREATE OR REPLACE FUNCTION private.first_miss_recovery_candidate_v1(p_user_id uuid)
 RETURNS SETOF streak_day_outcomes
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select outcome.*
  from public.streak_day_outcomes outcome
  join public.challenges challenge on challenge.id = outcome.challenge_id
  join public.challenge_participants participant
    on participant.challenge_id = outcome.challenge_id
    and participant.user_id = outcome.user_id
  where outcome.user_id = p_user_id
    and outcome.outcome = 'missed' and not outcome.freeze_used
    and challenge.verification_frequency = 'daily'
    and challenge.status = 'active' and challenge.completion_status = 'active'
    and not challenge.is_expired
    and (challenge.end_date is null or challenge.end_date > pg_catalog.now())
    and participant.status = 'active'
    -- Participation is the doer contract, including partners in a shared
    -- promise. Reviewers and supporters are not enrolled as participants.
    and coalesce(participant.current_streak, 0) = outcome.resulting_streak
    and (participant.last_check_in_local_date is null
      or participant.last_check_in_local_date < outcome.local_day)
    -- The date comes from the recorded outcome timezone, not the phone clock
    -- or a guessed deadline. The offer ends at the next local midnight.
    and (pg_catalog.now() at time zone outcome.effective_timezone)::date
      = outcome.local_day + 1
    and not exists (select 1 from private.first_miss_recovery_receipts receipt
      where receipt.user_id = p_user_id)
    -- A protected day is already a missed opportunity too. This benefit is
    -- only for the first recorded absence across the whole account.
    and not exists (select 1 from public.streak_day_outcomes other
      where other.user_id = p_user_id
        and (other.created_at, other.id) < (outcome.created_at, outcome.id))
    and not exists (select 1 from public.streak_day_outcomes later
      where later.user_id = p_user_id and later.challenge_id = outcome.challenge_id
        and later.local_day > outcome.local_day)
    and not exists (select 1 from public.challenge_submissions proof
      where proof.user_id = p_user_id and proof.challenge_id = outcome.challenge_id
        and proof.local_day >= outcome.local_day
        and proof.status in ('approved', 'pending'))
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION private.event_album_item_json_v1(p_post event_posts, p_profile profiles, p_checkin event_checkins)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'postId', p_post.id,
    'occurrenceId', p_post.occurrence_id,
    'caption', p_post.caption,
    'createdAt', p_post.created_at,
    'attendeeUsername', coalesce(
      nullif(pg_catalog.btrim(p_profile.username), ''),
      nullif(pg_catalog.btrim(p_profile.display_name), ''),
      'Event attendee'
    ),
    'checkedInAt', p_checkin.checked_in_at,
    'approvedAt', p_post.reviewed_at
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_first_miss_recovery_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_outcome public.streak_day_outcomes%rowtype;
begin
  if v_user_id is null or not public.current_session_is_active() then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  select * into v_outcome from private.first_miss_recovery_candidate_v1(v_user_id);
  if not found then return pg_catalog.jsonb_build_object('eligible', false); end if;
  return pg_catalog.jsonb_build_object(
    'eligible', true, 'outcome_id', v_outcome.id,
    'challenge_id', v_outcome.challenge_id,
    'challenge_title', (select title from public.challenges where id = v_outcome.challenge_id),
    'local_day', v_outcome.local_day, 'previous_streak', v_outcome.previous_streak,
    'expires_at', ((v_outcome.local_day + 2)::timestamp at time zone v_outcome.effective_timezone)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.claim_first_miss_recovery_v1(p_outcome_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_outcome public.streak_day_outcomes%rowtype;
  v_candidate public.streak_day_outcomes%rowtype;
  v_receipt private.first_miss_recovery_receipts%rowtype;
  v_result jsonb;
begin
  if v_user_id is null or not public.current_session_is_active() then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('first-miss-recovery:' || v_user_id::text, 0));
  select * into v_receipt from private.first_miss_recovery_receipts where user_id = v_user_id;
  if found then
    if v_receipt.outcome_id = p_outcome_id then return v_receipt.result_payload; end if;
    return pg_catalog.jsonb_build_object('success', false, 'code', 'ALREADY_USED');
  end if;
  select * into v_outcome from public.streak_day_outcomes
    where id = p_outcome_id and user_id = v_user_id;
  if not found then return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_ELIGIBLE'); end if;
  -- All streak maintenance and proof application use participant row locks.
  -- Lock this account's participants in stable order so another promise cannot
  -- produce an earlier missed-day record while the first absence is selected.
  perform 1 from public.challenge_participants
    where user_id = v_user_id order by id for update;
  perform 1 from public.challenges where id = v_outcome.challenge_id for share;
  select * into v_candidate from private.first_miss_recovery_candidate_v1(v_user_id);
  if v_candidate.id is distinct from p_outcome_id then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_ELIGIBLE');
  end if;
  v_result := pg_catalog.jsonb_build_object(
    'success', true, 'outcome_id', v_candidate.id,
    'challenge_id', v_candidate.challenge_id,
    'local_day', v_candidate.local_day, 'streak', v_candidate.previous_streak,
    'benefit', 'first_miss_freeze', 'charged', 0
  );
  insert into private.first_miss_recovery_receipts
    (user_id, outcome_id, original_outcome, result_payload)
  values (v_user_id, v_candidate.id, pg_catalog.to_jsonb(v_candidate), v_result);
  update public.streak_day_outcomes set outcome = 'protected', freeze_used = true,
    resulting_streak = v_candidate.previous_streak
    where id = v_candidate.id;
  update public.challenge_participants set
    current_streak = v_candidate.previous_streak, streak_count = v_candidate.previous_streak,
    last_freeze_used = pg_catalog.now(), at_risk = false, updated_at = pg_catalog.now()
    where user_id = v_user_id and challenge_id = v_candidate.challenge_id;
  insert into public.streak_freeze_log (user_id, challenge_id, used_at, freeze_type, days_saved)
    values (v_user_id, v_candidate.challenge_id, pg_catalog.now() at time zone 'UTC', 'first_miss_gift', 1);
  insert into public.power_up_usage
    (user_id, challenge_id, item_sku, is_active, result_payload)
    values (v_user_id, v_candidate.challenge_id, 'first_miss_freeze', false, v_result);
  -- A miss notification describes the earlier event. Do not rewrite payloads
  -- that a provider worker may already have claimed; the recovery receipt and
  -- current protected-day read are the new authoritative state.
  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION private.participation_join_cost_v1(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case when exists (
    select 1 from private.first_participation_join_v1 used
    where used.user_id = p_user_id
  ) then 10 else 0 end;
$function$;

CREATE OR REPLACE FUNCTION private.record_participation_join_v1(p_user_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  insert into private.first_participation_join_v1(user_id)
  values(p_user_id) on conflict(user_id) do nothing;
$function$;

CREATE OR REPLACE FUNCTION private.record_first_creation_use_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_table_name='challenges' then
    insert into private.first_creation_use_v1(user_id,action)
    values(new.creator_id,'create_challenge') on conflict(user_id,action) do nothing;
    insert into private.economy_creation_events_v1(user_id,action,entity_id,created_at)
    values(new.creator_id,'create_challenge',new.id,coalesce(new.created_at,now()))
    on conflict(user_id,action,entity_id) do nothing;
  elsif new.kind='saved' then
    insert into private.first_creation_use_v1(user_id,action)
    values(new.owner_id,'create_group') on conflict(user_id,action) do nothing;
    insert into private.economy_creation_events_v1(user_id,action,entity_id,created_at)
    values(new.owner_id,'create_group',new.id,coalesce(new.created_at,now()))
    on conflict(user_id,action,entity_id) do nothing;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.join_public_group_v2(p_group_id uuid, p_expected_cost integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_group public.teams%rowtype;
  v_balance integer;
  v_cost integer;
  v_quota_error text;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;


  -- Serialise the free allowance across every group and promise join.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('participation-join:' || v_actor_id::text, 0));

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'join-public-group:' || v_actor_id::text || ':' || p_group_id::text,
      0
    )
  );

  select team_row.*
  into v_group
  from public.teams team_row
  where team_row.id = p_group_id
  for update;

  if not found or v_group.status <> 'active' then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'GROUP_UNAVAILABLE');
  end if;
  if coalesce(v_group.privacy, 'private') <> 'public' then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'INVITE_REQUIRED');
  end if;
  if exists (
    select 1 from public.team_members membership
    where membership.group_id = p_group_id and membership.user_id = v_actor_id
  ) then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'ALREADY_MEMBER');
  end if;

  v_quota_error := private.economy_quota_error_v1(v_actor_id, 'join_group');
  if v_quota_error is not null then
    return pg_catalog.jsonb_build_object('success', false, 'error', v_quota_error);
  end if;
  v_cost := private.economy_action_cost_v1(v_actor_id, 'join_group');

  if p_expected_cost is distinct from v_cost then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'QUOTE_STALE');
  end if;

  select coalesce(profile.momenta_balance, 0)
  into v_balance
  from public.profiles profile
  where profile.id = v_actor_id
  for update;

  if v_balance is null then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;
  if v_balance < v_cost then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE');
  end if;

  insert into public.team_members (group_id, user_id, role)
  values (p_group_id, v_actor_id, 'member');

  if v_cost > 0 then
    perform public.add_momenta_transaction(
      v_actor_id, -v_cost, 'Group join', 'spent', p_group_id
    );
  end if;

  perform private.record_participation_join_v1(v_actor_id);

  return pg_catalog.jsonb_build_object(
    'success', true,
    'group_id', p_group_id,
    'group_name', v_group.name,
    'cost', v_cost,
    'new_balance', v_balance - v_cost
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.grant_pro_period_freeze_v2(p_user_id uuid, p_period_reference text, p_quantity integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_reference text := pg_catalog.btrim(coalesce(p_period_reference, ''));
  v_inserted uuid;
begin
  if p_user_id is null or v_reference = '' or p_quantity is null
     or p_quantity < 0 or p_quantity > 12 then
    return pg_catalog.jsonb_build_object('success', false, 'error', 'INVALID_REQUEST');
  end if;
  insert into public.streak_unlock_receipts(user_id,sku,days)
  values(p_user_id, 'pro_freeze:' || v_reference, 0)
  on conflict(user_id,sku) do nothing returning user_id into v_inserted;
  if v_inserted is null then
    return pg_catalog.jsonb_build_object('success',true,'granted',false,'reason','already_granted');
  end if;
  if p_quantity > 0 then
    insert into public.inventory_items as inventory(user_id,item_sku,quantity,updated_at)
    values(p_user_id,'streak_freeze_basic',p_quantity,now())
    on conflict(user_id,item_sku) do update
    set quantity=inventory.quantity + excluded.quantity, updated_at=now();
  end if;
  return pg_catalog.jsonb_build_object('success',true,'granted',p_quantity > 0,
    'sku','streak_freeze_basic','quantity',p_quantity);
end;
$function$;

CREATE OR REPLACE FUNCTION public.join_challenge(p_challenge_id uuid, p_invite_code text DEFAULT NULL::text)
 RETURNS challenge_participants
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_member public.challenge_participants%rowtype;
begin
  if auth.uid() is null or not public.current_session_is_active() then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  select * into v_member from public.challenge_participants
  where challenge_id = p_challenge_id and user_id = auth.uid();
  if found then return v_member; end if;
  raise exception 'JOIN_QUOTE_REQUIRED' using errcode = 'P0001';
end;
$function$;

CREATE OR REPLACE FUNCTION public.claim_momenta_reward(p_user_id uuid, p_reward_type text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_reward_type text := lower(trim(coalesce(p_reward_type, '')));
  v_amount integer;
  v_reason text;
  v_new_balance integer;
  v_recent_count integer;
  v_recent_claim timestamptz;
  v_review_valid boolean := false;
  v_external_reference_id text;
begin
  if p_user_id is null or p_user_id is distinct from auth.uid() then
    raise insufficient_privilege using message = 'Cannot claim reward for another user';
  end if;

  if not public.current_session_is_active() then
    raise insufficient_privilege using message = 'AUTH_SESSION_REVOKED';
  end if;

  if v_reward_type = 'ad_reward' then
    return jsonb_build_object(
      'success', false,
      'error', 'AD_REWARD_REQUIRES_VERIFICATION',
      'message', 'Ad rewards appear after the ad provider confirms them.'
    );
  elsif v_reward_type = 'review_queue_reward' then
    v_amount := 8;
    v_reason := 'Review queue reward';
    v_external_reference_id :=
      'review_queue_reward:' || p_reference_id::text || ':' || p_user_id::text;

    if p_reference_id is null then
      return jsonb_build_object(
        'success', false,
        'error', 'REFERENCE_REQUIRED',
        'message', 'A reviewed proof is required for this reward.'
      );
    end if;

    select coalesce(momenta_balance, 0)
    into v_new_balance
    from public.profiles
    where id = p_user_id
    for update;

    if v_new_balance is null then
      return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
    end if;

    select max(created_at)
    into v_recent_claim
    from public.wallet_transactions
    where user_id = p_user_id
      and transaction_type = 'bonus'
      and reason = v_reason
      and external_reference_id = v_external_reference_id;

    if v_recent_claim is not null then
      return jsonb_build_object(
        'success', true,
        'granted', false,
        'reason', 'already_granted',
        'amount', 0,
        'balance', v_new_balance,
        'new_balance', v_new_balance,
        'reward_type', v_reward_type
      );
    end if;

    select exists (
      select 1
      from public.challenge_submissions cs
      where cs.id = p_reference_id
        and cs.status in ('approved', 'rejected')
        and cs.user_id <> p_user_id
        and (
          cs.reviewer_id = p_user_id
          or cs.reviewed_by = p_user_id
        )
    )
    into v_review_valid;

    if not v_review_valid then
      return jsonb_build_object(
        'success', false,
        'error', 'REVIEW_NOT_CONFIRMED',
        'message', 'Rewards are for confirmed reviews of someone else''s proof.'
      );
    end if;

    select count(*)
    into v_recent_count
    from public.wallet_transactions
    where user_id = p_user_id
      and transaction_type = 'bonus'
      and reason = v_reason
      and created_at >= now() - interval '1 day';

    if coalesce(v_recent_count, 0) >= 20 then
      return jsonb_build_object(
        'success', false,
        'error', 'DAILY_LIMIT',
        'message', 'Daily review rewards are already claimed.'
      );
    end if;
  else
    return jsonb_build_object('success', false, 'error', 'UNKNOWN_REWARD');
  end if;

  update public.profiles
  set
    momenta_balance = coalesce(momenta_balance, 0) + v_amount,
    updated_at = now()
  where id = p_user_id
  returning momenta_balance into v_new_balance;

  if v_new_balance is null then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  insert into public.wallet_transactions (
    user_id,
    amount,
    reason,
    transaction_type,
    description,
    reference_id,
    external_reference_id,
    created_at
  )
  values (
    p_user_id,
    v_amount,
    v_reason,
    'bonus',
    v_reason,
    p_reference_id,
    v_external_reference_id,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'granted', true,
    'amount', v_amount,
    'new_balance', v_new_balance,
    'reward_type', v_reward_type
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.auto_approve_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Ensure is_approved is always true for new users
  NEW.is_approved = COALESCE(NEW.is_approved, true);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.leave_challenge(p_challenge_id uuid)
 RETURNS challenge_participants
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_participant public.challenge_participants%rowtype;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  update public.challenge_participants cp
  set
    status = 'left',
    updated_at = now()
  where cp.challenge_id = p_challenge_id
    and cp.user_id = v_user_id
    and coalesce(cp.status, 'active') = 'active'
  returning * into v_participant;

  if not found then
    raise exception 'ACTIVE_PARTICIPATION_NOT_FOUND' using errcode = 'P0002';
  end if;

  return v_participant;
end;
$function$;

CREATE OR REPLACE FUNCTION public.grant_momenta_credit(p_user_id uuid, p_amount integer, p_reason text DEFAULT 'revenuecat_credit'::text, p_transaction_type text DEFAULT 'credit'::text, p_external_reference_id text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_new_balance integer;
  v_transaction_id bigint;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'p_amount must be greater than zero';
  end if;

  perform 1 from public.profiles where id = p_user_id;
  if not found then
    raise exception 'profile not found';
  end if;

  if p_external_reference_id is not null and exists (
    select 1
    from public.wallet_transactions
    where external_reference_id = p_external_reference_id
  ) then
    select coalesce(momenta_balance, 0)
    into v_new_balance
    from public.profiles
    where id = p_user_id;

    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'new_balance', v_new_balance
    );
  end if;

  insert into public.wallet_transactions (
    user_id,
    amount,
    reason,
    transaction_type,
    description,
    external_reference_id
  )
  values (
    p_user_id,
    p_amount,
    p_reason,
    p_transaction_type,
    p_description,
    p_external_reference_id
  )
  on conflict (external_reference_id) where external_reference_id is not null do nothing
  returning id into v_transaction_id;

  if v_transaction_id is null then
    select coalesce(momenta_balance, 0)
    into v_new_balance
    from public.profiles
    where id = p_user_id;

    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'new_balance', v_new_balance
    );
  end if;

  update public.profiles
  set
    momenta_balance = coalesce(momenta_balance, 0) + p_amount,
    updated_at = now()
  where id = p_user_id
  returning momenta_balance into v_new_balance;

  return jsonb_build_object(
    'success', true,
    'duplicate', false,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.process_expired_challenges()
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select; $function$;

CREATE OR REPLACE FUNCTION public.is_current_user_team_member(p_group_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select exists (
    select 1
    from public.team_members tm
    where tm.group_id = p_group_id
      and tm.user_id = (select auth.uid())
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_team_owner(p_group_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select exists (
    select 1
    from public.teams t
    where t.id = p_group_id
      and t.owner_id = (select auth.uid())
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_team_admin(p_group_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select exists (
    select 1
    from public.team_members tm
    where tm.group_id = p_group_id
      and tm.user_id = (select auth.uid())
      and tm.role in ('owner', 'admin', 'moderator')
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_welcome_bonus_status(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
declare
  v_granted boolean;
  v_dismissed boolean;
  v_balance integer;
begin
  if p_user_id is distinct from (select auth.uid()) then
    raise insufficient_privilege using message = 'Cannot read another user welcome bonus status';
  end if;

  insert into public.user_flags (user_id, welcome_bonus_granted, welcome_bonus_dismissed)
  values (p_user_id, false, false)
  on conflict (user_id) do nothing;

  select
    coalesce(welcome_bonus_granted, false),
    coalesce(welcome_bonus_dismissed, false)
  into v_granted, v_dismissed
  from public.user_flags
  where user_id = p_user_id;

  select coalesce(momenta_balance, 0)
  into v_balance
  from public.profiles
  where id = p_user_id;

  return jsonb_build_object(
    'granted', coalesce(v_granted, false),
    'dismissed', coalesce(v_dismissed, false),
    'balance', coalesce(v_balance, 0),
    'should_show', not coalesce(v_granted, false) and not coalesce(v_dismissed, false)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.grant_welcome_bonus_once(p_user_id uuid, p_amount integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
declare
  already_granted boolean;
  v_amount integer := 100;
  v_new_balance integer;
begin
  if p_user_id is distinct from auth.uid() then
    raise insufficient_privilege using message = 'Cannot grant another user welcome bonus';
  end if;

  insert into public.user_flags (user_id, welcome_bonus_granted)
  values (p_user_id, false)
  on conflict (user_id) do nothing;

  select coalesce(welcome_bonus_granted, false)
  into already_granted
  from public.user_flags
  where user_id = p_user_id
  for update;

  if already_granted then
    return jsonb_build_object(
      'success', true,
      'granted', false,
      'reason', 'already_granted',
      'balance', (select momenta_balance from public.profiles where id = p_user_id)
    );
  end if;

  update public.user_flags
  set
    welcome_bonus_granted = true,
    welcome_bonus_dismissed = false,
    updated_at = now()
  where user_id = p_user_id;

  update public.profiles
  set
    momenta_balance = coalesce(momenta_balance, 0) + v_amount,
    updated_at = now()
  where id = p_user_id
  returning momenta_balance into v_new_balance;

  if v_new_balance is null then
    return jsonb_build_object('success', false, 'granted', false, 'error', 'USER_NOT_FOUND');
  end if;

  insert into public.wallet_transactions (
    user_id,
    amount,
    reason,
    transaction_type,
    description,
    reference_id,
    external_reference_id,
    created_at
  )
  values (
    p_user_id,
    v_amount,
    'Onboarding bonus',
    'bonus',
    'Onboarding bonus',
    p_user_id,
    'welcome_bonus_v1:' || p_user_id::text,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'granted', true,
    'amount', v_amount,
    'balance', v_new_balance,
    'new_balance', v_new_balance
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.user_is_pro(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from rc_entitlements e
    where e.user_id = p_user_id
      and e.entitlement_key = 'pro_access'
      and e.is_active = true
      and (e.ends_at is null or e.ends_at > now())
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_quota_limit(p_key text)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with cfg as (
    select value::int as v
    from system_config
    where key = p_key
    limit 1
  )
  select coalesce(
    (select v from cfg),
    case p_key
      when 'max_active_groups' then 2
      when 'max_groups_per_month' then 2
      when 'max_challenges_per_month' then 4
      else 0
    end
  );
$function$;

CREATE OR REPLACE FUNCTION public.current_utc_end_of_day()
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select (date_trunc('day', now() at time zone 'UTC') + interval '1 day' - interval '1 second') at time zone 'UTC';
$function$;

CREATE OR REPLACE FUNCTION public.active_memberships_for_user(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count(*)::int
  from group_members gm
  join groups g on g.id = gm.group_id
  where gm.user_id = p_user_id
    and (g.status = 'active' or g.status is null);
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails ae
    JOIN auth.users u ON u.email = ae.email
    WHERE ae.is_active = true 
    AND u.id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_welcome_bonus_status(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_granted boolean;
  v_balance integer;
BEGIN
  -- Check user_flags table
  SELECT welcome_bonus_granted INTO v_granted
  FROM user_flags
  WHERE user_id = p_user_id;
  
  -- If no record, user hasn't claimed
  IF v_granted IS NULL THEN
    v_granted := false;
  END IF;
  
  -- Get current balance
  SELECT momenta_balance INTO v_balance
  FROM users
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'already_granted', v_granted,
    'balance', v_balance
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_profile(p_username text DEFAULT NULL::text, p_avatar_url text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update public.users
  set
    username = coalesce(p_username, username),
    avatar_url = coalesce(p_avatar_url, avatar_url),
    updated_at = now()
  where id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.can_join_challenge(p_user_id uuid, p_challenge_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  -- Allow if challenge allows self-review and user is the creator
  if exists (
    select 1 from public.challenges c
    where c.id = p_challenge_id
      and c.creator_id = p_user_id
      and coalesce(c.allow_self_review, false) = true
  ) then
    return true;
  end if;

  -- Allow if challenge does not allow self-review (i.e., normal challenges everyone can join)
  if exists (
    select 1 from public.challenges c
    where c.id = p_challenge_id
      and coalesce(c.allow_self_review, false) = false
  ) then
    return true;
  end if;

  return false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.check_submission_rate_limit(p_ip_address inet)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    submission_data RECORD;
    max_submissions_per_hour INTEGER := 3;
    max_submissions_per_day INTEGER := 10;
BEGIN
    -- Get current submission data for this IP
    SELECT 
        submission_count,
        first_submission,
        last_submission,
        EXTRACT(EPOCH FROM (now() - last_submission)) / 3600 as hours_since_last,
        EXTRACT(EPOCH FROM (now() - first_submission)) / 3600 as hours_since_first
    INTO submission_data
    FROM public.waitlist_submissions 
    WHERE ip_address = p_ip_address;

    -- If no previous submissions, allow
    IF NOT FOUND THEN
        INSERT INTO public.waitlist_submissions (ip_address) 
        VALUES (p_ip_address);
        RETURN TRUE;
    END IF;

    -- Reset counter if more than 24 hours have passed
    IF submission_data.hours_since_first > 24 THEN
        UPDATE public.waitlist_submissions 
        SET submission_count = 1, 
            first_submission = now(),
            last_submission = now()
        WHERE ip_address = p_ip_address;
        RETURN TRUE;
    END IF;

    -- Check daily limit
    IF submission_data.submission_count >= max_submissions_per_day THEN
        RETURN FALSE;
    END IF;

    -- Check hourly limit (more than 3 in last hour)
    IF submission_data.hours_since_last < 1 AND submission_data.submission_count >= max_submissions_per_hour THEN
        RETURN FALSE;
    END IF;

    -- Update submission count
    UPDATE public.waitlist_submissions 
    SET submission_count = submission_count + 1,
        last_submission = now()
    WHERE ip_address = p_ip_address;

    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_momenta_transaction(p_user_id uuid, p_amount integer, p_reason text, p_transaction_type text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_new_balance integer;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'USER_REQUIRED');
  end if;

  if auth.uid() is not null and auth.uid() <> p_user_id then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  if p_amount is null or p_amount = 0 then
    return jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  end if;

  -- Client sessions may spend their own Momenta, but positive grants must be
  -- issued by service-role webhooks/edge functions or narrow reward RPCs.
  if p_amount > 0 and coalesce(auth.role(), '') <> 'service_role' then
    return jsonb_build_object('success', false, 'error', 'SERVER_GRANT_REQUIRED');
  end if;

  update public.profiles
  set
    momenta_balance = coalesce(momenta_balance, 0) + p_amount,
    updated_at = now()
  where id = p_user_id
  returning momenta_balance into v_new_balance;

  if v_new_balance is null then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  insert into public.wallet_transactions (
    user_id,
    amount,
    reason,
    transaction_type,
    description,
    reference_id,
    created_at
  )
  values (
    p_user_id,
    p_amount,
    coalesce(p_reason, 'momenta_adjustment'),
    coalesce(
      p_transaction_type,
      case when p_amount >= 0 then 'earned' else 'spent' end
    ),
    coalesce(p_reason, 'Momenta balance update'),
    p_reference_id,
    now()
  );

  return jsonb_build_object('success', true, 'new_balance', v_new_balance);
end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_waitlist_email(p_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    -- Basic email validation
    IF p_email IS NULL OR length(p_email) < 5 OR length(p_email) > 254 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for basic email format
    IF p_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Block obvious spam patterns
    IF p_email ~* '(test|spam|fake|dummy|noreply|no-reply)' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.unequip_item(p_user_id uuid, p_category text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  if p_user_id is null or p_user_id is distinct from auth.uid() then
    raise insufficient_privilege using message = 'Cannot unequip another user item';
  end if;

  delete from public.equipped_items
  where user_id = p_user_id
    and category = p_category;

  return jsonb_build_object('success', true, 'category', p_category);
end;
$function$;

CREATE OR REPLACE FUNCTION public.group_day_window(p_group_id uuid, p_at timestamp with time zone DEFAULT now())
 RETURNS TABLE(window_start_utc timestamp with time zone, window_end_utc timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  with cfg as (
    select g.timezone,
           coalesce(c.daily_deadline_hour_utc, 23) as cutoff_hour,
           coalesce(c.grace_minutes, 0) as grace_min
    from public.groups g
    left join public.group_challenges gc on gc.group_id = g.id
    left join public.challenges c on c.id = gc.challenge_id
    where g.id = p_group_id
    limit 1
  ),
  tz as (
    select (p_at at time zone (select timezone from cfg))::timestamp as local_ts,
           (select cutoff_hour from cfg) as cutoff_hour,
           (select grace_min from cfg) as grace_min,
           (select timezone from cfg) as tzname
  ),
  borders as (
    select date_trunc('day', local_ts) + make_interval(hours => cutoff_hour) as local_cutoff from tz
  )
  select
    (b.local_cutoff - make_interval(days => 1) - make_interval(mins => tz.grace_min)) at time zone tz.tzname as window_start_utc,
    (b.local_cutoff                              + make_interval(mins => tz.grace_min)) at time zone tz.tzname as window_end_utc
  from borders b, tz;
$function$;

CREATE OR REPLACE FUNCTION public.dismiss_welcome_bonus(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
begin
  if p_user_id is distinct from (select auth.uid()) then
    raise insufficient_privilege using message = 'Cannot dismiss another user welcome bonus';
  end if;

  insert into public.user_flags (user_id, welcome_bonus_granted, welcome_bonus_dismissed)
  values (p_user_id, false, false)
  on conflict (user_id) do nothing;

  update public.user_flags
  set
    welcome_bonus_dismissed = true,
    welcome_bonus_dismissed_at = now(),
    updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'dismissed_at', now()
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_all_group_streaks()
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select; $function$;

CREATE OR REPLACE FUNCTION public.debit_user_momenta_if_sufficient(p_user_id uuid, p_amount integer, p_reason text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance integer;
  v_transaction_id uuid;
BEGIN
  -- Get current balance
  SELECT COALESCE(momenta_balance, 0) INTO v_current_balance
  FROM users
  WHERE id = p_user_id;
  
  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_balance',
      'current_balance', v_current_balance,
      'required', p_amount
    );
  END IF;
  
  -- Deduct from user balance
  UPDATE users
  SET momenta_balance = momenta_balance - p_amount
  WHERE id = p_user_id;
  
  -- Record transaction with idempotency support
  INSERT INTO momenta_transactions (
    user_id,
    amount,
    reason,
    transaction_type,
    reference_id,
    created_at
  )
  VALUES (
    p_user_id,
    -p_amount,
    p_reason,
    'penalty',
    p_reference_id,
    NOW()
  )
  ON CONFLICT (reference_id) WHERE reference_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'amount_debited', p_amount,
    'new_balance', v_current_balance - p_amount
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_creation_attempts()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  DELETE FROM public.creation_attempts 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_momenta_currency(p_user_id uuid, p_amount integer, p_description text DEFAULT 'Currency reward'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  transaction_id UUID;
BEGIN
  INSERT INTO transactions (user_id, amount, description, transaction_type)
  VALUES (p_user_id, p_amount, p_description, 'reward')
  RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_group_accessible(p_group_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select jsonb_build_object('accessible', true, 'reason', null, 'group_id', p_group_id); $function$;

CREATE OR REPLACE FUNCTION public.apply_double_points(p_user_id uuid, p_challenge_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Check inventory
  IF NOT EXISTS (
    SELECT 1 FROM user_inventory 
    WHERE user_id = p_user_id 
    AND item_sku = 'double_points' 
    AND quantity > 0
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No double points power-ups available'
    );
  END IF;

  -- Check if already active
  IF EXISTS (
    SELECT 1 FROM power_up_usage
    WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id
    AND item_sku = 'double_points'
    AND is_active = true
    AND expires_at > now()
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Double points is already active for this challenge'
    );
  END IF;

  -- Apply the power-up (active for 24 hours)
  INSERT INTO power_up_usage (user_id, item_sku, challenge_id, expires_at)
  VALUES (p_user_id, 'double_points', p_challenge_id, now() + interval '24 hours');

  -- Decrement inventory
  UPDATE user_inventory
  SET quantity = quantity - 1
  WHERE user_id = p_user_id 
  AND item_sku = 'double_points';

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', now() + interval '24 hours'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_accountability_challenge_without_legal_gate(p_title text, p_description text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_duration integer DEFAULT 30, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_is_public boolean DEFAULT true, p_difficulty text DEFAULT 'medium'::text, p_points integer DEFAULT 200, p_verification_type text DEFAULT 'photo'::text, p_verification_frequency text DEFAULT 'daily'::text, p_verification_description text DEFAULT NULL::text, p_submission_text text DEFAULT NULL::text, p_allow_extensions boolean DEFAULT true, p_max_extensions integer DEFAULT 2, p_deadline_type text DEFAULT 'fixed'::text, p_allow_self_review boolean DEFAULT false, p_group_id uuid DEFAULT NULL::uuid, p_cost integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_create_result jsonb;
  v_challenge public.challenges%rowtype;
  v_challenge_id uuid;
  v_is_activation_candidate boolean := false;
  v_is_first_promise boolean := false;
  v_welcome_result jsonb;
  v_activation_result jsonb;
  v_deadline_hour integer;
  v_grace_minutes integer;
  v_reference_at timestamptz;
  v_next_due_at timestamptz;
  v_receipt jsonb;
begin
  if v_user_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('account-activation:' || v_user_id::text, 0)
  );

  perform private.lock_activation_profiles_v1(v_user_id);

  v_is_activation_candidate := not exists (
    select 1
    from private.account_activation_receipts activation
    where activation.user_id = v_user_id
  ) and not exists (
    select 1
    from public.challenges challenge
    where challenge.creator_id = v_user_id
  );

  if v_is_activation_candidate then
    v_welcome_result := private.ensure_welcome_reward_v1(v_user_id);

    if coalesce((v_welcome_result ->> 'success')::boolean, false) is not true then
      v_create_result := pg_catalog.jsonb_build_object(
        'success', false,
        'error', coalesce(v_welcome_result ->> 'error', 'WELCOME_REWARD_UNAVAILABLE')
      );
      raise exception 'ACTIVATION_CREATE_ABORT'
        using errcode = 'MX001';
    end if;
  end if;

  v_create_result := public.create_challenge_with_payment(
    v_user_id,
    p_title,
    p_description,
    p_category,
    p_duration,
    p_start_date,
    p_end_date,
    p_is_public,
    p_difficulty,
    p_points,
    p_verification_type,
    p_verification_frequency,
    p_verification_description,
    p_submission_text,
    p_allow_extensions,
    p_max_extensions,
    p_deadline_type,
    p_allow_self_review,
    p_group_id,
    p_cost
  );

  if coalesce((v_create_result ->> 'success')::boolean, false) is not true
     or nullif(v_create_result ->> 'challenge_id', '') is null then
    raise exception 'ACTIVATION_CREATE_ABORT'
      using errcode = 'MX001';
  end if;

  v_challenge_id := (v_create_result ->> 'challenge_id')::uuid;

  select challenge.*
  into v_challenge
  from public.challenges challenge
  where challenge.id = v_challenge_id
    and challenge.creator_id = v_user_id;

  if not found then
    v_create_result := pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'CHALLENGE_RECEIPT_NOT_FOUND'
    );
    raise exception 'ACTIVATION_CREATE_ABORT'
      using errcode = 'MX001';
  end if;

  v_deadline_hour := case
    when coalesce(
      v_challenge.submission_expectations ->> 'daily_deadline_hour_utc',
      ''
    ) ~ '^[0-9]{1,2}$'
      then least(
        23,
        greatest(
          0,
          (v_challenge.submission_expectations ->>
            'daily_deadline_hour_utc')::integer
        )
      )
    else 23
  end;

  v_grace_minutes := case
    when coalesce(
      v_challenge.submission_expectations ->> 'grace_minutes',
      ''
    ) ~ '^[0-9]{1,4}$'
      then least(
        1440,
        greatest(
          0,
          (v_challenge.submission_expectations ->> 'grace_minutes')::integer
        )
      )
    else 0
  end;

  v_reference_at := greatest(now(), v_challenge.start_date);
  v_next_due_at := (
    pg_catalog.date_trunc('day', v_reference_at at time zone 'UTC')
    + pg_catalog.make_interval(
      hours => v_deadline_hour,
      mins => v_grace_minutes
    )
  ) at time zone 'UTC';

  if v_next_due_at <= v_reference_at then
    v_next_due_at := (
      pg_catalog.date_trunc('day', v_reference_at at time zone 'UTC')
      + interval '1 day'
      + pg_catalog.make_interval(
        hours => v_deadline_hour,
        mins => v_grace_minutes
      )
    ) at time zone 'UTC';
  end if;

  if v_challenge.end_date is not null
     and v_next_due_at > v_challenge.end_date then
    v_next_due_at := null;
  end if;

  if v_is_activation_candidate then
    v_activation_result := private.finalise_account_activation_v1(
      v_user_id,
      v_challenge_id,
      v_challenge.title,
      v_next_due_at,
      v_welcome_result
    );
  else
    v_activation_result := private.finalise_account_activation_v1(
      v_user_id,
      v_challenge_id,
      v_challenge.title,
      null,
      '{}'::jsonb
    );
  end if;

  select activation.first_promise_id = v_challenge_id
  into v_is_first_promise
  from private.account_activation_receipts activation
  where activation.user_id = v_user_id;

  v_receipt := coalesce(v_create_result -> 'receipt', '{}'::jsonb)
    || pg_catalog.jsonb_build_object(
      'is_first_promise', coalesce(v_is_first_promise, false),
      'next_due_at', v_next_due_at,
      'activation', v_activation_result
    );

  return (v_create_result - 'receipt')
    || pg_catalog.jsonb_build_object('receipt', v_receipt);
exception
  when sqlstate 'MX001' then
    -- The exception subtransaction rolls back a provisional welcome credit,
    -- ledger row, flag change, and any partial challenge write while retaining
    -- the original failure response for installed clients.
    return v_create_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_challenge_completion_reward(p_challenge_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_duration integer;
  v_days integer;
  v_weeks integer;
  v_cost integer;
  v_weekly integer;
  v_reward integer;
  s_date date;
  e_date date;
BEGIN
  -- Prefer stored duration; if null, derive from dates
  SELECT duration, start_date::date, end_date::date
  INTO v_duration, s_date, e_date
  FROM challenges
  WHERE id = p_challenge_id;
  
  IF v_duration IS NULL OR v_duration <= 0 THEN
    IF s_date IS NOT NULL AND e_date IS NOT NULL THEN
      v_days := (e_date - s_date) + 1;
    ELSE
      v_days := 7; -- sensible fallback
    END IF;
  ELSE
    v_days := v_duration;
  END IF;
  
  -- Ceil days/7 without floats: (days + 6) / 7
  v_weeks := GREATEST(1, (v_days + 6) / 7);
  
  v_cost := public.get_create_group_cost();
  -- Base weekly reward is 1/5 of create_group cost; round to nearest int, min 1
  v_weekly := GREATEST(1, ROUND(v_cost / 5.0)::int);
  
  v_reward := v_weekly * v_weeks;
  RETURN v_reward;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_global_user_streaks()
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select; $function$;

CREATE OR REPLACE FUNCTION public.join_group_with_payment(p_user_id uuid, p_invite_code text, p_cost integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_code text;
  v_group_id uuid;
  v_group_name text;
  v_group_status text;
  v_existing boolean;
  v_balance integer;
  v_new_balance integer;
  v_rows integer;
  v_effective_cost integer;
  v_quota_error text;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'USER_REQUIRED');
  end if;

  if auth.uid() is not null and auth.uid() <> p_user_id then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;


  -- Serialise the free allowance across every group and promise join.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('participation-join:' || p_user_id::text, 0));

  v_code := upper(trim(coalesce(p_invite_code, '')));
  if v_code = '' then
    return jsonb_build_object('success', false, 'error', 'INVALID_CODE');
  end if;

  select ic.ref_id
  into v_group_id
  from public.invite_codes ic
  where ic.code = v_code
    and ic.type = 'group'
    and (ic.expires_at is null or ic.expires_at > now())
  limit 1;

  if v_group_id is null then
    return jsonb_build_object('success', false, 'error', 'INVALID_CODE');
  end if;

  select t.name, t.status
  into v_group_name, v_group_status
  from public.teams t
  where t.id = v_group_id
  limit 1;

  if v_group_status is null then
    return jsonb_build_object('success', false, 'error', 'GROUP_NOT_FOUND');
  end if;

  if v_group_status <> 'active' then
    return jsonb_build_object('success', false, 'error', 'GROUP_INACTIVE');
  end if;

  -- Serialise retries for one user and group before checking membership or
  -- charging Momenta. Without this lock, concurrent joins can both charge
  -- before one insert loses the unique-key race.
  perform pg_advisory_xact_lock(
    hashtextextended('join-group:' || p_user_id::text || ':' || v_group_id::text, 0)
  );

  select exists (
    select 1
    from public.team_members tm
    where tm.group_id = v_group_id
      and tm.user_id = p_user_id
  )
  into v_existing;

  if v_existing then
    return jsonb_build_object(
      'success', false,
      'error', 'ALREADY_MEMBER',
      'group_id', v_group_id,
      'group_name', v_group_name
    );
  end if;

  v_quota_error := private.economy_quota_error_v1(p_user_id, 'join_group');
  if v_quota_error is not null then
    return jsonb_build_object('success', false, 'error', v_quota_error);
  end if;

  v_effective_cost := private.economy_action_cost_v1(p_user_id, 'join_group');

  if p_cost is distinct from v_effective_cost then
    return jsonb_build_object('success', false, 'error', 'QUOTE_STALE');
  end if;

  if v_effective_cost > 0 then
    select p.momenta_balance
    into v_balance
    from public.profiles p
    where p.id = p_user_id
    for update;

    if v_balance is null then
      return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
    end if;

    if v_balance < v_effective_cost then
      return jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE');
    end if;

    update public.profiles
    set
      momenta_balance = coalesce(momenta_balance, 0) - v_effective_cost,
      updated_at = now()
    where id = p_user_id
    returning momenta_balance into v_new_balance;

    insert into public.wallet_transactions (
      user_id,
      amount,
      reason,
      transaction_type,
      description,
      reference_id,
      created_at
    )
    values (
      p_user_id,
      -v_effective_cost,
      'join_group',
      'spent',
      'Join group: ' || coalesce(v_group_name, 'group'),
      v_group_id,
      now()
    );
  else
    select coalesce(p.momenta_balance, 0)
    into v_new_balance
    from public.profiles p
    where p.id = p_user_id;
  end if;

  insert into public.team_members (group_id, user_id, role)
  values (v_group_id, p_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'ALREADY_MEMBER',
      'group_id', v_group_id,
      'group_name', v_group_name,
      'new_balance', coalesce(v_new_balance, 0)
    );
  end if;

  perform private.record_participation_join_v1(p_user_id);

  return jsonb_build_object(
    'success', true,
    'group_id', v_group_id,
    'group_name', v_group_name,
    'new_balance', coalesce(v_new_balance, 0),
    'cost', v_effective_cost
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_creation_attempt_stats(p_user_id uuid DEFAULT NULL::uuid, p_hours integer DEFAULT 24)
 RETURNS TABLE(total_attempts bigint, successful_attempts bigint, failed_attempts bigint, success_rate numeric, common_errors text[])
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  since_timestamp TIMESTAMPTZ := NOW() - (p_hours || ' hours')::INTERVAL;
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE success = true) as successful_attempts,
    COUNT(*) FILTER (WHERE success = false) as failed_attempts,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as success_rate,
    ARRAY_AGG(DISTINCT error) FILTER (WHERE error IS NOT NULL) as common_errors
  FROM public.creation_attempts
  WHERE 
    (p_user_id IS NULL OR user_id = p_user_id)
    AND timestamp >= since_timestamp;
END;
$function$;

CREATE OR REPLACE FUNCTION public.use_group_freeze(p_group_id uuid, p_challenge_id uuid, p_user_id uuid, p_for_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_is_member boolean;
  v_has_max_extensions boolean;
  v_has_extension_count boolean;
  v_max_extensions integer;
  v_current_extensions integer;
  v_freeze_id uuid;
BEGIN
  IF p_group_id IS NULL OR p_challenge_id IS NULL OR p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_REQUEST');
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE group_id = p_group_id
      AND user_id = p_user_id
  )
  INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_A_MEMBER');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teams'
      AND column_name = 'max_extensions'
  )
  INTO v_has_max_extensions;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teams'
      AND column_name = 'extension_count'
  )
  INTO v_has_extension_count;

  IF v_has_max_extensions AND v_has_extension_count THEN
    EXECUTE
      'SELECT COALESCE(max_extensions, 2), COALESCE(extension_count, 0) FROM public.teams WHERE id = $1'
    INTO v_max_extensions, v_current_extensions
    USING p_group_id;
  ELSE
    SELECT COUNT(*)
    INTO v_current_extensions
    FROM public.group_freeze_usages
    WHERE group_id = p_group_id;

    v_max_extensions := 2;
  END IF;

  IF v_max_extensions IS NULL OR v_current_extensions IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'GROUP_NOT_FOUND');
  END IF;

  IF v_current_extensions >= v_max_extensions THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NO_FREEZES_REMAINING',
      'used', v_current_extensions,
      'max', v_max_extensions
    );
  END IF;

  BEGIN
    INSERT INTO public.group_freeze_usages (
      group_id,
      challenge_id,
      used_by,
      used_for_date
    )
    VALUES (
      p_group_id,
      p_challenge_id,
      p_user_id,
      p_for_date
    )
    RETURNING id INTO v_freeze_id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'FREEZE_ALREADY_USED_FOR_DATE'
      );
  END;

  RETURN jsonb_build_object(
    'success', true,
    'freeze_id', v_freeze_id,
    'used_for_date', p_for_date,
    'remaining_freezes', v_max_extensions - v_current_extensions - 1
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  suspicious_user RECORD;
BEGIN
  -- Find users with unusually high verification submission rates
  FOR suspicious_user IN
    SELECT 
      user_id,
      COUNT(*) as submission_count,
      MIN(submission_date) as first_submission,
      MAX(submission_date) as last_submission
    FROM challenge_verifications
    WHERE submission_date >= NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 5
  LOOP
    PERFORM log_security_event(
      'suspicious_submission_rate',
      suspicious_user.user_id,
      jsonb_build_object(
        'submission_count', suspicious_user.submission_count,
        'time_window', '1 hour'
      )
    );
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_challenges_expiring_soon()
 RETURNS TABLE(challenge_id text, title text, user_id uuid, username text, hours_until_expiry integer, current_streak integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH candidate AS (
    SELECT c.id,c.title,cp.user_id,COALESCE(p.username,'member') AS username,
      GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (c.end_date - NOW())) / 3600)::int) AS hours_until_expiry,
      COALESCE(gst.current_streak,0) AS current_streak
    FROM public.challenges c
    JOIN public.challenge_participants cp ON cp.challenge_id = c.id AND cp.status = 'active'
    LEFT JOIN public.profiles p ON p.id = cp.user_id
    LEFT JOIN public.team_challenges tc ON tc.challenge_id = c.id
    LEFT JOIN public.group_streak_tracking gst ON gst.group_id = tc.group_id
    WHERE c.status = 'active' AND c.end_date IS NOT NULL
      AND c.end_date > NOW() + INTERVAL '2 hours'
      AND c.end_date <= NOW() + INTERVAL '6 hours'
  )
  SELECT c.id::text,c.title,c.user_id,c.username,c.hours_until_expiry,c.current_streak
  FROM candidate c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = c.user_id
      AND n.notification_type = 'challenge_expiring'
      AND COALESCE(n.payload->>'challengeId', n.metadata->>'challengeId') = c.id::text
      AND n.created_at >= date_trunc('day', NOW())
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_recently_expired_challenges()
 RETURNS TABLE(challenge_id text, title text, user_id uuid, username text, hours_until_expiry integer, current_streak integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH candidate AS (
    SELECT c.id,c.title,cp.user_id,COALESCE(p.username,'member') AS username,0::int AS hours_until_expiry,
      COALESCE(gst.current_streak,0) AS current_streak
    FROM public.challenges c
    JOIN public.challenge_participants cp ON cp.challenge_id = c.id AND cp.status = 'active'
    LEFT JOIN public.profiles p ON p.id = cp.user_id
    LEFT JOIN public.team_challenges tc ON tc.challenge_id = c.id
    LEFT JOIN public.group_streak_tracking gst ON gst.group_id = tc.group_id
    WHERE c.end_date IS NOT NULL
      AND c.end_date <= NOW()
      AND c.end_date >= NOW() - INTERVAL '2 hours'
  )
  SELECT c.id::text,c.title,c.user_id,c.username,c.hours_until_expiry,c.current_streak
  FROM candidate c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = c.user_id
      AND n.notification_type = 'challenge_expired'
      AND COALESCE(n.payload->>'challengeId', n.metadata->>'challengeId') = c.id::text
      AND n.created_at >= date_trunc('day', NOW())
  );
$function$;

CREATE OR REPLACE FUNCTION public.notify_group_streak_warning()
 RETURNS TABLE(notifications_sent integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE inserted_count integer := 0;
BEGIN
  WITH candidates AS (
    SELECT tm.user_id,t.id AS group_id,t.name AS group_name,gds.participation_rate
    FROM public.group_daily_status gds
    JOIN public.teams t ON t.id = gds.group_id AND t.status='active'
    JOIN public.team_members tm ON tm.group_id = t.id
    LEFT JOIN public.team_notification_preferences tnp ON tnp.group_id = t.id AND tnp.user_id = tm.user_id
    LEFT JOIN public.notification_preferences np ON np.user_id = tm.user_id
    WHERE gds.local_date = CURRENT_DATE
      AND gds.participation_rate < 0.7
      AND gds.participation_rate >= 0
      AND COALESCE(tnp.notify_all,true) = true
      AND COALESCE(np.group_updates,true) = true
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = tm.user_id
          AND n.notification_type='group_streak_warning'
          AND COALESCE(n.payload->>'groupId', n.metadata->>'groupId') = t.id::text
          AND n.created_at >= date_trunc('day', NOW())
      )
  ), inserted AS (
    INSERT INTO public.notifications (user_id,notification_type,title,body,payload,metadata,priority,scheduled_for)
    SELECT c.user_id,'group_streak_warning','🏰 Group Streak At Risk',
      format('"%s" is below target participation (%.0f%%). Check in now to protect your streak.', c.group_name, c.participation_rate * 100),
      jsonb_build_object('groupId', c.group_id::text, 'deepLink', 'groups/' || c.group_id::text, 'type', 'group_streak_warning'),
      jsonb_build_object('groupName', c.group_name, 'participationRate', c.participation_rate),
      2,NOW()
    FROM candidates c
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted;

  RETURN QUERY SELECT inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fix_schedule_alignment(p_group_id uuid, p_fix_strategy text DEFAULT 'shorten_challenge'::text)
 RETURNS TABLE(group_id uuid, challenge_id uuid, action_taken text, old_start_date timestamp with time zone, new_start_date timestamp with time zone, old_end_date timestamp with time zone, new_end_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    group_record record;
    challenge_record record;
BEGIN
    -- Get group info
    SELECT * INTO group_record FROM public.groups WHERE id = p_group_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group not found: %', p_group_id;
    END IF;

    -- Process each misaligned challenge
    FOR challenge_record IN
        SELECT
            c.*,
            CASE
                WHEN c.end_date IS NOT NULL THEN c.end_date
                WHEN c.start_date IS NOT NULL AND c.duration IS NOT NULL
                THEN c.start_date + (c.duration || ' days')::interval
                ELSE NULL
            END as calculated_end_date
        FROM public.challenges c
        JOIN public.group_challenges gc ON gc.challenge_id = c.id
        WHERE gc.group_id = p_group_id
        AND (
            (c.start_date IS NOT NULL AND c.start_date < group_record.start_date) OR
            (c.start_date IS NOT NULL AND c.duration IS NOT NULL AND
             c.start_date + (c.duration || ' days')::interval > group_record.end_date)
        )
    LOOP
        -- Return old values for tracking
        group_id := p_group_id;
        challenge_id := challenge_record.id;
        old_start_date := challenge_record.start_date;
        old_end_date := challenge_record.calculated_end_date;

        CASE p_fix_strategy
            WHEN 'shorten_challenge' THEN
                -- Move challenge start to group start and shorten duration if needed
                new_start_date := GREATEST(challenge_record.start_date, group_record.start_date);
                IF challenge_record.duration IS NOT NULL THEN
                    DECLARE
                        max_duration_days integer := EXTRACT(EPOCH FROM (group_record.end_date - new_start_date)) / 86400;
                        new_duration integer := LEAST(challenge_record.duration, max_duration_days);
                    BEGIN
                        -- Update the challenge
                        UPDATE public.challenges
                        SET
                            start_date = new_start_date,
                            duration = new_duration,
                            end_date = NULL -- Clear explicit end_date to use calculated
                        WHERE id = challenge_record.id;

                        new_end_date := new_start_date + (new_duration || ' days')::interval;
                        action_taken := 'shortened_challenge_duration';
                    END;
                ELSE
                    -- Just move start date
                    UPDATE public.challenges
                    SET start_date = new_start_date
                    WHERE id = challenge_record.id;

                    new_end_date := challenge_record.calculated_end_date;
                    action_taken := 'moved_challenge_start';
                END IF;

            WHEN 'extend_group' THEN
                -- Extend group to accommodate challenge
                DECLARE
                    new_group_end timestamptz;
                BEGIN
                    IF challenge_record.calculated_end_date > group_record.end_date THEN
                        new_group_end := challenge_record.calculated_end_date + INTERVAL '1 day';
                        UPDATE public.groups
                        SET duration_days = EXTRACT(EPOCH FROM (new_group_end - group_record.start_date)) / 86400
                        WHERE id = p_group_id;

                        new_start_date := challenge_record.start_date;
                        new_end_date := challenge_record.calculated_end_date;
                        action_taken := 'extended_group_duration';
                    END IF;
                END;

            ELSE
                -- Default: report only
                new_start_date := challenge_record.start_date;
                new_end_date := challenge_record.calculated_end_date;
                action_taken := 'reported_only';
        END CASE;

        RETURN NEXT;
    END LOOP;

    -- If no misaligned challenges found
    IF NOT FOUND THEN
        group_id := p_group_id;
        challenge_id := NULL;
        action_taken := 'no_action_needed';
        old_start_date := NULL;
        new_start_date := NULL;
        old_end_date := NULL;
        new_end_date := NULL;
        RETURN NEXT;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_group_member_missed_streak()
 RETURNS TABLE(notifications_sent integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE inserted_count integer := 0;
BEGIN
  WITH missed AS (
    SELECT DISTINCT cp.user_id,tc.group_id,cp.challenge_id,c.title AS challenge_title,t.name AS group_name
    FROM public.challenge_participants cp
    JOIN public.team_challenges tc ON tc.challenge_id = cp.challenge_id
    JOIN public.teams t ON t.id = tc.group_id AND t.status = 'active'
    JOIN public.challenges c ON c.id = cp.challenge_id AND c.status='active'
    LEFT JOIN public.notification_preferences np ON np.user_id = cp.user_id
    WHERE cp.status='active'
      AND COALESCE(np.streak_alerts,true)=true
      AND NOT EXISTS (
        SELECT 1 FROM public.challenge_submissions cs
        WHERE cs.challenge_id = cp.challenge_id
          AND cs.user_id = cp.user_id
          AND cs.submission_date::date = CURRENT_DATE
      )
      AND EXISTS (
        SELECT 1 FROM public.challenge_submissions cs_hist
        WHERE cs_hist.challenge_id = cp.challenge_id
          AND cs_hist.user_id = cp.user_id
          AND cs_hist.submission_date::date < CURRENT_DATE
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = cp.user_id
          AND n.notification_type='missed_streak'
          AND COALESCE(n.payload->>'challengeId', n.metadata->>'challengeId') = cp.challenge_id::text
          AND n.created_at >= date_trunc('day', NOW())
      )
  ), inserted AS (
    INSERT INTO public.notifications (user_id,notification_type,title,body,payload,metadata,priority,scheduled_for)
    SELECT m.user_id,'missed_streak','⚠️ You Missed Today''s Check-in',
      format('You missed your daily check-in for "%s" in "%s". Jump back in now.', m.challenge_title, m.group_name),
      jsonb_build_object('groupId', m.group_id::text, 'challengeId', m.challenge_id::text, 'deepLink', 'challenges/' || m.challenge_id::text),
      jsonb_build_object('groupName', m.group_name, 'challengeTitle', m.challenge_title),
      2,NOW()
    FROM missed m
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted;

  RETURN QUERY SELECT inserted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_group_health_status(p_group_id uuid)
 RETURNS TABLE(group_name text, total_members integer, active_members integer, recent_activity_rate numeric, group_health_status text, active_challenges integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_total_members integer;
  v_active_members integer;
  v_recent_submissions integer;
  v_health_status text;
BEGIN
  -- Get basic group info
  SELECT COUNT(*) INTO v_total_members
  FROM group_members WHERE group_id = p_group_id;
  
  -- Count members with recent activity (last 7 days)
  SELECT COUNT(DISTINCT user_id) INTO v_active_members
  FROM challenge_verifications cv
  JOIN group_challenges gc ON cv.challenge_id = gc.challenge_id
  WHERE gc.group_id = p_group_id 
    AND cv.submission_date > CURRENT_DATE - INTERVAL '7 days';
  
  -- Calculate recent activity submissions
  SELECT COUNT(*) INTO v_recent_submissions
  FROM challenge_verifications cv
  JOIN group_challenges gc ON cv.challenge_id = gc.challenge_id
  WHERE gc.group_id = p_group_id 
    AND cv.submission_date > CURRENT_DATE - INTERVAL '3 days';
  
  -- Determine health status
  IF v_total_members = 0 THEN
    v_health_status := 'empty';
  ELSIF (v_active_members::decimal / v_total_members::decimal) >= 0.8 THEN
    v_health_status := 'healthy';
  ELSIF (v_active_members::decimal / v_total_members::decimal) >= 0.5 THEN
    v_health_status := 'at_risk';
  ELSE
    v_health_status := 'failing';
  END IF;
  
  RETURN QUERY
  SELECT 
    g.name,
    v_total_members,
    v_active_members,
    CASE 
      WHEN v_total_members > 0 
      THEN v_active_members::decimal / v_total_members::decimal
      ELSE 0::decimal
    END,
    v_health_status,
    (SELECT COUNT(*) FROM group_challenges gc JOIN challenges c ON gc.challenge_id = c.id 
     WHERE gc.group_id = p_group_id AND c.status = 'active')::integer
  FROM groups g
  WHERE g.id = p_group_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_notification_preferences(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'streak_reminders', COALESCE(unp.streak_reminders, true),
    'group_activity', COALESCE(unp.group_activity, true),
    'challenge_updates', COALESCE(unp.challenge_updates, true),
    'daily_inspiration', COALESCE(unp.daily_inspiration, false),
    'preferred_reminder_time', unp.preferred_reminder_time,
    'expo_push_token', unp.expo_push_token
  ) INTO result
  FROM user_notification_preferences unp
  WHERE unp.user_id = p_user_id;

  -- If no preferences found, return defaults
  IF result IS NULL THEN
    RETURN jsonb_build_object(
      'streak_reminders', true,
      'group_activity', true,
      'challenge_updates', true,
      'daily_inspiration', false,
      'preferred_reminder_time', NULL,
      'expo_push_token', NULL
    );
  END IF;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_group_streak(group_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  streak_count integer := 0;
  check_date date := CURRENT_DATE;
  consecutive_days integer := 0;
  group_member_count integer;
  required_participation integer;
BEGIN
  -- Get group member count
  SELECT COUNT(*) INTO group_member_count
  FROM group_members 
  WHERE group_id = group_uuid;
  
  -- If no members, return 0
  IF group_member_count = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate required participation (at least 50% of members)
  required_participation := CEIL(group_member_count * 0.5);
  
  -- Check consecutive days backwards from today
  WHILE check_date >= CURRENT_DATE - INTERVAL '365 days' LOOP
    -- Count how many members had activity on this date
    SELECT COUNT(DISTINCT gm.user_id) INTO consecutive_days
    FROM group_members gm
    JOIN user_challenges uc ON uc.user_id = gm.user_id
    JOIN group_challenges gc ON gc.challenge_id = uc.challenge_id
    WHERE gm.group_id = group_uuid 
    AND gc.group_id = group_uuid
    AND uc.last_check_in = check_date
    AND uc.current_streak > 0;
    
    -- If not enough participation, break the streak
    IF consecutive_days < required_participation THEN
      EXIT;
    END IF;
    
    streak_count := streak_count + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;
  
  RETURN streak_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_daily_submission_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM challenge_verifications cv
    WHERE cv.challenge_id = NEW.challenge_id 
      AND cv.user_id = NEW.user_id
      AND DATE(cv.submission_date) = DATE(NEW.submission_date)
      AND cv.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Only one verification per challenge per day allowed';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_power_up_inventory(p_user_id uuid)
 RETURNS TABLE(sku text, name text, count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    si.sku,
    si.name,
    COUNT(ip.item_id)::bigint as count
  FROM shop_items si
  LEFT JOIN item_purchases ip ON ip.item_id = si.id AND ip.user_id = p_user_id
  WHERE si.category = 'power_up'
  AND NOT si.is_disabled
  GROUP BY si.id, si.sku, si.name
  ORDER BY si.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.advance_deadline(p_challenge_id uuid, p_hours integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  UPDATE challenges 
  SET end_date = end_date + (p_hours || ' hours')::interval
  WHERE id = p_challenge_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_power_up(p_user_id uuid, p_item_sku text, p_challenge_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  item_record RECORD;
  user_inventory_count INTEGER;
  usage_id UUID;
  expiry_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get item details
  SELECT * INTO item_record 
  FROM shop_items 
  WHERE sku = p_item_sku;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found: %', p_item_sku;
  END IF;
  
  -- Check if user owns this item
  SELECT quantity INTO user_inventory_count
  FROM user_inventory 
  WHERE user_id = p_user_id AND item_sku = p_item_sku;
  
  IF user_inventory_count IS NULL OR user_inventory_count <= 0 THEN
    RAISE EXCEPTION 'User does not own item: %', p_item_sku;
  END IF;
  
  -- Calculate expiry based on item type
  CASE p_item_sku
    WHEN 'streak_freeze_1' THEN
      expiry_time := NOW() + INTERVAL '24 hours';
    WHEN 'time_extension_1' THEN
      expiry_time := NOW() + INTERVAL '12 hours';
    WHEN 'challenge_boost_1' THEN
      expiry_time := NOW() + INTERVAL '7 days';
    ELSE
      expiry_time := NOW() + INTERVAL '24 hours';
  END CASE;
  
  -- Check for existing active power-ups of the same type
  IF EXISTS (
    SELECT 1 FROM power_up_usage 
    WHERE user_id = p_user_id 
    AND item_sku = p_item_sku 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RAISE EXCEPTION 'Power-up of type % already active', p_item_sku;
  END IF;
  
  -- Create power-up usage record
  INSERT INTO power_up_usage (
    user_id,
    item_sku,
    challenge_id,
    expires_at,
    is_active
  )
  VALUES (
    p_user_id,
    p_item_sku,
    p_challenge_id,
    expiry_time,
    true
  )
  RETURNING id INTO usage_id;
  
  -- Consume one item from inventory
  UPDATE user_inventory 
  SET quantity = quantity - 1
  WHERE user_id = p_user_id AND item_sku = p_item_sku;
  
  -- Remove from inventory if quantity reaches 0
  DELETE FROM user_inventory 
  WHERE user_id = p_user_id AND item_sku = p_item_sku AND quantity <= 0;
  
  RETURN jsonb_build_object(
    'success', true,
    'usage_id', usage_id,
    'item_name', item_record.name,
    'expires_at', expiry_time,
    'duration_hours', EXTRACT(EPOCH FROM (expiry_time - NOW())) / 3600
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_power_up(p_user_id uuid, p_item_sku text, p_challenge_id uuid DEFAULT NULL::uuid, p_duration_hours integer DEFAULT 24)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  item_cost INTEGER;
  user_balance INTEGER;
BEGIN
  -- Get item cost and user balance
  SELECT cost INTO item_cost FROM shop_items WHERE sku = p_item_sku;
  SELECT momenta_balance INTO user_balance FROM users WHERE id = p_user_id;
  
  -- Check if user can afford and owns the item
  IF user_balance < item_cost THEN
    RAISE EXCEPTION 'Insufficient momenta balance. Need % but have %', item_cost, user_balance;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM item_purchases 
    WHERE user_id = p_user_id AND item_id = (SELECT id FROM shop_items WHERE sku = p_item_sku)
  ) THEN
    RAISE EXCEPTION 'User does not own this power-up';
  END IF;
  
  -- Deduct cost and activate power-up
  UPDATE users 
  SET momenta_balance = momenta_balance - item_cost
  WHERE id = p_user_id;
  
  -- Record power-up usage
  INSERT INTO power_up_usage (user_id, item_sku, challenge_id, expires_at)
  VALUES (p_user_id, p_item_sku, p_challenge_id, NOW() + INTERVAL '1 hour' * p_duration_hours);
  
  -- Log transaction
  INSERT INTO momenta_transactions (user_id, amount, reason, transaction_type, description)
  VALUES (p_user_id, -item_cost, 'power_up_activation', 'debit', 'Activated ' || p_item_sku);
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_momenta_currency(target_user_id uuid, currency_amount integer, reason_text text DEFAULT 'Admin credit'::text, transaction_type_input text DEFAULT 'admin'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Insert transaction record
  INSERT INTO momenta_transactions (
    user_id, 
    amount, 
    reason, 
    transaction_type, 
    description
  )
  VALUES (
    target_user_id,
    currency_amount,
    reason_text,
    transaction_type_input,
    'Manual currency addition: ' || currency_amount || ' momenta'
  );
  
  -- Update user's total momenta balance
  UPDATE users
  SET 
    momenta_balance = COALESCE(momenta_balance, 0) + currency_amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_user_has_referral_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Only generate if the user doesn't have a referral code yet
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_user_referral_code();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_momenta(p_user_id uuid, p_base_amount integer, p_reason text, p_reference_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  multiplier DECIMAL := 1.0;
  final_amount INTEGER;
  has_double_momenta BOOLEAN := false;
  result jsonb;
BEGIN
  -- Check for active double momenta power-up
  SELECT EXISTS(
    SELECT 1 FROM power_up_usage
    WHERE user_id = p_user_id
    AND item_sku = 'double_momenta_1'
    AND expires_at > NOW()
  ) INTO has_double_momenta;
  
  IF has_double_momenta THEN
    multiplier := 2.0;
    
    -- Consume the double momenta power-up
    UPDATE power_up_usage
    SET expires_at = NOW()
    WHERE user_id = p_user_id
    AND item_sku = 'double_momenta_1'
    AND expires_at > NOW();
  END IF;
  
  final_amount := (p_base_amount * multiplier)::INTEGER;
  
  -- Award the momenta
  UPDATE users 
  SET momenta_balance = momenta_balance + final_amount
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO momenta_transactions (
    user_id, amount, reason, transaction_type, description, reference_id
  )
  VALUES (
    p_user_id, 
    final_amount, 
    p_reason, 
    'credit', 
    CASE 
      WHEN has_double_momenta THEN p_reason || ' (2x multiplier applied)'
      ELSE p_reason
    END,
    p_reference_id
  );
  
  result := jsonb_build_object(
    'base_amount', p_base_amount,
    'multiplier', multiplier,
    'final_amount', final_amount,
    'double_momenta_applied', has_double_momenta,
    'new_balance', (SELECT momenta_balance FROM users WHERE id = p_user_id)
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_challenge_deadline(p_challenge_id uuid, p_check_time timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  challenge_record RECORD;
  utc_check_time TIMESTAMP WITH TIME ZONE;
  result jsonb;
BEGIN
  -- Always work in UTC
  utc_check_time := p_check_time AT TIME ZONE 'UTC';
  
  -- Get challenge details
  SELECT id, title, end_date, status
  INTO challenge_record
  FROM challenges 
  WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'error', 'Challenge not found',
      'challenge_id', p_challenge_id
    );
  END IF;
  
  -- Convert end_date to UTC for comparison
  result := jsonb_build_object(
    'challenge_id', p_challenge_id,
    'challenge_title', challenge_record.title,
    'end_date_utc', (challenge_record.end_date AT TIME ZONE 'UTC'),
    'check_time_utc', utc_check_time,
    'is_active', challenge_record.status = 'active',
    'is_expired', (challenge_record.end_date AT TIME ZONE 'UTC') < utc_check_time,
    'time_remaining_hours', 
    CASE 
      WHEN (challenge_record.end_date AT TIME ZONE 'UTC') > utc_check_time THEN
        EXTRACT(EPOCH FROM ((challenge_record.end_date AT TIME ZONE 'UTC') - utc_check_time)) / 3600
      ELSE 0
    END
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_group_with_streak_rules(p_owner_id uuid, p_name text, p_description text DEFAULT ''::text, p_streak_goal integer DEFAULT 30, p_min_participation_rate numeric DEFAULT 0.8, p_failure_threshold_days integer DEFAULT 3, p_notify_on_member_miss boolean DEFAULT true, p_daily_summaries boolean DEFAULT true, p_privacy_level text DEFAULT 'members_only'::text, p_allow_recovery boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  new_group_id UUID;
BEGIN
  -- Validate user input ranges
  IF p_streak_goal < 7 OR p_streak_goal > 365 THEN
    RAISE EXCEPTION 'Streak goal must be between 7 and 365 days';
  END IF;
  
  IF p_min_participation_rate < 0.5 OR p_min_participation_rate > 1.0 THEN
    RAISE EXCEPTION 'Participation rate must be between 50%% and 100%%';
  END IF;
  
  IF p_failure_threshold_days < 1 OR p_failure_threshold_days > 7 THEN
    RAISE EXCEPTION 'Failure threshold must be between 1 and 7 days';
  END IF;
  
  IF p_privacy_level NOT IN ('public', 'members_only', 'private') THEN
    RAISE EXCEPTION 'Privacy level must be public, members_only, or private';
  END IF;
  
  -- Create the group with enhanced settings
  INSERT INTO groups (
    owner_id, name, description, streak_goal, min_participation_rate, 
    failure_threshold_days, notify_on_member_miss, daily_summaries,
    privacy_level, allow_recovery, status
  )
  VALUES (
    p_owner_id, p_name, p_description, p_streak_goal, p_min_participation_rate, 
    p_failure_threshold_days, p_notify_on_member_miss, p_daily_summaries,
    p_privacy_level, p_allow_recovery, 'active'
  )
  RETURNING id INTO new_group_id;
  
  -- Add owner as first member using ON CONFLICT to handle duplicates gracefully
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (new_group_id, p_owner_id, 'owner')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  
  -- Set up initial group streak tracking using ON CONFLICT to handle duplicates
  INSERT INTO group_streak_tracking (group_id, current_streak, last_success_date)
  VALUES (new_group_id, 0, CURRENT_DATE)
  ON CONFLICT (group_id) DO NOTHING;
  
  -- Create default notification preferences for owner using ON CONFLICT
  INSERT INTO user_notification_preferences (user_id)
  VALUES (p_owner_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Return just the group ID for consistency with existing code
  RETURN new_group_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_challenge_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' || 
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.verification_description, '')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_user_member(p_group_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
select exists (
  select 1 from public.group_members gm
  where gm.group_id = p_group_id and gm.user_id = p_user_id
);
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_uuid(input_text text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Check if the input matches the UUID pattern
  RETURN input_text ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$';
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.force_expire_challenge(p_challenge_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  UPDATE challenges 
  SET status = 'expired', 
      end_date = CURRENT_TIMESTAMP - INTERVAL '1 hour'
  WHERE id = p_challenge_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  current_date_val DATE := CURRENT_DATE;
  last_activity DATE;
  current_streak_val INTEGER;
  longest_streak_val INTEGER;
  result json;
BEGIN
  -- Get user's current streak data
  SELECT last_activity_date, current_streak, longest_streak
  INTO last_activity, current_streak_val, longest_streak_val
  FROM users
  WHERE id = user_uuid;
  
  -- If no previous activity or more than 1 day gap, reset streak
  IF last_activity IS NULL OR (current_date_val - last_activity) > 1 THEN
    current_streak_val := 1;
  -- If last activity was yesterday, increment streak
  ELSIF (current_date_val - last_activity) = 1 THEN
    current_streak_val := current_streak_val + 1;
  -- If last activity was today, no change
  ELSE
    -- No change needed
    NULL;
  END IF;
  
  -- Update longest streak if current is longer
  IF current_streak_val > longest_streak_val THEN
    longest_streak_val := current_streak_val;
  END IF;
  
  -- Update user record
  UPDATE users 
  SET 
    current_streak = current_streak_val,
    longest_streak = longest_streak_val,
    last_activity_date = current_date_val
  WHERE id = user_uuid;
  
  -- Return result
  result := json_build_object(
    'current_streak', current_streak_val,
    'longest_streak', longest_streak_val,
    'last_activity_date', current_date_val
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_auth_user()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
  DELETE FROM auth.users WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.gradecalc_user_state_touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_server_time()
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select now(); $function$;

CREATE OR REPLACE FUNCTION public.gradecalc_award_on_contribution_accept()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
begin
  if (tg_op = 'UPDATE') then
    if (old.status is distinct from new.status) and new.status = 'accepted' then
      insert into public.gradecalc_rewards_ledger (user_id, delta_days, reason, source_contribution_id)
      values (new.user_id, 3, 'Contribution accepted', new.id)
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.gradecalc_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.anonymize_current_user()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
DECLARE
  uid uuid := auth.uid();
  anon_name text := 'deleted-user-' || substr(replace(uuid_generate_v4()::text, '-', ''), 1, 12);
BEGIN
  -- Guard: only run when authenticated
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  -- Scrub personally identifiable data on public.users
  UPDATE public.users
    SET username = anon_name,
        email = anon_name || '@deleted.local',
        avatar_url = NULL,
        bio = NULL,
        updated_at = NOW()
  WHERE id = uid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_expired_groups()
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select; $function$;

CREATE OR REPLACE FUNCTION public.archive_failed_group(p_group_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_group_status text;
  v_is_owner boolean;
BEGIN
  -- Check group status and ownership
  SELECT 
    status,
    owner_id = p_user_id
  INTO v_group_status, v_is_owner
  FROM groups
  WHERE id = p_group_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'group_not_found'
    );
  END IF;
  
  -- Only failed groups can be archived
  IF v_group_status != 'failed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'group_not_failed',
      'current_status', v_group_status
    );
  END IF;
  
  -- Only owner or members can archive
  IF NOT v_is_owner THEN
    -- Check if user is a member
    IF NOT EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = p_group_id AND user_id = p_user_id
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'not_authorized'
      );
    END IF;
  END IF;
  
  -- Mark as archived
  UPDATE groups
  SET 
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = p_group_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'archived_at', NOW()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.archive_completed_challenges()
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select jsonb_build_object('success', true, 'archived_count', 0); $function$;

CREATE OR REPLACE FUNCTION public.check_power_up_inventory_for_sku(p_user_id uuid, p_item_sku text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select jsonb_build_object('owned', false, 'remaining', 0); $function$;

CREATE OR REPLACE FUNCTION public.delete_my_account()
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select jsonb_build_object('success', true); $function$;

CREATE OR REPLACE FUNCTION public.get_challenge_completion_percentage(challenge_id_param uuid, user_id_param uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$ select jsonb_build_object('total_submissions',0,'approved_submissions',0,'completion_percentage',0); $function$;

CREATE OR REPLACE FUNCTION public.get_create_group_cost()
 RETURNS integer
 LANGUAGE sql
 SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
  SELECT COALESCE(
    (SELECT ((value::jsonb)->>'create_group')::integer
     FROM system_config
     WHERE key = 'economy_costs_json'
     ORDER BY updated_at DESC
     LIMIT 1),
    50
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_search_suggestions(partial_query text, limit_count integer DEFAULT 5)
 RETURNS TABLE(suggestion text, popularity_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sa.query as suggestion,
    (COUNT(*) * AVG(sa.result_count)) as popularity_score
  FROM search_analytics sa
  WHERE sa.query ILIKE '%' || partial_query || '%'
    AND sa.created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY sa.query
  ORDER BY popularity_score DESC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_group_risk_data(p_group_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'group_id', status.group_id,
    'risk_level',
      case
        when status.group_at_risk then 'at_risk'
        else 'safe'
      end,
    'total_members', status.total_members,
    'submitted_today', status.submitted_today,
    'pending_submissions', status.pending_submissions,
    'pending_reviews', status.pending_reviews,
    'end_of_day_utc', status.end_of_day_utc,
    'seconds_remaining', status.seconds_remaining,
    'misses_to_break_streak', status.misses_to_break_streak
  )
  from public.get_group_daily_status(p_group_id) as status;
$function$;

CREATE OR REPLACE FUNCTION public.quota_status(p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := coalesce(p_user_id, auth.uid());
  v_month_start timestamptz := date_trunc('month', now());
  v_groups_month integer;
  v_challenges_month integer;
begin
  if auth.uid() is null or auth.uid() <> v_user_id then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select count(*)::integer
  into v_groups_month
  from public.teams team
  where team.owner_id = v_user_id
    and team.created_at >= v_month_start;

  select count(*)::integer
  into v_challenges_month
  from public.challenges challenge
  where challenge.creator_id = v_user_id
    and challenge.created_at >= v_month_start;

  return jsonb_build_object(
    'user_id', v_user_id,
    'is_pro', public.user_is_pro(v_user_id),
    'active_memberships', private.economy_active_group_count_v1(v_user_id),
    'active_promises', private.economy_active_promise_count_v1(v_user_id),
    'groups_created_this_month', coalesce(v_groups_month, 0),
    'challenges_created_this_month', coalesce(v_challenges_month, 0),
    'limits', jsonb_build_object(
      'max_active_groups', 2,
      'max_groups_per_month', 2,
      'max_challenges_per_month', 4,
      'max_active_promises', 2
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.search_groups(query_text text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, name text, description text, privacy text, member_count bigint, current_streak integer, created_at timestamp with time zone, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.description,
    g.privacy,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
    g.current_streak,
    g.created_at,
    ts_rank(g.search_vector, plainto_tsquery('english', query_text)) as rank
  FROM groups g
  WHERE g.search_vector @@ plainto_tsquery('english', query_text)
    AND g.privacy IN ('public', 'members_only')
    AND g.status = 'active'
  ORDER BY rank DESC, g.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_challenges(query_text text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, title character varying, description text, category character varying, difficulty text, points_value integer, created_at timestamp with time zone, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.category,
    c.difficulty,
    c.points_value,
    c.created_at,
    ts_rank(c.search_vector, plainto_tsquery('english', query_text)) as rank
  FROM challenges c
  WHERE c.search_vector @@ plainto_tsquery('english', query_text)
    AND c.is_public = true
    AND c.status = 'active'
  ORDER BY rank DESC, c.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_power_up(target_user_id uuid, power_up_sku text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  item_id_var uuid;
  item_cost integer;
BEGIN
  -- Get the power-up item details
  SELECT id, cost INTO item_id_var, item_cost
  FROM shop_items
  WHERE sku = power_up_sku AND category = 'power-up'
  LIMIT 1;
  
  IF item_id_var IS NULL THEN
    RAISE EXCEPTION 'Power-up not found: %', power_up_sku;
  END IF;
  
  -- Record the purchase
  INSERT INTO item_purchases (user_id, item_id)
  VALUES (target_user_id, item_id_var);
  
  -- Deduct cost from user's balance
  UPDATE users
  SET momenta_balance = GREATEST(0, COALESCE(momenta_balance, 0) - item_cost)
  WHERE id = target_user_id;
  
  -- Record transaction
  INSERT INTO momenta_transactions (
    user_id, 
    amount, 
    reason, 
    transaction_type, 
    reference_id
  )
  VALUES (
    target_user_id,
    -item_cost,
    'Power-up activation: ' || power_up_sku,
    'purchase',
    item_id_var
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_group_creator_as_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Insert the group creator as an owner member
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_group_shield(p_user_id uuid, p_group_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Check inventory
  IF NOT EXISTS (
    SELECT 1 FROM user_inventory 
    WHERE user_id = p_user_id 
    AND item_sku = 'group_shield' 
    AND quantity > 0
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No group shield power-ups available'
    );
  END IF;

  -- Check if user is in the group
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE user_id = p_user_id 
    AND group_id = p_group_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You are not a member of this group'
    );
  END IF;

  -- Apply shield to all group challenges
  INSERT INTO power_up_usage (user_id, item_sku, challenge_id, expires_at)
  SELECT p_user_id, 'group_shield', gc.challenge_id, now() + interval '24 hours'
  FROM group_challenges gc
  WHERE gc.group_id = p_group_id;

  -- Decrement inventory
  UPDATE user_inventory
  SET quantity = quantity - 1
  WHERE user_id = p_user_id 
  AND item_sku = 'group_shield';

  RETURN jsonb_build_object(
    'success', true,
    'protected_challenges', (
      SELECT count(*) FROM group_challenges WHERE group_id = p_group_id
    ),
    'expires_at', now() + interval '24 hours'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_points_with_multipliers(p_user_id uuid, p_challenge_id uuid, p_base_points integer)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_multiplier NUMERIC := 1.0;
BEGIN
  -- Check for active double points
  IF EXISTS (
    SELECT 1 FROM power_up_usage
    WHERE user_id = p_user_id
    AND challenge_id = p_challenge_id
    AND item_sku = 'double_points'
    AND is_active = true
    AND expires_at > now()
  ) THEN
    v_multiplier := 2.0;
  END IF;

  RETURN floor(p_base_points * v_multiplier);
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_streak_freeze(p_user_id uuid, p_challenge_id uuid, p_duration_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- Check if user has streak_freeze power-up
  IF NOT EXISTS (
    SELECT 1 FROM user_inventory 
    WHERE user_id = p_user_id 
    AND item_sku = 'streak_freeze' 
    AND quantity > 0
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No streak freeze power-ups available'
    );
  END IF;

  -- Check if freeze is already active
  IF EXISTS (
    SELECT 1 FROM user_challenges
    WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id
    AND streak_freeze_active = true
    AND streak_freeze_expires_at > now()
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Streak freeze is already active'
    );
  END IF;

  -- Apply the freeze
  UPDATE user_challenges
  SET streak_freeze_active = true,
      streak_freeze_expires_at = now() + (p_duration_hours || ' hours')::interval
  WHERE user_id = p_user_id 
  AND challenge_id = p_challenge_id;

  -- Decrement inventory
  UPDATE user_inventory
  SET quantity = quantity - 1
  WHERE user_id = p_user_id 
  AND item_sku = 'streak_freeze';

  -- Record usage
  INSERT INTO power_up_usage (user_id, item_sku, challenge_id, expires_at)
  VALUES (p_user_id, 'streak_freeze', p_challenge_id, now() + (p_duration_hours || ' hours')::interval);

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', now() + (p_duration_hours || ' hours')::interval
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_email_approved(p_email text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.beta_waitlist
    where lower(email) = lower(p_email) and approved = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.award_momenta_for_verified_issue()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Only award momenta if the issue was just verified (verified changed from false to true)
  IF OLD.verified = false AND NEW.verified = true THEN
    -- Award 50 momenta for verified issue
    PERFORM award_momenta(NEW.user_id, 50, 'Issue verification reward', NEW.id);
    
    -- Update verified_at timestamp
    NEW.verified_at := NOW();
    NEW.verified_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.force_reviewer_onboarding_false()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if lower(new.email) = lower('apple-reviewer@testing.example') then
    new.has_completed_onboarding := false;
    new.onboarded_at := null;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_user_session()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Update last activity but don't block logout
  UPDATE public.users 
  SET last_activity_date = CURRENT_DATE
  WHERE id = auth.uid();
  
  -- No exceptions should be thrown that could block logout
  RETURN;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't block logout
    RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_user_session(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    -- Mark notifications as read to reduce clutter
    UPDATE public.notifications 
    SET is_read = true 
    WHERE user_id = user_uuid AND is_read = false;
    
    -- Could add other cleanup logic here
END;
$function$;

CREATE OR REPLACE FUNCTION public.daily_group_processing()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Update group streaks based on member activity
  UPDATE groups
  SET 
    current_streak = CASE 
      WHEN EXISTS (
        SELECT 1 FROM group_members gm
        JOIN user_challenges uc ON uc.user_id = gm.user_id
        WHERE gm.group_id = groups.id
        AND uc.last_check_in = CURRENT_DATE
      ) THEN current_streak + 1
      ELSE 0
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE status = 'active';
END;
$function$;

CREATE OR REPLACE FUNCTION public.extend_challenge_duration(p_challenge_id uuid, p_user_id uuid, p_additional_days integer DEFAULT 7)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  challenge_creator_id uuid;
  challenge_title text;
  has_end_date boolean;
  has_extension_count boolean;
  has_max_extensions boolean;
  has_completion_status boolean;
  base_end_date date;
  current_extension_count integer := 0;
  max_extensions_value integer := 2;
  new_end_date date;
  participants_notified integer := 0;
  update_sql text;
BEGIN
  IF p_challenge_id IS NULL OR p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Missing required parameters');
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  IF p_additional_days IS NULL OR p_additional_days <= 0 OR p_additional_days > 90 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid extension window');
  END IF;

  SELECT c.creator_id, c.title
  INTO challenge_creator_id, challenge_title
  FROM public.challenges c
  WHERE c.id = p_challenge_id
  LIMIT 1;

  IF challenge_creator_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Challenge not found');
  END IF;

  IF challenge_creator_id <> p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Only challenge creator can extend duration');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'challenges'
      AND column_name = 'end_date'
  )
  INTO has_end_date;

  IF NOT has_end_date THEN
    RETURN json_build_object(
      'success', false,
      'error', 'CHALLENGE_EXTENSION_UNSUPPORTED'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'challenges'
      AND column_name = 'extension_count'
  )
  INTO has_extension_count;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'challenges'
      AND column_name = 'max_extensions'
  )
  INTO has_max_extensions;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'challenges'
      AND column_name = 'completion_status'
  )
  INTO has_completion_status;

  IF has_extension_count THEN
    EXECUTE
      'SELECT COALESCE(extension_count, 0) FROM public.challenges WHERE id = $1'
    INTO current_extension_count
    USING p_challenge_id;
  END IF;

  IF has_max_extensions THEN
    EXECUTE
      'SELECT COALESCE(max_extensions, 2) FROM public.challenges WHERE id = $1'
    INTO max_extensions_value
    USING p_challenge_id;
  END IF;

  IF current_extension_count >= max_extensions_value THEN
    RETURN json_build_object('success', false, 'error', 'Maximum extensions reached');
  END IF;

  EXECUTE
    'SELECT COALESCE(end_date::date, current_date) FROM public.challenges WHERE id = $1'
  INTO base_end_date
  USING p_challenge_id;

  new_end_date := base_end_date + p_additional_days;

  update_sql := 'UPDATE public.challenges SET end_date = $2, status = ''active'', updated_at = now()';
  IF has_extension_count THEN
    update_sql := update_sql || ', extension_count = COALESCE(extension_count, 0) + 1';
  END IF;
  IF has_completion_status THEN
    update_sql := update_sql || ', completion_status = ''active''';
  END IF;
  update_sql := update_sql || ' WHERE id = $1';

  EXECUTE update_sql USING p_challenge_id, new_end_date;

  INSERT INTO public.notifications (
    user_id,
    notification_type,
    title,
    body,
    payload,
    priority,
    created_at
  )
  SELECT
    cp.user_id,
    'challenge_extended',
    'Challenge extended',
    COALESCE(challenge_title, 'Your challenge') || ' was extended by ' || p_additional_days || ' days.',
    jsonb_build_object(
      'type', 'challenge_extended',
      'challenge_id', p_challenge_id,
      'additional_days', p_additional_days,
      'new_end_date', new_end_date
    ),
    3,
    now()
  FROM public.challenge_participants cp
  WHERE cp.challenge_id = p_challenge_id
    AND cp.user_id <> p_user_id;

  GET DIAGNOSTICS participants_notified = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'new_end_date', new_end_date,
    'extensions_remaining', GREATEST(max_extensions_value - (current_extension_count + 1), 0),
    'participants_notified', participants_notified
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_submit_reminders_due()
 RETURNS TABLE(user_id uuid, username text, challenge_id text, challenge_title text, reminder_kind text, idempotency_key text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with valid_timezones as materialized (
    select array_agg(name) as names from pg_timezone_names
  ),
  active_challenges as (
    select cp.user_id, coalesce(p.username, 'member') as username,
      c.id as challenge_id, c.title as challenge_title,
      exists (select 1 from public.team_challenges tc where tc.challenge_id = c.id) as is_group_challenge,
      case when nullif(c.streak_timezone, '') = any(valid_timezones.names) then nullif(c.streak_timezone, '') end as challenge_tz,
      coalesce(np.preferred_reminder_time, '20:00:00'::time) as preferred_reminder_time,
      case when nullif(np.timezone, '') = any(valid_timezones.names) then nullif(np.timezone, '') end as pref_tz
    from public.challenge_participants cp
    join public.challenges c on c.id = cp.challenge_id and c.status = 'active'
    left join public.profiles p on p.id = cp.user_id
    left join public.notification_preferences np on np.user_id = cp.user_id
    cross join valid_timezones
    where coalesce(cp.status, 'active') = 'active'
      and (c.start_date is null or c.start_date <= now())
      and (c.end_date is null or c.end_date > now())
      and coalesce(np.push_enabled, true)
      and coalesce(np.challenge_reminders, true)
  ),
  resolved as (
    select active_challenges.*,
      case when active_challenges.is_group_challenge
        then coalesce(active_challenges.challenge_tz, active_challenges.pref_tz, 'UTC')
        else coalesce(active_challenges.pref_tz, active_challenges.challenge_tz, 'UTC')
      end as effective_tz
    from active_challenges
  ),
  due_clock as (
    select resolved.*,
      (now() at time zone resolved.effective_tz)::date as user_local_day,
      (now() at time zone resolved.effective_tz)::time as user_local_time,
      (time '00:00' + make_interval(secs => least(extract(epoch from resolved.preferred_reminder_time)::integer + 10800, 84600)))::time as rescue_time
    from resolved
    where not exists (
      select 1 from public.challenge_submissions submission
      where submission.challenge_id = resolved.challenge_id
        and submission.user_id = resolved.user_id
        and submission.local_day = (now() at time zone resolved.effective_tz)::date
    )
  ),
  reminders as (
    select due_clock.*, 'primary'::text as reminder_kind
    from due_clock
    where due_clock.user_local_time >= due_clock.preferred_reminder_time
      and due_clock.user_local_time < due_clock.rescue_time
    union all
    select due_clock.*, 'rescue'::text as reminder_kind
    from due_clock
    where due_clock.user_local_time >= due_clock.rescue_time
  )
  select reminder.user_id, reminder.username, reminder.challenge_id::text,
    reminder.challenge_title::text, reminder.reminder_kind,
    format('streak:%s:%s:%s:%s', reminder.user_id::text, reminder.challenge_id::text, reminder.user_local_day::text, reminder.reminder_kind)
  from reminders reminder
  where not exists (
    select 1 from public.notification_jobs job
    where job.idempotency_key = format('streak:%s:%s:%s:%s', reminder.user_id::text, reminder.challenge_id::text, reminder.user_local_day::text, reminder.reminder_kind)
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_submitted_today(params jsonb)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_submitted_today(
    coalesce((params->>'p_challenge_id')::uuid, (params->>'challenge_id_param')::uuid),
    coalesce((params->>'p_user_id')::uuid, (params->>'user_id_param')::uuid),
    coalesce(params->>'p_tz', params->>'timezone')
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_active_power_ups(p_user_id uuid)
 RETURNS TABLE(item_sku text, challenge_id uuid, expires_at timestamp with time zone, challenge_name text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT 
    pu.item_sku,
    pu.challenge_id,
    pu.expires_at,
    c.title as challenge_name
  FROM power_up_usage pu
  LEFT JOIN challenges c ON c.id = pu.challenge_id
  WHERE pu.user_id = p_user_id
  AND pu.is_active = true
  AND pu.expires_at > now()
  ORDER BY pu.expires_at;
$function$;

CREATE OR REPLACE FUNCTION public.force_challenge_completion(p_challenge_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  UPDATE challenges 
  SET status = 'completed'
  WHERE id = p_challenge_id;
  
  INSERT INTO momenta_transactions (user_id, amount, reason, transaction_type, reference_id, description)
  SELECT 
    uc.user_id,
    public.calculate_challenge_completion_reward(p_challenge_id) AS amount,
    'Challenge completion bonus',
    'reward',
    p_challenge_id,
    'Bonus for completing challenge: ' || c.title
  FROM user_challenges uc
  JOIN challenges c ON c.id = p_challenge_id
  WHERE public.get_challenge_completion_percentage(p_challenge_id, uc.user_id) >= 100
    AND NOT EXISTS (
      SELECT 1 FROM momenta_transactions mt 
      WHERE mt.user_id = uc.user_id 
        AND mt.reference_id = p_challenge_id 
        AND mt.transaction_type = 'reward'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.force_group_streak_failure(p_group_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Reset group streak (if we had group streak tracking)
  -- For now, reset all group member streaks
  UPDATE user_challenges 
  SET current_streak = 0
  WHERE user_id IN (
    SELECT user_id FROM group_members WHERE group_id = p_group_id
  );
  
  -- Create notification for group streak failure
  INSERT INTO notifications (user_id, payload)
  SELECT 
    gm.user_id,
    jsonb_build_object(
      'type', 'group_streak_lost',
      'group_id', p_group_id,
      'message', 'Your group streak has been reset due to low participation',
      'created_at', CURRENT_TIMESTAMP
    )
  FROM group_members gm
  WHERE gm.group_id = p_group_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_user_referral_code()
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_referral_code text;
begin
  select generated.referral_code
  into v_referral_code
  from public.get_or_create_my_referral_code() generated;

  return v_referral_code::character varying;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_challenge_status_summary(p_challenge_id uuid)
 RETURNS TABLE(challenge_title text, status text, total_participants integer, total_submissions integer, approved_submissions integer, pending_submissions integer, rejected_submissions integer, participation_rate numeric, days_remaining integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.title,
    c.status,
    (SELECT COUNT(*) FROM user_challenges WHERE challenge_id = p_challenge_id)::integer,
    (SELECT COUNT(*) FROM challenge_verifications WHERE challenge_id = p_challenge_id)::integer,
    (SELECT COUNT(*) FROM challenge_verifications WHERE challenge_id = p_challenge_id AND status = 'approved')::integer,
    (SELECT COUNT(*) FROM challenge_verifications WHERE challenge_id = p_challenge_id AND status = 'pending')::integer,
    (SELECT COUNT(*) FROM challenge_verifications WHERE challenge_id = p_challenge_id AND status = 'rejected')::integer,
    CASE 
      WHEN (SELECT COUNT(*) FROM user_challenges WHERE challenge_id = p_challenge_id) > 0
      THEN (SELECT COUNT(DISTINCT user_id)::decimal FROM challenge_verifications WHERE challenge_id = p_challenge_id) 
           / (SELECT COUNT(*)::decimal FROM user_challenges WHERE challenge_id = p_challenge_id)
      ELSE 0
    END,
    GREATEST(0, (EXTRACT(epoch FROM c.end_date - CURRENT_TIMESTAMP) / 86400)::integer)
  FROM challenges c
  WHERE c.id = p_challenge_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_cron_job_status()
 RETURNS TABLE(jobname text, schedule text, active boolean, last_run timestamp with time zone, next_run timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobname::TEXT,
    j.schedule::TEXT,
    j.active,
    j.last_run,
    j.next_run
  FROM cron.job j
  WHERE j.jobname IN ('daily-maintenance-job', 'hourly-notification-processing');
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_challenge_with_payment(p_user_id uuid, p_title text, p_description text, p_category text, p_duration integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_is_public boolean, p_difficulty text, p_points integer, p_verification_type text, p_verification_frequency text, p_verification_description text, p_submission_text text, p_allow_extensions boolean, p_max_extensions integer, p_deadline_type text, p_allow_self_review boolean, p_group_id uuid, p_cost integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  new_challenge_id uuid;
  balance integer;
  effective_cost integer;
  effective_duration integer;
  effective_difficulty text;
  effective_deadline_type text;
  effective_allow_self_review boolean;
  start_at timestamptz;
  end_at timestamptz;
  is_group_member boolean;
  new_balance integer;
  effective_tz text;
  quota_error text;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'USER_REQUIRED');
  end if;

  if auth.uid() is null or auth.uid() <> p_user_id then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  if coalesce(trim(p_title), '') = '' then
    return jsonb_build_object('success', false, 'error', 'CHALLENGE_TITLE_REQUIRED');
  end if;

  select coalesce(momenta_balance, 0)
  into balance
  from public.profiles
  where id = p_user_id
  for update;

  if balance is null then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  quota_error := private.economy_quota_error_v1(p_user_id, 'create_challenge');
  if quota_error is not null then
    return jsonb_build_object('success', false, 'error', quota_error);
  end if;

  effective_cost := private.economy_action_cost_v1(p_user_id, 'create_challenge');

  if balance < effective_cost then
    return jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE');
  end if;

  select nullif(np.timezone, '')
  into effective_tz
  from public.notification_preferences np
  where np.user_id = p_user_id
  limit 1;

  if effective_tz is null
    or not exists (select 1 from pg_timezone_names where name = effective_tz)
  then
    effective_tz := 'UTC';
  end if;

  effective_duration := least(365, greatest(coalesce(p_duration, 30), 1));
  effective_difficulty := case
    when p_difficulty in ('easy', 'medium', 'hard') then p_difficulty
    else 'medium'
  end;
  effective_deadline_type := case
    when p_deadline_type in ('fixed', 'flexible', 'rolling') then p_deadline_type
    else 'fixed'
  end;
  effective_allow_self_review := coalesce(p_allow_self_review, false);

  start_at := coalesce(p_start_date, now());
  end_at := coalesce(
    p_end_date,
    start_at + make_interval(days => effective_duration)
  );

  if p_group_id is not null then
    select exists (
      select 1
      from public.team_members tm
      where tm.group_id = p_group_id
        and tm.user_id = p_user_id
    )
    into is_group_member;

    if not is_group_member then
      return jsonb_build_object('success', false, 'error', 'GROUP_ACCESS_DENIED');
    end if;
  end if;

  insert into public.challenges(
    creator_id,
    title,
    description,
    category,
    start_date,
    end_date,
    duration,
    is_public,
    verification_type,
    verification_frequency,
    verification_description,
    submission_text,
    difficulty,
    points_value,
    allow_extensions,
    max_extensions,
    deadline_type,
    allow_self_review,
    submission_expectations,
    streak_timezone,
    status
  )
  values (
    p_user_id,
    p_title,
    p_description,
    p_category,
    start_at,
    end_at,
    effective_duration,
    coalesce(p_is_public, true),
    p_verification_type,
    p_verification_frequency,
    p_verification_description,
    p_submission_text,
    effective_difficulty,
    coalesce(p_points, 200),
    coalesce(p_allow_extensions, true),
    greatest(coalesce(p_max_extensions, 2), 0),
    effective_deadline_type,
    effective_allow_self_review,
    jsonb_build_object(
      'required_daily_submissions', 1,
      'requires_peer_review', not effective_allow_self_review,
      'reviewers_required', case when effective_allow_self_review then 0 else 1 end,
      'daily_deadline_hour_utc', 23,
      'grace_minutes', 0
    ),
    effective_tz,
    'active'
  )
  returning id into new_challenge_id;

  insert into public.challenge_participants(challenge_id, user_id, status)
  values (new_challenge_id, p_user_id, 'active')
  on conflict (challenge_id, user_id) do nothing;

  if p_group_id is not null then
    insert into public.team_challenges(group_id, challenge_id)
    values (p_group_id, new_challenge_id)
    on conflict (group_id, challenge_id) do nothing;
  end if;

  if effective_cost > 0 then
    perform public.add_momenta_transaction(
      p_user_id,
      -effective_cost,
      'Challenge creation',
      'spent',
      new_challenge_id
    );
  end if;

  select coalesce(momenta_balance, 0)
  into new_balance
  from public.profiles
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'challenge_id', new_challenge_id,
    'new_balance', coalesce(new_balance, 0),
    'cost', effective_cost
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_streak_freeze_sku(p_item_sku text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select lower(coalesce(p_item_sku, '')) = any (
    array[
      'streak_freeze',
      'streak_freeze_1',
      'streak_freeze_basic',
      'power_freeze_1'
    ]
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_popular_search_terms(days_back integer DEFAULT 7, limit_count integer DEFAULT 10)
 RETURNS TABLE(query text, search_count bigint, avg_result_count numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sa.query,
    COUNT(*) as search_count,
    ROUND(AVG(sa.result_count), 2) as avg_result_count
  FROM search_analytics sa
  WHERE sa.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY sa.query
  ORDER BY search_count DESC, avg_result_count DESC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_last_maintenance_run()
 RETURNS TABLE(run_timestamp timestamp with time zone, status text, details jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT run_timestamp, status, details
  FROM maintenance_runs
  ORDER BY run_timestamp DESC
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.daily_maintenance()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  reset_count INTEGER;
  expired_challenges INTEGER;
  result jsonb;
BEGIN
  -- Reset missed streaks
  SELECT COUNT(*) INTO reset_count FROM reset_missed_streaks();
  
  -- Update global user streaks
  PERFORM update_global_user_streaks();
  
  -- Process expired challenges
  SELECT COUNT(*) INTO expired_challenges 
  FROM challenges 
  WHERE end_date < NOW() AND status = 'active';
  
  PERFORM process_expired_challenges();
  
  -- Clean up old notifications (keep last 30 days)
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up expired power-ups
  DELETE FROM power_up_usage 
  WHERE expires_at < NOW();
  
  -- Return summary
  result := jsonb_build_object(
    'streaks_reset', reset_count,
    'challenges_completed', expired_challenges,
    'timestamp', NOW(),
    'status', 'success'
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_streak_freezes(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select coalesce(sum(quantity), 0)::integer
  from public.inventory_items
  where user_id = p_user_id
    and public.is_streak_freeze_sku(item_sku)
    and quantity > 0;
$function$;

CREATE OR REPLACE FUNCTION public.get_schedule_alignment_info(p_group_id uuid DEFAULT NULL::uuid, p_challenge_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(group_id uuid, group_name text, group_start_date date, group_end_date date, challenge_id uuid, challenge_title character varying, challenge_start_date timestamp with time zone, challenge_end_date timestamp with time zone, alignment_status text, warnings text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH group_info AS (
        SELECT
            g.id,
            g.name,
            g.start_date,
            (g.start_date + (g.duration_days || ' days')::interval)::date as calculated_end_date
        FROM public.groups g
        WHERE (p_group_id IS NULL OR g.id = p_group_id)
    ),
    challenge_info AS (
        SELECT
            c.id,
            c.title,
            CASE
                WHEN c.end_date IS NOT NULL THEN c.end_date
                WHEN c.start_date IS NOT NULL AND c.duration IS NOT NULL
                THEN c.start_date + (c.duration || ' days')::interval
                ELSE NULL
            END as calculated_end_date,
            c.start_date,
            gc.group_id
        FROM public.challenges c
        LEFT JOIN public.group_challenges gc ON gc.challenge_id = c.id
        WHERE (p_challenge_id IS NULL OR c.id = p_challenge_id)
    )
    SELECT
        gi.id as group_id,
        gi.name as group_name,
        gi.start_date as group_start_date,
        gi.calculated_end_date as group_end_date,
        ci.id as challenge_id,
        ci.title as challenge_title,
        ci.start_date as challenge_start_date,
        ci.calculated_end_date as challenge_end_date,
        CASE
            WHEN ci.start_date IS NULL OR ci.calculated_end_date IS NULL THEN 'incomplete'
            WHEN ci.start_date >= gi.start_date AND ci.calculated_end_date <= gi.calculated_end_date THEN 'aligned'
            WHEN ci.start_date < gi.start_date THEN 'challenge_starts_too_early'
            WHEN ci.calculated_end_date > gi.calculated_end_date THEN 'challenge_ends_too_late'
            ELSE 'misaligned'
        END as alignment_status,
        CASE
            WHEN ci.start_date IS NULL OR ci.calculated_end_date IS NULL THEN ARRAY['missing_dates']
            WHEN ci.start_date < gi.start_date THEN ARRAY['challenge_starts_before_group']
            WHEN ci.calculated_end_date > gi.calculated_end_date THEN ARRAY['challenge_ends_after_group']
            ELSE ARRAY[]::text[]
        END as warnings
    FROM group_info gi
    LEFT JOIN challenge_info ci ON ci.group_id = gi.id
    WHERE ci.id IS NOT NULL
    ORDER BY gi.id, ci.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_submitted_today(p_challenge_id uuid, p_user_id uuid, p_tz text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  effective_tz text;
  today_local date;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized to read submission status'
      using errcode = '42501';
  end if;

  effective_tz := public.get_effective_streak_timezone(p_user_id, p_challenge_id, p_tz);
  today_local := (now() at time zone effective_tz)::date;

  return exists (
    select 1
    from public.challenge_submissions cs
    where cs.challenge_id = p_challenge_id
      and cs.user_id = p_user_id
      and cs.local_day = today_local
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_todays_submission_status(p_challenge_id uuid, p_user_id uuid, p_tz text DEFAULT NULL::text)
 RETURNS TABLE(has_submitted boolean, submission_status text, submission_url text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  effective_tz text;
  today_local date;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized to read submission status'
      using errcode = '42501';
  end if;

  effective_tz := public.get_effective_streak_timezone(p_user_id, p_challenge_id, p_tz);
  today_local := (now() at time zone effective_tz)::date;

  return query
  with latest as (
    select cs.status, cs.media_url
    from public.challenge_submissions cs
    where cs.challenge_id = p_challenge_id
      and cs.user_id = p_user_id
      and cs.local_day = today_local
    order by cs.submission_date desc
    limit 1
  )
  select
    exists (select 1 from latest) as has_submitted,
    coalesce((select status from latest), 'not_submitted') as submission_status,
    (select media_url from latest) as submission_url;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_server_utc_time()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'server_time_utc', (NOW() AT TIME ZONE 'UTC'),
    'server_date_utc', (NOW() AT TIME ZONE 'UTC')::DATE,
    'timezone', 'UTC',
    'unix_timestamp', EXTRACT(EPOCH FROM NOW())
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_submission_status_for_day(p_user_id uuid, p_challenge_id uuid, p_date date)
 RETURNS TABLE(status text, media_url text)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    cv.status::text,
    cv.media_url::text
  FROM challenge_verifications cv
  WHERE cv.user_id = p_user_id
    AND cv.challenge_id = p_challenge_id
    AND cv.submission_date::date = p_date
  ORDER BY cv.submission_date DESC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  generated_username text;
begin
  generated_username :=
    coalesce(
      new.raw_user_meta_data ->> 'username',
      split_part(coalesce(new.email, new.id::text), '@', 1),
      'user-' || substring(new.id::text from 1 for 8)
    );

  begin
    insert into public.profiles (
      id,
      email,
      username,
      display_name,
      momenta_balance,
      has_completed_onboarding
    )
    values (
      new.id,
      new.email,
      generated_username,
      generated_username,
      0,
      false
    );
  exception
    when unique_violation then
      insert into public.profiles (
        id,
        email,
        username,
        display_name,
        momenta_balance,
        has_completed_onboarding
      )
      values (
        new.id,
        new.email,
        generated_username || '-' || substring(new.id::text from 1 for 6),
        generated_username,
        0,
        false
      );
  end;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.groups_health_check()
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT json_build_object(
    'groups_count', (SELECT COUNT(*) FROM groups WHERE privacy = 'public'),
    'members_count', (SELECT COUNT(*) FROM group_members),
    'status', 'healthy',
    'timestamp', NOW()
  );
$function$;

CREATE OR REPLACE FUNCTION public.log_maintenance_run(p_job_type text, p_status text, p_results jsonb DEFAULT NULL::jsonb, p_error_message text DEFAULT NULL::text, p_execution_time_ms integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO maintenance_logs (
    job_type, status, results, error_message, execution_time_ms
  )
  VALUES (
    p_job_type, p_status, p_results, p_error_message, p_execution_time_ms
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.invoke_daily_maintenance()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Use pg_net to call the edge function
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url')::text || '/functions/v1/daily-maintenance',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')::text,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) INTO result;
  
  -- Log the execution
  INSERT INTO maintenance_runs (
    run_timestamp,
    status,
    details
  ) VALUES (
    now(),
    'triggered',
    jsonb_build_object('trigger_result', result)
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO maintenance_runs (
      run_timestamp,
      status,
      details
    ) VALUES (
      now(),
      'error',
      jsonb_build_object('error', SQLERRM)
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.moddatetime()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.monitor_failed_verifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Log when a verification is rejected
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    PERFORM log_security_event(
      'verification_rejected',
      NEW.user_id,
      jsonb_build_object(
        'challenge_id', NEW.challenge_id,
        'verification_id', NEW.id,
        'reviewer_id', NEW.reviewer_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_verification_approval(p_verification_id uuid, p_reviewer_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  verification_record RECORD;
BEGIN
  -- Get verification and challenge details
  SELECT cv.*, c.title as challenge_title
  INTO verification_record
  FROM challenge_verifications cv
  JOIN challenges c ON cv.challenge_id = c.id
  WHERE cv.id = p_verification_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Verification not found');
  END IF;
  
  -- Notify the user about approval
  INSERT INTO notifications (user_id, payload)
  VALUES (
    verification_record.user_id,
    jsonb_build_object(
      'type', 'verification_approved',
      'challenge_id', verification_record.challenge_id,
      'challenge_title', verification_record.challenge_title,
      'verification_id', p_verification_id,
      'reviewer_id', p_reviewer_id,
      'submission_date', verification_record.submission_date,
      'message', 'Your submission for "' || verification_record.challenge_title || '" was approved! Your streak has been updated.',
      'action_required', false
    )
  );
  
  RETURN json_build_object('success', true, 'message', 'User notified of approval');
END;
$function$;

CREATE OR REPLACE FUNCTION public.run_daily_maintenance()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  streak_resets INTEGER;
  expired_challenges INTEGER;
  deactivated_powerups INTEGER;
  maintenance_log jsonb;
BEGIN
  -- Reset missed streaks
  SELECT COUNT(*) INTO streak_resets
  FROM reset_missed_streaks();
  
  -- Process expired challenges
  UPDATE challenges 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
  AND end_date < CURRENT_DATE;
  
  GET DIAGNOSTICS expired_challenges = ROW_COUNT;
  
  -- Clean up expired power-ups
  UPDATE power_up_usage 
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
  
  GET DIAGNOSTICS deactivated_powerups = ROW_COUNT;
  
  -- Log the maintenance results
  maintenance_log := jsonb_build_object(
    'timestamp', NOW(),
    'streak_resets', streak_resets,
    'expired_challenges', expired_challenges,
    'deactivated_powerups', deactivated_powerups,
    'status', 'completed'
  );
  
  RETURN maintenance_log;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text, is_local boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  perform set_config(setting_name, setting_value, is_local);
end;
$function$;

CREATE OR REPLACE FUNCTION public.notify_verification_rejection(p_verification_id uuid, p_reviewer_id uuid, p_review_notes text)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  verification_record RECORD;
BEGIN
  -- Get verification and challenge details
  SELECT cv.*, c.title as challenge_title
  INTO verification_record
  FROM challenge_verifications cv
  JOIN challenges c ON cv.challenge_id = c.id
  WHERE cv.id = p_verification_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Verification not found');
  END IF;
  
  -- Notify the user about rejection
  INSERT INTO notifications (user_id, payload)
  VALUES (
    verification_record.user_id,
    jsonb_build_object(
      'type', 'verification_rejected',
      'challenge_id', verification_record.challenge_id,
      'challenge_title', verification_record.challenge_title,
      'verification_id', p_verification_id,
      'review_notes', p_review_notes,
      'reviewer_id', p_reviewer_id,
      'submission_date', verification_record.submission_date,
      'message', 'Your submission for "' || verification_record.challenge_title || '" was not approved. Please review the feedback and resubmit.',
      'action_required', true
    )
  );
  
  RETURN json_build_object('success', true, 'message', 'User notified of rejection');
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_approved_streak_checkin(p_user_id uuid, p_challenge_id uuid, p_local_day date, p_effective_tz text, p_submission_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_participant public.challenge_participants%rowtype;
  v_challenge public.challenges%rowtype;
  v_authority_submission public.challenge_submissions%rowtype;
  v_existing_application public.streak_checkin_applications%rowtype;
  v_previous_outcome public.streak_day_outcomes%rowtype;
  v_effective_tz text;
  v_new_streak integer;
  v_longest_streak integer;
  v_gap_days integer := 0;
  v_day_status text := 'done';
  v_freeze_result jsonb := pg_catalog.jsonb_build_object(
    'used', false,
    'remaining', 0
  );
  v_freeze_used boolean := false;
  v_freezes_remaining integer := 0;
  v_milestone_days integer;
  v_milestone_reward integer;
  v_milestone_result jsonb := 'null'::jsonb;
  v_external_reference text;
  v_transaction_id bigint;
  v_application_id uuid;
  v_cutover_assessment text;
  v_first_full_day date;
begin
  if p_user_id is null
    or p_challenge_id is null
    or p_local_day is null
    or p_submission_id is null
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_APPROVED_CHECKIN'
    );
  end if;

  select cs.*
  into v_authority_submission
  from public.challenge_submissions cs
  where cs.id = p_submission_id
    and cs.user_id = p_user_id
    and cs.challenge_id = p_challenge_id
    and cs.local_day = p_local_day
    and cs.status = 'approved';
  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'APPROVED_SUBMISSION_AUTHORITY_REQUIRED'
    );
  end if;

  v_effective_tz := public.get_effective_streak_timezone(
    p_user_id,
    p_challenge_id,
    p_effective_tz
  );

  select cp.*
  into v_participant
  from public.challenge_participants cp
  where cp.challenge_id = p_challenge_id
    and cp.user_id = p_user_id
    and coalesce(cp.status, 'active') = 'active'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PARTICIPANT_NOT_FOUND'
    );
  end if;

  if v_participant.streak_outcome_tracking_started_at is null then
    update public.challenge_participants cp
    set
      streak_outcome_tracking_started_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.now()
    where cp.challenge_id = p_challenge_id
      and cp.user_id = p_user_id
    returning cp.* into v_participant;
  end if;

  select challenge_row.*
  into v_challenge
  from public.challenges challenge_row
  where challenge_row.id = p_challenge_id;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'CHALLENGE_NOT_FOUND'
    );
  end if;

  v_first_full_day := greatest(
    private.first_full_streak_local_day_v1(
      v_participant.streak_outcome_tracking_started_at,
      v_effective_tz
    ),
    private.first_full_streak_local_day_v1(
      v_participant.joined_at,
      v_effective_tz
    ),
    coalesce(
      private.first_full_streak_local_day_v1(
        v_challenge.start_date,
        v_effective_tz
      ),
      '-infinity'::date
    )
  );

  select application_row.*
  into v_existing_application
  from public.streak_checkin_applications application_row
  where application_row.submission_id = p_submission_id;

  if found then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'applied', false,
      'newStreak', v_existing_application.resulting_streak,
      'longestStreak', greatest(
        coalesce(v_participant.longest_streak, 0),
        v_existing_application.resulting_streak
      ),
      'freezeUsed', v_existing_application.freeze_used,
      'freezesRemaining', v_existing_application.freezes_remaining,
      'dayStatus', 'already_applied',
      'milestone', null
    );
  end if;

  -- Do not calculate a new gap across a real peer approval that predates the
  -- prospective cursor. Per-participant maintenance anchors it first.
  select candidate.assessment_status
  into v_cutover_assessment
  from private.streak_cutover_anchor_candidate(
    p_user_id,
    p_challenge_id,
    p_submission_id
  ) candidate;

  if v_cutover_assessment is distinct from 'none' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'CUTOVER_ANCHOR_REQUIRED',
      'assessment', v_cutover_assessment
    );
  end if;

  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'STREAK_RESOLUTION_BUSY'
    );
  end if;

  perform 1
  from public.resolve_streak_day_outcomes(
    p_user_id,
    p_challenge_id,
    p_local_day - 1,
    v_effective_tz
  );

  -- The resolver can advance or reset this participant. Reload the locked row
  -- before calculating the accepted day and recording its receipt.
  select cp.*
  into v_participant
  from public.challenge_participants cp
  where cp.challenge_id = p_challenge_id
    and cp.user_id = p_user_id
    and coalesce(cp.status, 'active') = 'active'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PARTICIPANT_NOT_FOUND'
    );
  end if;

  select cs.*
  into v_authority_submission
  from public.challenge_submissions cs
  where cs.id = p_submission_id
    and cs.user_id = p_user_id
    and cs.challenge_id = p_challenge_id
    and cs.local_day = p_local_day
    and cs.status = 'approved'
  for share;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'APPROVED_SUBMISSION_AUTHORITY_REQUIRED'
    );
  end if;

  v_freezes_remaining := public.get_available_streak_freezes(p_user_id);

  if v_participant.last_check_in_local_date is not null
    and v_participant.last_check_in_local_date >= p_local_day
  then
    insert into public.streak_checkin_applications (
      user_id,
      challenge_id,
      local_day,
      submission_id,
      application_type,
      effective_timezone,
      previous_streak,
      resulting_streak,
      freeze_used,
      freezes_remaining,
      day_status
    )
    values (
      p_user_id,
      p_challenge_id,
      p_local_day,
      p_submission_id,
      'accepted_horizon_covered',
      v_effective_tz,
      greatest(coalesce(v_participant.current_streak, 0), 0),
      greatest(coalesce(v_participant.current_streak, 0), 0),
      false,
      v_freezes_remaining,
      'accepted_horizon_covered'
    )
    on conflict do nothing;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'applied', false,
      'newStreak', coalesce(v_participant.current_streak, 0),
      'longestStreak', greatest(
        coalesce(v_participant.longest_streak, 0),
        coalesce(v_participant.current_streak, 0)
      ),
      'freezeUsed', false,
      'freezesRemaining', v_freezes_remaining,
      'dayStatus', 'already_applied',
      'milestone', null
    );
  end if;

  select outcome_row.*
  into v_previous_outcome
  from public.streak_day_outcomes outcome_row
  where outcome_row.user_id = p_user_id
    and outcome_row.challenge_id = p_challenge_id
    and outcome_row.local_day = p_local_day - 1;

  v_new_streak := coalesce(v_participant.current_streak, 0);
  v_longest_streak := coalesce(v_participant.longest_streak, 0);

  if v_previous_outcome.outcome = 'protected' then
    v_new_streak := greatest(v_new_streak, 0) + 1;
    v_freeze_used := true;
    v_freezes_remaining := v_previous_outcome.freezes_remaining;
    v_day_status := 'freeze_used';
  elsif v_previous_outcome.outcome = 'missed' then
    v_new_streak := 1;
    v_day_status := 'missed';
  elsif p_local_day <= v_first_full_day then
    -- There is no complete, prospectively governed day before this proof.
    -- Continue the accepted aggregate without inventing a historical miss.
    v_new_streak := greatest(v_new_streak, 0) + 1;
  elsif v_participant.last_check_in_local_date is null then
    v_new_streak := case when v_new_streak > 0 then v_new_streak + 1 else 1 end;
  else
    v_gap_days := p_local_day - v_participant.last_check_in_local_date;

    if v_gap_days <= 0 then
      null;
    elsif v_gap_days = 1 then
      v_new_streak := v_new_streak + 1;
    elsif v_gap_days = 2 then
      -- Preserve the pre-ledger compatibility path when the missed day is
      -- earlier than this participant's prospective tracking boundary.
      v_freeze_result := public.use_streak_freeze_for_user(
        p_user_id,
        p_challenge_id
      );
      v_freeze_used := coalesce(
        (v_freeze_result ->> 'used')::boolean,
        false
      );
      v_freezes_remaining := coalesce(
        (v_freeze_result ->> 'remaining')::integer,
        0
      );

      if v_freeze_used then
        insert into public.streak_freeze_log (
          user_id,
          challenge_id,
          used_at,
          freeze_type,
          days_saved
        )
        values (
          p_user_id,
          p_challenge_id,
          pg_catalog.now() at time zone 'UTC',
          'auto',
          1
        );

        v_new_streak := v_new_streak + 1;
        v_day_status := 'freeze_used';
      else
        v_new_streak := 1;
        v_day_status := 'missed';
      end if;
    else
      v_new_streak := 1;
      v_day_status := 'missed';
    end if;
  end if;

  v_longest_streak := greatest(v_longest_streak, v_new_streak);
  v_freezes_remaining := public.get_available_streak_freezes(p_user_id);

  update public.challenge_participants cp
  set
    current_streak = v_new_streak,
    longest_streak = greatest(
      coalesce(cp.longest_streak, 0),
      v_new_streak
    ),
    streak_count = v_new_streak,
    last_check_in_local_date = p_local_day,
    last_check_in = p_local_day,
    last_submission_date = v_authority_submission.submission_date,
    last_check_in_tz = v_effective_tz,
    at_risk = false,
    streak_freezes_remaining = v_freezes_remaining,
    last_freeze_used = case
      when v_freeze_used then pg_catalog.now()
      else cp.last_freeze_used
    end,
    updated_at = pg_catalog.now()
  where cp.challenge_id = p_challenge_id
    and cp.user_id = p_user_id;

  insert into public.streak_checkin_applications (
    user_id,
    challenge_id,
    local_day,
    submission_id,
    application_type,
    effective_timezone,
    previous_streak,
    resulting_streak,
    freeze_used,
    freezes_remaining,
    day_status
  )
  values (
    p_user_id,
    p_challenge_id,
    p_local_day,
    p_submission_id,
    'accepted',
    v_effective_tz,
    greatest(coalesce(v_participant.current_streak, 0), 0),
    v_new_streak,
    v_freeze_used,
    v_freezes_remaining,
    v_day_status
  )
  on conflict (user_id, challenge_id, local_day) do nothing
  returning id into v_application_id;

  if v_application_id is null then
    raise exception 'STREAK_APPLICATION_RECEIPT_CONFLICT';
  end if;

  select milestone.days, milestone.reward
  into v_milestone_days, v_milestone_reward
  from (
    values
      (3, 25),
      (7, 50),
      (14, 100),
      (30, 250),
      (50, 500),
      (100, 1000)
  ) as milestone(days, reward)
  where milestone.days > coalesce(v_participant.milestone_reached, 0)
    and v_new_streak >= milestone.days
  order by milestone.days
  limit 1;

  if v_milestone_days is not null then
    v_external_reference := pg_catalog.concat(
      'streak_milestone:',
      p_challenge_id::text,
      ':',
      p_user_id::text,
      ':',
      v_milestone_days::text
    );

    insert into public.wallet_transactions (
      user_id,
      amount,
      reason,
      source_uuid,
      transaction_type,
      description,
      reference_id,
      external_reference_id,
      created_at
    )
    values (
      p_user_id,
      v_milestone_reward,
      v_milestone_days::text || '-day streak milestone',
      p_submission_id,
      'earned',
      v_milestone_days::text || '-day streak milestone',
      p_submission_id,
      v_external_reference,
      pg_catalog.now()
    )
    on conflict (external_reference_id)
      where external_reference_id is not null
    do nothing
    returning id into v_transaction_id;

    if v_transaction_id is not null then
      update public.profiles profile_row
      set
        momenta_balance = coalesce(profile_row.momenta_balance, 0)
          + v_milestone_reward,
        updated_at = pg_catalog.now()
      where profile_row.id = p_user_id;

      if not found then
        raise exception 'MILESTONE_PROFILE_NOT_FOUND';
      end if;
    end if;

    update public.challenge_participants cp
    set
      milestone_reached = greatest(
        coalesce(cp.milestone_reached, 0),
        v_milestone_days
      ),
      updated_at = pg_catalog.now()
    where cp.challenge_id = p_challenge_id
      and cp.user_id = p_user_id;

    if v_transaction_id is not null then
      v_milestone_result := pg_catalog.jsonb_build_object(
        'reached', true,
        'milestone', v_milestone_days,
        'reward', v_milestone_reward,
        'rewardGranted', true
      );
    end if;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'applied', true,
    'newStreak', v_new_streak,
    'longestStreak', v_longest_streak,
    'freezeUsed', v_freeze_used,
    'freezesRemaining', v_freezes_remaining,
    'dayStatus', v_day_status,
    'milestone', v_milestone_result
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.purchase_shop_item(p_user_id uuid, p_item_sku text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_item_id uuid;
  v_purchase_result jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return false;
  end if;

  select item.id
  into v_item_id
  from public.catalog_items item
  where item.sku = p_item_sku
    and item.is_available = true
    and item.is_disabled = false
  limit 1;

  if v_item_id is null then
    return false;
  end if;

  v_purchase_result := public.purchase_shop_item(
    p_user_id,
    v_item_id,
    pg_catalog.gen_random_uuid()
  );

  return coalesce(
    (v_purchase_result ->> 'success')::boolean,
    false
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.process_group_failures()
 RETURNS TABLE(processed_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  processed_count integer := 0;
BEGIN
  -- This function is a basic version - the enhanced version is used in daily maintenance
  -- Just return 0 for now since process_group_failures_enhanced handles the real logic
  RAISE NOTICE 'Basic group failure processing - using enhanced version instead';
  RETURN QUERY SELECT 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_challenge_progress(p_challenge_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Reset all user challenge streaks
  UPDATE user_challenges 
  SET current_streak = 0, last_check_in = NULL
  WHERE challenge_id = p_challenge_id;
  
  -- Delete all verifications for this challenge
  DELETE FROM challenge_verifications
  WHERE challenge_id = p_challenge_id;
  
  -- Reset challenge to active status
  UPDATE challenges 
  SET status = 'active',
      end_date = CURRENT_DATE + INTERVAL '7 days'
  WHERE id = p_challenge_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.run_complete_group_scenario(p_group_id uuid)
 RETURNS TABLE(scenario_step text, result text, step_timestamp timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_result record;
BEGIN
  -- Step 1: Create test submissions at 80% rate
  RETURN QUERY SELECT 
    'initial_submissions'::text,
    'Starting group scenario test'::text,
    CURRENT_TIMESTAMP;
  
  SELECT * INTO v_result FROM simulate_group_submissions(p_group_id, 0.8);
  
  RETURN QUERY SELECT 
    'submissions_created'::text,
    format('Created %s submissions from %s members (%.1f%% rate)', 
           v_result.submitted_count, 
           v_result.total_members, 
           v_result.actual_rate * 100)::text,
    CURRENT_TIMESTAMP;
  
  -- Step 2: Check group streak status
  RETURN QUERY SELECT 
    'streak_check'::text,
    CASE 
      WHEN v_result.group_streak_maintained 
      THEN 'Group streak maintained (>70% participation)'
      ELSE 'Group streak lost (<70% participation)'
    END::text,
    CURRENT_TIMESTAMP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.safe_add_group_member(p_group_id uuid, p_user_id uuid, p_role text DEFAULT 'member'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  -- Check if member already exists
  IF EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = p_group_id AND user_id = p_user_id
  ) THEN
    -- Member already exists, return false
    RETURN false;
  END IF;
  
  -- Insert new member
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (p_group_id, p_user_id, p_role);
  
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  -- Handle race condition gracefully
  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.should_reset_group_streak(gid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  missed boolean;
BEGIN
  WITH members AS (
    SELECT user_id
    FROM group_members
    WHERE group_id = gid
  ), yesterday_verifications AS (
    SELECT DISTINCT cv.user_id
    FROM challenge_verifications cv
    JOIN group_challenges gc ON gc.challenge_id = cv.challenge_id
    WHERE gc.group_id = gid
      AND cv.submission_date::date = (current_date - interval '1 day')::date
  )
  SELECT EXISTS(
      SELECT 1 FROM members m
      WHERE NOT EXISTS (
        SELECT 1 FROM yesterday_verifications yv WHERE yv.user_id = m.user_id
      )
  ) INTO missed;

  RETURN missed;
END;
$function$;

CREATE OR REPLACE FUNCTION public.purge_expired_edge_rate_limits(p_retention interval DEFAULT '2 days'::interval)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_deleted bigint;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED' using errcode = '42501';
  end if;

  if p_retention < interval '1 hour'
    or p_retention > interval '30 days'
  then
    raise exception 'INVALID_RETENTION' using errcode = '22023';
  end if;

  delete from public.edge_rate_limits erl
  where erl.window_start < now() - p_retention;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$function$;

CREATE OR REPLACE FUNCTION public.validate_challenge_streak_timezone()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_timezone text := coalesce(
    nullif(pg_catalog.btrim(new.streak_timezone), ''),
    'UTC'
  );
begin
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names z
    where z.name = v_timezone
  ) then
    raise exception 'INVALID_STREAK_TIMEZONE: %', v_timezone
      using errcode = '22023';
  end if;

  new.streak_timezone := v_timezone;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.submit_challenge_with_validation(p_user_id uuid, p_challenge_id uuid, p_verification_id uuid, p_submission_time timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  time_validation jsonb;
  deadline_check jsonb;
  current_streak INTEGER;
  result jsonb;
BEGIN
  -- Validate submission timing
  SELECT validate_submission_timing(p_user_id, p_challenge_id, p_submission_time) 
  INTO time_validation;
  
  IF NOT (time_validation->>'valid')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'timing_validation_failed',
      'validation_details', time_validation
    );
  END IF;
  
  -- Check challenge deadline
  SELECT check_challenge_deadline(p_challenge_id, p_submission_time)
  INTO deadline_check;
  
  IF (deadline_check->>'is_expired')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'challenge_expired',
      'deadline_details', deadline_check
    );
  END IF;
  
  -- Update user challenge progress
  UPDATE user_challenges 
  SET 
    current_streak = current_streak + 1,
    last_check_in = (p_submission_time AT TIME ZONE 'UTC')::DATE
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id
  RETURNING current_streak INTO current_streak;
  
  -- Update verification status to approved (assuming valid submission)
  UPDATE challenge_verifications 
  SET 
    status = 'approved',
    verification_date = p_submission_time
  WHERE id = p_verification_id;
  
  result := jsonb_build_object(
    'success', true,
    'new_streak', current_streak,
    'submission_date', (p_submission_time AT TIME ZONE 'UTC')::DATE,
    'time_validation', time_validation,
    'deadline_check', deadline_check,
    'submitted_at', p_submission_time
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  begin
    update users u
       set momenta_balance =
         coalesce((select sum(amount) from momenta_transactions
                   where user_id = u.id), 0)
     where u.id = new.user_id;
    return new;
  end;
$function$;

CREATE OR REPLACE FUNCTION public.create_group_with_payment(p_user_id uuid, p_name text, p_description text, p_duration_days integer, p_cost integer, p_privacy text DEFAULT 'private'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  new_group_id uuid;
  balance integer;
  effective_cost integer;
  new_balance integer;
  quota_error text;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'USER_REQUIRED');
  end if;

  if auth.uid() is null or auth.uid() <> p_user_id then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'error', 'GROUP_NAME_REQUIRED');
  end if;

  select coalesce(momenta_balance, 0)
  into balance
  from public.profiles
  where id = p_user_id
  for update;

  if balance is null then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  quota_error := private.economy_quota_error_v1(p_user_id, 'create_group');
  if quota_error is not null then
    return jsonb_build_object('success', false, 'error', quota_error);
  end if;

  effective_cost := private.economy_action_cost_v1(p_user_id, 'create_group');

  if balance < effective_cost then
    return jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE');
  end if;

  insert into public.teams(
    owner_id,
    name,
    description,
    privacy,
    status,
    duration_days
  )
  values (
    p_user_id,
    p_name,
    p_description,
    coalesce(nullif(p_privacy, ''), 'private'),
    'active',
    least(365, greatest(coalesce(p_duration_days, 30), 1))
  )
  returning id into new_group_id;

  insert into public.team_members(group_id, user_id, role)
  values (new_group_id, p_user_id, 'owner')
  on conflict (group_id, user_id) do nothing;

  if effective_cost > 0 then
    perform public.add_momenta_transaction(
      p_user_id,
      -effective_cost,
      'Group creation',
      'spent',
      new_group_id
    );
  end if;

  select coalesce(momenta_balance, 0)
  into new_balance
  from public.profiles
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'group_id', new_group_id,
    'new_balance', coalesce(new_balance, 0),
    'cost', effective_cost
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.extend_group_duration(p_group_id uuid, p_user_id uuid, p_additional_days integer DEFAULT 7)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  group_owner_id uuid;
  group_name text;
  actor_role text;
  has_end_date boolean;
  has_max_extensions boolean;
  has_extension_count boolean;
  base_end_date date;
  max_extensions_value integer := 2;
  current_extension_count integer := 0;
  new_end_date date;
  participants_notified integer := 0;
BEGIN
  IF p_group_id IS NULL OR p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Missing required parameters');
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  IF p_additional_days IS NULL OR p_additional_days <= 0 OR p_additional_days > 90 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid extension window');
  END IF;

  SELECT t.owner_id, t.name
  INTO group_owner_id, group_name
  FROM public.teams t
  WHERE t.id = p_group_id
  LIMIT 1;

  IF group_owner_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Group not found');
  END IF;

  IF group_owner_id <> p_user_id THEN
    SELECT tm.role
    INTO actor_role
    FROM public.team_members tm
    WHERE tm.group_id = p_group_id
      AND tm.user_id = p_user_id
    LIMIT 1;

    IF actor_role NOT IN ('admin', 'moderator') THEN
      RETURN json_build_object('success', false, 'error', 'Permission denied');
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teams'
      AND column_name = 'end_date'
  )
  INTO has_end_date;

  IF NOT has_end_date THEN
    RETURN json_build_object(
      'success', false,
      'error', 'GROUP_EXTENSION_UNSUPPORTED'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teams'
      AND column_name = 'max_extensions'
  )
  INTO has_max_extensions;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teams'
      AND column_name = 'extension_count'
  )
  INTO has_extension_count;

  IF has_max_extensions THEN
    EXECUTE
      'SELECT COALESCE(max_extensions, 2) FROM public.teams WHERE id = $1'
    INTO max_extensions_value
    USING p_group_id;
  END IF;

  IF has_extension_count THEN
    EXECUTE
      'SELECT COALESCE(extension_count, 0) FROM public.teams WHERE id = $1'
    INTO current_extension_count
    USING p_group_id;
  END IF;

  IF current_extension_count >= max_extensions_value THEN
    RETURN json_build_object('success', false, 'error', 'Maximum extensions reached');
  END IF;

  EXECUTE
    'SELECT COALESCE(end_date::date, current_date) FROM public.teams WHERE id = $1'
  INTO base_end_date
  USING p_group_id;

  new_end_date := base_end_date + p_additional_days;

  IF has_extension_count THEN
    EXECUTE
      'UPDATE public.teams
       SET end_date = $2,
           extension_count = COALESCE(extension_count, 0) + 1,
           status = ''active'',
           updated_at = now()
       WHERE id = $1'
    USING p_group_id, new_end_date;
  ELSE
    EXECUTE
      'UPDATE public.teams
       SET end_date = $2,
           status = ''active'',
           updated_at = now()
       WHERE id = $1'
    USING p_group_id, new_end_date;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    notification_type,
    title,
    body,
    payload,
    priority,
    created_at
  )
  SELECT
    tm.user_id,
    'group_extended',
    'Group extended',
    COALESCE(group_name, 'Your group') || ' was extended by ' || p_additional_days || ' days.',
    jsonb_build_object(
      'type', 'group_extended',
      'group_id', p_group_id,
      'additional_days', p_additional_days,
      'new_end_date', new_end_date
    ),
    3,
    now()
  FROM public.team_members tm
  WHERE tm.group_id = p_group_id
    AND tm.user_id <> p_user_id;

  GET DIAGNOSTICS participants_notified = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'new_end_date', new_end_date,
    'extensions_remaining', GREATEST(max_extensions_value - (current_extension_count + 1), 0),
    'participants_notified', participants_notified
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_user_momenta(p_user_id uuid, p_amount integer, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN public.add_momenta_transaction(
    p_user_id => p_user_id,
    p_amount => p_amount,
    p_reason => COALESCE(p_reason, 'momenta_adjustment'),
    p_transaction_type => CASE WHEN p_amount >= 0 THEN 'earned' ELSE 'spent' END,
    p_reference_id => NULL
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_reviewer_badges(p_reviewer_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  review_count INTEGER;
  badge_name TEXT;
  badge_description TEXT;
BEGIN
  -- Get reviewer's total review count
  SELECT COUNT(*) INTO review_count
  FROM challenge_verifications
  WHERE reviewer_id = p_reviewer_id
    AND status IN ('approved', 'rejected');

  -- Check for badge milestones
  CASE review_count
    WHEN 10 THEN
      badge_name := 'Review Rookie';
      badge_description := 'Completed your first 10 reviews';
    WHEN 25 THEN
      badge_name := 'Community Helper';
      badge_description := 'Helped the community with 25 reviews';
    WHEN 50 THEN
      badge_name := 'Review Expert';
      badge_description := 'Demonstrated expertise with 50 reviews';
    WHEN 100 THEN
      badge_name := 'Review Master';
      badge_description := 'Achieved mastery with 100 reviews';
    ELSE
      badge_name := NULL;
  END CASE;

  -- If milestone reached, send badge notification
  IF badge_name IS NOT NULL THEN
    INSERT INTO notifications (user_id, payload)
    VALUES (
      p_reviewer_id,
      jsonb_build_object(
        'type', 'badge_unlocked',
        'badge_name', badge_name,
        'badge_description', badge_description,
        'badge_type', 'review_expert',
        'review_count', review_count,
        'message', 'Congratulations! You''ve unlocked the "' || badge_name || '" badge for your dedication to reviewing submissions.',
        'deep_link', 'profile/badges'
      )
    );
    
    RETURN json_build_object(
      'success', true, 
      'badge_awarded', badge_name,
      'review_count', review_count
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'review_count', review_count
  );
END;
$function$;

CREATE OR REPLACE FUNCTION private.event_organiser_review_item_json_v1(p_post event_posts, p_profile profiles, p_attendance event_attendances, p_checkin event_checkins)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'postId', p_post.id,
    'occurrenceId', p_post.occurrence_id,
    'revision', p_post.revision,
    'caption', p_post.caption,
    'createdAt', p_post.created_at,
    'attendeeUsername', coalesce(nullif(btrim(p_profile.username), ''), 'Event attendee'),
    'attendanceState', case when p_attendance.id is null then null else p_attendance.state end,
    'checkedInAt', case when p_checkin.id is null then null else p_checkin.checked_in_at end,
    'checkInMethod', case when p_checkin.id is null then null else p_checkin.method end,
    'hasUploadedMedia', p_post.media_path is not null
  );
$function$;

CREATE OR REPLACE FUNCTION public.event_get_organiser_review_queue_v1(p_occurrence_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_items jsonb;
  v_pending_count integer;
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    return private.event_result_v1(
      'get_organiser_review_queue',
      null,
      'failed',
      'AUTHENTICATION_REQUIRED',
      'Sign in to review event posts.',
      null
    );
  end if;

  select occurrence.*
  into v_occurrence
  from public.event_occurrences as occurrence
  where occurrence.id = p_occurrence_id;

  if not found then
    return private.event_result_v1(
      'get_organiser_review_queue',
      null,
      'failed',
      'OCCURRENCE_UNAVAILABLE',
      'This event occurrence is not available.',
      null
    );
  end if;

  select event.*
  into v_event
  from public.event_events as event
  where event.id = v_occurrence.event_id;

  if not found or v_event.organiser_id is distinct from v_actor_id then
    return private.event_result_v1(
      'get_organiser_review_queue',
      null,
      'failed',
      'FORBIDDEN',
      'Only this event organiser can review these posts.',
      null
    );
  end if;

  select count(*)::integer
  into v_pending_count
  from public.event_posts as post
  where post.occurrence_id = v_occurrence.id
    and post.status = 'pending_review';

  select coalesce(
    jsonb_agg(review_row.item order by review_row.created_at asc),
    '[]'::jsonb
  )
  into v_items
  from (
    select
      post.created_at,
      private.event_organiser_review_item_json_v1(
        post,
        profile,
        attendance,
        checkin
      ) as item
    from public.event_posts as post
    join public.profiles as profile on profile.id = post.user_id
    left join public.event_attendances as attendance
      on attendance.occurrence_id = post.occurrence_id
      and attendance.user_id = post.user_id
    left join public.event_checkins as checkin
      on checkin.attendance_id = attendance.id
      and checkin.revoked_at is null
    where post.occurrence_id = v_occurrence.id
      and post.status = 'pending_review'
    order by post.created_at asc
    limit 100
  ) as review_row;

  return private.event_result_v1(
    'get_organiser_review_queue',
    null,
    'completed',
    'ORGANISER_REVIEW_QUEUE_READY',
    'The organiser review queue is ready.',
    jsonb_build_object(
      'eventId', v_event.id,
      'occurrenceId', v_occurrence.id,
      'eventTitle', v_event.title,
      'pendingCount', v_pending_count,
      'items', v_items
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_feature_vote_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feature_requests 
    SET vote_count = vote_count + 1
    WHERE id = NEW.feature_request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feature_requests 
    SET vote_count = vote_count - 1
    WHERE id = OLD.feature_request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_group_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_waitlist_emails_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_challenge_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    group_start timestamptz;
    group_end timestamptz;
    challenge_start timestamptz;
    challenge_end timestamptz;
BEGIN
    -- Only validate if this challenge belongs to a group
    IF NEW.id IS NOT NULL THEN
        -- Get the group dates
        SELECT g.start_date, g.end_date
        INTO group_start, group_end
        FROM public.groups g
        JOIN public.group_challenges gc ON gc.group_id = g.id
        WHERE gc.challenge_id = NEW.id;

        -- If group exists, validate the challenge dates
        IF group_start IS NOT NULL THEN
            -- Determine challenge end date
            IF NEW.end_date IS NOT NULL THEN
                challenge_end := NEW.end_date;
            ELSIF NEW.start_date IS NOT NULL AND NEW.duration IS NOT NULL THEN
                challenge_end := NEW.start_date + (NEW.duration || ' days')::interval;
            ELSE
                challenge_end := NULL;
            END IF;

            -- Validate challenge dates are within group dates
            IF NEW.start_date IS NOT NULL AND NEW.start_date < group_start THEN
                RAISE EXCEPTION 'Challenge start date (%) must be on or after group start date (%)',
                    NEW.start_date, group_start;
            END IF;

            IF challenge_end IS NOT NULL AND challenge_end > group_end THEN
                RAISE EXCEPTION 'Challenge end date (%) must be on or before group end date (%)',
                    challenge_end, group_end;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_group_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    earliest_challenge_start timestamptz;
    latest_challenge_end timestamptz;
BEGIN
    -- Only validate if this group has challenges
    IF EXISTS (SELECT 1 FROM public.group_challenges WHERE group_id = NEW.id) THEN
        -- Get earliest challenge start and latest challenge end
        SELECT
            MIN(CASE
                WHEN c.end_date IS NOT NULL THEN c.end_date
                WHEN c.start_date IS NOT NULL AND c.duration IS NOT NULL
                THEN c.start_date + (c.duration || ' days')::interval
                ELSE NULL
            END),
            MAX(CASE
                WHEN c.start_date IS NOT NULL THEN c.start_date
                ELSE NULL
            END)
        INTO earliest_challenge_start, latest_challenge_end
        FROM public.challenges c
        JOIN public.group_challenges gc ON gc.challenge_id = c.id
        WHERE gc.group_id = NEW.id;

        -- Validate group dates encompass all challenges
        IF earliest_challenge_start IS NOT NULL AND NEW.start_date > earliest_challenge_start THEN
            RAISE EXCEPTION 'Group start date (%) cannot be after earliest challenge start date (%)',
                NEW.start_date, earliest_challenge_start;
        END IF;

        IF latest_challenge_end IS NOT NULL THEN
            -- Calculate group end date
            DECLARE
                group_end_calculated timestamptz := NEW.start_date + (NEW.duration_days || ' days')::interval;
            BEGIN
                IF group_end_calculated < latest_challenge_end THEN
                    RAISE EXCEPTION 'Group end date (%) must be on or after latest challenge end date (%)',
                        group_end_calculated, latest_challenge_end;
                END IF;
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_submission_timing(p_user_id uuid, p_challenge_id uuid, p_submission_timestamp timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  last_submission_date DATE;
  current_utc_date DATE := (NOW() AT TIME ZONE 'UTC')::DATE;
  submission_utc_date DATE := (p_submission_timestamp AT TIME ZONE 'UTC')::DATE;
  result jsonb;
BEGIN
  -- Get last submission date
  SELECT last_check_in INTO last_submission_date
  FROM user_challenges 
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  -- Validation rules (all based on UTC to prevent exploitation)
  
  -- Rule 1: Cannot submit for future dates
  IF submission_utc_date > current_utc_date THEN
    result := jsonb_build_object(
      'valid', false,
      'reason', 'future_submission',
      'message', 'Cannot submit for future dates',
      'submission_date', submission_utc_date,
      'current_date', current_utc_date
    );
    RETURN result;
  END IF;
  
  -- Rule 2: Cannot submit twice for the same day
  IF last_submission_date = submission_utc_date THEN
    result := jsonb_build_object(
      'valid', false,
      'reason', 'duplicate_submission',
      'message', 'Already submitted for this day',
      'last_submission', last_submission_date,
      'attempted_date', submission_utc_date
    );
    RETURN result;
  END IF;
  
  -- Rule 3: Cannot submit for dates more than 1 day in the past (grace period)
  IF submission_utc_date < current_utc_date - INTERVAL '1 day' THEN
    result := jsonb_build_object(
      'valid', false,
      'reason', 'too_old',
      'message', 'Cannot submit for dates more than 1 day ago',
      'submission_date', submission_utc_date,
      'cutoff_date', current_utc_date - INTERVAL '1 day'
    );
    RETURN result;
  END IF;
  
  -- If all validations pass
  result := jsonb_build_object(
    'valid', true,
    'submission_date', submission_utc_date,
    'current_date', current_utc_date,
    'timezone', 'UTC',
    'validated_at', NOW()
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION private.event_claim_receipt_v1(p_actor_id uuid, p_action text, p_client_event_id uuid, p_request_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_existing public.event_action_receipts%rowtype;
  v_inserted_id uuid;
begin
  if p_actor_id is null
     or p_client_event_id is null
     or p_request_hash !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('kind', 'invalid');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_actor_id::text || ':' || p_action || ':' || p_client_event_id::text,
      0
    )
  );

  select *
  into v_existing
  from public.event_action_receipts
  where actor_id = p_actor_id
    and action = p_action
    and client_event_id = p_client_event_id
  for update;

  if found then
    if v_existing.request_hash <> p_request_hash then
      return jsonb_build_object('kind', 'mismatch');
    end if;

    -- A retryable authoritative failure (for example, the Storage object was
    -- not visible yet) must not permanently consume the client event ID. The
    -- transaction lock above makes reopening and re-claiming this receipt
    -- atomic with respect to concurrent retries.
    if v_existing.outcome = 'failed'
       and v_existing.response->>'retryable' = 'true' then
      update public.event_action_receipts
      set
        outcome = null,
        response = null,
        completed_at = null
      where id = v_existing.id;

      return jsonb_build_object('kind', 'new');
    end if;

    if v_existing.outcome is null or v_existing.response is null then
      return jsonb_build_object('kind', 'in_progress');
    end if;

    return jsonb_build_object(
      'kind', 'cached',
      'response',
      jsonb_set(v_existing.response, '{idempotent}', 'true'::jsonb, true)
    );
  end if;

  insert into public.event_action_receipts (
    actor_id,
    action,
    client_event_id,
    request_hash
  )
  values (
    p_actor_id,
    p_action,
    p_client_event_id,
    p_request_hash
  )
  returning id into v_inserted_id;

  if v_inserted_id is null then
    raise exception 'Could not claim event idempotency receipt';
  end if;

  return jsonb_build_object('kind', 'new');
end;
$function$;

CREATE OR REPLACE FUNCTION private.event_finish_receipt_v1(p_actor_id uuid, p_action text, p_client_event_id uuid, p_outcome menta_event_action_outcome, p_response jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_receipt_id uuid;
begin
  update public.event_action_receipts
  set
    outcome = p_outcome,
    response = p_response,
    completed_at = now()
  where actor_id = p_actor_id
    and action = p_action
    and client_event_id = p_client_event_id
    and outcome is null
  returning id into v_receipt_id;

  if v_receipt_id is null then
    raise exception 'Could not complete event idempotency receipt';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION private.event_complete_action_v1(p_actor_id uuid, p_action text, p_client_event_id uuid, p_code text, p_message text, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_response jsonb;
begin
  v_response := private.event_result_v1(
    p_action,
    p_client_event_id,
    'completed',
    p_code,
    p_message,
    p_data,
    false,
    false
  );
  perform private.event_finish_receipt_v1(
    p_actor_id,
    p_action,
    p_client_event_id,
    'completed',
    v_response
  );
  return v_response;
end;
$function$;

CREATE OR REPLACE FUNCTION private.event_fail_action_v1(p_actor_id uuid, p_action text, p_client_event_id uuid, p_code text, p_message text, p_data jsonb DEFAULT NULL::jsonb, p_retryable boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_response jsonb;
begin
  v_response := private.event_result_v1(
    p_action,
    p_client_event_id,
    'failed',
    p_code,
    p_message,
    p_data,
    p_retryable,
    false
  );
  perform private.event_finish_receipt_v1(
    p_actor_id,
    p_action,
    p_client_event_id,
    'failed',
    v_response
  );
  return v_response;
end;
$function$;

CREATE OR REPLACE FUNCTION private.event_audit_v1(p_event_id uuid, p_occurrence_id uuid, p_actor_id uuid, p_action text, p_target_type text, p_target_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_audit_id uuid;
begin
  insert into public.event_audit_log (
    event_id,
    occurrence_id,
    actor_id,
    action,
    target_type,
    target_id,
    metadata
  )
  values (
    p_event_id,
    p_occurrence_id,
    p_actor_id,
    p_action,
    p_target_type,
    p_target_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_audit_id;

  if v_audit_id is null then
    raise exception 'Could not write event audit row';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.reset_missed_streaks()
 RETURNS TABLE(reset_count integer, at_risk_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    0::integer as reset_count,
    count(*) filter (where coalesce(cp.at_risk, false))::integer
      as at_risk_count
  from public.challenge_participants cp
  join public.challenges challenge_row
    on challenge_row.id = cp.challenge_id
  where coalesce(cp.status, 'active') = 'active'
    and coalesce(challenge_row.status, 'active') = 'active'
    and coalesce(challenge_row.completion_status, 'active') = 'active'
    and coalesce(challenge_row.is_expired, false) = false
    and coalesce(challenge_row.verification_frequency, '') = 'daily';
$function$;

CREATE OR REPLACE FUNCTION public.process_group_failures_enhanced()
 RETURNS TABLE(group_id uuid, group_name text, previous_status text, new_status text, failure_reason text, status_changed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH latest_status AS (
    SELECT t.id AS group_id,t.name AS group_name,t.status AS previous_status,
      COALESCE(gds.participation_rate, 1.0) AS participation_rate
    FROM public.teams t
    LEFT JOIN public.group_daily_status gds ON gds.group_id = t.id AND gds.local_date = CURRENT_DATE
    WHERE t.status IN ('active','failed')
  ), updates AS (
    UPDATE public.teams t
    SET status = CASE WHEN ls.previous_status='active' AND ls.participation_rate < 0.5 THEN 'failed' ELSE t.status END,
        updated_at = NOW()
    FROM latest_status ls
    WHERE ls.group_id = t.id
    RETURNING t.id, ls.group_name, ls.previous_status, t.status AS new_status, ls.participation_rate
  )
  SELECT u.id AS group_id,u.group_name,u.previous_status,u.new_status,
    CASE
      WHEN u.previous_status='active' AND u.new_status='failed'
      THEN format('Participation dropped below threshold (%.0f%% < 50%%)', u.participation_rate * 100)
      ELSE 'No status change'
    END AS failure_reason,
    (u.previous_status IS DISTINCT FROM u.new_status) AS status_changed
  FROM updates u;
END;
$function$;

CREATE OR REPLACE FUNCTION public.current_session_is_active()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select case
    when (select auth.role()) = 'service_role' then true
    when (select auth.uid()) is null then false
    when nullif((select auth.jwt() ->> 'session_id'), '') is null then false
    else exists (
      select 1
      from auth.sessions s
      where s.id::text = (select auth.jwt() ->> 'session_id')
        and s.user_id = (select auth.uid())
        and (s.not_after is null or s.not_after > now())
    )
  end;
$function$;

CREATE OR REPLACE FUNCTION private.event_attendance_json_v1(p_attendance event_attendances, p_checkin event_checkins DEFAULT NULL::event_checkins)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'attendanceId', p_attendance.id,
    'occurrenceId', p_attendance.occurrence_id,
    'state', p_attendance.state,
    'consentVersion', p_attendance.consent_version,
    'joinedAt', p_attendance.joined_at,
    'checkedInAt', case when p_checkin.id is null then null else p_checkin.checked_in_at end,
    'checkInMethod', case when p_checkin.id is null then null else p_checkin.method end
  );
$function$;

CREATE OR REPLACE FUNCTION private.event_post_json_v1(p_post event_posts, p_include_media_path boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'postId', p_post.id,
    'occurrenceId', p_post.occurrence_id,
    'status', p_post.status,
    'revision', p_post.revision,
    'caption', p_post.caption,
    'mediaPath', case when p_include_media_path then p_post.media_path else null end,
    'contentType', p_post.expected_content_type,
    'byteSize', p_post.expected_byte_size,
    'createdAt', p_post.created_at,
    'reviewedAt', p_post.reviewed_at,
    'reviewNote', p_post.review_note
  );
$function$;

CREATE OR REPLACE FUNCTION private.event_media_path_is_valid_v1(p_path text, p_user_id uuid, p_occurrence_id uuid, p_post_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.event_media_path_parts(p_path) as parts
    where parts.owner_id = p_user_id
      and parts.occurrence_id = p_occurrence_id
      and parts.post_id = p_post_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_my_profile()
 RETURNS TABLE(id uuid, email text, username text, display_name text, avatar_url text, momenta_balance integer, has_completed_onboarding boolean, created_at timestamp with time zone, updated_at timestamp with time zone, is_pro boolean, is_approved boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.email,
    p.username,
    p.display_name,
    p.avatar_url,
    p.momenta_balance,
    p.has_completed_onboarding,
    p.created_at,
    p.updated_at,
    p.is_pro,
    p.is_approved
  from public.profiles p
  where p.id = v_user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_set_user_approval(p_user_id uuid, p_approved boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Only allow service_role to execute
  if auth.role() <> 'service_role' then
    raise exception 'insufficient_privilege: service role required';
  end if;

  update public.users
  set is_approved = p_approved
  where id = p_user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_approved_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists(
    select 1 from public.users u
    where u.id = auth.uid() and coalesce(u.is_approved, false)
  );
$function$;

CREATE OR REPLACE FUNCTION private.first_full_streak_local_day_v1(p_boundary timestamp with time zone, p_effective_timezone text)
 RETURNS date
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select case
    when p_boundary is null then null::date
    when (p_boundary at time zone p_effective_timezone)::time = time '00:00:00'
      then (p_boundary at time zone p_effective_timezone)::date
    else (p_boundary at time zone p_effective_timezone)::date + 1
  end;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_streak_day_outcomes(p_user_id uuid, p_challenge_id uuid, p_through_local_day date DEFAULT NULL::date, p_effective_tz text DEFAULT NULL::text)
 RETURNS TABLE(resolved_count integer, missed_count integer, protected_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_participant public.challenge_participants%rowtype;
  v_challenge public.challenges%rowtype;
  v_effective_tz text;
  v_current_local_day date;
  v_start_day date;
  v_through_day date;
  v_challenge_end_day date;
  v_day date;
  v_previous_streak integer;
  v_resulting_streak integer;
  v_freeze_result jsonb;
  v_freeze_used boolean;
  v_freezes_remaining integer;
  v_resolved_count integer := 0;
  v_missed_count integer := 0;
  v_protected_count integer := 0;
begin
  if p_user_id is null or p_challenge_id is null then
    return query select 0, 0, 0;
    return;
  end if;

  select c.*
  into v_challenge
  from public.challenges c
  where c.id = p_challenge_id
    and coalesce(c.status, 'active') = 'active'
    and coalesce(c.completion_status, 'active') = 'active'
    and coalesce(c.is_expired, false) = false;

  if not found
    or coalesce(v_challenge.verification_frequency, '') <> 'daily'
  then
    return query select 0, 0, 0;
    return;
  end if;

  select cp.*
  into v_participant
  from public.challenge_participants cp
  where cp.user_id = p_user_id
    and cp.challenge_id = p_challenge_id
    and coalesce(cp.status, 'active') = 'active'
  for update;

  if not found then
    return query select 0, 0, 0;
    return;
  end if;

  if v_participant.streak_outcome_tracking_started_at is null then
    update public.challenge_participants cp
    set
      streak_outcome_tracking_started_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.now()
    where cp.id = v_participant.id
    returning cp.* into v_participant;

    return query select 0, 0, 0;
    return;
  end if;

  v_effective_tz := public.get_effective_streak_timezone(
    p_user_id,
    p_challenge_id,
    p_effective_tz
  );
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names timezone_name
    where timezone_name.name = v_effective_tz
  ) then
    v_effective_tz := 'UTC';
  end if;
  v_current_local_day := (pg_catalog.now() at time zone v_effective_tz)::date;
  v_through_day := least(
    coalesce(p_through_local_day, v_current_local_day - 1),
    v_current_local_day - 1
  );
  -- Each boundary day can be partial. Start with the first full local day
  -- after migration tracking, participant join, and challenge start.
  v_start_day := greatest(
    private.first_full_streak_local_day_v1(
      v_participant.streak_outcome_tracking_started_at,
      v_effective_tz
    ),
    private.first_full_streak_local_day_v1(
      v_participant.joined_at,
      v_effective_tz
    ),
    coalesce(
      private.first_full_streak_local_day_v1(
        v_challenge.start_date,
        v_effective_tz
      ),
      '-infinity'::date
    )
  );
  -- The calendar day containing an exact end instant can be partial. Resolve
  -- only through the last full local day before it.
  v_challenge_end_day := coalesce(
    (v_challenge.end_date at time zone v_effective_tz)::date - 1,
    'infinity'::date
  );
  v_through_day := least(v_through_day, v_challenge_end_day);

  if v_through_day < v_start_day then
    return query select 0, 0, 0;
    return;
  end if;

  -- Freeze inventory belongs to the user, not one promise. Serialise all
  -- promise-day resolutions for this user before reading or consuming it.
  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  ) then
    raise exception 'STREAK_RESOLUTION_BUSY';
  end if;

  for v_day in
    select day_value::date
    from pg_catalog.generate_series(
      v_start_day::timestamp,
      v_through_day::timestamp,
      interval '1 day'
    ) as day_value
    order by day_value
  loop
    if exists (
      select 1
      from public.streak_day_outcomes outcome_row
      where outcome_row.user_id = p_user_id
        and outcome_row.challenge_id = p_challenge_id
        and outcome_row.local_day = v_day
    ) then
      continue;
    end if;

    -- A pending proof is unresolved authority. Do not call it a miss and do
    -- not resolve later days out of order.
    if exists (
      select 1
      from public.challenge_submissions cs
      where cs.user_id = p_user_id
        and cs.challenge_id = p_challenge_id
        and cs.local_day = v_day
        and cs.status = 'pending'
    ) then
      exit;
    end if;

    if exists (
      select 1
      from public.challenge_submissions cs
      where cs.user_id = p_user_id
        and cs.challenge_id = p_challenge_id
        and cs.local_day = v_day
        and cs.status = 'approved'
    ) then
      -- The approved-proof helper applies accepted days. If that day is not
      -- reflected yet, stop rather than resolving later days against stale
      -- streak state.
      if v_participant.last_check_in_local_date is null
        or v_participant.last_check_in_local_date < v_day
      then
        exit;
      end if;
      continue;
    end if;

    v_previous_streak := greatest(
      coalesce(v_participant.current_streak, 0),
      0
    );
    v_freezes_remaining := public.get_available_streak_freezes(p_user_id);
    v_freeze_used := false;

    -- Only the first missed day after an accepted check-in is freeze-eligible.
    -- A second consecutive absence resets the streak even when more inventory
    -- exists, matching the existing gap contract.
    if v_previous_streak > 0
      and v_participant.last_check_in_local_date = v_day - 1
      and v_freezes_remaining > 0
    then
      v_freeze_result := public.use_streak_freeze_for_user(
        p_user_id,
        p_challenge_id
      );
      v_freeze_used := coalesce(
        (v_freeze_result ->> 'used')::boolean,
        false
      );
      v_freezes_remaining := coalesce(
        (v_freeze_result ->> 'remaining')::integer,
        public.get_available_streak_freezes(p_user_id)
      );
    end if;

    if v_freeze_used then
      v_resulting_streak := v_previous_streak;

      insert into public.streak_freeze_log (
        user_id,
        challenge_id,
        used_at,
        freeze_type,
        days_saved
      )
      values (
        p_user_id,
        p_challenge_id,
        pg_catalog.now() at time zone 'UTC',
        'auto',
        1
      );

      insert into public.streak_day_outcomes (
        user_id,
        challenge_id,
        local_day,
        effective_timezone,
        outcome,
        previous_streak,
        resulting_streak,
        freeze_used,
        freezes_remaining
      )
      values (
        p_user_id,
        p_challenge_id,
        v_day,
        v_effective_tz,
        'protected',
        v_previous_streak,
        v_resulting_streak,
        true,
        v_freezes_remaining
      );

      update public.challenge_participants cp
      set
        current_streak = v_resulting_streak,
        streak_count = v_resulting_streak,
        streak_freezes_remaining = v_freezes_remaining,
        last_freeze_used = pg_catalog.now(),
        at_risk = false,
        updated_at = pg_catalog.now()
      where cp.id = v_participant.id;

      v_protected_count := v_protected_count + 1;
    else
      v_resulting_streak := 0;
      v_freezes_remaining := public.get_available_streak_freezes(p_user_id);

      insert into public.streak_day_outcomes (
        user_id,
        challenge_id,
        local_day,
        effective_timezone,
        outcome,
        previous_streak,
        resulting_streak,
        freeze_used,
        freezes_remaining
      )
      values (
        p_user_id,
        p_challenge_id,
        v_day,
        v_effective_tz,
        'missed',
        v_previous_streak,
        v_resulting_streak,
        false,
        v_freezes_remaining
      );

      update public.challenge_participants cp
      set
        current_streak = 0,
        streak_count = 0,
        streak_freezes_remaining = v_freezes_remaining,
        at_risk = false,
        updated_at = pg_catalog.now()
      where cp.id = v_participant.id;

      if v_previous_streak > 0 then
        v_missed_count := v_missed_count + 1;
      end if;
    end if;

    v_resolved_count := v_resolved_count + 1;
    v_participant.current_streak := v_resulting_streak;
    v_participant.streak_count := v_resulting_streak;
    v_participant.streak_freezes_remaining := v_freezes_remaining;
  end loop;

  return query
  select v_resolved_count, v_missed_count, v_protected_count;
end;
$function$;

CREATE OR REPLACE FUNCTION private.lock_activation_profiles_v1(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_profile_id uuid;
begin
  -- Lock the referred profile and any pending inviter in UUID order. This
  -- prevents reciprocal referrals from deadlocking during simultaneous first
  -- promise creation.
  for v_profile_id in
    select profile.id
    from public.profiles profile
    where profile.id in (
      p_user_id,
      coalesce(
        (
          select referral.referrer_user_id
          from public.user_referrals referral
          where referral.referred_user_id = p_user_id
            and referral.status = 'pending'
            and referral.reward_outcome = 'pending_activation_v2'
          order by referral.created_at asc, referral.id asc
          limit 1
        ),
        p_user_id
      )
    )
    order by profile.id
    for update
  loop
    null;
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.use_power_up(p_user_id uuid, p_item_sku text, p_challenge_id uuid DEFAULT NULL::uuid, p_target_data jsonb DEFAULT NULL::jsonb, p_client_event_id uuid DEFAULT gen_random_uuid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  normalized_sku text := pg_catalog.lower(
    coalesce(pg_catalog.btrim(p_item_sku), '')
  );
  remaining_qty integer;
  remaining_freezes integer;
  extension_end_at timestamptz;
  existing_sku text;
  existing_challenge_id uuid;
  existing_payload jsonb;
  result_payload jsonb;
begin
  if p_user_id is null or normalized_sku = '' or p_client_event_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_REQUEST',
      'client_event_id', p_client_event_id
    );
  end if;

  if auth.uid() is null or auth.uid() <> p_user_id then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'client_event_id', p_client_event_id
    );
  end if;

  -- A freeze is held for the streak engine. Opening its explanation never
  -- consumes inventory or creates a fake activation receipt.
  if public.is_streak_freeze_sku(normalized_sku) then
    select public.get_available_streak_freezes(p_user_id)
    into remaining_freezes;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'client_event_id', p_client_event_id,
      'item_sku', normalized_sku,
      'message', 'A streak freeze is ready for the next eligible missed day.',
      'effect_type', 'streak_freeze_ready',
      'effects', pg_catalog.jsonb_build_object(
        'auto_consumed', true,
        'remaining', coalesce(remaining_freezes, 0)
      )
    );
  end if;

  if normalized_sku not in ('time_extension_1', 'booster_extension_12h') then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'UNSUPPORTED_POWER_UP',
      'client_event_id', p_client_event_id
    );
  end if;

  if p_challenge_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'CHALLENGE_REQUIRED',
      'client_event_id', p_client_event_id
    );
  end if;

  if not exists (
    select 1
    from public.challenges c
    join public.challenge_participants cp
      on cp.challenge_id = c.id
     and cp.user_id = p_user_id
     and cp.status = 'active'
    where c.id = p_challenge_id
      and c.status = 'active'
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'CHALLENGE_ACCESS_DENIED',
      'client_event_id', p_client_event_id
    );
  end if;

  -- Serialise identical request keys before checking the receipt. A retry can
  -- return the first result without consuming another inventory unit.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_user_id::text || ':' || p_client_event_id::text,
      0
    )
  );

  select usage.item_sku, usage.challenge_id, usage.result_payload
  into existing_sku, existing_challenge_id, existing_payload
  from public.power_up_usage usage
  where usage.user_id = p_user_id
    and usage.client_event_id = p_client_event_id
  limit 1;

  if existing_payload is not null then
    if pg_catalog.lower(existing_sku) <> normalized_sku
      or existing_challenge_id is distinct from p_challenge_id
    then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'error', 'IDEMPOTENCY_KEY_REUSED',
        'client_event_id', p_client_event_id
      );
    end if;

    return existing_payload;
  end if;

  update public.inventory_items
  set
    quantity = quantity - 1,
    updated_at = pg_catalog.now()
  where id = (
    select inventory.id
    from public.inventory_items inventory
    where inventory.user_id = p_user_id
      and pg_catalog.lower(inventory.item_sku) = normalized_sku
      and inventory.quantity > 0
    order by inventory.updated_at desc nulls last, inventory.created_at desc
    limit 1
    for update
  )
  returning quantity into remaining_qty;

  if remaining_qty is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'NO_INVENTORY',
      'client_event_id', p_client_event_id
    );
  end if;

  update public.challenges challenge
  set end_date = greatest(
    coalesce(challenge.end_date, pg_catalog.now()),
    pg_catalog.now()
  )
    + interval '12 hours'
  where challenge.id = p_challenge_id
    and challenge.status = 'active'
  returning challenge.end_date into extension_end_at;

  if extension_end_at is null then
    raise exception using
      errcode = 'P0001',
      message = 'CHALLENGE_NOT_EXTENDED';
  end if;

  result_payload := pg_catalog.jsonb_build_object(
    'success', true,
    'client_event_id', p_client_event_id,
    'item_sku', normalized_sku,
    'message', '12 hours were added to the selected promise.',
    'effect_type', 'deadline_extension_12h',
    'effects', pg_catalog.jsonb_build_object(
      'remaining', remaining_qty,
      'challenge_id', p_challenge_id,
      'expires_at', extension_end_at
    )
  );

  insert into public.power_up_usage (
    user_id,
    item_sku,
    challenge_id,
    client_event_id,
    used_at,
    expires_at,
    is_active,
    result_payload
  )
  values (
    p_user_id,
    normalized_sku,
    p_challenge_id,
    p_client_event_id,
    pg_catalog.now(),
    extension_end_at,
    false,
    result_payload
  );

  return result_payload;
end;
$function$;

CREATE OR REPLACE FUNCTION private.referral_config_boolean_v2(p_key text, p_fallback boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_value text;
begin
  select pg_catalog.lower(pg_catalog.btrim(config.value))
  into v_value
  from public.system_config config
  where config.key = p_key
  limit 1;

  if v_value in ('true', '1', 'yes', 'on') then
    return true;
  end if;

  if v_value in ('false', '0', 'no', 'off') then
    return false;
  end if;

  return p_fallback;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_accountability_group(p_name text, p_description text DEFAULT NULL::text, p_duration_days integer DEFAULT 30, p_cost integer DEFAULT 50, p_privacy text DEFAULT 'private'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  return public.create_group_with_payment(
    v_user_id,
    p_name,
    p_description,
    p_duration_days,
    p_cost,
    coalesce(nullif(p_privacy, ''), 'private')
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.check_power_up_inventory(p_user_id uuid, p_item_sku text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_qty integer;
begin
  select coalesce(sum(quantity),0) into v_qty from public.user_inventory
  where user_id = p_user_id and item_sku = p_item_sku;
  return jsonb_build_object('owned', v_qty > 0, 'remaining', v_qty);
end;$function$;

CREATE OR REPLACE FUNCTION public.join_accountability_group(p_invite_code text, p_cost integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  end if;

  return public.join_group_with_payment(
    v_user_id,
    p_invite_code,
    greatest(coalesce(p_cost, 0), 0)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.submit_content_report_v1(p_expected_reporter_id uuid, p_client_event_id uuid, p_target_type text, p_target_id uuid, p_reason text, p_facts jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_reporter_id uuid := auth.uid();
  v_target_type text := pg_catalog.lower(
    pg_catalog.btrim(coalesce(p_target_type, ''))
  );
  v_reason text := pg_catalog.lower(
    pg_catalog.btrim(coalesce(p_reason, ''))
  );
  v_unknown_key text;
  v_facts_hash text;
  v_existing_hash text;
  v_existing_payload jsonb;
  v_report_id uuid;
  v_report_status text;
  v_report_row public.content_reports%rowtype;
  v_received_at timestamptz := pg_catalog.now();
  v_target_visible boolean := false;
  v_target_facts_match boolean := false;
  v_attachment jsonb;
  v_result jsonb;
begin
  if v_reporter_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'AUTH_REQUIRED',
      'message', 'Sign in again before sending this report.'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'AUTH_SESSION_REVOKED',
      'message', 'Your session is no longer active. Sign in again before sending this report.'
    );
  end if;

  if p_expected_reporter_id is null
    or p_expected_reporter_id <> v_reporter_id
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'ACCOUNT_CHANGED',
      'message', 'The signed-in account changed before this report was sent.'
    );
  end if;

  if p_client_event_id is null
    or p_target_id is null
    or v_target_type not in ('verification', 'group', 'challenge', 'user')
    or v_reason not in (
      'spam',
      'inappropriate',
      'harassment',
      'copyright',
      'misleading',
      'other'
    )
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'INVALID_REPORT_REQUEST',
      'message', 'This report is missing a valid target or reason.'
    );
  end if;

  if p_facts is null
    or pg_catalog.jsonb_typeof(p_facts) <> 'object'
    or pg_catalog.octet_length(p_facts::text) > 32768
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'INVALID_REPORT_FACTS',
      'message', 'This report contains invalid or oversized details.'
    );
  end if;

  select key_name
  into v_unknown_key
  from pg_catalog.jsonb_object_keys(p_facts) as key_name
  where key_name not in (
    'title',
    'description',
    'observed_behavior',
    'expected_behavior',
    'steps_to_reproduce',
    'source',
    'report_kind',
    'challenge_id',
    'group_id',
    'submission_id',
    'target_user_id',
    'target_user_label',
    'context_label',
    'crash_reference',
    'attachments',
    'attachment_state',
    'snapshot_created_at',
    'report_draft_id'
  )
  limit 1;

  if v_unknown_key is not null
    or not (
      p_facts ?& array[
        'title',
        'description',
        'observed_behavior',
        'expected_behavior',
        'steps_to_reproduce',
        'source',
        'report_kind',
        'challenge_id',
        'group_id',
        'submission_id',
        'target_user_id',
        'target_user_label',
        'context_label',
        'crash_reference',
        'attachments',
        'attachment_state',
        'snapshot_created_at',
        'report_draft_id'
      ]
    )
    or pg_catalog.jsonb_typeof(p_facts -> 'title') <> 'string'
    or pg_catalog.length(pg_catalog.btrim(p_facts ->> 'title')) not between 1 and 200
    or pg_catalog.jsonb_typeof(p_facts -> 'description') <> 'string'
    or pg_catalog.length(pg_catalog.btrim(p_facts ->> 'description')) not between 1 and 1000
    or pg_catalog.jsonb_typeof(p_facts -> 'source') <> 'string'
    or pg_catalog.length(p_facts ->> 'source') not between 1 and 128
    or pg_catalog.jsonb_typeof(p_facts -> 'report_kind') <> 'string'
    or pg_catalog.jsonb_typeof(p_facts -> 'snapshot_created_at') <> 'string'
    or pg_catalog.length(p_facts ->> 'snapshot_created_at') not between 10 and 64
    or pg_catalog.jsonb_typeof(p_facts -> 'report_draft_id') <> 'string'
    or (p_facts ->> 'report_draft_id') <> p_client_event_id::text
    or pg_catalog.jsonb_typeof(p_facts -> 'attachments') <> 'array'
    or pg_catalog.jsonb_array_length(p_facts -> 'attachments') > 5
    or pg_catalog.jsonb_typeof(p_facts -> 'attachment_state') <> 'string'
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'INVALID_REPORT_FACTS',
      'message', 'This report contains invalid details.'
    );
  end if;

  if exists (
    select 1
    from (values
      ('observed_behavior', 1000),
      ('expected_behavior', 500),
      ('steps_to_reproduce', 1000),
      ('challenge_id', 64),
      ('group_id', 64),
      ('submission_id', 64),
      ('target_user_id', 64),
      ('target_user_label', 200),
      ('context_label', 300),
      ('crash_reference', 200)
    ) as optional_fact(key_name, max_length)
    where p_facts -> optional_fact.key_name <> 'null'::jsonb
      and (
        pg_catalog.jsonb_typeof(p_facts -> optional_fact.key_name) <> 'string'
        or pg_catalog.length(p_facts ->> optional_fact.key_name)
          > optional_fact.max_length
      )
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'INVALID_REPORT_FACTS',
      'message', 'This report contains invalid details.'
    );
  end if;

  for v_attachment in
    select value
    from pg_catalog.jsonb_array_elements(p_facts -> 'attachments')
  loop
    if pg_catalog.jsonb_typeof(v_attachment) <> 'object'
      or not (v_attachment ?& array['name', 'mime_type', 'size_bytes'])
      or exists (
        select 1
        from pg_catalog.jsonb_object_keys(v_attachment) as attachment_key
        where attachment_key not in ('name', 'mime_type', 'size_bytes')
      )
      or pg_catalog.jsonb_typeof(v_attachment -> 'name') <> 'string'
      or pg_catalog.length(v_attachment ->> 'name') not between 1 and 255
      or (
        v_attachment -> 'mime_type' <> 'null'::jsonb
        and (
          pg_catalog.jsonb_typeof(v_attachment -> 'mime_type') <> 'string'
          or pg_catalog.length(v_attachment ->> 'mime_type') > 127
        )
      )
      or (
        v_attachment -> 'size_bytes' <> 'null'::jsonb
        and (
          pg_catalog.jsonb_typeof(v_attachment -> 'size_bytes') <> 'number'
          or (v_attachment ->> 'size_bytes')::numeric < 0
          or (v_attachment ->> 'size_bytes')::numeric > 1073741824
        )
      )
    then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'outcome', 'not_sent',
        'code', 'INVALID_REPORT_FACTS',
        'message', 'This report contains invalid attachment details.'
      );
    end if;
  end loop;

  v_facts_hash := pg_catalog.encode(
    pg_catalog.sha256(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_object(
          'reporter_id', v_reporter_id,
          'client_event_id', p_client_event_id,
          'target_type', v_target_type,
          'target_id', p_target_id,
          'reason', v_reason,
          'facts', p_facts
        )::text,
        'UTF8'
      )
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_reporter_id::text || ':' || p_client_event_id::text,
      0
    )
  );

  select receipt.facts_hash, receipt.result_payload
  into v_existing_hash, v_existing_payload
  from private.content_report_submission_receipts_v1 receipt
  where receipt.reporter_id = v_reporter_id
    and receipt.client_event_id = p_client_event_id;

  if found then
    if v_existing_hash <> v_facts_hash then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'outcome', 'not_sent',
        'code', 'REQUEST_FACT_MISMATCH',
        'message', 'This saved report reference belongs to different report details.'
      );
    end if;

    return v_existing_payload
      || pg_catalog.jsonb_build_object('replayed', true);
  end if;

  if v_target_type = 'verification' then
    select
      (
        submission.user_id = v_reporter_id
        or exists (
          select 1
          from public.challenge_participants participant
          where participant.challenge_id = submission.challenge_id
            and participant.user_id = v_reporter_id
        )
      ),
      (
        p_facts ->> 'report_kind' = 'submission'
        and p_facts ->> 'submission_id' = submission.id::text
        and p_facts ->> 'challenge_id' = submission.challenge_id::text
        and (
          p_facts -> 'target_user_id' = 'null'::jsonb
          or p_facts ->> 'target_user_id' = submission.user_id::text
        )
        and (
          p_facts -> 'group_id' = 'null'::jsonb
          or exists (
            select 1
            from public.team_challenges linked
            where linked.challenge_id = submission.challenge_id
              and linked.group_id::text = p_facts ->> 'group_id'
          )
        )
      )
    into v_target_visible, v_target_facts_match
    from public.challenge_submissions submission
    where submission.id = p_target_id;
  elsif v_target_type = 'challenge' then
    select
      (
        challenge.is_public
        or challenge.creator_id = v_reporter_id
        or exists (
          select 1
          from public.challenge_participants participant
          where participant.challenge_id = challenge.id
            and participant.user_id = v_reporter_id
        )
      ),
      (
        p_facts ->> 'report_kind' = 'challenge'
        and p_facts ->> 'challenge_id' = challenge.id::text
        and p_facts -> 'submission_id' = 'null'::jsonb
        and (
          p_facts -> 'target_user_id' = 'null'::jsonb
          or p_facts ->> 'target_user_id' = challenge.creator_id::text
        )
      )
    into v_target_visible, v_target_facts_match
    from public.challenges challenge
    where challenge.id = p_target_id;
  elsif v_target_type = 'group' then
    select
      (
        target_group.privacy = 'public'
        or target_group.owner_id = v_reporter_id
        or exists (
          select 1
          from public.team_members membership
          where membership.group_id = target_group.id
            and membership.user_id = v_reporter_id
        )
      ),
      (
        p_facts ->> 'report_kind' = 'group'
        and p_facts ->> 'group_id' = target_group.id::text
        and p_facts -> 'submission_id' = 'null'::jsonb
        and (
          p_facts -> 'target_user_id' = 'null'::jsonb
          or p_facts ->> 'target_user_id' = target_group.owner_id::text
        )
      )
    into v_target_visible, v_target_facts_match
    from public.teams target_group
    where target_group.id = p_target_id;
  else
    select
      true,
      (
        p_facts ->> 'report_kind' = 'user'
        and p_facts ->> 'target_user_id' = target_profile.id::text
        and (
          p_facts -> 'group_id' = 'null'::jsonb
          or exists (
            select 1
            from public.teams target_group
            join public.team_members reporter_membership
              on reporter_membership.group_id = target_group.id
             and reporter_membership.user_id = v_reporter_id
            join public.team_members target_membership
              on target_membership.group_id = target_group.id
             and target_membership.user_id = target_profile.id
            where target_group.id::text = p_facts ->> 'group_id'
          )
        )
        and (
          p_facts -> 'challenge_id' = 'null'::jsonb
          or exists (
            select 1
            from public.challenges challenge
            where challenge.id::text = p_facts ->> 'challenge_id'
              and (
                challenge.is_public
                or challenge.creator_id = v_reporter_id
                or exists (
                  select 1
                  from public.challenge_participants reporter_participation
                  where reporter_participation.challenge_id = challenge.id
                    and reporter_participation.user_id = v_reporter_id
                )
              )
              and (
                challenge.creator_id = target_profile.id
                or exists (
                  select 1
                  from public.challenge_participants target_participation
                  where target_participation.challenge_id = challenge.id
                    and target_participation.user_id = target_profile.id
                )
              )
          )
        )
      )
    into v_target_visible, v_target_facts_match
    from public.profiles target_profile
    where target_profile.id = p_target_id
      and target_profile.id <> v_reporter_id;
  end if;

  if not coalesce(v_target_visible, false)
    or not coalesce(v_target_facts_match, false)
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'TARGET_NOT_AVAILABLE',
      'message', 'This content is no longer available to report from this account.'
    );
  end if;

  -- The authorised production project currently uses text columns while
  -- generated types and other replay variants can use enums. Populate the
  -- table row type from JSON so this additive migration is safe for both.
  select *
  into v_report_row
  from pg_catalog.jsonb_populate_record(
    null::public.content_reports,
    pg_catalog.jsonb_build_object(
      'target_type', v_target_type,
      'reason', v_reason,
      'status', 'open'
    )
  );

  insert into public.content_reports (
    reporter_id,
    target_type,
    target_id,
    reason,
    status,
    notes,
    created_at,
    updated_at
  ) values (
    v_reporter_id,
    v_report_row.target_type,
    p_target_id,
    v_report_row.reason,
    v_report_row.status,
    pg_catalog.jsonb_build_object(
      'format', 'content_report_v1',
      'facts', p_facts
    )::text,
    v_received_at,
    v_received_at
  )
  returning id, status::text
  into v_report_id, v_report_status;

  v_result := pg_catalog.jsonb_build_object(
    'success', true,
    'outcome', 'confirmed',
    'code', 'REPORT_RECEIVED',
    'reporter_id', v_reporter_id,
    'receipt_id', v_report_id,
    'status', v_report_status,
    'client_event_id', p_client_event_id,
    'received_at', v_received_at,
    'replayed', false
  );

  insert into private.content_report_submission_receipts_v1 (
    reporter_id,
    client_event_id,
    target_type,
    target_id,
    reason,
    immutable_facts,
    facts_hash,
    report_id,
    result_payload,
    received_at
  ) values (
    v_reporter_id,
    p_client_event_id,
    v_target_type,
    p_target_id,
    v_reason,
    p_facts,
    v_facts_hash,
    v_report_id,
    v_result,
    v_received_at
  );

  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.list_authorized_challenge_participants(p_challenge_id uuid)
 RETURNS TABLE(user_id uuid, username text, avatar_url text, current_streak integer, joined_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if p_challenge_id is null then
    raise exception 'CHALLENGE_REQUIRED' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.challenges c
    where c.id = p_challenge_id
      and (
        c.creator_id = v_user_id
        or exists (
          select 1
          from public.challenge_participants mine
          where mine.challenge_id = c.id
            and mine.user_id = v_user_id
            and coalesce(mine.status, 'active') = 'active'
        )
        or exists (
          select 1
          from public.team_challenges tc
          join public.team_members tm
            on tm.group_id = tc.group_id
          where tc.challenge_id = c.id
            and tm.user_id = v_user_id
        )
      )
  ) then
    raise exception 'CHALLENGE_PARTICIPANTS_FORBIDDEN'
      using errcode = '42501';
  end if;

  return query
  select
    cp.user_id,
    coalesce(p.username, p.display_name, 'Anonymous'),
    p.avatar_url,
    greatest(coalesce(cp.current_streak, 0), 0),
    cp.joined_at
  from public.challenge_participants cp
  join public.profiles p on p.id = cp.user_id
  where cp.challenge_id = p_challenge_id
    and coalesce(cp.status, 'active') = 'active'
  order by
    greatest(coalesce(cp.current_streak, 0), 0) desc,
    cp.joined_at asc,
    cp.user_id asc;
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_create_v1(p_actor_id uuid, p_client_event_id uuid, p_request_hash text, p_title text, p_description text, p_venue_name text, p_time_zone text, p_visibility menta_event_visibility, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_capacity integer, p_access_token text, p_access_token_hash text, p_checkin_token text, p_checkin_token_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_claim jsonb;
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_profile_exists boolean;
  v_time_zone_exists boolean;
  v_invite_id uuid;
  v_checkin_token_id uuid;
  v_published_at timestamptz := now();
begin
  if p_actor_id is null then
    return private.event_result_v1(
      'create_event',
      p_client_event_id,
      'failed',
      'AUTHENTICATION_REQUIRED',
      'Sign in before publishing an event.',
      null
    );
  end if;

  select exists (
    select 1
    from public.profiles as profile
    where profile.id = p_actor_id
  )
  into v_profile_exists;

  if not v_profile_exists then
    return private.event_result_v1(
      'create_event',
      p_client_event_id,
      'failed',
      'PROFILE_REQUIRED',
      'Finish account setup before publishing an event.',
      null
    );
  end if;

  v_claim := private.event_claim_receipt_v1(
    p_actor_id,
    'create_event',
    p_client_event_id,
    p_request_hash
  );
  if v_claim->>'kind' = 'cached' then
    return v_claim->'response';
  end if;
  if v_claim->>'kind' = 'mismatch' then
    return private.event_result_v1(
      'create_event',
      p_client_event_id,
      'failed',
      'IDEMPOTENCY_KEY_REUSED',
      'This request key was already used for different event details.',
      null
    );
  end if;
  if v_claim->>'kind' = 'invalid' then
    return private.event_result_v1(
      'create_event',
      p_client_event_id,
      'failed',
      'INVALID_REQUEST',
      'This event request is invalid.',
      null
    );
  end if;
  if v_claim->>'kind' = 'in_progress' then
    return private.event_result_v1(
      'create_event',
      p_client_event_id,
      'unknown_result',
      'REQUEST_IN_PROGRESS',
      'This event is still being published. Check again before retrying.',
      null,
      true
    );
  end if;

  select exists (
    select 1
    from pg_catalog.pg_timezone_names as zone
    where zone.name = p_time_zone
  )
  into v_time_zone_exists;

  if p_title is null
     or char_length(trim(p_title)) not between 1 and 120
     or (p_description is not null and char_length(p_description) > 500)
     or (p_venue_name is not null and char_length(p_venue_name) > 160)
     or p_time_zone is null
     or not v_time_zone_exists
     or p_visibility is null
     or p_starts_at is null
     or p_ends_at is null
     or p_starts_at <= now()
     or p_ends_at <= p_starts_at
     or p_ends_at > p_starts_at + interval '24 hours'
     or (p_capacity is not null and p_capacity not between 1 and 10000)
     or p_checkin_token is null
     or char_length(p_checkin_token) not between 16 and 512
     or p_checkin_token_hash is null
     or p_checkin_token_hash !~ '^[a-f0-9]{64}$'
     or (
       p_visibility = 'public'
       and (p_access_token is not null or p_access_token_hash is not null)
     )
     or (
       p_visibility <> 'public'
       and (
         p_access_token is null
         or char_length(p_access_token) not between 16 and 512
         or p_access_token_hash is null
         or p_access_token_hash !~ '^[a-f0-9]{64}$'
       )
     ) then
    return private.event_fail_action_v1(
      p_actor_id,
      'create_event',
      p_client_event_id,
      'INVALID_EVENT_DETAILS',
      'Check the event name, time, venue, visibility and capacity.'
    );
  end if;

  insert into public.event_events (
    organiser_id,
    title,
    description,
    venue_name,
    time_zone,
    visibility,
    share_token_hash,
    status
  )
  values (
    p_actor_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_venue_name, '')), ''),
    p_time_zone,
    p_visibility,
    case when p_visibility = 'unlisted' then p_access_token_hash else null end,
    'published'
  )
  returning * into v_event;

  insert into public.event_occurrences (
    event_id,
    starts_at,
    ends_at,
    state,
    capacity,
    consent_version,
    checkin_opens_at,
    checkin_closes_at,
    posting_opens_at,
    posting_closes_at
  )
  values (
    v_event.id,
    p_starts_at,
    p_ends_at,
    'scheduled',
    p_capacity,
    'event-attendance-v1',
    p_starts_at - interval '30 minutes',
    p_ends_at,
    p_starts_at,
    p_ends_at + interval '2 hours'
  )
  returning * into v_occurrence;

  if p_visibility = 'invite_only' then
    insert into public.event_invites (
      event_id,
      occurrence_id,
      token_hash,
      max_uses,
      expires_at,
      created_by
    )
    values (
      v_event.id,
      v_occurrence.id,
      p_access_token_hash,
      10000,
      p_ends_at,
      p_actor_id
    )
    returning id into v_invite_id;

    if v_invite_id is null then
      raise exception 'Could not create the event invitation capability';
    end if;
  end if;

  insert into public.event_checkin_tokens (
    occurrence_id,
    token_hash,
    kind,
    expires_at,
    created_by
  )
  values (
    v_occurrence.id,
    p_checkin_token_hash,
    'rotating_qr',
    p_ends_at,
    p_actor_id
  )
  returning id into v_checkin_token_id;

  if v_checkin_token_id is null then
    raise exception 'Could not create the organiser check-in capability';
  end if;

  perform private.event_audit_v1(
    v_event.id,
    v_occurrence.id,
    p_actor_id,
    'event.published',
    'event',
    v_event.id,
    jsonb_build_object(
      'visibility', v_event.visibility,
      'startsAt', v_occurrence.starts_at,
      'endsAt', v_occurrence.ends_at,
      'capacity', v_occurrence.capacity
    )
  );

  return private.event_complete_action_v1(
    p_actor_id,
    'create_event',
    p_client_event_id,
    'EVENT_PUBLISHED',
    'Your event is published.',
    jsonb_build_object(
      'summary', private.event_summary_json_v1(v_event, v_occurrence),
      'publishedAt', v_published_at,
      'shareToken', case when p_visibility = 'unlisted' then p_access_token else null end,
      'inviteToken', case when p_visibility = 'invite_only' then p_access_token else null end,
      'organiserCheckInCode', p_checkin_token,
      'checkInExpiresAt', v_occurrence.checkin_closes_at
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_safe_uuid(p_value text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case
    when p_value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then p_value::uuid
    else null
  end;
$function$;

CREATE OR REPLACE FUNCTION public.event_media_path_parts(p_path text)
 RETURNS TABLE(owner_id uuid, occurrence_id uuid, post_id uuid)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_parts text[];
  v_post_file text;
  v_post_uuid text;
  v_extension text;
begin
  if p_path is null then
    return;
  end if;

  -- Storage names are a canonical protocol, not a case-insensitive label.
  -- Reject uppercase UUIDs/extensions before any UUID cast or RLS join.
  if p_path <> pg_catalog.lower(p_path) then
    return;
  end if;

  v_parts := pg_catalog.string_to_array(p_path, '/');
  if coalesce(pg_catalog.array_length(v_parts, 1), 0) <> 4
     or v_parts[1] <> 'v1' then
    return;
  end if;

  v_post_file := v_parts[4];
  v_post_uuid := pg_catalog.split_part(v_post_file, '.', 1);
  v_extension := pg_catalog.split_part(v_post_file, '.', 2);
  if pg_catalog.split_part(v_post_file, '.', 3) <> ''
     or v_extension not in ('jpg', 'png', 'webp') then
    return;
  end if;

  owner_id := public.event_safe_uuid(v_parts[2]);
  occurrence_id := public.event_safe_uuid(v_parts[3]);
  post_id := public.event_safe_uuid(v_post_uuid);
  if owner_id is null or occurrence_id is null or post_id is null then
    return;
  end if;

  return next;
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_can_read_own_media_v1(p_path text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.event_media_path_parts(p_path) as path_parts
    join public.event_posts as post
      on post.id = path_parts.post_id
      and post.occurrence_id = path_parts.occurrence_id
      and post.user_id = path_parts.owner_id
      and post.media_path = p_path
    where path_parts.owner_id = (select auth.uid())
      and post.status <> 'deleted'
  );
$function$;

CREATE OR REPLACE FUNCTION private.event_result_v1(p_action text, p_client_event_id uuid, p_outcome text, p_code text, p_message text, p_data jsonb DEFAULT NULL::jsonb, p_retryable boolean DEFAULT false, p_idempotent boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'action', p_action,
    'outcome', p_outcome,
    'code', p_code,
    'message', p_message,
    'clientEventId', p_client_event_id,
    'data', p_data,
    'retryable', p_retryable,
    'idempotent', p_idempotent
  );
$function$;

CREATE OR REPLACE FUNCTION public.search_all(query_text text, limit_count integer DEFAULT 20, offset_count integer DEFAULT 0)
 RETURNS TABLE(type text, id uuid, title text, description text, rank real, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  RETURN QUERY
  (
    SELECT 
      'challenge'::text as type,
      c.id,
      c.title::text as title,
      c.description,
      ts_rank(c.search_vector, plainto_tsquery('english', query_text)) as rank,
      c.created_at
    FROM challenges c
    WHERE c.search_vector @@ plainto_tsquery('english', query_text)
      AND c.is_public = true
      AND c.status = 'active'
  )
  UNION ALL
  (
    SELECT 
      'group'::text as type,
      g.id,
      g.name as title,
      g.description,
      ts_rank(g.search_vector, plainto_tsquery('english', query_text)) as rank,
      g.created_at
    FROM groups g
    WHERE g.search_vector @@ plainto_tsquery('english', query_text)
      AND g.privacy IN ('public', 'members_only')
      AND g.status = 'active'
  )
  ORDER BY rank DESC, created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assert_submission_proof_media()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_key text := nullif(pg_catalog.btrim(coalesce(new.media_url, '')), '');
begin
  if new.submission_text is not null
    and pg_catalog.length(new.submission_text) > 10000
  then
    raise exception 'PROOF_TEXT_TOO_LONG' using errcode = '22001';
  end if;

  if new.media_type = 'text' then
    if v_key is not null then
      raise exception 'TEXT_PROOF_CANNOT_REFERENCE_MEDIA'
        using errcode = '22023';
    end if;
    return new;
  end if;

  if new.media_type not in ('photo', 'video') then
    raise exception 'INVALID_PROOF_MEDIA_TYPE' using errcode = '22023';
  end if;

  if v_key is null
    or pg_catalog.length(v_key) > 1024
    or pg_catalog.strpos(v_key, '://') > 0
    or pg_catalog.split_part(v_key, '/', 1) <> new.user_id::text
  then
    raise exception 'INVALID_PROOF_OBJECT_KEY' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'challenge-verifications'
      and o.name = v_key
      and o.owner_id = new.user_id::text
  ) then
    raise exception 'PROOF_OBJECT_NOT_OWNED' using errcode = '42501';
  end if;

  new.media_url := v_key;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.list_authorized_group_members(p_group_id uuid)
 RETURNS TABLE(user_id uuid, role text, joined_at timestamp with time zone, username text, display_name text, avatar_url text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if p_group_id is null then
    raise exception 'GROUP_REQUIRED' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.team_members mine
    where mine.group_id = p_group_id
      and mine.user_id = auth.uid()
  ) then
    raise exception 'GROUP_MEMBERSHIP_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    tm.user_id,
    tm.role,
    tm.joined_at,
    p.username,
    p.display_name,
    p.avatar_url
  from public.team_members tm
  join public.profiles p on p.id = tm.user_id
  where tm.group_id = p_group_id
  order by
    case tm.role
      when 'owner' then 0
      when 'admin' then 1
      when 'moderator' then 2
      else 3
    end,
    tm.joined_at,
    tm.user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_group_accountability_board(p_group_id uuid)
 RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, is_current_user boolean, submission_id uuid, submission_status text, media_type text, submitted_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if p_group_id is null then
    raise exception 'GROUP_REQUIRED' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.team_members mine
    where mine.group_id = p_group_id
      and mine.user_id = auth.uid()
  ) then
    raise exception 'GROUP_MEMBERSHIP_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    tm.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    tm.user_id = auth.uid(),
    latest_submission.id,
    latest_submission.status,
    latest_submission.media_type::text,
    latest_submission.submission_date
  from public.team_members tm
  join public.profiles p on p.id = tm.user_id
  left join lateral (
    select cs.id, cs.status, cs.media_type, cs.submission_date
    from public.team_challenges tc
    join public.challenges ch
      on ch.id = tc.challenge_id
    join public.challenge_participants cp
      on cp.challenge_id = tc.challenge_id
     and cp.user_id = tm.user_id
     and coalesce(cp.status, 'active') = 'active'
    join public.challenge_submissions cs
      on cs.challenge_id = tc.challenge_id
     and cs.user_id = tm.user_id
    where tc.group_id = p_group_id
      and coalesce(ch.status, 'active') = 'active'
      and coalesce(ch.completion_status, 'active') = 'active'
      and coalesce(ch.is_expired, false) = false
      and (ch.start_date is null or ch.start_date <= now())
      and (ch.end_date is null or ch.end_date >= now())
      and cs.local_day = (now() at time zone ch.streak_timezone)::date
      and cs.status in ('pending', 'approved', 'rejected')
    order by cs.submission_date desc nulls last, cs.id desc
    limit 1
  ) latest_submission on true
  where tm.group_id = p_group_id
  order by
    (tm.user_id = auth.uid()),
    tm.joined_at,
    tm.user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_my_profile(p_patch jsonb)
 RETURNS TABLE(id uuid, email text, username text, display_name text, avatar_url text, momenta_balance integer, has_completed_onboarding boolean, created_at timestamp with time zone, updated_at timestamp with time zone, is_pro boolean, is_approved boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_unknown_key text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if p_patch is null or pg_catalog.jsonb_typeof(p_patch) <> 'object' then
    raise exception 'PROFILE_PATCH_OBJECT_REQUIRED' using errcode = '22023';
  end if;

  select k
  into v_unknown_key
  from pg_catalog.jsonb_object_keys(p_patch) k
  where k not in (
    'username',
    'display_name',
    'avatar_url',
    'has_completed_onboarding'
  )
  limit 1;

  if v_unknown_key is not null then
    raise exception 'PROFILE_FIELD_NOT_USER_EDITABLE: %', v_unknown_key
      using errcode = '42501';
  end if;

  if p_patch ? 'username' then
    if p_patch -> 'username' = 'null'::jsonb
      or pg_catalog.jsonb_typeof(p_patch -> 'username') <> 'string'
      or pg_catalog.length(pg_catalog.btrim(p_patch ->> 'username')) not between 3 and 40
    then
      raise exception 'INVALID_USERNAME' using errcode = '22023';
    end if;
  end if;

  if p_patch ? 'display_name'
    and p_patch -> 'display_name' <> 'null'::jsonb
    and (
      pg_catalog.jsonb_typeof(p_patch -> 'display_name') <> 'string'
      or pg_catalog.length(pg_catalog.btrim(p_patch ->> 'display_name')) > 100
    )
  then
    raise exception 'INVALID_DISPLAY_NAME' using errcode = '22023';
  end if;

  if p_patch ? 'avatar_url'
    and p_patch -> 'avatar_url' <> 'null'::jsonb
    and (
      pg_catalog.jsonb_typeof(p_patch -> 'avatar_url') <> 'string'
      or pg_catalog.length(p_patch ->> 'avatar_url') > 2048
    )
  then
    raise exception 'INVALID_AVATAR_URL' using errcode = '22023';
  end if;

  if p_patch ? 'has_completed_onboarding'
    and pg_catalog.jsonb_typeof(p_patch -> 'has_completed_onboarding') <> 'boolean'
  then
    raise exception 'INVALID_ONBOARDING_STATE' using errcode = '22023';
  end if;

  return query
  update public.profiles p
  set
    username = case
      when p_patch ? 'username'
        then pg_catalog.btrim(p_patch ->> 'username')
      else p.username
    end,
    display_name = case
      when p_patch ? 'display_name'
        then nullif(pg_catalog.btrim(p_patch ->> 'display_name'), '')
      else p.display_name
    end,
    avatar_url = case
      when p_patch ? 'avatar_url'
        then nullif(pg_catalog.btrim(p_patch ->> 'avatar_url'), '')
      else p.avatar_url
    end,
    has_completed_onboarding = case
      when p_patch ? 'has_completed_onboarding'
        then (p_patch ->> 'has_completed_onboarding')::boolean
      else p.has_completed_onboarding
    end,
    updated_at = now()
  where p.id = v_user_id
  returning
    p.id,
    p.email,
    p.username,
    p.display_name,
    p.avatar_url,
    p.momenta_balance,
    p.has_completed_onboarding,
    p.created_at,
    p.updated_at,
    p.is_pro,
    p.is_approved;

  if not found then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_today_pending_reviews(p_timezone text)
 RETURNS TABLE(review_id uuid, challenge_id uuid, challenge_title text, group_id uuid, group_name text, submitter_name text, submitted_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  return query
  select distinct on (submission.id)
    submission.id,
    challenge.id,
    challenge.title::text,
    team.id,
    team.name::text,
    coalesce(profile.display_name, profile.username, 'A member')::text,
    submission.submission_date
  from public.team_members reviewer_membership
  join public.teams team on team.id = reviewer_membership.group_id
  join public.team_challenges link on link.group_id = team.id
  join public.challenges challenge on challenge.id = link.challenge_id
  join public.challenge_submissions submission
    on submission.challenge_id = challenge.id
  join public.profiles profile on profile.id = submission.user_id
  join public.team_members submitter_membership
    on submitter_membership.group_id = team.id
   and submitter_membership.user_id = submission.user_id
  left join private.promise_accountability_members scoped_reviewer
    on scoped_reviewer.challenge_id = challenge.id
   and scoped_reviewer.user_id = v_user_id
  where reviewer_membership.user_id = v_user_id
    and submission.user_id <> v_user_id
    and submission.status = 'pending'
    and submission.local_day = (
      now() at time zone coalesce(
        nullif(challenge.streak_timezone, ''),
        nullif(p_timezone, ''),
        'UTC'
      )
    )::date
    and coalesce(team.status, 'active') = 'active'
    and coalesce(challenge.status, 'active') = 'active'
    and coalesce(challenge.completion_status, 'active') = 'active'
    and coalesce(scoped_reviewer.role, 'reviewer') <> 'supporter'
  order by submission.id, submission.submission_date asc;
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_get_event_summary_v1(p_event_id uuid, p_share_token_hash text DEFAULT NULL::text, p_invite_token_hash text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_invite_id uuid;
begin
  select *
  into v_event
  from public.event_events
  where id = p_event_id;

  if not found or v_event.status <> 'published' then
    return private.event_result_v1(
      'get_event_summary',
      null,
      'failed',
      'EVENT_UNAVAILABLE',
      'This event is not available.',
      null
    );
  end if;

  select *
  into v_occurrence
  from public.event_occurrences
  where event_id = v_event.id
    and state in ('scheduled', 'live')
  order by starts_at asc
  limit 1;

  if not found then
    return private.event_result_v1(
      'get_event_summary',
      null,
      'failed',
      'OCCURRENCE_UNAVAILABLE',
      'This event has no available occurrence.',
      null
    );
  end if;

  if v_event.visibility = 'unlisted'
     and (
       p_share_token_hash is null
       or p_share_token_hash <> v_event.share_token_hash
     ) then
    return private.event_result_v1(
      'get_event_summary',
      null,
      'failed',
      'ACCESS_CAPABILITY_REQUIRED',
      'This unlisted event needs its private link.',
      null
    );
  end if;

  if v_event.visibility = 'invite_only' then
    select id
    into v_invite_id
    from public.event_invites
    where event_id = v_event.id
      and token_hash = p_invite_token_hash
      and revoked_at is null
      and (expires_at is null or expires_at > now())
      and (occurrence_id is null or occurrence_id = v_occurrence.id)
    limit 1;

    if v_invite_id is null then
      return private.event_result_v1(
        'get_event_summary',
        null,
        'failed',
        'INVITE_REQUIRED',
        'This private event needs a valid invitation.',
        null
      );
    end if;
  end if;

  return private.event_result_v1(
    'get_event_summary',
    null,
    'completed',
    'EVENT_SUMMARY_READY',
    'Event summary confirmed.',
    private.event_summary_json_v1(v_event, v_occurrence)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_join_v1(p_actor_id uuid, p_occurrence_id uuid, p_client_event_id uuid, p_request_hash text, p_consent_version text, p_share_token_hash text DEFAULT NULL::text, p_invite_token_hash text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_claim jsonb;
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_attendance public.event_attendances%rowtype;
  v_invite public.event_invites%rowtype;
  v_updated_attendance public.event_attendances%rowtype;
  v_updated_reserved_count integer;
  v_updated_invite_id uuid;
  v_checkin public.event_checkins%rowtype;
begin
  v_claim := private.event_claim_receipt_v1(
    p_actor_id,
    'join',
    p_client_event_id,
    p_request_hash
  );
  if v_claim->>'kind' = 'cached' then
    return v_claim->'response';
  end if;
  if v_claim->>'kind' = 'mismatch' then
    return private.event_result_v1(
      'join',
      p_client_event_id,
      'failed',
      'IDEMPOTENCY_KEY_REUSED',
      'This request key was already used for different event details.',
      null
    );
  end if;
  if v_claim->>'kind' = 'invalid' then
    return private.event_result_v1(
      'join',
      p_client_event_id,
      'failed',
      'INVALID_REQUEST',
      'This join request is invalid.',
      null
    );
  end if;
  if v_claim->>'kind' = 'in_progress' then
    return private.event_result_v1(
      'join',
      p_client_event_id,
      'unknown_result',
      'REQUEST_IN_PROGRESS',
      'This join is still being confirmed. Check again before retrying.',
      null,
      true
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('event-occurrence:' || p_occurrence_id::text, 0)
  );

  select *
  into v_occurrence
  from public.event_occurrences
  where id = p_occurrence_id
  for update;

  if not found
  then
    return private.event_fail_action_v1(
      p_actor_id,
      'join',
      p_client_event_id,
      'OCCURRENCE_UNAVAILABLE',
      'This event occurrence can no longer be joined.'
    );
  end if;

  select *
  into v_event
  from public.event_events
  where id = v_occurrence.event_id;

  if not found
     or v_event.status <> 'published'
     or v_occurrence.state not in ('scheduled', 'live')
     or v_occurrence.ends_at <= now() then
    return private.event_fail_action_v1(
      p_actor_id,
      'join',
      p_client_event_id,
      'OCCURRENCE_UNAVAILABLE',
      'This event occurrence can no longer be joined.'
    );
  end if;

  select *
  into v_attendance
  from public.event_attendances
  where occurrence_id = v_occurrence.id
    and user_id = p_actor_id
  for update;

  if found and v_attendance.state = 'joined' then
    select *
    into v_checkin
    from public.event_checkins
    where attendance_id = v_attendance.id
      and revoked_at is null;

    return private.event_complete_action_v1(
      p_actor_id,
      'join',
      p_client_event_id,
      'ALREADY_JOINED',
      'You are already joined to this event.',
      private.event_attendance_json_v1(v_attendance, v_checkin)
    );
  end if;

  -- Existing attendance is idempotent without consuming an invite or asking
  -- for a new consent version. A real rejoin below still requires consent.
  if p_consent_version is null
     or p_consent_version <> v_occurrence.consent_version then
    return private.event_fail_action_v1(
      p_actor_id,
      'join',
      p_client_event_id,
      'CONSENT_REQUIRED',
      'Accept the current event participation terms before joining.'
    );
  end if;

  if v_event.visibility = 'unlisted'
     and (
       p_share_token_hash is null
       or p_share_token_hash <> v_event.share_token_hash
     ) then
    return private.event_fail_action_v1(
      p_actor_id,
      'join',
      p_client_event_id,
      'ACCESS_CAPABILITY_REQUIRED',
      'This unlisted event needs its private link.'
    );
  end if;

  if v_event.visibility = 'invite_only' then
    select *
    into v_invite
    from public.event_invites
    where event_id = v_event.id
      and token_hash = p_invite_token_hash
    for update;

    if not found
       or v_invite.revoked_at is not null
       or (v_invite.expires_at is not null and v_invite.expires_at <= now())
       or (v_invite.occurrence_id is not null and v_invite.occurrence_id <> v_occurrence.id)
       or (v_invite.issued_to_user_id is not null and v_invite.issued_to_user_id <> p_actor_id)
       or v_invite.use_count >= v_invite.max_uses then
      return private.event_fail_action_v1(
        p_actor_id,
        'join',
        p_client_event_id,
        'INVITE_UNAVAILABLE',
        'This invitation is no longer valid for this event.'
      );
    end if;
  end if;

  if v_occurrence.capacity is not null
     and v_occurrence.reserved_count >= v_occurrence.capacity then
    return private.event_fail_action_v1(
      p_actor_id,
      'join',
      p_client_event_id,
      'EVENT_FULL',
      'This event is at capacity.'
    );
  end if;

  if v_event.visibility = 'invite_only' then
    update public.event_invites
    set use_count = use_count + 1
    where id = v_invite.id
      and use_count < max_uses
      and revoked_at is null
    returning id into v_updated_invite_id;

    if v_updated_invite_id is null then
      raise exception 'Invite consumption was not confirmed';
    end if;
  end if;

  update public.event_occurrences
  set
    reserved_count = reserved_count + 1,
    updated_at = now()
  where id = v_occurrence.id
    and (capacity is null or reserved_count < capacity)
  returning reserved_count into v_updated_reserved_count;

  if v_updated_reserved_count is null then
    raise exception 'Capacity reservation was not confirmed';
  end if;

  if v_attendance.id is null then
    insert into public.event_attendances (
      occurrence_id,
      user_id,
      state,
      consent_version,
      consented_at,
      joined_at
    )
    values (
      v_occurrence.id,
      p_actor_id,
      'joined',
      p_consent_version,
      now(),
      now()
    )
    returning * into v_updated_attendance;
  else
    update public.event_attendances
    set
      state = 'joined',
      consent_version = p_consent_version,
      consented_at = now(),
      joined_at = now(),
      left_at = null,
      updated_at = now()
    where id = v_attendance.id
      and state <> 'joined'
    returning * into v_updated_attendance;
  end if;

  if v_updated_attendance.id is null then
    raise exception 'Attendance reservation was not confirmed';
  end if;

  perform private.event_audit_v1(
    v_event.id,
    v_occurrence.id,
    p_actor_id,
    'event.joined',
    'event_attendance',
    v_updated_attendance.id,
    jsonb_build_object('reservedCount', v_updated_reserved_count)
  );

  return private.event_complete_action_v1(
    p_actor_id,
    'join',
    p_client_event_id,
    'JOINED',
    'You are joined to this event.',
    private.event_attendance_json_v1(v_updated_attendance, null)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_list_public_summaries_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_summaries jsonb;
begin
  select coalesce(jsonb_agg(public_event.summary order by public_event.starts_at), '[]'::jsonb)
  into v_summaries
  from (
    select
      private.event_summary_json_v1(event_row, occurrence_row) as summary,
      occurrence_row.starts_at
    from public.event_events as event_row
    cross join lateral (
      select occurrence.*
      from public.event_occurrences as occurrence
      where occurrence.event_id = event_row.id
        and occurrence.state in ('scheduled', 'live')
        and occurrence.ends_at > now()
      order by occurrence.starts_at asc
      limit 1
    ) as occurrence_row
    where event_row.status = 'published'
      and event_row.visibility = 'public'
    order by occurrence_row.starts_at asc
    limit 50
  ) as public_event;

  return private.event_result_v1(
    'list_public_events',
    null,
    'completed',
    'PUBLIC_EVENTS_READY',
    'Public events are ready.',
    v_summaries
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.event_occurrence_state_at_v1(p_current_state menta_event_occurrence_state, p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_at timestamp with time zone)
 RETURNS menta_event_occurrence_state
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select case
    when p_current_state = 'cancelled'
      then 'cancelled'::public.menta_event_occurrence_state
    when p_current_state = 'ended'
      then 'ended'::public.menta_event_occurrence_state
    when p_ends_at <= p_at
      then 'ended'::public.menta_event_occurrence_state
    when p_current_state = 'live' or p_starts_at <= p_at
      then 'live'::public.menta_event_occurrence_state
    else 'scheduled'::public.menta_event_occurrence_state
  end;
$function$;

CREATE OR REPLACE FUNCTION public.event_leave_v1(p_actor_id uuid, p_occurrence_id uuid, p_client_event_id uuid, p_request_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_claim jsonb;
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_attendance public.event_attendances%rowtype;
  v_updated_attendance public.event_attendances%rowtype;
  v_reserved_count integer;
begin
  v_claim := private.event_claim_receipt_v1(
    p_actor_id,
    'leave',
    p_client_event_id,
    p_request_hash
  );
  if v_claim->>'kind' = 'cached' then
    return v_claim->'response';
  end if;
  if v_claim->>'kind' = 'mismatch' then
    return private.event_result_v1('leave', p_client_event_id, 'failed', 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for different event details.', null);
  end if;
  if v_claim->>'kind' = 'invalid' then
    return private.event_result_v1('leave', p_client_event_id, 'failed', 'INVALID_REQUEST', 'This leave request is invalid.', null);
  end if;
  if v_claim->>'kind' = 'in_progress' then
    return private.event_result_v1('leave', p_client_event_id, 'unknown_result', 'REQUEST_IN_PROGRESS', 'This leave is still being confirmed. Check again before retrying.', null, true);
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('event-occurrence:' || p_occurrence_id::text, 0)
  );

  select *
  into v_occurrence
  from public.event_occurrences
  where id = p_occurrence_id
  for update;

  if not found then
    return private.event_fail_action_v1(p_actor_id, 'leave', p_client_event_id, 'OCCURRENCE_UNAVAILABLE', 'This event occurrence is not available.');
  end if;

  select *
  into v_event
  from public.event_events
  where id = v_occurrence.event_id;

  if not found then
    raise exception 'Occurrence event was not found';
  end if;

  select *
  into v_attendance
  from public.event_attendances
  where occurrence_id = v_occurrence.id
    and user_id = p_actor_id
  for update;

  if not found then
    return private.event_fail_action_v1(p_actor_id, 'leave', p_client_event_id, 'NOT_JOINED', 'You are not joined to this event.');
  end if;

  if v_attendance.state <> 'joined' then
    return private.event_complete_action_v1(
      p_actor_id,
      'leave',
      p_client_event_id,
      'ALREADY_LEFT',
      'You have already left this event.',
      private.event_attendance_json_v1(v_attendance, null)
    );
  end if;

  update public.event_attendances
  set
    state = 'left',
    left_at = now(),
    updated_at = now()
  where id = v_attendance.id
    and state = 'joined'
  returning * into v_updated_attendance;

  if v_updated_attendance.id is null then
    raise exception 'Attendance leave was not confirmed';
  end if;

  update public.event_occurrences
  set
    reserved_count = reserved_count - 1,
    updated_at = now()
  where id = v_occurrence.id
    and reserved_count > 0
  returning reserved_count into v_reserved_count;

  if v_reserved_count is null then
    raise exception 'Capacity release was not confirmed';
  end if;

  perform private.event_audit_v1(
    v_event.id,
    v_occurrence.id,
    p_actor_id,
    'event.left',
    'event_attendance',
    v_updated_attendance.id,
    jsonb_build_object('reservedCount', v_reserved_count)
  );

  return private.event_complete_action_v1(
    p_actor_id,
    'leave',
    p_client_event_id,
    'LEFT',
    'You left this event.',
    private.event_attendance_json_v1(v_updated_attendance, null)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_redeem_checkin_v1(p_actor_id uuid, p_occurrence_id uuid, p_client_event_id uuid, p_request_hash text, p_token_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_claim jsonb;
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_attendance public.event_attendances%rowtype;
  v_token public.event_checkin_tokens%rowtype;
  v_checkin public.event_checkins%rowtype;
  v_redemption_id uuid;
  v_consumed_token_id uuid;
  v_created_checkin public.event_checkins%rowtype;
  v_updated_attendance public.event_attendances%rowtype;
begin
  v_claim := private.event_claim_receipt_v1(
    p_actor_id,
    'check_in',
    p_client_event_id,
    p_request_hash
  );
  if v_claim->>'kind' = 'cached' then
    return v_claim->'response';
  end if;
  if v_claim->>'kind' = 'mismatch' then
    return private.event_result_v1('check_in', p_client_event_id, 'failed', 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for different check-in details.', null);
  end if;
  if v_claim->>'kind' = 'invalid' or p_token_hash !~ '^[a-f0-9]{64}$' then
    return private.event_result_v1('check_in', p_client_event_id, 'failed', 'INVALID_REQUEST', 'This check-in request is invalid.', null);
  end if;
  if v_claim->>'kind' = 'in_progress' then
    return private.event_result_v1('check_in', p_client_event_id, 'unknown_result', 'REQUEST_IN_PROGRESS', 'This check-in is still being confirmed. Check again before retrying.', null, true);
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('event-occurrence:' || p_occurrence_id::text, 0)
  );

  select *
  into v_occurrence
  from public.event_occurrences
  where id = p_occurrence_id
  for update;

  if not found
  then
    return private.event_fail_action_v1(p_actor_id, 'check_in', p_client_event_id, 'CHECKIN_UNAVAILABLE', 'Check-in is not open for this event.');
  end if;

  select *
  into v_event
  from public.event_events
  where id = v_occurrence.event_id;

  if not found
     or v_event.status <> 'published'
     or v_occurrence.state not in ('scheduled', 'live')
     or now() < v_occurrence.checkin_opens_at
     or now() > v_occurrence.checkin_closes_at then
    return private.event_fail_action_v1(p_actor_id, 'check_in', p_client_event_id, 'CHECKIN_UNAVAILABLE', 'Check-in is not open for this event.');
  end if;

  select *
  into v_attendance
  from public.event_attendances
  where occurrence_id = v_occurrence.id
    and user_id = p_actor_id
    and state = 'joined'
  for update;

  if not found then
    return private.event_fail_action_v1(p_actor_id, 'check_in', p_client_event_id, 'NOT_JOINED', 'Join this event before checking in.');
  end if;

  select *
  into v_token
  from public.event_checkin_tokens
  where occurrence_id = v_occurrence.id
    and token_hash = p_token_hash
  for update;

  if not found
     or v_token.revoked_at is not null
     or v_token.expires_at <= now() then
    return private.event_fail_action_v1(p_actor_id, 'check_in', p_client_event_id, 'TOKEN_UNAVAILABLE', 'This check-in token is expired or invalid.');
  end if;

  select *
  into v_checkin
  from public.event_checkins
  where attendance_id = v_attendance.id
    and revoked_at is null;

  if found then
    return private.event_complete_action_v1(
      p_actor_id,
      'check_in',
      p_client_event_id,
      'ALREADY_CHECKED_IN',
      'You are already checked in.',
      jsonb_build_object(
        'attendance', private.event_attendance_json_v1(v_attendance, v_checkin),
        'checkInId', v_checkin.id,
        'checkedInAt', v_checkin.checked_in_at,
        'method', v_checkin.method
      )
    );
  end if;

  if v_token.kind = 'rotating_qr' then
    insert into public.event_checkin_token_redemptions (
      token_id,
      user_id,
      attendance_id
    )
    values (
      v_token.id,
      p_actor_id,
      v_attendance.id
    )
    on conflict (token_id, user_id) do nothing
    returning id into v_redemption_id;

    if v_redemption_id is null then
      raise exception 'Rotating QR redemption was not confirmed';
    end if;
  else
    if v_token.issued_to_user_id <> p_actor_id then
      return private.event_fail_action_v1(p_actor_id, 'check_in', p_client_event_id, 'TOKEN_NOT_ISSUED_TO_USER', 'This roster token belongs to another attendee.');
    end if;

    update public.event_checkin_tokens
    set
      consumed_at = now(),
      consumed_by = p_actor_id
    where id = v_token.id
      and kind = 'roster_single_use'
      and consumed_at is null
      and revoked_at is null
      and expires_at > now()
      and occurrence_id = v_occurrence.id
    returning id into v_consumed_token_id;

    if v_consumed_token_id is null then
      return private.event_fail_action_v1(p_actor_id, 'check_in', p_client_event_id, 'TOKEN_ALREADY_CONSUMED', 'This roster token has already been used.');
    end if;
  end if;

  insert into public.event_checkins (
    attendance_id,
    token_id,
    method
  )
  values (
    v_attendance.id,
    v_token.id,
    v_token.kind
  )
  returning * into v_created_checkin;

  if v_created_checkin.id is null then
    raise exception 'Check-in creation was not confirmed';
  end if;

  update public.event_attendances
  set
    checkin_id = v_created_checkin.id,
    updated_at = now()
  where id = v_attendance.id
  returning * into v_updated_attendance;

  if v_updated_attendance.id is null then
    raise exception 'Attendance check-in receipt was not confirmed';
  end if;

  perform private.event_audit_v1(
    v_event.id,
    v_occurrence.id,
    p_actor_id,
    'event.checked_in',
    'event_checkin',
    v_created_checkin.id,
    jsonb_build_object('method', v_token.kind)
  );

  return private.event_complete_action_v1(
    p_actor_id,
    'check_in',
    p_client_event_id,
    'CHECKED_IN',
    'Your event check-in is confirmed.',
    jsonb_build_object(
      'attendance', private.event_attendance_json_v1(v_updated_attendance, v_created_checkin),
      'checkInId', v_created_checkin.id,
      'checkedInAt', v_created_checkin.checked_in_at,
      'method', v_created_checkin.method
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_finalise_post_v1(p_actor_id uuid, p_post_id uuid, p_client_event_id uuid, p_request_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_claim jsonb;
  v_post public.event_posts%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_event public.event_events%rowtype;
  v_metadata jsonb;
  v_media_type text;
  v_media_size_text text;
  v_media_size bigint;
  v_updated_post public.event_posts%rowtype;
begin
  v_claim := private.event_claim_receipt_v1(
    p_actor_id,
    'finalise_post',
    p_client_event_id,
    p_request_hash
  );
  if v_claim->>'kind' = 'cached' then
    return v_claim->'response';
  end if;
  if v_claim->>'kind' = 'mismatch' then
    return private.event_result_v1('finalise_post', p_client_event_id, 'failed', 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for different post details.', null);
  end if;
  if v_claim->>'kind' = 'invalid' then
    return private.event_result_v1('finalise_post', p_client_event_id, 'failed', 'INVALID_REQUEST', 'This post finalisation request is invalid.', null);
  end if;
  if v_claim->>'kind' = 'in_progress' then
    return private.event_result_v1('finalise_post', p_client_event_id, 'unknown_result', 'REQUEST_IN_PROGRESS', 'This post is still being confirmed. Check again before retrying.', null, true);
  end if;

  select *
  into v_post
  from public.event_posts
  where id = p_post_id
    and user_id = p_actor_id
  for update;

  if not found then
    return private.event_fail_action_v1(p_actor_id, 'finalise_post', p_client_event_id, 'POST_UNAVAILABLE', 'This event post is not available.');
  end if;

  select *
  into v_occurrence
  from public.event_occurrences
  where id = v_post.occurrence_id;

  if not found then
    raise exception 'Post occurrence was not found';
  end if;

  select *
  into v_event
  from public.event_events
  where id = v_occurrence.event_id;

  if not found then
    raise exception 'Post event was not found';
  end if;

  if v_post.status in ('pending_review', 'approved', 'rejected') then
    return private.event_complete_action_v1(
      p_actor_id,
      'finalise_post',
      p_client_event_id,
      'POST_ALREADY_FINALISED',
      'This event post already has a server receipt.',
      jsonb_build_object('post', private.event_post_json_v1(v_post, true))
    );
  end if;

  if v_post.status <> 'upload_pending'
     or v_post.media_path is null
     or not private.event_media_path_is_valid_v1(
       v_post.media_path,
       p_actor_id,
       v_post.occurrence_id,
       v_post.id
     ) then
    raise exception 'Post finalisation rejected an invalid server media path';
  end if;

  select metadata
  into v_metadata
  from storage.objects
  where bucket_id = 'event-media'
    and name = v_post.media_path
  for share;

  if not found then
    return private.event_fail_action_v1(
      p_actor_id,
      'finalise_post',
      p_client_event_id,
      'OBJECT_NOT_READY',
      'The photo has not reached secure storage yet.',
      null,
      true
    );
  end if;

  v_media_type := coalesce(v_metadata->>'mimetype', '');
  v_media_size_text := coalesce(v_metadata->>'size', '');
  v_media_size := case
    when v_media_size_text ~ '^[0-9]+$' then v_media_size_text::bigint
    else -1
  end;

  if v_media_type <> v_post.expected_content_type
     or v_media_size <> v_post.expected_byte_size then
    return private.event_fail_action_v1(
      p_actor_id,
      'finalise_post',
      p_client_event_id,
      'OBJECT_METADATA_INVALID',
      'The stored photo does not match the server-approved upload metadata.'
    );
  end if;

  update public.event_posts
  set
    status = 'pending_review',
    revision = revision + 1,
    updated_at = now()
  where id = v_post.id
    and status = 'upload_pending'
    and revision = v_post.revision
  returning * into v_updated_post;

  if v_updated_post.id is null then
    raise exception 'Post finalisation was not confirmed';
  end if;

  perform private.event_audit_v1(
    v_event.id,
    v_occurrence.id,
    p_actor_id,
    'event.post_finalised',
    'event_post',
    v_updated_post.id,
    jsonb_build_object('status', v_updated_post.status)
  );

  return private.event_complete_action_v1(
    p_actor_id,
    'finalise_post',
    p_client_event_id,
    'POST_PENDING_REVIEW',
    'Your photo is stored and awaiting review.',
    jsonb_build_object('post', private.event_post_json_v1(v_updated_post, true))
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_review_post_v1(p_actor_id uuid, p_post_id uuid, p_client_event_id uuid, p_request_hash text, p_expected_revision integer, p_decision text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_claim jsonb;
  v_post public.event_posts%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_event public.event_events%rowtype;
  v_updated_post public.event_posts%rowtype;
  v_next_status public.menta_event_post_status;
begin
  v_claim := private.event_claim_receipt_v1(
    p_actor_id,
    'review_post',
    p_client_event_id,
    p_request_hash
  );
  if v_claim->>'kind' = 'cached' then
    return v_claim->'response';
  end if;
  if v_claim->>'kind' = 'mismatch' then
    return private.event_result_v1('review_post', p_client_event_id, 'failed', 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for different review details.', null);
  end if;
  if v_claim->>'kind' = 'invalid' then
    return private.event_result_v1('review_post', p_client_event_id, 'failed', 'INVALID_REQUEST', 'This review request is invalid.', null);
  end if;
  if v_claim->>'kind' = 'in_progress' then
    return private.event_result_v1('review_post', p_client_event_id, 'unknown_result', 'REQUEST_IN_PROGRESS', 'This review is still being confirmed. Check again before retrying.', null, true);
  end if;

  if p_expected_revision is null
     or p_expected_revision < 1
     or p_decision not in ('approve', 'reject')
     or (p_note is not null and char_length(p_note) > 500) then
    return private.event_fail_action_v1(p_actor_id, 'review_post', p_client_event_id, 'INVALID_REVIEW', 'This review decision is invalid.');
  end if;

  select *
  into v_post
  from public.event_posts
  where id = p_post_id
  for update;

  if not found then
    return private.event_fail_action_v1(p_actor_id, 'review_post', p_client_event_id, 'POST_UNAVAILABLE', 'This event post is not available.');
  end if;

  select *
  into v_occurrence
  from public.event_occurrences
  where id = v_post.occurrence_id
  for update;

  if not found then
    raise exception 'Post occurrence was not found';
  end if;

  select *
  into v_event
  from public.event_events
  where id = v_occurrence.event_id;

  if not found or v_event.organiser_id is distinct from p_actor_id then
    return private.event_fail_action_v1(p_actor_id, 'review_post', p_client_event_id, 'FORBIDDEN', 'Only this event organiser can review the post.');
  end if;

  if v_post.revision <> p_expected_revision then
    return private.event_fail_action_v1(
      p_actor_id,
      'review_post',
      p_client_event_id,
      'STALE_REVIEW',
      'This post changed before your review could be applied.',
      jsonb_build_object('currentRevision', v_post.revision)
    );
  end if;

  if v_post.status <> 'pending_review' then
    return private.event_fail_action_v1(p_actor_id, 'review_post', p_client_event_id, 'POST_NOT_REVIEWABLE', 'This post is not awaiting review.');
  end if;

  v_next_status := case
    when p_decision = 'approve' then 'approved'::public.menta_event_post_status
    when p_decision = 'reject' then 'rejected'::public.menta_event_post_status
    else null
  end;

  if v_next_status is null then
    raise exception 'Review decision did not resolve to a post state';
  end if;

  update public.event_posts
  set
    status = v_next_status,
    revision = revision + 1,
    reviewed_by = p_actor_id,
    reviewed_at = now(),
    review_note = p_note,
    updated_at = now()
  where id = v_post.id
    and status = 'pending_review'
    and revision = p_expected_revision
  returning * into v_updated_post;

  if v_updated_post.id is null then
    raise exception 'Post review was not confirmed';
  end if;

  perform private.event_audit_v1(
    v_event.id,
    v_occurrence.id,
    p_actor_id,
    'event.post_reviewed',
    'event_post',
    v_updated_post.id,
    jsonb_build_object('decision', p_decision, 'revision', v_updated_post.revision)
  );

  return private.event_complete_action_v1(
    p_actor_id,
    'review_post',
    p_client_event_id,
    case when p_decision = 'approve' then 'POST_APPROVED' else 'POST_REJECTED' end,
    case when p_decision = 'approve' then 'The post is approved.' else 'The post is rejected.' end,
    jsonb_build_object('post', private.event_post_json_v1(v_updated_post, false))
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_prepare_post_delete_v1(p_actor_id uuid, p_post_id uuid, p_client_event_id uuid, p_request_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_claim jsonb;
  v_post public.event_posts%rowtype;
  v_updated_post public.event_posts%rowtype;
begin
  v_claim := private.event_claim_receipt_v1(
    p_actor_id,
    'prepare_post_delete',
    p_client_event_id,
    p_request_hash
  );
  if v_claim->>'kind' = 'cached' then
    return v_claim->'response';
  end if;
  if v_claim->>'kind' = 'mismatch' then
    return private.event_result_v1('delete_own_post', p_client_event_id, 'failed', 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for different delete details.', null);
  end if;
  if v_claim->>'kind' = 'invalid' then
    return private.event_result_v1('delete_own_post', p_client_event_id, 'failed', 'INVALID_REQUEST', 'This post deletion request is invalid.', null);
  end if;
  if v_claim->>'kind' = 'in_progress' then
    return private.event_result_v1('delete_own_post', p_client_event_id, 'unknown_result', 'REQUEST_IN_PROGRESS', 'This deletion is still being confirmed. Check again before retrying.', null, true);
  end if;

  select *
  into v_post
  from public.event_posts
  where id = p_post_id
    and user_id = p_actor_id
  for update;

  if not found then
    return private.event_fail_action_v1(p_actor_id, 'prepare_post_delete', p_client_event_id, 'POST_UNAVAILABLE', 'This event post is not available.');
  end if;

  if v_post.status = 'deleted' then
    return private.event_complete_action_v1(
      p_actor_id,
      'prepare_post_delete',
      p_client_event_id,
      'ALREADY_DELETED',
      'This event post is already deleted.',
      jsonb_build_object(
        'postId', v_post.id,
        'occurrenceId', v_post.occurrence_id,
        'storagePath', v_post.media_path,
        'deletedAt', v_post.deleted_at
      )
    );
  end if;

  if v_post.media_path is null
     or not private.event_media_path_is_valid_v1(
       v_post.media_path,
       p_actor_id,
       v_post.occurrence_id,
       v_post.id
     ) then
    raise exception 'Post deletion rejected an invalid server media path';
  end if;

  if v_post.status <> 'deleting' then
    update public.event_posts
    set
      status = 'deleting',
      revision = revision + 1,
      updated_at = now()
    where id = v_post.id
      and revision = v_post.revision
    returning * into v_updated_post;

    if v_updated_post.id is null then
      raise exception 'Post deletion preparation was not confirmed';
    end if;
  else
    v_updated_post := v_post;
  end if;

  return private.event_complete_action_v1(
    p_actor_id,
    'prepare_post_delete',
    p_client_event_id,
    'DELETE_PREPARED',
    'The event photo is ready for secure deletion.',
    jsonb_build_object(
      'postId', v_updated_post.id,
      'occurrenceId', v_updated_post.occurrence_id,
      'storagePath', v_updated_post.media_path
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_prepare_post_upload_v1(p_actor_id uuid, p_occurrence_id uuid, p_client_event_id uuid, p_request_hash text, p_caption text, p_content_type text, p_byte_size bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_claim jsonb;
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_attendance public.event_attendances%rowtype;
  v_post public.event_posts%rowtype;
  v_extension text;
  v_path text;
begin
  v_claim := private.event_claim_receipt_v1(
    p_actor_id,
    'prepare_post_upload',
    p_client_event_id,
    p_request_hash
  );
  if v_claim->>'kind' = 'cached' then
    return v_claim->'response';
  end if;
  if v_claim->>'kind' = 'mismatch' then
    return private.event_result_v1('prepare_post_upload', p_client_event_id, 'failed', 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for different post details.', null);
  end if;
  if v_claim->>'kind' = 'invalid' then
    return private.event_result_v1('prepare_post_upload', p_client_event_id, 'failed', 'INVALID_REQUEST', 'This post upload request is invalid.', null);
  end if;
  if v_claim->>'kind' = 'in_progress' then
    return private.event_result_v1('prepare_post_upload', p_client_event_id, 'unknown_result', 'REQUEST_IN_PROGRESS', 'This upload is still being prepared. Check again before retrying.', null, true);
  end if;

  if p_content_type not in ('image/jpeg', 'image/png', 'image/webp')
     or p_byte_size <= 0
     or p_byte_size > 10000000
     or (p_caption is not null and char_length(p_caption) > 280) then
    return private.event_fail_action_v1(p_actor_id, 'prepare_post_upload', p_client_event_id, 'INVALID_MEDIA_METADATA', 'This image cannot be uploaded with the supplied metadata.');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('event-occurrence:' || p_occurrence_id::text, 0)
  );

  select *
  into v_occurrence
  from public.event_occurrences
  where id = p_occurrence_id
  for update;

  if not found
  then
    return private.event_fail_action_v1(p_actor_id, 'prepare_post_upload', p_client_event_id, 'POSTING_UNAVAILABLE', 'Posting is not open for this event.');
  end if;

  select *
  into v_event
  from public.event_events
  where id = v_occurrence.event_id;

  if not found
     or v_event.status <> 'published'
     or not private.event_posting_is_open_v1(v_occurrence) then
    return private.event_fail_action_v1(p_actor_id, 'prepare_post_upload', p_client_event_id, 'POSTING_UNAVAILABLE', 'Posting is not open for this event.');
  end if;

  select *
  into v_attendance
  from public.event_attendances
  where occurrence_id = v_occurrence.id
    and user_id = p_actor_id
    and state = 'joined'
  for update;

  if not found then
    return private.event_fail_action_v1(p_actor_id, 'prepare_post_upload', p_client_event_id, 'NOT_JOINED', 'Join this event before posting.');
  end if;

  if p_content_type = 'image/jpeg' then
    v_extension := 'jpg';
  elsif p_content_type = 'image/png' then
    v_extension := 'png';
  else
    v_extension := 'webp';
  end if;

  select *
  into v_post
  from public.event_posts
  where user_id = p_actor_id
    and occurrence_id = v_occurrence.id
    and client_event_id = p_client_event_id
  for update;

  if not found then
    insert into public.event_posts (
      occurrence_id,
      user_id,
      client_event_id,
      expected_content_type,
      expected_byte_size,
      caption,
      status
    )
    values (
      v_occurrence.id,
      p_actor_id,
      p_client_event_id,
      p_content_type,
      p_byte_size,
      p_caption,
      'upload_pending'
    )
    returning * into v_post;
  end if;

  if v_post.id is null then
    raise exception 'Post upload preparation was not confirmed';
  end if;

  if v_post.media_path is null then
    v_path := format(
      'v1/%s/%s/%s.%s',
      p_actor_id,
      v_occurrence.id,
      v_post.id,
      v_extension
    );

    update public.event_posts
    set
      media_path = v_path,
      updated_at = now()
    where id = v_post.id
      and media_path is null
    returning * into v_post;

    if v_post.media_path is null then
      raise exception 'Server media path was not persisted';
    end if;
  end if;

  if not private.event_media_path_is_valid_v1(
    v_post.media_path,
    p_actor_id,
    v_occurrence.id,
    v_post.id
  ) then
    raise exception 'Stored event media path violated its server contract';
  end if;

  perform private.event_audit_v1(
    v_event.id,
    v_occurrence.id,
    p_actor_id,
    'event.post_upload_prepared',
    'event_post',
    v_post.id,
    jsonb_build_object(
      'contentType', v_post.expected_content_type,
      'byteSize', v_post.expected_byte_size
    )
  );

  return private.event_complete_action_v1(
    p_actor_id,
    'prepare_post_upload',
    p_client_event_id,
    'UPLOAD_READY',
    'Your private upload is ready.',
    jsonb_build_object(
      'postId', v_post.id,
      'occurrenceId', v_post.occurrence_id,
      'storagePath', v_post.media_path,
      'contentType', v_post.expected_content_type,
      'byteSize', v_post.expected_byte_size
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_complete_post_delete_v1(p_actor_id uuid, p_post_id uuid, p_client_event_id uuid, p_request_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_claim jsonb;
  v_post public.event_posts%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_event public.event_events%rowtype;
  v_remaining_object_id uuid;
  v_updated_post public.event_posts%rowtype;
begin
  v_claim := private.event_claim_receipt_v1(
    p_actor_id,
    'complete_post_delete',
    p_client_event_id,
    p_request_hash
  );
  if v_claim->>'kind' = 'cached' then
    return v_claim->'response';
  end if;
  if v_claim->>'kind' = 'mismatch' then
    return private.event_result_v1('delete_own_post', p_client_event_id, 'failed', 'IDEMPOTENCY_KEY_REUSED', 'This request key was already used for different delete details.', null);
  end if;
  if v_claim->>'kind' = 'invalid' then
    return private.event_result_v1('delete_own_post', p_client_event_id, 'failed', 'INVALID_REQUEST', 'This post deletion request is invalid.', null);
  end if;
  if v_claim->>'kind' = 'in_progress' then
    return private.event_result_v1('delete_own_post', p_client_event_id, 'unknown_result', 'REQUEST_IN_PROGRESS', 'This deletion is still being confirmed. Check again before retrying.', null, true);
  end if;

  select *
  into v_post
  from public.event_posts
  where id = p_post_id
    and user_id = p_actor_id
  for update;

  if not found then
    return private.event_fail_action_v1(p_actor_id, 'complete_post_delete', p_client_event_id, 'POST_UNAVAILABLE', 'This event post is not available.');
  end if;

  if v_post.status = 'deleted' then
    return private.event_complete_action_v1(
      p_actor_id,
      'complete_post_delete',
      p_client_event_id,
      'ALREADY_DELETED',
      'This event post is already deleted.',
      jsonb_build_object('postId', v_post.id, 'deletedAt', v_post.deleted_at)
    );
  end if;

  if v_post.status <> 'deleting'
     or v_post.media_path is null
     or not private.event_media_path_is_valid_v1(
       v_post.media_path,
       p_actor_id,
       v_post.occurrence_id,
       v_post.id
     ) then
    raise exception 'Post deletion completion rejected an invalid server media path';
  end if;

  select id
  into v_remaining_object_id
  from storage.objects
  where bucket_id = 'event-media'
    and name = v_post.media_path;

  if v_remaining_object_id is not null then
    return private.event_fail_action_v1(
      p_actor_id,
      'complete_post_delete',
      p_client_event_id,
      'MEDIA_STILL_PRESENT',
      'The event photo could not yet be confirmed as deleted.',
      null,
      true
    );
  end if;

  update public.event_posts
  set
    status = 'deleted',
    revision = revision + 1,
    deleted_at = now(),
    updated_at = now()
  where id = v_post.id
    and status = 'deleting'
    and revision = v_post.revision
  returning * into v_updated_post;

  if v_updated_post.id is null then
    raise exception 'Post deletion completion was not confirmed';
  end if;

  select *
  into v_occurrence
  from public.event_occurrences
  where id = v_updated_post.occurrence_id;

  if not found then
    raise exception 'Post occurrence was not found during deletion';
  end if;

  select *
  into v_event
  from public.event_events
  where id = v_occurrence.event_id;

  if not found then
    raise exception 'Post event was not found during deletion';
  end if;

  perform private.event_audit_v1(
    v_event.id,
    v_occurrence.id,
    p_actor_id,
    'event.post_deleted',
    'event_post',
    v_updated_post.id
  );

  return private.event_complete_action_v1(
    p_actor_id,
    'complete_post_delete',
    p_client_event_id,
    'DELETED',
    'Your event photo is deleted.',
    jsonb_build_object('postId', v_updated_post.id, 'deletedAt', v_updated_post.deleted_at)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.preview_group_invite_v2(p_invite_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_invite public.invite_codes%rowtype;
  v_group_id uuid;
  v_group_name text;
  v_group_description text;
  v_group_privacy text;
  v_group_status text;
  v_member_count integer := 0;
  v_inviter_name text;
  v_shared_promise text;
  v_is_member boolean := false;
  v_preview_status text;
begin
  if v_user_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'GROUP_INVITE_PREVIEW',
      'code', 'AUTH_REQUIRED'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'GROUP_INVITE_PREVIEW',
      'code', 'AUTH_SESSION_REVOKED'
    );
  end if;

  if v_code !~ '^[A-Z0-9]{4,32}$' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'GROUP_INVITE_PREVIEW',
      'code', 'INVALID_CODE'
    );
  end if;

  select invite.*
  into v_invite
  from public.invite_codes invite
  where invite.code = v_code
    and invite.type = 'group'
  limit 1;

  if found then
    v_group_id := v_invite.ref_id;
  else
    select replacement.group_id
    into v_group_id
    from private.group_invite_replacements replacement
    where replacement.invite_code = v_code
    limit 1;

    if not found then
      return pg_catalog.jsonb_build_object(
        'success', true,
        'operation', 'GROUP_INVITE_PREVIEW',
        'code', 'PREVIEW_READY',
        'preview', pg_catalog.jsonb_build_object(
          'status', 'NOT_FOUND',
          'invite_code', v_code,
          'group_id', null,
          'group_name', null,
          'group_description', null,
          'privacy', null,
          'member_count', 0,
          'inviter_name', null,
          'shared_promise', null,
          'expires_at', null,
          'is_member', false
        )
      );
    end if;

    -- A replaced code proves only that this exact capability is stale. Do not
    -- leak the private group's metadata through an invalidated capability.
    return pg_catalog.jsonb_build_object(
      'success', true,
      'operation', 'GROUP_INVITE_PREVIEW',
      'code', 'PREVIEW_READY',
      'preview', pg_catalog.jsonb_build_object(
        'status', 'REPLACED',
        'invite_code', v_code,
        'group_id', null,
        'group_name', null,
        'group_description', null,
        'privacy', null,
        'member_count', 0,
        'inviter_name', null,
        'shared_promise', null,
        'expires_at', null,
        'is_member', false
      )
    );
  end if;

  select
    group_row.name,
    group_row.description,
    group_row.privacy,
    group_row.status
  into
    v_group_name,
    v_group_description,
    v_group_privacy,
    v_group_status
  from public.teams group_row
  where group_row.id = v_group_id
  limit 1;

  if v_group_status is null then
    v_preview_status := 'GROUP_INACTIVE';
  end if;

  select pg_catalog.count(*)::integer
  into v_member_count
  from public.team_members member
  where member.group_id = v_group_id;

  if v_invite.created_by is not null then
    select coalesce(
      nullif(pg_catalog.btrim(profile.display_name), ''),
      nullif(pg_catalog.btrim(profile.username), ''),
      'A group member'
    )
    into v_inviter_name
    from public.profiles profile
    where profile.id = v_invite.created_by
    limit 1;
  end if;

  select challenge.title
  into v_shared_promise
  from public.team_challenges group_challenge
  join public.challenges challenge
    on challenge.id = group_challenge.challenge_id
  where group_challenge.group_id = v_group_id
    and challenge.status = 'active'
    and challenge.completion_status = 'active'
  order by challenge.created_at asc, challenge.id asc
  limit 1;

  select exists (
    select 1
    from public.team_members member
    where member.group_id = v_group_id
      and member.user_id = v_user_id
  )
  into v_is_member;

  if v_preview_status is null then
    v_preview_status := case
      when v_invite.expires_at is not null
        and v_invite.expires_at <= now()
        then 'EXPIRED'
      when v_group_status <> 'active'
        then 'GROUP_INACTIVE'
      when v_is_member
        then 'ALREADY_MEMBER'
      else 'ACTIVE'
    end;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'GROUP_INVITE_PREVIEW',
    'code', 'PREVIEW_READY',
    'preview', pg_catalog.jsonb_build_object(
      'status', v_preview_status,
      'invite_code', v_code,
      'group_id', v_group_id,
      'group_name', v_group_name,
      'group_description', v_group_description,
      'privacy', v_group_privacy,
      'member_count', v_member_count,
      'inviter_name', v_inviter_name,
      'shared_promise', v_shared_promise,
      'expires_at', v_invite.expires_at,
      'is_member', v_is_member
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.purchase_shop_item(p_user_id uuid, p_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  end if;

  return public.purchase_shop_item(
    p_user_id,
    p_item_id,
    pg_catalog.gen_random_uuid()
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_get_organiser_recap_v1(p_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_joined_count integer := 0;
  v_checked_in_count integer := 0;
  v_posted_count integer := 0;
  v_verified_count integer := 0;
  v_approved_post_count integer := 0;
  v_album_items jsonb := '[]'::jsonb;
begin
  if v_actor_id is null then
    return private.event_result_v1(
      'get_organiser_recap',
      null,
      'failed',
      'AUTHENTICATION_REQUIRED',
      'Sign in to open the event recap.',
      null
    );
  end if;

  select event.*
  into v_event
  from public.event_events as event
  where event.id = p_event_id;

  if not found or v_event.organiser_id is distinct from v_actor_id then
    return private.event_result_v1(
      'get_organiser_recap',
      null,
      'failed',
      'FORBIDDEN',
      'Only this event organiser can open the recap.',
      null
    );
  end if;

  if v_event.status not in ('published', 'archived') then
    return private.event_result_v1(
      'get_organiser_recap',
      null,
      'failed',
      'EVENT_UNAVAILABLE',
      'This event does not have an available recap.',
      null
    );
  end if;

  -- A recurring event can have multiple completed occurrences. The latest
  -- ended occurrence is selected deterministically; a caller cannot widen or
  -- substitute the organiser-owned event scope.
  select occurrence.*
  into v_occurrence
  from public.event_occurrences as occurrence
  where occurrence.event_id = v_event.id
    and occurrence.state = 'ended'
  order by occurrence.ends_at desc, occurrence.id desc
  limit 1;

  if not found then
    return private.event_result_v1(
      'get_organiser_recap',
      null,
      'failed',
      'RECAP_NOT_READY',
      'The event recap is available after an occurrence ends.',
      null
    );
  end if;

  select
    count(*)::integer,
    count(*) filter (
      where exists (
        select 1
        from public.event_checkins as checkin
        where checkin.attendance_id = attendance.id
          and checkin.revoked_at is null
      )
    )::integer,
    count(*) filter (
      where exists (
        select 1
        from public.event_posts as post
        where post.occurrence_id = attendance.occurrence_id
          and post.user_id = attendance.user_id
          and post.status in ('pending_review', 'approved', 'rejected')
          and post.media_path is not null
      )
    )::integer,
    count(*) filter (
      where exists (
        select 1
        from public.event_posts as post
        where post.occurrence_id = attendance.occurrence_id
          and post.user_id = attendance.user_id
          and post.status = 'approved'
          and post.media_path is not null
          and post.reviewed_at is not null
      )
    )::integer
  into
    v_joined_count,
    v_checked_in_count,
    v_posted_count,
    v_verified_count
  from public.event_attendances as attendance
  where attendance.occurrence_id = v_occurrence.id
    and attendance.state = 'joined';

  select count(*)::integer
  into v_approved_post_count
  from public.event_posts as post
  join public.event_attendances as attendance
    on attendance.occurrence_id = post.occurrence_id
    and attendance.user_id = post.user_id
    and attendance.state = 'joined'
  join public.event_checkins as checkin
    on checkin.attendance_id = attendance.id
    and checkin.revoked_at is null
  where post.occurrence_id = v_occurrence.id
    and post.status = 'approved'
    and post.media_path is not null
    and post.reviewed_at is not null;

  select coalesce(
    jsonb_agg(
      album_row.item
      order by album_row.created_at desc, album_row.post_id desc
    ),
    '[]'::jsonb
  )
  into v_album_items
  from (
    select
      post.id as post_id,
      post.created_at,
      private.event_album_item_json_v1(post, profile, checkin) as item
    from public.event_posts as post
    join public.profiles as profile on profile.id = post.user_id
    join public.event_attendances as attendance
      on attendance.occurrence_id = post.occurrence_id
      and attendance.user_id = post.user_id
      and attendance.state = 'joined'
    join public.event_checkins as checkin
      on checkin.attendance_id = attendance.id
      and checkin.revoked_at is null
    where post.occurrence_id = v_occurrence.id
      and post.status = 'approved'
      and post.media_path is not null
      and post.reviewed_at is not null
    order by post.created_at desc, post.id desc
    limit 12
  ) as album_row;

  return private.event_result_v1(
    'get_organiser_recap',
    null,
    'completed',
    'ORGANISER_RECAP_READY',
    'The organiser recap is ready.',
    jsonb_build_object(
      'eventId', v_event.id,
      'occurrenceId', v_occurrence.id,
      'eventTitle', v_event.title,
      'endedAt', v_occurrence.ends_at,
      'timeZone', v_event.time_zone,
      'counts', jsonb_build_object(
        'joined', v_joined_count,
        'checkedIn', v_checked_in_count,
        'posted', v_posted_count,
        'verified', v_verified_count
      ),
      'approvedPostCount', v_approved_post_count,
      'albumItems', v_album_items
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_group_daily_status(p_group_id uuid)
 RETURNS TABLE(group_id uuid, total_members integer, submitted_today integer, pending_submissions integer, pending_reviews integer, end_of_day_utc timestamp with time zone, seconds_remaining integer, group_at_risk boolean, misses_to_break_streak integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_now timestamptz := now();
  v_eligible integer := 0;
  v_submitted integer := 0;
  v_pending_reviews integer := 0;
  v_end_of_day timestamptz;
  v_misses_rule integer := 2;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.team_members tm
    where tm.group_id = p_group_id
      and tm.user_id = auth.uid()
  ) then
    raise exception 'GROUP_MEMBERSHIP_REQUIRED' using errcode = '42501';
  end if;

  with eligible as materialized (
    select
      tc.challenge_id,
      cp.user_id,
      ch.streak_timezone,
      ch.allow_self_review
    from public.team_challenges tc
    join public.challenges ch
      on ch.id = tc.challenge_id
    join public.challenge_participants cp
      on cp.challenge_id = tc.challenge_id
     and coalesce(cp.status, 'active') = 'active'
    join public.team_members tm
      on tm.group_id = tc.group_id
     and tm.user_id = cp.user_id
    where tc.group_id = p_group_id
      and coalesce(ch.status, 'active') = 'active'
      and coalesce(ch.completion_status, 'active') = 'active'
      and coalesce(ch.is_expired, false) = false
      and (ch.start_date is null or ch.start_date <= v_now)
      and (ch.end_date is null or ch.end_date >= v_now)
  ), participant_days as (
    select
      e.user_id,
      min(
        (
          pg_catalog.date_trunc(
            'day',
            v_now at time zone e.streak_timezone
          ) + interval '1 day'
        ) at time zone e.streak_timezone
      ) as end_of_day_utc,
      pg_catalog.bool_or(
        exists (
          select 1
          from public.challenge_submissions cs
          where cs.challenge_id = e.challenge_id
            and cs.user_id = e.user_id
            and cs.local_day =
              (v_now at time zone e.streak_timezone)::date
            and cs.status in ('pending', 'approved')
        )
      ) as submitted_today
    from eligible e
    group by e.user_id
  ), review_backlog as (
    select count(distinct cs.id)::integer as pending_reviews
    from eligible e
    join public.challenge_submissions cs
      on cs.challenge_id = e.challenge_id
     and cs.user_id = e.user_id
     and cs.status = 'pending'
    where coalesce(e.allow_self_review, false) = false
  )
  select
    count(*)::integer,
    count(*) filter (where pd.submitted_today)::integer,
    coalesce(
      min(pd.end_of_day_utc),
      (
        pg_catalog.date_trunc('day', v_now at time zone 'UTC')
        + interval '1 day'
        - interval '1 second'
      ) at time zone 'UTC'
    ),
    coalesce((select rb.pending_reviews from review_backlog rb), 0)
  into
    v_eligible,
    v_submitted,
    v_end_of_day,
    v_pending_reviews
  from participant_days pd;

  return query
  select
    p_group_id,
    v_eligible,
    v_submitted,
    greatest(v_eligible - v_submitted, 0),
    v_pending_reviews,
    v_end_of_day,
    greatest(
      0,
      pg_catalog.floor(
        extract(epoch from (v_end_of_day - v_now))
      )::integer
    ),
    (v_eligible > 0 and v_eligible > v_submitted),
    v_misses_rule;
end;
$function$;

CREATE OR REPLACE FUNCTION public.purchase_shop_item(p_user_id uuid, p_item_id uuid, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_item_cost integer;
  v_item_name text;
  v_item_sku text;
  v_unlock_streak_days integer;
  v_new_balance integer;
  v_quantity integer;
  v_purchased_at timestamptz;
  v_existing_item_id uuid;
  v_existing_payload jsonb;
  v_result_payload jsonb;
begin
  if p_user_id is null
    or p_item_id is null
    or p_client_event_id is null
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_REQUEST',
      'client_event_id', p_client_event_id
    );
  end if;

  if auth.uid() is null or auth.uid() <> p_user_id then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'client_event_id', p_client_event_id
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  );

  select receipt.item_id, receipt.result_payload
  into v_existing_item_id, v_existing_payload
  from public.shop_purchase_receipts receipt
  where receipt.user_id = p_user_id
    and receipt.client_event_id = p_client_event_id
  limit 1;

  if found then
    if v_existing_item_id <> p_item_id then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'error', 'REQUEST_FACT_MISMATCH',
        'client_event_id', p_client_event_id
      );
    end if;

    return v_existing_payload;
  end if;

  select item.cost, item.name, item.sku, item.unlock_streak_days
  into v_item_cost, v_item_name, v_item_sku, v_unlock_streak_days
  from public.catalog_items item
  where item.id = p_item_id
    and item.is_available = true
    and item.is_disabled = false
  limit 1;

  if v_item_cost is null or v_item_sku is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'ITEM_NOT_AVAILABLE',
      'client_event_id', p_client_event_id
    );
  end if;

  if v_unlock_streak_days is not null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'STREAK_UNLOCK_ONLY',
      'client_event_id', p_client_event_id,
      'unlock_streak_days', v_unlock_streak_days
    );
  end if;

  update public.profiles profile
  set
    momenta_balance = coalesce(profile.momenta_balance, 0)
      - v_item_cost,
    updated_at = pg_catalog.now()
  where profile.id = p_user_id
    and coalesce(profile.momenta_balance, 0) >= v_item_cost
  returning profile.momenta_balance into v_new_balance;

  if v_new_balance is null then
    if not exists (
      select 1
      from public.profiles profile
      where profile.id = p_user_id
    ) then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'error', 'USER_NOT_FOUND',
        'client_event_id', p_client_event_id
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_BALANCE',
      'client_event_id', p_client_event_id
    );
  end if;

  v_purchased_at := pg_catalog.clock_timestamp();

  insert into public.purchases(user_id, item_id, purchased_at)
  values (p_user_id, p_item_id, v_purchased_at);

  insert into public.wallet_transactions (
    user_id,
    amount,
    reason,
    source_uuid,
    transaction_type,
    description,
    reference_id,
    external_reference_id,
    created_at
  )
  values (
    p_user_id,
    -v_item_cost,
    'Shop purchase: ' || v_item_name,
    p_client_event_id,
    'spent',
    'Shop purchase: ' || v_item_name,
    p_item_id,
    'shop_purchase:' || p_user_id::text || ':' || p_client_event_id::text,
    v_purchased_at
  );

  insert into public.inventory_items as inventory (
    user_id,
    item_sku,
    quantity,
    updated_at
  )
  values (p_user_id, v_item_sku, 1, v_purchased_at)
  on conflict (user_id, item_sku)
  do update set
    quantity = inventory.quantity + 1,
    updated_at = excluded.updated_at
  returning inventory.quantity into v_quantity;

  v_result_payload := pg_catalog.jsonb_build_object(
    'success', true,
    'client_event_id', p_client_event_id,
    'item_id', p_item_id,
    'item_name', v_item_name,
    'item_sku', v_item_sku,
    'quantity', v_quantity,
    'cost', v_item_cost,
    'new_balance', v_new_balance
  );

  insert into public.shop_purchase_receipts (
    user_id,
    client_event_id,
    item_id,
    item_sku,
    item_name,
    cost,
    new_balance,
    quantity,
    result_payload,
    created_at
  )
  values (
    p_user_id,
    p_client_event_id,
    p_item_id,
    v_item_sku,
    v_item_name,
    v_item_cost,
    v_new_balance,
    v_quantity,
    v_result_payload,
    v_purchased_at
  );

  return v_result_payload;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_legal_document_versions()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with latest_effective_documents as (
    select distinct on (documents.document_type)
      documents.document_type,
      documents.document_version,
      documents.document_url,
      documents.effective_at,
      documents.retired_at
    from public.legal_document_versions as documents
    where documents.effective_at <= now()
    order by
      documents.document_type,
      documents.effective_at desc,
      documents.published_at desc,
      documents.document_version desc
  ),
  current_documents as (
    -- Rank before filtering retirement. If v2 supersedes v1 and v2 is then
    -- retired, no version is current; the resolver must not resurrect v1.
    select documents.*
    from latest_effective_documents as documents
    where documents.retired_at is null
      or documents.retired_at > now()
  )
  select coalesce(
    jsonb_object_agg(
      documents.document_type,
      jsonb_build_object(
        'version', documents.document_version,
        'url', documents.document_url,
        'effectiveAt', documents.effective_at
      )
    ),
    '{}'::jsonb
  )
  from current_documents as documents;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_my_referral_code()
 RETURNS TABLE(referral_code text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_candidate text;
  v_created_at timestamptz;
  v_attempt integer;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = v_user_id
  ) then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002';
  end if;

  select referral_code.code, referral_code.created_at
  into v_candidate, v_created_at
  from public.referral_codes referral_code
  where referral_code.user_id = v_user_id;

  if found then
    return query select v_candidate, v_created_at;
    return;
  end if;

  for v_attempt in 1..8 loop
    v_candidate := pg_catalog.upper(
      pg_catalog.replace(
        pg_catalog.gen_random_uuid()::text,
        '-',
        ''
      )
    );

    begin
      insert into public.referral_codes as referral_code (user_id, code)
      values (v_user_id, v_candidate)
      returning referral_code.created_at into v_created_at;

      return query select v_candidate, v_created_at;
      return;
    exception
      when unique_violation then
        select referral_code.code, referral_code.created_at
        into v_candidate, v_created_at
        from public.referral_codes referral_code
        where referral_code.user_id = v_user_id;

        if found then
          return query select v_candidate, v_created_at;
          return;
        end if;
    end;
  end loop;

  raise exception 'REFERRAL_CODE_GENERATION_FAILED' using errcode = '54000';
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_legal_acceptance_status(p_expected_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_current jsonb;
  v_receipt public.legal_acceptance_receipts%rowtype;
  v_promise_creation_mode text;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'AUTHENTICATION_REQUIRED';
  end if;

  if not public.current_session_is_active() then
    raise exception using
      errcode = '42501',
      message = 'AUTH_SESSION_REVOKED';
  end if;

  if p_expected_user_id is null or p_expected_user_id <> v_user_id then
    raise exception using
      errcode = '42501',
      message = 'ACCOUNT_SCOPE_CHANGED';
  end if;

  v_current := public.get_current_legal_document_versions();

  if not (
    v_current ? 'terms'
    and v_current ? 'privacy'
    and v_current ? 'community_standards'
  ) then
    raise exception using
      errcode = '55000',
      message = 'LEGAL_DOCUMENT_CONFIGURATION_UNAVAILABLE';
  end if;

  select receipts.*
    into v_receipt
  from public.legal_acceptance_receipts as receipts
  where receipts.user_id = v_user_id
    and receipts.terms_version = v_current #>> '{terms,version}'
    and receipts.privacy_policy_version = v_current #>> '{privacy,version}'
    and receipts.community_standards_version =
      v_current #>> '{community_standards,version}'
  order by receipts.accepted_at desc
  limit 1;

  select settings.enforcement_mode
    into v_promise_creation_mode
  from public.legal_acceptance_enforcement_settings as settings
  where settings.scope = 'promise_creation';

  return jsonb_build_object(
    'userId', v_user_id,
    'accepted', v_receipt.id is not null,
    'requiresAcceptance', v_receipt.id is null,
    'reason', case when v_receipt.id is null then 'missing_or_stale' else 'current' end,
    'current', v_current,
    'enforcement', jsonb_build_object(
      'promiseCreationRequired',
      coalesce(v_promise_creation_mode = 'enforce', false)
    ),
    'receipt', case
      when v_receipt.id is null then null
      else jsonb_build_object(
        'id', v_receipt.id,
        'acceptedAt', v_receipt.accepted_at,
        'surface', v_receipt.acceptance_surface,
        'appVersion', v_receipt.app_version,
        'appBuild', v_receipt.app_build,
        'platform', v_receipt.app_platform,
        'locale', v_receipt.locale
      )
    end
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.accept_current_legal_documents(p_expected_user_id uuid, p_terms_version text, p_privacy_policy_version text, p_community_standards_version text, p_acceptance_surface text, p_app_version text, p_app_build text, p_app_platform text, p_locale text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_current jsonb;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'AUTHENTICATION_REQUIRED';
  end if;

  if not public.current_session_is_active() then
    raise exception using
      errcode = '42501',
      message = 'AUTH_SESSION_REVOKED';
  end if;

  if p_expected_user_id is null or p_expected_user_id <> v_user_id then
    raise exception using
      errcode = '42501',
      message = 'ACCOUNT_SCOPE_CHANGED';
  end if;

  if p_acceptance_surface not in (
    'account_creation',
    'post_auth',
    'pre_authoring',
    'material_update',
    'settings'
  ) then
    raise exception using
      errcode = '22023',
      message = 'INVALID_ACCEPTANCE_SURFACE';
  end if;

  if p_app_platform not in ('ios', 'android', 'web', 'unknown')
     or nullif(btrim(p_app_version), '') is null
     or nullif(btrim(p_app_build), '') is null
     or (p_locale is not null and nullif(btrim(p_locale), '') is null) then
    raise exception using
      errcode = '22023',
      message = 'INVALID_ACCEPTANCE_CONTEXT';
  end if;

  v_current := public.get_current_legal_document_versions();

  if p_terms_version is distinct from v_current #>> '{terms,version}'
     or p_privacy_policy_version is distinct from v_current #>> '{privacy,version}'
     or p_community_standards_version is distinct from
       v_current #>> '{community_standards,version}' then
    raise exception using
      errcode = 'P0001',
      message = 'LEGAL_DOCUMENTS_CHANGED',
      detail = 'Reload the current documents before accepting them.';
  end if;

  insert into public.legal_acceptance_receipts (
    user_id,
    terms_version,
    privacy_policy_version,
    community_standards_version,
    terms_url,
    privacy_policy_url,
    community_standards_url,
    acceptance_surface,
    app_version,
    app_build,
    app_platform,
    locale
  )
  values (
    v_user_id,
    p_terms_version,
    p_privacy_policy_version,
    p_community_standards_version,
    v_current #>> '{terms,url}',
    v_current #>> '{privacy,url}',
    v_current #>> '{community_standards,url}',
    p_acceptance_surface,
    btrim(p_app_version),
    btrim(p_app_build),
    p_app_platform,
    nullif(btrim(p_locale), '')
  )
  on conflict (
    user_id,
    terms_version,
    privacy_policy_version,
    community_standards_version
  ) do nothing;

  return public.get_my_legal_acceptance_status(v_user_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.require_current_legal_acceptance(p_scope text DEFAULT 'promise_creation'::text)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_status jsonb;
  v_enforcement_mode text;
begin
  select settings.enforcement_mode
    into v_enforcement_mode
  from public.legal_acceptance_enforcement_settings as settings
  where settings.scope = p_scope;

  -- Missing or observe-only configuration must not strand installed clients.
  -- The authoritative wrapper becomes blocking only after an explicit switch.
  if v_enforcement_mode is distinct from 'enforce' then
    return;
  end if;

  v_status := public.get_my_legal_acceptance_status(auth.uid());

  if coalesce((v_status ->> 'accepted')::boolean, false) is not true then
    raise exception using
      errcode = 'P0001',
      message = 'LEGAL_ACCEPTANCE_REQUIRED',
      detail = 'Accept the current Terms of Use and Community Standards and acknowledge the Privacy Policy before creating a new promise.';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION private.streak_cutover_anchor_candidate(p_user_id uuid, p_challenge_id uuid, p_exclude_submission_id uuid)
 RETURNS TABLE(submission_id uuid, local_day date, submission_date timestamp with time zone, application_type text, bounded_count integer, exact_cas_count integer, assessment_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with bounded_candidate as (
    select
      submission_row.id,
      submission_row.local_day,
      submission_row.submission_date,
      submission_row.verification_date,
      submission_row.reviewed_at,
      submission_row.verification_date = submission_row.reviewed_at
        as is_exact_cas
    from public.challenge_submissions submission_row
    join public.challenge_participants participant_row
      on participant_row.user_id = submission_row.user_id
     and participant_row.challenge_id = submission_row.challenge_id
    join public.challenges challenge_row
      on challenge_row.id = submission_row.challenge_id
    cross join lateral (
      select public.get_effective_streak_timezone(
        participant_row.user_id,
        participant_row.challenge_id,
        null
      ) as effective_timezone
    ) timezone_context
    where submission_row.user_id = p_user_id
      and submission_row.challenge_id = p_challenge_id
      and coalesce(participant_row.status, 'active') = 'active'
      and coalesce(participant_row.current_streak, 0) > 0
      and coalesce(challenge_row.status, 'active') = 'active'
      and coalesce(challenge_row.completion_status, 'active') = 'active'
      and coalesce(challenge_row.is_expired, false) = false
      and coalesce(challenge_row.verification_frequency, '') = 'daily'
      and participant_row.streak_outcome_tracking_started_at is not null
      and submission_row.status = 'approved'
      and submission_row.local_day is not null
      and submission_row.reviewed_at is not null
      and submission_row.reviewer_id is not null
      and submission_row.reviewed_by is not null
      and submission_row.reviewer_id = submission_row.reviewed_by
      and submission_row.reviewer_id <> submission_row.user_id
      and submission_row.reviewed_at
        >= timestamptz '2026-08-05 10:00:00+00'
      and submission_row.reviewed_at
        < participant_row.streak_outcome_tracking_started_at
      and submission_row.id is distinct from p_exclude_submission_id
      -- Count every bounded approval. Only the sole NULL-verification legacy
      -- candidate may anchor; any unrecognised non-NULL fingerprint must stay
      -- visible to the fail-closed manual-review assessment.
      and submission_row.local_day > coalesce(
        participant_row.last_check_in_local_date,
        '-infinity'::date
      )
      and submission_row.local_day >= (
        participant_row.joined_at at time zone
        timezone_context.effective_timezone
      )::date
      and submission_row.local_day >= coalesce(
        (
          challenge_row.start_date at time zone
          timezone_context.effective_timezone
      )::date,
      '-infinity'::date
    )
    and submission_row.local_day < greatest(
      private.first_full_streak_local_day_v1(
        participant_row.streak_outcome_tracking_started_at,
        timezone_context.effective_timezone
      ),
      private.first_full_streak_local_day_v1(
        participant_row.joined_at,
        timezone_context.effective_timezone
      ),
      coalesce(
        private.first_full_streak_local_day_v1(
          challenge_row.start_date,
          timezone_context.effective_timezone
        ),
        '-infinity'::date
      )
      )
      and (
        challenge_row.end_date is null
        or submission_row.local_day < (
          challenge_row.end_date at time zone
          timezone_context.effective_timezone
        )::date
      )
  ), candidate_count as (
    select
      count(*)::integer as bounded_count,
      count(*) filter (where is_exact_cas)::integer as exact_cas_count
    from bounded_candidate
  ), sole_candidate as (
    select candidate.*
    from bounded_candidate candidate
    cross join candidate_count aggregate_count
    where aggregate_count.bounded_count = 1
  )
  select
    candidate.id,
    candidate.local_day,
    candidate.submission_date,
    case
      when aggregate_count.bounded_count = 1
        and aggregate_count.exact_cas_count = 0
        and candidate.verification_date is null
      then 'legacy_ambiguous_approved'::text
      else null::text
    end,
    aggregate_count.bounded_count,
    aggregate_count.exact_cas_count,
    case
      when aggregate_count.bounded_count = 0 then 'none'::text
      when aggregate_count.bounded_count = 1
        and aggregate_count.exact_cas_count = 0
        and candidate.verification_date is null
      then 'anchorable_ambiguous'::text
      when aggregate_count.exact_cas_count > 0
      then 'exact_cas_requires_manual_review'::text
      else 'candidate_count_requires_manual_review'::text
    end
  from candidate_count aggregate_count
  left join sole_candidate candidate on true;
$function$;

CREATE OR REPLACE FUNCTION public.anchor_unapplied_approved_checkin(p_user_id uuid, p_challenge_id uuid, p_exclude_submission_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_participant public.challenge_participants%rowtype;
  v_challenge public.challenges%rowtype;
  v_submission public.challenge_submissions%rowtype;
  v_effective_tz text;
  v_current_streak integer;
  v_freezes_remaining integer;
  v_application_id uuid;
  v_application_type text;
  v_submission_id uuid;
  v_bounded_count integer := 0;
  v_exact_cas_count integer := 0;
  v_assessment_status text;
begin
  if p_user_id is null or p_challenge_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_CUTOVER_ANCHOR'
    );
  end if;

  select cp.*
  into v_participant
  from public.challenge_participants cp
  where cp.user_id = p_user_id
    and cp.challenge_id = p_challenge_id
    and coalesce(cp.status, 'active') = 'active'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PARTICIPANT_NOT_FOUND'
    );
  end if;

  if v_participant.streak_outcome_tracking_started_at is null then
    update public.challenge_participants cp
    set
      streak_outcome_tracking_started_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.now()
    where cp.id = v_participant.id
    returning cp.* into v_participant;
  end if;

  select challenge_row.*
  into v_challenge
  from public.challenges challenge_row
  where challenge_row.id = p_challenge_id
    and coalesce(challenge_row.status, 'active') = 'active'
    and coalesce(challenge_row.completion_status, 'active') = 'active'
    and coalesce(challenge_row.is_expired, false) = false
    and coalesce(challenge_row.verification_frequency, '') = 'daily';

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'anchored', false,
      'dayStatus', 'not_eligible'
    );
  end if;

  v_effective_tz := public.get_effective_streak_timezone(
    p_user_id,
    p_challenge_id,
    null
  );
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names timezone_name
    where timezone_name.name = v_effective_tz
  ) then
    v_effective_tz := 'UTC';
  end if;

  select
    candidate.submission_id,
    candidate.application_type,
    candidate.bounded_count,
    candidate.exact_cas_count,
    candidate.assessment_status
  into
    v_submission_id,
    v_application_type,
    v_bounded_count,
    v_exact_cas_count,
    v_assessment_status
  from private.streak_cutover_anchor_candidate(
    p_user_id,
    p_challenge_id,
    p_exclude_submission_id
  ) candidate;

  if v_assessment_status = 'none' then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'anchored', false,
      'dayStatus', 'no_unapplied_approval'
    );
  end if;

  if v_assessment_status is distinct from 'anchorable_ambiguous' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'CUTOVER_ANCHOR_REQUIRES_MANUAL_REVIEW',
      'assessment', v_assessment_status,
      'boundedCount', v_bounded_count,
      'exactCasCount', v_exact_cas_count
    );
  end if;

  select cs.*
  into v_submission
  from public.challenge_submissions cs
  where cs.id = v_submission_id
  for update;

  if not found
    or not exists (
      select 1
      from private.streak_cutover_anchor_candidate(
        p_user_id,
        p_challenge_id,
        p_exclude_submission_id
      ) candidate
      where candidate.submission_id = v_submission_id
        and candidate.application_type = v_application_type
        and candidate.bounded_count = 1
        and candidate.exact_cas_count = 0
        and candidate.assessment_status = 'anchorable_ambiguous'
    )
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'CUTOVER_ANCHOR_CHANGED'
    );
  end if;

  v_current_streak := greatest(
    coalesce(v_participant.current_streak, 0),
    0
  );
  v_freezes_remaining := public.get_available_streak_freezes(p_user_id);

  insert into public.streak_checkin_applications (
    user_id,
    challenge_id,
    local_day,
    submission_id,
    application_type,
    effective_timezone,
    previous_streak,
    resulting_streak,
    freeze_used,
    freezes_remaining,
    day_status
  )
  values (
    p_user_id,
    p_challenge_id,
    v_submission.local_day,
    v_submission.id,
    v_application_type,
    v_effective_tz,
    v_current_streak,
    v_current_streak,
    false,
    v_freezes_remaining,
    v_application_type
  )
  on conflict (user_id, challenge_id, local_day) do nothing
  returning id into v_application_id;

  if v_application_id is null then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'anchored', false,
      'dayStatus', 'already_anchored'
    );
  end if;

  update public.challenge_participants cp
  set
    last_check_in_local_date = v_submission.local_day,
    last_check_in = v_submission.local_day,
    last_submission_date = greatest(
      coalesce(cp.last_submission_date, '-infinity'::timestamptz),
      v_submission.submission_date
    ),
    last_check_in_tz = v_effective_tz
  where cp.id = v_participant.id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'anchored', true,
    'localDay', v_submission.local_day,
    'submissionId', v_submission.id,
    'dayStatus', v_application_type
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.users_have_block_relationship_v1(p_first_user_id uuid, p_second_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    p_first_user_id is not null
    and p_second_user_id is not null
    and exists (
      select 1
      from public.blocked_users block_row
      where (
        block_row.blocker_id = p_first_user_id
        and block_row.blocked_user_id = p_second_user_id
      ) or (
        block_row.blocker_id = p_second_user_id
        and block_row.blocked_user_id = p_first_user_id
      )
    );
$function$;

CREATE OR REPLACE FUNCTION public.review_challenge_verification_pre_accountability_v1(p_verification_id uuid, p_status text, p_review_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_reviewer_id uuid := auth.uid();
  v_submission record;
  v_challenge record;
  v_reviewed_at timestamptz := current_timestamp;
  v_updated_submission record;
  v_has_reviewer_id boolean := false;
  v_has_reviewed_by boolean := false;
  v_has_reviewed_at boolean := false;
  v_reviewer_allowed boolean := false;
  v_update_sql text;
  v_rows_updated integer := 0;
  v_effective_tz text;
  v_streak_result jsonb := 'null'::jsonb;
begin
  if v_reviewer_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_AUTHENTICATED',
      'message', 'Sign in again before reviewing proof.'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'SESSION_REVOKED',
      'message', 'Your session is no longer active. Sign in again before reviewing proof.'
    );
  end if;

  if p_status not in ('approved', 'rejected') then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'INVALID_STATUS',
      'message', 'Choose approve or request a correction.'
    );
  end if;

  if p_status = 'rejected'
    and nullif(pg_catalog.btrim(coalesce(p_review_notes, '')), '') is null
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'REJECTION_REASON_REQUIRED',
      'message', 'Add a short reason so this person can correct the proof.'
    );
  end if;

  select cs.*
  into v_submission
  from public.challenge_submissions cs
  where cs.id = p_verification_id;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'This proof is no longer available for review.'
    );
  end if;

  if v_submission.status is distinct from 'pending' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'ALREADY_DECIDED',
      'message', 'This proof changed while you were reviewing it.',
      'current_status', v_submission.status,
      'submission_id', p_verification_id
    );
  end if;

  select c.*
  into v_challenge
  from public.challenges c
  where c.id = v_submission.challenge_id;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'The promise for this proof is no longer available.'
    );
  end if;

  if not coalesce(v_challenge.allow_self_review, false)
    and v_submission.user_id = v_reviewer_id
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_ALLOWED',
      'message', 'You cannot review your own proof for this promise.'
    );
  end if;

  v_reviewer_allowed :=
    v_challenge.creator_id = v_reviewer_id
    or exists (
      select 1
      from public.challenge_participants cp
      where cp.challenge_id = v_submission.challenge_id
        and cp.user_id = v_reviewer_id
        and coalesce(cp.status, 'active') = 'active'
    )
    or exists (
      select 1
      from public.team_challenges tc
      join public.team_members tm on tm.group_id = tc.group_id
      where tc.challenge_id = v_submission.challenge_id
        and tm.user_id = v_reviewer_id
    );

  if not v_reviewer_allowed then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_ALLOWED',
      'message', 'You are not allowed to review this proof.'
    );
  end if;

  -- Match the submit path's participant-before-submission lock order. This
  -- prevents review and correction requests from deadlocking one another.
  perform 1
  from public.challenge_participants cp
  where cp.challenge_id = v_submission.challenge_id
    and cp.user_id = v_submission.user_id
    and coalesce(cp.status, 'active') = 'active'
  for update;

  select cs.*
  into v_submission
  from public.challenge_submissions cs
  where cs.id = p_verification_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'This proof is no longer available for review.'
    );
  end if;

  if v_submission.status is distinct from 'pending' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'ALREADY_DECIDED',
      'message', 'This proof changed while you were reviewing it.',
      'current_status', v_submission.status,
      'submission_id', p_verification_id
    );
  end if;

  -- A block in either direction ends the accountability relationship. Check
  -- this only after the participant and proof rows are locked so the review
  -- decision cannot race another writer and apply streak authority.
  if private.users_have_block_relationship_v1(
    v_reviewer_id,
    v_submission.user_id
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'ACCOUNTABILITY_RELATIONSHIP_BLOCKED',
      'message', 'This proof is no longer available for review.'
    );
  end if;

  if exists (
    select 1
    from public.challenge_submissions earlier
    where earlier.challenge_id = v_submission.challenge_id
      and earlier.user_id = v_submission.user_id
      and earlier.status = 'pending'
      and (
        earlier.local_day < v_submission.local_day
        or (
          earlier.local_day = v_submission.local_day
          and earlier.submission_date < v_submission.submission_date
        )
      )
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'EARLIER_PROOF_REVIEW_REQUIRED',
      'message', 'Review this person''s earlier proof first.'
    );
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'challenge_submissions'
      and column_name = 'reviewer_id'
  ) into v_has_reviewer_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'challenge_submissions'
      and column_name = 'reviewed_by'
  ) into v_has_reviewed_by;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'challenge_submissions'
      and column_name = 'reviewed_at'
  ) into v_has_reviewed_at;

  v_update_sql :=
    'update public.challenge_submissions
       set status = $1,
           review_notes = $2,
           verification_date = $3';

  if v_has_reviewer_id then
    v_update_sql := v_update_sql || ', reviewer_id = $4';
  end if;

  if v_has_reviewed_by then
    v_update_sql := v_update_sql || ', reviewed_by = $5';
  end if;

  if v_has_reviewed_at then
    v_update_sql := v_update_sql || ', reviewed_at = $6';
  end if;

  v_update_sql := v_update_sql
    || ' where id = $7 and status = ''pending'' returning *';

  execute v_update_sql
  into v_updated_submission
  using
    p_status::text,
    p_review_notes,
    v_reviewed_at,
    v_reviewer_id,
    v_reviewer_id,
    v_reviewed_at,
    p_verification_id;

  get diagnostics v_rows_updated = row_count;
  if v_rows_updated <> 1 then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'CHANGED_WHILE_REVIEWING',
      'message', 'This proof changed while you were reviewing it.',
      'submission_id', p_verification_id
    );
  end if;

  v_effective_tz := public.get_effective_streak_timezone(
    v_submission.user_id,
    v_submission.challenge_id,
    null
  );

  if p_status = 'approved' then
    v_streak_result := public.apply_approved_streak_checkin(
      v_submission.user_id,
      v_submission.challenge_id,
      v_submission.local_day,
      v_effective_tz,
      p_verification_id
    );

    if not coalesce((v_streak_result ->> 'success')::boolean, false) then
      raise exception 'APPROVED_STREAK_APPLY_FAILED: %',
        coalesce(v_streak_result ->> 'error', 'UNKNOWN');
    end if;
  else
    perform 1
    from public.resolve_streak_day_outcomes(
      v_submission.user_id,
      v_submission.challenge_id,
      v_submission.local_day,
      v_effective_tz
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'data', pg_catalog.jsonb_build_object(
      'id', p_verification_id,
      'status', p_status,
      'review_notes', p_review_notes,
      'reviewer_id', v_reviewer_id,
      'reviewed_by', v_reviewer_id,
      'reviewed_at', v_reviewed_at,
      'verification_date', v_reviewed_at,
      'streak', v_streak_result
    )
  );

exception when others then
  if sqlerrm like 'APPROVED_STREAK_APPLY_FAILED:%' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'STREAK_APPLY_FAILED',
      'message', 'Menta could not apply this approval to the streak. Try again.'
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'success', false,
    'code', 'UNKNOWN',
    'message', 'Menta could not confirm the review result.'
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.list_streak_maintenance_candidates(p_after_user_id uuid DEFAULT NULL::uuid, p_after_challenge_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(user_id uuid, challenge_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select cp.user_id, cp.challenge_id
  from public.challenge_participants cp
  join public.challenges challenge_row
    on challenge_row.id = cp.challenge_id
  where coalesce(cp.status, 'active') = 'active'
    and coalesce(challenge_row.status, 'active') = 'active'
    and coalesce(challenge_row.completion_status, 'active') = 'active'
    and coalesce(challenge_row.is_expired, false) = false
    and coalesce(challenge_row.verification_frequency, '') = 'daily'
    and (
      (p_after_user_id is null and p_after_challenge_id is null)
      or (
        p_after_user_id is not null
        and p_after_challenge_id is not null
        and (cp.user_id, cp.challenge_id)
          > (p_after_user_id, p_after_challenge_id)
      )
    )
  order by cp.user_id, cp.challenge_id
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$function$;

CREATE OR REPLACE FUNCTION public.get_user_by_referral_code(p_referral_code text)
 RETURNS TABLE(id uuid, username text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_code text := pg_catalog.upper(
    pg_catalog.btrim(coalesce(p_referral_code, ''))
  );
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if v_code !~ '^[0-9A-F]{32}$' then
    return;
  end if;

  return query
  select profile.id, profile.username
  from public.referral_codes referral_code
  join public.profiles profile on profile.id = referral_code.user_id
  where referral_code.code = v_code
  limit 1;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_referral_stats()
 RETURNS TABLE(referral_code text, total_referrals bigint, completed_referrals bigint, pending_referrals bigint, cancelled_referrals bigint, rewards_granted bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  return query
  select
    (
      select referral_code.code
      from public.referral_codes referral_code
      where referral_code.user_id = v_user_id
    ),
    count(*)::bigint,
    count(*) filter (where referral.status = 'completed')::bigint,
    count(*) filter (where referral.status = 'pending')::bigint,
    count(*) filter (where referral.status = 'cancelled')::bigint,
    count(*) filter (
      where referral.status = 'completed'
        and referral.reward_outcome = 'rewards_granted_v2'
        and exists (
          select 1
          from public.wallet_transactions reward
          where reward.user_id = v_user_id
            and reward.external_reference_id =
              'referral_reward_v2:inviter:' || referral.id::text
            and reward.amount = 50
        )
    )::bigint
  from public.user_referrals referral
  where referral.referrer_user_id = v_user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_today_accountability_v2(p_timezone text)
 RETURNS TABLE(challenge_id uuid, challenge_title text, verification_type text, start_date timestamp with time zone, duration integer, group_id uuid, group_name text, is_solo boolean, current_streak integer, local_day date, proof_status text, submission_id uuid, correction_reason text, effective_timezone text, longest_streak integer, at_risk boolean, streak_outcome text, outcome_local_day date, previous_streak integer, resulting_streak integer, freeze_used boolean, freezes_remaining integer, days_since_accepted_check_in integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  return query
  with user_context as (
    select public.get_available_streak_freezes(v_user_id) as freeze_count
  ), group_obligations as (
    select
      ch.id as challenge_id,
      ch.title::text as challenge_title,
      ch.verification_type::text as verification_type,
      ch.start_date,
      ch.duration,
      team.id as group_id,
      team.name::text as group_name,
      false as is_solo,
      greatest(coalesce(cp.current_streak, 0), 0) as current_streak,
      cp.longest_streak,
      cp.at_risk,
      cp.last_check_in_local_date,
      timezone_context.effective_timezone,
      (pg_catalog.now() at time zone
        timezone_context.effective_timezone)::date as local_day
    from public.team_members membership
    join public.teams team on team.id = membership.group_id
    join public.team_challenges team_challenge
      on team_challenge.group_id = team.id
    join public.challenges ch on ch.id = team_challenge.challenge_id
    join public.challenge_participants cp
      on cp.challenge_id = ch.id
     and cp.user_id = v_user_id
     and coalesce(cp.status, 'active') = 'active'
    cross join lateral (
      select public.get_effective_streak_timezone(
        v_user_id,
        ch.id,
        p_timezone
      ) as effective_timezone
    ) timezone_context
    where membership.user_id = v_user_id
      and cp.joined_at <= pg_catalog.now()
      and coalesce(team.status, 'active') = 'active'
      and coalesce(ch.status, 'active') = 'active'
      and coalesce(ch.completion_status, 'active') = 'active'
      and coalesce(ch.is_expired, false) = false
      and (ch.start_date is null or ch.start_date <= pg_catalog.now())
      and (ch.end_date is null or ch.end_date >= pg_catalog.now())
  ), solo_obligations as (
    select
      ch.id as challenge_id,
      ch.title::text as challenge_title,
      ch.verification_type::text as verification_type,
      ch.start_date,
      ch.duration,
      null::uuid as group_id,
      null::text as group_name,
      true as is_solo,
      greatest(coalesce(cp.current_streak, 0), 0) as current_streak,
      cp.longest_streak,
      cp.at_risk,
      cp.last_check_in_local_date,
      timezone_context.effective_timezone,
      (pg_catalog.now() at time zone
        timezone_context.effective_timezone)::date as local_day
    from public.challenge_participants cp
    join public.challenges ch on ch.id = cp.challenge_id
    cross join lateral (
      select public.get_effective_streak_timezone(
        v_user_id,
        ch.id,
        p_timezone
      ) as effective_timezone
    ) timezone_context
    where cp.user_id = v_user_id
      and coalesce(cp.status, 'active') = 'active'
      and cp.joined_at <= pg_catalog.now()
      and coalesce(ch.allow_self_review, false) = true
      and coalesce(ch.status, 'active') = 'active'
      and coalesce(ch.completion_status, 'active') = 'active'
      and coalesce(ch.is_expired, false) = false
      and (ch.start_date is null or ch.start_date <= pg_catalog.now())
      and (ch.end_date is null or ch.end_date >= pg_catalog.now())
      and not exists (
        select 1
        from public.team_challenges team_challenge
        where team_challenge.challenge_id = ch.id
      )
  ), obligations as (
    select * from group_obligations
    union all
    select * from solo_obligations
  )
  select
    obligation.challenge_id,
    obligation.challenge_title,
    obligation.verification_type,
    obligation.start_date,
    obligation.duration,
    obligation.group_id,
    obligation.group_name,
    obligation.is_solo,
    obligation.current_streak,
    obligation.local_day,
    coalesce(latest_submission.status, 'none')::text as proof_status,
    latest_submission.id as submission_id,
    latest_submission.review_notes as correction_reason,
    obligation.effective_timezone,
    greatest(coalesce(obligation.longest_streak, 0), 0),
    coalesce(obligation.at_risk, false),
    latest_outcome.outcome,
    latest_outcome.local_day,
    latest_outcome.previous_streak,
    latest_outcome.resulting_streak,
    coalesce(latest_outcome.freeze_used, false),
    user_context.freeze_count,
    case
      when obligation.last_check_in_local_date is null then null
      else greatest(
        obligation.local_day - obligation.last_check_in_local_date,
        0
      )
    end
  from obligations obligation
  cross join user_context
  left join lateral (
    select cs.id, cs.status, cs.review_notes, cs.submission_date
    from public.challenge_submissions cs
    where cs.challenge_id = obligation.challenge_id
      and cs.user_id = v_user_id
      and cs.local_day = obligation.local_day
      and cs.status in ('pending', 'approved', 'rejected')
    order by cs.submission_date desc nulls last, cs.id desc
    limit 1
  ) latest_submission on true
  left join lateral (
    select outcome_row.*
    from public.streak_day_outcomes outcome_row
    where outcome_row.challenge_id = obligation.challenge_id
      and outcome_row.user_id = v_user_id
    order by outcome_row.local_day desc, outcome_row.created_at desc
    limit 1
  ) latest_outcome on true
  order by obligation.group_name nulls last, obligation.challenge_title;
end;
$function$;

CREATE OR REPLACE FUNCTION private.economy_action_cost_v1(p_user_id uuid, p_action text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_has_promise boolean;
  v_has_owned_group boolean;
  v_has_membership boolean;
begin
  if p_action in ('join_challenge', 'join_group') then
    return private.participation_join_cost_v1(p_user_id);
  end if;

  if p_action = 'create_challenge' then
    select exists (
      select 1
      from private.first_creation_use_v1 used
      where used.user_id = p_user_id and used.action = 'create_challenge'
    ) into v_has_promise;
    return case when coalesce(v_has_promise, false) then 30 else 0 end;
  end if;

  if p_action = 'create_group' then
    select exists (
      select 1
      from private.first_creation_use_v1 used
      where used.user_id = p_user_id and used.action = 'create_group'
    ) into v_has_owned_group;
    return case when coalesce(v_has_owned_group, false) then 50 else 0 end;
  end if;


  return 0;
end;
$function$;

CREATE OR REPLACE FUNCTION private.settle_referral_v2(p_referral_id uuid, p_referred_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_referral public.user_referrals%rowtype;
  v_profile_id uuid;
  v_programme_enabled boolean;
  v_reward_amount integer;
  v_annual_cap integer;
  v_year_start timestamptz;
  v_year_end timestamptz;
  v_inviter_rewards integer := 0;
  v_referred_transaction_id bigint;
  v_inviter_transaction_id bigint;
  v_referred_balance integer;
begin
  if not exists (
    select 1
    from private.account_activation_receipts activation
    where activation.user_id = p_referred_user_id
      and activation.source = 'first_promise_v1'
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'result_code', case
        when exists (
          select 1
          from private.account_activation_receipts activation
          where activation.user_id = p_referred_user_id
        ) then 'account_not_eligible'
        else 'activation_required'
      end,
      'accepted', false,
      'outcome', case
        when exists (
          select 1
          from private.account_activation_receipts activation
          where activation.user_id = p_referred_user_id
        ) then 'account_not_eligible'
        else 'activation_required'
      end,
      'referral_id', p_referral_id,
      'referral_code', null,
      'status', 'pending',
      'already_claimed', false,
      'reward_outcome', 'pending_activation_v2',
      'referred_reward_amount', 0,
      'inviter_reward_amount', 0,
      'inviter_capped', false
    );
  end if;

  select referral.*
  into v_referral
  from public.user_referrals referral
  where referral.id = p_referral_id
    and referral.referred_user_id = p_referred_user_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'result_code', 'referral_not_found',
      'accepted', false,
      'outcome', 'referral_already_accepted',
      'referral_id', p_referral_id,
      'referral_code', null,
      'status', null,
      'already_claimed', false,
      'reward_outcome', null,
      'referred_reward_amount', 0,
      'inviter_reward_amount', 0,
      'inviter_capped', false
    );
  end if;

  if v_referral.status <> 'pending'
     or v_referral.reward_outcome <> 'pending_activation_v2' then
    return private.referral_existing_result_v2(v_referral);
  end if;

  -- Lock both wallets in one deterministic order before calculating the cap
  -- or changing a balance.
  for v_profile_id in
    select profile.id
    from public.profiles profile
    where profile.id in (
      v_referral.referrer_user_id,
      v_referral.referred_user_id
    )
    order by profile.id
    for update
  loop
    null;
  end loop;

  v_programme_enabled := private.referral_config_boolean_v2(
    'referral_program_enabled_v2',
    false
  );
  v_reward_amount := 50;
  v_annual_cap := 10;

  if not v_programme_enabled then
    update public.user_referrals
    set
      status = 'completed',
      completed_at = now(),
      reward_granted = false,
      reward_outcome = 'programme_disabled_v2'
    where id = v_referral.id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'result_code', 'referral_accepted_v2',
      'accepted', true,
      'outcome', 'program_disabled',
      'referral_id', v_referral.id,
      'referral_code', v_referral.referral_code,
      'authoritative_referral_code', v_referral.referral_code,
      'status', 'completed',
      'authoritative_status', 'completed',
      'already_claimed', false,
      'programme_enabled', false,
      'reward_outcome', 'programme_disabled_v2',
      'referred_reward_amount', 0,
      'inviter_reward_amount', 0,
      'inviter_capped', false
    );
  end if;

  v_year_start := (
    pg_catalog.date_trunc('year', now() at time zone 'UTC')
    at time zone 'UTC'
  );
  v_year_end := v_year_start + interval '1 year';

  select count(*)::integer
  into v_inviter_rewards
  from public.wallet_transactions transaction_row
  where transaction_row.user_id = v_referral.referrer_user_id
    and transaction_row.amount = 50
    and pg_catalog.left(
      transaction_row.external_reference_id,
      pg_catalog.length('referral_reward_v2:inviter:')
    ) = 'referral_reward_v2:inviter:'
    and transaction_row.created_at >= v_year_start
    and transaction_row.created_at < v_year_end;

  insert into public.wallet_transactions (
    user_id,
    amount,
    reason,
    transaction_type,
    description,
    reference_id,
    external_reference_id,
    created_at
  )
  values (
    v_referral.referred_user_id,
    v_reward_amount,
    'Referral reward',
    'bonus',
    'Referral reward for starting a first promise',
    v_referral.id,
    'referral_reward_v2:referred:' || v_referral.id::text,
    now()
  )
  on conflict (external_reference_id)
    where external_reference_id is not null
  do nothing
  returning id into v_referred_transaction_id;

  if v_referred_transaction_id is not null then
    update public.profiles
    set
      momenta_balance = coalesce(momenta_balance, 0) + v_reward_amount,
      updated_at = now()
    where id = v_referral.referred_user_id
    returning momenta_balance into v_referred_balance;
  else
    select profile.momenta_balance
    into v_referred_balance
    from public.profiles profile
    where profile.id = v_referral.referred_user_id;
  end if;

  if v_inviter_rewards < v_annual_cap then
    insert into public.wallet_transactions (
      user_id,
      amount,
      reason,
      transaction_type,
      description,
      reference_id,
      external_reference_id,
      created_at
    )
    values (
      v_referral.referrer_user_id,
      v_reward_amount,
      'Referral reward',
      'bonus',
      'Referral reward for an activated account',
      v_referral.id,
      'referral_reward_v2:inviter:' || v_referral.id::text,
      now()
    )
    on conflict (external_reference_id)
      where external_reference_id is not null
    do nothing
    returning id into v_inviter_transaction_id;

    if v_inviter_transaction_id is not null then
      update public.profiles
      set
        momenta_balance = coalesce(momenta_balance, 0) + v_reward_amount,
        updated_at = now()
      where id = v_referral.referrer_user_id;
    end if;

    update public.user_referrals
    set
      status = 'completed',
      completed_at = now(),
      reward_granted = true,
      reward_outcome = 'rewards_granted_v2'
    where id = v_referral.id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'result_code', 'referral_accepted_v2',
      'accepted', true,
      'outcome', 'both_rewarded',
      'referral_id', v_referral.id,
      'referral_code', v_referral.referral_code,
      'authoritative_referral_code', v_referral.referral_code,
      'status', 'completed',
      'authoritative_status', 'completed',
      'already_claimed', false,
      'programme_enabled', true,
      'reward_outcome', 'rewards_granted_v2',
      'referred_reward_amount', v_reward_amount,
      'referred_balance', coalesce(v_referred_balance, 0),
      'inviter_reward_amount', v_reward_amount,
      'inviter_capped', false
    );
  end if;

  update public.user_referrals
  set
    status = 'completed',
    completed_at = now(),
    reward_granted = false,
    reward_outcome = 'inviter_capped_v2'
  where id = v_referral.id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', 'referral_accepted_v2',
    'accepted', true,
    'outcome', 'inviter_capped',
    'referral_id', v_referral.id,
    'referral_code', v_referral.referral_code,
    'authoritative_referral_code', v_referral.referral_code,
    'status', 'completed',
    'authoritative_status', 'completed',
    'already_claimed', false,
    'programme_enabled', true,
    'reward_outcome', 'inviter_capped_v2',
    'referred_reward_amount', v_reward_amount,
    'referred_balance', coalesce(v_referred_balance, 0),
    'inviter_reward_amount', 0,
    'inviter_capped', true
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.economy_user_is_pro_v1(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.user_is_pro(p_user_id);
$function$;

CREATE OR REPLACE FUNCTION private.economy_active_promise_count_v1(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select count(*)::integer
  from public.challenge_participants participant
  join public.challenges challenge
    on challenge.id = participant.challenge_id
  where participant.user_id = p_user_id
    and participant.status = 'active'
    and coalesce(challenge.status, 'active') = 'active'
    and coalesce(challenge.completion_status, 'active') = 'active'
    and coalesce(challenge.is_expired, false) = false;
$function$;

CREATE OR REPLACE FUNCTION private.economy_active_group_count_v1(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select count(*)::integer
  from public.team_members membership
  join public.teams team on team.id = membership.group_id
  where membership.user_id = p_user_id
    and team.kind = 'saved'
    and coalesce(team.status, 'active') = 'active';
$function$;

CREATE OR REPLACE FUNCTION private.ensure_welcome_reward_v1(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_external_reference text := 'welcome_bonus_v1:' || p_user_id::text;
  v_flag_granted boolean := false;
  v_existing_amount integer;
  v_inserted_id bigint;
  v_balance integer;
begin
  select profile.momenta_balance
  into v_balance
  from public.profiles profile
  where profile.id = p_user_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PROFILE_NOT_FOUND'
    );
  end if;

  -- Only the transaction that creates the first promise may call this helper.
  -- A compatibility RPC or later promise must never mint the activation grant.
  if exists (
    select 1
    from private.account_activation_receipts activation
    where activation.user_id = p_user_id
  ) or exists (
    select 1
    from public.challenges challenge
    where challenge.creator_id = p_user_id
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'granted', false,
      'error', 'ACTIVATION_REQUIRED',
      'outcome', 'activation_required',
      'amount', 0,
      'balance', coalesce(v_balance, 0),
      'external_reference_id', null
    );
  end if;

  insert into public.user_flags (user_id, welcome_bonus_granted)
  values (p_user_id, false)
  on conflict (user_id) do nothing;

  select coalesce(flags.welcome_bonus_granted, false)
  into v_flag_granted
  from public.user_flags flags
  where flags.user_id = p_user_id
  for update;

  select transaction_row.amount
  into v_existing_amount
  from public.wallet_transactions transaction_row
  where transaction_row.external_reference_id = v_external_reference
  limit 1;

  if found and v_existing_amount = 100 then
    update public.user_flags
    set
      welcome_bonus_granted = true,
      updated_at = now()
    where user_id = p_user_id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'granted', false,
      'outcome', 'already_confirmed',
      'amount', 100,
      'balance', coalesce(v_balance, 0),
      'external_reference_id', v_external_reference
    );
  end if;

  if found then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'granted', false,
      'outcome', 'legacy_not_backfilled',
      'amount', 0,
      'balance', coalesce(v_balance, 0),
      'external_reference_id', null
    );
  end if;

  -- A historical true flag without the exact immutable ledger receipt cannot
  -- be safely replayed. Record no new reward and do not synthesize history.
  if v_flag_granted then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'granted', false,
      'outcome', 'legacy_not_backfilled',
      'amount', 0,
      'balance', coalesce(v_balance, 0),
      'external_reference_id', null
    );
  end if;

  insert into public.wallet_transactions (
    user_id,
    amount,
    reason,
    transaction_type,
    description,
    reference_id,
    external_reference_id,
    created_at
  )
  values (
    p_user_id,
    100,
    'Onboarding bonus',
    'bonus',
    'Onboarding bonus',
    p_user_id,
    v_external_reference,
    now()
  )
  on conflict (external_reference_id)
    where external_reference_id is not null
  do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    update public.user_flags
    set
      welcome_bonus_granted = true,
      updated_at = now()
    where user_id = p_user_id;

    select profile.momenta_balance
    into v_balance
    from public.profiles profile
    where profile.id = p_user_id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'granted', false,
      'outcome', 'already_confirmed',
      'amount', 100,
      'balance', coalesce(v_balance, 0),
      'external_reference_id', v_external_reference
    );
  end if;

  update public.profiles
  set
    momenta_balance = coalesce(momenta_balance, 0) + 100,
    updated_at = now()
  where id = p_user_id
  returning momenta_balance into v_balance;

  update public.user_flags
  set
    welcome_bonus_granted = true,
    welcome_bonus_dismissed = false,
    updated_at = now()
  where user_id = p_user_id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'granted', true,
    'outcome', 'granted_now',
    'amount', 100,
    'balance', v_balance,
    'external_reference_id', v_external_reference
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.referral_existing_result_v2(p_referral user_referrals)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_inviter_amount integer := 0;
  v_referred_amount integer := 0;
  v_outcome text;
begin
  select coalesce(transaction_row.amount, 0)
  into v_referred_amount
  from public.wallet_transactions transaction_row
  where transaction_row.external_reference_id =
    'referral_reward_v2:referred:' || p_referral.id::text
  limit 1;

  select coalesce(transaction_row.amount, 0)
  into v_inviter_amount
  from public.wallet_transactions transaction_row
  where transaction_row.external_reference_id =
    'referral_reward_v2:inviter:' || p_referral.id::text
  limit 1;

  v_outcome := case p_referral.reward_outcome
    when 'pending_activation_v2' then 'pending_activation'
    when 'cancelled_before_activation_v2' then 'cancelled'
    when 'account_not_eligible_v2' then 'account_not_eligible'
    when 'rewards_granted_v2' then 'both_rewarded'
    when 'inviter_capped_v2' then 'inviter_capped'
    when 'programme_disabled_v2' then 'program_disabled'
    else 'referral_already_accepted'
  end;

  return pg_catalog.jsonb_build_object(
    'success', p_referral.reward_outcome in (
      'rewards_granted_v2',
      'inviter_capped_v2',
      'programme_disabled_v2'
    ),
    'result_code', case
      when p_referral.reward_outcome = 'pending_activation_v2'
        then 'activation_required'
      when p_referral.reward_outcome = 'cancelled_before_activation_v2'
        then 'referral_cancelled'
      when p_referral.reward_outcome = 'account_not_eligible_v2'
        then 'account_not_eligible'
      when p_referral.reward_outcome in (
        'rewards_granted_v2',
        'inviter_capped_v2',
        'programme_disabled_v2'
      ) then 'referral_accepted_v2'
      else 'already_claimed'
    end,
    'accepted', p_referral.reward_outcome in (
      'rewards_granted_v2',
      'inviter_capped_v2',
      'programme_disabled_v2'
    ),
    'outcome', v_outcome,
    'referral_id', p_referral.id,
    'referral_code', p_referral.referral_code,
    'authoritative_referral_code', p_referral.referral_code,
    'status', p_referral.status,
    'authoritative_status', p_referral.status,
    'already_claimed', p_referral.reward_outcome <> 'pending_activation_v2',
    'reward_outcome', p_referral.reward_outcome,
    'referred_reward_amount', coalesce(v_referred_amount, 0),
    'inviter_reward_amount', coalesce(v_inviter_amount, 0),
    'inviter_capped', p_referral.reward_outcome = 'inviter_capped_v2'
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.finalise_account_activation_v1(p_user_id uuid, p_first_promise_id uuid, p_first_promise_title text, p_first_promise_next_due_at timestamp with time zone, p_welcome_result jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_activation private.account_activation_receipts%rowtype;
  v_inserted boolean := false;
  v_pending_referral_id uuid;
  v_referral_result jsonb;
  v_welcome_outcome text := coalesce(
    p_welcome_result ->> 'outcome',
    'legacy_not_backfilled'
  );
  v_welcome_amount integer := case
    when coalesce(p_welcome_result ->> 'outcome', '') in (
      'granted_now',
      'already_confirmed'
    ) then 100
    else 0
  end;
  v_welcome_reference text := case
    when coalesce(p_welcome_result ->> 'outcome', '') in (
      'granted_now',
      'already_confirmed'
    ) then p_welcome_result ->> 'external_reference_id'
    else null
  end;
  v_receipt_source text := case
    when p_welcome_result ? 'outcome' then 'first_promise_v1'
    else 'legacy_existing_promise'
  end;
  v_receipt_promise_id uuid := p_first_promise_id;
  v_receipt_promise_title text := p_first_promise_title;
  v_receipt_next_due_at timestamptz := p_first_promise_next_due_at;
  v_activated_at timestamptz := now();
  v_ineligible_referral public.user_referrals%rowtype;
begin
  if v_receipt_source = 'legacy_existing_promise' then
    select
      challenge.id,
      challenge.title,
      coalesce(challenge.created_at, now())
    into
      v_receipt_promise_id,
      v_receipt_promise_title,
      v_activated_at
    from public.challenges challenge
    where challenge.creator_id = p_user_id
    order by challenge.created_at asc nulls last, challenge.id asc
    limit 1;

    v_receipt_promise_id := coalesce(
      v_receipt_promise_id,
      p_first_promise_id
    );
    v_receipt_promise_title := coalesce(
      v_receipt_promise_title,
      p_first_promise_title
    );
    v_receipt_next_due_at := null;
  elsif v_receipt_promise_title is null then
    select challenge.title
    into v_receipt_promise_title
    from public.challenges challenge
    where challenge.id = v_receipt_promise_id
      and challenge.creator_id = p_user_id;
  end if;

  insert into private.account_activation_receipts (
    user_id,
    first_promise_id,
    first_promise_title,
    first_promise_next_due_at,
    activated_at,
    source,
    welcome_reward_outcome,
    welcome_reward_amount,
    welcome_ledger_reference
  )
  values (
    p_user_id,
    v_receipt_promise_id,
    v_receipt_promise_title,
    v_receipt_next_due_at,
    v_activated_at,
    v_receipt_source,
    v_welcome_outcome,
    v_welcome_amount,
    v_welcome_reference
  )
  on conflict (user_id) do nothing
  returning * into v_activation;

  v_inserted := found;

  if not v_inserted then
    select activation.*
    into v_activation
    from private.account_activation_receipts activation
    where activation.user_id = p_user_id;

    if v_activation.first_promise_title is null then
      select challenge.title
      into v_receipt_promise_title
      from public.challenges challenge
      where challenge.id = v_activation.first_promise_id
        and challenge.creator_id = p_user_id;

      update private.account_activation_receipts
      set first_promise_title = v_receipt_promise_title
      where user_id = p_user_id
        and first_promise_title is null
      returning * into v_activation;
    end if;
  else
    update public.profiles
    set
      has_completed_onboarding = true,
      onboarded_at = coalesce(onboarded_at, v_activation.activated_at),
      updated_at = now()
    where id = p_user_id;

    select referral.id
    into v_pending_referral_id
    from public.user_referrals referral
    where referral.referred_user_id = p_user_id
      and referral.status = 'pending'
      and referral.reward_outcome = 'pending_activation_v2'
    order by referral.created_at asc, referral.id asc
    limit 1;

    if v_pending_referral_id is not null then
      if v_activation.source = 'first_promise_v1' then
        v_referral_result := private.settle_referral_v2(
          v_pending_referral_id,
          p_user_id
        );
      else
        update public.user_referrals
        set
          status = 'completed',
          completed_at = now(),
          reward_granted = false,
          reward_outcome = 'account_not_eligible_v2'
        where id = v_pending_referral_id
        returning * into v_ineligible_referral;

        v_referral_result := private.referral_existing_result_v2(
          v_ineligible_referral
        );
      end if;
    end if;
  end if;

  return pg_catalog.jsonb_build_object(
    'confirmed', true,
    'status', 'confirmed',
    'activation_status', 'confirmed',
    'activated', v_inserted,
    'activated_at', v_activation.activated_at,
    'first_promise_id', v_activation.first_promise_id,
    'first_promise_title', v_activation.first_promise_title,
    'first_promise_next_due_at', v_activation.first_promise_next_due_at,
    'source', v_activation.source,
    'welcome_momenta', pg_catalog.jsonb_build_object(
      'granted',
        v_inserted and v_activation.welcome_reward_outcome = 'granted_now',
      'amount', v_activation.welcome_reward_amount,
      'outcome', case
        when not v_inserted
          and v_activation.welcome_reward_outcome in (
            'granted_now',
            'already_confirmed'
          )
          then 'already_confirmed'
        else v_activation.welcome_reward_outcome
      end
    ),
    'referral', v_referral_result
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_account_activation_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_activation private.account_activation_receipts%rowtype;
  v_referral public.user_referrals%rowtype;
  v_referral_result jsonb;
  v_first_promise_title text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  select activation.*
  into v_activation
  from private.account_activation_receipts activation
  where activation.user_id = v_user_id;

  if not found then
    select referral.*
    into v_referral
    from public.user_referrals referral
    where referral.referred_user_id = v_user_id
      and referral.status = 'pending'
      and referral.reward_outcome = 'pending_activation_v2'
    limit 1;

    if found then
      v_referral_result := private.referral_existing_result_v2(v_referral);
    end if;

    return pg_catalog.jsonb_build_object(
      'status', 'absent',
      'activation_status', 'absent',
      'confirmed', false,
      'first_promise_id', null,
      'first_promise_title', null,
      'referral', v_referral_result
    );
  end if;

  v_first_promise_title := v_activation.first_promise_title;

  if v_first_promise_title is null then
    select challenge.title
    into v_first_promise_title
    from public.challenges challenge
    where challenge.id = v_activation.first_promise_id
      and challenge.creator_id = v_user_id;
  end if;

  select referral.*
  into v_referral
  from public.user_referrals referral
  where referral.referred_user_id = v_user_id
    and referral.status <> 'cancelled'
  limit 1;

  if found then
    v_referral_result := private.referral_existing_result_v2(v_referral);
  end if;

  return pg_catalog.jsonb_build_object(
    'status', 'confirmed',
    'activation_status', 'confirmed',
    'confirmed', true,
    'activated', false,
    'activated_at', v_activation.activated_at,
    'first_promise_id', v_activation.first_promise_id,
    'first_promise_title', v_first_promise_title,
    'first_promise_next_due_at', v_activation.first_promise_next_due_at,
    'source', v_activation.source,
    'welcome_momenta', pg_catalog.jsonb_build_object(
      'granted', false,
      'amount', v_activation.welcome_reward_amount,
      'outcome', case
        when v_activation.welcome_reward_outcome in (
          'granted_now',
          'already_confirmed'
        )
          then 'already_confirmed'
        else v_activation.welcome_reward_outcome
      end
    ),
    'referral', v_referral_result
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.list_my_referrals(p_limit integer DEFAULT 100)
 RETURNS TABLE(referral_id uuid, status text, reward_granted boolean, created_at timestamp with time zone, completed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if p_limit not between 1 and 100 then
    raise exception 'INVALID_REFERRAL_LIST_LIMIT' using errcode = '22023';
  end if;

  return query
  select
    referral.id,
    referral.status::text,
    (
      referral.status = 'completed'
      and referral.reward_outcome = 'rewards_granted_v2'
      and exists (
        select 1
        from public.wallet_transactions reward
        where reward.user_id = v_user_id
          and reward.external_reference_id =
            'referral_reward_v2:inviter:' || referral.id::text
          and reward.amount = 50
      )
    ),
    referral.created_at,
    referral.completed_at
  from public.user_referrals referral
  where referral.referrer_user_id = v_user_id
  order by referral.created_at desc, referral.id desc
  limit p_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.list_my_referrals_v2(p_limit integer DEFAULT 100)
 RETURNS TABLE(referral_id uuid, status text, reward_outcome text, reward_granted boolean, inviter_reward_amount integer, created_at timestamp with time zone, completed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if p_limit not between 1 and 100 then
    raise exception 'INVALID_REFERRAL_LIST_LIMIT' using errcode = '22023';
  end if;

  return query
  select
    referral.id,
    referral.status::text,
    referral.reward_outcome,
    (
      referral.status = 'completed'
      and referral.reward_outcome = 'rewards_granted_v2'
      and reward.external_reference_id is not null
    ),
    coalesce(reward.amount, 0),
    referral.created_at,
    referral.completed_at
  from public.user_referrals referral
  left join public.wallet_transactions reward
    on reward.user_id = v_user_id
   and reward.external_reference_id =
     'referral_reward_v2:inviter:' || referral.id::text
  where referral.referrer_user_id = v_user_id
  order by referral.created_at desc, referral.id desc
  limit p_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_revenuecat_webhook_event(p_provider_event_id text, p_event_type text, p_event_at timestamp with time zone, p_user_id uuid, p_store text, p_product_id text, p_transaction_id text, p_original_transaction_id text, p_purchase_at timestamp with time zone, p_expires_at timestamp with time zone, p_amount_cents integer, p_currency text, p_entitlement_keys text[], p_entitlement_state boolean, p_credit_amount integer, p_credit_reason text, p_credit_transaction_type text, p_credit_external_reference_id text, p_credit_description text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_event_inserted text;
  v_existing_status text;
  v_profile_exists boolean := false;
  v_entitlement_key text;
  v_key_changed boolean;
  v_changed_count integer := 0;
  v_has_active_pro boolean := false;
  v_reconciliation_keys text[] := '{}'::text[];
  v_status text := 'accepted';
  v_ignored_reason text;
  v_credit_result jsonb;
begin
  if p_provider_event_id is null or pg_catalog.btrim(p_provider_event_id) = '' then
    raise exception 'PROVIDER_EVENT_ID_REQUIRED';
  end if;

  -- Take the account lock before a retry row lock. A newer event may resolve a
  -- pending row in the same transaction, so the reverse order can deadlock.
  if p_user_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'revenuecat-entitlement:' || p_user_id::text,
        0
      )
    );
  end if;

  insert into public.rc_webhook_events (
    provider_event_id,
    event_type,
    event_at,
    target_user_id,
    user_id,
    store,
    transaction_id,
    entitlement_keys,
    payload
  )
  values (
    p_provider_event_id,
    coalesce(nullif(pg_catalog.btrim(p_event_type), ''), 'UNKNOWN'),
    p_event_at,
    p_user_id,
    case
      when p_user_id is not null
        and exists (select 1 from public.profiles where id = p_user_id)
      then p_user_id
      else null
    end,
    coalesce(nullif(pg_catalog.btrim(p_store), ''), 'unknown'),
    p_transaction_id,
    coalesce(p_entitlement_keys, '{}'::text[]),
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (provider_event_id) do nothing
  returning provider_event_id into v_event_inserted;

  if v_event_inserted is null then
    select processing_status
    into v_existing_status
    from public.rc_webhook_events
    where provider_event_id = p_provider_event_id
    for update;

    if v_existing_status <> 'retry' then
      return pg_catalog.jsonb_build_object(
        'accepted', true,
        'duplicate', true,
        'entitlement_applied', false,
        'status', 'duplicate'
      );
    end if;

    update public.rc_webhook_events
    set
      event_type = coalesce(
        nullif(pg_catalog.btrim(p_event_type), ''),
        event_type
      ),
      event_at = coalesce(p_event_at, event_at),
      target_user_id = coalesce(p_user_id, target_user_id),
      store = coalesce(
        nullif(pg_catalog.btrim(p_store), ''),
        store
      ),
      transaction_id = coalesce(p_transaction_id, transaction_id),
      entitlement_keys = coalesce(
        p_entitlement_keys,
        entitlement_keys
      ),
      payload = coalesce(p_payload, payload),
      attempt_count = attempt_count + 1,
      last_attempt_at = pg_catalog.now(),
      ignored_reason = null,
      processed_at = null
    where provider_event_id = p_provider_event_id;
  end if;

  if p_user_id is not null then
    select exists (
      select 1
      from public.profiles
      where id = p_user_id
    ) into v_profile_exists;
  end if;

  if v_profile_exists then
    update public.rc_webhook_events
    set user_id = p_user_id
    where provider_event_id = p_provider_event_id
      and user_id is distinct from p_user_id;
  end if;

  insert into public.rc_receipts (
    store,
    product_id,
    transaction_id,
    original_transaction_id,
    user_id,
    purchase_at,
    expires_at,
    amount_cents,
    currency,
    payload
  )
  values (
    coalesce(nullif(pg_catalog.btrim(p_store), ''), 'unknown'),
    coalesce(nullif(pg_catalog.btrim(p_product_id), ''), 'unknown_product'),
    p_transaction_id,
    p_original_transaction_id,
    case when v_profile_exists then p_user_id else null end,
    p_purchase_at,
    p_expires_at,
    p_amount_cents,
    p_currency,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (store, transaction_id) do update
  set user_id = coalesce(
    public.rc_receipts.user_id,
    excluded.user_id
  );

  if not v_profile_exists then
    v_status := 'retry';
    v_ignored_reason := 'profile_not_found';
  elsif p_credit_amount is not null and p_credit_amount > 0 then
    if p_credit_external_reference_id is null
       or pg_catalog.btrim(p_credit_external_reference_id) = '' then
      raise exception 'CREDIT_EXTERNAL_REFERENCE_REQUIRED';
    end if;

    select public.grant_momenta_credit(
      p_user_id,
      p_credit_amount,
      p_credit_reason,
      p_credit_transaction_type,
      p_credit_external_reference_id,
      p_credit_description
    ) into v_credit_result;
  end if;

  if v_profile_exists and p_entitlement_state is not null then
    if p_event_at is null then
      v_status := 'ignored';
      v_ignored_reason := 'missing_event_timestamp';
    elsif coalesce(pg_catalog.array_length(p_entitlement_keys, 1), 0) = 0 then
      v_status := 'ignored';
      v_ignored_reason := 'missing_entitlement_ids';
    else
      select coalesce(
        pg_catalog.array_agg(entitlement_key order by entitlement_key),
        '{}'::text[]
      )
      into v_reconciliation_keys
      from public.rc_entitlements
      where user_id = p_user_id
        and entitlement_key = any (p_entitlement_keys)
        and last_provider_event_at = p_event_at
        and last_provider_event_id is distinct from p_provider_event_id
        and is_active is distinct from p_entitlement_state;

      if pg_catalog.cardinality(v_reconciliation_keys) > 0 then
        v_status := 'retry';
        v_ignored_reason := 'ambiguous_equal_timestamp';
      else
        foreach v_entitlement_key in array p_entitlement_keys
        loop
          with changed as (
            insert into public.rc_entitlements (
              user_id,
              entitlement_key,
              is_active,
              starts_at,
              ends_at,
              source,
              last_event_at,
              last_provider_event_at,
              last_provider_event_id
            )
            values (
              p_user_id,
              v_entitlement_key,
              p_entitlement_state,
              p_purchase_at,
              p_expires_at,
              p_store,
              pg_catalog.now(),
              p_event_at,
              p_provider_event_id
            )
            on conflict (user_id, entitlement_key) do update
            set
              is_active = excluded.is_active,
              starts_at = excluded.starts_at,
              ends_at = excluded.ends_at,
              source = excluded.source,
              last_event_at = pg_catalog.now(),
              last_provider_event_at = excluded.last_provider_event_at,
              last_provider_event_id = excluded.last_provider_event_id
            where public.rc_entitlements.last_provider_event_at is null
               or excluded.last_provider_event_at > public.rc_entitlements.last_provider_event_at
            returning true
          )
          select coalesce(pg_catalog.bool_or(true), false)
          into v_key_changed
          from changed;

          if v_key_changed then
            v_changed_count := v_changed_count + 1;
          end if;
        end loop;

        if v_changed_count = 0 then
          v_status := 'ignored';
          v_ignored_reason := 'stale_event_time';
        else
          v_status := 'applied';
        end if;
      end if;

      if v_status = 'applied' then
        select exists (
          select 1
          from public.rc_entitlements
          where user_id = p_user_id
            and is_active = true
            and entitlement_key = any (array['pro_access', 'Pro', 'pro']::text[])
        ) into v_has_active_pro;

        update public.profiles
        set is_pro = v_has_active_pro
        where id = p_user_id
          and is_pro is distinct from v_has_active_pro;

        with pending_resolution as (
          select
            e.provider_event_id,
            array(
              select unresolved_key
              from pg_catalog.unnest(e.reconciliation_keys) as unresolved_key
              where unresolved_key <> all (p_entitlement_keys)
              order by unresolved_key
            ) as remaining_keys
          from public.rc_webhook_events e
          where e.provider_event_id <> p_provider_event_id
            and e.target_user_id = p_user_id
            and e.processing_status = 'retry'
            and e.ignored_reason = 'ambiguous_equal_timestamp'
            and e.event_at < p_event_at
            and e.reconciliation_keys && p_entitlement_keys
        )
        update public.rc_webhook_events e
        set
          reconciliation_keys = pending_resolution.remaining_keys,
          processing_status = case
            when pg_catalog.cardinality(pending_resolution.remaining_keys) = 0
              then 'ignored'
            else 'retry'
          end,
          ignored_reason = case
            when pg_catalog.cardinality(pending_resolution.remaining_keys) = 0
              then 'superseded_by_newer_event'
            else 'ambiguous_equal_timestamp'
          end,
          processed_at = case
            when pg_catalog.cardinality(pending_resolution.remaining_keys) = 0
              then pg_catalog.now()
            else null
          end
        from pending_resolution
        where e.provider_event_id = pending_resolution.provider_event_id;
      end if;
    end if;
  end if;

  update public.rc_webhook_events
  set
    processing_status = v_status,
    ignored_reason = v_ignored_reason,
    reconciliation_keys = case
      when v_status = 'retry'
        and v_ignored_reason = 'ambiguous_equal_timestamp'
        then v_reconciliation_keys
      else '{}'::text[]
    end,
    processed_at = case
      when v_status = 'retry' then null
      else pg_catalog.now()
    end
  where provider_event_id = p_provider_event_id;

  return pg_catalog.jsonb_build_object(
    'accepted', true,
    'duplicate', false,
    'entitlement_applied', v_changed_count > 0,
    'status', v_status,
    'ignored_reason', v_ignored_reason,
    'credit_result', v_credit_result
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_referral_program_v2()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_year_start timestamptz;
  v_year_end timestamptz;
  v_reward_count integer;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  v_year_start := (
    pg_catalog.date_trunc('year', now() at time zone 'UTC')
    at time zone 'UTC'
  );
  v_year_end := v_year_start + interval '1 year';

  select count(*)::integer
  into v_reward_count
  from public.wallet_transactions transaction_row
  where transaction_row.user_id = v_user_id
    and transaction_row.amount = 50
    and pg_catalog.left(
      transaction_row.external_reference_id,
      pg_catalog.length('referral_reward_v2:inviter:')
    ) = 'referral_reward_v2:inviter:'
    and transaction_row.created_at >= v_year_start
    and transaction_row.created_at < v_year_end;

  return pg_catalog.jsonb_build_object(
    'programme_enabled', private.referral_config_boolean_v2(
      'referral_program_enabled_v2',
      false
    ),
    'reward_amount', 50,
    'inviter_annual_cap', 10,
    'inviter_rewards_this_year', coalesce(v_reward_count, 0),
    'inviter_cap_resets_at', v_year_end
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.accept_referral_v2(p_referral_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_referral_code, '')));
  v_referrer_user_id uuid;
  v_referral public.user_referrals%rowtype;
  v_activation_source text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('account-activation:' || v_user_id::text, 0)
  );

  select activation.source
  into v_activation_source
  from private.account_activation_receipts activation
  where activation.user_id = v_user_id;

  -- Once a referred account has a row, that row remains authoritative. A
  -- replay cannot swap the inviter by submitting a different valid code.
  select referral.*
  into v_referral
  from public.user_referrals referral
  where referral.referred_user_id = v_user_id
  limit 1;

  if found then
    if v_referral.referral_code <> v_code then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'result_code', 'referral_code_mismatch',
        'accepted', false,
        'outcome', 'referral_code_mismatch',
        'referral_id', v_referral.id,
        'referral_code', v_referral.referral_code,
        'authoritative_referral_code', v_referral.referral_code,
        'status', v_referral.status,
        'authoritative_status', v_referral.status,
        'already_claimed', v_referral.status <> 'pending',
        'reward_outcome', v_referral.reward_outcome,
        'referred_reward_amount', 0,
        'inviter_reward_amount', 0,
        'inviter_capped', false
      );
    end if;

    if v_referral.status = 'pending'
       and v_referral.reward_outcome = 'pending_activation_v2'
       and v_activation_source = 'first_promise_v1' then
      return private.settle_referral_v2(v_referral.id, v_user_id);
    end if;

    return private.referral_existing_result_v2(v_referral);
  end if;

  if v_code !~ '^[0-9A-F]{32}$' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'result_code', 'invalid_referral_code',
      'accepted', false,
      'outcome', 'invalid_code',
      'reward_outcome', null,
      'referred_reward_amount', 0,
      'inviter_reward_amount', 0
    );
  end if;

  -- New v2 referrals must exist before the first-promise transaction starts.
  -- Existing rows can replay or recover above, but an activated account cannot
  -- add a new inviter and receive a reward after the activation boundary.
  if v_activation_source is not null
     or exists (
       select 1
       from public.challenges challenge
       where challenge.creator_id = v_user_id
     ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'result_code', 'account_not_eligible',
      'accepted', false,
      'outcome', 'account_not_eligible',
      'reward_outcome', null,
      'referred_reward_amount', 0,
      'inviter_reward_amount', 0
    );
  end if;

  select code.user_id
  into v_referrer_user_id
  from public.referral_codes code
  where code.code = v_code;

  if v_referrer_user_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'result_code', 'invalid_referral_code',
      'accepted', false,
      'outcome', 'invalid_code',
      'reward_outcome', null,
      'referred_reward_amount', 0,
      'inviter_reward_amount', 0
    );
  end if;

  if v_referrer_user_id = v_user_id then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'result_code', 'self_referral',
      'accepted', false,
      'outcome', 'self_referral',
      'reward_outcome', null,
      'referred_reward_amount', 0,
      'inviter_reward_amount', 0
    );
  end if;

  insert into public.user_referrals (
    referrer_user_id,
    referred_user_id,
    referral_code,
    status,
    reward_granted,
    reward_outcome
  )
  values (
    v_referrer_user_id,
    v_user_id,
    v_code,
    'pending',
    false,
    'pending_activation_v2'
  )
  returning * into v_referral;

  return private.referral_existing_result_v2(v_referral)
    || pg_catalog.jsonb_build_object('already_claimed', false);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_pending_referral_v2()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_referral public.user_referrals%rowtype;
  v_referral_found boolean := false;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('account-activation:' || v_user_id::text, 0)
  );

  select referral.*
  into v_referral
  from public.user_referrals referral
  where referral.referred_user_id = v_user_id
  for update;

  v_referral_found := found;

  -- Preserve the row as a durable cancellation receipt. A retry after a lost
  -- response succeeds even if account activation happened afterwards.
  if v_referral_found
     and v_referral.status = 'cancelled'
     and v_referral.reward_outcome in (
       'cancelled_before_activation_v2',
       'legacy_no_reward'
     ) then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'cancelled', true,
      'outcome', 'cancelled',
      'result_code', 'referral_cancelled',
      'referral_id', v_referral.id,
      'referral_code', v_referral.referral_code,
      'status', 'cancelled',
      'cancelled_at', v_referral.completed_at,
      'replayed', true
    );
  end if;

  if exists (
    select 1
    from private.account_activation_receipts activation
    where activation.user_id = v_user_id
  ) or exists (
    select 1
    from public.challenges challenge
    where challenge.creator_id = v_user_id
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'cancelled', false,
      'outcome', 'activation_confirmed',
      'status', case when v_referral_found then v_referral.status else null end,
      'replayed', false
    );
  end if;

  if not v_referral_found then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'cancelled', false,
      'outcome', 'no_pending_referral',
      'status', 'absent',
      'replayed', true
    );
  end if;

  if v_referral.status <> 'pending'
     or v_referral.reward_outcome <> 'pending_activation_v2' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'cancelled', false,
      'outcome', 'referral_already_final',
      'referral_id', v_referral.id,
      'referral_code', v_referral.referral_code,
      'status', v_referral.status,
      'replayed', false
    );
  end if;

  update public.user_referrals
  set
    status = 'cancelled',
    reward_outcome = 'cancelled_before_activation_v2',
    completed_at = now()
  where id = v_referral.id
  returning * into v_referral;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'cancelled', true,
    'outcome', 'cancelled',
    'result_code', 'referral_cancelled',
    'referral_id', v_referral.id,
    'referral_code', v_referral.referral_code,
    'status', 'cancelled',
    'cancelled_at', v_referral.completed_at,
    'replayed', false
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.claim_referral_code(p_referral_code text)
 RETURNS TABLE(success boolean, result_code text, referral_id uuid, status text, already_claimed boolean, reward_granted boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_referral_code, '')));
  v_referrer_user_id uuid;
  v_referral public.user_referrals%rowtype;
  v_settlement jsonb;
  v_was_existing boolean := false;
  v_is_post_activation boolean := false;
  v_has_completed_onboarding boolean;
  v_profile_created_at timestamptz;
begin
  if v_user_id is null then
    return query select false, 'AUTH_REQUIRED', null::uuid, null::text, false, false;
    return;
  end if;

  if not public.current_session_is_active() then
    return query select false, 'AUTH_SESSION_REVOKED', null::uuid, null::text, false, false;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('account-activation:' || v_user_id::text, 0)
  );

  select profile.has_completed_onboarding, profile.created_at
  into v_has_completed_onboarding, v_profile_created_at
  from public.profiles profile
  where profile.id = v_user_id;

  if not found then
    return query
    select false, 'PROFILE_NOT_FOUND', null::uuid, null::text, false, false;
    return;
  end if;

  -- Preserve the installed-client replay contract before applying eligibility
  -- rules to a new claim.
  select referral.*
  into v_referral
  from public.user_referrals referral
  where referral.referred_user_id = v_user_id
  limit 1;

  v_was_existing := found;

  if v_was_existing and v_referral.referral_code <> v_code then
    return query
    select
      false,
      'REFERRAL_CODE_MISMATCH',
      v_referral.id,
      v_referral.status::text,
      v_referral.status <> 'pending',
      false;
    return;
  end if;

  if not v_was_existing and v_code !~ '^[0-9A-F]{32}$' then
    return query
    select false, 'INVALID_REFERRAL_CODE', null::uuid, null::text, false, false;
    return;
  end if;

  if v_was_existing and v_referral.status = 'cancelled' then
    return query
    select
      false,
      'REFERRAL_CANCELLED',
      v_referral.id,
      'cancelled',
      true,
      false;
    return;
  end if;

  if not v_was_existing then
    if v_has_completed_onboarding
      and v_profile_created_at < now() - interval '24 hours'
    then
      return query
      select
        false,
        'REFERRAL_NOT_ELIGIBLE',
        null::uuid,
        null::text,
        false,
        false;
      return;
    end if;

    if exists (
      select 1
      from private.account_activation_receipts activation
      where activation.user_id = v_user_id
        and activation.source = 'legacy_existing_promise'
    ) then
      return query
      select
        false,
        'ACCOUNT_NOT_ELIGIBLE',
        null::uuid,
        null::text,
        false,
        false;
      return;
    end if;

    if not exists (
      select 1
      from private.account_activation_receipts activation
      where activation.user_id = v_user_id
    ) and exists (
      select 1
      from public.challenges challenge
      where challenge.creator_id = v_user_id
    ) then
      return query
      select
        false,
        'ACCOUNT_NOT_ELIGIBLE',
        null::uuid,
        null::text,
        false,
        false;
      return;
    end if;

    select exists (
      select 1
      from private.account_activation_receipts activation
      where activation.user_id = v_user_id
        and activation.source = 'first_promise_v1'
    )
    into v_is_post_activation;

    select code.user_id
    into v_referrer_user_id
    from public.referral_codes code
    where code.code = v_code;

    if v_referrer_user_id is null then
      return query
      select false, 'REFERRAL_NOT_FOUND', null::uuid, null::text, false, false;
      return;
    end if;

    if v_referrer_user_id = v_user_id then
      return query
      select false, 'SELF_REFERRAL', null::uuid, null::text, false, false;
      return;
    end if;

    insert into public.user_referrals (
      referrer_user_id,
      referred_user_id,
      referral_code,
      status,
      reward_granted,
      reward_outcome,
      completed_at
    )
    values (
      v_referrer_user_id,
      v_user_id,
      v_code,
      case when v_is_post_activation then 'completed' else 'pending' end,
      false,
      case
        when v_is_post_activation then 'legacy_no_reward'
        else 'pending_activation_v2'
      end,
      case when v_is_post_activation then now() else null end
    )
    returning * into v_referral;
  end if;

  if not v_was_existing and v_is_post_activation then
    -- Preserve the installed client's bounded post-onboarding claim window,
    -- but do not turn a post-activation claim into a retroactive v2 reward.
    return query
    select
      true,
      'CLAIMED',
      v_referral.id,
      v_referral.status::text,
      false,
      false;
    return;
  end if;

  if v_referral.status = 'pending'
     and v_referral.reward_outcome = 'pending_activation_v2' then
    if exists (
      select 1
      from private.account_activation_receipts activation
      where activation.user_id = v_user_id
        and activation.source = 'first_promise_v1'
    ) then
      v_settlement := private.settle_referral_v2(v_referral.id, v_user_id);

      return query
      select
        true,
        case v_settlement ->> 'outcome'
          when 'both_rewarded' then 'REWARDS_GRANTED'
          when 'inviter_capped' then 'INVITER_CAPPED'
          when 'program_disabled' then 'PROGRAMME_DISABLED'
          else 'ALREADY_CLAIMED'
        end,
        v_referral.id,
        coalesce(v_settlement ->> 'status', 'completed'),
        v_was_existing,
        coalesce((v_settlement ->> 'inviter_reward_amount')::integer, 0) > 0;
      return;
    end if;

    return query
    select
      true,
      'PENDING_ACTIVATION',
      v_referral.id,
      'pending',
      v_was_existing,
      false;
    return;
  end if;

  return query
  select
    true,
    'ALREADY_CLAIMED',
    v_referral.id,
    v_referral.status::text,
    true,
    coalesce(v_referral.reward_granted, false);
end;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_first_promise_v1(p_title text, p_description text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_duration integer DEFAULT 30, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_is_public boolean DEFAULT true, p_difficulty text DEFAULT 'medium'::text, p_points integer DEFAULT 200, p_verification_type text DEFAULT 'photo'::text, p_verification_frequency text DEFAULT 'daily'::text, p_verification_description text DEFAULT NULL::text, p_submission_text text DEFAULT NULL::text, p_allow_extensions boolean DEFAULT true, p_max_extensions integer DEFAULT 2, p_deadline_type text DEFAULT 'fixed'::text, p_allow_self_review boolean DEFAULT false, p_group_id uuid DEFAULT NULL::uuid, p_cost integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_activation private.account_activation_receipts%rowtype;
  v_challenge public.challenges%rowtype;
  v_create_result jsonb;
  v_status jsonb;
  v_receipt jsonb;
begin
  if v_user_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('account-activation:' || v_user_id::text, 0)
  );

  select activation.*
  into v_activation
  from private.account_activation_receipts activation
  where activation.user_id = v_user_id;

  if found then
    select challenge.*
    into v_challenge
    from public.challenges challenge
    where challenge.id = v_activation.first_promise_id
      and challenge.creator_id = v_user_id;

    if not found then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'error', 'FIRST_PROMISE_RECEIPT_UNAVAILABLE'
      );
    end if;

    v_status := public.get_my_account_activation_v1();
    v_receipt := pg_catalog.jsonb_build_object(
      'is_first_promise', true,
      'next_due_at', v_activation.first_promise_next_due_at,
      'activation', v_status
    );

    return pg_catalog.jsonb_build_object(
      'success', true,
      'challenge_id', v_challenge.id,
      'first_promise_title', v_challenge.title,
      'receipt', v_receipt,
      'replayed', true,
      'recovered_existing', false
    );
  end if;

  -- A challenge can predate this activation contract or survive an older
  -- partial client flow. Bind the earliest owned challenge once and never
  -- create a duplicate merely to manufacture an activation receipt.
  select challenge.*
  into v_challenge
  from public.challenges challenge
  where challenge.creator_id = v_user_id
  order by challenge.created_at asc nulls last, challenge.id asc
  limit 1;

  if found then
    v_status := private.finalise_account_activation_v1(
      v_user_id,
      v_challenge.id,
      v_challenge.title,
      null,
      '{}'::jsonb
    );
    v_receipt := pg_catalog.jsonb_build_object(
      'is_first_promise', true,
      'next_due_at', null,
      'activation', v_status
    );

    return pg_catalog.jsonb_build_object(
      'success', true,
      'challenge_id', v_challenge.id,
      'first_promise_title', v_challenge.title,
      'receipt', v_receipt,
      'replayed', true,
      'recovered_existing', true
    );
  end if;

  v_create_result := public.create_accountability_challenge(
    p_title,
    p_description,
    p_category,
    p_duration,
    p_start_date,
    p_end_date,
    p_is_public,
    p_difficulty,
    p_points,
    p_verification_type,
    p_verification_frequency,
    p_verification_description,
    p_submission_text,
    p_allow_extensions,
    p_max_extensions,
    p_deadline_type,
    p_allow_self_review,
    p_group_id,
    p_cost
  );

  return v_create_result || pg_catalog.jsonb_build_object(
    'replayed', false,
    'recovered_existing', false
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_accountability_challenge(p_title text, p_description text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_duration integer DEFAULT 30, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_is_public boolean DEFAULT true, p_difficulty text DEFAULT 'medium'::text, p_points integer DEFAULT 200, p_verification_type text DEFAULT 'photo'::text, p_verification_frequency text DEFAULT 'daily'::text, p_verification_description text DEFAULT NULL::text, p_submission_text text DEFAULT NULL::text, p_allow_extensions boolean DEFAULT true, p_max_extensions integer DEFAULT 2, p_deadline_type text DEFAULT 'fixed'::text, p_allow_self_review boolean DEFAULT false, p_group_id uuid DEFAULT NULL::uuid, p_cost integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform public.require_current_legal_acceptance('promise_creation');

  -- Preserve the activation/referral receipt and every other delegate field.
  return public.create_accountability_challenge_without_legal_gate(
    p_title,
    p_description,
    p_category,
    p_duration,
    p_start_date,
    p_end_date,
    p_is_public,
    p_difficulty,
    p_points,
    p_verification_type,
    p_verification_frequency,
    p_verification_description,
    p_submission_text,
    p_allow_extensions,
    p_max_extensions,
    p_deadline_type,
    p_allow_self_review,
    p_group_id,
    p_cost
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.leave_accountability_challenge_v1(p_challenge_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_joined_at timestamptz;
  v_left_at timestamptz := pg_catalog.now();
begin
  if v_actor_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'CHALLENGE_LEAVE',
      'code', 'AUTH_REQUIRED',
      'message', 'Sign in before leaving this promise.'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'CHALLENGE_LEAVE',
      'code', 'AUTH_SESSION_REVOKED',
      'message', 'Your session is no longer active. Sign in again before leaving.'
    );
  end if;

  if p_challenge_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'CHALLENGE_LEAVE',
      'code', 'INVALID_REQUEST',
      'message', 'Choose a promise before leaving.'
    );
  end if;

  delete from public.challenge_participants participant
  where participant.challenge_id = p_challenge_id
    and participant.user_id = v_actor_id
  returning participant.joined_at into v_joined_at;

  if found then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'operation', 'CHALLENGE_LEAVE',
      'code', 'LEAVE_CONFIRMED',
      'receipt', pg_catalog.jsonb_build_object(
        'challenge_id', p_challenge_id,
        'user_id', v_actor_id,
        'joined_at', v_joined_at,
        'left_at', v_left_at,
        'changed', true,
        'idempotent', false
      )
    );
  end if;

  -- A retry after a confirmed leave is safe. Do not reveal whether an unknown
  -- challenge exists when the caller has no participation row.
  return pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'CHALLENGE_LEAVE',
    'code', 'ALREADY_LEFT',
    'receipt', pg_catalog.jsonb_build_object(
      'challenge_id', p_challenge_id,
      'user_id', v_actor_id,
      'joined_at', null,
      'left_at', v_left_at,
      'changed', false,
      'idempotent', true
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_pro_authority()
 RETURNS TABLE(is_pro boolean, reconciliation_pending boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_reconciliation_pending boolean := false;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.rc_webhook_events e
    where e.target_user_id = v_user_id
      and e.processing_status = 'retry'
      and e.ignored_reason = 'ambiguous_equal_timestamp'
      and e.reconciliation_keys
        && array['pro_access', 'Pro', 'pro']::text[]
  ) into v_reconciliation_pending;

  return query
  select
    p.is_pro and not v_reconciliation_pending,
    v_reconciliation_pending
  from public.profiles p
  where p.id = v_user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.block_user_v1(p_expected_blocker_id uuid, p_client_event_id uuid, p_blocked_user_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_blocker_id uuid := auth.uid();
  v_reason text := nullif(
    pg_catalog.btrim(coalesce(p_reason, '')),
    ''
  );
  v_facts_hash text;
  v_existing_hash text;
  v_existing_payload jsonb;
  v_received_at timestamptz := pg_catalog.now();
  v_result jsonb;
begin
  if v_blocker_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'AUTH_REQUIRED',
      'message', 'Sign in again before blocking this person.'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'AUTH_SESSION_REVOKED',
      'message', 'Your session is no longer active. Sign in again before blocking this person.'
    );
  end if;

  if p_expected_blocker_id is null
    or p_expected_blocker_id <> v_blocker_id
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'ACCOUNT_CHANGED',
      'message', 'The signed-in account changed before this block was saved.'
    );
  end if;

  if p_client_event_id is null
    or p_blocked_user_id is null
    or p_blocked_user_id = v_blocker_id
    or pg_catalog.length(coalesce(v_reason, '')) > 500
    or not exists (
      select 1
      from public.profiles target_profile
      where target_profile.id = p_blocked_user_id
    )
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'outcome', 'not_sent',
      'code', 'INVALID_BLOCK_REQUEST',
      'message', 'This person cannot be blocked from this account.'
    );
  end if;

  v_facts_hash := pg_catalog.encode(
    pg_catalog.sha256(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_object(
          'blocker_id', v_blocker_id,
          'client_event_id', p_client_event_id,
          'blocked_user_id', p_blocked_user_id,
          'reason', v_reason
        )::text,
        'UTF8'
      )
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_blocker_id::text || ':' || p_client_event_id::text,
      0
    )
  );

  select receipt.facts_hash, receipt.result_payload
  into v_existing_hash, v_existing_payload
  from private.user_block_submission_receipts_v1 receipt
  where receipt.blocker_id = v_blocker_id
    and receipt.client_event_id = p_client_event_id;

  if found then
    if v_existing_hash <> v_facts_hash then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'outcome', 'not_sent',
        'code', 'REQUEST_FACT_MISMATCH',
        'message', 'This saved block reference belongs to another request.'
      );
    end if;

    return v_existing_payload
      || pg_catalog.jsonb_build_object('replayed', true);
  end if;

  insert into public.blocked_users (
    blocker_id,
    blocked_user_id,
    reason
  ) values (
    v_blocker_id,
    p_blocked_user_id,
    v_reason
  )
  on conflict (blocker_id, blocked_user_id) do nothing;

  v_result := pg_catalog.jsonb_build_object(
    'success', true,
    'outcome', 'confirmed',
    'code', 'BLOCK_RECORDED',
    'blocker_id', v_blocker_id,
    'blocked_user_id', p_blocked_user_id,
    'client_event_id', p_client_event_id,
    'received_at', v_received_at,
    'replayed', false
  );

  insert into private.user_block_submission_receipts_v1 (
    blocker_id,
    client_event_id,
    blocked_user_id,
    reason,
    facts_hash,
    result_payload,
    received_at
  ) values (
    v_blocker_id,
    p_client_event_id,
    p_blocked_user_id,
    v_reason,
    v_facts_hash,
    v_result,
    v_received_at
  );

  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_onboarding_group_with_first_promise_v1(p_first_promise_id uuid, p_name text, p_description text DEFAULT NULL::text, p_privacy text DEFAULT 'private'::text, p_image_preset text DEFAULT NULL::text, p_member_nudges boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_name text := pg_catalog.regexp_replace(
    pg_catalog.btrim(coalesce(p_name, '')),
    '[[:space:]]+',
    ' ',
    'g'
  );
  v_description text := nullif(
    pg_catalog.btrim(coalesce(p_description, '')),
    ''
  );
  v_privacy text := pg_catalog.lower(
    pg_catalog.btrim(coalesce(p_privacy, 'private'))
  );
  v_image_preset text := nullif(
    pg_catalog.lower(pg_catalog.btrim(coalesce(p_image_preset, ''))),
    ''
  );
  v_member_nudges boolean := coalesce(p_member_nudges, true);
  v_existing private.onboarding_group_first_promise_receipts%rowtype;
  v_activation private.account_activation_receipts%rowtype;
  v_promise public.challenges%rowtype;
  v_participant public.challenge_participants%rowtype;
  v_participant_count integer;
  v_group_result jsonb;
  v_group_id uuid;
  v_group public.teams%rowtype;
  v_expectations jsonb;
  v_promise_start_date date;
  v_promise_end_date date;
  v_cost integer;
  v_balance integer;
begin
  if v_actor_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  end if;

  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if p_first_promise_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'FIRST_PROMISE_REQUIRED'
    );
  end if;
  if v_name = '' or pg_catalog.char_length(v_name) > 100 then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_GROUP_NAME'
    );
  end if;
  if v_description is not null
     and pg_catalog.char_length(v_description) > 500 then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_GROUP_DESCRIPTION'
    );
  end if;
  if v_privacy <> all (array['public', 'private']::text[]) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_GROUP_PRIVACY'
    );
  end if;
  if v_image_preset is not null
     and v_image_preset <> all (
       array['move', 'focus', 'reset', 'create']::text[]
     ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_IMAGE_PRESET'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'onboarding-group-first-promise:' || v_actor_id::text,
      0
    )
  );

  select receipt.*
  into v_existing
  from private.onboarding_group_first_promise_receipts receipt
  where receipt.user_id = v_actor_id;

  if found then
    if v_existing.first_promise_id <> p_first_promise_id
       or v_existing.request_name <> v_name
       or v_existing.request_description is distinct from v_description
       or v_existing.request_privacy <> v_privacy
       or v_existing.request_image_preset is distinct from v_image_preset
       or v_existing.request_member_nudges <> v_member_nudges then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'error', 'IDEMPOTENCY_CONFLICT'
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'result_code', 'ONBOARDING_GROUP_LINKED_V1',
      'replayed', true,
      'group', pg_catalog.jsonb_build_object(
        'id', v_existing.group_id,
        'name', v_existing.group_name,
        'description', v_existing.group_description,
        'privacy', v_existing.group_privacy,
        'image_url', v_existing.group_image_url,
        'duration_days', v_existing.group_duration_days,
        'start_date', v_existing.group_start_date,
        'end_date', v_existing.group_end_date,
        'notify_on_member_miss',
          v_existing.group_notify_on_member_miss
      ),
      'first_promise', pg_catalog.jsonb_build_object(
        'id', v_existing.first_promise_id,
        'title', v_existing.first_promise_title,
        'allow_self_review', false,
        'submission_expectations', v_existing.first_promise_expectations
      ),
      'economy', pg_catalog.jsonb_build_object(
        'cost', v_existing.economy_cost,
        'new_balance', v_existing.economy_balance
      )
    );
  end if;

  perform public.require_current_legal_acceptance('promise_creation');

  select activation.*
  into v_activation
  from private.account_activation_receipts activation
  where activation.user_id = v_actor_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'ACTIVATION_RECEIPT_UNAVAILABLE'
    );
  end if;
  if v_activation.source <> 'first_promise_v1'
     or v_activation.first_promise_id <> p_first_promise_id then
    return pg_catalog.jsonb_build_object(
      'success', false,
     'error', 'FIRST_PROMISE_NOT_LINKABLE'
    );
  end if;

  select challenge.*
  into v_promise
  from public.challenges challenge
  where challenge.id = p_first_promise_id
    and challenge.creator_id = v_actor_id
  for update;

  if not found
     or v_promise.status <> 'active'
     or v_promise.completion_status <> 'active'
     or coalesce(v_promise.is_expired, false)
     or not coalesce(v_promise.allow_self_review, false)
     or coalesce(v_promise.extension_count, 0) <> 0
     or v_promise.duration is null
     or v_promise.duration <> all (array[7, 14, 30]::integer[])
     or v_promise.start_date is null
     or v_promise.end_date is null
     or v_promise.end_date <= now() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'FIRST_PROMISE_NOT_LINKABLE'
    );
  end if;

  perform 1
  from pg_catalog.pg_timezone_names timezone
  where timezone.name = v_promise.streak_timezone;
  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'FIRST_PROMISE_NOT_LINKABLE'
    );
  end if;

  v_promise_start_date := (
    v_promise.start_date at time zone v_promise.streak_timezone
  )::date;
  v_promise_end_date := (
    v_promise.end_date at time zone v_promise.streak_timezone
  )::date;
  if v_promise_end_date < v_promise_start_date
     or v_promise_end_date - v_promise_start_date + 1
       <> v_promise.duration then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'FIRST_PROMISE_NOT_LINKABLE'
    );
  end if;

  if exists (
    select 1
    from public.team_challenges link
    where link.challenge_id = p_first_promise_id
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'FIRST_PROMISE_ALREADY_LINKED'
    );
  end if;

  select pg_catalog.count(*)::integer
  into v_participant_count
  from public.challenge_participants participant
  where participant.challenge_id = p_first_promise_id;

  select participant.*
  into v_participant
  from public.challenge_participants participant
  where participant.challenge_id = p_first_promise_id
    and participant.user_id = v_actor_id
  for update;

  if not found
     or v_participant_count <> 1
     or v_participant.status <> 'active'
     or coalesce(v_participant.completion_percentage, 0) <> 0
     or coalesce(v_participant.streak_count, 0) <> 0
     or coalesce(v_participant.current_streak, 0) <> 0
     or coalesce(v_participant.longest_streak, 0) <> 0
     or coalesce(v_participant.used_extensions, 0) <> 0
     or v_participant.last_submission_date is not null
     or v_participant.last_check_in is not null
     or v_participant.last_check_in_local_date is not null
     or exists (
       select 1
       from public.challenge_submissions submission
       where submission.challenge_id = p_first_promise_id
     )
     or exists (
       select 1
       from public.streak_day_outcomes outcome
       where outcome.challenge_id = p_first_promise_id
     )
     or exists (
       select 1
       from public.streak_checkin_applications application
       where application.challenge_id = p_first_promise_id
     ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'FIRST_PROMISE_ALREADY_STARTED'
    );
  end if;

  v_cost := private.economy_action_cost_v1(v_actor_id, 'create_group');
  if v_cost is distinct from 0 then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'ONBOARDING_FIRST_GROUP_UNAVAILABLE'
    );
  end if;

  v_group_result := public.create_group_with_payment(
    v_actor_id,
    v_name,
    v_description,
    v_promise.duration,
    0,
    v_privacy
  );

  if coalesce(v_group_result ->> 'success', 'false') <> 'true' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', coalesce(v_group_result ->> 'error', 'GROUP_CREATE_FAILED')
    );
  end if;

  if pg_catalog.jsonb_typeof(v_group_result -> 'group_id')
       is distinct from 'string'
     or pg_catalog.jsonb_typeof(v_group_result -> 'cost')
       is distinct from 'number'
     or pg_catalog.jsonb_typeof(v_group_result -> 'new_balance')
       is distinct from 'number'
     or (v_group_result ->> 'cost') !~ '^(0|[1-9][0-9]*)$'
     or (v_group_result ->> 'new_balance') !~ '^(0|[1-9][0-9]*)$' then
    raise exception 'INVALID_GROUP_CREATE_RECEIPT' using errcode = 'P0001';
  end if;

  begin
    v_group_id := (v_group_result ->> 'group_id')::uuid;
    v_cost := (v_group_result ->> 'cost')::integer;
    v_balance := (v_group_result ->> 'new_balance')::integer;
  exception when others then
    raise exception 'INVALID_GROUP_CREATE_RECEIPT' using errcode = 'P0001';
  end;
  if v_group_id is null or v_cost is distinct from 0 then
    raise exception 'INVALID_GROUP_CREATE_RECEIPT' using errcode = 'P0001';
  end if;

  v_expectations := coalesce(v_promise.submission_expectations, '{}'::jsonb)
    || pg_catalog.jsonb_build_object(
      'requires_peer_review', true,
      'reviewers_required', 1
    );

  update public.challenges
  set
    allow_self_review = false,
    submission_expectations = v_expectations,
    updated_at = now()
  where id = p_first_promise_id
    and creator_id = v_actor_id
    and allow_self_review = true;
  if not found then
    raise exception 'FIRST_PROMISE_RULE_UPDATE_FAILED' using errcode = 'P0001';
  end if;

  insert into public.team_challenges (group_id, challenge_id)
  values (v_group_id, p_first_promise_id);

  update public.teams
  set
    privacy = v_privacy,
    image_url = case
      when v_image_preset is null then null
      else 'menta-preset:' || v_image_preset
    end,
    duration_days = v_promise.duration,
    start_date = v_promise_start_date,
    end_date = v_promise_end_date,
    notify_on_member_miss = v_member_nudges,
    updated_at = now()
  where id = v_group_id
    and owner_id = v_actor_id
  returning * into v_group;
  if not found then
    raise exception 'GROUP_ALIGNMENT_FAILED' using errcode = 'P0001';
  end if;

  insert into private.onboarding_group_first_promise_receipts (
    user_id,
    first_promise_id,
    group_id,
    request_name,
    request_description,
    request_privacy,
    request_image_preset,
    request_member_nudges,
    group_name,
    group_description,
    group_privacy,
    group_image_url,
    group_duration_days,
    group_start_date,
    group_end_date,
    group_notify_on_member_miss,
    first_promise_title,
    first_promise_expectations,
    economy_cost,
    economy_balance
  ) values (
    v_actor_id,
    p_first_promise_id,
    v_group_id,
    v_name,
    v_description,
    v_privacy,
    v_image_preset,
    v_member_nudges,
    v_group.name,
    v_group.description,
    v_group.privacy,
    v_group.image_url,
    v_group.duration_days,
    v_group.start_date,
    v_group.end_date,
    v_group.notify_on_member_miss,
    v_promise.title,
    v_expectations,
    v_cost,
    v_balance
  );

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', 'ONBOARDING_GROUP_LINKED_V1',
    'replayed', false,
    'group', pg_catalog.jsonb_build_object(
      'id', v_group.id,
      'name', v_group.name,
      'description', v_group.description,
      'privacy', v_group.privacy,
      'image_url', v_group.image_url,
      'duration_days', v_group.duration_days,
      'start_date', v_group.start_date,
      'end_date', v_group.end_date,
      'notify_on_member_miss', v_group.notify_on_member_miss
    ),
    'first_promise', pg_catalog.jsonb_build_object(
      'id', v_promise.id,
      'title', v_promise.title,
      'allow_self_review', false,
      'submission_expectations', v_expectations
    ),
    'economy', pg_catalog.jsonb_build_object(
      'cost', v_cost,
      'new_balance', v_balance
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_economy_contract_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_value text;
  v_contract jsonb;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select config.value
  into v_value
  from public.system_config config
  where config.key = 'economy_contract_v1'
  limit 1;

  v_contract := coalesce(v_value::jsonb, '{}'::jsonb);
  return v_contract || jsonb_build_object(
    'viewer',
    jsonb_build_object(
      'isPro', public.user_is_pro(v_user_id),
      'activePromises', private.economy_active_promise_count_v1(v_user_id),
      'activeGroups', private.economy_active_group_count_v1(v_user_id),
      'createChallengeCost', private.economy_action_cost_v1(
        v_user_id,
        'create_challenge'
      ),
      'createGroupCost', private.economy_action_cost_v1(
        v_user_id,
        'create_group'
      ),
      'joinGroupCost', private.economy_action_cost_v1(
        v_user_id,
        'join_group'
      )
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.grant_account_streak_unlocks_v1(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_current integer := 0;
  v_unlock record;
  v_inserted uuid;
begin
  if p_user_id is null then
    return;
  end if;

  select coalesce(max(participant.current_streak), 0)
  into v_current
  from public.challenge_participants participant
  where participant.user_id = p_user_id
    and participant.status = 'active';

  for v_unlock in
    select *
    from (
      values
        (7, 'streak_freeze_7', 'streak_freeze_basic', 1),
        (30, 'streak_freeze_30', 'streak_freeze_basic', 1)
    ) as unlock(days, receipt_sku, item_sku, quantity)
    where unlock.days <= v_current
  loop
    insert into public.streak_unlock_receipts (
      user_id,
      sku,
      days
    )
    values (
      p_user_id,
      v_unlock.receipt_sku,
      v_unlock.days
    )
    on conflict (user_id, sku) do nothing
    returning user_id into v_inserted;

    if v_inserted is null then
      continue;
    end if;

    insert into public.inventory_items as inventory (
      user_id,
      item_sku,
      quantity,
      updated_at
    )
    values (
      p_user_id,
      v_unlock.item_sku,
      v_unlock.quantity,
      now()
    )
    on conflict (user_id, item_sku) do update
    set
      quantity = inventory.quantity + excluded.quantity,
      updated_at = now();
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION private.sync_account_streak_unlocks_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform private.grant_account_streak_unlocks_v1(new.user_id);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.equip_owned_item(p_user_id uuid, p_item_id uuid, p_category text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_catalog_category text;
  v_sku text;
begin
  if p_user_id is null or p_user_id is distinct from auth.uid() then
    raise insufficient_privilege using message = 'Cannot equip another user item';
  end if;

  if p_item_id is null or coalesce(trim(p_category), '') = '' then
    return jsonb_build_object('success', false, 'error', 'INVALID_REQUEST');
  end if;

  select category, sku
  into v_catalog_category, v_sku
  from public.catalog_items
  where id = p_item_id
    and is_available = true
    and is_disabled = false;

  if v_sku is null then
    return jsonb_build_object('success', false, 'error', 'ITEM_NOT_AVAILABLE');
  end if;

  if lower(coalesce(v_catalog_category, '')) in ('powerup', 'power_up') then
    return jsonb_build_object('success', false, 'error', 'POWER_UPS_ARE_NOT_EQUIPPABLE');
  end if;

  if not exists (
    select 1
    from public.purchases
    where user_id = p_user_id
      and item_id = p_item_id
  ) and not exists (
    select 1
    from public.inventory_items inventory
    where inventory.user_id = p_user_id
      and inventory.item_sku = v_sku
      and inventory.quantity > 0
  ) then
    return jsonb_build_object('success', false, 'error', 'ITEM_NOT_OWNED');
  end if;

  delete from public.equipped_items
  where user_id = p_user_id
    and category = p_category;

  insert into public.equipped_items(user_id, item_id, category, equipped_at)
  values (p_user_id, p_item_id, p_category, now())
  on conflict (user_id, item_id)
  do update set
    category = excluded.category,
    equipped_at = excluded.equipped_at;

  return jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'item_sku', v_sku,
    'category', p_category
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.enqueue_challenge_review_notifications_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_challenge_title text;
  v_recipient record;
begin
  select challenge_row.title
  into v_challenge_title
  from public.challenges challenge_row
  where challenge_row.id = new.challenge_id;

  if new.status = 'pending'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
  then
    for v_recipient in
      select recipient.reviewer_id
      from private.challenge_review_recipients_v1(
        new.challenge_id,
        new.user_id
      ) recipient
    loop
      perform private.enqueue_notification_v1(
        v_recipient.reviewer_id,
        'review_reminder',
        'Proof ready to review',
        pg_catalog.format(
          'A proof for %s is waiting for a decision.',
          coalesce(nullif(v_challenge_title, ''), 'a promise')
        ),
        pg_catalog.jsonb_build_object(
          'type', 'review_reminder',
          'action', 'open_review_queue',
          'challengeId', new.challenge_id,
          'submissionId', new.id
        ),
        pg_catalog.jsonb_build_object('challengeTitle', v_challenge_title),
        2,
        pg_catalog.format(
          'challenge-review-ready:%s:%s',
          new.id,
          v_recipient.reviewer_id
        ),
        pg_catalog.now()
      );
    end loop;
  end if;

  if tg_op = 'UPDATE'
    and old.status = 'pending'
    and new.status in ('approved', 'rejected')
  then
    perform private.enqueue_notification_v1(
      new.user_id,
      case
        when new.status = 'approved' then 'verification_approved'
        else 'verification_rejected'
      end,
      case when new.status = 'approved' then 'Proof approved' else 'Proof needs changes' end,
      case
        when new.status = 'approved'
          then pg_catalog.format(
            'Your proof for %s was approved.',
            coalesce(nullif(v_challenge_title, ''), 'your promise')
          )
        else pg_catalog.format(
          'Your proof for %s needs a correction. Open the promise for the reviewer note.',
          coalesce(nullif(v_challenge_title, ''), 'your promise')
        )
      end,
      pg_catalog.jsonb_build_object(
        'type', case
          when new.status = 'approved' then 'verification_approved'
          else 'verification_rejected'
        end,
        'action', 'open_challenge',
        'challengeId', new.challenge_id,
        'submissionId', new.id
      ),
      pg_catalog.jsonb_build_object('challengeTitle', v_challenge_title),
      2,
      pg_catalog.format('challenge-review-result:%s:%s', new.id, new.status),
      pg_catalog.now()
    );
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.can_send_notification_to_user(p_user_id uuid, p_notification_type text, p_priority integer DEFAULT 3)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_pref public.notification_preferences%rowtype;
  v_local_time time;
  v_in_quiet_hours boolean := false;
begin
  if v_actor_id is null
    or v_actor_id is distinct from p_user_id
    or not public.current_session_is_active()
  then
    return false;
  end if;

  select preference.*
  into v_pref
  from public.notification_preferences preference
  where preference.user_id = p_user_id;

  if not found or not coalesce(v_pref.push_enabled, true) then return false; end if;
  if v_pref.device_permission_status is not null
    and v_pref.device_permission_status <> 'granted'
  then return false; end if;

  if p_notification_type in ('streak_reminder', 'challenge_expiring', 'challenge_expired')
    and not coalesce(v_pref.challenge_reminders, true)
  then return false; end if;
  if p_notification_type in (
    'review_reminder', 'verification_pending', 'verification_approved',
    'verification_rejected', 'group_activity', 'group_streak_warning',
    'group_milestone'
  ) and not coalesce(v_pref.group_updates, true)
  then return false; end if;
  if p_notification_type in (
    'streak_achievement', 'streak_recovery', 'missed_streak',
    'badge_unlocked', 'momenta_reward'
  ) and not coalesce(v_pref.streak_alerts, true)
  then return false; end if;

  if v_pref.quiet_hours_start is not null
    and v_pref.quiet_hours_end is not null
    and v_pref.quiet_hours_start <> v_pref.quiet_hours_end
  then
    v_local_time := (
      pg_catalog.now() at time zone coalesce(nullif(v_pref.timezone, ''), 'UTC')
    )::time;
    v_in_quiet_hours := case
      when v_pref.quiet_hours_start < v_pref.quiet_hours_end
        then v_local_time >= v_pref.quiet_hours_start
          and v_local_time < v_pref.quiet_hours_end
      else v_local_time >= v_pref.quiet_hours_start
        or v_local_time < v_pref.quiet_hours_end
    end;
  end if;

  return not v_in_quiet_hours;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_coach_messages_due_unfiltered_v1()
 RETURNS TABLE(user_id uuid, username text, challenge_id text, challenge_title text, reminder_kind text, idempotency_key text, local_day date, streak_length integer, hours_remaining integer, freeze_remaining integer, proof_due_label text, open_promise_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with active_challenges as (
    select
      cp.user_id,
      coalesce(p.username, 'member') as username,
      c.id as challenge_id,
      c.title as challenge_title,
      coalesce(cp.current_streak, 0) as current_streak,
      coalesce(cp.streak_freezes_remaining, 0) as freeze_remaining,
      exists (
        select 1
        from public.team_challenges tc
        where tc.challenge_id = c.id
      ) as is_group_challenge,
      nullif(c.streak_timezone, '') as challenge_tz,
      coalesce(np.push_enabled, true) as push_enabled,
      coalesce(np.challenge_reminders, true) as challenge_reminders,
      coalesce(np.preferred_reminder_time, '20:00:00'::time) as preferred_reminder_time,
      np.typical_proof_hour,
      nullif(np.timezone, '') as pref_tz
    from public.challenge_participants cp
    join public.challenges c
      on c.id = cp.challenge_id
     and coalesce(c.status, 'active') = 'active'
    left join public.profiles p
      on p.id = cp.user_id
    left join public.notification_preferences np
      on np.user_id = cp.user_id
    where coalesce(cp.status, 'active') = 'active'
      and (c.start_date is null or c.start_date <= now())
      and (c.end_date is null or c.end_date > now())
      and coalesce(np.push_enabled, true) = true
      and coalesce(np.challenge_reminders, true) = true
      and (
        np.ignore_coach_until is null
        or np.ignore_coach_until <= now()
      )
  ),
  resolved as (
    select
      ac.*,
      case
        when ac.is_group_challenge then coalesce(
          case
            when exists (
              select 1
              from pg_catalog.pg_timezone_names tz
              where tz.name = ac.challenge_tz
            ) then ac.challenge_tz
          end,
          case
            when exists (
              select 1
              from pg_catalog.pg_timezone_names tz
              where tz.name = ac.pref_tz
            ) then ac.pref_tz
          end,
          'UTC'
        )
        else coalesce(
          case
            when exists (
              select 1
              from pg_catalog.pg_timezone_names tz
              where tz.name = ac.pref_tz
            ) then ac.pref_tz
          end,
          case
            when exists (
              select 1
              from pg_catalog.pg_timezone_names tz
              where tz.name = ac.challenge_tz
            ) then ac.challenge_tz
          end,
          'UTC'
        )
      end as effective_tz
    from active_challenges ac
  ),
  due_clock as (
    select
      r.*,
      (now() at time zone r.effective_tz)::date as user_local_day,
      (now() at time zone r.effective_tz)::time as user_local_time,
      (
        time '00:00' + pg_catalog.make_interval(
          secs => least(
            extract(epoch from r.preferred_reminder_time)::integer + 10800,
            84600
          )
        )
      )::time as rescue_time
    from resolved r
    where not exists (
      select 1
      from public.challenge_submissions cs
      where cs.challenge_id = r.challenge_id
        and cs.user_id = r.user_id
        and cs.local_day = (now() at time zone r.effective_tz)::date
        and cs.status in ('pending', 'approved')
    )
  ),
  due_slots as (
    select
      dc.*,
      case
        when dc.typical_proof_hour is not null
          and dc.typical_proof_hour < dc.rescue_time
        then dc.typical_proof_hour
        else dc.preferred_reminder_time
      end as routine_time
    from due_clock dc
  ),
  ranked as (
    select
      ds.*,
      count(*) over (partition by ds.user_id) as open_promise_count
    from due_slots ds
  ),
  chosen as (
    select distinct on (ranked.user_id)
      ranked.*
    from ranked
    order by
      ranked.user_id,
      ranked.current_streak desc nulls last,
      ranked.preferred_reminder_time asc,
      ranked.is_group_challenge desc,
      ranked.challenge_id asc
  ),
  primary_due as (
    select
      chosen.user_id,
      chosen.username,
      chosen.challenge_id::text as challenge_id,
      chosen.challenge_title::text as challenge_title,
      'primary'::text as reminder_kind,
      pg_catalog.format(
        'coach:%s:%s:primary',
        chosen.user_id::text,
        chosen.user_local_day::text
      ) as idempotency_key,
      chosen.user_local_day as local_day,
      chosen.current_streak as streak_length,
      greatest(
        0,
        floor(
          extract(
            epoch from (
              (
                (chosen.user_local_day::timestamp + chosen.preferred_reminder_time)
                at time zone chosen.effective_tz
              ) - now()
            )
          ) / 3600
        )
      )::integer as hours_remaining,
      chosen.freeze_remaining,
      pg_catalog.to_char(chosen.preferred_reminder_time, 'FMHH12:MI AM') as proof_due_label,
      chosen.open_promise_count::integer as open_promise_count
    from chosen
    where chosen.user_local_time >= chosen.routine_time
      and chosen.user_local_time < chosen.rescue_time
      and not exists (
        select 1
        from public.notification_jobs nj
        where nj.idempotency_key = pg_catalog.format(
          'coach:%s:%s:primary',
          chosen.user_id::text,
          chosen.user_local_day::text
        )
      )
  ),
  rescue_due as (
    select
      chosen.user_id,
      chosen.username,
      chosen.challenge_id::text as challenge_id,
      chosen.challenge_title::text as challenge_title,
      'rescue'::text as reminder_kind,
      pg_catalog.format(
        'coach:%s:%s:rescue',
        chosen.user_id::text,
        chosen.user_local_day::text
      ) as idempotency_key,
      chosen.user_local_day as local_day,
      chosen.current_streak as streak_length,
      greatest(
        0,
        floor(
          extract(
            epoch from (
              (
                (chosen.user_local_day::timestamp + interval '1 day')
                at time zone chosen.effective_tz
              ) - now()
            )
          ) / 3600
        )
      )::integer as hours_remaining,
      chosen.freeze_remaining,
      pg_catalog.to_char(chosen.preferred_reminder_time, 'FMHH12:MI AM') as proof_due_label,
      chosen.open_promise_count::integer as open_promise_count
    from chosen
    where chosen.user_local_time >= chosen.rescue_time
      and not exists (
        select 1
        from public.notification_jobs nj
        where nj.idempotency_key = pg_catalog.format(
          'coach:%s:%s:rescue',
          chosen.user_id::text,
          chosen.user_local_day::text
        )
      )
  )
  select * from primary_due
  union all
  select * from rescue_due;
$function$;

CREATE OR REPLACE FUNCTION public.get_coach_messages_due()
 RETURNS TABLE(user_id uuid, username text, challenge_id text, challenge_title text, reminder_kind text, idempotency_key text, local_day date, streak_length integer, hours_remaining integer, freeze_remaining integer, proof_due_label text, open_promise_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select due.*
  from public.get_coach_messages_due_unfiltered_v1() due
  join public.notification_preferences preference
    on preference.user_id = due.user_id
  where preference.remote_coach_contract_version >= 1
    and preference.push_enabled is true
    and preference.challenge_reminders is true
    and preference.device_permission_status = 'granted'
    and preference.push_token_status = 'active'
    and preference.expo_push_token is not null;
$function$;

CREATE OR REPLACE FUNCTION public.grant_pro_period_freeze_v1(p_user_id uuid, p_period_reference text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_reference text := pg_catalog.btrim(coalesce(p_period_reference, ''));
  v_receipt_sku text;
  v_inserted uuid;
begin
  if p_user_id is null or v_reference = '' then
    return jsonb_build_object('success', false, 'error', 'INVALID_REQUEST');
  end if;

  v_receipt_sku := 'pro_freeze:' || v_reference;

  insert into public.streak_unlock_receipts (
    user_id,
    sku,
    days
  )
  values (
    p_user_id,
    v_receipt_sku,
    0
  )
  on conflict (user_id, sku) do nothing
  returning user_id into v_inserted;

  if v_inserted is null then
    return jsonb_build_object(
      'success', true,
      'granted', false,
      'reason', 'already_granted'
    );
  end if;

  insert into public.inventory_items as inventory (
    user_id,
    item_sku,
    quantity,
    updated_at
  )
  values (
    p_user_id,
    'streak_freeze_basic',
    1,
    now()
  )
  on conflict (user_id, item_sku) do update
  set
    quantity = inventory.quantity + excluded.quantity,
    updated_at = now();

  return jsonb_build_object(
    'success', true,
    'granted', true,
    'sku', 'streak_freeze_basic',
    'quantity', 1
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.grant_account_streak_shop_unlocks_v1(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_qualifying integer := 0;
  v_item record;
  v_inserted uuid;
  v_granted_at timestamptz;
begin
  if p_user_id is null then
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('shop:' || p_user_id::text, 0)
  );

  select greatest(
    coalesce(
      (
        select max(participant.current_streak)
        from public.challenge_participants participant
        where participant.user_id = p_user_id
          and coalesce(participant.status, 'active') = 'active'
      ),
      0
    ),
    coalesce(
      (
        select max(participant.longest_streak)
        from public.challenge_participants participant
        where participant.user_id = p_user_id
      ),
      0
    )
  )
  into v_qualifying;

  if v_qualifying is null or v_qualifying <= 0 then
    return;
  end if;

  v_granted_at := pg_catalog.clock_timestamp();

  for v_item in
    select
      item.id,
      item.sku,
      item.unlock_streak_days
    from public.catalog_items item
    where item.is_available = true
      and item.is_disabled = false
      and item.unlock_streak_days is not null
      and item.unlock_streak_days <= v_qualifying
      and item.sku is not null
  loop
    v_inserted := null;
    insert into public.streak_unlock_receipts (
      user_id,
      sku,
      days
    )
    values (
      p_user_id,
      v_item.sku,
      v_item.unlock_streak_days
    )
    on conflict (user_id, sku) do nothing
    returning user_id into v_inserted;

    if v_inserted is null then
      continue;
    end if;

    insert into public.inventory_items as inventory (
      user_id,
      item_sku,
      quantity,
      updated_at
    )
    values (p_user_id, v_item.sku, 1, v_granted_at)
    on conflict (user_id, item_sku)
    do update set
      quantity = greatest(inventory.quantity, 1),
      updated_at = excluded.updated_at;

    insert into public.purchases (user_id, item_id, purchased_at)
    values (p_user_id, v_item.id, v_granted_at);

    v_inserted := null;
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.claim_streak_shop_unlocks()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  end if;

  perform private.grant_account_streak_shop_unlocks_v1(auth.uid());

  return pg_catalog.jsonb_build_object('success', true);
end;
$function$;

CREATE OR REPLACE FUNCTION private.sync_account_streak_shop_unlocks_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  perform private.grant_account_streak_shop_unlocks_v1(new.user_id);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.snooze_coach_messages(p_hours integer DEFAULT 4)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_hours integer := coalesce(p_hours, 4);
  v_until timestamptz;
begin
  if v_actor_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'COACH_SNOOZE',
      'code', 'AUTH_REQUIRED',
      'message', 'Sign in before pausing reminders.'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'COACH_SNOOZE',
      'code', 'AUTH_SESSION_REVOKED',
      'message', 'Your session is no longer active. Sign in again before pausing reminders.'
    );
  end if;

  if v_hours < 1 or v_hours > 12 then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'COACH_SNOOZE',
      'code', 'INVALID_REQUEST',
      'message', 'Choose between 1 and 12 hours.'
    );
  end if;

  v_until := pg_catalog.now() + pg_catalog.make_interval(hours => v_hours);

  insert into public.notification_preferences (
    user_id,
    ignore_coach_until,
    updated_at
  )
  values (
    v_actor_id,
    v_until,
    pg_catalog.now()
  )
  on conflict (user_id) do update
  set
    ignore_coach_until = excluded.ignore_coach_until,
    updated_at = pg_catalog.now();

  return pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'COACH_SNOOZE',
    'code', 'SNOOZE_CONFIRMED',
    'receipt', pg_catalog.jsonb_build_object(
      'user_id', v_actor_id,
      'hours', v_hours,
      'ignore_coach_until', v_until
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.enqueue_notification_v1(p_user_id uuid, p_notification_type text, p_title text, p_body text, p_payload jsonb, p_metadata jsonb, p_priority integer, p_idempotency_key text, p_scheduled_for timestamp with time zone DEFAULT now())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_job_id bigint;
  v_notification_id bigint;
begin
  if p_user_id is null
    or nullif(pg_catalog.btrim(coalesce(p_notification_type, '')), '') is null
    or nullif(pg_catalog.btrim(coalesce(p_idempotency_key, '')), '') is null
  then
    return false;
  end if;

  insert into public.notification_jobs (
    user_id,
    job_type,
    payload,
    scheduled_for,
    idempotency_key,
    status
  )
  values (
    p_user_id,
    p_notification_type,
    pg_catalog.jsonb_build_object(
      'title', p_title,
      'body', p_body,
      'data', coalesce(p_payload, '{}'::jsonb),
      'metadata', coalesce(p_metadata, '{}'::jsonb),
      'priority', least(greatest(coalesce(p_priority, 3), 1), 5)
    ),
    coalesce(p_scheduled_for, pg_catalog.now()),
    p_idempotency_key,
    'pending'
  )
  on conflict (idempotency_key) do nothing
  returning id into v_job_id;

  if v_job_id is null then
    return false;
  end if;

  insert into public.notifications (
    user_id,
    notification_type,
    title,
    body,
    payload,
    metadata,
    priority,
    scheduled_for
  )
  values (
    p_user_id,
    p_notification_type,
    p_title,
    p_body,
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_metadata, '{}'::jsonb),
    least(greatest(coalesce(p_priority, 3), 1), 5),
    coalesce(p_scheduled_for, pg_catalog.now())
  )
  returning id into v_notification_id;

  update public.notification_jobs
  set
    notification_id = v_notification_id,
    payload = payload || pg_catalog.jsonb_build_object(
      'notificationId', v_notification_id
    ),
    updated_at = pg_catalog.now()
  where id = v_job_id;

  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION private.challenge_review_recipients_v1(p_challenge_id uuid, p_submitter_id uuid)
 RETURNS TABLE(reviewer_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with candidates as (
    select challenge_row.creator_id as user_id
    from public.challenges challenge_row
    where challenge_row.id = p_challenge_id
    union
    select participant.user_id
    from public.challenge_participants participant
    where participant.challenge_id = p_challenge_id
      and coalesce(participant.status, 'active') = 'active'
    union
    select membership.user_id
    from public.team_challenges team_challenge
    join public.team_members membership
      on membership.group_id = team_challenge.group_id
    where team_challenge.challenge_id = p_challenge_id
  )
  select candidate.user_id
  from candidates candidate
  where candidate.user_id is not null
    and candidate.user_id is distinct from p_submitter_id
    and not private.users_have_block_relationship_v1(
      candidate.user_id,
      p_submitter_id
    );
$function$;

CREATE OR REPLACE FUNCTION private.enforce_event_post_quota_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_total integer;
  v_pending integer;
  v_bytes bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'event-post-quota:' || new.user_id::text || ':' || new.occurrence_id::text,
      0
    )
  );

  select
    count(*) filter (where post.status <> 'deleted'),
    count(*) filter (where post.status = 'upload_pending'),
    coalesce(sum(post.expected_byte_size) filter (where post.status <> 'deleted'), 0)
  into v_total, v_pending, v_bytes
  from public.event_posts post
  where post.user_id = new.user_id
    and post.occurrence_id = new.occurrence_id;

  if v_total >= 25 or v_pending >= 5
    or v_bytes + new.expected_byte_size > 100000000
  then
    raise check_violation using message = 'EVENT_POST_QUOTA_REACHED';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_get_my_occurrence_v1(p_actor_id uuid, p_occurrence_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_attendance public.event_attendances%rowtype;
  v_checkin public.event_checkins%rowtype;
  v_posts jsonb;
begin
  if p_actor_id is null then
    return private.event_result_v1('get_my_occurrence', null, 'failed',
      'AUTHENTICATION_REQUIRED', 'Sign in to view your event participation.', null);
  end if;

  select * into v_occurrence from public.event_occurrences
  where id = p_occurrence_id;
  if not found then
    return private.event_result_v1('get_my_occurrence', null, 'failed',
      'OCCURRENCE_UNAVAILABLE', 'This event occurrence is not available.', null);
  end if;

  select * into v_event from public.event_events
  where id = v_occurrence.event_id;
  if not found then raise exception 'Occurrence event was not found'; end if;

  select * into v_attendance from public.event_attendances
  where occurrence_id = v_occurrence.id and user_id = p_actor_id;

  if v_event.organiser_id is distinct from p_actor_id
    and v_attendance.id is null
  then
    return private.event_result_v1('get_my_occurrence', null, 'failed',
      'EVENT_ACCESS_REQUIRED', 'Join this event before viewing private details.', null);
  end if;

  if v_attendance.id is not null then
    select * into v_checkin from public.event_checkins
    where attendance_id = v_attendance.id and revoked_at is null;
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(private.event_post_json_v1(post, true)
      order by post.created_at desc),
    '[]'::jsonb
  ) into v_posts
  from public.event_posts post
  where post.occurrence_id = v_occurrence.id
    and post.user_id = p_actor_id
    and post.status <> 'deleted';

  return private.event_result_v1(
    'get_my_occurrence', null, 'completed', 'MY_OCCURRENCE_READY',
    'Your event participation is ready.',
    pg_catalog.jsonb_build_object(
      'summary', private.event_summary_json_v1(v_event, v_occurrence),
      'attendance', case when v_attendance.id is null then null
        else private.event_attendance_json_v1(v_attendance, v_checkin) end,
      'ownPosts', v_posts
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.enqueue_event_review_notifications_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_event public.event_events%rowtype;
begin
  select event_row.*
  into v_event
  from public.event_occurrences occurrence_row
  join public.event_events event_row on event_row.id = occurrence_row.event_id
  where occurrence_row.id = new.occurrence_id;

  if not found then return new; end if;

  if new.status = 'pending_review'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
    and v_event.organiser_id is distinct from new.user_id
  then
    perform private.enqueue_notification_v1(
      v_event.organiser_id,
      'review_reminder',
      'Event post ready to review',
      pg_catalog.format(
        'A post for %s is waiting for your decision.',
        coalesce(nullif(v_event.title, ''), 'your event')
      ),
      pg_catalog.jsonb_build_object(
        'type', 'review_reminder',
        'action', 'open_event',
        'eventId', v_event.id,
        'occurrenceId', new.occurrence_id,
        'postId', new.id
      ),
      pg_catalog.jsonb_build_object('eventTitle', v_event.title),
      2,
      pg_catalog.format('event-review-ready:%s:%s', new.id, v_event.organiser_id),
      pg_catalog.now()
    );
  end if;

  if tg_op = 'UPDATE'
    and old.status = 'pending_review'
    and new.status in ('approved', 'rejected')
  then
    perform private.enqueue_notification_v1(
      new.user_id,
      case when new.status = 'approved' then 'verification_approved' else 'verification_rejected' end,
      case when new.status = 'approved' then 'Event post approved' else 'Event post needs changes' end,
      case
        when new.status = 'approved'
          then pg_catalog.format('Your post for %s was approved.', v_event.title)
        else pg_catalog.format('Your post for %s needs a correction. Open the event for the organiser note.', v_event.title)
      end,
      pg_catalog.jsonb_build_object(
        'type', case when new.status = 'approved' then 'verification_approved' else 'verification_rejected' end,
        'action', 'open_event',
        'eventId', v_event.id,
        'occurrenceId', new.occurrence_id,
        'postId', new.id
      ),
      pg_catalog.jsonb_build_object('eventTitle', v_event.title),
      2,
      pg_catalog.format('event-review-result:%s:%s', new.id, new.status),
      pg_catalog.now()
    );
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.enqueue_streak_outcome_notification_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_challenge_title text;
begin
  select challenge_row.title
  into v_challenge_title
  from public.challenges challenge_row
  where challenge_row.id = new.challenge_id;

  perform private.enqueue_notification_v1(
    new.user_id,
    case when new.outcome = 'protected' then 'streak_recovery' else 'missed_streak' end,
    case when new.outcome = 'protected' then 'Your streak was protected' else 'Your streak restarted' end,
    case
      when new.outcome = 'protected' then pg_catalog.format(
        'A freeze protected your %s streak. You have %s remaining.',
        coalesce(nullif(v_challenge_title, ''), 'promise'),
        new.freezes_remaining
      )
      else pg_catalog.format(
        'The check-in window for %s closed. You can start again today.',
        coalesce(nullif(v_challenge_title, ''), 'your promise')
      )
    end,
    pg_catalog.jsonb_build_object(
      'type', case when new.outcome = 'protected' then 'streak_recovery' else 'missed_streak' end,
      'action', 'open_challenge',
      'challengeId', new.challenge_id,
      'localDay', new.local_day
    ),
    pg_catalog.jsonb_build_object(
      'challengeTitle', v_challenge_title,
      'previousStreak', new.previous_streak,
      'resultingStreak', new.resulting_streak,
      'freezesRemaining', new.freezes_remaining
    ),
    2,
    pg_catalog.format('streak-outcome:%s', new.id),
    pg_catalog.now()
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_review_reminders()
 RETURNS TABLE(reviewer_id uuid, reviewer_username text, challenge_id text, challenge_title text, submitter_name text, pending_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with eligible as (
    select
      submission.id as submission_id,
      recipient.reviewer_id,
      submission.challenge_id,
      submission.user_id as submitter_id,
      submission.submission_date
    from public.challenge_submissions submission
    cross join lateral private.challenge_review_recipients_v1(
      submission.challenge_id,
      submission.user_id
    ) recipient
    where submission.status = 'pending'
      and submission.submission_date <= pg_catalog.now() - interval '2 hours'
      and not exists (
        select 1
        from public.notification_jobs job
        where job.idempotency_key = pg_catalog.format(
          'challenge-review-followup:%s:%s',
          submission.id,
          recipient.reviewer_id
        )
      )
  ), grouped as (
    select
      eligible.reviewer_id,
      eligible.challenge_id,
      count(*)::bigint as pending_count,
      min(eligible.submission_date) as oldest_submission,
      (array_agg(eligible.submitter_id order by eligible.submission_date))[1]
        as first_submitter_id
    from eligible
    group by eligible.reviewer_id, eligible.challenge_id
  )
  select
    grouped.reviewer_id,
    coalesce(reviewer.username, 'reviewer'),
    grouped.challenge_id::text,
    challenge_row.title::text,
    coalesce(submitter.username, 'member'),
    grouped.pending_count
  from grouped
  join public.challenges challenge_row on challenge_row.id = grouped.challenge_id
  left join public.profiles reviewer on reviewer.id = grouped.reviewer_id
  left join public.profiles submitter on submitter.id = grouped.first_submitter_id;
$function$;

CREATE OR REPLACE FUNCTION public.activate_remote_coach_v1(p_user_id uuid, p_contract_version integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_rows integer := 0;
begin
  if v_actor_id is null
    or v_actor_id is distinct from p_user_id
    or not public.current_session_is_active()
    or p_contract_version <> 1
  then
    return false;
  end if;

  update public.notification_preferences preference
  set
    remote_coach_contract_version = 1,
    remote_coach_activated_at = pg_catalog.now(),
    updated_at = pg_catalog.now()
  where preference.user_id = v_actor_id
    and preference.push_enabled is true
    and preference.challenge_reminders is true
    and preference.device_permission_status = 'granted'
    and preference.push_token_status = 'active'
    and preference.expo_push_token is not null;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$function$;

CREATE OR REPLACE FUNCTION public.claim_notification_batch_v1(p_batch_size integer DEFAULT 100, p_lease_seconds integer DEFAULT 600)
 RETURNS TABLE(claimed_job_id bigint, notification_id bigint, target_user_id uuid, notification_type text, title text, body text, payload jsonb, metadata jsonb, priority integer, delivery_attempts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise insufficient_privilege using message = 'Service role required';
  end if;

  insert into public.notification_jobs (
    user_id,
    job_type,
    payload,
    scheduled_for,
    idempotency_key,
    status,
    notification_id
  )
  select
    notification.user_id,
    notification.notification_type,
    pg_catalog.jsonb_build_object('notificationId', notification.id),
    coalesce(notification.scheduled_for, notification.created_at, pg_catalog.now()),
    'delivery-notification:' || notification.id::text,
    'pending',
    notification.id
  from public.notifications notification
  where notification.delivered_at is null
    and coalesce(notification.delivery_attempts, 0) < 5
    and not exists (
      select 1
      from public.notification_jobs existing_job
      where existing_job.notification_id = notification.id
    )
  on conflict do nothing;

  return query
  with claimable as (
    select job.id
    from public.notification_jobs job
    join public.notifications notification
      on notification.id = job.notification_id
    where notification.delivered_at is null
      and coalesce(notification.delivery_attempts, 0) < 5
      and job.attempts < 5
      and coalesce(notification.scheduled_for, pg_catalog.now()) <= pg_catalog.now()
      and (
        (
          job.status = 'pending'
          and job.scheduled_for <= pg_catalog.now()
        )
        or (
          job.status = 'processing'
          and job.updated_at <= pg_catalog.now() - pg_catalog.make_interval(
            secs => least(greatest(coalesce(p_lease_seconds, 600), 60), 3600)
          )
        )
      )
    order by
      notification.priority asc nulls last,
      notification.created_at,
      job.id
    for update of job skip locked
    limit least(greatest(coalesce(p_batch_size, 100), 1), 200)
  ),
  claimed as (
    update public.notification_jobs job
    set
      status = 'processing',
      updated_at = pg_catalog.now()
    from claimable
    where job.id = claimable.id
    returning job.id, job.notification_id
  )
  select
    claimed.id,
    notification.id,
    notification.user_id,
    notification.notification_type,
    notification.title,
    notification.body,
    notification.payload,
    notification.metadata,
    notification.priority,
    coalesce(notification.delivery_attempts, 0)::integer
  from claimed
  join public.notifications notification
    on notification.id = claimed.notification_id
  order by
    notification.priority asc nulls last,
    notification.created_at,
    notification.id;
end;
$function$;

CREATE OR REPLACE FUNCTION private.challenge_join_cost_v1()
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_value text;
begin
  select config.value
  into v_value
  from public.system_config config
  where config.key = 'challenge_join_cost_v1'
  limit 1;

  if coalesce(v_value, '') ~ '^[0-9]{1,6}$' then
    return least(100000, greatest(0, v_value::integer));
  end if;

  return 2;
end;
$function$;

CREATE OR REPLACE FUNCTION private.challenge_join_quote_id_v1(p_challenge_id uuid, p_cost integer)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select (
    pg_catalog.substr(v.hash, 1, 8) || '-' ||
    pg_catalog.substr(v.hash, 9, 4) || '-' ||
    '5' || pg_catalog.substr(v.hash, 14, 3) || '-' ||
    '8' || pg_catalog.substr(v.hash, 18, 3) || '-' ||
    pg_catalog.substr(v.hash, 21, 12)
  )::uuid
  from (
    select pg_catalog.md5(
      'challenge-join-v1:' || p_challenge_id::text || ':' || p_cost::text
    ) as hash
  ) v;
$function$;

CREATE OR REPLACE FUNCTION private.challenge_join_failure_v1(p_operation text, p_code text, p_message text)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select pg_catalog.jsonb_build_object(
    'success', false,
    'operation', p_operation,
    'code', p_code,
    'message', p_message
  );
$function$;

CREATE OR REPLACE FUNCTION private.challenge_join_first_due_at_v1(p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_expectations jsonb)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v_deadline_hour integer := 23;
  v_grace_minutes integer := 0;
  v_reference_at timestamptz;
  v_due_at timestamptz;
begin
  if coalesce(p_expectations ->> 'daily_deadline_hour_utc', '')
      ~ '^[0-9]{1,2}$' then
    v_deadline_hour := least(
      23,
      greatest(0, (p_expectations ->> 'daily_deadline_hour_utc')::integer)
    );
  end if;

  if coalesce(p_expectations ->> 'grace_minutes', '') ~ '^[0-9]{1,4}$' then
    v_grace_minutes := least(
      1440,
      greatest(0, (p_expectations ->> 'grace_minutes')::integer)
    );
  end if;

  v_reference_at := greatest(now(), coalesce(p_start_date, now()));
  v_due_at := (
    pg_catalog.date_trunc('day', v_reference_at at time zone 'UTC')
    + pg_catalog.make_interval(
        hours => v_deadline_hour,
        mins => v_grace_minutes
      )
  ) at time zone 'UTC';

  if v_due_at <= v_reference_at then
    v_due_at := v_due_at + interval '1 day';
  end if;

  if p_end_date is not null and v_due_at > p_end_date then
    return null;
  end if;

  return v_due_at;
end;
$function$;

CREATE OR REPLACE FUNCTION public.quote_challenge_join_v1(p_challenge_id uuid DEFAULT NULL::uuid, p_invite_code text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_target record;
  v_cost integer;
  v_balance integer;
  v_shortfall integer;
  v_eligibility_code text;
  v_quote_id uuid;
begin
  if v_actor_id is null then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_QUOTE',
      'AUTH_REQUIRED',
      'Sign in before checking this join.'
    );
  end if;

  if not public.current_session_is_active() then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_QUOTE',
      'AUTH_SESSION_REVOKED',
      'Your session is no longer active. Sign in again before joining.'
    );
  end if;

  select *
  into v_target
  from private.resolve_challenge_join_target_v1(
    v_actor_id,
    p_challenge_id,
    p_invite_code
  );

  if v_target.resolution_code <> 'READY' then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_QUOTE',
      v_target.resolution_code,
      case v_target.resolution_code
        when 'INVALID_REQUEST' then 'Open a valid challenge or invite before joining.'
        when 'INVALID_INVITE' then 'This challenge invite is not valid.'
        when 'INVITE_EXPIRED' then 'This challenge invite has expired.'
        when 'CHALLENGE_INACTIVE' then 'This challenge is no longer accepting joins.'
        when 'GROUP_INACTIVE' then 'This group is not accepting joins.'
        when 'SOLO_CHALLENGE' then 'This is a solo challenge and cannot be joined.'
        else 'Menta could not find an available challenge for this join.'
      end
    );
  end if;

  select profile.momenta_balance
  into v_balance
  from public.profiles profile
  where profile.id = v_actor_id;

  if not found then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_QUOTE',
      'PROFILE_NOT_FOUND',
      'Menta could not confirm your wallet profile.'
    );
  end if;

  if not v_target.is_member and private.economy_quota_error_v1(v_actor_id, 'join_challenge') is not null then
    return private.challenge_join_failure_v1('CHALLENGE_JOIN_QUOTE', 'QUOTA_ACTIVE_PROMISES',
      'Your free plan includes 3 active promises. Finish a promise before joining another.');
  end if;
  v_cost := private.participation_join_cost_v1(v_actor_id);
  v_balance := greatest(0, coalesce(v_balance, 0));
  v_shortfall := greatest(v_cost - v_balance, 0);
  v_eligibility_code := case
    when v_target.is_member then 'ALREADY_JOINED'
    when v_shortfall > 0 then 'INSUFFICIENT_BALANCE'
    else 'ELIGIBLE'
  end;
  v_quote_id := private.challenge_join_quote_id_v1(
    v_target.resolved_challenge_id,
    v_cost
  );

  return pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'CHALLENGE_JOIN_QUOTE',
    'code', 'QUOTE_READY',
    'quote', pg_catalog.jsonb_build_object(
      'quote_id', v_quote_id,
      'challenge_id', v_target.resolved_challenge_id,
      'challenge_title', v_target.challenge_title,
      'challenge_description', v_target.challenge_description,
      'group_id', v_target.group_id,
      'group_name', v_target.group_name,
      'cost', v_cost,
      'available_balance', v_balance,
      'shortfall', v_shortfall,
      'eligible', v_eligibility_code = 'ELIGIBLE',
      'eligibility_code', v_eligibility_code
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.join_challenge_with_funding_v1(p_challenge_id uuid, p_invite_code text, p_quote_id uuid, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_target record;
  v_existing private.challenge_join_receipts%rowtype;
  v_receipt_id uuid;
  v_request_hash text;
  v_cost integer;
  v_expected_quote_id uuid;
  v_new_balance integer;
  v_joined_at timestamptz;
  v_first_due_at timestamptz;
  v_first_proof_title text;
  v_response jsonb;
begin
  if v_actor_id is null then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'AUTH_REQUIRED',
      'Sign in before joining this challenge.'
    );
  end if;

  if not public.current_session_is_active() then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'AUTH_SESSION_REVOKED',
      'Your session is no longer active. Sign in again before joining.'
    );
  end if;

  if p_quote_id is null or p_client_event_id is null then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'INVALID_REQUEST',
      'A current join quote and request ID are required.'
    );
  end if;

  select *
  into v_target
  from private.resolve_challenge_join_target_v1(
    v_actor_id,
    p_challenge_id,
    p_invite_code
  );

  if v_target.resolution_code <> 'READY' then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      v_target.resolution_code,
      'This challenge is not available to join.'
    );
  end if;


  -- Serialise the free allowance across every group and promise join.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('participation-join:' || v_actor_id::text, 0));

  v_request_hash := pg_catalog.md5(
    v_target.resolved_challenge_id::text || ':' || p_quote_id::text
  );

  -- A client event cannot race itself against a different challenge.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'challenge-join-event:' || v_actor_id::text || ':' ||
        p_client_event_id::text,
      0
    )
  );

  select receipt.*
  into v_existing
  from private.challenge_join_receipts receipt
  where receipt.actor_id = v_actor_id
    and receipt.client_event_id = p_client_event_id
  for update;

  if found then
    if v_existing.request_hash <> v_request_hash
       or v_existing.challenge_id <> v_target.resolved_challenge_id
       or v_existing.quote_id <> p_quote_id then
      return private.challenge_join_failure_v1(
        'CHALLENGE_JOIN',
        'IDEMPOTENCY_MISMATCH',
        'This request ID already belongs to a different join.'
      );
    end if;

    if v_existing.response is null then
      return private.challenge_join_failure_v1(
        'CHALLENGE_JOIN',
        'JOIN_IN_PROGRESS',
        'This join is still being confirmed.'
      );
    end if;

    if coalesce((v_existing.response ->> 'success')::boolean, false) then
      return pg_catalog.jsonb_set(
        v_existing.response,
        '{receipt,idempotent}',
        'true'::jsonb,
        true
      );
    end if;

    return v_existing.response;
  end if;

  -- Distinct request IDs for the same membership also serialise here. The
  -- membership re-check below happens after this lock and before any debit.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'challenge-join-target:' || v_actor_id::text || ':' ||
        v_target.resolved_challenge_id::text,
      0
    )
  );

  select *
  into v_target
  from private.resolve_challenge_join_target_v1(
    v_actor_id,
    v_target.resolved_challenge_id,
    p_invite_code
  );

  if v_target.resolution_code <> 'READY' then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      v_target.resolution_code,
      'This challenge changed before the join could be confirmed.'
    );
  end if;

  if not v_target.is_member and private.economy_quota_error_v1(v_actor_id, 'join_challenge') is not null then
    return private.challenge_join_failure_v1('CHALLENGE_JOIN', 'QUOTA_ACTIVE_PROMISES',
      'Your free plan includes 3 active promises. Finish a promise before joining another.');
  end if;
  v_cost := private.participation_join_cost_v1(v_actor_id);
  v_expected_quote_id := private.challenge_join_quote_id_v1(
    v_target.resolved_challenge_id,
    v_cost
  );

  if p_quote_id <> v_expected_quote_id then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'QUOTE_STALE',
      'The join terms changed. Review the current cost before joining.'
    );
  end if;

  insert into private.challenge_join_receipts (
    actor_id,
    client_event_id,
    challenge_id,
    quote_id,
    request_hash
  ) values (
    v_actor_id,
    p_client_event_id,
    v_target.resolved_challenge_id,
    p_quote_id,
    v_request_hash
  )
  returning id into v_receipt_id;

  if v_target.is_member then
    v_response := private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'ALREADY_JOINED',
      'You are already participating in this challenge.'
    );
    update private.challenge_join_receipts
    set response = v_response, completed_at = now()
    where id = v_receipt_id;
    return v_response;
  end if;

  update public.profiles profile
  set
    momenta_balance = coalesce(profile.momenta_balance, 0) - v_cost,
    updated_at = now()
  where profile.id = v_actor_id
    and coalesce(profile.momenta_balance, 0) >= v_cost
  returning profile.momenta_balance into v_new_balance;

  if v_new_balance is null then
    v_response := private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      case
        when exists (
          select 1 from public.profiles profile where profile.id = v_actor_id
        ) then 'INSUFFICIENT_BALANCE'
        else 'PROFILE_NOT_FOUND'
      end,
      case
        when exists (
          select 1 from public.profiles profile where profile.id = v_actor_id
        ) then 'Your confirmed balance is not enough for this join.'
        else 'Menta could not confirm your wallet profile.'
      end
    );
    update private.challenge_join_receipts
    set response = v_response, completed_at = now()
    where id = v_receipt_id;
    return v_response;
  end if;

  insert into public.challenge_participants (challenge_id, user_id)
  values (v_target.resolved_challenge_id, v_actor_id)
  returning joined_at into v_joined_at;

  if v_target.group_id is not null then
    insert into public.team_members (group_id, user_id, role)
    values (v_target.group_id, v_actor_id, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

  if v_cost > 0 then
    insert into public.wallet_transactions (
      user_id,
      amount,
      reason,
      source_uuid,
      transaction_type,
      description,
      reference_id,
      created_at
    ) values (
      v_actor_id,
      -v_cost,
      'challenge_join',
      p_client_event_id,
      'spent',
      'Challenge join: ' || v_target.challenge_title,
      v_target.resolved_challenge_id,
      now()
    );
  end if;

  perform private.record_participation_join_v1(v_actor_id);

  v_first_due_at := private.challenge_join_first_due_at_v1(
    v_target.start_date,
    v_target.end_date,
    v_target.submission_expectations
  );
  v_first_proof_title := coalesce(
    nullif(pg_catalog.btrim(v_target.verification_description), ''),
    nullif(pg_catalog.btrim(v_target.submission_text), ''),
    'Submit your first proof'
  );

  v_response := pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'CHALLENGE_JOIN',
    'code', 'JOIN_CONFIRMED',
    'receipt', pg_catalog.jsonb_build_object(
      'receipt_id', v_receipt_id,
      'client_event_id', p_client_event_id,
      'quote_id', p_quote_id,
      'challenge_id', v_target.resolved_challenge_id,
      'challenge_title', v_target.challenge_title,
      'group_id', v_target.group_id,
      'group_name', v_target.group_name,
      'joined_at', v_joined_at,
      'debit_amount', v_cost,
      'new_balance', v_new_balance,
      'first_proof_title', v_first_proof_title,
      'first_due_at', v_first_due_at,
      'idempotent', false
    )
  );

  update private.challenge_join_receipts
  set response = v_response, completed_at = now()
  where id = v_receipt_id;

  return v_response;
end;
$function$;

CREATE OR REPLACE FUNCTION public.read_challenge_join_status_v1(p_challenge_id uuid, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_existing private.challenge_join_receipts%rowtype;
  v_is_member boolean := false;
  v_balance integer;
begin
  if v_actor_id is null then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_STATUS',
      'AUTH_REQUIRED',
      'Sign in before checking this join.'
    );
  end if;

  if not public.current_session_is_active() then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_STATUS',
      'AUTH_SESSION_REVOKED',
      'Your session is no longer active. Sign in again before checking.'
    );
  end if;

  if p_challenge_id is null or p_client_event_id is null then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_STATUS',
      'INVALID_REQUEST',
      'A challenge and request ID are required.'
    );
  end if;

  select receipt.*
  into v_existing
  from private.challenge_join_receipts receipt
  where receipt.actor_id = v_actor_id
    and receipt.client_event_id = p_client_event_id
  limit 1;

  if found then
    if v_existing.challenge_id <> p_challenge_id then
      return private.challenge_join_failure_v1(
        'CHALLENGE_JOIN_STATUS',
        'IDEMPOTENCY_MISMATCH',
        'This request ID belongs to a different join.'
      );
    end if;

    if v_existing.response is null then
      return private.challenge_join_failure_v1(
        'CHALLENGE_JOIN_STATUS',
        'JOIN_IN_PROGRESS',
        'This join is still being confirmed.'
      );
    end if;

    if coalesce((v_existing.response ->> 'success')::boolean, false) then
      return pg_catalog.jsonb_build_object(
        'success', true,
        'operation', 'CHALLENGE_JOIN_STATUS',
        'code', 'RECEIPT_FOUND',
        'receipt', pg_catalog.jsonb_set(
          v_existing.response -> 'receipt',
          '{idempotent}',
          'true'::jsonb,
          true
        )
      );
    end if;

    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_STATUS',
      coalesce(v_existing.response ->> 'code', 'JOIN_FAILED'),
      coalesce(
        v_existing.response ->> 'message',
        'The server did not confirm this join.'
      )
    );
  end if;

  select exists (
    select 1
    from public.challenge_participants participant
    where participant.challenge_id = p_challenge_id
      and participant.user_id = v_actor_id
  ) into v_is_member;

  select greatest(0, coalesce(profile.momenta_balance, 0))
  into v_balance
  from public.profiles profile
  where profile.id = v_actor_id;

  if not found then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_STATUS',
      'PROFILE_NOT_FOUND',
      'Menta could not confirm your wallet profile.'
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'CHALLENGE_JOIN_STATUS',
    'code', 'NO_RECEIPT',
    'status', pg_catalog.jsonb_build_object(
      'challenge_id', p_challenge_id,
      'is_member', v_is_member,
      'available_balance', v_balance
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_notification_preferences(p_user_id uuid, p_timezone text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  pref_row public.notification_preferences%rowtype;
  normalized_tz text := nullif(p_timezone, '');
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized to read notification preferences'
      using errcode = '42501';
  end if;

  if normalized_tz is not null
    and not exists (select 1 from pg_timezone_names where name = normalized_tz)
  then
    normalized_tz := null;
  end if;

  insert into public.notification_preferences (
    user_id,
    timezone,
    preferred_reminder_time
  )
  values (
    p_user_id,
    coalesce(normalized_tz, 'UTC'),
    '20:00:00'::time
  )
  on conflict (user_id) do nothing;

  update public.notification_preferences preference
  set
    timezone = coalesce(normalized_tz, preference.timezone, 'UTC'),
    preferred_reminder_time = coalesce(
      preference.preferred_reminder_time,
      '20:00:00'::time
    ),
    updated_at = now()
  where preference.user_id = p_user_id
    and (
      preference.timezone is distinct from coalesce(
        normalized_tz,
        preference.timezone,
        'UTC'
      )
      or preference.preferred_reminder_time is null
    );

  select *
  into pref_row
  from public.notification_preferences
  where user_id = p_user_id;

  return to_jsonb(pref_row);
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_effective_streak_timezone(p_user_id uuid, p_challenge_id uuid, p_client_tz text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  resolved_tz text;
  pref_tz text;
  challenge_tz text;
  client_tz text := nullif(p_client_tz, '');
  is_group_challenge boolean := false;
begin
  select exists (
    select 1 from public.team_challenges team_challenge
    where team_challenge.challenge_id = p_challenge_id
  ) into is_group_challenge;
  select nullif(challenge.streak_timezone, '') into challenge_tz
  from public.challenges challenge where challenge.id = p_challenge_id limit 1;
  select nullif(preference.timezone, '') into pref_tz
  from public.notification_preferences preference
  where preference.user_id = p_user_id limit 1;
  if is_group_challenge then
    resolved_tz := coalesce(challenge_tz, pref_tz, client_tz, 'UTC');
  else
    resolved_tz := coalesce(client_tz, pref_tz, challenge_tz, 'UTC');
  end if;
  begin
    perform pg_catalog.timezone(resolved_tz, pg_catalog.now());
  exception when invalid_parameter_value then
    resolved_tz := 'UTC';
  end;
  return resolved_tz;
end;
$function$;

CREATE OR REPLACE FUNCTION public.join_public_group_v1(p_group_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.join_public_group_v2(p_group_id, 0);
$function$;

CREATE OR REPLACE FUNCTION public.join_challenge_with_invite_v1(p_invite_code text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select pg_catalog.jsonb_build_object('success', false, 'error',
    case when auth.uid() is null or not public.current_session_is_active()
      then 'UNAUTHORIZED' else 'JOIN_QUOTE_REQUIRED' end);
$function$;

CREATE OR REPLACE FUNCTION public.consume_edge_rate_limit(p_endpoint text, p_actor_key_hash text, p_max_requests integer, p_window_minutes integer)
 RETURNS TABLE(allowed boolean, retry_after_seconds integer, request_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_seconds integer;
  v_window_start timestamptz;
  v_count integer;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise insufficient_privilege using message = 'Service role required';
  end if;
  if nullif(pg_catalog.btrim(coalesce(p_endpoint, '')), '') is null
    or pg_catalog.length(p_endpoint) > 120
    or p_actor_key_hash !~ '^[0-9a-f]{64}$'
    or p_max_requests not between 1 and 100000
    or p_window_minutes not between 1 and 10080
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid rate-limit arguments';
  end if;

  v_window_seconds := p_window_minutes * 60;
  v_window_start := pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch from v_now) / v_window_seconds)
      * v_window_seconds
  );

  insert into public.edge_rate_limits as limiter (
    endpoint, actor_key, window_start, request_count, created_at, updated_at
  ) values (
    pg_catalog.btrim(p_endpoint), p_actor_key_hash, v_window_start, 1, v_now, v_now
  )
  on conflict (endpoint, actor_key, window_start)
  do update set
    request_count = limiter.request_count + 1,
    updated_at = excluded.updated_at
  returning limiter.request_count into v_count;

  return query select
    v_count <= p_max_requests,
    case when v_count <= p_max_requests then 0 else greatest(
      1,
      pg_catalog.ceil(extract(epoch from (
        v_window_start + pg_catalog.make_interval(mins => p_window_minutes) - v_now
      )))::integer
    ) end,
    v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION private.enforce_ad_reward_limit_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_count integer;
  v_latest timestamptz;
  v_daily_limit integer := 5;
  v_cooldown_seconds integer := 120;
  v_now timestamptz := pg_catalog.now();
begin
  if new.transaction_type <> 'bonus' or new.reason <> 'Ad reward' then
    return new;
  end if;

  if new.external_reference_id is null
     or new.external_reference_id not like 'rc:ad_reward:%'
  then
    raise check_violation using message = 'PROVIDER_RECEIPT_REQUIRED';
  end if;

  begin
    select
      greatest(
        1,
        coalesce((config.value::jsonb #>> '{ads,dailyLimit}')::integer, 5)
      ),
      greatest(
        0,
        coalesce((config.value::jsonb #>> '{ads,cooldownSeconds}')::integer, 120)
      )
    into v_daily_limit, v_cooldown_seconds
    from public.system_config config
    where config.key = 'economy_contract_v1'
    limit 1;
  exception when others then
    v_daily_limit := 5;
    v_cooldown_seconds := 120;
  end;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('ad-reward:' || new.user_id::text, 0)
  );
  select count(*), max(transaction.created_at)
  into v_count, v_latest
  from public.wallet_transactions transaction
  where transaction.user_id = new.user_id
    and transaction.transaction_type = 'bonus'
    and transaction.reason = 'Ad reward'
    and transaction.created_at >= v_now - interval '1 day';

  if v_count >= v_daily_limit then
    raise check_violation using message = 'DAILY_LIMIT';
  end if;
  if v_latest is not null
     and v_latest >
       v_now - pg_catalog.make_interval(secs => v_cooldown_seconds)
  then
    raise check_violation using message = 'COOLDOWN';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.validate_challenge_proof_object_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_object storage.objects%rowtype;
  v_mime text;
  v_size bigint;
  v_pattern text;
begin
  if new.media_type = 'text' then
    if new.media_url is not null then
      raise check_violation using message = 'Text proof cannot reference media';
    end if;
    return new;
  end if;

  v_pattern := '^' || new.user_id::text
    || '/proof-' || new.challenge_id::text
    || '-' || new.client_event_id::text
    || case when new.media_type = 'photo'
      then '\.(jpg|jpeg|png|webp)$'
      else '\.(mp4|mov|webm)$'
    end;

  if new.media_url is null or new.media_url !~* v_pattern then
    raise check_violation using message = 'Proof media path is not account-bound';
  end if;

  select object_row.* into v_object
  from storage.objects object_row
  where object_row.bucket_id = 'challenge-verifications'
    and object_row.name = new.media_url
    and object_row.owner_id = new.user_id::text
  limit 1;

  if not found then
    raise check_violation using message = 'Proof media object is unavailable';
  end if;

  v_mime := coalesce(v_object.metadata ->> 'mimetype', '');
  v_size := coalesce((v_object.metadata ->> 'size')::bigint, 0);
  if v_size <= 0 or v_size > 52428800
    or (new.media_type = 'photo' and v_mime not in ('image/jpeg','image/png','image/webp'))
    or (new.media_type = 'video' and v_mime not in ('video/mp4','video/quicktime','video/webm'))
  then
    raise check_violation using message = 'Proof media metadata is invalid';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.storage_upload_allowed_v1(p_bucket_id text, p_name text, p_owner_id text, p_metadata jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_size_text text := coalesce(p_metadata ->> 'size', '');
  v_size bigint;
  v_mime text := lower(coalesce(p_metadata ->> 'mimetype', ''));
  v_matches text[];
  v_hour_limit integer;
  v_day_limit integer;
  v_day_byte_limit bigint;
  v_hour_count bigint;
  v_day_count bigint;
  v_day_bytes bigint;
begin
  if v_actor_id is null
     or p_owner_id is distinct from v_actor_id::text
     or not public.current_session_is_active() then
    return false;
  end if;

  if v_size_text !~ '^[0-9]+$' then
    return false;
  end if;
  v_size := v_size_text::bigint;

  case p_bucket_id
    when 'challenge-verifications' then
      v_matches := pg_catalog.regexp_match(
        p_name,
        '^' || v_actor_id::text
          || '/proof-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
          || '-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
          || '\.(jpg|jpeg|png|webp|mp4|mov|webm)$',
        'i'
      );
      if v_matches is null
         or v_size <= 0
         or v_size > 52428800
         or v_mime not in (
           'image/jpeg',
           'image/png',
           'image/webp',
           'video/mp4',
           'video/quicktime',
           'video/webm'
         )
         or not exists (
           select 1
           from public.challenges challenge
           left join public.challenge_participants participant
             on participant.challenge_id = challenge.id
            and participant.user_id = v_actor_id
            and participant.status = 'active'
           where challenge.id = v_matches[1]::uuid
             and challenge.status = 'active'
             and (
               challenge.creator_id = v_actor_id
               or participant.user_id is not null
             )
         ) then
        return false;
      end if;
      v_hour_limit := 20;
      v_day_limit := 50;
      v_day_byte_limit := 524288000;

    when 'profile-pictures' then
      if p_name !~* (
           '^' || v_actor_id::text || '/avatar-[0-9]{13}\.(jpg|jpeg|png|webp)$'
         )
         or v_size <= 0
         or v_size > 5242880
         or v_mime not in ('image/jpeg', 'image/png', 'image/webp') then
        return false;
      end if;
      v_hour_limit := 5;
      v_day_limit := 10;
      v_day_byte_limit := 52428800;

    when 'support-attachments' then
      if p_name !~* (
           '^' || v_actor_id::text
             || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
             || '/screenshot-1\.(jpg|jpeg|png|webp)$'
         )
         or v_size <= 0
         or v_size > 8388608
         or v_mime not in ('image/jpeg', 'image/png', 'image/webp') then
        return false;
      end if;
      v_hour_limit := 5;
      v_day_limit := 10;
      v_day_byte_limit := 41943040;

    else
      return false;
  end case;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'storage-upload:' || p_bucket_id || ':' || v_actor_id::text,
      0
    )
  );

  select
    count(*) filter (
      where usage.created_at >= pg_catalog.clock_timestamp() - interval '1 hour'
    ),
    count(*),
    coalesce(sum(usage.byte_size), 0)
  into v_hour_count, v_day_count, v_day_bytes
  from private.storage_upload_usage_v1 usage
  where usage.bucket_id = p_bucket_id
    and usage.user_id = v_actor_id
    and usage.created_at >= pg_catalog.clock_timestamp() - interval '1 day';

  if v_hour_count >= v_hour_limit
     or v_day_count >= v_day_limit
     or v_day_bytes + v_size > v_day_byte_limit then
    return false;
  end if;

  insert into private.storage_upload_usage_v1 (user_id, bucket_id, byte_size)
  values (v_actor_id, p_bucket_id, v_size);

  return true;
end;
$function$;

CREATE OR REPLACE FUNCTION public.use_streak_freeze_for_user(p_user_id uuid, p_challenge_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  updated_qty integer;
  remaining_total integer;
begin
  update public.inventory_items
  set
    quantity = quantity - 1,
    updated_at = now()
  where id = (
    select ii.id
    from public.inventory_items ii
    where ii.user_id = p_user_id
      and public.is_streak_freeze_sku(ii.item_sku)
      and ii.quantity > 0
    order by ii.updated_at desc nulls last, ii.created_at desc nulls last
    limit 1
    for update skip locked
  )
  returning quantity into updated_qty;

  if updated_qty is null then
    return jsonb_build_object(
      'used', false,
      'remaining', public.get_available_streak_freezes(p_user_id)
    );
  end if;

  select public.get_available_streak_freezes(p_user_id)
  into remaining_total;

  update public.challenge_participants cp
  set
    streak_freezes_remaining = remaining_total,
    at_risk = false,
    updated_at = now()
  where cp.user_id = p_user_id
    and cp.challenge_id = p_challenge_id;

  return jsonb_build_object(
    'used', true,
    'remaining', coalesce(remaining_total, 0)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.submit_challenge_verification(p_challenge_id uuid, p_media_url text DEFAULT NULL::text, p_media_type text DEFAULT 'photo'::text, p_client_event_id uuid DEFAULT gen_random_uuid(), p_client_tz text DEFAULT NULL::text, p_submission_text text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid := coalesce(p_client_event_id, pg_catalog.gen_random_uuid());
  v_timezone text;
  v_current_day date;
  v_submission_day date;
  v_challenge record;
  v_participant public.challenge_participants%rowtype;
  v_existing public.challenge_submissions%rowtype;
  v_submission public.challenge_submissions%rowtype;
  v_rejection public.challenge_submissions%rowtype;
  v_media_type text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_media_type, 'photo')));
  v_media_url text := nullif(pg_catalog.btrim(coalesce(p_media_url, '')), '');
  v_text text := nullif(pg_catalog.btrim(coalesce(p_submission_text, '')), '');
  v_stored_url text;
  v_stored_text text;
  v_status text;
  v_streak jsonb := 'null'::jsonb;
  v_input_accepted boolean := false;
begin
  if v_user_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_AUTHENTICATED',
      'message', 'Sign in again before sending proof.'
    );
  end if;

  select challenge.id, challenge.allow_self_review into v_challenge
  from public.challenges challenge
  where challenge.id = p_challenge_id
    and coalesce(challenge.status, 'active') = 'active';
  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'CHALLENGE_NOT_FOUND',
      'message', 'This promise is no longer available.'
    );
  end if;

  select participant.* into v_participant
  from public.challenge_participants participant
  where participant.user_id = v_user_id
    and participant.challenge_id = p_challenge_id
    and coalesce(participant.status, 'active') = 'active'
  for update;
  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'NOT_JOINED',
      'message', 'Join this promise before sending proof.'
    );
  end if;

  v_timezone := public.get_effective_streak_timezone(
    v_user_id, p_challenge_id, p_client_tz
  );
  v_current_day := (pg_catalog.now() at time zone v_timezone)::date;
  v_submission_day := public.resolve_extension_submission_local_day_v1(
    v_user_id, p_challenge_id, v_current_day
  );
  if v_submission_day = v_current_day then
    return public.submit_challenge_verification_without_extension_v1(
      p_challenge_id, p_media_url, p_media_type, v_event_id,
      p_client_tz, p_submission_text
    );
  end if;

  if v_media_type not in ('photo', 'video', 'text') then
    return pg_catalog.jsonb_build_object(
      'success', false, 'code', 'INVALID_MEDIA_TYPE',
      'message', 'Only photo, video, and text proof can be sent.'
    );
  end if;
  if v_media_type = 'text' then
    v_stored_text := coalesce(v_text, v_media_url);
    if v_stored_text is null then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'TEXT_PROOF_REQUIRED',
        'message', 'Add what you completed before sending text proof.'
      );
    end if;
  else
    v_stored_url := v_media_url;
    v_stored_text := v_text;
    if v_stored_url is null then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'MEDIA_REQUIRED',
        'message', 'Upload the photo or video before sending proof.'
      );
    end if;
  end if;

  select proof.* into v_existing
  from public.challenge_submissions proof
  where proof.user_id = v_user_id and proof.client_event_id = v_event_id
  limit 1;
  if found then
    if v_existing.challenge_id is distinct from p_challenge_id
      or v_existing.media_type is distinct from v_media_type
      or v_existing.media_url is distinct from v_stored_url
      or v_existing.submission_text is distinct from v_stored_text then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'IDEMPOTENCY_KEY_REUSED',
        'message', 'This send key already belongs to different proof.'
      );
    end if;
    v_submission := v_existing;
  else
    select proof.* into v_existing
    from public.challenge_submissions proof
    where proof.user_id = v_user_id
      and proof.challenge_id = p_challenge_id
      and proof.local_day = v_submission_day
      and proof.status in ('pending', 'approved')
    limit 1 for update;
    if found then
      return pg_catalog.jsonb_build_object(
        'success', false, 'code', 'DAILY_SUBMISSION_EXISTS',
        'message', 'This proof is already sent.',
        'submissionId', v_existing.id, 'status', v_existing.status
      );
    end if;

    select proof.* into v_rejection
    from public.challenge_submissions proof
    where proof.user_id = v_user_id
      and proof.challenge_id = p_challenge_id
      and proof.local_day = v_submission_day
      and proof.status = 'rejected'
    order by proof.submission_date desc, proof.id desc
    limit 1 for update;
    v_status := case when coalesce(v_challenge.allow_self_review, false)
      then 'approved' else 'pending' end;
    insert into public.challenge_submissions (
      challenge_id, user_id, media_url, media_type, submission_text,
      submission_type, status, submission_date, verification_date,
      reviewer_id, local_day, client_event_id, replaces_submission_id
    ) values (
      p_challenge_id, v_user_id, v_stored_url, v_media_type, v_stored_text,
      v_media_type, v_status, pg_catalog.now(),
      case when v_status = 'approved' then pg_catalog.now() end,
      case when v_status = 'approved' then v_user_id end,
      v_submission_day, v_event_id, v_rejection.id
    ) returning * into v_submission;
    v_input_accepted := true;
  end if;

  if v_submission.status = 'approved' then
    v_streak := public.apply_approved_streak_checkin(
      v_user_id, p_challenge_id, v_submission_day, v_timezone, v_submission.id
    );
    if not coalesce((v_streak ->> 'success')::boolean, false) then
      raise exception 'APPROVED_STREAK_APPLY_FAILED: %',
        coalesce(v_streak ->> 'error', 'UNKNOWN');
    end if;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'inputAccepted', v_input_accepted,
    'submissionId', v_submission.id,
    'clientEventId', v_submission.client_event_id,
    'status', v_submission.status,
    'allowSelfReview', coalesce(v_challenge.allow_self_review, false),
    'newStreak', coalesce((v_streak ->> 'newStreak')::integer, v_participant.current_streak, 0),
    'longestStreak', greatest(coalesce(v_participant.longest_streak, 0), coalesce((v_streak ->> 'newStreak')::integer, 0)),
    'freezeUsed', false,
    'freezesRemaining', public.get_available_streak_freezes(v_user_id),
    'dayStatus', coalesce(v_streak ->> 'dayStatus', 'pending_review'),
    'milestone', coalesce(v_streak -> 'milestone', 'null'::jsonb),
    'effectiveLocalDay', v_submission_day::text,
    'effectiveTimezone', v_timezone,
    'isCorrection', v_submission.replaces_submission_id is not null,
    'replacesSubmissionId', v_submission.replaces_submission_id,
    'extensionApplied', true,
    'data', pg_catalog.to_jsonb(v_submission)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_get_attendee_album_v1(p_occurrence_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_is_organiser boolean := false;
  v_is_joined boolean := false;
  v_is_checked_in boolean := false;
  v_viewer_can_post boolean := false;
  v_approved_post_count integer := 0;
  v_items jsonb := '[]'::jsonb;
begin
  if v_actor_id is null then
    return private.event_result_v1(
      'get_attendee_album',
      null,
      'failed',
      'AUTHENTICATION_REQUIRED',
      'Sign in to open the attendee album.',
      null
    );
  end if;

  select occurrence.*
  into v_occurrence
  from public.event_occurrences as occurrence
  where occurrence.id = p_occurrence_id;

  if not found then
    return private.event_result_v1(
      'get_attendee_album',
      null,
      'failed',
      'OCCURRENCE_UNAVAILABLE',
      'This event occurrence is not available.',
      null
    );
  end if;

  select event.*
  into v_event
  from public.event_events as event
  where event.id = v_occurrence.event_id;

  if not found
     or v_event.status not in ('published', 'archived')
     or v_occurrence.state not in ('live', 'ended') then
    return private.event_result_v1(
      'get_attendee_album',
      null,
      'failed',
      'ALBUM_UNAVAILABLE',
      'The attendee album is not available for this occurrence.',
      null
    );
  end if;

  v_is_organiser := v_event.organiser_id is not distinct from v_actor_id;

  select exists (
    select 1
    from public.event_attendances as attendance
    where attendance.occurrence_id = v_occurrence.id
      and attendance.user_id = v_actor_id
      and attendance.state = 'joined'
  )
  into v_is_joined;

  select exists (
    select 1
    from public.event_attendances as attendance
    join public.event_checkins as checkin
      on checkin.attendance_id = attendance.id
      and checkin.revoked_at is null
    where attendance.occurrence_id = v_occurrence.id
      and attendance.user_id = v_actor_id
      and attendance.state = 'joined'
  )
  into v_is_checked_in;

  if not v_is_organiser and not v_is_checked_in then
    return private.event_result_v1(
      'get_attendee_album',
      null,
      'failed',
      'ALBUM_NOT_ELIGIBLE',
      'A confirmed check-in is required to open this attendee album.',
      null
    );
  end if;

  v_viewer_can_post :=
    v_is_joined
    and v_is_checked_in
    and private.event_posting_is_open_v1(v_occurrence);

  select count(*)::integer
  into v_approved_post_count
  from public.event_posts as post
  join public.event_attendances as attendance
    on attendance.occurrence_id = post.occurrence_id
    and attendance.user_id = post.user_id
    and attendance.state = 'joined'
  join public.event_checkins as checkin
    on checkin.attendance_id = attendance.id
    and checkin.revoked_at is null
  where post.occurrence_id = v_occurrence.id
    and post.status = 'approved'
    and post.media_path is not null
    and post.reviewed_at is not null;

  select coalesce(
    jsonb_agg(
      album_row.item
      order by album_row.created_at desc, album_row.post_id desc
    ),
    '[]'::jsonb
  )
  into v_items
  from (
    select
      post.id as post_id,
      post.created_at,
      private.event_album_item_json_v1(post, profile, checkin) as item
    from public.event_posts as post
    join public.profiles as profile on profile.id = post.user_id
    join public.event_attendances as attendance
      on attendance.occurrence_id = post.occurrence_id
      and attendance.user_id = post.user_id
      and attendance.state = 'joined'
    join public.event_checkins as checkin
      on checkin.attendance_id = attendance.id
      and checkin.revoked_at is null
    where post.occurrence_id = v_occurrence.id
      and post.status = 'approved'
      and post.media_path is not null
      and post.reviewed_at is not null
    order by post.created_at desc, post.id desc
    limit 24
  ) as album_row;

  return private.event_result_v1(
    'get_attendee_album',
    null,
    'completed',
    'ATTENDEE_ALBUM_READY',
    'The attendee album is ready.',
    jsonb_build_object(
      'eventId', v_event.id,
      'occurrenceId', v_occurrence.id,
      'eventTitle', v_event.title,
      'viewerRole', case when v_is_organiser then 'organiser' else 'attendee' end,
      'viewerCanPost', v_viewer_can_post,
      'downloadsAllowed', false,
      'approvedPostCount', v_approved_post_count,
      'items', v_items
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.author_proof_extension_deadline_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_previous public.power_up_usage%rowtype;
  v_timezone text;
  v_local_day date;
begin
  if pg_catalog.lower(coalesce(new.item_sku, '')) not in (
    'time_extension_1', 'booster_extension_12h'
  ) or new.user_id is null or new.challenge_id is null then
    return new;
  end if;

  -- The RPC already locks one client_event_id. This lock also serialises two
  -- different requests aimed at the same user's promise.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      new.user_id::text || ':' || new.challenge_id::text,
      0
    )
  );

  select extension.* into v_previous
  from public.power_up_usage extension
  where extension.user_id = new.user_id
    and extension.challenge_id = new.challenge_id
    and extension.proof_due_at > coalesce(new.used_at, pg_catalog.now())
    and pg_catalog.lower(extension.item_sku) in (
      'time_extension_1', 'booster_extension_12h'
    )
  order by extension.proof_due_at desc, extension.id desc
  limit 1;

  if found then
    new.obligation_local_day := v_previous.obligation_local_day;
    new.effective_timezone := v_previous.effective_timezone;
    new.proof_due_at := v_previous.proof_due_at + interval '12 hours';
    return new;
  end if;

  v_timezone := public.get_effective_streak_timezone(
    new.user_id, new.challenge_id, null
  );
  v_local_day := (
    coalesce(new.used_at, pg_catalog.now()) at time zone v_timezone
  )::date;
  new.obligation_local_day := v_local_day;
  new.effective_timezone := v_timezone;
  new.proof_due_at := (
    (v_local_day + 1)::timestamp at time zone v_timezone
  ) + interval '12 hours';
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_feature_vote_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feature_requests SET vote_count = vote_count + 1 WHERE id = NEW.feature_request_id;
    RETURN NEW;
  ELSE
    UPDATE public.feature_requests SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.feature_request_id;
    RETURN OLD;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_extension_submission_local_day_v1(p_user_id uuid, p_challenge_id uuid, p_fallback_local_day date)
 RETURNS date
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce((
    select extension.obligation_local_day
    from public.power_up_usage extension
    where extension.user_id = p_user_id
      and extension.challenge_id = p_challenge_id
      and extension.proof_due_at > pg_catalog.now()
      and extension.obligation_local_day is not null
      and not exists (
        select 1 from public.streak_day_outcomes outcome
        where outcome.user_id = extension.user_id
          and outcome.challenge_id = extension.challenge_id
          and outcome.local_day = extension.obligation_local_day
      )
    order by extension.obligation_local_day, extension.proof_due_at desc
    limit 1
  ), p_fallback_local_day);
$function$;

CREATE OR REPLACE FUNCTION public.submit_challenge_verification_without_extension_v1(p_challenge_id uuid, p_media_url text DEFAULT NULL::text, p_media_type text DEFAULT 'photo'::text, p_client_event_id uuid DEFAULT gen_random_uuid(), p_client_tz text DEFAULT NULL::text, p_submission_text text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_client_event_id uuid := coalesce(
    p_client_event_id,
    pg_catalog.gen_random_uuid()
  );
  v_challenge record;
  v_effective_tz text;
  v_today_local date;
  v_participant public.challenge_participants%rowtype;
  v_existing_submission public.challenge_submissions%rowtype;
  v_latest_rejection public.challenge_submissions%rowtype;
  v_resolved_submission public.challenge_submissions%rowtype;
  v_submission_id uuid;
  v_submission_status text;
  v_streak_result jsonb := 'null'::jsonb;
  v_new_streak integer;
  v_longest_streak integer;
  v_day_status text := 'pending_review';
  v_freeze_used boolean := false;
  v_freezes_remaining integer := 0;
  v_milestone jsonb := 'null'::jsonb;
  v_media_type text := lower(pg_catalog.btrim(coalesce(p_media_type, 'photo')));
  v_media_url text := nullif(pg_catalog.btrim(coalesce(p_media_url, '')), '');
  v_submission_text text := nullif(
    pg_catalog.btrim(coalesce(p_submission_text, '')),
    ''
  );
  v_stored_media_url text;
  v_stored_submission_text text;
  v_input_accepted boolean := false;
  v_is_correction boolean := false;
  v_replaces_submission_id uuid;
begin
  if v_user_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_AUTHENTICATED',
      'error', 'Unauthorized',
      'message', 'Sign in again before sending proof.'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'SESSION_REVOKED',
      'error', 'Session revoked',
      'message', 'Your session is no longer active. Sign in again before sending proof.'
    );
  end if;

  if v_media_type not in ('photo', 'video', 'text') then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'INVALID_MEDIA_TYPE',
      'error', 'Invalid media type. Only photo, video, and text are allowed.',
      'message', 'Only photo, video, and text proof can be sent.'
    );
  end if;

  if v_media_type = 'text' then
    v_stored_submission_text := coalesce(v_submission_text, v_media_url);
    v_stored_media_url := null;

    if v_stored_submission_text is null then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'code', 'TEXT_PROOF_REQUIRED',
        'error', 'Text proof requires submission text.',
        'message', 'Add what you completed before sending text proof.'
      );
    end if;
  else
    v_stored_media_url := v_media_url;
    v_stored_submission_text := v_submission_text;

    if v_stored_media_url is null then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'code', 'MEDIA_REQUIRED',
        'error', 'Photo and video proof require uploaded media.',
        'message', 'Upload the photo or video before sending proof.'
      );
    end if;
  end if;

  select c.id, c.allow_self_review
  into v_challenge
  from public.challenges c
  where c.id = p_challenge_id;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'CHALLENGE_NOT_FOUND',
      'error', 'Challenge not found',
      'message', 'This promise is no longer available.'
    );
  end if;

  -- Keep the deployed per-participant lock. It serialises same-day submits
  -- without widening the lock to unrelated users or challenges.
  select cp.*
  into v_participant
  from public.challenge_participants cp
  where cp.challenge_id = p_challenge_id
    and cp.user_id = v_user_id
    and coalesce(cp.status, 'active') = 'active'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'NOT_JOINED',
      'code', 'NOT_JOINED',
      'message', 'Join this promise before sending proof.'
    );
  end if;

  v_effective_tz := public.get_effective_streak_timezone(
    v_user_id,
    p_challenge_id,
    p_client_tz
  );
  v_today_local := (now() at time zone v_effective_tz)::date;
  v_submission_status := case
    when coalesce(v_challenge.allow_self_review, false) then 'approved'
    else 'pending'
  end;

  -- Resolve this exact send before looking at the day's active row. A retry
  -- must keep returning the row it originally created, including a rejected
  -- row that now has a later correction.
  select cs.*
  into v_resolved_submission
  from public.challenge_submissions cs
  where cs.user_id = v_user_id
    and cs.client_event_id = v_client_event_id
  limit 1
  for update;

  if found then
    if v_resolved_submission.challenge_id is distinct from p_challenge_id
      or v_resolved_submission.media_type is distinct from v_media_type
      or v_resolved_submission.media_url is distinct from v_stored_media_url
      or v_resolved_submission.submission_text
        is distinct from v_stored_submission_text
    then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'code', 'IDEMPOTENCY_KEY_REUSED',
        'error', 'IDEMPOTENCY_KEY_REUSED',
        'message', 'This send key already belongs to different proof.'
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'inputAccepted', false,
      'submissionId', v_resolved_submission.id,
      'clientEventId', v_resolved_submission.client_event_id,
      'status', v_resolved_submission.status,
      'allowSelfReview', coalesce(v_challenge.allow_self_review, false),
      'newStreak', coalesce(v_participant.current_streak, 0),
      'longestStreak', greatest(
        coalesce(v_participant.longest_streak, 0),
        coalesce(v_participant.current_streak, 0)
      ),
      'freezeUsed', false,
      'freezesRemaining', public.get_available_streak_freezes(v_user_id),
      'dayStatus', case
        when v_resolved_submission.status = 'approved' then 'already_applied'
        else 'pending_review'
      end,
      'milestone', null,
      'effectiveLocalDay', v_resolved_submission.local_day::text,
      'effectiveTimezone', v_effective_tz,
      'isCorrection', v_resolved_submission.replaces_submission_id is not null,
      'replacesSubmissionId', v_resolved_submission.replaces_submission_id,
      'data', pg_catalog.jsonb_build_object(
        'id', v_resolved_submission.id,
        'client_event_id', v_resolved_submission.client_event_id,
        'status', v_resolved_submission.status,
        'allowSelfReview', coalesce(v_challenge.allow_self_review, false),
        'media_url', v_resolved_submission.media_url,
        'media_type', v_resolved_submission.media_type,
        'submission_text', v_resolved_submission.submission_text,
        'replaces_submission_id', v_resolved_submission.replaces_submission_id
      )
    );
  end if;

  -- A new key cannot displace a pending or approved proof. Return a typed
  -- failure instead of pointing the new key at another event's receipt.
  select cs.*
  into v_existing_submission
  from public.challenge_submissions cs
  where cs.challenge_id = p_challenge_id
    and cs.user_id = v_user_id
    and cs.local_day = v_today_local
    and cs.status in ('pending', 'approved')
  order by cs.submission_date desc, cs.id desc
  limit 1
  for update;

  if v_existing_submission.id is not null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'DAILY_SUBMISSION_EXISTS',
      'error', 'DAILY_SUBMISSION_EXISTS',
      'message', case
        when v_existing_submission.status = 'approved'
          then 'Today''s proof is already approved.'
        else 'Today''s proof is already waiting for review.'
      end,
      'submissionId', v_existing_submission.id,
      'status', v_existing_submission.status
    );
  end if;

  -- A rejected row is immutable evidence. Link the new row to the latest
  -- rejection and leave its media, notes, status, and event ID untouched.
  select cs.*
  into v_latest_rejection
  from public.challenge_submissions cs
  where cs.challenge_id = p_challenge_id
    and cs.user_id = v_user_id
    and cs.local_day = v_today_local
    and cs.status = 'rejected'
  order by cs.submission_date desc, cs.id desc
  limit 1
  for update;

  if found then
    v_is_correction := true;
    v_replaces_submission_id := v_latest_rejection.id;
  end if;

  begin
    insert into public.challenge_submissions (
      challenge_id,
      user_id,
      media_url,
      media_type,
      submission_text,
      submission_type,
      status,
      submission_date,
      verification_date,
      reviewer_id,
      local_day,
      client_event_id,
      replaces_submission_id
    )
    values (
      p_challenge_id,
      v_user_id,
      v_stored_media_url,
      v_media_type,
      v_stored_submission_text,
      v_media_type,
      v_submission_status,
      now(),
      case when v_submission_status = 'approved' then now() else null end,
      case when v_submission_status = 'approved' then v_user_id else null end,
      v_today_local,
      v_client_event_id,
      v_replaces_submission_id
    )
    on conflict (user_id, client_event_id)
    do nothing
    returning id into v_submission_id;

    v_input_accepted := v_submission_id is not null;
  exception
    when unique_violation then
      -- A privileged out-of-band writer can bypass the participant lock. The
      -- resolution below still returns only an exact event or active-day row.
      v_submission_id := null;
      v_input_accepted := false;
  end;

  if v_submission_id is null then
    select cs.*
    into v_resolved_submission
    from public.challenge_submissions cs
    where cs.user_id = v_user_id
      and cs.client_event_id = v_client_event_id
    limit 1;

    if found then
      if v_resolved_submission.challenge_id is distinct from p_challenge_id
        or v_resolved_submission.media_type is distinct from v_media_type
        or v_resolved_submission.media_url is distinct from v_stored_media_url
        or v_resolved_submission.submission_text
          is distinct from v_stored_submission_text
      then
        return pg_catalog.jsonb_build_object(
          'success', false,
          'code', 'IDEMPOTENCY_KEY_REUSED',
          'error', 'IDEMPOTENCY_KEY_REUSED',
          'message', 'This send key already belongs to different proof.'
        );
      end if;

      v_submission_id := v_resolved_submission.id;
    else
      select cs.*
      into v_resolved_submission
      from public.challenge_submissions cs
      where cs.challenge_id = p_challenge_id
        and cs.user_id = v_user_id
        and cs.local_day = v_today_local
        and cs.status in ('pending', 'approved')
      order by cs.submission_date desc, cs.id desc
      limit 1;

      if found then
        return pg_catalog.jsonb_build_object(
          'success', false,
          'code', 'DAILY_SUBMISSION_EXISTS',
          'error', 'DAILY_SUBMISSION_EXISTS',
          'message', case
            when v_resolved_submission.status = 'approved'
              then 'Today''s proof is already approved.'
            else 'Today''s proof is already waiting for review.'
          end,
          'submissionId', v_resolved_submission.id,
          'status', v_resolved_submission.status
        );
      end if;
    end if;
  end if;

  if v_submission_id is not null then
    select cs.*
    into v_resolved_submission
    from public.challenge_submissions cs
    where cs.id = v_submission_id;
  end if;

  if not found
    or v_resolved_submission.user_id is distinct from v_user_id
    or v_resolved_submission.challenge_id is distinct from p_challenge_id
    or v_resolved_submission.local_day is distinct from v_today_local
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'SUBMISSION_IDEMPOTENCY_MISMATCH',
      'error', 'SUBMISSION_IDEMPOTENCY_MISMATCH',
      'message', 'Menta could not resolve this proof to one server receipt.'
    );
  end if;

  v_submission_status := v_resolved_submission.status;
  v_is_correction := v_resolved_submission.replaces_submission_id is not null;
  v_replaces_submission_id := v_resolved_submission.replaces_submission_id;

  -- Every approved row goes through the deployed idempotent authority. It
  -- applies the first legitimate approval and returns already_applied when
  -- this local day has already earned its streak, freeze, and milestone.
  if v_submission_status = 'approved' then
    v_streak_result := public.apply_approved_streak_checkin(
      v_user_id,
      p_challenge_id,
      v_today_local,
      v_effective_tz,
      v_submission_id
    );

    if not coalesce((v_streak_result ->> 'success')::boolean, false) then
      raise exception 'APPROVED_STREAK_APPLY_FAILED: %',
        coalesce(v_streak_result ->> 'error', 'UNKNOWN');
    end if;

    v_new_streak := coalesce(
      (v_streak_result ->> 'newStreak')::integer,
      coalesce(v_participant.current_streak, 0)
    );
    v_longest_streak := coalesce(
      (v_streak_result ->> 'longestStreak')::integer,
      coalesce(v_participant.longest_streak, 0)
    );
    v_freeze_used := coalesce(
      (v_streak_result ->> 'freezeUsed')::boolean,
      false
    );
    v_freezes_remaining := coalesce(
      (v_streak_result ->> 'freezesRemaining')::integer,
      0
    );
    v_day_status := coalesce(v_streak_result ->> 'dayStatus', 'done');
    v_milestone := coalesce(
      v_streak_result -> 'milestone',
      'null'::jsonb
    );
  else
    v_new_streak := coalesce(v_participant.current_streak, 0);
    v_longest_streak := greatest(
      coalesce(v_participant.longest_streak, 0),
      v_new_streak
    );
    v_freezes_remaining := public.get_available_streak_freezes(v_user_id);
    v_day_status := case
      when v_submission_status = 'approved' then 'already_applied'
      else 'pending_review'
    end;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'inputAccepted', v_input_accepted,
    'submissionId', v_submission_id,
    'clientEventId', v_resolved_submission.client_event_id,
    'status', v_submission_status,
    'allowSelfReview', coalesce(v_challenge.allow_self_review, false),
    'newStreak', v_new_streak,
    'longestStreak', v_longest_streak,
    'freezeUsed', v_freeze_used,
    'freezesRemaining', v_freezes_remaining,
    'dayStatus', v_day_status,
    'milestone', v_milestone,
    'effectiveLocalDay', v_today_local::text,
    'effectiveTimezone', v_effective_tz,
    'isCorrection', v_is_correction,
    'replacesSubmissionId', v_replaces_submission_id,
    'data', pg_catalog.jsonb_build_object(
      'id', v_submission_id,
      'client_event_id', v_resolved_submission.client_event_id,
      'status', v_submission_status,
      'allowSelfReview', coalesce(v_challenge.allow_self_review, false),
      'media_url', v_resolved_submission.media_url,
      'media_type', v_resolved_submission.media_type,
      'submission_text', v_resolved_submission.submission_text,
      'replaces_submission_id', v_replaces_submission_id
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.maintain_streak_participant(p_user_id uuid, p_challenge_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_anchor jsonb;
  v_timezone text;
  v_today date;
  v_extension_through_day date;
  v_resolved record;
  v_at_risk boolean := false;
begin
  v_anchor := public.anchor_unapplied_approved_checkin(
    p_user_id, p_challenge_id
  );
  if not coalesce((v_anchor ->> 'success')::boolean, false) then
    raise exception 'STREAK_CUTOVER_ANCHOR_FAILED';
  end if;
  v_timezone := public.get_effective_streak_timezone(
    p_user_id, p_challenge_id, null
  );
  v_today := (pg_catalog.now() at time zone v_timezone)::date;
  select pg_catalog.min(extension.obligation_local_day) - 1
  into v_extension_through_day
  from public.power_up_usage extension
  where extension.user_id = p_user_id
    and extension.challenge_id = p_challenge_id
    and extension.proof_due_at > pg_catalog.now()
    and not exists (
      select 1 from public.streak_day_outcomes outcome
      where outcome.user_id = extension.user_id
        and outcome.challenge_id = extension.challenge_id
        and outcome.local_day = extension.obligation_local_day
    );
  select * into v_resolved
  from public.resolve_streak_day_outcomes(
    p_user_id, p_challenge_id,
    coalesce(v_extension_through_day, v_today - 1), v_timezone
  );
  update public.challenge_participants participant
  set at_risk = coalesce(participant.current_streak, 0) > 0
    and not exists (
      select 1 from public.power_up_usage extension
      where extension.user_id = participant.user_id
        and extension.challenge_id = participant.challenge_id
        and extension.proof_due_at > pg_catalog.now()
    ),
    updated_at = pg_catalog.now()
  where participant.user_id = p_user_id
    and participant.challenge_id = p_challenge_id
    and coalesce(participant.status, 'active') = 'active'
  returning participant.at_risk into v_at_risk;
  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false, 'error', 'MAINTENANCE_CANDIDATE_NOT_FOUND'
    );
  end if;
  return pg_catalog.jsonb_build_object(
    'success', true,
    'resolvedCount', coalesce(v_resolved.resolved_count, 0),
    'missedCount', coalesce(v_resolved.missed_count, 0),
    'protectedCount', coalesce(v_resolved.protected_count, 0),
    'atRisk', v_at_risk,
    'anchored', coalesce((v_anchor ->> 'anchored')::boolean, false)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_today_obligations(p_timezone text)
 RETURNS TABLE(challenge_id uuid, challenge_title text, verification_type text, start_date timestamp with time zone, duration integer, group_id uuid, group_name text, is_solo boolean, current_streak integer, local_day date, proof_status text, submission_id uuid, correction_reason text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    obligation.challenge_id,
    obligation.challenge_title,
    obligation.verification_type,
    obligation.start_date,
    obligation.duration,
    obligation.group_id,
    obligation.group_name,
    obligation.is_solo,
    obligation.current_streak,
    coalesce(extension.obligation_local_day, obligation.local_day),
    case
      when extension.obligation_local_day is null
        then obligation.proof_status
      else coalesce(extension_proof.status, 'none')
    end,
    case
      when extension.obligation_local_day is null
        then obligation.submission_id
      else extension_proof.id
    end,
    case
      when extension.obligation_local_day is null
        then obligation.correction_reason
      else extension_proof.review_notes
    end
  from public.get_today_accountability_v2(p_timezone) obligation
  left join lateral (
    select
      usage.obligation_local_day,
      usage.proof_due_at
    from public.power_up_usage usage
    where usage.user_id = (select auth.uid())
      and usage.challenge_id = obligation.challenge_id
      and usage.proof_due_at > pg_catalog.now()
      and usage.obligation_local_day is not null
      and not exists (
        select 1
        from public.streak_day_outcomes outcome
        where outcome.user_id = usage.user_id
          and outcome.challenge_id = usage.challenge_id
          and outcome.local_day = usage.obligation_local_day
      )
    order by usage.obligation_local_day, usage.proof_due_at desc
    limit 1
  ) extension on true
  left join lateral (
    select
      submission.id,
      submission.status,
      submission.review_notes
    from public.challenge_submissions submission
    where submission.user_id = (select auth.uid())
      and submission.challenge_id = obligation.challenge_id
      and submission.local_day = extension.obligation_local_day
      and submission.status in ('pending', 'approved', 'rejected')
    order by submission.submission_date desc, submission.id desc
    limit 1
  ) extension_proof on extension.obligation_local_day is not null
  order by obligation.group_name nulls last, obligation.challenge_title;
$function$;

CREATE OR REPLACE FUNCTION public.get_today_home_v1(p_timezone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_obligations jsonb := '[]'::jsonb;
  v_reviews jsonb := '[]'::jsonb;
  v_group_risks jsonb := '[]'::jsonb;
  v_recent_media jsonb := '[]'::jsonb;
  v_group_id uuid;
  v_risk jsonb;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  select coalesce(pg_catalog.jsonb_agg(
    pg_catalog.to_jsonb(obligation) || case
      when extension.obligation_local_day is null then '{}'::jsonb
      else pg_catalog.jsonb_build_object(
        'local_day', extension.obligation_local_day,
        'proof_status', coalesce(proof.status, 'none'),
        'submission_id', proof.id,
        'correction_reason', proof.review_notes,
        'extension_local_day', extension.obligation_local_day,
        'extension_proof_due_at', extension.proof_due_at,
        'extension_effective_timezone', extension.effective_timezone
      ) end
  ), '[]'::jsonb) into v_obligations
  from public.get_today_accountability_v2(p_timezone) obligation
  left join lateral (
    select usage.obligation_local_day, usage.proof_due_at, usage.effective_timezone
    from public.power_up_usage usage
    where usage.user_id = v_user_id
      and usage.challenge_id = obligation.challenge_id
      and usage.proof_due_at > pg_catalog.now()
      and usage.obligation_local_day is not null
      and not exists (
        select 1 from public.streak_day_outcomes outcome
        where outcome.user_id = usage.user_id
          and outcome.challenge_id = usage.challenge_id
          and outcome.local_day = usage.obligation_local_day
      )
    order by usage.obligation_local_day, usage.proof_due_at desc
    limit 1
  ) extension on true
  left join lateral (
    select submission.id, submission.status, submission.review_notes
    from public.challenge_submissions submission
    where submission.user_id = v_user_id
      and submission.challenge_id = obligation.challenge_id
      and submission.local_day = extension.obligation_local_day
      and submission.status in ('pending', 'approved', 'rejected')
    order by submission.submission_date desc, submission.id desc
    limit 1
  ) proof on extension.obligation_local_day is not null;

  select coalesce(
    pg_catalog.jsonb_agg(pg_catalog.to_jsonb(review)), '[]'::jsonb
  ) into v_reviews
  from public.get_today_pending_reviews(p_timezone) review;

  for v_group_id in
    select distinct (item ->> 'group_id')::uuid
    from pg_catalog.jsonb_array_elements(v_obligations) item
    where nullif(item ->> 'group_id', '') is not null
  loop
    begin
      v_risk := public.get_group_risk_data(v_group_id);
      if v_risk is not null then
        v_group_risks := v_group_risks
          || pg_catalog.jsonb_build_array(v_risk);
      end if;
    exception when sqlstate '42501' then continue;
    end;
  end loop;

  -- Only approved photo/video proof enters the connection mosaic. Personal
  -- proof is restricted to the current person. Shared proof requires both the
  -- viewer and contributor to belong to the promise's group. Pending and
  -- correction states remain in their review-owned surfaces.
  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', recent.submission_id,
        'challenge_id', recent.challenge_id,
        'challenge_title', recent.challenge_title,
        'group_id', recent.group_id,
        'media_type', recent.media_type,
        'media_url', recent.media_url,
        'submitted_at', recent.submitted_at,
        'contributor_name', recent.contributor_name,
        'visibility', case
          when recent.group_id is null then 'only_you'
          else 'promise_people'
        end
      ) order by recent.submitted_at desc, recent.submission_id desc
    ),
    '[]'::jsonb
  ) into v_recent_media
  from (
    select *
    from (
      select distinct on (submission.id)
      submission.id as submission_id,
      submission.challenge_id,
      obligation ->> 'challenge_title' as challenge_title,
      nullif(obligation ->> 'group_id', '')::uuid as group_id,
      submission.media_type::text as media_type,
      submission.media_url,
      submission.submission_date as submitted_at,
      coalesce(
        nullif(pg_catalog.btrim(profile.display_name), ''),
        nullif(pg_catalog.btrim(profile.username), ''),
        'Menta member'
      ) as contributor_name
    from pg_catalog.jsonb_array_elements(v_obligations) obligation
    join public.challenge_submissions submission
      on submission.challenge_id = (obligation ->> 'challenge_id')::uuid
    left join public.profiles profile on profile.id = submission.user_id
    where submission.status = 'approved'
      and submission.media_type in ('photo', 'video')
      and nullif(pg_catalog.btrim(submission.media_url), '') is not null
      and submission.submission_date >= pg_catalog.now() - interval '30 days'
      and (
        (
          nullif(obligation ->> 'group_id', '') is null
          and submission.user_id = v_user_id
        )
        or (
          nullif(obligation ->> 'group_id', '') is not null
          and exists (
            select 1
            from public.team_members contributor_membership
            where contributor_membership.group_id =
              (obligation ->> 'group_id')::uuid
              and contributor_membership.user_id = submission.user_id
          )
        )
      )
      order by submission.id, submission.submission_date desc
    ) authorised_media
    order by authorised_media.submitted_at desc,
      authorised_media.submission_id desc
    limit 12
  ) recent
  ;

  return pg_catalog.jsonb_build_object(
    'obligations', v_obligations,
    'reviews', v_reviews,
    'group_risks', v_group_risks,
    'recent_media', v_recent_media
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.request_test_notification_v1()
 RETURNS TABLE(status text, notification_id bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_preference public.notification_preferences%rowtype;
  v_existing_notification_id bigint;
  v_idempotency_key text;
  v_enqueued boolean;
  v_processor_request_id bigint;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return query select 'AUTH_REQUIRED'::text, null::bigint;
    return;
  end if;

  select preference.*
  into v_preference
  from public.notification_preferences preference
  where preference.user_id = v_actor_id;

  if not found
    or not coalesce(v_preference.push_enabled, true)
    or v_preference.device_permission_status is distinct from 'granted'
    or v_preference.push_platform is null
    or v_preference.push_platform not in ('ios', 'android')
    or v_preference.expo_push_token is null
  then
    return query select 'NOT_READY'::text, null::bigint;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('test-notification:' || v_actor_id::text, 0)
  );

  select notification.id
  into v_existing_notification_id
  from public.notifications notification
  where notification.user_id = v_actor_id
    and notification.notification_type = 'test_notification'
    and notification.created_at > pg_catalog.clock_timestamp() - interval '60 seconds'
  order by notification.created_at desc
  limit 1;

  if v_existing_notification_id is not null then
    return query select 'RATE_LIMITED'::text, v_existing_notification_id;
    return;
  end if;

  v_idempotency_key := 'test-notification:'
    || v_actor_id::text
    || ':'
    || pg_catalog.floor(
      extract(epoch from pg_catalog.clock_timestamp()) / 60
    )::bigint::text;

  v_enqueued := private.enqueue_notification_v1(
    v_actor_id,
    'test_notification',
    'Menta test notification',
    'If you can see this, notifications are working on this phone.',
    pg_catalog.jsonb_build_object(
      'action', 'open_notification_settings',
      'type', 'test_notification'
    ),
    pg_catalog.jsonb_build_object(
      'source', 'notification_settings',
      'user_initiated', true
    ),
    1,
    v_idempotency_key,
    pg_catalog.now()
  );

  select job.notification_id
  into v_existing_notification_id
  from public.notification_jobs job
  where job.user_id = v_actor_id
    and job.idempotency_key = v_idempotency_key
  limit 1;

  if not coalesce(v_enqueued, false) or v_existing_notification_id is null then
    return query select 'FAILED'::text, v_existing_notification_id;
    return;
  end if;

  -- pg_net sends after this transaction commits, so the queue row is visible
  -- before the processor claims it. Failure to wake the worker does not lose
  -- the job; the ordinary hourly processor remains the fallback.
  begin
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'project_url'
      ) || '/functions/v1/notification-processor?batch=10',
      headers := pg_catalog.jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'anon_key'
        ),
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'anon_key'
        ),
        'x-maintenance-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'daily_maintenance_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    ) into v_processor_request_id;
  exception when others then
    v_processor_request_id := null;
  end;

  return query select 'QUEUED'::text, v_existing_notification_id;
end;
$function$;

CREATE OR REPLACE FUNCTION private.economy_quota_error_v1(p_user_id uuid, p_action text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_is_pro boolean := coalesce(
    private.economy_user_is_pro_v1(p_user_id),
    false
  );
  v_month_start timestamptz := pg_catalog.date_trunc('month', now());
  v_created integer;
begin
  if v_is_pro then
    return null;
  end if;

  if p_action in ('create_challenge', 'join_challenge') then
    if private.economy_active_promise_count_v1(p_user_id) >= 3 then
      return 'QUOTA_ACTIVE_PROMISES';
    end if;

    if p_action = 'create_challenge' then
      select count(*)::integer
      into v_created
      from private.economy_creation_events_v1 creation
      where creation.user_id = p_user_id
        and creation.action = 'create_challenge'
        and creation.created_at >= v_month_start;

      if coalesce(v_created, 0) >= 4 then
        return 'QUOTA_CHALLENGES_MONTH';
      end if;
    end if;
  end if;

  if p_action in ('create_group', 'join_group')
     and private.economy_active_group_count_v1(p_user_id) >= 2 then
    return 'QUOTA_ACTIVE_GROUPS';
  end if;

  if p_action = 'create_group' then
    select count(*)::integer
    into v_created
    from private.economy_creation_events_v1 creation
    where creation.user_id = p_user_id
      and creation.action = 'create_group'
      and creation.created_at >= v_month_start;

    if coalesce(v_created, 0) >= 2 then
      return 'QUOTA_GROUPS_MONTH';
    end if;
  end if;

  return null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.join_promise_accountability_v2(p_challenge_id uuid, p_invite_code text, p_quote_id uuid, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_role text;
  v_inviter_id uuid;
  v_inviter_name text;
  v_target record;
  v_existing private.challenge_join_receipts%rowtype;
  v_receipt_id uuid;
  v_request_hash text;
  v_expected_quote_id uuid;
  v_balance integer;
  v_cost integer;
  v_joined_at timestamptz := now();
  v_first_due_at timestamptz;
  v_first_proof_title text;
  v_response jsonb;
begin
  if v_actor_id is not null and public.current_session_is_active() and p_client_event_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('participation-join:' || v_actor_id::text, 0));
    select receipt.* into v_existing from private.challenge_join_receipts receipt
    where receipt.actor_id = v_actor_id and receipt.client_event_id = p_client_event_id;
    if found then
      if v_existing.challenge_id <> p_challenge_id or v_existing.quote_id <> p_quote_id then
        return private.challenge_join_failure_v1('CHALLENGE_JOIN', 'IDEMPOTENCY_MISMATCH', 'This request belongs to another invitation.');
      end if;
      if v_existing.response ->> 'success' = 'true' then
        return pg_catalog.jsonb_set(v_existing.response, '{receipt,idempotent}', 'true'::jsonb, true);
      end if;
    end if;
  end if;
  select
    scoped.role,
    scoped.created_by,
    coalesce(profile.display_name, profile.username, 'A Menta member')
  into v_role, v_inviter_id, v_inviter_name
  from private.promise_accountability_invite_roles scoped
  join public.invite_codes invite on invite.code = scoped.invite_code
  join public.profiles profile on profile.id = scoped.created_by
  where scoped.invite_code = v_code
    and scoped.challenge_id = p_challenge_id
    and (invite.expires_at is null or invite.expires_at > now())
  limit 1;

  if v_role is null then
    return public.join_challenge_with_funding_v1(
      p_challenge_id,
      p_invite_code,
      p_quote_id,
      p_client_event_id
    );
  end if;

  if v_actor_id is null then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'AUTH_REQUIRED',
      'Sign in before accepting this promise invitation.'
    );
  end if;

  if not public.current_session_is_active() then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'AUTH_SESSION_REVOKED',
      'Your session is no longer active. Sign in again.'
    );
  end if;

  if private.users_have_block_relationship_v1(v_actor_id, v_inviter_id) then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'CHALLENGE_NOT_FOUND',
      'This promise invitation is not available.'
    );
  end if;

  if p_quote_id is null or p_client_event_id is null then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'INVALID_REQUEST',
      'A current invitation and request ID are required.'
    );
  end if;

  select *
  into v_target
  from private.resolve_promise_accountability_join_target_v2(
    v_actor_id,
    p_challenge_id,
    p_invite_code
  );

  if v_target.resolution_code <> 'READY' then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      v_target.resolution_code,
      'This promise invitation is not available.'
    );
  end if;


  -- Serialise the free allowance across every group and promise join.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('participation-join:' || v_actor_id::text, 0));

  v_request_hash := pg_catalog.md5(
    v_target.resolved_challenge_id::text || ':' ||
      p_quote_id::text || ':' || v_role
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'challenge-join-event:' || v_actor_id::text || ':' ||
        p_client_event_id::text,
      0
    )
  );

  select receipt.*
  into v_existing
  from private.challenge_join_receipts receipt
  where receipt.actor_id = v_actor_id
    and receipt.client_event_id = p_client_event_id
  for update;

  if found then
    if v_existing.request_hash <> v_request_hash
       or v_existing.challenge_id <> v_target.resolved_challenge_id
       or v_existing.quote_id <> p_quote_id then
      return private.challenge_join_failure_v1(
        'CHALLENGE_JOIN',
        'IDEMPOTENCY_MISMATCH',
        'This request ID belongs to another invitation.'
      );
    end if;

    if v_existing.response is null then
      return private.challenge_join_failure_v1(
        'CHALLENGE_JOIN',
        'JOIN_IN_PROGRESS',
        'This invitation is still being confirmed.'
      );
    end if;

    if coalesce(v_existing.response ->> 'success', 'false') = 'true' then
      return pg_catalog.jsonb_set(
        v_existing.response,
        '{receipt,idempotent}',
        'true'::jsonb,
        true
      );
    end if;

    return v_existing.response;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-accountability-member:' || v_actor_id::text || ':' ||
        v_target.resolved_challenge_id::text,
      0
    )
  );

  if exists (
    select 1
    from private.promise_accountability_members member
    where member.challenge_id = v_target.resolved_challenge_id
      and member.user_id = v_actor_id
  ) then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'ALREADY_JOINED',
      'You already have a role in this promise.'
    );
  end if;

  if v_role = 'partner' and v_target.is_member then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'ALREADY_JOINED',
      'You already complete this promise.'
    );
  end if;

  v_cost := case when v_role = 'partner' then private.participation_join_cost_v1(v_actor_id) else 0 end;
  v_expected_quote_id := private.challenge_join_quote_id_v1(
    v_target.resolved_challenge_id,
    v_cost
  );

  if p_quote_id <> v_expected_quote_id then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN',
      'QUOTE_STALE',
      'The invitation changed. Review it again before accepting.'
    );
  end if;


  if v_role = 'partner' and private.economy_quota_error_v1(v_actor_id, 'join_challenge') is not null then
    return private.challenge_join_failure_v1('CHALLENGE_JOIN', 'QUOTA_ACTIVE_PROMISES',
      'Your free plan includes 3 active promises. Finish a promise before joining another.');
  end if;
  select coalesce(profile.momenta_balance, 0) into v_balance
  from public.profiles profile where profile.id = v_actor_id for update;
  if v_balance is null or v_balance < v_cost then
    return private.challenge_join_failure_v1('CHALLENGE_JOIN',
      case when v_balance is null then 'PROFILE_NOT_FOUND' else 'INSUFFICIENT_BALANCE' end,
      'Your confirmed balance is not enough for this join.');
  end if;
  if v_cost > 0 then
    perform public.add_momenta_transaction(v_actor_id, -v_cost, 'challenge_join', 'spent', v_target.resolved_challenge_id);
  end if;

  insert into private.challenge_join_receipts (
    actor_id,
    client_event_id,
    challenge_id,
    quote_id,
    request_hash
  ) values (
    v_actor_id,
    p_client_event_id,
    v_target.resolved_challenge_id,
    p_quote_id,
    v_request_hash
  ) returning id into v_receipt_id;

  if v_role in ('partner', 'reviewer') then
    update public.challenges challenge
    set
      allow_self_review = false,
      submission_expectations =
        coalesce(challenge.submission_expectations, '{}'::jsonb)
        || pg_catalog.jsonb_build_object(
          'requires_peer_review', true,
          'reviewers_required', 1
        ),
      updated_at = now()
    where challenge.id = v_target.resolved_challenge_id;
  end if;

  insert into public.team_members (group_id, user_id, role)
  values (v_target.group_id, v_actor_id, 'member')
  on conflict (group_id, user_id) do nothing;

  if v_role = 'partner' then
    insert into public.challenge_participants (
      challenge_id,
      user_id,
      joined_at
    ) values (
      v_target.resolved_challenge_id,
      v_actor_id,
      v_joined_at
    )
    on conflict (challenge_id, user_id) do update
    set
      status = 'active',
      joined_at = excluded.joined_at,
      updated_at = now();
  end if;

  insert into private.promise_accountability_members (
    challenge_id,
    user_id,
    role,
    invited_by,
    joined_at
  ) values (
    v_target.resolved_challenge_id,
    v_actor_id,
    v_role,
    v_inviter_id,
    v_joined_at
  );

  update public.invite_codes invite
  set expires_at = now()
  where invite.code = v_code;

  select greatest(0, coalesce(profile.momenta_balance, 0))
  into v_balance
  from public.profiles profile
  where profile.id = v_actor_id;

  if not found then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_role = 'partner' then
    perform private.record_participation_join_v1(v_actor_id);
  end if;

  v_first_due_at := case
    when v_role = 'partner' then private.challenge_join_first_due_at_v1(
      v_target.start_date,
      v_target.end_date,
      v_target.submission_expectations
    )
    else null
  end;
  v_first_proof_title := case v_role
    when 'partner' then coalesce(
      nullif(pg_catalog.btrim(v_target.verification_description), ''),
      nullif(pg_catalog.btrim(v_target.submission_text), ''),
      'Submit your first proof'
    )
    when 'reviewer' then 'Review proof for ' || v_target.challenge_title
    else 'Support progress on ' || v_target.challenge_title
  end;

  v_response := pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'CHALLENGE_JOIN',
    'code', 'JOIN_CONFIRMED',
    'receipt', pg_catalog.jsonb_build_object(
      'receipt_id', v_receipt_id,
      'client_event_id', p_client_event_id,
      'quote_id', p_quote_id,
      'challenge_id', v_target.resolved_challenge_id,
      'challenge_title', v_target.challenge_title,
      'group_id', v_target.group_id,
      'group_name', v_target.group_name,
      'inviter_name', v_inviter_name,
      'joined_at', v_joined_at,
      'debit_amount', v_cost,
      'new_balance', v_balance,
      'first_proof_title', v_first_proof_title,
      'first_due_at', v_first_due_at,
      'idempotent', false,
      'accountability_role', v_role
    )
  );

  update private.challenge_join_receipts
  set response = v_response, completed_at = now()
  where id = v_receipt_id;

  return v_response;
end;
$function$;

CREATE OR REPLACE FUNCTION private.saved_group_creation_problem_v1(p_operation text, p_status text, p_code text, p_message text, p_retryable boolean DEFAULT false, p_details jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select pg_catalog.jsonb_build_object(
    'success', false,
    'operation', p_operation,
    'status', p_status,
    'code', p_code,
    'message', p_message,
    'retryable', coalesce(p_retryable, false),
    'details', coalesce(p_details, '{}'::jsonb)
  );
$function$;

CREATE OR REPLACE FUNCTION private.saved_group_creation_replay_v1(p_response jsonb, p_operation text, p_code text, p_client_event_id uuid, p_canonical_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select
    (p_response - 'operation' - 'code' - 'receipt')
    || pg_catalog.jsonb_build_object(
      'operation', p_operation,
      'code', p_code,
      'receipt',
        coalesce(p_response -> 'receipt', '{}'::jsonb)
        || pg_catalog.jsonb_build_object(
          'client_event_id', p_client_event_id,
          'canonical_client_event_id', p_canonical_client_event_id,
          'idempotent', true
        )
    );
$function$;

CREATE OR REPLACE FUNCTION public.ensure_promise_accountability_v1(p_challenge_id uuid, p_role text DEFAULT 'partner'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_role text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_role, '')));
  v_challenge public.challenges%rowtype;
  v_group public.teams%rowtype;
  v_group_id uuid;
  v_start_date date;
  v_end_date date;
  v_duration integer;
begin
  if v_actor_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'AUTH_SESSION_REVOKED'
    );
  end if;

  if p_challenge_id is null
     or v_role not in ('partner', 'reviewer', 'supporter') then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_REQUEST'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-accountability:' || p_challenge_id::text,
      0
    )
  );

  select challenge.*
  into v_challenge
  from public.challenges challenge
  where challenge.id = p_challenge_id
  for update;

  if not found or v_challenge.creator_id <> v_actor_id then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PROMISE_NOT_FOUND'
    );
  end if;

  if v_challenge.status <> 'active'
     or coalesce(v_challenge.completion_status, 'active') <> 'active'
     or coalesce(v_challenge.is_expired, false)
     or (v_challenge.end_date is not null and v_challenge.end_date <= now()) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PROMISE_INACTIVE'
    );
  end if;

  select link.group_id
  into v_group_id
  from public.team_challenges link
  where link.challenge_id = p_challenge_id
  order by link.created_at asc, link.group_id asc
  limit 1;

  -- The promise-role flow has a private-until-accepted contract. Public
  -- promises keep using their existing discoverable group/share surface so
  -- this RPC never quietly changes or misrepresents their visibility.
  if coalesce(v_challenge.is_public, false) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PUBLIC_PROMISE_USES_GROUP_INVITE'
    );
  end if;

  if v_group_id is null then
    v_duration := least(365, greatest(7, coalesce(v_challenge.duration, 30)));
    v_start_date := (
      coalesce(v_challenge.start_date, now())
        at time zone coalesce(nullif(v_challenge.streak_timezone, ''), 'UTC')
    )::date;
    v_end_date := case
      when v_challenge.end_date is not null then (
        v_challenge.end_date
          at time zone coalesce(nullif(v_challenge.streak_timezone, ''), 'UTC')
      )::date
      else v_start_date + (v_duration - 1)
    end;

    insert into public.teams (
      owner_id,
      name,
      description,
      privacy,
      kind,
      status,
      duration_days,
      start_date,
      end_date,
      notify_on_member_miss
    ) values (
      v_actor_id,
      pg_catalog.left(v_challenge.title, 100),
      null,
      'private',
      'promise',
      'active',
      v_duration,
      v_start_date,
      v_end_date,
      true
    ) returning * into v_group;

    v_group_id := v_group.id;

    insert into public.team_members (group_id, user_id, role)
    values (v_group_id, v_actor_id, 'owner')
    on conflict (group_id, user_id) do update set role = 'owner';

    insert into public.team_challenges (group_id, challenge_id)
    values (v_group_id, p_challenge_id);
  else
    select team.*
    into v_group
    from public.teams team
    where team.id = v_group_id
      and team.status = 'active'
    for update;

    if not found then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'error', 'ACCOUNTABILITY_UNAVAILABLE'
      );
    end if;

    if v_group.kind = 'saved' then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'error', 'USE_SAVED_GROUP_INVITE',
        'group_id', v_group.id,
        'group_name', v_group.name
      );
    end if;
  end if;

  update public.challenges
  set
    updated_at = now()
  where id = p_challenge_id;

  insert into private.promise_accountability_members (
    challenge_id,
    user_id,
    role,
    invited_by
  ) values (
    p_challenge_id,
    v_actor_id,
    'owner',
    v_actor_id
  )
  on conflict (challenge_id, user_id) do update
  set
    role = 'owner',
    updated_at = now();

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', 'PROMISE_ACCOUNTABILITY_READY_V1',
    'promise', pg_catalog.jsonb_build_object(
      'id', v_challenge.id,
      'title', v_challenge.title
    ),
    'group', pg_catalog.jsonb_build_object(
      'id', v_group.id,
      'kind', v_group.kind,
      'privacy', v_group.privacy
    ),
    'invite_role', v_role
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.resolve_promise_accountability_join_target_v2(p_actor_id uuid, p_challenge_id uuid, p_invite_code text)
 RETURNS TABLE(resolution_code text, resolved_challenge_id uuid, challenge_title text, challenge_description text, group_id uuid, group_name text, is_member boolean, verification_description text, submission_text text, start_date timestamp with time zone, end_date timestamp with time zone, submission_expectations jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_invite public.invite_codes%rowtype;
  v_challenge public.challenges%rowtype;
  v_resolved_group_id uuid;
  v_group_status text;
  v_invite_authorised boolean := false;
  v_can_view boolean := false;
  v_accountability_invite boolean := false;
begin
  if p_actor_id is null or (p_challenge_id is null and v_code = '') then
    resolution_code := 'INVALID_REQUEST';
    return next;
    return;
  end if;

  if v_code <> '' then
    if v_code !~ '^[A-Z0-9]{4,32}$' then
      resolution_code := 'INVALID_INVITE';
      return next;
      return;
    end if;

    select invite.*
    into v_invite
    from public.invite_codes invite
    where invite.code = v_code
      and invite.type = 'challenge'
    limit 1;

    if not found then
      resolution_code := 'INVALID_INVITE';
      return next;
      return;
    end if;

    if v_invite.expires_at is not null and v_invite.expires_at <= now() then
      resolution_code := 'INVITE_EXPIRED';
      return next;
      return;
    end if;

    if p_challenge_id is not null and p_challenge_id <> v_invite.ref_id then
      resolution_code := 'INVALID_REQUEST';
      return next;
      return;
    end if;

    resolved_challenge_id := v_invite.ref_id;
    v_invite_authorised := true;
    select exists (
      select 1
      from private.promise_accountability_invite_roles scoped
      where scoped.invite_code = v_code
        and scoped.challenge_id = v_invite.ref_id
    ) into v_accountability_invite;
  else
    resolved_challenge_id := p_challenge_id;
  end if;

  select challenge.*
  into v_challenge
  from public.challenges challenge
  where challenge.id = resolved_challenge_id
  limit 1;

  if not found then
    resolution_code := 'CHALLENGE_NOT_FOUND';
    return next;
    return;
  end if;

  select team.id, team.name, team.status
  into v_resolved_group_id, group_name, v_group_status
  from public.team_challenges linked
  join public.teams team on team.id = linked.group_id
  where linked.challenge_id = v_challenge.id
    and (not v_accountability_invite or team.kind = 'promise')
  order by linked.created_at asc, linked.group_id asc
  limit 1;

  group_id := v_resolved_group_id;

  if v_accountability_invite and v_resolved_group_id is null then
    resolution_code := 'INVALID_INVITE';
    return next;
    return;
  end if;

  select exists (
    select 1
    from public.challenge_participants participant
    where participant.challenge_id = v_challenge.id
      and participant.user_id = p_actor_id
      and participant.status = 'active'
  ) into is_member;

  v_can_view :=
    v_invite_authorised
    or v_challenge.is_public
    or v_challenge.creator_id = p_actor_id
    or is_member
    or (
      v_resolved_group_id is not null
      and exists (
        select 1
        from public.team_members member
        where member.group_id = v_resolved_group_id
          and member.user_id = p_actor_id
      )
    );

  if not v_can_view then
    resolution_code := 'CHALLENGE_NOT_FOUND';
    resolved_challenge_id := null;
    group_id := null;
    group_name := null;
    return next;
    return;
  end if;

  if v_challenge.status <> 'active'
     or v_challenge.completion_status <> 'active'
     or (v_challenge.end_date is not null and v_challenge.end_date <= now()) then
    resolution_code := 'CHALLENGE_INACTIVE';
    return next;
    return;
  end if;

  if v_resolved_group_id is not null and v_group_status <> 'active' then
    resolution_code := 'GROUP_INACTIVE';
    return next;
    return;
  end if;

  if v_challenge.allow_self_review
     and v_challenge.creator_id <> p_actor_id
     and not v_accountability_invite then
    resolution_code := 'SOLO_CHALLENGE';
    return next;
    return;
  end if;

  resolution_code := 'READY';
  challenge_title := v_challenge.title;
  challenge_description := v_challenge.description;
  verification_description := v_challenge.verification_description;
  submission_text := v_challenge.submission_text;
  start_date := v_challenge.start_date;
  end_date := v_challenge.end_date;
  submission_expectations := v_challenge.submission_expectations;
  return next;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_promise_accountability_invite_role_v1(p_challenge_id uuid, p_invite_code text, p_role text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_role text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_role, '')));
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  if p_challenge_id is null
     or v_code !~ '^[A-Z0-9]{4,32}$'
     or v_role not in ('partner', 'reviewer', 'supporter') then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_REQUEST'
    );
  end if;

  if not exists (
    select 1
    from public.challenges challenge
    join public.team_challenges link
      on link.challenge_id = challenge.id
    join public.teams team
      on team.id = link.group_id
    where challenge.id = p_challenge_id
      and challenge.creator_id = v_actor_id
      and team.kind = 'promise'
      and team.status = 'active'
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PROMISE_NOT_SHAREABLE'
    );
  end if;

  if not exists (
    select 1
    from public.invite_codes invite
    where invite.code = v_code
      and invite.type = 'challenge'
      and invite.ref_id = p_challenge_id
      and (invite.expires_at is null or invite.expires_at > now())
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVITE_UNAVAILABLE'
    );
  end if;

  -- One promise has one live pending invitation. Accepted people and their
  -- roles remain in promise_accountability_members; only older unaccepted
  -- capabilities stop working when the owner prepares a different role.
  update public.invite_codes invite
  set expires_at = now()
  from private.promise_accountability_invite_roles scoped
  where scoped.invite_code = invite.code
    and scoped.challenge_id = p_challenge_id
    and invite.code <> v_code
    and (invite.expires_at is null or invite.expires_at > now());

  insert into private.promise_accountability_invite_roles (
    invite_code,
    challenge_id,
    role,
    created_by
  ) values (
    v_code,
    p_challenge_id,
    v_role,
    v_actor_id
  )
  on conflict (invite_code) do update
  set
    challenge_id = excluded.challenge_id,
    role = excluded.role,
    created_by = excluded.created_by,
    updated_at = now();

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', 'PROMISE_ACCOUNTABILITY_INVITE_READY_V1',
    'challenge_id', p_challenge_id,
    'invite_code', v_code,
    'role', v_role
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.begin_promise_accountability_invite_v1(p_challenge_id uuid, p_role text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_role text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_role, '')));
  v_current_code text;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  if p_challenge_id is null
     or v_role not in ('partner', 'reviewer', 'supporter') then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_REQUEST'
    );
  end if;

  if not exists (
    select 1
    from public.challenges challenge
    join public.team_challenges link
      on link.challenge_id = challenge.id
    join public.teams team
      on team.id = link.group_id
    where challenge.id = p_challenge_id
      and challenge.creator_id = v_actor_id
      and team.kind = 'promise'
      and team.status = 'active'
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PROMISE_NOT_FOUND'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-accountability-invite:' || p_challenge_id::text,
      0
    )
  );

  select scoped.invite_code
  into v_current_code
  from private.promise_accountability_invite_roles scoped
  join public.invite_codes invite on invite.code = scoped.invite_code
  where scoped.challenge_id = p_challenge_id
    and scoped.role = v_role
    and (invite.expires_at is null or invite.expires_at > now())
  order by scoped.updated_at desc
  limit 1;

  if v_current_code is not null then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'result_code', 'PROMISE_ACCOUNTABILITY_INVITE_REUSED_V1',
      'invite_code', v_current_code,
      'role', v_role
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', 'PROMISE_ACCOUNTABILITY_INVITE_NEW_V1',
    'invite_code', null,
    'role', v_role
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_promise_accountability_v1(p_challenge_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_challenge public.challenges%rowtype;
  v_group_id uuid;
  v_group_name text;
  v_group_kind text;
  v_members jsonb;
  v_invite jsonb;
  v_accepted_count integer := 0;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  select challenge.*
  into v_challenge
  from public.challenges challenge
  where challenge.id = p_challenge_id;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PROMISE_NOT_FOUND'
    );
  end if;

  select team.id, team.name, team.kind
  into v_group_id, v_group_name, v_group_kind
  from public.team_challenges link
  join public.teams team on team.id = link.group_id
  where link.challenge_id = p_challenge_id
  order by link.created_at asc, link.group_id asc
  limit 1;

  if v_challenge.creator_id <> v_actor_id
     and not exists (
       select 1
       from public.challenge_participants participant
       where participant.challenge_id = p_challenge_id
         and participant.user_id = v_actor_id
     )
     and not exists (
       select 1
       from public.team_members member
       where member.group_id = v_group_id
         and member.user_id = v_actor_id
     ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PROMISE_NOT_FOUND'
    );
  end if;

  with candidate_users as (
    select v_challenge.creator_id as user_id
    union
    select member.user_id
    from private.promise_accountability_members member
    where member.challenge_id = p_challenge_id
    union
    select participant.user_id
    from public.challenge_participants participant
    where participant.challenge_id = p_challenge_id
      and participant.status = 'active'
    union
    select team_member.user_id
    from public.team_members team_member
    where team_member.group_id = v_group_id
  ), member_facts as (
    select
      profile.id,
      coalesce(profile.display_name, profile.username, 'Menta member') as name,
      profile.avatar_url,
      case
        when profile.id = v_challenge.creator_id then 'owner'
        when scoped.role is not null then scoped.role
        when participant.user_id is not null then 'partner'
        else 'reviewer'
      end as role,
      participant.user_id is not null as participates,
      coalesce(latest_proof.status, 'none') as proof_status
    from candidate_users candidate
    join public.profiles profile on profile.id = candidate.user_id
    left join private.promise_accountability_members scoped
      on scoped.challenge_id = p_challenge_id
     and scoped.user_id = profile.id
    left join public.challenge_participants participant
      on participant.challenge_id = p_challenge_id
     and participant.user_id = profile.id
     and participant.status = 'active'
    left join lateral (
      select submission.status
      from public.challenge_submissions submission
      where submission.challenge_id = p_challenge_id
        and submission.user_id = profile.id
        and submission.local_day = (
          now() at time zone coalesce(
            nullif(v_challenge.streak_timezone, ''),
            'UTC'
          )
        )::date
      order by submission.submission_date desc
      limit 1
    ) latest_proof on true
  )
  select
    coalesce(
      pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', fact.id,
          'name', fact.name,
          'avatar_url', fact.avatar_url,
          'role', fact.role,
          'participates', fact.participates,
          'proof_status', fact.proof_status
        ) order by
          case fact.role
            when 'owner' then 0
            when 'partner' then 1
            when 'reviewer' then 2
            else 3
          end,
          fact.name
      ),
      '[]'::jsonb
    ),
    pg_catalog.count(*) filter (where fact.role <> 'owner')::integer
  into v_members, v_accepted_count
  from member_facts fact;

  select pg_catalog.jsonb_build_object(
    'code', invite.code,
    'role', scoped.role,
    'expires_at', invite.expires_at
  )
  into v_invite
  from private.promise_accountability_invite_roles scoped
  join public.invite_codes invite on invite.code = scoped.invite_code
  where scoped.challenge_id = p_challenge_id
    and (invite.expires_at is null or invite.expires_at > now())
  order by scoped.updated_at desc
  limit 1;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', 'PROMISE_ACCOUNTABILITY_V1',
    'promise', pg_catalog.jsonb_build_object(
      'id', v_challenge.id,
      'title', v_challenge.title,
      'description', v_challenge.description,
      'verification_description', v_challenge.verification_description,
      'duration', v_challenge.duration,
      'allow_self_review', v_challenge.allow_self_review
    ),
    'group', case
      when v_group_id is null then null
      else pg_catalog.jsonb_build_object(
        'id', v_group_id,
        'name', v_group_name,
        'kind', v_group_kind
      )
    end,
    'members', v_members,
    'accepted_count', v_accepted_count,
    'is_shared', v_accepted_count > 0,
    'can_invite', v_challenge.creator_id = v_actor_id,
    'invite', v_invite
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_promise_accountability_invite_preview_v1(p_invite_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_preview record;
begin
  if v_code !~ '^[A-Z0-9]{4,32}$' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'INVITE_UNAVAILABLE'
    );
  end if;

  select
    challenge.title,
    challenge.description,
    challenge.verification_description,
    challenge.duration,
    scoped.role,
    coalesce(profile.display_name, profile.username, 'A Menta member')
      as inviter_name
  into v_preview
  from public.invite_codes invite
  join private.promise_accountability_invite_roles scoped
    on scoped.invite_code = invite.code
  join public.challenges challenge on challenge.id = invite.ref_id
  join public.team_challenges link on link.challenge_id = challenge.id
  join public.teams team
    on team.id = link.group_id
   and team.kind = 'promise'
   and team.status = 'active'
  join public.profiles profile on profile.id = scoped.created_by
  where invite.code = v_code
    and invite.type = 'challenge'
    and scoped.challenge_id = challenge.id
    and (invite.expires_at is null or invite.expires_at > now())
    and challenge.status = 'active'
    and challenge.completion_status = 'active'
    and not coalesce(challenge.is_expired, false)
    and (challenge.end_date is null or challenge.end_date > now())
  limit 1;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'INVITE_UNAVAILABLE'
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'code', 'INVITE_PREVIEW_READY',
    'preview', pg_catalog.jsonb_build_object(
      'promise_title', v_preview.title,
      'promise_description', v_preview.description,
      'proof_rule', v_preview.verification_description,
      'duration_days', v_preview.duration,
      'role', v_preview.role,
      'inviter_name', v_preview.inviter_name
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_accountability_group_v3(p_client_event_id uuid, p_name text, p_description text DEFAULT NULL::text, p_duration_days integer DEFAULT 30, p_privacy text DEFAULT 'private'::text, p_image_preset text DEFAULT NULL::text, p_notify_on_member_miss boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_name text := pg_catalog.regexp_replace(
    pg_catalog.btrim(coalesce(p_name, '')),
    '[[:space:]]+',
    ' ',
    'g'
  );
  v_description text := nullif(pg_catalog.btrim(coalesce(p_description, '')), '');
  v_duration integer := least(365, greatest(coalesce(p_duration_days, 30), 1));
  v_privacy text := pg_catalog.lower(
    pg_catalog.btrim(coalesce(nullif(p_privacy, ''), 'private'))
  );
  v_image_preset text := nullif(
    pg_catalog.lower(pg_catalog.btrim(coalesce(p_image_preset, ''))),
    ''
  );
  v_notify boolean := coalesce(p_notify_on_member_miss, true);
  v_request_hash text;
  v_existing private.saved_group_creation_receipts%rowtype;
  v_canonical private.saved_group_creation_receipts%rowtype;
  v_receipt_id uuid;
  v_group_id uuid;
  v_group public.teams%rowtype;
  v_group_result jsonb;
  v_response jsonb;
  v_error_code text;
  v_cost integer;
  v_new_balance integer;
  v_cooldown record;
begin
  if v_actor_id is null then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'failed',
      'AUTH_REQUIRED',
      'Sign in before creating this group.'
    );
  end if;

  if not public.current_session_is_active() then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'failed',
      'AUTH_SESSION_REVOKED',
      'Your session is no longer active. Sign in again before creating this group.'
    );
  end if;

  if p_client_event_id is null then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'failed',
      'INVALID_REQUEST',
      'A request ID is required before creating this group.'
    );
  end if;

  if pg_catalog.length(v_name) < 3 or pg_catalog.length(v_name) > 80 then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'failed',
      'INVALID_GROUP_NAME',
      'Use a group name between 3 and 80 characters.'
    );
  end if;

  if v_description is not null and pg_catalog.length(v_description) > 500 then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'failed',
      'INVALID_DESCRIPTION',
      'Keep the group description under 500 characters.'
    );
  end if;

  if v_privacy <> all (array['public', 'private', 'secret']::text[]) then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'failed',
      'INVALID_PRIVACY',
      'Choose a valid group privacy setting.'
    );
  end if;

  if v_image_preset is not null
     and v_image_preset <> all (
       array['move', 'focus', 'reset', 'create']::text[]
     ) then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'failed',
      'INVALID_IMAGE_PRESET',
      'Choose one of the available group images.'
    );
  end if;

  v_request_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'name', v_name,
      'description', v_description,
      'duration_days', v_duration,
      'privacy', v_privacy,
      'image_preset', v_image_preset,
      'notify_on_member_miss', v_notify,
      'kind', 'saved'
    )::text
  );

  -- A repeated event never waits behind itself and encourages no blind retry.
  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'saved-group-create-event:' || v_actor_id::text || ':' ||
        p_client_event_id::text,
      0
    )
  ) then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'unknown_result',
      'REQUEST_IN_PROGRESS',
      'This group is still being confirmed. Check its status before trying again.',
      true
    );
  end if;

  select receipt.*
  into v_existing
  from private.saved_group_creation_receipts receipt
  where receipt.actor_id = v_actor_id
    and receipt.client_event_id = p_client_event_id
  for update;

  if found then
    if v_existing.request_hash <> v_request_hash then
      return private.saved_group_creation_problem_v1(
        'SAVED_GROUP_CREATE',
        'failed',
        'IDEMPOTENCY_MISMATCH',
        'This request ID already belongs to different group details.'
      );
    end if;

    if v_existing.state = 'confirmed' and v_existing.response is not null then
      return private.saved_group_creation_replay_v1(
        v_existing.response,
        'SAVED_GROUP_CREATE',
        'GROUP_CREATION_REPLAYED',
        p_client_event_id,
        v_existing.canonical_client_event_id
      );
    end if;

    if v_existing.state = 'failed' and v_existing.response is not null then
      return v_existing.response;
    end if;
  end if;

  -- Two event IDs with the same normalised request represent the same logical
  -- creation while an active saved group exists.
  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'saved-group-create-request:' || v_actor_id::text || ':' ||
        v_request_hash,
      0
    )
  ) then
    insert into private.saved_group_creation_receipts (
      actor_id,
      client_event_id,
      canonical_client_event_id,
      request_hash,
      state
    ) values (
      v_actor_id,
      p_client_event_id,
      p_client_event_id,
      v_request_hash,
      'unknown'
    )
    on conflict (actor_id, client_event_id) do update
    set state = 'unknown';

    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'unknown_result',
      'REQUEST_IN_PROGRESS',
      'A matching group is still being confirmed. Check its status before trying again.',
      true
    );
  end if;

  -- Serialise every saved-group create for one account so first-free pricing,
  -- quotas, cooldowns, and balance checks cannot race across different drafts.
  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'saved-group-create-account:' || v_actor_id::text,
      0
    )
  ) then
    insert into private.saved_group_creation_receipts (
      actor_id,
      client_event_id,
      canonical_client_event_id,
      request_hash,
      state
    ) values (
      v_actor_id,
      p_client_event_id,
      p_client_event_id,
      v_request_hash,
      'unknown'
    )
    on conflict (actor_id, client_event_id) do update
    set state = 'unknown';

    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'unknown_result',
      'REQUEST_IN_PROGRESS',
      'Another group change is still being confirmed. Check this request before trying again.',
      true
    );
  end if;

  select receipt.*
  into v_canonical
  from private.saved_group_creation_receipts receipt
  join public.teams team on team.id = receipt.group_id
  where receipt.actor_id = v_actor_id
    and receipt.request_hash = v_request_hash
    and receipt.state = 'confirmed'
    and receipt.response is not null
    and team.owner_id = v_actor_id
    and team.kind = 'saved'
    and coalesce(team.status, 'active') = 'active'
    and team.archived_at is null
  order by receipt.completed_at desc nulls last, receipt.created_at desc
  limit 1
  for update of receipt;

  if found then
    v_response := private.saved_group_creation_replay_v1(
      v_canonical.response,
      'SAVED_GROUP_CREATE',
      'GROUP_CREATION_REPLAYED',
      p_client_event_id,
      v_canonical.canonical_client_event_id
    );

    insert into private.saved_group_creation_receipts (
      actor_id,
      client_event_id,
      canonical_client_event_id,
      request_hash,
      state,
      group_id,
      response,
      completed_at
    ) values (
      v_actor_id,
      p_client_event_id,
      v_canonical.canonical_client_event_id,
      v_request_hash,
      'confirmed',
      v_canonical.group_id,
      v_response,
      now()
    )
    on conflict (actor_id, client_event_id) do update
    set
      canonical_client_event_id = excluded.canonical_client_event_id,
      state = 'confirmed',
      group_id = excluded.group_id,
      response = excluded.response,
      completed_at = excluded.completed_at;

    return v_response;
  end if;

  insert into private.saved_group_creation_receipts (
    actor_id,
    client_event_id,
    canonical_client_event_id,
    request_hash,
    state
  ) values (
    v_actor_id,
    p_client_event_id,
    p_client_event_id,
    v_request_hash,
    'pending'
  )
  on conflict (actor_id, client_event_id) do update
  set
    canonical_client_event_id = excluded.canonical_client_event_id,
    state = 'pending',
    response = null,
    completed_at = null
  returning id into v_receipt_id;

  select team.name, team.cooldown_until
  into v_cooldown
  from public.team_members membership
  join public.teams team on team.id = membership.group_id
  where membership.user_id = v_actor_id
    and team.kind = 'saved'
    and team.cooldown_until is not null
    and team.cooldown_until > now()
  order by team.cooldown_until desc
  limit 1;

  if found then
    v_response := private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'failed',
      'GROUP_CREATION_COOLDOWN',
      'Group creation is paused until the current cooldown ends.',
      false,
      pg_catalog.jsonb_build_object(
        'group_name', v_cooldown.name,
        'cooldown_until', v_cooldown.cooldown_until
      )
    );

    update private.saved_group_creation_receipts
    set state = 'failed', response = v_response, completed_at = now()
    where id = v_receipt_id;
    return v_response;
  end if;

  -- The compatibility function calculates cost, quota, balance, and debit
  -- from server state. p_cost is deliberately not accepted by v3.
  v_group_result := public.create_group_with_payment(
    v_actor_id,
    v_name,
    v_description,
    v_duration,
    0,
    v_privacy
  );

  if coalesce(v_group_result ->> 'success', 'false') <> 'true' then
    v_error_code := coalesce(
      nullif(v_group_result ->> 'error', ''),
      'GROUP_CREATION_FAILED'
    );
    v_response := private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE',
      'failed',
      v_error_code,
      case v_error_code
        when 'INSUFFICIENT_BALANCE' then
          'Your confirmed Momenta balance is not enough for this group.'
        when 'QUOTA_ACTIVE_GROUPS' then
          'Your active saved-group limit has been reached.'
        when 'QUOTA_GROUPS_MONTH' then
          'Your saved-group creation limit for this month has been reached.'
        when 'USER_NOT_FOUND' then
          'Menta could not confirm your wallet profile.'
        when 'UNAUTHORIZED' then
          'Your account could not be confirmed for this group.'
        else
          'Menta did not create the group or spend Momenta.'
      end
    );

    update private.saved_group_creation_receipts
    set state = 'failed', response = v_response, completed_at = now()
    where id = v_receipt_id;
    return v_response;
  end if;

  if coalesce(v_group_result ->> 'group_id', '')
     !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    raise exception 'GROUP_CREATION_RECEIPT_INVALID';
  end if;

  v_group_id := (v_group_result ->> 'group_id')::uuid;

  update public.teams
  set
    kind = 'saved',
    image_url = case
      when v_image_preset is null then null
      else 'menta-preset:' || v_image_preset
    end,
    notify_on_member_miss = v_notify,
    updated_at = now()
  where id = v_group_id
    and owner_id = v_actor_id
    and kind = 'saved'
  returning * into v_group;

  if not found then
    raise exception 'GROUP_CREATION_OWNER_MISMATCH';
  end if;

  v_cost := greatest(coalesce((v_group_result ->> 'cost')::integer, 0), 0);
  v_new_balance := greatest(
    coalesce((v_group_result ->> 'new_balance')::integer, 0),
    0
  );

  v_response := pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'SAVED_GROUP_CREATE',
    'status', 'confirmed',
    'code', 'GROUP_CREATED',
    'receipt', pg_catalog.jsonb_build_object(
      'receipt_id', v_receipt_id,
      'client_event_id', p_client_event_id,
      'canonical_client_event_id', p_client_event_id,
      'group_id', v_group.id,
      'group_name', v_group.name,
      'description', v_group.description,
      'privacy', v_group.privacy,
      'duration_days', v_group.duration_days,
      'image_url', v_group.image_url,
      'notify_on_member_miss', v_group.notify_on_member_miss,
      'debit_amount', v_cost,
      'new_balance', v_new_balance,
      'created_at', v_group.created_at,
      'idempotent', false
    )
  );

  update private.saved_group_creation_receipts
  set
    state = 'confirmed',
    group_id = v_group.id,
    response = v_response,
    completed_at = now()
  where id = v_receipt_id;

  return v_response;
end;
$function$;

CREATE OR REPLACE FUNCTION public.read_promise_accountability_join_status_v2(p_challenge_id uuid, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_result jsonb;
  v_role text;
begin
  v_result := public.read_challenge_join_status_v1(
    p_challenge_id,
    p_client_event_id
  );

  if v_actor_id is null then
    return v_result;
  end if;

  select member.role
  into v_role
  from private.promise_accountability_members member
  where member.challenge_id = p_challenge_id
    and member.user_id = v_actor_id;

  if v_role is null then
    return v_result;
  end if;

  if v_result ->> 'code' = 'RECEIPT_FOUND' then
    return pg_catalog.jsonb_set(
      v_result,
      '{receipt,accountability_role}',
      pg_catalog.to_jsonb(v_role),
      true
    );
  end if;

  if v_result ->> 'code' = 'NO_RECEIPT' then
    return pg_catalog.jsonb_set(
      v_result,
      '{status,is_member}',
      'true'::jsonb,
      true
    );
  end if;

  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.quote_promise_accountability_join_v2(p_challenge_id uuid DEFAULT NULL::uuid, p_invite_code text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_role text;
  v_inviter_id uuid;
  v_inviter_name text;
  v_target record;
  v_balance integer;
  v_already_joined boolean;
  v_quote_id uuid;
  v_cost integer;
begin
  select
    scoped.role,
    scoped.created_by,
    coalesce(profile.display_name, profile.username, 'A Menta member')
  into v_role, v_inviter_id, v_inviter_name
  from private.promise_accountability_invite_roles scoped
  join public.invite_codes invite on invite.code = scoped.invite_code
  join public.profiles profile on profile.id = scoped.created_by
  where scoped.invite_code = v_code
    and (invite.expires_at is null or invite.expires_at > now())
  limit 1;

  if v_role is null then
    return public.quote_challenge_join_v1(
      p_challenge_id,
      p_invite_code
    );
  end if;

  if v_actor_id is null then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_QUOTE',
      'AUTH_REQUIRED',
      'Sign in before checking this promise invitation.'
    );
  end if;

  if not public.current_session_is_active() then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_QUOTE',
      'AUTH_SESSION_REVOKED',
      'Your session is no longer active. Sign in again.'
    );
  end if;

  if private.users_have_block_relationship_v1(v_actor_id, v_inviter_id) then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_QUOTE',
      'CHALLENGE_NOT_FOUND',
      'This promise invitation is not available.'
    );
  end if;

  select *
  into v_target
  from private.resolve_promise_accountability_join_target_v2(
    v_actor_id,
    p_challenge_id,
    p_invite_code
  );

  if v_target.resolution_code <> 'READY' then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_QUOTE',
      v_target.resolution_code,
      'This promise invitation is not available.'
    );
  end if;

  select greatest(0, coalesce(profile.momenta_balance, 0))
  into v_balance
  from public.profiles profile
  where profile.id = v_actor_id;

  if not found then
    return private.challenge_join_failure_v1(
      'CHALLENGE_JOIN_QUOTE',
      'PROFILE_NOT_FOUND',
      'Menta could not confirm your profile.'
    );
  end if;

  select
    exists (
      select 1
      from private.promise_accountability_members member
      where member.challenge_id = v_target.resolved_challenge_id
        and member.user_id = v_actor_id
    ) or (v_role = 'partner' and v_target.is_member)
  into v_already_joined;

  if v_role = 'partner' and not v_already_joined and private.economy_quota_error_v1(v_actor_id, 'join_challenge') is not null then
    return private.challenge_join_failure_v1('CHALLENGE_JOIN_QUOTE', 'QUOTA_ACTIVE_PROMISES',
      'Your free plan includes 3 active promises. Finish a promise before joining another.');
  end if;
  v_cost := case when v_role = 'partner' then private.participation_join_cost_v1(v_actor_id) else 0 end;
  v_quote_id := private.challenge_join_quote_id_v1(
    v_target.resolved_challenge_id,
    v_cost
  );

  return pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'CHALLENGE_JOIN_QUOTE',
    'code', 'QUOTE_READY',
    'quote', pg_catalog.jsonb_build_object(
      'quote_id', v_quote_id,
      'challenge_id', v_target.resolved_challenge_id,
      'challenge_title', v_target.challenge_title,
      'challenge_description', v_target.challenge_description,
      'group_id', v_target.group_id,
      'group_name', v_target.group_name,
      'inviter_name', v_inviter_name,
      'cost', v_cost,
      'available_balance', v_balance,
      'shortfall', greatest(v_cost - v_balance, 0),
      'eligible', not v_already_joined and v_balance >= v_cost,
      'eligibility_code', case
        when v_already_joined then 'ALREADY_JOINED'
        when v_balance < v_cost then 'INSUFFICIENT_BALANCE'
        else 'ELIGIBLE'
      end,
      'accountability_role', v_role
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.leave_promise_accountability_v1(p_challenge_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_role text;
  v_group_id uuid;
  v_group_kind text;
  v_peer_roles_remaining integer;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-accountability-member:' || v_actor_id::text || ':' ||
        p_challenge_id::text,
      0
    )
  );

  select member.role
  into v_role
  from private.promise_accountability_members member
  where member.challenge_id = p_challenge_id
    and member.user_id = v_actor_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'ROLE_NOT_FOUND'
    );
  end if;

  if v_role = 'owner' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'OWNER_CANNOT_LEAVE'
    );
  end if;

  select team.id, team.kind
  into v_group_id, v_group_kind
  from public.team_challenges link
  join public.teams team on team.id = link.group_id
  where link.challenge_id = p_challenge_id
  order by link.created_at asc, link.group_id asc
  limit 1;

  delete from private.promise_accountability_members member
  where member.challenge_id = p_challenge_id
    and member.user_id = v_actor_id;

  if v_role = 'partner' then
    update public.challenge_participants participant
    set status = 'dropped', updated_at = now()
    where participant.challenge_id = p_challenge_id
      and participant.user_id = v_actor_id;
  end if;

  if v_group_kind = 'promise' then
    delete from public.team_members member
    where member.group_id = v_group_id
      and member.user_id = v_actor_id;

    select pg_catalog.count(*)::integer
    into v_peer_roles_remaining
    from private.promise_accountability_members member
    where member.challenge_id = p_challenge_id
      and member.role in ('partner', 'reviewer');

    if v_peer_roles_remaining = 0 then
      update public.challenges challenge
      set
        allow_self_review = true,
        submission_expectations =
          coalesce(challenge.submission_expectations, '{}'::jsonb)
          || pg_catalog.jsonb_build_object(
            'requires_peer_review', false,
            'reviewers_required', 0
          ),
        updated_at = now()
      where challenge.id = p_challenge_id;
    end if;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', 'PROMISE_ACCOUNTABILITY_LEFT_V1',
    'challenge_id', p_challenge_id,
    'role', v_role,
    'peer_review_active', coalesce(v_peer_roles_remaining, 1) > 0
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.manage_promise_accountability_member_v1(p_challenge_id uuid, p_member_id uuid, p_role text DEFAULT NULL::text, p_remove boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_next_role text := pg_catalog.lower(
    pg_catalog.btrim(coalesce(p_role, ''))
  );
  v_previous_role text;
  v_group_id uuid;
  v_group_kind text;
  v_peer_roles_remaining integer;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'AUTH_REQUIRED'
    );
  end if;

  if p_challenge_id is null
     or p_member_id is null
     or p_member_id = v_actor_id
     or (
       not coalesce(p_remove, false)
       and v_next_role not in ('partner', 'reviewer', 'supporter')
     ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'INVALID_REQUEST'
    );
  end if;

  if not exists (
    select 1
    from public.challenges challenge
    where challenge.id = p_challenge_id
      and challenge.creator_id = v_actor_id
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'PROMISE_NOT_FOUND'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-accountability-member:' || p_member_id::text || ':' ||
        p_challenge_id::text,
      0
    )
  );

  select member.role
  into v_previous_role
  from private.promise_accountability_members member
  where member.challenge_id = p_challenge_id
    and member.user_id = p_member_id
    and member.role <> 'owner'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'ROLE_NOT_FOUND'
    );
  end if;

  select team.id, team.kind
  into v_group_id, v_group_kind
  from public.team_challenges link
  join public.teams team on team.id = link.group_id
  where link.challenge_id = p_challenge_id
  order by link.created_at asc, link.group_id asc
  limit 1;

  if coalesce(p_remove, false) then
    delete from private.promise_accountability_members member
    where member.challenge_id = p_challenge_id
      and member.user_id = p_member_id;
  else
    update private.promise_accountability_members member
    set role = v_next_role, updated_at = now()
    where member.challenge_id = p_challenge_id
      and member.user_id = p_member_id;
  end if;

  if v_previous_role = 'partner'
     and (coalesce(p_remove, false) or v_next_role <> 'partner') then
    update public.challenge_participants participant
    set status = 'dropped', updated_at = now()
    where participant.challenge_id = p_challenge_id
      and participant.user_id = p_member_id;
  elsif not coalesce(p_remove, false) and v_next_role = 'partner' then
    insert into public.challenge_participants (
      challenge_id,
      user_id,
      joined_at,
      status
    ) values (
      p_challenge_id,
      p_member_id,
      now(),
      'active'
    )
    on conflict (challenge_id, user_id) do update
    set status = 'active', joined_at = excluded.joined_at, updated_at = now();
  end if;

  if coalesce(p_remove, false) and v_group_kind = 'promise' then
    delete from public.team_members member
    where member.group_id = v_group_id
      and member.user_id = p_member_id;
  end if;

  if v_group_kind = 'promise' then
    select pg_catalog.count(*)::integer
    into v_peer_roles_remaining
    from private.promise_accountability_members member
    where member.challenge_id = p_challenge_id
      and member.role in ('partner', 'reviewer');

    update public.challenges challenge
    set
      allow_self_review = v_peer_roles_remaining = 0,
      submission_expectations =
        coalesce(challenge.submission_expectations, '{}'::jsonb)
        || pg_catalog.jsonb_build_object(
          'requires_peer_review', v_peer_roles_remaining > 0,
          'reviewers_required', case
            when v_peer_roles_remaining > 0 then 1
            else 0
          end
        ),
      updated_at = now()
    where challenge.id = p_challenge_id;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'result_code', case
      when coalesce(p_remove, false) then 'PROMISE_ACCOUNTABILITY_MEMBER_REMOVED_V1'
      else 'PROMISE_ACCOUNTABILITY_MEMBER_UPDATED_V1'
    end,
    'challenge_id', p_challenge_id,
    'member_id', p_member_id,
    'role', case when coalesce(p_remove, false) then null else v_next_role end,
    'peer_review_active', coalesce(v_peer_roles_remaining, 1) > 0
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.review_challenge_verification(p_verification_id uuid, p_status text, p_review_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_reviewer_id uuid := auth.uid();
  v_challenge_id uuid;
begin
  if v_reviewer_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_AUTHENTICATED',
      'message', 'Sign in again before reviewing proof.'
    );
  end if;

  select submission.challenge_id
  into v_challenge_id
  from public.challenge_submissions submission
  where submission.id = p_verification_id;

  if v_challenge_id is not null and exists (
    select 1
    from private.promise_accountability_members member
    where member.challenge_id = v_challenge_id
      and member.user_id = v_reviewer_id
      and member.role = 'supporter'
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_ALLOWED',
      'message', 'Your role in this promise does not include proof review.'
    );
  end if;

  return public.review_challenge_verification_pre_accountability_v1(
    p_verification_id,
    p_status,
    p_review_notes
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.read_saved_group_creation_status_v1(p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_existing private.saved_group_creation_receipts%rowtype;
  v_canonical private.saved_group_creation_receipts%rowtype;
  v_response jsonb;
  v_balance integer := 0;
begin
  if v_actor_id is null then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE_STATUS',
      'failed',
      'AUTH_REQUIRED',
      'Sign in before checking this group.'
    );
  end if;

  if not public.current_session_is_active() then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE_STATUS',
      'failed',
      'AUTH_SESSION_REVOKED',
      'Your session is no longer active. Sign in again before checking this group.'
    );
  end if;

  if p_client_event_id is null then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE_STATUS',
      'failed',
      'INVALID_REQUEST',
      'A request ID is required to check this group.'
    );
  end if;

  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'saved-group-create-event:' || v_actor_id::text || ':' ||
        p_client_event_id::text,
      0
    )
  ) then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE_STATUS',
      'unknown_result',
      'REQUEST_IN_PROGRESS',
      'This group is still being confirmed. Check again before creating another group.',
      true
    );
  end if;

  select receipt.*
  into v_existing
  from private.saved_group_creation_receipts receipt
  where receipt.actor_id = v_actor_id
    and receipt.client_event_id = p_client_event_id
  for update;

  if not found then
    select coalesce(profile.momenta_balance, 0)
    into v_balance
    from public.profiles profile
    where profile.id = v_actor_id;

    return pg_catalog.jsonb_build_object(
      'success', true,
      'operation', 'SAVED_GROUP_CREATE_STATUS',
      'status', 'not_found',
      'code', 'NO_RECEIPT',
      'snapshot', pg_catalog.jsonb_build_object(
        'client_event_id', p_client_event_id,
        'safe_to_retry', true,
        'available_balance', coalesce(v_balance, 0)
      )
    );
  end if;

  if v_existing.state = 'confirmed' and v_existing.response is not null then
    return private.saved_group_creation_replay_v1(
      v_existing.response,
      'SAVED_GROUP_CREATE_STATUS',
      'RECEIPT_FOUND',
      p_client_event_id,
      v_existing.canonical_client_event_id
    );
  end if;

  if v_existing.state = 'failed' and v_existing.response is not null then
    return (v_existing.response - 'operation')
      || pg_catalog.jsonb_build_object(
        'operation', 'SAVED_GROUP_CREATE_STATUS'
      );
  end if;

  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'saved-group-create-request:' || v_actor_id::text || ':' ||
        v_existing.request_hash,
      0
    )
  ) then
    return private.saved_group_creation_problem_v1(
      'SAVED_GROUP_CREATE_STATUS',
      'unknown_result',
      'REQUEST_IN_PROGRESS',
      'A matching group is still being confirmed. Check again before creating another group.',
      true
    );
  end if;

  select receipt.*
  into v_canonical
  from private.saved_group_creation_receipts receipt
  join public.teams team on team.id = receipt.group_id
  where receipt.actor_id = v_actor_id
    and receipt.request_hash = v_existing.request_hash
    and receipt.state = 'confirmed'
    and receipt.response is not null
    and team.owner_id = v_actor_id
    and team.kind = 'saved'
    and coalesce(team.status, 'active') = 'active'
    and team.archived_at is null
  order by receipt.completed_at desc nulls last, receipt.created_at desc
  limit 1
  for update of receipt;

  if found then
    v_response := private.saved_group_creation_replay_v1(
      v_canonical.response,
      'SAVED_GROUP_CREATE_STATUS',
      'RECEIPT_FOUND',
      p_client_event_id,
      v_canonical.canonical_client_event_id
    );

    update private.saved_group_creation_receipts
    set
      canonical_client_event_id = v_canonical.canonical_client_event_id,
      state = 'confirmed',
      group_id = v_canonical.group_id,
      response = private.saved_group_creation_replay_v1(
        v_canonical.response,
        'SAVED_GROUP_CREATE',
        'GROUP_CREATION_REPLAYED',
        p_client_event_id,
        v_canonical.canonical_client_event_id
      ),
      completed_at = now()
    where id = v_existing.id;

    return v_response;
  end if;

  select coalesce(profile.momenta_balance, 0)
  into v_balance
  from public.profiles profile
  where profile.id = v_actor_id;

  update private.saved_group_creation_receipts
  set state = 'retryable', response = null, completed_at = null
  where id = v_existing.id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'SAVED_GROUP_CREATE_STATUS',
    'status', 'not_found',
    'code', 'NO_RECEIPT',
    'snapshot', pg_catalog.jsonb_build_object(
      'client_event_id', p_client_event_id,
      'safe_to_retry', true,
      'available_balance', coalesce(v_balance, 0)
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_accountability_group_v2(p_name text, p_description text DEFAULT NULL::text, p_duration_days integer DEFAULT 30, p_cost integer DEFAULT 50, p_privacy text DEFAULT 'private'::text, p_image_preset text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_result jsonb;
begin
  v_result := public.create_accountability_group_v3(
    pg_catalog.gen_random_uuid(),
    p_name,
    p_description,
    p_duration_days,
    p_privacy,
    p_image_preset,
    true
  );

  if coalesce(v_result ->> 'success', 'false') = 'true' then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'group_id', v_result #>> '{receipt,group_id}',
      'new_balance', (v_result #>> '{receipt,new_balance}')::integer,
      'cost', (v_result #>> '{receipt,debit_amount}')::integer,
      'idempotent', coalesce(
        (v_result #>> '{receipt,idempotent}')::boolean,
        false
      )
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'success', false,
    'error', coalesce(v_result ->> 'code', 'GROUP_CREATION_FAILED'),
    'status', coalesce(v_result ->> 'status', 'failed'),
    'retryable', coalesce((v_result ->> 'retryable')::boolean, false)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.block_guarded_team_owner_change_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Take the same parent-row lock used by the profile foreign key before
  -- reading the guard. A concurrent prepare transaction therefore commits
  -- its guard before this trigger decides whether the write may continue.
  if tg_op = 'INSERT' then
    perform profile.id
    from public.profiles profile
    where profile.id = new.owner_id
    for key share;

    if exists (
      select 1
      from private.account_deletion_guards_v1 guard
      where guard.actor_id = new.owner_id
        and guard.expires_at > pg_catalog.now()
    ) then
      raise exception using
        errcode = '55000',
        message = 'ACCOUNT_DELETION_IN_PROGRESS';
    end if;

    return new;
  end if;

  perform profile.id
  from public.profiles profile
  where profile.id in (old.owner_id, new.owner_id)
  order by profile.id
  for key share;

  if exists (
    select 1
    from private.account_deletion_guards_v1 guard
    where guard.actor_id in (old.owner_id, new.owner_id)
      and guard.expires_at > pg_catalog.now()
  ) then
    raise exception using
      errcode = '55000',
      message = 'ACCOUNT_DELETION_IN_PROGRESS';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_join_invite_entry_v2(p_actor_id uuid, p_occurrence_id uuid, p_client_event_id uuid, p_request_hash text, p_consent_version text, p_share_token_hash text DEFAULT NULL::text, p_invite_token_hash text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_organiser_id uuid;
begin
  -- A prior receipt remains authoritative even if the relationship changes
  -- later. Delegate to v1 so its request-hash and idempotency checks decide.
  if p_actor_id is not null and exists (
    select 1
    from public.event_action_receipts receipt
    where receipt.actor_id = p_actor_id
      and receipt.action = 'join'
      and receipt.client_event_id = p_client_event_id
  ) then
    return public.event_join_v1(
      p_actor_id,
      p_occurrence_id,
      p_client_event_id,
      p_request_hash,
      p_consent_version,
      p_share_token_hash,
      p_invite_token_hash
    );
  end if;

  if p_actor_id is null then
    return private.event_result_v1(
      'join',
      p_client_event_id,
      'failed',
      'AUTHENTICATION_REQUIRED',
      'Sign in before joining this event.',
      null
    );
  end if;

  select event.organiser_id
  into v_organiser_id
  from public.event_occurrences occurrence
  join public.event_events event on event.id = occurrence.event_id
  where occurrence.id = p_occurrence_id
  limit 1;

  if not found
     or (
       v_organiser_id is not null
       and private.users_have_block_relationship_v1(
         p_actor_id,
         v_organiser_id
       )
     ) then
    return private.event_result_v1(
      'join',
      p_client_event_id,
      'failed',
      'EVENT_UNAVAILABLE',
      'This event invitation is not available.',
      null
    );
  end if;

  return public.event_join_v1(
    p_actor_id,
    p_occurrence_id,
    p_client_event_id,
    p_request_hash,
    p_consent_version,
    p_share_token_hash,
    p_invite_token_hash
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.delete_accountability_challenge_v2(p_challenge_id uuid, p_client_event_id uuid, p_check_only boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_existing private.promise_mutation_receipts_v1%rowtype;
  v_creator_id uuid;
  v_confirmed_at timestamptz := pg_catalog.now();
  v_result jsonb;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return private.promise_mutation_result_v1(
      'PROMISE_DELETE',
      'failed',
      'AUTH_REQUIRED',
      'Sign in again before deleting this promise.',
      p_challenge_id,
      p_client_event_id,
      false
    );
  end if;

  if p_challenge_id is null or p_client_event_id is null then
    return private.promise_mutation_result_v1(
      'PROMISE_DELETE',
      'failed',
      'INVALID_REQUEST',
      'Choose a promise before deleting it.',
      p_challenge_id,
      p_client_event_id,
      false
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-mutation:' || v_actor_id::text || ':' ||
        p_client_event_id::text,
      0
    )
  );

  select receipt.*
  into v_existing
  from private.promise_mutation_receipts_v1 receipt
  where receipt.actor_id = v_actor_id
    and receipt.client_event_id = p_client_event_id;

  if found then
    if v_existing.operation <> 'delete'
       or v_existing.challenge_id <> p_challenge_id then
      return private.promise_mutation_result_v1(
        'PROMISE_DELETE',
        'failed',
        'IDEMPOTENCY_KEY_REUSED',
        'This request key belongs to a different promise action.',
        p_challenge_id,
        p_client_event_id,
        false
      );
    end if;

    return v_existing.result_payload
      || pg_catalog.jsonb_build_object('idempotent', true);
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-delete:' || p_challenge_id::text,
      0
    )
  );

  select challenge.creator_id
  into v_creator_id
  from public.challenges challenge
  where challenge.id = p_challenge_id
  for update;

  if coalesce(p_check_only, false) then
    if found and v_creator_id = v_actor_id then
      return private.promise_mutation_result_v1(
        'PROMISE_DELETE',
        'failed',
        'DELETE_NOT_APPLIED',
        'Menta confirmed that this deletion did not finish. It is safe to try again.',
        p_challenge_id,
        p_client_event_id,
        true
      );
    end if;

    if found then
      return private.promise_mutation_result_v1(
        'PROMISE_DELETE',
        'failed',
        'FORBIDDEN',
        'Only the promise owner can delete this promise.',
        p_challenge_id,
        p_client_event_id,
        false
      );
    end if;

    -- A missing promise without this event's receipt could have been removed
    -- by another action. Do not attribute that deletion to this request.
    return private.promise_mutation_result_v1(
      'PROMISE_DELETE',
      'unknown',
      'RECEIPT_NOT_FOUND',
      'This promise is no longer available, but Menta cannot confirm which action removed it.',
      p_challenge_id,
      p_client_event_id,
      false
    );
  end if;

  if not found then
    v_result := private.promise_mutation_result_v1(
      'PROMISE_DELETE',
      'failed',
      'PROMISE_NOT_FOUND',
      'This promise is no longer available.',
      p_challenge_id,
      p_client_event_id,
      false
    );
    return private.record_promise_mutation_result_v1(
      v_actor_id,
      p_client_event_id,
      p_challenge_id,
      'delete',
      v_result
    );
  end if;

  if v_creator_id <> v_actor_id then
    v_result := private.promise_mutation_result_v1(
      'PROMISE_DELETE',
      'failed',
      'FORBIDDEN',
      'Only the promise owner can delete this promise.',
      p_challenge_id,
      p_client_event_id,
      false
    );
    return private.record_promise_mutation_result_v1(
      v_actor_id,
      p_client_event_id,
      p_challenge_id,
      'delete',
      v_result
    );
  end if;

  -- These two legacy relationships do not have a challenge foreign key with
  -- ON DELETE CASCADE. All other canonical challenge relationships cascade.
  delete from public.power_up_usage usage
  where usage.challenge_id = p_challenge_id;

  delete from public.invite_codes invite
  where invite.type = 'challenge'
    and invite.ref_id = p_challenge_id;

  delete from public.challenges challenge
  where challenge.id = p_challenge_id
    and challenge.creator_id = v_actor_id;

  v_result := private.promise_mutation_result_v1(
    'PROMISE_DELETE',
    'confirmed',
    'DELETE_CONFIRMED',
    'The promise was deleted.',
    p_challenge_id,
    p_client_event_id,
    false,
    pg_catalog.jsonb_build_object(
      'receipt_id', p_client_event_id,
      'challenge_id', p_challenge_id,
      'client_event_id', p_client_event_id,
      'actor_id', v_actor_id,
      'changed', true,
      'confirmed_at', v_confirmed_at,
      'idempotent', false
    )
  );

  return private.record_promise_mutation_result_v1(
    v_actor_id,
    p_client_event_id,
    p_challenge_id,
    'delete',
    v_result
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.block_guarded_team_membership_write_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Lock the referenced team rows before checking their owners. This closes
  -- the trigger-before-foreign-key race with prepare_account_deletion_v1.
  if tg_op = 'INSERT' then
    perform team.id
    from public.teams team
    where team.id = new.group_id
    for key share;

    if exists (
      select 1
      from public.teams team
      join private.account_deletion_guards_v1 guard
        on guard.actor_id = team.owner_id
      where team.id = new.group_id
        and guard.expires_at > pg_catalog.now()
    ) then
      raise exception using
        errcode = '55000',
        message = 'ACCOUNT_DELETION_IN_PROGRESS';
    end if;

    return new;
  end if;

  perform team.id
  from public.teams team
  where team.id in (old.group_id, new.group_id)
  order by team.id
  for key share;

  if exists (
    select 1
    from public.teams team
    join private.account_deletion_guards_v1 guard
      on guard.actor_id = team.owner_id
    where team.id in (old.group_id, new.group_id)
      and guard.expires_at > pg_catalog.now()
  ) then
    raise exception using
      errcode = '55000',
      message = 'ACCOUNT_DELETION_IN_PROGRESS';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prepare_account_deletion_v1(p_actor_id uuid, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_existing private.account_deletion_guards_v1%rowtype;
  v_other_member_count integer := 0;
  v_expires_at timestamptz := pg_catalog.now() + interval '5 minutes';
begin
  if p_actor_id is null or p_client_event_id is null then
    return pg_catalog.jsonb_build_object(
      'state', 'failed',
      'code', 'INVALID_REQUEST',
      'account_deleted', false
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'account-deletion:' || p_actor_id::text,
      0
    )
  );

  perform profile.id
  from public.profiles profile
  where profile.id = p_actor_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'state', 'failed',
      'code', 'ACCOUNT_PROFILE_UNAVAILABLE',
      'account_deleted', false
    );
  end if;

  delete from private.account_deletion_guards_v1 guard
  where guard.actor_id = p_actor_id
    and guard.expires_at <= pg_catalog.now();

  select guard.*
  into v_existing
  from private.account_deletion_guards_v1 guard
  where guard.actor_id = p_actor_id
  for update;

  if found then
    if v_existing.client_event_id <> p_client_event_id then
      return pg_catalog.jsonb_build_object(
        'state', 'failed',
        'code', 'DELETION_REQUEST_IN_PROGRESS',
        'account_deleted', false
      );
    end if;

    return pg_catalog.jsonb_build_object(
      'state', 'ready',
      'code', 'ACCOUNT_DELETION_READY',
      'account_deleted', false,
      'client_event_id', p_client_event_id,
      'expires_at', v_existing.expires_at,
      'idempotent', true
    );
  end if;

  -- A FOR UPDATE lock conflicts with the key-share lock required by a new
  -- team_members row. A join that started first commits before the count; a
  -- join that starts later reaches the guard-aware trigger and is rejected.
  perform team.id
  from public.teams team
  where team.owner_id = p_actor_id
  order by team.id
  for update;

  select pg_catalog.count(*)::integer
  into v_other_member_count
  from public.teams team
  join public.team_members member on member.group_id = team.id
  where team.owner_id = p_actor_id
    and member.user_id <> p_actor_id;

  if v_other_member_count > 0 then
    return pg_catalog.jsonb_build_object(
      'state', 'blocked',
      'code', 'OWNED_GROUP_HAS_OTHER_MEMBERS',
      'account_deleted', false
    );
  end if;

  insert into private.account_deletion_guards_v1 (
    actor_id,
    client_event_id,
    expires_at
  ) values (
    p_actor_id,
    p_client_event_id,
    v_expires_at
  );

  return pg_catalog.jsonb_build_object(
    'state', 'ready',
    'code', 'ACCOUNT_DELETION_READY',
    'account_deleted', false,
    'client_event_id', p_client_event_id,
    'expires_at', v_expires_at,
    'idempotent', false
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion_v1(p_actor_id uuid, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_removed integer := 0;
begin
  if p_actor_id is null or p_client_event_id is null then
    return pg_catalog.jsonb_build_object(
      'state', 'failed',
      'code', 'INVALID_REQUEST',
      'account_deleted', false
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'account-deletion:' || p_actor_id::text,
      0
    )
  );

  delete from private.account_deletion_guards_v1 guard
  where guard.actor_id = p_actor_id
    and guard.client_event_id = p_client_event_id;
  get diagnostics v_removed = row_count;

  return pg_catalog.jsonb_build_object(
    'state', 'cancelled',
    'code', 'ACCOUNT_DELETION_CANCELLED',
    'account_deleted', false,
    'changed', v_removed = 1
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.commit_account_deletion_v1(p_actor_id uuid, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_guard private.account_deletion_guards_v1%rowtype;
  v_other_member_count integer := 0;
  v_deleted integer := 0;
begin
  if p_actor_id is null or p_client_event_id is null then
    return pg_catalog.jsonb_build_object(
      'state', 'failed',
      'code', 'INVALID_REQUEST',
      'account_deleted', false
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'account-deletion:' || p_actor_id::text,
      0
    )
  );

  perform profile.id
  from public.profiles profile
  where profile.id = p_actor_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'state', 'failed',
      'code', 'ACCOUNT_PROFILE_UNAVAILABLE',
      'account_deleted', false
    );
  end if;

  select guard.*
  into v_guard
  from private.account_deletion_guards_v1 guard
  where guard.actor_id = p_actor_id
    and guard.client_event_id = p_client_event_id
  for update;

  if not found or v_guard.expires_at <= pg_catalog.now() then
    delete from private.account_deletion_guards_v1 guard
    where guard.actor_id = p_actor_id
      and guard.client_event_id = p_client_event_id;

    return pg_catalog.jsonb_build_object(
      'state', 'failed',
      'code', 'DELETION_GUARD_UNAVAILABLE',
      'account_deleted', false
    );
  end if;

  perform team.id
  from public.teams team
  where team.owner_id = p_actor_id
  order by team.id
  for update;

  select pg_catalog.count(*)::integer
  into v_other_member_count
  from public.teams team
  join public.team_members member on member.group_id = team.id
  where team.owner_id = p_actor_id
    and member.user_id <> p_actor_id;

  if v_other_member_count > 0 then
    delete from private.account_deletion_guards_v1 guard
    where guard.actor_id = p_actor_id
      and guard.client_event_id = p_client_event_id;

    return pg_catalog.jsonb_build_object(
      'state', 'blocked',
      'code', 'OWNED_GROUP_HAS_OTHER_MEMBERS',
      'account_deleted', false
    );
  end if;

  delete from public.profiles profile
  where profile.id = p_actor_id;
  get diagnostics v_deleted = row_count;

  if v_deleted <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'ACCOUNT_PROFILE_DELETE_NOT_CONFIRMED';
  end if;

  return pg_catalog.jsonb_build_object(
    'state', 'confirmed',
    'code', 'ACCOUNT_PROFILE_DELETED',
    'account_deleted', true,
    'client_event_id', p_client_event_id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION private.promise_mutation_result_v1(p_operation text, p_outcome text, p_code text, p_message text, p_challenge_id uuid, p_client_event_id uuid, p_safe_to_retry boolean DEFAULT false, p_receipt jsonb DEFAULT NULL::jsonb, p_idempotent boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select pg_catalog.jsonb_strip_nulls(
    pg_catalog.jsonb_build_object(
      'operation', p_operation,
      'outcome', p_outcome,
      'code', p_code,
      'message', p_message,
      'challenge_id', p_challenge_id,
      'client_event_id', p_client_event_id,
      'safe_to_retry', p_safe_to_retry,
      'idempotent', p_idempotent,
      'receipt', p_receipt
    )
  );
$function$;

CREATE OR REPLACE FUNCTION private.record_promise_mutation_result_v1(p_actor_id uuid, p_client_event_id uuid, p_challenge_id uuid, p_operation text, p_result_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  insert into private.promise_mutation_receipts_v1 (
    actor_id,
    client_event_id,
    challenge_id,
    operation,
    result_payload
  ) values (
    p_actor_id,
    p_client_event_id,
    p_challenge_id,
    p_operation,
    p_result_payload
  );

  return p_result_payload;
end;
$function$;

CREATE OR REPLACE FUNCTION public.leave_promise_accountability_v2(p_challenge_id uuid, p_client_event_id uuid, p_check_only boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_existing private.promise_mutation_receipts_v1%rowtype;
  v_role text;
  v_group_id uuid;
  v_group_kind text;
  v_peer_roles_remaining integer;
  v_confirmed_at timestamptz := pg_catalog.now();
  v_result jsonb;
begin
  if v_actor_id is null or not public.current_session_is_active() then
    return private.promise_mutation_result_v1(
      'PROMISE_ACCOUNTABILITY_LEAVE',
      'failed',
      'AUTH_REQUIRED',
      'Sign in again before leaving this promise.',
      p_challenge_id,
      p_client_event_id,
      false
    );
  end if;

  if p_challenge_id is null or p_client_event_id is null then
    return private.promise_mutation_result_v1(
      'PROMISE_ACCOUNTABILITY_LEAVE',
      'failed',
      'INVALID_REQUEST',
      'Choose a promise before leaving.',
      p_challenge_id,
      p_client_event_id,
      false
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-mutation:' || v_actor_id::text || ':' ||
        p_client_event_id::text,
      0
    )
  );

  select receipt.*
  into v_existing
  from private.promise_mutation_receipts_v1 receipt
  where receipt.actor_id = v_actor_id
    and receipt.client_event_id = p_client_event_id;

  if found then
    if v_existing.operation <> 'leave'
       or v_existing.challenge_id <> p_challenge_id then
      return private.promise_mutation_result_v1(
        'PROMISE_ACCOUNTABILITY_LEAVE',
        'failed',
        'IDEMPOTENCY_KEY_REUSED',
        'This request key belongs to a different promise action.',
        p_challenge_id,
        p_client_event_id,
        false
      );
    end if;

    return v_existing.result_payload
      || pg_catalog.jsonb_build_object('idempotent', true);
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-accountability-member:' || v_actor_id::text || ':' ||
        p_challenge_id::text,
      0
    )
  );

  if coalesce(p_check_only, false) then
    select member.role
    into v_role
    from private.promise_accountability_members member
    where member.challenge_id = p_challenge_id
      and member.user_id = v_actor_id;

    if v_role = 'owner' then
      return private.promise_mutation_result_v1(
        'PROMISE_ACCOUNTABILITY_LEAVE',
        'failed',
        'OWNER_CANNOT_LEAVE',
        'The promise owner cannot leave their own promise.',
        p_challenge_id,
        p_client_event_id,
        false
      );
    end if;

    -- A v2 leave and its receipt commit in the same transaction. No receipt
    -- means this client event did not commit, so reusing this exact event ID is
    -- the only safe retry path.
    return private.promise_mutation_result_v1(
      'PROMISE_ACCOUNTABILITY_LEAVE',
      'failed',
      'LEAVE_NOT_APPLIED',
      'Menta confirmed that this leave request did not finish. It is safe to try again.',
      p_challenge_id,
      p_client_event_id,
      true
    );
  end if;

  select member.role
  into v_role
  from private.promise_accountability_members member
  where member.challenge_id = p_challenge_id
    and member.user_id = v_actor_id
  for update;

  if not found then
    v_result := private.promise_mutation_result_v1(
      'PROMISE_ACCOUNTABILITY_LEAVE',
      'failed',
      'ROLE_NOT_FOUND',
      'Menta could not find an accountability role to leave.',
      p_challenge_id,
      p_client_event_id,
      false
    );
    return private.record_promise_mutation_result_v1(
      v_actor_id,
      p_client_event_id,
      p_challenge_id,
      'leave',
      v_result
    );
  end if;

  if v_role = 'owner' then
    v_result := private.promise_mutation_result_v1(
      'PROMISE_ACCOUNTABILITY_LEAVE',
      'failed',
      'OWNER_CANNOT_LEAVE',
      'The promise owner cannot leave their own promise.',
      p_challenge_id,
      p_client_event_id,
      false
    );
    return private.record_promise_mutation_result_v1(
      v_actor_id,
      p_client_event_id,
      p_challenge_id,
      'leave',
      v_result
    );
  end if;

  select team.id, team.kind
  into v_group_id, v_group_kind
  from public.team_challenges link
  join public.teams team on team.id = link.group_id
  where link.challenge_id = p_challenge_id
  order by link.created_at asc, link.group_id asc
  limit 1;

  delete from private.promise_accountability_members member
  where member.challenge_id = p_challenge_id
    and member.user_id = v_actor_id;

  if v_role = 'partner' then
    update public.challenge_participants participant
    set status = 'dropped', updated_at = pg_catalog.now()
    where participant.challenge_id = p_challenge_id
      and participant.user_id = v_actor_id;
  end if;

  if v_group_kind = 'promise' then
    delete from public.team_members member
    where member.group_id = v_group_id
      and member.user_id = v_actor_id;

    select pg_catalog.count(*)::integer
    into v_peer_roles_remaining
    from private.promise_accountability_members member
    where member.challenge_id = p_challenge_id
      and member.role in ('partner', 'reviewer');

    if v_peer_roles_remaining = 0 then
      update public.challenges challenge
      set
        allow_self_review = true,
        submission_expectations =
          coalesce(challenge.submission_expectations, '{}'::jsonb)
          || pg_catalog.jsonb_build_object(
            'requires_peer_review', false,
            'reviewers_required', 0
          ),
        updated_at = pg_catalog.now()
      where challenge.id = p_challenge_id;
    end if;
  end if;

  v_result := private.promise_mutation_result_v1(
    'PROMISE_ACCOUNTABILITY_LEAVE',
    'confirmed',
    'LEAVE_CONFIRMED',
    'You left this promise.',
    p_challenge_id,
    p_client_event_id,
    false,
    pg_catalog.jsonb_build_object(
      'receipt_id', p_client_event_id,
      'challenge_id', p_challenge_id,
      'client_event_id', p_client_event_id,
      'actor_id', v_actor_id,
      'previous_role', v_role,
      'changed', true,
      'confirmed_at', v_confirmed_at,
      'idempotent', false
    )
  );

  return private.record_promise_mutation_result_v1(
    v_actor_id,
    p_client_event_id,
    p_challenge_id,
    'leave',
    v_result
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_profile_follow_through_v1(p_timezone text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_timezone text := 'UTC';
  v_today date;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if not public.current_session_is_active() then
    raise exception 'AUTH_SESSION_REVOKED' using errcode = '42501';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_timezone_names zone
    where zone.name = nullif(pg_catalog.btrim(p_timezone), '')
  ) then
    v_timezone := pg_catalog.btrim(p_timezone);
  end if;
  v_today := (pg_catalog.now() at time zone v_timezone)::date;

  return (
    with days as (
      select (v_today - day_offset.value)::date as local_day
      from pg_catalog.generate_series(0, 6) day_offset(value)
    ), proof_counts as (
      select submission.local_day, pg_catalog.count(*)::integer as approved_proofs
      from public.challenge_submissions submission
      where submission.user_id = v_user_id
        and submission.status = 'approved'
        and submission.local_day between v_today - 6 and v_today
      group by submission.local_day
    ), outcomes as (
      select distinct on (outcome.local_day)
        outcome.local_day,
        outcome.outcome::text as outcome
      from public.streak_day_outcomes outcome
      where outcome.user_id = v_user_id
        and outcome.local_day between v_today - 6 and v_today
      order by outcome.local_day, outcome.created_at desc, outcome.id desc
    )
    select coalesce(
      pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'local_day', day.local_day,
          'approved_proofs', coalesce(proof.approved_proofs, 0),
          'outcome', outcome.outcome
        ) order by day.local_day
      ),
      '[]'::jsonb
    )
    from days day
    left join proof_counts proof on proof.local_day = day.local_day
    left join outcomes outcome on outcome.local_day = day.local_day
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.preview_group_invite_guest_v1(p_invite_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_group_name text;
  v_inviter_name text;
  v_shared_promise text;
  v_privacy text;
  v_expires_at timestamptz;
begin
  if v_code !~ '^[A-HJ-NP-Z2-9]{26}$' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'GROUP_INVITE_GUEST_PREVIEW',
      'code', 'UNAVAILABLE'
    );
  end if;

  select
    group_row.name,
    coalesce(
      nullif(pg_catalog.btrim(profile.display_name), ''),
      nullif(pg_catalog.btrim(profile.username), ''),
      'A group member'
    ),
    case
      when group_row.privacy = 'public' then 'public'
      else 'private'
    end,
    invite.expires_at
  into
    v_group_name,
    v_inviter_name,
    v_privacy,
    v_expires_at
  from public.invite_codes invite
  join public.teams group_row
    on group_row.id = invite.ref_id
  left join public.profiles profile
    on profile.id = invite.created_by
  where invite.code = v_code
    and invite.type = 'group'
    and invite.expires_at is not null
    and invite.expires_at > now()
    and group_row.status = 'active'
  limit 1;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'GROUP_INVITE_GUEST_PREVIEW',
      'code', 'UNAVAILABLE'
    );
  end if;

  select challenge.title
  into v_shared_promise
  from public.invite_codes invite
  join public.team_challenges group_challenge
    on group_challenge.group_id = invite.ref_id
  join public.challenges challenge
    on challenge.id = group_challenge.challenge_id
  where invite.code = v_code
    and invite.type = 'group'
    and challenge.status = 'active'
    and challenge.completion_status = 'active'
  order by challenge.created_at asc, challenge.id asc
  limit 1;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'GROUP_INVITE_GUEST_PREVIEW',
    'code', 'PREVIEW_READY',
    'preview', pg_catalog.jsonb_build_object(
      'group_name', v_group_name,
      'inviter_name', v_inviter_name,
      'shared_promise', v_shared_promise,
      'privacy', v_privacy,
      'expires_at', v_expires_at
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.event_get_invite_entry_summary_v2(p_event_id uuid, p_actor_id uuid DEFAULT NULL::uuid, p_share_token_hash text DEFAULT NULL::text, p_invite_token_hash text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_event public.event_events%rowtype;
  v_occurrence public.event_occurrences%rowtype;
  v_invite_id uuid;
  v_inviter_name text;
  v_summary jsonb;
begin
  select event.*
  into v_event
  from public.event_events event
  where event.id = p_event_id
    and event.status = 'published'
  limit 1;

  if not found then
    return private.event_result_v1(
      'get_event_summary',
      null,
      'failed',
      'EVENT_UNAVAILABLE',
      'This event is not available.',
      null
    );
  end if;

  if p_actor_id is not null
     and v_event.organiser_id is not null
     and private.users_have_block_relationship_v1(
       p_actor_id,
       v_event.organiser_id
     ) then
    return private.event_result_v1(
      'get_event_summary',
      null,
      'failed',
      'EVENT_UNAVAILABLE',
      'This event is not available.',
      null
    );
  end if;

  select occurrence.*
  into v_occurrence
  from public.event_occurrences occurrence
  where occurrence.event_id = v_event.id
    and occurrence.state in ('scheduled', 'live')
  order by occurrence.starts_at asc
  limit 1;

  if not found then
    return private.event_result_v1(
      'get_event_summary',
      null,
      'failed',
      'EVENT_UNAVAILABLE',
      'This event is not available.',
      null
    );
  end if;

  if p_invite_token_hash is not null then
    select
      invite.id,
      coalesce(
        nullif(pg_catalog.btrim(profile.display_name), ''),
        nullif(pg_catalog.btrim(profile.username), ''),
        'An event organiser'
      )
    into v_invite_id, v_inviter_name
    from public.event_invites invite
    left join public.profiles profile
      on profile.id = v_event.organiser_id
    where invite.event_id = v_event.id
      and invite.token_hash = p_invite_token_hash
      and invite.revoked_at is null
      and (invite.expires_at is null or invite.expires_at > now())
      and (invite.occurrence_id is null or invite.occurrence_id = v_occurrence.id)
      and invite.use_count < invite.max_uses
      and (
        invite.issued_to_user_id is null
        or invite.issued_to_user_id = p_actor_id
      )
    limit 1;
  end if;

  if v_event.visibility = 'invite_only' and v_invite_id is null then
    return private.event_result_v1(
      'get_event_summary',
      null,
      'failed',
      'EVENT_UNAVAILABLE',
      'This event is not available.',
      null
    );
  end if;

  v_summary := public.event_get_event_summary_v1(
    p_event_id,
    p_share_token_hash,
    p_invite_token_hash
  );

  if v_invite_id is not null
     and v_summary ->> 'outcome' = 'completed'
     and pg_catalog.jsonb_typeof(v_summary -> 'data') = 'object' then
    return pg_catalog.jsonb_set(
      v_summary,
      '{data,inviterName}',
      pg_catalog.to_jsonb(v_inviter_name),
      true
    );
  end if;

  return v_summary;
end;
$function$;

CREATE OR REPLACE FUNCTION private.resolve_challenge_join_target_v1(p_actor_id uuid, p_challenge_id uuid, p_invite_code text)
 RETURNS TABLE(resolution_code text, resolved_challenge_id uuid, challenge_title text, challenge_description text, group_id uuid, group_name text, is_member boolean, verification_description text, submission_text text, start_date timestamp with time zone, end_date timestamp with time zone, submission_expectations jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_code text := pg_catalog.upper(
    pg_catalog.regexp_replace(
      pg_catalog.btrim(coalesce(p_invite_code, '')),
      '[[:space:]-]+',
      '',
      'g'
    )
  );
  v_invite public.invite_codes%rowtype;
  v_challenge public.challenges%rowtype;
  v_resolved_group_id uuid;
  v_group_status text;
  v_invite_authorised boolean := false;
  v_can_view boolean := false;
begin
  if p_actor_id is null or (p_challenge_id is null and v_code = '') then
    resolution_code := 'INVALID_REQUEST';
    return next;
    return;
  end if;

  if v_code <> '' then
    if v_code !~ '^[A-Z0-9]{4,32}$' then
      resolution_code := 'INVALID_INVITE';
      return next;
      return;
    end if;

    select invite.*
    into v_invite
    from public.invite_codes invite
    where invite.code = v_code
      and invite.type = 'challenge'
    limit 1;

    if not found then
      resolution_code := 'INVALID_INVITE';
      return next;
      return;
    end if;

    if v_invite.expires_at is not null and v_invite.expires_at <= now() then
      resolution_code := 'INVITE_EXPIRED';
      return next;
      return;
    end if;

    if p_challenge_id is not null and p_challenge_id <> v_invite.ref_id then
      resolution_code := 'INVALID_REQUEST';
      return next;
      return;
    end if;

    resolved_challenge_id := v_invite.ref_id;
    v_invite_authorised := true;
  else
    resolved_challenge_id := p_challenge_id;
  end if;

  select challenge.*
  into v_challenge
  from public.challenges challenge
  where challenge.id = resolved_challenge_id
  limit 1;

  if not found then
    resolution_code := 'CHALLENGE_NOT_FOUND';
    return next;
    return;
  end if;

  select team.id, team.name, team.status
  into v_resolved_group_id, group_name, v_group_status
  from public.team_challenges linked
  join public.teams team on team.id = linked.group_id
  where linked.challenge_id = v_challenge.id
  order by linked.created_at asc, linked.group_id asc
  limit 1;

  group_id := v_resolved_group_id;

  select exists (
    select 1
    from public.challenge_participants participant
    where participant.challenge_id = v_challenge.id
      and participant.user_id = p_actor_id
  ) into is_member;

  v_can_view :=
    v_invite_authorised
    or v_challenge.is_public
    or v_challenge.creator_id = p_actor_id
    or is_member
    or (
      v_resolved_group_id is not null
      and exists (
        select 1
        from public.team_members member
        where member.group_id = v_resolved_group_id
          and member.user_id = p_actor_id
      )
    );

  if not v_can_view then
    resolution_code := 'CHALLENGE_NOT_FOUND';
    resolved_challenge_id := null;
    group_id := null;
    group_name := null;
    return next;
    return;
  end if;

  if v_challenge.status <> 'active'
     or v_challenge.completion_status <> 'active'
     or (v_challenge.end_date is not null and v_challenge.end_date <= now()) then
    resolution_code := 'CHALLENGE_INACTIVE';
    return next;
    return;
  end if;

  if v_resolved_group_id is not null and v_group_status <> 'active' then
    resolution_code := 'GROUP_INACTIVE';
    return next;
    return;
  end if;

  if v_challenge.allow_self_review
     and v_challenge.creator_id <> p_actor_id then
    resolution_code := 'SOLO_CHALLENGE';
    return next;
    return;
  end if;

  resolution_code := 'READY';
  challenge_title := v_challenge.title;
  challenge_description := v_challenge.description;
  verification_description := v_challenge.verification_description;
  submission_text := v_challenge.submission_text;
  start_date := v_challenge.start_date;
  end_date := v_challenge.end_date;
  submission_expectations := v_challenge.submission_expectations;
  return next;
end;
$function$;

CREATE OR REPLACE FUNCTION private.enforce_single_saved_group_link_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_group_kind text;
  v_conflict boolean := false;
begin
  select team.kind
  into v_group_kind
  from public.teams team
  where team.id = new.group_id;

  if v_group_kind is distinct from 'saved' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-saved-group-link:' || new.challenge_id::text,
      0
    )
  );

  if tg_op = 'UPDATE' then
    select exists (
      select 1
      from public.team_challenges link
      join public.teams team on team.id = link.group_id
      where link.challenge_id = new.challenge_id
        and team.kind = 'saved'
        and not (
          link.group_id = old.group_id
          and link.challenge_id = old.challenge_id
        )
        and link.group_id <> new.group_id
    ) into v_conflict;
  else
    select exists (
      select 1
      from public.team_challenges link
      join public.teams team on team.id = link.group_id
      where link.challenge_id = new.challenge_id
        and team.kind = 'saved'
        and link.group_id <> new.group_id
    ) into v_conflict;
  end if;

  if v_conflict then
    raise exception 'PROMISE_SAVED_GROUP_LINK_EXISTS'
      using errcode = '23505';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.attach_personal_promise_to_saved_group_v1(p_challenge_id uuid, p_group_id uuid, p_client_event_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_id uuid := auth.uid();
  v_challenge public.challenges%rowtype;
  v_group public.teams%rowtype;
  v_existing private.promise_saved_group_link_receipts_v1%rowtype;
  v_existing_saved_group_id uuid;
  v_receipt_id uuid := pg_catalog.gen_random_uuid();
  v_request_hash text;
  v_container_result jsonb;
  v_has_promise_container boolean := false;
  v_can_administer boolean := false;
  v_linked_at timestamptz;
  v_response jsonb;
begin
  if v_actor_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'AUTH_REQUIRED'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'AUTH_SESSION_REVOKED'
    );
  end if;

  if p_challenge_id is null
     or p_group_id is null
     or p_client_event_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'INVALID_REQUEST'
    );
  end if;

  v_request_hash := pg_catalog.md5(
    p_challenge_id::text || ':' || p_group_id::text
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-saved-group-link-event:' || v_actor_id::text || ':' ||
        p_client_event_id::text,
      0
    )
  );

  select receipt.*
  into v_existing
  from private.promise_saved_group_link_receipts_v1 receipt
  where receipt.actor_id = v_actor_id
    and receipt.client_event_id = p_client_event_id;

  if found then
    if v_existing.request_hash <> v_request_hash then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'operation', 'PROMISE_SAVED_GROUP_LINK',
        'code', 'IDEMPOTENCY_MISMATCH'
      );
    end if;

    return pg_catalog.jsonb_set(
      v_existing.response,
      '{receipt,idempotent}',
      'true'::jsonb,
      true
    );
  end if;

  -- Follow the same lock order as ensure_promise_accountability_v1 before
  -- locking the challenge row, then serialise every saved-group attachment for
  -- that promise.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-accountability:' || p_challenge_id::text,
      0
    )
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'promise-saved-group-link:' || p_challenge_id::text,
      0
    )
  );

  select challenge.*
  into v_challenge
  from public.challenges challenge
  where challenge.id = p_challenge_id
    and challenge.creator_id = v_actor_id
    and challenge.status = 'active'
    and challenge.completion_status = 'active'
    and not coalesce(challenge.is_public, false)
    and not coalesce(challenge.is_expired, false)
    and (challenge.end_date is null or challenge.end_date > now())
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'PROMISE_NOT_AVAILABLE'
    );
  end if;

  select team.*
  into v_group
  from public.teams team
  where team.id = p_group_id
    and team.kind = 'saved'
    and team.status = 'active'
    and team.archived_at is null
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'GROUP_NOT_AVAILABLE'
    );
  end if;

  select
    v_group.owner_id = v_actor_id
    or exists (
      select 1
      from public.team_members membership
      where membership.group_id = v_group.id
        and membership.user_id = v_actor_id
        and membership.role in ('owner', 'admin')
    )
  into v_can_administer;

  if not coalesce(v_can_administer, false) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'GROUP_NOT_AVAILABLE'
    );
  end if;

  if v_group.owner_id <> v_actor_id
     and private.users_have_block_relationship_v1(
       v_actor_id,
       v_group.owner_id
     ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'GROUP_NOT_AVAILABLE'
    );
  end if;

  -- A confirmed member row is the current saved-group membership contract.
  -- Do not expose a personal promise to a member who has a block relationship
  -- with its owner.
  if exists (
    select 1
    from public.team_members membership
    where membership.group_id = v_group.id
      and membership.user_id <> v_actor_id
      and private.users_have_block_relationship_v1(
        v_actor_id,
        membership.user_id
      )
  ) then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'GROUP_NOT_AVAILABLE'
    );
  end if;

  select link.group_id
  into v_existing_saved_group_id
  from public.team_challenges link
  join public.teams team on team.id = link.group_id
  where link.challenge_id = v_challenge.id
    and team.kind = 'saved'
  order by link.created_at asc, link.group_id asc
  limit 1;

  if v_existing_saved_group_id is not null
     and v_existing_saved_group_id <> v_group.id then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'PROMISE_ALREADY_LINKED'
    );
  end if;

  -- The automatic promise-scoped accountability container remains the owner
  -- of direct role invitations. The saved-group link is additive and never
  -- replaces or re-kinds that container.
  v_container_result := public.ensure_promise_accountability_v1(
    v_challenge.id,
    'partner'
  );

  if coalesce(v_container_result ->> 'success', 'false') <> 'true' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'operation', 'PROMISE_SAVED_GROUP_LINK',
      'code', 'PROMISE_ACCOUNTABILITY_UNAVAILABLE'
    );
  end if;

  select exists (
    select 1
    from public.team_challenges link
    join public.teams team on team.id = link.group_id
    where link.challenge_id = v_challenge.id
      and team.kind = 'promise'
      and team.status = 'active'
  ) into v_has_promise_container;

  if not coalesce(v_has_promise_container, false) then
    raise exception 'PROMISE_ACCOUNTABILITY_CONTAINER_MISSING'
      using errcode = 'P0001';
  end if;

  if v_existing_saved_group_id is null then
    update public.challenges challenge
    set
      allow_self_review = false,
      submission_expectations =
        coalesce(challenge.submission_expectations, '{}'::jsonb)
        || pg_catalog.jsonb_build_object(
          'requires_peer_review', true,
          'reviewers_required', 1
        ),
      updated_at = now()
    where challenge.id = v_challenge.id;

    insert into public.team_challenges (group_id, challenge_id)
    values (v_group.id, v_challenge.id)
    returning created_at into v_linked_at;
  else
    select link.created_at
    into v_linked_at
    from public.team_challenges link
    where link.group_id = v_group.id
      and link.challenge_id = v_challenge.id;
  end if;

  v_response := pg_catalog.jsonb_build_object(
    'success', true,
    'operation', 'PROMISE_SAVED_GROUP_LINK',
    'status', 'confirmed',
    'code', case
      when v_existing_saved_group_id is null then 'PROMISE_LINKED'
      else 'PROMISE_ALREADY_LINKED_TO_GROUP'
    end,
    'receipt', pg_catalog.jsonb_build_object(
      'receipt_id', v_receipt_id,
      'client_event_id', p_client_event_id,
      'challenge_id', v_challenge.id,
      'challenge_title', v_challenge.title,
      'group_id', v_group.id,
      'group_name', v_group.name,
      'linked_at', v_linked_at,
      'promise_container_preserved', true,
      'confirmed_members_can_view', true,
      'review_authority', 'confirmed_saved_group_members',
      'idempotent', v_existing_saved_group_id is not null
    )
  );

  insert into private.promise_saved_group_link_receipts_v1 (
    id,
    actor_id,
    client_event_id,
    challenge_id,
    group_id,
    request_hash,
    response
  ) values (
    v_receipt_id,
    v_actor_id,
    p_client_event_id,
    v_challenge.id,
    v_group.id,
    v_request_hash,
    v_response
  );

  return v_response;
end;
$function$;

CREATE OR REPLACE FUNCTION private.record_proof_ad_break_cadence_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_next_ordinal bigint;
begin
  -- Corrections preserve the original proof history but do not advance the
  -- advertising cadence.
  if new.replaces_submission_id is not null then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'proof-ad-break:' || new.user_id::text,
      0
    )
  );

  if exists (
    select 1
    from private.proof_ad_break_cadence cadence
    where cadence.submission_id = new.id
  ) then
    return new;
  end if;

  select coalesce(max(cadence.ordinal), 0) + 1
  into v_next_ordinal
  from private.proof_ad_break_cadence cadence
  where cadence.user_id = new.user_id;

  insert into private.proof_ad_break_cadence (
    submission_id,
    user_id,
    ordinal
  )
  values (
    new.id,
    new.user_id,
    v_next_ordinal
  )
  on conflict (submission_id) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_proof_ad_break_hint(p_submission_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_cadence private.proof_ad_break_cadence%rowtype;
  v_is_pro boolean;
  v_reconciliation_pending boolean;
begin
  if v_user_id is null or p_submission_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_ELIGIBLE'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'SESSION_REVOKED'
    );
  end if;

  select authority.is_pro, authority.reconciliation_pending
  into v_is_pro, v_reconciliation_pending
  from public.get_my_pro_authority() authority;

  if not found
    or coalesce(v_is_pro, true)
    or coalesce(v_reconciliation_pending, true)
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_ELIGIBLE'
    );
  end if;

  select cadence.*
  into v_cadence
  from private.proof_ad_break_cadence cadence
  where cadence.submission_id = p_submission_id
    and cadence.user_id = v_user_id;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_ELIGIBLE'
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'submissionId', v_cadence.submission_id,
    'ordinal', v_cadence.ordinal,
    'due', (v_cadence.ordinal % 2 = 0 and v_cadence.claimed_at is null),
    'claimed', v_cadence.claimed_at is not null
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.claim_proof_ad_break(p_submission_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_cadence private.proof_ad_break_cadence%rowtype;
  v_is_pro boolean;
  v_reconciliation_pending boolean;
  v_daily_limit integer := 5;
  v_cooldown_seconds integer := 120;
  v_recent_count integer := 0;
  v_latest_claim timestamptz;
  v_now timestamptz := pg_catalog.now();
begin
  if v_user_id is null or p_submission_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_ELIGIBLE'
    );
  end if;

  if not public.current_session_is_active() then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'SESSION_REVOKED'
    );
  end if;

  select authority.is_pro, authority.reconciliation_pending
  into v_is_pro, v_reconciliation_pending
  from public.get_my_pro_authority() authority;

  if not found
    or coalesce(v_is_pro, true)
    or coalesce(v_reconciliation_pending, true)
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_ELIGIBLE'
    );
  end if;

  begin
    select
      greatest(
        1,
        coalesce((config.value::jsonb #>> '{ads,dailyLimit}')::integer, 5)
      ),
      greatest(
        0,
        coalesce((config.value::jsonb #>> '{ads,cooldownSeconds}')::integer, 120)
      )
    into v_daily_limit, v_cooldown_seconds
    from public.system_config config
    where config.key = 'economy_contract_v1'
    limit 1;
  exception when others then
    v_daily_limit := 5;
    v_cooldown_seconds := 120;
  end;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'proof-ad-break-claim:' || v_user_id::text,
      0
    )
  );

  select cadence.*
  into v_cadence
  from private.proof_ad_break_cadence cadence
  where cadence.submission_id = p_submission_id
    and cadence.user_id = v_user_id
  for update;

  if not found or v_cadence.ordinal % 2 <> 0 then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'NOT_DUE'
    );
  end if;

  if v_cadence.claimed_at is not null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'ALREADY_CLAIMED',
      'ordinal', v_cadence.ordinal
    );
  end if;

  select count(*), max(cadence.claimed_at)
  into v_recent_count, v_latest_claim
  from private.proof_ad_break_cadence cadence
  where cadence.user_id = v_user_id
    and cadence.claimed_at >= v_now - interval '1 day';

  if coalesce(v_recent_count, 0) >= v_daily_limit then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'DAILY_LIMIT'
    );
  end if;

  if v_latest_claim is not null
     and v_latest_claim >
       v_now - pg_catalog.make_interval(secs => v_cooldown_seconds)
  then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'code', 'COOLDOWN'
    );
  end if;

  update private.proof_ad_break_cadence cadence
  set claimed_at = v_now
  where cadence.submission_id = v_cadence.submission_id;

  -- The claim is deliberately consumed before the client loads an ad. A
  -- no-fill, consent refusal, background transition, SDK error, timeout, or
  -- process termination must not make this ordinal appear again.
  return pg_catalog.jsonb_build_object(
    'success', true,
    'code', 'CLAIMED',
    'submissionId', v_cadence.submission_id,
    'ordinal', v_cadence.ordinal
  );
end;
$function$;

ALTER TABLE "private"."account_activation_receipts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."account_activation_receipts" ADD CONSTRAINT "account_activation_receipts_first_promise_id_key" UNIQUE (first_promise_id);

ALTER TABLE "private"."account_activation_receipts" ADD CONSTRAINT "account_activation_receipts_pkey" PRIMARY KEY (user_id);

ALTER TABLE "private"."account_activation_receipts" ADD CONSTRAINT "account_activation_receipts_source_check" CHECK ((source = ANY (ARRAY['first_promise_v1'::text, 'legacy_existing_promise'::text])));

ALTER TABLE "private"."account_activation_receipts" ADD CONSTRAINT "account_activation_receipts_welcome_amount_check" CHECK ((((welcome_reward_outcome = ANY (ARRAY['granted_now'::text, 'already_confirmed'::text])) AND (welcome_reward_amount = 100) AND (welcome_ledger_reference IS NOT NULL)) OR ((welcome_reward_outcome = 'legacy_not_backfilled'::text) AND (welcome_reward_amount = 0) AND (welcome_ledger_reference IS NULL))));

ALTER TABLE "private"."account_activation_receipts" ADD CONSTRAINT "account_activation_receipts_welcome_outcome_check" CHECK ((welcome_reward_outcome = ANY (ARRAY['granted_now'::text, 'already_confirmed'::text, 'legacy_not_backfilled'::text])));

ALTER TABLE "private"."account_deletion_guards_v1" ALTER COLUMN "prepared_at" SET DEFAULT now();

ALTER TABLE "private"."account_deletion_guards_v1" ADD CONSTRAINT "account_deletion_guards_v1_check" CHECK ((expires_at > prepared_at));

ALTER TABLE "private"."account_deletion_guards_v1" ADD CONSTRAINT "account_deletion_guards_v1_pkey" PRIMARY KEY (actor_id);

ALTER TABLE "private"."challenge_join_receipts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "private"."challenge_join_receipts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."challenge_join_receipts" ADD CONSTRAINT "challenge_join_receipts_actor_id_client_event_id_key" UNIQUE (actor_id, client_event_id);

ALTER TABLE "private"."challenge_join_receipts" ADD CONSTRAINT "challenge_join_receipts_pkey" PRIMARY KEY (id);

ALTER TABLE "private"."challenge_join_receipts" ADD CONSTRAINT "challenge_join_receipts_request_hash_check" CHECK ((request_hash ~ '^[a-f0-9]{32}$'::text));

ALTER TABLE "private"."content_report_submission_receipts_v1" ALTER COLUMN "received_at" SET DEFAULT now();

ALTER TABLE "private"."content_report_submission_receipts_v1" ADD CONSTRAINT "content_report_receipt_hash_check" CHECK ((facts_hash ~ '^[0-9a-f]{64}$'::text));

ALTER TABLE "private"."content_report_submission_receipts_v1" ADD CONSTRAINT "content_report_receipt_reason_check" CHECK ((reason = ANY (ARRAY['spam'::text, 'inappropriate'::text, 'harassment'::text, 'copyright'::text, 'misleading'::text, 'other'::text])));

ALTER TABLE "private"."content_report_submission_receipts_v1" ADD CONSTRAINT "content_report_receipt_target_type_check" CHECK ((target_type = ANY (ARRAY['verification'::text, 'group'::text, 'challenge'::text, 'user'::text])));

ALTER TABLE "private"."content_report_submission_receipts_v1" ADD CONSTRAINT "content_report_submission_receipts_v1_pkey" PRIMARY KEY (reporter_id, client_event_id);

ALTER TABLE "private"."economy_creation_events_v1" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."economy_creation_events_v1" ADD CONSTRAINT "economy_creation_events_v1_action_check" CHECK ((action = ANY (ARRAY['create_challenge'::text, 'create_group'::text])));

ALTER TABLE "private"."economy_creation_events_v1" ADD CONSTRAINT "economy_creation_events_v1_pkey" PRIMARY KEY (user_id, action, entity_id);

ALTER TABLE "private"."first_creation_use_v1" ALTER COLUMN "consumed_at" SET DEFAULT now();

ALTER TABLE "private"."first_creation_use_v1" ADD CONSTRAINT "first_creation_use_v1_action_check" CHECK ((action = ANY (ARRAY['create_challenge'::text, 'create_group'::text])));

ALTER TABLE "private"."first_creation_use_v1" ADD CONSTRAINT "first_creation_use_v1_pkey" PRIMARY KEY (user_id, action);

ALTER TABLE "private"."first_miss_recovery_receipts" ALTER COLUMN "claimed_at" SET DEFAULT now();

ALTER TABLE "private"."first_miss_recovery_receipts" ADD CONSTRAINT "first_miss_recovery_receipts_pkey" PRIMARY KEY (user_id);

ALTER TABLE "private"."first_participation_join_v1" ALTER COLUMN "consumed_at" SET DEFAULT now();

ALTER TABLE "private"."first_participation_join_v1" ADD CONSTRAINT "first_participation_join_v1_pkey" PRIMARY KEY (user_id);

ALTER TABLE "private"."group_invite_replacements" ALTER COLUMN "replaced_at" SET DEFAULT now();

ALTER TABLE "private"."group_invite_replacements" ADD CONSTRAINT "group_invite_replacements_pkey" PRIMARY KEY (invite_code);

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_first_promise_receipts_first_promise_id_key" UNIQUE (first_promise_id);

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_first_promise_receipts_group_id_key" UNIQUE (group_id);

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_first_promise_receipts_pkey" PRIMARY KEY (user_id);

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_receipt_balance_check" CHECK ((economy_balance >= 0));

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_receipt_cost_check" CHECK ((economy_cost = 0));

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_receipt_date_range_check" CHECK ((((group_end_date - group_start_date) + 1) = group_duration_days));

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_receipt_duration_check" CHECK ((group_duration_days = ANY (ARRAY[7, 14, 30])));

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_receipt_privacy_check" CHECK ((request_privacy = ANY (ARRAY['public'::text, 'private'::text])));

ALTER TABLE "private"."promise_accountability_invite_roles" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."promise_accountability_invite_roles" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "private"."promise_accountability_invite_roles" ADD CONSTRAINT "promise_accountability_invite_role_check" CHECK ((role = ANY (ARRAY['partner'::text, 'reviewer'::text, 'supporter'::text])));

ALTER TABLE "private"."promise_accountability_invite_roles" ADD CONSTRAINT "promise_accountability_invite_roles_pkey" PRIMARY KEY (invite_code);

ALTER TABLE "private"."promise_accountability_members" ALTER COLUMN "joined_at" SET DEFAULT now();

ALTER TABLE "private"."promise_accountability_members" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "private"."promise_accountability_members" ADD CONSTRAINT "promise_accountability_member_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'partner'::text, 'reviewer'::text, 'supporter'::text])));

ALTER TABLE "private"."promise_accountability_members" ADD CONSTRAINT "promise_accountability_members_pkey" PRIMARY KEY (challenge_id, user_id);

ALTER TABLE "private"."promise_mutation_receipts_v1" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."promise_mutation_receipts_v1" ADD CONSTRAINT "promise_mutation_receipts_v1_operation_check" CHECK ((operation = ANY (ARRAY['leave'::text, 'delete'::text])));

ALTER TABLE "private"."promise_mutation_receipts_v1" ADD CONSTRAINT "promise_mutation_receipts_v1_pkey" PRIMARY KEY (actor_id, client_event_id);

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ALTER COLUMN "completed_at" SET DEFAULT now();

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ADD CONSTRAINT "promise_saved_group_link_receipts__actor_id_client_event_id_key" UNIQUE (actor_id, client_event_id);

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ADD CONSTRAINT "promise_saved_group_link_receipts_v1_pkey" PRIMARY KEY (id);

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ADD CONSTRAINT "promise_saved_group_link_receipts_v1_request_hash_check" CHECK ((request_hash ~ '^[a-f0-9]{32}$'::text));

ALTER TABLE "private"."proof_ad_break_cadence" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."proof_ad_break_cadence" ADD CONSTRAINT "proof_ad_break_cadence_ordinal_check" CHECK ((ordinal > 0));

ALTER TABLE "private"."proof_ad_break_cadence" ADD CONSTRAINT "proof_ad_break_cadence_pkey" PRIMARY KEY (submission_id);

ALTER TABLE "private"."proof_ad_break_cadence" ADD CONSTRAINT "proof_ad_break_cadence_user_id_ordinal_key" UNIQUE (user_id, ordinal);

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ADD CONSTRAINT "revenuecat_ad_reward_receipts_amount_check" CHECK ((amount >= 0));

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ADD CONSTRAINT "revenuecat_ad_reward_receipts_new_balance_check" CHECK (((new_balance IS NULL) OR (new_balance >= 0)));

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ADD CONSTRAINT "revenuecat_ad_reward_receipts_pkey" PRIMARY KEY (client_transaction_id);

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ADD CONSTRAINT "revenuecat_ad_reward_receipts_provider_event_id_key" UNIQUE (provider_event_id);

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ADD CONSTRAINT "revenuecat_ad_reward_receipts_status_check" CHECK ((status = ANY (ARRAY['applied'::text, 'ignored'::text, 'retry'::text])));

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ADD CONSTRAINT "revenuecat_ad_reward_receipts_virtual_currency_transaction__key" UNIQUE (virtual_currency_transaction_id);

ALTER TABLE "private"."saved_group_creation_receipts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "private"."saved_group_creation_receipts" ALTER COLUMN "state" SET DEFAULT 'pending'::text;

ALTER TABLE "private"."saved_group_creation_receipts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "private"."saved_group_creation_receipts" ADD CONSTRAINT "saved_group_creation_receipts_actor_id_client_event_id_key" UNIQUE (actor_id, client_event_id);

ALTER TABLE "private"."saved_group_creation_receipts" ADD CONSTRAINT "saved_group_creation_receipts_pkey" PRIMARY KEY (id);

ALTER TABLE "private"."saved_group_creation_receipts" ADD CONSTRAINT "saved_group_creation_receipts_request_hash_check" CHECK ((request_hash ~ '^[a-f0-9]{32}$'::text));

ALTER TABLE "private"."saved_group_creation_receipts" ADD CONSTRAINT "saved_group_creation_receipts_state_check" CHECK ((state = ANY (ARRAY['pending'::text, 'unknown'::text, 'retryable'::text, 'confirmed'::text, 'failed'::text])));

ALTER TABLE "private"."storage_upload_usage_v1" ALTER COLUMN "created_at" SET DEFAULT clock_timestamp();

ALTER TABLE "private"."storage_upload_usage_v1" ADD CONSTRAINT "storage_upload_usage_v1_bucket_id_check" CHECK ((bucket_id = ANY (ARRAY['challenge-verifications'::text, 'profile-pictures'::text, 'support-attachments'::text])));

ALTER TABLE "private"."storage_upload_usage_v1" ADD CONSTRAINT "storage_upload_usage_v1_byte_size_check" CHECK ((byte_size > 0));

ALTER TABLE "private"."storage_upload_usage_v1" ADD CONSTRAINT "storage_upload_usage_v1_pkey" PRIMARY KEY (id);

ALTER TABLE "private"."user_block_submission_receipts_v1" ALTER COLUMN "received_at" SET DEFAULT now();

ALTER TABLE "private"."user_block_submission_receipts_v1" ADD CONSTRAINT "user_block_receipt_hash_check" CHECK ((facts_hash ~ '^[0-9a-f]{64}$'::text));

ALTER TABLE "private"."user_block_submission_receipts_v1" ADD CONSTRAINT "user_block_receipt_no_self_check" CHECK ((blocker_id <> blocked_user_id));

ALTER TABLE "private"."user_block_submission_receipts_v1" ADD CONSTRAINT "user_block_submission_receipts_v1_pkey" PRIMARY KEY (blocker_id, client_event_id);

ALTER TABLE "public"."app_flow_returns" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."app_flow_returns" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."app_flow_returns" ALTER COLUMN "expires_at" SET DEFAULT (now() + '24:00:00'::interval);

ALTER TABLE "public"."app_flow_returns" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."app_flow_returns" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."app_flow_returns" ADD CONSTRAINT "app_flow_returns_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."app_update_policies" ALTER COLUMN "schema_version" SET DEFAULT 1;

ALTER TABLE "public"."app_update_policies" ALTER COLUMN "enabled" SET DEFAULT false;

ALTER TABLE "public"."app_update_policies" ALTER COLUMN "mode" SET DEFAULT 'optional'::text;

ALTER TABLE "public"."app_update_policies" ALTER COLUMN "ios_store_available" SET DEFAULT false;

ALTER TABLE "public"."app_update_policies" ALTER COLUMN "android_store_available" SET DEFAULT false;

ALTER TABLE "public"."app_update_policies" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."app_update_policies" ADD CONSTRAINT "app_update_policies_mode_check" CHECK ((mode = ANY (ARRAY['optional'::text, 'required'::text])));

ALTER TABLE "public"."app_update_policies" ADD CONSTRAINT "app_update_policies_pkey" PRIMARY KEY (key);

ALTER TABLE "public"."app_update_policies" ADD CONSTRAINT "app_update_policies_schema_version_check" CHECK ((schema_version = 1));

ALTER TABLE "public"."beta_waitlist" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."beta_waitlist" ALTER COLUMN "platform" SET DEFAULT 'not_sure'::text;

ALTER TABLE "public"."beta_waitlist" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."beta_waitlist" ADD CONSTRAINT "beta_waitlist_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."beta_waitlist" ADD CONSTRAINT "beta_waitlist_platform_check" CHECK ((platform = ANY (ARRAY['ios'::text, 'android'::text, 'both'::text, 'not_sure'::text])));

ALTER TABLE "public"."blocked_users" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."blocked_users" ADD CONSTRAINT "blocked_users_no_self_block" CHECK ((blocker_id <> blocked_user_id));

ALTER TABLE "public"."blocked_users" ADD CONSTRAINT "blocked_users_pkey" PRIMARY KEY (blocker_id, blocked_user_id);

ALTER TABLE "public"."buddy_streaks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."buddy_streaks" ALTER COLUMN "status" SET DEFAULT 'active'::text;

ALTER TABLE "public"."buddy_streaks" ALTER COLUMN "current_count" SET DEFAULT 0;

ALTER TABLE "public"."buddy_streaks" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."buddy_streaks" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."buddy_streaks" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."buddy_streaks" ADD CONSTRAINT "buddy_streaks_current_count_check" CHECK ((current_count >= 0));

ALTER TABLE "public"."buddy_streaks" ADD CONSTRAINT "buddy_streaks_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."buddy_streaks" ADD CONSTRAINT "buddy_streaks_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'at_risk'::text, 'saved'::text, 'broken'::text, 'archived'::text])));

ALTER TABLE "public"."catalog_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."catalog_items" ALTER COLUMN "cost" SET DEFAULT 0;

ALTER TABLE "public"."catalog_items" ALTER COLUMN "price" SET DEFAULT 0;

ALTER TABLE "public"."catalog_items" ALTER COLUMN "is_available" SET DEFAULT true;

ALTER TABLE "public"."catalog_items" ALTER COLUMN "is_disabled" SET DEFAULT false;

ALTER TABLE "public"."catalog_items" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."catalog_items" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."catalog_items" ADD CONSTRAINT "catalog_items_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."catalog_items" ADD CONSTRAINT "catalog_items_sku_key" UNIQUE (sku);

ALTER TABLE "public"."catalog_items" ADD CONSTRAINT "catalog_items_unlock_streak_days_check" CHECK (((unlock_streak_days IS NULL) OR (unlock_streak_days > 0)));

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "status" SET DEFAULT 'active'::text;

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "joined_at" SET DEFAULT now();

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "completion_percentage" SET DEFAULT 0;

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "current_streak" SET DEFAULT 0;

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "longest_streak" SET DEFAULT 0;

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "at_risk" SET DEFAULT false;

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "streak_freezes_remaining" SET DEFAULT 0;

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "used_extensions" SET DEFAULT 0;

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "milestone_reached" SET DEFAULT 0;

ALTER TABLE "public"."challenge_participants" ALTER COLUMN "streak_outcome_tracking_started_at" SET DEFAULT clock_timestamp();

ALTER TABLE "public"."challenge_participants" ADD CONSTRAINT "challenge_participants_challenge_id_user_id_key" UNIQUE (challenge_id, user_id);

ALTER TABLE "public"."challenge_participants" ADD CONSTRAINT "challenge_participants_milestone_reached_check" CHECK ((milestone_reached >= 0));

ALTER TABLE "public"."challenge_participants" ADD CONSTRAINT "challenge_participants_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."challenge_submissions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."challenge_submissions" ALTER COLUMN "status" SET DEFAULT 'pending'::text;

ALTER TABLE "public"."challenge_submissions" ALTER COLUMN "submission_date" SET DEFAULT now();

ALTER TABLE "public"."challenge_submissions" ALTER COLUMN "client_event_id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_content_required" CHECK (((NULLIF(btrim(COALESCE(media_url, ''::text)), ''::text) IS NOT NULL) OR (NULLIF(btrim(COALESCE(submission_text, ''::text)), ''::text) IS NOT NULL)));

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_media_type_check" CHECK (((media_type IS NULL) OR (media_type = ANY (ARRAY['photo'::text, 'video'::text, 'text'::text]))));

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_submission_type_check" CHECK (((submission_type IS NULL) OR (submission_type = ANY (ARRAY['photo'::text, 'video'::text, 'text'::text]))));

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_text_content_required" CHECK (((media_type IS DISTINCT FROM 'text'::text) OR (NULLIF(btrim(COALESCE(submission_text, ''::text)), ''::text) IS NOT NULL)));

ALTER TABLE "public"."challenges" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."challenges" ALTER COLUMN "is_public" SET DEFAULT true;

ALTER TABLE "public"."challenges" ALTER COLUMN "status" SET DEFAULT 'active'::text;

ALTER TABLE "public"."challenges" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."challenges" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."challenges" ALTER COLUMN "completion_status" SET DEFAULT 'active'::text;

ALTER TABLE "public"."challenges" ALTER COLUMN "is_expired" SET DEFAULT false;

ALTER TABLE "public"."challenges" ALTER COLUMN "difficulty" SET DEFAULT 'medium'::text;

ALTER TABLE "public"."challenges" ALTER COLUMN "points_value" SET DEFAULT 200;

ALTER TABLE "public"."challenges" ALTER COLUMN "allow_extensions" SET DEFAULT true;

ALTER TABLE "public"."challenges" ALTER COLUMN "max_extensions" SET DEFAULT 2;

ALTER TABLE "public"."challenges" ALTER COLUMN "deadline_type" SET DEFAULT 'fixed'::text;

ALTER TABLE "public"."challenges" ALTER COLUMN "extension_count" SET DEFAULT 0;

ALTER TABLE "public"."challenges" ALTER COLUMN "allow_self_review" SET DEFAULT false;

ALTER TABLE "public"."challenges" ADD CONSTRAINT "challenges_completion_status_check" CHECK ((completion_status = ANY (ARRAY['active'::text, 'completed'::text, 'expired'::text, 'cancelled'::text])));

ALTER TABLE "public"."challenges" ADD CONSTRAINT "challenges_deadline_type_check" CHECK ((deadline_type = ANY (ARRAY['fixed'::text, 'flexible'::text, 'rolling'::text])));

ALTER TABLE "public"."challenges" ADD CONSTRAINT "challenges_difficulty_check" CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])));

ALTER TABLE "public"."challenges" ADD CONSTRAINT "challenges_duration_check" CHECK (((duration IS NULL) OR ((duration > 0) AND (duration <= 365))));

ALTER TABLE "public"."challenges" ADD CONSTRAINT "challenges_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."content_reports" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."content_reports" ALTER COLUMN "status" SET DEFAULT 'open'::text;

ALTER TABLE "public"."content_reports" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."content_reports" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."content_reports" ADD CONSTRAINT "content_reports_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."creation_attempts" ALTER COLUMN "id" SET DEFAULT nextval('creation_attempts_id_seq'::regclass);

ALTER TABLE "public"."creation_attempts" ALTER COLUMN "data" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."creation_attempts" ALTER COLUMN "timestamp" SET DEFAULT now();

ALTER TABLE "public"."creation_attempts" ALTER COLUMN "success" SET DEFAULT false;

ALTER TABLE "public"."creation_attempts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."creation_attempts" ADD CONSTRAINT "creation_attempts_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."creation_attempts" ADD CONSTRAINT "creation_attempts_type_check" CHECK (((type)::text = ANY ((ARRAY['group'::character varying, 'challenge'::character varying])::text[])));

ALTER TABLE "public"."daily_challenge_panels" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."daily_challenge_panels" ALTER COLUMN "panel_date" SET DEFAULT CURRENT_DATE;

ALTER TABLE "public"."daily_challenge_panels" ALTER COLUMN "status" SET DEFAULT 'due'::text;

ALTER TABLE "public"."daily_challenge_panels" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."daily_challenge_panels" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."daily_challenge_panels" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."daily_challenge_panels" ADD CONSTRAINT "daily_challenge_panels_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."daily_challenge_panels" ADD CONSTRAINT "daily_challenge_panels_status_check" CHECK ((status = ANY (ARRAY['due'::text, 'all_clear'::text, 'pending_review'::text, 'missed'::text, 'hidden'::text])));

ALTER TABLE "public"."daily_challenge_panels" ADD CONSTRAINT "daily_challenge_panels_user_id_panel_date_challenge_id_key" UNIQUE (user_id, panel_date, challenge_id);

ALTER TABLE "public"."edge_rate_limits" ALTER COLUMN "request_count" SET DEFAULT 0;

ALTER TABLE "public"."edge_rate_limits" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."edge_rate_limits" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."edge_rate_limits" ADD CONSTRAINT "edge_rate_limits_pkey" PRIMARY KEY (endpoint, actor_key, window_start);

ALTER TABLE "public"."equipped_items" ALTER COLUMN "equipped_at" SET DEFAULT now();

ALTER TABLE "public"."equipped_items" ALTER COLUMN "category" SET DEFAULT 'general'::text;

ALTER TABLE "public"."equipped_items" ADD CONSTRAINT "equipped_items_pkey" PRIMARY KEY (user_id, item_id);

ALTER TABLE "public"."event_action_receipts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_action_receipts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."event_action_receipts" ADD CONSTRAINT "event_action_receipts_action_check" CHECK ((action = ANY (ARRAY['create_event'::text, 'join'::text, 'leave'::text, 'check_in'::text, 'prepare_post_upload'::text, 'finalise_post'::text, 'review_post'::text, 'prepare_post_delete'::text, 'complete_post_delete'::text])));

ALTER TABLE "public"."event_action_receipts" ADD CONSTRAINT "event_action_receipts_actor_id_action_client_event_id_key" UNIQUE (actor_id, action, client_event_id);

ALTER TABLE "public"."event_action_receipts" ADD CONSTRAINT "event_action_receipts_check" CHECK ((((outcome IS NULL) AND (response IS NULL) AND (completed_at IS NULL)) OR ((outcome IS NOT NULL) AND (response IS NOT NULL) AND (completed_at IS NOT NULL))));

ALTER TABLE "public"."event_action_receipts" ADD CONSTRAINT "event_action_receipts_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_action_receipts" ADD CONSTRAINT "event_action_receipts_request_hash_check" CHECK ((request_hash ~ '^[a-f0-9]{64}$'::text));

ALTER TABLE "public"."event_attendances" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_attendances" ALTER COLUMN "state" SET DEFAULT 'joined'::menta_event_attendance_state;

ALTER TABLE "public"."event_attendances" ALTER COLUMN "joined_at" SET DEFAULT now();

ALTER TABLE "public"."event_attendances" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."event_attendances" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."event_attendances" ADD CONSTRAINT "event_attendances_occurrence_id_user_id_key" UNIQUE (occurrence_id, user_id);

ALTER TABLE "public"."event_attendances" ADD CONSTRAINT "event_attendances_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_audit_log" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_audit_log" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."event_audit_log" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."event_audit_log" ADD CONSTRAINT "event_audit_log_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_checkin_token_redemptions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_checkin_token_redemptions" ALTER COLUMN "redeemed_at" SET DEFAULT now();

ALTER TABLE "public"."event_checkin_token_redemptions" ADD CONSTRAINT "event_checkin_token_redemptions_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_checkin_token_redemptions" ADD CONSTRAINT "event_checkin_token_redemptions_token_id_user_id_key" UNIQUE (token_id, user_id);

ALTER TABLE "public"."event_checkin_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_checkin_tokens" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."event_checkin_tokens" ADD CONSTRAINT "event_checkin_tokens_check" CHECK ((((kind = 'rotating_qr'::menta_event_checkin_token_kind) AND (issued_to_user_id IS NULL) AND (consumed_at IS NULL) AND (consumed_by IS NULL)) OR ((kind = 'roster_single_use'::menta_event_checkin_token_kind) AND (issued_to_user_id IS NOT NULL))));

ALTER TABLE "public"."event_checkin_tokens" ADD CONSTRAINT "event_checkin_tokens_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_checkin_tokens" ADD CONSTRAINT "event_checkin_tokens_token_hash_check" CHECK ((token_hash ~ '^[a-f0-9]{64}$'::text));

ALTER TABLE "public"."event_checkin_tokens" ADD CONSTRAINT "event_checkin_tokens_token_hash_key" UNIQUE (token_hash);

ALTER TABLE "public"."event_checkins" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_checkins" ALTER COLUMN "checked_in_at" SET DEFAULT now();

ALTER TABLE "public"."event_checkins" ADD CONSTRAINT "event_checkins_attendance_id_key" UNIQUE (attendance_id);

ALTER TABLE "public"."event_checkins" ADD CONSTRAINT "event_checkins_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_events" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_events" ALTER COLUMN "time_zone" SET DEFAULT 'Pacific/Auckland'::text;

ALTER TABLE "public"."event_events" ALTER COLUMN "visibility" SET DEFAULT 'public'::menta_event_visibility;

ALTER TABLE "public"."event_events" ALTER COLUMN "status" SET DEFAULT 'draft'::menta_event_status;

ALTER TABLE "public"."event_events" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."event_events" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."event_events" ADD CONSTRAINT "event_events_check" CHECK ((((visibility = 'unlisted'::menta_event_visibility) AND (share_token_hash IS NOT NULL)) OR ((visibility <> 'unlisted'::menta_event_visibility) AND (share_token_hash IS NULL))));

ALTER TABLE "public"."event_events" ADD CONSTRAINT "event_events_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_events" ADD CONSTRAINT "event_events_share_token_hash_check" CHECK (((share_token_hash IS NULL) OR (share_token_hash ~ '^[a-f0-9]{64}$'::text)));

ALTER TABLE "public"."event_events" ADD CONSTRAINT "event_events_share_token_hash_key" UNIQUE (share_token_hash);

ALTER TABLE "public"."event_events" ADD CONSTRAINT "event_events_title_check" CHECK (((char_length(TRIM(BOTH FROM title)) >= 1) AND (char_length(TRIM(BOTH FROM title)) <= 120)));

ALTER TABLE "public"."event_invites" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_invites" ALTER COLUMN "max_uses" SET DEFAULT 1;

ALTER TABLE "public"."event_invites" ALTER COLUMN "use_count" SET DEFAULT 0;

ALTER TABLE "public"."event_invites" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."event_invites" ADD CONSTRAINT "event_invites_check" CHECK (((use_count >= 0) AND (use_count <= max_uses)));

ALTER TABLE "public"."event_invites" ADD CONSTRAINT "event_invites_max_uses_check" CHECK ((max_uses > 0));

ALTER TABLE "public"."event_invites" ADD CONSTRAINT "event_invites_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_invites" ADD CONSTRAINT "event_invites_token_hash_check" CHECK ((token_hash ~ '^[a-f0-9]{64}$'::text));

ALTER TABLE "public"."event_invites" ADD CONSTRAINT "event_invites_token_hash_key" UNIQUE (token_hash);

ALTER TABLE "public"."event_occurrences" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_occurrences" ALTER COLUMN "state" SET DEFAULT 'scheduled'::menta_event_occurrence_state;

ALTER TABLE "public"."event_occurrences" ALTER COLUMN "reserved_count" SET DEFAULT 0;

ALTER TABLE "public"."event_occurrences" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."event_occurrences" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."event_occurrences" ADD CONSTRAINT "event_occurrences_capacity_check" CHECK (((capacity IS NULL) OR (capacity > 0)));

ALTER TABLE "public"."event_occurrences" ADD CONSTRAINT "event_occurrences_check" CHECK ((ends_at > starts_at));

ALTER TABLE "public"."event_occurrences" ADD CONSTRAINT "event_occurrences_check1" CHECK ((checkin_closes_at >= checkin_opens_at));

ALTER TABLE "public"."event_occurrences" ADD CONSTRAINT "event_occurrences_check2" CHECK ((posting_closes_at >= posting_opens_at));

ALTER TABLE "public"."event_occurrences" ADD CONSTRAINT "event_occurrences_check3" CHECK (((capacity IS NULL) OR (reserved_count <= capacity)));

ALTER TABLE "public"."event_occurrences" ADD CONSTRAINT "event_occurrences_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_occurrences" ADD CONSTRAINT "event_occurrences_reserved_count_check" CHECK ((reserved_count >= 0));

ALTER TABLE "public"."event_posts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."event_posts" ALTER COLUMN "status" SET DEFAULT 'upload_pending'::menta_event_post_status;

ALTER TABLE "public"."event_posts" ALTER COLUMN "revision" SET DEFAULT 1;

ALTER TABLE "public"."event_posts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."event_posts" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_caption_check" CHECK (((caption IS NULL) OR (char_length(caption) <= 280)));

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_expected_byte_size_check" CHECK (((expected_byte_size > 0) AND (expected_byte_size <= 10000000)));

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_expected_content_type_check" CHECK ((expected_content_type = ANY (ARRAY['image/jpeg'::text, 'image/png'::text, 'image/webp'::text])));

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_review_note_check" CHECK (((review_note IS NULL) OR (char_length(review_note) <= 500)));

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_revision_check" CHECK ((revision > 0));

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_user_id_occurrence_id_client_event_id_key" UNIQUE (user_id, occurrence_id, client_event_id);

ALTER TABLE "public"."feature_requests" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."feature_requests" ALTER COLUMN "tags" SET DEFAULT '{}'::text[];

ALTER TABLE "public"."feature_requests" ALTER COLUMN "vote_count" SET DEFAULT 0;

ALTER TABLE "public"."feature_requests" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."feature_requests" ADD CONSTRAINT "feature_requests_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."feature_votes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."feature_votes" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."feature_votes" ADD CONSTRAINT "feature_votes_feature_request_id_user_identifier_key" UNIQUE (feature_request_id, user_identifier);

ALTER TABLE "public"."feature_votes" ADD CONSTRAINT "feature_votes_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."group_daily_status" ALTER COLUMN "submissions_count" SET DEFAULT 0;

ALTER TABLE "public"."group_daily_status" ALTER COLUMN "participants_count" SET DEFAULT 0;

ALTER TABLE "public"."group_daily_status" ALTER COLUMN "participation_rate" SET DEFAULT 0;

ALTER TABLE "public"."group_daily_status" ALTER COLUMN "last_computed_at" SET DEFAULT now();

ALTER TABLE "public"."group_daily_status" ADD CONSTRAINT "group_daily_status_pkey" PRIMARY KEY (group_id, local_date);

ALTER TABLE "public"."group_freeze_usages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."group_freeze_usages" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."group_freeze_usages" ADD CONSTRAINT "group_freeze_usages_group_id_used_for_date_key" UNIQUE (group_id, used_for_date);

ALTER TABLE "public"."group_freeze_usages" ADD CONSTRAINT "group_freeze_usages_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."group_streak_tracking" ALTER COLUMN "current_streak" SET DEFAULT 0;

ALTER TABLE "public"."group_streak_tracking" ALTER COLUMN "longest_streak" SET DEFAULT 0;

ALTER TABLE "public"."group_streak_tracking" ALTER COLUMN "total_successful_days" SET DEFAULT 0;

ALTER TABLE "public"."group_streak_tracking" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."group_streak_tracking" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."group_streak_tracking" ADD CONSTRAINT "group_streak_tracking_pkey" PRIMARY KEY (group_id);

ALTER TABLE "public"."inventory_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."inventory_items" ALTER COLUMN "quantity" SET DEFAULT 1;

ALTER TABLE "public"."inventory_items" ALTER COLUMN "is_equipped" SET DEFAULT false;

ALTER TABLE "public"."inventory_items" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."inventory_items" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_user_id_item_sku_key" UNIQUE (user_id, item_sku);

ALTER TABLE "public"."invite_codes" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."invite_codes" ADD CONSTRAINT "invite_codes_pkey" PRIMARY KEY (code);

ALTER TABLE "public"."invite_handoffs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."invite_handoffs" ALTER COLUMN "handoff_token" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."invite_handoffs" ALTER COLUMN "target_type" SET DEFAULT 'group'::text;

ALTER TABLE "public"."invite_handoffs" ALTER COLUMN "status" SET DEFAULT 'pending'::text;

ALTER TABLE "public"."invite_handoffs" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."invite_handoffs" ALTER COLUMN "expires_at" SET DEFAULT (now() + '24:00:00'::interval);

ALTER TABLE "public"."invite_handoffs" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."invite_handoffs" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."invite_handoffs" ADD CONSTRAINT "invite_handoffs_handoff_token_key" UNIQUE (handoff_token);

ALTER TABLE "public"."invite_handoffs" ADD CONSTRAINT "invite_handoffs_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."invite_handoffs" ADD CONSTRAINT "invite_handoffs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'claimed'::text, 'expired'::text, 'cancelled'::text])));

ALTER TABLE "public"."issues" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."issues" ALTER COLUMN "status" SET DEFAULT 'open'::text;

ALTER TABLE "public"."issues" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."issues" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."legal_acceptance_enforcement_settings" ALTER COLUMN "enforcement_mode" SET DEFAULT 'observe'::text;

ALTER TABLE "public"."legal_acceptance_enforcement_settings" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."legal_acceptance_enforcement_settings" ADD CONSTRAINT "legal_acceptance_enforcement_activation_check" CHECK ((((enforcement_mode = 'observe'::text) AND (activated_at IS NULL)) OR ((enforcement_mode = 'enforce'::text) AND (activated_at IS NOT NULL))));

ALTER TABLE "public"."legal_acceptance_enforcement_settings" ADD CONSTRAINT "legal_acceptance_enforcement_mode_check" CHECK ((enforcement_mode = ANY (ARRAY['observe'::text, 'enforce'::text])));

ALTER TABLE "public"."legal_acceptance_enforcement_settings" ADD CONSTRAINT "legal_acceptance_enforcement_scope_check" CHECK ((scope = 'promise_creation'::text));

ALTER TABLE "public"."legal_acceptance_enforcement_settings" ADD CONSTRAINT "legal_acceptance_enforcement_settings_pkey" PRIMARY KEY (scope);

ALTER TABLE "public"."legal_acceptance_receipts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."legal_acceptance_receipts" ALTER COLUMN "accepted_at" SET DEFAULT now();

ALTER TABLE "public"."legal_acceptance_receipts" ADD CONSTRAINT "legal_acceptance_receipts_app_build_check" CHECK (((length(btrim(app_build)) >= 1) AND (length(btrim(app_build)) <= 80)));

ALTER TABLE "public"."legal_acceptance_receipts" ADD CONSTRAINT "legal_acceptance_receipts_app_version_check" CHECK (((length(btrim(app_version)) >= 1) AND (length(btrim(app_version)) <= 80)));

ALTER TABLE "public"."legal_acceptance_receipts" ADD CONSTRAINT "legal_acceptance_receipts_locale_check" CHECK (((locale IS NULL) OR ((length(btrim(locale)) >= 1) AND (length(btrim(locale)) <= 35))));

ALTER TABLE "public"."legal_acceptance_receipts" ADD CONSTRAINT "legal_acceptance_receipts_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."legal_acceptance_receipts" ADD CONSTRAINT "legal_acceptance_receipts_platform_check" CHECK ((app_platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text, 'unknown'::text])));

ALTER TABLE "public"."legal_acceptance_receipts" ADD CONSTRAINT "legal_acceptance_receipts_surface_check" CHECK ((acceptance_surface = ANY (ARRAY['account_creation'::text, 'post_auth'::text, 'pre_authoring'::text, 'material_update'::text, 'settings'::text])));

ALTER TABLE "public"."legal_acceptance_receipts" ADD CONSTRAINT "legal_acceptance_receipts_user_id_terms_version_privacy_pol_key" UNIQUE (user_id, terms_version, privacy_policy_version, community_standards_version);

ALTER TABLE "public"."legal_document_versions" ALTER COLUMN "published_at" SET DEFAULT now();

ALTER TABLE "public"."legal_document_versions" ADD CONSTRAINT "legal_document_versions_pkey" PRIMARY KEY (document_type, document_version);

ALTER TABLE "public"."legal_document_versions" ADD CONSTRAINT "legal_document_versions_retirement_check" CHECK (((retired_at IS NULL) OR (retired_at >= effective_at)));

ALTER TABLE "public"."legal_document_versions" ADD CONSTRAINT "legal_document_versions_type_check" CHECK ((document_type = ANY (ARRAY['terms'::text, 'privacy'::text, 'community_standards'::text])));

ALTER TABLE "public"."legal_document_versions" ADD CONSTRAINT "legal_document_versions_url_check" CHECK ((document_url ~ '^https://menta\.quest/'::text));

ALTER TABLE "public"."legal_document_versions" ADD CONSTRAINT "legal_document_versions_version_check" CHECK (((length(btrim(document_version)) >= 1) AND (length(btrim(document_version)) <= 80)));

ALTER TABLE "public"."maintenance_logs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

ALTER TABLE "public"."maintenance_logs" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."maintenance_logs" ADD CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."maintenance_logs" ADD CONSTRAINT "maintenance_logs_status_check" CHECK ((status = ANY (ARRAY['started'::text, 'completed'::text, 'failed'::text])));

ALTER TABLE "public"."maintenance_runs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."maintenance_runs" ALTER COLUMN "run_timestamp" SET DEFAULT now();

ALTER TABLE "public"."maintenance_runs" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."maintenance_runs" ADD CONSTRAINT "maintenance_runs_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."maintenance_runs" ADD CONSTRAINT "maintenance_runs_status_check" CHECK ((status = ANY (ARRAY['triggered'::text, 'success'::text, 'error'::text])));

ALTER TABLE "public"."notification_jobs" ALTER COLUMN "id" SET DEFAULT nextval('notification_jobs_id_seq'::regclass);

ALTER TABLE "public"."notification_jobs" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."notification_jobs" ALTER COLUMN "scheduled_for" SET DEFAULT now();

ALTER TABLE "public"."notification_jobs" ALTER COLUMN "status" SET DEFAULT 'pending'::text;

ALTER TABLE "public"."notification_jobs" ALTER COLUMN "attempts" SET DEFAULT 0;

ALTER TABLE "public"."notification_jobs" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."notification_jobs" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."notification_jobs" ADD CONSTRAINT "notification_jobs_idempotency_key_key" UNIQUE (idempotency_key);

ALTER TABLE "public"."notification_jobs" ADD CONSTRAINT "notification_jobs_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."notification_jobs" ADD CONSTRAINT "notification_jobs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'delivered'::text, 'failed'::text, 'cancelled'::text])));

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "push_enabled" SET DEFAULT true;

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "email_enabled" SET DEFAULT false;

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "challenge_reminders" SET DEFAULT true;

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "group_updates" SET DEFAULT true;

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "streak_alerts" SET DEFAULT true;

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "timezone" SET DEFAULT 'UTC'::text;

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "remote_coach_contract_version" SET DEFAULT 0;

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "marketing_email_opt_in" SET DEFAULT false;

ALTER TABLE "public"."notification_preferences" ALTER COLUMN "marketing_email_provider_sync_pending" SET DEFAULT false;

ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_device_permission_status_check" CHECK (((device_permission_status IS NULL) OR (device_permission_status = ANY (ARRAY['granted'::text, 'denied'::text, 'undetermined'::text]))));

ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY (user_id);

ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_push_app_build_check" CHECK (((push_app_build IS NULL) OR (push_app_build > 0)));

ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_push_platform_check" CHECK (((push_platform IS NULL) OR (push_platform = ANY (ARRAY['ios'::text, 'android'::text]))));

ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_push_token_status_check" CHECK (((push_token_status IS NULL) OR (push_token_status = ANY (ARRAY['active'::text, 'invalid'::text, 'missing'::text]))));

ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_remote_coach_version_check" CHECK ((remote_coach_contract_version >= 0));

ALTER TABLE "public"."notification_templates" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."notification_templates" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."notification_templates" ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."notifications" ALTER COLUMN "is_read" SET DEFAULT false;

ALTER TABLE "public"."notifications" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."notifications" ALTER COLUMN "priority" SET DEFAULT 3;

ALTER TABLE "public"."notifications" ALTER COLUMN "delivery_attempts" SET DEFAULT 0;

ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_delivery_fallback_reason_check" CHECK (((delivery_fallback_reason IS NULL) OR (delivery_fallback_reason = 'ONESIGNAL_NO_VALID_SUBSCRIPTION'::text)));

ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."power_up_usage" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

ALTER TABLE "public"."power_up_usage" ALTER COLUMN "used_at" SET DEFAULT now();

ALTER TABLE "public"."power_up_usage" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."power_up_usage" ALTER COLUMN "is_active" SET DEFAULT true;

ALTER TABLE "public"."power_up_usage" ADD CONSTRAINT "power_up_usage_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."profiles" ALTER COLUMN "momenta_balance" SET DEFAULT 0;

ALTER TABLE "public"."profiles" ALTER COLUMN "has_completed_onboarding" SET DEFAULT false;

ALTER TABLE "public"."profiles" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."profiles" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."profiles" ALTER COLUMN "is_pro" SET DEFAULT false;

ALTER TABLE "public"."profiles" ALTER COLUMN "is_approved" SET DEFAULT true;

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_email_key" UNIQUE (email);

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_username_key" UNIQUE (username);

ALTER TABLE "public"."proof_encouragements" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."proof_encouragements" ADD CONSTRAINT "proof_encouragements_pkey" PRIMARY KEY (submission_id, user_id);

ALTER TABLE "public"."purchase_receipt_states" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."purchase_receipt_states" ALTER COLUMN "store" SET DEFAULT 'app_store'::text;

ALTER TABLE "public"."purchase_receipt_states" ALTER COLUMN "status" SET DEFAULT 'pending'::text;

ALTER TABLE "public"."purchase_receipt_states" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."purchase_receipt_states" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."purchase_receipt_states" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."purchase_receipt_states" ADD CONSTRAINT "purchase_receipt_states_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."purchase_receipt_states" ADD CONSTRAINT "purchase_receipt_states_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'acknowledged'::text, 'failed'::text, 'cancelled'::text])));

ALTER TABLE "public"."purchase_receipt_states" ADD CONSTRAINT "purchase_receipt_states_store_transaction_id_key" UNIQUE (store, transaction_id);

ALTER TABLE "public"."purchases" ALTER COLUMN "purchased_at" SET DEFAULT now();

ALTER TABLE "public"."purchases" ADD CONSTRAINT "purchases_pkey" PRIMARY KEY (user_id, item_id, purchased_at);

ALTER TABLE "public"."queued_proof_submissions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."queued_proof_submissions" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."queued_proof_submissions" ALTER COLUMN "status" SET DEFAULT 'queued'::text;

ALTER TABLE "public"."queued_proof_submissions" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."queued_proof_submissions" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."queued_proof_submissions" ADD CONSTRAINT "queued_proof_submissions_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."queued_proof_submissions" ADD CONSTRAINT "queued_proof_submissions_proof_type_check" CHECK ((proof_type = ANY (ARRAY['photo'::text, 'video'::text, 'text'::text])));

ALTER TABLE "public"."queued_proof_submissions" ADD CONSTRAINT "queued_proof_submissions_status_check" CHECK ((status = ANY (ARRAY['queued'::text, 'syncing'::text, 'submitted'::text, 'failed'::text, 'cancelled'::text])));

ALTER TABLE "public"."queued_proof_submissions" ADD CONSTRAINT "queued_proof_submissions_user_id_client_uuid_key" UNIQUE (user_id, client_uuid);

ALTER TABLE "public"."rc_credit_mappings" ALTER COLUMN "id" SET DEFAULT nextval('rc_credit_mappings_id_seq'::regclass);

ALTER TABLE "public"."rc_credit_mappings" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."rc_credit_mappings" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."rc_credit_mappings" ADD CONSTRAINT "rc_credit_mappings_credits_check" CHECK ((credits > 0));

ALTER TABLE "public"."rc_credit_mappings" ADD CONSTRAINT "rc_credit_mappings_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."rc_entitlements" ALTER COLUMN "id" SET DEFAULT nextval('rc_entitlements_id_seq'::regclass);

ALTER TABLE "public"."rc_entitlements" ALTER COLUMN "last_event_at" SET DEFAULT now();

ALTER TABLE "public"."rc_entitlements" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."rc_entitlements" ADD CONSTRAINT "rc_entitlements_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."rc_entitlements" ADD CONSTRAINT "rc_entitlements_user_key_unique" UNIQUE (user_id, entitlement_key);

ALTER TABLE "public"."rc_receipts" ALTER COLUMN "id" SET DEFAULT nextval('rc_receipts_id_seq'::regclass);

ALTER TABLE "public"."rc_receipts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."rc_receipts" ADD CONSTRAINT "rc_receipts_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."rc_receipts" ADD CONSTRAINT "rc_receipts_store_check" CHECK ((store = ANY (ARRAY['app_store'::text, 'play_store'::text, 'stripe'::text, 'amazon'::text, 'roku'::text])));

ALTER TABLE "public"."rc_receipts" ADD CONSTRAINT "rc_receipts_store_transaction_id_key" UNIQUE (store, transaction_id);

ALTER TABLE "public"."rc_webhook_events" ALTER COLUMN "entitlement_keys" SET DEFAULT '{}'::text[];

ALTER TABLE "public"."rc_webhook_events" ALTER COLUMN "reconciliation_keys" SET DEFAULT '{}'::text[];

ALTER TABLE "public"."rc_webhook_events" ALTER COLUMN "processing_status" SET DEFAULT 'received'::text;

ALTER TABLE "public"."rc_webhook_events" ALTER COLUMN "attempt_count" SET DEFAULT 1;

ALTER TABLE "public"."rc_webhook_events" ALTER COLUMN "received_at" SET DEFAULT now();

ALTER TABLE "public"."rc_webhook_events" ALTER COLUMN "last_attempt_at" SET DEFAULT now();

ALTER TABLE "public"."rc_webhook_events" ADD CONSTRAINT "rc_webhook_events_attempt_count_check" CHECK ((attempt_count > 0));

ALTER TABLE "public"."rc_webhook_events" ADD CONSTRAINT "rc_webhook_events_pkey" PRIMARY KEY (provider_event_id);

ALTER TABLE "public"."rc_webhook_events" ADD CONSTRAINT "rc_webhook_events_processing_status_check" CHECK ((processing_status = ANY (ARRAY['received'::text, 'accepted'::text, 'applied'::text, 'ignored'::text, 'retry'::text])));

ALTER TABLE "public"."referral_codes" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."referral_codes" ADD CONSTRAINT "referral_codes_code_format_check" CHECK ((code ~ '^[0-9A-F]{32}$'::text));

ALTER TABLE "public"."referral_codes" ADD CONSTRAINT "referral_codes_code_key" UNIQUE (code);

ALTER TABLE "public"."referral_codes" ADD CONSTRAINT "referral_codes_pkey" PRIMARY KEY (user_id);

ALTER TABLE "public"."referral_codes" ADD CONSTRAINT "referral_codes_user_code_key" UNIQUE (user_id, code);

ALTER TABLE "public"."shop_purchase_receipts" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."shop_purchase_receipts" ADD CONSTRAINT "shop_purchase_receipts_cost_check" CHECK ((cost >= 0));

ALTER TABLE "public"."shop_purchase_receipts" ADD CONSTRAINT "shop_purchase_receipts_new_balance_check" CHECK ((new_balance >= 0));

ALTER TABLE "public"."shop_purchase_receipts" ADD CONSTRAINT "shop_purchase_receipts_pkey" PRIMARY KEY (user_id, client_event_id);

ALTER TABLE "public"."shop_purchase_receipts" ADD CONSTRAINT "shop_purchase_receipts_quantity_check" CHECK ((quantity >= 1));

ALTER TABLE "public"."streak_checkin_applications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."streak_checkin_applications" ALTER COLUMN "freeze_used" SET DEFAULT false;

ALTER TABLE "public"."streak_checkin_applications" ALTER COLUMN "applied_at" SET DEFAULT now();

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_application_type_check" CHECK ((application_type = ANY (ARRAY['accepted'::text, 'accepted_horizon_covered'::text, 'legacy_exact_cas_approved'::text, 'legacy_ambiguous_approved'::text])));

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_freezes_remaining_check" CHECK ((freezes_remaining >= 0));

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_previous_streak_check" CHECK ((previous_streak >= 0));

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_resulting_streak_check" CHECK ((resulting_streak >= 0));

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_submission_key" UNIQUE (submission_id);

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_user_challenge_day_key" UNIQUE (user_id, challenge_id, local_day);

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_cutover_is_non_mutating" CHECK (((application_type = 'accepted'::text) OR ((previous_streak = resulting_streak) AND (freeze_used = false) AND (day_status = application_type))));

ALTER TABLE "public"."streak_day_outcomes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."streak_day_outcomes" ALTER COLUMN "freeze_used" SET DEFAULT false;

ALTER TABLE "public"."streak_day_outcomes" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_freeze_matches_outcome" CHECK (((outcome = 'protected'::text) = freeze_used));

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_freezes_remaining_check" CHECK ((freezes_remaining >= 0));

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_outcome_check" CHECK ((outcome = ANY (ARRAY['missed'::text, 'protected'::text])));

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_previous_streak_check" CHECK ((previous_streak >= 0));

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_result_matches_outcome" CHECK ((((outcome = 'protected'::text) AND (resulting_streak = previous_streak)) OR ((outcome = 'missed'::text) AND (resulting_streak = 0))));

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_resulting_streak_check" CHECK ((resulting_streak >= 0));

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_user_challenge_day_key" UNIQUE (user_id, challenge_id, local_day);

ALTER TABLE "public"."streak_freeze_log" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."streak_freeze_log" ALTER COLUMN "used_at" SET DEFAULT now();

ALTER TABLE "public"."streak_freeze_log" ALTER COLUMN "freeze_type" SET DEFAULT 'auto'::text;

ALTER TABLE "public"."streak_freeze_log" ALTER COLUMN "days_saved" SET DEFAULT 1;

ALTER TABLE "public"."streak_freeze_log" ADD CONSTRAINT "streak_freeze_log_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."streak_unlock_receipts" ALTER COLUMN "granted_at" SET DEFAULT now();

ALTER TABLE "public"."streak_unlock_receipts" ADD CONSTRAINT "streak_unlock_receipts_days_check" CHECK ((days >= 0));

ALTER TABLE "public"."streak_unlock_receipts" ADD CONSTRAINT "streak_unlock_receipts_pkey" PRIMARY KEY (user_id, sku);

ALTER TABLE "public"."system_config" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."system_config" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."system_config" ADD CONSTRAINT "system_config_pkey" PRIMARY KEY (key);

ALTER TABLE "public"."system_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."system_logs" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."system_logs" ADD CONSTRAINT "system_logs_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."team_challenges" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."team_challenges" ADD CONSTRAINT "team_challenges_pkey" PRIMARY KEY (group_id, challenge_id);

ALTER TABLE "public"."team_members" ALTER COLUMN "role" SET DEFAULT 'member'::text;

ALTER TABLE "public"."team_members" ALTER COLUMN "joined_at" SET DEFAULT now();

ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_pkey" PRIMARY KEY (group_id, user_id);

ALTER TABLE "public"."team_notification_preferences" ALTER COLUMN "notify_all" SET DEFAULT true;

ALTER TABLE "public"."team_notification_preferences" ALTER COLUMN "notify_mentions" SET DEFAULT true;

ALTER TABLE "public"."team_notification_preferences" ALTER COLUMN "notify_daily_summary" SET DEFAULT true;

ALTER TABLE "public"."team_notification_preferences" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."team_notification_preferences" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."team_notification_preferences" ADD CONSTRAINT "team_notification_preferences_pkey" PRIMARY KEY (user_id, group_id);

ALTER TABLE "public"."teams" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."teams" ALTER COLUMN "privacy" SET DEFAULT 'private'::text;

ALTER TABLE "public"."teams" ALTER COLUMN "status" SET DEFAULT 'active'::text;

ALTER TABLE "public"."teams" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."teams" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."teams" ALTER COLUMN "duration_days" SET DEFAULT 30;

ALTER TABLE "public"."teams" ALTER COLUMN "current_streak" SET DEFAULT 0;

ALTER TABLE "public"."teams" ALTER COLUMN "notify_on_member_miss" SET DEFAULT true;

ALTER TABLE "public"."teams" ALTER COLUMN "kind" SET DEFAULT 'saved'::text;

ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_civil_date_range_check" CHECK ((((start_date IS NULL) AND (end_date IS NULL)) OR ((start_date IS NOT NULL) AND (end_date IS NOT NULL) AND (end_date >= start_date))));

ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_duration_days_check" CHECK (((duration_days > 0) AND (duration_days <= 365)));

ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_kind_check" CHECK ((kind = ANY (ARRAY['saved'::text, 'promise'::text])));

ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."user_flags" ALTER COLUMN "welcome_bonus_granted" SET DEFAULT false;

ALTER TABLE "public"."user_flags" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."user_flags" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."user_flags" ALTER COLUMN "welcome_bonus_dismissed" SET DEFAULT false;

ALTER TABLE "public"."user_flags" ADD CONSTRAINT "user_flags_pkey" PRIMARY KEY (user_id);

ALTER TABLE "public"."user_referrals" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."user_referrals" ALTER COLUMN "status" SET DEFAULT 'pending'::character varying;

ALTER TABLE "public"."user_referrals" ALTER COLUMN "reward_granted" SET DEFAULT false;

ALTER TABLE "public"."user_referrals" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."user_referrals" ALTER COLUMN "reward_outcome" SET DEFAULT 'legacy_no_reward'::text;

ALTER TABLE "public"."user_referrals" ADD CONSTRAINT "user_referrals_no_self_check" CHECK ((referrer_user_id <> referred_user_id));

ALTER TABLE "public"."user_referrals" ADD CONSTRAINT "user_referrals_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."user_referrals" ADD CONSTRAINT "user_referrals_referred_user_id_key" UNIQUE (referred_user_id);

ALTER TABLE "public"."user_referrals" ADD CONSTRAINT "user_referrals_referrer_user_id_referred_user_id_key" UNIQUE (referrer_user_id, referred_user_id);

ALTER TABLE "public"."user_referrals" ADD CONSTRAINT "user_referrals_reward_outcome_check" CHECK ((reward_outcome = ANY (ARRAY['legacy_reward_recorded'::text, 'legacy_no_reward'::text, 'pending_activation_v2'::text, 'cancelled_before_activation_v2'::text, 'account_not_eligible_v2'::text, 'rewards_granted_v2'::text, 'inviter_capped_v2'::text, 'programme_disabled_v2'::text])));

ALTER TABLE "public"."user_referrals" ADD CONSTRAINT "user_referrals_status_check" CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text])));

ALTER TABLE "public"."waitlist_emails" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."waitlist_emails" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."waitlist_emails" ADD CONSTRAINT "waitlist_emails_email_key" UNIQUE (email);

ALTER TABLE "public"."waitlist_emails" ADD CONSTRAINT "waitlist_emails_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."wallet_transactions" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."weekly_recap_snapshots" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE "public"."weekly_recap_snapshots" ALTER COLUMN "proof_days" SET DEFAULT 0;

ALTER TABLE "public"."weekly_recap_snapshots" ALTER COLUMN "review_count" SET DEFAULT 0;

ALTER TABLE "public"."weekly_recap_snapshots" ALTER COLUMN "group_count" SET DEFAULT 0;

ALTER TABLE "public"."weekly_recap_snapshots" ALTER COLUMN "status" SET DEFAULT 'ready'::text;

ALTER TABLE "public"."weekly_recap_snapshots" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb;

ALTER TABLE "public"."weekly_recap_snapshots" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE "public"."weekly_recap_snapshots" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE "public"."weekly_recap_snapshots" ADD CONSTRAINT "weekly_recap_snapshots_group_count_check" CHECK ((group_count >= 0));

ALTER TABLE "public"."weekly_recap_snapshots" ADD CONSTRAINT "weekly_recap_snapshots_pkey" PRIMARY KEY (id);

ALTER TABLE "public"."weekly_recap_snapshots" ADD CONSTRAINT "weekly_recap_snapshots_proof_days_check" CHECK ((proof_days >= 0));

ALTER TABLE "public"."weekly_recap_snapshots" ADD CONSTRAINT "weekly_recap_snapshots_review_count_check" CHECK ((review_count >= 0));

ALTER TABLE "public"."weekly_recap_snapshots" ADD CONSTRAINT "weekly_recap_snapshots_status_check" CHECK ((status = ANY (ARRAY['ready'::text, 'not_enough_data'::text, 'shared'::text, 'archived'::text])));

ALTER TABLE "public"."weekly_recap_snapshots" ADD CONSTRAINT "weekly_recap_snapshots_user_id_week_start_key" UNIQUE (user_id, week_start);

ALTER TABLE "private"."account_activation_receipts" ADD CONSTRAINT "account_activation_receipts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."account_deletion_guards_v1" ADD CONSTRAINT "account_deletion_guards_v1_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."challenge_join_receipts" ADD CONSTRAINT "challenge_join_receipts_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."challenge_join_receipts" ADD CONSTRAINT "challenge_join_receipts_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "private"."content_report_submission_receipts_v1" ADD CONSTRAINT "content_report_submission_receipts_v1_report_id_fkey" FOREIGN KEY (report_id) REFERENCES content_reports(id) ON DELETE SET NULL;

ALTER TABLE "private"."content_report_submission_receipts_v1" ADD CONSTRAINT "content_report_submission_receipts_v1_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."economy_creation_events_v1" ADD CONSTRAINT "economy_creation_events_v1_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."first_creation_use_v1" ADD CONSTRAINT "first_creation_use_v1_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."first_miss_recovery_receipts" ADD CONSTRAINT "first_miss_recovery_receipts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."first_participation_join_v1" ADD CONSTRAINT "first_participation_join_v1_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."group_invite_replacements" ADD CONSTRAINT "group_invite_replacements_group_id_fkey" FOREIGN KEY (group_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_first_promise_receipts_first_promise_id_fkey" FOREIGN KEY (first_promise_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_first_promise_receipts_group_id_fkey" FOREIGN KEY (group_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ADD CONSTRAINT "onboarding_group_first_promise_receipts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."promise_accountability_invite_roles" ADD CONSTRAINT "promise_accountability_invite_roles_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "private"."promise_accountability_invite_roles" ADD CONSTRAINT "promise_accountability_invite_roles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."promise_accountability_invite_roles" ADD CONSTRAINT "promise_accountability_invite_roles_invite_code_fkey" FOREIGN KEY (invite_code) REFERENCES invite_codes(code) ON DELETE CASCADE;

ALTER TABLE "private"."promise_accountability_members" ADD CONSTRAINT "promise_accountability_members_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "private"."promise_accountability_members" ADD CONSTRAINT "promise_accountability_members_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "private"."promise_accountability_members" ADD CONSTRAINT "promise_accountability_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."promise_mutation_receipts_v1" ADD CONSTRAINT "promise_mutation_receipts_v1_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ADD CONSTRAINT "promise_saved_group_link_receipts_v1_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ADD CONSTRAINT "promise_saved_group_link_receipts_v1_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ADD CONSTRAINT "promise_saved_group_link_receipts_v1_group_id_fkey" FOREIGN KEY (group_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE "private"."proof_ad_break_cadence" ADD CONSTRAINT "proof_ad_break_cadence_submission_id_fkey" FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE;

ALTER TABLE "private"."proof_ad_break_cadence" ADD CONSTRAINT "proof_ad_break_cadence_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ADD CONSTRAINT "revenuecat_ad_reward_receipts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."saved_group_creation_receipts" ADD CONSTRAINT "saved_group_creation_receipts_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."saved_group_creation_receipts" ADD CONSTRAINT "saved_group_creation_receipts_group_id_fkey" FOREIGN KEY (group_id) REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE "private"."user_block_submission_receipts_v1" ADD CONSTRAINT "user_block_submission_receipts_v1_blocked_user_id_fkey" FOREIGN KEY (blocked_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "private"."user_block_submission_receipts_v1" ADD CONSTRAINT "user_block_submission_receipts_v1_blocker_id_fkey" FOREIGN KEY (blocker_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."app_flow_returns" ADD CONSTRAINT "app_flow_returns_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."blocked_users" ADD CONSTRAINT "blocked_users_blocked_user_id_fkey" FOREIGN KEY (blocked_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_fkey" FOREIGN KEY (blocker_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."buddy_streaks" ADD CONSTRAINT "buddy_streaks_buddy_user_id_fkey" FOREIGN KEY (buddy_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE "public"."buddy_streaks" ADD CONSTRAINT "buddy_streaks_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."challenge_participants" ADD CONSTRAINT "challenge_participants_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "public"."challenge_participants" ADD CONSTRAINT "challenge_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_replaces_submission_id_fkey" FOREIGN KEY (replaces_submission_id) REFERENCES challenge_submissions(id) ON DELETE SET NULL;

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."challenge_submissions" ADD CONSTRAINT "challenge_submissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."challenges" ADD CONSTRAINT "challenges_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."daily_challenge_panels" ADD CONSTRAINT "daily_challenge_panels_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."equipped_items" ADD CONSTRAINT "equipped_items_item_id_fkey" FOREIGN KEY (item_id) REFERENCES catalog_items(id) ON DELETE CASCADE;

ALTER TABLE "public"."equipped_items" ADD CONSTRAINT "equipped_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_action_receipts" ADD CONSTRAINT "event_action_receipts_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_attendances" ADD CONSTRAINT "event_attendances_checkin_id_fkey" FOREIGN KEY (checkin_id) REFERENCES event_checkins(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_attendances" ADD CONSTRAINT "event_attendances_occurrence_id_fkey" FOREIGN KEY (occurrence_id) REFERENCES event_occurrences(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_attendances" ADD CONSTRAINT "event_attendances_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_audit_log" ADD CONSTRAINT "event_audit_log_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_audit_log" ADD CONSTRAINT "event_audit_log_event_id_fkey" FOREIGN KEY (event_id) REFERENCES event_events(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_audit_log" ADD CONSTRAINT "event_audit_log_occurrence_id_fkey" FOREIGN KEY (occurrence_id) REFERENCES event_occurrences(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_checkin_token_redemptions" ADD CONSTRAINT "event_checkin_token_redemptions_attendance_id_fkey" FOREIGN KEY (attendance_id) REFERENCES event_attendances(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_checkin_token_redemptions" ADD CONSTRAINT "event_checkin_token_redemptions_token_id_fkey" FOREIGN KEY (token_id) REFERENCES event_checkin_tokens(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_checkin_token_redemptions" ADD CONSTRAINT "event_checkin_token_redemptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_checkin_tokens" ADD CONSTRAINT "event_checkin_tokens_consumed_by_fkey" FOREIGN KEY (consumed_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_checkin_tokens" ADD CONSTRAINT "event_checkin_tokens_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_checkin_tokens" ADD CONSTRAINT "event_checkin_tokens_issued_to_user_id_fkey" FOREIGN KEY (issued_to_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_checkin_tokens" ADD CONSTRAINT "event_checkin_tokens_occurrence_id_fkey" FOREIGN KEY (occurrence_id) REFERENCES event_occurrences(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_checkins" ADD CONSTRAINT "event_checkins_attendance_id_fkey" FOREIGN KEY (attendance_id) REFERENCES event_attendances(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_checkins" ADD CONSTRAINT "event_checkins_token_id_fkey" FOREIGN KEY (token_id) REFERENCES event_checkin_tokens(id) ON DELETE RESTRICT;

ALTER TABLE "public"."event_events" ADD CONSTRAINT "event_events_organiser_id_fkey" FOREIGN KEY (organiser_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_invites" ADD CONSTRAINT "event_invites_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_invites" ADD CONSTRAINT "event_invites_event_id_fkey" FOREIGN KEY (event_id) REFERENCES event_events(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_invites" ADD CONSTRAINT "event_invites_issued_to_user_id_fkey" FOREIGN KEY (issued_to_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_invites" ADD CONSTRAINT "event_invites_occurrence_id_fkey" FOREIGN KEY (occurrence_id) REFERENCES event_occurrences(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_occurrences" ADD CONSTRAINT "event_occurrences_event_id_fkey" FOREIGN KEY (event_id) REFERENCES event_events(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_occurrence_id_fkey" FOREIGN KEY (occurrence_id) REFERENCES event_occurrences(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."event_posts" ADD CONSTRAINT "event_posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."feature_votes" ADD CONSTRAINT "feature_votes_feature_request_id_fkey" FOREIGN KEY (feature_request_id) REFERENCES feature_requests(id) ON DELETE CASCADE;

ALTER TABLE "public"."group_streak_tracking" ADD CONSTRAINT "group_streak_tracking_group_id_fkey" FOREIGN KEY (group_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."invite_codes" ADD CONSTRAINT "invite_codes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."invite_handoffs" ADD CONSTRAINT "invite_handoffs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."issues" ADD CONSTRAINT "issues_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."legal_acceptance_receipts" ADD CONSTRAINT "legal_acceptance_receipts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."notification_jobs" ADD CONSTRAINT "notification_jobs_notification_id_fkey" FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE SET NULL;

ALTER TABLE "public"."notification_jobs" ADD CONSTRAINT "notification_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."proof_encouragements" ADD CONSTRAINT "proof_encouragements_submission_id_fkey" FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE;

ALTER TABLE "public"."proof_encouragements" ADD CONSTRAINT "proof_encouragements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."purchase_receipt_states" ADD CONSTRAINT "purchase_receipt_states_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."purchases" ADD CONSTRAINT "purchases_item_id_fkey" FOREIGN KEY (item_id) REFERENCES catalog_items(id) ON DELETE CASCADE;

ALTER TABLE "public"."purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."queued_proof_submissions" ADD CONSTRAINT "queued_proof_submissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."rc_webhook_events" ADD CONSTRAINT "rc_webhook_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."referral_codes" ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."shop_purchase_receipts" ADD CONSTRAINT "shop_purchase_receipts_item_id_fkey" FOREIGN KEY (item_id) REFERENCES catalog_items(id);

ALTER TABLE "public"."shop_purchase_receipts" ADD CONSTRAINT "shop_purchase_receipts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_submission_id_fkey" FOREIGN KEY (submission_id) REFERENCES challenge_submissions(id) ON DELETE CASCADE;

ALTER TABLE "public"."streak_checkin_applications" ADD CONSTRAINT "streak_checkin_applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "public"."streak_day_outcomes" ADD CONSTRAINT "streak_day_outcomes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."streak_freeze_log" ADD CONSTRAINT "streak_freeze_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."streak_unlock_receipts" ADD CONSTRAINT "streak_unlock_receipts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."team_challenges" ADD CONSTRAINT "team_challenges_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;

ALTER TABLE "public"."team_challenges" ADD CONSTRAINT "team_challenges_group_id_fkey" FOREIGN KEY (group_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_group_id_fkey" FOREIGN KEY (group_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE "public"."team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."team_notification_preferences" ADD CONSTRAINT "team_notification_preferences_group_id_fkey" FOREIGN KEY (group_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE "public"."team_notification_preferences" ADD CONSTRAINT "team_notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_flags" ADD CONSTRAINT "user_flags_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_referrals" ADD CONSTRAINT "user_referrals_referred_profile_fkey" FOREIGN KEY (referred_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_referrals" ADD CONSTRAINT "user_referrals_referrer_code_fkey" FOREIGN KEY (referrer_user_id, referral_code) REFERENCES referral_codes(user_id, code) ON DELETE CASCADE;

ALTER TABLE "public"."user_referrals" ADD CONSTRAINT "user_referrals_referrer_profile_fkey" FOREIGN KEY (referrer_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."weekly_recap_snapshots" ADD CONSTRAINT "weekly_recap_snapshots_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX group_invite_replacements_group_id_idx ON private.group_invite_replacements USING btree (group_id);

CREATE UNIQUE INDEX legal_document_versions_unique_effective ON public.legal_document_versions USING btree (document_type, effective_at);

CREATE INDEX legal_document_versions_lifecycle_lookup ON public.legal_document_versions USING btree (document_type, effective_at DESC, retired_at);

CREATE INDEX legal_acceptance_receipts_user_time ON public.legal_acceptance_receipts USING btree (user_id, accepted_at DESC);

CREATE INDEX idx_user_flags_welcome_status ON public.user_flags USING btree (user_id, welcome_bonus_granted, welcome_bonus_dismissed);

CREATE INDEX promise_accountability_members_user_idx ON private.promise_accountability_members USING btree (user_id, challenge_id);

CREATE INDEX promise_accountability_invites_challenge_idx ON private.promise_accountability_invite_roles USING btree (challenge_id, created_at DESC);

CREATE INDEX streak_day_outcomes_challenge_id_idx ON public.streak_day_outcomes USING btree (challenge_id);

CREATE INDEX streak_day_outcomes_user_challenge_history_idx ON public.streak_day_outcomes USING btree (user_id, challenge_id, local_day DESC, created_at DESC);

CREATE INDEX idx_creation_attempts_user_id ON public.creation_attempts USING btree (user_id);

CREATE INDEX idx_creation_attempts_type ON public.creation_attempts USING btree (type);

CREATE INDEX idx_creation_attempts_timestamp ON public.creation_attempts USING btree ("timestamp");

CREATE INDEX idx_creation_attempts_success ON public.creation_attempts USING btree (success);

CREATE INDEX streak_checkin_applications_challenge_id_idx ON public.streak_checkin_applications USING btree (challenge_id);

CREATE INDEX streak_checkin_applications_user_history_idx ON public.streak_checkin_applications USING btree (user_id, challenge_id, local_day DESC, applied_at DESC);

CREATE INDEX proof_encouragements_user_created_idx ON public.proof_encouragements USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX uq_challenge_submissions_replacement ON public.challenge_submissions USING btree (replaces_submission_id) WHERE (replaces_submission_id IS NOT NULL);

CREATE INDEX idx_challenge_submissions_reviewer_id ON public.challenge_submissions USING btree (reviewer_id);

CREATE INDEX idx_challenge_submissions_reviewed_by ON public.challenge_submissions USING btree (reviewed_by);

CREATE UNIQUE INDEX uq_challenge_submissions_client_event ON public.challenge_submissions USING btree (user_id, client_event_id);

CREATE UNIQUE INDEX uq_challenge_submissions_active_daily ON public.challenge_submissions USING btree (challenge_id, user_id, local_day) WHERE (status = ANY (ARRAY['pending'::text, 'approved'::text]));

CREATE INDEX idx_challenge_submissions_daily_history ON public.challenge_submissions USING btree (challenge_id, user_id, local_day, submission_date DESC);

CREATE INDEX idx_challenge_submissions_user_local_day_status ON public.challenge_submissions USING btree (user_id, local_day, status);

CREATE INDEX idx_challenge_submissions_challenge_status_submitted ON public.challenge_submissions USING btree (challenge_id, status, submission_date DESC);

CREATE INDEX idx_challenge_submissions_pending_review ON public.challenge_submissions USING btree (challenge_id, submission_date, user_id) WHERE (status = 'pending'::text);

CREATE INDEX idx_challenge_submissions_approved_receipts ON public.challenge_submissions USING btree (user_id, reviewed_at DESC) INCLUDE (challenge_id, local_day, reviewer_id) WHERE ((status = 'approved'::text) AND (reviewed_at IS NOT NULL));

CREATE INDEX idx_challenge_submissions_media_url ON public.challenge_submissions USING btree (media_url) WHERE (media_url IS NOT NULL);

CREATE INDEX idx_notification_jobs_notification_id ON public.notification_jobs USING btree (notification_id);

CREATE INDEX idx_notification_jobs_pending_schedule ON public.notification_jobs USING btree (status, scheduled_for) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]));

CREATE INDEX idx_notification_jobs_user_created ON public.notification_jobs USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX idx_notification_jobs_one_per_notification ON public.notification_jobs USING btree (notification_id) WHERE (notification_id IS NOT NULL);

CREATE INDEX storage_upload_usage_v1_user_bucket_created_idx ON private.storage_upload_usage_v1 USING btree (user_id, bucket_id, created_at DESC);

CREATE INDEX saved_group_creation_receipts_request_idx ON private.saved_group_creation_receipts USING btree (actor_id, request_hash, created_at DESC);

CREATE INDEX idx_notifications_pending_delivery ON public.notifications USING btree (priority DESC, created_at) WHERE (delivered_at IS NULL);

CREATE INDEX idx_notifications_scheduled_pending ON public.notifications USING btree (scheduled_for) WHERE (delivered_at IS NULL);

CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC);

CREATE INDEX idx_notifications_provider_message ON public.notifications USING btree (delivery_provider, provider_message_id) WHERE (provider_message_id IS NOT NULL);

CREATE INDEX rc_webhook_events_user_id_idx ON public.rc_webhook_events USING btree (user_id);

CREATE INDEX idx_gds_group_date ON public.group_daily_status USING btree (group_id, local_date);

CREATE INDEX content_report_submission_receipts_v1_report_id_idx ON private.content_report_submission_receipts_v1 USING btree (report_id);

CREATE INDEX idx_group_streak_tracking_group ON public.group_streak_tracking USING btree (group_id);

CREATE INDEX user_block_submission_receipts_v1_blocked_user_id_idx ON private.user_block_submission_receipts_v1 USING btree (blocked_user_id);

CREATE INDEX idx_challenges_creator_id ON public.challenges USING btree (creator_id);

CREATE UNIQUE INDEX challenges_invite_code_key ON public.challenges USING btree (invite_code) WHERE (invite_code IS NOT NULL);

CREATE INDEX idx_team_challenges_challenge_id ON public.team_challenges USING btree (challenge_id);

CREATE INDEX idx_invite_codes_created_by ON public.invite_codes USING btree (created_by);

CREATE INDEX idx_teams_owner_id ON public.teams USING btree (owner_id);

CREATE UNIQUE INDEX teams_invite_code_key ON public.teams USING btree (invite_code) WHERE (invite_code IS NOT NULL);

CREATE INDEX teams_kind_status_created_idx ON public.teams USING btree (kind, status, created_at DESC);

CREATE INDEX idx_team_notification_preferences_group_id ON public.team_notification_preferences USING btree (group_id);

CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions USING btree (user_id);

CREATE UNIQUE INDEX wallet_transactions_external_reference_id_key ON public.wallet_transactions USING btree (external_reference_id) WHERE (external_reference_id IS NOT NULL);

CREATE INDEX idx_wallet_transactions_user_source_created ON public.wallet_transactions USING btree (user_id, source_uuid, created_at DESC) WHERE (source_uuid IS NOT NULL);

CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);

CREATE INDEX idx_team_members_user_group ON public.team_members USING btree (user_id, group_id);

CREATE INDEX idx_equipped_items_item_id ON public.equipped_items USING btree (item_id);

CREATE UNIQUE INDEX equipped_items_user_category_key ON public.equipped_items USING btree (user_id, category);

CREATE INDEX idx_purchases_item_id ON public.purchases USING btree (item_id);

CREATE INDEX catalog_items_unlock_streak_days_idx ON public.catalog_items USING btree (unlock_streak_days) WHERE (unlock_streak_days IS NOT NULL);

CREATE INDEX idx_issues_user_id ON public.issues USING btree (user_id);

CREATE INDEX idx_content_reports_reporter_id ON public.content_reports USING btree (reporter_id);

CREATE INDEX blocked_users_blocked_user_id_idx ON public.blocked_users USING btree (blocked_user_id);

CREATE INDEX idx_group_freeze_usages_group_date ON public.group_freeze_usages USING btree (group_id, used_for_date);

CREATE UNIQUE INDEX beta_waitlist_email_unique ON public.beta_waitlist USING btree (lower(email));

CREATE INDEX promise_mutation_receipts_actor_challenge_idx ON private.promise_mutation_receipts_v1 USING btree (actor_id, challenge_id, operation, created_at DESC);

CREATE INDEX idx_edge_rate_limits_window_start ON public.edge_rate_limits USING btree (window_start);

CREATE INDEX shop_purchase_receipts_item_id_idx ON public.shop_purchase_receipts USING btree (item_id);

CREATE INDEX idx_power_up_usage_open_proof_extension ON public.power_up_usage USING btree (user_id, challenge_id, obligation_local_day, proof_due_at DESC) WHERE (proof_due_at IS NOT NULL);

CREATE INDEX idx_power_up_usage_active ON public.power_up_usage USING btree (user_id, is_active, expires_at);

CREATE INDEX idx_power_up_usage_challenge_id ON public.power_up_usage USING btree (challenge_id);

CREATE INDEX idx_power_up_usage_sku ON public.power_up_usage USING btree (item_sku, is_active);

CREATE INDEX idx_power_up_usage_user_id ON public.power_up_usage USING btree (user_id);

CREATE UNIQUE INDEX power_up_usage_user_client_event_key ON public.power_up_usage USING btree (user_id, client_event_id) WHERE (client_event_id IS NOT NULL);

CREATE INDEX event_action_receipts_actor_action_created_idx ON public.event_action_receipts USING btree (actor_id, action, created_at DESC);

CREATE INDEX event_events_organiser_id_idx ON public.event_events USING btree (organiser_id);

CREATE INDEX event_occurrences_scheduled_starts_idx ON public.event_occurrences USING btree (starts_at, id) WHERE (state = 'scheduled'::menta_event_occurrence_state);

CREATE INDEX event_occurrences_event_state_starts_idx ON public.event_occurrences USING btree (event_id, state, starts_at);

CREATE INDEX event_occurrences_live_ends_idx ON public.event_occurrences USING btree (ends_at, id) WHERE (state = 'live'::menta_event_occurrence_state);

CREATE INDEX event_invites_created_by_idx ON public.event_invites USING btree (created_by);

CREATE INDEX event_invites_issued_to_user_id_idx ON public.event_invites USING btree (issued_to_user_id);

CREATE INDEX event_invites_occurrence_id_idx ON public.event_invites USING btree (occurrence_id);

CREATE INDEX event_invites_event_token_idx ON public.event_invites USING btree (event_id, token_hash);

CREATE INDEX event_attendances_occurrence_state_idx ON public.event_attendances USING btree (occurrence_id, state);

CREATE INDEX event_attendances_user_occurrence_idx ON public.event_attendances USING btree (user_id, occurrence_id);

CREATE INDEX event_attendances_checkin_id_idx ON public.event_attendances USING btree (checkin_id);

CREATE INDEX event_checkin_tokens_occurrence_expiry_idx ON public.event_checkin_tokens USING btree (occurrence_id, expires_at);

CREATE INDEX event_checkin_tokens_consumed_by_idx ON public.event_checkin_tokens USING btree (consumed_by);

CREATE INDEX event_checkin_tokens_created_by_idx ON public.event_checkin_tokens USING btree (created_by);

CREATE INDEX event_checkin_tokens_issued_to_user_id_idx ON public.event_checkin_tokens USING btree (issued_to_user_id);

CREATE INDEX event_checkin_token_redemptions_attendance_id_idx ON public.event_checkin_token_redemptions USING btree (attendance_id);

CREATE INDEX event_checkin_token_redemptions_user_id_idx ON public.event_checkin_token_redemptions USING btree (user_id);

CREATE INDEX event_checkins_token_id_idx ON public.event_checkins USING btree (token_id);

CREATE INDEX event_posts_reviewed_by_idx ON public.event_posts USING btree (reviewed_by);

CREATE INDEX event_posts_user_occurrence_status_idx ON public.event_posts USING btree (user_id, occurrence_id, status);

CREATE INDEX event_posts_occurrence_status_created_idx ON public.event_posts USING btree (occurrence_id, status, created_at DESC, id DESC) WHERE (status = ANY (ARRAY['pending_review'::menta_event_post_status, 'approved'::menta_event_post_status, 'rejected'::menta_event_post_status]));

CREATE INDEX event_audit_log_event_created_idx ON public.event_audit_log USING btree (event_id, created_at DESC);

CREATE INDEX event_audit_log_actor_id_idx ON public.event_audit_log USING btree (actor_id);

CREATE INDEX event_audit_log_occurrence_id_idx ON public.event_audit_log USING btree (occurrence_id);

CREATE INDEX promise_saved_group_link_receipts_actor_challenge_idx ON private.promise_saved_group_link_receipts_v1 USING btree (actor_id, challenge_id, completed_at DESC);

CREATE INDEX economy_creation_events_month_v1 ON private.economy_creation_events_v1 USING btree (user_id, action, created_at);

CREATE INDEX idx_user_referrals_referrer_code ON public.user_referrals USING btree (referrer_user_id, referral_code);

CREATE INDEX idx_user_referrals_referred ON public.user_referrals USING btree (referred_user_id);

CREATE INDEX idx_user_referrals_referrer ON public.user_referrals USING btree (referrer_user_id);

CREATE INDEX idx_user_referrals_referrer_created ON public.user_referrals USING btree (referrer_user_id, created_at DESC, id DESC);

CREATE INDEX user_referrals_pending_activation_idx ON public.user_referrals USING btree (referred_user_id, created_at) WHERE (((status)::text = 'pending'::text) AND (reward_outcome = 'pending_activation_v2'::text));

CREATE INDEX idx_streak_freeze_log_user ON public.streak_freeze_log USING btree (user_id);

CREATE INDEX idx_streak_freeze_log_challenge ON public.streak_freeze_log USING btree (challenge_id);

CREATE INDEX idx_challenge_participants_user_id ON public.challenge_participants USING btree (user_id);

CREATE INDEX idx_challenge_participants_user_status ON public.challenge_participants USING btree (user_id, status);

CREATE INDEX app_flow_returns_user_status_idx ON public.app_flow_returns USING btree (user_id, consumed_at, expires_at);

CREATE INDEX invite_handoffs_user_status_idx ON public.invite_handoffs USING btree (user_id, status, expires_at);

CREATE INDEX queued_proof_submissions_user_status_idx ON public.queued_proof_submissions USING btree (user_id, status, created_at DESC);

CREATE INDEX weekly_recap_snapshots_user_week_idx ON public.weekly_recap_snapshots USING btree (user_id, week_start DESC);

CREATE INDEX buddy_streaks_owner_status_idx ON public.buddy_streaks USING btree (owner_user_id, status);

CREATE INDEX idx_buddy_streaks_buddy_user_id ON public.buddy_streaks USING btree (buddy_user_id);

CREATE INDEX daily_challenge_panels_user_date_idx ON public.daily_challenge_panels USING btree (user_id, panel_date DESC);

CREATE INDEX purchase_receipt_states_user_status_idx ON public.purchase_receipt_states USING btree (user_id, status, created_at DESC);

CREATE INDEX challenge_join_receipts_actor_challenge_created_idx ON private.challenge_join_receipts USING btree (actor_id, challenge_id, created_at DESC);

CREATE INDEX challenge_join_receipts_challenge_id_idx ON private.challenge_join_receipts USING btree (challenge_id);

CREATE UNIQUE INDEX rc_credit_mappings_product_id_key ON public.rc_credit_mappings USING btree (product_id);

CREATE UNIQUE INDEX notification_templates_template_key_key ON public.notification_templates USING btree (template_key);

CREATE INDEX idx_maintenance_runs_timestamp ON public.maintenance_runs USING btree (run_timestamp DESC);

CREATE INDEX idx_rc_entitlements_user_active ON public.rc_entitlements USING btree (user_id) WHERE is_active;

CREATE INDEX idx_rc_entitlements_key_active ON public.rc_entitlements USING btree (entitlement_key, is_active) WHERE (is_active = true);

CREATE INDEX idx_rc_entitlements_user_key_ends_active ON public.rc_entitlements USING btree (user_id, entitlement_key, ends_at) WHERE is_active;

CREATE VIEW "public"."group_stats" WITH (security_invoker=true) AS  SELECT t.id AS group_id,
    t.name,
    t.created_at,
    t.current_streak,
    NULL::integer AS streak_goal,
    t.status,
    t.duration_days,
    t.created_at AS start_date,
    t.created_at + make_interval(days => t.duration_days) AS end_date,
    t.status = ANY (ARRAY['completed'::text, 'archived'::text, 'expired'::text]) AS is_expired,
    COALESCE(member_counts.total_members, 0::bigint) AS total_members,
    COALESCE(member_counts.active_members, 0::bigint) AS active_members,
    COALESCE(challenge_counts.total_challenges, 0::bigint) AS total_challenges,
    COALESCE(challenge_counts.active_challenges, 0::bigint) AS active_challenges,
    COALESCE(challenge_counts.completed_challenges, 0::bigint) AS completed_challenges,
        CASE
            WHEN COALESCE(member_counts.total_members, 0::bigint) > 0 THEN COALESCE(participation.total_participants, 0::bigint)::numeric / member_counts.total_members::numeric
            ELSE 0::numeric
        END AS participation_rate,
    COALESCE(recent_activity.recent_verifications, 0::bigint) AS recent_verifications,
    COALESCE(recent_activity.daily_active_members, 0::bigint) AS daily_active_members,
        CASE
            WHEN COALESCE(challenge_counts.total_challenges, 0::bigint) > 0 THEN COALESCE(challenge_counts.completed_challenges, 0::bigint)::numeric / challenge_counts.total_challenges::numeric
            ELSE 0::numeric
        END AS completion_rate,
    LEAST(1.0, GREATEST(0.0,
        CASE
            WHEN COALESCE(member_counts.total_members, 0::bigint) > 0 THEN LEAST(1.0, COALESCE(recent_activity.daily_active_members, 0::bigint)::numeric / member_counts.total_members::numeric) * 0.45
            ELSE 0.15
        END + LEAST(1.0, COALESCE(t.current_streak, 0)::numeric / GREATEST(t.duration_days, 1)::numeric) * 0.35 +
        CASE
            WHEN COALESCE(challenge_counts.total_challenges, 0::bigint) > 0 THEN 0.2
            ELSE 0.0
        END)) AS health_score,
    EXTRACT(day FROM now() - t.created_at) AS age_days,
    COALESCE(gst.longest_streak, t.current_streak, 0) AS longest_streak,
    COALESCE(gst.total_successful_days, 0) AS total_successful_days,
    gst.last_success_date
   FROM teams t
     LEFT JOIN ( SELECT tm.group_id,
            count(*) AS total_members,
            count(*) FILTER (WHERE tm.joined_at >= (now() - '30 days'::interval)) AS active_members
           FROM team_members tm
          GROUP BY tm.group_id) member_counts ON member_counts.group_id = t.id
     LEFT JOIN ( SELECT tc.group_id,
            count(*) AS total_challenges,
            count(*) FILTER (WHERE c.status = 'active'::text) AS active_challenges,
            count(*) FILTER (WHERE c.status = ANY (ARRAY['completed'::text, 'archived'::text])) AS completed_challenges
           FROM team_challenges tc
             JOIN challenges c ON c.id = tc.challenge_id
          GROUP BY tc.group_id) challenge_counts ON challenge_counts.group_id = t.id
     LEFT JOIN ( SELECT tc.group_id,
            count(DISTINCT cp.user_id) AS total_participants
           FROM team_challenges tc
             JOIN challenge_participants cp ON cp.challenge_id = tc.challenge_id
          WHERE COALESCE(cp.status, 'active'::text) = 'active'::text
          GROUP BY tc.group_id) participation ON participation.group_id = t.id
     LEFT JOIN ( SELECT tc.group_id,
            count(cs.id) AS recent_verifications,
            count(DISTINCT cs.user_id) AS daily_active_members
           FROM team_challenges tc
             JOIN challenge_submissions cs ON cs.challenge_id = tc.challenge_id
          WHERE cs.submission_date >= (now() - '7 days'::interval)
          GROUP BY tc.group_id) recent_activity ON recent_activity.group_id = t.id
     LEFT JOIN group_streak_tracking gst ON gst.group_id = t.id;

CREATE VIEW "public"."profile_directory" WITH (security_invoker=true, security_barrier=true) AS  SELECT id,
    username,
    display_name,
    avatar_url
   FROM profiles p;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER validate_challenge_proof_object_v1 BEFORE INSERT OR UPDATE OF media_url, media_type, client_event_id ON public.challenge_submissions FOR EACH ROW EXECUTE FUNCTION private.validate_challenge_proof_object_v1();

CREATE TRIGGER enforce_event_post_quota_v1 BEFORE INSERT ON public.event_posts FOR EACH ROW EXECUTE FUNCTION private.enforce_event_post_quota_v1();

CREATE TRIGGER trg_validate_challenge_streak_timezone BEFORE INSERT OR UPDATE OF streak_timezone ON public.challenges FOR EACH ROW EXECUTE FUNCTION validate_challenge_streak_timezone();

CREATE TRIGGER capture_replaced_group_invite_v2 AFTER DELETE ON public.invite_codes FOR EACH ROW EXECUTE FUNCTION private.capture_replaced_group_invite_v2();

CREATE TRIGGER author_proof_extension_deadline_v1 BEFORE INSERT ON public.power_up_usage FOR EACH ROW EXECUTE FUNCTION private.author_proof_extension_deadline_v1();

CREATE TRIGGER team_challenges_single_saved_group_v1 BEFORE INSERT OR UPDATE OF group_id, challenge_id ON public.team_challenges FOR EACH ROW EXECUTE FUNCTION private.enforce_single_saved_group_link_v1();

CREATE TRIGGER feature_votes_count_trigger AFTER INSERT OR DELETE ON public.feature_votes FOR EACH ROW EXECUTE FUNCTION sync_feature_vote_count();

CREATE TRIGGER record_proof_ad_break_cadence_v1 AFTER INSERT ON public.challenge_submissions FOR EACH ROW EXECUTE FUNCTION private.record_proof_ad_break_cadence_v1();

CREATE TRIGGER event_occurrences_apply_lifecycle_v1 BEFORE INSERT OR UPDATE ON public.event_occurrences FOR EACH ROW EXECUTE FUNCTION private.event_occurrence_apply_lifecycle_v1();

CREATE TRIGGER challenge_participants_streak_unlocks_v1 AFTER INSERT OR UPDATE OF current_streak, longest_streak, status ON public.challenge_participants FOR EACH ROW EXECUTE FUNCTION private.sync_account_streak_unlocks_v1();

CREATE TRIGGER challenge_participants_streak_shop_unlocks_v1 AFTER INSERT OR UPDATE OF current_streak, longest_streak, status ON public.challenge_participants FOR EACH ROW EXECUTE FUNCTION private.sync_account_streak_shop_unlocks_v1();

CREATE TRIGGER enforce_ad_reward_limit_v1 BEFORE INSERT ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION private.enforce_ad_reward_limit_v1();

CREATE TRIGGER challenge_review_notifications_v1 AFTER INSERT OR UPDATE OF status ON public.challenge_submissions FOR EACH ROW EXECUTE FUNCTION private.enqueue_challenge_review_notifications_v1();

CREATE TRIGGER event_review_notifications_v1 AFTER INSERT OR UPDATE OF status ON public.event_posts FOR EACH ROW EXECUTE FUNCTION private.enqueue_event_review_notifications_v1();

CREATE TRIGGER streak_outcome_notification_v1 AFTER INSERT ON public.streak_day_outcomes FOR EACH ROW EXECUTE FUNCTION private.enqueue_streak_outcome_notification_v1();

CREATE TRIGGER trg_assert_submission_proof_media BEFORE INSERT OR UPDATE OF user_id, media_url, media_type, submission_text ON public.challenge_submissions FOR EACH ROW EXECUTE FUNCTION assert_submission_proof_media();

CREATE TRIGGER teams_block_guarded_owner_change_v1 BEFORE INSERT OR UPDATE OF owner_id ON public.teams FOR EACH ROW EXECUTE FUNCTION private.block_guarded_team_owner_change_v1();

CREATE TRIGGER team_members_block_guarded_write_v1 BEFORE INSERT OR UPDATE OF group_id, user_id ON public.team_members FOR EACH ROW EXECUTE FUNCTION private.block_guarded_team_membership_write_v1();

CREATE TRIGGER record_first_promise_creation_v1 AFTER INSERT ON public.challenges FOR EACH ROW EXECUTE FUNCTION private.record_first_creation_use_v1();

CREATE TRIGGER record_first_saved_group_creation_v1 AFTER INSERT ON public.teams FOR EACH ROW EXECUTE FUNCTION private.record_first_creation_use_v1();

ALTER TABLE "private"."account_activation_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."account_deletion_guards_v1" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."account_deletion_guards_v1" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."challenge_join_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."content_report_submission_receipts_v1" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."economy_creation_events_v1" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."first_creation_use_v1" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."first_miss_recovery_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."first_participation_join_v1" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."group_invite_replacements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."onboarding_group_first_promise_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."onboarding_group_first_promise_receipts" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."promise_accountability_invite_roles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."promise_accountability_invite_roles" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."promise_accountability_members" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."promise_accountability_members" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."promise_mutation_receipts_v1" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."promise_mutation_receipts_v1" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."promise_saved_group_link_receipts_v1" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."proof_ad_break_cadence" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."proof_ad_break_cadence" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."revenuecat_ad_reward_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."revenuecat_ad_reward_receipts" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."saved_group_creation_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."saved_group_creation_receipts" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."storage_upload_usage_v1" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."storage_upload_usage_v1" FORCE ROW LEVEL SECURITY;

ALTER TABLE "private"."user_block_submission_receipts_v1" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."app_flow_returns" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."app_update_policies" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."beta_waitlist" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."blocked_users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."buddy_streaks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."catalog_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."challenge_participants" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."challenge_submissions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."content_reports" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."creation_attempts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."daily_challenge_panels" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."edge_rate_limits" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."edge_rate_limits" FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."equipped_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_action_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_attendances" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_audit_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_checkin_token_redemptions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_checkin_tokens" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_checkins" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_invites" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_occurrences" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."event_posts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."feature_requests" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."feature_votes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."group_daily_status" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."group_freeze_usages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."group_freeze_usages" FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."group_streak_tracking" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."invite_codes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."invite_handoffs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."issues" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."legal_acceptance_enforcement_settings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."legal_acceptance_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."legal_document_versions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."maintenance_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."maintenance_runs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notification_jobs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notification_jobs" FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."power_up_usage" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."proof_encouragements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."purchase_receipt_states" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."queued_proof_submissions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rc_credit_mappings" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rc_entitlements" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rc_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rc_webhook_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."referral_codes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."shop_purchase_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."streak_checkin_applications" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."streak_day_outcomes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."streak_freeze_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."streak_unlock_receipts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."system_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."system_logs" FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."team_challenges" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."team_notification_preferences" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_flags" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_referrals" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."waitlist_emails" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."wallet_transactions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."weekly_recap_snapshots" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own flow returns" ON "public"."app_flow_returns" FOR ALL TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "app_update_policies_read_public_v1" ON "public"."app_update_policies" FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "Anyone can join the waitlist" ON "public"."beta_waitlist" FOR INSERT TO "anon", "authenticated" WITH CHECK ((((char_length(name) >= 1) AND (char_length(name) <= 100)) AND ((char_length(email) >= 5) AND (char_length(email) <= 255)) AND (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)));

CREATE POLICY "blocked_users_delete_own" ON "public"."blocked_users" FOR DELETE TO "authenticated" USING ((blocker_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "blocked_users_insert_own" ON "public"."blocked_users" FOR INSERT TO "authenticated" WITH CHECK ((blocker_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "blocked_users_select_own" ON "public"."blocked_users" FOR SELECT TO "authenticated" USING ((blocker_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users manage own buddy streaks" ON "public"."buddy_streaks" FOR ALL TO PUBLIC USING (((owner_user_id = ( SELECT auth.uid() AS uid)) OR (buddy_user_id = ( SELECT auth.uid() AS uid)))) WITH CHECK ((owner_user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "catalog_items_select" ON "public"."catalog_items" FOR SELECT TO PUBLIC USING (((is_available = true) AND (is_disabled = false)));

CREATE POLICY "challenge_participants_read_own" ON "public"."challenge_participants" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "challenge_submissions_read_authorised" ON "public"."challenge_submissions" FOR SELECT TO "authenticated" USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM challenges c
  WHERE ((c.id = challenge_submissions.challenge_id) AND (c.creator_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM challenge_participants cp
  WHERE ((cp.challenge_id = challenge_submissions.challenge_id) AND (cp.user_id = ( SELECT auth.uid() AS uid)) AND (COALESCE(cp.status, 'active'::text) = 'active'::text)))) OR (EXISTS ( SELECT 1
   FROM (team_challenges tc
     JOIN team_members tm ON ((tm.group_id = tc.group_id)))
  WHERE ((tc.challenge_id = challenge_submissions.challenge_id) AND (tm.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "challenge_submissions_select" ON "public"."challenge_submissions" FOR SELECT TO PUBLIC USING (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM challenge_participants participant
  WHERE ((participant.challenge_id = challenge_submissions.challenge_id) AND (participant.user_id = ( SELECT auth.uid() AS uid)) AND (participant.status = 'active'::text)))) OR (EXISTS ( SELECT 1
   FROM (team_challenges link
     JOIN team_members member ON ((member.group_id = link.group_id)))
  WHERE ((link.challenge_id = challenge_submissions.challenge_id) AND (member.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "challenges_insert" ON "public"."challenges" FOR INSERT TO PUBLIC WITH CHECK ((creator_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "challenges_select" ON "public"."challenges" FOR SELECT TO PUBLIC USING ((is_public OR (creator_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM challenge_participants participant
  WHERE ((participant.challenge_id = challenges.id) AND (participant.user_id = ( SELECT auth.uid() AS uid)) AND (participant.status = 'active'::text)))) OR (EXISTS ( SELECT 1
   FROM (team_challenges link
     JOIN team_members member ON ((member.group_id = link.group_id)))
  WHERE ((link.challenge_id = challenges.id) AND (member.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "content_reports_insert_own" ON "public"."content_reports" FOR INSERT TO "authenticated" WITH CHECK ((reporter_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "content_reports_select_own" ON "public"."content_reports" FOR SELECT TO "authenticated" USING ((reporter_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can insert their own creation attempts" ON "public"."creation_attempts" FOR INSERT TO PUBLIC WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can view their own creation attempts" ON "public"."creation_attempts" FOR SELECT TO PUBLIC USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users manage own daily panels" ON "public"."daily_challenge_panels" FOR ALL TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "edge_rate_limits_service_role_all" ON "public"."edge_rate_limits" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "equipped_items_select_own" ON "public"."equipped_items" FOR SELECT TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Anyone can suggest features" ON "public"."feature_requests" FOR INSERT TO "anon", "authenticated" WITH CHECK (((length(title) >= 1) AND (length(title) <= 200)));

CREATE POLICY "Anyone can view feature requests" ON "public"."feature_requests" FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "Anyone can view votes" ON "public"."feature_votes" FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "Anyone can vote" ON "public"."feature_votes" FOR INSERT TO "anon", "authenticated" WITH CHECK (((length(user_identifier) >= 1) AND (length(user_identifier) <= 100)));

CREATE POLICY "group_daily_status_select_member" ON "public"."group_daily_status" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM team_members tm
  WHERE ((tm.group_id = group_daily_status.group_id) AND (tm.user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "group_daily_status_service_role_all" ON "public"."group_daily_status" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "group_freeze_usages_service_role_all" ON "public"."group_freeze_usages" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "group_streak_tracking_select_member" ON "public"."group_streak_tracking" FOR SELECT TO "authenticated" USING ((is_current_user_team_member(group_id) OR is_current_user_team_owner(group_id)));

CREATE POLICY "group_streak_tracking_service_role_all" ON "public"."group_streak_tracking" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "inventory_items_select_own" ON "public"."inventory_items" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "invite_codes_service_role_all" ON "public"."invite_codes" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "Users manage own invite handoffs" ON "public"."invite_handoffs" FOR ALL TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "issues_insert" ON "public"."issues" FOR INSERT TO PUBLIC WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "issues_select" ON "public"."issues" FOR SELECT TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "legal_acceptance_receipts_select_own" ON "public"."legal_acceptance_receipts" FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY maintenance_logs_service_only ON public.maintenance_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service role maintenance" ON "public"."maintenance_runs" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "notification_jobs_service_role_all" ON "public"."notification_jobs" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "notification_preferences_all" ON "public"."notification_preferences" FOR ALL TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "notification_templates_select_public" ON "public"."notification_templates" FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "notification_templates_service_role_all" ON "public"."notification_templates" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "notifications_select" ON "public"."notifications" FOR SELECT TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "notifications_update" ON "public"."notifications" FOR UPDATE TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "power_up_usage_select_own" ON "public"."power_up_usage" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "profiles_directory_read" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) IS NOT NULL));

CREATE POLICY "proof_encouragements_delete_own" ON "public"."proof_encouragements" FOR DELETE TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "proof_encouragements_insert_own" ON "public"."proof_encouragements" FOR INSERT TO "authenticated" WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM challenge_submissions submission
  WHERE ((submission.id = proof_encouragements.submission_id) AND (submission.user_id <> ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM ((challenge_submissions submission
     JOIN team_challenges link ON ((link.challenge_id = submission.challenge_id)))
     JOIN team_members member ON ((member.group_id = link.group_id)))
  WHERE ((submission.id = proof_encouragements.submission_id) AND (member.user_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "proof_encouragements_select_visible" ON "public"."proof_encouragements" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (challenge_submissions submission
     JOIN challenges challenge ON ((challenge.id = submission.challenge_id)))
  WHERE ((submission.id = proof_encouragements.submission_id) AND ((challenge.creator_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM challenge_participants participant
          WHERE ((participant.challenge_id = challenge.id) AND (participant.user_id = ( SELECT auth.uid() AS uid)) AND (participant.status = 'active'::text)))) OR (EXISTS ( SELECT 1
           FROM (team_challenges link
             JOIN team_members member ON ((member.group_id = link.group_id)))
          WHERE ((link.challenge_id = challenge.id) AND (member.user_id = ( SELECT auth.uid() AS uid))))))))));

CREATE POLICY "Users manage own receipt states" ON "public"."purchase_receipt_states" FOR ALL TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "purchases_select_own" ON "public"."purchases" FOR SELECT TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users manage own queued proof" ON "public"."queued_proof_submissions" FOR ALL TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "rc_credit_mappings_read_authenticated" ON "public"."rc_credit_mappings" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "rc_credit_mappings_service_all" ON "public"."rc_credit_mappings" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "rc_entitlements_service_all" ON "public"."rc_entitlements" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "rc_entitlements_user_read_own" ON "public"."rc_entitlements" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "rc_receipts_service_all" ON "public"."rc_receipts" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "rc_receipts_user_read_own" ON "public"."rc_receipts" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "rc_webhook_events_service_all" ON "public"."rc_webhook_events" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "shop_purchase_receipts_select_own" ON "public"."shop_purchase_receipts" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "streak_checkin_applications_select_own" ON "public"."streak_checkin_applications" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "streak_day_outcomes_select_own" ON "public"."streak_day_outcomes" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "streak_freeze_log_read_own" ON "public"."streak_freeze_log" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "streak_unlock_receipts_select_own" ON "public"."streak_unlock_receipts" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Only verified admins can read system config" ON "public"."system_config" FOR SELECT TO "authenticated" USING ((( SELECT is_current_user_admin() AS is_current_user_admin) = true));

CREATE POLICY "system_config_delete_blocked" ON "public"."system_config" FOR DELETE TO "authenticated" USING (false);

CREATE POLICY "system_config_insert_blocked" ON "public"."system_config" FOR INSERT TO "authenticated" WITH CHECK (false);

CREATE POLICY "system_config_update_blocked" ON "public"."system_config" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "system_logs_service_role_all" ON "public"."system_logs" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "team_challenges_delete_owner_admin_mod" ON "public"."team_challenges" FOR DELETE TO "authenticated" USING (is_current_user_team_admin(group_id));

CREATE POLICY "team_challenges_insert_owned_challenge" ON "public"."team_challenges" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM teams team_row
  WHERE ((team_row.id = team_challenges.group_id) AND ((team_row.owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM team_members membership
          WHERE ((membership.group_id = team_row.id) AND (membership.user_id = ( SELECT auth.uid() AS uid)) AND (membership.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))))) AND (EXISTS ( SELECT 1
   FROM challenges challenge_row
  WHERE ((challenge_row.id = team_challenges.challenge_id) AND (challenge_row.creator_id = ( SELECT auth.uid() AS uid)))))));

CREATE POLICY "team_challenges_insert_owner_admin_mod" ON "public"."team_challenges" FOR INSERT TO "authenticated" WITH CHECK (is_current_user_team_admin(group_id));

CREATE POLICY "team_challenges_select_member" ON "public"."team_challenges" FOR SELECT TO "authenticated" USING (is_current_user_team_member(group_id));

CREATE POLICY "team_challenges_service_role_all" ON "public"."team_challenges" FOR ALL TO "service_role" USING (true) WITH CHECK (true);

CREATE POLICY "team_members_insert" ON "public"."team_members" FOR INSERT TO PUBLIC WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = team_members.group_id) AND (((t.privacy = 'public'::text) AND (team_members.role = 'member'::text)) OR (t.owner_id = ( SELECT auth.uid() AS uid))))))));

CREATE POLICY "team_members_select" ON "public"."team_members" FOR SELECT TO PUBLIC USING (((user_id = ( SELECT auth.uid() AS uid)) OR is_current_user_team_member(group_id) OR is_current_user_team_owner(group_id)));

CREATE POLICY "team_notification_preferences_all" ON "public"."team_notification_preferences" FOR ALL TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "teams_insert" ON "public"."teams" FOR INSERT TO PUBLIC WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "teams_select" ON "public"."teams" FOR SELECT TO PUBLIC USING (((privacy = 'public'::text) OR (owner_id = ( SELECT auth.uid() AS uid)) OR is_current_user_team_member(id)));

CREATE POLICY "teams_update" ON "public"."teams" FOR UPDATE TO PUBLIC USING ((owner_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can delete their own flags" ON "public"."user_flags" FOR DELETE TO PUBLIC USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can insert their own flags" ON "public"."user_flags" FOR INSERT TO PUBLIC WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can update their own flags" ON "public"."user_flags" FOR UPDATE TO PUBLIC USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can view their own flags" ON "public"."user_flags" FOR SELECT TO PUBLIC USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Anyone can join the waitlist" ON "public"."waitlist_emails" FOR INSERT TO "anon", "authenticated" WITH CHECK (((email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text) AND (length(email) <= 254)));

CREATE POLICY "wallet_transactions_read_own" ON "public"."wallet_transactions" FOR SELECT TO "authenticated" USING ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users manage own weekly recap" ON "public"."weekly_recap_snapshots" FOR ALL TO PUBLIC USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "challenge_images_delete" ON "storage"."objects" FOR DELETE TO "authenticated" USING (((bucket_id = 'challenge-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "challenge_images_update" ON "storage"."objects" FOR UPDATE TO "authenticated" USING (((bucket_id = 'challenge-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "event_media_owner_read_v1" ON "storage"."objects" FOR SELECT TO "authenticated" USING (((bucket_id = 'event-media'::text) AND storage.allow_any_operation(ARRAY['object.get_authenticated'::text, 'object.get_authenticated_info'::text]) AND event_can_read_own_media_v1(name)));

CREATE POLICY "profile_pictures_delete_own" ON "storage"."objects" FOR DELETE TO "authenticated" USING (((bucket_id = 'profile-pictures'::text) AND (owner_id = (( SELECT auth.uid() AS uid))::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "profile_pictures_insert_own" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'profile-pictures'::text) AND private.storage_upload_allowed_v1(bucket_id, name, owner_id, (metadata || jsonb_build_object('size', COALESCE((metadata ->> 'size'::text), (metadata ->> 'contentLength'::text), ''::text))))));

CREATE POLICY "profile_pictures_read_own" ON "storage"."objects" FOR SELECT TO "authenticated" USING (((bucket_id = 'profile-pictures'::text) AND (owner_id = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "proof_media_delete_unreferenced" ON "storage"."objects" FOR DELETE TO "authenticated" USING (((bucket_id = 'challenge-verifications'::text) AND (owner_id = (( SELECT auth.uid() AS uid))::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) AND (NOT (EXISTS ( SELECT 1
   FROM challenge_submissions cs
  WHERE (cs.media_url = objects.name))))));

CREATE POLICY "proof_media_insert_own" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'challenge-verifications'::text) AND private.storage_upload_allowed_v1(bucket_id, name, owner_id, (metadata || jsonb_build_object('size', COALESCE((metadata ->> 'size'::text), (metadata ->> 'contentLength'::text), ''::text)))) AND (NOT (EXISTS ( SELECT 1
   FROM challenge_submissions submission
  WHERE (submission.media_url = objects.name))))));

CREATE POLICY "proof_media_read_authorised" ON "storage"."objects" FOR SELECT TO "authenticated" USING (((bucket_id = 'challenge-verifications'::text) AND ((owner_id = (( SELECT auth.uid() AS uid))::text) OR (EXISTS ( SELECT 1
   FROM (challenge_submissions cs
     JOIN challenges c ON ((c.id = cs.challenge_id)))
  WHERE ((cs.media_url = objects.name) AND ((cs.user_id = ( SELECT auth.uid() AS uid)) OR (c.creator_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM challenge_participants cp
          WHERE ((cp.challenge_id = cs.challenge_id) AND (cp.user_id = ( SELECT auth.uid() AS uid)) AND (COALESCE(cp.status, 'active'::text) = 'active'::text)))) OR (EXISTS ( SELECT 1
           FROM (team_challenges tc
             JOIN team_members tm ON ((tm.group_id = tc.group_id)))
          WHERE ((tc.challenge_id = cs.challenge_id) AND (tm.user_id = ( SELECT auth.uid() AS uid))))))))))));

CREATE POLICY "support_attachments_delete_own" ON "storage"."objects" FOR DELETE TO "authenticated" USING (((bucket_id = 'support-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

CREATE POLICY "support_attachments_insert_own" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'support-attachments'::text) AND private.storage_upload_allowed_v1(bucket_id, name, owner_id, (metadata || jsonb_build_object('size', COALESCE((metadata ->> 'size'::text), (metadata ->> 'contentLength'::text), ''::text))))));

CREATE POLICY "support_attachments_select_own" ON "storage"."objects" FOR SELECT TO "authenticated" USING (((bucket_id = 'support-attachments'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));

REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM PUBLIC, anon, authenticated;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM PUBLIC, anon, authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA "public" TO service_role;

REVOKE ALL ON ALL TABLES IN SCHEMA "private" FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "private" FROM PUBLIC, anon, authenticated;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA "private" FROM PUBLIC, anon, authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA "private" TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA "private" TO service_role;

GRANT INSERT ON "public"."legal_document_versions" TO "service_role";

GRANT SELECT ON "public"."legal_document_versions" TO "service_role";

GRANT UPDATE ON "public"."legal_document_versions" TO "service_role";

GRANT DELETE ON "public"."legal_document_versions" TO "service_role";

GRANT TRUNCATE ON "public"."legal_document_versions" TO "service_role";

GRANT REFERENCES ON "public"."legal_document_versions" TO "service_role";

GRANT TRIGGER ON "public"."legal_document_versions" TO "service_role";

GRANT INSERT ON "public"."legal_acceptance_enforcement_settings" TO "service_role";

GRANT SELECT ON "public"."legal_acceptance_enforcement_settings" TO "service_role";

GRANT UPDATE ON "public"."legal_acceptance_enforcement_settings" TO "service_role";

GRANT DELETE ON "public"."legal_acceptance_enforcement_settings" TO "service_role";

GRANT TRUNCATE ON "public"."legal_acceptance_enforcement_settings" TO "service_role";

GRANT REFERENCES ON "public"."legal_acceptance_enforcement_settings" TO "service_role";

GRANT TRIGGER ON "public"."legal_acceptance_enforcement_settings" TO "service_role";

GRANT INSERT ON "public"."legal_acceptance_receipts" TO "service_role";

GRANT SELECT ON "public"."legal_acceptance_receipts" TO "service_role";

GRANT UPDATE ON "public"."legal_acceptance_receipts" TO "service_role";

GRANT DELETE ON "public"."legal_acceptance_receipts" TO "service_role";

GRANT TRUNCATE ON "public"."legal_acceptance_receipts" TO "service_role";

GRANT REFERENCES ON "public"."legal_acceptance_receipts" TO "service_role";

GRANT TRIGGER ON "public"."legal_acceptance_receipts" TO "service_role";

GRANT SELECT ON "public"."legal_acceptance_receipts" TO "authenticated";

GRANT INSERT ON "public"."system_config" TO "anon";

GRANT SELECT ON "public"."system_config" TO "anon";

GRANT UPDATE ON "public"."system_config" TO "anon";

GRANT DELETE ON "public"."system_config" TO "anon";

GRANT INSERT ON "public"."system_config" TO "authenticated";

GRANT SELECT ON "public"."system_config" TO "authenticated";

GRANT UPDATE ON "public"."system_config" TO "authenticated";

GRANT DELETE ON "public"."system_config" TO "authenticated";

GRANT INSERT ON "public"."system_config" TO "service_role";

GRANT SELECT ON "public"."system_config" TO "service_role";

GRANT UPDATE ON "public"."system_config" TO "service_role";

GRANT DELETE ON "public"."system_config" TO "service_role";

GRANT TRUNCATE ON "public"."system_config" TO "service_role";

GRANT REFERENCES ON "public"."system_config" TO "service_role";

GRANT TRIGGER ON "public"."system_config" TO "service_role";

GRANT INSERT ON "public"."user_flags" TO "anon";

GRANT SELECT ON "public"."user_flags" TO "anon";

GRANT UPDATE ON "public"."user_flags" TO "anon";

GRANT DELETE ON "public"."user_flags" TO "anon";

GRANT INSERT ON "public"."user_flags" TO "authenticated";

GRANT SELECT ON "public"."user_flags" TO "authenticated";

GRANT UPDATE ON "public"."user_flags" TO "authenticated";

GRANT DELETE ON "public"."user_flags" TO "authenticated";

GRANT INSERT ON "public"."user_flags" TO "service_role";

GRANT SELECT ON "public"."user_flags" TO "service_role";

GRANT UPDATE ON "public"."user_flags" TO "service_role";

GRANT DELETE ON "public"."user_flags" TO "service_role";

GRANT TRUNCATE ON "public"."user_flags" TO "service_role";

GRANT REFERENCES ON "public"."user_flags" TO "service_role";

GRANT TRIGGER ON "public"."user_flags" TO "service_role";

GRANT INSERT ON "public"."streak_day_outcomes" TO "service_role";

GRANT SELECT ON "public"."streak_day_outcomes" TO "service_role";

GRANT UPDATE ON "public"."streak_day_outcomes" TO "service_role";

GRANT DELETE ON "public"."streak_day_outcomes" TO "service_role";

GRANT TRUNCATE ON "public"."streak_day_outcomes" TO "service_role";

GRANT REFERENCES ON "public"."streak_day_outcomes" TO "service_role";

GRANT TRIGGER ON "public"."streak_day_outcomes" TO "service_role";

GRANT SELECT ON "public"."streak_day_outcomes" TO "authenticated";

GRANT INSERT ON "public"."creation_attempts" TO "anon";

GRANT SELECT ON "public"."creation_attempts" TO "anon";

GRANT UPDATE ON "public"."creation_attempts" TO "anon";

GRANT DELETE ON "public"."creation_attempts" TO "anon";

GRANT INSERT ON "public"."creation_attempts" TO "authenticated";

GRANT SELECT ON "public"."creation_attempts" TO "authenticated";

GRANT UPDATE ON "public"."creation_attempts" TO "authenticated";

GRANT DELETE ON "public"."creation_attempts" TO "authenticated";

GRANT INSERT ON "public"."creation_attempts" TO "service_role";

GRANT SELECT ON "public"."creation_attempts" TO "service_role";

GRANT UPDATE ON "public"."creation_attempts" TO "service_role";

GRANT DELETE ON "public"."creation_attempts" TO "service_role";

GRANT TRUNCATE ON "public"."creation_attempts" TO "service_role";

GRANT REFERENCES ON "public"."creation_attempts" TO "service_role";

GRANT TRIGGER ON "public"."creation_attempts" TO "service_role";

GRANT INSERT ON "public"."streak_checkin_applications" TO "service_role";

GRANT SELECT ON "public"."streak_checkin_applications" TO "service_role";

GRANT UPDATE ON "public"."streak_checkin_applications" TO "service_role";

GRANT DELETE ON "public"."streak_checkin_applications" TO "service_role";

GRANT TRUNCATE ON "public"."streak_checkin_applications" TO "service_role";

GRANT REFERENCES ON "public"."streak_checkin_applications" TO "service_role";

GRANT TRIGGER ON "public"."streak_checkin_applications" TO "service_role";

GRANT SELECT ON "public"."streak_checkin_applications" TO "authenticated";

GRANT INSERT ON "public"."proof_encouragements" TO "authenticated";

GRANT SELECT ON "public"."proof_encouragements" TO "authenticated";

GRANT DELETE ON "public"."proof_encouragements" TO "authenticated";

GRANT INSERT ON "public"."proof_encouragements" TO "service_role";

GRANT SELECT ON "public"."proof_encouragements" TO "service_role";

GRANT DELETE ON "public"."proof_encouragements" TO "service_role";

GRANT INSERT ON "public"."challenge_submissions" TO "service_role";

GRANT SELECT ON "public"."challenge_submissions" TO "service_role";

GRANT UPDATE ON "public"."challenge_submissions" TO "service_role";

GRANT DELETE ON "public"."challenge_submissions" TO "service_role";

GRANT TRUNCATE ON "public"."challenge_submissions" TO "service_role";

GRANT REFERENCES ON "public"."challenge_submissions" TO "service_role";

GRANT TRIGGER ON "public"."challenge_submissions" TO "service_role";

GRANT SELECT ON "public"."challenge_submissions" TO "authenticated";

GRANT INSERT ON "public"."notification_jobs" TO "service_role";

GRANT SELECT ON "public"."notification_jobs" TO "service_role";

GRANT UPDATE ON "public"."notification_jobs" TO "service_role";

GRANT DELETE ON "public"."notification_jobs" TO "service_role";

GRANT TRUNCATE ON "public"."notification_jobs" TO "service_role";

GRANT REFERENCES ON "public"."notification_jobs" TO "service_role";

GRANT TRIGGER ON "public"."notification_jobs" TO "service_role";

GRANT INSERT ON "private"."account_activation_receipts" TO "service_role";

GRANT SELECT ON "private"."account_activation_receipts" TO "service_role";

GRANT UPDATE ON "private"."account_activation_receipts" TO "service_role";

GRANT DELETE ON "private"."account_activation_receipts" TO "service_role";

GRANT TRUNCATE ON "private"."account_activation_receipts" TO "service_role";

GRANT REFERENCES ON "private"."account_activation_receipts" TO "service_role";

GRANT TRIGGER ON "private"."account_activation_receipts" TO "service_role";

GRANT INSERT ON "public"."group_stats" TO "anon";

GRANT SELECT ON "public"."group_stats" TO "anon";

GRANT UPDATE ON "public"."group_stats" TO "anon";

GRANT DELETE ON "public"."group_stats" TO "anon";

GRANT TRUNCATE ON "public"."group_stats" TO "anon";

GRANT REFERENCES ON "public"."group_stats" TO "anon";

GRANT TRIGGER ON "public"."group_stats" TO "anon";

GRANT INSERT ON "public"."group_stats" TO "authenticated";

GRANT SELECT ON "public"."group_stats" TO "authenticated";

GRANT UPDATE ON "public"."group_stats" TO "authenticated";

GRANT DELETE ON "public"."group_stats" TO "authenticated";

GRANT TRUNCATE ON "public"."group_stats" TO "authenticated";

GRANT REFERENCES ON "public"."group_stats" TO "authenticated";

GRANT TRIGGER ON "public"."group_stats" TO "authenticated";

GRANT INSERT ON "public"."group_stats" TO "service_role";

GRANT SELECT ON "public"."group_stats" TO "service_role";

GRANT UPDATE ON "public"."group_stats" TO "service_role";

GRANT DELETE ON "public"."group_stats" TO "service_role";

GRANT TRUNCATE ON "public"."group_stats" TO "service_role";

GRANT REFERENCES ON "public"."group_stats" TO "service_role";

GRANT TRIGGER ON "public"."group_stats" TO "service_role";

GRANT INSERT ON "public"."profile_directory" TO "service_role";

GRANT SELECT ON "public"."profile_directory" TO "service_role";

GRANT UPDATE ON "public"."profile_directory" TO "service_role";

GRANT DELETE ON "public"."profile_directory" TO "service_role";

GRANT TRUNCATE ON "public"."profile_directory" TO "service_role";

GRANT REFERENCES ON "public"."profile_directory" TO "service_role";

GRANT TRIGGER ON "public"."profile_directory" TO "service_role";

GRANT SELECT ON "public"."profile_directory" TO "authenticated";

GRANT INSERT ON "private"."storage_upload_usage_v1" TO "service_role";

GRANT SELECT ON "private"."storage_upload_usage_v1" TO "service_role";

GRANT UPDATE ON "private"."storage_upload_usage_v1" TO "service_role";

GRANT DELETE ON "private"."storage_upload_usage_v1" TO "service_role";

GRANT TRUNCATE ON "private"."storage_upload_usage_v1" TO "service_role";

GRANT REFERENCES ON "private"."storage_upload_usage_v1" TO "service_role";

GRANT TRIGGER ON "private"."storage_upload_usage_v1" TO "service_role";

GRANT SELECT ON "public"."notifications" TO "anon";

GRANT DELETE ON "public"."notifications" TO "anon";

GRANT SELECT ON "public"."notifications" TO "authenticated";

GRANT DELETE ON "public"."notifications" TO "authenticated";

GRANT INSERT ON "public"."notifications" TO "service_role";

GRANT SELECT ON "public"."notifications" TO "service_role";

GRANT UPDATE ON "public"."notifications" TO "service_role";

GRANT DELETE ON "public"."notifications" TO "service_role";

GRANT TRUNCATE ON "public"."notifications" TO "service_role";

GRANT REFERENCES ON "public"."notifications" TO "service_role";

GRANT TRIGGER ON "public"."notifications" TO "service_role";

GRANT INSERT ON "public"."rc_webhook_events" TO "service_role";

GRANT SELECT ON "public"."rc_webhook_events" TO "service_role";

GRANT UPDATE ON "public"."rc_webhook_events" TO "service_role";

GRANT DELETE ON "public"."rc_webhook_events" TO "service_role";

GRANT TRUNCATE ON "public"."rc_webhook_events" TO "service_role";

GRANT REFERENCES ON "public"."rc_webhook_events" TO "service_role";

GRANT TRIGGER ON "public"."rc_webhook_events" TO "service_role";

GRANT INSERT ON "public"."group_daily_status" TO "service_role";

GRANT SELECT ON "public"."group_daily_status" TO "service_role";

GRANT UPDATE ON "public"."group_daily_status" TO "service_role";

GRANT DELETE ON "public"."group_daily_status" TO "service_role";

GRANT TRUNCATE ON "public"."group_daily_status" TO "service_role";

GRANT REFERENCES ON "public"."group_daily_status" TO "service_role";

GRANT TRIGGER ON "public"."group_daily_status" TO "service_role";

GRANT SELECT ON "private"."content_report_submission_receipts_v1" TO "service_role";

GRANT INSERT ON "public"."group_streak_tracking" TO "service_role";

GRANT SELECT ON "public"."group_streak_tracking" TO "service_role";

GRANT UPDATE ON "public"."group_streak_tracking" TO "service_role";

GRANT DELETE ON "public"."group_streak_tracking" TO "service_role";

GRANT TRUNCATE ON "public"."group_streak_tracking" TO "service_role";

GRANT REFERENCES ON "public"."group_streak_tracking" TO "service_role";

GRANT TRIGGER ON "public"."group_streak_tracking" TO "service_role";

GRANT SELECT ON "public"."group_streak_tracking" TO "authenticated";

GRANT SELECT ON "private"."user_block_submission_receipts_v1" TO "service_role";

GRANT SELECT ON "public"."challenges" TO "anon";

GRANT UPDATE ON "public"."challenges" TO "anon";

GRANT DELETE ON "public"."challenges" TO "anon";

GRANT SELECT ON "public"."challenges" TO "authenticated";

GRANT UPDATE ON "public"."challenges" TO "authenticated";

GRANT DELETE ON "public"."challenges" TO "authenticated";

GRANT INSERT ON "public"."challenges" TO "service_role";

GRANT SELECT ON "public"."challenges" TO "service_role";

GRANT UPDATE ON "public"."challenges" TO "service_role";

GRANT DELETE ON "public"."challenges" TO "service_role";

GRANT TRUNCATE ON "public"."challenges" TO "service_role";

GRANT REFERENCES ON "public"."challenges" TO "service_role";

GRANT TRIGGER ON "public"."challenges" TO "service_role";

GRANT INSERT ON "public"."team_challenges" TO "service_role";

GRANT SELECT ON "public"."team_challenges" TO "service_role";

GRANT UPDATE ON "public"."team_challenges" TO "service_role";

GRANT DELETE ON "public"."team_challenges" TO "service_role";

GRANT TRUNCATE ON "public"."team_challenges" TO "service_role";

GRANT REFERENCES ON "public"."team_challenges" TO "service_role";

GRANT TRIGGER ON "public"."team_challenges" TO "service_role";

GRANT SELECT ON "public"."team_challenges" TO "authenticated";

GRANT INSERT ON "public"."notification_preferences" TO "anon";

GRANT SELECT ON "public"."notification_preferences" TO "anon";

GRANT UPDATE ON "public"."notification_preferences" TO "anon";

GRANT DELETE ON "public"."notification_preferences" TO "anon";

GRANT INSERT ON "public"."notification_preferences" TO "authenticated";

GRANT SELECT ON "public"."notification_preferences" TO "authenticated";

GRANT UPDATE ON "public"."notification_preferences" TO "authenticated";

GRANT DELETE ON "public"."notification_preferences" TO "authenticated";

GRANT INSERT ON "public"."notification_preferences" TO "service_role";

GRANT SELECT ON "public"."notification_preferences" TO "service_role";

GRANT UPDATE ON "public"."notification_preferences" TO "service_role";

GRANT DELETE ON "public"."notification_preferences" TO "service_role";

GRANT TRUNCATE ON "public"."notification_preferences" TO "service_role";

GRANT REFERENCES ON "public"."notification_preferences" TO "service_role";

GRANT TRIGGER ON "public"."notification_preferences" TO "service_role";

GRANT INSERT ON "public"."invite_codes" TO "service_role";

GRANT SELECT ON "public"."invite_codes" TO "service_role";

GRANT UPDATE ON "public"."invite_codes" TO "service_role";

GRANT DELETE ON "public"."invite_codes" TO "service_role";

GRANT TRUNCATE ON "public"."invite_codes" TO "service_role";

GRANT REFERENCES ON "public"."invite_codes" TO "service_role";

GRANT TRIGGER ON "public"."invite_codes" TO "service_role";

GRANT SELECT ON "public"."teams" TO "anon";

GRANT UPDATE ON "public"."teams" TO "anon";

GRANT DELETE ON "public"."teams" TO "anon";

GRANT SELECT ON "public"."teams" TO "authenticated";

GRANT UPDATE ON "public"."teams" TO "authenticated";

GRANT DELETE ON "public"."teams" TO "authenticated";

GRANT INSERT ON "public"."teams" TO "service_role";

GRANT SELECT ON "public"."teams" TO "service_role";

GRANT UPDATE ON "public"."teams" TO "service_role";

GRANT DELETE ON "public"."teams" TO "service_role";

GRANT TRUNCATE ON "public"."teams" TO "service_role";

GRANT REFERENCES ON "public"."teams" TO "service_role";

GRANT TRIGGER ON "public"."teams" TO "service_role";

GRANT INSERT ON "public"."team_notification_preferences" TO "anon";

GRANT SELECT ON "public"."team_notification_preferences" TO "anon";

GRANT UPDATE ON "public"."team_notification_preferences" TO "anon";

GRANT DELETE ON "public"."team_notification_preferences" TO "anon";

GRANT INSERT ON "public"."team_notification_preferences" TO "authenticated";

GRANT SELECT ON "public"."team_notification_preferences" TO "authenticated";

GRANT UPDATE ON "public"."team_notification_preferences" TO "authenticated";

GRANT DELETE ON "public"."team_notification_preferences" TO "authenticated";

GRANT INSERT ON "public"."team_notification_preferences" TO "service_role";

GRANT SELECT ON "public"."team_notification_preferences" TO "service_role";

GRANT UPDATE ON "public"."team_notification_preferences" TO "service_role";

GRANT DELETE ON "public"."team_notification_preferences" TO "service_role";

GRANT TRUNCATE ON "public"."team_notification_preferences" TO "service_role";

GRANT REFERENCES ON "public"."team_notification_preferences" TO "service_role";

GRANT TRIGGER ON "public"."team_notification_preferences" TO "service_role";

GRANT INSERT ON "public"."profiles" TO "service_role";

GRANT SELECT ON "public"."profiles" TO "service_role";

GRANT UPDATE ON "public"."profiles" TO "service_role";

GRANT DELETE ON "public"."profiles" TO "service_role";

GRANT TRUNCATE ON "public"."profiles" TO "service_role";

GRANT REFERENCES ON "public"."profiles" TO "service_role";

GRANT TRIGGER ON "public"."profiles" TO "service_role";

GRANT INSERT ON "public"."wallet_transactions" TO "service_role";

GRANT SELECT ON "public"."wallet_transactions" TO "service_role";

GRANT UPDATE ON "public"."wallet_transactions" TO "service_role";

GRANT DELETE ON "public"."wallet_transactions" TO "service_role";

GRANT TRUNCATE ON "public"."wallet_transactions" TO "service_role";

GRANT REFERENCES ON "public"."wallet_transactions" TO "service_role";

GRANT TRIGGER ON "public"."wallet_transactions" TO "service_role";

GRANT SELECT ON "public"."wallet_transactions" TO "authenticated";

GRANT SELECT ON "public"."team_members" TO "anon";

GRANT UPDATE ON "public"."team_members" TO "anon";

GRANT DELETE ON "public"."team_members" TO "anon";

GRANT SELECT ON "public"."team_members" TO "authenticated";

GRANT UPDATE ON "public"."team_members" TO "authenticated";

GRANT DELETE ON "public"."team_members" TO "authenticated";

GRANT INSERT ON "public"."team_members" TO "service_role";

GRANT SELECT ON "public"."team_members" TO "service_role";

GRANT UPDATE ON "public"."team_members" TO "service_role";

GRANT DELETE ON "public"."team_members" TO "service_role";

GRANT TRUNCATE ON "public"."team_members" TO "service_role";

GRANT REFERENCES ON "public"."team_members" TO "service_role";

GRANT TRIGGER ON "public"."team_members" TO "service_role";

GRANT INSERT ON "public"."equipped_items" TO "anon";

GRANT SELECT ON "public"."equipped_items" TO "anon";

GRANT UPDATE ON "public"."equipped_items" TO "anon";

GRANT DELETE ON "public"."equipped_items" TO "anon";

GRANT INSERT ON "public"."equipped_items" TO "authenticated";

GRANT SELECT ON "public"."equipped_items" TO "authenticated";

GRANT UPDATE ON "public"."equipped_items" TO "authenticated";

GRANT DELETE ON "public"."equipped_items" TO "authenticated";

GRANT INSERT ON "public"."equipped_items" TO "service_role";

GRANT SELECT ON "public"."equipped_items" TO "service_role";

GRANT UPDATE ON "public"."equipped_items" TO "service_role";

GRANT DELETE ON "public"."equipped_items" TO "service_role";

GRANT TRUNCATE ON "public"."equipped_items" TO "service_role";

GRANT REFERENCES ON "public"."equipped_items" TO "service_role";

GRANT TRIGGER ON "public"."equipped_items" TO "service_role";

GRANT INSERT ON "public"."purchases" TO "anon";

GRANT SELECT ON "public"."purchases" TO "anon";

GRANT UPDATE ON "public"."purchases" TO "anon";

GRANT DELETE ON "public"."purchases" TO "anon";

GRANT INSERT ON "public"."purchases" TO "authenticated";

GRANT SELECT ON "public"."purchases" TO "authenticated";

GRANT UPDATE ON "public"."purchases" TO "authenticated";

GRANT DELETE ON "public"."purchases" TO "authenticated";

GRANT INSERT ON "public"."purchases" TO "service_role";

GRANT SELECT ON "public"."purchases" TO "service_role";

GRANT UPDATE ON "public"."purchases" TO "service_role";

GRANT DELETE ON "public"."purchases" TO "service_role";

GRANT TRUNCATE ON "public"."purchases" TO "service_role";

GRANT REFERENCES ON "public"."purchases" TO "service_role";

GRANT TRIGGER ON "public"."purchases" TO "service_role";

GRANT INSERT ON "public"."catalog_items" TO "anon";

GRANT SELECT ON "public"."catalog_items" TO "anon";

GRANT UPDATE ON "public"."catalog_items" TO "anon";

GRANT DELETE ON "public"."catalog_items" TO "anon";

GRANT INSERT ON "public"."catalog_items" TO "authenticated";

GRANT SELECT ON "public"."catalog_items" TO "authenticated";

GRANT UPDATE ON "public"."catalog_items" TO "authenticated";

GRANT DELETE ON "public"."catalog_items" TO "authenticated";

GRANT INSERT ON "public"."catalog_items" TO "service_role";

GRANT SELECT ON "public"."catalog_items" TO "service_role";

GRANT UPDATE ON "public"."catalog_items" TO "service_role";

GRANT DELETE ON "public"."catalog_items" TO "service_role";

GRANT TRUNCATE ON "public"."catalog_items" TO "service_role";

GRANT REFERENCES ON "public"."catalog_items" TO "service_role";

GRANT TRIGGER ON "public"."catalog_items" TO "service_role";

GRANT INSERT ON "private"."account_deletion_guards_v1" TO "service_role";

GRANT SELECT ON "private"."account_deletion_guards_v1" TO "service_role";

GRANT UPDATE ON "private"."account_deletion_guards_v1" TO "service_role";

GRANT DELETE ON "private"."account_deletion_guards_v1" TO "service_role";

GRANT INSERT ON "public"."issues" TO "anon";

GRANT SELECT ON "public"."issues" TO "anon";

GRANT UPDATE ON "public"."issues" TO "anon";

GRANT DELETE ON "public"."issues" TO "anon";

GRANT INSERT ON "public"."issues" TO "authenticated";

GRANT SELECT ON "public"."issues" TO "authenticated";

GRANT UPDATE ON "public"."issues" TO "authenticated";

GRANT DELETE ON "public"."issues" TO "authenticated";

GRANT INSERT ON "public"."issues" TO "service_role";

GRANT SELECT ON "public"."issues" TO "service_role";

GRANT UPDATE ON "public"."issues" TO "service_role";

GRANT DELETE ON "public"."issues" TO "service_role";

GRANT TRUNCATE ON "public"."issues" TO "service_role";

GRANT REFERENCES ON "public"."issues" TO "service_role";

GRANT TRIGGER ON "public"."issues" TO "service_role";

GRANT INSERT ON "public"."content_reports" TO "service_role";

GRANT SELECT ON "public"."content_reports" TO "service_role";

GRANT UPDATE ON "public"."content_reports" TO "service_role";

GRANT DELETE ON "public"."content_reports" TO "service_role";

GRANT TRUNCATE ON "public"."content_reports" TO "service_role";

GRANT REFERENCES ON "public"."content_reports" TO "service_role";

GRANT TRIGGER ON "public"."content_reports" TO "service_role";

GRANT SELECT ON "public"."content_reports" TO "authenticated";

GRANT INSERT ON "public"."inventory_items" TO "service_role";

GRANT SELECT ON "public"."inventory_items" TO "service_role";

GRANT UPDATE ON "public"."inventory_items" TO "service_role";

GRANT DELETE ON "public"."inventory_items" TO "service_role";

GRANT TRUNCATE ON "public"."inventory_items" TO "service_role";

GRANT REFERENCES ON "public"."inventory_items" TO "service_role";

GRANT TRIGGER ON "public"."inventory_items" TO "service_role";

GRANT SELECT ON "public"."inventory_items" TO "authenticated";

GRANT INSERT ON "public"."blocked_users" TO "service_role";

GRANT SELECT ON "public"."blocked_users" TO "service_role";

GRANT UPDATE ON "public"."blocked_users" TO "service_role";

GRANT DELETE ON "public"."blocked_users" TO "service_role";

GRANT TRUNCATE ON "public"."blocked_users" TO "service_role";

GRANT REFERENCES ON "public"."blocked_users" TO "service_role";

GRANT TRIGGER ON "public"."blocked_users" TO "service_role";

GRANT SELECT ON "public"."blocked_users" TO "authenticated";

GRANT DELETE ON "public"."blocked_users" TO "authenticated";

GRANT INSERT ON "public"."group_freeze_usages" TO "service_role";

GRANT SELECT ON "public"."group_freeze_usages" TO "service_role";

GRANT UPDATE ON "public"."group_freeze_usages" TO "service_role";

GRANT DELETE ON "public"."group_freeze_usages" TO "service_role";

GRANT TRUNCATE ON "public"."group_freeze_usages" TO "service_role";

GRANT REFERENCES ON "public"."group_freeze_usages" TO "service_role";

GRANT TRIGGER ON "public"."group_freeze_usages" TO "service_role";

GRANT INSERT ON "public"."system_logs" TO "service_role";

GRANT SELECT ON "public"."system_logs" TO "service_role";

GRANT UPDATE ON "public"."system_logs" TO "service_role";

GRANT DELETE ON "public"."system_logs" TO "service_role";

GRANT TRUNCATE ON "public"."system_logs" TO "service_role";

GRANT REFERENCES ON "public"."system_logs" TO "service_role";

GRANT TRIGGER ON "public"."system_logs" TO "service_role";

GRANT INSERT ON "public"."beta_waitlist" TO "service_role";

GRANT SELECT ON "public"."beta_waitlist" TO "service_role";

GRANT UPDATE ON "public"."beta_waitlist" TO "service_role";

GRANT DELETE ON "public"."beta_waitlist" TO "service_role";

GRANT TRUNCATE ON "public"."beta_waitlist" TO "service_role";

GRANT REFERENCES ON "public"."beta_waitlist" TO "service_role";

GRANT TRIGGER ON "public"."beta_waitlist" TO "service_role";

GRANT INSERT ON "public"."beta_waitlist" TO "anon";

GRANT INSERT ON "public"."beta_waitlist" TO "authenticated";

GRANT INSERT ON "public"."edge_rate_limits" TO "service_role";

GRANT SELECT ON "public"."edge_rate_limits" TO "service_role";

GRANT UPDATE ON "public"."edge_rate_limits" TO "service_role";

GRANT DELETE ON "public"."edge_rate_limits" TO "service_role";

GRANT TRUNCATE ON "public"."edge_rate_limits" TO "service_role";

GRANT REFERENCES ON "public"."edge_rate_limits" TO "service_role";

GRANT TRIGGER ON "public"."edge_rate_limits" TO "service_role";

GRANT INSERT ON "public"."shop_purchase_receipts" TO "service_role";

GRANT SELECT ON "public"."shop_purchase_receipts" TO "service_role";

GRANT UPDATE ON "public"."shop_purchase_receipts" TO "service_role";

GRANT DELETE ON "public"."shop_purchase_receipts" TO "service_role";

GRANT TRUNCATE ON "public"."shop_purchase_receipts" TO "service_role";

GRANT REFERENCES ON "public"."shop_purchase_receipts" TO "service_role";

GRANT TRIGGER ON "public"."shop_purchase_receipts" TO "service_role";

GRANT SELECT ON "public"."shop_purchase_receipts" TO "authenticated";

GRANT INSERT ON "public"."power_up_usage" TO "service_role";

GRANT SELECT ON "public"."power_up_usage" TO "service_role";

GRANT UPDATE ON "public"."power_up_usage" TO "service_role";

GRANT DELETE ON "public"."power_up_usage" TO "service_role";

GRANT TRUNCATE ON "public"."power_up_usage" TO "service_role";

GRANT REFERENCES ON "public"."power_up_usage" TO "service_role";

GRANT TRIGGER ON "public"."power_up_usage" TO "service_role";

GRANT SELECT ON "public"."power_up_usage" TO "authenticated";

GRANT INSERT ON "public"."waitlist_emails" TO "service_role";

GRANT SELECT ON "public"."waitlist_emails" TO "service_role";

GRANT UPDATE ON "public"."waitlist_emails" TO "service_role";

GRANT DELETE ON "public"."waitlist_emails" TO "service_role";

GRANT TRUNCATE ON "public"."waitlist_emails" TO "service_role";

GRANT REFERENCES ON "public"."waitlist_emails" TO "service_role";

GRANT TRIGGER ON "public"."waitlist_emails" TO "service_role";

GRANT INSERT ON "public"."waitlist_emails" TO "anon";

GRANT INSERT ON "public"."waitlist_emails" TO "authenticated";

GRANT INSERT ON "public"."event_action_receipts" TO "service_role";

GRANT SELECT ON "public"."event_action_receipts" TO "service_role";

GRANT UPDATE ON "public"."event_action_receipts" TO "service_role";

GRANT DELETE ON "public"."event_action_receipts" TO "service_role";

GRANT TRUNCATE ON "public"."event_action_receipts" TO "service_role";

GRANT REFERENCES ON "public"."event_action_receipts" TO "service_role";

GRANT TRIGGER ON "public"."event_action_receipts" TO "service_role";

GRANT INSERT ON "public"."event_events" TO "service_role";

GRANT SELECT ON "public"."event_events" TO "service_role";

GRANT UPDATE ON "public"."event_events" TO "service_role";

GRANT DELETE ON "public"."event_events" TO "service_role";

GRANT TRUNCATE ON "public"."event_events" TO "service_role";

GRANT REFERENCES ON "public"."event_events" TO "service_role";

GRANT TRIGGER ON "public"."event_events" TO "service_role";

GRANT INSERT ON "public"."event_occurrences" TO "service_role";

GRANT SELECT ON "public"."event_occurrences" TO "service_role";

GRANT UPDATE ON "public"."event_occurrences" TO "service_role";

GRANT DELETE ON "public"."event_occurrences" TO "service_role";

GRANT TRUNCATE ON "public"."event_occurrences" TO "service_role";

GRANT REFERENCES ON "public"."event_occurrences" TO "service_role";

GRANT TRIGGER ON "public"."event_occurrences" TO "service_role";

GRANT INSERT ON "public"."event_invites" TO "service_role";

GRANT SELECT ON "public"."event_invites" TO "service_role";

GRANT UPDATE ON "public"."event_invites" TO "service_role";

GRANT DELETE ON "public"."event_invites" TO "service_role";

GRANT TRUNCATE ON "public"."event_invites" TO "service_role";

GRANT REFERENCES ON "public"."event_invites" TO "service_role";

GRANT TRIGGER ON "public"."event_invites" TO "service_role";

GRANT INSERT ON "public"."event_attendances" TO "service_role";

GRANT SELECT ON "public"."event_attendances" TO "service_role";

GRANT UPDATE ON "public"."event_attendances" TO "service_role";

GRANT DELETE ON "public"."event_attendances" TO "service_role";

GRANT TRUNCATE ON "public"."event_attendances" TO "service_role";

GRANT REFERENCES ON "public"."event_attendances" TO "service_role";

GRANT TRIGGER ON "public"."event_attendances" TO "service_role";

GRANT INSERT ON "public"."event_checkin_tokens" TO "service_role";

GRANT SELECT ON "public"."event_checkin_tokens" TO "service_role";

GRANT UPDATE ON "public"."event_checkin_tokens" TO "service_role";

GRANT DELETE ON "public"."event_checkin_tokens" TO "service_role";

GRANT TRUNCATE ON "public"."event_checkin_tokens" TO "service_role";

GRANT REFERENCES ON "public"."event_checkin_tokens" TO "service_role";

GRANT TRIGGER ON "public"."event_checkin_tokens" TO "service_role";

GRANT INSERT ON "public"."event_checkin_token_redemptions" TO "service_role";

GRANT SELECT ON "public"."event_checkin_token_redemptions" TO "service_role";

GRANT UPDATE ON "public"."event_checkin_token_redemptions" TO "service_role";

GRANT DELETE ON "public"."event_checkin_token_redemptions" TO "service_role";

GRANT TRUNCATE ON "public"."event_checkin_token_redemptions" TO "service_role";

GRANT REFERENCES ON "public"."event_checkin_token_redemptions" TO "service_role";

GRANT TRIGGER ON "public"."event_checkin_token_redemptions" TO "service_role";

GRANT INSERT ON "public"."event_checkins" TO "service_role";

GRANT SELECT ON "public"."event_checkins" TO "service_role";

GRANT UPDATE ON "public"."event_checkins" TO "service_role";

GRANT DELETE ON "public"."event_checkins" TO "service_role";

GRANT TRUNCATE ON "public"."event_checkins" TO "service_role";

GRANT REFERENCES ON "public"."event_checkins" TO "service_role";

GRANT TRIGGER ON "public"."event_checkins" TO "service_role";

GRANT INSERT ON "public"."event_posts" TO "service_role";

GRANT SELECT ON "public"."event_posts" TO "service_role";

GRANT UPDATE ON "public"."event_posts" TO "service_role";

GRANT DELETE ON "public"."event_posts" TO "service_role";

GRANT TRUNCATE ON "public"."event_posts" TO "service_role";

GRANT REFERENCES ON "public"."event_posts" TO "service_role";

GRANT TRIGGER ON "public"."event_posts" TO "service_role";

GRANT INSERT ON "public"."event_audit_log" TO "service_role";

GRANT SELECT ON "public"."event_audit_log" TO "service_role";

GRANT UPDATE ON "public"."event_audit_log" TO "service_role";

GRANT DELETE ON "public"."event_audit_log" TO "service_role";

GRANT TRUNCATE ON "public"."event_audit_log" TO "service_role";

GRANT REFERENCES ON "public"."event_audit_log" TO "service_role";

GRANT TRIGGER ON "public"."event_audit_log" TO "service_role";

GRANT INSERT ON "public"."feature_requests" TO "service_role";

GRANT SELECT ON "public"."feature_requests" TO "service_role";

GRANT UPDATE ON "public"."feature_requests" TO "service_role";

GRANT DELETE ON "public"."feature_requests" TO "service_role";

GRANT TRUNCATE ON "public"."feature_requests" TO "service_role";

GRANT REFERENCES ON "public"."feature_requests" TO "service_role";

GRANT TRIGGER ON "public"."feature_requests" TO "service_role";

GRANT INSERT ON "public"."feature_requests" TO "anon";

GRANT SELECT ON "public"."feature_requests" TO "anon";

GRANT INSERT ON "public"."feature_requests" TO "authenticated";

GRANT SELECT ON "public"."feature_requests" TO "authenticated";

GRANT INSERT ON "public"."feature_votes" TO "service_role";

GRANT SELECT ON "public"."feature_votes" TO "service_role";

GRANT UPDATE ON "public"."feature_votes" TO "service_role";

GRANT DELETE ON "public"."feature_votes" TO "service_role";

GRANT TRUNCATE ON "public"."feature_votes" TO "service_role";

GRANT REFERENCES ON "public"."feature_votes" TO "service_role";

GRANT TRIGGER ON "public"."feature_votes" TO "service_role";

GRANT INSERT ON "public"."feature_votes" TO "anon";

GRANT SELECT ON "public"."feature_votes" TO "anon";

GRANT INSERT ON "public"."feature_votes" TO "authenticated";

GRANT SELECT ON "public"."feature_votes" TO "authenticated";

GRANT INSERT ON "public"."referral_codes" TO "service_role";

GRANT SELECT ON "public"."referral_codes" TO "service_role";

GRANT UPDATE ON "public"."referral_codes" TO "service_role";

GRANT DELETE ON "public"."referral_codes" TO "service_role";

GRANT TRUNCATE ON "public"."referral_codes" TO "service_role";

GRANT REFERENCES ON "public"."referral_codes" TO "service_role";

GRANT TRIGGER ON "public"."referral_codes" TO "service_role";

GRANT INSERT ON "public"."user_referrals" TO "service_role";

GRANT SELECT ON "public"."user_referrals" TO "service_role";

GRANT UPDATE ON "public"."user_referrals" TO "service_role";

GRANT DELETE ON "public"."user_referrals" TO "service_role";

GRANT TRUNCATE ON "public"."user_referrals" TO "service_role";

GRANT REFERENCES ON "public"."user_referrals" TO "service_role";

GRANT TRIGGER ON "public"."user_referrals" TO "service_role";

GRANT INSERT ON "public"."app_update_policies" TO "service_role";

GRANT SELECT ON "public"."app_update_policies" TO "service_role";

GRANT UPDATE ON "public"."app_update_policies" TO "service_role";

GRANT DELETE ON "public"."app_update_policies" TO "service_role";

GRANT TRUNCATE ON "public"."app_update_policies" TO "service_role";

GRANT REFERENCES ON "public"."app_update_policies" TO "service_role";

GRANT TRIGGER ON "public"."app_update_policies" TO "service_role";

GRANT SELECT ON "public"."app_update_policies" TO "anon";

GRANT SELECT ON "public"."app_update_policies" TO "authenticated";

GRANT INSERT ON "public"."streak_unlock_receipts" TO "service_role";

GRANT SELECT ON "public"."streak_unlock_receipts" TO "service_role";

GRANT UPDATE ON "public"."streak_unlock_receipts" TO "service_role";

GRANT DELETE ON "public"."streak_unlock_receipts" TO "service_role";

GRANT TRUNCATE ON "public"."streak_unlock_receipts" TO "service_role";

GRANT REFERENCES ON "public"."streak_unlock_receipts" TO "service_role";

GRANT TRIGGER ON "public"."streak_unlock_receipts" TO "service_role";

GRANT SELECT ON "public"."streak_unlock_receipts" TO "authenticated";

GRANT INSERT ON "public"."streak_freeze_log" TO "service_role";

GRANT SELECT ON "public"."streak_freeze_log" TO "service_role";

GRANT UPDATE ON "public"."streak_freeze_log" TO "service_role";

GRANT DELETE ON "public"."streak_freeze_log" TO "service_role";

GRANT TRUNCATE ON "public"."streak_freeze_log" TO "service_role";

GRANT REFERENCES ON "public"."streak_freeze_log" TO "service_role";

GRANT TRIGGER ON "public"."streak_freeze_log" TO "service_role";

GRANT SELECT ON "public"."streak_freeze_log" TO "authenticated";

GRANT INSERT ON "public"."maintenance_logs" TO "anon";

GRANT SELECT ON "public"."maintenance_logs" TO "anon";

GRANT UPDATE ON "public"."maintenance_logs" TO "anon";

GRANT DELETE ON "public"."maintenance_logs" TO "anon";

GRANT INSERT ON "public"."maintenance_logs" TO "authenticated";

GRANT SELECT ON "public"."maintenance_logs" TO "authenticated";

GRANT UPDATE ON "public"."maintenance_logs" TO "authenticated";

GRANT DELETE ON "public"."maintenance_logs" TO "authenticated";

GRANT INSERT ON "public"."maintenance_logs" TO "service_role";

GRANT SELECT ON "public"."maintenance_logs" TO "service_role";

GRANT UPDATE ON "public"."maintenance_logs" TO "service_role";

GRANT DELETE ON "public"."maintenance_logs" TO "service_role";

GRANT TRUNCATE ON "public"."maintenance_logs" TO "service_role";

GRANT REFERENCES ON "public"."maintenance_logs" TO "service_role";

GRANT TRIGGER ON "public"."maintenance_logs" TO "service_role";

GRANT INSERT ON "public"."challenge_participants" TO "service_role";

GRANT SELECT ON "public"."challenge_participants" TO "service_role";

GRANT UPDATE ON "public"."challenge_participants" TO "service_role";

GRANT DELETE ON "public"."challenge_participants" TO "service_role";

GRANT TRUNCATE ON "public"."challenge_participants" TO "service_role";

GRANT REFERENCES ON "public"."challenge_participants" TO "service_role";

GRANT TRIGGER ON "public"."challenge_participants" TO "service_role";

GRANT SELECT ON "public"."challenge_participants" TO "authenticated";

GRANT INSERT ON "public"."rc_receipts" TO "anon";

GRANT SELECT ON "public"."rc_receipts" TO "anon";

GRANT UPDATE ON "public"."rc_receipts" TO "anon";

GRANT DELETE ON "public"."rc_receipts" TO "anon";

GRANT INSERT ON "public"."rc_receipts" TO "authenticated";

GRANT SELECT ON "public"."rc_receipts" TO "authenticated";

GRANT UPDATE ON "public"."rc_receipts" TO "authenticated";

GRANT DELETE ON "public"."rc_receipts" TO "authenticated";

GRANT INSERT ON "public"."rc_receipts" TO "service_role";

GRANT SELECT ON "public"."rc_receipts" TO "service_role";

GRANT UPDATE ON "public"."rc_receipts" TO "service_role";

GRANT DELETE ON "public"."rc_receipts" TO "service_role";

GRANT TRUNCATE ON "public"."rc_receipts" TO "service_role";

GRANT REFERENCES ON "public"."rc_receipts" TO "service_role";

GRANT TRIGGER ON "public"."rc_receipts" TO "service_role";

GRANT INSERT ON "public"."app_flow_returns" TO "anon";

GRANT SELECT ON "public"."app_flow_returns" TO "anon";

GRANT UPDATE ON "public"."app_flow_returns" TO "anon";

GRANT DELETE ON "public"."app_flow_returns" TO "anon";

GRANT INSERT ON "public"."app_flow_returns" TO "authenticated";

GRANT SELECT ON "public"."app_flow_returns" TO "authenticated";

GRANT UPDATE ON "public"."app_flow_returns" TO "authenticated";

GRANT DELETE ON "public"."app_flow_returns" TO "authenticated";

GRANT INSERT ON "public"."app_flow_returns" TO "service_role";

GRANT SELECT ON "public"."app_flow_returns" TO "service_role";

GRANT UPDATE ON "public"."app_flow_returns" TO "service_role";

GRANT DELETE ON "public"."app_flow_returns" TO "service_role";

GRANT TRUNCATE ON "public"."app_flow_returns" TO "service_role";

GRANT REFERENCES ON "public"."app_flow_returns" TO "service_role";

GRANT TRIGGER ON "public"."app_flow_returns" TO "service_role";

GRANT INSERT ON "public"."invite_handoffs" TO "anon";

GRANT SELECT ON "public"."invite_handoffs" TO "anon";

GRANT UPDATE ON "public"."invite_handoffs" TO "anon";

GRANT DELETE ON "public"."invite_handoffs" TO "anon";

GRANT INSERT ON "public"."invite_handoffs" TO "authenticated";

GRANT SELECT ON "public"."invite_handoffs" TO "authenticated";

GRANT UPDATE ON "public"."invite_handoffs" TO "authenticated";

GRANT DELETE ON "public"."invite_handoffs" TO "authenticated";

GRANT INSERT ON "public"."invite_handoffs" TO "service_role";

GRANT SELECT ON "public"."invite_handoffs" TO "service_role";

GRANT UPDATE ON "public"."invite_handoffs" TO "service_role";

GRANT DELETE ON "public"."invite_handoffs" TO "service_role";

GRANT TRUNCATE ON "public"."invite_handoffs" TO "service_role";

GRANT REFERENCES ON "public"."invite_handoffs" TO "service_role";

GRANT TRIGGER ON "public"."invite_handoffs" TO "service_role";

GRANT INSERT ON "public"."queued_proof_submissions" TO "anon";

GRANT SELECT ON "public"."queued_proof_submissions" TO "anon";

GRANT UPDATE ON "public"."queued_proof_submissions" TO "anon";

GRANT DELETE ON "public"."queued_proof_submissions" TO "anon";

GRANT INSERT ON "public"."queued_proof_submissions" TO "authenticated";

GRANT SELECT ON "public"."queued_proof_submissions" TO "authenticated";

GRANT UPDATE ON "public"."queued_proof_submissions" TO "authenticated";

GRANT DELETE ON "public"."queued_proof_submissions" TO "authenticated";

GRANT INSERT ON "public"."queued_proof_submissions" TO "service_role";

GRANT SELECT ON "public"."queued_proof_submissions" TO "service_role";

GRANT UPDATE ON "public"."queued_proof_submissions" TO "service_role";

GRANT DELETE ON "public"."queued_proof_submissions" TO "service_role";

GRANT TRUNCATE ON "public"."queued_proof_submissions" TO "service_role";

GRANT REFERENCES ON "public"."queued_proof_submissions" TO "service_role";

GRANT TRIGGER ON "public"."queued_proof_submissions" TO "service_role";

GRANT INSERT ON "public"."weekly_recap_snapshots" TO "anon";

GRANT SELECT ON "public"."weekly_recap_snapshots" TO "anon";

GRANT UPDATE ON "public"."weekly_recap_snapshots" TO "anon";

GRANT DELETE ON "public"."weekly_recap_snapshots" TO "anon";

GRANT INSERT ON "public"."weekly_recap_snapshots" TO "authenticated";

GRANT SELECT ON "public"."weekly_recap_snapshots" TO "authenticated";

GRANT UPDATE ON "public"."weekly_recap_snapshots" TO "authenticated";

GRANT DELETE ON "public"."weekly_recap_snapshots" TO "authenticated";

GRANT INSERT ON "public"."weekly_recap_snapshots" TO "service_role";

GRANT SELECT ON "public"."weekly_recap_snapshots" TO "service_role";

GRANT UPDATE ON "public"."weekly_recap_snapshots" TO "service_role";

GRANT DELETE ON "public"."weekly_recap_snapshots" TO "service_role";

GRANT TRUNCATE ON "public"."weekly_recap_snapshots" TO "service_role";

GRANT REFERENCES ON "public"."weekly_recap_snapshots" TO "service_role";

GRANT TRIGGER ON "public"."weekly_recap_snapshots" TO "service_role";

GRANT INSERT ON "public"."buddy_streaks" TO "anon";

GRANT SELECT ON "public"."buddy_streaks" TO "anon";

GRANT UPDATE ON "public"."buddy_streaks" TO "anon";

GRANT DELETE ON "public"."buddy_streaks" TO "anon";

GRANT INSERT ON "public"."buddy_streaks" TO "authenticated";

GRANT SELECT ON "public"."buddy_streaks" TO "authenticated";

GRANT UPDATE ON "public"."buddy_streaks" TO "authenticated";

GRANT DELETE ON "public"."buddy_streaks" TO "authenticated";

GRANT INSERT ON "public"."buddy_streaks" TO "service_role";

GRANT SELECT ON "public"."buddy_streaks" TO "service_role";

GRANT UPDATE ON "public"."buddy_streaks" TO "service_role";

GRANT DELETE ON "public"."buddy_streaks" TO "service_role";

GRANT TRUNCATE ON "public"."buddy_streaks" TO "service_role";

GRANT REFERENCES ON "public"."buddy_streaks" TO "service_role";

GRANT TRIGGER ON "public"."buddy_streaks" TO "service_role";

GRANT INSERT ON "public"."daily_challenge_panels" TO "anon";

GRANT SELECT ON "public"."daily_challenge_panels" TO "anon";

GRANT UPDATE ON "public"."daily_challenge_panels" TO "anon";

GRANT DELETE ON "public"."daily_challenge_panels" TO "anon";

GRANT INSERT ON "public"."daily_challenge_panels" TO "authenticated";

GRANT SELECT ON "public"."daily_challenge_panels" TO "authenticated";

GRANT UPDATE ON "public"."daily_challenge_panels" TO "authenticated";

GRANT DELETE ON "public"."daily_challenge_panels" TO "authenticated";

GRANT INSERT ON "public"."daily_challenge_panels" TO "service_role";

GRANT SELECT ON "public"."daily_challenge_panels" TO "service_role";

GRANT UPDATE ON "public"."daily_challenge_panels" TO "service_role";

GRANT DELETE ON "public"."daily_challenge_panels" TO "service_role";

GRANT TRUNCATE ON "public"."daily_challenge_panels" TO "service_role";

GRANT REFERENCES ON "public"."daily_challenge_panels" TO "service_role";

GRANT TRIGGER ON "public"."daily_challenge_panels" TO "service_role";

GRANT INSERT ON "public"."purchase_receipt_states" TO "anon";

GRANT SELECT ON "public"."purchase_receipt_states" TO "anon";

GRANT UPDATE ON "public"."purchase_receipt_states" TO "anon";

GRANT DELETE ON "public"."purchase_receipt_states" TO "anon";

GRANT INSERT ON "public"."purchase_receipt_states" TO "authenticated";

GRANT SELECT ON "public"."purchase_receipt_states" TO "authenticated";

GRANT UPDATE ON "public"."purchase_receipt_states" TO "authenticated";

GRANT DELETE ON "public"."purchase_receipt_states" TO "authenticated";

GRANT INSERT ON "public"."purchase_receipt_states" TO "service_role";

GRANT SELECT ON "public"."purchase_receipt_states" TO "service_role";

GRANT UPDATE ON "public"."purchase_receipt_states" TO "service_role";

GRANT DELETE ON "public"."purchase_receipt_states" TO "service_role";

GRANT TRUNCATE ON "public"."purchase_receipt_states" TO "service_role";

GRANT REFERENCES ON "public"."purchase_receipt_states" TO "service_role";

GRANT TRIGGER ON "public"."purchase_receipt_states" TO "service_role";

GRANT INSERT ON "public"."rc_credit_mappings" TO "anon";

GRANT SELECT ON "public"."rc_credit_mappings" TO "anon";

GRANT UPDATE ON "public"."rc_credit_mappings" TO "anon";

GRANT DELETE ON "public"."rc_credit_mappings" TO "anon";

GRANT INSERT ON "public"."rc_credit_mappings" TO "authenticated";

GRANT SELECT ON "public"."rc_credit_mappings" TO "authenticated";

GRANT UPDATE ON "public"."rc_credit_mappings" TO "authenticated";

GRANT DELETE ON "public"."rc_credit_mappings" TO "authenticated";

GRANT INSERT ON "public"."rc_credit_mappings" TO "service_role";

GRANT SELECT ON "public"."rc_credit_mappings" TO "service_role";

GRANT UPDATE ON "public"."rc_credit_mappings" TO "service_role";

GRANT DELETE ON "public"."rc_credit_mappings" TO "service_role";

GRANT TRUNCATE ON "public"."rc_credit_mappings" TO "service_role";

GRANT REFERENCES ON "public"."rc_credit_mappings" TO "service_role";

GRANT TRIGGER ON "public"."rc_credit_mappings" TO "service_role";

GRANT INSERT ON "public"."notification_templates" TO "anon";

GRANT SELECT ON "public"."notification_templates" TO "anon";

GRANT UPDATE ON "public"."notification_templates" TO "anon";

GRANT DELETE ON "public"."notification_templates" TO "anon";

GRANT INSERT ON "public"."notification_templates" TO "authenticated";

GRANT SELECT ON "public"."notification_templates" TO "authenticated";

GRANT UPDATE ON "public"."notification_templates" TO "authenticated";

GRANT DELETE ON "public"."notification_templates" TO "authenticated";

GRANT INSERT ON "public"."notification_templates" TO "service_role";

GRANT SELECT ON "public"."notification_templates" TO "service_role";

GRANT UPDATE ON "public"."notification_templates" TO "service_role";

GRANT DELETE ON "public"."notification_templates" TO "service_role";

GRANT TRUNCATE ON "public"."notification_templates" TO "service_role";

GRANT REFERENCES ON "public"."notification_templates" TO "service_role";

GRANT TRIGGER ON "public"."notification_templates" TO "service_role";

GRANT INSERT ON "public"."maintenance_runs" TO "anon";

GRANT SELECT ON "public"."maintenance_runs" TO "anon";

GRANT UPDATE ON "public"."maintenance_runs" TO "anon";

GRANT DELETE ON "public"."maintenance_runs" TO "anon";

GRANT INSERT ON "public"."maintenance_runs" TO "authenticated";

GRANT SELECT ON "public"."maintenance_runs" TO "authenticated";

GRANT UPDATE ON "public"."maintenance_runs" TO "authenticated";

GRANT DELETE ON "public"."maintenance_runs" TO "authenticated";

GRANT INSERT ON "public"."maintenance_runs" TO "service_role";

GRANT SELECT ON "public"."maintenance_runs" TO "service_role";

GRANT UPDATE ON "public"."maintenance_runs" TO "service_role";

GRANT DELETE ON "public"."maintenance_runs" TO "service_role";

GRANT TRUNCATE ON "public"."maintenance_runs" TO "service_role";

GRANT REFERENCES ON "public"."maintenance_runs" TO "service_role";

GRANT TRIGGER ON "public"."maintenance_runs" TO "service_role";

GRANT INSERT ON "public"."rc_entitlements" TO "anon";

GRANT SELECT ON "public"."rc_entitlements" TO "anon";

GRANT UPDATE ON "public"."rc_entitlements" TO "anon";

GRANT DELETE ON "public"."rc_entitlements" TO "anon";

GRANT INSERT ON "public"."rc_entitlements" TO "authenticated";

GRANT SELECT ON "public"."rc_entitlements" TO "authenticated";

GRANT UPDATE ON "public"."rc_entitlements" TO "authenticated";

GRANT DELETE ON "public"."rc_entitlements" TO "authenticated";

GRANT INSERT ON "public"."rc_entitlements" TO "service_role";

GRANT SELECT ON "public"."rc_entitlements" TO "service_role";

GRANT UPDATE ON "public"."rc_entitlements" TO "service_role";

GRANT DELETE ON "public"."rc_entitlements" TO "service_role";

GRANT TRUNCATE ON "public"."rc_entitlements" TO "service_role";

GRANT REFERENCES ON "public"."rc_entitlements" TO "service_role";

GRANT TRIGGER ON "public"."rc_entitlements" TO "service_role";

GRANT SELECT ("avatar_url") ON "public"."profiles" TO "authenticated";

GRANT INSERT ("blocked_user_id") ON "public"."blocked_users" TO "authenticated";

GRANT INSERT ("blocker_id") ON "public"."blocked_users" TO "authenticated";

GRANT INSERT ("body") ON "public"."notifications" TO "authenticated";

GRANT UPDATE ("delivered_at") ON "public"."notifications" TO "authenticated";

GRANT SELECT ("display_name") ON "public"."profiles" TO "authenticated";

GRANT SELECT ("id") ON "public"."profiles" TO "authenticated";

GRANT UPDATE ("is_read") ON "public"."notifications" TO "authenticated";

GRANT INSERT ("metadata") ON "public"."notifications" TO "authenticated";

GRANT INSERT ("notes") ON "public"."content_reports" TO "authenticated";

GRANT INSERT ("notification_type") ON "public"."notifications" TO "authenticated";

GRANT UPDATE ("opened_at") ON "public"."notifications" TO "authenticated";

GRANT INSERT ("payload") ON "public"."notifications" TO "authenticated";

GRANT INSERT ("priority") ON "public"."notifications" TO "authenticated";

GRANT INSERT ("reason") ON "public"."blocked_users" TO "authenticated";

GRANT INSERT ("reason") ON "public"."content_reports" TO "authenticated";

GRANT INSERT ("reporter_id") ON "public"."content_reports" TO "authenticated";

GRANT INSERT ("scheduled_for") ON "public"."notifications" TO "authenticated";

GRANT INSERT ("target_id") ON "public"."content_reports" TO "authenticated";

GRANT INSERT ("target_type") ON "public"."content_reports" TO "authenticated";

GRANT INSERT ("title") ON "public"."notifications" TO "authenticated";

GRANT INSERT ("user_id") ON "public"."notifications" TO "authenticated";

GRANT SELECT ("username") ON "public"."profiles" TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_my_revenuecat_ad_reward_receipt"(p_client_transaction_id text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_first_miss_recovery_v1"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."claim_first_miss_recovery_v1"(p_outcome_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."join_public_group_v2"(p_group_id uuid, p_expected_cost integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."join_challenge"(p_challenge_id uuid, p_invite_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."claim_momenta_reward"(p_user_id uuid, p_reward_type text, p_reference_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."leave_challenge"(p_challenge_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."is_current_user_team_member"(p_group_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."is_current_user_team_owner"(p_group_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."is_current_user_team_admin"(p_group_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_welcome_bonus_status"(p_user_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."grant_welcome_bonus_once"(p_user_id uuid, p_amount integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."add_momenta_transaction"(p_user_id uuid, p_amount integer, p_reason text, p_transaction_type text, p_reference_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."unequip_item"(p_user_id uuid, p_category text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."dismiss_welcome_bonus"(p_user_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."is_group_accessible"(p_group_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."use_group_freeze"(p_group_id uuid, p_challenge_id uuid, p_user_id uuid, p_for_date date) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_server_time"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."archive_completed_challenges"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."check_power_up_inventory_for_sku"(p_user_id uuid, p_item_sku text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."delete_my_account"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_challenge_completion_percentage"(challenge_id_param uuid, user_id_param uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_create_group_cost"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_search_suggestions"(partial_query text, limit_count integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_group_risk_data"(p_group_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."extend_challenge_duration"(p_challenge_id uuid, p_user_id uuid, p_additional_days integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."has_submitted_today"(params jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."generate_user_referral_code"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."is_streak_freeze_sku"(p_item_sku text) TO anon;

GRANT EXECUTE ON FUNCTION "public"."is_streak_freeze_sku"(p_item_sku text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."has_submitted_today"(p_challenge_id uuid, p_user_id uuid, p_tz text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_todays_submission_status"(p_challenge_id uuid, p_user_id uuid, p_tz text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."purchase_shop_item"(p_user_id uuid, p_item_sku text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."extend_group_duration"(p_group_id uuid, p_user_id uuid, p_additional_days integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."event_get_organiser_review_queue_v1"(p_occurrence_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."event_claim_receipt_v1"(p_actor_id uuid, p_action text, p_client_event_id uuid, p_request_hash text) TO anon;

GRANT EXECUTE ON FUNCTION "private"."event_claim_receipt_v1"(p_actor_id uuid, p_action text, p_client_event_id uuid, p_request_hash text) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."event_finish_receipt_v1"(p_actor_id uuid, p_action text, p_client_event_id uuid, p_outcome menta_event_action_outcome, p_response jsonb) TO anon;

GRANT EXECUTE ON FUNCTION "private"."event_finish_receipt_v1"(p_actor_id uuid, p_action text, p_client_event_id uuid, p_outcome menta_event_action_outcome, p_response jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."event_complete_action_v1"(p_actor_id uuid, p_action text, p_client_event_id uuid, p_code text, p_message text, p_data jsonb) TO anon;

GRANT EXECUTE ON FUNCTION "private"."event_complete_action_v1"(p_actor_id uuid, p_action text, p_client_event_id uuid, p_code text, p_message text, p_data jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."event_fail_action_v1"(p_actor_id uuid, p_action text, p_client_event_id uuid, p_code text, p_message text, p_data jsonb, p_retryable boolean) TO anon;

GRANT EXECUTE ON FUNCTION "private"."event_fail_action_v1"(p_actor_id uuid, p_action text, p_client_event_id uuid, p_code text, p_message text, p_data jsonb, p_retryable boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."event_audit_v1"(p_event_id uuid, p_occurrence_id uuid, p_actor_id uuid, p_action text, p_target_type text, p_target_id uuid, p_metadata jsonb) TO anon;

GRANT EXECUTE ON FUNCTION "private"."event_audit_v1"(p_event_id uuid, p_occurrence_id uuid, p_actor_id uuid, p_action text, p_target_type text, p_target_id uuid, p_metadata jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."current_session_is_active"() TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."event_attendance_json_v1"(p_attendance event_attendances, p_checkin event_checkins) TO anon;

GRANT EXECUTE ON FUNCTION "private"."event_attendance_json_v1"(p_attendance event_attendances, p_checkin event_checkins) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."event_post_json_v1"(p_post event_posts, p_include_media_path boolean) TO anon;

GRANT EXECUTE ON FUNCTION "private"."event_post_json_v1"(p_post event_posts, p_include_media_path boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."event_media_path_is_valid_v1"(p_path text, p_user_id uuid, p_occurrence_id uuid, p_post_id uuid) TO anon;

GRANT EXECUTE ON FUNCTION "private"."event_media_path_is_valid_v1"(p_path text, p_user_id uuid, p_occurrence_id uuid, p_post_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_my_profile"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."use_power_up"(p_user_id uuid, p_item_sku text, p_challenge_id uuid, p_target_data jsonb, p_client_event_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."create_accountability_group"(p_name text, p_description text, p_duration_days integer, p_cost integer, p_privacy text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."submit_content_report_v1"(p_expected_reporter_id uuid, p_client_event_id uuid, p_target_type text, p_target_id uuid, p_reason text, p_facts jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."list_authorized_challenge_participants"(p_challenge_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."event_safe_uuid"(p_value text) TO anon;

GRANT EXECUTE ON FUNCTION "public"."event_safe_uuid"(p_value text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."event_media_path_parts"(p_path text) TO anon;

GRANT EXECUTE ON FUNCTION "public"."event_media_path_parts"(p_path text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."event_can_read_own_media_v1"(p_path text) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."event_result_v1"(p_action text, p_client_event_id uuid, p_outcome text, p_code text, p_message text, p_data jsonb, p_retryable boolean, p_idempotent boolean) TO anon;

GRANT EXECUTE ON FUNCTION "private"."event_result_v1"(p_action text, p_client_event_id uuid, p_outcome text, p_code text, p_message text, p_data jsonb, p_retryable boolean, p_idempotent boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."list_authorized_group_members"(p_group_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_group_accountability_board"(p_group_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."update_my_profile"(p_patch jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_today_pending_reviews"(p_timezone text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."preview_group_invite_v2"(p_invite_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."purchase_shop_item"(p_user_id uuid, p_item_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."event_get_organiser_recap_v1"(p_event_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_group_daily_status"(p_group_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."purchase_shop_item"(p_user_id uuid, p_item_id uuid, p_client_event_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_current_legal_document_versions"() TO anon;

GRANT EXECUTE ON FUNCTION "public"."get_current_legal_document_versions"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_or_create_my_referral_code"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_my_legal_acceptance_status"(p_expected_user_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."accept_current_legal_documents"(p_expected_user_id uuid, p_terms_version text, p_privacy_policy_version text, p_community_standards_version text, p_acceptance_surface text, p_app_version text, p_app_build text, p_app_platform text, p_locale text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_user_by_referral_code"(p_referral_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_my_referral_stats"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_today_accountability_v2"(p_timezone text) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."economy_action_cost_v1"(p_user_id uuid, p_action text) TO anon;

GRANT EXECUTE ON FUNCTION "private"."economy_action_cost_v1"(p_user_id uuid, p_action text) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."economy_user_is_pro_v1"(p_user_id uuid) TO anon;

GRANT EXECUTE ON FUNCTION "private"."economy_user_is_pro_v1"(p_user_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."economy_active_promise_count_v1"(p_user_id uuid) TO anon;

GRANT EXECUTE ON FUNCTION "private"."economy_active_promise_count_v1"(p_user_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."economy_active_group_count_v1"(p_user_id uuid) TO anon;

GRANT EXECUTE ON FUNCTION "private"."economy_active_group_count_v1"(p_user_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_my_account_activation_v1"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."list_my_referrals"(p_limit integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."list_my_referrals_v2"(p_limit integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_my_referral_program_v2"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."accept_referral_v2"(p_referral_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."cancel_pending_referral_v2"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."claim_referral_code"(p_referral_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."ensure_first_promise_v1"(p_title text, p_description text, p_category text, p_duration integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_is_public boolean, p_difficulty text, p_points integer, p_verification_type text, p_verification_frequency text, p_verification_description text, p_submission_text text, p_allow_extensions boolean, p_max_extensions integer, p_deadline_type text, p_allow_self_review boolean, p_group_id uuid, p_cost integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."create_accountability_challenge"(p_title text, p_description text, p_category text, p_duration integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_is_public boolean, p_difficulty text, p_points integer, p_verification_type text, p_verification_frequency text, p_verification_description text, p_submission_text text, p_allow_extensions boolean, p_max_extensions integer, p_deadline_type text, p_allow_self_review boolean, p_group_id uuid, p_cost integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."leave_accountability_challenge_v1"(p_challenge_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_my_pro_authority"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."block_user_v1"(p_expected_blocker_id uuid, p_client_event_id uuid, p_blocked_user_id uuid, p_reason text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."create_onboarding_group_with_first_promise_v1"(p_first_promise_id uuid, p_name text, p_description text, p_privacy text, p_image_preset text, p_member_nudges boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_economy_contract_v1"() TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."grant_account_streak_unlocks_v1"(p_user_id uuid) TO anon;

GRANT EXECUTE ON FUNCTION "private"."grant_account_streak_unlocks_v1"(p_user_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."sync_account_streak_unlocks_v1"() TO anon;

GRANT EXECUTE ON FUNCTION "private"."sync_account_streak_unlocks_v1"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."equip_owned_item"(p_user_id uuid, p_item_id uuid, p_category text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."can_send_notification_to_user"(p_user_id uuid, p_notification_type text, p_priority integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."grant_account_streak_shop_unlocks_v1"(p_user_id uuid) TO anon;

GRANT EXECUTE ON FUNCTION "private"."grant_account_streak_shop_unlocks_v1"(p_user_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."claim_streak_shop_unlocks"() TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."sync_account_streak_shop_unlocks_v1"() TO anon;

GRANT EXECUTE ON FUNCTION "private"."sync_account_streak_shop_unlocks_v1"() TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."snooze_coach_messages"(p_hours integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."activate_remote_coach_v1"(p_user_id uuid, p_contract_version integer) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."quote_challenge_join_v1"(p_challenge_id uuid, p_invite_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."join_challenge_with_funding_v1"(p_challenge_id uuid, p_invite_code text, p_quote_id uuid, p_client_event_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."read_challenge_join_status_v1"(p_challenge_id uuid, p_client_event_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_notification_preferences"(p_user_id uuid, p_timezone text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."join_public_group_v1"(p_group_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."join_challenge_with_invite_v1"(p_invite_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."storage_upload_allowed_v1"(p_bucket_id text, p_name text, p_owner_id text, p_metadata jsonb) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."submit_challenge_verification"(p_challenge_id uuid, p_media_url text, p_media_type text, p_client_event_id uuid, p_client_tz text, p_submission_text text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."event_get_attendee_album_v1"(p_occurrence_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_today_obligations"(p_timezone text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_today_home_v1"(p_timezone text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."request_test_notification_v1"() TO authenticated;

GRANT EXECUTE ON FUNCTION "private"."economy_quota_error_v1"(p_user_id uuid, p_action text) TO anon;

GRANT EXECUTE ON FUNCTION "private"."economy_quota_error_v1"(p_user_id uuid, p_action text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."join_promise_accountability_v2"(p_challenge_id uuid, p_invite_code text, p_quote_id uuid, p_client_event_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."ensure_promise_accountability_v1"(p_challenge_id uuid, p_role text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."set_promise_accountability_invite_role_v1"(p_challenge_id uuid, p_invite_code text, p_role text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."begin_promise_accountability_invite_v1"(p_challenge_id uuid, p_role text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_promise_accountability_v1"(p_challenge_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_promise_accountability_invite_preview_v1"(p_invite_code text) TO anon;

GRANT EXECUTE ON FUNCTION "public"."get_promise_accountability_invite_preview_v1"(p_invite_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."create_accountability_group_v3"(p_client_event_id uuid, p_name text, p_description text, p_duration_days integer, p_privacy text, p_image_preset text, p_notify_on_member_miss boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."read_promise_accountability_join_status_v2"(p_challenge_id uuid, p_client_event_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."quote_promise_accountability_join_v2"(p_challenge_id uuid, p_invite_code text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."leave_promise_accountability_v1"(p_challenge_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."manage_promise_accountability_member_v1"(p_challenge_id uuid, p_member_id uuid, p_role text, p_remove boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."review_challenge_verification"(p_verification_id uuid, p_status text, p_review_notes text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."read_saved_group_creation_status_v1"(p_client_event_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."create_accountability_group_v2"(p_name text, p_description text, p_duration_days integer, p_cost integer, p_privacy text, p_image_preset text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."delete_accountability_challenge_v2"(p_challenge_id uuid, p_client_event_id uuid, p_check_only boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."leave_promise_accountability_v2"(p_challenge_id uuid, p_client_event_id uuid, p_check_only boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_profile_follow_through_v1"(p_timezone text) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."preview_group_invite_guest_v1"(p_invite_code text) TO anon;

GRANT EXECUTE ON FUNCTION "public"."attach_personal_promise_to_saved_group_v1"(p_challenge_id uuid, p_group_id uuid, p_client_event_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."get_proof_ad_break_hint"(p_submission_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION "public"."claim_proof_ad_break"(p_submission_id uuid) TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE "public"."notification_templates_id_seq" TO anon, authenticated;

GRANT USAGE, SELECT ON SEQUENCE "public"."wallet_transactions_id_seq" TO anon, authenticated;

GRANT USAGE, SELECT ON SEQUENCE "public"."notifications_id_seq" TO anon, authenticated;

GRANT USAGE, SELECT ON SEQUENCE "public"."creation_attempts_id_seq" TO anon, authenticated;

GRANT USAGE, SELECT ON SEQUENCE "public"."rc_receipts_id_seq" TO anon, authenticated;

GRANT USAGE, SELECT ON SEQUENCE "public"."rc_entitlements_id_seq" TO anon, authenticated;

GRANT USAGE, SELECT ON SEQUENCE "public"."rc_credit_mappings_id_seq" TO anon, authenticated;

GRANT USAGE, SELECT ON SEQUENCE "public"."notification_jobs_id_seq" TO anon, authenticated;

DROP TABLE IF EXISTS public.feature_votes CASCADE;

DROP TABLE IF EXISTS public.feature_requests CASCADE;

DROP TABLE IF EXISTS public.beta_waitlist CASCADE;

DROP TABLE IF EXISTS public.waitlist_emails CASCADE;

REVOKE UPDATE ON public.teams FROM anon, authenticated;

GRANT UPDATE (name, description, privacy, image_url, notify_on_member_miss) ON public.teams TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.user_flags FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
