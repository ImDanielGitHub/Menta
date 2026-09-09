import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { GroupRouteChrome } from '@/components/group/GroupRouteChrome';
import { useGroupSettingsActions } from '@/components/group/admin/useGroupSettingsActions';
import {
  type PrivacyOption,
  DiscardSheet,
  LeaveSheet,
  PrivacySheet,
  SettingsNoticeState,
  SettingsRow,
  SettingsSkeleton,
} from '@/components/group/admin/GroupSettingsViews';
import {
  GroupListSurface,
  GroupMetricStrip,
  GroupSectionHeader,
} from '@/components/group/GroupAdminPrimitives';
import { AppButton, AppInlineNotice } from '@/components/ui';
import { AppTextField } from '@/components/ui/AppFields';
import ConfirmDestructiveSheet from '@/components/ui/ConfirmDestructiveSheet';
import {
  GlobeIcon,
  LockIcon,
  RefreshCcwIcon,
  Share2Icon,
  Trash2Icon,
  UsersIcon,
} from '@/components/ui/icons';
import { mentaColors, mentaSpacing } from '@/constants/MentaDesignSystem';
import { groupMemberRoleCopy } from '@/lib/group-member-policy';
import { useAuthStore } from '@/store/auth-store';
import { useGroupStore } from '@/store/group-store';

import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization';
const normalisePrivacy = (privacy?: string | null): PrivacyOption =>
  privacy === 'private' || privacy === 'secret' ? 'private' : 'public';

export default function GroupSettingsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    deleteGroup,
    fetchGroupMembers,
    fetchGroups,
    groupMembers,
    groups,
    leaveGroup: leaveGroupAction,
  } = useGroupStore();
  const [isLoading, setIsLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyOption>('public');
  const [privacySheetVisible, setPrivacySheetVisible] = useState(false);
  const [discardSheetVisible, setDiscardSheetVisible] = useState(false);
  const [hydratedGroupId, setHydratedGroupId] = useState<string | null>(null);

  const group = useMemo(
    () => groups.find(candidate => candidate.id === id),
    [groups, id]
  );
  const members = groupMembers[id ?? ''] ?? [];
  const member = members.find(candidate => candidate.userId === user?.id);
  const isOwner = member?.role === 'owner';
  const canManageGroup = member?.role === 'owner' || member?.role === 'admin';
  const hasChanges = Boolean(
    group &&
    (name.trim() !== group.name.trim() ||
      description.trim() !== (group.description ?? '').trim() ||
      privacy !== normalisePrivacy(group.privacy))
  );

  const {
    confirmDelete,
    deleteLoading,
    deleteSheetVisible,
    handleBack,
    leaveGroup,
    leaveLoading,
    leaveSheetVisible,
    notice,
    saveChanges,
    saveLoading,
    setDeleteSheetVisible,
    setLeaveSheetVisible,
  } = useGroupSettingsActions({
    deleteGroup,
    description,
    fetchGroups,
    group,
    hasChanges,
    isOwner,
    leaveGroupAction,
    name,
    privacy,
    router,
    userId: user?.id,
  });

  const loadSettings = useCallback(async () => {
    if (!id) {
      setScreenError(t('groups.create.missing_id'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setScreenError(null);
    try {
      await Promise.all([fetchGroups(), fetchGroupMembers(id)]);
    } catch (error) {
      setScreenError(
        error instanceof Error ? error.message : t('groups.create.load_error')
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchGroupMembers, fetchGroups, id, t]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!group || hydratedGroupId === group.id) return;
    setName(group.name);
    setDescription(group.description ?? '');
    setPrivacy(normalisePrivacy(group.privacy));
    setHydratedGroupId(group.id);
  }, [group, hydratedGroupId]);

  const body = isLoading ? (
    <SettingsSkeleton />
  ) : screenError ? (
    <SettingsNoticeState
      actionLabel={t('groups.tab.try_again')}
      detail={screenError}
      onAction={() => void loadSettings()}
      title={t('groups.create.load_error')}
    />
  ) : !group ? (
    <SettingsNoticeState
      actionLabel={t('groups.tab.back_groups')}
      detail={t('groups.admin.group_missing_detail')}
      onAction={() => router.replace('/(tabs)/groups')}
      title={t('groups.admin.group_not_found')}
    />
  ) : !canManageGroup ? (
    <SettingsNoticeState
      actionLabel={t('groups.tab.back_groups')}
      detail={t('groups.admin.settings_permission_detail')}
      onAction={() =>
        backOrReplace(
          router,
          id ? { pathname: '/groups/[id]', params: { id } } : '/(tabs)/groups'
        )
      }
      title={t('groups.admin.settings_unavailable')}
    />
  ) : (
    <>
      {notice ? (
        <AppInlineNotice
          description={notice.message}
          title={notice.title}
          tone={notice.kind}
          testID="group-settings-notice"
        />
      ) : null}
      <GroupMetricStrip
        metrics={[
          {
            label: t('groups.admin.visibility'),
            value:
              privacy === 'public'
                ? t('groups.admin.discoverable')
                : t('groups.admin.code_required'),
          },
          {
            label: t('groups.admin.people'),
            value: String(members.length || group.member_count || 0),
          },
          {
            label: t('groups.admin.your_role'),
            value: member?.role
              ? groupMemberRoleCopy[member.role]
              : t('groups.admin.guest'),
          },
        ]}
        testID="group-settings-metrics"
      />
      <View style={styles.section}>
        <GroupSectionHeader label={t('groups.admin.details')} />
        <GroupListSurface style={styles.formSurface}>
          <AppTextField
            editable={isOwner && !saveLoading}
            label={t('groups.create.group_name_accessibility')}
            onChangeText={setName}
            placeholder={t('groups.create.group_name_accessibility')}
            value={name}
          />
        </GroupListSurface>
      </View>
      <View style={styles.section}>
        <GroupSectionHeader label={t('groups.admin.who_join')} />
        <GroupListSurface>
          <SettingsRow
            disabled={!isOwner || saveLoading}
            detail={
              privacy === 'private'
                ? t('groups.create.private_note')
                : t('groups.create.public_note')
            }
            icon={<GlobeIcon color={mentaColors.text.primary} size={18} />}
            onPress={() => setPrivacySheetVisible(true)}
            title={
              privacy === 'private'
                ? t('groups.create.private_label')
                : t('groups.create.public_label')
            }
            value={t('groups.admin.selected')}
          />
        </GroupListSurface>
      </View>
      <View style={styles.section}>
        <GroupSectionHeader label={t('groups.admin.review_reminders')} />
        <GroupListSurface>
          <SettingsRow
            detail={t('groups.admin.reminders_detail')}
            disabled
            icon={
              <RefreshCcwIcon color={mentaColors.text.secondary} size={18} />
            }
            onPress={() => undefined}
            title={t('groups.admin.reminders_allowed')}
            value={
              group.notify_on_member_miss
                ? t('groups.create.on')
                : t('groups.create.off')
            }
          />
        </GroupListSurface>
      </View>
      <View style={styles.section}>
        <GroupSectionHeader label={t('groups.admin.invitations')} />
        <GroupListSurface>
          <SettingsRow
            detail={t('groups.admin.manage_invite_detail')}
            disabled={saveLoading}
            icon={<Share2Icon color={mentaColors.text.primary} size={18} />}
            onPress={() =>
              router.push({
                pathname: '/group-invite',
                params: { groupId: group.id, groupName: group.name },
              })
            }
            title={t('groups.admin.manage_invite')}
            value={t('groups.admin.open')}
          />
          <SettingsRow
            detail={t('groups.admin.members_detail')}
            disabled={saveLoading}
            icon={<UsersIcon color={mentaColors.text.primary} size={18} />}
            onPress={() =>
              router.push({
                pathname: '/group-members',
                params: { id: group.id },
              })
            }
            title={t('groups.admin.members')}
            value={t('groups.admin.people_count', {
              count: members.length || group.member_count || 0,
            })}
          />
        </GroupListSurface>
      </View>
      <View style={styles.section}>
        <GroupSectionHeader label={t('groups.admin.group')} />
        <GroupListSurface>
          <SettingsRow
            detail={
              isOwner
                ? t('groups.admin.transfer_unavailable')
                : t('groups.admin.remove_account_detail')
            }
            disabled={saveLoading}
            icon={<LockIcon color={mentaColors.text.secondary} size={18} />}
            onPress={() => setLeaveSheetVisible(true)}
            title={
              isOwner ? t('groups.admin.ownership') : t('groups.admin.leave')
            }
          />
          {isOwner ? (
            <SettingsRow
              detail={t('groups.admin.delete_detail')}
              disabled={saveLoading}
              icon={<Trash2Icon color={mentaColors.danger} size={18} />}
              onPress={() => setDeleteSheetVisible(true)}
              title={t('groups.admin.delete')}
            />
          ) : null}
        </GroupListSurface>
      </View>
    </>
  );

  return (
    <GroupRouteChrome
      description={t('groups.admin.description')}
      footer={
        group && canManageGroup ? (
          <AppButton
            disabled={!hasChanges || !isOwner || saveLoading}
            fullWidth
            loading={saveLoading}
            onPress={() => void saveChanges()}
            title={
              saveLoading ? t('groups.admin.saving') : t('groups.admin.save')
            }
          />
        ) : undefined
      }
      onBack={() => {
        if (handleBack()) setDiscardSheetVisible(true);
      }}
      testID="group-settings-screen"
      title={t('groups.admin.settings')}
      subtitle={group?.name}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {body}
      <PrivacySheet
        onClose={() => setPrivacySheetVisible(false)}
        onSelect={nextPrivacy => {
          setPrivacy(nextPrivacy);
          setPrivacySheetVisible(false);
        }}
        selected={privacy}
        visible={privacySheetVisible}
      />
      <DiscardSheet
        onClose={() => setDiscardSheetVisible(false)}
        onDiscard={() =>
          backOrReplace(
            router,
            id ? { pathname: '/groups/[id]', params: { id } } : '/(tabs)/groups'
          )
        }
        visible={discardSheetVisible}
      />
      <LeaveSheet
        loading={leaveLoading}
        onClose={() => setLeaveSheetVisible(false)}
        onConfirm={() => void leaveGroup()}
        owner={isOwner}
        visible={leaveSheetVisible}
      />
      {group ? (
        <ConfirmDestructiveSheet
          confirmLabel={t('groups.admin.delete')}
          description={t('groups.admin.delete_warning')}
          loading={deleteLoading}
          nameToType={group.name}
          onClose={() => setDeleteSheetVisible(false)}
          onConfirm={confirmDelete}
          title={t('groups.admin.delete_question')}
          visible={deleteSheetVisible}
        />
      ) : null}
    </GroupRouteChrome>
  );
}

const styles = StyleSheet.create({
  section: { gap: mentaSpacing[3] },
  formSurface: { padding: mentaSpacing[4] },
});
