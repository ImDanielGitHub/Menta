import type React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeVerificationType = 'photo' | 'video' | 'text' | 'none';

export interface CreateChallengeFormData {
  selectedGroupId: string | null;
  allowSelfReview: boolean;
  title: string;
  description: string;
  category: string;
  duration: string;
  difficulty: ChallengeDifficulty;
  isPublic: boolean;
  verificationType: ChallengeVerificationType;
  verificationFrequency: 'daily' | 'weekly' | 'custom';
  verificationDescription: string;
  submissionText: string;
  allowExtensions: boolean;
  maxExtensions: number;
  deadlineType: 'fixed' | 'flexible' | 'rolling';
}

export interface GroupPolicy {
  target: number;
  graceDays: number;
}

export interface GroupOption {
  id: string;
  name: string;
  description?: string | null;
  duration_days?: number | null;
}

export interface CategoryOption {
  id: string;
  name: string;
  color: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  description: string;
}

export interface DifficultyOption {
  id: ChallengeDifficulty;
  name: string;
  points: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  description: string;
  expectation: string;
  color: string;
}

export interface VerificationOption {
  id: ChallengeVerificationType;
  name: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  description: string;
}

export interface CreateStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

// These styles are shared across both <View /> and <Text /> elements in the
// setup flow. The intersection keeps the values assignable to either style prop,
// while StyleProp still allows arrays and registered styles from StyleSheet.
type StepStyleValue = StyleProp<ViewStyle> & StyleProp<TextStyle>;

export interface StepStyles {
  stepContainer: StepStyleValue;
  stepSubsection: StepStyleValue;
  stepHeader: StepStyleValue;
  stepIcon: StepStyleValue;
  stepTitle: StepStyleValue;
  stepSubtitle: StepStyleValue;
  stepScrollView: StepStyleValue;
  stepScrollContent: StepStyleValue;
  inputGroup: StepStyleValue;
  inputLabel: StepStyleValue;
  inputHint: StepStyleValue;
  input: StepStyleValue;
  textArea: StepStyleValue;
  customDurationInput: StepStyleValue;
  durationOptions: StepStyleValue;
  durationOption: StepStyleValue;
  durationOptionSelected: StepStyleValue;
  durationOptionText: StepStyleValue;
  durationOptionTextSelected: StepStyleValue;
  categoryGridContainer: StepStyleValue;
  categoryGridItem: StepStyleValue;
  categoryCard: StepStyleValue;
  categoryEmoji: StepStyleValue;
  categoryCardName: StepStyleValue;
  categoryCardDescription: StepStyleValue;
  selectedBadge: StepStyleValue;
  difficultyGridContainer: StepStyleValue;
  difficultyGridItem: StepStyleValue;
  difficultyCard: StepStyleValue;
  difficultyEmoji: StepStyleValue;
  difficultyCardName: StepStyleValue;
  difficultyExpectation: StepStyleValue;
  difficultyDescription: StepStyleValue;
  difficultyMetaRow: StepStyleValue;
  difficultyMetaItem: StepStyleValue;
  difficultyPoints: StepStyleValue;
  intensityGuideCard: StepStyleValue;
  intensityGuideTitle: StepStyleValue;
  intensityGuideText: StepStyleValue;
  verificationGrid: StepStyleValue;
  verificationOption: StepStyleValue;
  verificationOptionSelected: StepStyleValue;
  verificationName: StepStyleValue;
  verificationDescription: StepStyleValue;
  groupGrid: StepStyleValue;
  groupOption: StepStyleValue;
  groupOptionSelected: StepStyleValue;
  groupName: StepStyleValue;
  groupDescription: StepStyleValue;
  loadingContainer: StepStyleValue;
  loadingText: StepStyleValue;
  noGroupsContainer: StepStyleValue;
  noGroupsTitle: StepStyleValue;
  noGroupsText: StepStyleValue;
  infoCard: StepStyleValue;
  infoText: StepStyleValue;
  policyCard: StepStyleValue;
  policyHeader: StepStyleValue;
  policyTitle: StepStyleValue;
  policyBadges: StepStyleValue;
  policyBadgeItem: StepStyleValue;
  policyBadgeLabel: StepStyleValue;
  policyDescription: StepStyleValue;
  policyRow: StepStyleValue;
  policyText: StepStyleValue;
  toggleContainer: StepStyleValue;
  toggleIconText: StepStyleValue;
  toggleText: StepStyleValue;
  toggleDescription: StepStyleValue;
  reviewContainer: StepStyleValue;
  reviewSection: StepStyleValue;
  reviewSectionTitle: StepStyleValue;
  reviewItem: StepStyleValue;
  reviewLabel: StepStyleValue;
  reviewValue: StepStyleValue;
  launchCard: StepStyleValue;
  launchTopRow: StepStyleValue;
  launchTitle: StepStyleValue;
  launchDescription: StepStyleValue;
  launchPills: StepStyleValue;
  launchPill: StepStyleValue;
  launchPillText: StepStyleValue;
  launchDivider: StepStyleValue;
  launchRows: StepStyleValue;
  launchRow: StepStyleValue;
  launchRowCopy: StepStyleValue;
  launchRowLabel: StepStyleValue;
  launchRowValue: StepStyleValue;
  launchEdit: StepStyleValue;
}

export type ReviewEditTarget =
  | number
  | {
      stepIndex: number;
      detailsSubstep?: 'details' | 'configuration';
    };

export type FieldUpdater = <K extends keyof CreateChallengeFormData>(
  field: K,
  value: CreateChallengeFormData[K]
) => void;
