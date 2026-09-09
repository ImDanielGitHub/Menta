import React from 'react';
import * as Clipboard from 'expo-clipboard';
import * as Updates from 'expo-updates';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  AccessibilityInfo,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useQueryClient } from '@tanstack/react-query';

import {
  PromiseInviteContextLine,
  PromiseInviteRoleHero,
} from '@/components/onboarding/PromiseInviteRoleHero';
import { ConfirmDestructiveSheet } from '@/components/ui/ConfirmDestructiveSheet';
import {
  AppButton,
  AppInlineNotice,
  AppOptionCard,
  AppScreen,
  AppTopBar,
  SkeletonLoader,
} from '@/components/ui';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  CheckIcon,
  ChevronRightIcon,
  PlusIcon,
  ShieldIcon,
  UsersIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import {
  promiseAccountabilityQueryKey,
  usePromiseAccountability,
} from '@/hooks/usePromiseAccountability';
import {
  accountabilityRoleCopy,
  accountabilityOwnerConsequence,
  accountabilityOwnerInviteAction,
  buildPromiseAccountabilityShareMessage,
  preparePromiseAccountabilityInvite,
  leavePromiseAccountability,
  reconcilePromiseAccountabilityLeave,
  managePromiseAccountabilityMember,
  type PreparedPromiseAccountabilityInvite,
  type PromiseAccountabilityMember,
  type PromiseAccountabilityRole,
  type PromiseAccountabilityTranslator,
} from '@/lib/promises/accountability';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useOnboardingCompletionStore } from '@/lib/navigation/onboarding-completion';
import {
  beginOnboardingInvitation,
  completeOnboardingInvitation,
} from '@/lib/navigation/onboarding-invitation-lifecycle';
import { buildInviteShareUrl } from '@/lib/invite-links';
import { useTranslation } from '@/lib/localization';
import {
  decodeAccountabilityPickerPromises,
  getAccountabilityPickerDestination,
  type AccountabilityPickerPromise,
} from '@/lib/promises/accountability-picker';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import * as SentryDiagnostics from '@/lib/sentry';
import { trackProductEvent, trackProductOperation } from '@/lib/posthog';
import { createClientEventId } from '@/lib/client-event-id';
import { emitPromiseMutationResultHaptic } from '@/lib/motion/promise-mutation-haptics';
import { withTimeout } from '@/utils/api';
import {
  GROUP_IMAGE_PRESET_PREFIX,
  resolveGroupImagePreset,
} from '@/lib/groups/group-image-presets';
import {
  attachPromiseToSavedGroup,
  type PromiseSavedGroupLinkRequest,
  type PromiseSavedGroupLinkResult,
} from '@/lib/promises/saved-group-link';
import {
  readAttachableSavedGroups,
  type AttachableSavedGroup,
} from '@/lib/promises/saved-group-options';
import { beginPendingSavedGroupLink } from '@/lib/promises/pending-saved-group-link';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitHaptic,
} from '@/lib/motion/haptics';
import {
  unknownPromiseMutation,
  type PromiseMutationResult,
} from '@/lib/promises/mutation-result';

type AccountabilityJourneySource =
  | 'onboarding'
  | 'groups'
  | 'today'
  | 'promise'
  | 'unknown';

const accountabilityJourneySource = (
  value: string | null
): AccountabilityJourneySource => {
  if (value === 'promise_detail' || value === 'people_tab') return 'promise';
  if (value === 'group_board') return 'groups';
  if (
    value === 'onboarding' ||
    value === 'groups' ||
    value === 'today' ||
    value === 'promise'
  ) {
    return value;
  }
  return 'unknown';
};

const firstParam = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? value[0]?.trim() || null : value?.trim() || null;

const ACCOUNTABILITY_PICKER_TIMEOUT_MS = 15_000;

const diagnosticErrorCode = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'unknown';
  const candidate = error as { code?: unknown; status?: unknown };
  if (
    typeof candidate.code === 'string' &&
    /^[A-Za-z0-9_.-]{1,40}$/.test(candidate.code)
  ) {
    return candidate.code;
  }
  if (
    typeof candidate.status === 'number' &&
    Number.isFinite(candidate.status)
  ) {
    return String(candidate.status);
  }
  return 'unknown';
};

const visibleAccountabilityErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (!(error instanceof Error) || !error.message) return fallback;
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';
  return code === 'TIMEOUT' ? fallback : error.message;
};

const ROLE_OPTIONS: PromiseAccountabilityRole[] = [
  'partner',
  'reviewer',
  'supporter',
];

const memberRoleLabel = (
  member: PromiseAccountabilityMember,
  localise: PromiseAccountabilityTranslator
): string => {
  if (member.role === 'owner') {
    return localise('groups.source.accountability.role.owner');
  }
  return accountabilityRoleCopy(member.role, localise).title;
};

const proofStatusLabel = (
  member: PromiseAccountabilityMember,
  localise: PromiseAccountabilityTranslator
): string => {
  if (!member.participates) return memberRoleLabel(member, localise);
  if (member.proofStatus === 'approved') {
    return localise('groups.source.accountability.proof.approved');
  }
  if (member.proofStatus === 'pending') {
    return localise('groups.source.accountability.proof.pending');
  }
  if (member.proofStatus === 'rejected') {
    return localise('groups.source.accountability.proof.rejected');
  }
  return localise('groups.source.accountability.proof.due');
};

const MemberRow = ({
  member,
  onPress,
}: {
  member: PromiseAccountabilityMember;
  onPress?: () => void;
}) => {
  const { t } = useTranslation();
  const initials = member.name
    .split(/\s+/u)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const complete = member.proofStatus === 'approved';

  return (
    <Pressable
      accessibilityHint={
        onPress
          ? t('groups.source.accountability.member.change_hint')
          : undefined
      }
      accessibilityLabel={t(
        'groups.source.accountability.member.accessibility',
        {
          name: member.name,
          role: memberRoleLabel(member, t),
        }
      )}
      accessibilityRole={onPress ? 'button' : 'text'}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.memberRow,
        pressed ? styles.memberRowPressed : null,
      ]}
      testID={`promise-person-${member.id}`}
    >
      <View
        accessibilityElementsHidden
        style={[
          styles.memberAvatar,
          member.role === 'owner' ? styles.memberAvatarOwner : null,
        ]}
      >
        <Text style={styles.memberInitials}>{initials}</Text>
      </View>
      <View style={styles.memberCopy}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={complete ? styles.memberSuccess : styles.memberDetail}>
          {proofStatusLabel(member, t)}
        </Text>
      </View>
      {complete ? (
        <CheckIcon size={19} color={mentaColors.success} />
      ) : (
        <Text style={styles.memberRole}>{memberRoleLabel(member, t)}</Text>
      )}
    </Pressable>
  );
};

const SavedGroupThumbnail = ({ group }: { group: AttachableSavedGroup }) => {
  const imageUrl = group.imageUrl?.trim() || null;
  const preset = resolveGroupImagePreset(imageUrl);
  const imageSource =
    preset?.source ??
    (imageUrl && !imageUrl.startsWith(GROUP_IMAGE_PRESET_PREFIX)
      ? { uri: imageUrl }
      : null);
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.savedGroupThumbnail}
    >
      {imageSource && !imageFailed ? (
        <Image
          accessibilityIgnoresInvertColors
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={imageSource}
          style={styles.savedGroupImage}
        />
      ) : (
        <UsersIcon size={24} color={mentaColors.action} />
      )}
    </View>
  );
};

export function PromisePicker({
  onBack,
  source = 'unknown',
}: {
  onBack: () => void;
  source?: AccountabilityJourneySource;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const [available, setAvailable] = React.useState<
    AccountabilityPickerPromise[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    if (!user?.id) {
      setLoading(false);
      SentryDiagnostics.addBreadcrumb?.('accountability_picker_blocked', {
        source,
        reason: 'missing_account',
      });
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setLoadError(null);
    SentryDiagnostics.addBreadcrumb?.('accountability_picker_load_started', {
      source,
    });
    void (async () => {
      try {
        const { data, error } = await withTimeout(
          Promise.resolve(
            supabase
              .from('challenge_participants')
              .select(
                `
        status,
        challenges!inner (
          id,
          title,
          status,
          completion_status,
          is_expired,
          end_date,
          team_challenges (
            group_id,
            team:teams!team_challenges_group_id_fkey (id, kind)
          )
        )
      `
              )
              .eq('user_id', user.id)
              .eq('status', 'active')
          ),
          ACCOUNTABILITY_PICKER_TIMEOUT_MS,
          'accountability_picker_load'
        );
        if (!active) return;
        if (error) {
          const errorCode = diagnosticErrorCode(error);
          trackProductOperation({
            area: 'accountability',
            authority: 'server',
            operation: 'link_accountability',
            outcome: 'unknown',
            phase: 'reconciliation',
            source:
              source === 'onboarding'
                ? 'onboarding'
                : source === 'today'
                  ? 'today'
                  : 'groups',
          });
          trackProductEvent('Accountability Invite Journey', {
            context: 'missing',
            source,
            stage: 'picker_failed',
          });
          SentryDiagnostics.logEvent?.(
            'warn',
            'accountability_picker_load_failed',
            { source, reason_code: 1 }
          );
          SentryDiagnostics.logEvent?.(
            'error',
            'accountability_picker_load_failed',
            { source, error_code: errorCode, recovery: 'explicit_retry' }
          );
          SentryDiagnostics.logCrash?.(error, {
            type: 'accountability_picker_load_error',
            context: 'promise_accountability_picker',
            userAction: 'continue_to_invite',
            screenName: 'promise-accountability',
            additionalContext: {
              source,
              errorCode,
              failureKind: 'server_response',
              recovery: 'explicit_retry',
            },
          });
          setLoadError(
            t('groups.source.accountability.picker.load_error_detail')
          );
          return;
        }
        const decodedPromises = decodeAccountabilityPickerPromises(data);
        setAvailable(decodedPromises);
        SentryDiagnostics.addBreadcrumb?.('accountability_picker_loaded', {
          source,
          available_count: decodedPromises.length,
        });
        trackProductOperation({
          area: 'accountability',
          authority: 'server',
          operation: 'link_accountability',
          outcome: 'eligible',
          phase: 'eligibility',
          source:
            source === 'onboarding'
              ? 'onboarding'
              : source === 'today'
                ? 'today'
                : 'groups',
        });
        trackProductEvent('Accountability Invite Journey', {
          context: 'not_applicable',
          source,
          stage: 'picker_loaded',
        });
      } catch (error) {
        if (active) {
          trackProductOperation({
            area: 'accountability',
            authority: 'server',
            operation: 'link_accountability',
            outcome: 'unknown',
            phase: 'reconciliation',
            source:
              source === 'onboarding'
                ? 'onboarding'
                : source === 'today'
                  ? 'today'
                  : 'groups',
          });
          trackProductEvent('Accountability Invite Journey', {
            context: 'missing',
            source,
            stage: 'picker_failed',
          });
          SentryDiagnostics.logEvent?.(
            'warn',
            'accountability_picker_load_failed',
            { source, reason_code: 2 }
          );
          const errorCode = diagnosticErrorCode(error);
          SentryDiagnostics.logEvent?.(
            'error',
            'accountability_picker_load_failed',
            { source, error_code: errorCode, recovery: 'explicit_retry' }
          );
          SentryDiagnostics.logCrash?.(error, {
            type: 'accountability_picker_load_error',
            context: 'promise_accountability_picker',
            userAction: 'continue_to_invite',
            screenName: 'promise-accountability',
            additionalContext: {
              source,
              errorCode,
              failureKind: 'request_exception',
              recovery: 'explicit_retry',
            },
          });
          setLoadError(
            t('groups.source.accountability.picker.load_error_detail')
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadToken, source, t, user?.id]);

  return (
    <AppScreen
      lane="focused"
      maxWidth={Platform.OS === 'ios' && Platform.isPad ? 720 : undefined}
      scrollable
      safeArea
      hasTabBar={false}
      contentContainerStyle={styles.screenContent}
      testID="promise-accountability-picker"
    >
      <AppTopBar
        title={t('groups.source.accountability.picker.title')}
        onBack={onBack}
        backLabel={t('groups.source.accountability.common.back')}
      />
      <View
        style={styles.pickerBody}
        testID="promise-accountability-picker-body"
      >
        <View style={styles.headingBlock}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('groups.source.accountability.picker.heading')}
          </Text>
          <Text style={styles.lead}>
            {t('groups.source.accountability.picker.detail')}
          </Text>
        </View>

        {loading ? (
          <PromisePickerLoading />
        ) : loadError ? (
          <AppInlineNotice
            title={t('groups.source.accountability.picker.load_error_title')}
            description={loadError}
            tone="error"
            actionLabel={t('groups.source.accountability.common.try_again')}
            onAction={() => setReloadToken(current => current + 1)}
            testID="promise-accountability-picker-error"
          />
        ) : available.length > 0 ? (
          <View style={styles.promiseList}>
            {available.map(challenge => {
              const detail =
                challenge.groupKind === 'saved'
                  ? t('groups.source.accountability.picker.already_shared')
                  : t('groups.source.accountability.picker.private_now');

              return (
                <Pressable
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    'groups.source.accountability.picker.choose_accessibility',
                    { promise: challenge.title }
                  )}
                  accessibilityHint={
                    challenge.groupKind === 'saved' && challenge.groupId
                      ? t('groups.tab.list_open_hint')
                      : t('groups.source.accountability.picker.choose_hint')
                  }
                  key={challenge.id}
                  onPress={() => {
                    trackProductOperation({
                      area: 'accountability',
                      authority: 'client',
                      operation: 'link_accountability',
                      outcome: 'started',
                      phase: 'intent',
                      source:
                        source === 'onboarding'
                          ? 'onboarding'
                          : source === 'today'
                            ? 'today'
                            : 'groups',
                    });
                    trackProductEvent('Accountability Invite Journey', {
                      context:
                        challenge.groupKind === 'saved' ? 'shared' : 'private',
                      source,
                      stage: 'promise_selected',
                    });
                    router.replace(
                      getAccountabilityPickerDestination(challenge) as never
                    );
                  }}
                  style={({ pressed }) => [
                    styles.promiseChoice,
                    pressed ? styles.promiseChoicePressed : null,
                  ]}
                  testID={`accountability-promise-${challenge.id}`}
                >
                  <Text style={styles.promiseChoiceLabel}>
                    {t('todayProof.residual.your_promise')}
                  </Text>
                  <Text style={styles.promiseChoiceTitle}>
                    {challenge.title}
                  </Text>
                  <View style={styles.promiseChoiceRule} />
                  <View style={styles.promiseChoiceFooter}>
                    <View style={styles.promiseChoicePeopleIcon}>
                      <UsersIcon size={18} color={mentaColors.actionOnPaper} />
                    </View>
                    <Text numberOfLines={2} style={styles.promiseChoiceDetail}>
                      {detail}
                    </Text>
                    <ChevronRightIcon
                      size={18}
                      color={mentaColors.actionOnPaper}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <AppInlineNotice
            title={t('groups.source.accountability.picker.empty_title')}
            description={t('groups.source.accountability.picker.empty_detail')}
            tone="info"
            testID="promise-accountability-empty"
          />
        )}
      </View>
    </AppScreen>
  );
}

const PromisePickerLoading = () => {
  const { t } = useTranslation();

  return (
    <View
      accessible
      accessibilityLabel={t('shared.accessibility.loading')}
      accessibilityRole="progressbar"
      style={styles.promiseChoiceLoading}
      testID="promise-accountability-picker-loading"
    >
      <LoadingStatus label={t('groups.source.accountability.people.loading')} />
      <SkeletonLoader
        announce={false}
        height={14}
        width="34%"
        style={styles.paperSkeleton}
      />
      <SkeletonLoader
        announce={false}
        height={29}
        width="76%"
        style={styles.paperSkeleton}
      />
      <View style={styles.promiseChoiceLoadingRule} />
      <View style={styles.promiseChoiceLoadingFooter}>
        <SkeletonLoader
          announce={false}
          borderRadius={mentaRadii.round}
          height={38}
          width={38}
          style={styles.paperSkeleton}
        />
        <View style={styles.promiseChoiceLoadingCopy}>
          <SkeletonLoader
            announce={false}
            height={13}
            width="92%"
            style={styles.paperSkeleton}
          />
          <SkeletonLoader
            announce={false}
            height={13}
            width="64%"
            style={styles.paperSkeleton}
          />
        </View>
      </View>
    </View>
  );
};

const LoadingStatus = ({ label }: { label: string }) => (
  <View style={styles.loadingStatus}>
    <View style={styles.loadingStatusMark}>
      <UsersIcon color={mentaColors.action} size={17} />
    </View>
    <Text style={styles.loadingStatusText}>{label}</Text>
  </View>
);

const PromiseAccountabilityLoading = () => {
  const { t } = useTranslation();

  return (
    <View
      accessible
      accessibilityLabel={t('groups.source.accountability.people.loading')}
      accessibilityRole="progressbar"
      style={styles.accountabilityTransition}
      testID="promise-accountability-loading"
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.accountabilityTransitionContent}
      >
        <Text style={styles.accountabilityTransitionEyebrow}>
          {t('groups.source.accountability.invite.label')}
        </Text>
        <Text style={styles.accountabilityTransitionTitle}>
          {t('groups.source.accountability.role.question')}
        </Text>
        <Text style={styles.accountabilityTransitionDetail}>
          {t('groups.source.accountability.people.loading')}
        </Text>
      </View>
    </View>
  );
};

export default function PromiseAccountabilityRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const currentUser = useAuthStore(state => state.user);
  const params = useLocalSearchParams<{
    challengeId?: string | string[];
    source?: string | string[];
    originGroupId?: string | string[];
  }>();
  const challengeId = firstParam(params.challengeId);
  const source = firstParam(params.source);
  const originGroupId = firstParam(params.originGroupId);
  const journeySource = accountabilityJourneySource(source);
  const summaryQuery = usePromiseAccountability(challengeId);
  const [role, setRole] = React.useState<PromiseAccountabilityRole | null>(
    null
  );
  const [showOnboardingQr, setShowOnboardingQr] = React.useState(false);
  const [preparing, setPreparing] = React.useState(false);
  const preparingRef = React.useRef(false);
  const sharingRef = React.useRef(false);
  const copyingRef = React.useRef(false);
  const routeMountedRef = React.useRef(true);
  const finishingInvitationRef = React.useRef(false);
  React.useEffect(() => {
    routeMountedRef.current = true;
    return () => {
      routeMountedRef.current = false;
    };
  }, []);
  const [prepared, setPrepared] =
    React.useState<PreparedPromiseAccountabilityInvite | null>(null);
  const [hiddenPreparedCode, setHiddenPreparedCode] = React.useState<
    string | null
  >(null);
  const [notice, setNotice] = React.useState<{
    title: string;
    description: string;
    tone: 'info' | 'success' | 'warning' | 'error';
    actionLabel?: string;
    onAction?: () => void;
    actionLoading?: boolean;
  } | null>(null);
  const [leaveConfirmationVisible, setLeaveConfirmationVisible] =
    React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [leaveRecovery, setLeaveRecovery] = React.useState<Extract<
    PromiseMutationResult,
    { outcome: 'failed' | 'unknown' }
  > | null>(null);
  const [selectedMember, setSelectedMember] =
    React.useState<PromiseAccountabilityMember | null>(null);
  const [memberToRemove, setMemberToRemove] =
    React.useState<PromiseAccountabilityMember | null>(null);
  const [managingMember, setManagingMember] = React.useState(false);
  const [savedGroupSheetVisible, setSavedGroupSheetVisible] =
    React.useState(false);
  const [attachableSavedGroups, setAttachableSavedGroups] = React.useState<
    AttachableSavedGroup[]
  >([]);
  const [savedGroupsLoading, setSavedGroupsLoading] = React.useState(false);
  const [savedGroupsLoadFailed, setSavedGroupsLoadFailed] =
    React.useState(false);
  const [selectedSavedGroupId, setSelectedSavedGroupId] = React.useState<
    string | null
  >(null);
  const [savedGroupLinkResult, setSavedGroupLinkResult] =
    React.useState<PromiseSavedGroupLinkResult | null>(null);
  const [savedGroupLinkSubmitting, setSavedGroupLinkSubmitting] =
    React.useState(false);
  const [savedGroupCreateHandoffFailed, setSavedGroupCreateHandoffFailed] =
    React.useState(false);
  const savedGroupLinkSubmittingRef = React.useRef(false);
  const summaryDiagnosticRef = React.useRef<string | null>(null);
  const onboardingJourneyViewsRef = React.useRef(new Set<string>());

  React.useEffect(() => {
    if (
      journeySource !== 'onboarding' ||
      !currentUser?.id ||
      !challengeId ||
      !summaryQuery.data?.canInvite
    )
      return;
    // Recover invitations opened before the lifecycle marker was introduced.
    void beginOnboardingInvitation({
      ownerUserId: currentUser.id,
      firstPromiseId: challengeId,
      accountabilityChoice: 'new_group',
    });
  }, [
    challengeId,
    currentUser?.id,
    journeySource,
    summaryQuery.data?.canInvite,
  ]);

  React.useEffect(() => {
    const currentUserId = currentUser?.id;
    if (source !== 'onboarding' || !challengeId || !currentUserId) return;

    const completionStore = useOnboardingCompletionStore.getState();
    const completion = completionStore.peekCompletionForUser(currentUserId);
    if (
      !completion ||
      completion.accountabilityChoice !== 'new_group' ||
      completion.firstPromiseId !== challengeId
    ) {
      return;
    }

    const acknowledged =
      completionStore.consumeCompletionForUser(currentUserId);
    if (
      acknowledged?.accountabilityChoice === 'new_group' &&
      acknowledged.firstPromiseId === challengeId
    ) {
      SentryDiagnostics.addBreadcrumb?.(
        'onboarding_completion_destination_acknowledged',
        {
          destination: 'promise_accountability',
          source: 'onboarding',
        }
      );
    }
  }, [challengeId, currentUser?.id, source]);

  const operationSource =
    journeySource === 'onboarding'
      ? 'onboarding'
      : journeySource === 'today'
        ? 'today'
        : 'groups';
  const trackInviteOnboardingJourney = React.useCallback(
    (
      stage: 'invite_role' | 'invite_ready',
      action:
        | 'viewed'
        | 'selected'
        | 'requested'
        | 'returned'
        | 'completed'
        | 'back'
        | 'skipped',
      outcome:
        | 'not_applicable'
        | 'succeeded'
        | 'failed'
        | 'cancelled'
        | 'pending'
        | 'unknown' = 'not_applicable',
      selection:
        | 'not_applicable'
        | 'partner'
        | 'reviewer'
        | 'supporter'
        | 'show_qr'
        | 'hide_qr'
        | 'share_sheet'
        | 'copy_link'
        | 'today' = 'not_applicable'
    ) => {
      if (journeySource !== 'onboarding') return;
      trackProductEvent('Onboarding Journey', {
        action,
        authenticated: Boolean(currentUser?.id),
        entry_mode: 'post_sign_in',
        journey: 'accountability_invite',
        outcome,
        selection,
        stage,
      });
    },
    [currentUser?.id, journeySource]
  );

  React.useEffect(() => {
    if (journeySource !== 'onboarding' || !summaryQuery.data) return;
    const stage = prepared ? 'invite_ready' : 'invite_role';
    if (onboardingJourneyViewsRef.current.has(stage)) return;
    onboardingJourneyViewsRef.current.add(stage);
    trackInviteOnboardingJourney(stage, 'viewed');
  }, [
    journeySource,
    prepared,
    summaryQuery.data,
    trackInviteOnboardingJourney,
  ]);

  React.useEffect(() => {
    trackProductEvent('Accountability Invite Journey', {
      context: challengeId ? 'present' : 'missing',
      source: journeySource,
      stage: 'route_opened',
    });
    SentryDiagnostics.logEvent?.(
      'info',
      'promise_accountability_update_context',
      {
        source: journeySource,
        update_id: Updates.updateId ?? null,
        runtime_version: Updates.runtimeVersion ?? null,
        is_embedded_launch: Updates.isEmbeddedLaunch ?? null,
      }
    );
  }, [challengeId, journeySource]);

  React.useEffect(() => {
    if (!challengeId) return;
    const state = summaryQuery.isLoading
      ? 'loading'
      : summaryQuery.isError
        ? 'error'
        : summaryQuery.data
          ? 'ready'
          : 'empty';
    const diagnosticKey = `${challengeId}:${state}`;
    if (summaryDiagnosticRef.current === diagnosticKey) return;
    summaryDiagnosticRef.current = diagnosticKey;

    if (state === 'loading') {
      SentryDiagnostics.addBreadcrumb?.('promise_accountability_load_started', {
        source: journeySource,
      });
      return;
    }

    if (state === 'ready') {
      SentryDiagnostics.addBreadcrumb?.('promise_accountability_loaded', {
        source: journeySource,
      });
      return;
    }

    if (state === 'error') {
      const error =
        summaryQuery.error ??
        new Error('Promise accountability summary was unavailable.');
      const errorCode = diagnosticErrorCode(error);
      SentryDiagnostics.logEvent?.(
        'error',
        'promise_accountability_load_failed',
        {
          source: journeySource,
          error_code: errorCode,
          recovery: 'explicit_retry',
        }
      );
      SentryDiagnostics.logCrash?.(error, {
        type: 'onboarding_invite_destination_load',
        context: 'promise_accountability',
        userAction:
          journeySource === 'onboarding'
            ? 'continue_to_invite'
            : 'open_promise_accountability',
        screenName: 'promise-accountability',
        additionalContext: {
          source: journeySource,
          errorCode,
          failureKind: 'summary_unavailable',
          recovery: 'explicit_retry',
        },
      });
    }
  }, [
    challengeId,
    journeySource,
    summaryQuery.data,
    summaryQuery.error,
    summaryQuery.isError,
    summaryQuery.isLoading,
  ]);

  const goBack = React.useCallback(() => {
    if (source === 'onboarding') {
      trackInviteOnboardingJourney(
        prepared ? 'invite_ready' : 'invite_role',
        'back'
      );
      router.replace('/(tabs)');
      return;
    }
    if (
      (source === 'promise_detail' || source === 'people_tab') &&
      challengeId
    ) {
      backOrReplace(router, {
        pathname: '/challenges/[id]',
        params: { id: challengeId },
      });
      return;
    }
    const returnGroupId = originGroupId ?? summaryQuery.data?.group?.id;
    if (source === 'group_board' && returnGroupId) {
      backOrReplace(router, {
        pathname: '/groups/[id]',
        params: { id: returnGroupId },
      });
      return;
    }
    backOrReplace(router, '/(tabs)/groups');
  }, [
    challengeId,
    originGroupId,
    prepared,
    router,
    source,
    summaryQuery.data?.group?.id,
    trackInviteOnboardingJourney,
  ]);

  const changeInvitation = React.useCallback(() => {
    if (!prepared) return;
    trackInviteOnboardingJourney('invite_ready', 'back');
    setHiddenPreparedCode(prepared.code);
    setPrepared(null);
    setNotice(null);
  }, [prepared, trackInviteOnboardingJourney]);

  const loadAttachableSavedGroups = React.useCallback(async () => {
    if (!currentUser?.id) {
      setSavedGroupsLoading(false);
      setSavedGroupsLoadFailed(true);
      trackProductOperation({
        area: 'accountability',
        authority: 'client',
        operation: 'link_accountability',
        outcome: 'blocked',
        phase: 'eligibility',
        source: operationSource,
      });
      return;
    }

    setSavedGroupsLoading(true);
    setSavedGroupsLoadFailed(false);
    try {
      const groups = await readAttachableSavedGroups(currentUser.id);
      setAttachableSavedGroups(groups);
      setSelectedSavedGroupId(current =>
        current && groups.some(group => group.id === current)
          ? current
          : (groups[0]?.id ?? null)
      );
      trackProductOperation({
        area: 'accountability',
        authority: 'client',
        operation: 'link_accountability',
        outcome: groups.length > 0 ? 'eligible' : 'ineligible',
        phase: 'eligibility',
        source: operationSource,
      });
    } catch {
      setAttachableSavedGroups([]);
      setSelectedSavedGroupId(null);
      setSavedGroupsLoadFailed(true);
      trackProductOperation({
        area: 'accountability',
        authority: 'client',
        operation: 'link_accountability',
        outcome: 'failed',
        phase: 'eligibility',
        source: operationSource,
      });
    } finally {
      setSavedGroupsLoading(false);
    }
  }, [currentUser?.id, operationSource]);

  const openSavedGroupPicker = React.useCallback(() => {
    if (!challengeId) return;
    setSavedGroupSheetVisible(true);
    setSavedGroupLinkResult(current =>
      current?.outcome === 'unknown' ? current : null
    );
    setSavedGroupCreateHandoffFailed(false);
    trackProductOperation({
      area: 'accountability',
      authority: 'client',
      operation: 'link_accountability',
      outcome: 'started',
      phase: 'intent',
      source: operationSource,
    });
    void loadAttachableSavedGroups();
  }, [challengeId, loadAttachableSavedGroups, operationSource]);

  const createSavedGroupForPromise = React.useCallback(async () => {
    if (
      !challengeId ||
      !currentUser?.id ||
      savedGroupLinkSubmittingRef.current
    ) {
      return;
    }

    savedGroupLinkSubmittingRef.current = true;
    setSavedGroupLinkSubmitting(true);
    setSavedGroupCreateHandoffFailed(false);
    trackProductOperation({
      area: 'accountability',
      authority: 'client',
      operation: 'link_accountability',
      outcome: 'started',
      phase: 'intent',
      source: operationSource,
    });
    try {
      await beginPendingSavedGroupLink(currentUser.id, {
        challengeId,
        clientEventId: createClientEventId(),
      });
      setSavedGroupSheetVisible(false);
      router.push({
        pathname: '/create-group',
        params: { source: 'promise_accountability' },
      } as never);
    } catch {
      setSavedGroupCreateHandoffFailed(true);
      trackProductOperation({
        area: 'accountability',
        authority: 'client',
        operation: 'link_accountability',
        outcome: 'failed',
        phase: 'recovery',
        source: operationSource,
      });
      void emitHaptic({ type: 'failed', operation: 'save' });
    } finally {
      savedGroupLinkSubmittingRef.current = false;
      setSavedGroupLinkSubmitting(false);
    }
  }, [challengeId, currentUser?.id, operationSource, router]);

  const submitSavedGroupLink = React.useCallback(
    async (retryRequest?: PromiseSavedGroupLinkRequest) => {
      if (
        !challengeId ||
        savedGroupLinkSubmittingRef.current ||
        (!retryRequest && !selectedSavedGroupId)
      ) {
        return;
      }

      const request: PromiseSavedGroupLinkRequest = retryRequest ?? {
        challengeId,
        groupId: selectedSavedGroupId as string,
        clientEventId: createClientEventId(),
      };
      savedGroupLinkSubmittingRef.current = true;
      setSavedGroupLinkSubmitting(true);
      setSavedGroupLinkResult(null);
      trackProductOperation({
        area: 'accountability',
        authority: 'server',
        operation: 'link_accountability',
        outcome: 'started',
        phase: retryRequest ? 'reconciliation' : 'intent',
        source: operationSource,
      });

      try {
        const result = await attachPromiseToSavedGroup(request);
        setSavedGroupLinkResult(result);

        if (result.outcome === 'confirmed') {
          trackProductOperation({
            area: 'accountability',
            authority: 'server',
            operation: 'link_accountability',
            outcome: retryRequest ? 'recovered' : 'confirmed',
            phase: retryRequest ? 'recovery' : 'authority',
            source: operationSource,
          });
          void emitConfirmedOutcome(
            'promise-joined',
            createConfirmedReceipt('promise-membership', result.receipt.id)
          );
          AccessibilityInfo.announceForAccessibility?.(
            t('groups.source.accountability.saved_group_picker.confirmed', {
              group: result.receipt.groupName,
            })
          );
          await queryClient.invalidateQueries({
            queryKey: promiseAccountabilityQueryKey(challengeId),
          });
          setSavedGroupSheetVisible(false);
          router.replace({
            pathname: '/groups/[id]',
            params: { id: result.receipt.groupId },
          } as never);
          return;
        }

        if (result.outcome === 'failed') {
          trackProductOperation({
            area: 'accountability',
            authority: 'server',
            operation: 'link_accountability',
            outcome: 'failed',
            phase: 'authority',
            source: operationSource,
          });
          void emitHaptic({ type: 'failed', operation: 'join' });
          return;
        }

        trackProductOperation({
          area: 'accountability',
          authority: 'server',
          operation: 'link_accountability',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: operationSource,
        });
      } finally {
        savedGroupLinkSubmittingRef.current = false;
        setSavedGroupLinkSubmitting(false);
      }
    },
    [challengeId, operationSource, queryClient, router, selectedSavedGroupId, t]
  );

  const handlePrepare = React.useCallback(async () => {
    const selectedRole = role;
    if (!challengeId || !selectedRole || preparingRef.current) return;
    trackInviteOnboardingJourney(
      'invite_role',
      'requested',
      'pending',
      selectedRole
    );
    const productSource =
      journeySource === 'onboarding'
        ? 'onboarding'
        : journeySource === 'today'
          ? 'today'
          : 'groups';
    SentryDiagnostics.addBreadcrumb?.(
      'promise_accountability_invite_prepare_started',
      { source: productSource, role: selectedRole }
    );
    trackProductOperation({
      area: 'accountability',
      authority: 'server',
      operation: 'prepare_invite',
      outcome: 'started',
      phase: 'intent',
      source: productSource,
    });
    preparingRef.current = true;
    setPreparing(true);
    setNotice(null);
    try {
      const next = await preparePromiseAccountabilityInvite({
        challengeId,
        role: selectedRole,
        localise: t,
      });
      setHiddenPreparedCode(null);
      setPrepared(next);
      trackInviteOnboardingJourney(
        'invite_role',
        'completed',
        'succeeded',
        selectedRole
      );
      SentryDiagnostics.addBreadcrumb?.(
        'promise_accountability_invite_prepared',
        { source: productSource, role: selectedRole }
      );
      trackProductEvent('Accountability Invite Journey', {
        context: 'present',
        source: journeySource,
        stage: 'invite_prepared',
      });
      trackProductOperation({
        area: 'accountability',
        authority: 'server',
        operation: 'prepare_invite',
        outcome: 'confirmed',
        phase: 'authority',
        source: productSource,
      });
      await queryClient.invalidateQueries({
        queryKey: promiseAccountabilityQueryKey(challengeId),
      });
    } catch (error) {
      trackInviteOnboardingJourney(
        'invite_role',
        'completed',
        'failed',
        selectedRole
      );
      const errorCode = diagnosticErrorCode(error);
      SentryDiagnostics.logEvent?.(
        'error',
        'promise_accountability_invite_prepare_failed',
        {
          source: productSource,
          role: selectedRole,
          error_code: errorCode,
          recovery: 'explicit_retry',
        }
      );
      SentryDiagnostics.logCrash?.(error, {
        type: 'onboarding_invite_prepare_error',
        context: 'promise_accountability',
        userAction: 'prepare_invite',
        screenName: 'promise-accountability',
        additionalContext: {
          source: productSource,
          role: selectedRole,
          errorCode,
          recovery: 'explicit_retry',
        },
      });
      trackProductOperation({
        area: 'accountability',
        authority: 'server',
        operation: 'prepare_invite',
        outcome: 'unknown',
        phase: 'reconciliation',
        source: productSource,
      });
      setNotice({
        title: t('groups.source.accountability.invite.not_ready_title'),
        description: visibleAccountabilityErrorMessage(
          error,
          t('groups.source.accountability.invite.not_ready_detail')
        ),
        tone: 'error',
      });
    } finally {
      preparingRef.current = false;
      setPreparing(false);
    }
  }, [
    challengeId,
    journeySource,
    queryClient,
    role,
    t,
    trackInviteOnboardingJourney,
  ]);

  const goToToday = React.useCallback(
    async (outcome: 'shared' | 'skipped') => {
      if (finishingInvitationRef.current) return;
      const ownerUserId = currentUser?.id;
      finishingInvitationRef.current = true;
      try {
        if (journeySource === 'onboarding' && ownerUserId && challengeId) {
          let completed = false;
          try {
            completed = await completeOnboardingInvitation(
              ownerUserId,
              challengeId,
              outcome
            );
          } catch {
            // A local receipt failure must not turn a completed share into an error.
          }
          if (!completed) {
            SentryDiagnostics.addBreadcrumb?.(
              'onboarding_invitation_completion_unconfirmed',
              {
                source: journeySource,
                outcome,
                recovery: 'keep_review_prompts_deferred',
              }
            );
          }
        }
        if (
          !routeMountedRef.current ||
          useAuthStore.getState().user?.id !== ownerUserId
        )
          return;
        trackProductEvent('Accountability Invite Journey', {
          context: challengeId ? 'present' : 'missing',
          source: journeySource,
          stage: 'navigation_requested',
        });
        router.replace('/(tabs)');
      } finally {
        finishingInvitationRef.current = false;
      }
    },
    [challengeId, currentUser?.id, journeySource, router]
  );

  const handleShare = React.useCallback(async () => {
    if (!prepared || sharingRef.current) return;
    const ownerUserId = currentUser?.id;
    trackProductEvent('Accountability Invite Journey', {
      context: 'present',
      source: journeySource,
      stage: 'share_started',
    });
    trackInviteOnboardingJourney(
      'invite_ready',
      'requested',
      'unknown',
      'share_sheet'
    );
    sharingRef.current = true;
    SentryDiagnostics.addBreadcrumb?.('promise_accountability_share_started', {
      source: journeySource,
      role: prepared.role,
    });
    try {
      const result = await Share.share({
        title: t('groups.source.accountability.share.title', {
          promise: prepared.challengeTitle,
        }),
        message: buildPromiseAccountabilityShareMessage({
          challengeTitle: prepared.challengeTitle,
          code: prepared.code,
          role: prepared.role,
          shareUrl: prepared.shareUrl,
          localise: t,
        }),
      });
      const shared = result.action === Share.sharedAction;
      trackProductEvent('Accountability Invite Journey', {
        context: 'present',
        source: journeySource,
        stage: shared ? 'shared' : 'dismissed',
      });
      if (
        !routeMountedRef.current ||
        useAuthStore.getState().user?.id !== ownerUserId
      )
        return;
      trackInviteOnboardingJourney(
        'invite_ready',
        'returned',
        shared ? 'succeeded' : 'cancelled',
        'share_sheet'
      );
      if (shared && journeySource === 'onboarding') {
        await goToToday('shared');
        return;
      }
      setNotice({
        title: t('groups.source.accountability.share.still_ready_title'),
        description: t('groups.source.accountability.share.still_ready_detail'),
        tone: 'info',
      });
      SentryDiagnostics.addBreadcrumb?.(
        'promise_accountability_share_returned',
        {
          source: journeySource,
          role: prepared.role,
        }
      );
    } catch (error) {
      trackInviteOnboardingJourney(
        'invite_ready',
        'completed',
        'failed',
        'share_sheet'
      );
      SentryDiagnostics.logEvent?.(
        'error',
        'promise_accountability_share_failed',
        {
          source: journeySource,
          role: prepared.role,
          error_code: diagnosticErrorCode(error),
          recovery: 'explicit_retry',
        }
      );
      SentryDiagnostics.logCrash?.(error, {
        type: 'onboarding_invite_share_error',
        context: 'promise_accountability',
        userAction: 'share_invite',
        screenName: 'promise-accountability',
        additionalContext: {
          source: journeySource,
          role: prepared.role,
          errorCode: diagnosticErrorCode(error),
          recovery: 'explicit_retry',
        },
      });
      setNotice({
        title: t('groups.source.accountability.share.failed_title'),
        description: t('groups.source.accountability.share.failed_detail'),
        tone: 'error',
      });
    } finally {
      sharingRef.current = false;
    }
  }, [
    currentUser?.id,
    goToToday,
    journeySource,
    prepared,
    t,
    trackInviteOnboardingJourney,
  ]);

  const handleCopy = React.useCallback(async () => {
    if (!prepared || copyingRef.current) return;
    trackInviteOnboardingJourney(
      'invite_ready',
      'requested',
      'pending',
      'copy_link'
    );
    copyingRef.current = true;
    SentryDiagnostics.addBreadcrumb?.('promise_accountability_copy_started', {
      source: journeySource,
      role: prepared.role,
    });
    try {
      await Clipboard.setStringAsync(
        buildPromiseAccountabilityShareMessage({
          challengeTitle: prepared.challengeTitle,
          code: prepared.code,
          role: prepared.role,
          shareUrl: prepared.shareUrl,
          localise: t,
        })
      );
      trackInviteOnboardingJourney(
        'invite_ready',
        'completed',
        'succeeded',
        'copy_link'
      );
      setNotice({
        title: t('groups.source.accountability.copy.success_title'),
        description: t('groups.source.accountability.copy.success_detail'),
        tone: 'success',
      });
      SentryDiagnostics.addBreadcrumb?.(
        'promise_accountability_copy_confirmed',
        {
          source: journeySource,
          role: prepared.role,
        }
      );
    } catch (error) {
      trackInviteOnboardingJourney(
        'invite_ready',
        'completed',
        'failed',
        'copy_link'
      );
      SentryDiagnostics.logEvent?.(
        'error',
        'promise_accountability_copy_failed',
        {
          source: journeySource,
          role: prepared.role,
          error_code: diagnosticErrorCode(error),
          recovery: 'explicit_retry',
        }
      );
      SentryDiagnostics.logCrash?.(error, {
        type: 'onboarding_invite_copy_error',
        context: 'promise_accountability',
        userAction: 'copy_invite',
        screenName: 'promise-accountability',
        additionalContext: {
          source: journeySource,
          role: prepared.role,
          errorCode: diagnosticErrorCode(error),
          recovery: 'explicit_retry',
        },
      });
      setNotice({
        title: t('groups.source.accountability.copy.failed_title'),
        description: t('groups.source.accountability.copy.failed_detail'),
        tone: 'error',
      });
    } finally {
      copyingRef.current = false;
    }
  }, [journeySource, prepared, t, trackInviteOnboardingJourney]);

  const updateMemberRole = React.useCallback(
    async (
      member: PromiseAccountabilityMember,
      nextRole: PromiseAccountabilityRole | null
    ) => {
      if (!challengeId || managingMember) return;
      setManagingMember(true);
      setNotice(null);
      try {
        await managePromiseAccountabilityMember({
          challengeId,
          memberId: member.id,
          role: nextRole,
          localise: t,
        });
        setSelectedMember(null);
        setMemberToRemove(null);
        await queryClient.invalidateQueries({
          queryKey: promiseAccountabilityQueryKey(challengeId),
        });
      } catch (error) {
        setNotice({
          title: t('groups.source.accountability.member.update_failed_title'),
          description:
            error instanceof Error
              ? error.message
              : t('groups.source.accountability.member.update_failed_detail'),
          tone: 'error',
        });
      } finally {
        setManagingMember(false);
      }
    },
    [challengeId, managingMember, queryClient, t]
  );

  const applyLeaveResult = React.useCallback(
    (result: PromiseMutationResult, interaction: 'mutation' | 'recovery') => {
      void emitPromiseMutationResultHaptic(result, interaction);
      if (result.outcome === 'confirmed') {
        setLeaveRecovery(null);
        setNotice(null);
        setLeaveConfirmationVisible(false);
        router.replace('/(tabs)/groups');
        return;
      }

      setLeaveRecovery(result);
      setNotice({
        title:
          result.outcome === 'unknown'
            ? t('todayProof.promise.result_not_confirmed_title')
            : t('groups.source.accountability.people.leave_failed_title'),
        description: result.message,
        tone: result.outcome === 'unknown' ? 'warning' : 'error',
      });
      setLeaveConfirmationVisible(false);
    },
    [router, t]
  );

  const recoverLeave = React.useCallback(async () => {
    if (!challengeId || !leaveRecovery || leaving) return;
    const clientEventId = leaveRecovery.clientEventId;
    if (!clientEventId) return;
    setLeaving(true);
    try {
      const result =
        leaveRecovery.outcome === 'failed' && leaveRecovery.safeToRetry
          ? await leavePromiseAccountability(challengeId, t, clientEventId)
          : await reconcilePromiseAccountabilityLeave(
              challengeId,
              clientEventId,
              t
            );
      applyLeaveResult(result, 'recovery');
    } catch (error) {
      void error;
      applyLeaveResult(
        unknownPromiseMutation({
          operation: 'leave',
          challengeId,
          clientEventId,
          message: t('todayProof.promise.leave_result_unknown'),
        }),
        'recovery'
      );
    } finally {
      setLeaving(false);
    }
  }, [applyLeaveResult, challengeId, leaveRecovery, leaving, t]);

  const summary = summaryQuery.data;
  const viewerMember = summary?.members.find(
    member => member.id === currentUser?.id
  );
  const replacingCurrentInvite = Boolean(
    summary?.invite && role && role !== summary.invite.role
  );
  const leaveRecoveryAction = leaveRecovery
    ? {
        label:
          leaveRecovery.outcome === 'unknown'
            ? t('todayProof.promise.check_status')
            : leaveRecovery.safeToRetry
              ? t('todayProof.promise.try_again')
              : undefined,
        onPress:
          leaveRecovery.outcome === 'unknown' || leaveRecovery.safeToRetry
            ? () => void recoverLeave()
            : undefined,
      }
    : null;
  const selectedSavedGroup = attachableSavedGroups.find(
    group => group.id === selectedSavedGroupId
  );

  React.useEffect(() => {
    if (
      prepared ||
      !summary?.invite ||
      !summary.group ||
      summary.invite.code === hiddenPreparedCode
    )
      return;
    setRole(summary.invite.role);
    setPrepared({
      challengeId: summary.promise.id,
      challengeTitle: summary.promise.title,
      groupId: summary.group.id,
      groupKind: summary.group.kind,
      code: summary.invite.code,
      role: summary.invite.role,
      shareUrl: buildInviteShareUrl('challenge', summary.invite.code),
    });
  }, [hiddenPreparedCode, prepared, summary]);

  if (!challengeId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorBoundary level="screen">
          <PromisePicker onBack={goBack} source={journeySource} />
        </ErrorBoundary>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ErrorBoundary level="screen">
        <AppScreen
          lane="focused"
          maxWidth={
            Platform.OS === 'ios' && Platform.isPad
              ? journeySource === 'onboarding'
                ? 560
                : 720
              : undefined
          }
          safeArea
          hasTabBar={false}
          contentContainerStyle={styles.inviteScreenContent}
          testID="promise-accountability-screen"
        >
          <ScrollView
            key={prepared ? 'invitation' : 'role-choice'}
            style={styles.inviteScroll}
            contentContainerStyle={styles.screenContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AppTopBar
              title={
                journeySource === 'onboarding' || prepared
                  ? t('groups.source.accountability.invite.screen_title')
                  : t('groups.source.accountability.people.screen_title')
              }
              onBack={
                prepared && journeySource === 'onboarding'
                  ? changeInvitation
                  : goBack
              }
              trailing={
                prepared &&
                journeySource !== 'onboarding' &&
                summaryQuery.data?.canInvite ? (
                  <AppButton
                    title={t('groups.create.change')}
                    onPress={changeInvitation}
                    variant="ghost"
                  />
                ) : undefined
              }
              backLabel={t('groups.source.accountability.common.back')}
            />

            {journeySource === 'onboarding' ? (
              <View
                accessibilityLabel={`Invitation setup, step ${prepared ? 2 : 1} of 2`}
                accessibilityRole="progressbar"
                accessibilityValue={{ max: 2, min: 1, now: prepared ? 2 : 1 }}
                style={styles.onboardingInviteProgress}
              >
                <View style={styles.onboardingInviteProgressActive} />
                <View
                  style={
                    prepared
                      ? styles.onboardingInviteProgressActive
                      : styles.onboardingInviteProgressInactive
                  }
                />
              </View>
            ) : null}

            {summaryQuery.isLoading ? (
              <PromiseAccountabilityLoading />
            ) : summaryQuery.isError || !summary ? (
              <AppInlineNotice
                title={t(
                  'groups.source.accountability.people.load_error_title'
                )}
                description={visibleAccountabilityErrorMessage(
                  summaryQuery.error,
                  t('groups.source.accountability.people.load_error_detail')
                )}
                tone="error"
                actionLabel={t('groups.source.accountability.common.try_again')}
                onAction={() => void summaryQuery.refetch()}
              />
            ) : prepared ? (
              <View style={styles.flowStack}>
                <View style={styles.headingBlock}>
                  <Text accessibilityRole="header" style={styles.heading}>
                    {t('groups.source.accountability.invite.ready_heading')}
                  </Text>
                  <Text style={styles.lead}>
                    {t('groups.source.accountability.invite.private_detail')}
                  </Text>
                </View>

                <PromiseInviteRoleHero
                  compact
                  role={prepared.role}
                  title={accountabilityRoleCopy(prepared.role, t).title}
                  detail={accountabilityOwnerConsequence(prepared.role, t)}
                  testID="accountability-owner-ready-role"
                />

                <PromiseInviteContextLine
                  label={t('groups.source.accountability.invite.label')}
                  promise={summary.promise.title}
                  detail={summary.promise.verificationDescription}
                  testID="accountability-invite-promise"
                />

                {notice ? (
                  <AppInlineNotice
                    title={notice.title}
                    description={notice.description}
                    tone={notice.tone}
                    actionLabel={
                      notice.actionLabel ?? leaveRecoveryAction?.label
                    }
                    onAction={notice.onAction ?? leaveRecoveryAction?.onPress}
                    actionLoading={notice.actionLoading ?? leaving}
                  />
                ) : null}

                <View style={styles.actions}>
                  <AppButton
                    title={t('groups.invite.show_qr')}
                    onPress={() => {
                      trackInviteOnboardingJourney(
                        'invite_ready',
                        'selected',
                        'not_applicable',
                        'show_qr'
                      );
                      setShowOnboardingQr(true);
                    }}
                    fullWidth
                    variant="outline"
                  />
                  <AppButton
                    title={t('groups.source.accountability.invite.copy_action')}
                    onPress={() => void handleCopy()}
                    fullWidth
                    variant="outline"
                  />
                  <AppButton
                    title={t(
                      'groups.source.accountability.invite.today_action'
                    )}
                    onPress={() => {
                      trackInviteOnboardingJourney(
                        'invite_ready',
                        'skipped',
                        'not_applicable',
                        'today'
                      );
                      void goToToday('skipped');
                    }}
                    fullWidth
                    variant="ghost"
                  />
                </View>
              </View>
            ) : journeySource === 'onboarding' ? (
              <View style={styles.flowStack}>
                <View style={styles.headingBlock}>
                  <Text accessibilityRole="header" style={styles.heading}>
                    {t('groups.source.accountability.role.question')}
                  </Text>
                  <Text style={styles.lead}>
                    {t('groups.source.accountability.people.private_detail')}
                  </Text>
                </View>
                <PromiseInviteContextLine
                  label={t('fullAuth.shared.promise')}
                  promise={summary.promise.title}
                  detail={summary.promise.verificationDescription}
                  testID="accountability-promise"
                />
                <View accessibilityRole="radiogroup" style={styles.roleOptions}>
                  {ROLE_OPTIONS.map(option => {
                    const copy = accountabilityRoleCopy(option, t);
                    return (
                      <AppOptionCard
                        key={option}
                        title={copy.title}
                        description={copy.description}
                        selected={role === option}
                        onPress={() => {
                          setRole(option);
                          trackInviteOnboardingJourney(
                            'invite_role',
                            'selected',
                            'not_applicable',
                            option
                          );
                          void emitHaptic({ type: 'selection' });
                        }}
                        icon={
                          option === 'partner' ? (
                            <UsersIcon size={20} color={mentaColors.action} />
                          ) : (
                            <ShieldIcon size={20} color={mentaColors.action} />
                          )
                        }
                        testID={`accountability-role-${option}`}
                      />
                    );
                  })}
                </View>
                {notice ? (
                  <AppInlineNotice
                    title={notice.title}
                    description={notice.description}
                    tone={notice.tone}
                  />
                ) : null}
                <View style={styles.privateNote}>
                  <ShieldIcon size={16} color={mentaColors.text.secondary} />
                  <Text style={styles.privateNoteText}>
                    {t('groups.source.accountability.invite.private_note')}
                  </Text>
                </View>
                <AppButton
                  title={t('groups.source.accountability.invite.today_action')}
                  onPress={() => {
                    trackInviteOnboardingJourney(
                      'invite_role',
                      'skipped',
                      'not_applicable',
                      'today'
                    );
                    void goToToday('skipped');
                  }}
                  fullWidth
                  variant="ghost"
                />
              </View>
            ) : (
              <View style={styles.flowStack}>
                <View style={styles.headingBlock}>
                  <Text accessibilityRole="header" style={styles.heading}>
                    {summary.isShared
                      ? t('groups.source.accountability.people.shared_heading')
                      : t(
                          'groups.source.accountability.people.private_heading'
                        )}
                  </Text>
                  <Text style={styles.lead}>
                    {summary.isShared
                      ? t('groups.source.accountability.people.shared_detail')
                      : t('groups.source.accountability.people.private_detail')}
                  </Text>
                </View>

                <PromiseInviteContextLine
                  label={t('fullAuth.shared.promise')}
                  promise={summary.promise.title}
                  detail={summary.promise.verificationDescription}
                  testID="accountability-promise"
                />

                {summary.members.some(member => member.role !== 'owner') ? (
                  <View style={styles.peopleSection}>
                    <Text style={styles.sectionLabel}>
                      {t('groups.source.accountability.people.label')}
                    </Text>
                    <View style={styles.memberList}>
                      {summary.members
                        .filter(member => member.role !== 'owner')
                        .map(member => (
                          <MemberRow
                            key={member.id}
                            member={member}
                            onPress={
                              summary.canInvite && member.role !== 'owner'
                                ? () => setSelectedMember(member)
                                : undefined
                            }
                          />
                        ))}
                    </View>
                  </View>
                ) : null}

                {notice ? (
                  <AppInlineNotice
                    title={notice.title}
                    description={notice.description}
                    tone={notice.tone}
                    actionLabel={
                      notice.actionLabel ?? leaveRecoveryAction?.label
                    }
                    onAction={notice.onAction ?? leaveRecoveryAction?.onPress}
                    actionLoading={notice.actionLoading ?? leaving}
                    testID="promise-accountability-mutation-notice"
                  />
                ) : null}

                {summary.canInvite ? (
                  <View style={styles.roleSection}>
                    <Text style={styles.sectionTitle}>
                      {t('groups.source.accountability.role.question')}
                    </Text>
                    <View
                      accessibilityRole="radiogroup"
                      style={styles.roleOptions}
                    >
                      {ROLE_OPTIONS.map(option => {
                        const copy = accountabilityRoleCopy(option, t);
                        return (
                          <AppOptionCard
                            key={option}
                            title={copy.title}
                            description={copy.description}
                            selected={role === option}
                            onPress={() => {
                              setRole(option);
                              trackProductEvent('Promise Invite Journey', {
                                action: 'selected',
                                authenticated: true,
                                entry_point: 'owner_role_choice',
                                outcome: 'ready',
                                role: option,
                                stage: 'owner_role',
                              });
                              void emitHaptic({ type: 'selection' });
                            }}
                            icon={
                              option === 'partner' ? (
                                <UsersIcon
                                  size={20}
                                  color={colors.accent.primary}
                                />
                              ) : (
                                <ShieldIcon
                                  size={20}
                                  color={colors.accent.primary}
                                />
                              )
                            }
                            testID={`accountability-role-${option}`}
                          />
                        );
                      })}
                    </View>

                    {viewerMember?.role === 'owner' &&
                    summary.group?.kind !== 'saved' ? (
                      <AppButton
                        title={t(
                          'groups.source.accountability.saved_group_picker.open_action'
                        )}
                        onPress={openSavedGroupPicker}
                        fullWidth
                        size="large"
                        variant="outline"
                        testID="open-saved-group-picker"
                      />
                    ) : null}
                    <View style={styles.privateNote}>
                      <ShieldIcon
                        size={16}
                        color={mentaColors.text.secondary}
                      />
                      <Text style={styles.privateNoteText}>
                        {t('groups.source.accountability.invite.private_note')}
                      </Text>
                    </View>
                  </View>
                ) : viewerMember && viewerMember.role !== 'owner' ? (
                  <View style={styles.roleSection}>
                    {viewerMember.role === 'reviewer' ? (
                      <AppButton
                        title={t(
                          'groups.source.accountability.people.review_proof'
                        )}
                        onPress={() =>
                          router.push({
                            pathname: '/review-queue',
                            params: { challengeId: summary.promise.id },
                          })
                        }
                        fullWidth
                        size="large"
                        variant="accent"
                      />
                    ) : null}
                    <AppButton
                      title={t(
                        'groups.source.accountability.people.see_shared_proof'
                      )}
                      onPress={() =>
                        router.push({
                          pathname: '/challenges/[id]',
                          params: { id: summary.promise.id, tab: 'proof' },
                        } as never)
                      }
                      fullWidth
                      variant="outline"
                    />
                    <AppButton
                      title={t(
                        'groups.source.accountability.people.leave_promise'
                      )}
                      onPress={() => setLeaveConfirmationVisible(true)}
                      fullWidth
                      variant="destructive"
                    />
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
          {summary &&
          !summaryQuery.isLoading &&
          !summaryQuery.isError &&
          (prepared || summary.canInvite) ? (
            <View style={styles.inviteFooter}>
              {!prepared && replacingCurrentInvite ? (
                <AppInlineNotice
                  title={t('groups.invite.replace_question')}
                  description={t('groups.invite.replace_detail')}
                  tone="warning"
                  testID="promise-accountability-replace-warning"
                />
              ) : null}
              <AppButton
                title={
                  prepared
                    ? t('groups.source.accountability.invite.share_action')
                    : role
                      ? accountabilityOwnerInviteAction(role, t)
                      : t('groups.source.accountability.invite.prepare_action')
                }
                onPress={() =>
                  prepared ? void handleShare() : void handlePrepare()
                }
                disabled={!prepared && (!role || preparing)}
                loading={!prepared && preparing}
                preserveLabelPositionOnLoading
                fullWidth
                size="large"
                variant="accent"
                testID={
                  prepared
                    ? 'share-promise-invitation'
                    : 'prepare-promise-invitation'
                }
              />
            </View>
          ) : null}
        </AppScreen>
      </ErrorBoundary>
      <SimpleBottomSheet
        visible={Boolean(prepared) && showOnboardingQr}
        onClose={() => setShowOnboardingQr(false)}
        testID="promise-invitation-qr-sheet"
        scrollableBody={
          prepared ? (
            <View style={styles.inviteQrContent}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                {prepared.challengeTitle}
              </Text>
              <Text style={styles.lead}>
                {accountabilityRoleCopy(prepared.role, t).title}
              </Text>
              <View style={styles.qrShell}>
                <QRCode
                  value={prepared.shareUrl}
                  size={188}
                  quietZone={16}
                  backgroundColor={mentaColors.paper}
                  color={mentaColors.text.onPaper}
                />
              </View>
              <Text style={styles.qrDetail}>
                {t('groups.source.accountability.invite.private_detail')}
              </Text>
            </View>
          ) : null
        }
        footer={
          <AppButton
            title={t('groups.invite.hide_qr')}
            onPress={() => setShowOnboardingQr(false)}
            fullWidth
            variant="outline"
          />
        }
      />
      <SimpleBottomSheet
        visible={savedGroupSheetVisible}
        onClose={() => {
          if (!savedGroupLinkSubmitting) setSavedGroupSheetVisible(false);
        }}
        dismissOnBackdrop={!savedGroupLinkSubmitting}
        maxHeight={570}
        testID="saved-group-picker-sheet"
        scrollableBody={
          <View style={styles.savedGroupPickerBody}>
            <View style={styles.savedGroupPickerHeading}>
              <Text
                accessibilityRole="header"
                style={styles.savedGroupPickerTitle}
              >
                {t('groups.source.accountability.saved_group_picker.title')}
              </Text>
              <Text style={styles.savedGroupPickerDetail}>
                {t('groups.source.accountability.saved_group_picker.detail')}
              </Text>
            </View>

            {savedGroupsLoading ? (
              <View
                accessible
                accessibilityLabel={t(
                  'groups.source.accountability.saved_group_picker.loading'
                )}
                accessibilityRole="progressbar"
                style={styles.savedGroupLoadingList}
                testID="saved-group-picker-loading"
              >
                {[0, 1].map(index => (
                  <View key={index} style={styles.savedGroupLoadingRow}>
                    <SkeletonLoader
                      announce={false}
                      width={56}
                      height={56}
                      borderRadius={mentaRadii.medium}
                    />
                    <View style={styles.savedGroupLoadingCopy}>
                      <SkeletonLoader
                        announce={false}
                        width={156}
                        height={20}
                        borderRadius={mentaRadii.small}
                      />
                      <SkeletonLoader
                        announce={false}
                        width={118}
                        height={14}
                        borderRadius={mentaRadii.small}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : savedGroupsLoadFailed ? (
              <AppInlineNotice
                title={t(
                  'groups.source.accountability.saved_group_picker.load_error_title'
                )}
                description={t(
                  'groups.source.accountability.saved_group_picker.load_error_detail'
                )}
                tone="error"
                actionLabel={t('groups.source.accountability.common.try_again')}
                onAction={() => void loadAttachableSavedGroups()}
                testID="saved-group-picker-load-error"
              />
            ) : attachableSavedGroups.length === 0 ? (
              <AppInlineNotice
                title={t(
                  'groups.source.accountability.saved_group_picker.empty_title'
                )}
                description={t(
                  'groups.source.accountability.saved_group_picker.empty_detail'
                )}
                tone="info"
                testID="saved-group-picker-empty"
              />
            ) : (
              <View
                accessibilityRole="radiogroup"
                style={styles.savedGroupList}
              >
                {attachableSavedGroups.map((group, index) => {
                  const selected = group.id === selectedSavedGroupId;
                  const people =
                    group.memberCount == null
                      ? t(
                          'groups.source.accountability.saved_group_picker.people_unknown'
                        )
                      : t('groups.admin.people_count', {
                          count: group.memberCount,
                        });
                  const privacy =
                    group.privacy === 'public'
                      ? t(
                          'groups.source.accountability.saved_group_picker.public'
                        )
                      : t(
                          'groups.source.accountability.saved_group_picker.private'
                        );

                  return (
                    <Pressable
                      key={group.id}
                      accessibilityHint={t(
                        'groups.source.accountability.saved_group_picker.row_hint'
                      )}
                      accessibilityLabel={t(
                        'groups.source.accountability.saved_group_picker.row_accessibility',
                        { group: group.name, people, privacy }
                      )}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: selected,
                        disabled: savedGroupLinkSubmitting,
                      }}
                      disabled={savedGroupLinkSubmitting}
                      onPress={() => {
                        setSelectedSavedGroupId(group.id);
                        setSavedGroupLinkResult(null);
                      }}
                      style={({ pressed }) => [
                        styles.savedGroupRow,
                        index < attachableSavedGroups.length - 1
                          ? styles.savedGroupRowDivider
                          : null,
                        pressed ? styles.savedGroupRowPressed : null,
                      ]}
                      testID={`saved-group-option-${group.id}`}
                    >
                      <SavedGroupThumbnail group={group} />
                      <View style={styles.savedGroupCopy}>
                        <Text numberOfLines={2} style={styles.savedGroupName}>
                          {group.name}
                        </Text>
                        <Text style={styles.savedGroupMeta}>
                          {t(
                            'groups.source.accountability.saved_group_picker.meta',
                            { people, privacy }
                          )}
                        </Text>
                      </View>
                      <View style={styles.savedGroupRadioTarget}>
                        <View
                          style={[
                            styles.savedGroupRadio,
                            selected ? styles.savedGroupRadioSelected : null,
                          ]}
                        >
                          {selected ? (
                            <CheckIcon size={15} color={mentaColors.canvas} />
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {!savedGroupsLoading && !savedGroupsLoadFailed ? (
              <Pressable
                accessibilityHint={t(
                  'groups.source.accountability.saved_group_picker.create_new_detail'
                )}
                accessibilityLabel={t(
                  'groups.source.accountability.saved_group_picker.create_new_accessibility'
                )}
                accessibilityRole="button"
                accessibilityState={{ disabled: savedGroupLinkSubmitting }}
                disabled={savedGroupLinkSubmitting}
                onPress={() => void createSavedGroupForPromise()}
                style={({ pressed }) => [
                  styles.createSavedGroupRow,
                  pressed ? styles.savedGroupRowPressed : null,
                ]}
                testID="create-saved-group-for-promise"
              >
                <View style={styles.createSavedGroupIcon}>
                  <PlusIcon size={22} color={mentaColors.action} />
                </View>
                <View style={styles.savedGroupCopy}>
                  <Text style={styles.createSavedGroupTitle}>
                    {t(
                      'groups.source.accountability.saved_group_picker.create_new'
                    )}
                  </Text>
                  <Text style={styles.createSavedGroupDetail}>
                    {t(
                      'groups.source.accountability.saved_group_picker.create_new_detail'
                    )}
                  </Text>
                </View>
                <View style={styles.savedGroupRadioTarget}>
                  <ChevronRightIcon size={18} color={mentaColors.action} />
                </View>
              </Pressable>
            ) : null}

            {savedGroupLinkResult?.outcome === 'unknown' ? (
              <AppInlineNotice
                title={t(
                  'groups.source.accountability.saved_group_picker.unknown_title'
                )}
                description={t(
                  'groups.source.accountability.saved_group_picker.unknown_detail'
                )}
                tone="warning"
                testID="saved-group-link-unknown"
              />
            ) : savedGroupLinkResult?.outcome === 'failed' ? (
              <AppInlineNotice
                title={t(
                  'groups.source.accountability.saved_group_picker.failed_title'
                )}
                description={t(
                  'groups.source.accountability.saved_group_picker.failed_detail'
                )}
                tone="error"
                testID="saved-group-link-failed"
              />
            ) : savedGroupCreateHandoffFailed ? (
              <AppInlineNotice
                title={t(
                  'groups.source.accountability.saved_group_picker.create_handoff_failed_title'
                )}
                description={t(
                  'groups.source.accountability.saved_group_picker.create_handoff_failed_detail'
                )}
                tone="error"
                testID="saved-group-create-handoff-failed"
              />
            ) : null}
          </View>
        }
        footer={
          savedGroupLinkResult?.outcome === 'unknown' ? (
            <>
              <AppButton
                title={t(
                  'groups.source.accountability.saved_group_picker.check_again'
                )}
                onPress={() =>
                  void submitSavedGroupLink(savedGroupLinkResult.request)
                }
                loading={savedGroupLinkSubmitting}
                preserveLabelPositionOnLoading
                fullWidth
                size="large"
                variant="accent"
                testID="retry-saved-group-link"
              />
              <AppButton
                title={t(
                  'groups.source.accountability.saved_group_picker.close_for_now'
                )}
                onPress={() => setSavedGroupSheetVisible(false)}
                disabled={savedGroupLinkSubmitting}
                fullWidth
                variant="ghost"
              />
            </>
          ) : savedGroupLinkResult?.outcome === 'failed' ? (
            <>
              <AppButton
                title={t(
                  'groups.source.accountability.saved_group_picker.choose_another'
                )}
                onPress={() => setSavedGroupLinkResult(null)}
                fullWidth
                variant="outline"
              />
              <AppButton
                title={t(
                  'groups.source.accountability.saved_group_picker.not_now'
                )}
                onPress={() => setSavedGroupSheetVisible(false)}
                fullWidth
                variant="ghost"
              />
            </>
          ) : (
            <>
              <AppButton
                title={
                  selectedSavedGroup
                    ? t(
                        'groups.source.accountability.saved_group_picker.continue_with',
                        { group: selectedSavedGroup.name }
                      )
                    : t(
                        'groups.source.accountability.saved_group_picker.choose_group'
                      )
                }
                onPress={() => void submitSavedGroupLink()}
                disabled={
                  !selectedSavedGroup ||
                  savedGroupsLoading ||
                  savedGroupsLoadFailed
                }
                loading={savedGroupLinkSubmitting}
                preserveLabelPositionOnLoading
                fullWidth
                size="large"
                variant="accent"
                testID="confirm-saved-group-link"
              />
              <AppButton
                title={t(
                  'groups.source.accountability.saved_group_picker.not_now'
                )}
                onPress={() => setSavedGroupSheetVisible(false)}
                disabled={savedGroupLinkSubmitting}
                fullWidth
                variant="ghost"
              />
            </>
          )
        }
      />
      <SimpleBottomSheet
        visible={Boolean(selectedMember)}
        onClose={() => {
          if (!managingMember) setSelectedMember(null);
        }}
        dismissOnBackdrop={!managingMember}
        scrollableBody={
          selectedMember ? (
            <View style={styles.manageSheet}>
              <View style={styles.headingBlock}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  {selectedMember.name}
                </Text>
                <Text style={styles.lead}>
                  {t('groups.source.accountability.member.choose_role')}
                </Text>
              </View>
              {ROLE_OPTIONS.map(option => {
                const copy = accountabilityRoleCopy(option, t);
                return (
                  <AppOptionCard
                    key={option}
                    title={copy.title}
                    description={copy.description}
                    selected={selectedMember.role === option}
                    disabled={managingMember}
                    onPress={() =>
                      void updateMemberRole(selectedMember, option)
                    }
                  />
                );
              })}
              <AppButton
                title={t('groups.source.accountability.member.remove_action')}
                onPress={() => {
                  setMemberToRemove(selectedMember);
                  setSelectedMember(null);
                }}
                disabled={managingMember}
                fullWidth
                variant="destructive"
              />
            </View>
          ) : null
        }
      />
      <ConfirmDestructiveSheet
        visible={leaveConfirmationVisible || Boolean(memberToRemove)}
        title={
          memberToRemove
            ? t('groups.source.accountability.member.remove_question', {
                name: memberToRemove.name,
              })
            : t('groups.source.accountability.people.leave_question')
        }
        confirmLabel={
          memberToRemove
            ? t('groups.source.accountability.member.remove_confirm')
            : t('groups.source.accountability.people.leave_confirm')
        }
        nameToType={memberToRemove ? 'REMOVE' : 'LEAVE'}
        description={
          memberToRemove
            ? t('groups.source.accountability.member.remove_detail')
            : t('groups.source.accountability.people.leave_detail')
        }
        loading={leaving || managingMember}
        onClose={() => {
          setLeaveConfirmationVisible(false);
          setMemberToRemove(null);
        }}
        onConfirm={async () => {
          if (memberToRemove) {
            await updateMemberRole(memberToRemove, null);
            return;
          }
          if (leaving) return;
          const promiseId = summary?.promise.id;
          if (!promiseId) return;
          setLeaving(true);
          try {
            const result = await leavePromiseAccountability(
              promiseId,
              t,
              createClientEventId()
            );
            applyLeaveResult(result, 'mutation');
          } catch (error) {
            void error;
            applyLeaveResult(
              unknownPromiseMutation({
                operation: 'leave',
                challengeId: promiseId,
                clientEventId: null,
                message: t('todayProof.promise.leave_result_unknown'),
              }),
              'mutation'
            );
          } finally {
            setLeaving(false);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  inviteScreenContent: { flex: 1 },
  inviteScroll: { flex: 1 },
  inviteFooter: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[3],
    paddingBottom: mentaSpacing[3],
  },
  inviteQrContent: { gap: mentaSpacing[3] },
  qrDetail: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  screenContent: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[10],
    paddingTop: mentaSpacing[3],
  },
  pickerBody: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    justifyContent: 'center',
    paddingBottom: mentaSpacing[8],
  },
  flowStack: { gap: mentaSpacing[6] },
  onboardingInviteProgress: {
    flexDirection: 'row',
    gap: mentaSpacing[2],
    width: '100%',
  },
  onboardingInviteProgressActive: {
    backgroundColor: mentaColors.action,
    borderRadius: mentaRadii.small,
    flex: 1,
    height: 5,
  },
  onboardingInviteProgressInactive: {
    backgroundColor: mentaColors.border,
    borderRadius: mentaRadii.small,
    flex: 1,
    height: 5,
  },
  headingBlock: { gap: mentaSpacing[3] },
  heading: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  lead: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
  },
  accountabilityTransition: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 360,
    paddingBottom: mentaSpacing[10],
  },
  accountabilityTransitionContent: {
    gap: mentaSpacing[3],
    width: '100%',
  },
  accountabilityTransitionEyebrow: {
    color: mentaColors.action,
    ...mentaTypography.labelBold,
  },
  accountabilityTransitionTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.heading,
  },
  accountabilityTransitionDetail: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  loadingStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 44,
  },
  loadingStatusMark: {
    alignItems: 'center',
    backgroundColor: mentaColors.actionSoft,
    borderRadius: mentaRadii.round,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  loadingStatusText: {
    color: mentaColors.text.primary,
    flex: 1,
    ...mentaTypography.bodySmallMedium,
  },
  promiseList: { gap: mentaSpacing[3] },
  promiseChoice: {
    backgroundColor: mentaColors.paper,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    padding: mentaSpacing[4],
    transform: [{ rotate: '-0.18deg' }],
  },
  promiseChoicePressed: {
    backgroundColor: mentaColors.paperPressed,
    transform: [{ rotate: '-0.1deg' }, { scale: 0.995 }],
  },
  promiseChoiceLabel: {
    ...mentaTypography.label,
    color: mentaColors.text.mutedOnPaper,
  },
  promiseChoiceTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
    marginTop: mentaSpacing[2],
  },
  promiseChoiceRule: {
    backgroundColor: mentaColors.actionOnPaper,
    borderRadius: mentaRadii.round,
    height: 3,
    marginTop: mentaSpacing[3],
    width: 64,
  },
  promiseChoiceFooter: {
    alignItems: 'center',
    borderTopColor: mentaColors.borderPaper,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    marginTop: mentaSpacing[4],
    paddingTop: mentaSpacing[3],
  },
  promiseChoicePeopleIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(103, 66, 168, 0.11)',
    borderRadius: mentaRadii.round,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  promiseChoiceDetail: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
    flex: 1,
    minWidth: 0,
  },
  promiseChoiceLoading: {
    backgroundColor: mentaColors.paper,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
    transform: [{ rotate: '-0.18deg' }],
  },
  paperSkeleton: {
    backgroundColor: mentaColors.borderPaper,
  },
  promiseChoiceLoadingRule: {
    backgroundColor: 'rgba(103, 66, 168, 0.46)',
    borderRadius: mentaRadii.round,
    height: 3,
    marginTop: mentaSpacing[1],
    width: 64,
  },
  promiseChoiceLoadingFooter: {
    alignItems: 'center',
    borderTopColor: mentaColors.borderPaper,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    marginTop: mentaSpacing[2],
    paddingTop: mentaSpacing[4],
  },
  promiseChoiceLoadingCopy: {
    flex: 1,
    gap: mentaSpacing[2],
  },
  peopleSection: { gap: mentaSpacing[3] },
  sectionLabel: {
    ...mentaTypography.label,
    color: mentaColors.text.muted,
    letterSpacing: 0.7,
  },
  memberList: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 66,
    paddingVertical: mentaSpacing[3],
  },
  memberRowPressed: { backgroundColor: mentaColors.actionSoft },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  memberAvatarOwner: { backgroundColor: mentaColors.actionSoft },
  memberInitials: {
    ...mentaTypography.label,
    color: mentaColors.text.primary,
  },
  memberCopy: { flex: 1, minWidth: 0 },
  memberName: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  memberDetail: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  memberSuccess: {
    ...mentaTypography.caption,
    color: mentaColors.success,
  },
  memberRole: {
    ...mentaTypography.label,
    color: mentaColors.text.muted,
    maxWidth: 92,
    textAlign: 'right',
  },
  roleSection: { gap: mentaSpacing[4] },
  sectionTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  roleOptions: { gap: mentaSpacing[3] },
  privateNote: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
    justifyContent: 'center',
  },
  privateNoteText: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    flex: 1,
  },
  qrShell: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.large,
    padding: mentaSpacing[5],
  },
  actions: { gap: mentaSpacing[3] },
  manageSheet: { gap: mentaSpacing[3] },
  savedGroupPickerBody: { gap: 18 },
  savedGroupPickerHeading: { gap: mentaSpacing[2] },
  savedGroupPickerTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  savedGroupPickerDetail: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
  },
  savedGroupLoadingList: {
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  savedGroupLoadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: mentaSpacing[3],
  },
  savedGroupLoadingCopy: { flex: 1, gap: mentaSpacing[2] },
  savedGroupList: {
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  savedGroupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: mentaSpacing[3],
  },
  savedGroupRowDivider: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  savedGroupRowPressed: { backgroundColor: mentaColors.actionSoft },
  savedGroupThumbnail: {
    alignItems: 'center',
    backgroundColor: mentaColors.actionSoft,
    borderRadius: mentaRadii.medium,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  savedGroupImage: { height: '100%', width: '100%' },
  savedGroupCopy: { flex: 1, gap: 3, minWidth: 0 },
  savedGroupName: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
    fontSize: 21,
    lineHeight: 26,
  },
  savedGroupMeta: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  savedGroupRadioTarget: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  savedGroupRadio: {
    alignItems: 'center',
    borderColor: mentaColors.action,
    borderRadius: mentaRadii.round,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  savedGroupRadioSelected: { backgroundColor: mentaColors.action },
  createSavedGroupRow: {
    alignItems: 'center',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createSavedGroupIcon: {
    alignItems: 'center',
    backgroundColor: mentaColors.actionSoft,
    borderRadius: mentaRadii.round,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  createSavedGroupTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  createSavedGroupDetail: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
});
