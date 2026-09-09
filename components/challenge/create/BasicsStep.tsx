import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AppOptionCard } from '@/components/ui/AppChoice';
import { StandardTextInputRef } from '@/components/ui/StandardTextInput';
import CreationTextInput from '@/components/creation/shared/CreationTextInput';
import type { ThemeContextType } from '@/constants/ThemeContext';
import type {
  CategoryOption,
  CreateChallengeFormData,
  CreateStep,
  FieldUpdater,
  StepStyles,
} from './types';
import { useTranslation } from '@/lib/localization';

interface BasicsStepProps {
  step: CreateStep;
  variant: 'basics' | 'category';
  showHeader?: boolean;
  styles: StepStyles;
  colors: ThemeContextType['colors'];
  formData: CreateChallengeFormData;
  categories: CategoryOption[];
  updateField: FieldUpdater;
  titleInputRef: React.RefObject<StandardTextInputRef | null>;
  descriptionInputRef: React.RefObject<StandardTextInputRef | null>;
}

export function BasicsStep({
  step,
  variant,
  showHeader = true,
  styles,
  colors,
  formData,
  categories,
  updateField,
  titleInputRef,
  descriptionInputRef,
}: BasicsStepProps) {
  const { t } = useTranslation();
  if (variant === 'basics') {
    return (
      <View style={showHeader ? styles.stepContainer : styles.stepSubsection}>
        {showHeader ? (
          <>
            <View style={styles.stepIcon}>{step.icon}</View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          </>
        ) : null}

        <CreationTextInput
          ref={titleInputRef}
          label={t('todayProof.create.promise_label')}
          required
          placeholder={t('todayProof.create.title_placeholder')}
          placeholderTextColor={colors.text.placeholder}
          value={formData.title}
          onChangeText={value => updateField('title', value)}
          autoCapitalize="words"
          maxLength={100}
          nextInputRef={descriptionInputRef}
          helperText={t('todayProof.create.title_helper')}
          counterText={`${formData.title.length}/100`}
          fieldStyle={styles.inputGroup}
        />

        <CreationTextInput
          ref={descriptionInputRef}
          label={t('todayProof.create.what_counts')}
          required
          placeholder={t('todayProof.create.description_placeholder')}
          placeholderTextColor={colors.text.placeholder}
          value={formData.description}
          onChangeText={value => updateField('description', value)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
          helperText={t('todayProof.create.description_helper')}
          counterText={`${formData.description.length}/500`}
          fieldStyle={styles.inputGroup}
        />
      </View>
    );
  }

  const content = (
    <>
      {showHeader ? (
        <View style={styles.stepHeader}>
          <View style={styles.stepIcon}>{step.icon}</View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        </View>
      ) : null}

      <View style={styles.categoryGridContainer}>
        {categories.map(category => {
          const isSelected = formData.category === category.id;
          const CategoryIcon = category.icon;
          return (
            <View key={category.id} style={styles.categoryGridItem}>
              <AppOptionCard
                title={category.name}
                description={category.description}
                selected={isSelected}
                onPress={() => updateField('category', category.id)}
                icon={
                  <View style={styles.categoryEmoji}>
                    <CategoryIcon
                      size={28}
                      color={
                        isSelected ? colors.text.primary : colors.text.secondary
                      }
                    />
                  </View>
                }
                style={styles.categoryCard}
              />
            </View>
          );
        })}
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
