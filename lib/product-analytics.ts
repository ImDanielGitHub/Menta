import type { ProofReceiptStatus } from '@/lib/proof-drafts';
import type { ProofMediaType } from '@/lib/proof-types';

export const MENTA_ANALYTICS_SCHEMA_VERSION = 3 as const;

export const MENTA_ANALYTICS_EVENT_NAMES = [
  'App Opened',
  'App Layout Classified',
  'Authentication Result',
  'Account Navigation Reset',
  'Language Selected',
  'Product Operation',
  'Onboarding Completed',
  'Onboarding Journey',
  'Accountability Invite Journey',
  'Promise Invite Journey',
  'Promise Created',
  'Today Action Selected',
  'Proof Capture Result',
  'Proof Submitted',
  'Proof Submission Outcome',
  'Proof Receipt Action',
  'Proof Reviewed',
  'Proof Video Playback',
  'Group Joined',
  'Notification Opened',
  'Notification Permission Updated',
  'Notification In-App Outcome',
  'Notification Provider Outcome',
  'Notification Test Journey',
  'App Update Journey',
  'Store Review Request',
  'Feedback Journey',
  'First Miss Recovery',
  'Ad Outcome',
  'Paywall Viewed',
  'Paywall Journey',
  'Subscription Started',
  'Subscription Outcome',
] as const;

export type MentaAnalyticsEvent = (typeof MENTA_ANALYTICS_EVENT_NAMES)[number];

export type PromiseDurationBucket = '7_days' | '14_days' | '30_days' | 'other';

export type StreakLengthBucket =
  | '0'
  | '1_2'
  | '3_6'
  | '7_13'
  | '14_29'
  | '30_plus';

export type PaywallAnalyticsPlacement =
  | 'onboarding'
  | 'later'
  | 'challenge'
  | 'group'
  | 'member'
  | 'general';

export type PaywallAnalyticsVariant = 'onboarding' | 'later' | 'unset';

export type SubscriptionPlan = 'weekly' | 'monthly' | 'annual';

export type ProductOperationArea =
  | 'onboarding'
  | 'referral'
  | 'invite'
  | 'accountability'
  | 'group'
  | 'group_discovery'
  | 'notification'
  | 'reminder'
  | 'today'
  | 'proof'
  | 'review'
  | 'history'
  | 'momenta'
  | 'shop'
  | 'pro'
  | 'ad_free'
  | 'profile'
  | 'settings'
  | 'support'
  | 'account_deletion';

export type ProductOperationName =
  | 'complete_onboarding'
  | 'validate_referral'
  | 'prepare_invite'
  | 'accept_invite'
  | 'link_accountability'
  | 'create_group'
  | 'join_group'
  | 'discover_group'
  | 'configure_notifications'
  | 'configure_reminder'
  | 'test_notification'
  | 'select_today_action'
  | 'capture_proof'
  | 'submit_proof'
  | 'review_proof'
  | 'open_history'
  | 'earn_momenta'
  | 'spend_momenta'
  | 'purchase_item'
  | 'purchase_pro'
  | 'restore_purchase'
  | 'resolve_ad_free'
  | 'update_profile'
  | 'change_setting'
  | 'open_support'
  | 'delete_account';

export type ProductOperationPhase =
  | 'intent'
  | 'eligibility'
  | 'authority'
  | 'reconciliation'
  | 'recovery';

export type ProductOperationOutcome =
  | 'started'
  | 'eligible'
  | 'ineligible'
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'blocked'
  | 'failed'
  | 'unknown'
  | 'recovered'
  | 'safe_to_retry';

export type ProductOperationSource =
  | 'onboarding'
  | 'invite'
  | 'today'
  | 'groups'
  | 'notifications'
  | 'shop'
  | 'profile'
  | 'settings'
  | 'support'
  | 'deep_link'
  | 'system';

export type AnalyticsEventProperties = {
  'App Opened': undefined;
  'App Layout Classified': {
    device_class: 'phone' | 'tablet';
    layout: 'single_column' | 'two_column';
    orientation: 'portrait' | 'landscape';
    width_bucket: 'compact' | 'medium' | 'expanded';
  };
  'Authentication Result': {
    flow: 'login' | 'signup';
    method: 'apple' | 'google' | 'password';
    outcome: 'started' | 'handoff' | 'succeeded' | 'cancelled' | 'failed';
  };
  'Account Navigation Reset': {
    boundary: 'signed_in' | 'signed_out' | 'account_switched';
    handoff_preserved: boolean;
  };
  'Language Selected': {
    changed: boolean;
    language:
      | 'system'
      | 'en_nz'
      | 'fr_fr'
      | 'fr_ca'
      | 'de_de'
      | 'es_es'
      | 'es_mx'
      | 'pt_br'
      | 'pt_pt';
  };
  'Product Operation': {
    area: ProductOperationArea;
    authority: 'client' | 'server' | 'native' | 'provider';
    operation: ProductOperationName;
    outcome: ProductOperationOutcome;
    phase: ProductOperationPhase;
    source: ProductOperationSource;
  };
  'Proof Video Playback': {
    surface: 'capture_preview' | 'proof_history' | 'review';
    stage:
      | 'fullscreen_requested'
      | 'fullscreen_opened'
      | 'fullscreen_closed'
      | 'error'
      | 'retry';
    reason: 'none' | 'signing' | 'playback' | 'fullscreen';
  };
  'Onboarding Completed': {
    activation_path:
      | 'first_promise'
      | 'promise_invite'
      | 'group_invite'
      | 'event_invite';
    referral_used: boolean;
  };
  'Onboarding Journey': {
    journey:
      | 'first_promise'
      | 'notification_permission'
      | 'accountability_invite';
    stage:
      | 'welcome'
      | 'promise'
      | 'proof'
      | 'accountability'
      | 'duration'
      | 'review'
      | 'reward'
      | 'save_gate'
      | 'notification_education'
      | 'notification_permission'
      | 'notification_registration'
      | 'legal'
      | 'referral'
      | 'auth'
      | 'auth_cancelled'
      | 'activation'
      | 'receipt'
      | 'invite_role'
      | 'invite_ready';
    action:
      | 'viewed'
      | 'continued'
      | 'back'
      | 'edited'
      | 'expanded'
      | 'collapsed'
      | 'selected'
      | 'submitted'
      | 'skipped'
      | 'requested'
      | 'opened'
      | 'returned'
      | 'retried'
      | 'handed_off'
      | 'completed';
    outcome:
      | 'not_applicable'
      | 'succeeded'
      | 'failed'
      | 'cancelled'
      | 'blocked'
      | 'granted'
      | 'denied'
      | 'pending'
      | 'recovered'
      | 'invalid'
      | 'unknown';
    selection:
      | 'not_applicable'
      | 'example'
      | 'note'
      | 'photo'
      | 'video'
      | 'invite_someone'
      | 'private'
      | 'days_7'
      | 'days_14'
      | 'days_30'
      | 'legal_bundle'
      | 'referral_present'
      | 'referral_absent'
      | 'apple'
      | 'google'
      | 'password'
      | 'existing_account'
      | 'allow_notifications'
      | 'keep_notifications_off'
      | 'open_settings'
      | 'partner'
      | 'reviewer'
      | 'supporter'
      | 'show_qr'
      | 'hide_qr'
      | 'share_sheet'
      | 'copy_link'
      | 'today';
    entry_mode: 'fresh' | 'restored' | 'replay' | 'post_sign_in';
    authenticated: boolean;
  };
  'Accountability Invite Journey': {
    context: 'present' | 'missing' | 'private' | 'shared' | 'not_applicable';
    source: 'onboarding' | 'groups' | 'today' | 'promise' | 'unknown';
    stage:
      | 'handoff_requested'
      | 'handoff_queued'
      | 'handoff_dispatch'
      | 'handoff_suppressed'
      | 'handoff_routed'
      | 'route_opened'
      | 'picker_loaded'
      | 'picker_failed'
      | 'promise_selected'
      | 'invite_prepared'
      | 'share_started'
      | 'shared'
      | 'dismissed'
      | 'navigation_requested'
      | 'navigation_completed';
  };
  'Promise Invite Journey': {
    action:
      | 'viewed'
      | 'continued'
      | 'back'
      | 'dismissed'
      | 'skipped'
      | 'retried'
      | 'opened'
      | 'returned'
      | 'started'
      | 'requested'
      | 'handed_off'
      | 'completed'
      | 'succeeded'
      | 'cancelled'
      | 'failed'
      | 'selected';
    authenticated: boolean;
    entry_point:
      | 'deep_link'
      | 'authentication'
      | 'password_authentication'
      | 'first_account_setup'
      | 'owner_role_choice'
      | 'acceptance_review'
      | 'acceptance_receipt';
    method?: 'apple' | 'google' | 'password';
    mode?: 'login' | 'signup';
    outcome:
      | 'ready'
      | 'retry'
      | 'terminal'
      | 'pending'
      | 'not_applicable'
      | 'succeeded'
      | 'cancelled'
      | 'failed'
      | 'granted'
      | 'denied'
      | 'unknown'
      | 'confirmed'
      | 'eligible'
      | 'already_joined';
    role: 'partner' | 'reviewer' | 'supporter' | 'unknown';
    stage:
      | 'preview'
      | 'auth_handoff'
      | 'legal'
      | 'notification_education'
      | 'account_setup'
      | 'owner_role'
      | 'acceptance';
  };
  'Promise Created': {
    creation_source: 'onboarding' | 'solo' | 'group';
    duration_bucket: PromiseDurationBucket;
    is_first_promise: boolean;
    proof_type: ProofMediaType;
  };
  'Today Action Selected': {
    action:
      | 'add_proof'
      | 'create_promise'
      | 'open_promise'
      | 'open_history'
      | 'open_review'
      | 'open_group'
      | 'open_groups'
      | 'open_personal_promises'
      | 'retry';
    surface: 'primary' | 'secondary' | 'supporting';
  };
  'Proof Capture Result': {
    action: 'opened' | 'saved_local' | 'capture_failed';
    is_correction: boolean;
    proof_type: ProofMediaType;
  };
  'Proof Submitted': {
    day_status:
      | 'pending_review'
      | 'already_applied'
      | 'done'
      | 'freeze_used'
      | 'missed';
    is_correction: boolean;
    proof_type: ProofMediaType;
    receipt_status: 'accepted' | 'pending_review' | 'correction_requested';
    review_mode: 'self' | 'peer';
    streak_length_bucket: StreakLengthBucket;
  };
  'Proof Submission Outcome': {
    is_correction: boolean;
    outcome:
      | 'accepted'
      | 'pending_review'
      | 'correction_requested'
      | 'sent'
      | 'in_progress'
      | 'saved_local'
      | 'unknown_result'
      | 'failed';
    proof_type: ProofMediaType;
    reason:
      | 'none'
      | 'missing_session'
      | 'daily_submission_exists'
      | 'not_joined'
      | 'network_or_server'
      | 'capture';
  };
  'Proof Receipt Action': {
    action:
      | 'close'
      | 'view_promise'
      | 'review_queue'
      | 'retry'
      | 'correct'
      | 'share'
      | 'report';
    receipt_status:
      | 'saved_local'
      | 'uploading'
      | 'sent'
      | 'pending_review'
      | 'accepted'
      | 'correction_requested'
      | 'unknown_result'
      | 'failed';
  };
  'Proof Reviewed': {
    proof_type: ProofMediaType;
    queue_cleared: boolean;
    review_outcome: 'approved' | 'correction_requested';
    review_scope: 'self' | 'peer';
  };
  'Group Joined': {
    join_method: 'invite';
  };
  'Notification Opened': {
    channel: 'expo_push' | 'onesignal_push' | 'onesignal_in_app';
  };
  'Notification Permission Updated': {
    permission_granted: boolean;
    source: 'education' | 'system_settings';
  };
  'Notification In-App Outcome': {
    context: 'first_promise' | 'promise_invite' | 'settings' | 'other';
    outcome: 'displayed' | 'dismissed' | 'clicked';
  };
  'Notification Provider Outcome': {
    operation:
      | 'initialize'
      | 'bind_user'
      | 'unbind_user'
      | 'push_subscription'
      | 'channel_subscription';
    outcome: 'succeeded' | 'not_configured' | 'failed';
    provider: 'onesignal';
  };
  'Notification Test Journey': {
    outcome:
      | 'started'
      | 'granted'
      | 'not_granted'
      | 'ready'
      | 'not_ready'
      | 'queued'
      | 'rate_limited'
      | 'auth_required'
      | 'failed';
    stage: 'requested' | 'permission' | 'registration' | 'server';
  };
  'App Update Journey': {
    mode: 'none' | 'optional' | 'required';
    outcome:
      | 'authority_unknown'
      | 'kill_switch'
      | 'exposure'
      | 'shown'
      | 'dismissed'
      | 'update_tapped'
      | 'store_opened'
      | 'store_open_failed'
      | 'still_old_version'
      | 'successful_upgrade';
    release: '1_9_2';
  };
  'Store Review Request': {
    capability: 'system' | 'testflight' | 'unavailable';
    error_code?:
      | 'capability_probe_failed'
      | 'native_request_rejected'
      | 'storage_read_failed'
      | 'storage_write_failed'
      | 'store_link_unavailable'
      | 'store_link_open_failed';
    failure_stage?:
      | 'capability'
      | 'eligibility'
      | 'native_request'
      | 'success_persistence'
      | 'settings';
    outcome:
      | 'eligible'
      | 'not_eligible'
      | 'requested'
      | 'cooldown'
      | 'retry_backoff'
      | 'same_version'
      | 'in_flight'
      | 'context_changed'
      | 'testflight'
      | 'unavailable'
      | 'failed'
      | 'e2e'
      | 'store_page_opened'
      | 'store_page_failed'
      | 'invitation_pending';
    trigger: 'accepted_proofs' | 'onboarding_activation' | 'settings';
  };
  'Feedback Journey': {
    stage?: 'invitation' | 'today' | 'feedback';
    action:
      | 'deferred'
      | 'shown'
      | 'dismissed'
      | 'positive'
      | 'improve'
      | 'reason_selected'
      | 'screenshot_selected'
      | 'submitted'
      | 'failed';
    source: 'activation_check_in' | 'feedback_form';
    reason?:
      | 'broken'
      | 'confusing'
      | 'slow'
      | 'missing'
      | 'working_well'
      | 'other';
    has_screenshot?: boolean;
  };
  'First Miss Recovery': {
    stage:
      | 'opened'
      | 'claim_started'
      | 'confirmed'
      | 'failed'
      | 'dismissed'
      | 'proof_opened'
      | 'promise_opened';
    benefit: 'free_freeze';
  };
  'Ad Outcome': {
    format: 'rewarded' | 'interstitial';
    outcome: 'shown' | 'earned' | 'skipped' | 'failed';
    reason:
      | 'none'
      | 'ads_disabled'
      | 'background'
      | 'module_missing'
      | 'invalid_config'
      | 'no_fill'
      | 'show_failed'
      | 'load_failed'
      | 'consent_required'
      | 'consent_unavailable'
      | 'consent_error'
      | 'daily_limit'
      | 'cooldown'
      | 'reward_unconfirmed'
      | 'verification_unavailable'
      | 'verification_failed'
      | 'reward_pending'
      | 'timeout'
      | 'error';
  };
  'Paywall Viewed': {
    placement: PaywallAnalyticsPlacement;
    variant: PaywallAnalyticsVariant;
  };
  'Paywall Journey': {
    stage: 'entry_tapped' | 'benefits' | 'plans' | 'offer' | 'purchase_tapped';
    source?: 'shop';
    context: 'challenge' | 'group' | 'member' | 'general';
    plan: 'weekly' | 'annual' | 'none';
  };
  'Subscription Started': {
    plan: SubscriptionPlan;
  };
  'Subscription Outcome': {
    action: 'purchase' | 'restore';
    outcome:
      | 'succeeded'
      | 'pending'
      | 'cancelled'
      | 'nothing_to_restore'
      | 'unsupported'
      | 'failed';
    plan: SubscriptionPlan | 'unknown';
  };
};

export const getAnalyticsWidthBucket = (
  width: number
): AnalyticsEventProperties['App Layout Classified']['width_bucket'] => {
  if (width < 600) return 'compact';
  if (width < 900) return 'medium';
  return 'expanded';
};

export const getProofOutcomeReason = (
  code: string | null | undefined
): AnalyticsEventProperties['Proof Submission Outcome']['reason'] => {
  if (code === 'MISSING_SESSION') return 'missing_session';
  if (code === 'DAILY_SUBMISSION_EXISTS') return 'daily_submission_exists';
  if (code === 'NOT_JOINED') return 'not_joined';
  return code ? 'network_or_server' : 'none';
};

export const getProofSubmissionOutcome = (
  status: ProofReceiptStatus
): AnalyticsEventProperties['Proof Submission Outcome']['outcome'] => {
  if (status === 'pending-review') return 'pending_review';
  if (status === 'correction-requested') return 'correction_requested';
  if (status === 'sent') return 'sent';
  if (status === 'uploading') return 'in_progress';
  if (status === 'saved-local') return 'saved_local';
  if (status === 'unknown-result') return 'unknown_result';
  if (status === 'accepted') return 'accepted';
  return 'failed';
};

export const getProofReceiptActionStatus = (
  status: ProofReceiptStatus
): AnalyticsEventProperties['Proof Receipt Action']['receipt_status'] => {
  if (status === 'saved-local') return 'saved_local';
  if (status === 'pending-review') return 'pending_review';
  if (status === 'correction-requested') return 'correction_requested';
  if (status === 'unknown-result') return 'unknown_result';
  return status;
};

export const PAYWALL_PLACEMENT_FLAG_KEY = 'paywall_placement' as const;

export const getPromiseDurationBucket = (
  durationDays: number
): PromiseDurationBucket => {
  if (durationDays === 7) return '7_days';
  if (durationDays === 14) return '14_days';
  if (durationDays === 30) return '30_days';
  return 'other';
};

export const getStreakLengthBucket = (
  streakLength: number
): StreakLengthBucket => {
  if (streakLength <= 0) return '0';
  if (streakLength <= 2) return '1_2';
  if (streakLength <= 6) return '3_6';
  if (streakLength <= 13) return '7_13';
  if (streakLength <= 29) return '14_29';
  return '30_plus';
};

export const getProofReceiptAnalyticsStatus = (
  receiptStatus: ProofReceiptStatus
): AnalyticsEventProperties['Proof Submitted']['receipt_status'] | null => {
  if (receiptStatus === 'accepted') return 'accepted';
  if (receiptStatus === 'pending-review') return 'pending_review';
  if (receiptStatus === 'correction-requested') {
    return 'correction_requested';
  }
  return null;
};

export const getPaywallAnalyticsPlacement = (
  context: string
): PaywallAnalyticsPlacement => {
  if (
    context === 'onboarding' ||
    context === 'later' ||
    context === 'challenge' ||
    context === 'group' ||
    context === 'member' ||
    context === 'general'
  ) {
    return context;
  }
  return 'general';
};

export const getPaywallAnalyticsVariant = (
  flag: string | boolean | undefined | null
): PaywallAnalyticsVariant => {
  if (flag === 'onboarding' || flag === 'later') {
    return flag;
  }
  return 'unset';
};
