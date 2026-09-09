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
import { Stack, useRouter } from 'expo-router';
import { AppScreen } from '@/components/ui/AppShell';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypeScale,
} from '@/constants/MentaDesignSystem';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { mentaFonts } from '@/lib/menta-fonts';
import {
  listEventPublishRecoveries,
  type EventPublishRecovery,
} from '@/lib/events/publish-recovery';
import { useAuthStore } from '@/store/auth-store';
import { useEventStore } from '@/store/event-store';
import type { EventDiscovery } from '@/types/event';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppButton } from '@/components/ui/AppButton';
import { SkeletonLoader, SkeletonText } from '@/components/ui/SkeletonLoader';
import { ArrowRightIcon, ChevronLeftIcon } from '@/components/ui/icons';
import {
  IpadEventsWorkspace,
  type IpadEventsWorkspaceItem,
} from '@/components/ipad/IpadEventsWorkspace';
import { useIPadPortraitWorkspace } from '@/components/ipad/ipad-workspace';

import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  useTranslation,
  resolveCatalogueLocale,
  type TranslationKey,
  type TranslationValues,
} from '@/lib/localization';
type EventTime = Pick<EventDiscovery, 'startsAt' | 'timeZone'>;

type Translate = (key: TranslationKey, values?: TranslationValues) => string;

const formatWhen = (event: EventTime, locale: string, t: Translate): string => {
  const start = new Date(event.startsAt);
  if (Number.isNaN(start.getTime())) return t('events.index.time.tbc');

  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: event.timeZone,
    }).format(start);
  } catch {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(start);
  }
};

const formatDateLane = (
  event: EventTime,
  locale: string,
  t: Translate
): { day: string; month: string } => {
  const start = new Date(event.startsAt);
  if (Number.isNaN(start.getTime())) {
    return { day: '—', month: t('events.index.date.tbc') };
  }

  try {
    return {
      day: new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        timeZone: event.timeZone,
      }).format(start),
      month: new Intl.DateTimeFormat(locale, {
        month: 'short',
        timeZone: event.timeZone,
      })
        .format(start)
        .toUpperCase(),
    };
  } catch {
    return {
      day: new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(start),
      month: new Intl.DateTimeFormat(locale, { month: 'short' })
        .format(start)
        .toUpperCase(),
    };
  }
};

const capacityCopy = (event: EventDiscovery, t: Translate): string => {
  if (event.capacity === null) return t('events.index.capacity.unlimited');
  const remaining = Math.max(event.capacity - event.reservedCount, 0);
  return remaining === 0
    ? t('events.index.capacity.full')
    : t('events.index.capacity.remaining', { count: remaining });
};

const visibilityCopy = (
  visibility: EventPublishRecovery['input']['visibility'],
  t: Translate
): string =>
  visibility === 'invite_only'
    ? t('events.index.visibility.invite_only')
    : visibility === 'unlisted'
      ? t('events.index.visibility.unlisted')
      : t('events.index.visibility.public');

type AuthoredRecoveryState = {
  ownerUserId: string | null;
  items: EventPublishRecovery[];
  loading: boolean;
  error: string | null;
};

export default function EventsIndexScreen() {
  const phoneLayout = usePhoneLayout();
  const usesIpadWorkspace = useIPadPortraitWorkspace();
  const { locale, t } = useTranslation();
  const resolvedLocale = resolveCatalogueLocale(locale);
  const router = useRouter();
  const userId = useAuthStore(state => state.user?.id ?? null);
  const publicEvents = useEventStore(state => state.publicEvents);
  const loading = useEventStore(state => state.publicEventsLoading);
  const error = useEventStore(state => state.publicEventsError);
  const loadPublicEvents = useEventStore(state => state.loadPublicEvents);
  const activeRecoveryAccount = useRef(userId);
  activeRecoveryAccount.current = userId;
  const recoveryRequestId = useRef(0);
  const [authoredRecovery, setAuthoredRecovery] =
    useState<AuthoredRecoveryState>({
      ownerUserId: userId,
      items: [],
      loading: Boolean(userId),
      error: null,
    });

  const loadAuthoredRecoveries = useCallback(async () => {
    const requestId = recoveryRequestId.current + 1;
    recoveryRequestId.current = requestId;
    const expectedUserId = userId;
    const requestIsCurrent = () =>
      recoveryRequestId.current === requestId &&
      activeRecoveryAccount.current === expectedUserId;

    if (!expectedUserId) {
      setAuthoredRecovery({
        ownerUserId: null,
        items: [],
        loading: false,
        error: null,
      });
      return;
    }

    setAuthoredRecovery(current => ({
      ownerUserId: expectedUserId,
      items: current.ownerUserId === expectedUserId ? current.items : [],
      loading: true,
      error: null,
    }));
    try {
      const items = await listEventPublishRecoveries(expectedUserId);
      if (!requestIsCurrent()) return;
      setAuthoredRecovery({
        ownerUserId: expectedUserId,
        items,
        loading: false,
        error: null,
      });
    } catch {
      if (!requestIsCurrent()) return;
      setAuthoredRecovery(current => ({
        ownerUserId: expectedUserId,
        items: current.ownerUserId === expectedUserId ? current.items : [],
        loading: false,
        error: t('events.index.error.organiser_detail'),
      }));
    }
  }, [t, userId]);

  const visibleAuthoredRecovery =
    authoredRecovery.ownerUserId === userId
      ? authoredRecovery
      : {
          ownerUserId: userId,
          items: [],
          loading: Boolean(userId),
          error: null,
        };
  const authoredEvents = visibleAuthoredRecovery.items;
  const authoredEventsLoading = visibleAuthoredRecovery.loading;
  const authoredEventsError = visibleAuthoredRecovery.error;
  const authoredEventIds = useMemo(
    () => new Set(authoredEvents.map(event => event.eventId)),
    [authoredEvents]
  );
  const upcomingEvents = useMemo(
    () => publicEvents.filter(event => !authoredEventIds.has(event.eventId)),
    [authoredEventIds, publicEvents]
  );
  const hasVisibleEvents =
    authoredEvents.length > 0 || upcomingEvents.length > 0;

  const refresh = useCallback(() => {
    void loadPublicEvents();
    void loadAuthoredRecoveries();
  }, [loadAuthoredRecoveries, loadPublicEvents]);

  useEffect(() => {
    refresh();
    return () => {
      recoveryRequestId.current += 1;
    };
  }, [refresh]);

  const ipadItems = useMemo<IpadEventsWorkspaceItem[]>(() => {
    const authored: IpadEventsWorkspaceItem[] = authoredEvents.map(
      recovery => ({
        key: `authored-${recovery.eventId}`,
        section: 'authored',
        title: recovery.input.title,
        description: recovery.input.description,
        when: formatWhen(recovery.input, resolvedLocale, t),
        venue: recovery.input.venueName,
        capacity:
          recovery.input.capacity === null
            ? t('events.index.capacity.unlimited')
            : new Intl.NumberFormat(resolvedLocale).format(
                recovery.input.capacity
              ),
        context: t('events.index.organiser_meta', {
          visibility: visibilityCopy(recovery.input.visibility, t),
        }),
        actionLabel: t('events.index.organiser_open', {
          event: recovery.input.title,
        }),
        actionHint: t('events.index.organiser_hint'),
        onOpen: () =>
          router.push({
            pathname: '/events/[eventId]/organiser-pass',
            params: { eventId: recovery.eventId },
          }),
      })
    );
    const upcoming: IpadEventsWorkspaceItem[] = upcomingEvents.map(event => {
      const eventId = event.eventId;
      return {
        key: `upcoming-${event.occurrenceId}`,
        section: 'upcoming',
        title: event.title,
        description: event.description,
        when: formatWhen(event, resolvedLocale, t),
        venue: event.venueName,
        capacity: capacityCopy(event, t),
        context: visibilityCopy(event.visibility, t),
        actionLabel: t('events.index.view', { event: event.title }),
        actionHint: t('events.index.view_hint'),
        onOpen: () =>
          router.push({
            pathname: '/events/[eventId]',
            params: { eventId },
          }),
      };
    });
    return [...authored, ...upcoming];
  }, [authoredEvents, resolvedLocale, router, t, upcomingEvents]);

  if (usesIpadWorkspace) {
    return (
      <AppScreen
        lane="full"
        safeArea
        padding={false}
        hasTabBar={false}
        style={styles.screen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.ipadContent}>
          <View style={styles.ipadTopBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('events.index.back')}
              onPress={() => backOrReplace(router, '/(tabs)')}
              style={({ pressed }) => [
                styles.backButton,
                styles.ipadBackButton,
                pressed && styles.pressed,
              ]}
            >
              <ChevronLeftIcon color={mentaColors.text.primary} size={20} />
            </Pressable>
            <Text style={styles.title}>{t('events.index.title')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityHint={t('events.index.create_hint')}
              accessibilityLabel={t('events.index.create')}
              onPress={() => router.push('/events/create')}
              style={({ pressed }) => [
                styles.ipadCreateButton,
                pressed && styles.pressed,
              ]}
              testID="create-event"
            >
              <Text style={styles.createDraftCopy}>
                {t('events.index.create')}
              </Text>
              <ArrowRightIcon color={mentaColors.action} size={16} />
            </Pressable>
          </View>

          {error ? (
            <AppInlineNotice
              actionLabel={t('events.index.try_again')}
              description={t('events.index.error.refresh_detail')}
              onAction={refresh}
              testID="events-refresh-error"
              title={t('events.index.error.refresh_title')}
              tone="error"
            />
          ) : null}

          {userId && authoredEventsError ? (
            <AppInlineNotice
              actionLabel={t('events.index.try_again')}
              description={authoredEventsError}
              onAction={() => void loadAuthoredRecoveries()}
              testID="authored-events-refresh-error"
              title={t('events.index.error.organiser_title')}
              tone="error"
            />
          ) : null}

          {!loading &&
          !authoredEventsLoading &&
          !error &&
          !authoredEventsError &&
          !hasVisibleEvents ? (
            <View style={styles.emptyState} testID="events-empty-state">
              <Text style={styles.stateTitle}>
                {t('events.index.empty_title')}
              </Text>
              <Text style={styles.stateBody}>
                {t('events.index.empty_detail')}
              </Text>
              <AppButton
                title={t('events.index.create')}
                onPress={() => router.push('/events/create')}
                variant="primary"
                testID="create-event"
              />
            </View>
          ) : null}

          {ipadItems.length > 0 ? (
            <IpadEventsWorkspace
              authoredLabel={t('events.index.yours')}
              items={ipadItems}
              onRefresh={refresh}
              refreshing={loading || authoredEventsLoading}
              upcomingLabel={t('events.index.upcoming')}
            />
          ) : null}
        </View>
      </AppScreen>
    );
  }

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
            refreshing={
              (loading || authoredEventsLoading) &&
              (publicEvents.length > 0 || authoredEvents.length > 0)
            }
            onRefresh={refresh}
            tintColor={mentaColors.action}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('events.index.back')}
          onPress={() => backOrReplace(router, '/(tabs)')}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeftIcon color={mentaColors.text.primary} size={20} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{t('events.index.title')}</Text>
          {hasVisibleEvents ? (
            <Pressable
              accessibilityRole="button"
              accessibilityHint={t('events.index.create_hint')}
              accessibilityLabel={t('events.index.create')}
              onPress={() => router.push('/events/create')}
              style={({ pressed }) => [
                styles.createDraftLink,
                pressed && styles.pressed,
              ]}
              testID="create-event"
            >
              <Text style={styles.createDraftCopy}>
                {t('events.index.create')}
              </Text>
              <ArrowRightIcon color={mentaColors.action} size={16} />
            </Pressable>
          ) : null}
        </View>

        {(loading || authoredEventsLoading) && !hasVisibleEvents ? (
          <View
            accessible
            accessibilityLabel={t('events.index.loading')}
            accessibilityRole="progressbar"
            style={styles.loading}
          >
            <SkeletonLoader announce={false} height={13} width={92} />
            <View style={styles.skeletonRow}>
              <SkeletonLoader
                height={mentaSpacing[10]}
                width={48}
                announce={false}
              />
              <View style={styles.skeletonCopy}>
                <SkeletonText announce={false} lines={2} />
              </View>
            </View>
            <View style={styles.skeletonRow}>
              <SkeletonLoader
                height={mentaSpacing[10]}
                width={48}
                announce={false}
              />
              <View style={styles.skeletonCopy}>
                <SkeletonText announce={false} lines={2} />
              </View>
            </View>
            <View style={styles.skeletonRow}>
              <SkeletonLoader
                height={mentaSpacing[10]}
                width={48}
                announce={false}
              />
              <View style={styles.skeletonCopy}>
                <SkeletonText announce={false} lines={2} />
              </View>
            </View>
          </View>
        ) : null}

        {error ? (
          <AppInlineNotice
            actionLabel={t('events.index.try_again')}
            description={t('events.index.error.refresh_detail')}
            onAction={refresh}
            testID="events-refresh-error"
            title={t('events.index.error.refresh_title')}
            tone="error"
          />
        ) : null}

        {userId && authoredEventsError ? (
          <AppInlineNotice
            actionLabel={t('events.index.try_again')}
            description={authoredEventsError}
            onAction={() => void loadAuthoredRecoveries()}
            testID="authored-events-refresh-error"
            title={t('events.index.error.organiser_title')}
            tone="error"
          />
        ) : null}

        {authoredEvents.length > 0 ? (
          <View
            style={[styles.list, styles.authoredList]}
            testID="authored-events-list"
          >
            <Text style={styles.listLabel}>{t('events.index.yours')}</Text>
            {authoredEvents.map(recovery => (
              <Pressable
                key={recovery.eventId}
                accessibilityRole="button"
                accessibilityLabel={t('events.index.organiser_open', {
                  event: recovery.input.title,
                })}
                accessibilityHint={t('events.index.organiser_hint')}
                onPress={() =>
                  router.push({
                    pathname: '/events/[eventId]/organiser-pass',
                    params: { eventId: recovery.eventId },
                  })
                }
                style={({ pressed }) => [
                  styles.eventRow,
                  pressed && styles.pressed,
                ]}
                testID={`authored-event-${recovery.eventId}`}
              >
                <View style={styles.dateLane}>
                  <Text style={styles.dateMonth}>
                    {formatDateLane(recovery.input, resolvedLocale, t).month}
                  </Text>
                  <Text style={styles.dateDay}>
                    {formatDateLane(recovery.input, resolvedLocale, t).day}
                  </Text>
                </View>
                <View style={styles.eventCopy}>
                  <Text numberOfLines={2} style={styles.eventTitle}>
                    {recovery.input.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.eventMeta}>
                    {formatWhen(recovery.input, resolvedLocale, t)}
                    {recovery.input.venueName
                      ? ` · ${recovery.input.venueName}`
                      : ''}
                  </Text>
                  <Text style={styles.organiserMeta}>
                    {t('events.index.organiser_meta', {
                      visibility: visibilityCopy(recovery.input.visibility, t),
                    })}
                  </Text>
                </View>
                <View style={styles.trailingLane}>
                  <ArrowRightIcon color={mentaColors.action} size={18} />
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!loading &&
        !authoredEventsLoading &&
        !error &&
        !authoredEventsError &&
        !hasVisibleEvents ? (
          <View style={styles.emptyState} testID="events-empty-state">
            <Text style={styles.stateTitle}>
              {t('events.index.empty_title')}
            </Text>
            <Text style={styles.stateBody}>
              {t('events.index.empty_detail')}
            </Text>
            <AppButton
              title={t('events.index.create')}
              onPress={() => router.push('/events/create')}
              variant="primary"
              fullWidth
              testID="create-event"
            />
          </View>
        ) : null}

        {upcomingEvents.length > 0 ? (
          <View style={styles.list}>
            <Text style={styles.listLabel}>{t('events.index.upcoming')}</Text>
            {upcomingEvents.map(event => (
              <Pressable
                key={event.occurrenceId}
                accessibilityRole="button"
                accessibilityLabel={t('events.index.view', {
                  event: event.title,
                })}
                accessibilityHint={t('events.index.view_hint')}
                onPress={() =>
                  router.push({
                    pathname: '/events/[eventId]',
                    params: { eventId: event.eventId },
                  })
                }
                style={({ pressed }) => [
                  styles.eventRow,
                  pressed && styles.pressed,
                ]}
                testID={`event-row-${event.eventId}`}
              >
                <View style={styles.dateLane}>
                  <Text style={styles.dateMonth}>
                    {formatDateLane(event, resolvedLocale, t).month}
                  </Text>
                  <Text style={styles.dateDay}>
                    {formatDateLane(event, resolvedLocale, t).day}
                  </Text>
                </View>
                <View style={styles.eventCopy}>
                  <Text numberOfLines={2} style={styles.eventTitle}>
                    {event.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.eventMeta}>
                    {formatWhen(event, resolvedLocale, t)}
                    {event.venueName ? ` · ${event.venueName}` : ''}
                  </Text>
                  <Text style={styles.capacity}>{capacityCopy(event, t)}</Text>
                </View>
                <View style={styles.trailingLane}>
                  <ArrowRightIcon color={mentaColors.action} size={18} />
                </View>
              </Pressable>
            ))}
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
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[12],
    paddingBottom: mentaSpacing[12],
  },
  header: { gap: mentaSpacing[2], marginBottom: mentaSpacing[8] },
  createDraftLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[2],
    marginTop: mentaSpacing[2],
    minHeight: mentaLayout.minimumTouchTarget,
  },
  createDraftCopy: {
    color: mentaColors.action,
    fontFamily: mentaFonts.inter.semibold,
    ...mentaTypeScale.bodySmall,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    height: mentaLayout.minimumTouchTarget,
    justifyContent: 'center',
    marginBottom: mentaSpacing[5],
    width: mentaLayout.minimumTouchTarget,
  },
  title: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.medium,
    ...mentaTypeScale.display,
  },
  loading: { gap: mentaSpacing[4] },
  skeletonRow: {
    alignItems: 'center',
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 88,
    paddingVertical: mentaSpacing[3],
  },
  skeletonCopy: { flex: 1 },
  list: { gap: mentaSpacing[2] },
  authoredList: { marginBottom: mentaSpacing[8] },
  listLabel: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.semibold,
    marginBottom: mentaSpacing[2],
    ...mentaTypeScale.bodySmall,
  },
  eventRow: {
    alignItems: 'center',
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 88,
    paddingVertical: mentaSpacing[3],
  },
  dateLane: { alignItems: 'center', width: 48 },
  dateMonth: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.bold,
    ...mentaTypeScale.eyebrow,
  },
  dateDay: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.newsreader.medium,
    ...mentaTypeScale.title,
  },
  eventCopy: { flex: 1, gap: mentaSpacing[1] },
  eventTitle: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.semibold,
    ...mentaTypeScale.body,
  },
  eventMeta: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    ...mentaTypeScale.caption,
  },
  capacity: {
    color: mentaColors.success,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.caption,
  },
  organiserMeta: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.medium,
    ...mentaTypeScale.caption,
  },
  trailingLane: {
    alignItems: 'center',
    justifyContent: 'center',
    width: mentaLayout.trailingActionLane,
  },
  emptyState: {
    alignItems: 'flex-start',
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[6],
    width: '100%',
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
  pressed: { opacity: 0.72 },
  ipadContent: {
    flex: 1,
    gap: mentaSpacing[5],
    paddingBottom: mentaSpacing[8],
    paddingHorizontal: mentaSpacing[8],
    paddingTop: mentaSpacing[6],
  },
  ipadTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[5],
  },
  ipadBackButton: { marginBottom: 0 },
  ipadCreateButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
    marginLeft: 'auto',
    minHeight: mentaLayout.minimumTouchTarget,
  },
});
