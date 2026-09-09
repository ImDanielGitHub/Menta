import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
  type Href,
} from 'expo-router';

import {
  ProofConnectionMosaic,
  type ProofConnectionMosaicItem,
  type ProofConnectionMediaLoadState,
} from '@/components/proof/ProofConnectionMosaic';
import {
  ProofEvidenceViewer,
  type ProofEvidenceRecord,
} from '@/components/challenge/proof-evidence';
import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppScreen } from '@/components/ui/AppShell';
import { SkeletonLoader, SkeletonText } from '@/components/ui/SkeletonLoader';
import {
  ArrowLeftIcon,
  ImageIcon,
  ShieldCheckIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { screenInsetPadding } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useAuthStore } from '@/store/auth-store';
import { useEventStore } from '@/store/event-store';
import { useTranslation } from '@/lib/localization';

const firstParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const AlbumFactRow = ({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => {
  const phoneLayout = usePhoneLayout();
  const stacked = phoneLayout.isCompactWidth || phoneLayout.fontScale >= 1.2;
  return (
    <View
      style={[
        styles.factRow,
        stacked && styles.factRowStacked,
        last ? styles.factRowLast : null,
      ]}
    >
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, stacked && styles.factValueStacked]}>
        {value}
      </Text>
    </View>
  );
};

export default function EventAttendeeAlbumScreen() {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{
    eventId?: string | string[];
    occurrenceId?: string | string[];
  }>();
  const eventId = firstParam(params.eventId);
  const occurrenceId = firstParam(params.occurrenceId);
  const user = useAuthStore(state => state.user);
  const storedAlbum = useEventStore(state => state.attendeeAlbum);
  const storedAccountId = useEventStore(state => state.attendeeAlbumAccountId);
  const storedOccurrenceId = useEventStore(
    state => state.attendeeAlbumOccurrenceId
  );
  const storedLoading = useEventStore(state => state.attendeeAlbumLoading);
  const storedError = useEventStore(state => state.attendeeAlbumError);
  const loadAttendeeAlbum = useEventStore(state => state.loadAttendeeAlbum);
  const [mediaStates, setMediaStates] = useState<
    ReadonlyMap<string, ProofConnectionMediaLoadState>
  >(() => new Map());
  const [selectedProof, setSelectedProof] =
    useState<ProofEvidenceRecord | null>(null);

  const album =
    storedAccountId === user?.id &&
    storedAlbum !== null &&
    storedAlbum.eventId === eventId &&
    storedAlbum.occurrenceId === occurrenceId
      ? storedAlbum
      : null;
  const isCurrentPrivateScope =
    storedAccountId === user?.id && storedOccurrenceId === occurrenceId;
  const albumError = isCurrentPrivateScope ? storedError : null;
  const loading = isCurrentPrivateScope ? storedLoading : false;

  const load = useCallback(async () => {
    if (!user || !occurrenceId) return;
    setMediaStates(new Map());
    await loadAttendeeAlbum(occurrenceId);
  }, [loadAttendeeAlbum, occurrenceId, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const mosaicItems = useMemo<ProofConnectionMosaicItem[]>(
    () =>
      album?.items.map(item => ({
        id: item.postId,
        mediaType: 'photo',
        mediaUrl: item.mediaPreviewUrl,
        thumbnailUrl: item.mediaPreviewUrl,
        contributorName: item.attendeeUsername,
        submittedLabel: new Intl.DateTimeFormat(undefined, {
          day: 'numeric',
          month: 'short',
        }).format(new Date(item.approvedAt)),
        state: 'approved',
        canEncourage: false,
        availability:
          mediaStates.get(item.postId) === 'error'
            ? 'unavailable'
            : 'available',
      })) ?? [],
    [album?.items, mediaStates]
  );

  const returnToEvent = useCallback(() => {
    if (!eventId) {
      router.replace('/events');
      return;
    }
    router.replace({
      pathname: '/events/[eventId]',
      params: { eventId },
    });
  }, [eventId, router]);

  const openSignIn = useCallback(() => {
    const next = `/events/${encodeURIComponent(eventId ?? '')}/album?occurrenceId=${encodeURIComponent(occurrenceId ?? '')}`;
    router.push({ pathname: '/auth-required', params: { next } });
  }, [eventId, occurrenceId, router]);

  const openProof = useCallback(() => {
    if (!eventId) return;
    router.push({
      pathname: '/events/[eventId]/proof',
      params: { eventId },
    } as unknown as Href);
  }, [eventId, router]);

  const openOrganiserReview = useCallback(() => {
    if (!occurrenceId) return;
    router.push({
      pathname: '/events/organiser-review/[occurrenceId]',
      params: { occurrenceId },
    } as unknown as Href);
  }, [occurrenceId, router]);

  if (!eventId || !occurrenceId) {
    return (
      <AppScreen
        lane="immersive"
        safeArea
        padding={false}
        hasTabBar={false}
        style={styles.screen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View accessibilityRole="alert" style={styles.missingState}>
          <Text style={styles.stateTitle}>
            {t('events.album.link.incomplete')}
          </Text>
          <Text style={styles.body}>
            {t('events.album.link.incomplete_body')}
          </Text>
          <AppButton
            fullWidth
            onPress={() => router.replace('/events')}
            title={t('events.index.title')}
          />
        </View>
      </AppScreen>
    );
  }

  const confirmedEmpty = Boolean(
    album && album.items.length === 0 && !albumError
  );
  const hasImageFailures = Array.from(mediaStates.values()).some(
    state => state === 'error'
  );

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
          user ? (
            <RefreshControl
              onRefresh={() => void load()}
              refreshing={loading}
              tintColor={mentaColors.action}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel={t('events.album.back')}
            accessibilityRole="button"
            onPress={returnToEvent}
            style={({ pressed }) => [
              styles.iconButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <ArrowLeftIcon color={mentaColors.text.primary} size={20} />
          </Pressable>
          <Text style={styles.topLabel}>{t('events.album.title')}</Text>
          <View style={styles.trailingLane} />
        </View>

        {!user ? (
          <View accessibilityRole="alert" style={styles.stateSection}>
            <ShieldCheckIcon color={mentaColors.info} size={24} />
            <Text style={styles.stateTitle}>
              {t('events.album.sign_in_title')}
            </Text>
            <Text style={styles.body}>{t('events.album.sign_in_body')}</Text>
            <AppButton
              fullWidth
              onPress={openSignIn}
              title={t('events.detail.sign_in')}
            />
          </View>
        ) : null}

        {user && !album && loading ? (
          <View
            accessible
            accessibilityLabel={t('events.album.loading')}
            accessibilityRole="progressbar"
            style={styles.loadingState}
          >
            <SkeletonText announce={false} lines={2} width="88%" />
            <SkeletonLoader announce={false} height={198} />
            <SkeletonLoader announce={false} height={58} />
            <SkeletonLoader announce={false} height={58} />
          </View>
        ) : null}

        {user && !album && !loading && albumError ? (
          <View style={styles.stateSection}>
            <AppInlineNotice
              actionLabel={t('events.album.try_again')}
              description={albumError}
              onAction={() => void load()}
              testID="event-album-load-error"
              title={t('events.album.load_error_title')}
              tone="error"
            />
          </View>
        ) : null}

        {album ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.title}>{t('events.album.hero')}</Text>
              <Text style={styles.body}>{album.eventTitle}</Text>
            </View>

            {albumError ? (
              <AppInlineNotice
                actionLabel={t('events.album.refresh')}
                description={t('events.album.refresh_body')}
                onAction={() => void load()}
                testID="event-album-refresh-error"
                title={t('events.album.refresh_title')}
                tone="warning"
              />
            ) : null}

            {confirmedEmpty ? (
              <View style={styles.emptyState} testID="event-album-empty">
                <ImageIcon color={mentaColors.text.secondary} size={28} />
                <Text style={styles.stateTitle}>
                  {t('events.album.empty_title')}
                </Text>
                <Text style={styles.body}>{t('events.album.empty_body')}</Text>
              </View>
            ) : null}

            {album.items.length > 0 ? (
              <ProofConnectionMosaic
                copy={{
                  title: t('events.album.hero'),
                  emptyTitle: t('events.album.empty_title'),
                  loading: t('events.album.loading'),
                  refreshFailed: t('events.album.image_error_body'),
                  retry: t('events.album.image_refresh'),
                  addProof: t('events.album.add_photo'),
                }}
                items={mosaicItems}
                onAddProof={album.viewerCanPost ? openProof : undefined}
                onMediaLoadStateChange={(item, state) => {
                  setMediaStates(current => {
                    if (current.get(item.id) === state) return current;
                    const next = new Map(current);
                    next.set(item.id, state);
                    return next;
                  });
                }}
                onOpenProof={item => {
                  const albumItem = album.items.find(
                    candidate => candidate.postId === item.id
                  );
                  if (!albumItem) return;
                  setSelectedProof({
                    id: albumItem.postId,
                    mediaType: 'photo',
                    mediaUrl: albumItem.mediaPreviewUrl,
                    state: 'approved',
                    submittedLabel: item.submittedLabel,
                    evidenceTitle: t('todayProof.promise.photo_proof'),
                    contextLabel: album.eventTitle,
                    contributorName: albumItem.attendeeUsername,
                  });
                }}
                onRetry={() => void load()}
                showHeader={false}
                testID="event-proof-mosaic"
                visibilityLabel={t('events.album.who_can_view_value')}
              />
            ) : null}

            {hasImageFailures ? (
              <AppInlineNotice
                actionLabel={t('events.album.image_refresh')}
                description={t('events.album.image_error_body')}
                onAction={() => void load()}
                testID="event-album-image-error"
                title={t('events.album.image_error_title')}
                tone="warning"
              />
            ) : null}

            <View style={styles.factRows}>
              <AlbumFactRow
                label={t('events.album.approved_photos')}
                value={String(album.approvedPostCount)}
              />
              <AlbumFactRow
                label={t('events.album.who_can_view')}
                value={t('events.album.who_can_view_value')}
              />
              <AlbumFactRow
                label={t('events.album.photo_posting')}
                value={t('events.album.photo_posting_value')}
              />
              <AlbumFactRow
                label={t('events.album.downloads')}
                value={t('events.album.downloads_value')}
                last
              />
            </View>

            {album.approvedPostCount > album.items.length ? (
              <Text style={styles.windowCopy}>
                {t('events.album.latest', { count: album.items.length })}
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {album ? (
        <View style={[styles.footer, screenInsetPadding(phoneLayout)]}>
          <AppButton
            fullWidth
            onPress={album.viewerCanPost ? openProof : returnToEvent}
            size="small"
            title={
              album.viewerCanPost
                ? t('events.album.add_photo')
                : t('events.album.back')
            }
          />
          {album.viewerRole === 'organiser' || album.viewerCanPost ? (
            <AppButton
              fullWidth
              onPress={
                album.viewerRole === 'organiser'
                  ? openOrganiserReview
                  : returnToEvent
              }
              size="small"
              title={
                album.viewerRole === 'organiser'
                  ? t('events.album.open_review')
                  : t('events.album.back')
              }
              variant="secondary"
            />
          ) : null}
        </View>
      ) : null}
      <ProofEvidenceViewer
        onClose={() => setSelectedProof(null)}
        proof={selectedProof}
        visible={Boolean(selectedProof)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mentaColors.canvas },
  content: {
    flexGrow: 1,
    gap: mentaSpacing[5],
    paddingBottom: mentaSpacing[6],
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
  pressed: { opacity: 0.72 },
  topLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.secondary,
  },
  trailingLane: { width: mentaLayout.trailingActionLane },
  hero: { gap: mentaSpacing[2] },
  title: {
    ...mentaTypography.journeyTitle,
    color: mentaColors.text.primary,
  },
  body: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  loadingState: { gap: mentaSpacing[4], paddingTop: mentaSpacing[6] },
  missingState: {
    flex: 1,
    gap: mentaSpacing[4],
    justifyContent: 'center',
    padding: mentaLayout.screenInset,
  },
  stateSection: { gap: mentaSpacing[4], paddingTop: mentaSpacing[8] },
  stateTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  emptyState: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    justifyContent: 'center',
    minHeight: 176,
    paddingVertical: mentaSpacing[6],
  },
  factRows: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  factRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
  },
  factRowStacked: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingVertical: mentaSpacing[3],
  },
  factRowLast: { borderBottomWidth: 0 },
  factLabel: {
    ...mentaTypography.body,
    color: mentaColors.text.primary,
  },
  factValue: {
    ...mentaTypography.micro,
    color: mentaColors.text.secondary,
    maxWidth: 164,
    textAlign: 'right',
  },
  factValueStacked: {
    maxWidth: '100%',
    textAlign: 'left',
  },
  windowCopy: {
    ...mentaTypography.micro,
    color: mentaColors.text.secondary,
  },
  footer: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    justifyContent: 'center',
    minHeight: 120,
    paddingHorizontal: mentaLayout.screenInset,
    paddingVertical: mentaSpacing[3],
  },
});
