import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CommerceReceiptRows } from '@/components/commerce/CommerceReceiptRows';
import { AppButton } from '@/components/ui/AppButton';
import SimpleBottomSheet from '@/components/ui/SimpleBottomSheet';
import { useTheme } from '@/constants/ThemeContext';
import { mentaSpacing, mentaTypography } from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization/use-translation';

export type MomentaActionNoticeKind = 'success' | 'error' | 'info' | 'progress';

export type MomentaActionNotice = {
  /** Legacy notice metadata. Kept for commerce-state compatibility, but not rendered. */
  eyebrow?: string;
  /** Internal workflow owner for source-specific recovery. Never rendered. */
  source?: 'ad-reward';
  title: string;
  message: string;
  kind?: MomentaActionNoticeKind;
  refreshActionTitle?: string;
  facts?: { label: string; value: string }[];
};

type Props = {
  visible: boolean;
  notice: MomentaActionNotice | null;
  onClose: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  testID?: string;
  okTitle?: string;
  maxHeight?: number;
};

export function MomentaActionNoticeSheet({
  visible,
  notice,
  onClose,
  onRefresh,
  refreshing = false,
  testID,
  okTitle,
  maxHeight,
}: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const kind = notice?.kind || 'success';
  const isAdRewardNotice = notice?.source === 'ad-reward';
  const handleClose = () => {
    if (refreshing) return;
    onClose();
  };

  return (
    <SimpleBottomSheet
      visible={visible}
      onClose={handleClose}
      maxHeight={maxHeight}
      dismissOnBackdrop={!refreshing}
      testID={testID}
      scrollableBody={
        notice ? (
          <View style={styles.content}>
            <View
              accessible
              accessibilityRole={kind === 'error' ? 'alert' : 'summary'}
              accessibilityLabel={`${notice.title}. ${notice.message}`}
              accessibilityLiveRegion="polite"
              style={styles.noticeSummary}
            >
              <Text
                style={[styles.title, isAdRewardNotice && styles.adRewardTitle]}
              >
                {notice.title}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  isAdRewardNotice && styles.adRewardSubtitle,
                ]}
              >
                {notice.message}
              </Text>
            </View>
            {kind === 'progress' ? (
              <View
                accessible
                accessibilityLabel={t(
                  'commerce.wallet.rewardCheckingAccessibility'
                )}
                accessibilityRole="progressbar"
                accessibilityValue={{
                  text: t('commerce.commerce.checking'),
                }}
                style={styles.progressTrack}
                testID="momenta-action-progress"
              >
                <View
                  style={[
                    styles.progressSegment,
                    { backgroundColor: theme.colors.text.muted },
                  ]}
                />
                <View
                  style={[
                    styles.progressSegment,
                    { backgroundColor: theme.colors.border.primary },
                  ]}
                />
                <View
                  style={[
                    styles.progressSegment,
                    { backgroundColor: theme.colors.background.secondary },
                  ]}
                />
              </View>
            ) : null}
            {notice.facts?.length ? (
              <CommerceReceiptRows
                facts={notice.facts}
                testID="momenta-action-receipt"
              />
            ) : null}
          </View>
        ) : undefined
      }
      footer={
        notice ? (
          <>
            {notice.refreshActionTitle && onRefresh ? (
              <AppButton
                title={
                  refreshing
                    ? t('commerce.wallet.refreshingBalance')
                    : notice.refreshActionTitle
                }
                onPress={onRefresh}
                size="large"
                variant={isAdRewardNotice ? 'accent' : 'outline'}
                disabled={refreshing}
                fullWidth
              />
            ) : null}
            <AppButton
              title={okTitle ?? t('commerce.action.close')}
              onPress={handleClose}
              size={isAdRewardNotice ? 'small' : 'large'}
              variant={isAdRewardNotice ? 'ghost' : 'primary'}
              disabled={refreshing}
              fullWidth
            />
          </>
        ) : undefined
      }
    />
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    content: {
      alignItems: 'stretch',
      gap: mentaSpacing[4],
      paddingBottom: mentaSpacing[2],
    },
    noticeSummary: {
      gap: mentaSpacing[3],
    },
    title: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
      textAlign: 'left',
    },
    adRewardTitle: {
      fontFamily: mentaTypography.control.fontFamily,
    },
    subtitle: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
      textAlign: 'left',
    },
    adRewardSubtitle: {
      ...mentaTypography.body,
    },
    progressTrack: {
      flexDirection: 'row',
      gap: mentaSpacing[2],
    },
    progressSegment: {
      borderRadius: 3,
      flex: 1,
      height: 5,
    },
  });
