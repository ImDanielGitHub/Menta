import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OfflineSupportNotice } from '@/components/support/OfflineSupportNotice';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import {
  AppDivider,
  AppListRow,
  AppScreen,
  AppTopBar,
} from '@/components/ui/AppShell';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ChevronRightIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  getSupportSystemPaperState,
  type SupportSystemPaperStateId,
} from '@/lib/paper-state-registry/support-system';

export type SupportSystemFamilyActions = Partial<{
  onBack: () => void;
  onGoHome: () => void;
  onOpenSettings: () => void;
  onNotNow: () => void;
  onRetry: () => void;
  onOpenSupport: () => void;
  onReportIssue: () => void;
}>;

type Props = {
  stateId: SupportSystemPaperStateId;
  actions?: SupportSystemFamilyActions;
  /** Gallery-only examples never become route fallback data. */
  galleryMode?: boolean;
};

const Noop = () => undefined;

const GalleryAction = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  testID,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  testID: string;
}) => (
  <AppButton
    title={title}
    onPress={onPress ?? Noop}
    disabled={disabled}
    fullWidth
    size="large"
    testID={testID}
    variant={variant}
  />
);

const StateHeader = ({
  eyebrow,
  title,
  summary,
  onBack,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  onBack?: () => void;
}) => (
  <View style={styles.header}>
    <Text style={styles.eyebrow}>{eyebrow}</Text>
    <AppTopBar onBack={onBack} />
    <Text accessibilityRole="header" style={styles.displayTitle}>
      {title}
    </Text>
    {summary ? <Text style={styles.summary}>{summary}</Text> : null}
  </View>
);

const QueueFilter = ({
  label,
  selected,
}: {
  label: string;
  selected?: boolean;
}) => (
  <View
    accessibilityRole="tab"
    accessibilityState={{ selected: Boolean(selected) }}
    style={[styles.filter, selected && styles.filterSelected]}
  >
    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
      {label}
    </Text>
  </View>
);

const StatusDot = ({ tone }: { tone: 'warning' | 'success' | 'danger' }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={[styles.statusDot, statusDotStyles[tone]]}
  />
);

const QueueRow = ({
  title,
  detail,
  status,
}: {
  title: string;
  detail: string;
  status: 'warning' | 'success' | 'danger';
}) => (
  <View style={styles.queueRow}>
    <View style={styles.queueStatusLane}>
      <StatusDot tone={status} />
    </View>
    <View style={styles.queueCopy}>
      <Text style={styles.queueTitle}>{title}</Text>
      <Text style={styles.queueDetail}>{detail}</Text>
    </View>
    <View style={styles.trailingLane}>
      <ChevronRightIcon color={mentaColors.text.muted} size={18} />
    </View>
  </View>
);

const AccountLoadingState = () => (
  <View
    accessibilityLabel="Opening your loop. Loading account state."
    accessibilityRole="progressbar"
    style={styles.accountSkeleton}
    testID="support-system-account-loading"
  >
    <SkeletonLoader announce={false} height={12} width={102} />
    <SkeletonLoader announce={false} height={36} width="74%" />
    <SkeletonLoader announce={false} height={16} width="92%" />
    <View style={styles.skeletonRows}>
      {[0, 1, 2].map(row => (
        <View key={row} style={styles.skeletonRow}>
          <SkeletonLoader announce={false} height={14} width="48%" />
          <SkeletonLoader announce={false} height={14} width={48} />
        </View>
      ))}
    </View>
    <Text style={styles.caption}>
      Reduce Motion keeps this loading state still.
    </Text>
  </View>
);

export const SupportSystemFamilyGallery = ({
  stateId,
  actions = {},
  galleryMode = false,
}: Props) => {
  const state = getSupportSystemPaperState(stateId);
  const canUseGallerySamples = __DEV__ && galleryMode;
  const requiresUnavailableContract =
    !canUseGallerySamples &&
    state.id !== 'ADM-01' &&
    (state.authority === 'server-role' || state.authority === 'server-issue');
  const [rejectionTyped, setRejectionTyped] = useState(false);
  const content = useMemo(() => {
    if (requiresUnavailableContract) {
      return (
        <>
          <Text style={styles.body}>
            Menta cannot show this support state until the authoritative
            role-and-issue contract is available for the current session.
          </Text>
          <AppInlineNotice
            title="ROLE OR QUEUE CONTRACT UNAVAILABLE"
            description="No sample report, decision, or receipt is available in production."
            tone="warning"
          />
          <GalleryAction
            disabled
            testID="support-system-contract-action-disabled"
            title="Unavailable"
          />
        </>
      );
    }

    switch (state.kind) {
      case 'admin-checking':
        return (
          <>
            <Text style={styles.body}>
              Menta is confirming your current support role before loading
              customer reports.
            </Text>
            <AppInlineNotice
              title="ROLE RECEIPT PENDING"
              description="No queue or decision controls are available until the server confirms the current role."
              testID="support-system-admin-role-pending"
              tone="info"
            />
            <GalleryAction
              disabled
              testID="support-system-admin-wait"
              title="Please wait"
            />
          </>
        );
      case 'admin-required':
        return (
          <>
            <Text style={styles.body}>
              Menta could not obtain an authoritative support-role receipt for
              this session.
            </Text>
            <AppInlineNotice
              title="ROLE OR QUEUE CONTRACT UNAVAILABLE"
              description="No report rows, decisions, or receipts are shown from local profile data."
              testID="support-system-admin-contract-unavailable"
              tone="warning"
            />
            <GalleryAction
              onPress={actions.onBack}
              testID="support-system-admin-required-back"
              title="Go back"
              variant="secondary"
            />
          </>
        );
      case 'issue-queue':
        return (
          <>
            <View accessibilityRole="tablist" style={styles.filters}>
              <QueueFilter label="Open" selected />
              <QueueFilter label="Verified" />
              <QueueFilter label="All" />
            </View>
            <Text style={styles.liveFooter}>
              LIVE SERVER DATA · EXAMPLE ONLY IN GALLERY
            </Text>
            <View style={styles.queueList}>
              <QueueRow
                detail="Proof upload stops after save"
                status="warning"
                title="Upload receipt is missing"
              />
              <QueueRow
                detail="Expected state differs from observed state"
                status="warning"
                title="Review result needs checking"
              />
              <QueueRow
                detail="A prior support response is available"
                status="success"
                title="Sign-in report"
              />
            </View>
          </>
        );
      case 'issue-queue-empty':
        return (
          <>
            <Text style={styles.body}>
              The server returned an empty result for the active filter. This
              does not change another filter or claim that every report is
              clear.
            </Text>
            <AppInlineNotice
              title="LIVE EMPTY RESULT"
              description="Refresh this queue when a current role and queue contract are available."
              tone="info"
            />
          </>
        );
      case 'issue-queue-unavailable':
        return (
          <>
            <Text style={styles.body}>
              No report rows are available for review. Do not make a support
              decision from an empty fallback.
            </Text>
            <AppInlineNotice
              title="QUEUE UNAVAILABLE"
              description="A retry may request the queue again; it does not recreate a missing report list."
              tone="warning"
            />
            <GalleryAction
              onPress={actions.onRetry}
              testID="support-system-queue-retry"
              title="Try again"
            />
          </>
        );
      case 'issue-detail':
        return (
          <>
            <Text style={styles.body}>
              The report, reporter context, and decision eligibility must all
              come from the current server response.
            </Text>
            <AppListRow
              meta="OPEN REPORT"
              subtitle="This gallery row is presentation-only and cannot become an admin record."
              title="Issue detail"
              value="Review"
            />
            <AppInlineNotice
              title="NO DECISION YET"
              description="Verification and rejection stay unavailable until the server provides a decision contract."
              tone="info"
            />
          </>
        );
      case 'decision-progress':
        return (
          <>
            <Text style={styles.body}>
              Menta is waiting for one server response. The same decision cannot
              be sent twice.
            </Text>
            <AppListRow
              meta="DECISION REQUEST"
              subtitle="Server receipt pending"
              title="Issue status"
              value="Working"
            />
            <GalleryAction
              disabled
              testID="support-system-decision-pending"
              title="Decision in progress"
            />
          </>
        );
      case 'issue-verified':
        return (
          <>
            <Text style={styles.body}>
              The decision receipt confirms the report was marked for follow-up.
              It does not claim a product fix is complete.
            </Text>
            <AppInlineNotice
              title="SERVER DECISION RECEIPT"
              description="Verified status is shown only after the decision endpoint returns."
              tone="success"
            />
            <GalleryAction
              onPress={actions.onBack}
              testID="support-system-verified-back"
              title="Back to queue"
              variant="secondary"
            />
          </>
        );
      case 'reject-issue':
        return (
          <>
            <Text style={styles.body}>
              Use this only when the server supplies the selected issue and
              permits a rejection decision.
            </Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rejectionTyped }}
              onPress={() => setRejectionTyped(current => !current)}
              style={styles.confirmationRow}
              testID="support-system-reject-confirmation"
            >
              <View
                style={[
                  styles.confirmationBox,
                  rejectionTyped && styles.confirmationBoxChecked,
                ]}
              />
              <Text style={styles.confirmationText}>
                I have reviewed the current issue record.
              </Text>
            </Pressable>
            <GalleryAction
              disabled={!rejectionTyped}
              testID="support-system-reject-submit"
              title="Reject issue"
              variant="destructive"
            />
          </>
        );
      case 'decision-failed':
        return (
          <>
            <Text style={styles.body}>
              The last server status remains authoritative. Menta does not
              display a verification or rejection receipt.
            </Text>
            <AppInlineNotice
              title="NO DECISION RECEIPT"
              description="Reopen the current issue before retrying so the action uses fresh server state."
              tone="warning"
            />
            <GalleryAction
              onPress={actions.onRetry}
              testID="support-system-decision-retry"
              title="Try again"
            />
          </>
        );
      case 'offline-saved-proof':
        return (
          <>
            <Text style={styles.body}>
              This phone retained the local proof. It has not delivered it,
              changed a review, or completed a promise.
            </Text>
            <AppInlineNotice
              title="SAVED ON THIS PHONE"
              description="Reconnect before sending. Keep the original available until a server receipt returns."
              tone="warning"
            />
            <GalleryAction
              onPress={actions.onRetry}
              testID="support-system-offline-proof-retry"
              title="Try sending now"
            />
          </>
        );
      case 'app-offline':
        return (
          <>
            <Text style={styles.body}>
              The last confirmed view stays available. New server decisions and
              account changes must wait for a connection.
            </Text>
            <AppInlineNotice
              title="LAST CONFIRMED STATE"
              description="Offline does not mean zero reports, no saved proof, or all clear."
              tone="warning"
            />
            <GalleryAction
              onPress={actions.onRetry}
              testID="support-system-offline-retry"
              title="Try connection again"
            />
          </>
        );
      case 'settings-handoff':
        return (
          <>
            <Text style={styles.body}>
              Menta can hand you to the system settings screen. It cannot change
              a device setting or confirm the result from here.
            </Text>
            <AppInlineNotice
              title="SAFE RETURN"
              description="When you return, Menta will check the current state again. Nothing has changed yet."
              tone="info"
            />
            <GalleryAction
              onPress={actions.onOpenSettings}
              testID="support-system-open-settings"
              title="Open Settings"
            />
            <GalleryAction
              onPress={actions.onNotNow}
              testID="support-system-settings-later"
              title="Not now"
              variant="secondary"
            />
          </>
        );
      case 'route-not-found':
        return (
          <>
            <AppInlineNotice
              title="STALE OR UNKNOWN ROUTE"
              description="This link has not changed your promises, proof, group, account, or purchase state."
              tone="warning"
            />
            <GalleryAction
              onPress={actions.onGoHome}
              testID="support-system-not-found-home"
              title="Go home"
            />
            <GalleryAction
              onPress={actions.onBack}
              testID="support-system-not-found-back"
              title="Go back"
              variant="secondary"
            />
          </>
        );
      case 'account-loading':
        return <AccountLoadingState />;
    }
  }, [actions, rejectionTyped, requiresUnavailableContract, state.kind]);

  return (
    <AppScreen
      lane="working"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
    >
      <StateHeader
        eyebrow={state.eyebrow}
        onBack={actions.onBack}
        summary={canUseGallerySamples ? state.summary : ''}
        title={state.title}
      />
      {content}
      <AppDivider />
    </AppScreen>
  );
};

export const AdminContractUnavailableScreen = ({
  onBack,
}: {
  onBack: () => void;
}) => <SupportSystemFamilyGallery actions={{ onBack }} stateId="ADM-01" />;

export { OfflineSupportNotice };

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    gap: mentaSpacing[4],
    maxWidth: mentaLayout.focusedLane,
    paddingBottom: mentaSpacing[8],
    width: '100%',
  },
  header: { gap: mentaSpacing[2] },
  eyebrow: { color: mentaColors.text.muted, ...mentaTypography.label },
  summary: { color: mentaColors.text.secondary, ...mentaTypography.bodySmall },
  displayTitle: { color: mentaColors.text.primary, ...mentaTypography.heading },
  body: { color: mentaColors.text.secondary, ...mentaTypography.body },
  caption: { color: mentaColors.text.muted, ...mentaTypography.caption },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: mentaSpacing[2] },
  filter: {
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: 1,
    minHeight: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaSpacing[3],
    justifyContent: 'center',
  },
  filterSelected: {
    backgroundColor: mentaColors.actionSoft,
    borderColor: mentaColors.actionBorder,
  },
  filterText: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmallMedium,
  },
  filterTextSelected: { color: mentaColors.text.primary },
  liveFooter: { color: mentaColors.text.muted, ...mentaTypography.label },
  queueList: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  queueRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 72,
    paddingVertical: mentaSpacing[3],
  },
  queueStatusLane: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: mentaLayout.iconLane,
  },
  queueCopy: { flex: 1, gap: mentaSpacing[1] },
  queueTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  queueDetail: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmall,
  },
  trailingLane: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: mentaLayout.trailingActionLane,
  },
  statusDot: {
    borderRadius: mentaRadii.round,
    height: 8,
    width: 8,
  },
  statusDotWarning: { backgroundColor: mentaColors.warning },
  statusDotSuccess: { backgroundColor: mentaColors.success },
  statusDotDanger: { backgroundColor: mentaColors.danger },
  accountSkeleton: { gap: mentaSpacing[3] },
  skeletonRows: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: mentaSpacing[2],
  },
  skeletonRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  confirmationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: mentaLayout.minimumTouchTarget,
  },
  confirmationBox: {
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.small,
    borderWidth: 1,
    height: 20,
    width: 20,
  },
  confirmationBoxChecked: {
    backgroundColor: mentaColors.action,
    borderColor: mentaColors.action,
  },
  confirmationText: {
    color: mentaColors.text.secondary,
    flex: 1,
    ...mentaTypography.bodySmall,
  },
});

const statusDotStyles = {
  danger: styles.statusDotDanger,
  success: styles.statusDotSuccess,
  warning: styles.statusDotWarning,
} as const;
