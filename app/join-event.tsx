import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

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
import { isValidEventId } from '@/lib/events/links';
import { useTranslation } from '@/lib/localization';
import {
  claimPendingEventInviteEntryForUser,
  dismissPendingEventInviteEntry,
  loadPendingEventInviteEntry,
  type InboundInviteEntryLoadResult,
} from '@/lib/invites/inbound-invite-entry';
import { useAuthStore } from '@/store/auth-store';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import type { EventSummary } from '@/types/event';

const firstParam = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

type TranslateCopy = ReturnType<typeof useTranslation>['t'];

const eventDate = (
  event: EventSummary,
  locale: string,
  localise: TranslateCopy
): string => {
  const start = new Date(event.startsAt);
  if (Number.isNaN(start.getTime())) {
    return localise('groups.source.accountability.event.time_to_be_confirmed');
  }
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: event.timeZone,
    }).format(start);
  } catch {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
    }).format(start);
  }
};

const eventVisibility = (
  event: EventSummary,
  localise: TranslateCopy
): string => {
  if (event.visibility === 'invite_only') {
    return localise(
      'groups.source.accountability.event.visibility.invite_only'
    );
  }
  if (event.visibility === 'unlisted') {
    return localise('groups.source.accountability.event.visibility.unlisted');
  }
  return localise('groups.source.accountability.event.visibility.public');
};

const eventAvailability = (
  event: EventSummary,
  localise: TranslateCopy
): string => {
  if (event.capacity === null) {
    return localise('groups.source.accountability.event.availability.open');
  }
  const remaining = Math.max(event.capacity - event.reservedCount, 0);
  return remaining === 0
    ? localise('groups.source.accountability.event.availability.at_capacity')
    : localise('groups.source.accountability.event.availability.places', {
        count: remaining,
      });
};

export default function JoinEventRoute() {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const params = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = firstParam(params.eventId);
  const user = useAuthStore(state => state.user);
  const hasCompletedOnboarding = useAuthStore(
    state => state.hasCompletedOnboarding
  );
  const pendingRoute = useProtectedRouteStore(state => state.pending);
  const [result, setResult] =
    React.useState<InboundInviteEntryLoadResult<EventSummary> | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setResult(null);
    if (!isValidEventId(eventId)) {
      setResult({
        kind: 'terminal',
        message: t('groups.source.accountability.event.error.incomplete'),
      });
      return () => {
        active = false;
      };
    }

    void loadPendingEventInviteEntry({
      pendingRoute,
      eventId,
      currentUserId: user?.id ?? null,
      localise: t,
    }).then(next => {
      if (!active) return;
      setResult(next);
      if (next.kind === 'terminal') {
        dismissPendingEventInviteEntry({
          pendingRoute,
          eventId,
          currentUserId: user?.id ?? null,
        });
      }
    });

    return () => {
      active = false;
    };
  }, [eventId, pendingRoute, reloadToken, t, user?.id]);

  const dismiss = () => {
    if (isValidEventId(eventId)) {
      dismissPendingEventInviteEntry({
        pendingRoute,
        eventId,
        currentUserId: user?.id ?? null,
      });
    }
    router.replace(
      user?.id && hasCompletedOnboarding ? '/events' : '/onboarding'
    );
  };

  const continueWithEvent = () => {
    if (result?.kind !== 'ready') return;
    if (!user?.id) {
      router.replace('/login');
      return;
    }

    const claimed = claimPendingEventInviteEntryForUser({
      pendingRoute,
      eventId: result.value.eventId,
      userId: user.id,
    });
    if (!claimed) {
      setResult({
        kind: 'terminal',
        message: t('groups.source.accountability.event.error.changed'),
      });
      return;
    }

    if (!hasCompletedOnboarding) {
      router.replace('/invite-activation');
      return;
    }

    router.replace({
      pathname: '/events/[eventId]',
      params: { eventId: result.value.eventId },
    });
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
        testID="join-event-preview"
      >
        <AppTopBar
          title={t('groups.source.accountability.event.title')}
          onBack={dismiss}
          backLabel={t('groups.source.accountability.common.close')}
        />

        {!result ? (
          <View
            accessibilityLabel={t(
              'groups.source.accountability.event.checking'
            )}
            accessibilityRole="progressbar"
            style={styles.loading}
          >
            <SkeletonLoader height={68} borderRadius={mentaRadii.large} />
            <SkeletonLoader height={230} borderRadius={mentaRadii.large} />
          </View>
        ) : result.kind !== 'ready' ? (
          <View style={styles.stack}>
            <AppInlineNotice
              title={
                result.kind === 'sign_in_required'
                  ? t('fullAuth.auth_required.sign_in_to_continue')
                  : result.kind === 'retry'
                    ? t('groups.source.accountability.event.retry_title')
                    : t('groups.source.accountability.event.unavailable_title')
              }
              description={result.message}
              tone={
                result.kind === 'sign_in_required'
                  ? 'info'
                  : result.kind === 'retry'
                    ? 'warning'
                    : 'error'
              }
              actionLabel={
                result.kind === 'retry'
                  ? t('groups.source.accountability.common.try_again')
                  : undefined
              }
              onAction={
                result.kind === 'retry'
                  ? () => setReloadToken(value => value + 1)
                  : undefined
              }
            />
            {result.kind === 'sign_in_required' ? (
              <AppButton
                title={t(
                  'groups.source.accountability.common.sign_in_or_create'
                )}
                onPress={() => router.replace('/login')}
                fullWidth
                size="large"
                variant="accent"
                testID="join-event-sign-in"
              />
            ) : null}
            <AppButton
              title={
                user?.id
                  ? t('groups.source.accountability.event.browse_events')
                  : t('groups.source.accountability.common.keep_browsing')
              }
              onPress={dismiss}
              fullWidth
              variant="secondary"
            />
          </View>
        ) : (
          <View style={styles.stack}>
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>
                {result.value.inviterName
                  ? t('groups.join.invited_you', {
                      inviter: result.value.inviterName,
                    })
                  : result.value.visibility === 'invite_only'
                    ? t('groups.source.accountability.event.heading.invited')
                    : t('groups.source.accountability.event.heading.shared')}
              </Text>
              <Text style={styles.body}>
                {t('groups.source.accountability.event.intro')}
              </Text>
            </View>

            <View style={styles.eventSurface} testID="join-event-summary">
              <Text style={styles.eventContext}>
                {t('groups.source.accountability.event.context', {
                  visibility: eventVisibility(result.value, t),
                  availability: eventAvailability(result.value, t),
                })}
              </Text>
              <Text style={styles.eventTitle}>{result.value.title}</Text>
              <Text style={styles.eventMeta}>
                {eventDate(result.value, locale, t)}
              </Text>
              {result.value.venueName ? (
                <Text style={styles.eventMeta}>{result.value.venueName}</Text>
              ) : null}
              {result.value.description ? (
                <Text style={styles.eventDescription}>
                  {result.value.description}
                </Text>
              ) : null}
              <View style={styles.eventFacts}>
                <View style={styles.eventFactRow}>
                  <Text style={styles.eventFactLabel}>
                    {t('groups.source.accountability.join_promise.your_role')}
                  </Text>
                  <Text style={styles.eventFactValue}>
                    {t('events.detail.attendance')}
                  </Text>
                </View>
                <View style={styles.eventFactRow}>
                  <Text style={styles.eventFactLabel}>
                    {t('groups.admin.visibility')}
                  </Text>
                  <Text style={styles.eventFactValue}>
                    {eventVisibility(result.value, t)}
                  </Text>
                </View>
              </View>
              <Text style={styles.eventConsequence}>
                {t('events.detail.post_agreement')}
              </Text>
            </View>

            <View style={styles.actions}>
              <AppButton
                title={
                  user?.id && hasCompletedOnboarding
                    ? t('groups.source.accountability.event.review_agreement')
                    : user?.id
                      ? t('groups.source.accountability.common.finish_account')
                      : t(
                          'groups.source.accountability.common.sign_in_or_create'
                        )
                }
                onPress={continueWithEvent}
                fullWidth
                size="large"
                variant="accent"
                testID="join-event-continue"
              />
              <AppButton
                title={t('groups.source.accountability.common.not_now')}
                onPress={dismiss}
                fullWidth
                variant="ghost"
                testID="join-event-not-now"
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
  eventSurface: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
  },
  eventContext: {
    ...mentaTypography.label,
    color: mentaColors.action,
  },
  eventTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  eventMeta: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
  },
  eventDescription: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  eventFacts: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  eventFactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
    minHeight: 48,
  },
  eventFactLabel: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  eventFactValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  eventConsequence: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  actions: { gap: mentaSpacing[3] },
});
