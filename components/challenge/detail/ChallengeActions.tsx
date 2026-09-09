import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppInlineNotice } from '@/components/ui';
import { CheckCircleIcon } from '@/components/ui/icons';
import { useTheme } from '@/constants/ThemeContext';
import { mentaSpacing, mentaTypography } from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';
import { usePhoneLayout } from '@/constants/use-phone-layout';

type ActionMessage = {
  text: string;
  type: 'success' | 'error' | 'info';
};

type ChallengeActionsProps = {
  refreshErrorBanner: string | null;
  actionMessage: ActionMessage | null;
  onRetry?: () => void;
  retrying?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
};

export function ChallengeActions({
  refreshErrorBanner,
  actionMessage,
  onRetry,
  retrying = false,
  actionLabel,
  onAction,
  actionLoading = false,
}: ChallengeActionsProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  if (!refreshErrorBanner && !actionMessage) return null;

  const notice = refreshErrorBanner
    ? { text: refreshErrorBanner, type: 'error' as const }
    : actionMessage;

  if (!notice) return null;

  if (!refreshErrorBanner && notice.type === 'success') {
    return (
      <View
        accessible
        accessibilityLabel={t('todayProof.promise.updated_accessibility', {
          detail: notice.text,
        })}
        accessibilityLiveRegion="polite"
        accessibilityRole="summary"
        style={[styles.receipt, { marginHorizontal: phoneLayout.screenInset }]}
        testID="challenge-action-notice"
      >
        <CheckCircleIcon size={18} color={theme.colors.status.success} />
        <Text
          style={[styles.receiptText, { color: theme.colors.text.primary }]}
        >
          {notice.text}
        </Text>
      </View>
    );
  }

  return (
    <AppInlineNotice
      title={
        refreshErrorBanner
          ? t('todayProof.promise.refresh_promise')
          : notice.type === 'error'
            ? t('todayProof.promise.complete_action_failed')
            : notice.type === 'success'
              ? t('todayProof.promise.updated')
              : t('todayProof.promise.notice')
      }
      description={notice.text}
      tone={notice.type}
      actionLabel={
        refreshErrorBanner && onRetry
          ? t('todayProof.promise.try_again')
          : actionLabel
      }
      onAction={refreshErrorBanner ? onRetry : onAction}
      actionLoading={refreshErrorBanner ? retrying : actionLoading}
      style={[styles.notice, { marginHorizontal: phoneLayout.screenInset }]}
      testID="challenge-action-notice"
    />
  );
}

const styles = StyleSheet.create({
  receipt: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
    marginTop: mentaSpacing[4],
  },
  receiptText: {
    ...mentaTypography.bodySemibold,
    flex: 1,
  },
  notice: {
    marginTop: mentaSpacing[4],
  },
});
