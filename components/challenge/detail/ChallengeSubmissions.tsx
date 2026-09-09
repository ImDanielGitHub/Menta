import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import {
  ProofEvidenceRow,
  ProofEvidenceRowSkeleton,
  ProofEvidenceViewer,
  type ProofEvidenceRecord,
} from '@/components/challenge/proof-evidence';
import { mentaSpacing, mentaTypography } from '@/constants/MentaDesignSystem';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import type { ProofMediaType } from '@/lib/proof-types';
import { useTranslation } from '@/lib/localization';
import { usePhoneLayout } from '@/constants/use-phone-layout';

export type ChallengeSubmissionPreview = {
  id: string;
  media_url?: string | null;
  media_type?: ProofMediaType;
  submission_text?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  submission_date: string;
  review_notes?: string;
  users?: {
    username: string;
    avatar_url?: string;
  };
  reviewer?: {
    username: string;
    avatar_url?: string;
  };
};

type ChallengeSubmissionsProps = {
  mode: 'preview' | 'full';
  verifications: ChallengeSubmissionPreview[];
  title?: string;
  emptyTitle?: string;
  emptyText?: string;
  loading?: boolean;
  staleMessage?: string | null;
};

export function ChallengeSubmissions({
  mode,
  verifications,
  title,
  emptyTitle,
  emptyText,
  loading = false,
  staleMessage = null,
}: ChallengeSubmissionsProps) {
  const { t, locale } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const resolvedTitle =
    title ??
    (mode === 'preview'
      ? t('todayProof.promise.recent_proof')
      : t('todayProof.promise.proof_log'));
  const resolvedEmptyTitle = emptyTitle ?? t('todayProof.promise.no_proof');
  const resolvedEmptyText = emptyText ?? t('todayProof.promise.submit_appears');
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const items = mode === 'preview' ? verifications.slice(0, 3) : verifications;
  const [selectedProof, setSelectedProof] =
    useState<ProofEvidenceRecord | null>(null);

  const proofRecords = items.map(verification => {
    const submittedAt = new Date(verification.submission_date).toLocaleString(
      locale,
      {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }
    );
    const mediaType = verification.media_type || 'photo';

    return {
      id: verification.id,
      mediaType,
      mediaUrl: verification.media_url,
      submissionText: verification.submission_text,
      state:
        verification.status === 'approved'
          ? 'approved'
          : verification.status === 'rejected'
            ? 'needs-retry'
            : 'waiting',
      submittedLabel: submittedAt,
      evidenceTitle:
        mediaType === 'video'
          ? t('todayProof.promise.video_proof')
          : mediaType === 'text'
            ? t('todayProof.promise.text_proof')
            : t('todayProof.promise.photo_proof'),
      contextLabel: verification.users?.username?.trim() || null,
      reviewerName: verification.reviewer?.username,
      reviewNotes: verification.review_notes,
    } satisfies ProofEvidenceRecord;
  });

  return (
    <View
      style={[styles.section, { marginHorizontal: phoneLayout.screenInset }]}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{resolvedTitle}</Text>
        <Text style={styles.sectionCount}>{verifications.length}</Text>
      </View>

      {staleMessage ? (
        <AppInlineNotice
          title={t('todayProof.promise.out_of_date')}
          description={staleMessage}
          tone="warning"
          style={styles.notice}
        />
      ) : null}

      {loading && proofRecords.length > 0 ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('todayProof.promise.checking_history')}
          style={styles.refreshing}
        >
          <Text style={styles.refreshingText}>
            {t('todayProof.promise.checking_history_updates')}
          </Text>
        </View>
      ) : null}

      {loading && proofRecords.length === 0 ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('todayProof.promise.loading_history')}
          style={styles.list}
        >
          {[0, 1, 2].map(index => (
            <ProofEvidenceRowSkeleton key={index} index={index} />
          ))}
        </View>
      ) : proofRecords.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{resolvedEmptyTitle}</Text>
          <Text style={styles.emptyText}>{resolvedEmptyText}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {proofRecords.map(proof => (
            <ProofEvidenceRow
              key={proof.id}
              proof={proof}
              onPress={() => setSelectedProof(proof)}
              testID={`challenge-proof-${proof.id}`}
            />
          ))}
        </View>
      )}

      <ProofEvidenceViewer
        proof={selectedProof}
        visible={Boolean(selectedProof)}
        onClose={() => setSelectedProof(null)}
      />
    </View>
  );
}

const createStyles = (theme: ThemeContextType) =>
  StyleSheet.create({
    section: {
      marginTop: mentaSpacing[6],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.primary,
      paddingTop: mentaSpacing[4],
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    sectionTitle: {
      ...mentaTypography.title,
      color: theme.colors.text.primary,
    },
    sectionCount: {
      ...mentaTypography.bodySmallMedium,
      color: theme.colors.text.secondary,
    },
    list: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.primary,
    },
    notice: {
      marginBottom: mentaSpacing[3],
    },
    refreshing: {
      minHeight: 44,
      justifyContent: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.primary,
    },
    refreshingText: {
      ...mentaTypography.caption,
      color: theme.colors.text.secondary,
    },
    empty: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.primary,
      paddingVertical: 24,
    },
    emptyTitle: {
      ...mentaTypography.control,
      color: theme.colors.text.primary,
    },
    emptyText: {
      ...mentaTypography.bodySmall,
      color: theme.colors.text.secondary,
      marginTop: 6,
    },
  });
