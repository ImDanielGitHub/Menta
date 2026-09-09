import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { BellIcon } from '@/components/ui/icons';
import { mentaLayout, mentaRadii } from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/lib/localization';

export const NotificationBell: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const handlePress = () => {
    router.push('/notification-settings');
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('navigation.notifications.accessibility')}
      accessibilityHint={t('navigation.notifications.hint')}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed
            ? colors.accent.background
            : colors.background.secondary,
          borderColor: colors.border.primary,
        },
        pressed && styles.pressed,
      ]}
      testID="today-notification-button"
    >
      <BellIcon size={20} color={colors.text.secondary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    width: mentaLayout.minimumTouchTarget,
    height: mentaLayout.minimumTouchTarget,
    borderRadius: mentaRadii.round,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});

export default NotificationBell;
