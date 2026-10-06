import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Image, Platform, StyleSheet } from 'react-native';
import {
  hideNativeStartupSplash,
  resolveStartupReduceMotion,
} from '@/lib/startup-splash';
import {
  createStartupSplashHandoff,
  STARTUP_FACE_INITIAL_SCALE,
} from '@/lib/startup-splash-handoff';

const FACE = require('@/assets/images/menta-launch-face.png');
// Process lifetime, rather than route lifetime: foreground/remount never replays.
let coldStartConsumed = false;

/** Keep build 165's native artwork and size, then fade into the themed app. */
export function StartupFaceOverlay() {
  const [visible, setVisible] = useState(
    () => Platform.OS === 'ios' && !coldStartConsumed
  );
  const opacity = useRef(new Animated.Value(1)).current;
  const imageReady = useRef(false);
  const layoutReady = useRef(false);
  const handoff = useRef<ReturnType<typeof createStartupSplashHandoff> | null>(
    null
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (coldStartConsumed) {
      setVisible(false);
      return;
    }
    coldStartConsumed = true;
    if (Platform.OS !== 'ios') {
      hideNativeStartupSplash();
      return;
    }

    let mounted = true;
    const lifecycle = createStartupSplashHandoff({
      hideNative: hideNativeStartupSplash,
      isActive: () => AppState.currentState === 'active',
      onFinish: () => {
        if (mounted) setVisible(false);
      },
      animate: complete => {
        const animation = Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        });
        animation.start(complete);
        return () => animation.stop();
      },
    });
    handoff.current = lifecycle;
    if (imageReady.current) lifecycle.imageReady();
    if (layoutReady.current) lifecycle.layoutReady();
    void resolveStartupReduceMotion().then(lifecycle.preferenceReady);
    const appState = AppState.addEventListener('change', state => {
      if (state !== 'active') lifecycle.backgrounded();
    });
    return () => {
      mounted = false;
      lifecycle.dispose();
      handoff.current = null;
      appState.remove();
    };
  }, [opacity]);

  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.overlay, { opacity }]}
      onLayout={() => {
        layoutReady.current = true;
        handoff.current?.layoutReady();
      }}
      testID="startup-face-overlay"
    >
      <Animated.View
        testID="startup-face-frame"
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ scale: STARTUP_FACE_INITIAL_SCALE }] },
        ]}
      >
        <Image
          source={FACE}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          fadeDuration={0}
          accessible={false}
          onLoad={() => {
            imageReady.current = true;
            handoff.current?.imageReady();
          }}
          onError={() => handoff.current?.imageFailed()}
          testID="startup-face-image"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#080909',
    zIndex: 10000,
  },
});
