import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, SkeletonLoader } from '@/components/ui';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  GROUPS_ADMIN_ARCHIVE_PAPER_STATES,
  type GroupsAdminArchivePaperState,
  type GroupsAdminArchivePaperStateId,
} from '@/lib/paper-state-registry/groups-admin-archive';

export type GroupsAdminArchiveGalleryAction =
  | 'back_to_groups'
  | 'discard_changes'
  | 'keep_editing'
  | 'open_archived_group'
  | 'retry_archive'
  | 'review_changes';

type Props = {
  states?: readonly GroupsAdminArchivePaperState[];
  onAction?: (action: {
    id: GroupsAdminArchiveGalleryAction;
    paperId: GroupsAdminArchivePaperStateId;
  }) => void;
};

/**
 * Development-only, family-scoped Paper harness. It is intentionally not an
 * Expo route and ships no sample members, settings, or archive records into a
 * production path.
 */
export const GroupsAdminArchiveFamilyGallery = ({
  states = GROUPS_ADMIN_ARCHIVE_PAPER_STATES,
  onAction,
}: Props) => {
  if (!__DEV__) return null;

  return (
    <View style={styles.gallery} testID="groups-admin-archive-family-gallery">
      {states.map(state => (
        <GroupsAdminArchiveStatePreview
          key={state.paperId}
          onAction={onAction}
          state={state}
        />
      ))}
    </View>
  );
};

export const GroupsAdminArchiveStatePreview = ({
  state,
  onAction,
}: {
  state: GroupsAdminArchivePaperState;
  onAction?: Props['onAction'];
}) => (
  <View
    accessibilityLabel={`${state.title}. ${state.sourceOfTruth}`}
    style={styles.state}
    testID={`groups-admin-archive-paper-${state.paperId}`}
  >
    <RouteHeader
      subtitle={
        state.route === '/archived-groups' ? undefined : 'Morning Miles'
      }
      title={
        state.route === '/group-members'
          ? 'Members'
          : state.route === '/group-settings'
            ? 'Group settings'
            : 'Archived groups'
      }
    />
    {renderState(state, onAction)}
  </View>
);

const renderState = (
  state: GroupsAdminArchivePaperState,
  onAction?: Props['onAction']
) => {
  switch (state.kind) {
    case 'members-skeleton':
      return <MembersSkeleton />;
    case 'members-manage':
      return <MembersPreview manage />;
    case 'members-view':
      return <MembersPreview manage={false} />;
    case 'settings-skeleton':
      return <SettingsSkeleton />;
    case 'settings':
      return <SettingsPreview />;
    case 'unsaved':
      return (
        <ActionState
          detail="Your edits have not been saved."
          primary="Keep editing"
          primaryAction="keep_editing"
          secondary="Discard changes"
          secondaryAction="discard_changes"
          state={state}
          title="Discard changes?"
          onAction={onAction}
        />
      );
    case 'saving':
      return <SavingPreview />;
    case 'save-failed':
      return (
        <ActionState
          detail="Your edits are still here."
          primary="Review changes"
          primaryAction="review_changes"
          secondary="Keep current values"
          state={state}
          title="Changes weren't saved"
          onAction={onAction}
        />
      );
    case 'archive-skeleton':
      return <ArchiveSkeleton />;
    case 'archive-list':
      return <ArchiveList state={state} onAction={onAction} />;
    case 'archive-empty':
      return (
        <ActionState
          detail="Groups you archive or finish will appear here."
          primary="Back to Groups"
          primaryAction="back_to_groups"
          state={state}
          title="No archived groups"
          onAction={onAction}
        />
      );
    case 'archive-unavailable':
      return (
        <ActionState
          detail="Nothing changed. Try again when your connection is stable."
          primary="Try again"
          primaryAction="retry_archive"
          secondary="Back to Groups"
          secondaryAction="back_to_groups"
          state={state}
          title="Archived groups couldn't load"
          onAction={onAction}
        />
      );
  }
};

const RouteHeader = ({
  subtitle,
  title,
}: {
  subtitle?: string;
  title: string;
}) => (
  <View style={styles.header}>
    <View style={styles.headerBack} />
    <View style={styles.headerCopy}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

const MembersSkeleton = () => (
  <View accessibilityRole="progressbar" style={styles.body}>
    <SkeletonLoader height={14} width={116} />
    {[120, 129, 138, 147, 156].map((nameWidth, index) => (
      <View key={nameWidth} style={styles.memberRow}>
        <SkeletonLoader
          announce={index === 0}
          borderRadius={mentaRadii.round}
          height={40}
          width={40}
        />
        <View style={styles.memberCopy}>
          <SkeletonLoader announce={false} height={13} width={nameWidth} />
          <SkeletonLoader announce={false} height={10} width={62} />
        </View>
        <SkeletonLoader announce={false} height={12} width={44} />
      </View>
    ))}
  </View>
);

const MembersPreview = ({ manage }: { manage: boolean }) => (
  <View style={styles.body}>
    <MemberSection label="OWNER" manage={manage} members={['Maya']} />
    <MemberSection label="ADMINS" manage={manage} members={['Jordan']} />
    <MemberSection
      label="MEMBERS"
      manage={manage}
      members={['Ari', 'Noah', 'Sam']}
    />
  </View>
);

const MemberSection = ({
  label,
  manage,
  members,
}: {
  label: string;
  manage: boolean;
  members: readonly string[];
}) => (
  <View style={styles.listSection}>
    <View style={styles.listHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {label === 'OWNER' && manage ? (
        <Text style={styles.actionText}>Invite people</Text>
      ) : null}
    </View>
    {members.map(member => (
      <View key={member} style={styles.memberRow}>
        <View style={styles.avatar} />
        <View style={styles.memberCopy}>
          <Text style={styles.rowTitle}>{member}</Text>
          <Text style={styles.rowLabel}>
            {label === 'MEMBERS' ? 'MEMBER' : label.slice(0, -1)}
          </Text>
        </View>
        <View style={styles.trailingLane}>
          {member === 'Maya' ? (
            <Text style={styles.locked}>Locked</Text>
          ) : manage ? (
            <Text style={styles.more}>•••</Text>
          ) : (
            <View style={styles.lockedPlaceholder} />
          )}
        </View>
      </View>
    ))}
  </View>
);

const SettingsSkeleton = () => (
  <View accessibilityRole="progressbar" style={styles.body}>
    {[78, 62, 62, 62, 62].map((height, index) => (
      <View key={`${height}-${index}`} style={styles.skeletonSection}>
        <SkeletonLoader
          announce={index === 0}
          height={11}
          width={84 + index * 6}
        />
        <SkeletonLoader
          announce={false}
          borderRadius={mentaRadii.medium}
          height={height}
        />
      </View>
    ))}
    <SkeletonLoader
      announce={false}
      borderRadius={mentaRadii.large}
      height={56}
    />
  </View>
);

const SettingsPreview = () => (
  <View style={styles.body}>
    <SettingsSection label="DETAILS" rows={[['Morning Miles', '']]} />
    <SettingsSection
      label="WHO CAN JOIN"
      rows={[
        [
          'Public',
          'Listed in Discover. People preview before joining.',
          'Selected',
        ],
      ]}
    />
    <SettingsSection
      label="REVIEW REMINDERS"
      rows={[
        ['Eligible review reminders', 'OS permission remains separate.', 'On'],
      ]}
    />
    <SettingsSection
      label="INVITATIONS"
      rows={[
        ['Manage invite', '', 'Active'],
        ['Members', '', '8 people'],
      ]}
    />
    <SettingsSection
      label="GROUP"
      rows={[
        ['Archive or leave group', ''],
        ['Delete group', ''],
      ]}
    />
    <AppButton
      disabled
      fullWidth
      onPress={() => undefined}
      title="Save changes"
    />
  </View>
);

const SettingsSection = ({
  label,
  rows,
}: {
  label: string;
  rows: readonly (readonly string[])[];
}) => (
  <View style={styles.listSection}>
    <Text style={styles.sectionLabel}>{label}</Text>
    {rows.map(([title, detail, value]) => (
      <View key={title} style={styles.settingsRow}>
        <View style={styles.memberCopy}>
          <Text style={styles.rowTitle}>{title}</Text>
          {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
        </View>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
    ))}
  </View>
);

const SavingPreview = () => (
  <View style={styles.actionState}>
    <Text style={styles.savingCopy}>Saving the changed group settings</Text>
    <SettingsSection label="WHO CAN JOIN" rows={[['Invite only', '']]} />
    <SettingsSection label="REVIEW REMINDERS" rows={[['Off', '']]} />
    <Text style={styles.rowDetail}>
      Controls unlock when Menta confirms the change.
    </Text>
    <AppButton
      disabled
      fullWidth
      loading
      onPress={() => undefined}
      title="Saving…"
    />
  </View>
);

const ArchiveSkeleton = () => (
  <View accessibilityRole="progressbar" style={styles.body}>
    {[130, 140, 150, 160].map((width, index) => (
      <View key={width} style={styles.archiveSkeletonRow}>
        <SkeletonLoader
          announce={index === 0}
          borderRadius={mentaRadii.medium}
          height={44}
          width={44}
        />
        <View style={styles.memberCopy}>
          <SkeletonLoader announce={false} height={13} width={width} />
          <SkeletonLoader announce={false} height={10} width={112} />
        </View>
      </View>
    ))}
  </View>
);

const ArchiveList = ({
  state,
  onAction,
}: {
  state: GroupsAdminArchivePaperState;
  onAction?: Props['onAction'];
}) => (
  <View style={styles.body}>
    {[
      ['Winter Steps', 'Archived 28 July · 12 approved days'],
      ['Study Before Scroll', 'Ended 14 July · 9 approved days'],
      ['Water Before Coffee', 'Archived 30 June · 21 approved days'],
    ].map(([title, detail]) => (
      <AppButton
        fullWidth
        key={title}
        onPress={() =>
          onAction?.({ id: 'open_archived_group', paperId: state.paperId })
        }
        style={styles.archiveButton}
        textStyle={styles.archiveButtonText}
        title={`${title}\n${detail}\nREAD-ONLY`}
        variant="outline"
      />
    ))}
  </View>
);

const ActionState = ({
  detail,
  onAction,
  primary,
  primaryAction,
  secondary,
  secondaryAction,
  state,
  title,
}: {
  detail: string;
  onAction?: Props['onAction'];
  primary: string;
  primaryAction: GroupsAdminArchiveGalleryAction;
  secondary?: string;
  secondaryAction?: GroupsAdminArchiveGalleryAction;
  state: GroupsAdminArchivePaperState;
  title: string;
}) => (
  <View style={styles.actionState}>
    <View style={styles.stateIcon}>
      <Text style={styles.stateIconText}>!</Text>
    </View>
    <View style={styles.stateCopy}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDetail}>{detail}</Text>
    </View>
    <AppButton
      fullWidth
      onPress={() => onAction?.({ id: primaryAction, paperId: state.paperId })}
      title={primary}
    />
    {secondary && secondaryAction ? (
      <AppButton
        fullWidth
        onPress={() =>
          onAction?.({ id: secondaryAction, paperId: state.paperId })
        }
        title={secondary}
        variant="ghost"
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  gallery: {
    alignSelf: 'center',
    gap: mentaSpacing[8],
    maxWidth: mentaLayout.focusedLane,
    width: '100%',
  },
  state: {
    backgroundColor: mentaColors.canvas,
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[8],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    height: 72,
  },
  headerBack: {
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    height: mentaLayout.minimumTouchTarget,
    width: mentaLayout.minimumTouchTarget,
  },
  headerCopy: { flex: 1, gap: 1 },
  headerTitle: { ...mentaTypography.control, color: mentaColors.text.primary },
  headerSubtitle: {
    ...mentaTypography.label,
    color: mentaColors.text.secondary,
  },
  body: { gap: mentaSpacing[3] },
  listSection: { gap: mentaSpacing[2] },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.primary,
  },
  actionText: {
    ...mentaTypography.caption,
    color: mentaColors.action,
    fontFamily: mentaTypography.bodySemibold.fontFamily,
  },
  memberRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 64,
  },
  avatar: {
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    width: 40,
  },
  memberCopy: { flex: 1, gap: mentaSpacing[1] },
  rowTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  rowLabel: { ...mentaTypography.label, color: mentaColors.text.secondary },
  rowDetail: { ...mentaTypography.caption, color: mentaColors.text.secondary },
  trailingLane: { alignItems: 'flex-end', width: 56 },
  locked: {
    ...mentaTypography.micro,
    color: mentaColors.text.secondary,
    fontFamily: mentaTypography.bodySemibold.fontFamily,
  },
  lockedPlaceholder: {
    backgroundColor: mentaColors.raised,
    borderRadius: mentaRadii.small,
    height: 12,
    width: 56,
  },
  more: { ...mentaTypography.bodySemibold, color: mentaColors.text.secondary },
  skeletonSection: { gap: mentaSpacing[2] },
  settingsRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 62,
  },
  rowValue: { ...mentaTypography.caption, color: mentaColors.text.secondary },
  savingCopy: {
    ...mentaTypography.bodyMedium,
    color: mentaColors.text.primary,
  },
  archiveSkeletonRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    height: 82,
  },
  archiveButton: {
    alignItems: 'flex-start',
    minHeight: 88,
    paddingHorizontal: mentaSpacing[3],
  },
  archiveButtonText: {
    ...mentaTypography.caption,
    color: mentaColors.text.primary,
    textAlign: 'left',
  },
  actionState: {
    gap: mentaSpacing[4],
    minHeight: 390,
    paddingTop: mentaSpacing[8],
  },
  stateIcon: {
    alignItems: 'center',
    backgroundColor: mentaColors.dangerSoft,
    borderColor: mentaColors.danger,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  stateIconText: { ...mentaTypography.title, color: mentaColors.danger },
  stateCopy: { gap: mentaSpacing[2] },
  stateTitle: { ...mentaTypography.heading, color: mentaColors.text.primary },
  stateDetail: { ...mentaTypography.body, color: mentaColors.text.secondary },
});
