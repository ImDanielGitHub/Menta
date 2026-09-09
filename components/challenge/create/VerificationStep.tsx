import React from 'react';
import { Text, View } from 'react-native';
import { AppOptionCard } from '@/components/ui/AppChoice';
import { StandardTextInputRef } from '@/components/ui/StandardTextInput';
import CreationTextInput from '@/components/creation/shared/CreationTextInput';
import type { ThemeContextType } from '@/constants/ThemeContext';
import type {
  CreateChallengeFormData,
  CreateStep,
  FieldUpdater,
  StepStyles,
  VerificationOption,
} from './types';
import { useTranslation } from '@/lib/localization';

interface VerificationStepProps {
  step: CreateStep;
  showHeader?: boolean;
  styles: StepStyles;
  colors: ThemeContextType['colors'];
  formData: CreateChallengeFormData;
  verificationTypes: VerificationOption[];
  updateField: FieldUpdater;
  verificationDescInputRef: React.RefObject<StandardTextInputRef | null>;
  submissionTextInputRef: React.RefObject<StandardTextInputRef | null>;
}

export function VerificationStep({
  step,
  showHeader = true,
  styles,
  colors,
  formData,
  verificationTypes,
  updateField,
  verificationDescInputRef,
  submissionTextInputRef,
}: VerificationStepProps) {
  const { t } = useTranslation();
  return (
    <View style={showHeader ? styles.stepContainer : styles.stepSubsection}>
      {showHeader ? (
        <>
          <View style={styles.stepIcon}>{step.icon}</View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        </>
      ) : null}

      <View style={styles.inputGroup}>
        <View style={styles.verificationGrid}>
          {verificationTypes.map(type => (
            <AppOptionCard
              key={type.id}
              title={type.name}
              description={type.description}
              selected={formData.verificationType === type.id}
              onPress={() => updateField('verificationType', type.id)}
              icon={React.createElement(type.icon, {
                size: 24,
                color:
                  formData.verificationType === type.id
                    ? colors.primary
                    : colors.text.secondary,
              })}
              style={styles.verificationOption}
            />
          ))}
        </View>
      </View>

      {formData.verificationType !== 'none' ? (
        <CreationTextInput
          ref={verificationDescInputRef}
          label={t('todayProof.create.proof_rule_label')}
          required
          placeholder={t('todayProof.create.proof_rule_placeholder')}
          placeholderTextColor={colors.text.placeholder}
          value={formData.verificationDescription}
          onChangeText={value => updateField('verificationDescription', value)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={300}
          nextInputRef={submissionTextInputRef}
          returnKeyType="next"
          helperText={
            formData.allowSelfReview
              ? t('todayProof.create.self_review_rule')
              : t('todayProof.create.group_review_rule')
          }
          counterText={`${formData.verificationDescription.length}/300`}
          fieldStyle={styles.inputGroup}
        />
      ) : null}

      <CreationTextInput
        ref={submissionTextInputRef}
        label={t('todayProof.create.prompt_optional')}
        placeholder={t('todayProof.create.prompt_placeholder')}
        placeholderTextColor={colors.text.placeholder}
        value={formData.submissionText}
        onChangeText={value => updateField('submissionText', value)}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        maxLength={200}
        dismissKeyboardOnSubmit={true}
        returnKeyType="done"
        helperText={t('todayProof.create.prompt_helper')}
        counterText={`${formData.submissionText.length}/200`}
        fieldStyle={styles.inputGroup}
      />
    </View>
  );
}
