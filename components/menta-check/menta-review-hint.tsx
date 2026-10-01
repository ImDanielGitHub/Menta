import { useMentaPalette } from '@/constants/use-menta-palette';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { getMentaReviewHint } from '@/lib/menta-check/api';
import { useAuthStore } from '@/store/auth-store';
import { useTranslation } from '@/lib/localization';
import { mentaTypography } from '@/constants/MentaDesignSystem';

export function MentaReviewHint({ submissionId }: { submissionId: string }) {
  const mentaColors = useMentaPalette();

  const owner = useAuthStore(state => state.user?.id);
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ['menta-check', owner, 'hint', submissionId],
    queryFn: () => getMentaReviewHint(submissionId),
    enabled: Boolean(owner),
    staleTime: 15_000,
  });
  return query.data ? (
    <Text
      style={{
        ...mentaTypography.bodySmall,
        color: mentaColors.text.secondary,
      }}
      testID="menta-review-hint"
    >
      {t(
        query.data === 'matches'
          ? 'mentaCheck.hint.matches'
          : 'mentaCheck.hint.unsure'
      )}
    </Text>
  ) : null;
}
