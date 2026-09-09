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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mentaRadii, mentaSpacing } from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';
import { useTheme } from '@/constants/ThemeContext';
import type { ModalSurface } from '@/components/ui/modal/types';
import { useMotionPreferences } from '@/lib/motion/use-motion-preferences';
import { MOTION_DISTANCES, MOTION_DURATIONS } from '@/lib/motion/tokens';
import { useTranslation } from '@/lib/localization/use-translation';

type Props = {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  maxHeight?: number;
  testID?: string;
  dismissOnBackdrop?: boolean;
  surface?: ModalSurface;
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
  scrollableBody,
  scrollHint,
  footer,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const resolvedScrollHint = scrollHint ?? t('shared.accessibility.scrollHint');
  const phoneLayout = usePhoneLayout();
  const { reduceMotion, duration, distance } = useMotionPreferences();
  const justOpenedRef = useRef(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const sheetPaddingBottom = phoneLayout.stackGap + insets.bottom;
  const isSheet = surface === 'sheet';
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
      hardwareAccelerated
      accessibilityViewIsModal
    >
      <View
        style={[
          styles.backdrop,
          { backgroundColor: colors.background.overlay },
        ]}
      >
        <Pressable
          style={{ flex: 1 }}
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
          style={styles.keyboardAvoider}
        >
          <Animated.View
            testID={testID}
            accessibilityViewIsModal
            importantForAccessibility="yes"
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background.surface,
                borderTopColor: colors.border.primary,
                marginHorizontal: 0,
                borderTopLeftRadius: isSheet
                  ? mentaRadii.large
                  : mentaRadii.medium,
                borderTopRightRadius: isSheet
                  ? mentaRadii.large
                  : mentaRadii.medium,
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
                    paddingHorizontal: phoneLayout.screenInset,
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
                  paddingHorizontal: phoneLayout.screenInset,
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
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexShrink: 0,
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[2],
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 8,
  },
});

export default SimpleBottomSheet;
