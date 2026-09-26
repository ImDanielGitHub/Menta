import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { CheckIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { useTranslation } from '@/lib/localization';

export type TodayPromiseReceiptFact = {
  label: string;
  value: string;
  tone?: 'default' | 'action';
};

export type TodayPromiseReceiptData = {
  /** Omitted when the hero heading already names the promise. */
  title: string | null;
  meta: string | null;
  facts: readonly TodayPromiseReceiptFact[];
  /** Server-approved today. Shows the violet check seal. */
  approved: boolean;
};

const SEAL_SIZE = 40;

/**
 * Cream receipt for the promise Today is about, in the same language as the
 * onboarding promise receipt: a paper card with label/value rows. Every value
 * comes from the Today snapshot; nothing is inferred.
 */
export function TodayPromiseReceipt({
  receipt,
}: {
  receipt: TodayPromiseReceiptData;
}) {
  const { t } = useTranslation();
  const motion = useMotionPreferences();
  const sealScale = useSharedValue(1);
  const sealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sealScale.value }],
  }));

  useEffect(() => {
    if (!receipt.approved || !motion.allowsTransform) return;
    sealScale.value = 0.4;
    sealScale.value = withTiming(1, {
      duration: MOTION_DURATIONS.complex,
      easing: Easing.out(Easing.back(2.2)),
    });
  }, [motion.allowsTransform, receipt.approved, sealScale]);

  const summary = [
    receipt.title,
    receipt.meta,
    ...receipt.facts.map(fact => `${fact.label}: ${fact.value}`),
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View style={styles.stage}>
      <View
        accessible
        accessibilityLabel={t('today.home.receipt.accessibility', {
          facts: summary,
        })}
        style={styles.card}
        testID="today-promise-receipt"
      >
        {receipt.title || receipt.meta ? (
          <View style={styles.header}>
            {receipt.title ? (
              <Text style={styles.title}>{receipt.title}</Text>
            ) : null}
            {receipt.meta ? (
              <Text style={styles.meta}>{receipt.meta}</Text>
            ) : null}
          </View>
        ) : null}
        {receipt.facts.map((fact, index) => (
          <View
            key={fact.label}
            style={[
              styles.factRow,
              index === 0 && !receipt.title && !receipt.meta
                ? styles.factRowFirst
                : null,
            ]}
          >
            <Text style={styles.factLabel}>{fact.label}</Text>
            <Text
              style={[
                styles.factValue,
                fact.tone === 'action' ? styles.factValueAction : null,
              ]}
            >
              {fact.value}
            </Text>
          </View>
        ))}
      </View>
      {receipt.approved ? (
        <Animated.View
          style={[styles.seal, sealStyle]}
          testID="today-promise-receipt-seal"
        >
          <CheckIcon color={mentaColors.canvas} size={20} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'stretch',
    position: 'relative',
    width: '100%',
  },
  card: {
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.large,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    gap: mentaSpacing[1],
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[4],
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.onPaper,
  },
  meta: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
  },
  factRow: {
    alignItems: 'center',
    borderTopColor: mentaColors.borderPaper,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[3],
  },
  factRowFirst: {
    borderTopWidth: 0,
  },
  factLabel: {
    ...mentaTypography.bodySmall,
    color: mentaColors.text.mutedOnPaper,
    flexShrink: 0,
  },
  factValue: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.onPaper,
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  factValueAction: {
    color: mentaColors.actionOnPaper,
  },
  seal: {
    alignItems: 'center',
    backgroundColor: mentaColors.action,
    borderColor: mentaColors.canvas,
    borderRadius: mentaRadii.round,
    borderWidth: 4,
    height: SEAL_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    right: mentaSpacing[4],
    top: -SEAL_SIZE / 2,
    width: SEAL_SIZE,
  },
});
