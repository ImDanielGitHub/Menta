import React, { useEffect } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { OnboardingCelebrationBurst } from '@/components/onboarding/OnboardingCelebrationBurst';
import { AppButton } from '@/components/ui/AppButton';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

import { ShopItemArt, tokenAlpha } from './ShopItemArt';
import { ShopReceiptCard, type ShopReceiptFact } from './ShopReceiptCard';

const STAGE = 260;
const RAY_COUNT = 14;

function sunburstPath(size: number) {
  const centre = size / 2;
  const radius = size / 2;
  const step = (Math.PI * 2) / RAY_COUNT;
  const half = step / 4;
  let path = '';
  for (let index = 0; index < RAY_COUNT; index += 1) {
    const angle = index * step;
    const x1 = centre + radius * Math.cos(angle - half);
    const y1 = centre + radius * Math.sin(angle - half);
    const x2 = centre + radius * Math.cos(angle + half);
    const y2 = centre + radius * Math.sin(angle + half);
    path += `M${centre} ${centre}L${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}Z`;
  }
  return path;
}

const SUNBURST_PATH = sunburstPath(STAGE);

type Action = {
  label: string;
  onPress: () => void;
  testID?: string;
};

type ShopPurchaseCelebrationProps = {
  visible: boolean;
  sku: string;
  title: string;
  detail: string;
  /** Quantity change the server confirmed, for example "+1". */
  gainLabel?: string | null;
  facts?: readonly ShopReceiptFact[];
  primaryAction: Action;
  secondaryAction?: Action;
  onClose: () => void;
};

/**
 * Server-confirmed purchase moment. The item pops in over a violet sunburst
 * with onboarding's one-shot confetti; Reduce Motion shows the same
 * composition without movement. One primary next step, one quiet alternative.
 */
export function ShopPurchaseCelebration({
  visible,
  sku,
  title,
  detail,
  gainLabel,
  facts = [],
  primaryAction,
  secondaryAction,
  onClose,
}: ShopPurchaseCelebrationProps) {
  const motion = useMotionPreferences();
  const pop = useSharedValue(motion.reduceMotion ? 1 : 0);
  const burst = useSharedValue(motion.reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!visible) return;
    if (motion.reduceMotion) {
      pop.value = 1;
      burst.value = 1;
      return;
    }
    pop.value = 0;
    burst.value = 0;
    burst.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
    pop.value = withDelay(
      120,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.back(2.4)) })
    );
  }, [burst, motion.reduceMotion, pop, visible]);

  const artStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.6),
    transform: [{ scale: 0.4 + pop.value * 0.6 }],
  }));
  const burstStyle = useAnimatedStyle(() => ({
    opacity: burst.value,
    transform: [
      { scale: 0.6 + burst.value * 0.4 },
      { rotate: `${burst.value * 24}deg` },
    ],
  }));

  return (
    <Modal
      animationType={motion.reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
      transparent={false}
      visible={visible}
    >
      <SafeAreaView style={styles.screen} testID="shop-purchase-celebration">
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.stage}
          >
            <Animated.View style={[styles.sunburst, burstStyle]}>
              <Svg height={STAGE} width={STAGE}>
                <Path
                  d={SUNBURST_PATH}
                  fill={tokenAlpha(mentaColors.action, 0.16)}
                />
              </Svg>
            </Animated.View>
            <View style={styles.glow} />
            <Animated.View style={artStyle}>
              <ShopItemArt sku={sku} size={132} />
              {gainLabel ? (
                <View style={styles.gain}>
                  <Text style={styles.gainText}>{gainLabel}</Text>
                </View>
              ) : null}
            </Animated.View>
            <View style={styles.burstAnchor}>
              {visible ? <OnboardingCelebrationBurst /> : null}
            </View>
          </View>

          <View
            accessible
            accessibilityLabel={`${title} ${detail}`}
            accessibilityLiveRegion="polite"
            style={styles.copy}
          >
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text style={styles.detail}>{detail}</Text>
          </View>

          {facts.length > 0 ? (
            <ShopReceiptCard facts={facts} testID="shop-celebration-receipt" />
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            fullWidth
            haptic
            onPress={primaryAction.onPress}
            size="large"
            testID={primaryAction.testID ?? 'shop-celebration-primary'}
            title={primaryAction.label}
            variant="accent"
          />
          {secondaryAction ? (
            <AppButton
              fullWidth
              onPress={secondaryAction.onPress}
              size="medium"
              testID={secondaryAction.testID ?? 'shop-celebration-secondary'}
              textStyle={styles.secondaryText}
              title={secondaryAction.label}
              variant="ghost"
            />
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: mentaColors.canvas,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    gap: mentaSpacing[6],
    justifyContent: 'center',
    paddingHorizontal: mentaLayout.screenInset,
    paddingVertical: mentaSpacing[8],
  },
  stage: {
    alignItems: 'center',
    height: STAGE,
    justifyContent: 'center',
    width: STAGE,
  },
  sunburst: {
    height: STAGE,
    left: 0,
    position: 'absolute',
    top: 0,
    width: STAGE,
  },
  glow: {
    backgroundColor: tokenAlpha(mentaColors.action, 0.12),
    borderRadius: mentaRadii.round,
    height: 176,
    position: 'absolute',
    width: 176,
  },
  gain: {
    backgroundColor: mentaColors.action,
    borderColor: mentaColors.canvas,
    borderRadius: mentaRadii.round,
    borderWidth: 3,
    paddingHorizontal: mentaSpacing[3],
    paddingVertical: 2,
    position: 'absolute',
    right: -mentaSpacing[3],
    top: -mentaSpacing[3],
  },
  gainText: {
    color: mentaColors.canvas,
    ...mentaTypography.bodySemibold,
    fontVariant: ['tabular-nums'],
  },
  burstAnchor: {
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: STAGE / 2 - 178,
  },
  copy: {
    alignItems: 'center',
    gap: mentaSpacing[3],
    maxWidth: mentaLayout.readingMeasure,
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.heading,
    textAlign: 'center',
  },
  detail: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
    textAlign: 'center',
  },
  footer: {
    gap: mentaSpacing[2],
    paddingBottom: mentaSpacing[4],
    paddingHorizontal: mentaLayout.screenInset,
    paddingTop: mentaSpacing[3],
  },
  secondaryText: {
    color: mentaColors.action,
  },
});
