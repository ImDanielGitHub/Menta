import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppScreen } from '@/components/ui/AppShell';
import {
  SkeletonButton,
  SkeletonLoader,
  SkeletonText,
} from '@/components/ui/SkeletonLoader';
import { ArrowLeftIcon, ImageIcon } from '@/components/ui/icons';
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
import { eventProofStageForPostStatus } from '@/lib/events/participation-state';
import { eventPhotoPostingReceiptMessage } from '@/lib/events/posting-window';
import { emitEventProofReceiptHaptic } from '@/lib/motion/event-receipt-haptics';
import {
  prepareEventAuthHandoff,
  transferEventCapability,
} from '@/lib/events/protected-auth-handoff';
import { useEventCapabilityHydration } from '@/lib/events/use-event-capability-hydration';
import { listEventUploadQueue } from '@/lib/events/upload-queue';
import { mentaFonts } from '@/lib/menta-fonts';
import { useAuthStore } from '@/store/auth-store';
import { useEventStore } from '@/store/event-store';
import type {
  EventMediaContentType,
  EventPostFinalised,
  EventReceipt,
} from '@/types/event';
import { useTranslation } from '@/lib/localization';

type ProofStage =
  | 'compose'
  | 'posting'
  | 'approved'
  | 'pending_review'
  | 'rejected'
  | 'unexpected_post_status'
  | 'failed'
  | 'unknown_result';

type SelectedEventImage = {
  uri: string;
  contentType: EventMediaContentType;
  byteSize: number;
};

const MAX_EVENT_POST_BYTES = 10_000_000;

const firstParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const asEventMediaContentType = (
  value: string | null | undefined
): EventMediaContentType | null => {
  const normalised =
    value?.toLowerCase() === 'image/jpg' ? 'image/jpeg' : value;
  return normalised === 'image/jpeg' ||
    normalised === 'image/png' ||
    normalised === 'image/webp'
    ? normalised
    : null;
};

export default function EventProofScreen() {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
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
    surface: 'proof',
    explicitShareToken: routeShareToken,
    explicitInviteToken: routeInviteToken,
    replace: replaceSafeEventRoute,
  });
  const ownerKey = `${user?.id ?? 'anonymous'}:${eventId ?? 'incomplete'}`;
  const summary = useEventStore(state => state.summary);
  const myOccurrence = useEventStore(state => state.myOccurrence);
  const loading = useEventStore(state => state.loading);
  const error = useEventStore(state => state.error);
  const loadSummary = useEventStore(state => state.loadSummary);
  const loadMyOccurrence = useEventStore(state => state.loadMyOccurrence);
  const submitPost = useEventStore(state => state.submitPost);
  const resumePost = useEventStore(state => state.resumePost);

  const [stage, setStage] = useState<ProofStage>('compose');
  const [selectedImage, setSelectedImage] = useState<SelectedEventImage | null>(
    null
  );
  const [caption, setCaption] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [posting, setPosting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [postReceipt, setPostReceipt] =
    useState<EventReceipt<EventPostFinalised> | null>(null);
  const [loadedOccurrenceKey, setLoadedOccurrenceKey] = useState<string | null>(
    null
  );
  const [visibleOwnerKey, setVisibleOwnerKey] = useState(ownerKey);
  const [unavailableLocalDraft, setUnavailableLocalDraft] = useState(false);
  const postClientEventId = useRef<string | null>(null);
  const restoreRequestId = useRef(0);
  const proofOwnerKey = useRef(ownerKey);
  const hasCurrentVisibleOwner = visibleOwnerKey === ownerKey;

  // A changed account or event gets an immediate blank, gated render. The
  // effect then clears the actual state and swaps the visible owner. That keeps
  // state mutations out of render while old local proof cannot be committed.
  useEffect(() => {
    if (hasCurrentVisibleOwner) return;

    proofOwnerKey.current = ownerKey;
    restoreRequestId.current += 1;
    postClientEventId.current = null;
    setSelectedImage(null);
    setCaption('');
    setStage('compose');
    setSelecting(false);
    setPosting(false);
    setSessionExpired(false);
    setLocalMessage(null);
    setPostReceipt(null);
    setUnavailableLocalDraft(false);
    setLoadedOccurrenceKey(null);
    setVisibleOwnerKey(ownerKey);
  }, [hasCurrentVisibleOwner, ownerKey]);

  const activeSummary = summary?.eventId === eventId ? summary : null;
  const attendance =
    myOccurrence &&
    myOccurrence.summary.occurrenceId === activeSummary?.occurrenceId
      ? myOccurrence.attendance
      : null;
  const currentOccurrenceKey = activeSummary
    ? `${ownerKey}:${activeSummary.occurrenceId}`
    : null;
  const hasConfirmedCheckIn = Boolean(
    hasCurrentVisibleOwner &&
    loadedOccurrenceKey === currentOccurrenceKey &&
    attendance?.state === 'joined' &&
    attendance.checkedInAt
  );
  const visibleStage = hasCurrentVisibleOwner ? stage : 'compose';
  const visibleSelectedImage = hasCurrentVisibleOwner ? selectedImage : null;
  const visibleCaption = hasCurrentVisibleOwner ? caption : '';
  const visibleSelecting = hasCurrentVisibleOwner && selecting;
  const visiblePosting = hasCurrentVisibleOwner && posting;
  const visibleSessionExpired = hasCurrentVisibleOwner && sessionExpired;
  const visibleLocalMessage = hasCurrentVisibleOwner ? localMessage : null;
  const visiblePostReceipt = hasCurrentVisibleOwner ? postReceipt : null;
  const latestOwnPost =
    myOccurrence &&
    myOccurrence.summary.occurrenceId === activeSummary?.occurrenceId
      ? [...myOccurrence.ownPosts]
          .filter(post => post.status !== 'deleted')
          .sort((left, right) =>
            right.createdAt.localeCompare(left.createdAt)
          )[0]
      : null;
  const unavailableDetail = error ?? t('events.proof.unavailable_body');
  const rejectedReviewNote =
    visiblePostReceipt?.data?.post.reviewNote ??
    latestOwnPost?.reviewNote ??
    t('events.proof.default_review_note');
  const rejectedReviewSentence = /[.!?]$/.test(rejectedReviewNote)
    ? rejectedReviewNote
    : `${rejectedReviewNote}.`;

  useEffect(() => {
    if (
      !hasCurrentVisibleOwner ||
      !hasConfirmedCheckIn ||
      stage !== 'compose' ||
      selectedImage ||
      posting ||
      !latestOwnPost
    ) {
      return;
    }

    const restoredStage = eventProofStageForPostStatus(latestOwnPost.status);
    if (restoredStage !== 'unexpected_post_status') {
      setStage(restoredStage);
    }
  }, [
    hasConfirmedCheckIn,
    hasCurrentVisibleOwner,
    latestOwnPost,
    posting,
    selectedImage,
    t,
    stage,
  ]);

  const load = useCallback(async () => {
    if (!eventId || !capabilityReady) return;
    const requestOwnerKey = ownerKey;
    setSessionExpired(false);
    const summaryReceipt = await loadSummary({
      eventId,
      shareToken: shareToken ?? null,
      inviteToken: inviteToken ?? null,
    });
    if (
      proofOwnerKey.current !== requestOwnerKey ||
      summaryReceipt.outcome !== 'completed' ||
      !summaryReceipt.data
    ) {
      return;
    }

    if (!user) {
      setSessionExpired(true);
      return;
    }

    const mine = await loadMyOccurrence(summaryReceipt.data.occurrenceId);
    if (proofOwnerKey.current !== requestOwnerKey) return;

    if (mine.outcome === 'completed') {
      setLoadedOccurrenceKey(
        `${requestOwnerKey}:${summaryReceipt.data.occurrenceId}`
      );
    }
    if (mine.code === 'AUTHENTICATION_REQUIRED') setSessionExpired(true);
  }, [
    capabilityReady,
    eventId,
    inviteToken,
    loadMyOccurrence,
    loadSummary,
    ownerKey,
    shareToken,
    user,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  // An unavailable event must not make a local photo disappear. We only read
  // the signed-in owner's local queue; this never treats the file as uploaded.
  useEffect(() => {
    if (!user?.id || !eventId || activeSummary) return;
    const requestOwnerKey = ownerKey;
    void listEventUploadQueue(user.id)
      .then(queue => {
        if (proofOwnerKey.current !== requestOwnerKey) return;
        setUnavailableLocalDraft(
          queue.some(
            item =>
              item.userId === user.id &&
              item.eventId === eventId &&
              (item.status === 'saved_local' ||
                item.status === 'uploading' ||
                item.status === 'failed' ||
                item.status === 'unknown_result')
          )
        );
      })
      .catch(() => {
        if (proofOwnerKey.current === requestOwnerKey) {
          setUnavailableLocalDraft(false);
        }
      });
  }, [activeSummary, eventId, ownerKey, user?.id]);

  useEffect(() => {
    const requestId = restoreRequestId.current + 1;
    restoreRequestId.current = requestId;
    const requestOwnerKey = ownerKey;
    const occurrenceId = activeSummary?.occurrenceId;

    if (!user?.id || !eventId || !occurrenceId || !hasConfirmedCheckIn) return;

    void (async () => {
      const queue = await listEventUploadQueue(user.id);
      if (
        restoreRequestId.current !== requestId ||
        proofOwnerKey.current !== requestOwnerKey
      ) {
        return;
      }

      const savedDraft = [...queue]
        .filter(
          item =>
            item.userId === user.id &&
            item.eventId === eventId &&
            item.occurrenceId === occurrenceId &&
            (item.status === 'saved_local' ||
              item.status === 'uploading' ||
              item.status === 'unknown_result' ||
              item.status === 'failed')
        )
        .sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt)
        )[0];
      if (!savedDraft) return;

      setSelectedImage({
        uri: savedDraft.localUri,
        contentType: savedDraft.contentType,
        byteSize: savedDraft.byteSize,
      });
      setCaption(savedDraft.caption ?? '');
      postClientEventId.current = savedDraft.clientEventId;
      setPostReceipt(null);
      if (savedDraft.status === 'failed') {
        setStage('failed');
        setLocalMessage(t('events.proof.saved_ready'));
      } else {
        setStage('unknown_result');
        setLocalMessage(t('events.proof.saved_checking'));
      }
    })().catch(() => {
      if (
        restoreRequestId.current === requestId &&
        proofOwnerKey.current === requestOwnerKey
      ) {
        setLocalMessage(t('events.proof.saved_check_failed'));
      }
    });
  }, [
    activeSummary?.occurrenceId,
    eventId,
    hasConfirmedCheckIn,
    ownerKey,
    t,
    user?.id,
  ]);

  const returnToEvent = useCallback(() => {
    if (!eventId) {
      router.replace('/events');
      return;
    }

    transferEventCapability({
      userId: user?.id,
      eventId,
      from: 'proof',
      to: 'detail',
    });
    router.replace({
      pathname: '/events/[eventId]',
      params: { eventId },
    });
  }, [eventId, router, user?.id]);

  const openSignIn = useCallback(() => {
    const destination = prepareEventAuthHandoff({
      eventId,
      surface: 'proof',
      shareToken,
      inviteToken,
    });
    router.push(destination ?? '/login');
  }, [eventId, inviteToken, router, shareToken]);

  const pickImage = useCallback(async () => {
    if (
      !hasCurrentVisibleOwner ||
      proofOwnerKey.current !== ownerKey ||
      selecting ||
      posting
    ) {
      return;
    }

    const requestOwnerKey = ownerKey;
    setSelecting(true);
    setLocalMessage(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (
        proofOwnerKey.current !== requestOwnerKey ||
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const asset = result.assets[0];
      const localResponse = await fetch(asset.uri);
      if (proofOwnerKey.current !== requestOwnerKey) return;
      if (!localResponse.ok) {
        setLocalMessage(t('events.proof.read_failed'));
        return;
      }

      const blob = await localResponse.blob();
      if (proofOwnerKey.current !== requestOwnerKey) return;
      const contentType = asEventMediaContentType(asset.mimeType ?? blob.type);
      if (!contentType) {
        setLocalMessage(t('events.proof.invalid_type'));
        return;
      }
      const byteSize = Math.max(asset.fileSize ?? 0, blob.size);
      if (
        !Number.isInteger(byteSize) ||
        byteSize <= 0 ||
        byteSize !== blob.size
      ) {
        setLocalMessage(t('events.proof.size_failed'));
        return;
      }
      if (byteSize > MAX_EVENT_POST_BYTES) {
        setLocalMessage(t('events.proof.too_large'));
        return;
      }
      if (proofOwnerKey.current !== requestOwnerKey) return;

      postClientEventId.current = null;
      setPostReceipt(null);
      setStage('compose');
      setSelectedImage({
        uri: asset.uri,
        contentType,
        byteSize,
      });
    } catch {
      if (proofOwnerKey.current === requestOwnerKey) {
        setLocalMessage(t('events.proof.prepare_failed'));
      }
    } finally {
      if (proofOwnerKey.current === requestOwnerKey) setSelecting(false);
    }
  }, [hasCurrentVisibleOwner, ownerKey, posting, selecting, t]);

  const presentReceipt = useCallback(
    (receipt: EventReceipt<EventPostFinalised>) => {
      setPostReceipt(receipt);
      void emitEventProofReceiptHaptic(receipt);
      if (receipt.code === 'AUTHENTICATION_REQUIRED') {
        setSessionExpired(true);
        setStage('compose');
        return;
      }

      if (receipt.outcome === 'unknown_result') {
        setStage('unknown_result');
        return;
      }
      if (receipt.outcome !== 'completed' || !receipt.data) {
        setStage('failed');
        return;
      }

      setStage(eventProofStageForPostStatus(receipt.data.post.status));
    },
    []
  );

  const submit = useCallback(async () => {
    if (
      !hasCurrentVisibleOwner ||
      proofOwnerKey.current !== ownerKey ||
      !activeSummary ||
      !selectedImage ||
      posting ||
      !hasConfirmedCheckIn
    ) {
      return;
    }
    if (!user) {
      setSessionExpired(true);
      return;
    }

    setPosting(true);
    setStage('posting');
    setLocalMessage(null);
    const requestOwnerKey = ownerKey;
    const clientEventId =
      postClientEventId.current ??
      (postClientEventId.current = createClientEventId());
    try {
      const receipt = await submitPost({
        eventId: activeSummary.eventId,
        occurrenceId: activeSummary.occurrenceId,
        localUri: selectedImage.uri,
        caption: caption.trim() || null,
        contentType: selectedImage.contentType,
        byteSize: selectedImage.byteSize,
        clientEventId,
      });
      if (proofOwnerKey.current === requestOwnerKey) presentReceipt(receipt);
    } catch {
      if (proofOwnerKey.current === requestOwnerKey) {
        setStage('compose');
        setLocalMessage(t('events.proof.send_unknown'));
      }
    } finally {
      if (proofOwnerKey.current === requestOwnerKey) setPosting(false);
    }
  }, [
    activeSummary,
    caption,
    hasConfirmedCheckIn,
    hasCurrentVisibleOwner,
    ownerKey,
    posting,
    presentReceipt,
    selectedImage,
    submitPost,
    t,
    user,
  ]);

  const resume = useCallback(async () => {
    const clientEventId = postClientEventId.current;
    if (
      !hasCurrentVisibleOwner ||
      proofOwnerKey.current !== ownerKey ||
      !clientEventId ||
      posting
    ) {
      return;
    }

    setPosting(true);
    setStage('posting');
    const requestOwnerKey = ownerKey;
    try {
      const receipt = await resumePost(clientEventId);
      if (proofOwnerKey.current === requestOwnerKey) presentReceipt(receipt);
    } catch {
      if (proofOwnerKey.current === requestOwnerKey) {
        setStage('failed');
        setLocalMessage(t('events.proof.saved_status_failed'));
      }
    } finally {
      if (proofOwnerKey.current === requestOwnerKey) setPosting(false);
    }
  }, [
    hasCurrentVisibleOwner,
    ownerKey,
    posting,
    presentReceipt,
    resumePost,
    t,
  ]);

  if (!eventId) {
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
          <Text style={styles.stateTitle}>
            {t('events.proof.link.incomplete')}
          </Text>
          <AppButton
            title={t('events.index.title')}
            onPress={() => router.replace('/events')}
            variant="primary"
          />
        </View>
      </AppScreen>
    );
  }

  if (capabilityInvalid) {
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
          <Text style={styles.stateTitle}>
            {t('events.proof.link.invalid')}
          </Text>
          <Text style={styles.stateBody}>
            {t('events.proof.link.invalid_body')}
          </Text>
          <AppButton
            title={t('events.index.title')}
            onPress={() => router.replace('/events')}
            variant="primary"
          />
        </View>
      </AppScreen>
    );
  }

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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('events.proof.back')}
            disabled={visiblePosting}
            onPress={returnToEvent}
            style={({ pressed }) => [
              styles.iconButton,
              (pressed || visiblePosting) && styles.pressed,
            ]}
          >
            <ArrowLeftIcon color={mentaColors.text.primary} size={20} />
          </Pressable>
          <Text style={styles.topLabel}>{t('events.proof.title')}</Text>
          <View style={styles.trailingLane} />
        </View>

        {!activeSummary && loading ? (
          <View
            accessible
            accessibilityLabel={t('events.proof.loading')}
            accessibilityRole="progressbar"
            style={styles.loadingState}
          >
            <SkeletonLoader announce={false} height={28} width="72%" />
            <SkeletonText announce={false} lines={2} width="88%" />
            <SkeletonLoader
              announce={false}
              borderRadius={mentaRadii.large}
              height={242}
            />
            <SkeletonButton />
          </View>
        ) : null}

        {!activeSummary && !loading ? (
          <View style={styles.loadingState}>
            <View
              accessible
              accessibilityLabel={t('events.proof.unavailable_accessibility', {
                detail: unavailableDetail,
                title: t('events.proof.unavailable'),
              })}
              accessibilityRole="alert"
              style={styles.unavailableCopy}
            >
              <Text style={styles.stateTitle}>
                {t('events.proof.unavailable')}
              </Text>
              <Text style={styles.stateBody}>{unavailableDetail}</Text>
            </View>
            {unavailableLocalDraft ? (
              <AppInlineNotice
                title={t('events.proof.local_photo_title')}
                description={t('events.proof.local_photo_body')}
                tone="warning"
                testID="event-unavailable-local-photo"
              />
            ) : null}
            <AppButton
              title={t('events.proof.find_event')}
              onPress={() => router.replace('/events')}
              variant="secondary"
            />
            <AppButton
              title={t('events.proof.back_today')}
              onPress={() => router.replace('/(tabs)')}
              variant="ghost"
              fullWidth
            />
          </View>
        ) : null}

        {activeSummary && visibleSessionExpired ? (
          <AppInlineNotice
            title={t('events.proof.session_title')}
            description={t('events.proof.session_body')}
            tone="warning"
            actionLabel={t('events.detail.sign_in')}
            onAction={openSignIn}
          />
        ) : null}

        {activeSummary && !visibleSessionExpired && !hasConfirmedCheckIn ? (
          <AppInlineNotice
            title={t('events.proof.check_in_title')}
            description={t('events.proof.check_in_body')}
            tone="warning"
            actionLabel={t('events.proof.back')}
            onAction={returnToEvent}
          />
        ) : null}

        {activeSummary && !visibleSessionExpired && hasConfirmedCheckIn ? (
          <>
            {visibleStage === 'compose' ? (
              <>
                <View style={styles.detailLead}>
                  <Text style={styles.title}>
                    {t('events.proof.compose_title')}
                  </Text>
                  <Text style={styles.stateBody}>
                    {t('events.proof.compose_body')}
                  </Text>
                </View>

                {visibleSelectedImage ? (
                  <>
                    <Image
                      accessibilityLabel={t('events.proof.selected_photo')}
                      source={{ uri: visibleSelectedImage.uri }}
                      style={styles.selectedImage}
                    />
                    <View style={styles.selectedRow}>
                      <ImageIcon color={mentaColors.action} size={18} />
                      <Text style={styles.selectedCopy}>
                        {t('events.proof.photo_selected')}
                      </Text>
                    </View>
                    <AppButton
                      title={t('events.proof.choose_different')}
                      onPress={() => void pickImage()}
                      disabled={visibleSelecting}
                      loading={visibleSelecting}
                      variant="secondary"
                      fullWidth
                    />
                  </>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('events.proof.choose_photo')}
                    disabled={visibleSelecting}
                    onPress={() => void pickImage()}
                    style={({ pressed }) => [
                      styles.photoPicker,
                      (pressed || visibleSelecting) && styles.pressed,
                    ]}
                  >
                    {visibleSelecting ? (
                      <SkeletonLoader
                        announce={false}
                        height={mentaSpacing[8]}
                        width={mentaSpacing[8]}
                      />
                    ) : (
                      <ImageIcon color={mentaColors.action} size={28} />
                    )}
                    <Text style={styles.photoPickerTitle}>
                      {visibleSelecting
                        ? t('events.proof.preparing')
                        : t('events.proof.choose_one')}
                    </Text>
                    <Text style={styles.photoPickerCopy}>
                      {t('events.proof.photo_types')}
                    </Text>
                  </Pressable>
                )}

                {visibleSelectedImage ? (
                  <View style={styles.captionSurface}>
                    <Text style={styles.fieldLabel}>
                      {t('events.proof.caption')}
                    </Text>
                    <TextInput
                      accessibilityLabel={t(
                        'events.proof.caption_accessibility'
                      )}
                      editable={!visiblePosting && !visibleSelecting}
                      maxLength={280}
                      multiline
                      onChangeText={setCaption}
                      placeholder={t('events.proof.caption_placeholder')}
                      placeholderTextColor={mentaColors.text.muted}
                      style={styles.captionInput}
                      textAlignVertical="top"
                      value={visibleCaption}
                    />
                    <Text style={styles.fieldHint}>
                      {visibleCaption.length}/280
                    </Text>
                  </View>
                ) : null}

                {visibleLocalMessage ? (
                  <AppInlineNotice
                    title={t('events.proof.photo_not_ready')}
                    description={visibleLocalMessage}
                    tone="error"
                  />
                ) : null}

                <AppButton
                  title={t('events.proof.send_review')}
                  onPress={() => void submit()}
                  disabled={!visibleSelectedImage || visibleSelecting}
                  loading={visiblePosting}
                  variant="accent"
                  fullWidth
                  accessibilityHint={t('events.proof.send_hint')}
                />
              </>
            ) : null}

            {visibleStage === 'posting' ? (
              <View style={styles.receiptLead}>
                <Text style={styles.title}>{t('events.proof.sending')}</Text>
                <Text style={styles.stateBodyCentered}>
                  {t('events.proof.sending_body')}
                </Text>
              </View>
            ) : null}

            {visibleStage === 'approved' ? (
              <View style={styles.receiptLead}>
                <Text style={styles.title}>{t('events.proof.approved')}</Text>
                <Text style={styles.stateBodyCentered}>
                  {t('events.proof.approved_body')}
                </Text>
                <AppButton
                  title={t('events.proof.back')}
                  onPress={returnToEvent}
                  variant="primary"
                  fullWidth
                />
              </View>
            ) : null}

            {visibleStage === 'pending_review' ? (
              <View style={styles.receiptLead}>
                <Text style={styles.title}>{t('events.proof.pending')}</Text>
                <Text style={styles.stateBodyCentered}>
                  {t('events.proof.pending_body')}
                </Text>
                <AppButton
                  title={t('events.proof.back')}
                  onPress={returnToEvent}
                  variant="primary"
                  fullWidth
                />
              </View>
            ) : null}

            {visibleStage === 'rejected' ? (
              <View style={styles.receiptLead}>
                <Text style={styles.title}>{t('events.proof.rejected')}</Text>
                <Text style={styles.stateBodyCentered}>
                  {t('events.proof.rejected_body')}
                </Text>
                <View
                  accessible
                  accessibilityLabel={t('events.proof.rejected_accessibility', {
                    note: rejectedReviewSentence,
                  })}
                  accessibilityRole="summary"
                  style={styles.correctionRows}
                  testID="event-proof-needs-evidence"
                >
                  <View style={styles.correctionRow}>
                    <View style={styles.correctionLabelLane}>
                      <Text style={styles.correctionLabel}>
                        {t('events.proof.attendance')}
                      </Text>
                      <Text style={styles.correctionDetail}>
                        {t('events.proof.event_check_in')}
                      </Text>
                    </View>
                    <Text style={styles.correctionValue}>
                      {t('events.proof.confirmed')}
                    </Text>
                  </View>
                  <View style={styles.correctionRow}>
                    <View style={styles.correctionLabelLane}>
                      <Text style={styles.correctionLabel}>
                        {t('events.proof.photo')}
                      </Text>
                      <Text style={styles.correctionDetail}>
                        {rejectedReviewNote}
                      </Text>
                    </View>
                    <Text style={styles.correctionValue}>
                      {t('events.proof.not_approved')}
                    </Text>
                  </View>
                </View>
                <AppButton
                  title={t('events.proof.replace')}
                  onPress={() => void pickImage()}
                  loading={visibleSelecting}
                  disabled={visiblePosting}
                  variant="primary"
                  fullWidth
                />
                <AppButton
                  title={t('events.proof.keep_result')}
                  onPress={returnToEvent}
                  disabled={visibleSelecting || visiblePosting}
                  variant="secondary"
                  fullWidth
                />
              </View>
            ) : null}

            {visibleStage === 'unexpected_post_status' ? (
              <AppInlineNotice
                title={t('events.proof.updating')}
                description={t('events.proof.updating_body')}
                tone="info"
                actionLabel={t('events.proof.back')}
                onAction={returnToEvent}
              />
            ) : null}

            {visibleStage === 'failed' ? (
              <View style={styles.receiptLead}>
                <Text style={styles.title}>{t('events.proof.not_sent')}</Text>
                <Text style={styles.stateBodyCentered}>
                  {t('events.proof.not_sent_body')}
                </Text>
                <Text style={styles.receiptMessage}>
                  {eventPhotoPostingReceiptMessage(
                    visiblePostReceipt?.code,
                    visiblePostReceipt?.message ?? visibleLocalMessage,
                    t('events.proof.posting_unavailable')
                  )}
                </Text>
                <AppButton
                  title={t('events.proof.try_again')}
                  onPress={() => void resume()}
                  loading={visiblePosting}
                  variant="primary"
                  fullWidth
                />
                <AppButton
                  title={t('events.proof.back')}
                  onPress={returnToEvent}
                  disabled={visiblePosting}
                  variant="secondary"
                  fullWidth
                />
              </View>
            ) : null}

            {visibleStage === 'unknown_result' ? (
              <View style={styles.receiptLead}>
                <Text style={styles.title}>{t('events.proof.unknown')}</Text>
                <Text style={styles.stateBodyCentered}>
                  {t('events.proof.unknown_body')}
                </Text>
                <Text style={styles.receiptMessage}>
                  {visiblePostReceipt?.message ?? visibleLocalMessage}
                </Text>
                <AppButton
                  title={t('events.proof.check_status')}
                  onPress={() => void resume()}
                  loading={visiblePosting}
                  variant="primary"
                  fullWidth
                />
                <AppButton
                  title={t('events.proof.back')}
                  onPress={returnToEvent}
                  disabled={visiblePosting}
                  variant="secondary"
                  fullWidth
                />
              </View>
            ) : null}
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
  unavailableCopy: {
    gap: mentaSpacing[2],
  },
  missingState: {
    flex: 1,
    gap: mentaSpacing[4],
    justifyContent: 'center',
    padding: mentaLayout.screenInset,
  },
  detailLead: { gap: mentaSpacing[3] },
  receiptLead: {
    alignItems: 'stretch',
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[2],
  },
  title: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.medium,
    ...mentaTypeScale.display,
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
  stateBodyCentered: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.bodySmall,
  },
  photoPicker: {
    alignItems: 'center',
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderStyle: 'dashed',
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    minHeight: 242,
    justifyContent: 'center',
    padding: mentaSpacing[6],
  },
  photoPickerTitle: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.semibold,
    ...mentaTypeScale.body,
  },
  photoPickerCopy: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    textAlign: 'center',
    ...mentaTypeScale.bodySmall,
  },
  selectedImage: {
    aspectRatio: 4 / 5,
    backgroundColor: mentaColors.raised,
    borderRadius: mentaRadii.large,
    maxHeight: 440,
    width: '100%',
  },
  selectedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  selectedCopy: {
    color: mentaColors.action,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.bodySmall,
  },
  correctionRows: {
    alignSelf: 'stretch',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  correctionRow: {
    alignItems: 'center',
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 58,
    paddingVertical: mentaSpacing[3],
  },
  correctionLabelLane: {
    flex: 1,
    gap: mentaSpacing[1],
  },
  correctionLabel: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.bodySmall,
  },
  correctionDetail: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.caption,
  },
  correctionValue: {
    color: mentaColors.text.secondary,
    flexShrink: 0,
    fontFamily: mentaFonts.inter.regular,
    textAlign: 'right',
    ...mentaTypeScale.caption,
  },
  captionSurface: {
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
  },
  fieldLabel: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.bold,
    ...mentaTypeScale.eyebrow,
  },
  captionInput: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.regular,
    minHeight: 104,
    padding: 0,
    ...mentaTypeScale.body,
  },
  fieldHint: {
    color: mentaColors.text.muted,
    fontFamily: mentaFonts.inter.regular,
    textAlign: 'right',
    ...mentaTypeScale.caption,
  },
  receiptMessage: {
    color: mentaColors.text.muted,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.caption,
  },
  pressed: { opacity: 0.72 },
});
