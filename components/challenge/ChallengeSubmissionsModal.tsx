import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { XIcon } from '@/components/ui/icons';
import ModalCard from '@/components/ui/modal/ModalCard';
import {
  ProofEvidenceRow,
  ProofEvidenceRowSkeleton,
  ProofEvidenceViewer,
  type ProofEvidenceRecord,
} from '@/components/challenge/proof-evidence';
import { useTranslation } from '@/lib/localization';

export type ChallengeSubmission = {
  id: string;
  challenge_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submission_date: string;
  media_url?: string | null;
  media_type?: 'photo' | 'video' | 'text' | string | null;
  submission_text?: string | null;
  review_notes?: string | null;
};

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  submissions: ChallengeSubmission[];
  loading?: boolean;
  staleMessage?: string | null;
};

export const ChallengeSubmissionsModal: React.FC<Props> = ({
  visible,
  title,
  onClose,
  submissions,
  loading = false,
  staleMessage = null,
}) => {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [filter, setFilter] = useState<
    'all' | 'approved' | 'pending' | 'rejected'
  >('all');
  const [selectedProof, setSelectedProof] =
    useState<ProofEvidenceRecord | null>(null);

  useEffect(() => {
    if (!visible) setSelectedProof(null);
  }, [visible]);

  const filtered = useMemo(() => {
    if (filter === 'all') return submissions;
    return submissions.filter(submission => submission.status === filter);
  }, [filter, submissions]);

  const counts = useMemo(
    () =>
      submissions.reduce(
        (acc, submission) => {
          acc.all += 1;
          acc[submission.status] += 1;
          return acc;
        },
        { all: 0, approved: 0, pending: 0, rejected: 0 }
      ),
    [submissions]
  );

  const emptyCopy = {
    all: {
      title: t('todayProof.promise.no_proof'),
      description: t('todayProof.promise.checkins_appear'),
    },
    approved: {
      title: t('todayProof.promise.no_accepted'),
      description: t('todayProof.promise.accepted_appears'),
    },
    pending: {
      title: t('todayProof.promise.nothing_waiting'),
      description: t('todayProof.promise.waiting_appears'),
    },
    rejected: {
      title: t('todayProof.promise.no_retry'),
      description: t('todayProof.promise.retry_appears'),
    },
  }[filter];

  const proofRecords = filtered.map(submission => {
    const mediaType =
      submission.media_type === 'video'
        ? 'video'
        : submission.media_type === 'text' ||
            (!submission.media_url && submission.submission_text?.trim())
          ? 'text'
          : 'photo';
    const submittedAt = new Date(submission.submission_date).toLocaleString(
      locale,
      {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }
    );

    return {
      id: submission.id,
      mediaType,
      mediaUrl: submission.media_url,
      submissionText: submission.submission_text,
      state:
        submission.status === 'approved'
          ? 'approved'
          : submission.status === 'rejected'
            ? 'needs-retry'
            : 'waiting',
      submittedLabel: submittedAt,
      evidenceTitle:
        mediaType === 'video'
          ? t('todayProof.promise.video_proof')
          : mediaType === 'text'
            ? t('todayProof.promise.text_proof')
            : t('todayProof.promise.photo_proof'),
      reviewNotes: submission.review_notes,
    } satisfies ProofEvidenceRecord;
  });

  return (
    <>
      <ModalCard
        visible={visible}
        onClose={onClose}
        maxWidth={520}
        accessibilityLabel={t('todayProof.promise.close_submissions')}
        cardStyle={styles.card}
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {t('todayProof.promise.proof_history')}
              </Text>
              {title ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {title}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('accessibility.close')}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <XIcon size={18} color={colors.text.secondary} />
            </Pressable>
          </View>

          <View style={styles.tabsRow}>
            <FilterChip
              label={t('todayProof.promise.all')}
              count={counts.all}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <FilterChip
              label={t('todayProof.solo.accepted')}
              count={counts.approved}
              active={filter === 'approved'}
              onPress={() => setFilter('approved')}
            />
            <FilterChip
              label={t('todayProof.residual.waiting')}
              count={counts.pending}
              active={filter === 'pending'}
              onPress={() => setFilter('pending')}
            />
            <FilterChip
              label={t('todayProof.promise.needs_retry')}
              count={counts.rejected}
              active={filter === 'rejected'}
              onPress={() => setFilter('rejected')}
            />
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
              accessibilityLabel={t(
                'todayProof.promise.checking_history_updates'
              )}
              style={styles.refreshing}
            >
              <Text style={styles.refreshingText}>
                {t('todayProof.residual.checking_for_updates')}
              </Text>
            </View>
          ) : null}

          {loading && proofRecords.length === 0 ? (
            <View
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={t('todayProof.promise.loading_history_short')}
              style={styles.loadingList}
            >
              {[0, 1, 2].map(index => (
                <ProofEvidenceRowSkeleton key={index} index={index} />
              ))}
            </View>
          ) : proofRecords.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
              <Text style={styles.emptyCopy}>{emptyCopy.description}</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {proofRecords.map(proof => (
                <ProofEvidenceRow
                  key={proof.id}
                  proof={proof}
                  onPress={() => setSelectedProof(proof)}
                  testID={`submissions-modal-proof-${proof.id}`}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </ModalCard>

      <ProofEvidenceViewer
        proof={selectedProof}
        visible={visible && Boolean(selectedProof)}
        onClose={() => setSelectedProof(null)}
      />
    </>
  );
};

const FilterChip: React.FC<{
  label: string;
  count: number;
  active?: boolean;
  onPress: () => void;
}> = ({ label, count, active, onPress }) => {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const backgroundColor = active ? colors.interactive.secondary : 'transparent';
  const foregroundColor = active
    ? colors.interactive.primary
    : colors.text.secondary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active
          ? colors.border.focus || colors.interactive.primary
          : colors.border.primary,
        backgroundColor,
        opacity: pressed ? 0.72 : 1,
      })}
      accessibilityState={{ selected: active }}
    >
      <Text style={{ color: foregroundColor, fontWeight: '700' }}>{label}</Text>
      <Text
        style={{ color: foregroundColor, fontWeight: '700', opacity: 0.72 }}
      >
        {count}
      </Text>
    </Pressable>
  );
};

const createStyles = (theme: ThemeContextType) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.borderRadius.xl || 18,
      borderWidth: 1,
      borderColor: theme.colors.border.primary,
      backgroundColor: theme.colors.surface.primary,
      maxHeight: 600,
    },
    content: {
      padding: theme.spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: theme.typography.sizes['2xl'] || theme.typography.sizes.lg,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 19,
      marginTop: theme.spacing.xs,
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.secondary,
    },
    pressed: {
      opacity: 0.72,
    },
    tabsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing.md,
      flexWrap: 'wrap',
    },
    list: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.primary,
      paddingBottom: theme.spacing.md,
    },
    loadingList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.primary,
    },
    notice: {
      marginBottom: theme.spacing.md,
    },
    refreshing: {
      minHeight: 44,
      justifyContent: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.primary,
    },
    refreshingText: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
    },
    emptyBox: {
      paddingVertical: theme.spacing.xl,
      gap: theme.spacing.xs,
    },
    emptyTitle: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.lg,
      fontWeight: '700',
    },
    emptyCopy: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 19,
    },
  });

export default ChallengeSubmissionsModal;
