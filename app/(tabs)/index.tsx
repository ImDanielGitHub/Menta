import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { TodayStateCard } from '@/components/loop/TodayStateCard';
import { ProofConnectionMosaic } from '@/components/proof/ProofConnectionMosaic';
import {
  ProofEvidenceViewer,
  type ProofEvidenceRecord,
} from '@/components/challenge/proof-evidence';
import {
  buildInitialServerFacts,
  buildReadyServerFacts,
  markServerFactsFailed,
  markServerFactsRefreshing,
  normalizeObligationProofStatus,
  resolveObligationKey,
} from '@/components/loop/build-daily-loop-facts';
import { mapProofDraftsToOverlays } from '@/components/loop/map-proof-overlays';
import { resolveTodayPresentation } from '@/components/loop/today-copy';
import { sanitizeCorrectionReason } from '@/lib/proof-correction-copy';
import { NotificationBell } from '@/components/home/NotificationBell';
import { PersonalPromisesShortcut } from '@/components/home/PersonalPromisesShortcut';
import { PromisePeopleShortcut } from '@/components/home/PromisePeopleShortcut';
import { AppScreen } from '@/components/ui/AppShell';
import { TAB_BAR_PEEK_CLEARANCE } from '@/components/ui/ScreenWrapper';
import { AppButton } from '@/components/ui/AppButton';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  ChevronRightIcon,
  EyeIcon,
  PlusIcon,
  RefreshCwIcon,
  UsersIcon,
} from '@/components/ui/icons';
import { useUser } from '@/store/selectors';
import { openCreateHub } from '@/lib/navigation/create-entry';
import {
  buildLoopDayContext,
  decodeGroupRiskSnapshot,
  selectDailyLoopState,
  type DailyLoopServerFacts,
  type ObligationProofStatus,
  type ServerGroupRiskFact,
  type ServerReviewFact,
} from '@/lib/loop';
import {
  isMissingTodayHomeRpcError,
  parseStreakOutcomeFact,
  readTodayAccountability,
} from '@/lib/loop/accountability';
import { loadProofDrafts, type ProofDraft } from '@/lib/proof-drafts';
import {
  readTodaySnapshotCache,
  writeTodaySnapshotCache,
} from '@/lib/today-snapshot-cache';
import { useNetworkState } from '@/lib/network';
import { StoreReviewRequestHost } from '@/components/home/StoreReviewRequestHost';
import { FirstMissRecovery } from '@/components/streak/FirstMissRecovery';
import { snoozeCoachMessages } from '@/lib/notifications/revealed-habit';
import { resumeProofSubmission } from '@/lib/services/proof-submission-service';
import { notificationService } from '@/lib/services/notification-service';
import { supabase } from '@/lib/supabase';
import { isGroupMembershipError } from '@/lib/query-retry';
import {
  getTodayPartialDataNotice,
  readOptionalTodayData,
  type TodayOptionalSection,
  withTodayReadTimeout,
} from '@/lib/today-data-read';
import { createTodayRefreshCoordinator } from '@/lib/today-refresh-coordinator';
import { readAcceptedReceipt } from '@/lib/loop/read-accepted-receipt';
import type { ConfirmedReceipt } from '@/lib/loop/types';
import { getPromiseDayNumber } from '@/lib/loop/day-context';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTranslation } from '@/lib/localization';
import { shouldUseIPadTwoColumnLayout } from '@/constants/responsive-layout';
import {
  hasTodaySecondaryContent,
  resolveTodayDashboardLayout,
} from '@/lib/today-dashboard-layout';
import { getAnalyticsWidthBucket } from '@/lib/product-analytics';
import { trackProductEvent } from '@/lib/posthog';
import {
  decodeTodayRecentMedia,
  type TodayRecentProofMedia,
} from '@/lib/today-recent-media';

type UnknownRecord = Record<string, unknown>;

type TodayRuntimeSubmission = {
  id: string;
  obligationKey: string;
  challengeId: string;
  challengeTitle: string;
  verificationType: 'photo' | 'video' | 'text';
  isSolo: boolean;
  groupId?: string;
  groupName?: string;
  dayNumber: number;
  totalDays: number | null;
  streakCount: number | null;
  localDay: string;
  effectiveTimezone: string;
};

type TodaySnapshot = {
  acceptedReceipt?: ConfirmedReceipt | null;
  submissions: TodayRuntimeSubmission[];
  statuses: {
    obligationKey: string;
    challengeId: string;
    groupId: string | null;
    localDay: string;
    effectiveTimezone: string;
    proofStatus: ObligationProofStatus;
    verificationId: string | null;
    correctionReason: string | null;
    streakCount: number | null;
    longestStreak: number | null;
    atRisk?: boolean;
    streakOutcome: 'missed' | 'protected' | null;
    outcomeLocalDay: string | null;
    previousStreak: number | null;
    resultingStreak: number | null;
    freezeUsed?: boolean;
    freezesRemaining: number | null;
    daysSinceAcceptedCheckIn: number | null;
    extensionProofDueAtIso: string | null;
  }[];
  reviews: ServerReviewFact[];
  groupRisks: ServerGroupRiskFact[];
  recentMedia: TodayRecentProofMedia[];
  unavailableSections: TodayOptionalSection[];
};

const TODAY_CORE_READ_TIMEOUT_MS = 10_000;
const TODAY_ENRICHMENT_READ_TIMEOUT_MS = 4_000;
const TODAY_LOCAL_READ_TIMEOUT_MS = 2_000;
const ACTIVE_CHALLENGE_STATUS = 'active' as const;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asRecords = (value: unknown): UnknownRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const asIsoTimestamp = (value: unknown): string | null => {
  const candidate = asString(value);
  return candidate && Number.isFinite(Date.parse(candidate)) ? candidate : null;
};

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value)
    ? value
    : typeof value === 'string' &&
        value.trim() !== '' &&
        Number.isFinite(Number(value))
      ? Number(value)
      : null;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const getDeviceTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const getVerificationType = (
  value: unknown
): TodayRuntimeSubmission['verificationType'] => {
  if (value === 'video' || value === 'text') return value;
  return 'photo';
};

const getSubmissionStatusLabel = (
  status: ObligationProofStatus,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  switch (status) {
    case 'none':
      return t('todayProof.today.status_due');
    case 'pending':
      return t('todayProof.today.status_pending');
    case 'approved':
      return t('todayProof.today.status_approved');
    case 'rejected':
      return t('todayProof.today.status_correction');
  }
};

const buildRuntimeSubmission = (args: {
  challenge: UnknownRecord;
  obligationKey: string;
  localDay: string;
  effectiveTimezone: string;
  groupId?: string | null;
  groupName?: string | null;
  isSolo: boolean;
  streakCount?: number | null;
}): TodayRuntimeSubmission | null => {
  const challengeId = asString(args.challenge.id);
  const challengeTitle = asString(args.challenge.title);
  if (!challengeId || !challengeTitle) return null;

  const status = asString(args.challenge.status);
  if (status && status !== 'active') return null;

  const startDate = asString(args.challenge.start_date);
  const duration = asNumber(args.challenge.duration);
  const dayNumber = getPromiseDayNumber(
    startDate,
    args.localDay,
    args.effectiveTimezone
  );

  if (
    dayNumber !== null &&
    (dayNumber < 1 || (duration && dayNumber > duration))
  ) {
    return null;
  }

  return {
    id: args.obligationKey,
    obligationKey: args.obligationKey,
    challengeId,
    challengeTitle,
    verificationType: getVerificationType(args.challenge.verification_type),
    isSolo: args.isSolo,
    groupId: args.groupId ?? undefined,
    groupName: args.groupName ?? undefined,
    dayNumber: dayNumber ?? 1,
    totalDays: duration,
    streakCount: args.streakCount ?? null,
    localDay: args.localDay,
    effectiveTimezone: args.effectiveTimezone,
  };
};

const decodePendingReviews = (value: unknown): ServerReviewFact[] => {
  const reviews: ServerReviewFact[] = [];
  for (const row of asRecords(value)) {
    const reviewId = asString(row.review_id);
    const challengeId = asString(row.challenge_id);
    if (!reviewId || !challengeId) continue;

    reviews.push({
      reviewId,
      challengeId,
      challengeTitle: asString(row.challenge_title) ?? 'A promise',
      groupId: asString(row.group_id),
      groupName: asString(row.group_name),
      submitterName: asString(row.submitter_name) ?? 'A member',
      submittedAtIso: asString(row.submitted_at) ?? new Date().toISOString(),
    });
  }
  return reviews;
};

const decodeGroupRiskFact = (
  value: unknown,
  group: { id: string; name: string }
): ServerGroupRiskFact | null => {
  const risk = decodeGroupRiskSnapshot(value, group.id);
  if (!risk) return null;
  return {
    groupId: group.id,
    groupName: group.name,
    level: risk.level,
    totalMembers: risk.totalMembers,
    submittedToday: risk.submittedToday,
    pendingSubmissions: risk.pendingSubmissions,
    pendingReviews: risk.pendingReviews,
    endOfDayIso: risk.endOfDayIso,
    secondsRemaining: risk.secondsRemaining,
    missesToBreakStreak: risk.missesToBreakStreak,
  };
};

/**
 * Fetch the authoritative Today obligations, then layer optional review and
 * group-progress details. Optional failures remain visible as unavailable
 * details and never erase the current proof obligations.
 */
const fetchTodaySnapshot = async (args: {
  userId: string;
  timezone: string;
  localDay: string;
  locale: string;
  t: ReturnType<typeof useTranslation>['t'];
}): Promise<TodaySnapshot> => {
  let bundledHome: {
    obligations: UnknownRecord[];
    reviews: unknown;
    groupRisks: unknown;
    recentMedia: unknown;
  } | null = null;

  try {
    const homeRead = await withTodayReadTimeout({
      label: args.t('todayProof.today.loading_home'),
      timeoutMs: TODAY_CORE_READ_TIMEOUT_MS,
      read: async () => {
        const { data, error } = await supabase.rpc('get_today_home_v1', {
          p_timezone: args.timezone,
        });
        if (error) throw error;
        if (!isRecord(data) || !Array.isArray(data.obligations)) {
          throw new Error('Today home readback could not be verified.');
        }
        return data;
      },
    });
    bundledHome = {
      obligations: asRecords(homeRead.obligations),
      reviews: homeRead.reviews,
      groupRisks: homeRead.group_risks,
      recentMedia: homeRead.recent_media,
    };
  } catch (error) {
    if (!isMissingTodayHomeRpcError(error)) {
      console.warn(
        '[Today] Bundled home read failed; using established path',
        error
      );
    }
  }

  const obligationsRead = bundledHome
    ? { rows: bundledHome.obligations, source: 'v2' as const }
    : await withTodayReadTimeout({
        label: args.t('todayProof.today.accountability'),
        timeoutMs: TODAY_CORE_READ_TIMEOUT_MS,
        read: () => readTodayAccountability(args.timezone),
      });

  const groups = new Map<
    string,
    { id: string; name: string; challengeIds: string[] }
  >();
  const submissions: TodayRuntimeSubmission[] = [];
  const statuses: TodaySnapshot['statuses'] = [];

  for (const row of obligationsRead.rows) {
    const challengeId = asString(row.challenge_id);
    const challengeTitle = asString(row.challenge_title);
    if (!challengeId || !challengeTitle) continue;

    const groupId = asString(row.group_id);
    const groupName = asString(row.group_name);
    const localDay = asString(row.local_day) ?? args.localDay;
    const effectiveTimezone =
      obligationsRead.source === 'v2'
        ? (asString(row.effective_timezone) ?? args.timezone)
        : args.timezone;
    const obligationKey = resolveObligationKey({
      obligationKey:
        obligationsRead.source === 'v2' ? asString(row.obligation_key) : null,
      challengeId,
      groupId,
    });
    const submission = buildRuntimeSubmission({
      challenge: {
        id: challengeId,
        title: challengeTitle,
        verification_type: row.verification_type,
        start_date: row.start_date,
        duration: row.duration,
        status: ACTIVE_CHALLENGE_STATUS,
      },
      obligationKey,
      localDay,
      effectiveTimezone,
      groupId,
      groupName,
      isSolo: row.is_solo === true,
      streakCount: asNumber(row.current_streak),
    });
    if (!submission) continue;

    submissions.push(submission);
    const outcome =
      obligationsRead.source === 'v2' ? parseStreakOutcomeFact(row) : null;
    statuses.push({
      obligationKey,
      challengeId,
      groupId,
      localDay,
      effectiveTimezone,
      proofStatus: normalizeObligationProofStatus(row.proof_status),
      verificationId: asString(row.submission_id),
      correctionReason: asString(row.correction_reason),
      streakCount: submission.streakCount,
      longestStreak:
        obligationsRead.source === 'v2' ? asNumber(row.longest_streak) : null,
      atRisk:
        obligationsRead.source === 'v2' ? asBoolean(row.at_risk) : undefined,
      streakOutcome: outcome?.outcome ?? null,
      outcomeLocalDay: outcome?.localDay ?? null,
      previousStreak: outcome?.previousStreak ?? null,
      resultingStreak: outcome?.resultingStreak ?? null,
      freezeUsed: outcome?.freezeUsed,
      freezesRemaining: outcome?.freezesRemaining ?? null,
      daysSinceAcceptedCheckIn:
        obligationsRead.source === 'v2'
          ? asNumber(row.days_since_accepted_check_in)
          : null,
      extensionProofDueAtIso: asIsoTimestamp(row.extension_proof_due_at),
    });

    if (groupId) {
      const group = groups.get(groupId) ?? {
        id: groupId,
        name: groupName ?? 'Group',
        challengeIds: [],
      };
      if (!group.challengeIds.includes(challengeId)) {
        group.challengeIds.push(challengeId);
      }
      groups.set(groupId, group);
    }
  }

  const acceptedReceipt = await withTodayReadTimeout({
    label: 'Confirmed proof',
    timeoutMs: TODAY_CORE_READ_TIMEOUT_MS,
    read: () => readAcceptedReceipt(args.userId, args.localDay),
  });

  if (bundledHome) {
    const reviews = decodePendingReviews(bundledHome.reviews);
    const groupRisks = asRecords(bundledHome.groupRisks).flatMap(row => {
      const groupId = asString(row.group_id);
      if (!groupId) return [];
      const group = groups.get(groupId) ?? {
        id: groupId,
        name: 'Group',
        challengeIds: [],
      };
      const fact = decodeGroupRiskFact(row, group);
      return fact ? [fact] : [];
    });
    return {
      acceptedReceipt,
      submissions,
      statuses,
      reviews,
      groupRisks,
      recentMedia: decodeTodayRecentMedia(bundledHome.recentMedia, args.locale),
      unavailableSections: [],
    };
  }

  const [reviewRead, groupRiskReads] = await Promise.all([
    readOptionalTodayData<ServerReviewFact[]>({
      section: 'reviews',
      timeoutMs: TODAY_ENRICHMENT_READ_TIMEOUT_MS,
      fallback: [],
      read: async () => {
        const { data, error } = await supabase.rpc(
          'get_today_pending_reviews',
          { p_timezone: args.timezone }
        );
        if (error) throw error;
        return decodePendingReviews(data);
      },
    }),
    Promise.all(
      Array.from(groups.values()).map(group =>
        readOptionalTodayData<ServerGroupRiskFact | null>({
          section: 'group-progress',
          timeoutMs: TODAY_ENRICHMENT_READ_TIMEOUT_MS,
          fallback: null,
          read: async () => {
            const { data, error } = await supabase.rpc('get_group_risk_data', {
              p_group_id: group.id,
            });

            // Membership can change between the obligations and group reads.
            // This expected omission does not make the remaining snapshot
            // partial because the group is no longer authorised.
            if (error && isGroupMembershipError(error)) return null;
            if (error) throw error;

            const fact = decodeGroupRiskFact(data, group);
            if (!fact) return null;
            return fact;
          },
        })
      )
    ),
  ]);
  const groupRisks = groupRiskReads.flatMap(result =>
    result.value ? [result.value] : []
  );
  const unavailableSections = [
    reviewRead.unavailableSection,
    ...groupRiskReads.map(result => result.unavailableSection),
  ].filter((section): section is TodayOptionalSection => section !== null);

  return {
    acceptedReceipt,
    submissions,
    statuses,
    reviews: reviewRead.value,
    groupRisks,
    recentMedia: [],
    unavailableSections,
  };
};

function TodayLedgerSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <View
      accessible
      accessibilityLabel={loadingLabel}
      accessibilityRole="progressbar"
      style={styles.ledger}
      testID="today-ledger-loading"
    >
      <View style={styles.ledgerHeader}>
        <SkeletonLoader announce={false} height={16} width={92} />
      </View>
      <View style={styles.ledgerRows}>
        {[0, 1, 2, 3].map(index => (
          <View key={index} style={styles.ledgerRow}>
            <SkeletonLoader
              announce={false}
              borderRadius={mentaRadii.round}
              height={38}
              width={38}
            />
            <View style={styles.rowCopy}>
              <SkeletonLoader
                announce={false}
                height={16}
                width={index % 2 === 0 ? '62%' : '54%'}
              />
              <SkeletonLoader
                announce={false}
                height={12}
                width={index % 2 === 0 ? '78%' : '70%'}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { locale, t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const { height, width } = useWindowDimensions();
  const wideWindowAllowsAdjacentLayout = shouldUseIPadTwoColumnLayout(
    width,
    Platform.OS === 'ios' && Platform.isPad
  );
  const router = useRouter();
  const user = useUser();
  const [firstMissRecoveryVisible, setFirstMissRecoveryVisible] =
    useState(false);
  const ledgerTitleLines = useLargeTypeLineLimit(1);
  const ledgerDetailLines = useLargeTypeLineLimit(1);
  const { isOnline } = useNetworkState();
  const userId =
    typeof user?.id === 'string' && user.id.trim() ? user.id : null;
  const initialFacts = useMemo(() => {
    const nowIso = new Date().toISOString();
    return buildInitialServerFacts({ nowIso, timezone: getDeviceTimezone() });
  }, []);
  const [serverFacts, setServerFacts] =
    useState<DailyLoopServerFacts>(initialFacts);
  const [proofDrafts, setProofDrafts] = useState<ProofDraft[]>([]);
  const [submissions, setSubmissions] = useState<TodayRuntimeSubmission[]>([]);
  const [recentMedia, setRecentMedia] = useState<TodayRecentProofMedia[]>([]);
  const [selectedProof, setSelectedProof] =
    useState<ProofEvidenceRecord | null>(null);
  const [unavailableSections, setUnavailableSections] = useState<
    TodayOptionalSection[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [resumingProof, setResumingProof] = useState(false);
  const [preferredReminderTime, setPreferredReminderTime] = useState<
    string | null
  >(null);
  const mountedRef = useRef(true);
  const activeUserIdRef = useRef<string | null>(userId);
  const refreshCoordinatorRef = useRef(createTodayRefreshCoordinator());
  const initializedUserRef = useRef<string | null | undefined>(undefined);
  const lastLayoutEventRef = useRef<string | null>(null);

  activeUserIdRef.current = userId;

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const refreshToday = useCallback(async () => {
    const requestedUserId = activeUserIdRef.current;
    if (!requestedUserId) return;

    await refreshCoordinatorRef.current.run(requestedUserId, async () => {
      const nowIso = new Date().toISOString();
      const timezone = getDeviceTimezone();

      if (mountedRef.current) {
        setServerFacts(previous => markServerFactsRefreshing(previous));
      }

      try {
        try {
          const drafts = await withTodayReadTimeout({
            label: t('todayProof.today.local_proof_drafts'),
            timeoutMs: TODAY_LOCAL_READ_TIMEOUT_MS,
            read: loadProofDrafts,
          });
          if (
            mountedRef.current &&
            activeUserIdRef.current === requestedUserId
          ) {
            setProofDrafts(drafts);
          }
        } catch (draftError) {
          console.warn(
            '[Today] Could not recover local proof drafts:',
            draftError
          );
        }

        const day = buildLoopDayContext(nowIso, timezone);
        const cached = await readTodaySnapshotCache<TodaySnapshot>(
          requestedUserId,
          day.localDay
        );
        if (
          cached &&
          mountedRef.current &&
          activeUserIdRef.current === requestedUserId
        ) {
          setSubmissions(cached.snapshot.submissions);
          // Signed media is deliberately not restored from AsyncStorage. A
          // fresh session-scoped receipt must re-authorise every mosaic item.
          setRecentMedia([]);
          setUnavailableSections(cached.snapshot.unavailableSections);
          setServerFacts(
            markServerFactsRefreshing(
              buildReadyServerFacts({
                nowIso: cached.savedAtIso,
                acceptedReceipt: cached.snapshot.acceptedReceipt,
                timezone: cached.timezone,
                submissions: cached.snapshot.submissions,
                statuses: cached.snapshot.statuses,
                reviews: cached.snapshot.reviews.map(review => ({
                  id: review.reviewId,
                  challengeId: review.challengeId,
                  challengeTitle: review.challengeTitle,
                  groupId: review.groupId ?? undefined,
                  groupName: review.groupName ?? undefined,
                  submitterName: review.submitterName,
                  submissionDate: review.submittedAtIso,
                })),
                groupRisks: cached.snapshot.groupRisks,
              })
            )
          );
        }

        if (!isOnline) {
          if (
            mountedRef.current &&
            activeUserIdRef.current === requestedUserId
          ) {
            setServerFacts(previous => markServerFactsFailed(previous));
          }
          return;
        }

        const snapshot = await fetchTodaySnapshot({
          userId: requestedUserId,
          timezone: day.timezone,
          localDay: day.localDay,
          locale,
          t,
        });
        const reminderPrefs = await notificationService
          .getUserPreferences(requestedUserId)
          .catch(() => null);

        if (mountedRef.current && activeUserIdRef.current === requestedUserId) {
          setPreferredReminderTime(
            reminderPrefs?.preferred_reminder_time ?? null
          );
          setSubmissions(snapshot.submissions);
          setRecentMedia(snapshot.recentMedia);
          setUnavailableSections(snapshot.unavailableSections);
          setServerFacts(
            buildReadyServerFacts({
              acceptedReceipt: snapshot.acceptedReceipt,
              nowIso,
              timezone: day.timezone,
              submissions: snapshot.submissions,
              statuses: snapshot.statuses,
              reviews: snapshot.reviews.map(review => ({
                id: review.reviewId,
                challengeId: review.challengeId,
                challengeTitle: review.challengeTitle,
                groupId: review.groupId ?? undefined,
                groupName: review.groupName ?? undefined,
                submitterName: review.submitterName,
                submissionDate: review.submittedAtIso,
              })),
              groupRisks: snapshot.groupRisks,
            })
          );
          void writeTodaySnapshotCache({
            userId: requestedUserId,
            localDay: day.localDay,
            timezone: day.timezone,
            savedAtIso: nowIso,
            snapshot: { ...snapshot, recentMedia: [] },
          });
        }
      } catch (error) {
        console.warn('[Today] Could not refresh the daily snapshot:', error);
        if (mountedRef.current && activeUserIdRef.current === requestedUserId) {
          setServerFacts(previous => markServerFactsFailed(previous));
        }
      } finally {
        if (mountedRef.current && activeUserIdRef.current === requestedUserId) {
          setRefreshing(false);
        }
      }
    });
  }, [isOnline, locale, t]);

  useEffect(() => {
    if (initializedUserRef.current === userId) return;

    initializedUserRef.current = userId;
    setProofDrafts([]);
    setSubmissions([]);
    setRecentMedia([]);
    setSelectedProof(null);
    setUnavailableSections([]);
    setServerFacts(
      buildInitialServerFacts({
        nowIso: new Date().toISOString(),
        timezone: getDeviceTimezone(),
      })
    );
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        void refreshToday();
      }
    }, [refreshToday, userId])
  );

  const nowIso = new Date().toISOString();
  const localOverlays = useMemo(
    () =>
      userId
        ? mapProofDraftsToOverlays(proofDrafts, {
            userId,
            fallbackTimezone: serverFacts.timezone,
            fallbackLocalDay: serverFacts.localDay,
          })
        : [],
    [proofDrafts, serverFacts.localDay, serverFacts.timezone, userId]
  );
  const selection = useMemo(
    () =>
      selectDailyLoopState({
        server: serverFacts,
        local: { isOnline, overlays: localOverlays },
        nowIso,
      }),
    [isOnline, localOverlays, nowIso, serverFacts]
  );
  const presentation = useMemo(
    () =>
      resolveTodayPresentation(
        {
          selection,
          obligations: serverFacts.obligations,
          pendingReviews: serverFacts.pendingReviews,
          groupRisks: serverFacts.groupRisks,
          now: new Date(nowIso),
          preferredReminderTime,
          reviewFactsAvailable: !unavailableSections.includes('reviews'),
        },
        { locale }
      ),
    [
      locale,
      nowIso,
      preferredReminderTime,
      selection,
      serverFacts.groupRisks,
      serverFacts.obligations,
      serverFacts.pendingReviews,
      unavailableSections,
    ]
  );
  const storeReviewRequestReady =
    serverFacts.hasServerSnapshot &&
    !refreshing &&
    selection.state !== 'loading';
  const selectedSubmission = useMemo(
    () =>
      submissions.find(
        item =>
          item.challengeId === selection.primaryChallengeId &&
          (selection.primaryGroupId
            ? item.groupId === selection.primaryGroupId
            : !item.groupId)
      ) ?? null,
    [selection.primaryChallengeId, selection.primaryGroupId, submissions]
  );

  const openCreatePromise = useCallback(() => {
    trackProductEvent('Today Action Selected', {
      action: 'create_promise',
      surface: 'primary',
    });
    openCreateHub({
      router,
      source: 'home_quick_action',
      intent: 'create_solo_challenge',
    });
  }, [router]);

  const openNew = useCallback(() => {
    trackProductEvent('Today Action Selected', {
      action: 'create_promise',
      surface: 'supporting',
    });
    openCreateHub({ router, source: 'home_plus' });
  }, [router]);

  const openPromise = useCallback(
    (submission: TodayRuntimeSubmission | null = selectedSubmission) => {
      trackProductEvent('Today Action Selected', {
        action: 'open_promise',
        surface: 'primary',
      });
      if (!submission) {
        if (selection.primaryChallengeId) {
          router.push(`/challenges/${selection.primaryChallengeId}`);
        }
        return;
      }

      if (submission.groupId) {
        router.push(`/groups/${submission.groupId}`);
        return;
      }

      router.push(`/challenges/${submission.challengeId}`);
    },
    [router, selectedSubmission, selection.primaryChallengeId]
  );

  const openProofCapture = useCallback(() => {
    if (!selectedSubmission) {
      openPromise();
      return;
    }

    trackProductEvent('Today Action Selected', {
      action: 'add_proof',
      surface: 'primary',
    });

    const correctionReason = sanitizeCorrectionReason(
      serverFacts.obligations.find(
        item =>
          item.challengeId === selectedSubmission.challengeId &&
          (selectedSubmission.groupId
            ? item.groupId === selectedSubmission.groupId
            : !item.groupId)
      )?.correctionReason
    );

    router.push({
      pathname: '/verification',
      params: {
        challengeId: selectedSubmission.challengeId,
        ...(selectedSubmission.groupId
          ? { groupId: selectedSubmission.groupId }
          : {}),
        verificationType: selectedSubmission.verificationType,
        ...(selectedSubmission.isSolo ? { source: 'solo' } : {}),
        ...(correctionReason ? { correctionReason } : {}),
      },
    });
  }, [openPromise, router, selectedSubmission, serverFacts.obligations]);

  const openPromiseHistory = useCallback(() => {
    const challengeId =
      selectedSubmission?.challengeId ?? selection.primaryChallengeId;
    if (!challengeId) return;

    trackProductEvent('Today Action Selected', {
      action: 'open_history',
      surface: 'secondary',
    });

    router.push({
      pathname: '/challenges/[id]',
      params: { id: challengeId, view: 'history' },
    });
  }, [router, selectedSubmission?.challengeId, selection.primaryChallengeId]);

  const resumeSavedProof = useCallback(async () => {
    const clientEventId = selection.primaryClientEventId;
    if (!clientEventId || resumingProof) return;

    setResumingProof(true);
    try {
      await resumeProofSubmission(clientEventId);
    } catch {
      // The durable proof draft is authoritative. Refreshing Today below shows
      // the confirmed receipt, retry state, or saved local proof in context.
    } finally {
      setResumingProof(false);
      await refreshToday();
    }
  }, [refreshToday, resumingProof, selection.primaryClientEventId]);

  const openReview = useCallback(() => {
    trackProductEvent('Today Action Selected', {
      action: 'open_review',
      surface: 'primary',
    });
    if (selection.primaryGroupId) {
      router.push({
        pathname: '/review-queue',
        params: { groupId: selection.primaryGroupId },
      });
      return;
    }

    router.push('/review-queue');
  }, [router, selection.primaryGroupId]);

  const openGroup = useCallback(() => {
    trackProductEvent('Today Action Selected', {
      action: 'open_group',
      surface: 'primary',
    });
    if (selection.primaryGroupId) {
      router.push(`/groups/${selection.primaryGroupId}`);
      return;
    }

    router.push('/(tabs)/groups');
  }, [router, selection.primaryGroupId]);

  const openGroups = useCallback(() => {
    trackProductEvent('Today Action Selected', {
      action: 'open_groups',
      surface: 'secondary',
    });
    router.push('/(tabs)/groups');
  }, [router]);

  const openPersonalPromises = useCallback(() => {
    trackProductEvent('Today Action Selected', {
      action: 'open_personal_promises',
      surface: 'supporting',
    });
    router.push('/solo-challenges');
  }, [router]);

  const handlePrimaryPress = useCallback(() => {
    switch (selection.primaryAction) {
      case 'wait':
      case 'wait-upload':
        return;
      case 'retry-load':
        trackProductEvent('Today Action Selected', {
          action: 'retry',
          surface: 'primary',
        });
        void refreshToday();
        return;
      case 'create-promise':
        openCreatePromise();
        return;
      case 'resume-local-proof':
        void resumeSavedProof();
        return;
      case 'submit-proof':
      case 'resubmit-proof':
        openProofCapture();
        return;
      case 'view-pending-proof':
        openPromise();
        return;
      case 'open-review':
        openReview();
        return;
      case 'open-group':
        openGroup();
        return;
      case 'none':
        if (selection.state === 'accepted-today') {
          openPromise();
        } else {
          openCreatePromise();
        }
        return;
    }
  }, [
    openCreatePromise,
    openGroup,
    openPromise,
    openProofCapture,
    openReview,
    refreshToday,
    resumeSavedProof,
    selection.primaryAction,
    selection.state,
  ]);

  const handleSecondaryPress = useCallback(() => {
    switch (selection.state) {
      case 'offline-stale':
      case 'load-failed':
        trackProductEvent('Today Action Selected', {
          action: 'retry',
          surface: 'secondary',
        });
        void refreshToday();
        return;
      case 'proof-saved-local':
      case 'proof-due':
      case 'proof-uploading':
      case 'proof-pending-review':
      case 'correction-requested':
        openPromise();
        return;
      case 'streak-broken':
      case 'returning':
        openPromiseHistory();
        return;
      case 'review-required':
        if (selection.primaryGroupId) {
          openGroup();
        } else {
          openReview();
        }
        return;
      case 'group-at-risk':
      case 'no-promises':
      case 'accepted-today':
      case 'all-clear':
        openGroups();
        return;
      case 'loading':
        return;
    }
  }, [
    openGroup,
    openGroups,
    openPromise,
    openPromiseHistory,
    openReview,
    refreshToday,
    selection.primaryGroupId,
    selection.state,
  ]);

  const primaryDisabled =
    selection.primaryAction === 'wait' ||
    selection.primaryAction === 'wait-upload' ||
    resumingProof;
  const obligationStatusByKey = useMemo(
    () =>
      new Map(
        serverFacts.obligations.map(item => [
          item.obligationKey,
          item.proofStatus,
        ])
      ),
    [serverFacts.obligations]
  );
  const primaryReviewChallengeId = useMemo(
    () =>
      serverFacts.pendingReviews.find(
        review => review.reviewId === selection.primaryReviewId
      )?.challengeId ?? null,
    [selection.primaryReviewId, serverFacts.pendingReviews]
  );
  const hiddenPrimaryObligationKey = useMemo(() => {
    const challengeId =
      selection.primaryChallengeId ?? primaryReviewChallengeId;
    if (!challengeId) return null;

    return (
      serverFacts.obligations.find(
        item =>
          item.challengeId === challengeId &&
          (selection.primaryGroupId
            ? item.groupId === selection.primaryGroupId
            : !item.groupId)
      )?.obligationKey ??
      resolveObligationKey({
        challengeId,
        groupId: selection.primaryGroupId,
      })
    );
  }, [
    primaryReviewChallengeId,
    selection.primaryChallengeId,
    selection.primaryGroupId,
    serverFacts.obligations,
  ]);
  const supportingSubmissions = useMemo(
    () =>
      submissions.filter(
        submission => submission.obligationKey !== hiddenPrimaryObligationKey
      ),
    [hiddenPrimaryObligationKey, submissions]
  );
  const supportingReviews = useMemo(
    () =>
      serverFacts.pendingReviews.filter(
        review => review.reviewId !== selection.primaryReviewId
      ),
    [selection.primaryReviewId, serverFacts.pendingReviews]
  );
  const openSupportingReviews = useCallback(() => {
    const groupIds = Array.from(
      new Set(
        supportingReviews
          .map(review => review.groupId)
          .filter((groupId): groupId is string => Boolean(groupId))
      )
    );

    if (groupIds.length === 1) {
      router.push({
        pathname: '/review-queue',
        params: { groupId: groupIds[0] },
      });
      return;
    }

    router.push('/review-queue');
  }, [router, supportingReviews]);
  const supportingGroupRisks = useMemo(
    () =>
      serverFacts.groupRisks.filter(
        group => group.groupId !== selection.primaryGroupId
      ),
    [selection.primaryGroupId, serverFacts.groupRisks]
  );
  const supportingRisk =
    supportingGroupRisks.find(
      group => group.level === 'at_risk' || group.level === 'critical'
    ) ?? null;
  const supportingRiskDetail = supportingRisk
    ? typeof supportingRisk.submittedToday === 'number' &&
      typeof supportingRisk.totalMembers === 'number'
      ? t('todayProof.today.risk_checked', {
          count: supportingRisk.submittedToday,
          total: supportingRisk.totalMembers,
        })
      : typeof supportingRisk.pendingSubmissions === 'number'
        ? t('todayProof.today.risk_due', {
            count: supportingRisk.pendingSubmissions,
          })
        : t('todayProof.today.open_group_due')
    : null;
  const supportingRiskTitle = supportingRisk
    ? typeof supportingRisk.pendingSubmissions === 'number'
      ? t('todayProof.today.risk_title', {
          count: supportingRisk.pendingSubmissions,
          group: supportingRisk.groupName,
        })
      : t('todayProof.today.group_due', { group: supportingRisk.groupName })
    : null;
  const supportingReviewTitle =
    supportingReviews.length === 1
      ? t('todayProof.today.review_one', {
          name: supportingReviews[0].submitterName,
        })
      : t('todayProof.today.review_many', {
          count: supportingReviews.length,
        });
  const supportingReviewDetail =
    supportingReviews.length === 1
      ? (supportingReviews[0].groupName ?? supportingReviews[0].challengeTitle)
      : 'Open the review queue';
  const supportingCount =
    supportingSubmissions.length +
    supportingReviews.length +
    (supportingRisk ? 1 : 0);
  const showSupportingLedger =
    serverFacts.hasServerSnapshot &&
    selection.state !== 'no-promises' &&
    supportingCount > 0;
  const personalSubmissions = useMemo(
    () => submissions.filter(submission => submission.isSolo),
    [submissions]
  );
  const bestPersonalStreak = useMemo(() => {
    const confirmedStreaks = personalSubmissions
      .map(submission => submission.streakCount)
      .filter((streak): streak is number => streak !== null);
    return confirmedStreaks.length > 0 ? Math.max(...confirmedStreaks) : null;
  }, [personalSubmissions]);
  const partialDataNotice = useMemo(
    () => getTodayPartialDataNotice(unavailableSections),
    [unavailableSections]
  );
  const secondaryContent = {
    hasLoadingLedger: presentation.state === 'loading',
    hasPartialDataNotice:
      serverFacts.hasServerSnapshot && Boolean(partialDataNotice),
    hasStaleSnapshotNotice: selection.isStale && serverFacts.hasServerSnapshot,
    hasSupportingLedger: showSupportingLedger,
  };
  const hasSecondaryDashboardContent =
    hasTodaySecondaryContent(secondaryContent);
  const todayDashboardLayout = resolveTodayDashboardLayout({
    wideWindowEligible: wideWindowAllowsAdjacentLayout,
    secondary: secondaryContent,
  });
  const usesAdjacentDashboardLayout = todayDashboardLayout === 'adjacent';
  const mediaVisibilityLabel = useMemo(() => {
    const hasPrivate = recentMedia.some(item => item.visibility === 'only-you');
    const hasShared = recentMedia.some(
      item => item.visibility === 'promise-people'
    );
    if (hasPrivate && hasShared) {
      return t('todayProof.source.accountability.visibility_mixed');
    }
    return hasShared
      ? t('todayProof.source.accountability.shared_with_promise_people')
      : t('todayProof.source.accountability.only_you');
  }, [recentMedia, t]);

  useEffect(() => {
    const deviceClass =
      Platform.OS === 'ios' && Platform.isPad ? 'tablet' : 'phone';
    const layout = usesAdjacentDashboardLayout ? 'two_column' : 'single_column';
    const orientation = width > height ? 'landscape' : 'portrait';
    const widthBucket = getAnalyticsWidthBucket(width);
    const eventKey = `${deviceClass}:${layout}:${orientation}:${widthBucket}`;
    if (lastLayoutEventRef.current === eventKey) return;
    lastLayoutEventRef.current = eventKey;
    trackProductEvent('App Layout Classified', {
      device_class: deviceClass,
      layout,
      orientation,
      width_bucket: widthBucket,
    });
  }, [height, usesAdjacentDashboardLayout, width]);

  return (
    <AppScreen
      lane="working"
      scrollable
      hasTabBar
      padding={false}
      testID="today-screen"
      style={{ backgroundColor: mentaColors.canvas }}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: phoneLayout.screenInset,
          paddingTop: phoneLayout.isShortHeight
            ? mentaSpacing[3]
            : mentaSpacing[6],
        },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void refreshToday();
          }}
          tintColor={mentaColors.text.primary}
        />
      }
    >
      <View style={styles.header} testID="today-header">
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={2}
          style={styles.screenTitle}
          textScale={phoneLayout.textScale}
        >
          {t('term.today')}
        </Text>
        <View style={styles.headerActions}>
          <NotificationBell />
          <AppButton
            accessibilityLabel={t('todayProof.today.create_new')}
            onPress={openNew}
            title={t('todayProof.today.new')}
            size="small"
            variant="primary"
            icon={<PlusIcon color={mentaColors.canvas} size={16} />}
            style={styles.newButton}
            testID="today-new-button"
            textScale={phoneLayout.textScale}
          />
        </View>
      </View>

      <FirstMissRecovery
        key={userId ?? 'signed-out'}
        ready={storeReviewRequestReady}
        onRecovered={refreshToday}
        onVisibilityChange={setFirstMissRecoveryVisible}
      />
      <View
        style={[
          styles.dashboardLayout,
          usesAdjacentDashboardLayout ? styles.dashboardLayoutRegular : null,
        ]}
        testID={
          usesAdjacentDashboardLayout
            ? 'today-ipad-two-column'
            : 'today-stacked-layout'
        }
      >
        <View style={styles.dashboardPrimary}>
          <ErrorBoundary level="component">
            <TodayStateCard
              presentation={presentation}
              textScale={phoneLayout.textScale}
              progress={
                selectedSubmission
                  ? {
                      streakCount: selectedSubmission.streakCount,
                      dayNumber: selectedSubmission.dayNumber,
                      totalDays: selectedSubmission.totalDays,
                    }
                  : null
              }
              onPrimaryPress={handlePrimaryPress}
              onSecondaryPress={
                presentation.secondaryLabel ? handleSecondaryPress : null
              }
              onRemindLater={
                presentation.countdown ? () => snoozeCoachMessages() : null
              }
              primaryDisabled={primaryDisabled}
            />
          </ErrorBoundary>

          {recentMedia.length > 0 ? (
            <ErrorBoundary level="component">
              <ProofConnectionMosaic
                copy={{
                  title: t('todayProof.source.accountability.previous_proof'),
                }}
                items={recentMedia.slice(0, 5)}
                onOpenProof={item => {
                  const proof = item as TodayRecentProofMedia;
                  setSelectedProof({
                    id: proof.id,
                    mediaType: proof.mediaType,
                    mediaUrl: proof.mediaUrl,
                    state: 'approved',
                    submittedLabel: proof.submittedLabel,
                    evidenceTitle:
                      proof.mediaType === 'video'
                        ? t('todayProof.promise.video_proof')
                        : t('todayProof.promise.photo_proof'),
                    contextLabel: proof.challengeTitle,
                    contributorName: proof.contributorName,
                  });
                }}
                showHeader
                testID="today-proof-mosaic"
                visibilityLabel={mediaVisibilityLabel}
              />
            </ErrorBoundary>
          ) : null}

          <ErrorBoundary level="component">
            {selectedSubmission ? (
              <PromisePeopleShortcut
                challengeId={selectedSubmission.challengeId}
                onPress={() =>
                  router.push({
                    pathname: '/promise-accountability',
                    params: {
                      challengeId: selectedSubmission.challengeId,
                      source: 'today',
                    },
                  })
                }
                textScale={phoneLayout.textScale}
              />
            ) : (
              <PersonalPromisesShortcut
                activeCount={
                  serverFacts.hasServerSnapshot
                    ? personalSubmissions.length
                    : null
                }
                bestCurrentStreak={
                  serverFacts.hasServerSnapshot ? bestPersonalStreak : null
                }
                onPress={openPersonalPromises}
                textScale={phoneLayout.textScale}
              />
            )}
          </ErrorBoundary>
        </View>

        {hasSecondaryDashboardContent ? (
          <View
            style={styles.dashboardSecondary}
            testID="today-dashboard-secondary"
          >
            {serverFacts.hasServerSnapshot && partialDataNotice ? (
              <View
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={styles.staleNotice}
              >
                <RefreshCwIcon color={mentaColors.warning} size={16} />
                <Text
                  style={styles.staleNoticeText}
                  textScale={phoneLayout.textScale}
                >
                  {partialDataNotice}
                </Text>
              </View>
            ) : null}

            {selection.isStale && serverFacts.hasServerSnapshot ? (
              <View style={styles.staleNotice}>
                <RefreshCwIcon color={mentaColors.warning} size={16} />
                <Text
                  style={styles.staleNoticeText}
                  textScale={phoneLayout.textScale}
                >
                  {t('todayProof.today.stale_snapshot')}
                </Text>
              </View>
            ) : null}

            <ErrorBoundary level="component">
              {presentation.state === 'loading' ? (
                <TodayLedgerSkeleton
                  loadingLabel={t('todayProof.today.loading_accessibility')}
                />
              ) : showSupportingLedger ? (
                <View style={styles.ledger}>
                  <View style={styles.ledgerHeader}>
                    <Text
                      style={styles.ledgerTitle}
                      textScale={phoneLayout.textScale}
                    >
                      {t('todayProof.today.more')}
                    </Text>
                  </View>

                  {supportingReviews.length > 0 ? (
                    <Pressable
                      accessibilityLabel={t(
                        'todayProof.today.ledger_accessibility',
                        {
                          title: supportingReviewTitle,
                          detail: supportingReviewDetail,
                        }
                      )}
                      accessibilityRole="button"
                      onPress={openSupportingReviews}
                      style={({ pressed }) => [
                        styles.reviewPrompt,
                        pressed
                          ? { backgroundColor: colors.accent.background }
                          : null,
                      ]}
                    >
                      <EyeIcon color={colors.accent.primary} size={18} />
                      <View style={styles.rowCopy}>
                        <Text
                          numberOfLines={ledgerTitleLines}
                          style={styles.reviewPromptTitle}
                          textScale={phoneLayout.textScale}
                        >
                          {supportingReviewTitle}
                        </Text>
                        <Text
                          numberOfLines={ledgerDetailLines}
                          style={styles.reviewPromptDetail}
                          textScale={phoneLayout.textScale}
                        >
                          {supportingReviewDetail}
                        </Text>
                      </View>
                      <ChevronRightIcon
                        color={mentaColors.text.secondary}
                        size={18}
                      />
                    </Pressable>
                  ) : null}

                  {supportingRisk ? (
                    <Pressable
                      accessibilityLabel={t(
                        'todayProof.today.ledger_accessibility',
                        {
                          title: supportingRiskTitle ?? '',
                          detail: supportingRiskDetail ?? '',
                        }
                      )}
                      accessibilityRole="button"
                      onPress={() =>
                        router.push(`/groups/${supportingRisk.groupId}`)
                      }
                      style={({ pressed }) => [
                        styles.riskPrompt,
                        pressed ? styles.rowPressed : null,
                      ]}
                    >
                      <UsersIcon color={mentaColors.warning} size={18} />
                      <View style={styles.rowCopy}>
                        <Text
                          numberOfLines={ledgerTitleLines}
                          style={styles.riskPromptTitle}
                          textScale={phoneLayout.textScale}
                        >
                          {supportingRiskTitle}
                        </Text>
                        <Text
                          numberOfLines={ledgerDetailLines}
                          style={styles.riskPromptText}
                          textScale={phoneLayout.textScale}
                        >
                          {supportingRiskDetail}
                        </Text>
                      </View>
                      <ChevronRightIcon
                        color={mentaColors.text.secondary}
                        size={18}
                      />
                    </Pressable>
                  ) : null}

                  {supportingSubmissions.length > 0 ? (
                    <View style={styles.ledgerRows}>
                      {supportingSubmissions.map(submission => {
                        const proofStatus =
                          obligationStatusByKey.get(submission.obligationKey) ??
                          'none';
                        const dayLabel = submission.totalDays
                          ? `Day ${submission.dayNumber} of ${submission.totalDays}`
                          : `Day ${submission.dayNumber}`;

                        return (
                          <Pressable
                            accessibilityLabel={t(
                              'todayProof.today.submission_accessibility',
                              {
                                promise: submission.challengeTitle,
                                status: getSubmissionStatusLabel(
                                  proofStatus,
                                  t
                                ),
                              }
                            )}
                            accessibilityRole="button"
                            key={submission.id}
                            onPress={() => {
                              if (
                                proofStatus === 'none' ||
                                proofStatus === 'rejected'
                              ) {
                                router.push({
                                  pathname: '/verification',
                                  params: {
                                    challengeId: submission.challengeId,
                                    ...(submission.groupId
                                      ? { groupId: submission.groupId }
                                      : {}),
                                    verificationType:
                                      submission.verificationType,
                                    ...(submission.isSolo
                                      ? { source: 'solo' }
                                      : {}),
                                  },
                                });
                                return;
                              }

                              if (submission.groupId) {
                                router.push(`/groups/${submission.groupId}`);
                                return;
                              }

                              router.push(
                                `/challenges/${submission.challengeId}`
                              );
                            }}
                            style={({ pressed }) => [
                              styles.ledgerRow,
                              pressed ? styles.paperRowPressed : null,
                            ]}
                          >
                            <View style={styles.rowCopy}>
                              <Text
                                numberOfLines={ledgerTitleLines}
                                style={styles.rowTitle}
                                textScale={phoneLayout.textScale}
                              >
                                {submission.challengeTitle}
                              </Text>
                              <Text
                                numberOfLines={ledgerDetailLines}
                                style={styles.rowDetail}
                                textScale={phoneLayout.textScale}
                              >
                                {submission.groupName ?? 'Personal'} ·{' '}
                                {dayLabel}
                              </Text>
                              <Text
                                style={styles.rowStatus}
                                textScale={phoneLayout.textScale}
                              >
                                {proofStatus === 'approved'
                                  ? t('todayProof.promise.done_today')
                                  : getSubmissionStatusLabel(proofStatus, t)}
                              </Text>
                            </View>
                            <ChevronRightIcon
                              color={mentaColors.text.mutedOnPaper}
                              size={18}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ErrorBoundary>
          </View>
        ) : null}
      </View>
      <View
        accessible={false}
        pointerEvents="none"
        style={styles.tabBarScrollSpacer}
        testID="today-tab-scroll-spacer"
      />
      <StoreReviewRequestHost
        ready={storeReviewRequestReady && !firstMissRecoveryVisible}
      />
      <ProofEvidenceViewer
        onClose={() => setSelectedProof(null)}
        proof={selectedProof}
        visible={Boolean(selectedProof)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: mentaSpacing[6],
  },
  dashboardLayout: {
    alignSelf: 'stretch',
    gap: mentaSpacing[5],
    width: '100%',
  },
  dashboardLayoutRegular: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[6],
  },
  dashboardPrimary: {
    flex: 1.25,
    gap: mentaSpacing[5],
    minWidth: 0,
  },
  dashboardSecondary: {
    flex: 0.75,
    gap: mentaSpacing[4],
    minWidth: 0,
  },
  tabBarScrollSpacer: {
    height: TAB_BAR_PEEK_CLEARANCE,
  },
  header: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
    minHeight: mentaSpacing[12],
    width: '100%',
  },
  screenTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexShrink: 0,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  newButton: {
    minHeight: mentaLayout.minimumTouchTarget,
    borderRadius: mentaRadii.round,
    paddingHorizontal: mentaSpacing[4],
  },
  staleNotice: {
    alignItems: 'center',
    backgroundColor: mentaColors.warningSoft,
    borderColor: mentaColors.warningBorder,
    borderRadius: mentaRadii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    padding: mentaSpacing[3],
  },
  staleNoticeText: {
    ...mentaTypography.caption,
    color: mentaColors.text.primary,
    flex: 1,
  },
  welcomeBonusSlot: {
    alignSelf: 'stretch',
    marginTop: -mentaSpacing[2],
    width: '100%',
  },
  ledger: {
    alignSelf: 'stretch',
    marginTop: mentaSpacing[1],
    width: '100%',
  },
  ledgerHeader: {
    paddingBottom: mentaSpacing[3],
  },
  ledgerTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  ledgerRows: {
    gap: mentaSpacing[3],
  },
  ledgerRow: {
    alignItems: 'center',
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.large,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 76,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[5],
  },
  rowPressed: {
    backgroundColor: mentaColors.actionSoft,
  },
  paperRowPressed: {
    backgroundColor: mentaColors.paperPressed,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
  },
  rowDetail: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
    marginTop: mentaSpacing[2],
  },
  rowStatus: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.onPaper,
    marginTop: mentaSpacing[3],
    flexShrink: 1,
    minWidth: 0,
  },
  reviewPrompt: {
    alignItems: 'center',
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 82,
    paddingHorizontal: 0,
    paddingVertical: mentaSpacing[3],
  },
  reviewPromptTitle: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
    minWidth: 0,
  },
  reviewPromptDetail: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: 2,
  },
  riskPrompt: {
    alignItems: 'center',
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 76,
    paddingHorizontal: 0,
    paddingVertical: mentaSpacing[3],
  },
  riskPromptTitle: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
    minWidth: 0,
  },
  riskPromptText: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: 2,
  },
});
