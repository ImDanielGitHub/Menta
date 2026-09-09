import type {
  ChallengeDifficulty,
  ChallengeVerificationType,
} from '@/components/challenge/create/types';
import { translate } from '@/lib/localization';

export type CommitmentTemplateId =
  | 'move_daily'
  | 'study_block'
  | 'morning_walk'
  | 'sleep_reset'
  | 'no_sugar'
  | 'creative_minutes';

export type CommitmentTemplate = {
  id: CommitmentTemplateId;
  title: string;
  hubTitle: string;
  description: string;
  promise: string;
  category: string;
  durationDays: number;
  difficulty: ChallengeDifficulty;
  verificationType: ChallengeVerificationType;
  verificationDescription: string;
  submissionText: string;
  commitmentLevel: 'light' | 'steady' | 'strict';
  groupNameSuggestion: string;
};

export const DEFAULT_COMMITMENT_TEMPLATE_ID: CommitmentTemplateId =
  'move_daily';

export const commitmentTemplates: CommitmentTemplate[] = [
  {
    id: 'move_daily',
    title: translate('en-NZ', 'domain.commitment.move_daily'),
    hubTitle: translate('en-NZ', 'domain.commitment.move_daily'),
    description: translate('en-NZ', 'domain.commitment.move_daily_description'),
    promise: translate('en-NZ', 'domain.commitment.move_daily_promise'),
    category: translate('en-NZ', 'domain.commitment.fitness'),
    durationDays: 14,
    difficulty: 'medium',
    verificationType: 'photo',
    verificationDescription: translate(
      'en-NZ',
      'domain.commitment.move_daily_verification'
    ),
    submissionText: translate(
      'en-NZ',
      'domain.commitment.move_daily_submission'
    ),
    commitmentLevel: 'steady',
    groupNameSuggestion: translate(
      'en-NZ',
      'domain.commitment.daily_movement_group'
    ),
  },
  {
    id: 'study_block',
    title: translate('en-NZ', 'domain.commitment.focused_study'),
    hubTitle: translate('en-NZ', 'domain.commitment.focused_study'),
    description: translate(
      'en-NZ',
      'domain.commitment.focused_study_description'
    ),
    promise: translate('en-NZ', 'domain.commitment.focused_study_promise'),
    category: translate('en-NZ', 'domain.commitment.learning'),
    durationDays: 14,
    difficulty: 'medium',
    verificationType: 'text',
    verificationDescription: translate(
      'en-NZ',
      'domain.commitment.focused_study_verification'
    ),
    submissionText: translate(
      'en-NZ',
      'domain.commitment.focused_study_submission'
    ),
    commitmentLevel: 'steady',
    groupNameSuggestion: translate('en-NZ', 'domain.commitment.focused_study'),
  },
  {
    id: 'morning_walk',
    title: translate('en-NZ', 'domain.commitment.morning_walk'),
    hubTitle: translate('en-NZ', 'domain.commitment.morning_walk'),
    description: translate(
      'en-NZ',
      'domain.commitment.morning_walk_description'
    ),
    promise: translate('en-NZ', 'domain.commitment.morning_walk_promise'),
    category: translate('en-NZ', 'domain.commitment.health'),
    durationDays: 7,
    difficulty: 'easy',
    verificationType: 'photo',
    verificationDescription: translate(
      'en-NZ',
      'domain.commitment.morning_walk_verification'
    ),
    submissionText: translate(
      'en-NZ',
      'domain.commitment.morning_walk_submission'
    ),
    commitmentLevel: 'light',
    groupNameSuggestion: translate(
      'en-NZ',
      'domain.commitment.morning_walk_group'
    ),
  },
  {
    id: 'sleep_reset',
    title: translate('en-NZ', 'domain.commitment.sleep_reset'),
    hubTitle: translate('en-NZ', 'domain.commitment.sleep_reset'),
    description: translate(
      'en-NZ',
      'domain.commitment.sleep_reset_description'
    ),
    promise: translate('en-NZ', 'domain.commitment.sleep_reset_promise'),
    category: translate('en-NZ', 'domain.commitment.health'),
    durationDays: 14,
    difficulty: 'medium',
    verificationType: 'text',
    verificationDescription: translate(
      'en-NZ',
      'domain.commitment.sleep_reset_verification'
    ),
    submissionText: translate(
      'en-NZ',
      'domain.commitment.sleep_reset_submission'
    ),
    commitmentLevel: 'steady',
    groupNameSuggestion: translate(
      'en-NZ',
      'domain.commitment.sleep_reset_group'
    ),
  },
  {
    id: 'no_sugar',
    title: translate('en-NZ', 'domain.commitment.no_sugar'),
    hubTitle: translate('en-NZ', 'domain.commitment.no_sugar_hub'),
    description: translate('en-NZ', 'domain.commitment.no_sugar_description'),
    promise: translate('en-NZ', 'domain.commitment.no_sugar_promise'),
    category: translate('en-NZ', 'domain.commitment.health'),
    durationDays: 7,
    difficulty: 'hard',
    verificationType: 'text',
    verificationDescription: translate(
      'en-NZ',
      'domain.commitment.no_sugar_verification'
    ),
    submissionText: translate('en-NZ', 'domain.commitment.no_sugar_submission'),
    commitmentLevel: 'strict',
    groupNameSuggestion: translate('en-NZ', 'domain.commitment.no_sugar_group'),
  },
  {
    id: 'creative_minutes',
    title: translate('en-NZ', 'domain.commitment.creative_minutes'),
    hubTitle: translate('en-NZ', 'domain.commitment.creative_minutes'),
    description: translate(
      'en-NZ',
      'domain.commitment.creative_minutes_description'
    ),
    promise: translate('en-NZ', 'domain.commitment.creative_minutes_promise'),
    category: translate('en-NZ', 'domain.commitment.creativity'),
    durationDays: 14,
    difficulty: 'easy',
    verificationType: 'photo',
    verificationDescription: translate(
      'en-NZ',
      'domain.commitment.creative_minutes_verification'
    ),
    submissionText: translate(
      'en-NZ',
      'domain.commitment.creative_minutes_submission'
    ),
    commitmentLevel: 'light',
    groupNameSuggestion: translate(
      'en-NZ',
      'domain.commitment.creative_minutes_group'
    ),
  },
];

export const resolveCommitmentTemplate = (
  value: string | string[] | undefined
): CommitmentTemplate | null => {
  const normalized = Array.isArray(value) ? value[0] : value;
  return (
    commitmentTemplates.find(template => template.id === normalized) ?? null
  );
};

export const getDefaultCommitmentTemplate = (): CommitmentTemplate =>
  commitmentTemplates.find(
    template => template.id === DEFAULT_COMMITMENT_TEMPLATE_ID
  ) ?? commitmentTemplates[0];
