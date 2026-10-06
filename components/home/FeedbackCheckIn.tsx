import {
  type MentaPalette,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
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
import { getFeedbackCheckInCopy } from '@/lib/feedback/check-in-copy';
import { useTranslation } from '@/lib/localization';

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
  const { styles } = useMentaStyles(createPaletteStyles);

  useEffect(() => {
    // React Native only provides Modal.onDismiss on iOS. On Android wait for
    // the committed closed state and interactions before continuing.
    if (visible || Platform.OS === 'ios') return;
    const task = InteractionManager.runAfterInteractions(onDismiss);
    return () => task.cancel();
  }, [onDismiss, visible]);

  const { t } = useTranslation();
  const copy = getFeedbackCheckInCopy(t);
  return (
    <ModalCard
      visible={visible}
      onClose={onClose}
      onDismiss={onDismiss}
      surface="sheet"
      accessibilityLabel={copy.accessibilityLabel}
      testID="feedback-check-in"
    >
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <MentaMascot
          state="feedback-listening"
          size="xl"
          style={styles.mascot}
        />
        <Text accessibilityRole="header" style={styles.heading}>
          {copy.heading}
        </Text>
        <Text style={styles.body}>{copy.body}</Text>
        <View style={styles.actions}>
          <AppButton
            title={copy.working}
            accessibilityHint="Requests the native app rating prompt"
            variant="accent"
            size="large"
            fullWidth
            onPress={() => onAnswer('positive')}
          />
          <AppButton
            title={copy.better}
            variant="secondary"
            size="large"
            fullWidth
            onPress={() => onAnswer('improve')}
          />
          <AppButton
            title={copy.notNow}
            variant="ghost"
            fullWidth
            onPress={onClose}
          />
        </View>
      </ScrollView>
    </ModalCard>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
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
  return { styles };
};
