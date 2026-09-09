import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ImageIcon, Share2Icon, VideoIcon } from '@/components/ui/icons';
import { AppButton } from '@/components/ui/AppButton';
import { AppScreen } from '@/components/ui/AppShell';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import { SignedImage } from '@/components/ui/SignedImage';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { withReadableLeading } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import {
  getProofReceiptCopy,
  type ProofReceiptStatus,
} from '@/lib/proof-drafts';
import type { ProofMediaType } from '@/lib/proof-types';
import { useTranslation } from '@/lib/localization';

type ProofReceiptPreview = {
  proofType: ProofMediaType;
  localMediaUri?: string | null;
  remoteMediaUri?: string | null;
  text?: string | null;
  updatedAt?: string | null;
};

type ProofReceiptPanelProps = {
  status: ProofReceiptStatus;
  detailOverride?: string | null;
  preview?: ProofReceiptPreview | null;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionDisabled?: boolean;
  shareActionLabel?: string;
  onShareAction?: () => void;
  shareActionDisabled?: boolean;
  showSpinner?: boolean;
  onReportIssue?: () => void;
};

const formatReceiptTime = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-NZ', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

function ProofPreview({
  preview,
  onReportIssue,
}: {
  preview: ProofReceiptPreview;
  onReportIssue?: () => void;
}) {
  const { t } = useTranslation();
  const [showFullView, setShowFullView] = useState(false);
  const submittedAt = formatReceiptTime(preview.updatedAt);
  const isPhoto = preview.proofType === 'photo';
  const photoUri = preview.localMediaUri ?? preview.remoteMediaUri ?? null;
  const hasPhoto = isPhoto && Boolean(photoUri);
  const isVideo = preview.proofType === 'video';
  const proofLabel =
    preview.proofType === 'text'
      ? t('todayProof.promise.text_proof')
      : preview.proofType === 'photo'
        ? t('todayProof.promise.photo_proof')
        : t('todayProof.promise.video_proof');

  return (
    <View style={styles.preview}>
      {hasPhoto ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('todayProof.proof.open_full')}
          onPress={() => setShowFullView(true)}
        >
          <SignedImage
            uri={photoUri ?? undefined}
            style={styles.previewImage}
            alt={t('todayProof.proof.photo_preview')}
            variant="preview"
          />
        </Pressable>
      ) : isPhoto ? (
        <View
          style={styles.videoPreview}
          accessibilityLabel={t('todayProof.proof.photo_preview')}
        >
          <ImageIcon size={22} color={mentaColors.text.primary} />
          <Text style={styles.videoPreviewText}>
            {t('todayProof.promise.photo_proof')}
          </Text>
        </View>
      ) : isVideo ? (
        <View
          style={styles.videoPreview}
          accessibilityLabel={t('todayProof.proof.video_preview')}
        >
          <VideoIcon size={22} color={mentaColors.text.primary} />
          <Text style={styles.videoPreviewText}>
            {t('todayProof.promise.video_proof')}
          </Text>
        </View>
      ) : (
        <Text style={styles.textPreview} numberOfLines={4}>
          {preview.text?.trim() || t('todayProof.proof.text_preview')}
        </Text>
      )}
      <Text style={styles.previewMeta}>
        {submittedAt
          ? t('todayProof.proof.meta', {
              type: proofLabel,
              time: submittedAt,
            })
          : proofLabel}
      </Text>
      {hasPhoto ? (
        <View style={styles.previewActions}>
          <AppButton
            title={t('todayProof.proof.open_full_view')}
            onPress={() => setShowFullView(true)}
            variant="ghost"
            size="small"
          />
          {onReportIssue ? (
            <AppButton
              title={t('todayProof.proof.report_issue')}
              onPress={onReportIssue}
              variant="ghost"
              size="small"
            />
          ) : null}
        </View>
      ) : null}
      <ModalCard
        visible={showFullView}
        onClose={() => setShowFullView(false)}
        surface="full_screen"
        accessibilityLabel={t('todayProof.proof.private_full')}
        testID="proof-full-view"
      >
        <AppScreen
          safeArea
          scrollable
          hasTabBar={false}
          lane="immersive"
          contentContainerStyle={styles.fullView}
        >
          <Text style={styles.fullViewTitle}>
            {t('todayProof.proof.private')}
          </Text>
          <View style={styles.fullViewMedia}>
            <SignedImage
              uri={photoUri ?? undefined}
              style={styles.fullViewImage}
              alt={t('todayProof.proof.private_full_detail')}
              variant="full"
              contentFit="contain"
            />
          </View>
          <AppButton
            title={t('todayProof.proof.close')}
            onPress={() => setShowFullView(false)}
            fullWidth
            size="large"
          />
        </AppScreen>
      </ModalCard>
    </View>
  );
}

/**
 * A durable, fact-first receipt surface. It deliberately shows the proof the
 * person sent when it is available and never turns a local save into a server
 * result through copy, colour, mascot, or animation.
 */
export function ProofReceiptPanel({
  status,
  detailOverride = null,
  preview = null,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled = false,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionDisabled = false,
  shareActionLabel,
  onShareAction,
  shareActionDisabled = false,
  showSpinner = false,
  onReportIssue,
}: ProofReceiptPanelProps) {
  const { t } = useTranslation();
  const copy = getProofReceiptCopy(status, {
    proofType: preview?.proofType,
  });
  const phoneLayout = usePhoneLayout();

  return (
    <View
      style={styles.root}
      accessibilityRole="summary"
      accessibilityLiveRegion="polite"
    >
      <Text
        style={[
          styles.title,
          withReadableLeading(mentaTypography.title, phoneLayout),
        ]}
      >
        {status === 'accepted'
          ? t('todayProof.promise.done_today')
          : copy.title}
      </Text>
      <Text
        style={[
          styles.detail,
          withReadableLeading(mentaTypography.body, phoneLayout),
        ]}
      >
        {detailOverride ?? copy.detail}
      </Text>

      {showSpinner ? (
        <View
          accessibilityLabel={t('todayProof.proof.sending')}
          accessibilityRole="progressbar"
          style={styles.progressRow}
        >
          <SkeletonLoader announce={false} height={8} borderRadius={4} />
        </View>
      ) : null}

      {preview ? (
        <ProofPreview preview={preview} onReportIssue={onReportIssue} />
      ) : null}

      {primaryActionLabel && onPrimaryAction ? (
        <AppButton
          title={primaryActionLabel}
          onPress={onPrimaryAction}
          disabled={primaryActionDisabled}
          size="large"
          fullWidth
        />
      ) : null}

      {secondaryActionLabel && onSecondaryAction ? (
        <AppButton
          title={secondaryActionLabel}
          onPress={onSecondaryAction}
          disabled={secondaryActionDisabled}
          variant="secondary"
          size="large"
          fullWidth
        />
      ) : null}

      {shareActionLabel && onShareAction ? (
        <AppButton
          title={shareActionLabel}
          onPress={onShareAction}
          disabled={shareActionDisabled}
          variant="ghost"
          size="large"
          fullWidth
          icon={<Share2Icon size={17} color={mentaColors.text.secondary} />}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: mentaSpacing[4],
    alignItems: 'stretch',
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  detail: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  progressRow: {
    width: '100%',
    paddingVertical: mentaSpacing[2],
  },
  preview: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.medium,
    overflow: 'hidden',
    backgroundColor: mentaColors.surface,
  },
  previewImage: {
    width: '100%',
    height: 176,
    backgroundColor: mentaColors.canvas,
  },
  textPreview: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
    backgroundColor: mentaColors.paper,
    paddingHorizontal: mentaSpacing[5],
    paddingTop: mentaSpacing[5],
    paddingBottom: mentaSpacing[4],
  },
  videoPreview: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: mentaSpacing[2],
    backgroundColor: mentaColors.raised,
  },
  videoPreviewText: {
    ...mentaTypography.bodyMedium,
    color: mentaColors.text.primary,
  },
  previewMeta: {
    ...mentaTypography.label,
    color: mentaColors.text.muted,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
  },
  previewActions: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: mentaSpacing[2],
  },
  fullView: {
    gap: mentaSpacing[5],
    paddingBottom: mentaSpacing[6],
    paddingTop: mentaSpacing[4],
  },
  fullViewTitle: {
    ...mentaTypography.control,
    color: mentaColors.text.primary,
  },
  fullViewMedia: {
    height: 360,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullViewImage: {
    backgroundColor: mentaColors.canvas,
    height: '100%',
    width: '100%',
  },
});
