import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  GroupSectionHeader,
  GroupSkeletonRows,
  GroupStatePanel,
  type GroupStatusTone,
} from '@/components/group/GroupAdminPrimitives';
import { Avatar } from '@/components/ui';
import { MoreVerticalIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { getMemberName } from '@/components/group/admin/group-member-governance';
import { groupMemberRoleCopy } from '@/lib/group-member-policy';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization';
import type { GroupMember } from '@/store/group-store';

export const MemberRow = ({
  actionHint,
  actionLabel,
  busy,
  lockedReason,
  member,
  onPress,
  readOnly,
}: {
  actionHint?: string;
  actionLabel?: string;
  busy: boolean;
  lockedReason: string | null | undefined;
  member: GroupMember;
  onPress: () => void;
  readOnly: boolean;
}) => {
  const { t } = useTranslation();
  const memberNameLines = useLargeTypeLineLimit(1);

  return (
    <Pressable
      accessibilityHint={
        actionHint ||
        lockedReason ||
        (readOnly
          ? t('groups.admin.member_readonly_hint')
          : t('groups.admin.member_hint'))
      }
      accessibilityLabel={
        actionLabel ??
        t(
          readOnly ? 'groups.admin.view_member' : 'groups.admin.manage_member',
          {
            member: getMemberName(member),
          }
        )
      }
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.memberRow,
        busy && styles.disabledRow,
        pressed && !busy && styles.pressed,
      ]}
    >
      <Avatar
        borderColor={mentaColors.border}
        borderWidth={StyleSheet.hairlineWidth}
        name={getMemberName(member)}
        showBorder
        size={40}
        source={member.avatarUrl ? { uri: member.avatarUrl } : undefined}
      />
      <View style={styles.memberCopy}>
        <Text numberOfLines={memberNameLines} style={styles.memberName}>
          {getMemberName(member)}
        </Text>
        <Text style={styles.memberRole}>
          {groupMemberRoleCopy[member.role]}
        </Text>
      </View>
      <View style={styles.memberTrailing}>
        {!actionLabel && (lockedReason || readOnly) ? (
          <Text style={styles.locked}>{t('groups.admin.locked')}</Text>
        ) : busy ? (
          <Text style={styles.locked}>{t('groups.admin.updating')}</Text>
        ) : (
          <MoreVerticalIcon color={mentaColors.text.secondary} size={20} />
        )}
      </View>
    </Pressable>
  );
};

export const MembersSkeleton = () => {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('groups.admin.loading_members')}
      accessibilityRole="progressbar"
      style={styles.skeleton}
    >
      <GroupSectionHeader label={t('groups.admin.members')} />
      <GroupSkeletonRows rows={5} />
    </View>
  );
};

export const MemberState = ({
  actionLabel,
  detail,
  onAction,
  title,
  tone = 'neutral',
}: {
  actionLabel: string;
  detail: string;
  onAction: () => void;
  title: string;
  tone?: GroupStatusTone;
}) => (
  <GroupStatePanel
    actionLabel={actionLabel}
    detail={detail}
    onAction={onAction}
    title={title}
    tone={tone}
  />
);

const styles = StyleSheet.create({
  memberRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 72,
    paddingHorizontal: mentaSpacing[4],
  },
  memberCopy: { flex: 1, gap: mentaSpacing[1], minWidth: 0 },
  memberName: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  memberRole: { ...mentaTypography.label, color: mentaColors.text.secondary },
  memberTrailing: {
    alignItems: 'flex-end',
    flexShrink: 0,
    justifyContent: 'center',
    width: 44,
  },
  locked: {
    ...mentaTypography.micro,
    color: mentaColors.text.secondary,
    fontFamily: mentaTypography.bodySemibold.fontFamily,
  },
  skeleton: { gap: mentaSpacing[3] },
  disabledRow: { opacity: 0.56 },
  pressed: { opacity: 0.76 },
});
