import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';

export type WelcomeBonusReceipt = {
  confirmed: true;
  amount: number;
};

interface WelcomeBonusCardProps {
  receipt: WelcomeBonusReceipt | null;
  onContinue?: () => void;
  presentation?: 'card' | 'modal';
}

/**
 * Read-only presentation for a welcome reward that the first-promise
 * activation transaction has already confirmed. This component deliberately
 * has no claim action: an absent or incomplete receipt renders nothing.
 */
export const WelcomeBonusCard: React.FC<WelcomeBonusCardProps> = ({
  receipt,
  onContinue,
  presentation = 'card',
}) => {
  const { t } = useTranslation();
  if (
    !receipt?.confirmed ||
    !Number.isSafeInteger(receipt.amount) ||
    receipt.amount <= 0
  ) {
    return null;
  }

  return (
    <View
      accessible
      accessibilityLabel={t('economy.welcome.accessibility', {
        amount: receipt.amount,
      })}
      style={[styles.card, presentation === 'modal' && styles.modalCard]}
      testID="welcome-bonus-receipt"
    >
      <Text style={styles.heading}>
        {t('economy.welcome.heading', { amount: receipt.amount })}
      </Text>
      <Text style={styles.body}>
        {t('economy.welcome.body')}
      </Text>

      {onContinue ? (
        <AppButton
          title={t('economy.welcome.close')}
          onPress={onContinue}
          variant="accent"
          size="large"
          fullWidth
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.large,
    backgroundColor: mentaColors.paper,
    padding: mentaSpacing[5],
    marginBottom: mentaSpacing[4],
  },
  modalCard: {
    marginBottom: 0,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[5],
  },
  heading: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
    marginBottom: mentaSpacing[2],
  },
  body: {
    ...mentaTypography.body,
    color: mentaColors.text.mutedOnPaper,
    marginBottom: mentaSpacing[4],
  },
});

export default WelcomeBonusCard;
