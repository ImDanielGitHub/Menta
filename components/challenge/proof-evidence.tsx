import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ProofVideoPlayer,
  trackProofVideoPlayback,
} from '@/components/proof/proof-video-player';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';

import { AppButton } from '@/components/ui/AppButton';
import { AppScreen } from '@/components/ui/AppShell';
import { SignedImage } from '@/components/ui/SignedImage';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  ChevronRightIcon,
  ImageIcon,
  TypeIcon,
  VideoIcon,
} from '@/components/ui/icons';
import ModalCard from '@/components/ui/modal/ModalCard';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import type { ProofMediaType } from '@/lib/proof-types';
import { resolveProofVideoUri } from '@/lib/services/proof-media-viewer';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization';

export type ProofEvidenceState = 'waiting' | 'approved' | 'needs-retry';

export type ProofEvidenceRecord = {
  id: string;
  mediaType?: ProofMediaType | null;
  mediaUrl?: string | null;
  submissionText?: string | null;
  state: ProofEvidenceState;
  submittedLabel: string;
  evidenceTitle?: string | null;
  contextLabel?: string | null;
  contributorName?: string | null;
  reviewerName?: string | null;
  reviewNotes?: string | null;
};

const stateLabel = (
  state: ProofEvidenceState,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  if (state === 'waiting') return t('todayProof.proof.state_waiting');
  if (state === 'approved') return t('todayProof.proof.state_approved');
  return t('todayProof.proof.state_retry');
};

const mediaLabel = (
  mediaType: ProofMediaType,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  if (mediaType === 'text') return t('todayProof.promise.text_proof');
  if (mediaType === 'video') return t('todayProof.promise.video_proof');
  return t('todayProof.promise.photo_proof');
};

const resolvedMediaType = (proof: ProofEvidenceRecord): ProofMediaType => {
  if (proof.mediaType === 'video' || proof.mediaType === 'text') {
    return proof.mediaType;
  }
  if (!proof.mediaUrl && proof.submissionText?.trim()) return 'text';
  return 'photo';
};

const evidenceTitle = (
  proof: ProofEvidenceRecord,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  const proofText = proof.submissionText?.trim();
  if (resolvedMediaType(proof) === 'text' && proofText) return proofText;
  return proof.evidenceTitle?.trim() || mediaLabel(resolvedMediaType(proof), t);
};

const evidenceStateDescription = (
  proof: ProofEvidenceRecord,
  t: ReturnType<typeof useTranslation>['t']
): string => {
  const reviewerName = proof.reviewerName?.trim();
  if (!reviewerName) return stateLabel(proof.state, t);
  if (proof.state === 'approved') {
    return t('todayProof.proof.approved_by', { name: reviewerName });
  }
  if (proof.state === 'waiting') {
    return t('todayProof.proof.waiting_for', { name: reviewerName });
  }
  return t('todayProof.proof.state_retry');
};

const useProofEvidenceStyles = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return { theme, styles };
};

type ProofEvidenceRowProps = {
  proof: ProofEvidenceRecord;
  onPress: () => void;
  variant?: 'default' | 'paper';
  testID?: string;
};

/**
 * A chronological proof lane whose first job is to expose the submitted
 * evidence. The whole lane is the target; state and reviewer facts remain
 * sentence case and never compete with the evidence as a badge.
 */
export function ProofEvidenceRow({
  proof,
  onPress,
  variant = 'default',
  testID,
}: ProofEvidenceRowProps) {
  const { theme, styles } = useProofEvidenceStyles();
  const { t } = useTranslation();
  const titleLines = useLargeTypeLineLimit(2);
  const metaLines = useLargeTypeLineLimit(1);
  const proofMediaType = resolvedMediaType(proof);
  const isPaper = variant === 'paper';
  const titleColor = isPaper
    ? mentaColors.text.onPaper
    : theme.colors.text.primary;
  const secondaryColor = isPaper
    ? mentaColors.text.mutedOnPaper
    : theme.colors.text.secondary;
  const iconColor = isPaper
    ? mentaColors.text.onPaper
    : theme.colors.text.primary;
  const stateColor =
    proof.state === 'approved'
      ? isPaper
        ? mentaColors.success
        : theme.colors.status.success
      : proof.state === 'needs-retry'
        ? isPaper
          ? mentaColors.danger
          : theme.colors.status.error
        : isPaper
          ? mentaColors.warning
          : theme.colors.status.warning;
  const contextLine = [proof.submittedLabel, proof.contextLabel?.trim()]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${evidenceTitle(proof, t)}. ${contextLine}. ${evidenceStateDescription(proof, t)}`}
      accessibilityHint={t('todayProof.proof.open_exact')}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        isPaper ? styles.paperRow : styles.defaultRow,
        pressed ? styles.pressed : null,
      ]}
    >
      <View
        testID={testID ? `${testID}-thumbnail` : undefined}
        style={[styles.thumbnail, isPaper ? styles.paperThumbnail : null]}
      >
        {proofMediaType === 'photo' && proof.mediaUrl ? (
          <SignedImage
            uri={proof.mediaUrl}
            variant="thumb"
            alt={t('todayProof.proof.photo_preview')}
            style={styles.thumbnailImage}
          />
        ) : proofMediaType === 'video' ? (
          <VideoIcon size={21} color={iconColor} />
        ) : proofMediaType === 'text' ? (
          <TypeIcon size={21} color={iconColor} />
        ) : (
          <ImageIcon size={21} color={iconColor} />
        )}
      </View>

      <View style={styles.copy}>
        <Text
          style={[styles.title, { color: titleColor }]}
          numberOfLines={titleLines}
        >
          {evidenceTitle(proof, t)}
        </Text>
        <Text
          style={[styles.meta, { color: secondaryColor }]}
          numberOfLines={metaLines}
        >
          {contextLine}
        </Text>
        <Text
          style={[styles.state, { color: stateColor }]}
          numberOfLines={metaLines}
        >
          {evidenceStateDescription(proof, t)}
        </Text>
        {proof.reviewNotes?.trim() ? (
          <Text
            style={[styles.reviewNote, { color: secondaryColor }]}
            numberOfLines={titleLines}
          >
            {proof.reviewNotes.trim()}
          </Text>
        ) : null}
      </View>

      <View style={styles.disclosure}>
        <ChevronRightIcon size={18} color={secondaryColor} />
      </View>
    </Pressable>
  );
}

export function ProofEvidenceRowSkeleton({
  index = 0,
  testID,
}: {
  index?: number;
  testID?: string;
}) {
  const { styles } = useProofEvidenceStyles();

  return (
    <View
      accessible={false}
      testID={testID}
      style={[styles.row, styles.defaultRow]}
    >
      <SkeletonLoader
        announce={false}
        width={66}
        height={66}
        borderRadius={mentaRadii.small}
      />
      <View style={styles.skeletonCopy}>
        <SkeletonLoader
          announce={false}
          width={index === 1 ? '64%' : '72%'}
          height={16}
          borderRadius={mentaRadii.round}
        />
        <SkeletonLoader
          announce={false}
          width={index === 2 ? '52%' : '58%'}
          height={13}
          borderRadius={mentaRadii.round}
        />
        <SkeletonLoader
          announce={false}
          width={index === 0 ? '44%' : '48%'}
          height={13}
          borderRadius={mentaRadii.round}
        />
      </View>
    </View>
  );
}

function SignedProofVideo({ mediaUrl }: { mediaUrl: string }) {
  const { theme, styles } = useProofEvidenceStyles();
  const { t } = useTranslation();
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setResolvedUri(null);
    setFailed(false);

    void resolveProofVideoUri(mediaUrl)
      .then(uri => {
        if (!cancelled) setResolvedUri(uri);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          trackProofVideoPlayback({
            surface: 'proof_history',
            stage: 'error',
            reason: 'signing',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mediaUrl, retryKey]);

  if (failed) {
    return (
      <View style={styles.viewerPlaceholder}>
        <VideoIcon size={28} color={theme.colors.text.secondary} />
        <Text style={styles.viewerPlaceholderText}>
          {t('todayProof.proof.video_unavailable_short')}
        </Text>
        <AppButton
          title={t('todayProof.promise.try_again')}
          onPress={() => {
            trackProofVideoPlayback({
              surface: 'proof_history',
              stage: 'retry',
              reason: 'signing',
            });
            setRetryKey(value => value + 1);
          }}
          variant="secondary"
        />
      </View>
    );
  }

  if (!resolvedUri) {
    return (
      <View style={styles.viewerMedia}>
        <ImagePlaceholder label={t('todayProof.proof.loading_video')} />
      </View>
    );
  }

  return (
    <ProofVideoPlayer
      key={`${mediaUrl}:${retryKey}`}
      uri={resolvedUri}
      surface="proof_history"
      style={styles.viewerMedia}
      onRetry={() => setRetryKey(value => value + 1)}
    />
  );
}

type ProofEvidenceViewerProps = {
  proof: ProofEvidenceRecord | null;
  visible: boolean;
  onClose: () => void;
};

/** Opens the selected record itself, rather than routing to a generic list. */
export function ProofEvidenceViewer({
  proof,
  visible,
  onClose,
}: ProofEvidenceViewerProps) {
  const { theme, styles } = useProofEvidenceStyles();
  const { t } = useTranslation();
  if (!proof || !visible) return null;

  const proofMediaType = resolvedMediaType(proof);
  const exactText = proof.submissionText?.trim();
  const viewerTitle =
    proof.evidenceTitle?.trim() || mediaLabel(proofMediaType, t);

  return (
    <ModalCard
      visible={visible}
      onClose={onClose}
      surface="full_screen"
      accessibilityLabel={t('todayProof.proof.close_exact')}
      testID="proof-evidence-viewer"
      cardStyle={styles.viewer}
    >
      <AppScreen safeArea hasTabBar={false} lane="immersive">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.viewerContent}
        >
          <View style={styles.viewerHeader}>
            <View style={styles.viewerHeaderCopy}>
              <Text style={styles.viewerTitle}>{viewerTitle}</Text>
              <Text style={styles.viewerMeta}>{proof.submittedLabel}</Text>
              {proof.contextLabel?.trim() ? (
                <Text style={styles.viewerMeta}>
                  {proof.contextLabel.trim()}
                </Text>
              ) : null}
              {proof.contributorName?.trim() ? (
                <Text style={styles.viewerMeta}>
                  {proof.contributorName.trim()}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.viewerState,
                  proof.state === 'approved'
                    ? styles.viewerApproved
                    : proof.state === 'needs-retry'
                      ? styles.viewerRetry
                      : styles.viewerWaiting,
                ]}
              >
                {evidenceStateDescription(proof, t)}
              </Text>
            </View>
          </View>

          <View style={styles.viewerEvidence}>
            {proofMediaType === 'photo' && proof.mediaUrl ? (
              <SignedImage
                uri={proof.mediaUrl}
                variant="full"
                alt={t('todayProof.proof.exact_photo')}
                contentFit="contain"
                style={styles.viewerMedia}
              />
            ) : proofMediaType === 'video' && proof.mediaUrl ? (
              <SignedProofVideo mediaUrl={proof.mediaUrl} />
            ) : proofMediaType === 'text' ? (
              <View style={styles.viewerTextEvidence}>
                <Text style={styles.viewerText}>
                  {exactText || t('todayProof.proof.written_unavailable')}
                </Text>
              </View>
            ) : (
              <View style={styles.viewerPlaceholder}>
                <ImageIcon size={28} color={theme.colors.text.secondary} />
                <Text style={styles.viewerPlaceholderText}>
                  {t('todayProof.proof.preview_unavailable_detail')}
                </Text>
              </View>
            )}
          </View>

          {proof.reviewNotes?.trim() ? (
            <View style={styles.viewerReviewNote}>
              <Text style={styles.viewerReviewNoteTitle}>
                {t('todayProof.proof.review_note')}
              </Text>
              <Text style={styles.viewerReviewNoteText}>
                {proof.reviewNotes.trim()}
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.viewerFooter}>
          <AppButton
            title={t('todayProof.proof.done')}
            onPress={onClose}
            fullWidth
            size="large"
          />
        </View>
      </AppScreen>
    </ModalCard>
  );
}

const createStyles = (theme: ThemeContextType) =>
  StyleSheet.create({
    row: {
      width: '100%',
      minHeight: 92,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: mentaSpacing[3],
    },
    defaultRow: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.primary,
      backgroundColor: theme.colors.surface.primary,
    },
    paperRow: {
      borderRadius: mentaRadii.medium,
      backgroundColor: mentaColors.paper,
      paddingLeft: mentaSpacing[3],
    },
    pressed: {
      opacity: 0.76,
    },
    thumbnail: {
      width: 66,
      height: 66,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: mentaRadii.small,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      backgroundColor: theme.colors.background.secondary,
    },
    paperThumbnail: {
      borderColor: mentaColors.borderPaper,
      backgroundColor: mentaColors.raised,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
      marginLeft: mentaSpacing[3],
    },
    title: {
      ...mentaTypography.bodySemibold,
    },
    meta: {
      ...mentaTypography.caption,
    },
    state: {
      ...mentaTypography.bodySmallMedium,
    },
    reviewNote: {
      ...mentaTypography.caption,
    },
    disclosure: {
      width: mentaLayout.minimumTouchTarget,
      height: mentaLayout.minimumTouchTarget,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skeletonCopy: {
      flex: 1,
      minWidth: 0,
      gap: mentaSpacing[2],
      marginLeft: mentaSpacing[3],
    },
    viewer: {
      backgroundColor: theme.colors.surface.primary,
    },
    viewerContent: {
      gap: mentaSpacing[5],
      paddingTop: mentaSpacing[4],
      paddingBottom: mentaSpacing[6],
    },
    viewerFooter: { paddingVertical: mentaSpacing[3] },
    viewerHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: mentaSpacing[4],
    },
    viewerHeaderCopy: {
      flex: 1,
      minWidth: 0,
      gap: mentaSpacing[1],
    },
    viewerTitle: {
      ...mentaTypography.title,
      color: theme.colors.text.primary,
    },
    viewerMeta: {
      ...mentaTypography.caption,
      color: theme.colors.text.secondary,
    },
    viewerState: {
      ...mentaTypography.bodySmallMedium,
      marginTop: mentaSpacing[1],
    },
    viewerApproved: {
      color: theme.colors.status.success,
    },
    viewerRetry: {
      color: theme.colors.status.error,
    },
    viewerWaiting: {
      color: theme.colors.status.warning,
    },
    viewerEvidence: {
      width: '100%',
    },
    viewerMedia: {
      width: '100%',
      height: 360,
      borderRadius: mentaRadii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      overflow: 'hidden',
      backgroundColor: theme.colors.background.secondary,
    },
    viewerTextEvidence: {
      minHeight: 220,
      justifyContent: 'center',
      borderRadius: mentaRadii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      backgroundColor: theme.colors.background.secondary,
      padding: mentaSpacing[5],
    },
    viewerText: {
      ...mentaTypography.lead,
      color: theme.colors.text.primary,
    },
    viewerPlaceholder: {
      minHeight: 220,
      alignItems: 'center',
      justifyContent: 'center',
      gap: mentaSpacing[3],
      borderRadius: mentaRadii.medium,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      backgroundColor: theme.colors.background.secondary,
      padding: mentaSpacing[5],
    },
    viewerPlaceholderText: {
      ...mentaTypography.body,
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    viewerReviewNote: {
      gap: mentaSpacing[2],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.primary,
      paddingTop: mentaSpacing[4],
    },
    viewerReviewNoteTitle: {
      ...mentaTypography.bodySemibold,
      color: theme.colors.text.primary,
    },
    viewerReviewNoteText: {
      ...mentaTypography.body,
      color: theme.colors.text.secondary,
    },
  });
