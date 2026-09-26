import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  Modal,
  Pressable,
  Text,
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTheme } from '@/constants/ThemeContext';
import type { ModalSurface } from '@/components/ui/modal/types';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { MOTION_DISTANCES, MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useTranslation } from '@/lib/localization/use-translation';
import {
  IPAD_BOUNDED_SHEET_MAX_WIDTH,
  shouldUseBoundedIPadSheet,
} from '@/constants/responsive-layout';

type Props = {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  maxHeight?: number;
  testID?: string;
  dismissOnBackdrop?: boolean;
  surface?: ModalSurface;
  /** Regular-width iPads use a bounded task surface. Phone output is unchanged. */
  presentationRole?: 'edge' | 'bounded';
  /** Opt-in scrollable content. Existing children remain non-scrollable by default. */
  scrollableBody?: React.ReactNode;
  /** Optional overflow cue shown only while more scroll content remains below. */
  scrollHint?: string;
  /** Kept below an opt-in scrollable body so actions stay available. */
  footer?: React.ReactNode;
};

export const SimpleBottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  children,
  maxHeight,
  testID,
  dismissOnBackdrop = true,
  surface = 'sheet',
  presentationRole = 'bounded',
  scrollableBody,
  scrollHint,
  footer,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const resolvedScrollHint = scrollHint ?? t('shared.accessibility.scrollHint');
  const phoneLayout = usePhoneLayout();
  const { reduceMotion, duration, distance } = useMotionPreferences();
  const justOpenedRef = useRef(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const sheetPaddingBottom = phoneLayout.stackGap + insets.bottom;
  const isSheet = surface === 'sheet';
  const isBoundedIPadSheet =
    isSheet &&
    presentationRole === 'bounded' &&
    shouldUseBoundedIPadSheet(width, Platform.OS === 'ios' && Platform.isPad);
  const sheetHorizontalPadding = isBoundedIPadSheet
    ? mentaSpacing[6]
    : phoneLayout.screenInset;
  const resolvedMaxHeight =
    maxHeight ??
    Math.floor(phoneLayout.height * phoneLayout.sheetMaxHeightRatio);
  const hasScrollableBody = scrollableBody !== undefined;
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const [scrollContentHeight, setScrollContentHeight] = useState(0);
  const [scrollOffsetY, setScrollOffsetY] = useState(0);
  const hasMoreScrollContent =
    hasScrollableBody &&
    scrollContentHeight > scrollViewportHeight + 4 &&
    scrollOffsetY + scrollViewportHeight < scrollContentHeight - 4;

  useEffect(() => {
    if (!visible) {
      setScrollViewportHeight(0);
      setScrollContentHeight(0);
      setScrollOffsetY(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    justOpenedRef.current = true;
    const openGuard = setTimeout(() => {
      justOpenedRef.current = false;
    }, 250);

    if (reduceMotion) {
      translateY.setValue(0);
      return () => clearTimeout(openGuard);
    }

    translateY.setValue(distance(MOTION_DISTANCES.md));
    const entrance = Animated.timing(translateY, {
      toValue: 0,
      duration: duration(MOTION_DURATIONS.state),
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    entrance.start();

    return () => {
      clearTimeout(openGuard);
      entrance.stop();
    };
  }, [distance, duration, reduceMotion, translateY, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={() => {
        if (dismissOnBackdrop) {
          onClose();
        }
      }}
      presentationStyle="overFullScreen"
      supportedOrientations={
        Platform.OS === 'ios' && Platform.isPad
          ? [
              'portrait',
              'portrait-upside-down',
              'landscape-left',
              'landscape-right',
            ]
          : ['portrait']
      }
      hardwareAccelerated
      accessibilityViewIsModal
    >
      <View
        style={[
          styles.backdrop,
          { backgroundColor: colors.background.overlay },
          isBoundedIPadSheet ? styles.boundedBackdrop : null,
        ]}
      >
        <Pressable
          style={isBoundedIPadSheet ? StyleSheet.absoluteFill : { flex: 1 }}
          onPress={() => {
            if (justOpenedRef.current) return;
            if (dismissOnBackdrop) {
              onClose();
            }
          }}
          accessible={dismissOnBackdrop}
          accessibilityRole={dismissOnBackdrop ? 'button' : undefined}
          accessibilityLabel={
            dismissOnBackdrop
              ? t('shared.accessibility.dismissSheet')
              : undefined
          }
          accessibilityState={
            dismissOnBackdrop ? undefined : { disabled: true }
          }
          importantForAccessibility={
            dismissOnBackdrop ? 'yes' : 'no-hide-descendants'
          }
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // The modal starts at the screen origin; a safe-area offset would
          // lift the sheet above the keyboard and expose the backdrop.
          keyboardVerticalOffset={0}
          style={[
            styles.keyboardAvoider,
            isBoundedIPadSheet ? styles.boundedKeyboardAvoider : null,
          ]}
        >
          <Animated.View
            testID={testID}
            accessibilityViewIsModal
            importantForAccessibility="yes"
            style={[
              styles.sheet,
              isBoundedIPadSheet ? styles.boundedSheet : null,
              {
                backgroundColor: colors.background.surface,
                borderTopColor: colors.border.primary,
                marginHorizontal: 0,
                maxWidth: isBoundedIPadSheet
                  ? IPAD_BOUNDED_SHEET_MAX_WIDTH
                  : undefined,
                borderTopLeftRadius: isSheet
                  ? mentaRadii.large
                  : mentaRadii.medium,
                borderTopRightRadius: isSheet
                  ? mentaRadii.large
                  : mentaRadii.medium,
                borderBottomLeftRadius: isBoundedIPadSheet
                  ? mentaRadii.large
                  : 0,
                borderBottomRightRadius: isBoundedIPadSheet
                  ? mentaRadii.large
                  : 0,
                borderLeftWidth: isBoundedIPadSheet ? 1 : 0,
                borderRightWidth: isBoundedIPadSheet ? 1 : 0,
                borderBottomWidth: isBoundedIPadSheet ? 1 : 0,
                borderColor: colors.border.primary,
                paddingBottom: sheetPaddingBottom,
                maxHeight: resolvedMaxHeight,
                transform: [{ translateY }],
              },
            ]}
          >
            <View
              accessible={false}
              importantForAccessibility="no"
              style={[
                styles.grabber,
                { backgroundColor: colors.border.primary },
              ]}
            />
            {hasScrollableBody ? (
              <View
                style={[
                  styles.scrollableContent,
                  {
                    paddingHorizontal: sheetHorizontalPadding,
                    maxHeight: Math.max(
                      resolvedMaxHeight - sheetPaddingBottom - 40,
                      160
                    ),
                  },
                ]}
              >
                <ScrollView
                  testID={testID ? `${testID}-scrollable-body` : undefined}
                  contentContainerStyle={styles.scrollableBodyContent}
                  keyboardShouldPersistTaps="handled"
                  onContentSizeChange={(_width, height) =>
                    setScrollContentHeight(height)
                  }
                  onLayout={event =>
                    setScrollViewportHeight(event.nativeEvent.layout.height)
                  }
                  onScroll={event =>
                    setScrollOffsetY(event.nativeEvent.contentOffset.y)
                  }
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator
                  style={styles.scrollableBody}
                >
                  {scrollableBody}
                </ScrollView>
                {hasMoreScrollContent ? (
                  <View
                    accessibilityLabel={t('shared.accessibility.scrollMore', {
                      hint: resolvedScrollHint,
                    })}
                    style={[
                      styles.scrollHint,
                      {
                        backgroundColor: colors.background.surface,
                        borderTopColor: colors.border.primary,
                      },
                    ]}
                    testID={
                      testID ? `${testID}-scroll-overflow-hint` : undefined
                    }
                  >
                    <Text
                      style={[
                        styles.scrollHintText,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {resolvedScrollHint} ↓
                    </Text>
                  </View>
                ) : null}
                {footer ? (
                  <View
                    testID={testID ? `${testID}-footer` : undefined}
                    style={styles.footer}
                  >
                    {footer}
                  </View>
                ) : null}
              </View>
            ) : (
              <View
                style={{
                  paddingHorizontal: sheetHorizontalPadding,
                  paddingTop: mentaSpacing[4],
                  maxHeight: Math.max(
                    resolvedMaxHeight - sheetPaddingBottom - 40,
                    160
                  ),
                }}
              >
                {children}
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  boundedBackdrop: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: mentaSpacing[6],
    paddingVertical: mentaSpacing[6],
  },
  sheet: {
    width: '100%',
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  keyboardAvoider: {
    width: '100%',
  },
  boundedKeyboardAvoider: {
    alignSelf: 'center',
    maxWidth: IPAD_BOUNDED_SHEET_MAX_WIDTH,
  },
  boundedSheet: {
    alignSelf: 'center',
  },
  scrollableContent: {
    flexShrink: 1,
    minHeight: 0,
    paddingHorizontal: mentaSpacing[5],
    paddingTop: mentaSpacing[4],
  },
  scrollableBody: {
    flexShrink: 1,
    minHeight: 0,
  },
  scrollableBodyContent: {
    paddingBottom: mentaSpacing[4],
  },
  scrollHint: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: mentaSpacing[1],
    paddingTop: mentaSpacing[2],
  },
  scrollHintText: {
    ...mentaTypography.captionMedium,
  },
  footer: {
    flexShrink: 0,
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[2],
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: mentaRadii.round,
    marginTop: mentaSpacing[3],
    marginBottom: mentaSpacing[2],
  },
});

export default SimpleBottomSheet;
