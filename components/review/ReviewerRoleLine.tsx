import {
  type MentaPalette,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTranslation } from '@/lib/localization';
import type { ReviewerStance } from '@/lib/proof/proof-roles';

type Translate = ReturnType<typeof useTranslation>['t'];

/** What the viewer is responsible for on someone else's proof (R01, R02, U01). */
export const getReviewerRoleCopy = (
  stance: ReviewerStance,
  submitterName: string,
  t: Translate
): string | null => {
  switch (stance.kind) {
    case 'reviewer':
      return t('proofRoles.review.reviewer', { name: submitterName });
    case 'partner':
      return t('proofRoles.review.partner', { name: submitterName });
    case 'group':
      return t('proofRoles.review.group', {
        group: stance.groupName,
        name: submitterName,
      });
    case 'supporter':
      return t('proofRoles.review.supporter', { name: submitterName });
    case 'unknown':
      return null;
  }
};

/**
 * Reviewers decide whether proof counts; supporters only cheer. This line
 * says which job the viewer has before they see the decision buttons. It is
 * plain prose on the canvas, not a badge or a tinted callout.
 */
export function ReviewerRoleLine({
  stance,
  submitterName,
}: {
  stance: ReviewerStance;
  submitterName: string;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const copy = getReviewerRoleCopy(stance, submitterName, t);
  if (!copy) return null;

  return (
    <Text style={styles.copy} testID={`review-role-${stance.kind}`}>
      {copy}
    </Text>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    copy: {
      ...mentaTypography.body,
      color: mentaColors.text.primary,
    },
  });
  return { styles };
};
