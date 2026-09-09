import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { grantsAccountFreeze } from '@/lib/economy/contract';
import { useTranslation } from '@/lib/localization';

interface MilestoneModalProps {
  visible: boolean;
  milestone: number;
  reward: number;
  approvedAt?: string | null;
  onClose: () => void;
  onShare?: () => void;
}

const formatApprovedAt = (value: string | null | undefined) => {
  if (!value) return 'Approved now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Approved now';
  return `Approved ${new Intl.DateTimeFormat('en-NZ', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`;
};

/** Rendered only after the submission RPC supplies an accepted milestone. */
export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  visible,
  milestone,
  reward,
  approvedAt,
  onClose,
  onShare,
}) => {
  const { t } = useTranslation();
  return (
    <ModalCard
      visible={visible}
      onClose={onClose}
      dismissOnBackdrop={false}
      accessibilityLabel={t(
        'todayProof.residual.confirmed_streak_milestone_receipt'
      )}
      testID="milestone-reward-dialog"
      cardStyle={styles.card}
    >
      <View style={styles.content}>
        <MentaMascot state="celebration" size="lg" />
        <Text style={styles.title}>
          {t('todayProof.milestone.reached', { count: milestone })}
        </Text>
        <Text style={styles.approved}>{formatApprovedAt(approvedAt)}</Text>

        <View style={styles.facts}>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>
              {t('todayProof.residual.reward')}
            </Text>
            <Text style={styles.factValue}>
              {t('todayProof.milestone.reward', { reward })}
            </Text>
          </View>
          {grantsAccountFreeze(milestone) ? (
            <View style={styles.factRow}>
              <Text style={styles.factLabel}>
                {t('todayProof.residual.streak_freeze')}
              </Text>
              <Text style={styles.factValue}>
                {t(
                  'todayProof.residual.added_to_your_inventory_for_keeping_this_streak'
                )}
              </Text>
            </View>
          ) : null}
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>
              {t('todayProof.residual.if_you_share')}
            </Text>
            <Text style={styles.factValue}>
              {t('todayProof.residual.your_proof_stays_private')}
            </Text>
          </View>
        </View>

        {onShare ? (
          <AppButton
            title={t('todayProof.residual.share_milestone')}
            onPress={onShare}
            fullWidth
            size="large"
            variant="accent"
          />
        ) : null}
        <AppButton
          title={t('todayProof.proof.done')}
          onPress={onClose}
          fullWidth
          size="large"
          variant="outline"
        />
      </View>
    </ModalCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: mentaSpacing[6],
  },
  content: {
    alignItems: 'stretch',
    gap: mentaSpacing[4],
  },
  title: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
    textAlign: 'center',
  },
  approved: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    textAlign: 'center',
  },
  facts: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  factRow: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[1],
    paddingVertical: mentaSpacing[3],
  },
  factLabel: {
    ...mentaTypography.label,
    color: mentaColors.text.secondary,
  },
  factValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.primary,
  },
});
