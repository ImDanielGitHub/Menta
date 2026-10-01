import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { MentaMascot, type MascotState } from '@/components/ui/MentaMascot';

import { mentaFonts } from '@/lib/menta-fonts';
import { MOTION_DISTANCES, MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';

type MentaNarratorProps = {
  state: MascotState;
  message: string;
  /**
   * A second, quieter line under the typed message, shown once Menta has
   * finished saying it. Menta Check verdicts use it for the reason or tip.
   */
  detail?: string | null;
  /**
   * `inline` puts a small mascot beside the bubble for question steps.
   * `stacked` centres the bubble over a larger mascot for orientation steps.
   */
  layout?: 'inline' | 'stacked';
  mascotSize?: number;
  testID?: string;
};

const INLINE_MASCOT = 128;
const STACKED_MASCOT = 240;
const BUBBLE_DELAY_MS = 90;
const TYPE_START_MS = 160;
const TYPE_TICK_MS = 24;
const TYPE_CHARS_PER_TICK = 2;

/**
 * Reveals the bubble copy like Menta is saying it. The full sentence is laid
 * out from the first frame (unrevealed characters are transparent) so the
 * bubble never grows while typing, and assistive tech reads it immediately.
 */
const useTypedLength = (message: string, instant: boolean): number => {
  const [length, setLength] = useState(instant ? message.length : 0);

  useEffect(() => {
    if (instant) {
      setLength(message.length);
      return undefined;
    }
    setLength(0);
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setLength(current => {
          const next = Math.min(message.length, current + TYPE_CHARS_PER_TICK);
          if (next >= message.length && interval) clearInterval(interval);
          return next;
        });
      }, TYPE_TICK_MS);
    }, TYPE_START_MS);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [instant, message]);

  return length;
};

/**
 * Menta speaks the step's question in a bubble, the way a guide would, so the
 * screen does not need a separate heading and helper paragraph.
 *
 * The artwork stays a still PNG. Only the container plays one short entrance
 * phrase, and Reduce Motion turns that into an immediate, static render.
 */
export function MentaNarrator({
  state,
  message,
  layout = 'inline',
  mascotSize,
  detail = null,
  testID = 'onboarding-narrator',
}: MentaNarratorProps) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const motion = useMotionPreferences();
  const typedLength = useTypedLength(
    message,
    motion.reduceMotion || motion.screenReaderEnabled
  );
  const mascotProgress = useRef(new Animated.Value(0)).current;
  const bubbleProgress = useRef(new Animated.Value(0)).current;
  const speaking = useRef(new Animated.Value(0)).current;
  const isSpeaking = typedLength < message.length;
  const detailProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!detail) return undefined;
    if (isSpeaking) {
      detailProgress.setValue(0);
      return undefined;
    }
    const reveal = Animated.timing(detailProgress, {
      duration: motion.duration(MOTION_DURATIONS.state),
      toValue: 1,
      useNativeDriver: true,
    });
    reveal.start();
    return () => reveal.stop();
  }, [detail, detailProgress, isSpeaking, motion]);

  // A small nod while the line is being "said", then stillness. It is tied to
  // the typing phrase, so it ends with the sentence and never idles.
  useEffect(() => {
    if (!isSpeaking || !motion.allowsTransform) {
      Animated.timing(speaking, {
        duration: motion.duration(MOTION_DURATIONS.fast),
        toValue: 0,
        useNativeDriver: true,
      }).start();
      return undefined;
    }
    const nod = Animated.loop(
      Animated.sequence([
        Animated.timing(speaking, {
          duration: 160,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(speaking, {
          duration: 160,
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );
    nod.start();
    return () => nod.stop();
  }, [isSpeaking, motion, speaking]);

  useEffect(() => {
    mascotProgress.setValue(0);
    bubbleProgress.setValue(0);
    const entrance = Animated.parallel([
      Animated.timing(mascotProgress, {
        duration: motion.duration(MOTION_DURATIONS.screen),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleProgress, {
        delay: motion.reduceMotion ? 0 : BUBBLE_DELAY_MS,
        duration: motion.duration(MOTION_DURATIONS.state),
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [bubbleProgress, mascotProgress, message, motion]);

  const rise = (progress: Animated.Value) => ({
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [motion.distance(MOTION_DISTANCES.sm), 0],
        }),
      },
    ],
  });

  const stacked = layout === 'stacked';
  const size = mascotSize ?? (stacked ? STACKED_MASCOT : INLINE_MASCOT);

  const bubble = (
    <Animated.View
      style={[
        styles.bubble,
        stacked ? styles.bubbleStacked : styles.bubbleInline,
        rise(bubbleProgress),
      ]}
      testID={`${testID}-bubble`}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.tail, stacked ? styles.tailBelow : styles.tailLeft]}
      />
      <Text
        accessibilityLabel={detail ? `${message} ${detail}` : message}
        accessibilityRole="header"
        style={[
          styles.message,
          stacked && styles.messageStacked,
          detail ? styles.messageVerdict : null,
        ]}
        testID={`${testID}-text`}
      >
        {message.slice(0, typedLength)}
        <Text style={styles.untyped}>{message.slice(typedLength)}</Text>
      </Text>
      {detail ? (
        <Animated.Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.detail,
            stacked && styles.detailStacked,
            { opacity: detailProgress },
          ]}
          testID={`${testID}-detail`}
        >
          {detail}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );

  const mascot = (
    <Animated.View
      style={[
        { width: size, height: size },
        !stacked && styles.inlineMascot,
        rise(mascotProgress),
      ]}
      testID={`${testID}-mascot`}
    >
      <Animated.View
        style={{
          transform: [
            {
              translateY: speaking.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -3],
              }),
            },
            {
              scale: speaking.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.015],
              }),
            },
          ],
        }}
      >
        <MentaMascot
          state={state}
          size="md"
          style={{ width: size, height: size }}
        />
      </Animated.View>
    </Animated.View>
  );

  if (stacked) {
    return (
      <View style={styles.stacked} testID={testID}>
        {bubble}
        {mascot}
      </View>
    );
  }

  return (
    <View style={styles.inline} testID={testID}>
      {mascot}
      {bubble}
    </View>
  );
}

const TAIL = 14;

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    inline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mentaSpacing[3],
      marginLeft: -mentaSpacing[2],
    },
    inlineMascot: {
      marginVertical: -mentaSpacing[3],
    },
    stacked: {
      alignItems: 'center',
      gap: mentaSpacing[4],
    },
    bubble: {
      backgroundColor: mentaColors.raised,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.large + 2,
      borderWidth: 1.5,
      paddingHorizontal: mentaSpacing[4] + 2,
      paddingVertical: mentaSpacing[4],
    },
    bubbleInline: {
      flex: 1,
      minWidth: 0,
    },
    bubbleStacked: {
      maxWidth: 340,
    },
    tail: {
      position: 'absolute',
      width: TAIL,
      height: TAIL,
      backgroundColor: mentaColors.raised,
      borderColor: mentaColors.border,
      transform: [{ rotate: '45deg' }],
    },
    tailLeft: {
      left: -TAIL / 2 - 1,
      top: '50%',
      marginTop: -TAIL / 2,
      borderLeftWidth: 1.5,
      borderBottomWidth: 1.5,
    },
    tailBelow: {
      bottom: -TAIL / 2 - 1,
      left: '50%',
      marginLeft: -TAIL / 2,
      borderRightWidth: 1.5,
      borderBottomWidth: 1.5,
    },
    message: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.inter.medium,
      fontSize: 18,
      lineHeight: 25,
    },
    untyped: {
      color: 'transparent',
    },
    messageVerdict: {
      fontFamily: mentaFonts.inter.semibold,
      fontSize: 21,
      lineHeight: 27,
    },
    detail: {
      color: mentaColors.text.secondary,
      fontFamily: mentaFonts.inter.regular,
      fontSize: 15,
      lineHeight: 21,
      marginTop: mentaSpacing[1] + 2,
    },
    detailStacked: {
      textAlign: 'center',
    },
    messageStacked: {
      fontSize: 19,
      lineHeight: 27,
      textAlign: 'center',
    },
  });
  return { styles };
};
