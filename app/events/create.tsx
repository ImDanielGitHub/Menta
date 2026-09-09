import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  AppButton,
  AppDateTimeRow,
  AppFieldRow,
  AppInlineNotice,
  AppScreen,
  AppTextArea,
  AppTextField,
  SkeletonText,
} from '@/components/ui';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import {
  EVENT_DURATION_OPTIONS,
  buildEventCreateSchedule,
  isActiveEventCreateDraftRequest,
  loadEventCreateDraft,
  saveEventCreateDraft,
  type EventCreateDraftLoadRequest,
  type EventCreateVisibility,
  type EventDurationMinutes,
} from '@/lib/events/create-draft';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from '@/lib/localization';

const visibilityOptions: {
  value: EventCreateVisibility;
}[] = [{ value: 'public' }, { value: 'unlisted' }, { value: 'invite_only' }];

const nextVisibility = (current: EventCreateVisibility) =>
  visibilityOptions[
    (visibilityOptions.findIndex(option => option.value === current) + 1) %
      visibilityOptions.length
  ].value;

const nextDuration = (current: EventDurationMinutes): EventDurationMinutes =>
  EVENT_DURATION_OPTIONS[
    (EVENT_DURATION_OPTIONS.indexOf(current) + 1) %
      EVENT_DURATION_OPTIONS.length
  ];

const durationLabel = (
  minutes: EventDurationMinutes,
  t: ReturnType<typeof useTranslation>['t']
): string =>
  minutes === 60
    ? t('events.create.duration.hour')
    : minutes === 90
      ? t('events.create.duration.hour_half')
      : t('events.create.duration.hours', { count: minutes / 60 });

const timeFromDraft = (value: string): Date => {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  const date = new Date();
  date.setSeconds(0, 0);
  if (!match) {
    date.setHours(9, 0, 0, 0);
    return date;
  }
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
};

const timeForDraft = (value: Date): string =>
  `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;

export default function CreateEventScreen() {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const userId = user?.id ?? null;
  const [loading, setLoading] = useState(Boolean(user));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState(() => timeFromDraft('09:00'));
  const [durationMinutes, setDurationMinutes] =
    useState<EventDurationMinutes>(90);
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<EventCreateVisibility>('public');
  const [savedLocation, setSavedLocation] = useState('');
  const [savedCapacity, setSavedCapacity] = useState('');
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

    setName('');
    setDate('');
    setStartTime(timeFromDraft('09:00'));
    setDurationMinutes(90);
    setDescription('');
    setVisibility('public');
    setSavedLocation('');
    setSavedCapacity('');
    setLoadError(null);
    setSaving(false);
    setLoading(Boolean(userId));

    if (!userId) return;

    void loadEventCreateDraft(userId)
      .then(draft => {
        if (!isActiveEventCreateDraftRequest(draftRequest.current, request)) {
          return;
        }
        if (!draft) return;
        setName(draft.name);
        setDate(draft.date);
        setStartTime(timeFromDraft(draft.startTime));
        setDurationMinutes(draft.durationMinutes);
        setDescription(draft.description);
        setVisibility(draft.visibility);
        setSavedLocation(draft.location);
        setSavedCapacity(draft.capacity);
      })
      .catch(() => {
        if (isActiveEventCreateDraftRequest(draftRequest.current, request)) {
          setLoadError(t('events.create.load_draft_error'));
        }
      })
      .finally(() => {
        if (isActiveEventCreateDraftRequest(draftRequest.current, request)) {
          setLoading(false);
        }
      });
  }, [t, userId]);

  const saveAndContinue = useCallback(async () => {
    if (!user || saving) return;
    const request = draftRequest.current;
    if (request.ownerUserId !== user.id) return;

    const draftStartTime = timeForDraft(startTime);
    const schedule = buildEventCreateSchedule({
      date,
      startTime: draftStartTime,
      durationMinutes,
    });
    if (!schedule.ok) {
      setLoadError(schedule.message);
      return;
    }

    setSaving(true);
    setLoadError(null);
    try {
      await saveEventCreateDraft({
        ownerUserId: user.id,
        name: name.trim(),
        date: date.trim(),
        startTime: draftStartTime,
        durationMinutes,
        description: description.trim(),
        visibility,
        location: savedLocation,
        capacity: savedCapacity,
      });
      if (isActiveEventCreateDraftRequest(draftRequest.current, request)) {
        router.push('/events/create/rules');
      }
    } catch {
      if (isActiveEventCreateDraftRequest(draftRequest.current, request)) {
        setLoadError(t('events.create.save_draft_error'));
      }
    } finally {
      if (isActiveEventCreateDraftRequest(draftRequest.current, request)) {
        setSaving(false);
      }
    }
  }, [
    date,
    description,
    durationMinutes,
    name,
    router,
    savedCapacity,
    savedLocation,
    saving,
    startTime,
    t,
    user,
    visibility,
  ]);

  const activeVisibility =
    visibilityOptions.find(option => option.value === visibility) ??
    visibilityOptions[0];
  const visibilityCopy = {
    public: {
      label: t('events.create.visibility.public'),
      detail: t('events.create.visibility.public_detail'),
    },
    unlisted: {
      label: t('events.create.visibility.unlisted'),
      detail: t('events.create.visibility.unlisted_detail'),
    },
    invite_only: {
      label: t('events.create.visibility.invite_only'),
      detail: t('events.create.visibility.invite_only_detail'),
    },
  }[activeVisibility.value];

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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lead}>
          <Text style={styles.eyebrow}>{t('events.create.step_one')}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {t('events.create.title')}
          </Text>
          <Text style={styles.body}>{t('events.create.body')}</Text>
        </View>

        {!user ? (
          <AppInlineNotice
            title={t('events.create.sign_in_title')}
            description={t('events.create.sign_in_body')}
            tone="info"
            actionLabel={t('events.create.sign_in')}
            onAction={() => router.push('/auth-required')}
          />
        ) : null}

        {loading ? <SkeletonText lines={7} /> : null}

        {!loading && user ? (
          <View style={styles.form}>
            <AppTextField
              label={t('events.create.name_label')}
              value={name}
              onChangeText={setName}
              maxLength={120}
              placeholder={t('events.create.name_placeholder')}
              accessibilityLabel={t('events.create.name_label')}
              containerStyle={styles.field}
            />
            <AppTextArea
              label={t('events.create.description_label')}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              placeholder={t('events.create.description_placeholder')}
              accessibilityLabel={t('events.create.description_label')}
              containerStyle={styles.field}
            />

            <View style={styles.schedule}>
              <Text style={styles.sectionLabel}>
                {t('events.create.schedule')}
              </Text>
              <AppTextField
                label={t('events.create.date_label')}
                value={date}
                onChangeText={setDate}
                maxLength={10}
                placeholder={t('events.create.date_placeholder')}
                helperText={t('events.create.date_helper')}
                accessibilityLabel={t('events.create.date_label')}
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.rows}>
                <AppDateTimeRow
                  title={t('events.create.starts')}
                  subtitle={t('events.create.local_time')}
                  value={startTime}
                  onChange={setStartTime}
                />
                <AppFieldRow
                  title={t('events.create.duration')}
                  subtitle={t('events.create.duration_hint')}
                  value={durationLabel(durationMinutes, t)}
                  onPress={() =>
                    setDurationMinutes(nextDuration(durationMinutes))
                  }
                />
                <AppFieldRow
                  title={t('events.create.visibility.title')}
                  subtitle={visibilityCopy.detail}
                  value={visibilityCopy.label}
                  onPress={() => setVisibility(nextVisibility(visibility))}
                  showDivider={false}
                />
              </View>
            </View>

            {loadError ? (
              <AppInlineNotice
                title={t('events.create.draft_attention')}
                description={loadError}
                tone="error"
              />
            ) : null}

            <AppButton
              title={t('events.create.continue_rules')}
              onPress={() => void saveAndContinue()}
              disabled={!name.trim() || !date.trim()}
              loading={saving}
              fullWidth
            />
            <AppButton
              title={t('events.create.back_events')}
              onPress={() => router.replace('/events')}
              variant="secondary"
              fullWidth
            />
          </View>
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
  lead: { gap: mentaSpacing[3] },
  eyebrow: { ...mentaTypography.caption, color: mentaColors.text.secondary },
  title: { ...mentaTypography.journeyTitle, color: mentaColors.text.primary },
  body: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
  },
  form: { gap: mentaSpacing[5] },
  field: { gap: 0 },
  schedule: { gap: mentaSpacing[3] },
  sectionLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.secondary,
  },
  rows: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
