import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ChevronRightIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';

type SettingsDirectRowProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  showDivider?: boolean;
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The Paper settings lane is deliberately a direct list, not a card group.
 * It stays local to the Settings/invitation family until the rest of the app
 * has migrated to the same 56pt row contract.
 */
export const SettingsDirectRow = ({
  title,
  subtitle,
  icon,
  value,
  onPress,
  destructive = false,
  showChevron = Boolean(onPress),
  showDivider = true,
  disabled = false,
  busy = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: SettingsDirectRowProps) => {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const shouldAllowFullWrap = fontScale >= 1.3;
  const spokenLabel =
    accessibilityLabel ?? [title, subtitle].filter(Boolean).join('. ');
  const spokenValue = value ? { text: value } : undefined;
  const textColour = destructive ? mentaColors.danger : colors.text.primary;

  const content = (
    <>
      <View style={styles.iconLane}>{icon}</View>
      <View style={styles.copy}>
        <Text
          numberOfLines={shouldAllowFullWrap ? undefined : 2}
          style={[styles.title, { color: textColour }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={shouldAllowFullWrap ? undefined : 3}
            style={[styles.subtitle, { color: colors.text.secondary }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.trailingLane}>
        {value ? (
          <Text
            numberOfLines={shouldAllowFullWrap ? undefined : 2}
            style={[styles.value, { color: colors.text.secondary }]}
          >
            {value}
          </Text>
        ) : null}
        {showChevron ? (
          <ChevronRightIcon size={18} color={colors.text.muted} />
        ) : null}
      </View>
    </>
  );

  const rowStyle = [
    styles.row,
    showDivider && {
      borderBottomColor: colors.border.primary,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    style,
  ];

  if (!onPress) {
    return (
      <View
        accessible
        accessibilityLabel={spokenLabel}
        accessibilityState={{ busy, disabled }}
        accessibilityValue={spokenValue}
        style={rowStyle}
        testID={testID}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={spokenLabel}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled }}
      accessibilityValue={spokenValue}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        rowStyle,
        pressed && !disabled && { backgroundColor: colors.accent.background },
      ]}
      testID={testID}
    >
      {content}
    </Pressable>
  );
};

export const SettingsSectionLabel = ({ children }: { children: string }) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: colors.text.muted }]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    ...mentaTypography.captionMedium,
    marginTop: mentaSpacing[8],
    marginBottom: mentaSpacing[2],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 64,
    paddingVertical: mentaSpacing[3],
  },
  iconLane: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: mentaLayout.iconLane,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingLeft: mentaSpacing[3],
    paddingRight: mentaSpacing[3],
  },
  title: {
    ...mentaTypography.bodyMedium,
  },
  subtitle: {
    ...mentaTypography.caption,
    marginTop: mentaSpacing[1],
  },
  trailingLane: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
    justifyContent: 'flex-end',
    minWidth: mentaLayout.trailingActionLane,
  },
  value: {
    ...mentaTypography.caption,
    maxWidth: 92,
  },
});
