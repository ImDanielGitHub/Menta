import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppFields';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppScreen } from '@/components/ui/AppShell';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  getBootstrapEmailRecoveryPaperState,
  type BootstrapEmailRecoveryPaperStateId,
} from '@/lib/paper-state-registry/bootstrap-email-recovery';

type Props = {
  stateId: BootstrapEmailRecoveryPaperStateId;
};

const examplePromise = 'Walk for 20 minutes after work';

const Frame = ({
  children,
  testID,
}: {
  children: React.ReactNode;
  testID: string;
}) => (
  <AppScreen
    lane="focused"
    safeArea
    scrollable
    hasTabBar={false}
    testID={testID}
    contentContainerStyle={styles.lane}
  >
    <View style={styles.brandRow}>
      <Text style={styles.brand}>Menta</Text>
      <View style={styles.brandDot} />
    </View>
    {children}
  </AppScreen>
);

const Heading = ({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) => (
  <View style={styles.heading}>
    {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
    <Text style={styles.title}>{title}</Text>
    {body ? <Text style={styles.body}>{body}</Text> : null}
  </View>
);

const PromiseReceipt = ({ status = 'Photo proof · Step 3 of 3' }) => (
  <View style={styles.paperReceipt}>
    <Text style={styles.paperLabel}>My promise</Text>
    <Text style={styles.paperTitle}>{examplePromise}</Text>
    <Text style={styles.paperMeta}>{status}</Text>
  </View>
);

const Action = ({
  title,
  disabled = false,
}: {
  title: string;
  disabled?: boolean;
}) => (
  <AppButton
    title={title}
    onPress={() => undefined}
    disabled={disabled}
    fullWidth
    size="large"
    testID={`bootstrap-email-action-${title}`}
  />
);

const BootstrapSkeleton = () => (
  <View
    accessibilityLabel="Checking what is ready on this phone"
    accessibilityRole="progressbar"
    style={styles.skeletonStack}
  >
    <SkeletonLoader announce={false} height={16} width={92} />
    <SkeletonLoader announce={false} height={42} width="90%" />
    <SkeletonLoader announce={false} height={22} width="72%" />
    <View style={styles.skeletonCard}>
      <SkeletonLoader announce={false} height={13} width={116} />
      <SkeletonLoader announce={false} height={24} width="78%" />
      <SkeletonLoader announce={false} height={16} width="62%" />
      <SkeletonLoader announce={false} height={44} width="100%" />
    </View>
    <Text style={styles.caption}>Checking what is ready on this phone…</Text>
  </View>
);

export const BootstrapEmailRecoveryFamilyGallery = ({ stateId }: Props) => {
  const state = getBootstrapEmailRecoveryPaperState(stateId);
  const [removeSheetOpen, setRemoveSheetOpen] = useState(
    state.kind === 'remove-draft'
  );
  const systemBoundary =
    state.kind === 'apple-system-sheet'
      ? 'Apple sign-in appears here on iPhone. This preview cannot recreate credentials, Face ID, passcode, or account choices.'
      : null;

  if (!__DEV__) return null;

  const content = (() => {
    switch (state.kind) {
      case 'bootstrap-loading':
        return <BootstrapSkeleton />;
      case 'draft-found':
        return (
          <>
            <Heading
              eyebrow="SAVED ON THIS PHONE"
              title="Your first promise is still here."
              body="Continue from where you left off. Nothing has been sent yet."
            />
            <PromiseReceipt />
            <Action title="Continue draft" />
            <Action title="Start again" disabled />
          </>
        );
      case 'remove-draft':
        return (
          <>
            <Heading
              eyebrow="SAVED ON THIS PHONE"
              title="Your first promise is still here."
              body="Continue from where you left off. Nothing has been sent yet."
            />
            <PromiseReceipt />
            <Action title="Continue draft" />
            <Action title="Start again" disabled />
          </>
        );
      case 'bootstrap-error':
        return (
          <>
            <Heading
              title="Menta could not open your saved setup."
              body="Nothing has been deleted. Try once more."
            />
            <AppInlineNotice
              title="Your local draft remains untouched"
              description="A retry is safe because this screen has not changed the saved setup."
              tone="warning"
            />
            <Action title="Try again" />
            <Action title="More options" disabled />
          </>
        );
      case 'apple-system-sheet':
        return (
          <>
            <PromiseReceipt status="Photo proof · Due today at 9:00 pm" />
            <Heading
              title="Save your promise"
              body="Choose how you want to continue. Your draft stays on this phone."
            />
            <Action title="Continue with Apple" disabled />
            <Action title="Continue with email" />
            {systemBoundary ? (
              <AppInlineNotice
                title="System-owned surface"
                description={systemBoundary}
                tone="info"
              />
            ) : null}
          </>
        );
      case 'email-sign-in':
        return (
          <>
            <Heading
              eyebrow="AFTER THIS"
              title="Sign in with email"
              body="You will return to your first promise."
            />
            <AppTextField
              label="Email"
              value=""
              placeholder="you@example.com"
              editable={false}
            />
            <AppTextField
              label="Password"
              value=""
              placeholder="••••••••"
              secureTextEntry
              editable={false}
            />
            <Action title="Sign in" />
            <Text style={styles.link}>Forgot your password?</Text>
          </>
        );
      case 'email-busy':
        return (
          <>
            <Heading
              eyebrow="AFTER THIS"
              title="Creating your account"
              body="Menta is confirming your account. Your draft stays here."
            />
            <AppTextField label="Name" value="Daniel" editable={false} />
            <AppTextField
              label="Email"
              value="you@example.com"
              editable={false}
            />
            <AppTextField label="Password" value="••••••••" editable={false} />
            <Action title="Creating account…" disabled />
            <Text style={styles.caption}>Keep Menta open</Text>
          </>
        );
      case 'email-error':
        return (
          <>
            <Heading
              eyebrow="AFTER THIS"
              title="Create your account"
              body="Your draft is safe. Fix the highlighted field or sign in instead."
            />
            <AppTextField label="Name" value="Daniel" editable={false} />
            <AppTextField
              label="Email"
              value="daniel@example.com"
              errorText="This email already has a Menta account."
              editable={false}
            />
            <AppTextField label="Password" value="••••••••" editable={false} />
            <Action title="Create account" disabled />
            <Text style={styles.link}>Sign in instead</Text>
          </>
        );
      case 'draft-resume':
        return (
          <>
            <Heading
              eyebrow="ACCOUNT READY"
              title="Bringing your first promise with you."
              body="Your draft stays on this phone until Menta confirms it is saved."
            />
            <PromiseReceipt status="Photo proof · Due today at 9:00 pm" />
            <AppInlineNotice
              title="Account ready · Promise saving"
              description="Resuming your draft…"
              tone="success"
            />
            <Action title="Resuming your draft…" disabled />
          </>
        );
      case 'reset-request':
      case 'reset-sending':
        return (
          <>
            <Heading
              eyebrow="RESET FOR"
              title={
                state.kind === 'reset-sending'
                  ? 'Sending your reset link'
                  : 'Reset your password'
              }
              body={
                state.kind === 'reset-sending'
                  ? 'Keep Menta open while we send it to the address below.'
                  : 'We’ll email a secure link. Your saved promise will still be here.'
              }
            />
            <AppTextField
              label="Email"
              value="daniel@example.com"
              editable={false}
            />
            <Action
              title={
                state.kind === 'reset-sending'
                  ? 'Sending link…'
                  : 'Send reset link'
              }
              disabled={state.kind === 'reset-sending'}
            />
            <Text style={styles.link}>Back to sign in</Text>
          </>
        );
      case 'reset-receipt':
      case 'reset-cooldown':
        return (
          <>
            <Heading
              eyebrow={
                state.kind === 'reset-cooldown'
                  ? 'LINK ALREADY SENT'
                  : 'RESET LINK SENT'
              }
              title={
                state.kind === 'reset-cooldown'
                  ? 'Use the latest link.'
                  : 'Check your email.'
              }
              body={
                state.kind === 'reset-cooldown'
                  ? 'A new link can be sent after the short safety cooldown.'
                  : 'We sent a secure reset link. Your saved promise is still waiting here.'
              }
            />
            <PromiseReceipt status="Link valid for 60 minutes" />
            <Text style={styles.caption}>
              {state.kind === 'reset-cooldown'
                ? 'Another link is available at 9:43 pm.'
                : 'No password has changed yet.'}
            </Text>
            <Action title="Back to sign in" />
            <Action
              title={
                state.kind === 'reset-cooldown'
                  ? 'Send another link in 00:42'
                  : 'Send another link'
              }
              disabled={state.kind === 'reset-cooldown'}
            />
          </>
        );
      case 'new-password':
        return (
          <>
            <Heading
              eyebrow="SECURE RESET"
              title="Choose a new password"
              body="Use 6 or more characters. Both entries must match."
            />
            <AppTextField
              label="New password"
              value=""
              placeholder="Enter new password"
              secureTextEntry
              editable={false}
            />
            <AppTextField
              label="Confirm new password"
              value=""
              placeholder="Re-enter new password"
              secureTextEntry
              editable={false}
            />
            <Action title="Update password" disabled />
            <Text style={styles.caption}>
              A verified recovery session is required before this request can be
              sent.
            </Text>
          </>
        );
      case 'reset-expired':
        return (
          <>
            <Heading
              title="This reset link has expired."
              body="Ask for a new link. Your saved Menta action is still waiting."
            />
            <AppInlineNotice
              title="No account changes were made"
              description="This development-only preview does not claim that a recovery link was consumed."
              tone="warning"
            />
            <Action title="Send a new link" />
            <Action title="Back to sign in" disabled />
          </>
        );
      case 'password-updated':
        return (
          <>
            <Heading
              eyebrow="PASSWORD UPDATED"
              title="Your password is ready."
              body="Menta will take you back to your saved action."
            />
            <PromiseReceipt status="Recovery link cleared · Draft preserved" />
            <Action title="Continue" disabled />
            <Text style={styles.caption}>
              A verified server receipt is required before this completion can
              continue.
            </Text>
          </>
        );
    }
  })();

  return (
    <>
      <Frame testID={`bootstrap-email-family-${state.id}`}>{content}</Frame>
      <SimpleBottomSheet
        visible={removeSheetOpen}
        onClose={() => setRemoveSheetOpen(false)}
      >
        <Heading title="Remove this draft from this phone?" />
        <Text style={styles.body}>Your Menta account will not change.</Text>
        <Action title="Keep draft" />
        <Action title="Remove draft" />
      </SimpleBottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  lane: {
    alignSelf: 'center',
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[6],
    paddingTop: mentaSpacing[4],
    width: '100%',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: { color: mentaColors.text.primary, ...mentaTypography.control },
  brandDot: {
    backgroundColor: mentaColors.action,
    borderRadius: mentaRadii.round,
    height: 10,
    width: 10,
  },
  heading: { gap: mentaSpacing[2] },
  eyebrow: {
    color: mentaColors.action,
    textTransform: 'uppercase',
    ...mentaTypography.label,
  },
  title: { color: mentaColors.text.primary, ...mentaTypography.heading },
  body: {
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
    ...mentaTypography.body,
  },
  caption: { color: mentaColors.text.secondary, ...mentaTypography.caption },
  link: {
    color: mentaColors.action,
    textAlign: 'center',
    ...mentaTypography.body,
  },
  paperReceipt: {
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.large,
    gap: mentaSpacing[2],
    padding: mentaSpacing[5],
  },
  paperLabel: {
    color: mentaColors.text.mutedOnPaper,
    textTransform: 'uppercase',
    ...mentaTypography.label,
  },
  paperTitle: { color: mentaColors.text.onPaper, ...mentaTypography.title },
  paperMeta: {
    color: mentaColors.text.mutedOnPaper,
    ...mentaTypography.caption,
  },
  skeletonStack: { gap: mentaSpacing[3] },
  skeletonCard: { gap: mentaSpacing[2], paddingVertical: mentaSpacing[4] },
});
