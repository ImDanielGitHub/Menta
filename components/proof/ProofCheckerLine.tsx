import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { SignedImage } from '@/components/ui/SignedImage';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization';
import type { ProofChecker } from '@/lib/proof/proof-roles';

type Translate = ReturnType<typeof useTranslation>['t'];

/** Copy for the send screen: who checks it and where it goes (S01–S04). */
export const getProofSendCopy = (
  checker: ProofChecker,
  t: Translate
): { title: string; detail: string; hint: string } | null => {
  switch (checker.kind) {
    case 'self':
      return {
        title: t('proofRoles.send.self.title'),
        detail: t('proofRoles.send.self.detail'),
        hint: t('proofRoles.send.self.hint'),
      };
    case 'person':
      return {
        title: t('proofRoles.send.person.title', { name: checker.name }),
        detail: t('proofRoles.send.person.detail', { name: checker.name }),
        hint: t('proofRoles.send.person.hint', { name: checker.name }),
      };
    case 'people':
      return {
        title: t('proofRoles.send.people.title'),
        detail: t('proofRoles.send.people.detail'),
        hint: t('proofRoles.send.people.hint'),
      };
    case 'group':
      return {
        title: t('proofRoles.send.group.title'),
        detail: t('proofRoles.send.group.detail', {
          group: checker.groupName,
        }),
        hint: t('proofRoles.send.group.hint', { group: checker.groupName }),
      };
    case 'menta':
      return {
        title: t('proofRoles.send.menta.title'),
        detail: t('proofRoles.send.menta.detail'),
        hint: t('proofRoles.send.menta.hint'),
      };
    case 'unknown':
      return null;
  }
};

const MENTA_CHECK_MARK = require('@/assets/images/mascot/roles/reviewer.png');

const initialOf = (value: string): string =>
  value.trim().charAt(0).toLocaleUpperCase() || '?';

/**
 * Only a real face or Menta itself earns a mark. Self-check, the group and
 * several reviewers read as plain text rather than a generic badge.
 */
function CheckerMark({ checker }: { checker: ProofChecker }) {
  const { styles } = useMentaStyles(createPaletteStyles);

  if (checker.kind === 'menta') {
    return (
      <View style={[styles.mark, styles.mentaMark]}>
        <Image
          source={MENTA_CHECK_MARK}
          style={styles.mentaImage}
          resizeMode="contain"
        />
      </View>
    );
  }
  if (checker.kind !== 'person') return null;
  if (checker.avatarUrl) {
    return (
      <SignedImage
        uri={checker.avatarUrl}
        style={styles.mark}
        alt={checker.name}
        variant="preview"
      />
    );
  }
  return (
    <View style={[styles.mark, styles.personMark]}>
      <Text style={styles.markText}>{initialOf(checker.name)}</Text>
    </View>
  );
}

/**
 * Tells the person sending proof who decides whether it counts, before they
 * hold to send. Supporters are never named here: they cheer, they don't check.
 */
export function ProofCheckerLine({
  checker,
  testID = 'proof-checker-line',
}: {
  checker: ProofChecker;
  testID?: string;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const detailLines = useLargeTypeLineLimit(3);
  const copy = getProofSendCopy(checker, t);
  if (!copy) return null;

  return (
    <View style={styles.row} testID={testID} accessible>
      <CheckerMark checker={checker} />
      <View style={styles.copy}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.detail} numberOfLines={detailLines}>
          {copy.detail}
        </Text>
      </View>
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    row: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: mentaSpacing[3] + 2,
    },
    mark: {
      width: 44,
      height: 44,
      borderRadius: mentaRadii.round,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    },
    personMark: {
      backgroundColor: mentaColors.raised,
    },
    mentaMark: {
      backgroundColor: mentaColors.actionSoft,
    },
    mentaImage: {
      width: 40,
      height: 40,
      marginTop: 6,
    },
    markText: {
      ...mentaTypography.control,
      color: mentaColors.action,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: mentaSpacing[1],
    },
    title: {
      ...mentaTypography.control,
      color: mentaColors.text.primary,
    },
    detail: {
      ...mentaTypography.bodySmall,
      color: mentaColors.text.secondary,
    },
  });
  return { styles };
};
