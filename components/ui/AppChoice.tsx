import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { AppCard } from './AppCard';
import { useTranslation } from '@/lib/localization/use-translation';

export const AppChoiceChip: React.FC<{
  label: string;
  selected?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}> = ({
  label,
  selected = false,
  disabled = false,
  testID,
  style,
  onPress,
}) => {
  const theme = useTheme();
  const motion = useMotionPreferences();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? theme.colors.interactive.primary
            : 'transparent',
          borderColor: selected
            ? theme.colors.interactive.primary
            : theme.colors.border.secondary,
        },
        disabled && styles.disabled,
        pressed &&
          !disabled &&
          (motion.reduceMotion ? styles.pressedReduced : styles.pressed),
        style,
      ]}
    >
      <Text
        numberOfLines={2}
        style={[
          styles.chipLabel,
          {
            color: selected
              ? theme.colors.text.inverse
              : theme.colors.text.secondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export const AppTag: React.FC<{
  label: string;
  tone?: 'default' | 'share' | 'streak' | 'success';
}> = ({ label, tone = 'default' }) => {
  const theme = useTheme();
  const toneColors = {
    default: 'rgba(255, 255, 255, 0.05)',
    share: mentaColors.actionSoft,
    streak: mentaColors.warningSoft,
    success: mentaColors.successSoft,
  } as const;
  const textColors = {
    default: theme.colors.text.secondary,
    share: theme.colors.text.primary,
    streak: mentaColors.warning,
    success: mentaColors.success,
  } as const;

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: toneColors[tone],
          borderColor:
            tone === 'default'
              ? theme.colors.border.secondary
              : textColors[tone],
        },
      ]}
    >
      <Text style={[styles.tagLabel, { color: textColors[tone] }]}>
        {label}
      </Text>
    </View>
  );
};

export const AppOptionCard: React.FC<{
  title: string;
  description: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  disabled?: boolean;
  testID?: string;
}> = ({
  title,
  description,
  selected = false,
  onPress,
  icon,
  style,
  children,
  disabled = false,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <AppCard
      accessibilityLabel={t('shared.accessibility.choiceSummary', {
        title,
        description,
      })}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      pressableStyle={styles.optionCardPressable}
      testID={testID}
      variant="content"
      style={[
        styles.optionCard,
        {
          borderColor: selected
            ? theme.colors.interactive.primary
            : theme.colors.border.secondary,
          backgroundColor: selected
            ? theme.colors.interactive.secondary
            : 'transparent',
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.optionHeader}>
        {icon ? <View style={styles.optionIcon}>{icon}</View> : null}
        <View style={styles.optionCopy}>
          <Text
            style={[
              styles.optionTitle,
              { color: theme.colors.text.primary, flexShrink: 1 },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.optionDescription,
              { color: theme.colors.text.secondary, flexShrink: 1 },
            ]}
          >
            {description}
          </Text>
        </View>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.selectionIndicator,
            {
              borderColor: selected
                ? theme.colors.interactive.primary
                : theme.colors.border.secondary,
              backgroundColor: selected
                ? theme.colors.interactive.primary
                : 'transparent',
            },
          ]}
        >
          {selected ? <View style={styles.selectionDot} /> : null}
        </View>
      </View>
      {children ? <View style={styles.optionBody}>{children}</View> : null}
    </AppCard>
  );
};

export const AppSegmentedControl = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: {
    label: string;
    value: T;
    testID?: string;
    accessibilityLabel?: string;
  }[];
  value: T;
  onChange: (next: T) => void;
}) => {
  const theme = useTheme();
  const motion = useMotionPreferences();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.segmentedShell,
        {
          backgroundColor: theme.colors.background.secondary,
          borderColor: theme.colors.border.secondary,
        },
      ]}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            onPress={() => onChange(option.value)}
            testID={option.testID}
            style={({ pressed }) => [
              styles.segmentedOption,
              selected && {
                backgroundColor: theme.colors.interactive.primary,
              },
              pressed &&
                (motion.reduceMotion ? styles.pressedReduced : styles.pressed),
            ]}
          >
            <Text
              numberOfLines={2}
              style={[
                styles.segmentedLabel,
                {
                  color: selected
                    ? theme.colors.text.inverse
                    : theme.colors.text.secondary,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export const AppMemberStack: React.FC<{
  names: string[];
  maxVisible?: number;
}> = ({ names, maxVisible = 3 }) => {
  const theme = useTheme();
  const visibleNames = names.slice(0, maxVisible);
  const extraCount = Math.max(names.length - maxVisible, 0);

  return (
    <View style={styles.memberStack}>
      {visibleNames.map((name, index) => {
        const initials = name
          .split(' ')
          .map(part => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return (
          <View
            key={`${name}-${index}`}
            style={[
              styles.memberBubble,
              {
                marginLeft: index === 0 ? 0 : -8,
                backgroundColor:
                  index === 0
                    ? theme.colors.interactive.primary
                    : theme.colors.background.card,
                borderColor: theme.colors.background.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.memberInitials,
                {
                  color:
                    index === 0
                      ? theme.colors.text.inverse
                      : theme.colors.text.primary,
                },
              ]}
            >
              {initials}
            </Text>
          </View>
        );
      })}
      {extraCount > 0 ? (
        <View
          style={[
            styles.memberBubble,
            {
              marginLeft: visibleNames.length === 0 ? 0 : -8,
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.background.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.memberInitials,
              { color: theme.colors.text.secondary },
            ]}
          >
            +{extraCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: mentaLayout.minimumTouchTarget,
    borderRadius: mentaRadii.round,
    borderWidth: 1,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    ...mentaTypography.bodySmallMedium,
    textAlign: 'center',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  pressedReduced: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.44,
  },
  tag: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: mentaRadii.small,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mentaSpacing[3],
    paddingVertical: mentaSpacing[2],
    justifyContent: 'center',
  },
  tagLabel: {
    ...mentaTypography.captionMedium,
  },
  optionCard: {
    minHeight: 92,
    justifyContent: 'center',
  },
  optionCardPressable: {
    minHeight: 92,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  optionIcon: {
    width: 30,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    ...mentaTypography.control,
  },
  optionDescription: {
    ...mentaTypography.bodySmall,
    marginTop: mentaSpacing[1],
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  selectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mentaColors.canvas,
  },
  optionBody: {
    marginTop: mentaSpacing[3],
  },
  segmentedShell: {
    minHeight: 52,
    flexDirection: 'row',
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: mentaSpacing[1],
    gap: mentaSpacing[1],
  },
  segmentedOption: {
    flex: 1,
    minHeight: mentaLayout.minimumTouchTarget,
    minWidth: 0,
    borderRadius: mentaRadii.small,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: mentaSpacing[2],
    paddingVertical: mentaSpacing[1],
  },
  segmentedLabel: {
    ...mentaTypography.bodySmallMedium,
    textAlign: 'center',
    flexShrink: 1,
  },
  memberStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: {
    ...mentaTypography.micro,
  },
});
