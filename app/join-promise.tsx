import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  PromiseInviteContextLine,
  PromiseInviteRoleHero,
} from '@/components/onboarding/PromiseInviteRoleHero';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppTopBar,
  SkeletonLoader,
} from '@/components/ui';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';
import {
  accountabilityInviteContinueLabel,
  accountabilityInviteHeading,
  accountabilityInviteMeaning,
  accountabilityInviteRoleCopy,
  loadPromiseAccountabilityInvitePreview,
  type PromiseAccountabilityInvitePreview,
} from '@/lib/promises/accountability';
import { normalizeInviteCode } from '@/lib/invite-links';
import { useAuthStore } from '@/store/auth-store';
import { useInviteStore } from '@/store/invite-store';
import { trackProductEvent } from '@/lib/posthog';

const firstParam = (value: string | string[] | undefined): string =>
  normalizeInviteCode(Array.isArray(value) ? value[0] : value);

export default function JoinPromiseRoute() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const code = firstParam(params.code);
  const user = useAuthStore(state => state.user);
  const hasCompletedOnboarding = useAuthStore(
    state => state.hasCompletedOnboarding
  );
  const setPendingChallenge = useInviteStore(
    state => state.setPendingChallenge
  );
  const dismissPending = useInviteStore(state => state.dismissPending);
  const [preview, setPreview] =
    React.useState<PromiseAccountabilityInvitePreview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [errorKind, setErrorKind] = React.useState<'retry' | 'terminal' | null>(
    null
  );
  const [reloadToken, setReloadToken] = React.useState(0);
  const trackedStatesRef = React.useRef(new Set<string>());

  const trackInviteJourney = React.useCallback(
    (
      stage: 'preview' | 'auth_handoff',
      action: 'viewed' | 'continued' | 'dismissed' | 'retried',
      outcome: 'ready' | 'retry' | 'terminal' | 'pending' | 'not_applicable',
      role?: PromiseAccountabilityInvitePreview['role']
    ) => {
      trackProductEvent('Promise Invite Journey', {
        action,
        authenticated: Boolean(user?.id),
        entry_point: 'deep_link',
        outcome,
        role: role ?? 'unknown',
        stage,
      });
    },
    [user?.id]
  );

  React.useEffect(() => {
    let active = true;
    if (!code) {
      setLoading(false);
      setError(t('groups.source.accountability.join_promise.missing_code'));
      setErrorKind('terminal');
      return () => {
        active = false;
      };
    }
    setPendingChallenge(code, user?.id ?? null);
    setLoading(true);
    setError(null);
    setErrorKind(null);
    setPreview(null);
    void loadPromiseAccountabilityInvitePreview(code, t)
      .then(next => {
        if (!active) return;
        if (next.kind === 'ready') {
          setPreview(next.preview);
          return;
        }
        setError(next.message);
        setErrorKind(next.kind);
        if (next.kind === 'terminal') {
          const current = useInviteStore.getState().pending;
          if (current?.type === 'challenge' && current.code === code) {
            useInviteStore.getState().dismissPending(current);
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [code, reloadToken, setPendingChallenge, t, user?.id]);

  React.useEffect(() => {
    const state = loading
      ? 'loading'
      : preview
        ? `ready:${preview.role}`
        : (errorKind ?? 'empty');
    if (state === 'loading' || trackedStatesRef.current.has(state)) return;
    trackedStatesRef.current.add(state);
    trackInviteJourney(
      'preview',
      'viewed',
      preview ? 'ready' : errorKind === 'retry' ? 'retry' : 'terminal',
      preview?.role
    );
  }, [errorKind, loading, preview, trackInviteJourney]);

  const close = () => {
    trackInviteJourney('preview', 'dismissed', 'not_applicable', preview?.role);
    const current = useInviteStore.getState().pending;
    if (current?.type === 'challenge' && current.code === code) {
      dismissPending(current);
    }
    router.replace(
      user?.id && hasCompletedOnboarding ? '/(tabs)' : '/onboarding'
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen
        lane="focused"
        safeArea
        scrollable
        hasTabBar={false}
        contentContainerStyle={styles.content}
        testID="join-promise-preview"
      >
        <AppTopBar
          title={t('groups.source.accountability.join_promise.title')}
          onBack={close}
          backLabel={t('groups.source.accountability.common.close')}
        />

        {loading ? (
          <View style={styles.loading} accessibilityRole="progressbar">
            <SkeletonLoader height={76} borderRadius={mentaRadii.large} />
            <SkeletonLoader height={240} borderRadius={mentaRadii.large} />
          </View>
        ) : error || !preview ? (
          <View style={styles.stack}>
            <AppInlineNotice
              title={
                errorKind === 'retry'
                  ? t('groups.source.accountability.join_promise.retry_title')
                  : t(
                      'groups.source.accountability.join_promise.unavailable_title'
                    )
              }
              description={
                error ??
                t('groups.source.accountability.join_promise.ask_new_invite')
              }
              tone={errorKind === 'retry' ? 'warning' : 'error'}
              actionLabel={
                code && errorKind === 'retry'
                  ? t('groups.source.accountability.common.try_again')
                  : undefined
              }
              onAction={
                code && errorKind === 'retry'
                  ? () => setReloadToken(value => value + 1)
                  : undefined
              }
            />
            {errorKind === 'terminal' ? (
              <AppButton
                title={
                  user?.id
                    ? t('groups.source.accountability.join_promise.back_today')
                    : t('groups.source.accountability.common.keep_browsing')
                }
                onPress={close}
                fullWidth
                variant="secondary"
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.stack}>
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>
                {accountabilityInviteHeading(
                  preview.role,
                  preview.inviterName,
                  t
                )}
              </Text>
              <Text style={styles.body}>
                {t('groups.source.accountability.join_promise.intro')}
              </Text>
            </View>

            <PromiseInviteRoleHero
              role={preview.role}
              title={accountabilityInviteRoleCopy(preview.role, t).title}
              detail={accountabilityInviteMeaning(
                preview.role,
                preview.promiseTitle,
                t
              )}
              testID="join-promise-role-hero"
            />

            <PromiseInviteContextLine
              label={t('fullAuth.shared.promise')}
              promise={preview.promiseTitle}
              detail={
                preview.proofRule ??
                preview.promiseDescription ??
                (preview.durationDays
                  ? t('groups.create.days', { count: preview.durationDays })
                  : null)
              }
              testID="join-promise-artefact"
            />

            <View style={styles.roleRows}>
              <View style={styles.roleRow}>
                <Text style={styles.roleLabel}>
                  {t(
                    'groups.source.accountability.join_promise.proof_visibility'
                  )}
                </Text>
                <Text style={styles.roleValue}>
                  {t(
                    'groups.source.accountability.join_promise.people_visibility'
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <AppButton
                title={
                  user?.id && hasCompletedOnboarding
                    ? accountabilityInviteContinueLabel(preview.role, t)
                    : user?.id
                      ? t('groups.source.accountability.common.finish_account')
                      : t(
                          'groups.source.accountability.common.sign_in_or_create'
                        )
                }
                onPress={() => {
                  trackInviteJourney(
                    'auth_handoff',
                    'continued',
                    user?.id && hasCompletedOnboarding ? 'ready' : 'pending',
                    preview.role
                  );
                  if (user?.id && hasCompletedOnboarding) {
                    router.replace({
                      pathname: '/join-funding',
                      params: { code },
                    });
                    return;
                  }
                  router.replace(user?.id ? '/invite-activation' : '/login');
                }}
                fullWidth
                size="large"
                variant="accent"
                testID="join-promise-continue"
              />
              <AppButton
                title={t('groups.source.accountability.common.not_now')}
                onPress={close}
                fullWidth
                variant="ghost"
              />
            </View>
          </View>
        )}
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: mentaSpacing[6], paddingBottom: mentaSpacing[8] },
  loading: { gap: mentaSpacing[4] },
  stack: { gap: mentaSpacing[6] },
  heading: { gap: mentaSpacing[3] },
  title: { ...mentaTypography.heading, color: mentaColors.text.primary },
  body: { ...mentaTypography.body, color: mentaColors.text.secondary },
  roleRows: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  roleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
    minHeight: 52,
  },
  roleLabel: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  roleValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  actions: { gap: mentaSpacing[3] },
});
