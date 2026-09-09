import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GroupAccountabilityBoard } from '@/components/group/GroupAccountabilityBoard';
import { TodayProofSection } from '@/components/home/TodayProofSection';
import { TransactionHistory } from '@/components/momenta/TransactionHistory';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppListRow } from '@/components/ui/AppShell';
import { MentaMascot } from '@/components/ui/MentaMascot';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  APP_STORE_CAPTURE_DEVICE,
  getAppStoreCaptureCandidate,
  type AppStoreCaptureCandidateId,
} from '@/lib/app-store-capture-registry';
import { buildGroupAccountabilitySnapshot } from '@/lib/loop/group-accountability-board';
import type { TodaysSubmission } from '@/store/group-store';
import type { MomentaTransaction } from '@/store/momenta-store';

const noOp = () => undefined;

const todayProofFixture: TodaysSubmission = {
  id: 'capture-today-proof-due',
  challengeId: 'capture-walk-after-work',
  groupName: 'Solo',
  challengeTitle: 'Walk for 20 minutes after work',
  dayNumber: 4,
  totalDays: 14,
  memberCount: 1,
  submissionType: 'photo',
  isUrgent: true,
  timeRemaining: 'Due today at 9:00 pm',
  hasSubmittedToday: false,
  submissionStatus: 'not_submitted',
  isSolo: true,
};

const groupSnapshotFixture = buildGroupAccountabilitySnapshot({
  members: [
    { userId: 'capture-you', name: 'You', isCurrentUser: true },
    { userId: 'capture-maya', name: 'Maya', isCurrentUser: false },
    { userId: 'capture-jordan', name: 'Jordan', isCurrentUser: false },
  ],
  submissions: [
    {
      id: 'capture-maya-pending',
      userId: 'capture-maya',
      status: 'pending',
      mediaType: 'photo',
      submittedAt: '2026-08-06T08:30:00.000Z',
    },
    {
      id: 'capture-jordan-approved',
      userId: 'capture-jordan',
      status: 'approved',
      mediaType: 'photo',
      submittedAt: '2026-08-06T08:00:00.000Z',
    },
  ],
});

const momentaLedgerFixture: readonly MomentaTransaction[] = [
  {
    id: 'capture-momenta-earned',
    user_id: 'capture-user',
    amount: 12,
    transaction_type: 'earned',
    description: 'Promise completed',
  },
  {
    id: 'capture-momenta-review',
    user_id: 'capture-user',
    amount: 8,
    transaction_type: 'earned',
    description: 'Fair review',
  },
  {
    id: 'capture-momenta-protection',
    user_id: 'capture-user',
    amount: -80,
    transaction_type: 'spent',
    description: 'Streak protection',
  },
];

type CaptureSurfaceProps = {
  candidateId: AppStoreCaptureCandidateId;
  children: React.ReactNode;
};

const CaptureSurface = ({ candidateId, children }: CaptureSurfaceProps) => {
  const candidate = getAppStoreCaptureCandidate(candidateId);

  return (
    <View
      accessible
      accessibilityLabel={candidate.accessibilityLabel}
      style={styles.surface}
      testID={`app-store-capture-${candidate.id.toLowerCase()}`}
    >
      {children}
    </View>
  );
};

const CaptureEyebrow = ({ children }: { children: string }) => (
  <Text style={styles.eyebrow}>{children}</Text>
);

const CaptureTitle = ({ children }: { children: string }) => (
  <Text style={styles.title}>{children}</Text>
);

const CandidateBoundary = ({
  candidateId,
}: {
  candidateId: AppStoreCaptureCandidateId;
}) => (
  <View
    accessible
    accessibilityLabel={
      getAppStoreCaptureCandidate(candidateId).fixtureBoundary
    }
    accessibilityRole="text"
    testID={`app-store-capture-${candidateId.toLowerCase()}-boundary`}
  />
);

const TodayProofDueCapture = () => (
  <CaptureSurface candidateId="ASC-01">
    <View style={styles.topRow}>
      <Text style={styles.topTitle}>Today</Text>
      <AppButton
        accessibilityLabel="Create a new promise"
        haptic={false}
        onPress={noOp}
        size="small"
        title="New"
        variant="outline"
      />
    </View>
    <View style={styles.dueRow}>
      <CaptureEyebrow>THURSDAY 6 AUGUST</CaptureEyebrow>
      <Text style={styles.dueLabel}>DUE TODAY · 9:00 PM</Text>
    </View>
    <View style={styles.mascotHero}>
      <MentaMascot size="hero" state="today-proof-due" />
    </View>
    <CaptureTitle>Walk for 20 minutes after work.</CaptureTitle>
    <Text style={styles.bodyCentered}>
      Add the photo you agreed on. It stays private to this promise and its
      reviewer.
    </Text>
    <AppButton
      accessibilityLabel="Add proof photo to this promise"
      fullWidth
      haptic={false}
      onPress={noOp}
      size="large"
      title="Add proof photo"
      variant="accent"
    />
    <TodayProofSection
      onOpenSubmittedProof={noOp}
      onStartSolo={noOp}
      onSubmitProof={noOp}
      submissions={[todayProofFixture]}
    />
    <CandidateBoundary candidateId="ASC-01" />
  </CaptureSurface>
);

const PromiseReviewCapture = () => (
  <CaptureSurface candidateId="ASC-02">
    <CaptureEyebrow>PROMISE REVIEW</CaptureEyebrow>
    <CaptureTitle>Know what counts before you commit.</CaptureTitle>
    <Text style={styles.body}>
      Menta turns a vague intention into one clear promise, one proof rule and
      one safe review path.
    </Text>
    <AppCard padding={mentaSpacing[4]} variant="content">
      <AppListRow
        meta="PROMISE"
        showChevron={false}
        subtitle="Run 5 km before 8 am"
        title="One clear commitment"
      />
      <AppListRow
        meta="PROOF RULE"
        showChevron={false}
        subtitle="GPS summary or finish photo"
        title="Evidence to look for"
      />
      <AppListRow
        meta="REVIEW"
        showChevron={false}
        showDivider={false}
        subtitle="One trusted person"
        title="A named decision-maker"
      />
    </AppCard>
    <View style={styles.fill} />
    <AppButton
      fullWidth
      haptic={false}
      onPress={noOp}
      size="large"
      title="Create with clarity"
      variant="accent"
    />
    <CandidateBoundary candidateId="ASC-02" />
  </CaptureSurface>
);

const GroupAccountabilityCapture = () => (
  <CaptureSurface candidateId="ASC-03">
    <View style={styles.groupHeader}>
      <View>
        <Text style={styles.groupName}>Morning Miles</Text>
        <CaptureEyebrow>MEMBER</CaptureEyebrow>
      </View>
      <Text style={styles.memberCount}>3 members</Text>
    </View>
    <GroupAccountabilityBoard
      groupName="Morning Miles"
      memberCount={3}
      onOpenReview={noOp}
      onSubmitProof={noOp}
      promiseDescription="Walk outside for 20 minutes after work · due 8:30 pm"
      promiseTitle="After-work walk"
      roleLabel="Member"
      showHeader={false}
      snapshot={groupSnapshotFixture}
      state="active-member"
    />
    <CandidateBoundary candidateId="ASC-03" />
  </CaptureSurface>
);

const HumanReviewCapture = () => (
  <CaptureSurface candidateId="ASC-04">
    <CaptureEyebrow>HUMAN REVIEW</CaptureEyebrow>
    <CaptureTitle>Accountability without guesswork.</CaptureTitle>
    <Text style={styles.body}>
      The reviewer sees the promise, submitted evidence and exact rule together
      before making a decision.
    </Text>
    <AppCard padding={mentaSpacing[4]} variant="content">
      <AppListRow
        meta="PROMISE"
        showChevron={false}
        subtitle="Morning 5 km"
        title="The commitment"
      />
      <AppListRow
        meta="EVIDENCE"
        showChevron={false}
        subtitle="Run summary · 5.14 km"
        title="What the reviewer inspects"
      />
      <AppListRow
        meta="RULE"
        showChevron={false}
        showDivider={false}
        subtitle="Complete before 8:00 am"
        title="The decision boundary"
      />
    </AppCard>
    <View style={styles.fill} />
    <AppButton
      fullWidth
      haptic={false}
      onPress={noOp}
      size="large"
      title="Open review context"
      variant="success"
    />
    <CandidateBoundary candidateId="ASC-04" />
  </CaptureSurface>
);

const MomentaLedgerCapture = () => (
  <CaptureSurface candidateId="ASC-05">
    <CaptureEyebrow>MOMENTA</CaptureEyebrow>
    <CaptureTitle>Keep momentum visible.</CaptureTitle>
    <Text style={styles.body}>
      Earned, spent and recovery activity remains legible before you decide what
      to do next.
    </Text>
    <TransactionHistory
      showRefresh={false}
      subtitle="Deterministic display fixture, not account history."
      title="Activity"
      transactions={[...momentaLedgerFixture]}
    />
    <View style={styles.fill} />
    <AppButton
      fullWidth
      haptic={false}
      onPress={noOp}
      size="medium"
      title="Earn Momenta"
      variant="outline"
    />
    <AppButton
      fullWidth
      haptic={false}
      onPress={noOp}
      size="medium"
      title="Open shop"
      variant="secondary"
    />
    <CandidateBoundary candidateId="ASC-05" />
  </CaptureSurface>
);

const EventParticipationCapture = () => (
  <CaptureSurface candidateId="ASC-06">
    <View style={styles.eventTopRow}>
      <CaptureEyebrow>EVENT</CaptureEyebrow>
      <Text style={styles.liveLabel}>Participation route</Text>
    </View>
    <AppCard padding={mentaSpacing[5]} variant="gradient">
      <CaptureEyebrow>RUN CLUB · PUBLIC</CaptureEyebrow>
      <Text style={styles.eventTitle}>Harbour Run Club</Text>
      <Text style={styles.eventDate}>THU · 6:15–7:30 PM</Text>
      <Text style={styles.eventLocation}>Silo Park, Wynyard Quarter</Text>
    </AppCard>
    <View style={styles.eventStatRow}>
      <Text style={styles.body}>48 going · 12 posted</Text>
      <Text style={styles.successLabel}>Live album</Text>
    </View>
    <CaptureEyebrow>HOW PARTICIPATION WORKS</CaptureEyebrow>
    <Text style={styles.body}>
      Check in at the event, then share one photo. The organiser can only review
      media from checked-in attendees.
    </Text>
    <View style={styles.fill} />
    <View style={styles.eventActions}>
      <AppButton
        haptic={false}
        onPress={noOp}
        size="medium"
        title="Directions"
        variant="outline"
      />
      <AppButton
        haptic={false}
        onPress={noOp}
        size="medium"
        title="Join event"
        variant="accent"
      />
    </View>
    <CandidateBoundary candidateId="ASC-06" />
  </CaptureSurface>
);

export const AppStoreCandidateCapture = ({
  candidateId,
}: {
  candidateId: AppStoreCaptureCandidateId;
}) => {
  if (!__DEV__) return null;

  switch (candidateId) {
    case 'ASC-01':
      return <TodayProofDueCapture />;
    case 'ASC-02':
      return <PromiseReviewCapture />;
    case 'ASC-03':
      return <GroupAccountabilityCapture />;
    case 'ASC-04':
      return <HumanReviewCapture />;
    case 'ASC-05':
      return <MomentaLedgerCapture />;
    case 'ASC-06':
      return <EventParticipationCapture />;
  }

  return null;
};

const styles = StyleSheet.create({
  surface: {
    backgroundColor: mentaColors.canvas,
    gap: mentaSpacing[4],
    height: APP_STORE_CAPTURE_DEVICE.height,
    overflow: 'hidden',
    padding: mentaLayout.screenInset,
    width: APP_STORE_CAPTURE_DEVICE.width,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  dueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.secondary,
  },
  dueLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.action,
  },
  mascotHero: {
    alignItems: 'center',
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    height: 224,
    justifyContent: 'center',
  },
  title: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  body: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  bodyCentered: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    textAlign: 'center',
  },
  fill: { flex: 1 },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupName: {
    ...mentaTypography.control,
    color: mentaColors.text.primary,
  },
  memberCount: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  eventTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveLabel: {
    ...mentaTypography.caption,
    color: mentaColors.success,
  },
  eventTitle: {
    ...mentaTypography.display,
    color: mentaColors.text.primary,
    marginTop: mentaSpacing[8],
  },
  eventDate: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
    marginTop: mentaSpacing[4],
  },
  eventLocation: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[1],
  },
  eventStatRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: mentaSpacing[3],
  },
  successLabel: {
    ...mentaTypography.caption,
    color: mentaColors.success,
  },
  eventActions: {
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
});
