import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
} from '@/components/ui/icons';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { withReadableLeading } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { AppButton } from './AppButton';
import { useTranslation } from '@/lib/localization/use-translation';

export type AppInlineNoticeTone = 'info' | 'warning' | 'error' | 'success';

export type AppInlineNoticeProps = {
  title: string;
  description: string;
  tone?: AppInlineNoticeTone;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  textScale?: number;
};

export const AppInlineNotice: React.FC<AppInlineNoticeProps> = ({
  title,
  description,
  tone = 'info',
  actionLabel,
  onAction,
  actionLoading = false,
  style,
  testID,
  textScale,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const toneMap = {
    info: theme.colors.status.info,
    warning: theme.colors.status.warning,
    error: theme.colors.status.error,
    success: theme.colors.status.success,
  };
  const isAlertTone = tone === 'error' || tone === 'warning';
  const icon =
    tone === 'success' ? (
      <CheckCircleIcon size={20} color={toneMap[tone]} />
    ) : tone === 'info' ? (
      <InfoIcon size={20} color={toneMap[tone]} />
    ) : tone === 'error' ? (
      <AlertCircleIcon size={20} color={toneMap[tone]} />
    ) : (
      <AlertTriangleIcon size={20} color={toneMap[tone]} />
    );
  const action =
    actionLabel && onAction
      ? {
          label: actionLabel,
          onPress: onAction,
        }
      : null;

  return (
    <View
      testID={testID}
      style={[
        styles.notice,
        style,
        {
          borderColor: theme.colors.border.secondary,
          backgroundColor: 'transparent',
        },
      ]}
    >
      <View style={styles.noticeRow}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.noticeIcon}
        >
          {icon}
        </View>
        <View
          accessible
          accessibilityRole={isAlertTone ? 'alert' : 'summary'}
          accessibilityLabel={t('shared.accessibility.choiceSummary', {
            title,
            description,
          })}
          accessibilityLiveRegion="polite"
          style={styles.noticeCopy}
        >
          <Text
            selectable={isAlertTone}
            style={[
              styles.noticeTitle,
              withReadableLeading(mentaTypography.bodySemibold, phoneLayout),
              { color: theme.colors.text.primary },
            ]}
            textScale={textScale}
          >
            {title}
          </Text>
          <Text
            selectable={isAlertTone}
            style={[
              styles.noticeDescription,
              withReadableLeading(mentaTypography.bodySmall, phoneLayout),
              {
                color: theme.colors.text.secondary,
                marginTop: phoneLayout.headingToBodyGap,
              },
            ]}
            textScale={textScale}
          >
            {description}
          </Text>
        </View>
      </View>
      {action ? (
        <View style={styles.noticeAction}>
          <AppButton
            title={action.label}
            onPress={action.onPress}
            variant={tone === 'error' ? 'destructive' : 'outline'}
            size="small"
            loading={actionLoading}
            fullWidth
            textScale={textScale}
          />
        </View>
      ) : null}
    </View>
  );
};

/**
 * Compact progress fact. Kept under the historical export name so callers do
 * not need a visual migration, but it is deliberately a flat metric rather
 * than a decorative pill.
 */
export const AppProgressPill: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.metric,
        {
          borderColor: theme.colors.border.secondary,
        },
      ]}
    >
      <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
        {value}
      </Text>
      <Text
        style={[styles.metricLabel, { color: theme.colors.text.secondary }]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  notice: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: mentaSpacing[3],
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: mentaSpacing[3],
  },
  noticeIcon: {
    width: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  noticeCopy: {
    flex: 1,
    minWidth: 0,
  },
  noticeTitle: {
    ...mentaTypography.bodySemibold,
  },
  noticeDescription: {
    ...mentaTypography.bodySmall,
    marginTop: mentaSpacing[1],
  },
  noticeAction: {
    marginTop: mentaSpacing[4],
    paddingLeft: mentaLayout.trailingActionLane - mentaSpacing[2],
  },
  metric: {
    minWidth: 96,
    minHeight: 68,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mentaSpacing[2],
    paddingVertical: mentaSpacing[3],
  },
  metricValue: {
    ...mentaTypography.control,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    ...mentaTypography.caption,
    marginTop: mentaSpacing[1],
  },
});
