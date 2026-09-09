import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import {
  ProofVideoPlayer,
  trackProofVideoPlayback,
} from '@/components/proof/proof-video-player';
import { resolveProofVideoUri } from '@/lib/services/proof-media-viewer';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { ImageIcon } from '@/components/ui/icons';
import { useTheme } from '@/constants/ThemeContext';
import {
  ImageService,
  extractTrustedSupabaseStorageObject,
  type StorageBucket,
} from '@/lib/image-service';
import { STORAGE_BUCKETS } from '@/lib/supabase';
import { useTranslation } from '@/lib/localization';

export type ReviewEvidenceAvailability =
  | 'loading'
  | 'available'
  | 'unavailable';

const resolveBucket = (name: string): StorageBucket => {
  const entry = (
    Object.entries(STORAGE_BUCKETS) as [StorageBucket, string][]
  ).find(([, bucketName]) => bucketName === name);
  return entry?.[0] ?? 'CHALLENGE_VERIFICATIONS';
};

const resolveEvidenceUrl = async (uri: string): Promise<string> => {
  if (!uri.includes('://')) {
    return ImageService.getSignedUrl('CHALLENGE_VERIFICATIONS', uri, {
      width: 1200,
      resize: 'contain',
      quality: 85,
    });
  }

  const expectedBucket = STORAGE_BUCKETS.CHALLENGE_VERIFICATIONS;
  const parsed = extractTrustedSupabaseStorageObject(uri, expectedBucket);
  if (!parsed) throw new Error('Untrusted proof media URL');
  return ImageService.getSignedUrl(
    resolveBucket(parsed.bucket),
    parsed.objectKey,
    { width: 1200, resize: 'contain', quality: 85 }
  );
};

const ResolvedReviewEvidenceVideo = ({
  uri,
  onAvailable,
  onUnavailable,
  style,
}: {
  uri: string;
  onAvailable: () => void;
  onUnavailable: () => void;
  style: StyleProp<ViewStyle>;
}) => {
  return (
    <ProofVideoPlayer
      uri={uri}
      surface="review"
      onAvailable={onAvailable}
      onUnavailable={onUnavailable}
      style={style}
    />
  );
};

export const EvidenceUnavailablePanel = ({
  onRetry,
  onBack,
  retrying = false,
  description,
}: {
  onRetry: () => void;
  onBack: () => void;
  retrying?: boolean;
  description?: string;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const resolvedDescription = description ?? t('todayProof.review.open_again');

  return (
    <View
      accessibilityRole="alert"
      style={styles.unavailable}
      testID="review-evidence-unavailable"
    >
      <ImageIcon size={28} color={theme.colors.status.warning} />
      <Text style={styles.unavailableTitle}>
        {t('todayProof.review.could_not_open')}
      </Text>
      <Text style={styles.unavailableCopy}>{resolvedDescription}</Text>
      <AppButton
        title={t('todayProof.promise.try_again')}
        onPress={onRetry}
        loading={retrying}
        disabled={retrying}
        fullWidth
      />
      <AppButton
        title={t('todayProof.review.back_reviews')}
        onPress={onBack}
        variant="outline"
        fullWidth
      />
    </View>
  );
};

export const ReviewEvidenceImage = ({
  submissionId,
  uri,
  onAvailabilityChange,
  onBack,
}: {
  submissionId: string;
  uri: string;
  onAvailabilityChange: (
    submissionId: string,
    status: ReviewEvidenceAvailability
  ) => void;
  onBack: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [status, setStatus] = useState<ReviewEvidenceAvailability>('loading');
  const [retryKey, setRetryKey] = useState(0);

  const updateStatus = useCallback(
    (next: ReviewEvidenceAvailability) => {
      setStatus(next);
      onAvailabilityChange(submissionId, next);
    },
    [onAvailabilityChange, submissionId]
  );

  useEffect(() => {
    let cancelled = false;
    setResolvedUri(null);
    updateStatus('loading');

    if (!uri.trim()) {
      updateStatus('unavailable');
      return () => {
        cancelled = true;
      };
    }

    void resolveEvidenceUrl(uri)
      .then(nextUri => {
        if (!cancelled) setResolvedUri(nextUri);
      })
      .catch(() => {
        if (!cancelled) updateStatus('unavailable');
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey, updateStatus, uri]);

  if (status === 'unavailable') {
    return (
      <EvidenceUnavailablePanel
        onRetry={() => setRetryKey(value => value + 1)}
        onBack={onBack}
      />
    );
  }

  return (
    <View style={styles.media}>
      {resolvedUri ? (
        <ExpoImage
          alt="Proof submitted for review"
          cachePolicy="memory-disk"
          contentFit="cover"
          onDisplay={() => updateStatus('available')}
          onError={() => updateStatus('unavailable')}
          source={{ uri: resolvedUri }}
          style={styles.image}
        />
      ) : null}
      {status === 'loading' ? (
        <ImagePlaceholder label={t('todayProof.review.opening_proof')} />
      ) : null}
    </View>
  );
};

export const ReviewEvidenceVideo = ({
  submissionId,
  uri,
  onAvailabilityChange,
  onBack,
}: {
  submissionId: string;
  uri: string;
  onAvailabilityChange: (
    submissionId: string,
    status: ReviewEvidenceAvailability
  ) => void;
  onBack: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [status, setStatus] = useState<ReviewEvidenceAvailability>('loading');
  const [retryKey, setRetryKey] = useState(0);

  const updateStatus = useCallback(
    (next: ReviewEvidenceAvailability) => {
      setStatus(next);
      onAvailabilityChange(submissionId, next);
    },
    [onAvailabilityChange, submissionId]
  );

  useEffect(() => {
    let cancelled = false;
    setResolvedUri(null);
    updateStatus('loading');

    if (!uri.trim()) {
      updateStatus('unavailable');
      return () => {
        cancelled = true;
      };
    }

    void resolveProofVideoUri(uri)
      .then(nextUri => {
        if (!cancelled) setResolvedUri(nextUri);
      })
      .catch(() => {
        if (!cancelled) {
          updateStatus('unavailable');
          trackProofVideoPlayback({
            surface: 'review',
            stage: 'error',
            reason: 'signing',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey, updateStatus, uri]);

  if (status === 'unavailable') {
    return (
      <EvidenceUnavailablePanel
        onRetry={() => {
          trackProofVideoPlayback({
            surface: 'review',
            stage: 'retry',
            reason: resolvedUri ? 'playback' : 'signing',
          });
          setRetryKey(value => value + 1);
        }}
        onBack={onBack}
      />
    );
  }

  return (
    <View style={styles.videoContainer}>
      {resolvedUri ? (
        <ResolvedReviewEvidenceVideo
          key={`${submissionId}:${retryKey}`}
          uri={resolvedUri}
          onAvailable={() => updateStatus('available')}
          onUnavailable={() => updateStatus('unavailable')}
          style={styles.video}
        />
      ) : null}
      {!resolvedUri && status === 'loading' ? (
        <View style={styles.video}>
          <ImagePlaceholder
            label={t('todayProof.review.opening_video_proof')}
          />
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    videoContainer: {
      width: '100%',
    },
    media: {
      backgroundColor: theme.colors.background.secondary,
      height: 248,
      width: '100%',
    },
    image: {
      height: 248,
      width: '100%',
    },
    video: {
      backgroundColor: '#000000',
      height: 248,
      width: '100%',
    },
    unavailable: {
      alignItems: 'center',
      gap: theme.spacing.md,
      justifyContent: 'center',
      minHeight: 248,
      padding: theme.spacing.lg,
    },
    unavailableTitle: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      textAlign: 'center',
    },
    unavailableCopy: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 20,
      textAlign: 'center',
    },
  });
