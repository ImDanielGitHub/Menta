import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  PlusIcon,
  VideoIcon,
} from '@/components/ui/icons';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import type { TodaysSubmission } from '@/store/group-store';
import { useTranslation } from '@/lib/localization';

type TodayProofSectionProps = {
  submissions: TodaysSubmission[];
  onSubmitProof: (submission: TodaysSubmission) => void;
  onOpenSubmittedProof: (submission: TodaysSubmission) => void;
  onStartSolo: () => void;
};

type Localise = ReturnType<typeof useTranslation>['t'];

const getProofStatusLabel = (
  submission: TodaysSubmission,
  t: Localise
): string => {
  if (
    submission.hasSubmittedToday &&
    submission.submissionStatus === 'pending'
  ) {
    return t('today.proof.status.waiting_review');
  }

  if (submission.submissionStatus === 'approved') {
    return t('today.proof.status.approved');
  }
  if (submission.submissionStatus === 'rejected') {
    return t('today.proof.status.correction_requested');
  }
  if (submission.hasSubmittedToday) return t('today.proof.status.sent');
  return submission.isUrgent
    ? t('today.proof.status.due_now')
    : t('today.proof.status.due');
};

const getProofActionLabel = (
  submission: TodaysSubmission,
  t: Localise
): string => {
  if (
    submission.hasSubmittedToday &&
    submission.submissionStatus === 'pending'
  ) {
    return t('today.proof.action.view');
  }

  if (submission.submissionStatus === 'rejected') {
    return t('today.proof.action.update');
  }
  if (submission.hasSubmittedToday) return t('today.proof.action.view');
  switch (submission.submissionType) {
    case 'text':
      return t('today.proof.action.write');
    case 'video':
      return t('today.proof.action.record');
    case 'photo':
      return t('today.proof.action.add_photo');
    default:
      return t('today.proof.action.add_proof');
  }
};

const getProofIcon = (submission: TodaysSubmission) => {
  if (
    submission.hasSubmittedToday &&
    submission.submissionStatus === 'pending'
  ) {
    return ClockIcon;
  }

  if (submission.hasSubmittedToday) return CheckCircleIcon;

  switch (submission.submissionType) {
    case 'text':
      return FileTextIcon;
    case 'video':
      return VideoIcon;
    case 'photo':
      return CameraIcon;
    default:
      return CameraIcon;
  }
};

export const TodayProofSection: React.FC<TodayProofSectionProps> = ({
  submissions,
  onSubmitProof,
  onOpenSubmittedProof,
  onStartSolo,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('today.proof.heading')}</Text>
        <Text style={styles.sectionAction}>{submissions.length}</Text>
      </View>

      <View style={styles.list}>
        {submissions.length > 0 ? (
          submissions.map(submission => {
            const submitted = submission.hasSubmittedToday;
            const isPendingReview =
              submitted && submission.submissionStatus === 'pending';
            const ProofIcon = getProofIcon(submission);
            const proofIconColor = isPendingReview
              ? theme.colors.status.warning
              : submitted
                ? theme.colors.text.secondary
                : theme.colors.text.primary;

            return (
              <TouchableOpacity
                key={submission.id}
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={() =>
                  submitted
                    ? onOpenSubmittedProof(submission)
                    : onSubmitProof(submission)
                }
                style={styles.row}
              >
                <View style={styles.rowIcon}>
                  <ProofIcon size={17} color={proofIconColor} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {submission.challengeTitle}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {t('today.proof.meta', {
                      group: submission.groupName || t('today.proof.solo'),
                      day: submission.dayNumber,
                      total: submission.totalDays,
                      status: getProofStatusLabel(submission, t),
                    })}
                  </Text>
                </View>
                <Text style={styles.rowActionLabel}>
                  {getProofActionLabel(submission, t)}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.82}
            onPress={onStartSolo}
            style={[styles.row, styles.dashedRow]}
          >
            <View style={styles.rowIcon}>
              <PlusIcon size={17} color={theme.colors.text.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>
                {t('today.proof.empty.title')}
              </Text>
              <Text style={styles.rowMeta}>{t('today.proof.empty.body')}</Text>
            </View>
            <Text style={styles.rowActionLabel}>
              {t('today.proof.empty.action')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: ThemeContextType) => {
  const { colors, spacing, borderRadius, typography } = theme;

  return StyleSheet.create({
    section: {
      gap: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    sectionTitle: {
      color: colors.text.primary,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
    },
    sectionAction: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    list: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 58,
    },
    dashedRow: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border.secondary,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: borderRadius.full,
      backgroundColor: colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: colors.text.primary,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
    },
    rowMeta: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      lineHeight: 19,
      marginTop: 3,
    },
    rowActionLabel: {
      color: colors.text.secondary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      textTransform: 'uppercase',
      flexShrink: 0,
      textAlign: 'right',
      maxWidth: 92,
      minWidth: 58,
    },
  });
};

export default TodayProofSection;
