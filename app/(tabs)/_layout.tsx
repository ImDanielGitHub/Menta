import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs, useLocalSearchParams, useRouter } from 'expo-router';

import CreateHubModal from '@/components/creation/CreateHubModal';
import { MentaBottomTabBar } from '@/components/navigation/MentaBottomTabBar';
import {
  useGroupCooldownCheck,
  type GroupCooldownNotice,
} from '@/hooks/useGroupCooldownCheck';
import { useChallengeStore } from '@/store/challenge-store';
import { useGroupStore } from '@/store/group-store';
import { useAuthStore } from '@/store/auth-store';
import { useInviteStore } from '@/store/invite-store';
import { showToast } from '@/components/ui/Toast';
import { useFocusEffect } from 'expo-router/react-navigation';
import {
  consumeCreateHubOpen,
  isCreationIntent,
  openCreateGroup,
  openCreateGroupChallenge,
  openCreateSoloChallenge,
  subscribeCreateHubOpen,
  type CreationIntent,
} from '@/lib/navigation/create-entry';
import { resolvePendingInviteOpenAction } from '@/lib/navigation/pending-invite-open';
import type { CommitmentTemplateId } from '@/lib/commitments/templates';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';

export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    openCreateModal?: string | string[];
    createIntent?: string | string[];
    createModalNonce?: string | string[];
  }>();
  const userChallenges = useChallengeStore(state => state.userChallenges);
  const groups = useGroupStore(state => state.groups);
  const user = useAuthStore(state => state.user);
  const pendingInvite = useInviteStore(state => state.pending);

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [preferredIntent, setPreferredIntent] = useState<
    CreationIntent | undefined
  >(undefined);
  const [groupCooldownNotice, setGroupCooldownNotice] =
    useState<GroupCooldownNotice | null>(null);
  const checkCooldown = useGroupCooldownCheck({
    onCooldown: setGroupCooldownNotice,
  });

  const createIntentFromParams = useMemo(() => {
    const rawIntent = Array.isArray(params.createIntent)
      ? params.createIntent[0]
      : params.createIntent;
    return isCreationIntent(rawIntent) ? rawIntent : undefined;
  }, [params.createIntent]);

  useEffect(() => {
    const openCreateModal = Array.isArray(params.openCreateModal)
      ? params.openCreateModal[0]
      : params.openCreateModal;

    if (openCreateModal === '1' || openCreateModal === 'true') {
      setPreferredIntent(createIntentFromParams);
      setCreateModalVisible(true);
    }
  }, [createIntentFromParams, params.createModalNonce, params.openCreateModal]);

  const openQueuedCreateHub = useCallback(() => {
    const queued = consumeCreateHubOpen();
    if (!queued) {
      return;
    }

    setPreferredIntent(
      queued.createIntent && isCreationIntent(queued.createIntent)
        ? queued.createIntent
        : undefined
    );
    setCreateModalVisible(true);
  }, []);

  useEffect(() => {
    openQueuedCreateHub();
    return subscribeCreateHubOpen(openQueuedCreateHub);
  }, [openQueuedCreateHub]);

  useFocusEffect(
    useCallback(() => {
      openQueuedCreateHub();
    }, [openQueuedCreateHub])
  );

  const closeCreateModal = () => {
    setCreateModalVisible(false);
    setPreferredIntent(undefined);
    setGroupCooldownNotice(null);
  };

  const handleCreateSoloChallenge = (templateId?: CommitmentTemplateId) => {
    setGroupCooldownNotice(null);
    closeCreateModal();
    openCreateSoloChallenge({ router, source: 'home_plus', templateId });
  };

  const handleCreateGroup = async (templateId?: CommitmentTemplateId) => {
    setGroupCooldownNotice(null);
    const didOpen = await openCreateGroup({
      router,
      source: 'home_plus',
      checkGroupCooldown: checkCooldown,
      templateId,
    });
    if (didOpen) {
      closeCreateModal();
    }
  };

  const firstActiveGroupId = useMemo(
    () =>
      groups?.find(
        group => group.kind !== 'promise' && group.status === 'active'
      )?.id ??
      groups?.find(group => group.kind !== 'promise')?.id ??
      null,
    [groups]
  );

  const handleCreateGroupChallenge = async (
    templateId?: CommitmentTemplateId
  ) => {
    setGroupCooldownNotice(null);

    if (!firstActiveGroupId) {
      const didOpen = await openCreateGroup({
        router,
        source: 'home_plus',
        checkGroupCooldown: checkCooldown,
        templateId,
      });
      if (didOpen) {
        closeCreateModal();
      }
      return;
    }

    closeCreateModal();
    openCreateGroupChallenge({
      router,
      source: 'home_plus',
      groupId: firstActiveGroupId,
      templateId,
    });
  };

  const handleJoinExistingGroup = () => {
    const action = resolvePendingInviteOpenAction({
      pendingInvite,
      userId: user?.id,
    });

    if (action.kind === 'open_manual_entry') {
      closeCreateModal();
      router.push('/join-group');
      return;
    }

    if (action.kind === 'open_group_invite') {
      closeCreateModal();
      router.push({
        pathname: '/join-group',
        params: { code: action.code },
      });
      return;
    }

    if (action.kind === 'open_challenge_invite') {
      closeCreateModal();
      router.push({
        pathname: '/join-funding',
        params: { code: action.code },
      } as never);
      return;
    }

    if (action.kind === 'feedback') {
      showToast[action.feedback.tone](
        action.feedback.title,
        action.feedback.message
      );
    }
  };

  const handleInviteToPromise = () => {
    closeCreateModal();
    router.push({
      pathname: '/promise-accountability',
      params: { source: 'create_hub' },
    });
  };

  const hasCreatedFirstPromise = userChallenges.length > 0;

  const recommendedAction = !hasCreatedFirstPromise
    ? {
        choiceId: 'solo' as const,
        title: t('navigation.create.solo.title'),
        description: t('navigation.create.solo.description'),
        ctaLabel: t('navigation.create.solo.action'),
        onPress: () => {
          handleCreateSoloChallenge();
        },
        tag: t('navigation.create.recommended'),
      }
    : {
        choiceId: 'accountability' as const,
        title: t('navigation.create.accountability.title'),
        description: t('navigation.create.accountability.description'),
        ctaLabel: t('navigation.create.accountability.action'),
        onPress: handleInviteToPromise,
        tag: t('navigation.create.recommended'),
      };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: mentaColors.action,
          tabBarInactiveTintColor: mentaColors.text.secondary,
          tabBarShowLabel: false,
          headerStyle: {
            backgroundColor: mentaColors.canvas,
          },
          headerTintColor: mentaColors.text.primary,
          headerShown: false,
          tabBarPosition: 'bottom',
        }}
        tabBar={props => <MentaBottomTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('navigation.tab.today'),
            tabBarAccessibilityLabel: t('navigation.tab.today'),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: t('navigation.tab.groups'),
            tabBarAccessibilityLabel: t('navigation.tab.groups'),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            href: null,
            title: t('navigation.tab.create'),
            tabBarAccessibilityLabel: t('navigation.tab.create'),
          }}
        />
        <Tabs.Screen
          name="shop-tab"
          options={{
            title: t('commerce.nav.shop'),
            tabBarAccessibilityLabel: t('commerce.nav.shop'),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('navigation.tab.profile'),
            tabBarAccessibilityLabel: t('navigation.tab.profile'),
          }}
        />
        <Tabs.Screen
          name="settings-tab"
          options={{
            href: null,
            title: t('shared.navigation.settings'),
            tabBarAccessibilityLabel: t('shared.navigation.settings'),
          }}
        />
      </Tabs>

      <CreateHubModal
        visible={isCreateModalVisible}
        preferredIntent={preferredIntent}
        hasActiveGroup={Boolean(firstActiveGroupId)}
        hasPromise={hasCreatedFirstPromise}
        pendingInvite={pendingInvite}
        recommendedAction={recommendedAction}
        notice={
          groupCooldownNotice
            ? {
                title: groupCooldownNotice.title,
                message: groupCooldownNotice.message,
                actionLabel: t('navigation.create.private_promise'),
                onAction: () => handleCreateSoloChallenge(),
              }
            : null
        }
        onClose={closeCreateModal}
        onCreateGroup={handleCreateGroup}
        onCreateGroupChallenge={handleCreateGroupChallenge}
        onCreateSoloChallenge={handleCreateSoloChallenge}
        onInviteToPromise={handleInviteToPromise}
        onJoinExistingGroup={() => void handleJoinExistingGroup()}
        onBrowseEvents={() => {
          closeCreateModal();
          router.push('/events');
        }}
      />
    </>
  );
}
