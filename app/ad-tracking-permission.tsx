import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  getMetaAdsTrackingStatus,
  requestMetaAdsTrackingPermission,
  type MetaAdsTrackingStatus,
} from '@/lib/meta-ads';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization/use-translation';

type ScreenState = 'education' | 'granted' | 'denied' | 'unavailable';

const toScreenState = (status: MetaAdsTrackingStatus): ScreenState => {
  if (status === 'granted' || status === 'denied' || status === 'unavailable') {
    return status;
  }
  return 'education';
};

export default function AdTrackingPermissionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [screenState, setScreenState] = useState<ScreenState>('education');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
    tone: 'info' | 'warning' | 'error';
  } | null>(null);

  const close = useCallback(() => {
    backOrReplace(router, '/settings');
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      const status = await getMetaAdsTrackingStatus();
      if (cancelled) return;
      setScreenState(toScreenState(status));
      setBusy(false);
    };

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermission = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const status = await requestMetaAdsTrackingPermission();
      setScreenState(toScreenState(status));
      if (status === 'unavailable') {
        setNotice({
          title: t('shared.adTracking.promptFailed.title'),
          description: t('shared.adTracking.promptFailed.description'),
          tone: 'error',
        });
      }
    } catch {
      setScreenState('unavailable');
      setNotice({
        title: t('shared.adTracking.promptFailed.title'),
        description: t('shared.adTracking.promptFailed.description'),
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const content = (() => {
    switch (screenState) {
      case 'education':
        return (
          <>
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>
                {t('shared.adTracking.education.title')}
              </Text>
              <Text style={styles.body}>
                {t('shared.adTracking.education.body')}
              </Text>
            </View>
            <View style={styles.actions}>
              <AppButton
                accessibilityHint={t('shared.adTracking.continueHint')}
                fullWidth
                loading={busy}
                size="large"
                testID="ad-tracking-education-continue"
                title={t('shared.adTracking.continue')}
                onPress={() => void requestPermission()}
              />
              <AppButton
                fullWidth
                size="large"
                testID="ad-tracking-education-not-now"
                title={t('shared.adTracking.notNow')}
                variant="ghost"
                onPress={close}
              />
            </View>
          </>
        );
      case 'granted':
        return (
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('shared.adTracking.granted.title')}
            </Text>
            <Text style={styles.body}>
              {t('shared.adTracking.granted.body')}
            </Text>
          </View>
        );
      case 'denied':
        return (
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('shared.adTracking.denied.title')}
            </Text>
            <Text style={styles.body}>
              {t('shared.adTracking.denied.body')}
            </Text>
          </View>
        );
      case 'unavailable':
        return (
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('shared.adTracking.unavailable.title')}
            </Text>
            <Text style={styles.body}>
              {t('shared.adTracking.unavailable.body')}
            </Text>
          </View>
        );
    }
  })();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen
        lane="focused"
        safeArea
        scrollable
        hasTabBar={false}
        contentContainerStyle={styles.lane}
        testID="ad-tracking-permission-screen"
      >
        <AppTopBar
          subtitle={t('shared.adTracking.optional')}
          title={t('shared.adTracking.title')}
          titleIsHeading={false}
          onBack={close}
        />
        <View style={styles.stateFrame}>
          {notice ? (
            <AppInlineNotice
              description={notice.description}
              testID="ad-tracking-status-notice"
              title={notice.title}
              tone={notice.tone}
            />
          ) : null}
          {content}
        </View>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  lane: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[8],
    paddingBottom: mentaSpacing[12],
    paddingTop: mentaSpacing[6],
    width: '100%',
  },
  stateFrame: {
    flexGrow: 1,
    gap: mentaSpacing[6],
    justifyContent: 'center',
    paddingBottom: mentaSpacing[12],
  },
  heading: {
    gap: mentaSpacing[3],
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.title,
  },
  body: {
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
    ...mentaTypography.body,
  },
  actions: {
    gap: mentaSpacing[3],
    paddingTop: mentaSpacing[1],
  },
});
