import type { ChallengeDifficulty } from '@/components/challenge/create/types';
import { translate } from '@/lib/localization';

export type CreateIntensityCopy = {
  id: ChallengeDifficulty;
  label: string;
  note: string;
  points: number;
  maxExtensions: number;
};

export const CREATE_INTENSITY_SHOP_NOTE = translate(
  'en-NZ',
  'domain.intensity.shop_note'
);

const INTENSITY_COPY: Record<ChallengeDifficulty, CreateIntensityCopy> = {
  easy: {
    id: 'easy',
    label: translate('en-NZ', 'domain.intensity.flexible'),
    note: translate('en-NZ', 'domain.intensity.flexible_note'),
    points: 100,
    maxExtensions: 3,
  },
  medium: {
    id: 'medium',
    label: translate('en-NZ', 'domain.intensity.standard'),
    note: translate('en-NZ', 'domain.intensity.standard_note'),
    points: 200,
    maxExtensions: 2,
  },
  hard: {
    id: 'hard',
    label: translate('en-NZ', 'domain.intensity.fixed'),
    note: translate('en-NZ', 'domain.intensity.fixed_note'),
    points: 500,
    maxExtensions: 0,
  },
};

export const listCreateIntensityOptions = (): CreateIntensityCopy[] => [
  INTENSITY_COPY.easy,
  INTENSITY_COPY.medium,
  INTENSITY_COPY.hard,
];
