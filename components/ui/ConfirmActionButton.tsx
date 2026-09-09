import React, { useMemo, useRef, useState } from 'react';
import { Animated, View, Text } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { showToast } from '@/components/ui/Toast';
import { formatCost } from '@/lib/momenta-costs';
import { emitHaptic } from '@/lib/motion/haptics';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization/use-translation';

type ConfirmActionButtonProps = {
  title: string;
  cost?: number;
  balance?: number;
  onConfirm: () => Promise<void> | void;
  processing?: boolean;
  disabled?: boolean;
  testID?: string;
  showBalance?: boolean;
  currencyLabel?: string;
  onInsufficient?: () => void;
  showCostInTitle?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
};

export const ConfirmActionButton: React.FC<ConfirmActionButtonProps> = ({
  title,
  cost,
  balance = 0,
  onConfirm,
  processing = false,
  disabled = false,
  testID,
  showBalance = false,
  currencyLabel,
  onInsufficient,
  showCostInTitle = true,
  variant = 'primary',
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedCurrencyLabel = currencyLabel ?? t('brand.currency');
  const motion = useMotionPreferences();
  const [confirming, setConfirming] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    if (motion.reduceMotion) {
      return;
    }

    Animated.sequence([
      Animated.timing(shake, {
        toValue: motion.distance(8),
        duration: motion.duration(40),
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: motion.distance(-8),
        duration: motion.duration(60),
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 0,
        duration: motion.duration(50),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = async () => {
    if (processing || disabled) return;

    if (!confirming) {
      setConfirming(true);
      void emitHaptic({ type: 'confirm' });
      setTimeout(() => setConfirming(false), 2500);
      return;
    }

    // Second tap: attempt action
    if (typeof cost === 'number' && balance < cost) {
      triggerShake();
      void emitHaptic({
        type: 'blocked',
        reason: 'insufficient-momenta',
      });
      if (onInsufficient) {
        onInsufficient();
        return;
      }
      showToast.warning(
        t('shared.confirm.notEnough.title'),
        t('shared.confirm.notEnough.message')
      );
      return;
    }

    await onConfirm();
  };

  const buttonTitle = useMemo(() => {
    const hasCost = showCostInTitle && typeof cost === 'number';
    const costText = hasCost ? formatCost(cost) : '';
    if (confirming) {
      return hasCost
        ? t('shared.confirm.tapAgainWithCost', { cost: costText })
        : t('shared.confirm.tapAgain');
    }
    return hasCost
      ? t('shared.confirm.actionWithCost', { title, cost: costText })
      : t('shared.confirm.action', { title });
  }, [confirming, cost, showCostInTitle, t, title]);

  return (
    <Animated.View
      style={{ transform: [{ translateX: shake }] }}
      testID={testID}
    >
      {showBalance && (
        <View style={{ marginBottom: theme.spacing.xs }}>
          <Text
            style={{
              color: theme.colors.text.tertiary,
              fontSize: theme.typography.sizes.xs,
              fontWeight: theme.typography.weights.medium,
              textAlign: 'right',
            }}
            numberOfLines={2}
          >
            {t('shared.confirm.balance', {
              balance: balance ?? 0,
              currency: resolvedCurrencyLabel,
            })}
          </Text>
        </View>
      )}
      <AppButton
        title={buttonTitle}
        onPress={handlePress}
        size="large"
        fullWidth
        loading={processing}
        disabled={disabled}
        variant={variant}
        haptic={false}
      />
    </Animated.View>
  );
};

export default ConfirmActionButton;
