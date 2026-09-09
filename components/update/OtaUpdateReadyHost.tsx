import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  downloadAvailableOtaUpdate,
  restartIntoDownloadedOta,
} from '@/lib/ota-updates';
import { useTranslation } from '@/lib/localization/use-translation';
import { appStateManager } from '@/lib/app-state-manager';

const MIN_CHECK_INTERVAL_MS = 30_000;

export const OtaUpdateReadyHost = ({ enabled }: { enabled: boolean }) => {
  const [ready, setReady] = useState(false);
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const checkingRef = useRef(false);
  const lastCheckAtRef = useRef(0);

  const checkForUpdate = useCallback(async () => {
    if (!enabled || checkingRef.current || ready) {
      return;
    }

    const now = Date.now();
    if (now - lastCheckAtRef.current < MIN_CHECK_INTERVAL_MS) return;
    lastCheckAtRef.current = now;
    checkingRef.current = true;

    try {
      const result = await downloadAvailableOtaUpdate();
      if (result === 'ready') {
        setDismissed(false);
        setReady(true);
      }
    } catch {
      // Update checks are best effort. The embedded and last known-good updates
      // remain available through expo-updates rollback protection.
    } finally {
      checkingRef.current = false;
    }
  }, [enabled, ready]);

  useEffect(() => {
    void checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    if (!enabled) return undefined;
    const unsubscribe = appStateManager.addListener(nextState => {
      if (nextState === 'active') void checkForUpdate();
    });
    return unsubscribe;
  }, [checkForUpdate, enabled]);

  const restart = useCallback(() => {
    if (restarting) return;
    setRestarting(true);
    void restartIntoDownloadedOta().catch(() => setRestarting(false));
  }, [restarting]);

  return (
    <ModalCard
      accessibilityLabel={t('shared.update.ready.accessibility')}
      dismissOnBackdrop
      onClose={() => setDismissed(true)}
      surface="sheet"
      testID="ota-update-ready"
      visible={enabled && ready && !dismissed}
    >
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.copy}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('shared.update.ready.title')}
            </Text>
            <Text style={styles.description}>
              {t('shared.update.ready.description')}
            </Text>
          </View>
          <View style={styles.actions}>
            <AppButton
              fullWidth
              loading={restarting}
              onPress={restart}
              size="large"
              testID="ota-update-restart"
              title={t('shared.update.ready.restart')}
            />
            <AppButton
              fullWidth
              onPress={() => setDismissed(true)}
              size="large"
              testID="ota-update-later"
              title={t('shared.update.ready.later')}
              variant="ghost"
            />
          </View>
        </View>
      </SafeAreaView>
    </ModalCard>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: mentaColors.surface,
  },
  content: {
    alignSelf: 'center',
    gap: mentaSpacing[6],
    maxWidth: 600,
    padding: mentaSpacing[6],
    width: '100%',
  },
  copy: {
    gap: mentaSpacing[2],
  },
  title: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
  },
  description: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
  actions: {
    gap: mentaSpacing[2],
  },
});
