import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';

import type { PrivacyOption } from '@/components/group/admin/GroupSettingsViews';
import { supabase } from '@/lib/supabase';
import { type Group, useGroupStore } from '@/store/group-store';

import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  createConfirmedReceipt,
  emitConfirmedOutcome,
  emitHaptic,
} from '@/lib/motion/haptics';
type Notice = {
  kind: 'error' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
} | null;

type DeleteGroup = ReturnType<typeof useGroupStore.getState>['deleteGroup'];
type FetchGroups = ReturnType<typeof useGroupStore.getState>['fetchGroups'];
type LeaveGroup = ReturnType<typeof useGroupStore.getState>['leaveGroup'];
type AppRouter = ReturnType<typeof useRouter>;

const normalisePrivacy = (privacy?: string | null): PrivacyOption =>
  privacy === 'private' || privacy === 'secret' ? 'private' : 'public';

export const useGroupSettingsActions = ({
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
  userId,
}: {
  deleteGroup: DeleteGroup;
  description: string;
  fetchGroups: FetchGroups;
  group?: Group;
  hasChanges: boolean;
  isOwner: boolean;
  leaveGroupAction: LeaveGroup;
  name: string;
  privacy: PrivacyOption;
  router: AppRouter;
  userId?: string;
}) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [leaveSheetVisible, setLeaveSheetVisible] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const saveChanges = useCallback(async () => {
    if (!group || saveLoading) return;
    if (!isOwner) {
      setNotice({
        kind: 'info',
        title: 'Owner only',
        message: 'Only the owner can save these group settings.',
      });
      return;
    }
    if (!name.trim()) {
      setNotice({
        kind: 'error',
        title: 'Name required',
        message: 'Give this group a name before saving.',
      });
      return;
    }

    setNotice(null);
    setSaveLoading(true);
    const submittedSettings = {
      description: description.trim(),
      name: name.trim(),
      privacy,
    };
    try {
      const { error } = await supabase
        .from('teams')
        .update(submittedSettings)
        .eq('id', group.id);
      if (error) throw error;

      await fetchGroups();
      const refreshedGroup = useGroupStore
        .getState()
        .groups.find(candidate => candidate.id === group.id);
      const receiptMatches =
        refreshedGroup?.name.trim() === submittedSettings.name &&
        (refreshedGroup.description ?? '').trim() ===
          submittedSettings.description &&
        normalisePrivacy(refreshedGroup.privacy) === submittedSettings.privacy;

      if (!receiptMatches) {
        setNotice({
          kind: 'warning',
          title: 'Save not confirmed',
          message:
            'Menta could not confirm whether the settings were saved. Your edits are still here. Check the group before trying again.',
        });
        return;
      }

      const savedVersion = refreshedGroup?.updated_at?.trim();
      if (savedVersion) {
        void emitConfirmedOutcome(
          'settings-saved',
          createConfirmedReceipt('settings-save', `${group.id}:${savedVersion}`)
        );
      } else {
        void emitHaptic({ type: 'unknown' });
      }
      setNotice({
        kind: 'success',
        title: 'Changes saved',
        message: 'Group settings are up to date.',
      });
    } catch {
      void emitHaptic({ type: 'unknown' });
      setNotice({
        kind: 'error',
        title: "Changes weren't saved",
        message:
          'Check your connection and try again. Your edits are still here.',
      });
    } finally {
      setSaveLoading(false);
    }
  }, [description, fetchGroups, group, isOwner, name, privacy, saveLoading]);

  const currentGroupId = group?.id;

  const handleBack = useCallback(() => {
    if (hasChanges && !saveLoading) return true;
    backOrReplace(
      router,
      currentGroupId
        ? { pathname: '/groups/[id]', params: { id: currentGroupId } }
        : '/(tabs)/groups'
    );
    return false;
  }, [currentGroupId, hasChanges, router, saveLoading]);

  const leaveGroup = useCallback(async () => {
    if (!group || !userId || leaveLoading) return;
    void emitHaptic({ type: 'destructive-commit' });
    setLeaveLoading(true);
    try {
      const outcome = await leaveGroupAction(userId, group.id);
      if (outcome.kind === 'confirmed') {
        void emitConfirmedOutcome(
          'entity-left',
          createConfirmedReceipt('destructive-change', outcome.receipt.groupId)
        );
        router.replace('/(tabs)/groups');
        return;
      }
      if (outcome.kind === 'unknown') {
        void emitHaptic({ type: 'unknown' });
      } else if (outcome.kind === 'blocked') {
        void emitHaptic({ type: 'blocked', reason: 'validation' });
      } else {
        void emitHaptic({ type: 'failed', operation: 'delete' });
      }
      setNotice({
        kind: outcome.kind === 'unknown' ? 'warning' : 'error',
        title:
          outcome.kind === 'unknown'
            ? 'Leave result unknown'
            : 'No group change',
        message: outcome.message,
      });
    } finally {
      setLeaveLoading(false);
      setLeaveSheetVisible(false);
    }
  }, [group, leaveGroupAction, leaveLoading, router, userId]);

  const confirmDelete = useCallback(async () => {
    if (!group || deleteLoading) return;
    setDeleteLoading(true);
    try {
      const outcome = await deleteGroup(group.id);
      if (outcome.kind === 'confirmed') {
        void emitConfirmedOutcome(
          'entity-deleted',
          createConfirmedReceipt('destructive-change', outcome.receipt.groupId)
        );
        router.replace('/(tabs)/groups');
        return;
      }
      if (outcome.kind === 'unknown') {
        void emitHaptic({ type: 'unknown' });
      } else if (outcome.kind === 'blocked') {
        void emitHaptic({ type: 'blocked', reason: 'permission' });
      } else {
        void emitHaptic({ type: 'failed', operation: 'delete' });
      }
      setNotice({
        kind: outcome.kind === 'unknown' ? 'warning' : 'error',
        title:
          outcome.kind === 'unknown'
            ? 'Delete not confirmed'
            : 'Group not deleted',
        message:
          outcome.kind === 'unknown'
            ? 'Menta could not confirm whether the group was deleted. Return to Groups and check before trying again.'
            : outcome.message,
      });
    } finally {
      setDeleteLoading(false);
      setDeleteSheetVisible(false);
    }
  }, [deleteGroup, deleteLoading, group, router]);

  return {
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
  };
};
