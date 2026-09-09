import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { GroupRouteChrome } from '@/components/group/GroupRouteChrome';
import {
  GroupListSurface,
  GroupMetricStrip,
  GroupSectionHeader,
} from '@/components/group/GroupAdminPrimitives';
import { AppButton, AppInlineNotice } from '@/components/ui';
import ConfirmDestructiveSheet from '@/components/ui/ConfirmDestructiveSheet';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { RefreshCcwIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  groupMemberRoleCopy,
  groupMemberRoleRank,
} from '@/lib/group-member-policy';
import { useAuthStore } from '@/store/auth-store';
import { useGroupStore } from '@/store/group-store';

import {
  MemberRow,
  MembersSkeleton,
  MemberState,
} from '@/components/group/admin/GroupMemberViews';
import { getMemberName } from '@/components/group/admin/group-member-governance';
import { useGroupMemberActions } from '@/components/group/admin/useGroupMemberActions';

import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization';
export default function GroupMembersScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchGroupMembers, fetchGroups, groupMembers, groups } =
    useGroupStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const group = useMemo(
    () => groups.find(candidate => candidate.id === id),
    [groups, id]
  );
  const members = useMemo(
    () =>
      [...(groupMembers[id ?? ''] ?? [])].sort((left, right) => {
        const roleDelta =
          groupMemberRoleRank[left.role] - groupMemberRoleRank[right.role];
        return (
          roleDelta ||
          new Date(left.joinedAt).getTime() - new Date(right.joinedAt).getTime()
        );
      }),
    [groupMembers, id]
  );
  const myMember = members.find(member => member.userId === user?.id);
  const isOwner = myMember?.role === 'owner';
  const canManageMembers =
    myMember?.role === 'owner' || myMember?.role === 'admin';

  const loadMembers = useCallback(async () => {
    if (!id) {
      setLoadError(t('groups.create.missing_id'));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      await Promise.all([fetchGroups(), fetchGroupMembers(id)]);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : t('groups.admin.load_members_error')
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchGroupMembers, fetchGroups, id, t]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const {
    actionLoading,
    completeAction,
    memberLockReason,
    notice: governanceNotice,
    openMemberActions,
    pendingAction,
    selectedMember,
    setPendingAction,
    setSelectedMember,
  } = useGroupMemberActions({
    canManageMembers,
    groupId: id,
    isOwner,
    loadMembers,
    role: myMember?.role,
    userId: user?.id,
  });
  const notice = governanceNotice;

  const sections = [
    {
      label: t('groups.admin.owner'),
      members: members.filter(member => member.role === 'owner'),
    },
    {
      label: t('groups.admin.admins'),
      members: members.filter(
        member => member.role === 'admin' || member.role === 'moderator'
      ),
    },
    {
      label: t('groups.admin.members'),
      members: members.filter(member => member.role === 'member'),
    },
  ].filter(section => section.members.length > 0);

  const body = isLoading ? (
    <MembersSkeleton />
  ) : loadError ? (
    <MemberState
      actionLabel={t('groups.tab.try_again')}
      detail={loadError}
      onAction={() => void loadMembers()}
      title={t('groups.admin.members_load_failed')}
      tone="danger"
    />
  ) : !group ? (
    <MemberState
      actionLabel={t('groups.tab.back_groups')}
      detail={t('groups.admin.group_missing_detail')}
      onAction={() => router.replace('/(tabs)/groups')}
      title={t('groups.admin.group_not_found')}
      tone="danger"
    />
  ) : members.length === 0 ? (
    <MemberState
      actionLabel={t('groups.admin.invite_people')}
      detail={t('groups.admin.invite_empty_detail')}
      onAction={() =>
        router.push({
          pathname: '/group-invite',
          params: { groupId: group.id, groupName: group.name },
        })
      }
      title={t('groups.admin.no_members')}
    />
  ) : (
    <>
      {notice ? (
        <AppInlineNotice
          description={notice.message}
          title={notice.title}
          tone={notice.kind}
          testID="group-members-notice"
        />
      ) : null}
      <GroupMetricStrip
        metrics={[
          { label: t('groups.admin.people'), value: String(members.length) },
          {
            label: t('groups.admin.your_role'),
            value: myMember
              ? groupMemberRoleCopy[myMember.role]
              : t('groups.admin.guest'),
          },
          {
            label: t('groups.admin.access'),
            value: canManageMembers
              ? t('groups.admin.manage')
              : t('groups.admin.view_only'),
          },
        ]}
        testID="group-members-metrics"
      />
      {sections.map(section => (
        <View key={section.label} style={styles.section}>
          <GroupSectionHeader
            action={
              section.label === 'Owner' && canManageMembers ? (
                <AppButton
                  onPress={() =>
                    router.push({
                      pathname: '/group-invite',
                      params: { groupId: group.id, groupName: group.name },
                    })
                  }
                  size="small"
                  style={styles.inviteButton}
                  title={t('groups.admin.invite_people')}
                  variant="ghost"
                />
              ) : undefined
            }
            helper={t('groups.admin.people_count', {
              count: section.members.length,
            })}
            label={section.label}
          />
          <GroupListSurface>
            {section.members.map(member => (
              <MemberRow
                actionHint={
                  member.userId === user?.id
                    ? undefined
                    : t('groups.admin.member_actions_hint')
                }
                actionLabel={
                  member.userId === user?.id
                    ? undefined
                    : t('groups.admin.open_member_actions', {
                        member: getMemberName(member),
                      })
                }
                busy={actionLoading === member.userId}
                key={`${member.groupId}-${member.userId}`}
                lockedReason={
                  member.userId === user?.id ? memberLockReason(member) : null
                }
                member={member}
                onPress={() =>
                  member.userId === user?.id
                    ? openMemberActions(member)
                    : setSelectedMember(member)
                }
                readOnly={member.userId === user?.id}
              />
            ))}
          </GroupListSurface>
        </View>
      ))}
    </>
  );

  return (
    <GroupRouteChrome
      description={
        canManageMembers
          ? t('groups.admin.members_manage_description')
          : t('groups.admin.members_description')
      }
      onBack={() =>
        backOrReplace(
          router,
          id ? { pathname: '/groups/[id]', params: { id } } : '/(tabs)/groups'
        )
      }
      rightAction={
        canManageMembers ? (
          <Pressable
            accessibilityLabel={t('groups.admin.check_members')}
            accessibilityRole="button"
            onPress={() => void loadMembers()}
            style={styles.headerAction}
          >
            <RefreshCcwIcon color={mentaColors.text.primary} size={18} />
          </Pressable>
        ) : undefined
      }
      subtitle={group?.name}
      testID="group-members-screen"
      title={t('groups.admin.members')}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {body}
      <SimpleBottomSheet
        onClose={() => !actionLoading && setSelectedMember(null)}
        testID="group-member-actions-sheet"
        visible={Boolean(selectedMember) && !pendingAction}
        scrollableBody={
          selectedMember ? (
            <View style={styles.sheetCopy}>
              <Text style={styles.sheetTitle}>
                {getMemberName(selectedMember)}
              </Text>
              <Text style={styles.sheetDetail}>
                {t('groups.admin.current_role', {
                  role: groupMemberRoleCopy[selectedMember.role],
                })}
              </Text>
            </View>
          ) : undefined
        }
        footer={
          selectedMember ? (
            <View style={styles.sheetActions}>
              {selectedMember.userId !== user?.id ? (
                <AppButton
                  fullWidth
                  onPress={() => {
                    const member = selectedMember;
                    setSelectedMember(null);
                    router.push({
                      pathname: '/report-issue',
                      params: {
                        reportKind: 'user',
                        source: 'group_member_profile',
                        userId: member.userId,
                        userLabel: getMemberName(member),
                        contextLabel: getMemberName(member),
                        ...(id ? { groupId: id } : {}),
                      },
                    });
                  }}
                  title={t('groups.admin.report')}
                  variant="outline"
                />
              ) : null}
              {isOwner &&
              !memberLockReason(selectedMember) &&
              selectedMember.role !== 'admin' ? (
                <AppButton
                  fullWidth
                  onPress={() =>
                    setPendingAction({
                      type: 'promote',
                      member: selectedMember,
                    })
                  }
                  title={t('groups.admin.make_admin')}
                />
              ) : null}
              {isOwner &&
              !memberLockReason(selectedMember) &&
              selectedMember.role === 'admin' ? (
                <AppButton
                  fullWidth
                  onPress={() =>
                    setPendingAction({
                      type: 'demote',
                      member: selectedMember,
                    })
                  }
                  title={t('groups.admin.remove_admin')}
                  variant="outline"
                />
              ) : null}
              {canManageMembers && !memberLockReason(selectedMember) ? (
                <AppButton
                  fullWidth
                  onPress={() =>
                    setPendingAction({
                      type: 'remove',
                      member: selectedMember,
                    })
                  }
                  title={t('groups.admin.remove_member')}
                  variant="destructive"
                />
              ) : null}
            </View>
          ) : undefined
        }
      />
      <SimpleBottomSheet
        onClose={() => !actionLoading && setPendingAction(null)}
        testID="group-member-role-sheet"
        visible={Boolean(pendingAction && pendingAction.type !== 'remove')}
        scrollableBody={
          pendingAction && pendingAction.type !== 'remove' ? (
            <View style={styles.sheetCopy}>
              <Text style={styles.sheetTitle}>
                {pendingAction.type === 'promote'
                  ? t('groups.admin.promote_question')
                  : t('groups.admin.demote_question')}
              </Text>
              <Text style={styles.sheetDetail}>
                {pendingAction.type === 'promote'
                  ? t('groups.admin.promote_detail', {
                      member: getMemberName(pendingAction.member),
                    })
                  : t('groups.admin.demote_detail', {
                      member: getMemberName(pendingAction.member),
                    })}
              </Text>
            </View>
          ) : undefined
        }
        footer={
          pendingAction && pendingAction.type !== 'remove' ? (
            <AppButton
              fullWidth
              loading={actionLoading === pendingAction.member.userId}
              onPress={() => void completeAction(pendingAction)}
              title={
                pendingAction.type === 'promote'
                  ? t('groups.admin.make_admin')
                  : t('groups.admin.remove_admin')
              }
            />
          ) : undefined
        }
      />
      {pendingAction?.type === 'remove' ? (
        <ConfirmDestructiveSheet
          confirmLabel={t('groups.admin.remove_member')}
          description={t('groups.admin.remove_warning', {
            member: getMemberName(pendingAction.member),
          })}
          loading={actionLoading === pendingAction.member.userId}
          nameToType={getMemberName(pendingAction.member)}
          onClose={() => !actionLoading && setPendingAction(null)}
          onConfirm={() => completeAction(pendingAction)}
          title={t('groups.admin.remove_question')}
          visible
        />
      ) : null}
    </GroupRouteChrome>
  );
}

const styles = StyleSheet.create({
  section: { gap: mentaSpacing[3] },
  inviteButton: { minWidth: 112 },
  headerAction: {
    alignItems: 'center',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    height: mentaLayout.minimumTouchTarget,
    justifyContent: 'center',
    width: mentaLayout.minimumTouchTarget,
  },
  sheetCopy: { gap: mentaSpacing[2], paddingBottom: mentaSpacing[2] },
  sheetActions: { gap: mentaSpacing[4] },
  sheetTitle: { ...mentaTypography.title, color: mentaColors.text.primary },
  sheetDetail: { ...mentaTypography.body, color: mentaColors.text.secondary },
});
