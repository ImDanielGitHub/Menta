import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppScreen, AppTopBar } from '@/components/ui';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization/use-translation';

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
      testID="not-found-screen"
    >
      <Stack.Screen options={{ headerShown: false }} />
      <AppTopBar onBack={() => backOrReplace(router, '/(tabs)')} />
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.title}>
          {t('shared.notFound.title')}
        </Text>
        <Text style={styles.description}>
          {t('shared.notFound.description')}
        </Text>
      </View>
      <View style={styles.actions}>
        <AppButton
          fullWidth
          onPress={() => router.replace('/(tabs)')}
          size="large"
          testID="support-system-not-found-home"
          title={t('shared.action.goToToday')}
          variant="accent"
        />
        <AppButton
          fullWidth
          onPress={() => backOrReplace(router, '/(tabs)')}
          testID="support-system-not-found-back"
          title={t('shared.action.goBack')}
          variant="ghost"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[6],
    width: '100%',
  },
  intro: { gap: mentaSpacing[3], paddingTop: mentaSpacing[8] },
  title: { color: mentaColors.text.primary, ...mentaTypography.journeyTitle },
  description: { color: mentaColors.text.secondary, ...mentaTypography.body },
  actions: {
    gap: mentaSpacing[2],
    marginTop: 'auto',
  },
});
