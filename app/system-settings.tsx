import { useTranslation } from '@/lib/localization';
import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton, AppInlineNotice, AppScreen } from '@/components/ui';
import { SupportPageHeader } from '@/components/support/SupportPageHeader';
import { ExternalLinkIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { backOrReplace } from '@/lib/navigation/safe-back';

type HandoffNotice = {
  title: string;
  description: string;
  tone: 'info' | 'warning';
} | null;

/**
 * Native settings is a handoff only. The operating system owns the setting and
 * Menta must re-check its own permission/account state when the user returns.
 */
export default function SystemSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [notice, setNotice] = useState<HandoffNotice>(null);

  const openSettings = async () => {
    try {
      await Linking.openSettings();
      setNotice({
        tone: 'info',
        title: t('fullAuth.system_settings.return_when_you_re_done'),
        description: t(
          'fullAuth.system_settings.opening_phone_settings_does_not_confirm_that_a_p'
        ),
      });
    } catch {
      setNotice({
        tone: 'warning',
        title: t('fullAuth.system_settings.phone_settings_could_not_open'),
        description: t(
          'fullAuth.system_settings.nothing_changed_in_menta_open_your_phone_setting'
        ),
      });
    }
  };

  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
      testID="system-settings-screen"
    >
      <SupportPageHeader
        onBack={() => backOrReplace(router, '/support')}
        title={t('fullAuth.system_settings.phone_settings')}
      />
      <View style={styles.handoff}>
        <Text style={styles.description}>
          {t('fullAuth.support.change_menta_permissions_on_this_phone')}
        </Text>
        {notice ? (
          <AppInlineNotice
            description={notice.description}
            testID="system-settings-notice"
            title={notice.title}
            tone={notice.tone}
          />
        ) : null}
        <View style={styles.actions}>
          <AppButton
            fullWidth
            onPress={() => void openSettings()}
            rightIcon={
              <ExternalLinkIcon color={mentaColors.canvas} size={18} />
            }
            size="large"
            testID="support-system-open-settings"
            title={t('fullAuth.system_settings.open_phone_settings')}
            variant="accent"
          />
          <AppButton
            fullWidth
            onPress={() => backOrReplace(router, '/support')}
            testID="support-system-settings-later"
            title={t('fullAuth.system_settings.back_to_support')}
            variant="outline"
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    flexGrow: 1,
    paddingBottom: mentaSpacing[12],
    paddingTop: mentaSpacing[6],
    width: '100%',
  },
  handoff: {
    flex: 1,
    gap: mentaSpacing[6],
    justifyContent: 'center',
    paddingBottom: mentaSpacing[12],
  },
  description: {
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
    ...mentaTypography.lead,
  },
  actions: { gap: mentaSpacing[3] },
});
