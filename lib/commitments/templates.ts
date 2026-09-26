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

const buildCommitmentTemplates = (locale: string): CommitmentTemplate[] => [
  {
    id: 'move_daily',
    title: translate(locale, 'domain.commitment.move_daily'),
    hubTitle: translate(locale, 'domain.commitment.move_daily'),
    description: translate(locale, 'domain.commitment.move_daily_description'),
    promise: translate(locale, 'domain.commitment.move_daily_promise'),
    category: translate(locale, 'domain.commitment.fitness'),
    durationDays: 14,
    difficulty: 'medium',
    verificationType: 'photo',
    verificationDescription: translate(
      locale,
      'domain.commitment.move_daily_verification'
    ),
    submissionText: translate(
      locale,
      'domain.commitment.move_daily_submission'
    ),
    commitmentLevel: 'steady',
    groupNameSuggestion: translate(
      locale,
      'domain.commitment.daily_movement_group'
    ),
  },
  {
    id: 'study_block',
    title: translate(locale, 'domain.commitment.focused_study'),
    hubTitle: translate(locale, 'domain.commitment.focused_study'),
    description: translate(
      locale,
      'domain.commitment.focused_study_description'
    ),
    promise: translate(locale, 'domain.commitment.focused_study_promise'),
    category: translate(locale, 'domain.commitment.learning'),
    durationDays: 14,
    difficulty: 'medium',
    verificationType: 'text',
    verificationDescription: translate(
      locale,
      'domain.commitment.focused_study_verification'
    ),
    submissionText: translate(
      locale,
      'domain.commitment.focused_study_submission'
    ),
    commitmentLevel: 'steady',
    groupNameSuggestion: translate(locale, 'domain.commitment.focused_study'),
  },
  {
    id: 'morning_walk',
    title: translate(locale, 'domain.commitment.morning_walk'),
    hubTitle: translate(locale, 'domain.commitment.morning_walk'),
    description: translate(
      locale,
      'domain.commitment.morning_walk_description'
    ),
    promise: translate(locale, 'domain.commitment.morning_walk_promise'),
    category: translate(locale, 'domain.commitment.health'),
    durationDays: 7,
    difficulty: 'easy',
    verificationType: 'photo',
    verificationDescription: translate(
      locale,
      'domain.commitment.morning_walk_verification'
    ),
    submissionText: translate(
      locale,
      'domain.commitment.morning_walk_submission'
    ),
    commitmentLevel: 'light',
    groupNameSuggestion: translate(
      locale,
      'domain.commitment.morning_walk_group'
    ),
  },
  {
    id: 'sleep_reset',
    title: translate(locale, 'domain.commitment.sleep_reset'),
    hubTitle: translate(locale, 'domain.commitment.sleep_reset'),
    description: translate(locale, 'domain.commitment.sleep_reset_description'),
    promise: translate(locale, 'domain.commitment.sleep_reset_promise'),
    category: translate(locale, 'domain.commitment.health'),
    durationDays: 14,
    difficulty: 'medium',
    verificationType: 'text',
    verificationDescription: translate(
      locale,
      'domain.commitment.sleep_reset_verification'
    ),
    submissionText: translate(
      locale,
      'domain.commitment.sleep_reset_submission'
    ),
    commitmentLevel: 'steady',
    groupNameSuggestion: translate(
      locale,
      'domain.commitment.sleep_reset_group'
    ),
  },
  {
    id: 'no_sugar',
    title: translate(locale, 'domain.commitment.no_sugar'),
    hubTitle: translate(locale, 'domain.commitment.no_sugar_hub'),
    description: translate(locale, 'domain.commitment.no_sugar_description'),
    promise: translate(locale, 'domain.commitment.no_sugar_promise'),
    category: translate(locale, 'domain.commitment.health'),
    durationDays: 7,
    difficulty: 'hard',
    verificationType: 'text',
    verificationDescription: translate(
      locale,
      'domain.commitment.no_sugar_verification'
    ),
    submissionText: translate(locale, 'domain.commitment.no_sugar_submission'),
    commitmentLevel: 'strict',
    groupNameSuggestion: translate(locale, 'domain.commitment.no_sugar_group'),
  },
  {
    id: 'creative_minutes',
    title: translate(locale, 'domain.commitment.creative_minutes'),
    hubTitle: translate(locale, 'domain.commitment.creative_minutes'),
    description: translate(
      locale,
      'domain.commitment.creative_minutes_description'
    ),
    promise: translate(locale, 'domain.commitment.creative_minutes_promise'),
    category: translate(locale, 'domain.commitment.creativity'),
    durationDays: 14,
    difficulty: 'easy',
    verificationType: 'photo',
    verificationDescription: translate(
      locale,
      'domain.commitment.creative_minutes_verification'
    ),
    submissionText: translate(
      locale,
      'domain.commitment.creative_minutes_submission'
    ),
    commitmentLevel: 'light',
    groupNameSuggestion: translate(
      locale,
      'domain.commitment.creative_minutes_group'
    ),
  },
];

const templatesByLocale = new Map<string, CommitmentTemplate[]>();

/** Starter templates written in the person's app language. */
export const getCommitmentTemplates = (
  locale: string
): readonly CommitmentTemplate[] => {
  const cached = templatesByLocale.get(locale);
  if (cached) return cached;
  const templates = buildCommitmentTemplates(locale);
  templatesByLocale.set(locale, templates);
  return templates;
};

export const resolveCommitmentTemplate = (
  value: string | string[] | undefined,
  locale: string
): CommitmentTemplate | null => {
  const normalized = Array.isArray(value) ? value[0] : value;
  return (
    getCommitmentTemplates(locale).find(
      template => template.id === normalized
    ) ?? null
  );
};
