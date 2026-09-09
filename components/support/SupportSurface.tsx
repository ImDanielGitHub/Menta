import { useTranslation } from '@/lib/localization';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ChevronRightIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

type SupportTone = 'action' | 'success' | 'warning' | 'danger' | 'muted';

const toneColors = {
  action: mentaColors.border,
  success: mentaColors.success,
  warning: mentaColors.warning,
  danger: mentaColors.danger,
  muted: mentaColors.text.secondary,
} as const;

export const SupportIconTile = ({
  children,
  size = 44,
  tone = 'action',
  round = false,
}: {
  children: React.ReactNode;
  size?: 28 | 44 | 52 | 72 | 82;
  tone?: SupportTone;
  round?: boolean;
}) => (
  <View
    style={[
      styles.iconTile,
      {
        borderColor: `${toneColors[tone]}66`,
        borderRadius: round ? mentaRadii.round : mentaRadii.medium,
        height: size,
        width: size,
      },
    ]}
  >
    {children}
  </View>
);

export const SupportPrimaryAction = ({
  detail,
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
  testID,
}: {
  detail: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) => {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityLabel={t(
        'fullAuth.component_support_supportsurface.title_subtitle_detail',
        { title: title, subtitle: subtitle, detail: detail }
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.primaryAction,
        pressed && !disabled && styles.primaryActionPressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.primaryIcon}>{icon}</View>
      <View style={styles.primaryCopy}>
        <Text style={styles.primaryTitle}>{title}</Text>
        <Text style={styles.primarySubtitle}>{subtitle}</Text>
        <Text style={styles.primaryDetail}>{detail}</Text>
      </View>
      <View style={styles.primaryTrailing}>
        <ChevronRightIcon color={mentaColors.action} size={22} />
      </View>
    </Pressable>
  );
};

export const SupportActionRow = ({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
  right,
  showDivider = true,
  testID,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  right?: React.ReactNode;
  showDivider?: boolean;
  testID?: string;
}) => {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityLabel={t(
        'fullAuth.component_support_supportsurface.title_subtitle',
        { title: title, subtitle: subtitle }
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.actionRow,
        showDivider && styles.actionRowDivider,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.smallIcon}>{icon}</View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.trailingLane}>
        {right ?? <ChevronRightIcon color={mentaColors.text.muted} size={18} />}
      </View>
    </Pressable>
  );
};

export const SupportLedgerCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) => <View style={[styles.ledgerCard, style]}>{children}</View>;

const styles = StyleSheet.create({
  iconTile: {
    alignItems: 'center',
    backgroundColor: mentaColors.raised,
    borderWidth: 1,
    justifyContent: 'center',
  },
  primaryAction: {
    alignItems: 'flex-start',
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.action,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 116,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[4],
  },
  primaryActionPressed: {
    backgroundColor: mentaColors.raised,
    transform: [{ scale: 0.995 }],
  },
  primaryIcon: {
    alignItems: 'center',
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  primaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  primaryTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.title,
  },
  primarySubtitle: {
    color: mentaColors.text.primary,
    marginTop: mentaSpacing[1],
    ...mentaTypography.body,
  },
  primaryDetail: {
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[2],
    ...mentaTypography.caption,
  },
  primaryTrailing: {
    alignItems: 'center',
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    width: 24,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 72,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[3],
  },
  actionRowDivider: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  disabled: { opacity: 0.5 },
  smallIcon: {
    alignItems: 'center',
    flexShrink: 0,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  actionCopy: { flex: 1, minWidth: 0 },
  actionTitle: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodyMedium,
  },
  actionSubtitle: {
    color: mentaColors.text.secondary,
    marginTop: mentaSpacing[1],
    ...mentaTypography.bodySmall,
  },
  trailingLane: {
    alignItems: 'flex-end',
    flexShrink: 0,
    justifyContent: 'center',
    width: mentaLayout.iconLane,
  },
  ledgerCard: {
    backgroundColor: mentaColors.surface,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    padding: mentaSpacing[4],
  },
});
