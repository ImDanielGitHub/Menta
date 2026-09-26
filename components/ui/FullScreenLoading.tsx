import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useScreenReader } from '@/lib/accessibility';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { mentaFonts } from '@/lib/menta-fonts';
import { useTranslation } from '@/lib/localization/use-translation';

const LAUNCH_TIPS = [
  'shared.launch.tip.small',
  'shared.launch.tip.friend',
  'shared.launch.tip.miss',
] as const;

/**
 * Paper 19 / S02 (OTA form): the mark stays exactly where the native splash
 * drew it, so launch never jumps; a plain status line and one tip settle in
 * underneath, the way Duolingo's loading screen talks while it works. The
 * violet S01/S02 composition ships with the next native splash change.
 */
export const FullScreenLoading = ({ message }: { message?: string }) => {
  const { isReduceMotionEnabled } = useScreenReader();
  const { t } = useTranslation();
  const motionDisabled =
    isReduceMotionEnabled || process.env.NODE_ENV === 'test';
  const [tipKey] = useState(
    () => LAUNCH_TIPS[Math.floor(Math.random() * LAUNCH_TIPS.length)]
  );
  const copyOpacity = useRef(
    new Animated.Value(motionDisabled ? 1 : 0)
  ).current;

  useEffect(() => {
    if (motionDisabled) {
      copyOpacity.setValue(1);
      return;
    }
    const entrance = Animated.sequence([
      Animated.delay(240),
      Animated.timing(copyOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [copyOpacity, motionDisabled]);

  const status = message ?? t('shared.rootLayout.initialising');

  return (
    <View
      testID="loading-container"
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={status}
    >
      <View testID="loading-mark-shell" style={styles.markShell}>
        <Image
          testID="loading-mark"
          source={require('@/assets/images/menta-splash-welcome.png')}
          style={styles.mark}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <Animated.View style={[styles.copy, { opacity: copyOpacity }]}>
        <Text testID="loading-status" style={styles.status}>
          {status}
        </Text>
        <Text testID="loading-tip" style={styles.tip}>
          {t(tipKey)}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: mentaColors.canvas,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  // Matches the expo-splash-screen imageWidth in app.json, shrinking only on
  // windows narrower than the splash itself.
  markShell: {
    aspectRatio: 1,
    maxWidth: 280,
    width: '100%',
  },
  mark: {
    height: '100%',
    width: '100%',
  },
  copy: {
    alignItems: 'center',
    gap: 8,
    left: 40,
    position: 'absolute',
    right: 40,
    top: '64%',
  },
  status: {
    color: mentaColors.text.primary,
    fontFamily: mentaFonts.inter.semibold,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  tip: {
    color: mentaColors.text.secondary,
    fontFamily: mentaFonts.inter.regular,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 320,
    textAlign: 'center',
  },
});
