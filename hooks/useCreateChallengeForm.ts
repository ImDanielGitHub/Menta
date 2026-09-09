import { useCallback, useState } from 'react';
import type {
  ChallengeVerificationType,
  CreateChallengeFormData,
} from '@/components/challenge/create/types';
import { useTranslation } from '@/lib/localization/use-translation';

interface UseCreateChallengeFormOptions {
  initialGroupId: string | null;
  initialMode: 'solo' | 'group';
}

const createInitialFormData = (
  options: UseCreateChallengeFormOptions
): CreateChallengeFormData => ({
  selectedGroupId: options.initialGroupId,
  allowSelfReview: options.initialMode === 'solo',
  title: '',
  description: '',
  category: 'fitness',
  duration: '30',
  difficulty: 'medium',
  isPublic: true,
  verificationType: 'photo',
  verificationFrequency: 'daily',
  verificationDescription: '',
  submissionText: '',
  allowExtensions: true,
  maxExtensions: 2,
  deadlineType: 'fixed',
});

type DescriptionType = 'photo' | 'video' | 'written' | 'none';
type DescriptionTranslator = (
  t: ReturnType<typeof useTranslation>['t']
) => string;

const defaultDescriptions: Record<
  string,
  Record<DescriptionType, DescriptionTranslator>
> = {
  fitness: {
    photo: t => t('domain.challenge.proof_default.fitness.photo'),
    video: t => t('domain.challenge.proof_default.fitness.video'),
    written: t => t('domain.challenge.proof_default.fitness.text'),
    none: t => t('domain.challenge.proof_default.fitness.none'),
  },
  mindfulness: {
    photo: t => t('domain.challenge.proof_default.mindfulness.photo'),
    video: t => t('domain.challenge.proof_default.mindfulness.video'),
    written: t => t('domain.challenge.proof_default.mindfulness.text'),
    none: t => t('domain.challenge.proof_default.mindfulness.none'),
  },
  learning: {
    photo: t => t('domain.challenge.proof_default.learning.photo'),
    video: t => t('domain.challenge.proof_default.learning.video'),
    written: t => t('domain.challenge.proof_default.learning.text'),
    none: t => t('domain.challenge.proof_default.learning.none'),
  },
  productivity: {
    photo: t => t('domain.challenge.proof_default.productivity.photo'),
    video: t => t('domain.challenge.proof_default.productivity.video'),
    written: t => t('domain.challenge.proof_default.productivity.text'),
    none: t => t('domain.challenge.proof_default.productivity.none'),
  },
  health: {
    photo: t => t('domain.challenge.proof_default.health.photo'),
    video: t => t('domain.challenge.proof_default.health.video'),
    written: t => t('domain.challenge.proof_default.health.text'),
    none: t => t('domain.challenge.proof_default.health.none'),
  },
  creativity: {
    photo: t => t('domain.challenge.proof_default.creativity.photo'),
    video: t => t('domain.challenge.proof_default.creativity.video'),
    written: t => t('domain.challenge.proof_default.creativity.text'),
    none: t => t('domain.challenge.proof_default.creativity.none'),
  },
  social: {
    photo: t => t('domain.challenge.proof_default.social.photo'),
    video: t => t('domain.challenge.proof_default.social.video'),
    written: t => t('domain.challenge.proof_default.social.text'),
    none: t => t('domain.challenge.proof_default.social.none'),
  },
};

const fallbackDescriptions: Record<DescriptionType, DescriptionTranslator> = {
  photo: t => t('domain.challenge.proof_default.fallback.photo'),
  video: t => t('domain.challenge.proof_default.fallback.video'),
  written: t => t('domain.challenge.proof_default.fallback.text'),
  none: t => t('domain.challenge.proof_default.fallback.none'),
};

export const useCreateChallengeForm = (
  options: UseCreateChallengeFormOptions
) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateChallengeFormData>(() =>
    createInitialFormData(options)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    <K extends keyof CreateChallengeFormData>(
      field: K,
      value: CreateChallengeFormData[K]
    ) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
      if (errors.general) {
        setErrors(prev => ({ ...prev, general: '' }));
      }
    },
    [errors]
  );

  const canProceed = useCallback(
    (step: number) => {
      const duration = parseInt(formData.duration, 10);

      switch (step) {
        case 0:
          return formData.selectedGroupId !== null || formData.allowSelfReview;
        case 1:
          return (
            formData.title.trim().length >= 3 &&
            formData.description.trim().length >= 10 &&
            duration >= 1 &&
            duration <= 365
          );
        case 2:
          return (
            formData.verificationType === 'none' ||
            formData.verificationDescription.trim().length > 0
          );
        default:
          return false;
      }
    },
    [formData]
  );

  const getDefaultVerificationDescription = useCallback(
    (verificationType: ChallengeVerificationType, category: string) => {
      const descriptionType: DescriptionType =
        verificationType === 'text' ? 'written' : verificationType;
      const categoryDefault = defaultDescriptions[category]?.[descriptionType];
      return (categoryDefault ?? fallbackDescriptions[descriptionType])(t);
    },
    [t]
  );

  const updateVerificationDefaults = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      verificationDescription: getDefaultVerificationDescription(
        prev.verificationType,
        prev.category
      ),
    }));
  }, [getDefaultVerificationDescription]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    updateField,
    canProceed,
    getDefaultVerificationDescription,
    updateVerificationDefaults,
  };
};
