import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/AppCard';
import { AppTag } from '@/components/ui/AppChoice';
import { CalendarIcon, CameraIcon, UsersIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import type {
  CategoryOption,
  CreateChallengeFormData,
  CreateStep,
  DifficultyOption,
  GroupOption,
  ReviewEditTarget,
  StepStyles,
  VerificationOption,
} from './types';
import { useTranslation } from '@/lib/localization';

interface ReviewStepProps {
  step: CreateStep;
  showHeader?: boolean;
  styles: StepStyles;
  formData: CreateChallengeFormData;
  selectedCategory: CategoryOption;
  selectedGroup?: GroupOption;
  selectedDifficulty: DifficultyOption;
  selectedVerificationType: VerificationOption;
  onEditStep: (target: ReviewEditTarget) => void;
  editTargets?: {
    details: ReviewEditTarget;
    durationAndIntensity: ReviewEditTarget;
    privacyAndVerification: ReviewEditTarget;
  };
}

export function ReviewStep({
  step,
  showHeader = true,
  styles,
  formData,
  selectedCategory,
  selectedGroup,
  selectedDifficulty,
  selectedVerificationType,
  onEditStep,
  editTargets = {
    details: 1,
    durationAndIntensity: 3,
    privacyAndVerification: 5,
  },
}: ReviewStepProps) {
  const { t } = useTranslation();
  const holder = formData.allowSelfReview
    ? 'Only you'
    : (selectedGroup?.name ?? 'Group');
  const launchLines = [
    `${formData.duration} days`,
    selectedDifficulty.name,
    selectedVerificationType.name,
  ];

  return (
    <View style={showHeader ? styles.stepContainer : styles.stepSubsection}>
      {showHeader ? (
        <>
          <View style={styles.stepIcon}>{step.icon}</View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        </>
      ) : null}

      <View style={styles.reviewContainer}>
        <AppCard variant="content" style={styles.launchCard}>
          <View style={styles.launchTopRow}>
            <AppTag label={selectedCategory.name} tone="share" />
            <Pressable
              onPress={() => onEditStep(editTargets.details)}
              hitSlop={mentaSpacing[2]}
              style={({ pressed }) => [
                reviewStyles.editAction,
                pressed ? reviewStyles.editActionPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('todayProof.residual.edit_promise_words')}
            >
              <Text style={reviewStyles.editWords}>
                {t('todayProof.residual.edit_words')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.launchTitle}>{formData.title}</Text>
          <Text style={styles.launchDescription}>{formData.description}</Text>

          <View style={styles.launchPills}>
            {launchLines.map(line => (
              <View
                key={line}
                style={[styles.launchPill, reviewStyles.launchPill]}
              >
                <Text style={[styles.launchPillText, reviewStyles.pillText]}>
                  {line}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.launchDivider, reviewStyles.divider]} />

          <View style={styles.launchRows}>
            <View style={styles.launchRow}>
              <UsersIcon size={18} color={mentaColors.text.secondary} />
              <View style={styles.launchRowCopy}>
                <Text style={styles.launchRowLabel}>
                  {t('todayProof.residual.who_takes_part')}
                </Text>
                <Text style={styles.launchRowValue}>{holder}</Text>
              </View>
              <Pressable
                onPress={() => onEditStep(1)}
                hitSlop={mentaSpacing[2]}
                style={({ pressed }) => [
                  reviewStyles.editAction,
                  pressed ? reviewStyles.editActionPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'todayProof.residual.edit_who_takes_part'
                )}
              >
                <Text style={[styles.launchEdit, reviewStyles.editText]}>
                  {t('todayProof.residual.edit')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.launchRow}>
              <CameraIcon size={18} color={mentaColors.text.secondary} />
              <View style={styles.launchRowCopy}>
                <Text style={styles.launchRowLabel}>
                  {t('todayProof.proof.receipt')}
                </Text>
                <Text style={styles.launchRowValue}>
                  {formData.verificationDescription ||
                    selectedVerificationType.description}
                </Text>
              </View>
              <Pressable
                onPress={() => onEditStep(editTargets.privacyAndVerification)}
                hitSlop={mentaSpacing[2]}
                style={({ pressed }) => [
                  reviewStyles.editAction,
                  pressed ? reviewStyles.editActionPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'todayProof.residual.edit_proof_requirements'
                )}
              >
                <Text style={[styles.launchEdit, reviewStyles.editText]}>
                  {t('todayProof.residual.edit')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.launchRow}>
              <CalendarIcon size={18} color={mentaColors.text.secondary} />
              <View style={styles.launchRowCopy}>
                <Text style={styles.launchRowLabel}>
                  {t('todayProof.residual.proof_schedule')}
                </Text>
                <Text style={styles.launchRowValue}>
                  {formData.verificationFrequency === 'weekly'
                    ? 'Every week'
                    : formData.verificationFrequency === 'custom'
                      ? 'Custom schedule'
                      : 'Every day'}
                </Text>
              </View>
              <Pressable
                onPress={() => onEditStep(editTargets.durationAndIntensity)}
                hitSlop={mentaSpacing[2]}
                style={({ pressed }) => [
                  reviewStyles.editAction,
                  pressed ? reviewStyles.editActionPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t(
                  'todayProof.residual.edit_proof_schedule'
                )}
              >
                <Text style={[styles.launchEdit, reviewStyles.editText]}>
                  {t('todayProof.residual.edit')}
                </Text>
              </Pressable>
            </View>
          </View>
        </AppCard>
      </View>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  editAction: {
    minWidth: mentaLayout.minimumTouchTarget,
    minHeight: mentaLayout.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mentaRadii.small,
    paddingHorizontal: mentaSpacing[2],
  },
  editActionPressed: {
    backgroundColor: mentaColors.actionSoft,
  },
  editWords: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.secondary,
  },
  editText: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.action,
  },
  launchPill: {
    borderColor: mentaColors.border,
  },
  pillText: {
    color: mentaColors.text.secondary,
  },
  divider: {
    backgroundColor: mentaColors.border,
  },
});
