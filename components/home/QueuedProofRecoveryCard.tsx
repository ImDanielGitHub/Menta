import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertCircleIcon, RefreshCwIcon } from '@/components/ui/icons';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import type { QueuedProofSubmission } from '@/lib/services/proof-submission-service';
import {
  useTranslation,
  type TranslationKey,
  type TranslationValues,
} from '@/lib/localization';

type QueuedProofRecoveryCardProps = {
  queuedProofs: QueuedProofSubmission[];
  getTitle: (queuedProof: QueuedProofSubmission) => string;
  onRetry: () => void;
  processing?: boolean;
  loading?: boolean;
};

type Translate = (key: TranslationKey, values?: TranslationValues) => string;

const formatQueuedProofTime = (
  sendRequestedAt: string,
  locale: string,
  t: Translate
) => {
  const requestedDate = new Date(sendRequestedAt);
  if (Number.isNaN(requestedDate.getTime())) {
    return t('proofRecovery.queued.time.waiting');
  }

  return t('proofRecovery.queued.time.requested', {
    time: new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(requestedDate),
  });
};

const getProofTypeLabel = (
  proofType: QueuedProofSubmission['proofType'],
  t: Translate
): string => {
  switch (proofType) {
    case 'photo':
      return t('proofRecovery.queued.type.photo');
    case 'video':
      return t('proofRecovery.queued.type.video');
    case 'text':
      return t('proofRecovery.queued.type.text');
    default:
      return t('proofRecovery.queued.type.saved');
  }
};

export const QueuedProofRecoveryCard: React.FC<
  QueuedProofRecoveryCardProps
> = ({
  queuedProofs,
  getTitle,
  onRetry,
  processing = false,
  loading = false,
}) => {
  const theme = useTheme();
  const { locale, t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const visibleProofs = queuedProofs.slice(0, 2);
  const hiddenProofCount = Math.max(
    queuedProofs.length - visibleProofs.length,
    0
  );

  if (!queuedProofs.length) return null;

  return (
    <View
      style={styles.card}
      accessibilityLabel={t('proofRecovery.queued.accessibility')}
      testID="queued-proof-recovery-card"
    >
      <View style={styles.header}>
        <View style={styles.icon}>
          <AlertCircleIcon size={17} color={theme.colors.feedback.warning} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{t('proofRecovery.queued.title')}</Text>
          <Text style={styles.description}>
            {t('proofRecovery.queued.description')}
          </Text>
        </View>
      </View>

      {visibleProofs.map(queuedProof => (
        <View key={queuedProof.id} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {getTitle(queuedProof)}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {t('proofRecovery.queued.meta', {
                type: getProofTypeLabel(queuedProof.proofType, t),
                time: formatQueuedProofTime(
                  queuedProof.sendRequestedAt,
                  locale,
                  t
                ),
              })}
            </Text>
            {queuedProof.lastError ? (
              <Text style={styles.rowError} numberOfLines={2}>
                {t('proofRecovery.queued.last_try_failed')}
              </Text>
            ) : null}
          </View>
          <Text style={styles.badge}>{t('proofRecovery.queued.not_sent')}</Text>
        </View>
      ))}

      {hiddenProofCount > 0 ? (
        <Text style={styles.description}>
          {t('proofRecovery.queued.more_waiting', {
            count: hiddenProofCount,
          })}
        </Text>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('proofRecovery.queued.retry_accessibility')}
        activeOpacity={0.86}
        disabled={processing}
        onPress={onRetry}
        style={[styles.button, processing ? styles.buttonDisabled : null]}
      >
        {processing ? (
          <ActivityIndicator size="small" color={theme.colors.text.inverse} />
        ) : (
          <RefreshCwIcon size={15} color={theme.colors.text.inverse} />
        )}
        <Text style={styles.buttonText}>
          {processing
            ? t('proofRecovery.queued.sending')
            : t('proofRecovery.queued.retry')}
        </Text>
      </TouchableOpacity>

      {loading ? (
        <Text style={styles.description}>
          {t('proofRecovery.queued.checking')}
        </Text>
      ) : null}
    </View>
  );
};

const createStyles = (theme: ThemeContextType) => {
  const { colors, spacing, borderRadius, typography } = theme;

  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colors.feedback.warning,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.background.surface,
      padding: spacing.md,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.feedback.warning}1A`,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    title: {
      color: colors.text.primary,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
    },
    description: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      lineHeight: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border.secondary,
      paddingTop: spacing.sm,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      color: colors.text.primary,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
    },
    rowMeta: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      marginTop: 2,
    },
    rowError: {
      color: colors.feedback.error,
      fontSize: typography.sizes.xs,
      lineHeight: 17,
      marginTop: 2,
    },
    badge: {
      color: colors.feedback.warning,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      textTransform: 'uppercase',
    },
    button: {
      minHeight: 46,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.text.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    buttonDisabled: {
      opacity: 0.72,
    },
    buttonText: {
      color: colors.text.inverse,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
    },
  });
};

export default QueuedProofRecoveryCard;
