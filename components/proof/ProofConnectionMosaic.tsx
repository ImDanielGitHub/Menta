import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, type VideoThumbnail } from 'expo-video';

import { SignedImage } from '@/components/ui/SignedImage';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  AlertCircleIcon,
  CameraIcon,
  CheckIcon,
  HeartIcon,
  ImageIcon,
  LockIcon,
  PlayIcon,
  PlusIcon,
  VideoIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';
import { resolveProofVideoUri } from '@/lib/services/proof-media-viewer';
import { addBreadcrumb } from '@/lib/sentry';

type Localise = ReturnType<typeof useTranslation>['t'];

export type ProofConnectionMediaType = 'photo' | 'video';
export type ProofConnectionState = 'approved' | 'waiting' | 'needs-retry';
export type ProofConnectionAvailability =
  | 'available'
  | 'privacy-hidden'
  | 'unavailable';
export type ProofConnectionMediaLoadState =
  | 'loading'
  | 'ready'
  | 'error'
  | 'privacy-hidden';

export type ProofConnectionMosaicItem = {
  id: string;
  mediaType: ProofConnectionMediaType;
  /** Full photo URL. For videos this remains the playable media URL. */
  mediaUrl?: string | null;
  /** A still image for a video tile. The viewer owns video playback. */
  thumbnailUrl?: string | null;
  contributorId?: string;
  contributorName: string;
  submittedLabel: string;
  state?: ProofConnectionState;
  stateLabel?: string;
  durationLabel?: string;
  reactionCount?: number;
  encouragedByCurrentUser?: boolean;
  canEncourage?: boolean;
  accessibilityLabel?: string;
  availability?: ProofConnectionAvailability;
};

export type ProofConnectionMosaicCopy = {
  title: string;
  addProof: string;
  emptyTitle: string;
  loading: string;
  retry: string;
  refreshFailed: string;
};

const getDefaultProofConnectionMosaicCopy = (
  localise: Localise
): ProofConnectionMosaicCopy => ({
  title: localise('todayProof.source.accountability.proof_together'),
  addProof: localise('todayProof.streak.add_proof'),
  emptyTitle: localise('todayProof.source.accountability.no_shared_proof'),
  loading: localise('todayProof.source.accountability.loading_shared_proof'),
  retry: localise('todayProof.promise.try_again'),
  refreshFailed: localise('todayProof.promise.out_of_date'),
});

export type ProofConnectionMosaicProps = {
  items: readonly ProofConnectionMosaicItem[];
  onOpenProof: (item: ProofConnectionMosaicItem, index: number) => void;
  onAddProof?: () => void;
  onViewAll?: () => void;
  onRetry?: () => void;
  onToggleEncouragement?: (
    item: ProofConnectionMosaicItem,
    encouraged: boolean
  ) => void;
  onMediaLoadStateChange?: (
    item: ProofConnectionMosaicItem,
    state: ProofConnectionMediaLoadState
  ) => void;
  loading?: boolean;
  errorMessage?: string | null;
  visibilityLabel?: string;
  title?: string;
  copy?: Partial<ProofConnectionMosaicCopy>;
  previewLimit?: number;
  /**
   * The usable lane width, after route gutters. Pass it from a bounded parent
   * when the mosaic is narrower than the normal phone task lane.
   */
  contentWidth?: number;
  showHeader?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const MOSAIC_GAP = 4;
const DEFAULT_PREVIEW_LIMIT = 5;

const resolveMosaicGeometry = (contentWidth: number) => {
  const boundedWidth = Math.max(
    272,
    Math.min(contentWidth, mentaLayout.immersiveFrameMax)
  );

  return {
    width: boundedWidth,
    topHeight:
      boundedWidth <= 272 ? 260 : Math.round(boundedWidth * (312 / 382)),
    bottomHeight: Math.max(140, Math.round(boundedWidth * (170 / 382))),
  };
};

const resolvedStateLabel = (
  item: ProofConnectionMosaicItem,
  localise: Localise
): string => {
  if (item.stateLabel?.trim()) return item.stateLabel.trim();
  if (item.state === 'approved')
    return localise('todayProof.proof.state_approved');
  if (item.state === 'waiting')
    return localise('todayProof.proof.state_waiting');
  if (item.state === 'needs-retry')
    return localise('todayProof.proof.state_retry');
  return '';
};

const mediaAccessibilityLabel = (
  item: ProofConnectionMosaicItem,
  localise: Localise
): string => {
  if (item.accessibilityLabel?.trim()) return item.accessibilityLabel.trim();

  const type =
    item.mediaType === 'video'
      ? localise('todayProof.promise.video_proof')
      : localise('todayProof.promise.photo_proof');
  const state = resolvedStateLabel(item, localise);

  return state
    ? localise(
        'todayProof.source.accountability.media_accessibility_with_state',
        {
          type,
          name: item.contributorName,
          submitted: item.submittedLabel,
          state,
        }
      )
    : localise(
        'todayProof.source.accountability.media_accessibility_without_state',
        {
          type,
          name: item.contributorName,
          submitted: item.submittedLabel,
        }
      );
};

const mediaPreviewUrl = (item: ProofConnectionMosaicItem) =>
  item.mediaType === 'video' ? item.thumbnailUrl : item.mediaUrl;

type MosaicTileProps = {
  item: ProofConnectionMosaicItem;
  onOpen: () => void;
  onToggleEncouragement?: (encouraged: boolean) => void;
  onMediaLoadStateChange?: (state: ProofConnectionMediaLoadState) => void;
  localise: Localise;
  overflowCount?: number;
  openAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID: string;
};

const ProofVideoThumbnail = ({
  item,
  localise,
  onStateChange,
}: {
  item: ProofConnectionMosaicItem;
  localise: Localise;
  onStateChange?: (state: ProofConnectionMediaLoadState) => void;
}) => {
  const player = useVideoPlayer(null);
  const [thumbnail, setThumbnail] = useState<VideoThumbnail | null>(null);
  const [failed, setFailed] = useState(false);
  const stateCallbackRef = useRef(onStateChange);
  stateCallbackRef.current = onStateChange;

  useEffect(() => {
    let cancelled = false;
    setThumbnail(null);
    setFailed(false);
    stateCallbackRef.current?.('loading');

    if (!item.mediaUrl || Platform.OS === 'web') {
      setFailed(true);
      stateCallbackRef.current?.('error');
      return () => undefined;
    }

    void resolveProofVideoUri(item.mediaUrl)
      .then(uri => player.replaceAsync({ uri, useCaching: true }))
      .then(() =>
        player.generateThumbnailsAsync(0.1, {
          maxHeight: 480,
          maxWidth: 480,
        })
      )
      .then(thumbnails => {
        if (cancelled) return;
        const first = thumbnails[0] ?? null;
        setThumbnail(first);
        setFailed(!first);
        stateCallbackRef.current?.(first ? 'ready' : 'error');
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        stateCallbackRef.current?.('error');
        addBreadcrumb('proof_media_thumbnail_state', {
          media_type: 'video',
          outcome: 'error',
          surface: 'proof_mosaic',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [item.id, item.mediaUrl, player]);

  if (!thumbnail || failed) {
    return (
      <View style={styles.mediaPlaceholder}>
        <VideoIcon size={26} color={mentaColors.text.secondary} />
      </View>
    );
  }

  return (
    <ExpoImage
      accessibilityIgnoresInvertColors
      accessibilityLabel={`image: ${mediaAccessibilityLabel(item, localise)}`}
      contentFit="cover"
      placeholderContentFit="cover"
      recyclingKey={item.id}
      source={thumbnail}
      style={StyleSheet.absoluteFill}
    />
  );
};

const MosaicTile = ({
  item,
  onOpen,
  onToggleEncouragement,
  onMediaLoadStateChange,
  localise,
  overflowCount = 0,
  openAccessibilityLabel,
  style,
  testID,
}: MosaicTileProps) => {
  const availability = item.availability ?? 'available';
  const previewUrl = mediaPreviewUrl(item);
  const stateLabel = resolvedStateLabel(item, localise);
  const showReaction =
    item.canEncourage !== false &&
    (Boolean(onToggleEncouragement) ||
      Boolean(item.reactionCount) ||
      item.encouragedByCurrentUser === true);

  const reactionLabel = item.encouragedByCurrentUser
    ? localise('todayProof.source.accountability.remove_encouragement_for', {
        name: item.contributorName,
      })
    : localise('todayProof.source.accountability.encourage_person', {
        name: item.contributorName,
      });

  useEffect(() => {
    if (availability === 'privacy-hidden') {
      onMediaLoadStateChange?.('privacy-hidden');
    } else if (availability === 'unavailable') {
      onMediaLoadStateChange?.('error');
    }
  }, [availability, onMediaLoadStateChange]);

  return (
    <View style={[styles.tile, style]} testID={testID}>
      <Pressable
        accessibilityHint={localise('todayProof.proof.open_exact')}
        accessibilityLabel={
          openAccessibilityLabel ?? mediaAccessibilityLabel(item, localise)
        }
        accessibilityRole="button"
        disabled={availability !== 'available'}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.openProofTarget,
          pressed ? styles.pressed : null,
        ]}
        testID={`${testID}-open`}
      >
        {availability === 'privacy-hidden' ? (
          <View style={styles.mediaPlaceholder}>
            <LockIcon size={26} color={mentaColors.text.secondary} />
          </View>
        ) : availability === 'unavailable' ? (
          <View style={styles.mediaPlaceholder}>
            <AlertCircleIcon size={26} color={mentaColors.warning} />
          </View>
        ) : item.mediaType === 'video' && !previewUrl ? (
          <ProofVideoThumbnail
            item={item}
            localise={localise}
            onStateChange={onMediaLoadStateChange}
          />
        ) : previewUrl ? (
          <SignedImage
            alt={mediaAccessibilityLabel(item, localise)}
            contentFit="cover"
            onLoadStateChange={onMediaLoadStateChange}
            recyclingKey={item.id}
            showSkeleton
            style={StyleSheet.absoluteFill}
            uri={previewUrl}
            variant="thumb"
          />
        ) : (
          <View style={styles.mediaPlaceholder}>
            <ImageIcon size={26} color={mentaColors.text.secondary} />
          </View>
        )}

        {item.mediaType === 'video' ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.playButton}
          >
            <PlayIcon size={20} color={mentaColors.text.primary} />
          </View>
        ) : null}

        <LinearGradient
          colors={['rgba(8, 9, 9, 0)', 'rgba(8, 9, 9, 0.88)']}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
          start={{ x: 0.5, y: 0 }}
          style={styles.copyGradient}
        >
          <View style={styles.tileCopy}>
            <Text numberOfLines={1} style={styles.contributorName}>
              {item.contributorName}
            </Text>
            <Text numberOfLines={1} style={styles.submittedLabel}>
              {[item.submittedLabel, stateLabel].filter(Boolean).join(' · ')}
            </Text>
          </View>
          {item.durationLabel ? (
            <Text style={styles.duration}>{item.durationLabel}</Text>
          ) : item.state === 'approved' ? (
            <CheckIcon size={16} color={mentaColors.success} />
          ) : null}
        </LinearGradient>

        {overflowCount > 0 ? (
          <View
            accessibilityLabel={
              overflowCount === 1
                ? localise('todayProof.source.accountability.more_proof', {
                    count: overflowCount,
                  })
                : localise('todayProof.source.accountability.more_proofs', {
                    count: overflowCount,
                  })
            }
            style={styles.overflowScrim}
          >
            <Text style={styles.overflowText}>+{overflowCount}</Text>
          </View>
        ) : null}
      </Pressable>

      {showReaction ? (
        <Pressable
          accessibilityLabel={reactionLabel}
          accessibilityRole={onToggleEncouragement ? 'button' : 'text'}
          disabled={!onToggleEncouragement}
          hitSlop={4}
          onPress={() => onToggleEncouragement?.(!item.encouragedByCurrentUser)}
          style={({ pressed }) => [
            styles.reaction,
            item.encouragedByCurrentUser ? styles.reactionSelected : null,
            pressed ? styles.reactionPressed : null,
          ]}
          testID={`${testID}-encourage`}
        >
          <HeartIcon
            color={
              item.encouragedByCurrentUser
                ? mentaColors.action
                : mentaColors.text.primary
            }
            fill={item.encouragedByCurrentUser ? mentaColors.action : 'none'}
            size={17}
          />
          {item.reactionCount ? (
            <Text style={styles.reactionCount}>{item.reactionCount}</Text>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
};

const LoadingMosaic = ({
  topHeight,
  bottomHeight,
  accessibilityLabel,
  testID,
}: {
  topHeight: number;
  bottomHeight: number;
  accessibilityLabel: string;
  testID: string;
}) => (
  <View
    accessible
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="progressbar"
    style={styles.mosaic}
    testID={testID}
  >
    <View style={[styles.topRow, { height: topHeight }]}>
      <SkeletonLoader
        announce={false}
        borderRadius={mentaRadii.large}
        height={topHeight}
        style={styles.featuredTile}
      />
      <View style={styles.sideColumn}>
        <SkeletonLoader
          announce={false}
          borderRadius={mentaRadii.medium}
          height={(topHeight - MOSAIC_GAP) / 2}
        />
        <SkeletonLoader
          announce={false}
          borderRadius={mentaRadii.medium}
          height={(topHeight - MOSAIC_GAP) / 2}
        />
      </View>
    </View>
    <View style={[styles.bottomRow, { height: bottomHeight }]}>
      <SkeletonLoader
        announce={false}
        borderRadius={mentaRadii.medium}
        height={bottomHeight}
        style={styles.bottomTile}
      />
      <SkeletonLoader
        announce={false}
        borderRadius={mentaRadii.medium}
        height={bottomHeight}
        style={styles.bottomTile}
      />
    </View>
  </View>
);

const EmptyMosaic = ({
  copy,
  onAddProof,
  testID,
}: {
  copy: ProofConnectionMosaicCopy;
  onAddProof?: () => void;
  testID: string;
}) => (
  <View style={styles.emptyState} testID={testID}>
    <View accessibilityElementsHidden style={styles.emptyContactSheet}>
      <View style={styles.emptyRow}>
        <View style={styles.emptyTile} />
        <View style={styles.emptyTile} />
      </View>
      <View style={styles.emptyRow}>
        <View style={styles.emptyTile} />
        <View style={[styles.emptyTile, styles.emptyAddTile]}>
          <PlusIcon size={25} color={mentaColors.canvas} />
        </View>
      </View>
    </View>
    <Text accessibilityRole="header" style={styles.emptyTitle}>
      {copy.emptyTitle}
    </Text>
    {onAddProof ? (
      <Pressable
        accessibilityLabel={copy.addProof}
        accessibilityRole="button"
        onPress={onAddProof}
        style={({ pressed }) => [
          styles.emptyAction,
          pressed ? styles.primaryPressed : null,
        ]}
        testID={`${testID}-add`}
      >
        <CameraIcon size={19} color={mentaColors.canvas} />
        <Text style={styles.emptyActionText}>{copy.addProof}</Text>
      </Pressable>
    ) : null}
  </View>
);

/**
 * A compact, promise-scoped media wall for proof that people have chosen to
 * share with one another. The owner supplies already-authorised items and owns
 * full-screen viewing, video playback, reactions, navigation, and mutations.
 */
export const ProofConnectionMosaic = ({
  items,
  onOpenProof,
  onAddProof,
  onViewAll,
  onRetry,
  onToggleEncouragement,
  onMediaLoadStateChange,
  loading = false,
  errorMessage = null,
  visibilityLabel,
  title,
  copy: copyOverrides,
  previewLimit = DEFAULT_PREVIEW_LIMIT,
  contentWidth,
  showHeader = true,
  style,
  testID = 'proof-connection-mosaic',
}: ProofConnectionMosaicProps) => {
  const { t } = useTranslation();
  const windowLayout = useWindowDimensions();
  const copy = useMemo(
    () => ({ ...getDefaultProofConnectionMosaicCopy(t), ...copyOverrides }),
    [copyOverrides, t]
  );
  const resolvedContentWidth =
    contentWidth ??
    Math.min(
      mentaLayout.taskLane,
      windowLayout.width - mentaLayout.screenInset * 2
    );
  const geometry = resolveMosaicGeometry(resolvedContentWidth);
  const effectivePreviewLimit = Math.min(
    DEFAULT_PREVIEW_LIMIT,
    Math.max(1, previewLimit)
  );
  const visibleItems = items.slice(0, effectivePreviewLimit);
  const overflowCount = Math.max(0, items.length - visibleItems.length);
  const featuredItem = visibleItems[0];
  const sideItems = visibleItems.slice(1, 3);
  const bottomItems = visibleItems.slice(3, 5);
  const sectionTitle = title?.trim() || copy.title;
  const itemCountLabel =
    items.length === 1
      ? t('todayProof.source.accountability.proof_count_one', {
          count: items.length,
        })
      : t('todayProof.source.accountability.proof_count_many', {
          count: items.length,
        });
  const supportingLabel = [itemCountLabel, visibilityLabel?.trim()]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.container, style]} testID={testID}>
      {showHeader ? (
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={styles.title}>
              {sectionTitle}
            </Text>
            <Text numberOfLines={2} style={styles.supportingLabel}>
              {supportingLabel}
            </Text>
          </View>
          {onAddProof ? (
            <Pressable
              accessibilityLabel={copy.addProof}
              accessibilityRole="button"
              onPress={onAddProof}
              style={({ pressed }) => [
                styles.addButton,
                pressed ? styles.primaryPressed : null,
              ]}
              testID={`${testID}-add`}
            >
              <PlusIcon size={21} color={mentaColors.canvas} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {errorMessage ? (
        <View
          accessibilityRole="alert"
          style={styles.inlineError}
          testID={`${testID}-error`}
        >
          <AlertCircleIcon size={20} color={mentaColors.warning} />
          <Text numberOfLines={2} style={styles.inlineErrorText}>
            {errorMessage.trim() || copy.refreshFailed}
          </Text>
          {onRetry ? (
            <Pressable
              accessibilityLabel={copy.retry}
              accessibilityRole="button"
              onPress={onRetry}
              style={({ pressed }) => [
                styles.retryButton,
                pressed ? styles.pressed : null,
              ]}
              testID={`${testID}-retry`}
            >
              <Text style={styles.retryText}>{copy.retry}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {loading && items.length === 0 ? (
        <LoadingMosaic
          accessibilityLabel={copy.loading}
          bottomHeight={geometry.bottomHeight}
          testID={`${testID}-loading`}
          topHeight={geometry.topHeight}
        />
      ) : !featuredItem ? (
        <EmptyMosaic
          copy={copy}
          onAddProof={onAddProof}
          testID={`${testID}-empty`}
        />
      ) : (
        <View style={styles.mosaic} testID={`${testID}-loaded`}>
          <View
            style={[styles.topRow, { height: geometry.topHeight }]}
            testID={`${testID}-top-row`}
          >
            <MosaicTile
              item={featuredItem}
              localise={t}
              onOpen={() => onOpenProof(featuredItem, 0)}
              onToggleEncouragement={
                onToggleEncouragement
                  ? encouraged =>
                      onToggleEncouragement(featuredItem, encouraged)
                  : undefined
              }
              onMediaLoadStateChange={
                onMediaLoadStateChange
                  ? state => onMediaLoadStateChange(featuredItem, state)
                  : undefined
              }
              style={sideItems.length ? styles.featuredTile : styles.onlyTile}
              testID={`${testID}-item-${featuredItem.id}`}
            />
            {sideItems.length ? (
              <View style={styles.sideColumn}>
                {sideItems.map((item, sideIndex) => {
                  const itemIndex = sideIndex + 1;
                  return (
                    <MosaicTile
                      item={item}
                      key={item.id}
                      localise={t}
                      onOpen={() => onOpenProof(item, itemIndex)}
                      onToggleEncouragement={
                        onToggleEncouragement
                          ? encouraged =>
                              onToggleEncouragement(item, encouraged)
                          : undefined
                      }
                      onMediaLoadStateChange={
                        onMediaLoadStateChange
                          ? state => onMediaLoadStateChange(item, state)
                          : undefined
                      }
                      style={styles.sideTile}
                      testID={`${testID}-item-${item.id}`}
                    />
                  );
                })}
              </View>
            ) : null}
          </View>

          {bottomItems.length ? (
            <View
              style={[styles.bottomRow, { height: geometry.bottomHeight }]}
              testID={`${testID}-bottom-row`}
            >
              {bottomItems.map((item, bottomIndex) => {
                const itemIndex = bottomIndex + 3;
                const isLastVisible = itemIndex === visibleItems.length - 1;
                const opensFullGallery =
                  isLastVisible && overflowCount > 0 && Boolean(onViewAll);
                return (
                  <MosaicTile
                    item={item}
                    key={item.id}
                    localise={t}
                    onOpen={() => {
                      if (opensFullGallery) {
                        onViewAll?.();
                        return;
                      }
                      onOpenProof(item, itemIndex);
                    }}
                    onToggleEncouragement={
                      onToggleEncouragement
                        ? encouraged => onToggleEncouragement(item, encouraged)
                        : undefined
                    }
                    onMediaLoadStateChange={
                      onMediaLoadStateChange
                        ? state => onMediaLoadStateChange(item, state)
                        : undefined
                    }
                    overflowCount={isLastVisible ? overflowCount : 0}
                    openAccessibilityLabel={
                      opensFullGallery
                        ? overflowCount === 1
                          ? t(
                              'todayProof.source.accountability.open_one_more_proof',
                              { count: overflowCount }
                            )
                          : t(
                              'todayProof.source.accountability.open_more_proofs',
                              { count: overflowCount }
                            )
                        : undefined
                    }
                    style={styles.bottomTile}
                    testID={`${testID}-item-${item.id}`}
                  />
                );
              })}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: mentaSpacing[4],
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[4],
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  supportingLabel: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  addButton: {
    width: mentaLayout.primaryControlHeight,
    height: mentaLayout.primaryControlHeight,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.round,
    backgroundColor: mentaColors.action,
  },
  primaryPressed: {
    backgroundColor: mentaColors.actionPressed,
    transform: [{ scale: 0.98 }],
  },
  inlineError: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.warning,
    paddingVertical: mentaSpacing[1],
  },
  inlineErrorText: {
    ...mentaTypography.caption,
    flex: 1,
    color: mentaColors.text.secondary,
  },
  retryButton: {
    minWidth: 76,
    minHeight: mentaLayout.minimumTouchTarget,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.small,
  },
  retryText: {
    ...mentaTypography.captionMedium,
    color: mentaColors.action,
  },
  mosaic: {
    width: '100%',
    gap: MOSAIC_GAP,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    gap: MOSAIC_GAP,
  },
  sideColumn: {
    height: '100%',
    flex: 1,
    gap: MOSAIC_GAP,
  },
  bottomRow: {
    width: '100%',
    flexDirection: 'row',
    gap: MOSAIC_GAP,
  },
  tile: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    backgroundColor: mentaColors.surface,
  },
  featuredTile: {
    height: '100%',
    flex: 1.9,
  },
  onlyTile: {
    width: '100%',
    height: '100%',
  },
  sideTile: {
    width: '100%',
    flex: 1,
    borderRadius: mentaRadii.medium,
  },
  bottomTile: {
    height: '100%',
    flex: 1,
    borderRadius: mentaRadii.medium,
  },
  openProofTarget: {
    flex: 1,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.78,
  },
  mediaPlaceholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mentaColors.raised,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.round,
    backgroundColor: 'rgba(8, 9, 9, 0.72)',
    transform: [
      { translateX: -mentaLayout.minimumTouchTarget / 2 },
      { translateY: -mentaLayout.minimumTouchTarget / 2 },
    ],
  },
  copyGradient: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: mentaSpacing[2],
    padding: mentaSpacing[3],
    paddingRight: 58,
  },
  tileCopy: {
    flex: 1,
    minWidth: 0,
  },
  contributorName: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
  },
  submittedLabel: {
    ...mentaTypography.micro,
    color: mentaColors.text.primary,
  },
  duration: {
    ...mentaTypography.micro,
    color: mentaColors.text.primary,
  },
  reaction: {
    position: 'absolute',
    right: mentaSpacing[2],
    bottom: mentaSpacing[2],
    zIndex: 2,
    minWidth: mentaLayout.minimumTouchTarget,
    minHeight: mentaLayout.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mentaSpacing[1],
    borderRadius: mentaRadii.round,
    backgroundColor: 'rgba(8, 9, 9, 0.74)',
    paddingHorizontal: mentaSpacing[2],
  },
  reactionSelected: {
    backgroundColor: 'rgba(8, 9, 9, 0.86)',
  },
  reactionPressed: {
    transform: [{ scale: 0.96 }],
  },
  reactionCount: {
    ...mentaTypography.micro,
    color: mentaColors.text.primary,
  },
  overflowScrim: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 9, 9, 0.62)',
  },
  overflowText: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  emptyState: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: mentaSpacing[4],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    backgroundColor: mentaColors.surface,
    padding: mentaSpacing[6],
  },
  emptyContactSheet: {
    width: 184,
    height: 144,
    gap: MOSAIC_GAP,
  },
  emptyRow: {
    flex: 1,
    flexDirection: 'row',
    gap: MOSAIC_GAP,
  },
  emptyTile: {
    flex: 1,
    borderRadius: mentaRadii.small,
    backgroundColor: mentaColors.raised,
  },
  emptyAddTile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mentaColors.action,
  },
  emptyTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
    textAlign: 'center',
  },
  emptyAction: {
    minWidth: 180,
    height: mentaLayout.primaryControlHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: mentaSpacing[2],
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.action,
    paddingHorizontal: mentaSpacing[4],
  },
  emptyActionText: {
    ...mentaTypography.control,
    color: mentaColors.canvas,
  },
});
