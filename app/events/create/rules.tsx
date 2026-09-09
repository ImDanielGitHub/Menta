import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useRouter } from 'expo-router';
import { EventCheckInPass } from '@/components/events/EventCheckInPass';
import {
  AppButton,
  AppCard,
  AppFieldRow,
  AppInlineNotice,
  AppScreen,
  AppTextField,
  SkeletonText,
} from '@/components/ui';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { createClientEventId } from '@/lib/client-event-id';
import {
  buildEventCreateSchedule,
  canReuseEventCreatePublishClientEventId,
  clearEventCreateDraft,
  isActiveEventCreateDraftRequest,
  loadEventCreateDraft,
  saveEventCreateDraft,
  type EventCreateDraft,
  type EventCreateDraftLoadRequest,
} from '@/lib/events/create-draft';
import { buildEventLink } from '@/lib/events/links';
import { holdReturnedEventCapability } from '@/lib/events/protected-auth-handoff';
import { saveEventPublishRecovery } from '@/lib/events/publish-recovery';
import { useAuthStore } from '@/store/auth-store';
import { useEventStore } from '@/store/event-store';
import type {
  EventCreated,
  EventCreateInput,
  EventReceipt,
} from '@/types/event';
import { useTranslation } from '@/lib/localization';

import { backOrReplace } from '@/lib/navigation/safe-back';
const capacityFromText = (value: string): number | null | undefined => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10_000
    ? parsed
    : undefined;
};

const eventLinkFor = (created: EventCreated): string => {
  const capability = created.shareToken
    ? { kind: 'share' as const, token: created.shareToken }
    : created.inviteToken
      ? { kind: 'invite' as const, token: created.inviteToken }
      : null;
  return buildEventLink({
    eventId: created.summary.eventId,
    capability,
  });
};

export default function EventRulesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const userId = user?.id ?? null;
  const publishEvent = useEventStore(state => state.publishEvent);
  const [loading, setLoading] = useState(Boolean(user));
  const [publishing, setPublishing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [draft, setDraft] = useState<EventCreateDraft | null>(null);
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<EventReceipt<EventCreated> | null>(
    null
  );
  const draftRequest = useRef<EventCreateDraftLoadRequest>({
    ownerUserId: null,
    requestId: 0,
  });

  useEffect(() => {
    const request: EventCreateDraftLoadRequest = {
      ownerUserId: userId,
      requestId: draftRequest.current.requestId + 1,
    };
    draftRequest.current = request;
    setDraft(null);
    setLocation('');
    setCapacity('');
    setFormError(null);
    setCopyNotice(null);
    setReceipt(null);
    setPublishing(false);
    setSharing(false);
    setLoading(Boolean(userId));

    if (!userId) return;
    void loadEventCreateDraft(userId)
      .then(nextDraft => {
        if (!isActiveEventCreateDraftRequest(draftRequest.current, request)) {
          return;
        }
        setDraft(nextDraft);
        setLocation(nextDraft?.location ?? '');
        setCapacity(nextDraft?.capacity ?? '');
      })
      .catch(() => {
        if (isActiveEventCreateDraftRequest(draftRequest.current, request)) {
          setFormError(t('events.create.load_draft_error'));
        }
      })
      .finally(() => {
        if (isActiveEventCreateDraftRequest(draftRequest.current, request)) {
          setLoading(false);
        }
      });
  }, [t, userId]);

  const updateLocation = useCallback((value: string) => {
    setLocation(value);
    setFormError(null);
    setReceipt(null);
  }, []);

  const updateCapacity = useCallback((value: string) => {
    setCapacity(value.replace(/\D/g, '').slice(0, 5));
    setFormError(null);
    setReceipt(null);
  }, []);

  const publish = useCallback(async () => {
    if (!user || !draft || publishing) return;
    const request = draftRequest.current;
    if (request.ownerUserId !== user.id) return;

    const schedule = buildEventCreateSchedule({
      date: draft.date,
      startTime: draft.startTime,
      durationMinutes: draft.durationMinutes,
    });
    if (!schedule.ok) {
      setFormError(schedule.message);
      return;
    }

    const parsedCapacity = capacityFromText(capacity);
    if (parsedCapacity === undefined) {
      setFormError(t('events.create.capacity_error'));
      return;
    }

    const draftInput = {
      ownerUserId: user.id,
      name: draft.name,
      date: draft.date,
      startTime: draft.startTime,
      durationMinutes: draft.durationMinutes,
      description: draft.description,
      visibility: draft.visibility,
      location,
      capacity,
    };
    const clientEventId =
      canReuseEventCreatePublishClientEventId(draft, draftInput) &&
      draft.publishClientEventId
        ? draft.publishClientEventId
        : createClientEventId();
    const input: EventCreateInput = {
      clientEventId,
      title: draft.name.trim(),
      description: draft.description.trim() || null,
      venueName: location.trim() || null,
      timeZone: schedule.timeZone,
      visibility: draft.visibility,
      startsAt: schedule.startsAt,
      endsAt: schedule.endsAt,
      capacity: parsedCapacity,
    };

    setPublishing(true);
    setFormError(null);
    setCopyNotice(null);
    try {
      const savedDraft = await saveEventCreateDraft({
        ...draftInput,
        publishClientEventId: clientEventId,
      });
      if (!isActiveEventCreateDraftRequest(draftRequest.current, request)) {
        return;
      }
      setDraft(savedDraft);
      const nextReceipt = await publishEvent(input, user.id);
      if (!isActiveEventCreateDraftRequest(draftRequest.current, request)) {
        return;
      }
      setReceipt(nextReceipt);
      if (nextReceipt.outcome === 'completed' && nextReceipt.data) {
        await saveEventPublishRecovery({
          ownerUserId: user.id,
          eventId: nextReceipt.data.summary.eventId,
          publishInput: input,
        });
        await clearEventCreateDraft(user.id);
      } else if (nextReceipt.outcome === 'failed') {
        setFormError(nextReceipt.message);
      }
    } catch {
      if (isActiveEventCreateDraftRequest(draftRequest.current, request)) {
        setFormError(t('events.create.publish_unknown_error'));
      }
    } finally {
      if (isActiveEventCreateDraftRequest(draftRequest.current, request)) {
        setPublishing(false);
      }
    }
  }, [capacity, draft, location, publishEvent, publishing, t, user]);

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

  const openPublishedEvent = useCallback(() => {
    if (!created || !userId) return;
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
      lane="working"
      contentContainerStyle={styles.content}
      hasTabBar={false}
      safeArea
      scrollable
      style={styles.screen}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {!created ? (
        <View style={styles.lead}>
          <Text style={styles.eyebrow}>{t('events.create.step_two')}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {t('events.create.rules_title')}
          </Text>
          <Text style={styles.body}>{t('events.create.rules_body')}</Text>
        </View>
      ) : null}

      {!user ? (
        <AppInlineNotice
          title={t('events.create.sign_in_title')}
          description={t('events.create.sign_in_rules_body')}
          tone="warning"
          actionLabel={t('events.create.sign_in')}
          onAction={() => router.push('/auth-required')}
        />
      ) : null}

      {loading ? <SkeletonText lines={8} /> : null}

      {!loading && user && !draft && !created ? (
        <AppInlineNotice
          title={t('events.create.start_details')}
          description={formError ?? t('events.create.start_details_body')}
          tone="warning"
          actionLabel={t('events.create.open_setup')}
          onAction={() => router.replace('/events/create')}
        />
      ) : null}

      {!loading && user && draft && !created ? (
        <View style={styles.form}>
          <AppCard variant="paper" style={styles.promiseCard}>
            <Text style={styles.paperEyebrow}>
              {t('events.create.summary')}
            </Text>
            <Text style={styles.paperTitle}>{draft.name}</Text>
            <Text style={styles.paperBody}>
              {t('events.create.summary_details', {
                date: draft.date,
                time: draft.startTime,
                minutes: draft.durationMinutes,
              })}
            </Text>
          </AppCard>

          <AppTextField
            label={t('events.create.meeting_place')}
            value={location}
            onChangeText={updateLocation}
            maxLength={160}
            placeholder={t('events.create.meeting_placeholder')}
            accessibilityLabel={t('events.create.meeting_place')}
          />
          <AppTextField
            label={t('events.create.capacity_optional')}
            value={capacity}
            onChangeText={updateCapacity}
            maxLength={5}
            placeholder={t('events.create.capacity_placeholder')}
            helperText={t('events.create.capacity_helper')}
            accessibilityLabel={t('events.create.capacity')}
            keyboardType="number-pad"
          />

          <View style={styles.ruleBlock}>
            <Text style={styles.sectionLabel}>
              {t('events.create.attendance_works')}
            </Text>
            <View style={styles.rows}>
              <AppFieldRow
                title={t('events.create.check_in')}
                subtitle={t('events.create.check_in_detail')}
                value={t('events.create.check_in_value')}
              />
              <AppFieldRow
                title={t('events.create.photos')}
                subtitle={t('events.create.photos_detail')}
                value={t('events.create.photos_value')}
              />
              <AppFieldRow
                title={t('events.create.review')}
                subtitle={t('events.create.review_detail')}
                value={t('events.create.review_value')}
                showDivider={false}
              />
            </View>
          </View>

          {formError ? (
            <AppInlineNotice
              title={t('events.create.publish_error')}
              description={formError}
              tone="error"
            />
          ) : null}

          {receipt?.outcome === 'unknown_result' ? (
            <AppInlineNotice
              title={t('events.create.publish_unknown')}
              description={t('events.create.publish_unknown_body')}
              tone="warning"
            />
          ) : null}

          <AppButton
            title={
              receipt?.outcome === 'unknown_result'
                ? t('events.create.check_publish')
                : t('events.create.publish')
            }
            onPress={() => void publish()}
            loading={publishing}
            disabled={!location.trim()}
            variant="accent"
            fullWidth
          />
          <AppButton
            title={t('events.create.back_setup')}
            onPress={() => backOrReplace(router, '/events/create')}
            variant="secondary"
            fullWidth
          />
        </View>
      ) : null}

      {created ? (
        <View style={styles.receipt}>
          <View style={styles.publishedLead}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('events.create.published_title')}
            </Text>
            <Text style={styles.body}>
              {t('events.create.published_body', {
                event: created.summary.title,
              })}
            </Text>
          </View>

          <EventCheckInPass code={created.organiserCheckInCode} />

          {eventLink ? (
            <View style={styles.mainActions}>
              <AppButton
                title={t('events.create.share')}
                onPress={() => void shareEvent()}
                loading={sharing}
                variant="accent"
                fullWidth
              />
              <AppButton
                title={t('events.create.copy_link')}
                onPress={() =>
                  void copyValue(eventLink, t('events.create.link_label'))
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
            title={t('events.create.copy_code')}
            accessibilityHint={t('events.create.copy_code_hint')}
            onPress={() =>
              void copyValue(
                created.organiserCheckInCode,
                t('events.create.code_label')
              )
            }
            size="small"
            variant="ghost"
          />
          <AppButton
            title={t('events.create.open_published')}
            onPress={openPublishedEvent}
            fullWidth
          />
          <AppButton
            title={t('events.create.back_events')}
            onPress={() => router.replace('/events')}
            variant="tertiary"
            fullWidth
          />
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mentaColors.canvas },
  content: {
    flexGrow: 1,
    gap: mentaSpacing[5],
    paddingTop: mentaSpacing[5],
    paddingBottom: mentaSpacing[12],
  },
  lead: { gap: mentaSpacing[3] },
  eyebrow: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  title: { ...mentaTypography.journeyTitle, color: mentaColors.text.primary },
  body: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
  },
  form: { gap: mentaSpacing[5] },
  promiseCard: { gap: mentaSpacing[2] },
  paperEyebrow: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.mutedOnPaper,
  },
  paperTitle: { ...mentaTypography.title, color: mentaColors.text.onPaper },
  paperBody: { ...mentaTypography.body, color: mentaColors.text.mutedOnPaper },
  ruleBlock: { gap: mentaSpacing[3] },
  sectionLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.secondary,
  },
  rows: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  receipt: { gap: mentaSpacing[3] },
  publishedLead: { gap: mentaSpacing[2] },
  mainActions: { gap: mentaSpacing[3] },
  copyNotice: {
    ...mentaTypography.bodySmall,
    color: mentaColors.success,
  },
  copyNoticeError: { color: mentaColors.danger },
});
