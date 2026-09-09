import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RefreshControl, Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useFocusEffect } from 'expo-router/react-navigation';
import {
  PlusIcon,
  CameraIcon as CameraIcon,
  TypeIcon as TypeIcon,
  ArrowRightIcon as ArrowRightIcon,
  ArrowLeftIcon,
  Grid3x3Icon,
} from '@/components/ui/icons';

import { AppButton, AppScreen, ProgressBar } from '@/components/ui';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { ChallengeSubmissionsModal } from '@/components/challenge/ChallengeSubmissionsModal';
import { useTheme } from '@/constants/ThemeContext';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { resolveFreezesRemaining } from '@/lib/streak/freezes-remaining';
import { showToast } from '@/components/ui/Toast';
import { openCreateSoloChallenge } from '@/lib/navigation/create-entry';
import {
  decodeTodaysSubmissionStatus,
  getLegacyTodayStatus,
  getSoloTodayAction,
  hasAuthoritativeLocalDay,
  type SoloTodayStatus,
} from '@/lib/solo-submission-status';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import {
  PromiseProofWeek,
  SoloChallengesEmptyState,
  SoloChallengesLoadingState,
  type PromiseProofDay,
} from '@/components/challenge/promise-runtime-states';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  IPadTwoPaneWorkspace,
  useIPadPortraitWorkspace,
} from '@/components/ipad/ipad-workspace';
import { resolvePersonalPromiseLifecycle } from '@/lib/promise/personal-promise-overview';
import { useTranslation } from '@/lib/localization';
import { usePhoneLayout } from '@/constants/use-phone-layout';
interface SoloChallenge {
  id: string;
  title: string;
  category?: string | null;
  startDate?: string | null;
  duration?: number | null;
  submissionText?: string | null;
  verificationType?: 'photo' | 'video' | 'text' | string | null;
  currentStreak?: number | null;
  freezesRemaining?: number;
  perfectWeeksCount?: number;
  status?: string | null;
  endDate?: string | null;
  joinedAt?: string | null;
  lifecycle: 'active' | 'past';
}

interface Submission {
  id: string;
  challenge_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submission_date: string;
  local_day?: string | null;
  media_url?: string | null;
  submission_text?: string | null;
}

interface SoloParticipantRow {
  current_streak: number | null;
  joined_at: string | null;
  streak_freezes_remaining: number | null;
  challenges:
    | {
        id: string;
        title: string;
        category: string | null;
        start_date: string | null;
        duration: number | null;
        end_date: string | null;
        status: string | null;
        allow_self_review: boolean | null;
        submission_text: string | null;
        verification_type: SoloChallenge['verificationType'];
      }
    | {
        id: string;
        title: string;
        category: string | null;
        start_date: string | null;
        duration: number | null;
        end_date: string | null;
        status: string | null;
        allow_self_review: boolean | null;
        submission_text: string | null;
        verification_type: SoloChallenge['verificationType'];
      }[]
    | null;
}

type TodayStatus = SoloTodayStatus;

const MAX_RECENT_SUBMISSIONS = 10;

const getDeviceTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export default function SoloChallengesScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user } = useAuthStore();
  const router = useRouter();
  const usesIPadWorkspace = useIPadPortraitWorkspace();
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const hasLoadedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [challenges, setChallenges] = useState<SoloChallenge[]>([]);
  const [submissionsByChallenge, setSubmissionsByChallenge] = useState<
    Record<string, Submission[]>
  >({});
  const [todayStatus, setTodayStatus] = useState<Record<string, TodayStatus>>(
    {}
  );
  const [viewAllFor, setViewAllFor] = useState<{
    id: string;
    title?: string;
  } | null>(null);
  const [viewAllLoading, setViewAllLoading] = useState(false);
  const [viewAllSubs, setViewAllSubs] = useState<Submission[]>([]);

  const fetchSoloChallenges = useCallback(
    async ({ showBlockingLoading = false } = {}) => {
      if (!user?.id) {
        setChallenges([]);
        setSubmissionsByChallenge({});
        setTodayStatus({});
        setRefreshError(null);
        hasLoadedRef.current = true;
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showBlockingLoading || !hasLoadedRef.current) {
        setLoading(true);
      }

      try {
        const { data: rows, error } = await supabase
          .from('challenge_participants')
          .select(
            `
          current_streak, joined_at, streak_freezes_remaining,
          challenges!inner(
            id, title, category, start_date, end_date, duration, status, allow_self_review, submission_text, verification_type
          )
        `
          )
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false });

        if (error) throw error;

        const solo = ((rows || []) as SoloParticipantRow[])
          .filter(row => {
            const challenge = Array.isArray(row.challenges)
              ? row.challenges[0]
              : row.challenges;
            return challenge?.allow_self_review;
          })
          .map(row => {
            const challenge = Array.isArray(row.challenges)
              ? row.challenges[0]
              : row.challenges;
            if (!challenge) {
              throw new Error('Solo challenge row missing challenge data');
            }

            const lifecycle = resolvePersonalPromiseLifecycle({
              status: challenge.status,
              startDate: challenge.start_date,
              endDate: challenge.end_date,
              duration: challenge.duration,
            });

            return {
              id: challenge.id,
              title: challenge.title,
              category: challenge.category,
              startDate: challenge.start_date,
              duration: challenge.duration,
              submissionText: challenge.submission_text,
              verificationType: challenge.verification_type,
              currentStreak: row.current_streak ?? 0,
              freezesRemaining: resolveFreezesRemaining(
                row.streak_freezes_remaining
              ),
              perfectWeeksCount: 0,
              status: challenge.status,
              endDate: challenge.end_date,
              joinedAt: row.joined_at,
              lifecycle,
            };
          }) as SoloChallenge[];

        const ids = solo.map(challenge => challenge.id);
        let groupedSubs: Record<string, Submission[]> = {};

        if (ids.length > 0) {
          const { data: subs, error: subsError } = await supabase
            .from('challenge_submissions')
            .select(
              'id, challenge_id, status, submission_date, local_day, media_url, submission_text'
            )
            .eq('user_id', user.id)
            .in('challenge_id', ids)
            .order('submission_date', { ascending: false })
            .limit(200);

          if (subsError) throw subsError;

          groupedSubs = ((subs || []) as Submission[]).reduce<
            Record<string, Submission[]>
          >((acc, submission) => {
            const key = submission.challenge_id;
            const list = acc[key] || [];
            list.push(submission);
            acc[key] = list.sort(
              (a, b) =>
                new Date(b.submission_date).getTime() -
                new Date(a.submission_date).getTime()
            );
            return acc;
          }, {});
        }

        const timezone = getDeviceTimezone();
        const todayStatusEntries = await Promise.all(
          solo.map(async challenge => {
            const challengeSubmissions = groupedSubs[challenge.id] || [];
            if (challenge.lifecycle === 'past') {
              return [challenge.id, 'none'] as const;
            }
            const canUseLegacyFallback =
              challengeSubmissions.length > 0 &&
              !hasAuthoritativeLocalDay(challengeSubmissions);
            const { data, error: statusError } = await supabase.rpc(
              'get_todays_submission_status',
              {
                p_challenge_id: challenge.id,
                p_user_id: user.id,
                p_tz: timezone,
              }
            );

            if (statusError) {
              if (canUseLegacyFallback) {
                return [
                  challenge.id,
                  getLegacyTodayStatus(challengeSubmissions, { timezone }),
                ] as const;
              }
              throw statusError;
            }

            const serverStatus = decodeTodaysSubmissionStatus(data);
            if (serverStatus !== null) {
              return [challenge.id, serverStatus] as const;
            }

            if (canUseLegacyFallback) {
              return [
                challenge.id,
                getLegacyTodayStatus(challengeSubmissions, { timezone }),
              ] as const;
            }

            throw new Error(
              'Solo status response was incomplete for the server local day'
            );
          })
        );
        const todaysStatuses = Object.fromEntries(todayStatusEntries) as Record<
          string,
          TodayStatus
        >;

        setChallenges(solo);
        setSubmissionsByChallenge(groupedSubs);
        setTodayStatus(todaysStatuses);
        setRefreshError(null);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('[solo-challenges] Failed to load data', err);
        setRefreshError(t('sourceGate.solo.refreshBanner'));
        showToast.error(
          t('sourceGate.solo.refreshTitle'),
          t('sourceGate.solo.refreshDetail')
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t, user?.id]
  );

  useEffect(() => {
    fetchSoloChallenges({ showBlockingLoading: true });
  }, [fetchSoloChallenges]);

  useFocusEffect(
    useCallback(() => {
      fetchSoloChallenges({ showBlockingLoading: !hasLoadedRef.current });
    }, [fetchSoloChallenges])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSoloChallenges({ showBlockingLoading: false });
  }, [fetchSoloChallenges]);

  const openViewAll = useCallback(
    async (challenge: SoloChallenge) => {
      if (!user?.id) return;
      setViewAllFor({ id: challenge.id, title: challenge.title });
      setViewAllSubs(submissionsByChallenge[challenge.id] || []);
      setViewAllLoading(true);
      try {
        const { data, error } = await supabase
          .from('challenge_submissions')
          .select(
            'id, challenge_id, status, submission_date, local_day, media_url, submission_text'
          )
          .eq('user_id', user.id)
          .eq('challenge_id', challenge.id)
          .order('submission_date', { ascending: false });

        if (!error && data) {
          setViewAllSubs((data as Submission[]) || []);
        }
      } catch (err) {
        console.error('[solo-challenges] Failed to fetch submissions', err);
      } finally {
        setViewAllLoading(false);
      }
    },
    [submissionsByChallenge, user?.id]
  );

  const activeChallenges = useMemo(
    () => challenges.filter(challenge => challenge.lifecycle === 'active'),
    [challenges]
  );
  const pastChallenges = useMemo(
    () => challenges.filter(challenge => challenge.lifecycle === 'past'),
    [challenges]
  );
  const visibleChallenges =
    tab === 'active' ? activeChallenges : pastChallenges;
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!usesIPadWorkspace) return;
    if (
      selectedChallengeId &&
      visibleChallenges.some(challenge => challenge.id === selectedChallengeId)
    ) {
      return;
    }
    setSelectedChallengeId(visibleChallenges[0]?.id ?? null);
  }, [selectedChallengeId, usesIPadWorkspace, visibleChallenges]);

  const openPromiseDetail = useCallback(
    (challengeId: string) =>
      router.push({
        pathname: '/challenges/[id]',
        params: { id: challengeId },
      }),
    [router]
  );

  const openPromisePrimary = useCallback(
    (challenge: SoloChallenge) => {
      if (challenge.lifecycle === 'past') {
        openPromiseDetail(challenge.id);
        return;
      }

      const status = todayStatus[challenge.id] ?? 'none';
      if (getSoloTodayAction(status) === 'view-details') {
        openPromiseDetail(challenge.id);
        return;
      }

      if (
        challenge.verificationType === 'photo' ||
        challenge.verificationType === 'video' ||
        challenge.verificationType === 'text'
      ) {
        router.push({
          pathname: '/verification',
          params: {
            challengeId: challenge.id,
            verificationType: challenge.verificationType,
            suggestedVerificationType: challenge.verificationType,
            source: 'solo',
          },
        });
        return;
      }

      openPromiseDetail(challenge.id);
    },
    [openPromiseDetail, router, todayStatus]
  );

  const renderPromiseList = (list: SoloChallenge[]) => {
    if (refreshError && list.length === 0) {
      return (
        <View style={styles.emptyBlock(spacing)}>
          <AppInlineNotice
            tone="error"
            title={t('todayProof.solo.load_failed')}
            description={refreshError}
            actionLabel={t('todayProof.promise.try_again')}
            onAction={onRefresh}
            actionLoading={refreshing}
            testID="solo-load-error-notice"
          />
        </View>
      );
    }

    if (list.length === 0) {
      return (
        <View style={styles.emptyBlock(spacing)}>
          <AppInlineNotice
            title={
              tab === 'active'
                ? t('todayProof.solo.no_active')
                : t('todayProof.solo.no_past')
            }
            description={
              tab === 'active'
                ? pastChallenges.length > 0
                  ? t('todayProof.solo.completed_under_past')
                  : t('todayProof.solo.create_private')
                : t('todayProof.solo.ended')
            }
            tone="info"
            testID={`solo-${tab}-empty-notice`}
          />
          {tab === 'active' ? (
            <AppButton
              title={
                pastChallenges.length > 0
                  ? t('todayProof.solo.view_past')
                  : t('todayProof.solo.create')
              }
              onPress={() =>
                pastChallenges.length > 0
                  ? setTab('past')
                  : openCreateSoloChallenge({
                      router,
                      source: 'solo_screen',
                    })
              }
              fullWidth
            />
          ) : null}
        </View>
      );
    }

    return (
      <View style={{ width: '100%', gap: spacing.md }}>
        {list.map(challenge => (
          <SoloChallengeCard
            key={challenge.id}
            challenge={challenge}
            compact={usesIPadWorkspace}
            selected={selectedChallengeId === challenge.id}
            onPrimary={() => openPromisePrimary(challenge)}
            onDetails={() =>
              usesIPadWorkspace
                ? setSelectedChallengeId(challenge.id)
                : openPromiseDetail(challenge.id)
            }
            onViewSubmissions={() => openViewAll(challenge)}
            todayStatus={todayStatus[challenge.id] ?? 'none'}
            submissions={(submissionsByChallenge[challenge.id] || []).slice(
              0,
              MAX_RECENT_SUBMISSIONS
            )}
          />
        ))}
      </View>
    );
  };

  const selectedChallenge =
    visibleChallenges.find(challenge => challenge.id === selectedChallengeId) ??
    visibleChallenges[0] ??
    null;

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SoloChallengesLoadingState
          onBack={() => backOrReplace(router, '/(tabs)/create')}
        />
      </>
    );
  }

  if (!refreshError && challenges.length === 0 && tab === 'active') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SoloChallengesEmptyState
          onCreateSolo={() =>
            openCreateSoloChallenge({ router, source: 'solo_screen' })
          }
          onViewHistory={() => setTab('past')}
          onCreateChallenge={() => router.push('/(tabs)/create')}
          onBackToCreation={() => router.replace('/(tabs)/create')}
          onBack={() => backOrReplace(router, '/(tabs)/create')}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen
        lane="immersive"
        safeArea
        scrollable
        hasTabBar={false}
        style={{ backgroundColor: colors.background.primary }}
        contentContainerStyle={styles.screenContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={mentaColors.text.primary}
          />
        }
        testID="solo-challenges-active-history"
      >
        <View
          style={[
            styles.contentFlow,
            {
              paddingTop: phoneLayout.isShortHeight
                ? mentaSpacing[2]
                : mentaSpacing[3],
            },
          ]}
          testID="personal-promises-content"
        >
          <View
            style={styles.headerCluster}
            testID="personal-promises-header-cluster"
          >
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('todayProof.solo.back')}
                hitSlop={10}
                onPress={() => backOrReplace(router, '/(tabs)/create')}
                style={({ pressed }) => [
                  styles.iconButton(colors),
                  pressed && styles.pressed,
                ]}
              >
                <ArrowLeftIcon size={21} color={colors.text.primary} />
              </Pressable>
              <View style={styles.topBarActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('todayProof.solo.items')}
                  accessibilityHint={t('todayProof.solo.items_hint')}
                  hitSlop={8}
                  onPress={() => router.push('/inventory')}
                  style={({ pressed }) => [
                    styles.iconButton(colors),
                    pressed && styles.pressed,
                  ]}
                >
                  <Grid3x3Icon size={21} color={colors.text.primary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('todayProof.solo.create_personal')}
                  hitSlop={8}
                  onPress={() =>
                    openCreateSoloChallenge({
                      router,
                      source: 'solo_screen',
                    })
                  }
                  style={({ pressed }) => [
                    styles.iconButton(colors),
                    pressed && styles.pressed,
                  ]}
                >
                  <PlusIcon size={21} color={colors.text.primary} />
                </Pressable>
              </View>
            </View>
            <View style={styles.intro}>
              <Text
                accessibilityRole="header"
                style={{
                  ...mentaTypography.title,
                  color: mentaColors.text.primary,
                }}
              >
                {t('todayProof.solo.heading')}
              </Text>
              <Text
                style={{ ...typography.body, color: colors.text.secondary }}
              >
                {t('todayProof.solo.detail')}
              </Text>
            </View>
          </View>

          {!loading && refreshError && activeChallenges.length > 0 ? (
            <AppInlineNotice
              tone="warning"
              title={t('todayProof.solo.showing_last_update')}
              description={t('todayProof.today.last_update_detail')}
              actionLabel={t('todayProof.promise.try_again')}
              onAction={onRefresh}
              actionLoading={refreshing}
              testID="solo-refresh-stale-notice"
              style={styles.refreshNotice}
            />
          ) : null}

          <View style={styles.tabRow(colors)} testID="personal-promises-tabs">
            {(['active', 'past'] as const).map(value => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === value }}
                onPress={() => setTab(value)}
                style={({ pressed }) => [
                  styles.tabAction,
                  tab === value && {
                    borderBottomColor:
                      colors.border.focus ?? colors.interactive.primary,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color:
                      tab === value
                        ? colors.text.primary
                        : colors.text.secondary,
                  }}
                >
                  {value === 'active'
                    ? t('todayProof.solo.active_count', {
                        count: activeChallenges.length,
                      })
                    : t('todayProof.solo.past_count', {
                        count: pastChallenges.length,
                      })}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            style={styles.promiseListSection}
            testID="personal-promises-list"
          >
            <IPadTwoPaneWorkspace
              enabled={usesIPadWorkspace && Boolean(selectedChallenge)}
              primary={renderPromiseList(visibleChallenges)}
              secondary={
                selectedChallenge ? (
                  <SelectedPromisePane
                    challenge={selectedChallenge}
                    submissions={
                      submissionsByChallenge[selectedChallenge.id] || []
                    }
                    todayStatus={todayStatus[selectedChallenge.id] ?? 'none'}
                    onOpen={() => openPromiseDetail(selectedChallenge.id)}
                    onPrimary={() => openPromisePrimary(selectedChallenge)}
                    onProofHistory={() => openViewAll(selectedChallenge)}
                  />
                ) : null
              }
              testID="personal-promises-ipad-workspace"
            />
          </View>
        </View>
      </AppScreen>

      <ChallengeSubmissionsModal
        visible={!!viewAllFor}
        onClose={() => setViewAllFor(null)}
        title={viewAllFor?.title}
        submissions={viewAllSubs}
        loading={viewAllLoading}
      />
    </>
  );
}

interface SoloChallengeCardProps {
  challenge: SoloChallenge;
  todayStatus: TodayStatus;
  submissions: Submission[];
  compact?: boolean;
  selected?: boolean;
  onPrimary: () => void;
  onDetails: () => void;
  onViewSubmissions: () => void;
}

export const SoloChallengeCard: React.FC<SoloChallengeCardProps> = ({
  challenge,
  todayStatus,
  submissions,
  compact = false,
  selected = false,
  onPrimary,
  onDetails,
  onViewSubmissions,
}) => {
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const primaryAction = getSoloTodayAction(todayStatus);

  const progress = useMemo(() => {
    if (!challenge.duration || !challenge.currentStreak) return 0;
    const ratio = Math.min(challenge.currentStreak / challenge.duration, 1);
    return Math.round(ratio * 100);
  }, [challenge.currentStreak, challenge.duration]);

  const freezesRemaining = resolveFreezesRemaining(challenge.freezesRemaining);
  const proofType = getProofTypeLabel(challenge.verificationType, t);
  const proofWeek = buildOverviewProofWeek({
    submissions,
    todayStatus,
    lifecycle: challenge.lifecycle,
  });

  return (
    <View
      testID={`personal-promise-card-${challenge.id}`}
      style={[
        styles.challengeCard(colors),
        selected ? styles.challengeCardSelected(colors) : null,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('todayProof.solo.open_accessibility', {
          promise: challenge.title,
        })}
        accessibilityHint={t('todayProof.solo.open_hint')}
        onPress={onDetails}
        style={({ pressed }) => [
          styles.challengeTitleRow,
          pressed && styles.pressed,
        ]}
      >
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <Text
            style={{
              ...mentaTypography.bodySemibold,
              color: colors.text.primary,
            }}
            numberOfLines={2}
          >
            {challenge.title}
          </Text>
          <Text
            style={{ ...typography.caption, color: colors.text.secondary }}
            numberOfLines={2}
          >
            {t('todayProof.solo.promise_meta', {
              days: challenge.duration || 30,
              proof: proofType,
            })}
          </Text>
        </View>
        <ArrowRightIcon size={18} color={colors.text.secondary} />
      </Pressable>

      <View style={styles.challengeStatusRow}>
        {challenge.lifecycle === 'past' ? (
          <Text style={{ ...typography.caption, color: mentaColors.success }}>
            {challenge.status === 'completed'
              ? t('todayProof.solo.completed')
              : t('todayProof.solo.past')}
          </Text>
        ) : (
          <StatusLabel status={todayStatus} />
        )}
        <Text style={{ ...typography.caption, color: colors.text.secondary }}>
          {challenge.currentStreak
            ? t('todayProof.solo.streak', { count: challenge.currentStreak })
            : t('todayProof.solo.no_streak')}
          {' · '}
          {t('todayProof.solo.freezes_left', {
            count: Math.max(0, freezesRemaining),
          })}
        </Text>
      </View>

      {progress > 0 ? (
        <ProgressBar progress={progress} size="xs" showPercentage />
      ) : null}

      <PromiseProofWeek
        week={proofWeek}
        label={t('todayProof.solo.recent_proof')}
      />

      {!compact ? (
        <View style={styles.promiseCardActions}>
          <AppButton
            title={
              challenge.lifecycle === 'past'
                ? t('todayProof.solo.view_promise')
                : primaryAction === 'submit'
                  ? challenge.verificationType === 'text'
                    ? t('todayProof.solo.log_entry')
                    : t('todayProof.solo.check_in')
                  : todayStatus === 'rejected'
                    ? t('todayProof.solo.view_correction')
                    : t('todayProof.solo.view_today_proof')
            }
            onPress={onPrimary}
            variant={
              challenge.lifecycle === 'active' && primaryAction === 'submit'
                ? 'accent'
                : 'primary'
            }
            fullWidth
            icon={
              challenge.lifecycle === 'active' && primaryAction === 'submit' ? (
                challenge.verificationType === 'text' ? (
                  <TypeIcon size={18} color={colors.background.primary} />
                ) : (
                  <CameraIcon size={18} color={colors.background.primary} />
                )
              ) : undefined
            }
          />
          {submissions.length > 0 ? (
            <AppButton
              title={t('todayProof.solo.proof_history')}
              onPress={onViewSubmissions}
              variant="ghost"
              fullWidth
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const getProofTypeLabel = (
  verificationType: SoloChallenge['verificationType'],
  t: ReturnType<typeof useTranslation>['t']
): string =>
  verificationType === 'text'
    ? t('todayProof.solo.text_proof')
    : verificationType === 'video'
      ? t('todayProof.solo.video_proof')
      : t('todayProof.solo.photo_proof');

const buildOverviewProofWeek = ({
  submissions,
  todayStatus,
  lifecycle,
}: {
  submissions: readonly Submission[];
  todayStatus: TodayStatus;
  lifecycle: SoloChallenge['lifecycle'];
}): PromiseProofDay[] => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));
    const localDay = format(date, 'yyyy-MM-dd');
    const submission = submissions.find(item => {
      if (item.local_day) return item.local_day === localDay;
      return format(parseISO(item.submission_date), 'yyyy-MM-dd') === localDay;
    });

    let state: PromiseProofDay['state'] = index === 6 ? 'today' : 'past';
    if (lifecycle === 'past' && !submission) state = 'inactive';
    if (submission?.status === 'approved') state = 'approved';
    if (submission?.status === 'pending') state = 'waiting';
    if (submission?.status === 'rejected') state = 'needs-retry';
    if (index === 6 && !submission && lifecycle === 'active') {
      state =
        todayStatus === 'approved'
          ? 'approved'
          : todayStatus === 'pending'
            ? 'waiting'
            : todayStatus === 'rejected'
              ? 'needs-retry'
              : 'today';
    }

    return { label: format(date, 'EEEEE'), state };
  });
};

type SelectedPromisePaneProps = {
  challenge: SoloChallenge;
  todayStatus: TodayStatus;
  submissions: Submission[];
  onOpen: () => void;
  onPrimary: () => void;
  onProofHistory: () => void;
};

const SelectedPromisePane = ({
  challenge,
  todayStatus,
  submissions,
  onOpen,
  onPrimary,
  onProofHistory,
}: SelectedPromisePaneProps) => {
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const progress =
    challenge.duration && challenge.currentStreak
      ? Math.min(
          100,
          Math.round((challenge.currentStreak / challenge.duration) * 100)
        )
      : 0;
  const primaryAction = getSoloTodayAction(todayStatus);

  return (
    <View style={styles.selectedPane} testID="personal-promise-selected-pane">
      <Text style={{ ...typography.caption, color: colors.text.secondary }}>
        {t('todayProof.solo.selected_promise')}
      </Text>
      <Text accessibilityRole="header" style={styles.selectedPaneTitle}>
        {challenge.title}
      </Text>
      {challenge.lifecycle === 'active' ? (
        <StatusLabel status={todayStatus} />
      ) : (
        <Text style={{ ...typography.caption, color: mentaColors.success }}>
          {challenge.status === 'completed'
            ? t('todayProof.solo.completed')
            : t('todayProof.solo.past_promise')}
        </Text>
      )}
      <View style={{ gap: spacing.xs }}>
        <Text style={{ ...typography.caption, color: colors.text.secondary }}>
          {t('todayProof.solo.promise_meta_short', {
            days: challenge.duration || 30,
            proof: getProofTypeLabel(challenge.verificationType, t),
          })}
        </Text>
        <Text style={{ ...typography.caption, color: colors.text.secondary }}>
          {challenge.currentStreak
            ? t('todayProof.solo.current_streak', {
                count: challenge.currentStreak,
              })
            : t('todayProof.solo.no_current_streak')}
        </Text>
      </View>
      {progress > 0 ? (
        <ProgressBar progress={progress} size="sm" showPercentage />
      ) : null}
      <PromiseProofWeek
        week={buildOverviewProofWeek({
          submissions,
          todayStatus,
          lifecycle: challenge.lifecycle,
        })}
        label={t('todayProof.solo.recent_proof')}
      />
      <View style={styles.selectedPaneActions}>
        <AppButton
          title={
            challenge.lifecycle === 'past'
              ? t('todayProof.solo.open_promise')
              : primaryAction === 'submit'
                ? challenge.verificationType === 'text'
                  ? t('todayProof.solo.log_entry')
                  : t('todayProof.solo.check_in')
                : t('todayProof.solo.view_today_proof')
          }
          onPress={onPrimary}
          variant={
            challenge.lifecycle === 'active' && primaryAction === 'submit'
              ? 'accent'
              : 'primary'
          }
          fullWidth
        />
        <AppButton
          title={t('todayProof.solo.open_full_promise')}
          onPress={onOpen}
          variant="secondary"
          fullWidth
        />
        {submissions.length > 0 ? (
          <AppButton
            title={t('todayProof.solo.proof_history')}
            onPress={onProofHistory}
            variant="ghost"
            fullWidth
          />
        ) : null}
      </View>
    </View>
  );
};

const StatusLabel: React.FC<{ status: TodayStatus }> = ({ status }) => {
  const { typography } = useTheme();
  const { t } = useTranslation();

  const mapping: Record<TodayStatus, { label: string; color: string }> = {
    none: { label: t('todayProof.solo.due_today'), color: mentaColors.warning },
    pending: {
      label: t('todayProof.solo.waiting_review'),
      color: mentaColors.warning,
    },
    approved: {
      label: t('todayProof.solo.accepted'),
      color: mentaColors.success,
    },
    rejected: {
      label: t('todayProof.solo.needs_retry'),
      color: mentaColors.danger,
    },
  } as const;

  const token = mapping[status];

  return (
    <Text
      style={{ ...typography.caption, color: token.color, fontWeight: '600' }}
    >
      {token.label}
    </Text>
  );
};

type ThemeTokens = ReturnType<typeof useTheme>;

const styles = {
  pressed: { opacity: 0.72 },
  screenContent: {
    gap: 0,
  },
  contentFlow: {
    width: '100%' as const,
  },
  headerCluster: {
    gap: mentaSpacing[5],
    marginBottom: mentaSpacing[6],
  },
  intro: {
    gap: mentaSpacing[2],
  },
  topBar: {
    minHeight: 48,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  topBarActions: {
    flexDirection: 'row' as const,
    gap: mentaSpacing[2],
  },
  iconButton: (colors: ThemeTokens['colors']) => ({
    width: 44,
    height: 44,
    borderRadius: mentaRadii.round,
    borderWidth: 1,
    borderColor: colors.border.secondary,
    backgroundColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }),
  tabRow: (colors: ThemeTokens['colors']) => ({
    flexDirection: 'row' as const,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.secondary,
    marginBottom: mentaSpacing[5],
  }),
  promiseListSection: {
    width: '100%' as const,
  },
  refreshNotice: {
    marginBottom: mentaSpacing[6],
  },
  tabAction: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  challengeCard: (colors: ThemeTokens['colors']) => ({
    gap: mentaSpacing[5],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.secondary,
    borderRadius: mentaRadii.large,
    backgroundColor: colors.background.surface,
    padding: mentaSpacing[5],
  }),
  challengeCardSelected: (colors: ThemeTokens['colors']) => ({
    borderColor: colors.accent.primary,
    borderWidth: 1,
  }),
  challengeTitleRow: {
    minHeight: 44,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: mentaSpacing[3],
  },
  challengeStatusRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: mentaSpacing[2],
  },
  promiseCardActions: {
    gap: mentaSpacing[1],
  },
  selectedPane: {
    gap: mentaSpacing[5],
    paddingVertical: mentaSpacing[2],
  },
  selectedPaneTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  selectedPaneActions: {
    gap: mentaSpacing[2],
    paddingTop: mentaSpacing[2],
  },
  emptyBlock: (spacing: ThemeTokens['spacing']) => ({
    width: '100%' as const,
    gap: spacing.sm,
  }),
} as const;
