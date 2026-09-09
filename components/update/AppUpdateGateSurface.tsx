import React from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { ExternalLinkIcon, RefreshCcwIcon } from '@/components/ui/icons';
import ModalCard from '@/components/ui/modal/ModalCard';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { shouldUseIPadTwoColumnLayout } from '@/constants/responsive-layout';
import type { AppUpdateMode } from '@/lib/app-update-policy';
import { useTranslation } from '@/lib/localization/use-translation';

type AppUpdateGateSurfaceProps = {
  busy: boolean;
  currentVersion: string;
  minimumVersion: string;
  mode: AppUpdateMode;
  onDismiss: () => void;
  onGetHelp: () => void;
  onUpdate: () => void;
  visible: boolean;
};

export const AppUpdateGateSurface = ({
  busy,
  currentVersion,
  minimumVersion,
  mode,
  onDismiss,
  onGetHelp,
  onUpdate,
  visible,
}: AppUpdateGateSurfaceProps) => {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const usesWideWorkspace = shouldUseIPadTwoColumnLayout(
    width,
    Platform.OS === 'ios' && Platform.isPad
  );
  const required = mode === 'required';

  return (
    <ModalCard
      accessibilityLabel={
        required
          ? t('shared.accessibility.updateRequired')
          : t('shared.accessibility.updateAvailable')
      }
      dismissOnBackdrop={!required}
      maxWidth={600}
      onClose={required ? () => undefined : onDismiss}
      presentationRole="bounded"
      surface={required ? 'full_screen' : 'sheet'}
      testID={`app-update-${mode}`}
      visible={visible}
    >
      <SafeAreaView style={required ? styles.safeArea : styles.sheetSafeArea}>
        <View
          style={[
            styles.workspace,
            required ? styles.workspaceFull : null,
            required && usesWideWorkspace ? styles.workspaceWide : null,
          ]}
          testID={
            required && usesWideWorkspace
              ? 'app-update-ipad-workspace'
              : 'app-update-compact-workspace'
          }
        >
          <View
            style={[styles.contextPane, required ? styles.workspacePane : null]}
          >
            <View style={styles.icon}>
              <RefreshCcwIcon color={mentaColors.action} size={28} />
            </View>
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>
                {required
                  ? t('shared.update.required.title')
                  : t('shared.update.optional.title')}
              </Text>
              <Text style={styles.body}>
                {required
                  ? t('shared.update.required.description')
                  : t('shared.update.optional.description')}
              </Text>
            </View>
          </View>

          <View
            style={[styles.actionPane, required ? styles.workspacePane : null]}
          >
            <View style={styles.receipt}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>
                  {t('shared.update.onDevice')}
                </Text>
                <Text style={styles.receiptValue}>{currentVersion}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>
                  {required
                    ? t('shared.update.minimumVersion')
                    : t('shared.update.availableVersion')}
                </Text>
                <Text style={styles.receiptValue}>{minimumVersion}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <AppButton
                accessibilityHint={t('shared.update.openStoreHint')}
                fullWidth
                icon={
                  <ExternalLinkIcon
                    color={mentaColors.text.onPaper}
                    size={18}
                  />
                }
                loading={busy}
                onPress={onUpdate}
                size="large"
                testID="app-update-open-store"
                title={t('shared.update.update')}
              />
              {required ? (
                <AppButton
                  fullWidth
                  onPress={onGetHelp}
                  size="large"
                  testID="app-update-get-help"
                  title={t('shared.action.getHelp')}
                  variant="secondary"
                />
              ) : (
                <AppButton
                  fullWidth
                  onPress={onDismiss}
                  size="large"
                  testID="app-update-not-now"
                  title={t('shared.adTracking.notNow')}
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
  contextPane: {
    gap: mentaSpacing[5],
  },
  actionPane: {
    gap: mentaSpacing[5],
  },
  workspacePane: {
    flex: 1,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    height: 56,
    justifyContent: 'center',
    width: 56,
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
  receipt: {
    backgroundColor: mentaColors.raised,
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
  },
  receiptRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
    justifyContent: 'space-between',
  },
  receiptLabel: {
    color: mentaColors.text.secondary,
    ...mentaTypography.caption,
  },
  receiptValue: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  actions: {
    gap: mentaSpacing[3],
  },
});
