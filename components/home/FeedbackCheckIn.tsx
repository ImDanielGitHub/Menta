import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

/** Product feedback only: both answers open feedback, never a rating request. */
export function FeedbackCheckIn({
  visible,
  onAnswer,
  onClose,
}: {
  visible: boolean;
  onAnswer: (answer: 'positive' | 'improve') => void;
  onClose: () => void;
}) {
  return (
    <ModalCard
      visible={visible}
      onClose={onClose}
      surface="sheet"
      accessibilityLabel="How is Menta going?"
      testID="feedback-check-in"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <MentaMascot state="welcome-back" size="lg" style={styles.mascot} />
        <Text accessibilityRole="header" style={styles.heading}>
          Are you enjoying Menta?
        </Text>
        <Text style={styles.body}>
          Tell us what works for you or what could be better.
        </Text>
        <View style={styles.actions}>
          <AppButton
            title="Yes, it's working for me"
            variant="accent"
            fullWidth
            onPress={() => onAnswer('positive')}
          />
          <AppButton
            title="Something could be better"
            variant="secondary"
            fullWidth
            onPress={() => onAnswer('improve')}
          />
          <AppButton
            title="Not now"
            variant="ghost"
            fullWidth
            onPress={onClose}
          />
        </View>
      </ScrollView>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  content: { gap: mentaSpacing[4], padding: mentaSpacing[6] },
  mascot: { alignSelf: 'center' },
  heading: { ...mentaTypography.heading, color: mentaColors.text.primary },
  body: { ...mentaTypography.body, color: mentaColors.text.secondary },
  actions: { gap: mentaSpacing[2], paddingTop: mentaSpacing[2] },
});
