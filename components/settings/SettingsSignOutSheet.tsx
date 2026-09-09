import { useTranslation } from '@/lib/localization';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppInlineNotice } from '@/components/ui';
import { AppButton } from '@/components/ui/AppButton';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

export type SignOutSheetState = 'confirm' | 'signing-out' | 'failed';

export const SettingsSignOutSheet = ({
  onConfirm,
  onRequestClose,
  status,
  visible,
}: {
  onConfirm: () => void;
  onRequestClose: () => void;
  status: SignOutSheetState;
  visible: boolean;
}) => {
  const { t } = useTranslation();
  const isSigningOut = status === 'signing-out';
  const hasFailed = status === 'failed';

  return (
    <SimpleBottomSheet
      dismissOnBackdrop={!isSigningOut}
      onClose={onRequestClose}
      testID="settings-sign-out-sheet"
      visible={visible}
      scrollableBody={
        <View style={styles.sheetBody}>
          <View
            accessibilityLiveRegion={
              isSigningOut ? 'polite' : hasFailed ? 'assertive' : 'none'
            }
            accessibilityRole={hasFailed ? 'alert' : undefined}
            style={styles.statusCopy}
            testID="settings-sign-out-status"
          >
            <Text style={styles.title}>
              {isSigningOut
                ? 'Signing out…'
                : hasFailed
                  ? 'You are still signed in.'
                  : 'Sign out?'}
            </Text>
            <Text style={styles.body}>
              {isSigningOut
                ? 'Menta is signing out on this phone. Your account and promises remain active.'
                : hasFailed
                  ? 'Sign-out did not finish. Your account is still open on this phone.'
                  : 'This signs you out on this phone. Your account, promises, groups and Momenta stay available.'}
            </Text>
          </View>
          {hasFailed ? (
            <AppInlineNotice
              title={t(
                'fullAuth.component_settings_settingssignoutsheet.sign_out_did_not_finish'
              )}
              description={t(
                'fullAuth.component_settings_settingssignoutsheet.check_the_connection_then_try_again'
              )}
              tone="error"
              testID="settings-sign-out-failed"
            />
          ) : null}
        </View>
      }
      footer={
        <View style={styles.controls} testID="settings-sign-out-controls">
          <AppButton
            disabled={isSigningOut}
            fullWidth
            loading={isSigningOut}
            onPress={onConfirm}
            testID="settings-sign-out-confirm"
            title={
              hasFailed
                ? t(
                    'fullAuth.component_settings_settingssignoutsheet.try_sign_out_again'
                  )
                : t('fullAuth.component_settings_settingssignoutsheet.sign_out')
            }
          />
          <AppButton
            disabled={isSigningOut}
            fullWidth
            onPress={onRequestClose}
            testID="settings-sign-out-cancel"
            title={t('fullAuth.component_settings_settingssignoutsheet.cancel')}
            variant="ghost"
          />
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  controls: {
    gap: mentaSpacing[3],
  },
  sheetBody: {
    gap: mentaSpacing[6],
  },
  statusCopy: {
    gap: mentaSpacing[2],
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.title,
  },
  body: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
});
