import {
  type MentaPalette,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppScaledText as Text } from '@/components/ui/AppScaledText';

const TAIL_SIZE = 14;

/**
 * Menta's speech bubble from the onboarding screens. Use it only where the
 * mascot orients the person (an empty Today, a return after time away), and
 * keep the line to one short question or prompt.
 *
 * Promotion candidate for a shared `AppMascotBubble` primitive.
 */
export function TodaySpeechBubble({
  text,
  testID,
}: {
  text: string;
  testID?: string;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  return (
    <View style={styles.wrap} testID={testID}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.tail}
      />
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    wrap: {
      alignItems: 'center',
      alignSelf: 'center',
      maxWidth: mentaLayout.readingMeasure,
    },
    bubble: {
      backgroundColor: mentaColors.raised,
      borderColor: mentaColors.border,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      paddingHorizontal: mentaSpacing[5],
      paddingVertical: mentaSpacing[4],
    },
    text: {
      ...mentaTypography.bodyMedium,
      color: mentaColors.text.primary,
      textAlign: 'center',
    },
    tail: {
      backgroundColor: mentaColors.raised,
      borderBottomColor: mentaColors.border,
      borderBottomWidth: 1,
      borderRightColor: mentaColors.border,
      borderRightWidth: 1,
      height: TAIL_SIZE,
      marginTop: -TAIL_SIZE / 2,
      transform: [{ rotate: '45deg' }],
      width: TAIL_SIZE,
    },
  });
  return { styles };
};
