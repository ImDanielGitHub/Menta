import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ImageIcon, RefreshCwIcon } from '@/components/ui/icons';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization';

/** Fills the media frame, including callers sized only by aspect ratio. */
export const ImagePlaceholder = ({
  label,
  state = 'loading',
  onPress,
}: {
  label: string;
  state?: 'loading' | 'error' | 'idle';
  onPress?: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [compact, setCompact] = useState(true);
  const [showCue, setShowCue] = useState(state !== 'loading');

  useEffect(() => {
    if (state !== 'loading') {
      setShowCue(true);
      return;
    }
    setShowCue(false);
    // Cached images normally display before this, avoiding a loading flash.
    const timer = setTimeout(() => setShowCue(true), 150);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <Pressable
      accessible
      accessibilityLabel={
        state === 'error' && onPress
          ? `${label}. ${t('shared.action.tryAgain')}`
          : label
      }
      accessibilityRole={onPress ? 'button' : 'progressbar'}
      accessibilityState={{ busy: state === 'loading' }}
      onPress={
        onPress
          ? event => {
              event.stopPropagation();
              onPress();
            }
          : undefined
      }
      onLayout={event =>
        setCompact(
          Math.min(
            event.nativeEvent.layout.width,
            event.nativeEvent.layout.height
          ) < 112
        )
      }
      style={[
        StyleSheet.absoluteFill,
        styles.frame,
        { backgroundColor: theme.colors.background.secondary },
      ]}
    >
      {showCue && state === 'loading' ? (
        <SkeletonLoader
          announce={false}
          style={[StyleSheet.absoluteFill, styles.mediaSkeleton]}
        />
      ) : null}
      {showCue ? (
        <View pointerEvents="none" style={styles.cue}>
          {state === 'error' ? (
            <RefreshCwIcon
              size={compact ? 20 : 28}
              color={theme.colors.text.secondary}
            />
          ) : (
            <ImageIcon
              size={compact ? 22 : 32}
              color={theme.colors.text.secondary}
            />
          )}
          {!compact ? (
            <Text
              style={[styles.label, { color: theme.colors.text.secondary }]}
            >
              {label}
            </Text>
          ) : null}
          {!compact && state === 'error' && onPress ? (
            <Text
              style={[
                styles.label,
                { color: theme.colors.interactive.primary },
              ]}
            >
              {t('shared.action.tryAgain')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cue: { alignItems: 'center', gap: 10, padding: 8 },
  // Override the text skeleton's default 20-point height explicitly.
  mediaSkeleton: { width: '100%', height: '100%', borderRadius: 0 },
  label: { fontSize: 13, lineHeight: 18, textAlign: 'center', flexShrink: 1 },
});
