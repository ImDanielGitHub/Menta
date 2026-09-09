import React from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppScreen, AppTopBar } from '@/components/ui';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { backOrReplace } from '@/lib/navigation/safe-back';

/**
 * There is no authoritative global support role or issue-decision contract in
 * this application. This route deliberately exposes no local-profile fallback,
 * queue sample, report data, or mutation control.
 */
export default function AdminIssuesScreen() {
  const router = useRouter();

  return (
    <AppScreen
      lane="working"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
      testID="admin-issues-unavailable-screen"
    >
      <AppTopBar onBack={() => backOrReplace(router, '/(tabs)')} />
      <View style={styles.intro}>
        <Text accessibilityRole="header" style={styles.title}>
          Support access required
        </Text>
        <Text style={styles.description}>
          This account is not authorised to view customer reports. No report
          data has been loaded.
        </Text>
      </View>
      <AppButton
        fullWidth
        onPress={() => router.replace('/support')}
        size="large"
        style={styles.returnButton}
        testID="support-system-admin-required-back"
        title="Back to support"
        variant="accent"
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[4],
    maxWidth: mentaLayout.taskLane,
    paddingBottom: mentaSpacing[6],
    width: '100%',
  },
  intro: {
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[8],
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.heading,
  },
  description: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  returnButton: {
    marginTop: 'auto',
  },
});
