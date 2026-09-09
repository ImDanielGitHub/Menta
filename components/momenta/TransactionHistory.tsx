import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  AlertTriangleIcon,
  CalendarIcon,
  GiftIcon,
  MinusIcon,
  PlusIcon,
  RefreshCcwIcon,
  SettingsIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
} from '@/components/ui/icons';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaColors,
  mentaRadii,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { describeMomentaTransaction } from '@/lib/momenta/transaction-description';
import { useTranslation } from '@/lib/localization/use-translation';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { useAuthStore } from '@/store/auth-store';
import {
  MomentaTransaction,
  TransactionType,
  useMomentaStore,
} from '@/store/momenta-store';

export interface TransactionHistoryProps {
  transactions?: MomentaTransaction[];
  limit?: number;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void> | void;
  compact?: boolean;
  title?: string;
  subtitle?: string | null;
  showRefresh?: boolean;
  /** Let a destination-shaped parent announce a single loading region. */
  announceLoading?: boolean;
}

const formatRelativeDate = (
  dateString: string | undefined,
  locale: string,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
) => {
  if (!dateString) return t('commerce.wallet.recent');
  const value = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - value.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return t('commerce.wallet.today');
  if (diffDays === 1) return t('commerce.wallet.yesterday');
  if (diffDays < 7) return t('commerce.wallet.daysAgo', { count: diffDays });
  return value.toLocaleDateString(locale);
};

const iconForTransaction = (type: TransactionType) => {
  switch (type) {
    case 'earned':
      return PlusIcon;
    case 'bonus':
      return GiftIcon;
    case 'spent':
      return MinusIcon;
    case 'purchase':
      return ShoppingBagIcon;
    case 'adjustment':
      return SettingsIcon;
    default:
      return TrendingUpIcon;
  }
};

const amountTone = (amount: number) => {
  if (amount > 0) return 'positive';
  if (amount < 0) return 'negative';
  return 'neutral';
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions: providedTransactions,
  limit,
  loading: loadingProp,
  error: errorProp,
  onRefresh: onRefreshProp,
  compact = false,
  title = 'Activity',
  subtitle = 'Confirmed Momenta activity, newest first.',
  showRefresh = true,
  announceLoading = true,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useTranslation();
  const { user } = useAuthStore();
  const {
    transactions,
    isLoading,
    transactionHistoryError,
    fetchTransactions,
    syncWithBackend,
  } = useMomentaStore();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (providedTransactions || !user?.id) return;
    void fetchTransactions(user.id);
  }, [fetchTransactions, providedTransactions, user?.id]);

  const data = useMemo(() => {
    const source = providedTransactions ?? transactions;
    if (limit && Number.isFinite(limit)) return source.slice(0, limit);
    return source;
  }, [limit, providedTransactions, transactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      if (onRefreshProp) {
        await onRefreshProp();
      } else if (!providedTransactions && user?.id) {
        await syncWithBackend(user.id);
      }
    } catch (error) {
      setRefreshError(
        error instanceof Error
          ? error.message
          : t('commerce.wallet.activityRefreshFailed')
      );
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshProp, providedTransactions, syncWithBackend, t, user?.id]);

  const effectiveLoading = loadingProp ?? (isLoading && !providedTransactions);
  const effectiveError =
    refreshError ??
    errorProp ??
    (!providedTransactions ? transactionHistoryError : null);

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {showRefresh ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('commerce.accessibility.checkActivity')}
            accessibilityState={{
              busy: refreshing,
              disabled: refreshing || effectiveLoading,
            }}
            onPress={() => void onRefresh()}
            disabled={refreshing || effectiveLoading}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.pressed,
              (refreshing || effectiveLoading) && styles.disabled,
            ]}
          >
            <RefreshCcwIcon
              size={17}
              color={
                refreshing
                  ? theme.colors.text.tertiary
                  : theme.colors.text.primary
              }
            />
          </Pressable>
        ) : null}
      </View>

      {effectiveLoading ? (
        <View
          accessible={announceLoading}
          accessibilityRole={announceLoading ? 'progressbar' : undefined}
          accessibilityLabel={
            announceLoading
              ? t('commerce.accessibility.loadingActivity')
              : undefined
          }
          style={styles.loadingLedger}
          testID="wallet-activity-skeleton"
        >
          {[0, 1, 2].map(index => (
            <View key={index} style={styles.loadingRow}>
              <SkeletonLoader announce={false} style={styles.loadingGlyph} />
              <View style={styles.loadingCopy}>
                <SkeletonLoader announce={false} style={styles.loadingTitle} />
                <SkeletonLoader announce={false} style={styles.loadingDate} />
              </View>
              <SkeletonLoader announce={false} style={styles.loadingAmount} />
            </View>
          ))}
        </View>
      ) : effectiveError && data.length === 0 ? (
        <View style={styles.errorPanel}>
          <AlertTriangleIcon size={22} color={theme.colors.status.warning} />
          <Text style={styles.emptyTitle}>
            {t('commerce.wallet.activityDidNotLoad')}
          </Text>
          <Text style={styles.emptyText}>
            {t('commerce.wallet.activityDidNotLoadDetail')}
          </Text>
          <AppButton
            title={
              refreshing
                ? t('commerce.accessibility.checking')
                : t('commerce.action.checkAgain')
            }
            variant="outline"
            size="small"
            onPress={() => void onRefresh()}
          />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyPanel}>
          <CalendarIcon size={22} color={theme.colors.text.secondary} />
          <Text style={styles.emptyTitle}>
            {t('commerce.wallet.noActivity')}
          </Text>
          <Text style={styles.emptyText}>
            {t('commerce.wallet.noActivityDetail')}
          </Text>
          {!compact ? (
            <AppButton
              title={t('commerce.action.checkAgain')}
              variant="outline"
              size="small"
              onPress={() => void onRefresh()}
            />
          ) : null}
        </View>
      ) : (
        <>
          {effectiveError ? (
            <View style={styles.staleNotice}>
              <AlertTriangleIcon
                size={16}
                color={theme.colors.status.warning}
              />
              <View style={styles.staleNoticeCopy}>
                <Text style={styles.staleNoticeTitle}>
                  {t('commerce.wallet.activityOutOfDate')}
                </Text>
                <Text style={styles.staleNoticeText}>
                  {t('commerce.wallet.activityOutOfDateDetail')}
                </Text>
              </View>
            </View>
          ) : null}
          <View style={styles.list}>
            {data.map((transaction, index) => {
              const Icon = iconForTransaction(transaction.transaction_type);
              const amount = Number(transaction.amount || 0);
              const tone = amountTone(amount);
              const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';

              return (
                <View
                  key={transaction.id ?? `${transaction.created_at}-${index}`}
                  style={styles.row}
                >
                  <View style={styles.iconSlot}>
                    <Icon size={17} color={theme.colors.text.secondary} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>
                      {describeMomentaTransaction(transaction, t)}
                    </Text>
                    <Text style={styles.rowDate}>
                      {formatRelativeDate(transaction.created_at, locale, t)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.amount,
                      tone === 'positive' && styles.amountPositive,
                      tone === 'negative' && styles.amountNegative,
                    ]}
                  >
                    {sign}
                    {Math.abs(amount).toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: 14,
    },
    compactContainer: {
      gap: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    title: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
    },
    subtitle: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    refreshButton: {
      width: 44,
      height: 44,
      borderRadius: mentaRadii.round,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.72,
    },
    disabled: {
      opacity: 0.5,
    },
    loadingLedger: {
      gap: 8,
      paddingTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
    },
    loadingRow: {
      minHeight: 74,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    loadingGlyph: {
      width: 28,
      height: 28,
      borderRadius: mentaRadii.small,
    },
    loadingCopy: {
      flex: 1,
      gap: 8,
    },
    loadingTitle: {
      width: '62%',
      height: 13,
      borderRadius: mentaRadii.small,
    },
    loadingDate: {
      width: 68,
      height: 9,
      borderRadius: mentaRadii.small,
    },
    loadingAmount: {
      width: 44,
      height: 15,
      borderRadius: mentaRadii.small,
    },
    emptyPanel: {
      minHeight: 150,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
    },
    errorPanel: {
      minHeight: 164,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 20,
      paddingHorizontal: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.status.warning,
      backgroundColor: mentaColors.warningSoft,
    },
    emptyTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
      textAlign: 'center',
    },
    emptyText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
      textAlign: 'center',
    },
    list: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    staleNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.status.warning,
      backgroundColor: mentaColors.warningSoft,
    },
    staleNoticeCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    staleNoticeTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySmallMedium,
    },
    staleNoticeText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    row: {
      minHeight: 74,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 13,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    iconSlot: {
      width: 28,
      alignItems: 'flex-start',
    },
    rowCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    rowTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodyMedium,
    },
    rowDate: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.caption,
    },
    amount: {
      minWidth: 58,
      textAlign: 'right',
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySemibold,
    },
    amountPositive: {
      color: theme.colors.status.success,
    },
    amountNegative: {
      color: theme.colors.status.error,
    },
  });

export default TransactionHistory;
