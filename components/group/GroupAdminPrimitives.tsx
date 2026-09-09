import React, { type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization';
import { usePhoneLayout } from '@/constants/use-phone-layout';

export type GroupStatusTone =
  | 'action'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

export type GroupMetric = {
  label: string;
  value: string;
  helper?: string;
};

export const GroupMetricStrip = ({
  metrics,
  testID,
}: {
  metrics: readonly GroupMetric[];
  testID?: string;
}) => {
  const { t } = useTranslation();
  const metricLines = useLargeTypeLineLimit(1);
  const phoneLayout = usePhoneLayout();
  const usesStackedMetrics =
    phoneLayout.isCompactWidth || phoneLayout.fontScale >= 1.2;

  return (
    <View
      accessibilityLabel={t('groups.admin.summary')}
      style={[
        styles.metricStrip,
        usesStackedMetrics ? styles.metricStripStacked : null,
      ]}
      testID={testID}
    >
      {metrics.map((metric, index) => (
        <React.Fragment key={metric.label}>
          {index > 0 ? (
            <View
              style={[
                styles.metricDivider,
                usesStackedMetrics ? styles.metricDividerStacked : null,
              ]}
            />
          ) : null}
          <View
            style={[
              styles.metric,
              usesStackedMetrics ? styles.metricStacked : null,
            ]}
          >
            <Text numberOfLines={metricLines} style={styles.metricValue}>
              {metric.value}
            </Text>
            <Text numberOfLines={metricLines} style={styles.metricLabel}>
              {metric.label}
            </Text>
            {metric.helper ? (
              <Text numberOfLines={metricLines} style={styles.metricHelper}>
                {metric.helper}
              </Text>
            ) : null}
          </View>
        </React.Fragment>
      ))}
    </View>
  );
};

export const GroupListSurface = ({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) => (
  <View style={[styles.listSurface, style]} testID={testID}>
    {children}
  </View>
);

export const GroupSectionHeader = ({
  action,
  helper,
  label,
}: {
  action?: ReactNode;
  helper?: string;
  label: string;
}) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionCopy}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {helper ? <Text style={styles.sectionHelper}>{helper}</Text> : null}
    </View>
    {action ? <View style={styles.sectionAction}>{action}</View> : null}
  </View>
);

export const GroupStatePanel = ({
  actionLabel,
  detail,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  title,
  tone = 'neutral',
}: {
  actionLabel?: string;
  detail: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  title: string;
  tone?: GroupStatusTone;
}) => {
  const isAlertTone = tone === 'danger' || tone === 'warning';

  return (
    <View style={styles.statePanel}>
      <View
        accessible
        accessibilityLabel={`${title}. ${detail}`}
        accessibilityLiveRegion={isAlertTone ? 'polite' : 'none'}
        accessibilityRole={isAlertTone ? 'alert' : 'summary'}
        style={styles.stateCopy}
      >
        <Text style={styles.stateTitle}>{title}</Text>
        <Text style={styles.stateDetail}>{detail}</Text>
      </View>
      {actionLabel && onAction ? (
        <AppButton fullWidth onPress={onAction} title={actionLabel} />
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <AppButton
          fullWidth
          onPress={onSecondaryAction}
          title={secondaryActionLabel}
          variant="ghost"
        />
      ) : null}
    </View>
  );
};

export const GroupSkeletonRows = ({ rows = 4 }: { rows?: number }) => (
  <GroupListSurface>
    {Array.from({ length: rows }).map((_, index) => (
      <View
        key={index}
        style={[styles.skeletonRow, index === rows - 1 ? styles.lastRow : null]}
      >
        <SkeletonLoader
          announce={index === 0}
          borderRadius={mentaRadii.round}
          height={mentaLayout.minimumTouchTarget}
          width={mentaLayout.minimumTouchTarget}
        />
        <View style={styles.skeletonCopy}>
          <SkeletonLoader
            announce={false}
            height={14}
            width={124 + (index % 3) * 16}
          />
          <SkeletonLoader announce={false} height={10} width={82} />
        </View>
        <SkeletonLoader announce={false} height={12} width={42} />
      </View>
    ))}
  </GroupListSurface>
);

const styles = StyleSheet.create({
  metricStrip: {
    alignItems: 'stretch',
    borderColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 82,
  },
  metricStripStacked: {
    flexDirection: 'column',
    minHeight: 0,
  },
  metric: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: mentaSpacing[3],
    paddingVertical: mentaSpacing[4],
  },
  metricStacked: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 0,
    paddingVertical: mentaSpacing[3],
  },
  metricDivider: {
    backgroundColor: mentaColors.border,
    width: StyleSheet.hairlineWidth,
  },
  metricDividerStacked: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  metricValue: {
    ...mentaTypography.control,
    color: mentaColors.text.primary,
  },
  metricLabel: {
    ...mentaTypography.label,
    color: mentaColors.text.secondary,
  },
  metricHelper: {
    ...mentaTypography.micro,
    color: mentaColors.text.muted,
  },
  listSurface: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    width: '100%',
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
    minHeight: 32,
  },
  sectionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  sectionLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.primary,
  },
  sectionHelper: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  sectionAction: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  statePanel: {
    alignItems: 'flex-start',
    gap: mentaSpacing[4],
    justifyContent: 'center',
    minHeight: 280,
    paddingVertical: mentaSpacing[8],
  },
  stateCopy: {
    gap: mentaSpacing[2],
    width: '100%',
  },
  stateTitle: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  stateDetail: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  skeletonRow: {
    alignItems: 'center',
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 76,
    paddingHorizontal: mentaSpacing[4],
  },
  skeletonCopy: {
    flex: 1,
    gap: mentaSpacing[2],
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
