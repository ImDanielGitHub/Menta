import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';
import { AppScreen } from '@/components/ui/AppShell';
import {
  SkeletonButton,
  SkeletonLoader,
  SkeletonText,
} from '@/components/ui/SkeletonLoader';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypeScale,
} from '@/constants/MentaDesignSystem';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { createClientEventId } from '@/lib/client-event-id';
import { emitEventOrganiserReviewReceiptHaptic } from '@/lib/motion/event-receipt-haptics';
import { mentaFonts } from '@/lib/menta-fonts';
import { useAuthStore } from '@/store/auth-store';
import { useEventStore } from '@/store/event-store';
import type {
  EventOrganiserReviewItem,
  EventPostReviewResult,
  EventReceipt,
  EventReviewDecision,
} from '@/types/event';
import { useTranslation } from '@/lib/localization';
import { formatEventShortDateTime } from '@/lib/events/localized-formatting';

import { backOrReplace } from '@/lib/navigation/safe-back';
type ReviewAttempt = {
  postId: string;
  decision: EventReviewDecision;
  clientEventId: string;
};

type PreviewState = 'idle' | 'ready' | 'failed';

const firstParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const checkInDescription = (
  item: EventOrganiserReviewItem,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  if (!item.hasUploadedMedia) return t('events.review.photo_unavailable');
  if (!item.checkedInAt) return t('events.review.no_check_in');

  const method =
    item.checkInMethod === 'roster_single_use'
      ? t('events.review.roster_check_in')
      : t('events.review.qr_check_in');
  return t('events.review.check_in_confirmed', { method });
};

export default function EventOrganiserReviewScreen() {
  const { locale, t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{ occurrenceId?: string | string[] }>();
  const occurrenceId = firstParam(params.occurrenceId);
  const user = useAuthStore(state => state.user);
  const storedQueue = useEventStore(state => state.organiserReviewQueue);
  const storedAccountId = useEventStore(
    state => state.organiserReviewAccountId
  );
  const loading = useEventStore(state => state.organiserReviewLoading);
  const queueError = useEventStore(state => state.organiserReviewError);
  const loadOrganiserReviewQueue = useEventStore(
    state => state.loadOrganiserReviewQueue
  );
  const reviewOrganiserPost = useEventStore(state => state.reviewOrganiserPost);

  const queue =
    storedAccountId === user?.id && storedQueue?.occurrenceId === occurrenceId
      ? storedQueue
      : null;
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [decision, setDecision] = useState<EventReviewDecision | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>('idle');
  const [reviewReceipt, setReviewReceipt] =
    useState<EventReceipt<EventPostReviewResult> | null>(null);
  const attemptRef = useRef<ReviewAttempt | null>(null);
  const submitInFlight = useRef(false);

  const load = useCallback(async () => {
    if (!occurrenceId || !user) return null;
    return loadOrganiserReviewQueue(occurrenceId);
  }, [loadOrganiserReviewQueue, occurrenceId, user]);

  useEffect(() => {
    setSelectedPostId(null);
    setDecision(null);
    setReviewReceipt(null);
    setPreviewState('idle');
    attemptRef.current = null;
    void load();
  }, [load]);

  useEffect(() => {
    if (!queue) return;
    if (
      !selectedPostId ||
      !queue.items.some(item => item.postId === selectedPostId)
    ) {
      setSelectedPostId(queue.items[0]?.postId ?? null);
      setDecision(null);
      setPreviewState('idle');
    }
  }, [queue, selectedPostId]);

  const selectedItem = useMemo(
    () => queue?.items.find(item => item.postId === selectedPostId) ?? null,
    [queue, selectedPostId]
  );

  const selectItem = useCallback(
    (postId: string) => {
      if (submitting) return;
      setSelectedPostId(postId);
      setDecision(null);
      setReviewReceipt(null);
      setPreviewState('idle');
      attemptRef.current = null;
    },
    [submitting]
  );

  const chooseDecision = useCallback(
    (nextDecision: EventReviewDecision) => {
      if (!selectedItem || submitting) return;
      if (attemptRef.current?.decision !== nextDecision) {
        attemptRef.current = null;
      }
      setDecision(nextDecision);
      setReviewReceipt(null);
    },
    [selectedItem, submitting]
  );

  const submitDecision = useCallback(async () => {
    if (!occurrenceId || !selectedItem || !decision || submitInFlight.current) {
      return;
    }

    const existingAttempt = attemptRef.current;
    const attempt =
      existingAttempt &&
      existingAttempt.postId === selectedItem.postId &&
      existingAttempt.decision === decision
        ? existingAttempt
        : {
            postId: selectedItem.postId,
            decision,
            clientEventId: createClientEventId(),
          };

    attemptRef.current = attempt;
    submitInFlight.current = true;
    setSubmitting(true);
    setReviewReceipt(null);
    try {
      const receipt = await reviewOrganiserPost({
        occurrenceId,
        postId: selectedItem.postId,
        expectedRevision: selectedItem.revision,
        decision,
        clientEventId: attempt.clientEventId,
      });
      setReviewReceipt(receipt);
      void emitEventOrganiserReviewReceiptHaptic(receipt);

      if (receipt.outcome === 'completed') {
        // A completed decision receipt is authoritative, but the queue itself
        // is only replaced by the next self-scoped server read.
        await load();
      } else if (
        receipt.outcome === 'failed' &&
        receipt.code === 'STALE_REVIEW'
      ) {
        await load();
      }

      // Only a response-loss state may be replayed with the same key. A
      // completed or definitive failed receipt must start a new attempt.
      if (receipt.outcome !== 'unknown_result') {
        attemptRef.current = null;
      }
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  }, [decision, load, occurrenceId, reviewOrganiserPost, selectedItem]);

  const reviewNextPost = useCallback(() => {
    if (!queue?.items.length) {
      backOrReplace(router, '/events');
      return;
    }
    setSelectedPostId(queue.items[0].postId);
    setDecision(null);
    setReviewReceipt(null);
    attemptRef.current = null;
  }, [queue?.items, router]);

  const openSignIn = useCallback(() => {
    router.push({
      pathname: '/auth-required',
      params: {
        next: `/events/organiser-review/${encodeURIComponent(occurrenceId ?? '')}`,
      },
    });
  }, [occurrenceId, router]);

  if (!occurrenceId) {
    return (
      <AppScreen
        lane="immersive"
        safeArea
        padding={false}
        hasTabBar={false}
        style={styles.screen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.missingState, screenInsetPadding(phoneLayout)]}>
          <View style={styles.stateSurface}>
            <Text style={styles.stateTitle}>
              {t('events.review.link.incomplete')}
            </Text>
            <AppButton
              title={t('events.review.browse')}
              onPress={() => router.replace('/events')}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </AppScreen>
    );
  }

  const isUnknownResult = reviewReceipt?.outcome === 'unknown_result';
  const isFailedReview = reviewReceipt?.outcome === 'failed';
  const hasConfirmedReview = reviewReceipt?.outcome === 'completed';
  const pendingCount = queue?.pendingCount ?? 0;
  const hasLoadedPreview = previewState === 'ready';
  const useStackedQueueRows =
    phoneLayout.isCompactWidth || phoneLayout.fontScale >= 1.2;
  const countLabel = t('events.review.pending_count', { count: pendingCount });

  return (
    <AppScreen
      lane="immersive"
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
            accessibilityLabel={t('events.review.back')}
            onPress={() => backOrReplace(router, '/events')}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeftIcon color={mentaColors.text.primary} size={20} />
          </Pressable>
          <Text style={styles.topLabel}>{t('events.review.title')}</Text>
          <View style={styles.trailingLane} />
        </View>

        {!user ? (
          <View style={styles.stateCanvas}>
            <Text style={styles.stateTitle}>
              {t('events.review.sign_in_title')}
            </Text>
            <Text style={styles.stateBody}>
              {t('events.review.organiser_only')}
            </Text>
            <AppButton
              title={t('events.detail.sign_in')}
              onPress={openSignIn}
              variant="primary"
              fullWidth
            />
          </View>
        ) : null}

        {user && !queue && loading ? (
          <View
            accessible
            accessibilityLabel={t('events.review.loading')}
            accessibilityRole="progressbar"
            style={styles.loadingState}
          >
            <SkeletonLoader announce={false} height={28} width="64%" />
            <SkeletonLoader announce={false} height={14} width="42%" />
            <SkeletonText announce={false} lines={2} width="88%" />
            <View style={styles.queue}>
              {[0, 1, 2].map(index => (
                <View key={index} style={styles.queueRow}>
                  <SkeletonLoader
                    announce={false}
                    borderRadius={mentaRadii.round}
                    height={24}
                    width={24}
                  />
                  <View style={styles.rowMain}>
                    <SkeletonLoader announce={false} height={14} width="48%" />
                    <SkeletonLoader announce={false} height={12} width="72%" />
                  </View>
                  <View style={styles.rowStatus}>
                    <SkeletonLoader announce={false} height={12} width={72} />
                    <SkeletonLoader announce={false} height={10} width={56} />
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.decisionSurface}>
              <SkeletonLoader announce={false} height={22} width="58%" />
              <SkeletonLoader
                announce={false}
                borderRadius={mentaRadii.medium}
                height={190}
              />
              <SkeletonButton />
              <SkeletonButton />
            </View>
          </View>
        ) : null}

        {user && !queue && !loading && queueError ? (
          <View
            accessibilityRole="alert"
            style={[styles.stateSurface, styles.errorSurface]}
          >
            <AlertTriangleIcon color={mentaColors.danger} size={22} />
            <Text style={styles.stateTitle}>
              {t('events.review.load_error')}
            </Text>
            <Text style={styles.stateBody}>{queueError}</Text>
            <AppButton
              title={t('events.review.try_again')}
              onPress={() => void load()}
              variant="secondary"
              fullWidth
              leftIcon={
                <RefreshCwIcon color={mentaColors.text.primary} size={18} />
              }
            />
          </View>
        ) : null}

        {queue ? (
          <>
            <View style={styles.intro}>
              <Text accessibilityRole="header" style={styles.title}>
                {countLabel}
              </Text>
              <Text style={styles.eventTitle}>{queue.eventTitle}</Text>
              <Text style={styles.subtitle}>
                {pendingCount === 0
                  ? t('events.review.none_waiting')
                  : t('events.review.queue_subtitle')}
              </Text>
            </View>

            {queue.pendingCount > queue.items.length ? (
              <View accessibilityRole="alert" style={styles.windowNotice}>
                <Text style={styles.windowNoticeCopy}>
                  {t('events.review.oldest', {
                    shown: queue.items.length,
                    total: queue.pendingCount,
                  })}
                </Text>
              </View>
            ) : null}

            {queue.pendingCount > 0 ? (
              <View style={styles.queue}>
                {queue.items.map(item => {
                  const selected = item.postId === selectedItem?.postId;
                  return (
                    <Pressable
                      key={item.postId}
                      accessibilityRole="button"
                      accessibilityLabel={t(
                        'events.review.item_accessibility',
                        {
                          attendee: item.attendeeUsername,
                          status: checkInDescription(item, t),
                        }
                      )}
                      accessibilityState={{ selected }}
                      disabled={submitting || hasConfirmedReview}
                      onPress={() => selectItem(item.postId)}
                      style={({ pressed }) => [
                        styles.queueRow,
                        useStackedQueueRows && styles.queueRowStacked,
                        selected && styles.queueRowSelected,
                        pressed && !submitting && styles.pressed,
                      ]}
                    >
                      <View style={styles.rowIcon}>
                        <ShieldCheckIcon
                          color={
                            item.checkedInAt
                              ? mentaColors.success
                              : mentaColors.danger
                          }
                          size={20}
                        />
                      </View>
                      <View style={styles.rowMain}>
                        <Text style={styles.rowTitle}>
                          {item.attendeeUsername}
                        </Text>
                        <Text style={styles.rowBody}>
                          {checkInDescription(item, t)}
                        </Text>
                        {item.caption ? (
                          <Text numberOfLines={2} style={styles.caption}>
                            “{item.caption}”
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.rowStatus,
                          useStackedQueueRows && styles.rowStatusStacked,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rowStatusCopy,
                            selected
                              ? styles.rowStatusSelected
                              : styles.rowStatusPending,
                          ]}
                        >
                          {selected
                            ? t('events.review.selected')
                            : t('events.review.needs_review')}
                        </Text>
                        <Text style={styles.rowTime}>
                          {formatEventShortDateTime({
                            value: item.createdAt,
                            locale,
                            fallback: t('events.review.time_unavailable'),
                          })}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {selectedItem && !hasConfirmedReview ? (
              <View style={styles.decisionSurface}>
                <Text style={styles.decisionTitle}>
                  {decision === 'approve'
                    ? t('events.review.approve_question', {
                        attendee: selectedItem.attendeeUsername,
                      })
                    : decision === 'reject'
                      ? t('events.review.reject_question', {
                          attendee: selectedItem.attendeeUsername,
                        })
                      : t('events.review.review_question', {
                          attendee: selectedItem.attendeeUsername,
                        })}
                </Text>
                {selectedItem.mediaPreviewUrl ? (
                  <Image
                    accessibilityLabel={t('events.review.photo_accessibility', {
                      attendee: selectedItem.attendeeUsername,
                    })}
                    onError={() => setPreviewState('failed')}
                    onLoad={() => setPreviewState('ready')}
                    source={{ uri: selectedItem.mediaPreviewUrl }}
                    style={styles.evidencePreview}
                  />
                ) : null}
                {!selectedItem.mediaPreviewUrl || previewState === 'failed' ? (
                  <View accessibilityRole="alert" style={styles.previewBlocked}>
                    <Text style={styles.noticeTitle}>
                      {t('events.review.photo_load_failed')}
                    </Text>
                    <Text style={styles.noticeBody}>
                      {t('events.review.photo_load_failed_body')}
                    </Text>
                  </View>
                ) : null}
                {selectedItem.mediaPreviewUrl && previewState === 'idle' ? (
                  <View style={styles.previewLoading}>
                    <SkeletonLoader
                      announce={false}
                      height={mentaSpacing[6]}
                      width={mentaSpacing[6]}
                    />
                    <Text style={styles.noticeBody}>
                      {t('events.review.photo_loading')}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.decisionBody}>
                  {t('events.review.decision_explanation')}
                </Text>
                {hasLoadedPreview ? (
                  <View style={styles.decisionActions}>
                    <AppButton
                      title={t('events.review.approve')}
                      onPress={() => chooseDecision('approve')}
                      disabled={submitting}
                      variant={decision === 'approve' ? 'accent' : 'secondary'}
                      fullWidth
                    />
                    <AppButton
                      title={t('events.review.reject')}
                      onPress={() => chooseDecision('reject')}
                      disabled={submitting}
                      variant={
                        decision === 'reject' ? 'destructive' : 'secondary'
                      }
                      fullWidth
                    />
                  </View>
                ) : null}
                {decision && hasLoadedPreview ? (
                  <AppButton
                    title={
                      isUnknownResult
                        ? t('events.review.check_same')
                        : decision === 'approve'
                          ? t('events.review.confirm_approval')
                          : t('events.review.confirm_rejection')
                    }
                    onPress={() => void submitDecision()}
                    loading={submitting}
                    variant={decision === 'approve' ? 'accent' : 'destructive'}
                    fullWidth
                    accessibilityHint={t('events.review.apply_hint')}
                  />
                ) : null}
              </View>
            ) : null}

            {isUnknownResult ? (
              <View accessibilityRole="alert" style={styles.receiptNotice}>
                <AlertTriangleIcon color={mentaColors.warning} size={20} />
                <View style={styles.noticeCopyWrap}>
                  <Text style={styles.noticeTitle}>
                    {t('events.review.unknown_title')}
                  </Text>
                  <Text style={styles.noticeBody}>
                    {t('events.review.unknown_body')}
                  </Text>
                  <Text style={styles.noticeBody}>
                    {t('events.review.unknown_next')}
                  </Text>
                </View>
              </View>
            ) : null}

            {isFailedReview ? (
              <View accessibilityRole="alert" style={styles.failedNotice}>
                <AlertTriangleIcon color={mentaColors.danger} size={20} />
                <View style={styles.noticeCopyWrap}>
                  <Text style={styles.noticeTitle}>
                    {t('events.review.failed_title')}
                  </Text>
                  <Text style={styles.noticeBody}>
                    {t('events.review.failed_body')}
                  </Text>
                  {reviewReceipt?.code === 'STALE_REVIEW' ? (
                    <Text style={styles.noticeBody}>
                      {t('events.review.stale_body')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {hasConfirmedReview ? (
              <View
                accessible
                accessibilityLiveRegion="polite"
                style={styles.confirmedNotice}
              >
                <CheckIcon color={mentaColors.success} size={20} />
                <View style={styles.noticeCopyWrap}>
                  <Text style={styles.noticeTitle}>
                    {reviewReceipt?.code === 'POST_REJECTED'
                      ? t('events.review.photo_not_approved')
                      : t('events.review.photo_approved')}
                  </Text>
                  <Text style={styles.noticeBody}>
                    {reviewReceipt?.code === 'POST_REJECTED'
                      ? t('events.review.photo_not_approved_body')
                      : t('events.review.photo_approved_body')}
                  </Text>
                </View>
              </View>
            ) : null}

            {hasConfirmedReview ? (
              <AppButton
                title={
                  queue.items.length > 0
                    ? t('events.review.next_photo')
                    : t('events.review.back')
                }
                onPress={reviewNextPost}
                variant="secondary"
                fullWidth
              />
            ) : null}

            <AppButton
              accessibilityHint={t('events.review.open_recap_hint')}
              fullWidth
              onPress={() =>
                router.push({
                  pathname: '/events/[eventId]/recap',
                  params: { eventId: queue.eventId },
                })
              }
              title={t('events.review.open_recap')}
              variant="secondary"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showPolicy
                  ? t('events.review.hide_rules')
                  : t('events.review.show_rules')
              }
              accessibilityState={{ expanded: showPolicy }}
              onPress={() => setShowPolicy(current => !current)}
              style={({ pressed }) => [
                styles.policyTrigger,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.policyTriggerCopy}>
                {showPolicy
                  ? t('events.review.hide_rules')
                  : t('events.review.show_rules')}
              </Text>
            </Pressable>

            {showPolicy ? (
              <View style={styles.policySection}>
                <Text style={styles.policyHeading}>
                  {t('events.review.rules')}
                </Text>
                <View style={styles.policyRows}>
                  <PolicyRow
                    title={t('events.review.joined')}
                    detail={t('events.review.joined_detail')}
                  />
                  <PolicyRow
                    title={t('events.review.checked_in')}
                    detail={t('events.review.checked_in_detail')}
                  />
                  <PolicyRow
                    title={t('events.review.uploaded')}
                    detail={t('events.review.uploaded_detail')}
                  />
                  <PolicyRow
                    title={t('events.review.decision')}
                    detail={t('events.review.decision_detail')}
                  />
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function PolicyRow({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.policyRow}>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBody}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mentaColors.canvas },
  content: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    paddingBottom: mentaSpacing[12],
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[6],
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
  intro: { gap: mentaSpacing[2] },
  title: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.medium,
    ...mentaTypeScale.heading,
  },
  subtitle: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.body,
  },
  eventTitle: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.semibold,
    ...mentaTypeScale.bodySmall,
  },
  loadingState: {
    alignItems: 'flex-start',
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[12],
  },
  stateSurface: {
    alignItems: 'flex-start',
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
  },
  stateCanvas: {
    alignItems: 'flex-start',
    gap: mentaSpacing[3],
  },
  missingState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: mentaLayout.screenInset,
    paddingVertical: mentaSpacing[10],
  },
  errorSurface: {
    backgroundColor: mentaColors.dangerSoft,
    borderColor: mentaColors.danger,
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
  },
  queue: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  queueRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 78,
    paddingVertical: mentaSpacing[3],
  },
  queueRowStacked: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  queueRowSelected: {
    backgroundColor: mentaColors.actionSoft,
    marginHorizontal: -mentaSpacing[2],
    paddingHorizontal: mentaSpacing[2],
  },
  rowIcon: {
    alignItems: 'center',
    flexShrink: 0,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.bodySmall,
  },
  rowBody: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.caption,
  },
  caption: {
    color: mentaColors.text.muted,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.caption,
  },
  rowStatus: { alignItems: 'flex-end', flexShrink: 0, gap: 2, width: 72 },
  rowStatusStacked: {
    alignItems: 'flex-start',
    paddingLeft: mentaLayout.iconLane + mentaSpacing[3],
    width: '100%',
  },
  rowStatusCopy: {
    fontFamily: mentaFonts.inter.medium,
    textAlign: 'right',
    ...mentaTypeScale.caption,
  },
  rowStatusSelected: { color: mentaColors.action },
  rowStatusPending: { color: mentaColors.warning },
  rowTime: {
    color: mentaColors.text.muted,
    fontFamily: mentaFonts.inter.regular,
    textAlign: 'right',
    ...mentaTypeScale.caption,
  },
  decisionSurface: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.actionBorder,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
  },
  evidencePreview: {
    aspectRatio: 4 / 3,
    backgroundColor: mentaColors.raised,
    borderRadius: mentaRadii.medium,
    maxHeight: 440,
    width: '100%',
  },
  previewBlocked: {
    backgroundColor: `${mentaColors.danger}16`,
    borderColor: mentaColors.danger,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[1],
    padding: mentaSpacing[3],
  },
  previewLoading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  decisionTitle: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.medium,
    ...mentaTypeScale.title,
  },
  decisionBody: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.bodySmall,
  },
  decisionActions: { gap: mentaSpacing[2] },
  receiptNotice: {
    alignItems: 'flex-start',
    backgroundColor: `${mentaColors.warning}16`,
    borderColor: mentaColors.warning,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    padding: mentaSpacing[4],
  },
  failedNotice: {
    alignItems: 'flex-start',
    backgroundColor: `${mentaColors.danger}16`,
    borderColor: mentaColors.danger,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    padding: mentaSpacing[4],
  },
  confirmedNotice: {
    alignItems: 'flex-start',
    backgroundColor: `${mentaColors.success}16`,
    borderColor: mentaColors.success,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    padding: mentaSpacing[4],
  },
  noticeCopyWrap: { flex: 1, gap: 2 },
  noticeTitle: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.semibold,
    ...mentaTypeScale.bodySmall,
  },
  noticeBody: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.caption,
  },
  windowNotice: {
    backgroundColor: `${mentaColors.warning}16`,
    borderColor: mentaColors.warning,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: mentaSpacing[3],
  },
  windowNoticeCopy: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.caption,
  },
  policyTrigger: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    minHeight: mentaLayout.minimumTouchTarget,
    justifyContent: 'center',
  },
  policyTriggerCopy: {
    color: mentaColors.action,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.bodySmall,
  },
  policySection: {
    gap: mentaSpacing[3],
  },
  policyHeading: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.semibold,
    ...mentaTypeScale.title,
  },
  policyRows: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  policyRow: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 58,
    paddingVertical: mentaSpacing[2],
  },
  pressed: { opacity: 0.72 },
});
