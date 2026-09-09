import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { AppScreen } from '@/components/ui/AppShell';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypeScale,
} from '@/constants/MentaDesignSystem';
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  RefreshCwIcon,
  TargetIcon,
} from '@/components/ui/icons';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import {
  SkeletonButton,
  SkeletonLoader,
  SkeletonText,
} from '@/components/ui/SkeletonLoader';
import { mentaFonts } from '@/lib/menta-fonts';
import { createClientEventId } from '@/lib/client-event-id';
import {
  prepareEventAuthHandoff,
  transferEventCapability,
} from '@/lib/events/protected-auth-handoff';
import { useEventCapabilityHydration } from '@/lib/events/use-event-capability-hydration';
import { useAuthStore } from '@/store/auth-store';
import { useEventStore } from '@/store/event-store';
import type { EventReceipt, EventSummary } from '@/types/event';
import { useTranslation } from '@/lib/localization';
import { formatEventDateTime } from '@/lib/events/localized-formatting';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';

import { backOrReplace } from '@/lib/navigation/safe-back';
type DetailStage = 'detail' | 'agreement' | 'joined';
type ParticipationRole = 'checking' | 'organiser' | 'attendee';

const firstParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const availability = (
  summary: EventSummary,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  if (summary.capacity === null) return t('events.detail.availability.open');
  const remaining = Math.max(summary.capacity - summary.reservedCount, 0);
  return remaining === 0
    ? t('events.detail.availability.full')
    : t('events.detail.availability.remaining', { count: remaining });
};

const visibilityLabel = (
  summary: EventSummary,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  if (summary.visibility === 'public')
    return t('events.detail.visibility.public');
  if (summary.visibility === 'unlisted')
    return t('events.detail.visibility.unlisted');
  return t('events.detail.visibility.invite_only');
};

const isAtCapacity = (summary: EventSummary): boolean =>
  summary.capacity !== null && summary.reservedCount >= summary.capacity;

export default function EventDetailScreen() {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const phoneLayout = usePhoneLayout();
  const params = useLocalSearchParams<{
    eventId?: string | string[];
    shareToken?: string | string[];
    inviteToken?: string | string[];
  }>();
  const eventId = firstParam(params.eventId);
  const user = useAuthStore(state => state.user);
  const routeShareToken = firstParam(params.shareToken);
  const routeInviteToken = firstParam(params.inviteToken);
  const replaceSafeEventRoute = useCallback(
    (href: { pathname: string; params: { eventId: string } }) =>
      router.replace(href as never),
    [router]
  );
  const {
    ready: capabilityReady,
    invalid: capabilityInvalid,
    shareToken,
    inviteToken,
  } = useEventCapabilityHydration({
    userId: user?.id,
    eventId,
    surface: 'detail',
    explicitShareToken: routeShareToken,
    explicitInviteToken: routeInviteToken,
    replace: replaceSafeEventRoute,
  });
  const summary = useEventStore(state => state.summary);
  const myOccurrence = useEventStore(state => state.myOccurrence);
  const loading = useEventStore(state => state.loading);
  const error = useEventStore(state => state.error);
  const loadSummary = useEventStore(state => state.loadSummary);
  const loadMyOccurrence = useEventStore(state => state.loadMyOccurrence);
  const loadOrganiserReviewQueue = useEventStore(
    state => state.loadOrganiserReviewQueue
  );
  const joinEvent = useEventStore(state => state.joinEvent);

  const [stage, setStage] = useState<DetailStage>('detail');
  const [joining, setJoining] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [participationRole, setParticipationRole] = useState<ParticipationRole>(
    user ? 'checking' : 'attendee'
  );
  const [joinReceipt, setJoinReceipt] = useState<EventReceipt<unknown> | null>(
    null
  );
  const joinClientEventId = useRef<string | null>(null);
  const activeSummary = summary?.eventId === eventId ? summary : null;
  const attendance =
    myOccurrence &&
    myOccurrence.summary.occurrenceId === activeSummary?.occurrenceId
      ? myOccurrence.attendance
      : null;
  const load = useCallback(async () => {
    if (!eventId || !capabilityReady) return;
    setSessionExpired(false);
    const summaryReceipt = await loadSummary({
      eventId,
      shareToken: shareToken ?? null,
      inviteToken: inviteToken ?? null,
    });
    if (summaryReceipt.outcome === 'completed' && summaryReceipt.data && user) {
      const [mine, reviewQueue] = await Promise.all([
        loadMyOccurrence(summaryReceipt.data.occurrenceId),
        loadOrganiserReviewQueue(summaryReceipt.data.occurrenceId),
      ]);
      if (mine.code === 'AUTHENTICATION_REQUIRED') setSessionExpired(true);

      // This self-scoped read is an access preflight, not attendee data. A
      // forbidden receipt is expected for non-organisers and stays out of the
      // normal event error surface.
      setParticipationRole(
        reviewQueue.outcome === 'completed' ? 'organiser' : 'attendee'
      );
    }
  }, [
    eventId,
    capabilityReady,
    inviteToken,
    loadMyOccurrence,
    loadOrganiserReviewQueue,
    loadSummary,
    shareToken,
    user,
  ]);

  useEffect(() => {
    setParticipationRole(user ? 'checking' : 'attendee');
  }, [eventId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (attendance?.state === 'joined') setStage('joined');
  }, [attendance?.state]);

  const joinedAt = useMemo(() => {
    if (!attendance?.joinedAt) return null;
    const joined = new Date(attendance.joinedAt);
    return Number.isNaN(joined.getTime())
      ? null
      : new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
        }).format(joined);
  }, [attendance?.joinedAt, locale]);

  const submitJoin = useCallback(async () => {
    if (!activeSummary || joining) return;
    if (!user) {
      setSessionExpired(true);
      return;
    }

    setJoining(true);
    setSessionExpired(false);
    const clientEventId =
      joinClientEventId.current ??
      (joinClientEventId.current = createClientEventId());
    const receipt = await joinEvent({
      occurrenceId: activeSummary.occurrenceId,
      clientEventId,
      consentVersion: activeSummary.consentVersion,
      shareToken: shareToken ?? null,
      inviteToken: inviteToken ?? null,
    });
    setJoinReceipt(receipt);

    if (receipt.outcome === 'completed') {
      setStage('joined');
      // This refresh does not create the receipt. It only restores the
      // server-owned attendance state after navigation or a cold restart.
      await loadMyOccurrence(activeSummary.occurrenceId);
    } else if (receipt.code === 'AUTHENTICATION_REQUIRED') {
      setSessionExpired(true);
    }
    setJoining(false);
  }, [
    activeSummary,
    inviteToken,
    joinEvent,
    joining,
    loadMyOccurrence,
    shareToken,
    user,
  ]);

  const openSignIn = useCallback(() => {
    const destination = prepareEventAuthHandoff({
      eventId,
      surface: 'detail',
      shareToken,
      inviteToken,
    });
    if (!destination) {
      router.push('/login');
      return;
    }

    router.push(destination);
  }, [eventId, inviteToken, router, shareToken]);

  if (!eventId) {
    return (
      <AppScreen
        lane="working"
        safeArea
        padding={false}
        hasTabBar={false}
        style={styles.screen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.missingState, screenInsetPadding(phoneLayout)]}>
          <Text style={styles.stateTitle}>
            {t('events.detail.link.incomplete')}
          </Text>
          <AppButton
            title={t('events.index.title')}
            onPress={() => router.replace('/events')}
            variant="primary"
            fullWidth
          />
        </View>
      </AppScreen>
    );
  }

  if (capabilityInvalid) {
    return (
      <AppScreen
        lane="working"
        safeArea
        padding={false}
        hasTabBar={false}
        style={styles.screen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.missingState, screenInsetPadding(phoneLayout)]}>
          <Text style={styles.stateTitle}>
            {t('events.detail.link.invalid')}
          </Text>
          <Text style={styles.stateBody}>
            {t('events.detail.link.invalid_body')}
          </Text>
          <AppButton
            title={t('events.index.title')}
            onPress={() => router.replace('/events')}
            variant="primary"
            fullWidth
          />
        </View>
      </AppScreen>
    );
  }

  const hasUnknownResult = joinReceipt?.outcome === 'unknown_result';
  const failedJoin = joinReceipt?.outcome === 'failed' && !sessionExpired;
  const canReviewEventParticipation = participationRole === 'organiser';

  return (
    <AppScreen
      lane="working"
      safeArea
      padding={false}
      hasTabBar={false}
      style={styles.screen}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          screenInsetPadding(phoneLayout),
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void load()}
            tintColor={mentaColors.action}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('events.detail.back')}
            onPress={() => backOrReplace(router, '/events')}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeftIcon color={mentaColors.text.primary} size={20} />
          </Pressable>
          <Text style={styles.topLabel}>
            {stage === 'agreement'
              ? t('events.detail.stage.agreement')
              : t('events.detail.stage.event')}
          </Text>
          <View style={styles.trailingLane} />
        </View>

        {!activeSummary && loading ? (
          <View
            accessible
            accessibilityLabel={t('events.detail.loading')}
            accessibilityRole="progressbar"
            style={styles.loadingState}
          >
            <SkeletonLoader
              announce={false}
              height={mentaLayout.minimumTouchTarget}
              width="58%"
            />
            <SkeletonLoader
              announce={false}
              height={mentaSpacing[12] + mentaSpacing[4]}
            />
            <SkeletonText announce={false} lines={2} width="88%" />
            <View style={styles.loadingRows}>
              <SkeletonLoader
                height={mentaSpacing[8]}
                width={mentaLayout.iconLane}
                announce={false}
              />
              <SkeletonLoader
                height={mentaSpacing[8]}
                width="72%"
                announce={false}
              />
            </View>
            <View style={styles.loadingRows}>
              <SkeletonLoader
                height={mentaSpacing[8]}
                width={mentaLayout.iconLane}
                announce={false}
              />
              <SkeletonLoader
                height={mentaSpacing[8]}
                width="54%"
                announce={false}
              />
            </View>
            <SkeletonText announce={false} lines={3} width="92%" />
            <SkeletonButton />
          </View>
        ) : null}

        {!activeSummary && !loading ? (
          <View style={styles.loadingState}>
            <Text style={styles.stateTitle}>
              {t('events.detail.unavailable')}
            </Text>
            <Text style={styles.stateBody}>
              {error ?? t('events.detail.unavailable_body')}
            </Text>
            <AppButton
              title={t('events.detail.browse_public')}
              onPress={() => router.replace('/events')}
              variant="secondary"
            />
          </View>
        ) : null}

        {activeSummary && stage === 'detail' ? (
          <>
            <View style={styles.detailLead}>
              <Text accessibilityRole="header" style={styles.title}>
                {activeSummary.title}
              </Text>
              <View style={styles.eventMetadata}>
                <Text style={styles.eventMetadataCopy}>
                  {visibilityLabel(activeSummary, t)}
                </Text>
                <Text accessible={false} style={styles.eventMetadataSeparator}>
                  ·
                </Text>
                <Text
                  style={[
                    styles.eventMetadataCopy,
                    isAtCapacity(activeSummary) && styles.eventMetadataWarning,
                  ]}
                >
                  {availability(activeSummary, t)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRows}>
              <View style={styles.detailRow}>
                <ClockIcon color={mentaColors.action} size={18} />
                <Text style={styles.detailText}>
                  {formatEventDateTime({
                    value: activeSummary.startsAt,
                    locale,
                    timeZone: activeSummary.timeZone,
                    fallback: t('events.index.time.tbc'),
                  })}
                </Text>
              </View>
              {activeSummary.venueName ? (
                <View style={styles.detailRow}>
                  <TargetIcon color={mentaColors.action} size={18} />
                  <Text style={styles.detailText}>
                    {activeSummary.venueName}
                  </Text>
                </View>
              ) : null}
            </View>

            {activeSummary.description ? (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionLabel}>
                  {t('events.detail.about')}
                </Text>
                <Text style={styles.description}>
                  {activeSummary.description}
                </Text>
              </View>
            ) : null}

            {participationRole === 'checking' ? (
              <SkeletonLoader
                announce={false}
                height={mentaLayout.minimumTouchTarget}
              />
            ) : null}

            {participationRole === 'attendee' ? (
              <>
                <Text style={styles.helperCopy}>
                  {t('events.detail.join_helper')}
                </Text>
                <AppButton
                  title={
                    attendance?.state === 'joined'
                      ? t('events.detail.view_joined_receipt')
                      : t('events.detail.review_agreement')
                  }
                  onPress={() =>
                    setStage(
                      attendance?.state === 'joined' ? 'joined' : 'agreement'
                    )
                  }
                  variant="primary"
                  fullWidth
                  testID="review-event-agreement"
                />
              </>
            ) : null}

            {canReviewEventParticipation ? (
              <AppButton
                title={t('events.detail.open_organiser_pass')}
                onPress={() =>
                  router.push({
                    pathname: '/events/[eventId]/organiser-pass',
                    params: { eventId: activeSummary.eventId },
                  } as unknown as Href)
                }
                variant="primary"
                fullWidth
                testID="open-organiser-pass"
                accessibilityHint={t('events.detail.organiser_pass_hint')}
              />
            ) : null}
          </>
        ) : null}

        {activeSummary && stage === 'agreement' ? (
          <>
            <View style={styles.detailLead}>
              <Text accessibilityRole="header" style={styles.title}>
                {t('events.detail.review_attendance')}
              </Text>
            </View>
            <View style={styles.agreementSurface}>
              <Text style={styles.agreementTitle}>
                {t('events.detail.post_visible')}
              </Text>
              <Text style={styles.agreementBody}>
                {t('events.detail.post_agreement')}
              </Text>
              <View style={styles.agreementRule}>
                <CheckIcon color={mentaColors.success} size={18} />
                <Text style={styles.agreementRuleCopy}>
                  {t('events.detail.allow_check_in')}
                </Text>
              </View>
            </View>

            <Text style={styles.helperCopy}>
              {t('events.detail.terms_check')}
            </Text>

            {!user || sessionExpired ? (
              <AppInlineNotice
                actionLabel={t('events.detail.sign_in')}
                description={t('events.detail.sign_in_return_agreement')}
                onAction={openSignIn}
                testID="event-join-auth-required"
                title={
                  sessionExpired
                    ? t('events.detail.session_ended')
                    : t('events.detail.sign_in_to_join')
                }
                tone="info"
              />
            ) : null}

            {hasUnknownResult ? (
              <AppInlineNotice
                description={
                  joinReceipt?.message
                    ? t('events.detail.join_unknown_with_message', {
                        message: joinReceipt.message,
                      })
                    : t('events.detail.join_unknown_body')
                }
                testID="event-join-unknown"
                title={t('events.detail.join_unknown')}
                tone="warning"
              />
            ) : null}

            {failedJoin ? (
              <AppInlineNotice
                description={
                  joinReceipt?.message ?? t('events.detail.try_again')
                }
                testID="event-join-failed"
                title={t('events.detail.join_failed')}
                tone="error"
              />
            ) : null}

            {user && !sessionExpired ? (
              <AppButton
                title={
                  hasUnknownResult
                    ? t('events.detail.check_join_status')
                    : t('events.detail.agree_join')
                }
                onPress={() => void submitJoin()}
                loading={joining}
                variant={hasUnknownResult ? 'primary' : 'accent'}
                fullWidth
                accessibilityHint={t('events.detail.join_hint')}
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('events.detail.return_to_event')}
              disabled={joining}
              onPress={() => setStage('detail')}
              style={({ pressed }) => [
                styles.notNow,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.notNowCopy}>
                {t('events.detail.return_to_event')}
              </Text>
            </Pressable>
          </>
        ) : null}

        {activeSummary && stage === 'joined' ? (
          <>
            <View style={styles.receiptLead}>
              <Text accessibilityRole="header" style={styles.title}>
                {t('events.detail.going')}
              </Text>
              <Text style={styles.stateBody}>
                {joinedAt
                  ? t('events.detail.place_confirmed', { time: joinedAt })
                  : t('events.detail.place_confirmed_no_time')}
              </Text>
            </View>
            <View style={styles.receiptSurface}>
              <Text style={styles.sectionLabel}>
                {t('events.detail.attendance')}
              </Text>
              <Text style={styles.receiptTitle}>{activeSummary.title}</Text>
              <Text style={styles.receiptBody}>
                {t('events.detail.joined_receipt')}
              </Text>
            </View>
            {error ? (
              <AppInlineNotice
                actionLabel={t('events.detail.attendance_refresh')}
                description={t('events.detail.attendance_refresh_body', {
                  error,
                })}
                onAction={() =>
                  void loadMyOccurrence(activeSummary.occurrenceId)
                }
                testID="event-attendance-refresh-error"
                title={t('events.detail.attendance_refresh_title')}
                tone="warning"
              />
            ) : null}
            <View style={styles.actionStack}>
              {!attendance?.checkedInAt ? (
                <AppButton
                  title={t('events.detail.enter_organiser_code')}
                  onPress={() => {
                    transferEventCapability({
                      userId: user?.id,
                      eventId: activeSummary.eventId,
                      from: 'detail',
                      to: 'check-in',
                    });
                    router.push({
                      pathname: '/events/[eventId]/check-in',
                      params: { eventId: activeSummary.eventId },
                    });
                  }}
                  variant="primary"
                  fullWidth
                  accessibilityHint={t('events.detail.organiser_code_hint')}
                />
              ) : null}
              {attendance?.checkedInAt ? (
                <AppButton
                  title={t('events.detail.add_photo')}
                  onPress={() => {
                    transferEventCapability({
                      userId: user?.id,
                      eventId: activeSummary.eventId,
                      from: 'detail',
                      to: 'proof',
                    });
                    router.push({
                      pathname: '/events/[eventId]/proof',
                      params: { eventId: activeSummary.eventId },
                    } as unknown as Href);
                  }}
                  variant="primary"
                  fullWidth
                  accessibilityHint={t('events.detail.add_photo_hint')}
                />
              ) : null}
              {attendance?.checkedInAt ? (
                <AppButton
                  title={t('events.detail.open_album')}
                  onPress={() =>
                    router.push({
                      pathname: '/events/[eventId]/album',
                      params: {
                        eventId: activeSummary.eventId,
                        occurrenceId: activeSummary.occurrenceId,
                      },
                    } as unknown as Href)
                  }
                  variant="secondary"
                  fullWidth
                  accessibilityHint={t('events.detail.open_album_hint')}
                />
              ) : null}
              {canReviewEventParticipation ? (
                <AppButton
                  title={t('events.detail.review_participation')}
                  onPress={() =>
                    router.push({
                      pathname: '/events/organiser-review/[occurrenceId]',
                      params: { occurrenceId: activeSummary.occurrenceId },
                    } as unknown as Href)
                  }
                  variant="secondary"
                  fullWidth
                  accessibilityHint={t(
                    'events.detail.review_participation_hint'
                  )}
                />
              ) : null}
              {activeSummary.occurrenceState === 'ended' ? (
                <AppButton
                  title={t('events.detail.recap')}
                  onPress={() =>
                    router.push({
                      pathname: '/events/[eventId]/recap',
                      params: { eventId: activeSummary.eventId },
                    } as unknown as Href)
                  }
                  variant="secondary"
                  fullWidth
                  accessibilityHint={t('events.detail.recap_hint')}
                />
              ) : null}
              <AppButton
                title={t('events.detail.attendance_refresh')}
                onPress={() =>
                  void loadMyOccurrence(activeSummary.occurrenceId)
                }
                variant="ghost"
                fullWidth
                leftIcon={
                  <RefreshCwIcon color={mentaColors.text.primary} size={18} />
                }
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mentaColors.canvas },
  content: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[6],
    paddingBottom: mentaSpacing[12],
  },
  missingState: {
    flex: 1,
    gap: mentaSpacing[4],
    justifyContent: 'center',
    paddingHorizontal: mentaLayout.screenInset,
    paddingVertical: mentaSpacing[10],
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: mentaLayout.trailingActionLane,
  },
  iconButton: {
    alignItems: 'center',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    height: mentaLayout.trailingActionLane,
    justifyContent: 'center',
    width: mentaLayout.trailingActionLane,
  },
  topLabel: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.semibold,
    ...mentaTypeScale.bodySmall,
  },
  trailingLane: { width: mentaLayout.trailingActionLane },
  loadingState: {
    alignItems: 'flex-start',
    gap: mentaSpacing[4],
    paddingTop: mentaSpacing[12],
  },
  loadingRows: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  detailLead: { gap: mentaSpacing[2] },
  receiptLead: {
    alignItems: 'center',
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[8],
  },
  title: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.medium,
    ...mentaTypeScale.display,
  },
  eventMetadata: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mentaSpacing[2],
  },
  eventMetadataCopy: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.bodySmall,
  },
  eventMetadataSeparator: {
    color: mentaColors.text.muted,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.bodySmall,
  },
  eventMetadataWarning: { color: mentaColors.warning },
  detailRows: {
    borderBottomColor: mentaColors.border,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 52,
  },
  detailText: {
    color: mentaColors.text.primary,
    flex: 1,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.bodySmall,
  },
  descriptionSection: { gap: mentaSpacing[2] },
  sectionLabel: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.semibold,
    ...mentaTypeScale.bodySmall,
  },
  description: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.body,
  },
  helperCopy: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.bodySmall,
  },
  agreementSurface: {
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.large,
    gap: mentaSpacing[4],
    padding: mentaSpacing[5],
  },
  agreementTitle: {
    color: mentaColors.text.onPaper,
    fontFamily: mentaFonts.newsreader.medium,
    ...mentaTypeScale.title,
  },
  agreementBody: {
    color: mentaColors.text.mutedOnPaper,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.bodySmall,
  },
  agreementRule: {
    alignItems: 'flex-start',
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[4],
  },
  agreementRuleCopy: {
    color: mentaColors.text.onPaper,
    flex: 1,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.bodySmall,
  },
  notNow: {
    alignItems: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    justifyContent: 'center',
  },
  notNowCopy: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.bodySmall,
  },
  receiptSurface: {
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.large,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
  },
  receiptTitle: {
    color: mentaColors.text.onPaper,
    fontFamily: mentaFonts.newsreader.medium,
    ...mentaTypeScale.title,
  },
  receiptBody: {
    color: mentaColors.text.mutedOnPaper,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.bodySmall,
  },
  actionStack: {
    gap: mentaSpacing[3],
  },
  stateTitle: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.medium,
    ...mentaTypeScale.title,
  },
  stateBody: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.bodySmall,
    textAlign: 'center',
  },
  pressed: { opacity: 0.72 },
});
