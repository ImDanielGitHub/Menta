import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Application from 'expo-application';
import { usePathname, useRouter } from 'expo-router';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { ModalCard } from '@/components/ui/modal/ModalCard';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  shouldPresentLegacyUpdate,
  type LegacyUpdateDecision,
  type LegacyUpdatePlatform,
} from '@/lib/legacy-app-update-policy';
import { loadLegacyUpdatePolicy } from '@/lib/legacy-app-update-policy-client';
import { useTranslation } from '@/lib/localization/use-translation';
import { appStateManager } from '@/lib/app-state-manager';

export const LegacyAppUpdateGate = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const currentVersion =
    Application.nativeApplicationVersion?.trim() || 'unknown';
  const platform: LegacyUpdatePlatform | null =
    Platform.OS === 'ios'
      ? 'ios'
      : Platform.OS === 'android'
        ? 'android'
        : null;
  const [decision, setDecision] = useState<LegacyUpdateDecision>({
    status: 'authority_unknown',
  });
  const [optionalDismissed, setOptionalDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const mountedRef = useRef(true);

  const refreshPolicy = useCallback(async () => {
    if (!platform) return;
    const nextDecision = await loadLegacyUpdatePolicy({
      currentVersion,
      platform,
    });
    if (mountedRef.current) setDecision(nextDecision);
  }, [currentVersion, platform]);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  useEffect(() => {
    void refreshPolicy();
  }, [refreshPolicy]);

  useEffect(() => {
    const unsubscribe = appStateManager.addListener(nextState => {
      if (nextState === 'active') void refreshPolicy();
    });
    return unsubscribe;
  }, [refreshPolicy]);

  const visible = useMemo(() => {
    if (decision.status !== 'offer') return false;
    if (decision.mode === 'optional' && optionalDismissed) return false;
    return shouldPresentLegacyUpdate(pathname, decision.mode);
  }, [decision, optionalDismissed, pathname]);

  const openStore = useCallback(() => {
    if (busy || decision.status !== 'offer') return;
    setBusy(true);
    void Linking.openURL(decision.storeUrl).finally(() => setBusy(false));
  }, [busy, decision]);

  if (decision.status !== 'offer') return null;

  const required = decision.mode === 'required';
  const wide = width >= 760;

  return (
    <ModalCard
      accessibilityLabel={
        required
          ? t('sourceGate.legacyUpdate.accessibilityRequired')
          : t('sourceGate.legacyUpdate.accessibilityAvailable')
      }
      dismissOnBackdrop={!required}
      onClose={required ? () => undefined : () => setOptionalDismissed(true)}
      surface={required ? 'full_screen' : 'sheet'}
      testID={`legacy-app-update-${decision.mode}`}
      visible={visible}
    >
      <SafeAreaView style={required ? styles.safeArea : styles.sheetSafeArea}>
        <View
          style={[
            styles.workspace,
            required && styles.workspaceFull,
            required && wide && styles.workspaceWide,
          ]}
        >
          <View style={styles.copyPane}>
            <View style={styles.mark}>
              <Text style={styles.markText}>{t('brand.name').slice(0, 1)}</Text>
            </View>
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>
                {required
                  ? t('sourceGate.legacyUpdate.titleRequired')
                  : t('sourceGate.legacyUpdate.titleAvailable')}
              </Text>
              <Text style={styles.body}>
                {required
                  ? t('sourceGate.legacyUpdate.bodyRequired')
                  : t('sourceGate.legacyUpdate.bodyAvailable')}
              </Text>
            </View>
          </View>

          <View style={styles.actionPane}>
            <View style={styles.versionCard}>
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>
                  {t('sourceGate.legacyUpdate.currentVersion')}
                </Text>
                <Text style={styles.versionValue}>{currentVersion}</Text>
              </View>
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>
                  {t('sourceGate.legacyUpdate.latestVersion')}
                </Text>
                <Text style={styles.versionValue}>
                  {decision.minimumVersion}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <AppButton
                accessibilityHint={t('sourceGate.legacyUpdate.storeHint')}
                fullWidth
                loading={busy}
                onPress={openStore}
                size="large"
                testID="legacy-app-update-open-store"
                title={t('sourceGate.legacyUpdate.updateAction')}
              />
              {required ? (
                <AppButton
                  fullWidth
                  onPress={() => router.push('/support')}
                  size="large"
                  testID="legacy-app-update-help"
                  title={t('sourceGate.legacyUpdate.helpAction')}
                  variant="secondary"
                />
              ) : (
                <AppButton
                  fullWidth
                  onPress={() => setOptionalDismissed(true)}
                  size="large"
                  testID="legacy-app-update-not-now"
                  title={t('sourceGate.legacyUpdate.notNowAction')}
                  variant="ghost"
                />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ModalCard>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  sheetSafeArea: {
    flexGrow: 0,
  },
  workspace: {
    alignSelf: 'center',
    gap: mentaSpacing[8],
    justifyContent: 'center',
    maxWidth: 680,
    padding: mentaSpacing[6],
    width: '100%',
  },
  workspaceFull: {
    flex: 1,
  },
  workspaceWide: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[12],
    maxWidth: 1040,
  },
  copyPane: {
    flex: 1,
    gap: mentaSpacing[5],
  },
  actionPane: {
    flex: 1,
    gap: mentaSpacing[5],
  },
  mark: {
    alignItems: 'center',
    backgroundColor: mentaColors.action,
    borderRadius: mentaRadii.medium,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  markText: {
    color: mentaColors.text.onPaper,
    ...mentaTypography.title,
  },
  heading: {
    gap: mentaSpacing[3],
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.display,
  },
  body: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  versionCard: {
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
  },
  versionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
    justifyContent: 'space-between',
  },
  versionLabel: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  versionValue: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  actions: {
    gap: mentaSpacing[3],
  },
});
