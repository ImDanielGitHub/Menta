import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useScreenReader } from '@/lib/accessibility';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { mentaFonts } from '@/lib/menta-fonts';
import { useTranslation } from '@/lib/localization/use-translation';

export const FullScreenLoading = ({ message }: { message?: string }) => {
  const { isReduceMotionEnabled } = useScreenReader();
  const { t } = useTranslation();
  const motionDisabled =
    isReduceMotionEnabled || process.env.NODE_ENV === 'test';

  const copyOpacity = useRef(new Animated.Value(0)).current;
  const copyTranslateY = useRef(new Animated.Value(6)).current;
  const pulseOpacity = useRef(new Animated.Value(0.18)).current;
  const pulseTranslateX = useRef(new Animated.Value(-34)).current;

  useEffect(() => {
    if (motionDisabled) {
      copyOpacity.setValue(1);
      copyTranslateY.setValue(0);
      pulseOpacity.setValue(0.52);
      pulseTranslateX.setValue(0);
      return;
    }

    const entrance = Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(copyOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(copyTranslateY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]);

    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.78,
            duration: 625,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.18,
            duration: 625,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseTranslateX, {
            toValue: 34,
            duration: 1250,
            useNativeDriver: true,
          }),
          Animated.timing(pulseTranslateX, {
            toValue: -34,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    entrance.start();
    pulse.start();

    return () => {
      entrance.stop();
      pulse.stop();
    };
  }, [
    copyOpacity,
    copyTranslateY,
    motionDisabled,
    pulseOpacity,
    pulseTranslateX,
  ]);

  return (
    <View
      testID="loading-container"
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? t('shared.accessibility.mentaLoading')}
    >
      <View style={styles.composition}>
        <View testID="loading-mark-shell" style={styles.markShell}>
          <Image
            testID="loading-mark"
            source={require('@/assets/images/menta-splash-welcome.png')}
            style={styles.mark}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>

        <Animated.View
          style={[
            styles.copy,
            {
              opacity: copyOpacity,
              transform: [{ translateY: copyTranslateY }],
            },
          ]}
        >
          <Text testID="loading-wordmark" style={styles.wordmark}>
            {t('brand.name')}
          </Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </Animated.View>

        <View testID="loading-progress-track" style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressPulse,
              {
                opacity: pulseOpacity,
                transform: [{ translateX: pulseTranslateX }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const launchTokens = {
  canvas: mentaColors.canvas,
  text: mentaColors.text.primary,
  textMuted: 'rgba(248, 247, 241, 0.58)',
  divider: 'rgba(248, 247, 241, 0.12)',
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: launchTokens.canvas,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  composition: {
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
  },
  markShell: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    maxWidth: 264,
    width: '100%',
  },
  mark: {
    height: '100%',
    width: '100%',
  },
  copy: {
    alignItems: 'center',
  },
  wordmark: {
    color: launchTokens.text,
    fontSize: 24,
    fontFamily: mentaFonts.inter.bold,
    letterSpacing: 0,
    lineHeight: 30,
  },
  message: {
    color: launchTokens.textMuted,
    fontSize: 14,
    fontFamily: mentaFonts.inter.semibold,
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  progressTrack: {
    backgroundColor: launchTokens.divider,
    borderRadius: 999,
    height: 2,
    marginTop: 24,
    overflow: 'hidden',
    width: 96,
  },
  progressPulse: {
    backgroundColor: launchTokens.text,
    borderRadius: 999,
    height: 2,
    width: 40,
  },
});
