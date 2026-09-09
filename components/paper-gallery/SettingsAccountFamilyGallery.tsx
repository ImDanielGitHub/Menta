import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppFieldRow, AppTextField } from '@/components/ui/AppFields';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppDivider, AppScreen, AppTopBar } from '@/components/ui/AppShell';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  SettingsDirectRow,
  SettingsSectionLabel,
} from '@/components/settings/SettingsDirectRow';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  getSettingsAccountPaperState,
  type SettingsAccountPaperStateId,
} from '@/lib/paper-state-registry/settings-account';

export type SettingsAccountFamilyActions = Partial<{
  onBack: () => void;
  onCreatePromise: () => void;
  onOpenSettings: () => void;
  onRetry: () => void;
  onSignOut: () => void;
  onStaySignedIn: () => void;
  onReviewOwnership: () => void;
  onManageSubscription: () => void;
  onContinueDeletion: () => void;
  onContinueSignIn: () => void;
  onExplore: () => void;
  onShareInvite: () => void;
  onCopyInvite: () => void;
}>;

type Props = {
  stateId: SettingsAccountPaperStateId;
  actions?: SettingsAccountFamilyActions;
  /** Only gallery consumers use example state. Production routes must pass facts. */
  galleryMode?: boolean;
  retryAtLabel?: string | null;
};

const GalleryButton = ({
  title,
  onPress,
  disabled = false,
  destructive = false,
  testID,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  testID: string;
}) => (
  <AppButton
    title={title}
    onPress={onPress ?? (() => undefined)}
    disabled={disabled}
    variant={destructive ? 'destructive' : 'primary'}
    fullWidth
    size="large"
    testID={testID}
  />
);

const DirectRow = ({
  title,
  subtitle,
  value,
  onPress,
  destructive = false,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) => (
  <AppFieldRow
    title={title}
    subtitle={subtitle}
    value={value}
    onPress={onPress}
    destructive={destructive}
  />
);

const AccountSkeleton = () => (
  <View
    accessibilityLabel="Loading your account"
    accessibilityRole="progressbar"
    style={styles.skeletonFrame}
    testID="settings-account-family-you-00"
  >
    <View style={styles.skeletonIdentity}>
      <SkeletonLoader announce={false} height={72} width={72} />
      <View style={styles.skeletonIdentityCopy}>
        <SkeletonLoader announce={false} height={16} width={122} />
        <SkeletonLoader announce={false} height={12} width={84} />
      </View>
    </View>
    {[0, 1].map(section => (
      <View key={section} style={styles.skeletonSection}>
        <SkeletonLoader announce={false} height={12} width={64} />
        {[0, 1].map(row => (
          <View key={row} style={styles.skeletonRow}>
            <View style={styles.skeletonCopy}>
              <SkeletonLoader announce={false} height={13} width="46%" />
              <SkeletonLoader announce={false} height={11} width="70%" />
            </View>
            <SkeletonLoader announce={false} height={12} width={12} />
          </View>
        ))}
      </View>
    ))}
  </View>
);

const SettingsSkeleton = () => (
  <View
    accessibilityLabel="Loading settings"
    accessibilityRole="progressbar"
    style={styles.skeletonFrame}
    testID="settings-account-family-set-00"
  >
    {[
      [1, 80],
      [3, 96],
      [1, 104],
      [2, 132],
      [2, 48],
      [1, 68],
    ].map(([rows, width], group) => (
      <View key={group} style={styles.skeletonSection}>
        <SkeletonLoader announce={false} height={10} width={width} />
        {Array.from({ length: rows }, (_, row) => (
          <View key={row} style={styles.skeletonRow}>
            <SkeletonLoader announce={false} height={24} width={24} />
            <View style={styles.skeletonCopy}>
              <SkeletonLoader announce={false} height={13} width="48%" />
              <SkeletonLoader announce={false} height={10} width="72%" />
            </View>
            <SkeletonLoader announce={false} height={12} width={12} />
          </View>
        ))}
      </View>
    ))}
  </View>
);

export const SettingsAccountFamilyGallery = ({
  stateId,
  actions = {},
  galleryMode = false,
  retryAtLabel,
}: Props) => {
  const state = getSettingsAccountPaperState(stateId);
  const [confirmation, setConfirmation] = useState('');
  const typedReady = confirmation.trim() === 'DELETE';
  const exampleRetryAt = galleryMode ? '3:20 PM' : retryAtLabel;
  const title = stateId === 'DEL-06' ? 'Delete account' : state.title;

  const content = useMemo(() => {
    switch (state.kind) {
      case 'skeleton':
        return <AccountSkeleton />;
      case 'first-use':
        return (
          <>
            <Text style={styles.headline}>Begin with one promise.</Text>
            <Text style={styles.body}>
              Your account is ready. The first commitment gives this space
              something real to return to.
            </Text>
            <Text style={styles.body}>
              No progress is shown until there is a real promise to describe.
            </Text>
            <DirectRow
              title="Settings"
              subtitle="Account, reminders and support."
              onPress={actions.onOpenSettings}
            />
            <GalleryButton
              title="Create a promise"
              onPress={actions.onCreatePromise}
              testID="settings-account-family-you-01-create"
            />
            <GalleryButton
              title="Not now"
              onPress={actions.onBack}
              testID="settings-account-family-you-01-later"
            />
          </>
        );
      case 'pro':
        return (
          <>
            <Text style={styles.headline}>Pro is active on this account.</Text>
            <Text style={styles.body}>
              Your account stays the same; this row only confirms the current
              entitlement.
            </Text>
            <Text style={styles.caption}>
              Active is shown only after the entitlement check returns.
            </Text>
            <View style={styles.identity}>
              <Text style={styles.identityName}>Alex Morgan</Text>
              <Text style={styles.identityMeta}>@alexmorgan · member</Text>
            </View>
            <DirectRow
              title="Personal promises"
              subtitle="3 active promises"
              value="Open"
            />
            <DirectRow
              title="Manage Pro"
              subtitle="Plan and billing options."
            />
            <GalleryButton
              title="View Pro details"
              testID="settings-account-family-you-03-details"
            />
            <GalleryButton
              title="Back to You"
              onPress={actions.onBack}
              testID="settings-account-family-you-03-back"
            />
          </>
        );
      case 'partial-refresh':
        return (
          <>
            <Text style={styles.headline}>
              Your latest activity is still loading.
            </Text>
            <Text style={styles.body}>
              Your account and confirmed totals are available. The activity
              timeline remains on its last confirmed receipt until refresh
              succeeds.
            </Text>
            <DirectRow title="Profile" subtitle="Alex Morgan" value="Current" />
            <DirectRow title="Momenta" subtitle="1,240 confirmed" />
            <DirectRow
              title="Recent activity"
              subtitle="Last updated 8:42 am"
              value="Stale"
            />
            <GalleryButton
              title="Try activity again"
              onPress={actions.onRetry}
              testID="settings-account-family-you-04-retry"
            />
            <GalleryButton
              title="Open settings"
              onPress={actions.onOpenSettings}
              testID="settings-account-family-you-04-settings"
            />
          </>
        );
      case 'signing-out':
        return (
          <>
            <Text style={styles.headline}>Ending this device session.</Text>
            <Text style={styles.body}>
              Menta is clearing local account access on this device. The same
              request cannot be sent twice.
            </Text>
            <Text style={styles.caption}>
              Your account data is not being deleted.
            </Text>
            <DirectRow
              title="This device session"
              subtitle="Clearing local access"
              value="Working…"
            />
            <GalleryButton
              title="Signing out…"
              disabled
              testID="settings-account-family-out-02-busy"
            />
            <Text style={styles.caption}>Please keep this screen open.</Text>
          </>
        );
      case 'sign-out-failed':
        return (
          <>
            <Text style={styles.headline}>This device is still signed in.</Text>
            <Text style={styles.body}>
              The local clear did not complete, so Menta keeps the account
              available and names the failure honestly.
            </Text>
            <Text style={styles.caption}>
              Retry is offered only because local signed-in state is still
              authoritative.
            </Text>
            <DirectRow
              title="Device session"
              subtitle="Could not end"
              value="Retry"
            />
            <GalleryButton
              title="Try signing out again"
              onPress={actions.onSignOut}
              testID="settings-account-family-out-04-retry"
            />
            <GalleryButton
              title="Stay signed in"
              onPress={actions.onStaySignedIn}
              testID="settings-account-family-out-04-stay"
            />
          </>
        );
      case 'deletion-preflight':
        return (
          <>
            <Text style={styles.headline}>Checking what needs attention.</Text>
            <Text style={styles.body}>
              This is read-only. Menta is not deleting anything while it checks
              ownership, subscription and account state.
            </Text>
            <Text style={styles.caption}>
              No destructive request exists yet.
            </Text>
            <DirectRow
              title="Account ownership"
              subtitle="Checking groups and promises"
              value="Checking…"
            />
            <DirectRow
              title="Account security"
              subtitle="Checking request eligibility"
              value="Checking account…"
            />
          </>
        );
      case 'ownership-blocked':
        return (
          <>
            <Text style={styles.headline}>A few things need a new owner.</Text>
            <Text style={styles.body}>
              Menta cannot safely delete an account while it still owns shared
              spaces or promises that need a clear handover.
            </Text>
            <Text style={styles.caption}>
              Resolve these before the deletion request becomes available.
            </Text>
            <DirectRow
              title="Morning Run Club"
              subtitle="You are the only organiser"
              value="Resolve"
            />
            <DirectRow
              title="Weekday reset"
              subtitle="A shared promise needs a new owner."
            />
            <GalleryButton
              title="Review ownership"
              onPress={actions.onReviewOwnership}
              testID="settings-account-family-del-02-review"
            />
            <GalleryButton
              title="Back to settings"
              onPress={actions.onBack}
              testID="settings-account-family-del-02-back"
            />
          </>
        );
      case 'subscription-notice':
        return (
          <>
            <Text style={styles.headline}>
              Your subscription is managed by Apple.
            </Text>
            <Text style={styles.body}>
              Deleting your Menta account does not cancel an App Store
              subscription. You can manage it separately without blocking
              deletion.
            </Text>
            <Text style={styles.caption}>
              Subscription management is a system handoff, not a condition for
              deleting the account.
            </Text>
            <DirectRow
              title="Manage App Store subscription"
              subtitle="Open Apple subscription settings"
            />
            <DirectRow
              title="Continue account deletion"
              subtitle="Does not cancel a subscription."
            />
            <GalleryButton
              title="Continue deletion"
              onPress={actions.onContinueDeletion}
              testID="settings-account-family-del-03-continue"
            />
            <GalleryButton
              title="Manage subscription"
              onPress={actions.onManageSubscription}
              testID="settings-account-family-del-03-subscription"
            />
          </>
        );
      case 'consequence-review':
        return (
          <>
            <Text style={styles.headline}>
              Read the account-specific result.
            </Text>
            <Text style={styles.body}>
              Menta shows only consequences returned for this account before you
              enter the final confirmation.
            </Text>
            <Text style={styles.caption}>
              No generic promise about anonymising or transferring shared
              content is made here.
            </Text>
            <DirectRow
              title="Account profile"
              subtitle="Will be removed after confirmed request"
            />
            <DirectRow
              title="Shared ownership"
              subtitle="Already resolved"
              value="Confirmed"
            />
            <DirectRow
              title="Personal data"
              subtitle="Exact retention from server"
              value="Review"
            />
            <GalleryButton
              title="Continue to confirmation"
              onPress={actions.onContinueDeletion}
              testID="settings-account-family-del-04-continue"
            />
            <GalleryButton
              title="Back to settings"
              onPress={actions.onBack}
              testID="settings-account-family-del-04-back"
            />
          </>
        );
      case 'typed-confirmation':
        return (
          <>
            <Text style={styles.headline}>Delete your account?</Text>
            <Text style={styles.body}>
              Nothing changes until you submit the final request. Make sure the
              consequence review matches what you want before you continue.
            </Text>
            <Text style={styles.caption}>
              No deletion request has been sent.
            </Text>
            <AppTextField
              label="CONFIRMATION"
              value={confirmation}
              onChangeText={setConfirmation}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="DELETE"
              accessibilityLabel="Type DELETE to confirm account deletion"
              testID="settings-account-family-del-06-input"
            />
            <Text style={styles.caption}>
              {typedReady
                ? 'Exact match. You can send this request.'
                : 'Type DELETE exactly to continue.'}
            </Text>
            <GalleryButton
              title="Delete account"
              onPress={actions.onContinueDeletion}
              disabled={!typedReady}
              destructive
              testID="settings-account-family-del-06-submit"
            />
          </>
        );
      case 'reauthentication':
        return (
          <>
            <Text style={styles.headline}>Sign in again to continue.</Text>
            <Text style={styles.body}>
              The account service needs a fresh sign-in before it can accept a
              destructive request. Your deletion intent is preserved.
            </Text>
            <Text style={styles.caption}>
              The next screen is an authentication handoff, not another deletion
              confirmation.
            </Text>
            <DirectRow
              title="Secure sign in"
              subtitle="Required by account service"
              value="Continue"
            />
            <GalleryButton
              title="Continue to sign in"
              onPress={actions.onContinueSignIn}
              testID="settings-account-family-del-07-sign-in"
            />
            <GalleryButton
              title="Back to settings"
              onPress={actions.onBack}
              testID="settings-account-family-del-07-back"
            />
          </>
        );
      case 'rate-limited':
        return (
          <>
            <Text style={styles.headline}>The server needs a short pause.</Text>
            <Text style={styles.body}>
              Your typed confirmation and deletion intent are preserved. This
              retry time comes from the account service.
            </Text>
            <Text style={styles.caption}>
              No duplicate deletion request has been sent.
            </Text>
            <DirectRow
              title="Next retry"
              subtitle="Available after the server cooldown"
              value={exampleRetryAt ?? 'Unavailable'}
            />
            <GalleryButton
              title="Back to settings"
              onPress={actions.onBack}
              testID="settings-account-family-del-09-back"
            />
            <GalleryButton
              title="Check again later"
              onPress={actions.onRetry}
              disabled={!exampleRetryAt}
              testID="settings-account-family-del-09-later"
            />
          </>
        );
      case 'signed-out':
        return (
          <>
            <Text style={styles.headline}>You are signed out.</Text>
            <Text style={styles.body}>
              This is the Page 02 destination reference. It gives a calm way
              back without automatic sign-up pressure.
            </Text>
            <Text style={styles.caption}>
              The authenticated account journey is complete on this device.
            </Text>
            <DirectRow
              title="Account session"
              subtitle="No longer active on this device"
              value="Sign in"
              onPress={actions.onContinueSignIn}
            />
            <GalleryButton
              title="Explore Menta"
              onPress={actions.onExplore}
              testID="settings-account-family-del-14-explore"
            />
          </>
        );
      case 'notifications-error':
        return (
          <>
            <Text style={styles.headline}>
              Notification settings did not load.
            </Text>
            <Text style={styles.body}>
              Menta cannot confirm whether old reminders still apply. You can
              retry or return safely.
            </Text>
            <Text style={styles.caption}>
              Nothing on this screen claims that a reminder is scheduled.
            </Text>
            <DirectRow
              title="Try again"
              subtitle="Reload the notification layers"
              value="Retry"
              onPress={actions.onRetry}
            />
            <GalleryButton
              title="Back to settings"
              onPress={actions.onBack}
              testID="settings-account-family-not-01-back"
            />
          </>
        );
      case 'settings-skeleton':
        return <SettingsSkeleton />;
      case 'settings-loaded':
        return (
          <>
            <SettingsSectionLabel>Account</SettingsSectionLabel>
            <SettingsDirectRow
              title="Edit profile"
              subtitle="Name and profile photo."
            />
            <SettingsSectionLabel>Your Menta</SettingsSectionLabel>
            <SettingsDirectRow
              title="Personal promises"
              subtitle="Active and past promises."
            />
            <SettingsDirectRow
              title="Momenta"
              subtitle="Balance, shop and inventory."
            />
            <SettingsDirectRow
              title="Menta Pro"
              subtitle="View status and options."
            />
            <SettingsSectionLabel>
              Notifications and reminders
            </SettingsSectionLabel>
            <SettingsDirectRow
              title="Notifications"
              subtitle="Proof reminders and group updates."
            />
            <SettingsSectionLabel>Privacy and legal</SettingsSectionLabel>
            <SettingsDirectRow
              title="Privacy policy"
              subtitle="How Menta handles your data."
            />
            <SettingsDirectRow
              title="Terms of use"
              subtitle="Read Menta’s terms."
            />
            <SettingsSectionLabel>Help</SettingsSectionLabel>
            <SettingsDirectRow
              title="Get help"
              subtitle="Support and common questions."
            />
            <SettingsDirectRow
              title="Report a problem"
              subtitle="Tell us what happened."
            />
            <SettingsSectionLabel>Account</SettingsSectionLabel>
            <SettingsDirectRow
              destructive
              showDivider={false}
              title="Delete account"
              subtitle="Permanently delete your account."
            />
          </>
        );
      case 'settings-cached-offline':
        return (
          <>
            <Text style={styles.headline}>Known settings are still here.</Text>
            <Text style={styles.body}>
              Some destinations need a connection.
            </Text>
            <SettingsDirectRow
              title="Edit profile"
              subtitle="Saved details available."
            />
            <SettingsDirectRow
              title="Notifications"
              subtitle="Current device status unavailable."
              value="Offline"
            />
            <SettingsDirectRow
              title="Privacy and legal"
              subtitle="Open when connected."
              value="Offline"
            />
            <GalleryButton
              title="Try connection again"
              onPress={actions.onRetry}
              testID="settings-account-family-set-02-retry"
            />
            <GalleryButton
              title="Back to You"
              onPress={actions.onBack}
              testID="settings-account-family-set-02-back"
            />
          </>
        );
      case 'settings-partial-error':
        return (
          <>
            <Text style={styles.headline}>
              One settings region needs another try.
            </Text>
            <SettingsDirectRow
              title="Edit profile"
              subtitle="Name and profile photo."
            />
            <SettingsDirectRow
              title="Privacy policy"
              subtitle="How Menta handles your data."
            />
            <SettingsDirectRow
              title="Get help"
              subtitle="Support and common questions."
            />
            <SettingsDirectRow
              title="Notifications"
              subtitle="Could not load reminder settings."
              value="Retry"
            />
            <GalleryButton
              title="Retry notification settings"
              onPress={actions.onRetry}
              testID="settings-account-family-set-03-retry"
            />
            <GalleryButton
              title="Back to settings"
              onPress={actions.onBack}
              testID="settings-account-family-set-03-back"
            />
          </>
        );
      case 'invite-ready':
        return (
          <>
            <Text style={styles.body}>
              There is no referral reward or delivery claim here.
            </Text>
            <SettingsDirectRow
              title="Share link"
              subtitle="Choose a destination with your phone."
              onPress={actions.onShareInvite}
            />
            <SettingsDirectRow
              title="Copy link"
              subtitle="Keep a local clipboard copy."
              onPress={actions.onCopyInvite}
            />
            <GalleryButton
              title="Share invite"
              onPress={actions.onShareInvite}
              testID="settings-account-family-inv-01-share"
            />
            <GalleryButton
              title="Copy link"
              onPress={actions.onCopyInvite}
              testID="settings-account-family-inv-01-copy"
            />
          </>
        );
      case 'invite-preparing':
        return (
          <>
            <Text style={styles.body}>
              The account service was asked for a shareable link. Native share
              opens only after the link is ready.
            </Text>
            <GalleryButton
              title="Preparing invite…"
              disabled
              testID="settings-account-family-inv-02-busy"
            />
            <GalleryButton
              title="Back"
              onPress={actions.onBack}
              testID="settings-account-family-inv-02-back"
            />
          </>
        );
      case 'invite-handoff':
        return (
          <>
            <Text style={styles.body}>
              Your phone share sheet owns recipients and delivery. Menta cannot
              inspect a destination or claim sent.
            </Text>
            <Text style={styles.caption}>
              The placeholder represents the OS surface.
            </Text>
          </>
        );
      case 'invite-returned':
        return (
          <>
            <Text style={styles.body}>
              No recipient or delivery state came back to Menta.
            </Text>
            <GalleryButton
              title="Share again"
              onPress={actions.onShareInvite}
              testID="settings-account-family-inv-04-share"
            />
            <GalleryButton
              title="Copy link"
              onPress={actions.onCopyInvite}
              testID="settings-account-family-inv-04-copy"
            />
          </>
        );
      case 'invite-copied':
        return (
          <>
            <Text style={styles.body}>
              Clipboard receipt only, not sent or joined.
            </Text>
            <GalleryButton
              title="Share invite"
              onPress={actions.onShareInvite}
              testID="settings-account-family-inv-05-share"
            />
            <GalleryButton
              title="Back to You"
              onPress={actions.onBack}
              testID="settings-account-family-inv-05-back"
            />
          </>
        );
      case 'invite-unavailable':
        return (
          <>
            <Text style={styles.body}>
              Your session and account are unchanged. No link was copied or
              shared.
            </Text>
            <GalleryButton
              title="Try again"
              onPress={actions.onRetry}
              testID="settings-account-family-inv-06-retry"
            />
            <GalleryButton
              title="Back to You"
              onPress={actions.onBack}
              testID="settings-account-family-inv-06-back"
            />
          </>
        );
    }
  }, [actions, confirmation, exampleRetryAt, state.kind, typedReady]);

  return (
    <AppScreen
      lane="working"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{state.eyebrow}</Text>
        <AppTopBar
          onBack={actions.onBack}
          subtitle={state.summary}
          title={title}
        />
      </View>
      {state.kind === 'deletion-preflight' && !galleryMode ? (
        <AppInlineNotice
          title="Deletion preflight is not available yet"
          description="Menta cannot preview every consequence before you continue. Review any groups you own and your subscription first. Nothing has been deleted."
          tone="warning"
          testID="settings-account-deletion-contract-unavailable"
        />
      ) : null}
      {content}
      <AppDivider />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  screen: {
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[8],
  },
  header: {
    gap: mentaSpacing[2],
  },
  eyebrow: {
    color: mentaColors.text.muted,
    ...mentaTypography.label,
  },
  headline: {
    color: mentaColors.text.primary,
    ...mentaTypography.journeyTitle,
  },
  body: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  caption: {
    color: mentaColors.text.muted,
    ...mentaTypography.caption,
  },
  identity: {
    gap: mentaSpacing[1],
    paddingVertical: mentaSpacing[2],
  },
  identityName: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  identityMeta: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  skeletonFrame: {
    gap: mentaSpacing[6],
  },
  skeletonIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
    minHeight: 72,
  },
  skeletonIdentityCopy: {
    flex: 1,
    gap: mentaSpacing[2],
  },
  skeletonSection: {
    gap: mentaSpacing[3],
  },
  skeletonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 56,
  },
  skeletonCopy: {
    flex: 1,
    gap: mentaSpacing[2],
    maxWidth: mentaLayout.focusedLane,
  },
});
