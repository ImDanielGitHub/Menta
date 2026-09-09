import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { EventCheckInPass } from '@/components/events/EventCheckInPass';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppTopBar,
  SkeletonButton,
  SkeletonLoader,
} from '@/components/ui';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { buildEventLink } from '@/lib/events/links';
import { holdReturnedEventCapability } from '@/lib/events/protected-auth-handoff';
import { loadEventPublishRecovery } from '@/lib/events/publish-recovery';
import { useAuthStore } from '@/store/auth-store';
import { useEventStore } from '@/store/event-store';
import type { EventCreated, EventReceipt } from '@/types/event';
import { useTranslation } from '@/lib/localization';

import { backOrReplace } from '@/lib/navigation/safe-back';
const firstParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const eventLinkFor = (created: EventCreated): string =>
  buildEventLink({
    eventId: created.summary.eventId,
    capability: created.shareToken
      ? { kind: 'share', token: created.shareToken }
      : created.inviteToken
        ? { kind: 'invite', token: created.inviteToken }
        : null,
  });

type RecoveryViewState = {
  scope: string;
  loading: boolean;
  recoveryMissing: boolean;
  recoveryError: string | null;
  receipt: EventReceipt<EventCreated> | null;
};

export default function EventOrganiserPassScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = firstParam(params.eventId);
  const user = useAuthStore(state => state.user);
  const userId = user?.id ?? null;
  const publishEvent = useEventStore(state => state.publishEvent);
  const scope = `${userId ?? 'signed-out'}:${eventId ?? 'missing-event'}`;
  const activeScope = useRef(scope);
  activeScope.current = scope;
  const recoveryRequestId = useRef(0);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [recoveryView, setRecoveryView] = useState<RecoveryViewState>({
    scope,
    loading: Boolean(userId && eventId),
    recoveryMissing: false,
    recoveryError: null,
    receipt: null,
  });

  const visibleRecoveryView =
    recoveryView.scope === scope
      ? recoveryView
      : {
          scope,
          loading: Boolean(userId && eventId),
          recoveryMissing: false,
          recoveryError: null,
          receipt: null,
        };
  const { loading, recoveryMissing, recoveryError, receipt } =
    visibleRecoveryView;

  const recover = useCallback(async () => {
    const requestId = recoveryRequestId.current + 1;
    recoveryRequestId.current = requestId;
    const requestScope = scope;
    const requestIsCurrent = () =>
      recoveryRequestId.current === requestId &&
      activeScope.current === requestScope;

    setCopyNotice(null);
    setSharing(false);
    setRecoveryView({
      scope: requestScope,
      loading: Boolean(userId && eventId),
      recoveryMissing: false,
      recoveryError: null,
      receipt: null,
    });
    if (!userId || !eventId) {
      return;
    }

    let recoveryWasRead = false;
    try {
      const recovery = await loadEventPublishRecovery(userId, eventId);
      if (!requestIsCurrent()) return;
      if (!recovery) {
        setRecoveryView({
          scope: requestScope,
          loading: false,
          recoveryMissing: true,
          recoveryError: null,
          receipt: null,
        });
        return;
      }
      recoveryWasRead = true;

      const nextReceipt = await publishEvent(recovery.input, userId);
      if (!requestIsCurrent()) return;
      setRecoveryView({
        scope: requestScope,
        loading: false,
        recoveryMissing: false,
        recoveryError: null,
        receipt: nextReceipt,
      });
    } catch {
      if (!requestIsCurrent()) return;
      setRecoveryView({
        scope: requestScope,
        loading: false,
        recoveryMissing: false,
        recoveryError: recoveryWasRead
          ? t('events.pass.recovery_check_error')
          : t('events.pass.recovery_read_error'),
        receipt: null,
      });
    }
  }, [eventId, publishEvent, scope, t, userId]);

  useEffect(() => {
    void recover();
    return () => {
      recoveryRequestId.current += 1;
    };
  }, [recover]);

  const created =
    receipt?.outcome === 'completed' && receipt.data ? receipt.data : null;
  const eventLink = useMemo(
    () => (created ? eventLinkFor(created) : null),
    [created]
  );

  const copyValue = useCallback(
    async (value: string, label: string) => {
      setCopyNotice(null);
      try {
        const copied = await Clipboard.setStringAsync(value);
        if (!copied) throw new Error('Clipboard write was not confirmed');
        setCopyNotice(t('events.create.copy_success', { label }));
      } catch {
        setCopyNotice(
          t('events.create.copy_failure', { label: label.toLowerCase() })
        );
      }
    },
    [t]
  );

  const shareEvent = useCallback(async () => {
    if (!created || !eventLink || sharing) return;
    setSharing(true);
    setCopyNotice(null);
    try {
      await Share.share({
        title: created.summary.title,
        message: t('events.create.share_message', {
          event: created.summary.title,
          link: eventLink,
        }),
        url: eventLink,
      });
    } catch {
      setCopyNotice(t('events.create.share_failure'));
    } finally {
      setSharing(false);
    }
  }, [created, eventLink, sharing, t]);

  const openEvent = useCallback(() => {
    if (!created) return;
    holdReturnedEventCapability({
      userId,
      eventId: created.summary.eventId,
      shareToken: created.shareToken,
      inviteToken: created.inviteToken,
    });
    router.replace({
      pathname: '/events/[eventId]',
      params: { eventId: created.summary.eventId },
    });
  }, [created, router, userId]);

  return (
    <AppScreen
      lane="focused"
      contentContainerStyle={styles.content}
      hasTabBar={false}
      safeArea
      scrollable
      style={styles.screen}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <AppTopBar
        onBack={() => backOrReplace(router, '/events')}
        title={t('events.pass.title')}
      />
      <View style={styles.lead}>
        <Text style={styles.body}>
          {created
            ? t('events.pass.ready_body', { event: created.summary.title })
            : t('events.pass.default_body')}
        </Text>
      </View>

      {!user ? (
        <AppInlineNotice
          title={t('events.pass.sign_in_title')}
          description={t('events.pass.sign_in_body')}
          tone="warning"
          actionLabel={t('events.create.sign_in')}
          onAction={() => router.push('/auth-required')}
        />
      ) : null}

      {loading ? (
        <View
          accessible
          accessibilityLabel={t('events.pass.loading')}
          accessibilityRole="progressbar"
          testID="organiser-pass-loading"
          style={styles.pass}
        >
          <SkeletonLoader
            announce={false}
            borderRadius={mentaRadii.large}
            height={280}
          />
          <View style={styles.mainActions}>
            <SkeletonButton />
            <SkeletonButton />
          </View>
        </View>
      ) : null}

      {!loading && recoveryError ? (
        <AppInlineNotice
          title={t('events.pass.load_error')}
          description={recoveryError}
          tone="error"
          actionLabel={t('events.pass.try_again')}
          onAction={() => void recover()}
          testID="organiser-pass-storage-error"
        />
      ) : null}

      {!loading && !recoveryError && recoveryMissing ? (
        <AppInlineNotice
          title={t('events.pass.missing_title')}
          description={t('events.pass.missing_body')}
          tone="warning"
        />
      ) : null}

      {!loading && receipt && !created ? (
        <AppInlineNotice
          title={t('events.pass.not_ready')}
          description={t('events.pass.not_ready_body')}
          tone={receipt.outcome === 'unknown_result' ? 'warning' : 'error'}
          actionLabel={
            receipt.retryable ? t('events.pass.check_again') : undefined
          }
          onAction={receipt.retryable ? () => void recover() : undefined}
        />
      ) : null}

      {created ? (
        <View style={styles.pass}>
          <EventCheckInPass code={created.organiserCheckInCode} />
          {eventLink ? (
            <View style={styles.mainActions}>
              <AppButton
                title={t('events.pass.share')}
                onPress={() => void shareEvent()}
                loading={sharing}
                variant="accent"
                fullWidth
              />
              <AppButton
                title={t('events.pass.copy_link')}
                onPress={() =>
                  void copyValue(eventLink, t('events.pass.event_link_label'))
                }
                variant="secondary"
                fullWidth
              />
            </View>
          ) : null}
          {copyNotice ? (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole={
                copyNotice.startsWith('Menta could not') ? 'alert' : 'text'
              }
              style={[
                styles.copyNotice,
                copyNotice.startsWith('Menta could not') &&
                  styles.copyNoticeError,
              ]}
            >
              {copyNotice}
            </Text>
          ) : null}
          <AppButton
            title={t('events.pass.copy_code')}
            accessibilityHint={t('events.pass.copy_code_hint')}
            onPress={() =>
              void copyValue(
                created.organiserCheckInCode,
                t('events.pass.code_label')
              )
            }
            size="small"
            variant="ghost"
          />
        </View>
      ) : null}

      {created ? (
        <AppButton
          title={t('events.pass.open_event')}
          onPress={openEvent}
          variant="primary"
          fullWidth
        />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mentaColors.canvas },
  content: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    paddingTop: mentaSpacing[4],
    paddingBottom: mentaSpacing[12],
  },
  lead: { gap: mentaSpacing[3] },
  body: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
  },
  pass: { gap: mentaSpacing[3] },
  mainActions: { gap: mentaSpacing[3] },
  copyNotice: {
    ...mentaTypography.bodySmall,
    color: mentaColors.success,
  },
  copyNoticeError: { color: mentaColors.danger },
});
