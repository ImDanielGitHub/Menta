import React from 'react';
import {
  View,
  ScrollView,
  RefreshControlProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mentaSpacing } from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';

/**
 * The live tab bar is in the navigator layout, not an overlay. Reserve only a
 * short remainder so the last row can rest above the tab while the next row
 * peeks at the default scroll position. A second tab-height of empty canvas
 * makes the screen look finished.
 */
export const TAB_BAR_PEEK_CLEARANCE = mentaSpacing[5];

export interface ScreenWrapperProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'solid';
  scrollable?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  safeArea?: boolean;
  padding?: boolean;
  showsVerticalScrollIndicator?: boolean;
  /** Keep focused fields and trailing actions reachable above the keyboard. */
  automaticallyAdjustKeyboardInsets?: boolean;
  /** Reserve the peek remainder above the in-flow tab bar (default: true) */
  hasTabBar?: boolean;
  /** Maximum content width resolved by the owning shell. */
  maxWidth?: number;
  /** @deprecated AppScreen now owns the adaptive gutter. */
  iPadExtraPadding?: boolean;
  /** Centre a bounded content frame. Defaults to true when maxWidth is set. */
  centerContent?: boolean;
  /** @deprecated ScreenWrapper no longer applies device-specific styling. */
  disableIPadStyles?: boolean;
  /** Resolved shell gutter. AppScreen owns this for canonical route lanes. */
  horizontalPadding?: number;
  testID?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  variant = 'default',
  scrollable = false,
  refreshControl,
  contentContainerStyle,
  style,
  safeArea = true,
  padding = true,
  showsVerticalScrollIndicator,
  automaticallyAdjustKeyboardInsets = false,
  hasTabBar = true,
  maxWidth,
  centerContent,
  horizontalPadding,
  testID,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // AppScreen resolves device/window geometry. ScreenWrapper only renders the
  // requested gutter and width, so compact Split View cannot silently acquire
  // a second iPad-specific layout policy.
  const effectiveMaxWidth = maxWidth;
  const shouldCenterContent = Boolean(
    effectiveMaxWidth && (centerContent ?? true)
  );
  const resolvedHorizontalPadding = padding
    ? (horizontalPadding ?? mentaSpacing[6])
    : 0;

  const baseBottomPadding = mentaSpacing[8];
  const flattenedContentStyle = StyleSheet.flatten(contentContainerStyle);
  // Bounded screens add a frame between the scroll container and the route's
  // children. Put sibling layout on that frame, otherwise gaps separate only
  // the single frame and centring never reaches the actual screen content.
  const {
    gap,
    rowGap,
    columnGap,
    alignItems,
    justifyContent,
    flexDirection,
    flexWrap,
    ...outerContentStyle
  } = flattenedContentStyle ?? {};
  const siblingLayout: ViewStyle = {
    gap,
    rowGap,
    columnGap,
    alignItems,
    justifyContent,
    flexDirection,
    flexWrap,
  };
  const resolvedContentStyle = effectiveMaxWidth
    ? outerContentStyle
    : contentContainerStyle;
  const consumerBottomPadding =
    flattenedContentStyle &&
    typeof flattenedContentStyle.paddingBottom === 'number'
      ? flattenedContentStyle.paddingBottom
      : 0;
  const containerBottomPadding = hasTabBar ? 0 : safeArea ? insets.bottom : 0;
  const scrollBottomPadding = hasTabBar
    ? TAB_BAR_PEEK_CLEARANCE
    : (safeArea ? insets.bottom : 0) +
      Math.max(baseBottomPadding, consumerBottomPadding);

  const effectiveShowScrollIndicator = showsVerticalScrollIndicator ?? false;

  const backgroundTestID = testID ? `${testID}-background` : undefined;

  const getBackgroundComponent = () => {
    switch (variant) {
      case 'gradient':
        return (
          <LinearGradient
            colors={[
              theme.colors.background.primary,
              theme.colors.background.secondary,
            ]}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            testID={backgroundTestID}
          />
        );
      case 'solid':
        return (
          <View
            style={[
              styles.solidBackground,
              { backgroundColor: theme.colors.background.primary },
            ]}
            testID={backgroundTestID}
          />
        );
      default:
        return (
          <View
            style={[
              styles.defaultBackground,
              { backgroundColor: theme.colors.background.primary },
            ]}
            testID={backgroundTestID}
          />
        );
    }
  };

  const containerStyle = [
    styles.container,
    {
      paddingTop: safeArea ? insets.top : 0,
      paddingBottom: containerBottomPadding,
      paddingLeft: safeArea ? insets.left : 0,
      paddingRight: safeArea ? insets.right : 0,
    },
    style,
  ];

  if (scrollable) {
    return (
      <View testID={testID} style={containerStyle}>
        {getBackgroundComponent()}
        <ScrollView
          automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: resolvedHorizontalPadding,
            },
            shouldCenterContent && styles.iPadScrollContentCentered,
            resolvedContentStyle,
            { paddingBottom: scrollBottomPadding },
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={effectiveShowScrollIndicator}
          keyboardShouldPersistTaps="handled"
        >
          {effectiveMaxWidth ? (
            <View
              testID={testID ? `${testID}-bounded-content` : undefined}
              style={[
                {
                  maxWidth: effectiveMaxWidth,
                  width: '100%',
                  alignSelf: 'center',
                  flexGrow: 1,
                },
                siblingLayout,
              ]}
            >
              {children}
            </View>
          ) : (
            children
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View testID={testID} style={containerStyle}>
      {getBackgroundComponent()}
      <View
        style={[
          styles.content,
          { paddingHorizontal: resolvedHorizontalPadding },
          shouldCenterContent && styles.iPadCentered,
          resolvedContentStyle,
        ]}
      >
        {effectiveMaxWidth ? (
          <View
            style={[
              { maxWidth: effectiveMaxWidth, width: '100%', flex: 1 },
              siblingLayout,
            ]}
          >
            {children}
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  solidBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  defaultBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  iPadCentered: {
    alignItems: 'center',
  },
  iPadScrollContentCentered: {
    alignItems: 'center',
  },
});

export default ScreenWrapper;
