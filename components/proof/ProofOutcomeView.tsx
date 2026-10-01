import {
  type MentaPalette,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';
import { Share2Icon } from '@/components/ui/icons';
import { MentaMascot, type MascotState } from '@/components/ui/MentaMascot';
import { SignedImage } from '@/components/ui/SignedImage';

import { useTranslation } from '@/lib/localization';
import type { ProofChecker } from '@/lib/proof/proof-roles';
import type { ProofMediaType } from '@/lib/proof-types';

type Translate = ReturnType<typeof useTranslation>['t'];

export type ProofOutcomeStatus = 'accepted' | 'pending-review';

/** Heading and expectation after sending, by who checks it (C01–C03). */
export const getProofOutcomeCopy = (
  status: ProofOutcomeStatus,
  checker: ProofChecker,
  t: Translate
): { title: string; detail: string } => {
  if (status === 'accepted') {
    return {
      title: t('proofRoles.outcome.counted.title'),
      detail:
        checker.kind === 'self'
          ? t('proofRoles.outcome.counted.self')
          : t('proofRoles.outcome.counted.other'),
    };
  }

  switch (checker.kind) {
    case 'person':
      return {
        title: t('proofRoles.outcome.person.title', { name: checker.name }),
        detail: t('proofRoles.outcome.person.detail', { name: checker.name }),
      };
    case 'people':
      return {
        title: t('proofRoles.outcome.people.title'),
        detail: t('proofRoles.outcome.people.detail'),
      };
    case 'group':
      return {
        title: t('proofRoles.outcome.group.title', {
          group: checker.groupName,
        }),
        detail: t('proofRoles.outcome.group.detail'),
      };
    case 'menta':
      return {
        title: t('proofRoles.outcome.menta.title'),
        detail: t('proofRoles.outcome.menta.detail'),
      };
    case 'self':
    case 'unknown':
      return {
        title: t('proofRoles.outcome.unknown.title'),
        detail: t('proofRoles.outcome.unknown.detail'),
      };
  }
};

const outcomeMascot = (
  status: ProofOutcomeStatus,
  checker: ProofChecker
): MascotState => {
  if (status === 'accepted') return 'today-accepted';
  if (checker.kind === 'menta') return 'menta-check';
  if (checker.kind === 'group') return 'together';
  return 'today-review-wait';
};

const formatSentTime = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

type ProofOutcomeViewProps = {
  status: ProofOutcomeStatus;
  checker: ProofChecker;
  /** A route-supplied fact, e.g. today's proof was already sent. */
  detailOverride?: string | null;
  /** Changes once per confirmed success so confetti plays exactly once. */
  celebrationKey?: string | null;
  proofType: ProofMediaType;
  mediaUri?: string | null;
  sentAt?: string | null;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  shareActionLabel?: string;
  onShareAction?: () => void;
  onReportIssue?: () => void;
  actionsDisabled?: boolean;
  notices?: React.ReactNode;
};

/**
 * The moment after sending proof. Confetti only plays for a server-confirmed
 * count; a proof that is waiting names who checks it and what happens next.
 */
export function ProofOutcomeView({
  status,
  checker,
  detailOverride = null,
  celebrationKey,
  proofType,
  mediaUri,
  sentAt,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  shareActionLabel,
  onShareAction,
  onReportIssue,
  actionsDisabled = false,
  notices,
}: ProofOutcomeViewProps) {
  const mentaColors = useMentaPalette();
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const copy = getProofOutcomeCopy(status, checker, t);
  const counted = status === 'accepted';
  const sentTime = formatSentTime(sentAt);
  const proofLabel =
    proofType === 'photo'
      ? t('proofRoles.outcome.your_photo')
      : proofType === 'video'
        ? t('proofRoles.outcome.your_video')
        : t('proofRoles.outcome.your_note');

  return (
    <View
      style={styles.root}
      testID={counted ? 'proof-outcome-counted' : 'proof-outcome-waiting'}
    >
      {counted && celebrationKey ? (
        <ConfettiBurst key={celebrationKey} testID="proof-outcome-confetti" />
      ) : null}

      <View
        style={styles.hero}
        accessibilityRole="summary"
        accessibilityLiveRegion="polite"
      >
        <MentaMascot state={outcomeMascot(status, checker)} size="xl" />
        <Text style={styles.title} accessibilityRole="header">
          {copy.title}
        </Text>
        <Text style={styles.detail}>{detailOverride ?? copy.detail}</Text>
      </View>

      {notices}

      <View style={styles.proofRow} testID="proof-outcome-row">
        {proofType === 'photo' && mediaUri ? (
          <SignedImage
            uri={mediaUri}
            style={styles.thumbnail}
            alt={proofLabel}
            variant="preview"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailEmpty]} />
        )}
        <View style={styles.proofCopy}>
          <Text style={styles.proofTitle}>{proofLabel}</Text>
          {sentTime ? (
            <Text style={styles.proofMeta}>
              {t('proofRoles.outcome.sent_at', { time: sentTime })}
            </Text>
          ) : null}
        </View>
        <Text
          style={[styles.statusText, counted ? styles.statusTextCounted : null]}
        >
          {counted
            ? t('proofRoles.outcome.counted.status')
            : t('proofRoles.outcome.waiting.status')}
        </Text>
      </View>

      <View style={styles.actions}>
        {primaryActionLabel && onPrimaryAction ? (
          <AppButton
            title={primaryActionLabel}
            onPress={onPrimaryAction}
            disabled={actionsDisabled}
            size="large"
            fullWidth
          />
        ) : null}
        {secondaryActionLabel && onSecondaryAction ? (
          <AppButton
            title={secondaryActionLabel}
            onPress={onSecondaryAction}
            disabled={actionsDisabled}
            variant="secondary"
            size="large"
            fullWidth
          />
        ) : null}
        {shareActionLabel && onShareAction ? (
          <AppButton
            title={shareActionLabel}
            onPress={onShareAction}
            disabled={actionsDisabled}
            variant="ghost"
            size="large"
            fullWidth
            icon={<Share2Icon size={17} color={mentaColors.text.secondary} />}
          />
        ) : null}
        {onReportIssue ? (
          <AppButton
            title={t('todayProof.proof.report_issue')}
            onPress={onReportIssue}
            variant="ghost"
            size="small"
          />
        ) : null}
      </View>
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    root: {
      width: '100%',
      gap: mentaSpacing[6],
      paddingBottom: mentaSpacing[8],
    },
    hero: {
      alignItems: 'center',
      gap: mentaSpacing[3],
      paddingTop: mentaSpacing[8],
    },
    title: {
      ...mentaTypography.display,
      color: mentaColors.text.primary,
      textAlign: 'center',
    },
    detail: {
      ...mentaTypography.lead,
      color: mentaColors.text.secondary,
      textAlign: 'center',
      maxWidth: 340,
    },
    proofRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mentaSpacing[3] + 2,
      padding: mentaSpacing[3] + 2,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      borderColor: mentaColors.border,
      backgroundColor: mentaColors.surface,
    },
    thumbnail: {
      width: 56,
      height: 56,
      borderRadius: mentaRadii.medium,
      backgroundColor: mentaColors.raised,
      overflow: 'hidden',
    },
    thumbnailEmpty: {
      borderWidth: 1,
      borderColor: mentaColors.border,
    },
    proofCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    proofTitle: {
      ...mentaTypography.bodySemibold,
      color: mentaColors.text.primary,
    },
    proofMeta: {
      ...mentaTypography.caption,
      color: mentaColors.text.secondary,
    },
    statusText: {
      ...mentaTypography.bodySmallMedium,
      color: mentaColors.text.secondary,
      flexShrink: 0,
    },
    statusTextCounted: {
      color: mentaColors.success,
    },
    actions: {
      gap: mentaSpacing[2],
      paddingTop: mentaSpacing[4],
    },
  });
  return { styles };
};
