import React from 'react';
import { Text, View, ScrollView } from 'react-native';
import { AppChoiceChip, AppOptionCard } from '@/components/ui/AppChoice';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppSwitchRow } from '@/components/ui/AppFields';
import { StandardTextInputRef } from '@/components/ui/StandardTextInput';
import CreationTextInput from '@/components/creation/shared/CreationTextInput';
import type { ThemeContextType } from '@/constants/ThemeContext';
import type {
  ChallengeDifficulty,
  CreateChallengeFormData,
  CreateStep,
  DifficultyOption,
  FieldUpdater,
  StepStyles,
} from './types';
import { useTranslation } from '@/lib/localization';

interface TypeGuideline {
  target: number;
  grace: number;
}

interface SettingsStepProps {
  step: CreateStep;
  variant: 'duration' | 'difficulty' | 'privacy';
  showHeader?: boolean;
  styles: StepStyles;
  colors: ThemeContextType['colors'];
  theme: Pick<ThemeContextType, 'spacing'>;
  formData: CreateChallengeFormData;
  updateField: FieldUpdater;
  durationInputRef: React.RefObject<StandardTextInputRef | null>;
  difficultyOptions: DifficultyOption[];
  typeGuidelines: Record<ChallengeDifficulty, TypeGuideline>;
  estimateCompletionReward: (days: number) => number;
}

const COMMON_DURATIONS = [7, 14, 21, 30, 60, 90];

export function SettingsStep({
  step,
  variant,
  showHeader = true,
  styles,
  colors,
  theme,
  formData,
  updateField,
  durationInputRef,
  difficultyOptions,
  typeGuidelines,
  estimateCompletionReward,
}: SettingsStepProps) {
  const { t } = useTranslation();
  if (variant === 'duration') {
    const durationDays = parseInt(formData.duration, 10);
    const isDurationInvalid = durationDays > 365;

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
          <Text style={styles.inputLabel}>
            {t('todayProof.residual.how_many_days_should_this_last')}
          </Text>
          <Text style={[styles.inputHint, { marginBottom: theme.spacing.md }]}>
            {t(
              'todayProof.residual.choose_a_length_you_can_realistically_finish'
            )}
          </Text>
          <View style={styles.durationOptions}>
            {COMMON_DURATIONS.map(days => (
              <AppChoiceChip
                key={days}
                label={`${days}d`}
                selected={formData.duration === days.toString()}
                onPress={() => updateField('duration', days.toString())}
              />
            ))}
          </View>
          <CreationTextInput
            ref={durationInputRef}
            label={t('todayProof.residual.custom_window')}
            required
            placeholder={t(
              'todayProof.residual.or_enter_your_own_number_of_days'
            )}
            placeholderTextColor={colors.text.placeholder}
            value={formData.duration}
            onChangeText={value => updateField('duration', value)}
            keyboardType="numeric"
            maxLength={3}
            dismissKeyboardOnSubmit={true}
            returnKeyType="done"
            helperText={
              isDurationInvalid
                ? t('todayProof.residual.duration_must_be_365_days_or_less')
                : t('todayProof.residual.use_1_365_days')
            }
            errorText={
              isDurationInvalid
                ? t('todayProof.residual.duration_must_be_365_days_or_less')
                : undefined
            }
            fieldStyle={{ marginTop: theme.spacing.md }}
            inputContainerStyle={[
              styles.customDurationInput,
              isDurationInvalid && {
                borderColor: colors.status.error,
                borderWidth: 1,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  if (variant === 'difficulty') {
    const rewardEstimate = estimateCompletionReward(
      parseInt(formData.duration, 10)
    );
    const content = (
      <>
        {showHeader ? (
          <View style={styles.stepHeader}>
            <View style={styles.stepIcon}>{step.icon}</View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          </View>
        ) : null}

        <View style={{ width: '100%' }}>
          <AppInlineNotice
            title={t(
              'todayProof.residual.choose_how_strict_the_schedule_should_be'
            )}
            description={t(
              'todayProof.residual.the_options_change_the_target_and_the_number_of_missed_days_allo'
            )}
          />
          <View style={styles.difficultyGridContainer}>
            {difficultyOptions.map(difficulty => {
              const isSelected = formData.difficulty === difficulty.id;
              const guide = typeGuidelines[difficulty.id];
              const graceText =
                guide.grace === 1
                  ? '1 missed day allowed'
                  : `${guide.grace} missed days allowed`;
              const DifficultyIcon = difficulty.icon;

              return (
                <View key={difficulty.id} style={styles.difficultyGridItem}>
                  <AppOptionCard
                    title={difficulty.name}
                    description={`${difficulty.description}\n\n${difficulty.expectation}`}
                    selected={isSelected}
                    onPress={() => updateField('difficulty', difficulty.id)}
                    icon={
                      <View style={styles.difficultyEmoji}>
                        <DifficultyIcon
                          size={24}
                          color={
                            isSelected
                              ? colors.text.primary
                              : colors.text.secondary
                          }
                        />
                      </View>
                    }
                    style={styles.difficultyCard}
                  >
                    <View style={styles.difficultyMetaRow}>
                      <Text style={styles.difficultyMetaItem}>
                        {t('todayProof.residual.proof_target')}{' '}
                        {Math.round(guide.target * 100)}%
                      </Text>
                      <Text style={styles.difficultyMetaItem}>{graceText}</Text>
                    </View>
                    <Text style={styles.difficultyPoints} numberOfLines={2}>
                      {t('todayProof.residual.reward_summary', {
                        reward: rewardEstimate,
                      })}
                    </Text>
                  </AppOptionCard>
                </View>
              );
            })}
          </View>
          <Text style={styles.inputHint}>
            {t(
              'todayProof.residual.you_can_change_this_later_if_the_schedule_no_longer_works_for_yo'
            )}
          </Text>
        </View>
      </>
    );

    if (showHeader) {
      return (
        <ScrollView
          style={styles.stepScrollView}
          contentContainerStyle={styles.stepScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      );
    }

    return <View style={{ width: '100%' }}>{content}</View>;
  }

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
        <View
          style={[
            styles.toggleContainer,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.primary,
              borderWidth: 1,
              borderRadius: 18,
            },
          ]}
        >
          <AppSwitchRow
            title={t('todayProof.residual.let_other_people_find_this_promise')}
            subtitle={
              formData.allowSelfReview
                ? t(
                    'todayProof.residual.people_can_find_and_join_it_each_person_s_proof_counts_when_they'
                  )
                : t(
                    'todayProof.residual.people_outside_the_group_can_find_and_join_this_promise'
                  )
            }
            value={formData.isPublic}
            onChange={value => updateField('isPublic', value)}
            showDivider={false}
          />
        </View>
      </View>
    </View>
  );
}
