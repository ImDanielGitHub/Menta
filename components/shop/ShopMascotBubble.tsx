import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MentaMascot, type MascotState } from '@/components/ui/MentaMascot';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

type ShopMascotBubbleProps = {
  message: string;
  state?: MascotState;
  testID?: string;
};

/**
 * Onboarding's orientation pattern: the mascot beside a speech bubble that
 * says the one thing the person needs at this point. Use only at an
 * orientation point or a real state change, never as filler.
 * Candidate for promotion next to `MentaMascot`.
 */
export function ShopMascotBubble({
  message,
  state = 'empty-guide',
  testID = 'shop-mascot-bubble',
}: ShopMascotBubbleProps) {
  return (
    <View style={styles.row} testID={testID}>
      <MentaMascot state={state} size="sm" style={styles.mascot} />
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Text accessibilityRole="text" style={styles.message}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  mascot: {
    flexShrink: 0,
  },
  bubble: {
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
  },
  tail: {
    backgroundColor: mentaColors.raised,
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftColor: mentaColors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    height: 12,
    left: -6,
    position: 'absolute',
    top: '50%',
    marginTop: -6,
    transform: [{ rotate: '45deg' }],
    width: 12,
  },
  message: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySmallMedium,
  },
});
