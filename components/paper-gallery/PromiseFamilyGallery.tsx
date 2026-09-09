import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppFieldRow, AppScreen } from '@/components/ui';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { GroupInviteQRCode } from '@/components/group/GroupInviteQRCode';
import {
  FirstGroupCreatedReceipt,
  GroupTemplatePickerSheet,
} from '@/components/groups/GroupCreationStates';
import {
  JoinConfirmedReceiptState,
  JoinFundingReviewState,
  JoinInsufficientMomentaState,
  JoinResultUnknownRuntimeState,
} from '@/components/challenge/JoinFundingStates';
import {
  CreateTabBridgeState,
  GroupModeNoGroupState,
  NotificationEducationState,
  PromiseCompleteState,
  PromiseDetailSkeletonState,
  PromiseHistoryState,
  PromiseRulesState,
  PromiseUnavailableState,
  PromiseWaitingReviewState,
  ReferralBridgeState,
  SoloChallengesEmptyState,
  SoloChallengesLoadingState,
  type PromiseHistoryEntry,
  type PromiseRuleRow,
} from '@/components/challenge/promise-runtime-states';

// Gallery-only contract: production components never import Paper registries.
export { JOIN_FUNDING_RUNTIME_STATES } from '@/lib/paper-state-registry/join-funding';

type FamilyFrameProps = {
  children: React.ReactNode;
  testID: string;
  scrollable?: boolean;
};

const FamilyFrame = ({
  children,
  testID,
  scrollable = true,
}: FamilyFrameProps) => (
  <AppScreen
    lane="working"
    testID={testID}
    safeArea
    scrollable={scrollable}
    padding={false}
    style={styles.screen}
    contentContainerStyle={styles.contentLane}
  >
    {children}
  </AppScreen>
);

type FamilyHeadingProps = {
  cue?: string;
  title: string;
  description?: string;
};

const FamilyHeading = ({ cue, title, description }: FamilyHeadingProps) => (
  <View style={styles.headingBlock}>
    {cue ? <Text style={styles.cue}>{cue}</Text> : null}
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>
);

const PaperReceiptLabel = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.paperReceiptLabel}>{children}</Text>
);

type PaperReceiptRowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  showDivider?: boolean;
};

const PaperReceiptRow = ({
  title,
  subtitle,
  value,
  showDivider = true,
}: PaperReceiptRowProps) => (
  <View
    style={[
      styles.paperReceiptRow,
      showDivider ? styles.paperReceiptDivider : null,
    ]}
  >
    <View style={styles.paperReceiptCopy}>
      <Text style={styles.paperReceiptTitle}>{title}</Text>
      {subtitle ? (
        <Text style={styles.paperReceiptSubtitle}>{subtitle}</Text>
      ) : null}
    </View>
    {value ? <Text style={styles.paperReceiptValue}>{value}</Text> : null}
  </View>
);

const ActionStack = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.actionStack}>{children}</View>
);

const RuntimeGalleryState = ({
  stateId,
  children,
}: {
  stateId: PromiseFamilyStateId;
  children: React.ReactNode;
}) => (
  <View
    testID={`promise-family-${stateId}`}
    style={galleryStyles.runtimeStateFrame}
  >
    {children}
  </View>
);

export const PROMISE_FAMILY_PAPER_STATES = [
  { id: 'CHL-00', paperRoot: 'C83-0', title: 'Solo Challenges Loading' },
  { id: 'CHL-01', paperRoot: 'C84-0', title: 'Solo Challenges Empty' },
  { id: 'CHL-02', paperRoot: 'FBF-0', title: 'Solo Challenge Active' },
  { id: 'CHL-03', paperRoot: 'FBG-0', title: 'Solo Challenge History' },
  { id: 'CHL-04', paperRoot: 'FBH-0', title: 'Solo Challenge Submissions' },
  { id: 'CRT-00', paperRoot: 'C7Z-0', title: 'Create Tab Bridge' },
  {
    id: 'CRT-03',
    paperRoot: 'C82-0',
    title: 'Group Mode No Group Selected',
  },
  { id: 'DTL-00', paperRoot: '2HD-0', title: 'Promise Skeleton' },
  { id: 'DTL-02', paperRoot: '2HF-0', title: 'Waiting For Review' },
  { id: 'DTL-05', paperRoot: '2HI-0', title: 'Proof History' },
  {
    id: 'DTL-06',
    paperRoot: '2HJ-0',
    title: 'Rules Schedule and People',
  },
  { id: 'DTL-07', paperRoot: '2HK-0', title: 'Promise Complete' },
  { id: 'DTL-08', paperRoot: '2HL-0', title: 'Promise Unavailable' },
  { id: 'GRP-08', paperRoot: 'FBI-0', title: 'Group Template Picker' },
  { id: 'GRP-09', paperRoot: 'FBJ-0', title: 'First Group Created' },
  { id: 'GRP-10', paperRoot: 'FBK-0', title: 'Group Promise Ready' },
  {
    id: 'JOIN-00',
    paperRoot: 'FL1-0',
    title: 'Join Funding',
  },
  {
    id: 'JOIN-01',
    paperRoot: 'FL2-0',
    title: 'Insufficient Momenta',
  },
  {
    id: 'JOIN-02',
    paperRoot: 'GTW-0',
    title: 'Join Confirmed',
  },
  {
    id: 'JOIN-03',
    paperRoot: 'GTX-0',
    title: 'Join Result Unknown',
  },
  {
    id: 'NTF-00',
    paperRoot: 'FL0-0',
    title: 'Notification Education',
  },
  { id: 'REF-00', paperRoot: 'FL3-0', title: 'Referral Bridge' },
  { id: 'QR-00', paperRoot: 'FL4-0', title: 'Group Invite QR Sheet' },
] as const;

export type PromiseFamilyStateId =
  (typeof PROMISE_FAMILY_PAPER_STATES)[number]['id'];

const paperWeek = [
  { label: 'M', state: 'past' },
  { label: 'T', state: 'past' },
  { label: 'W', state: 'today' },
  { label: 'T', state: 'future' },
  { label: 'F', state: 'future' },
  { label: 'S', state: 'future' },
  { label: 'S', state: 'future' },
] as const;

export const PROMISE_FAMILY_GALLERY_FIXTURES = {
  history: [
    {
      id: 'today',
      dayLabel: 'TODAY',
      timeLabel: 'Waiting for Eli',
      detail: 'Photo',
      reviewerName: 'Eli',
      status: 'waiting',
    },
    {
      id: 'tuesday',
      dayLabel: 'TUESDAY',
      timeLabel: '8:34 pm',
      detail: 'Photo approved',
      reviewerName: 'Eli',
      status: 'approved',
    },
    {
      id: 'monday',
      dayLabel: 'MONDAY',
      timeLabel: '8:29 pm',
      detail: 'Photo approved',
      reviewerName: 'Mika',
      status: 'approved',
    },
    {
      id: 'sunday',
      dayLabel: 'SUNDAY',
      timeLabel: '8:41 pm',
      detail: 'Eli asked for a clearer angle',
      status: 'needs-retry',
    },
  ] satisfies readonly PromiseHistoryEntry[],
  rules: [
    { label: 'Schedule', value: 'Every day · 9:00 pm' },
    { label: 'Review', value: 'You review your own proof' },
    { label: 'Visibility', value: 'Only you' },
    { label: 'Length', value: '14 days' },
    { label: 'Reminder', value: 'Off' },
    { label: 'People', value: 'Just you' },
  ] satisfies readonly PromiseRuleRow[],
} as const;

export type PromiseFamilyGalleryStateProps = {
  stateId: PromiseFamilyStateId;
};

const SoloChallengeActiveGalleryState = () => (
  <FamilyFrame testID="promise-family-CHL-02">
    <FamilyHeading
      cue="Solo challenge"
      title="Walk outside for 20 minutes after work."
      description="Day 6 of 14. Proof is due tonight."
    />
    <View style={styles.rowList}>
      <AppFieldRow title="Today" value="Proof due" showChevron={false} />
      <AppFieldRow
        title="Current streak"
        value="5 days"
        showChevron={false}
        showDivider={false}
      />
    </View>
    <ActionStack>
      <AppButton title="Submit today’s proof" onPress={() => undefined} />
      <AppButton
        title="Open challenge"
        onPress={() => undefined}
        variant="secondary"
      />
    </ActionStack>
  </FamilyFrame>
);

const SoloChallengeHistoryGalleryState = () => (
  <FamilyFrame testID="promise-family-CHL-03">
    <FamilyHeading
      cue="Solo challenges"
      title="Past challenges"
      description="Open a challenge to see its final proof record."
    />
    <View style={styles.rowList}>
      <AppFieldRow
        title="Morning pages"
        subtitle="Completed · 14 of 14 days"
        value="Complete"
        showChevron={false}
      />
      <AppFieldRow
        title="Walk after work"
        subtitle="Ended 28 July"
        value="12 / 14"
        showChevron={false}
        showDivider={false}
      />
    </View>
    <AppButton
      title="Back to active challenges"
      onPress={() => undefined}
      variant="secondary"
    />
  </FamilyFrame>
);

const SoloChallengeSubmissionsGalleryState = () => (
  <FamilyFrame testID="promise-family-CHL-04">
    <FamilyHeading
      cue="14-day challenge"
      title="Walk outside after work."
      description="Your latest proof and review results."
    />
    <View style={styles.receiptBlock}>
      <PaperReceiptLabel>RECENT PROOF</PaperReceiptLabel>
      <PaperReceiptRow
        title="Today · 8:36 pm"
        subtitle="Photo proof"
        value="Waiting"
      />
      <PaperReceiptRow
        title="Yesterday · 8:41 pm"
        subtitle="Clearer angle requested"
        value="Correction"
      />
      <PaperReceiptRow
        title="Monday · 7:58 pm"
        subtitle="Photo approved"
        value="Accepted"
        showDivider={false}
      />
    </View>
    <AppButton title="View correction" onPress={() => undefined} fullWidth />
  </FamilyFrame>
);

const GroupTemplatePickerGalleryState = () => (
  <View
    style={galleryStyles.galleryOverlayFrame}
    testID="promise-family-GRP-08"
  >
    <FamilyFrame testID="promise-family-GRP-08-background" scrollable={false}>
      <FamilyHeading
        cue="Create a group"
        title="Choose a starting point."
        description="A template fills in the draft. You can change it before creating the group."
      />
    </FamilyFrame>
    <GroupTemplatePickerSheet
      visible
      onClose={() => undefined}
      onSelect={() => undefined}
    />
  </View>
);

const FirstGroupCreatedGalleryState = () => (
  <FamilyFrame testID="promise-family-GRP-09">
    <FirstGroupCreatedReceipt
      groupName="Morning Miles"
      onInvitePeople={() => undefined}
      onCreateGroupPromise={() => undefined}
      onOpenGroup={() => undefined}
    />
  </FamilyFrame>
);

const GroupPromiseReadyGalleryState = () => (
  <FamilyFrame testID="promise-family-GRP-10">
    <FamilyHeading
      cue="Morning Miles"
      title="Morning walk is ready."
      description="Members can now submit and review proof."
    />
    <View style={styles.receiptBlock}>
      <PaperReceiptLabel>GROUP PROMISE RECORD</PaperReceiptLabel>
      <PaperReceiptRow title="Group" value="Morning Miles" />
      <PaperReceiptRow title="Proof" value="Photo" />
      <PaperReceiptRow
        title="Review"
        subtitle="Members review submitted proof"
        value="Saved"
        showDivider={false}
      />
    </View>
    <Text style={styles.description}>No one has been invited yet.</Text>
    <ActionStack>
      <AppButton title="Invite people" onPress={() => undefined} fullWidth />
      <AppButton
        title="Open group"
        onPress={() => undefined}
        variant="secondary"
        fullWidth
      />
    </ActionStack>
  </FamilyFrame>
);

const GroupInviteQrGalleryState = () => (
  <FamilyFrame testID="promise-family-QR-00">
    <FamilyHeading
      cue="Invite people"
      title="Show this QR code in person."
      description="The code stays active until you replace or close this invite."
    />
    <View style={galleryStyles.qrPreview}>
      <GroupInviteQRCode inviteCode="MILES-7K2" size={220} />
    </View>
    <View style={styles.rowList}>
      <AppFieldRow title="Invite code" value="MILES-7K2" showChevron={false} />
      <AppFieldRow
        title="Link status"
        value="Active"
        showChevron={false}
        showDivider={false}
      />
    </View>
    <ActionStack>
      <AppButton title="Share QR" onPress={() => undefined} fullWidth />
      <AppButton
        title="Copy invite"
        onPress={() => undefined}
        variant="secondary"
        fullWidth
      />
    </ActionStack>
  </FamilyFrame>
);

/**
 * Deterministic, non-routed state renderer for the shared development/E2E
 * gallery. Production routes import the same state components with live data.
 */
export const PromiseFamilyGalleryState = ({
  stateId,
}: PromiseFamilyGalleryStateProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const noop = () => undefined;

  switch (stateId) {
    case 'CHL-00':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <SoloChallengesLoadingState />
        </RuntimeGalleryState>
      );
    case 'CHL-01':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <SoloChallengesEmptyState
            onCreateSolo={noop}
            onViewHistory={noop}
            onCreateChallenge={noop}
          />
        </RuntimeGalleryState>
      );
    case 'CHL-02':
      return <SoloChallengeActiveGalleryState />;
    case 'CHL-03':
      return <SoloChallengeHistoryGalleryState />;
    case 'CHL-04':
      return <SoloChallengeSubmissionsGalleryState />;
    case 'CRT-00':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <CreateTabBridgeState
            onCreatePromise={noop}
            onJoinSoloChallenge={noop}
            onStartWithGroup={noop}
            onLearn={noop}
            onBack={noop}
          />
        </RuntimeGalleryState>
      );
    case 'CRT-03':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <GroupModeNoGroupState
            onSelectGroup={noop}
            onCreateGroup={noop}
            onContinueWithoutGroup={noop}
          />
        </RuntimeGalleryState>
      );
    case 'DTL-00':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <PromiseDetailSkeletonState />
        </RuntimeGalleryState>
      );
    case 'DTL-02':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <PromiseWaitingReviewState
            promiseTitle="Walk outside for 20 minutes after work."
            reviewerName="Eli"
            sentLabel="Sent 12 minutes ago"
            proofTitle="End of the walk"
            submittedLabel="Sent today · 8:36 pm"
            week={paperWeek}
            onViewProof={noop}
            onProofHistory={noop}
            onRules={noop}
            onPeople={noop}
          />
        </RuntimeGalleryState>
      );
    case 'DTL-05':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <PromiseHistoryState
            durationLabel="14-day promise"
            promiseTitle="Walk outside for 20 minutes after work."
            entries={PROMISE_FAMILY_GALLERY_FIXTURES.history}
            onLoadEarlier={noop}
          />
        </RuntimeGalleryState>
      );
    case 'DTL-06':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <PromiseRulesState
            promiseTitle="Walk outside for 20 minutes after work."
            proofType="Photo"
            proofDescription="Show the route or the end of the walk."
            rows={PROMISE_FAMILY_GALLERY_FIXTURES.rules}
          />
        </RuntimeGalleryState>
      );
    case 'DTL-07':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <PromiseCompleteState
            record={{
              source: 'server-readback',
              approvedDays: 12,
              totalDays: 14,
              visibility: 'Private',
              reviewerSummary: 'You reviewed your own proof',
            }}
            onShareResult={noop}
            onMakeAnother={noop}
            onBackToToday={noop}
            onProofHistory={noop}
          />
        </RuntimeGalleryState>
      );
    case 'DTL-08':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <PromiseUnavailableState
            hasLocalProof
            onRetry={noop}
            onCheckProofStatus={noop}
            onBackToToday={noop}
            onReportProblem={noop}
          />
        </RuntimeGalleryState>
      );
    case 'GRP-08':
      return <GroupTemplatePickerGalleryState />;
    case 'GRP-09':
      return <FirstGroupCreatedGalleryState />;
    case 'GRP-10':
      return <GroupPromiseReadyGalleryState />;
    case 'JOIN-00':
      return (
        <JoinFundingReviewState
          quote={{
            source: 'server',
            quoteId: '10000000-0000-5000-8000-000000000001',
            challengeId: '10000000-0000-4000-8000-000000000002',
            challengeTitle: 'After-work walkers',
            challengeDescription: 'Walk together after work.',
            groupId: '10000000-0000-4000-8000-000000000003',
            groupName: 'After-work walkers',
            cost: 2,
            availableBalance: 12,
            shortfall: 0,
            eligible: true,
            eligibilityCode: 'ELIGIBLE',
          }}
          joining={false}
          onJoin={noop}
          onMaybeLater={noop}
          onBack={noop}
        />
      );
    case 'JOIN-01':
      return (
        <JoinInsufficientMomentaState
          quote={{
            source: 'server',
            quoteId: '10000000-0000-5000-8000-000000000001',
            challengeId: '10000000-0000-4000-8000-000000000002',
            challengeTitle: 'After-work walkers',
            challengeDescription: 'Walk together after work.',
            groupId: '10000000-0000-4000-8000-000000000003',
            groupName: 'After-work walkers',
            cost: 2,
            availableBalance: 0,
            shortfall: 2,
            eligible: false,
            eligibilityCode: 'INSUFFICIENT_BALANCE',
          }}
          onEarn={noop}
          onKeepCreating={noop}
          onBack={noop}
        />
      );
    case 'JOIN-02':
      return (
        <JoinConfirmedReceiptState
          receipt={{
            source: 'server',
            receiptId: '10000000-0000-4000-8000-000000000004',
            clientEventId: '10000000-0000-4000-8000-000000000005',
            quoteId: '10000000-0000-5000-8000-000000000001',
            challengeId: '10000000-0000-4000-8000-000000000002',
            challengeTitle: 'After-work walkers',
            groupId: '10000000-0000-4000-8000-000000000003',
            groupName: 'After-work walkers',
            joinedAt: '2026-08-06T08:00:00.000Z',
            debitAmount: 2,
            newBalance: 10,
            firstProofTitle: 'Walk after work',
            firstDueAt: '2026-08-07T08:30:00.000Z',
            idempotent: false,
          }}
          firstDueLabel="Fri · 8:30 pm"
          onOpen={noop}
          onBackToToday={noop}
          onBack={noop}
        />
      );
    case 'JOIN-03':
      return (
        <JoinResultUnknownRuntimeState
          checking={false}
          onCheck={noop}
          onBackToSafety={noop}
          onBack={noop}
        />
      );
    case 'NTF-00':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <NotificationEducationState
            enabled={notificationsEnabled}
            onChangeEnabled={setNotificationsEnabled}
            onContinueToPermission={noop}
            onNotNow={noop}
          />
        </RuntimeGalleryState>
      );
    case 'REF-00':
      return (
        <RuntimeGalleryState stateId={stateId}>
          <ReferralBridgeState
            promiseTitle="Walk outside for 20 minutes after work."
            groupSummary="After work walkers · invite only · 1 member."
            onShareInvite={noop}
            onCopyInviteLink={noop}
            onSkip={noop}
          />
        </RuntimeGalleryState>
      );
    case 'QR-00':
      return <GroupInviteQrGalleryState />;
  }
};

const galleryStyles = StyleSheet.create({
  runtimeStateFrame: {
    flex: 1,
    backgroundColor: mentaColors.canvas,
  },
  galleryOverlayFrame: {
    flex: 1,
    backgroundColor: mentaColors.canvas,
  },
  qrPreview: {
    minHeight: 252,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
  },
});

const styles = StyleSheet.create({
  screen: {
    backgroundColor: mentaColors.canvas,
  },
  contentLane: {
    width: '100%',
    maxWidth: mentaLayout.focusedLane + mentaLayout.screenInset * 2,
    alignSelf: 'center',
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[4],
    gap: mentaSpacing[6],
  },
  headingBlock: {
    gap: mentaSpacing[2],
  },
  cue: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  title: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  description: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  actionStack: {
    gap: mentaSpacing[3],
  },
  rowList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  receiptBlock: {
    gap: mentaSpacing[3],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.paper,
    padding: mentaSpacing[4],
  },
  paperReceiptLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.mutedOnPaper,
  },
  paperReceiptRow: {
    minHeight: mentaLayout.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
    paddingVertical: mentaSpacing[2],
  },
  paperReceiptDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.borderPaper,
  },
  paperReceiptCopy: {
    flex: 1,
    gap: mentaSpacing[1],
  },
  paperReceiptTitle: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.onPaper,
  },
  paperReceiptSubtitle: {
    ...mentaTypography.caption,
    color: mentaColors.text.mutedOnPaper,
  },
  paperReceiptValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.onPaper,
    textAlign: 'right',
  },
});
