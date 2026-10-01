import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/lib/localization';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { CheckIcon } from '@/components/ui/icons';
import { SettingsDirectRow } from './SettingsDirectRow';
import { useAppearanceStore } from '@/store/appearance-store';
import { useTheme } from '@/constants/ThemeContext';
import {
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

/** Local preference works offline and before account details have loaded. */
export function AppearanceSetting() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const preference = useAppearanceStore(state => state.preference);
  const setPreference = useAppearanceStore(state => state.setPreference);
  const options = [
    { value: 'system' as const, label: t('settings.appearance.system') },
    { value: 'light' as const, label: t('settings.appearance.light') },
    { value: 'dark' as const, label: t('settings.appearance.dark') },
  ];
  return (
    <>
      <SettingsDirectRow
        title={t('settings.appearance.title')}
        value={options.find(option => option.value === preference)?.label}
        onPress={() => setVisible(true)}
        testID="settings-appearance"
      />
      <SimpleBottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        testID="appearance-sheet"
        scrollableBody={
          <View style={styles.content}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: colors.text.primary }]}
            >
              {t('settings.appearance.title')}
            </Text>
            <View
              style={[
                styles.group,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.primary,
                },
              ]}
            >
              {options.map((option, index) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  aria-checked={preference === option.value}
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: preference === option.value }}
                  onPress={() => setPreference(option.value)}
                  style={({ pressed }) => [
                    styles.option,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.border.primary,
                    },
                    pressed && { backgroundColor: colors.accent.background },
                  ]}
                >
                  <Text style={[styles.label, { color: colors.text.primary }]}>
                    {option.label}
                  </Text>
                  {preference === option.value ? (
                    <CheckIcon size={20} color={colors.accent.primary} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: mentaSpacing[5], paddingBottom: mentaSpacing[4] },
  title: { ...mentaTypography.title },
  group: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mentaRadii.large,
    overflow: 'hidden',
  },
  option: {
    minHeight: 56,
    paddingHorizontal: mentaSpacing[4],
    paddingVertical: mentaSpacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: mentaSpacing[3],
  },
  label: { ...mentaTypography.body, flex: 1 },
});
