import {
  type MentaPalette,
  mentaTypography,
  mentaSpacing,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { AppButton } from '@/components/ui/AppButton';
import { SimpleBottomSheet } from '@/components/ui/SimpleBottomSheet';
import { MentaNarrator } from '@/components/onboarding/MentaNarrator';

import { APP_PRIVACY_URL } from '@/constants/LegalLinks';
import { useTranslation } from '@/lib/localization';
import {
  setMentaCheckConsent,
  type MentaConsentSource,
} from '@/lib/menta-check/api';
import { useAuthStore } from '@/store/auth-store';

export function MentaConsent({
  visible,
  source,
  onAccepted,
  onClose,
}: {
  visible: boolean;
  source: MentaConsentSource;
  onAccepted: () => void;
  onClose: () => void;
}) {
  const { styles } = useMentaStyles(createPaletteStyles);

  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const accept = async () => {
    if (busy) return;
    const owner = useAuthStore.getState().user?.id;
    setBusy(true);
    setError(false);
    try {
      const result = await setMentaCheckConsent(true, source);
      if (owner !== useAuthStore.getState().user?.id) return;
      if (!result.success) throw new Error('CONSENT_FAILED');
      onAccepted();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <SimpleBottomSheet
      visible={visible}
      onClose={() => {
        if (!busy) onClose();
      }}
      scrollableBody
      footer={
        <View style={styles.actions}>
          <AppButton
            fullWidth
            loading={busy}
            title={t('mentaCheck.consent.accept')}
            onPress={() => {
              void accept();
            }}
          />
          <AppButton
            variant="text"
            disabled={busy}
            title={t('mentaCheck.consent.decline')}
            onPress={onClose}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <MentaNarrator
          state="menta-check"
          message={t('mentaCheck.consent.bubble')}
        />
        {[
          {
            title: t('mentaCheck.consent.photoTitle'),
            body: t('mentaCheck.consent.photoBody'),
          },
          {
            title: t('mentaCheck.consent.timeTitle'),
            body: t('mentaCheck.consent.timeBody'),
          },
          {
            title: t('mentaCheck.consent.neverTitle'),
            body: t('mentaCheck.consent.neverBody'),
          },
        ].map(row => (
          <View key={row.title} style={styles.row}>
            <Text style={styles.title}>{row.title}</Text>
            <Text style={styles.body}>{row.body}</Text>
          </View>
        ))}
        <Text style={styles.body}>{t('mentaCheck.consent.disclosure')}</Text>
        <AppButton
          variant="text"
          title={t('mentaCheck.consent.policyLink')}
          onPress={() => {
            void Linking.openURL(APP_PRIVACY_URL);
          }}
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.body}>
            {t('mentaCheck.error.generic')}
          </Text>
        ) : null}
      </View>
    </SimpleBottomSheet>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const styles = StyleSheet.create({
    actions: { gap: mentaSpacing[2], paddingTop: mentaSpacing[3] },
    content: { gap: mentaSpacing[5], paddingVertical: mentaSpacing[4] },
    row: { gap: mentaSpacing[2] },
    title: { ...mentaTypography.bodyMedium, color: mentaColors.text.primary },
    body: { ...mentaTypography.body, color: mentaColors.text.secondary },
  });
  return { styles };
};
