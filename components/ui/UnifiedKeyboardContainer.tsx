import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePhoneLayout } from '@/constants/use-phone-layout';

interface UnifiedKeyboardContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  enableKeyboardDismiss?: boolean;
  dismissOnScroll?: boolean;
  scrollBehavior?: 'auto' | 'smooth';
  scrollEnabled?: boolean;
}

/**
 * Unified Keyboard Container following Expo's best practices
 * Handles keyboard avoiding behavior consistently across iOS and Android
 * Enhanced with better scroll-to-dismiss keyboard functionality
 */
export const UnifiedKeyboardContainer: React.FC<
  UnifiedKeyboardContainerProps
> = ({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  enableKeyboardDismiss = true,
  dismissOnScroll = true,
  scrollBehavior: _scrollBehavior = 'auto',
  scrollEnabled = true,
}) => {
  const insets = useSafeAreaInsets();
  const phoneLayout = usePhoneLayout();

  const dismissKeyboard = () => {
    if (enableKeyboardDismiss) {
      Keyboard.dismiss();
    }
  };

  const handleScrollBeginDrag = () => {
    if (dismissOnScroll) {
      Keyboard.dismiss();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? Math.max(insets.top, 8) : 0
      }
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
        {scrollEnabled ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.contentContainer,
              {
                paddingBottom:
                  insets.bottom + phoneLayout.keyboardBottomPadding,
              },
              contentContainerStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={dismissOnScroll ? 'on-drag' : 'none'}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            bounces={true}
            scrollEventThrottle={16}
            onScrollBeginDrag={handleScrollBeginDrag}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.nonScrollContent,
              {
                paddingBottom:
                  insets.bottom + phoneLayout.keyboardBottomPadding,
              },
              contentContainerStyle,
            ]}
          >
            {children}
          </View>
        )}
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  nonScrollContent: {
    flex: 1,
  },
});
