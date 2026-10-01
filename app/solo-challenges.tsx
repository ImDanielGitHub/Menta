import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RefreshControl, Pressable, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { format, parseISO, subDays } from 'date-fns';
import { useFocusEffect } from 'expo-router/react-navigation';
import { PlusIcon, ArrowLeftIcon } from '@/components/ui/icons';

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

import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  IPadTwoPaneWorkspace,
  useIPadPortraitWorkspace,
} from '@/components/ipad/ipad-workspace';
import { resolvePersonalPromiseLifecycle } from '@/lib/promise/personal-promise-overview';
import { buildProofWeek } from '@/lib/promise/proof-week';
import {
  applyTodayStatus,
  countKeptDays,
  mondayFirstDayIndex,
  resolvePromiseDay,
} from '@/lib/promise/personal-promise-progress';
import {
  PersonalPromiseFinishedShelf,
  PersonalPromiseSectionHeading,
  PersonalPromiseTodayList,
  PersonalPromiseWeekGrid,
  type PersonalPromiseFinishedItem,
  type PersonalPromiseProofKind,
  type PersonalPromiseProofTile,
  type PersonalPromiseTodayItem,
  type PersonalPromiseTodayState,
  type PersonalPromiseWeekRow,
} from '@/components/challenge/personal-promises-overview';
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

const getDeviceTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export default function SoloChallengesScreen() {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { colors } = useTheme();
  const { user } = useAuthStore();
  const router = useRouter();
  const usesIPadWorkspace = useIPadPortraitWorkspace();
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const hasLoadedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
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
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!usesIPadWorkspace) return;
    if (
      selectedChallengeId &&
      challenges.some(challenge => challenge.id === selectedChallengeId)
    ) {
      return;
    }
    setSelectedChallengeId(challenges[0]?.id ?? null);
  }, [challenges, selectedChallengeId, usesIPadWorkspace]);

  const todayLocalDay = format(new Date(), 'yyyy-MM-dd');
  const todayIndex = mondayFirstDayIndex(todayLocalDay);

  const weekByChallenge = useMemo(
    () =>
      Object.fromEntries(
        challenges.map(challenge => [
          challenge.id,
          buildPromiseWeek({
            challenge,
            submissions: submissionsByChallenge[challenge.id] || [],
            todayStatus: todayStatus[challenge.id] ?? 'none',
            todayLocalDay,
            todayIndex,
          }),
        ])
      ) as Record<string, PromiseProofDay[]>,
    [challenges, submissionsByChallenge, todayIndex, todayLocalDay, todayStatus]
  );

  const todayItems = useMemo<PersonalPromiseTodayItem[]>(
    () =>
      activeChallenges
        .map(challenge => {
          const total = challenge.duration || 30;
          const day = resolvePromiseDay({
            startLocalDay: promiseStartLocalDay(challenge),
            todayLocalDay,
            duration: total,
          });
          return {
            id: challenge.id,
            title: challenge.title,
            meta: challenge.currentStreak
              ? t('todayProof.solo.day_of_with_streak', {
                  day,
                  total,
                  count: challenge.currentStreak,
                })
              : t('todayProof.solo.day_of', { day, total }),
            state: todayStateFor(todayStatus[challenge.id] ?? 'none'),
            proofKind: proofKindFor(challenge),
            cover:
              galleryTiles(
                challenge,
                submissionsByChallenge[challenge.id] || []
              )[0] ?? null,
          };
        })
        .sort((a, b) => todayStateOrder[a.state] - todayStateOrder[b.state]),
    [activeChallenges, submissionsByChallenge, t, todayLocalDay, todayStatus]
  );

  const weekRows = useMemo<PersonalPromiseWeekRow[]>(
    () =>
      todayItems.map(item => {
        const week = weekByChallenge[item.id] ?? [];
        return {
          id: item.id,
          title: item.title,
          week,
          tiles: weekTiles({
            kind: item.proofKind,
            submissions: submissionsByChallenge[item.id] || [],
            todayIndex,
          }),
          proofKind: item.proofKind,
          ...countKeptDays(week, todayIndex),
        };
      }),
    [submissionsByChallenge, todayIndex, todayItems, weekByChallenge]
  );
  const weekTally = weekRows.reduce(
    (sum, row) => ({ kept: sum.kept + row.kept, total: sum.total + row.total }),
    { kept: 0, total: 0 }
  );

  const finishedItems = useMemo<PersonalPromiseFinishedItem[]>(
    () =>
      pastChallenges.map(challenge => {
        const approved = (submissionsByChallenge[challenge.id] || []).filter(
          submission => submission.status === 'approved'
        );
        const tiles = galleryTiles(challenge, approved);
        return {
          id: challenge.id,
          title: challenge.title,
          kept: approved.length,
          total: challenge.duration || 30,
          covers: tiles.slice(0, 3),
          more: Math.max(0, tiles.length - 3),
        };
      }),
    [pastChallenges, submissionsByChallenge]
  );

  const leftToday = todayItems.filter(
    item => item.state === 'due' || item.state === 'retry'
  ).length;
  const lead =
    activeChallenges.length === 0
      ? t('todayProof.solo.nothing_running')
      : leftToday > 0
        ? t('todayProof.solo.left_today', { count: leftToday })
        : t('todayProof.solo.all_checked_in');

  const openPromiseDetail = useCallback(
    (challengeId: string) =>
      router.push({
        pathname: '/challenges/[id]',
        params: { id: challengeId },
      }),
    [router]
  );

  const openPromise = useCallback(
    (challengeId: string) =>
      usesIPadWorkspace
        ? setSelectedChallengeId(challengeId)
        : openPromiseDetail(challengeId),
    [openPromiseDetail, usesIPadWorkspace]
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

  const openCreate = useCallback(
    () => openCreateSoloChallenge({ router, source: 'solo_screen' }),
    [router]
  );

  const selectedChallenge =
    challenges.find(challenge => challenge.id === selectedChallengeId) ??
    challenges[0] ??
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

  if (!refreshError && challenges.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SoloChallengesEmptyState
          onCreateSolo={openCreate}
          onCreateChallenge={() => router.push('/(tabs)/create')}
          onBackToCreation={() => router.replace('/(tabs)/create')}
          onBack={() => backOrReplace(router, '/(tabs)/create')}
        />
      </>
    );
  }

  const promiseSections =
    refreshError && challenges.length === 0 ? (
      <AppInlineNotice
        tone="error"
        title={t('todayProof.solo.load_failed')}
        description={refreshError}
        actionLabel={t('todayProof.promise.try_again')}
        onAction={onRefresh}
        actionLoading={refreshing}
        testID="solo-load-error-notice"
      />
    ) : (
      <View style={styles.sections}>
        <View>
          <PersonalPromiseSectionHeading
            title={t('todayProof.solo.section_today')}
          />
          {todayItems.length > 0 ? (
            <PersonalPromiseTodayList
              items={todayItems}
              selectedId={usesIPadWorkspace ? selectedChallenge?.id : null}
              onOpen={openPromise}
              onAction={id => {
                const challenge = challenges.find(item => item.id === id);
                if (challenge) openPromisePrimary(challenge);
              }}
            />
          ) : (
            <AppButton
              title={t('todayProof.solo.create')}
              onPress={openCreate}
              variant="accent"
              fullWidth
            />
          )}
        </View>

        {weekRows.length > 0 ? (
          <View>
            <PersonalPromiseSectionHeading
              title={t('todayProof.solo.section_week')}
              detail={
                weekTally.total > 0
                  ? t('todayProof.solo.week_kept', weekTally)
                  : undefined
              }
            />
            <PersonalPromiseWeekGrid rows={weekRows} todayIndex={todayIndex} />
          </View>
        ) : null}

        {finishedItems.length > 0 ? (
          <View>
            <PersonalPromiseSectionHeading
              title={t('todayProof.solo.section_finished')}
            />
            <PersonalPromiseFinishedShelf
              items={finishedItems}
              onOpen={openPromise}
            />
          </View>
        ) : null}
      </View>
    );

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('todayProof.solo.create_personal')}
              hitSlop={8}
              onPress={openCreate}
              style={({ pressed }) => [
                styles.iconButton(colors),
                pressed && styles.pressed,
              ]}
            >
              <PlusIcon size={21} color={colors.text.primary} />
            </Pressable>
          </View>

          <View style={styles.intro}>
            <Text
              accessibilityRole="header"
              style={{
                ...mentaTypography.heading,
                color: colors.text.primary,
              }}
            >
              {t('todayProof.solo.heading')}
            </Text>
            <Text
              style={{ ...mentaTypography.lead, color: colors.text.secondary }}
              testID="personal-promises-lead"
            >
              {lead}
            </Text>
          </View>

          {refreshError && challenges.length > 0 ? (
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

          <IPadTwoPaneWorkspace
            enabled={usesIPadWorkspace && Boolean(selectedChallenge)}
            primary={promiseSections}
            secondary={
              selectedChallenge ? (
                <SelectedPromisePane
                  challenge={selectedChallenge}
                  week={weekByChallenge[selectedChallenge.id] ?? []}
                  hasSubmissions={
                    (submissionsByChallenge[selectedChallenge.id] || [])
                      .length > 0
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

const todayStateFor = (status: TodayStatus): PersonalPromiseTodayState =>
  status === 'approved'
    ? 'counted'
    : status === 'pending'
      ? 'waiting'
      : status === 'rejected'
        ? 'retry'
        : 'due';

const todayStateOrder: Record<PersonalPromiseTodayState, number> = {
  due: 0,
  retry: 1,
  waiting: 2,
  counted: 3,
};

const proofKindFor = (challenge: SoloChallenge): PersonalPromiseProofKind =>
  challenge.verificationType === 'text'
    ? 'text'
    : challenge.verificationType === 'video'
      ? 'video'
      : 'photo';

/** Sent proofs as gallery tiles, newest first. Photo promises need the photo. */
const galleryTiles = (
  challenge: SoloChallenge,
  submissions: readonly Submission[]
): PersonalPromiseProofTile[] => {
  const kind = proofKindFor(challenge);
  return submissions
    .filter(submission => kind === 'text' || Boolean(submission.media_url))
    .map(submission => ({ kind, mediaUrl: submission.media_url }));
};

const submissionRank: Record<Submission['status'], number> = {
  approved: 3,
  pending: 2,
  rejected: 1,
};

/** The proof sent on each day of this Monday-first week, if any. */
const weekTiles = ({
  kind,
  submissions,
  todayIndex,
}: {
  kind: PersonalPromiseProofKind;
  submissions: readonly Submission[];
  todayIndex: number;
}): (PersonalPromiseProofTile | null)[] => {
  const bestByDay = new Map<string, Submission>();
  for (const submission of submissions) {
    const day = submission.local_day ?? toLocalDay(submission.submission_date);
    if (!day) continue;
    const existing = bestByDay.get(day);
    if (
      !existing ||
      submissionRank[submission.status] > submissionRank[existing.status]
    ) {
      bestByDay.set(day, submission);
    }
  }
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = format(subDays(today, todayIndex - index), 'yyyy-MM-dd');
    const submission = bestByDay.get(day);
    return submission ? { kind, mediaUrl: submission.media_url } : null;
  });
};

const toLocalDay = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : format(parsed, 'yyyy-MM-dd');
};

const promiseStartLocalDay = (challenge: SoloChallenge): string | null =>
  toLocalDay(challenge.startDate) ?? toLocalDay(challenge.joinedAt);

const buildPromiseWeek = ({
  challenge,
  submissions,
  todayStatus,
  todayLocalDay,
  todayIndex,
}: {
  challenge: SoloChallenge;
  submissions: readonly Submission[];
  todayStatus: TodayStatus;
  todayLocalDay: string;
  todayIndex: number;
}): PromiseProofDay[] => {
  const week = buildProofWeek({
    records: submissions.map(submission => ({
      localDay: submission.local_day ?? toLocalDay(submission.submission_date),
      status: submission.status,
    })),
    todayLocalDay,
    activeFromLocalDay: promiseStartLocalDay(challenge),
  });
  return challenge.lifecycle === 'active'
    ? applyTodayStatus(week, todayIndex, todayStatus)
    : week;
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

type SelectedPromisePaneProps = {
  challenge: SoloChallenge;
  todayStatus: TodayStatus;
  week: PromiseProofDay[];
  hasSubmissions: boolean;
  onOpen: () => void;
  onPrimary: () => void;
  onProofHistory: () => void;
};

const SelectedPromisePane = ({
  challenge,
  todayStatus,
  week,
  hasSubmissions,
  onOpen,
  onPrimary,
  onProofHistory,
}: SelectedPromisePaneProps) => {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

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
      <PromiseProofWeek week={week} label={t('todayProof.solo.recent_proof')} />
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
        {hasSubmissions ? (
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
  const mentaColors = useMentaPalette();

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

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = {
    pressed: { opacity: 0.72 },
    screenContent: {
      gap: 0,
    },
    contentFlow: {
      width: '100%' as const,
    },
    topBar: {
      minHeight: 48,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
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
    intro: {
      gap: mentaSpacing[2],
      paddingTop: mentaSpacing[5],
      marginBottom: mentaSpacing[8],
    },
    refreshNotice: {
      marginBottom: mentaSpacing[6],
    },
    sections: {
      width: '100%' as const,
      gap: mentaSpacing[8],
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
  } as const;
  return { styles };
};
