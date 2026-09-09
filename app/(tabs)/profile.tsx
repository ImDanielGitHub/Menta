'use client';

import { useTranslation } from '@/lib/localization';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import {
  ShoppingBagIcon,
  SettingsIcon,
  TargetIcon,
  UserPlusIcon,
} from '@/components/ui/icons';

import { useAuthStore } from '@/store/auth-store';
import { useChallengeStore } from '@/store/challenge-store';
import { useGroupStore, type Group } from '@/store/group-store';
import { useInviteStore } from '@/store/invite-store';
import { getMyProfile, type MyProfile } from '@/lib/profile-api';
import {
  readProfileFollowThroughDays,
  type ProfileFollowThroughDay,
} from '@/lib/profile/follow-through';
import { ProfileFollowThroughChart } from '@/components/profile/ProfileFollowThroughChart';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppButton } from '@/components/ui/AppButton';
import { AppScreen } from '@/components/ui/AppShell';
import { AppScaledText } from '@/components/ui/AppScaledText';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Avatar } from '@/components/ui/Avatar';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { RevenueCatAPI } from '@/lib/paywall/revenuecat';
import { resolvePendingInviteOpenAction } from '@/lib/navigation/pending-invite-open';
import {
  SettingsDirectRow,
  SettingsSectionLabel,
} from '@/components/settings/SettingsDirectRow';
import {
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { addBreadcrumb } from '@/lib/sentry';

type GroupWithTracking = Group & {
  group_streak_tracking?: {
    current_streak?: number | null;
    longest_streak?: number | null;
  }[];
};

type ProStatus = 'checking' | 'free' | 'active' | 'unavailable';
type ProfileSectionStatus = 'checking' | 'ready' | 'stale';

type ProfileNotice = {
  tone: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
} | null;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background.primary,
      flex: 1,
    },
    content: {
      paddingBottom: mentaSpacing[6],
      paddingTop: mentaSpacing[6],
    },
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: mentaSpacing[12],
      marginBottom: mentaSpacing[6],
    },
    pageTitle: {
      flex: 1,
      color: colors.text.primary,
      ...mentaTypography.heading,
    },
    identityRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: mentaSpacing[4],
      paddingBottom: mentaSpacing[6],
      paddingTop: mentaSpacing[1],
    },
    avatarButton: {
      borderColor: colors.border.primary,
      borderRadius: mentaRadii.round,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 2,
    },
    identityCopy: {
      flex: 1,
      gap: mentaSpacing[1],
      minWidth: 0,
    },
    displayName: {
      color: colors.text.primary,
      ...mentaTypography.title,
    },
    identityMeta: {
      color: colors.text.secondary,
      ...mentaTypography.caption,
    },
    editButton: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      minHeight: 44,
      minWidth: 88,
    },
    editButtonPressed: {
      opacity: 0.72,
    },
    editButtonText: {
      color: colors.accent.primary,
      textAlign: 'right',
      ...mentaTypography.caption,
      fontFamily: mentaTypography.bodySemibold.fontFamily,
    },
    settingsButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notice: {
      marginTop: mentaSpacing[4],
    },
    savedInvite: {
      backgroundColor: colors.background.tertiary,
      borderColor: colors.border.primary,
      borderRadius: mentaRadii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      gap: mentaSpacing[1],
      marginTop: mentaSpacing[3],
      padding: mentaSpacing[4],
    },
    savedInvitePressed: {
      backgroundColor: colors.accent.background,
    },
    savedInviteTitle: {
      color: colors.text.primary,
      ...mentaTypography.bodyMedium,
    },
    savedInviteMeta: {
      color: colors.text.secondary,
      ...mentaTypography.caption,
    },
    recovery: {
      flexGrow: 1,
      gap: mentaSpacing[4],
      justifyContent: 'center',
    },
    skeletonHeader: {
      gap: mentaSpacing[2],
      paddingBottom: mentaSpacing[5],
    },
    skeletonIdentity: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: mentaSpacing[4],
      paddingBottom: mentaSpacing[5],
    },
    skeletonIdentityCopy: {
      flex: 1,
      gap: mentaSpacing[2],
    },
    skeletonMetrics: {
      borderBottomColor: colors.border.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border.primary,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: mentaSpacing[4],
      paddingVertical: mentaSpacing[4],
    },
    skeletonMetric: {
      flex: 1,
      gap: mentaSpacing[2],
    },
    skeletonRhythm: {
      borderBottomColor: colors.border.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border.primary,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: mentaSpacing[2],
      paddingVertical: 14,
    },
    skeletonRows: {
      gap: mentaSpacing[4],
      paddingTop: mentaSpacing[6],
    },
    skeletonRow: {
      alignItems: 'center',
      borderBottomColor: colors.border.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: mentaSpacing[3],
      minHeight: 56,
    },
    skeletonRowCopy: {
      flex: 1,
      gap: mentaSpacing[2],
    },
    skeletonSectionLabel: {
      marginTop: mentaSpacing[3],
    },
    firstUseContent: {
      flexGrow: 1,
      paddingBottom: mentaSpacing[6],
      paddingTop: mentaSpacing[2],
    },
    firstUseHero: {
      alignItems: 'center',
      gap: mentaSpacing[3],
      paddingBottom: mentaSpacing[6],
      paddingHorizontal: mentaSpacing[2],
      paddingTop: mentaSpacing[6],
    },
    firstUseContext: {
      color: colors.accent.primary,
      ...mentaTypography.bodySmallMedium,
    },
    firstUseTitle: {
      color: colors.text.primary,
      ...mentaTypography.journeyTitle,
      maxWidth: 300,
      textAlign: 'center',
    },
    firstUseBody: {
      color: colors.text.secondary,
      ...mentaTypography.body,
      maxWidth: 310,
      textAlign: 'center',
    },
    firstUseActions: {
      marginTop: 'auto',
      paddingTop: mentaSpacing[8],
    },
  });

export default function ProfileScreen() {
  const { locale, t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { clearAuthData, isAuthenticated, user, logout } = useAuthStore();
  const { userChallenges, fetchUserChallenges } = useChallengeStore();
  const { groups, fetchUserGroups } = useGroupStore();
  const pendingInvite = useInviteStore(state => state.pending);
  const pendingInviteTypeLabel = pendingInvite
    ? pendingInvite.type === 'group'
      ? t('groupsHome.invites.type.group')
      : t('groupsHome.invites.type.promise')
    : null;

  const [momentaBalance, setMomentaBalance] = useState(0);
  const [serverProfile, setServerProfile] = useState<MyProfile | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [proStatus, setProStatus] = useState<ProStatus>('checking');
  const [identityStatus, setIdentityStatus] =
    useState<ProfileSectionStatus>('checking');
  const [promiseStatus, setPromiseStatus] =
    useState<ProfileSectionStatus>('checking');
  const [groupStatus, setGroupStatus] =
    useState<ProfileSectionStatus>('checking');
  const [rhythmStatus, setRhythmStatus] =
    useState<ProfileSectionStatus>('checking');
  const [followThroughDays, setFollowThroughDays] = useState<
    ProfileFollowThroughDay[]
  >([]);
  const [profileNotice, setProfileNotice] = useState<ProfileNotice>(null);
  const [showProgress, setShowProgress] = useState(false);
  const profileRequestRef = useRef(0);
  const invalidProfileRecoveryForUserRef = useRef<string | null>(null);
  const loadedProfileUserIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  currentUserIdRef.current = user?.id ?? null;
  const streak = useMemo(() => {
    const groupTotals = groups.reduce(
      (acc, group: GroupWithTracking) => {
        const current =
          group.current_streak ??
          group?.group_streak_tracking?.[0]?.current_streak ??
          0;
        const longest =
          group?.group_streak_tracking?.[0]?.longest_streak ?? current;
        return {
          current: Math.max(acc.current, current),
          longest: Math.max(acc.longest, longest),
        };
      },
      { current: 0, longest: 0 }
    );
    const soloCurrent = userChallenges.reduce(
      (maximum, challenge) => Math.max(maximum, challenge.currentStreak ?? 0),
      0
    );

    return {
      current: Math.max(groupTotals.current, soloCurrent),
      longest: Math.max(groupTotals.longest, soloCurrent),
    };
  }, [groups, userChallenges]);

  const currentStreak = streak.current;
  const hasRecordedProgress = followThroughDays.some(
    day => day.approvedProofs > 0 || day.outcome !== null
  );
  const activePromiseCount = useMemo(
    () =>
      userChallenges.filter(
        challenge => !challenge.status || challenge.status === 'active'
      ).length,
    [userChallenges]
  );

  const recoverInvalidProfile = useCallback(() => {
    const accountId = currentUserIdRef.current;
    if (!accountId || invalidProfileRecoveryForUserRef.current === accountId) {
      return;
    }

    invalidProfileRecoveryForUserRef.current = accountId;
    profileRequestRef.current += 1;
    loadedProfileUserIdRef.current = null;
    setServerProfile(null);
    setMomentaBalance(0);
    setFollowThroughDays([]);
    setProfileNotice(null);
    router.replace('/login');
    void logout().catch(() => undefined);
  }, [logout, router]);

  const hydrateProfile = useCallback(
    async (options?: { refreshing?: boolean }) => {
      if (!user?.id) return;
      const requestId = ++profileRequestRef.current;
      const accountId = user.id;
      const isCurrentAccountRequest = () =>
        requestId === profileRequestRef.current &&
        currentUserIdRef.current === accountId;
      const showSpinner = options?.refreshing ?? false;
      if (showSpinner) {
        setRefreshing(true);
      }

      try {
        const [groupsResult, challengesResult, profileResult, rhythmResult] =
          await Promise.allSettled([
            fetchUserGroups(accountId),
            fetchUserChallenges(accountId),
            getMyProfile(),
            readProfileFollowThroughDays({ locale }),
          ]);
        if (!isCurrentAccountRequest()) return;

        setGroupStatus(groupsResult.status === 'fulfilled' ? 'ready' : 'stale');
        setPromiseStatus(
          challengesResult.status === 'fulfilled' ? 'ready' : 'stale'
        );
        setRhythmStatus(
          rhythmResult.status === 'fulfilled' ? 'ready' : 'stale'
        );
        if (rhythmResult.status === 'fulfilled') {
          setFollowThroughDays(rhythmResult.value);
        }

        if (profileResult.status === 'rejected') {
          setIdentityStatus('stale');
          return;
        }

        const userRow = profileResult.value;
        if (!userRow || userRow.id !== accountId) {
          recoverInvalidProfile();
          return;
        }

        setIdentityStatus('ready');
        setMomentaBalance(userRow.momenta_balance ?? 0);
        setServerProfile(userRow);
        loadedProfileUserIdRef.current = accountId;
      } catch (error) {
        if (!isCurrentAccountRequest()) return;
        console.error('[Profile] hydrate error', error);
        setIdentityStatus('stale');
        setPromiseStatus('stale');
        setGroupStatus('stale');
        setRhythmStatus('stale');
      } finally {
        if (isCurrentAccountRequest()) {
          setIsInitialLoading(false);
        }
        if (showSpinner && isCurrentAccountRequest()) {
          setRefreshing(false);
        }
      }
    },
    [
      fetchUserChallenges,
      fetchUserGroups,
      locale,
      recoverInvalidProfile,
      user?.id,
    ]
  );

  // Check Pro subscription status - also refreshes when screen regains focus (e.g., after purchase)
  const checkProStatus = useCallback(async () => {
    setProStatus(current => (current === 'active' ? current : 'checking'));
    try {
      const hasProAccess = await RevenueCatAPI.isPro();
      setProStatus(hasProAccess ? 'active' : 'free');
    } catch {
      setProStatus(current =>
        current === 'active' ? 'active' : 'unavailable'
      );
    }
  }, []);

  // Re-read the server-owned profile and Pro state whenever this tab regains
  // focus. Wallet/shop mutations happen on nested routes, so mount-only
  // hydration can otherwise show a stale balance after a confirmed purchase.
  useFocusEffect(
    useCallback(() => {
      void hydrateProfile();
      void checkProStatus();
    }, [checkProStatus, hydrateProfile])
  );

  const handleRefresh = useCallback(async () => {
    await hydrateProfile({ refreshing: true });
    // Also refresh pro status on pull-to-refresh
    await checkProStatus();
  }, [hydrateProfile, checkProStatus]);

  const handleOpenSavedInvite = useCallback(() => {
    const action = resolvePendingInviteOpenAction({
      pendingInvite,
      userId: user?.id,
    });

    if (action.kind === 'open_manual_entry') {
      router.push('/join-group');
      return;
    }

    if (action.kind === 'open_group_invite') {
      router.push({
        pathname: '/join-group',
        params: { code: action.code },
      });
      return;
    }

    if (action.kind === 'open_challenge_invite') {
      router.push({
        pathname: '/join-funding',
        params: { code: action.code },
      } as never);
      return;
    }

    if (action.kind !== 'feedback') return;

    setProfileNotice({
      tone: action.feedback.tone,
      title: action.feedback.title,
      message: action.feedback.message,
    });
  }, [pendingInvite, router, user?.id]);

  const openProfileEditor = useCallback(() => {
    router.push('/edit-profile' as Href);
  }, [router]);

  const openInviteFriends = useCallback(() => {
    addBreadcrumb('route_transition_requested', {
      destination: 'share_invite',
      entry: 'profile',
      journey: 'referral_invite',
    });
    router.push('/share-invite');
  }, [router]);

  if (!user || !isAuthenticated) {
    return (
      <AppScreen
        lane="working"
        hasTabBar
        scrollable
        testID="profile-session-recovery"
        contentContainerStyle={styles.recovery}
        style={styles.screen}
      >
        <AppInlineNotice
          tone="warning"
          title={t('fullAuth.tabs_profile.sign_in_to_see_you')}
          description={t(
            'fullAuth.tabs_profile.for_your_privacy_menta_hides_the_previous_accoun'
          )}
        />
        <AppButton
          fullWidth
          title={t('fullAuth.tabs_profile.sign_in_again')}
          onPress={() => {
            clearAuthData();
            router.replace('/login');
          }}
        />
      </AppScreen>
    );
  }

  if (isInitialLoading) {
    return <ProfileSkeleton />;
  }

  const visibleProfile = serverProfile?.id === user.id ? serverProfile : null;
  const isPro = proStatus === 'active';
  const visibleMomentaBalance = visibleProfile ? momentaBalance : 0;
  const displayName =
    visibleProfile?.display_name?.trim() ||
    visibleProfile?.username?.trim() ||
    user.username;
  const username = visibleProfile?.username?.trim() || user.username;
  const avatarUrl = visibleProfile?.avatar_url ?? user.avatarUrl;
  const shouldShowFirstUse =
    promiseStatus === 'ready' &&
    groupStatus === 'ready' &&
    userChallenges.length === 0 &&
    groups.length === 0 &&
    !pendingInvite &&
    !profileNotice;

  if (shouldShowFirstUse) {
    return (
      <AppScreen
        lane="focused"
        hasTabBar
        scrollable
        testID="profile-first-use"
        contentContainerStyle={[
          styles.firstUseContent,
          {
            paddingTop: phoneLayout.isShortHeight
              ? mentaSpacing[3]
              : mentaSpacing[6],
          },
        ]}
        style={styles.screen}
      >
        <View style={styles.pageHeader}>
          <AppScaledText
            accessibilityRole="header"
            style={styles.pageTitle}
            textScale={phoneLayout.textScale}
          >
            {t('fullAuth.tabs_profile.you')}
          </AppScaledText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('shared.navigation.settings')}
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <SettingsIcon size={24} color={colors.text.secondary} />
          </Pressable>
        </View>

        <View style={styles.firstUseHero}>
          <MentaMascot
            size="lg"
            state="empty-guide"
            testID="profile-first-use-mascot"
          />
          <Text style={styles.firstUseContext}>
            {t('fullAuth.tabs_profile.no_promises_yet')}
          </Text>
          <Text style={styles.firstUseTitle}>
            {t('fullAuth.tabs_profile.make_your_first_promise')}
          </Text>
          <Text style={styles.firstUseBody}>
            {t(
              'fullAuth.tabs_profile.choose_one_thing_to_follow_through_on_it_will_ap'
            )}
          </Text>
        </View>

        <AppInlineNotice
          tone="info"
          title={t('fullAuth.tabs_profile.progress_starts_with_proof')}
          description={t(
            'fullAuth.tabs_profile.streaks_and_progress_appear_after_you_send_proof'
          )}
        />

        <View style={styles.firstUseActions}>
          <AppButton
            fullWidth
            size="large"
            title={t('fullAuth.tabs_profile.create_a_promise')}
            onPress={() => router.push('/create-challenge')}
          />
          <AppButton
            fullWidth
            size="large"
            title={t('fullAuth.tabs_profile.edit_profile')}
            variant="ghost"
            onPress={openProfileEditor}
          />
        </View>
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen
        lane="working"
        hasTabBar
        testID="profile-screen"
        scrollable
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text.primary}
          />
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: phoneLayout.isShortHeight
              ? mentaSpacing[3]
              : mentaSpacing[6],
          },
        ]}
        style={styles.screen}
      >
        <View style={styles.pageHeader}>
          <AppScaledText
            accessibilityRole="header"
            style={styles.pageTitle}
            textScale={phoneLayout.textScale}
          >
            {t('fullAuth.tabs_profile.you')}
          </AppScaledText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('shared.navigation.settings')}
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <SettingsIcon size={24} color={colors.text.secondary} />
          </Pressable>
        </View>

        <ErrorBoundary level="component">
          <View style={styles.identityRow}>
            <Pressable
              onPress={openProfileEditor}
              accessibilityRole="button"
              accessibilityLabel={t(
                'fullAuth.tabs_profile.change_profile_photo'
              )}
              style={({ pressed }) => [
                styles.avatarButton,
                pressed && styles.editButtonPressed,
              ]}
            >
              <Avatar
                size={72}
                name={displayName}
                source={avatarUrl ? { uri: avatarUrl } : undefined}
              />
            </Pressable>

            <View style={styles.identityCopy}>
              <Text
                style={styles.displayName}
                numberOfLines={phoneLayout.fontScale >= 1.3 ? undefined : 1}
              >
                {displayName}
              </Text>
              <Text
                style={styles.identityMeta}
                numberOfLines={phoneLayout.fontScale >= 1.3 ? undefined : 1}
              >
                @{username} · {isPro ? 'Menta Pro' : 'Member'}
              </Text>
            </View>

            <Pressable
              onPress={openProfileEditor}
              accessibilityRole="button"
              accessibilityLabel={t('fullAuth.tabs_profile.edit_profile')}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
            >
              <Text style={styles.editButtonText}>
                {t('fullAuth.tabs_profile.edit_profile')}
              </Text>
            </Pressable>
          </View>
        </ErrorBoundary>

        {identityStatus === 'stale' ? (
          <AppInlineNotice
            title={t(
              'fullAuth.tabs_profile.profile_details_may_be_out_of_date'
            )}
            description={t(
              'fullAuth.tabs_profile.menta_kept_the_last_details_saved_for_this_accou'
            )}
            tone="warning"
            actionLabel={t('fullAuth.shared.retry_profile')}
            onAction={() => void hydrateProfile()}
            testID="profile-identity-stale"
          />
        ) : null}

        <ErrorBoundary level="component">
          {hasRecordedProgress ? (
            <View>
              <AppButton
                title={t('fullAuth.tabs_profile.your_rhythm')}
                onPress={() => setShowProgress(value => !value)}
                fullWidth
                variant="outline"
              />
              {showProgress ? (
                <ProfileFollowThroughChart
                  activePromiseCount={activePromiseCount}
                  currentStreak={currentStreak}
                  days={followThroughDays}
                  groupCount={groups.length}
                  onOpenHistory={() => router.push('/solo-challenges')}
                />
              ) : null}
            </View>
          ) : rhythmStatus === 'checking' ? (
            <SkeletonLoader
              accessibilityLabel={t(
                'fullAuth.tabs_profile.loading_your_profile'
              )}
              borderRadius={mentaRadii.large}
              height={292}
            />
          ) : rhythmStatus === 'stale' ? (
            <AppInlineNotice
              actionLabel={t('fullAuth.shared.refresh_progress')}
              description={t(
                'fullAuth.tabs_profile.the_last_saved_promise_and_group_counts_are_stil'
              )}
              onAction={() => void hydrateProfile()}
              testID="profile-rhythm-unavailable"
              title={t(
                'fullAuth.tabs_profile.your_progress_may_be_out_of_date'
              )}
              tone="warning"
            />
          ) : null}
        </ErrorBoundary>

        {promiseStatus === 'stale' ||
        groupStatus === 'stale' ||
        rhythmStatus === 'stale' ? (
          <AppInlineNotice
            title={t('fullAuth.tabs_profile.your_progress_may_be_out_of_date')}
            description={t(
              'fullAuth.tabs_profile.the_last_saved_promise_and_group_counts_are_stil'
            )}
            tone="warning"
            actionLabel={t('fullAuth.shared.refresh_progress')}
            onAction={() => void hydrateProfile()}
            testID="profile-rhythm-stale"
          />
        ) : null}

        {profileNotice ? (
          <View style={styles.notice}>
            <AppInlineNotice
              title={profileNotice.title}
              description={profileNotice.message}
              tone={profileNotice.tone}
              testID="profile-notice"
            />
          </View>
        ) : null}

        {pendingInvite ? (
          <Pressable
            onPress={() => void handleOpenSavedInvite()}
            accessibilityRole="button"
            accessibilityLabel={t(
              'fullAuth.tabs_profile.open_saved_type_invite',
              { type: pendingInviteTypeLabel ?? '' }
            )}
            style={({ pressed }) => [
              styles.savedInvite,
              pressed && styles.savedInvitePressed,
            ]}
          >
            <Text style={styles.savedInviteTitle}>
              {t('groupsHome.invites.saved_title', {
                type: pendingInviteTypeLabel ?? '',
              })}
            </Text>
            <Text style={styles.savedInviteMeta}>
              {t(
                'fullAuth.tabs_profile.open_the_invite_to_review_it_before_joining'
              )}
            </Text>
          </Pressable>
        ) : null}

        <ErrorBoundary level="component">
          <View>
            <SettingsSectionLabel>
              {t('fullAuth.tabs_profile.progress_and_rewards')}
            </SettingsSectionLabel>
            <SettingsDirectRow
              icon={<TargetIcon size={18} color={colors.text.secondary} />}
              onPress={() => router.push('/solo-challenges')}
              subtitle={t('fullAuth.tabs_profile.active_and_past_promises')}
              title={t('fullAuth.tabs_profile.personal_promises')}
            />
            <SettingsDirectRow
              icon={<ShoppingBagIcon size={18} color={colors.text.secondary} />}
              onPress={() => router.push('/momenta')}
              subtitle={t('fullAuth.tabs_profile.wallet_shop_and_items')}
              title={t('fullAuth.tabs_profile.momenta')}
              value={String(visibleMomentaBalance)}
            />
            <SettingsDirectRow
              accessibilityHint={t(
                'fullAuth.tabs_profile.opens_your_invite_link_and_the_current_reward_te'
              )}
              icon={<UserPlusIcon size={18} color={colors.text.secondary} />}
              onPress={openInviteFriends}
              showDivider={false}
              subtitle={t(
                'fullAuth.tabs_profile.current_reward_terms_and_your_link'
              )}
              testID="profile-invite-someone"
              title={t('fullAuth.tabs_profile.invite_friends')}
            />
          </View>
        </ErrorBoundary>
      </AppScreen>
    </>
  );
}

const ProfileSkeleton = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <AppScreen
      lane="working"
      hasTabBar
      scrollable
      testID="profile-loading"
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View
        accessible
        accessibilityLabel={t('fullAuth.tabs_profile.loading_your_profile')}
        accessibilityRole="progressbar"
      >
        <View style={styles.skeletonHeader}>
          <SkeletonLoader announce={false} height={12} width={104} />
          <SkeletonLoader announce={false} height={36} width={72} />
        </View>
        <View style={styles.skeletonIdentity}>
          <SkeletonLoader
            announce={false}
            borderRadius={mentaRadii.round}
            height={64}
            width={64}
          />
          <View style={styles.skeletonIdentityCopy}>
            <SkeletonLoader announce={false} height={24} width="72%" />
            <SkeletonLoader announce={false} height={13} width="52%" />
          </View>
        </View>
        <View style={styles.skeletonMetrics}>
          {[0, 1, 2].map(index => (
            <View key={`metric-${index}`} style={styles.skeletonMetric}>
              <SkeletonLoader announce={false} height={24} width={32} />
              <SkeletonLoader announce={false} height={10} width="78%" />
            </View>
          ))}
        </View>
        <View style={styles.skeletonRhythm}>
          <SkeletonLoader announce={false} height={11} width={98} />
          <SkeletonLoader announce={false} height={24} width="68%" />
        </View>
        <View style={styles.skeletonRows}>
          <SkeletonLoader announce={false} height={11} width={128} />
          {[0, 1, 2].map(index => (
            <View key={`progress-${index}`} style={styles.skeletonRow}>
              <SkeletonLoader
                announce={false}
                borderRadius={mentaRadii.round}
                height={22}
                width={22}
              />
              <View style={styles.skeletonRowCopy}>
                <SkeletonLoader announce={false} height={14} width="52%" />
                <SkeletonLoader announce={false} height={10} width="72%" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </AppScreen>
  );
};
