import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import {
  getOnboardingAuthPaperState,
  type OnboardingAuthPaperStateId,
} from '@/lib/paper-state-registry/onboarding-auth';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

type OnboardingAuthFamilyGalleryProps = {
  stateId: OnboardingAuthPaperStateId;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
};

/** A deterministic review surface for the ten live Paper continuation states. */
export const OnboardingAuthFamilyGallery: React.FC<
  OnboardingAuthFamilyGalleryProps
> = ({ stateId, onPrimaryAction, onSecondaryAction }) => {
  const state = getOnboardingAuthPaperState(stateId);

  return (
    <View style={styles.screen} testID={`onboarding-auth-gallery-${state.id}`}>
      <Text style={styles.eyebrow}>{state.id.replace('-', ' · ')}</Text>
      <Text style={styles.title}>{state.title}</Text>
      <Text style={styles.detail}>{state.detail}</Text>
      <Text style={styles.authority}>Evidence: {state.authority}</Text>

      {state.primaryAction && onPrimaryAction ? (
        <AppButton
          fullWidth
          size="large"
          style={styles.primaryAction}
          title={state.primaryAction}
          onPress={onPrimaryAction}
        />
      ) : null}
      {state.secondaryAction && onSecondaryAction ? (
        <AppButton
          fullWidth
          size="small"
          title={state.secondaryAction}
          variant="ghost"
          onPress={onSecondaryAction}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    backgroundColor: mentaColors.canvas,
    flex: 1,
    gap: mentaSpacing[3],
    maxWidth: mentaLayout.focusedLane,
    padding: mentaSpacing[6],
    width: '100%',
  },
  eyebrow: {
    color: mentaColors.action,
    textTransform: 'uppercase',
    ...mentaTypography.labelBold,
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.heading,
  },
  detail: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  authority: {
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.medium,
    borderWidth: 1,
    color: mentaColors.text.secondary,
    paddingHorizontal: mentaSpacing[3],
    paddingVertical: mentaSpacing[2],
    ...mentaTypography.caption,
  },
  primaryAction: {
    marginTop: mentaSpacing[3],
    minHeight: 52,
  },
});
