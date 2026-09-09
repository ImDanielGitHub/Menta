import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
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
import { ArrowLeftIcon, ImageIcon, Share2Icon } from '@/components/ui/icons';
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
import { formatEventCompletedDate } from '@/lib/events/localized-formatting';

import { backOrReplace } from '@/lib/navigation/safe-back';
const firstParam = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value);

const RecapRow = ({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) => (
  <View style={[styles.row, last ? styles.rowLast : null]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

export default function EventRecapScreen() {
  const { locale, t } = useTranslation();
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale]
  );
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = firstParam(params.eventId);
  const user = useAuthStore(state => state.user);
  const storedRecap = useEventStore(state => state.organiserRecap);
  const storedAccountId = useEventStore(state => state.organiserRecapAccountId);
  const storedEventId = useEventStore(state => state.organiserRecapEventId);
  const storedLoading = useEventStore(state => state.organiserRecapLoading);
  const storedError = useEventStore(state => state.organiserRecapError);
  const loadOrganiserRecap = useEventStore(state => state.loadOrganiserRecap);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [mediaStates, setMediaStates] = useState<
    ReadonlyMap<string, ProofConnectionMediaLoadState>
  >(() => new Map());
  const [selectedProof, setSelectedProof] =
    useState<ProofEvidenceRecord | null>(null);

  const recap =
    storedAccountId === user?.id && storedRecap?.eventId === eventId
      ? storedRecap
      : null;
  const isCurrentPrivateScope =
    storedAccountId === user?.id && storedEventId === eventId;
  const recapError = isCurrentPrivateScope ? storedError : null;
  const loading = isCurrentPrivateScope ? storedLoading : false;

  const load = useCallback(async () => {
    if (!user || !eventId) return;
    setMediaStates(new Map());
    setShareError(null);
    await loadOrganiserRecap(eventId);
  }, [eventId, loadOrganiserRecap, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const mosaicItems = useMemo<ProofConnectionMosaicItem[]>(
    () =>
      recap?.albumItems.map(item => ({
        id: item.postId,
        mediaType: 'photo',
        mediaUrl: item.mediaPreviewUrl,
        thumbnailUrl: item.mediaPreviewUrl,
        contributorName: item.attendeeUsername,
        submittedLabel: new Intl.DateTimeFormat(locale, {
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
    [locale, mediaStates, recap?.albumItems]
  );

  const openSignIn = useCallback(() => {
    router.push({
      pathname: '/auth-required',
      params: {
        next: `/events/${encodeURIComponent(eventId ?? '')}/recap`,
      },
    });
  }, [eventId, router]);

  const openAlbum = useCallback(() => {
    if (!recap) return;
    router.push({
      pathname: '/events/[eventId]/album',
      params: {
        eventId: recap.eventId,
        occurrenceId: recap.occurrenceId,
      },
    } as unknown as Href);
  }, [recap, router]);

  const shareRecap = useCallback(async () => {
    if (!recap || recapError || sharing) return;
    setSharing(true);
    setShareError(null);
    try {
      await Share.share({
        message: [
          recap.eventTitle,
          t('events.recap.share_line.joined', { count: recap.counts.joined }),
          t('events.recap.share_line.checked_in', {
            count: recap.counts.checkedIn,
          }),
          t('events.recap.share_line.sent', { count: recap.counts.posted }),
          t('events.recap.share_line.approved', {
            count: recap.counts.verified,
          }),
        ].join('\n'),
        title: t('events.recap.share_title', { event: recap.eventTitle }),
      });
    } catch {
      setShareError(t('events.recap.share_error_body'));
    } finally {
      setSharing(false);
    }
  }, [recap, recapError, sharing, t]);

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
        <View accessibilityRole="alert" style={styles.missingState}>
          <Text style={styles.stateTitle}>
            {t('events.recap.link.incomplete')}
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
            accessibilityLabel={t('events.recap.back')}
            accessibilityRole="button"
            onPress={() =>
              backOrReplace(router, {
                pathname: '/events/[eventId]',
                params: { eventId },
              })
            }
            style={({ pressed }) => [
              styles.iconButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <ArrowLeftIcon color={mentaColors.text.primary} size={20} />
          </Pressable>
          <Text style={styles.topLabel}>{t('events.recap.title')}</Text>
          <View style={styles.trailingLane} />
        </View>

        {!user ? (
          <View accessibilityRole="alert" style={styles.stateSection}>
            <Text style={styles.stateTitle}>
              {t('events.recap.sign_in_title')}
            </Text>
            <Text style={styles.body}>{t('events.recap.sign_in_body')}</Text>
            <AppButton
              fullWidth
              onPress={openSignIn}
              title={t('events.detail.sign_in')}
            />
          </View>
        ) : null}

        {user && !recap && loading ? (
          <View
            accessible
            accessibilityLabel={t('events.recap.loading')}
            accessibilityRole="progressbar"
            style={styles.loadingState}
          >
            <SkeletonText announce={false} lines={2} width="88%" />
            <SkeletonLoader announce={false} height={58} />
            <SkeletonLoader announce={false} height={58} />
            <SkeletonLoader announce={false} height={198} />
          </View>
        ) : null}

        {user && !recap && !loading && recapError ? (
          <View style={styles.stateSection}>
            <AppInlineNotice
              actionLabel={t('events.pass.try_again')}
              description={recapError}
              onAction={() => void load()}
              testID="event-recap-load-error"
              title={t('events.recap.load_error')}
              tone="error"
            />
          </View>
        ) : null}

        {recap ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.title}>
                {t('events.recap.hero', { count: recap.counts.checkedIn })}
              </Text>
              <Text style={styles.body}>{recap.eventTitle}</Text>
              <Text style={styles.completedAt}>
                {formatEventCompletedDate({
                  value: recap.endedAt,
                  timeZone: recap.timeZone,
                  locale,
                  fallback: t('events.recap.completed'),
                })}
              </Text>
            </View>

            {recapError ? (
              <AppInlineNotice
                actionLabel={t('events.recap.refresh')}
                description={t('events.recap.refresh_body')}
                onAction={() => void load()}
                testID="event-recap-refresh-error"
                title={t('events.recap.refresh_title')}
                tone="warning"
              />
            ) : null}

            <View style={styles.rows}>
              <RecapRow
                label={t('events.recap.joined')}
                value={numberFormatter.format(recap.counts.joined)}
              />
              <RecapRow
                label={t('events.recap.checked_in')}
                value={numberFormatter.format(recap.counts.checkedIn)}
              />
              <RecapRow
                label={t('events.recap.photos_sent')}
                value={numberFormatter.format(recap.counts.posted)}
              />
              <RecapRow
                label={t('events.recap.photos_approved')}
                value={numberFormatter.format(recap.counts.verified)}
                last
              />
            </View>

            <View style={styles.albumSection}>
              <View style={styles.albumHeading}>
                <ImageIcon color={mentaColors.text.secondary} size={20} />
                <View style={styles.albumHeadingCopy}>
                  <Text style={styles.sectionLabel}>
                    {t('events.recap.album')}
                  </Text>
                  <Text style={styles.albumCount}>
                    {t('events.recap.moments', {
                      count: recap.approvedPostCount,
                    })}
                  </Text>
                </View>
              </View>

              {recap.albumItems.length > 0 ? (
                <ProofConnectionMosaic
                  items={mosaicItems}
                  onMediaLoadStateChange={(item, state) => {
                    setMediaStates(current => {
                      if (current.get(item.id) === state) return current;
                      const next = new Map(current);
                      next.set(item.id, state);
                      return next;
                    });
                  }}
                  onOpenProof={item => {
                    const albumItem = recap.albumItems.find(
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
                      contextLabel: recap.eventTitle,
                      contributorName: albumItem.attendeeUsername,
                    });
                  }}
                  showHeader={false}
                  testID="event-recap-proof-mosaic"
                  visibilityLabel={t('events.album.who_can_view_value')}
                />
              ) : (
                <View
                  style={styles.emptyAlbum}
                  testID="event-recap-empty-album"
                >
                  <Text style={styles.stateTitle}>
                    {t('events.recap.empty_title')}
                  </Text>
                  <Text style={styles.body}>
                    {t('events.recap.empty_body')}
                  </Text>
                </View>
              )}
            </View>

            {Array.from(mediaStates.values()).some(
              state => state === 'error'
            ) ? (
              <AppInlineNotice
                actionLabel={t('events.recap.image_refresh')}
                description={t('events.recap.image_error_body')}
                onAction={() => void load()}
                testID="event-recap-image-error"
                title={t('events.recap.image_error_title')}
                tone="warning"
              />
            ) : null}

            {shareError ? (
              <AppInlineNotice
                description={shareError}
                testID="event-recap-share-error"
                title={t('events.recap.share_error_title')}
                tone="warning"
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {recap ? (
        <View style={[styles.footer, screenInsetPadding(phoneLayout)]}>
          <AppButton
            fullWidth
            onPress={openAlbum}
            size="small"
            title={t('events.recap.open_album')}
          />
          <AppButton
            disabled={Boolean(recapError)}
            fullWidth
            leftIcon={<Share2Icon color={mentaColors.text.primary} size={18} />}
            loading={sharing}
            onPress={() => void shareRecap()}
            size="small"
            title={t('events.recap.share')}
            variant="secondary"
          />
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
  completedAt: {
    ...mentaTypography.micro,
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
  rows: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    ...mentaTypography.body,
    color: mentaColors.text.primary,
  },
  rowValue: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  albumSection: { gap: mentaSpacing[4] },
  albumHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  albumHeadingCopy: { flex: 1, gap: mentaSpacing[1] },
  sectionLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.primary,
  },
  albumCount: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.secondary,
  },
  emptyAlbum: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    justifyContent: 'center',
    minHeight: 176,
    paddingVertical: mentaSpacing[6],
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
