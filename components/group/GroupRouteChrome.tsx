import React, { type ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization';
import { MOTION_DISTANCES, MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { resolveAdaptiveLayout } from '@/constants/responsive-layout';

type GroupRouteChromeProps = {
  title: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack: () => void;
  rightAction?: ReactNode;
  testID: string;
};

/**
 * Shared route shell for group administration.
 *
 * Paper supplies the state truth and content order. This shell strengthens the
 * mobile hierarchy with a compact navigation row, one route heading, a
 * responsive content lane, and restrained entrance motion.
 */
export const GroupRouteChrome = ({
  title,
  subtitle,
  description,
  children,
  footer,
  onBack,
  rightAction,
  testID,
}: GroupRouteChromeProps) => {
  const { t } = useTranslation();
  const motion = useMotionPreferences();
  const { width } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad;
  const adaptiveLayout = resolveAdaptiveLayout({
    isIPad,
    lane: 'working',
    width,
  });
  const routeInset = adaptiveLayout.gutter;
  const contentFrameMaxWidth = isIPad
    ? Math.min(adaptiveLayout.laneWidth ?? 720, 720)
    : mentaLayout.taskLane;
  const titleLines = useLargeTypeLineLimit(2);
  const descriptionLines = useLargeTypeLineLimit(4);
  const entrance = useRef(
    new Animated.Value(motion.reduceMotion ? 1 : 0)
  ).current;

  useEffect(() => {
    entrance.setValue(motion.reduceMotion ? 1 : 0);

    if (motion.reduceMotion) return;

    Animated.timing(entrance, {
      duration: motion.duration(MOTION_DURATIONS.screen),
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrance, motion]);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [motion.distance(MOTION_DISTANCES.sm), 0],
  });

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <View style={[styles.topBar, { paddingHorizontal: routeInset }]}>
        <Pressable
          accessibilityLabel={t('groups.admin.back')}
          accessibilityRole="button"
          hitSlop={mentaSpacing[2]}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          testID={`${testID}-back`}
        >
          <ChevronLeftIcon color={mentaColors.text.primary} size={20} />
        </Pressable>
        <View style={styles.trailingLane}>{rightAction}</View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: routeInset },
          footer ? styles.contentWithFooter : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.contentFrame,
            { maxWidth: contentFrameMaxWidth },
            {
              opacity: entrance,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.hero}>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <Text
              accessibilityRole="header"
              numberOfLines={titleLines}
              style={styles.title}
            >
              {title}
            </Text>
            {description ? (
              <Text numberOfLines={descriptionLines} style={styles.description}>
                {description}
              </Text>
            ) : null}
          </View>

          <View style={styles.body}>{children}</View>
        </Animated.View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingHorizontal: routeInset }]}>
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export const GroupRouteSectionLabel = ({ children }: { children: string }) => (
  <Text style={styles.legacySectionLabel}>{children}</Text>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: mentaColors.canvas,
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    height: mentaLayout.minimumTouchTarget,
    justifyContent: 'center',
    width: mentaLayout.minimumTouchTarget,
  },
  trailingLane: {
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: mentaLayout.trailingActionLane,
  },
  scrollContent: {
    paddingBottom: mentaSpacing[5],
  },
  contentWithFooter: {
    paddingBottom: mentaSpacing[3],
  },
  contentFrame: {
    alignSelf: 'center',
    width: '100%',
  },
  hero: {
    gap: mentaSpacing[2],
    paddingBottom: mentaSpacing[6],
    paddingTop: mentaSpacing[4],
  },
  title: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
    minWidth: 0,
  },
  subtitle: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  description: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  body: {
    gap: mentaSpacing[6],
  },
  footer: {
    backgroundColor: mentaColors.canvas,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    paddingBottom: mentaSpacing[6],
    paddingTop: mentaSpacing[3],
  },
  legacySectionLabel: {
    ...mentaTypography.labelBold,
    color: mentaColors.text.primary,
  },
  pressed: {
    opacity: 0.72,
  },
});
