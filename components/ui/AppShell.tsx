import React from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import { ScreenWrapper, type ScreenWrapperProps } from './ScreenWrapper';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { allowsLargeTypeWrap, composeSpokenLabel } from '@/lib/accessibility';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { resolveAdaptiveLayout } from '@/constants/responsive-layout';
import { useTranslation } from '@/lib/localization/use-translation';

export type AppScreenLane = 'focused' | 'working' | 'immersive' | 'full';

export interface AppScreenProps extends ScreenWrapperProps {
  /**
   * Choose a composition deliberately. Focused is for authentication, receipts
   * and one-object decisions, but it still uses the large-phone task lane.
   * Apply mentaLayout.readingMeasure only to genuinely long prose. Working is
   * the default for lists and forms.
   * Immersive is for media, evidence and timeline-heavy screens. Full removes
   * the canonical horizontal inset for camera and edge-to-edge surfaces.
   */
  lane: AppScreenLane;
}

const laneStyles: Record<AppScreenLane, ViewStyle> = {
  focused: {
    alignSelf: 'center',
    width: '100%',
  },
  working: {
    alignSelf: 'center',
    width: '100%',
  },
  immersive: {
    alignSelf: 'center',
    width: '100%',
  },
  full: {
    alignSelf: 'stretch',
    width: '100%',
  },
};

export const AppScreen: React.FC<AppScreenProps> = ({
  contentContainerStyle,
  lane,
  iPadExtraPadding,
  maxWidth,
  padding,
  ...props
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isIPad = Platform.OS === 'ios' && Platform.isPad;
  const layout = resolveAdaptiveLayout({
    lane,
    width,
    isIPad,
    safeAreaHorizontal: insets.left + insets.right,
  });
  const resolvedMaxWidth =
    maxWidth ??
    (layout.laneWidth == null
      ? undefined
      : padding === false
        ? layout.laneWidth + layout.gutter * 2
        : layout.laneWidth);

  return (
    <ScreenWrapper
      {...props}
      contentContainerStyle={StyleSheet.flatten([
        laneStyles[lane],
        contentContainerStyle,
      ])}
      horizontalPadding={lane === 'full' ? 0 : layout.gutter}
      iPadExtraPadding={iPadExtraPadding}
      maxWidth={resolvedMaxWidth}
      padding={lane === 'full' ? false : padding}
    />
  );
};

export interface AppTopBarProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  /**
   * When the top bar title is the screen heading, expose it to the VoiceOver
   * rotor. Opt out when a larger editorial heading already owns that role.
   */
  titleIsHeading?: boolean;
  textScale?: number;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  title,
  subtitle,
  onBack,
  backLabel,
  trailing,
  style,
  titleStyle,
  titleIsHeading = true,
  textScale,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const resolvedBackLabel = backLabel ?? t('accessibility.back');
  const { fontScale } = useWindowDimensions();
  const allowTitleWrap = allowsLargeTypeWrap(fontScale);
  return (
    <View style={[styles.topBar, style]}>
      <View style={styles.topBarMain}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={resolvedBackLabel}
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: 'transparent' }]}
          >
            <ArrowLeftIcon size={18} color={colors.text.primary} />
          </Pressable>
        ) : null}
        {title || subtitle ? (
          <View style={styles.topBarText}>
            {title ? (
              <Text
                accessibilityRole={titleIsHeading ? 'header' : undefined}
                numberOfLines={allowTitleWrap ? undefined : 2}
                style={[
                  styles.topBarTitle,
                  { color: colors.text.primary },
                  titleStyle,
                ]}
                textScale={textScale}
              >
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text
                numberOfLines={allowTitleWrap ? undefined : 3}
                style={[
                  styles.topBarSubtitle,
                  { color: colors.text.secondary },
                ]}
                textScale={textScale}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {trailing}
    </View>
  );
};

export interface AppSectionHeaderProps {
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  style?: ViewStyle;
}

export const AppSectionHeader: React.FC<AppSectionHeaderProps> = ({
  title,
  subtitle,
  accessory,
  style,
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionBody}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: colors.text.primary }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.sectionSubtitle, { color: colors.text.secondary }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {accessory}
    </View>
  );
};

export interface AppEmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = ({
  title,
  description,
  action,
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <Text
        accessibilityRole="header"
        style={[styles.emptyTitle, { color: colors.text.primary }]}
      >
        {title}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
        {description}
      </Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
};

export const AppInsetGroup: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.insetGroup, { borderTopColor: colors.border.primary }]}
    >
      {children}
    </View>
  );
};

export const AppDivider: React.FC<{
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({ muted = false, style }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: muted ? colors.border.primary : colors.text.muted,
        },
        style,
      ]}
    />
  );
};

export interface AppListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  value?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  selected?: boolean;
  showChevron?: boolean;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

export const AppListRow: React.FC<AppListRowProps> = ({
  title,
  subtitle,
  meta,
  value,
  left,
  right,
  onPress,
  destructive = false,
  selected = false,
  showChevron = Boolean(onPress),
  showDivider = true,
  style,
  titleStyle,
}) => {
  const { colors } = useTheme();
  const motion = useMotionPreferences();
  const { fontScale } = useWindowDimensions();
  const allowTitleWrap = allowsLargeTypeWrap(fontScale);
  const spokenLabel = composeSpokenLabel(meta, title, subtitle, value);
  const content = (
    <>
      {left ? <View style={styles.listRowIcon}>{left}</View> : null}
      <View style={styles.listRowBody}>
        {meta ? (
          <Text
            accessible={false}
            style={[styles.listRowMeta, { color: colors.text.muted }]}
          >
            {meta}
          </Text>
        ) : null}
        <Text
          accessible={false}
          numberOfLines={allowTitleWrap ? undefined : 2}
          style={[
            styles.listRowTitle,
            {
              color: destructive ? mentaColors.danger : colors.text.primary,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            accessible={false}
            numberOfLines={allowTitleWrap ? undefined : 3}
            style={[styles.listRowSubtitle, { color: colors.text.secondary }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.listRowTrailing}>
        {value ? (
          <Text
            accessible={false}
            numberOfLines={allowTitleWrap ? undefined : 2}
            style={[styles.listRowValue, { color: colors.text.muted }]}
          >
            {value}
          </Text>
        ) : null}
        {right}
        {showChevron ? (
          <ChevronRightIcon size={18} color={colors.text.muted} />
        ) : null}
      </View>
    </>
  );

  const rowStyle = [
    styles.listRow,
    {
      borderBottomColor: showDivider ? colors.border.primary : 'transparent',
      backgroundColor: selected ? colors.accent.background : 'transparent',
    },
    selected && {
      borderColor: colors.border.focus,
      borderWidth: 1,
      borderRadius: mentaRadii.medium,
      marginVertical: mentaSpacing[1],
    },
    style,
  ];

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={spokenLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        rowStyle,
        pressed &&
          (motion.reduceMotion
            ? styles.listRowPressedReduced
            : styles.listRowPressed),
      ]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  topBarMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[3],
    flex: 1,
  },
  topBarText: {
    flex: 1,
    minWidth: 0,
  },
  topBarTitle: {
    ...mentaTypography.title,
  },
  topBarSubtitle: {
    ...mentaTypography.bodySmall,
    marginTop: mentaSpacing[1],
  },
  backButton: {
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
    borderRadius: mentaRadii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  sectionBody: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    ...mentaTypography.bodySemibold,
  },
  sectionSubtitle: {
    ...mentaTypography.bodySmall,
    marginTop: mentaSpacing[1],
  },
  emptyTitle: {
    ...mentaTypography.journeyTitle,
    textAlign: 'center',
  },
  emptyDescription: {
    ...mentaTypography.bodySmall,
    marginTop: mentaSpacing[3],
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: mentaSpacing[6],
  },
  insetGroup: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emptyState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: mentaSpacing[10],
    paddingHorizontal: mentaSpacing[5],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  listRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: mentaSpacing[3],
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listRowPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  listRowPressedReduced: {
    opacity: 0.72,
  },
  listRowIcon: {
    width: mentaLayout.trailingActionLane,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  listRowBody: {
    flex: 1,
    minWidth: 0,
    paddingRight: mentaSpacing[3],
  },
  listRowMeta: {
    ...mentaTypography.label,
    textTransform: 'uppercase',
    marginBottom: mentaSpacing[1],
  },
  listRowTitle: {
    ...mentaTypography.bodySemibold,
  },
  listRowSubtitle: {
    ...mentaTypography.bodySmall,
    marginTop: mentaSpacing[1],
  },
  listRowTrailing: {
    flexDirection: 'row',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: mentaSpacing[2],
    marginLeft: mentaSpacing[3],
  },
  listRowValue: {
    ...mentaTypography.bodySmallMedium,
    flexShrink: 1,
    maxWidth: 116,
    minWidth: 0,
  },
});
