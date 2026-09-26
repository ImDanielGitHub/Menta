import type { ChallengeDifficulty } from '@/components/challenge/create/types';
import { translate } from '@/lib/localization';

export type CreateIntensityCopy = {
  id: ChallengeDifficulty;
  label: string;
  note: string;
  points: number;
  maxExtensions: number;
};

export const getCreateIntensityShopNote = (locale: string): string =>
  translate(locale, 'domain.intensity.shop_note');

export const listCreateIntensityOptions = (
  locale: string
): CreateIntensityCopy[] => [
  {
    id: 'easy',
    label: translate(locale, 'domain.intensity.flexible'),
    note: translate(locale, 'domain.intensity.flexible_note'),
    points: 100,
    maxExtensions: 3,
  },
  {
    id: 'medium',
    label: translate(locale, 'domain.intensity.standard'),
    note: translate(locale, 'domain.intensity.standard_note'),
    points: 200,
    maxExtensions: 2,
  },
  {
    id: 'hard',
    label: translate(locale, 'domain.intensity.fixed'),
    note: translate(locale, 'domain.intensity.fixed_note'),
    points: 500,
    maxExtensions: 0,
  },
];
