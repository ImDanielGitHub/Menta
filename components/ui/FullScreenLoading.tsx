import type { MentaPalette } from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { resolveStartupReduceMotion } from '@/lib/startup-splash';

import { mentaFonts } from '@/lib/menta-fonts';
import { useTranslation } from '@/lib/localization/use-translation';

const LAUNCH_TIPS = [
  'shared.launch.tip.small',
  'shared.launch.tip.friend',
  'shared.launch.tip.miss',
] as const;

/**
 * The native splash owns its artwork. While account readiness is pending,
 * show the existing transparent companion on the current theme's canvas.
 */
export const FullScreenLoading = ({ message }: { message?: string }) => {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  // Remain still until the native preference is known, including lookup failure.
  const [motionDisabled, setMotionDisabled] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [tipKey] = useState(
    () => LAUNCH_TIPS[Math.floor(Math.random() * LAUNCH_TIPS.length)]
  );
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const preference = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => {
        preferenceChanged = true;
        setMotionDisabled(value);
      }
    );
    void resolveStartupReduceMotion().then(value => {
      if (mounted && !preferenceChanged) setMotionDisabled(value);
    });
    const appState = AppState.addEventListener('change', state => {
      setActive(state === 'active');
    });
    return () => {
      mounted = false;
      preference.remove();
      appState.remove();
    };
  }, []);

  useEffect(() => {
    translateY.setValue(0);
    if (motionDisabled || !active) {
      return;
    }
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -5,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 340,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.delay(650),
      ])
    );
    bounce.start();
    return () => {
      bounce.stop();
      translateY.setValue(0);
    };
  }, [active, motionDisabled, translateY]);

  const status = message ?? t('shared.rootLayout.initialising');

  return (
    <View testID="loading-container" style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={styles.progress}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={status}
          accessibilityState={{ busy: true }}
        >
          <Animated.View
            testID="loading-mark-shell"
            style={[styles.markShell, { transform: [{ translateY }] }]}
          >
            <Image
              testID="loading-mark"
              source={require('@/assets/images/mascot/today-fresh-start.png')}
              style={styles.mark}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              accessible={false}
              fadeDuration={0}
            />
          </Animated.View>
          <View style={styles.copy}>
            <Text testID="loading-status" style={styles.status}>
              {status}
            </Text>
            <Text testID="loading-tip" style={styles.tip}>
              {t(tipKey)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: mentaColors.canvas,
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 40,
    },
    progress: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    },
    markShell: {
      aspectRatio: 1,
      maxWidth: 200,
      width: '100%',
    },
    mark: {
      height: '100%',
      width: '100%',
    },
    copy: {
      alignItems: 'center',
      gap: 8,
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
  return { styles };
};
