import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme, type ThemeContextType } from '@/constants/ThemeContext';
import { CheckIcon } from '@/components/ui/icons';
import { emitHaptic } from '@/lib/motion/haptics';
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

/**
 * The onboarding choice language, shared by every selectable surface:
 * a raised dark row with a hairline edge at rest, and a violet-tinted fill
 * with a firmer violet edge once chosen. Equipped themes supply their own
 * tint and edge through the theme's accent and focus roles.
 */
const resolveChoicePalette = (colors: ThemeContextType['colors']) => ({
  restFill: colors.interactive.secondary,
  restBorder: colors.border.primary,
  selectedFill: colors.accent.background,
  selectedBorder:
    colors.border.focus === mentaColors.action
      ? mentaColors.actionBorder
      : colors.border.focus,
  mark: colors.accent.primary,
  onMark: colors.onPrimary,
});

const SELECTED_BORDER_WIDTH = 2;

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
  const palette = resolveChoicePalette(theme.colors);
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={() => {
        if (!onPress) return;
        if (!selected) void emitHaptic({ type: 'selection' });
        onPress();
      }}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? palette.selectedFill : palette.restFill,
          borderColor: selected ? palette.selectedBorder : palette.restBorder,
        },
        selected && styles.chipSelected,
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
              ? theme.colors.text.primary
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
  /**
   * A short violet pill on the card's top edge, such as "Recommended".
   * Use it for one genuinely suggested option, never on every row.
   */
  badge?: string;
  /** `art` gives illustrated icons (mascot roles) a larger, untinted slot. */
  iconFrame?: 'tile' | 'art';
  /**
   * A short value on the right, such as "+10". It replaces the check mark,
   * so selection is carried by the card's edge and fill alone.
   */
  trailing?: string;
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
  iconFrame = 'tile',
  badge,
  trailing,
  style,
  children,
  disabled = false,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const palette = resolveChoicePalette(theme.colors);
  const handlePress = onPress
    ? () => {
        if (!selected) void emitHaptic({ type: 'selection' });
        onPress();
      }
    : undefined;
  const card = (
    <AppCard
      accessibilityLabel={t('shared.accessibility.choiceSummary', {
        title: badge ? `${title}, ${badge}` : title,
        description: trailing ? `${description}, ${trailing}` : description,
      })}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled, selected }}
      disabled={disabled}
      onPress={handlePress}
      pressableStyle={styles.optionCardPressable}
      testID={testID}
      variant="content"
      style={[
        styles.optionCard,
        {
          borderColor: selected ? palette.selectedBorder : palette.restBorder,
          backgroundColor: selected ? palette.selectedFill : palette.restFill,
        },
        selected && styles.optionCardSelected,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.optionHeader}>
        {icon ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={
              iconFrame === 'art'
                ? styles.optionArt
                : [
                    styles.optionIcon,
                    { backgroundColor: theme.colors.accent.background },
                  ]
            }
          >
            {icon}
          </View>
        ) : null}
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
        {trailing ? (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            numberOfLines={1}
            style={[
              styles.optionTrailing,
              {
                color: selected
                  ? theme.colors.accent.primary
                  : theme.colors.text.primary,
              },
            ]}
          >
            {trailing}
          </Text>
        ) : (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.selectionLane}
          >
            {selected ? (
              <View
                style={[
                  styles.selectionMark,
                  { backgroundColor: palette.mark },
                ]}
              >
                <CheckIcon color={palette.onMark} size={15} />
              </View>
            ) : null}
          </View>
        )}
      </View>
      {children ? <View style={styles.optionBody}>{children}</View> : null}
    </AppCard>
  );

  if (!badge) return card;

  return (
    <View style={styles.optionFrame}>
      {card}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.optionBadge, { backgroundColor: palette.mark }]}
      >
        <Text
          numberOfLines={1}
          style={[styles.optionBadgeLabel, { color: palette.onMark }]}
        >
          {badge}
        </Text>
      </View>
    </View>
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
            onPress={() => {
              if (selected) return;
              void emitHaptic({ type: 'selection' });
              onChange(option.value);
            }}
            testID={option.testID}
            style={({ pressed }) => [
              styles.segmentedOption,
              selected && {
                backgroundColor: theme.colors.accent.primary,
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
                    ? theme.colors.onPrimary
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
    borderRadius: mentaRadii.medium,
    borderWidth: 1,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    // Keep the outer size fixed as the edge thickens so a row never reflows.
    borderWidth: SELECTED_BORDER_WIDTH,
    paddingHorizontal: mentaSpacing[4] - (SELECTED_BORDER_WIDTH - 1),
    paddingVertical: mentaSpacing[2] - (SELECTED_BORDER_WIDTH - 1),
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
  optionFrame: {
    position: 'relative',
  },
  optionCard: {
    minHeight: 92,
    justifyContent: 'center',
    borderRadius: mentaRadii.medium,
    borderWidth: 1,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[4],
  },
  optionCardSelected: {
    // Keep the outer size fixed as the edge thickens so a list never jumps.
    borderWidth: SELECTED_BORDER_WIDTH,
    paddingHorizontal: mentaSpacing[4] - (SELECTED_BORDER_WIDTH - 1),
    paddingVertical: mentaSpacing[4] - (SELECTED_BORDER_WIDTH - 1),
  },
  optionCardPressable: {
    minHeight: 92,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
  },
  optionArt: {
    width: 64,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginVertical: -mentaSpacing[2],
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: mentaRadii.small,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  selectionLane: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionTrailing: {
    ...mentaTypography.control,
    fontFamily: mentaTypography.labelBold.fontFamily,
    flexShrink: 0,
  },
  selectionMark: {
    width: 24,
    height: 24,
    borderRadius: mentaRadii.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadge: {
    pointerEvents: 'none',
    position: 'absolute',
    top: -mentaSpacing[2] - 1,
    right: mentaSpacing[4],
    minHeight: 18,
    borderRadius: mentaRadii.round,
    paddingHorizontal: mentaSpacing[2],
    justifyContent: 'center',
  },
  optionBadgeLabel: {
    ...mentaTypography.micro,
    fontFamily: mentaTypography.labelBold.fontFamily,
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
