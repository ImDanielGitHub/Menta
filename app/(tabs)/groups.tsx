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
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import PublicGroupPreviewModal, {
  type PublicGroupPreviewNotice,
} from '@/components/group/PublicGroupPreviewModal';
import { GroupsListSection } from '@/components/groups/GroupsListSection';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  ErrorBoundary,
} from '@/components/ui';
import { AppScaledText } from '@/components/ui/AppScaledText';
import { ChevronRightIcon, ClockIcon, PlusIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTranslation } from '@/lib/localization';
import { trackProductOperation } from '@/lib/posthog';
import {
  useGroupCooldownCheck,
  type GroupCooldownNotice,
} from '@/hooks/useGroupCooldownCheck';
import {
  openCreateGroup,
  openCreateSoloChallenge,
} from '@/lib/navigation/create-entry';
import { resolvePendingInviteOpenAction } from '@/lib/navigation/pending-invite-open';
import { useAuthStore } from '@/store/auth-store';
import { useInviteStore } from '@/store/invite-store';
import type { Group } from '@/store/group-store';
import {
  useDiscoverGroupsState,
  useGroupActions,
  useUserGroupsState,
} from '@/store/selectors';

type GroupsTab = 'mine' | 'discover';

type JoinNotice = {
  kind: 'success' | 'error' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  action:
    | 'open-group'
    | 'retry-join'
    | 'enter-code'
    | 'sign-in'
    | 'show-mine'
    | 'create-solo'
    | 'open-saved-invite'
    | null;
  groupId?: string;
} | null;

export default function GroupsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const phoneLayout = usePhoneLayout();
  const { user } = useAuthStore();
  const pendingInvite = useInviteStore(state => state.pending);
  const { groups } = useUserGroupsState();
  const { discoverGroups } = useDiscoverGroupsState();
  const { fetchDiscoverGroups, fetchUserGroups, joinGroup } = useGroupActions();

  const hasPersistedGroupsRef = useRef(groups.length > 0);
  const [tab, setTab] = useState<GroupsTab>('mine');
  const [refreshing, setRefreshing] = useState(false);
  const [mineInitialLoading, setMineInitialLoading] = useState(
    () => !hasPersistedGroupsRef.current
  );
  const [discoverInitialLoading, setDiscoverInitialLoading] = useState(true);
  const [mineFetchError, setMineFetchError] = useState<string | null>(null);
  const [discoverFetchError, setDiscoverFetchError] = useState<string | null>(
    null
  );
  const [joinNotice, setJoinNotice] = useState<JoinNotice>(null);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [previewGroup, setPreviewGroup] = useState<Group | null>(null);

  const handleGroupCooldown = useCallback(
    (notice: GroupCooldownNotice) => {
      setJoinNotice({
        kind: 'info',
        title: notice.title,
        message: notice.message,
        actionLabel: t('groups.tab.create_solo'),
        action: 'create-solo',
      });
    },
    [t]
  );
  const checkCooldown = useGroupCooldownCheck({
    onCooldown: handleGroupCooldown,
  });

  const myGroups = useMemo(() => groups, [groups]);
  const previewNotice = useMemo<PublicGroupPreviewNotice | null>(() => {
    if (
      !previewGroup ||
      !joinNotice ||
      joinNotice.groupId !== previewGroup.id
    ) {
      return null;
    }

    return {
      title: joinNotice.title,
      message: joinNotice.message,
      tone: joinNotice.kind,
    };
  }, [joinNotice, previewGroup]);

  const refreshAllGroups = useCallback(
    async (showInitialLoader = false) => {
      if (!user?.id) {
        setMineInitialLoading(false);
        setDiscoverInitialLoading(false);
        return;
      }

      if (showInitialLoader && !hasPersistedGroupsRef.current) {
        setMineInitialLoading(true);
        setDiscoverInitialLoading(true);
      } else if (!showInitialLoader) {
        setRefreshing(true);
      }

      try {
        const [mineResult, discoverResult] = await Promise.allSettled([
          fetchUserGroups(user.id),
          fetchDiscoverGroups(user.id),
        ]);
        setMineFetchError(
          mineResult.status === 'rejected'
            ? mineResult.reason instanceof Error
              ? mineResult.reason.message
              : t('groups.tab.try_again')
            : null
        );
        setDiscoverFetchError(
          discoverResult.status === 'rejected'
            ? discoverResult.reason instanceof Error
              ? discoverResult.reason.message
              : t('groups.tab.try_again')
            : null
        );
      } finally {
        setMineInitialLoading(false);
        setDiscoverInitialLoading(false);
        setRefreshing(false);
      }
    },
    [fetchDiscoverGroups, fetchUserGroups, t, user?.id]
  );

  const refreshTab = useCallback(
    async (target: GroupsTab, showInitialLoader = false) => {
      if (!user?.id) return;
      const isMine = target === 'mine';
      const setInitialLoading = isMine
        ? setMineInitialLoading
        : setDiscoverInitialLoading;
      const setFetchError = isMine ? setMineFetchError : setDiscoverFetchError;

      if (showInitialLoader) setInitialLoading(true);
      try {
        await (isMine
          ? fetchUserGroups(user.id)
          : fetchDiscoverGroups(user.id));
        setFetchError(null);
      } catch (error) {
        setFetchError(
          error instanceof Error ? error.message : t('groups.tab.try_again')
        );
      } finally {
        setInitialLoading(false);
      }
    },
    [fetchDiscoverGroups, fetchUserGroups, t, user?.id]
  );

  useEffect(() => {
    if (user?.id) {
      void refreshAllGroups(!hasPersistedGroupsRef.current);
    } else {
      setMineInitialLoading(false);
      setDiscoverInitialLoading(false);
    }
  }, [refreshAllGroups, user?.id]);

  const handleCreateGroup = useCallback(() => {
    void openCreateGroup({
      router,
      source: 'groups_tab',
      checkGroupCooldown: checkCooldown,
    });
  }, [checkCooldown, router]);

  const handleInviteToPromise = useCallback(() => {
    router.push({
      pathname: '/promise-accountability',
      params: { source: 'together' },
    });
  }, [router]);

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

    setJoinNotice({
      kind: action.feedback.tone,
      title: action.feedback.title,
      message: action.feedback.message,
      actionLabel: t('groups.tab.enter_code_action'),
      action: 'enter-code',
    });
  }, [pendingInvite, router, t, user?.id]);

  const handleJoinGroup = useCallback(
    async (group: Group, expectedCost: number) => {
      trackProductOperation({
        area: 'group_discovery',
        authority: 'client',
        operation: 'join_group',
        outcome: 'started',
        phase: 'intent',
        source: 'groups',
      });
      if (!user?.id) {
        trackProductOperation({
          area: 'group_discovery',
          authority: 'client',
          operation: 'join_group',
          outcome: 'blocked',
          phase: 'eligibility',
          source: 'groups',
        });
        setJoinNotice({
          kind: 'error',
          title: t('groups.tab.sign_in_title'),
          message: t('groups.tab.sign_in_detail'),
          actionLabel: t('groups.tab.sign_in'),
          action: 'sign-in',
          groupId: group.id,
        });
        return false;
      }

      if (String(group.privacy) !== 'public') {
        trackProductOperation({
          area: 'group_discovery',
          authority: 'client',
          operation: 'join_group',
          outcome: 'ineligible',
          phase: 'eligibility',
          source: 'groups',
        });
        setJoinNotice({
          kind: 'info',
          title: t('groups.tab.invite_needed_title'),
          message: t('groups.tab.invite_needed_detail'),
          actionLabel: t('groups.tab.enter_code_action'),
          action: 'enter-code',
          groupId: group.id,
        });
        return false;
      }

      setJoinNotice(null);
      setJoiningGroupId(group.id);
      try {
        await joinGroup(user.id, group.id, expectedCost);
        trackProductOperation({
          area: 'group_discovery',
          authority: 'server',
          operation: 'join_group',
          outcome: 'confirmed',
          phase: 'authority',
          source: 'groups',
        });
        setJoinNotice({
          kind: 'success',
          title: t('groups.tab.joined_title'),
          message: t('groups.tab.joined_detail', { group: group.name }),
          actionLabel: t('groups.tab.joined_action'),
          action: 'open-group',
          groupId: group.id,
        });
        void refreshAllGroups();
        return true;
      } catch {
        trackProductOperation({
          area: 'group_discovery',
          authority: 'server',
          operation: 'join_group',
          outcome: 'unknown',
          phase: 'reconciliation',
          source: 'groups',
        });
        setJoinNotice({
          kind: 'error',
          title: t('groups.tab.join_unknown_title'),
          message: t('groups.tab.join_unknown_detail'),
          actionLabel: t('groups.tab.join_unknown_action'),
          action: 'show-mine',
          groupId: group.id,
        });
        return false;
      } finally {
        setJoiningGroupId(null);
      }
    },
    [joinGroup, refreshAllGroups, t, user?.id]
  );

  const handleJoinNoticeAction = useCallback(() => {
    if (!joinNotice) {
      return;
    }

    if (joinNotice.action === 'enter-code') {
      router.push('/join-group');
      return;
    }

    if (joinNotice.action === 'sign-in') {
      router.push({
        pathname: '/auth-required',
        params: { next: '/(tabs)/groups' },
      });
      return;
    }

    if (joinNotice.action === 'show-mine') {
      setPreviewGroup(null);
      setTab('mine');
      void refreshTab('mine', true);
      return;
    }

    if (joinNotice.action === 'create-solo') {
      openCreateSoloChallenge({
        router,
        source: 'groups_tab',
      });
      return;
    }

    if (joinNotice.action === 'open-saved-invite') {
      void handleOpenSavedInvite();
      return;
    }

    if (joinNotice.action === 'open-group' && joinNotice.groupId) {
      router.push(`/groups/${joinNotice.groupId}`);
      return;
    }

    if (joinNotice.action === 'retry-join' && joinNotice.groupId) {
      const group = discoverGroups.find(
        candidate => candidate.id === joinNotice.groupId
      );
      if (group) {
        setPreviewGroup(group);
      }
    }
  }, [discoverGroups, handleOpenSavedInvite, joinNotice, refreshTab, router]);

  const handleOpenPreviewDetails = useCallback(
    (groupId: string) => {
      setPreviewGroup(null);
      router.push(`/groups/${groupId}`);
    },
    [router]
  );

  const handleJoinPreviewGroup = useCallback(
    async (groupId: string, expectedCost: number) => {
      const group =
        previewGroup?.id === groupId
          ? previewGroup
          : discoverGroups.find(candidate => candidate.id === groupId);

      if (!group) {
        return;
      }

      const joined = await handleJoinGroup(group, expectedCost);
      if (joined) {
        setPreviewGroup(null);
      }
    },
    [discoverGroups, handleJoinGroup, previewGroup]
  );
  const initialLoading =
    tab === 'mine' ? mineInitialLoading : discoverInitialLoading;
  const fetchError = tab === 'mine' ? mineFetchError : discoverFetchError;

  return (
    <AppScreen
      lane="working"
      testID="groups-screen"
      safeArea
      scrollable
      hasTabBar
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refreshAllGroups(false)}
          tintColor={mentaColors.text.secondary}
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
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <AppScaledText
          accessibilityRole="header"
          style={styles.title}
          textScale={phoneLayout.textScale}
        >
          {t('navigation.tab.groups')}
        </AppScaledText>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('groups.tab.archived')}
            accessibilityHint={t('groups.tab.archived_hint')}
            hitSlop={mentaSpacing[2]}
            onPress={() => router.push('/archived-groups')}
            style={({ pressed }) => [
              styles.archiveAction,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.primary,
              },
              pressed ? styles.pressed : null,
            ]}
          >
            <ClockIcon size={20} color={colors.text.secondary} />
          </Pressable>
          <AppButton
            accessibilityLabel={t(
              'groups.source.accountability.invite_button_label'
            )}
            accessibilityHint={t(
              'groups.source.accountability.invite_button_hint'
            )}
            onPress={handleInviteToPromise}
            icon={<PlusIcon size={16} color={colors.onPrimary} />}
            size="small"
            style={styles.createAction}
            textScale={phoneLayout.textScale}
            title={t('groups.source.accountability.invite_short')}
          />
        </View>
      </View>

      {!mineInitialLoading ? (
        <View
          accessibilityRole="tablist"
          testID="groups-tab-switcher"
          style={[
            styles.segment,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          {[
            {
              label: t('groups.source.accountability.shared_tab'),
              value: 'mine' as GroupsTab,
            },
            { label: t('groups.tab.discover'), value: 'discover' as GroupsTab },
          ].map(option => {
            const selected = tab === option.value;
            const accessibilityRole = Platform.OS === 'ios' ? 'button' : 'tab';
            return (
              <Pressable
                key={option.value}
                accessibilityLabel={option.label}
                accessibilityHint={
                  option.value === 'mine'
                    ? t('groups.source.accountability.shared_tab_hint')
                    : t('groups.tab.discover_hint')
                }
                accessibilityRole={accessibilityRole}
                accessibilityState={{ selected }}
                onPress={() => {
                  setPreviewGroup(null);
                  setTab(option.value);
                  if (option.value === 'discover') {
                    trackProductOperation({
                      area: 'group_discovery',
                      authority: 'client',
                      operation: 'discover_group',
                      outcome: 'started',
                      phase: 'intent',
                      source: 'groups',
                    });
                  }
                }}
                role={accessibilityRole}
                testID={`groups-tab-${option.value}`}
                style={({ pressed }) => [
                  styles.segmentOption,
                  selected ? { backgroundColor: colors.accent.primary } : null,
                  pressed ? styles.segmentPressed : null,
                ]}
              >
                <Text
                  accessible={false}
                  style={[
                    styles.segmentText,
                    selected
                      ? styles.segmentTextSelected
                      : styles.segmentTextUnselected,
                    {
                      color: selected
                        ? colors.onPrimary
                        : colors.text.secondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {tab === 'mine' && !initialLoading ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            pendingInvite
              ? t('groups.tab.invite_ready')
              : t('groups.tab.enter_code')
          }
          accessibilityHint={t('groups.tab.invite_hint')}
          onPress={() => void handleOpenSavedInvite()}
          style={({ pressed }) => [
            styles.inviteRow,
            { borderColor: colors.border.primary },
            pressed ? { backgroundColor: colors.accent.background } : null,
          ]}
          testID="groups-pending-invite-row"
        >
          <View style={styles.inviteCopy}>
            <Text style={styles.inviteTitle}>
              {pendingInvite
                ? t('groups.tab.invite_row')
                : t('groups.tab.enter_invite_row')}
            </Text>
            <Text numberOfLines={1} style={styles.inviteDescription}>
              {pendingInvite
                ? t('groups.tab.code_saved', { code: pendingInvite.code })
                : t('groups.tab.invite_detail')}
            </Text>
          </View>
          <View style={styles.inviteTrailing}>
            <Text
              style={[
                styles.inviteActionLabel,
                { color: colors.accent.primary },
              ]}
            >
              {pendingInvite ? t('groups.tab.check') : t('groups.tab.enter')}
            </Text>
            <ChevronRightIcon size={17} color={colors.accent.primary} />
          </View>
        </Pressable>
      ) : null}

      {joinNotice ? (
        <AppInlineNotice
          title={joinNotice.title}
          description={joinNotice.message}
          tone={joinNotice.kind}
          actionLabel={joinNotice.actionLabel}
          onAction={joinNotice.actionLabel ? handleJoinNoticeAction : undefined}
          actionLoading={
            joinNotice.action === 'retry-join' &&
            joiningGroupId === joinNotice.groupId
          }
          testID="groups-join-notice"
        />
      ) : null}

      <ErrorBoundary level="component">
        <View style={styles.listLane} testID="groups-list-layout">
          <GroupsListSection
            tab={tab}
            userId={user?.id}
            myGroups={myGroups}
            discoverGroups={discoverGroups}
            initialLoading={initialLoading}
            fetchError={fetchError}
            onRefreshGroups={() => void refreshTab(tab, true)}
            onGoToToday={() => router.replace('/(tabs)')}
            onJoinWithCode={() => router.push('/join-group')}
            onChoosePromise={handleInviteToPromise}
            onCreateGroup={handleCreateGroup}
            onOpenPromise={challengeId =>
              router.push({
                pathname: '/challenges/[id]',
                params: { id: challengeId },
              })
            }
            onOpenGroup={groupId => router.push(`/groups/${groupId}`)}
            onPreviewGroup={group => {
              trackProductOperation({
                area: 'group_discovery',
                authority: 'client',
                operation: 'discover_group',
                outcome: 'confirmed',
                phase: 'authority',
                source: 'groups',
              });
              setPreviewGroup(group);
            }}
          />
        </View>
      </ErrorBoundary>

      <PublicGroupPreviewModal
        visible={Boolean(previewGroup)}
        group={previewGroup}
        onClose={() => setPreviewGroup(null)}
        onJoin={(groupId, expectedCost) =>
          void handleJoinPreviewGroup(groupId, expectedCost)
        }
        onOpenDetails={handleOpenPreviewDetails}
        joining={joiningGroupId === previewGroup?.id}
        notice={previewNotice}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: mentaSpacing[6],
  },
  listLane: {
    alignSelf: 'stretch',
    width: '100%',
  },
  header: {
    minHeight: mentaSpacing[12],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  title: {
    ...mentaTypography.heading,
    flex: 1,
    minWidth: 0,
    color: mentaColors.text.primary,
  },
  headerActions: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[2],
  },
  archiveAction: {
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
  },
  createAction: {
    borderRadius: mentaRadii.round,
    paddingHorizontal: mentaSpacing[4],
  },
  pressed: { opacity: 0.72 },
  segment: {
    width: '100%',
    minHeight: mentaLayout.primaryControlHeight + mentaSpacing[2],
    flexDirection: 'row',
    padding: mentaSpacing[1],
    borderRadius: mentaRadii.medium,
  },
  segmentOption: {
    flex: 1,
    minHeight: mentaLayout.primaryControlHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.small,
  },
  segmentPressed: { opacity: 0.8 },
  segmentText: { ...mentaTypography.control, textAlign: 'center' },
  segmentTextSelected: { ...mentaTypography.control },
  segmentTextUnselected: { ...mentaTypography.control },
  inviteRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
    paddingVertical: mentaSpacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inviteCopy: { flex: 1, minWidth: 0, gap: mentaSpacing[1] },
  inviteTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  inviteDescription: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  inviteTrailing: {
    minWidth: mentaLayout.trailingActionLane,
    minHeight: mentaLayout.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: mentaSpacing[1],
  },
  inviteActionLabel: {
    ...mentaTypography.bodySmallMedium,
  },
});
