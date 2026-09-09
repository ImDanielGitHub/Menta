import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SendIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { emitHaptic } from '@/lib/motion/haptics';
import { MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization';

export const HOLD_TO_SEND_DURATION_MS = MOTION_DURATIONS.hold;
export const HOLD_TO_SEND_PROGRESS_MARK = 0.62;

type HoldToSendButtonProps = {
  onComplete: () => void;
  disabled?: boolean;
  label?: string;
  holdingLabel?: string;
  hint?: string;
  tapAlternativeLabel?: string;
  testID?: string;
};

const shouldUseTapAlternative = (
  reduceMotion: boolean,
  screenReaderEnabled: boolean
): boolean => reduceMotion || screenReaderEnabled;

/**
 * A deliberate 1.3 second send gate. It makes accidental media submission
 * unlikely, but never makes holding the only accessible way to continue.
 *
 * This control only acknowledges submit intent. Soft contact, a midpoint
 * tick, and a rigid threshold describe the hold; the success haptic still
 * belongs to the proof receipt after the server has answered.
 */
export function HoldToSendButton({
  onComplete,
  disabled = false,
  label,
  holdingLabel,
  hint,
  tapAlternativeLabel,
  testID = 'hold-to-send-button',
}: HoldToSendButtonProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('todayProof.proof.hold_to_send');
  const resolvedHoldingLabel =
    holdingLabel ?? t('todayProof.proof.keep_holding');
  const resolvedHint = hint ?? t('todayProof.proof.release_cancel');
  const resolvedTapAlternativeLabel =
    tapAlternativeLabel ?? t('todayProof.proof.send_one_tap');
  const motion = useMotionPreferences();
  const titleLines = useLargeTypeLineLimit(1);
  const subtitleLines = useLargeTypeLineLimit(2);
  const progress = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const completedRef = useRef(false);
  const announcedProgressRef = useRef(false);
  const [holding, setHolding] = useState(false);
  const [accessibleProgress, setAccessibleProgress] = useState(0);

  const preferTap = shouldUseTapAlternative(
    motion.reduceMotion,
    motion.screenReaderEnabled
  );

  const resetHold = useCallback(() => {
    setHolding(false);
    setAccessibleProgress(0);
    announcedProgressRef.current = false;
    cancelAnimation(progress);
    progress.value = withTiming(0, {
      duration: motion.duration(MOTION_DURATIONS.fast),
      easing: Easing.out(Easing.cubic),
    });
  }, [motion, progress]);

  const finishSendIntent = useCallback(() => {
    if (completedRef.current || disabled) return;

    completedRef.current = true;
    setHolding(false);
    setAccessibleProgress(100);
    cancelAnimation(progress);
    progress.value = 1;
    onComplete();

    requestAnimationFrame(() => {
      completedRef.current = false;
      resetHold();
    });
  }, [disabled, onComplete, progress, resetHold]);

  const handleHoldComplete = useCallback(() => {
    if (completedRef.current || disabled) return;
    void emitHaptic({ type: 'hold-complete' });
    finishSendIntent();
  }, [disabled, finishSendIntent]);

  const handleCancel = useCallback(() => {
    if (completedRef.current) return;
    resetHold();
  }, [resetHold]);

  const announceProgressMark = useCallback(() => {
    if (announcedProgressRef.current) return;
    announcedProgressRef.current = true;
    void emitHaptic({ type: 'hold-tick' });
    void AccessibilityInfo.announceForAccessibility(
      t('todayProof.proof.keep_holding_sentence')
    );
  }, [t]);

  useAnimatedReaction(
    () => progress.value,
    (current, previous) => {
      if (
        current >= HOLD_TO_SEND_PROGRESS_MARK &&
        (previous ?? 0) < HOLD_TO_SEND_PROGRESS_MARK
      ) {
        runOnJS(announceProgressMark)();
      }
    },
    [announceProgressMark]
  );

  useEffect(() => {
    if (!holding || preferTap) return;

    const startedAt = Date.now();
    const interval = setInterval(() => {
      const percent = Math.min(
        100,
        Math.round(((Date.now() - startedAt) / HOLD_TO_SEND_DURATION_MS) * 100)
      );
      setAccessibleProgress(percent);
      if (percent >= HOLD_TO_SEND_PROGRESS_MARK * 100) {
        announceProgressMark();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [announceProgressMark, holding, preferTap]);

  useEffect(() => {
    return () => {
      cancelAnimation(progress);
      completedRef.current = false;
    };
  }, [progress]);

  const beginHold = useCallback(() => {
    if (disabled || preferTap || completedRef.current) return;

    completedRef.current = false;
    announcedProgressRef.current = false;
    setHolding(true);
    setAccessibleProgress(0);
    void emitHaptic({ type: 'hold-start' });
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: HOLD_TO_SEND_DURATION_MS,
      easing: Easing.linear,
    });
  }, [disabled, preferTap, progress]);

  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(HOLD_TO_SEND_DURATION_MS)
        .maxDistance(28)
        .enabled(!disabled && !preferTap)
        .onBegin(() => {
          runOnJS(beginHold)();
        })
        .onStart(() => {
          runOnJS(handleHoldComplete)();
        })
        .onFinalize((_event, success) => {
          if (!success) {
            runOnJS(handleCancel)();
          }
        }),
    [beginHold, disabled, handleCancel, handleHoldComplete, preferTap]
  );

  const fillStyle = useAnimatedStyle(() => {
    const startWidth = 56;
    const availableWidth = Math.max(startWidth, trackWidth.value - 16);
    const clampedProgress = Math.min(1, Math.max(0, progress.value));

    return {
      width: startWidth + (availableWidth - startWidth) * clampedProgress,
    };
  });

  const handleTrackLayout = useCallback(
    (event: LayoutChangeEvent) => {
      trackWidth.value = event.nativeEvent.layout.width;
    },
    [trackWidth]
  );

  const handleTapSend = useCallback(() => {
    if (disabled || completedRef.current) return;
    void emitHaptic({ type: 'hold-complete' });
    finishSendIntent();
  }, [disabled, finishSendIntent]);

  const title = preferTap
    ? t('todayProof.proof.send')
    : holding
      ? resolvedHoldingLabel
      : resolvedLabel;
  const subtitle = preferTap
    ? t('todayProof.proof.send_detail')
    : holding
      ? t('todayProof.proof.release_cancel')
      : resolvedHint;
  // The copy begins after the 72 px icon lane. Keep light copy on the dark
  // track until the violet fill physically reaches that lane, then switch to
  // ink. This avoids a low-contrast flash during the first part of the hold.
  const fillHasReachedCopy = holding && accessibleProgress >= 30;

  const track = (
    <Animated.View
      style={[styles.track, disabled ? styles.trackDisabled : null]}
      accessible={!preferTap}
      accessibilityRole={preferTap ? undefined : 'button'}
      accessibilityState={{ disabled, busy: holding }}
      accessibilityLabel={title}
      accessibilityHint={
        preferTap
          ? t('todayProof.proof.send_now')
          : t('todayProof.proof.hold_accessibility_hint')
      }
      accessibilityValue={
        preferTap
          ? undefined
          : {
              min: 0,
              max: 100,
              now: accessibleProgress,
              text: holding
                ? t('todayProof.proof.percent_held', {
                    count: accessibleProgress,
                  })
                : t('todayProof.proof.ready'),
            }
      }
      onLayout={handleTrackLayout}
      testID={testID}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, fillStyle]}
        testID={`${testID}-progress`}
      />
      <View style={styles.iconLane} accessibilityElementsHidden>
        <SendIcon size={20} color={mentaColors.canvas} />
      </View>
      <View style={styles.copy}>
        <Text
          style={[styles.title, fillHasReachedCopy ? styles.titleOnFill : null]}
          numberOfLines={titleLines}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            fillHasReachedCopy ? styles.subtitleOnFill : null,
          ]}
          numberOfLines={subtitleLines}
        >
          {subtitle}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.wrap} testID={`${testID}-wrapper`}>
      {preferTap ? (
        <Pressable
          onPress={handleTapSend}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('todayProof.proof.send')}
          accessibilityHint={t('todayProof.proof.send_now')}
          accessibilityState={{ disabled }}
        >
          {track}
        </Pressable>
      ) : (
        <GestureDetector gesture={longPress}>{track}</GestureDetector>
      )}

      <Pressable
        onPress={handleTapSend}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={resolvedTapAlternativeLabel}
        accessibilityHint={t('todayProof.proof.single_tap')}
        style={({ pressed }) => [
          styles.tapAlternative,
          pressed ? styles.tapAlternativePressed : null,
          disabled ? styles.tapAlternativeDisabled : null,
        ]}
        testID={`${testID}-tap-alternative`}
      >
        <Text style={styles.tapAlternativeText}>
          {resolvedTapAlternativeLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: mentaSpacing[2],
    alignItems: 'center',
  },
  track: {
    width: '100%',
    minHeight: 72,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    borderColor: mentaColors.actionBorder,
    backgroundColor: mentaColors.raised,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  trackDisabled: {
    opacity: 0.45,
  },
  fill: {
    position: 'absolute',
    left: mentaSpacing[2],
    top: mentaSpacing[2],
    bottom: mentaSpacing[2],
    width: 56,
    borderRadius: mentaRadii.medium,
    backgroundColor: mentaColors.paper,
  },
  iconLane: {
    position: 'absolute',
    left: mentaSpacing[2],
    top: mentaSpacing[2],
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  copy: {
    marginLeft: 80,
    marginRight: mentaSpacing[4],
    minWidth: 0,
    gap: mentaSpacing[1],
    zIndex: 2,
  },
  title: {
    ...mentaTypography.control,
    color: mentaColors.text.primary,
  },
  titleOnFill: {
    color: mentaColors.canvas,
  },
  subtitle: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  subtitleOnFill: {
    color: mentaColors.canvas,
    opacity: 0.78,
  },
  tapAlternative: {
    minHeight: 44,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: mentaSpacing[4],
  },
  tapAlternativePressed: {
    opacity: 0.7,
  },
  tapAlternativeDisabled: {
    opacity: 0.4,
  },
  tapAlternativeText: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.text.secondary,
    textAlign: 'center',
  },
});
