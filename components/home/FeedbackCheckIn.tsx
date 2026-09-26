import React, { useEffect } from 'react';
import {
  InteractionManager,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

/** Close our sheet before handing off to StoreKit or the feedback form. */
export function FeedbackCheckIn({
  visible,
  onAnswer,
  onClose,
  onDismiss,
}: {
  visible: boolean;
  onAnswer: (answer: 'positive' | 'improve') => void;
  onClose: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    // React Native only provides Modal.onDismiss on iOS. On Android wait for
    // the committed closed state and interactions before continuing.
    if (visible || Platform.OS === 'ios') return;
    const task = InteractionManager.runAfterInteractions(onDismiss);
    return () => task.cancel();
  }, [onDismiss, visible]);

  return (
    <ModalCard
      visible={visible}
      onClose={onClose}
      onDismiss={onDismiss}
      surface="sheet"
      accessibilityLabel="How is Menta going?"
      testID="feedback-check-in"
    >
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <MentaMascot state="welcome-back" size="xl" style={styles.mascot} />
        <Text accessibilityRole="header" style={styles.heading}>
          Are you enjoying Menta?
        </Text>
        <Text style={styles.body}>We’d love to hear how it’s going.</Text>
        <View style={styles.actions}>
          <AppButton
            title="Yes, I am"
            accessibilityHint="Requests the native app rating prompt"
            variant="accent"
            size="large"
            fullWidth
            onPress={() => onAnswer('positive')}
          />
          <AppButton
            title="Something could be better"
            variant="secondary"
            size="large"
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
  heading: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
    textAlign: 'center',
  },
  body: {
    ...mentaTypography.lead,
    color: mentaColors.text.secondary,
    textAlign: 'center',
  },
  actions: { gap: mentaSpacing[3], paddingTop: mentaSpacing[2] },
});
