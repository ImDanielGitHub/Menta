import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { LegalDocumentLinks } from '@/components/legal/LegalDocumentLinks';
import { NotificationPrivacyOnboarding } from '@/components/onboarding/NotificationPrivacyOnboarding';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppTopBar,
  SkeletonButton,
  SkeletonLoader,
} from '@/components/ui';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { CheckIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  acceptCurrentLegalDocuments,
  getMyLegalAcceptanceStatus,
  type LegalAcceptanceStatus,
} from '@/lib/legal-acceptance';
import {
  claimPendingEventInviteEntryForUser,
  dismissPendingEventInviteEntry,
  loadInboundInviteReceipt,
  projectPendingEventInviteEntry,
  type InboundInviteEntryLoadResult,
  type InboundInviteReceipt,
} from '@/lib/invites/inbound-invite-entry';
import { useTranslation } from '@/lib/localization';
import { useAuthStore } from '@/store/auth-store';
import { useInviteStore } from '@/store/invite-store';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import {
  accountabilityInviteHeading,
  accountabilityInviteMeaning,
  accountabilityInviteRoleCopy,
} from '@/lib/promises/accountability';
import {
  PromiseInviteContextLine,
  PromiseInviteRoleHero,
} from '@/components/onboarding/PromiseInviteRoleHero';
import { trackProductEvent } from '@/lib/posthog';

type ActivationStage = 'setup' | 'notifications';

export default function InviteActivationRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore(state => state.user);
  const completeOnboarding = useAuthStore(state => state.completeOnboarding);
  const pendingInvite = useInviteStore(state => state.pending);
  const pendingProtectedRoute = useProtectedRouteStore(state => state.pending);
  const [stage, setStage] = React.useState<ActivationStage>('setup');
  const [inviteResult, setInviteResult] =
    React.useState<InboundInviteEntryLoadResult<InboundInviteReceipt> | null>(
      null
    );
  const [legalStatus, setLegalStatus] =
    React.useState<LegalAcceptanceStatus | null>(null);
  const [legalConfirmed, setLegalConfirmed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const finishLockRef = React.useRef(false);
  const trackedViewsRef = React.useRef(new Set<string>());

  const receipt = inviteResult?.kind === 'ready' ? inviteResult.value : null;
  const promiseInviteRole =
    receipt?.kind === 'promise' ? receipt.promise.role : null;

  React.useEffect(() => {
    if (receipt?.kind !== 'promise') return;
    const key = `${stage}:${receipt.promise.role}`;
    if (trackedViewsRef.current.has(key)) return;
    trackedViewsRef.current.add(key);
    trackProductEvent('Promise Invite Journey', {
      action: 'viewed',
      authenticated: Boolean(user?.id),
      entry_point: 'first_account_setup',
      outcome: 'ready',
      role: receipt.promise.role,
      stage: stage === 'notifications' ? 'notification_education' : 'legal',
    });
  }, [receipt, stage, user?.id]);

  React.useEffect(() => {
    if (!user?.id) {
      router.replace('/login');
      return;
    }

    let active = true;
    const expectedUserId = user.id;
    setLoading(true);
    setError(null);
    setLegalConfirmed(false);
    void Promise.all([
      loadInboundInviteReceipt({
        pendingInvite,
        pendingProtectedRoute,
        currentUserId: expectedUserId,
        localise: t,
      }),
      getMyLegalAcceptanceStatus(expectedUserId),
    ])
      .then(([nextInvite, nextLegal]) => {
        if (!active || useAuthStore.getState().user?.id !== expectedUserId) {
          return;
        }
        if (!nextInvite) {
          setInviteResult({
            kind: 'terminal',
            message: t('fullAuth.source.accountability.no_invitation_waiting'),
          });
        } else {
          setInviteResult(nextInvite);
        }
        setLegalStatus(nextLegal);
      })
      .catch(() => {
        if (!active) return;
        setInviteResult({
          kind: 'retry',
          message: t(
            'fullAuth.source.accountability.invitation_and_documents_check_failed'
          ),
        });
        setLegalStatus(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pendingInvite, pendingProtectedRoute, reloadToken, router, t, user?.id]);

  React.useEffect(() => {
    if (inviteResult?.kind !== 'terminal') return;
    if (pendingInvite) {
      useInviteStore.getState().dismissPending(pendingInvite);
      return;
    }
    const event = projectPendingEventInviteEntry({
      pendingRoute: pendingProtectedRoute,
      currentUserId: user?.id ?? null,
    });
    if (event) {
      dismissPendingEventInviteEntry({
        pendingRoute: pendingProtectedRoute,
        eventId: event.eventId,
        currentUserId: user?.id ?? null,
      });
    }
  }, [inviteResult?.kind, pendingInvite, pendingProtectedRoute, user?.id]);

  const prepareNotifications = async () => {
    if (!user?.id || !legalStatus || inviteResult?.kind !== 'ready' || saving) {
      return;
    }
    if (legalStatus.requiresAcceptance && !legalConfirmed) return;

    const expectedUserId = user.id;
    if (inviteResult.value.kind === 'promise') {
      trackProductEvent('Promise Invite Journey', {
        action: 'continued',
        authenticated: true,
        entry_point: 'first_account_setup',
        outcome: 'pending',
        role: inviteResult.value.promise.role,
        stage: 'legal',
      });
    }
    setSaving(true);
    setError(null);
    try {
      if (legalStatus.requiresAcceptance) {
        const accepted = await acceptCurrentLegalDocuments(
          legalStatus,
          'account_creation',
          expectedUserId
        );
        if (accepted.requiresAcceptance || !accepted.accepted) {
          throw new Error(
            t('fullAuth.source.accountability.documents_need_agreement')
          );
        }
        setLegalStatus(accepted);
      }
      if (useAuthStore.getState().user?.id !== expectedUserId) {
        throw new Error(
          t('fullAuth.source.accountability.account_changed_reopen_invite')
        );
      }
      if (inviteResult.value.kind === 'promise') {
        trackProductEvent('Promise Invite Journey', {
          action: 'completed',
          authenticated: true,
          entry_point: 'first_account_setup',
          outcome: 'succeeded',
          role: inviteResult.value.promise.role,
          stage: 'legal',
        });
      }
      setStage('notifications');
    } catch (reason) {
      if (inviteResult.value.kind === 'promise') {
        trackProductEvent('Promise Invite Journey', {
          action: 'completed',
          authenticated: true,
          entry_point: 'first_account_setup',
          outcome: 'failed',
          role: inviteResult.value.promise.role,
          stage: 'legal',
        });
      }
      setError(
        reason instanceof Error
          ? reason.message
          : t('fullAuth.source.accountability.save_agreement_failed')
      );
    } finally {
      setSaving(false);
    }
  };

  const finishInviteActivation = async () => {
    if (
      finishLockRef.current ||
      !user?.id ||
      inviteResult?.kind !== 'ready' ||
      !legalStatus?.accepted
    ) {
      return;
    }

    finishLockRef.current = true;
    const expectedUserId = user.id;
    setSaving(true);
    setError(null);
    try {
      let claimed = false;
      if (
        inviteResult.value.kind === 'promise' ||
        inviteResult.value.kind === 'group'
      ) {
        claimed = Boolean(
          useInviteStore.getState().claimPendingForUser(expectedUserId)
        );
      } else {
        claimed = claimPendingEventInviteEntryForUser({
          pendingRoute: pendingProtectedRoute,
          eventId: inviteResult.value.event.eventId,
          userId: expectedUserId,
        });
      }
      if (!claimed) {
        throw new Error(t('fullAuth.source.accountability.invitation_changed'));
      }

      await completeOnboarding({
        activationPath:
          inviteResult.value.kind === 'promise'
            ? 'promise_invite'
            : inviteResult.value.kind === 'group'
              ? 'group_invite'
              : 'event_invite',
      });
      if (useAuthStore.getState().user?.id !== expectedUserId) {
        throw new Error(
          t('fullAuth.source.accountability.account_changed_reopen_invite')
        );
      }
      // Root owns the one continuation. It sees this bounded onboarding route,
      // then reopens the still-held promise or event before any join mutation.
      router.replace('/invite-activation');
      if (inviteResult.value.kind === 'promise') {
        trackProductEvent('Promise Invite Journey', {
          action: 'completed',
          authenticated: true,
          entry_point: 'first_account_setup',
          outcome: 'succeeded',
          role: inviteResult.value.promise.role,
          stage: 'account_setup',
        });
      }
    } catch (reason) {
      if (inviteResult.value.kind === 'promise') {
        trackProductEvent('Promise Invite Journey', {
          action: 'completed',
          authenticated: true,
          entry_point: 'first_account_setup',
          outcome: 'failed',
          role: inviteResult.value.promise.role,
          stage: 'account_setup',
        });
      }
      setError(
        reason instanceof Error
          ? reason.message
          : t('fullAuth.source.accountability.finish_setup_failed')
      );
      finishLockRef.current = false;
      setSaving(false);
    }
  };

  if (stage === 'notifications' && user?.id) {
    return (
      <NotificationPrivacyOnboarding
        completionLabel={t(
          'fullAuth.source.accountability.continue_to_invitation'
        )}
        userId={user.id}
        promptContext={promiseInviteRole ? 'promise_invite' : 'settings'}
        promiseInviteRole={promiseInviteRole}
        onBack={() => setStage('setup')}
        onComplete={() => void finishInviteActivation()}
      />
    );
  }

  const title =
    receipt?.kind === 'promise'
      ? accountabilityInviteHeading(
          receipt.promise.role,
          receipt.promise.inviterName,
          t
        )
      : receipt?.kind === 'group'
        ? receipt.group.inviterName
          ? t('groups.join.invited_you', {
              inviter: receipt.group.inviterName,
            })
          : t('fullAuth.onboarding.review_group_invite')
        : receipt?.kind === 'event'
          ? receipt.event.inviterName
            ? t('groups.join.invited_you', {
                inviter: receipt.event.inviterName,
              })
            : t('fullAuth.source.accountability.event_invited', {
                eventTitle: receipt.event.title,
              })
          : t('fullAuth.source.accountability.continue_with_invitation');
  const objectTitle =
    receipt?.kind === 'promise'
      ? receipt.promise.promiseTitle
      : receipt?.kind === 'group'
        ? receipt.group.groupName
        : receipt?.kind === 'event'
          ? receipt.event.title
          : null;
  const roleValue =
    receipt?.kind === 'promise'
      ? accountabilityInviteRoleCopy(receipt.promise.role, t).title
      : receipt?.kind === 'group'
        ? t('groups.source.role.member')
        : receipt?.kind === 'event'
          ? t('events.detail.attendance')
          : null;
  const visibilityValue =
    receipt?.kind === 'promise'
      ? t('groups.source.accountability.join_promise.people_visibility')
      : receipt?.kind === 'group'
        ? receipt.group.privacy === 'public'
          ? t('groups.preview.public')
          : receipt.group.privacy
            ? t('groups.preview.private')
            : null
        : receipt?.kind === 'event'
          ? receipt.event.visibility === 'public'
            ? t('events.detail.visibility.public')
            : receipt.event.visibility === 'unlisted'
              ? t('events.detail.visibility.unlisted')
              : t('events.detail.visibility.invite_only')
          : null;
  const proofConsequence =
    receipt?.kind === 'promise'
      ? t('groups.source.accountability.join_promise.intro')
      : receipt?.kind === 'group'
        ? t('groups.join.how_it_works_detail')
        : receipt?.kind === 'event'
          ? t('events.detail.post_agreement')
          : null;
  const unavailableMessage =
    inviteResult && inviteResult.kind !== 'ready'
      ? inviteResult.message
      : t('fullAuth.source.accountability.documents_check_failed');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen
        lane="focused"
        safeArea
        scrollable
        hasTabBar={false}
        contentContainerStyle={styles.content}
        testID="invite-activation"
      >
        <AppTopBar
          title={t('fullAuth.source.accountability.account_setup')}
          backLabel={t('fullAuth.onboarding.back')}
          onBack={() => router.replace('/login')}
        />

        {loading ? (
          <View accessibilityRole="progressbar" style={styles.loading}>
            <SkeletonLoader height={96} borderRadius={mentaRadii.large} />
            <SkeletonLoader height={180} borderRadius={mentaRadii.large} />
            <SkeletonButton />
          </View>
        ) : inviteResult?.kind !== 'ready' || !legalStatus ? (
          <View style={styles.stack}>
            <AppInlineNotice
              title={
                inviteResult?.kind === 'retry'
                  ? t('fullAuth.source.accountability.setup_load_failed')
                  : t('fullAuth.source.accountability.invitation_unavailable')
              }
              description={unavailableMessage}
              tone={inviteResult?.kind === 'retry' ? 'warning' : 'error'}
              actionLabel={
                inviteResult?.kind === 'retry'
                  ? t('fullAuth.shared.try_again')
                  : undefined
              }
              onAction={
                inviteResult?.kind === 'retry'
                  ? () => setReloadToken(value => value + 1)
                  : undefined
              }
            />
            <AppButton
              title={t('fullAuth.source.accountability.start_own_promise')}
              onPress={() => router.replace('/onboarding')}
              fullWidth
              variant="secondary"
            />
          </View>
        ) : (
          <View style={styles.stack}>
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text style={styles.body}>
                {t('fullAuth.source.accountability.setup_then_review')}
              </Text>
            </View>

            {receipt?.kind === 'promise' ? (
              <>
                <PromiseInviteRoleHero
                  compact
                  role={receipt.promise.role}
                  title={
                    accountabilityInviteRoleCopy(receipt.promise.role, t).title
                  }
                  detail={accountabilityInviteMeaning(
                    receipt.promise.role,
                    receipt.promise.promiseTitle,
                    t
                  )}
                  testID="invite-activation-role-context"
                />
                <PromiseInviteContextLine
                  label={t('fullAuth.shared.promise')}
                  promise={receipt.promise.promiseTitle}
                  detail={receipt.promise.proofRule}
                  testID="invite-activation-promise-context"
                />
              </>
            ) : objectTitle ? (
              <View style={styles.inviteObject}>
                <Text style={styles.objectLabel}>
                  {receipt?.kind === 'event'
                    ? t('events.detail.stage.event')
                    : receipt?.kind === 'group'
                      ? t('groups.preview.group')
                      : t('fullAuth.shared.promise')}
                </Text>
                <Text style={styles.objectTitle}>{objectTitle}</Text>
                {roleValue && visibilityValue ? (
                  <View style={styles.inviteFacts}>
                    <View style={styles.inviteFactRow}>
                      <Text style={styles.inviteFactLabel}>
                        {t(
                          'groups.source.accountability.join_promise.your_role'
                        )}
                      </Text>
                      <Text style={styles.inviteFactValue}>{roleValue}</Text>
                    </View>
                    <View style={styles.inviteFactRow}>
                      <Text style={styles.inviteFactLabel}>
                        {t('groups.admin.visibility')}
                      </Text>
                      <Text style={styles.inviteFactValue}>
                        {visibilityValue}
                      </Text>
                    </View>
                  </View>
                ) : null}
                {proofConsequence ? (
                  <Text style={styles.objectDetail}>{proofConsequence}</Text>
                ) : null}
              </View>
            ) : null}

            <LegalDocumentLinks
              documents={legalStatus.current}
              presentation="onboarding"
              testID="invite-activation-legal-documents"
            />

            {legalStatus.requiresAcceptance ? (
              <Pressable
                accessibilityLabel={t(
                  'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st'
                )}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: legalConfirmed }}
                disabled={saving}
                onPress={() => setLegalConfirmed(current => !current)}
                style={({ pressed }) => [
                  styles.agreement,
                  pressed && styles.pressed,
                ]}
                testID="invite-activation-legal-confirmation"
              >
                <View
                  style={[
                    styles.checkbox,
                    legalConfirmed && styles.checkboxChecked,
                  ]}
                >
                  {legalConfirmed ? (
                    <CheckIcon color={mentaColors.canvas} size={18} />
                  ) : null}
                </View>
                <Text style={styles.agreementText}>
                  {t(
                    'fullAuth.onboarding.i_agree_to_menta_s_terms_of_use_and_community_st'
                  )}
                </Text>
              </Pressable>
            ) : (
              <AppInlineNotice
                title={t(
                  'fullAuth.source.accountability.agreements_current_title'
                )}
                description={t(
                  'fullAuth.source.accountability.agreements_current_description'
                )}
                tone="success"
              />
            )}

            {error ? (
              <AppInlineNotice
                title={t(
                  'fullAuth.source.accountability.setup_incomplete_title'
                )}
                description={error}
                tone="error"
                testID="invite-activation-error"
              />
            ) : null}

            <AppButton
              title={t('fullAuth.source.accountability.choose_reminders')}
              onPress={() => void prepareNotifications()}
              disabled={
                saving || (legalStatus.requiresAcceptance && !legalConfirmed)
              }
              loading={saving}
              fullWidth
              size="large"
              variant="accent"
              testID="invite-activation-continue"
            />
          </View>
        )}
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: mentaSpacing[6], paddingBottom: mentaSpacing[8] },
  loading: { gap: mentaSpacing[4] },
  stack: { gap: mentaSpacing[5] },
  heading: { gap: mentaSpacing[3] },
  title: { ...mentaTypography.heading, color: mentaColors.text.primary },
  body: { ...mentaTypography.body, color: mentaColors.text.secondary },
  inviteObject: {
    backgroundColor: mentaColors.paper,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    padding: mentaSpacing[5],
  },
  objectLabel: {
    ...mentaTypography.label,
    color: mentaColors.actionOnPaper,
  },
  objectTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
  },
  objectDetail: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
  },
  inviteFacts: {
    borderBottomColor: mentaColors.borderPaper,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.borderPaper,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inviteFactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
    minHeight: 48,
  },
  inviteFactLabel: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
  },
  inviteFactValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.onPaper,
    flex: 1,
    textAlign: 'right',
  },
  agreement: {
    alignItems: 'flex-start',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 56,
    padding: mentaSpacing[4],
  },
  checkbox: {
    alignItems: 'center',
    borderColor: mentaColors.text.secondary,
    borderRadius: mentaRadii.small,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: mentaColors.action,
    borderColor: mentaColors.action,
  },
  agreementText: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.primary,
    flex: 1,
  },
  pressed: { opacity: 0.78 },
});
