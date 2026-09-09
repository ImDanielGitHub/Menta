import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppDivider,
  AppListRow,
  AppScreen,
  AppTopBar,
} from '@/components/ui/AppShell';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppDateTimeRow } from '@/components/ui/AppFields';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  getNotificationsPrivacyPaperState,
  type NotificationsPrivacyPaperStateId,
} from '@/lib/paper-state-registry/notifications-privacy';

type Props = {
  stateId: NotificationsPrivacyPaperStateId;
};

const noop = () => undefined;

const GalleryAction = ({
  title,
  disabled = false,
  loading = false,
  tone = 'primary',
  testID,
}: {
  title: string;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'secondary' | 'ghost';
  testID: string;
}) => (
  <AppButton
    disabled={disabled}
    fullWidth
    loading={loading}
    size="large"
    testID={testID}
    title={title}
    variant={
      tone === 'primary'
        ? 'primary'
        : tone === 'secondary'
          ? 'secondary'
          : 'ghost'
    }
    onPress={noop}
  />
);

const Heading = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <View style={styles.heading}>
    <Text style={styles.eyebrow}>{eyebrow}</Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.body}>{description}</Text>
  </View>
);

const RowList = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.rows}>{children}</View>
);

/**
 * Deterministic, development-only reference renderings for the notification and
 * privacy family. They deliberately use no service calls, native prompts, mock
 * receipts, copied links, entitlement guesses, or delivery claims.
 */
export const NotificationsPrivacyFamilyGallery = ({ stateId }: Props) => {
  const state = getNotificationsPrivacyPaperState(stateId);
  const [quietHoursStart, setQuietHoursStart] = useState(() => {
    const value = new Date();
    value.setHours(22, 0, 0, 0);
    return value;
  });
  const [quietHoursEnd, setQuietHoursEnd] = useState(() => {
    const value = new Date();
    value.setHours(7, 0, 0, 0);
    return value;
  });
  const quietHoursLabel = useMemo(() => '10:00 PM — 7:00 AM · Auckland', []);

  if (!__DEV__) return null;

  const content = (() => {
    switch (state.kind) {
      case 'native-permission-handoff':
        return (
          <>
            <Heading
              eyebrow="SYSTEM HANDOFF"
              title="Your phone is asking."
              description="The next surface is the native notification prompt. Your phone owns this choice, and Menta cannot choose for you."
            />
            <AppInlineNotice
              description="No reminder preference or delivery receipt exists until the operating system returns."
              title="OS owns this choice"
              tone="info"
            />
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-not-03-open"
                title="Open system prompt"
              />
              <GalleryAction
                testID="notifications-privacy-not-03-back"
                title="Back to notifications"
                tone="ghost"
              />
            </View>
          </>
        );
      case 'opening-device-settings':
        return (
          <>
            <Heading
              eyebrow="OPENING SETTINGS"
              title="Opening your phone settings."
              description="Menta is handing this control to your phone. No permission change happened yet."
            />
            <AppInlineNotice
              description="Return here after you choose. Menta will check the device state instead of assuming an outcome."
              title="Settings is a handoff"
              tone="info"
            />
            <View style={styles.actions}>
              <GalleryAction
                loading
                testID="notifications-privacy-not-06-opening"
                title="Opening…"
              />
              <GalleryAction
                testID="notifications-privacy-not-06-off"
                title="Keep notifications off"
                tone="ghost"
              />
            </View>
          </>
        );
      case 'returned-granted':
        return (
          <>
            <Heading
              eyebrow="DEVICE ALLOWED"
              title="Your phone now allows notifications."
              description="Menta is confirming device registration before it describes reminders as ready."
            />
            <RowList>
              <AppListRow
                subtitle="Operating system permission"
                title="Allowed"
                value="Confirmed"
              />
              <AppListRow
                showDivider={false}
                subtitle="Checking this device"
                title="Device registration"
                value="Working…"
              />
            </RowList>
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-not-07-continue"
                title="Continue"
              />
            </View>
          </>
        );
      case 'returned-still-off':
        return (
          <>
            <Heading
              eyebrow="STILL OFF"
              title="Notifications are still off."
              description="That is okay. Menta will not show the same permission primer again; promises, proof and reviews still work."
            />
            <AppInlineNotice
              description="No reminder was scheduled or claimed as delivered."
              title="You can continue without alerts"
              tone="info"
            />
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-not-08-off"
                title="Keep notifications off"
                tone="ghost"
              />
            </View>
          </>
        );
      case 'preference-saving':
        return (
          <>
            <Heading
              eyebrow="SAVING PREFERENCE"
              title="Saving this reminder choice."
              description="The switch responds immediately, but the prior saved choice remains authoritative until the account service accepts the change."
            />
            <RowList>
              <AppListRow
                subtitle="Daily proof reminders"
                title="Proof reminders"
                value="Saving…"
              />
              <AppListRow
                showDivider={false}
                subtitle="On this device"
                title="Reminder time"
                value="8:00 PM"
              />
            </RowList>
            <AppInlineNotice
              description="If saving fails, Menta rolls the switch back to the previous confirmed choice."
              title="Not confirmed yet"
              tone="warning"
            />
          </>
        );
      case 'preference-saved':
        return (
          <>
            <Heading
              eyebrow="PREFERENCE SAVED"
              title="Your reminder choice is saved."
              description="The account service confirmed the preference. A saved preference is not a delivered notification."
            />
            <RowList>
              <AppListRow
                subtitle="Daily proof reminders"
                title="Proof reminders"
                value="Saved"
              />
              <AppListRow
                showDivider={false}
                subtitle="Schedule may still reconcile separately"
                title="Delivery"
                value="Not claimed"
              />
            </RowList>
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-not-11-done"
                title="Done"
              />
            </View>
          </>
        );
      case 'schedule-reconciling':
        return (
          <>
            <Heading
              eyebrow="SCHEDULE CHECK"
              title="Your preference is saved."
              description="Menta is still reconciling the local schedule. It does not claim a reminder will arrive until that device work is known."
            />
            <RowList>
              <AppListRow
                subtitle="Account service"
                title="Preference"
                value="Saved"
              />
              <AppListRow
                showDivider={false}
                subtitle="Checking this phone"
                title="Local schedule"
                value="Working…"
              />
            </RowList>
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-not-13-checking"
                title="Keep checking"
                tone="secondary"
              />
            </View>
          </>
        );
      case 'quiet-hours-edit':
        return (
          <>
            <Heading
              eyebrow="QUIET HOURS"
              title="Choose a quieter window."
              description="Time is set on this device. The range can cross midnight, and the local schedule is only updated after you save."
            />
            <RowList>
              <AppDateTimeRow
                subtitle="Starts"
                title="Quiet hours start"
                value={quietHoursStart}
                onChange={setQuietHoursStart}
              />
              <AppDateTimeRow
                subtitle="Ends"
                title="Quiet hours end"
                value={quietHoursEnd}
                onChange={setQuietHoursEnd}
              />
              <AppListRow
                subtitle="Monday to Sunday"
                showDivider={false}
                title="Active days"
                value="Every day"
              />
            </RowList>
            <Text style={styles.caption}>{quietHoursLabel}</Text>
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-not-16-save"
                title="Save quiet hours"
              />
            </View>
          </>
        );
      case 'quiet-hours-not-saved':
        return (
          <>
            <Heading
              eyebrow="QUIET HOURS NOT SAVED"
              title="Your previous quiet hours remain active."
              description="The new local range was not confirmed, so Menta keeps the prior saved schedule authoritative."
            />
            <RowList>
              <AppListRow
                subtitle="Proposed range"
                title="10:00 PM — 7:00 AM"
                value="Not saved"
              />
              <AppListRow
                showDivider={false}
                subtitle="Authoritative on this device"
                title="9:30 PM — 6:30 AM"
                value="Active"
              />
            </RowList>
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-not-17-retry"
                title="Try saving again"
              />
            </View>
          </>
        );
      case 'invite-unavailable':
        return (
          <>
            <Heading
              eyebrow="LINK UNAVAILABLE"
              title="The invite link is not ready."
              description="The account service could not make a link right now. No link was copied, shared, or sent."
            />
            <AppInlineNotice
              description="Your existing invite and members are unchanged."
              title="Nothing was shared"
              tone="error"
            />
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-inv-06-retry"
                title="Try again"
              />
            </View>
          </>
        );
      case 'pro-unavailable':
        return (
          <>
            <Heading
              eyebrow="PRO STATUS"
              title="Pro status could not be checked."
              description="Your account and promises are still available. Menta does not guess an entitlement while the service is unavailable."
            />
            <AppInlineNotice
              description="No Pro purchase, restoration, or current entitlement is claimed here."
              title="Status remains unknown"
              tone="warning"
            />
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-you-05-retry"
                title="Check Pro status again"
              />
            </View>
          </>
        );
      case 'notification-education':
        return (
          <>
            <Heading
              eyebrow="PERMISSION · BEFORE IOS"
              title="Choose your return signal."
              description="Menta only asks for reminders when they can help you keep a promise. The next step can ask iOS, which owns the answer."
            />
            <RowList>
              <AppListRow
                subtitle="A quiet nudge before your chosen deadline"
                title="Daily proof reminders"
              />
              <AppListRow
                showDivider={false}
                subtitle="Only when a promise needs your attention"
                title="Streak risk alerts"
              />
            </RowList>
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-auth-07-continue"
                title="Continue"
              />
              <GalleryAction
                testID="notifications-privacy-auth-07-not-now"
                title="Not now"
                tone="ghost"
              />
            </View>
          </>
        );
      case 'notification-granted':
        return (
          <>
            <Heading
              eyebrow="PERMISSION · SAVED"
              title="Your reminders are on."
              description="The operating system permission and Menta reminder preference are separate. Menta uses the schedule you choose, never a claimed delivery."
            />
            <RowList>
              <AppListRow
                subtitle="Operating system"
                title="Notification permission"
                value="Allowed"
              />
              <AppListRow
                showDivider={false}
                subtitle="Change any time"
                title="Reminder time"
                value="7:00 PM"
              />
            </RowList>
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-auth-08-promise"
                title="Return to my promise"
              />
              <GalleryAction
                testID="notifications-privacy-auth-08-settings"
                title="Open notification settings"
                tone="secondary"
              />
            </View>
          </>
        );
      case 'push-token-pending':
        return (
          <>
            <Heading
              eyebrow="PERMISSION · SYNCING"
              title="Permission is on. Delivery is catching up."
              description="iOS allowed notifications, but Menta has not finished registering this device. No reminder has been claimed as delivered yet."
            />
            <RowList>
              <AppListRow
                subtitle="No delivery claimed"
                title="Device registration pending"
                value="Retrying"
              />
              <AppListRow
                showDivider={false}
                subtitle="Your promise remains available"
                title="Background retry"
                value="Safe"
              />
            </RowList>
            <View style={styles.actions}>
              <GalleryAction
                testID="notifications-privacy-auth-09-retry"
                title="Try registration again"
              />
              <GalleryAction
                testID="notifications-privacy-auth-09-continue"
                title="Continue without reminders"
                tone="ghost"
              />
            </View>
          </>
        );
    }
  })();

  return (
    <AppScreen
      lane="working"
      safeArea
      scrollable
      testID={`notifications-privacy-gallery-${state.id.toLowerCase()}`}
      contentContainerStyle={styles.lane}
    >
      <AppTopBar
        subtitle={state.surface === 'auth' ? 'Onboarding' : 'You'}
        title="Notifications"
      />
      {content}
      <AppDivider muted />
      <Text style={styles.proofBoundary}>
        Development reference only. This state does not perform native, account,
        invite, entitlement, or delivery actions.
      </Text>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  lane: {
    alignSelf: 'center',
    gap: mentaSpacing[6],
    maxWidth: mentaLayout.focusedLane,
    paddingHorizontal: mentaLayout.screenInset,
    paddingVertical: mentaSpacing[6],
    width: '100%',
  },
  heading: {
    gap: mentaSpacing[2],
  },
  eyebrow: {
    color: mentaColors.text.secondary,
    ...mentaTypography.label,
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.title,
  },
  body: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  caption: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  rows: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    gap: mentaSpacing[3],
  },
  proofBoundary: {
    color: mentaColors.text.muted,
    ...mentaTypography.caption,
  },
});
