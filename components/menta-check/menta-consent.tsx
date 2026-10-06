import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import {
  type MentaPalette,
  mentaTypography,
  mentaSpacing,
} from '@/constants/MentaDesignSystem';
import { ConsentPalette, useConsentPalette } from './consent-palette';
import type { MediaPermissionState } from '@/hooks/use-menta-media-permission';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { AppButton } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import { MentaNarrator } from '@/components/onboarding/MentaNarrator';
import { useTranslation } from '@/lib/localization';
import {
  acceptMentaCheckMediaConsentV2,
  type MentaConsentSource,
} from '@/lib/menta-check/api';
import { useAuthStore } from '@/store/auth-store';

const disclosureKeys = [
  'mentaCheck.consent.media',
  'mentaCheck.consent.purpose',
  'mentaCheck.consent.scope',
  'mentaCheck.consent.exclusions',
  'mentaCheck.consent.withdrawal',
] as const;

export function MentaConsent({
  visible,
  source,
  renewal = false,
  onAccepted,
  onClose,
}: {
  visible: boolean;
  source: MentaConsentSource;
  renewal?: boolean;
  onAccepted: () => void;
  onClose: () => void;
}) {
  const palette = useConsentPalette();
  const { styles } = useMemo(() => createPaletteStyles(palette), [palette]);
  const { t } = useTranslation();
  const owner = useAuthStore(state => state.user?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const inFlight = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    generation.current += 1;
    inFlight.current = false;
    setBusy(false);
    setError(false);
    return () => {
      generation.current += 1;
    };
  }, [visible, source, owner]);

  const close = () => {
    if (!inFlight.current) onClose();
  };
  const accept = async () => {
    if (inFlight.current || !visible || !owner) return;
    const requestGeneration = generation.current;
    const isCurrent = () =>
      requestGeneration === generation.current &&
      owner === useAuthStore.getState().user?.id;
    inFlight.current = true;
    setBusy(true);
    setError(false);
    try {
      const result = await acceptMentaCheckMediaConsentV2(source);
      if (!isCurrent()) return;
      if (!result.success) throw new Error('CONSENT_NOT_CONFIRMED');
      onAccepted();
    } catch {
      if (isCurrent()) setError(true);
    } finally {
      if (isCurrent()) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  };

  if (!visible) return null;
  return (
    <Modal
      visible
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={close}
    >
      <ConsentPalette>
        <AppScreen
          lane="focused"
          scrollable
          hasTabBar={false}
          showsVerticalScrollIndicator
          contentContainerStyle={styles.screen}
        >
          <AppTopBar onBack={close} />
          <MentaNarrator
            state="pro-active"
            message={t('mentaCheck.consent.bubble')}
          />
          <View style={styles.disclosure}>
            {disclosureKeys.map(key => (
              <Text key={key} style={styles.body}>
                {t(key)}
              </Text>
            ))}
            {error ? (
              <Text accessibilityRole="alert" style={styles.body}>
                {t('mentaCheck.error.generic')}
              </Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            <AppButton
              fullWidth
              size="large"
              loading={busy}
              title={t('mentaCheck.consent.accept')}
              onPress={() => {
                void accept();
              }}
            />
            <AppButton
              fullWidth
              size="large"
              variant="text"
              disabled={busy}
              title={t('mentaCheck.consent.decline')}
              onPress={close}
            />
            {renewal ? (
              <Text style={styles.footnote}>
                {t('mentaCheck.permission.unchanged')}
              </Text>
            ) : null}
          </View>
        </AppScreen>
      </ConsentPalette>
    </Modal>
  );
}

/** Fresh server readback, never a legacy or local acceptance flag, owns status. */
export function MentaPermission({
  visible,
  state,
  onRetry,
  onClose,
  onReview,
  onWithdraw,
}: {
  visible: boolean;
  state: MediaPermissionState;
  onRetry: () => void;
  onClose: () => void;
  onReview: () => void;
  onWithdraw: () => void;
}) {
  const palette = useConsentPalette();
  const { styles } = useMemo(() => createPaletteStyles(palette), [palette]);
  const { t } = useTranslation();
  const confirmed = state === 'allowed';
  const readable = confirmed || state === 'needs-review';
  if (!visible) return null;
  return (
    <Modal
      visible
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
    >
      <ConsentPalette>
        <AppScreen
          lane="focused"
          scrollable
          hasTabBar={false}
          showsVerticalScrollIndicator
          contentContainerStyle={styles.screen}
        >
          <AppTopBar
            onBack={onClose}
            backLabel={t('mentaCheck.settings.title')}
          />
          <MentaNarrator
            state="pro-active"
            message={t('mentaCheck.permission.bubble')}
          />
          {readable ? (
            <View style={styles.permission}>
              <Text accessibilityRole="header" style={styles.title}>
                {t(
                  confirmed
                    ? 'mentaCheck.permission.allowed'
                    : 'mentaCheck.permission.needsReview'
                )}
              </Text>
              <Text style={styles.body}>
                {t(
                  confirmed
                    ? 'mentaCheck.permission.scope'
                    : 'mentaCheck.permission.reviewBody'
                )}
              </Text>
              <Text style={styles.secondary}>
                {t(
                  confirmed
                    ? 'mentaCheck.permission.media'
                    : 'mentaCheck.permission.unchangedUntilChoice'
                )}
              </Text>
              {confirmed ? (
                <Text style={styles.secondary}>
                  {t('mentaCheck.permission.withdrawal')}
                </Text>
              ) : null}
              <AppButton
                fullWidth
                size="large"
                variant={confirmed ? 'outline' : 'primary'}
                title={t(
                  confirmed
                    ? 'mentaCheck.permission.withdraw'
                    : 'mentaCheck.permission.review'
                )}
                onPress={confirmed ? onWithdraw : onReview}
              />
            </View>
          ) : (
            <View style={styles.permission}>
              {state === 'loading' ? (
                <>
                  <SkeletonLoader width="100%" height={24} announce={false} />
                  <Text style={styles.body}>
                    {t('mentaCheck.permission.loading')}
                  </Text>
                </>
              ) : (
                <>
                  <Text accessibilityRole="alert" style={styles.body}>
                    {t('mentaCheck.permission.loadError')}
                  </Text>
                  <AppButton
                    fullWidth
                    size="large"
                    title={t('mentaCheck.permission.retry')}
                    onPress={onRetry}
                  />
                </>
              )}
            </View>
          )}
          <Text style={[styles.footnote, styles.permissionFootnote]}>
            {t('mentaCheck.permission.return')}
          </Text>
        </AppScreen>
      </ConsentPalette>
    </Modal>
  );
}

const createPaletteStyles = (colors: MentaPalette) => ({
  styles: StyleSheet.create({
    screen: { gap: mentaSpacing[4] },
    disclosure: { gap: mentaSpacing[3] },
    actions: {
      marginTop: 'auto',
      paddingTop: mentaSpacing[4],
      gap: mentaSpacing[2],
    },
    permission: { gap: mentaSpacing[5], marginTop: mentaSpacing[3] },
    title: { ...mentaTypography.title, color: colors.text.primary },
    body: { ...mentaTypography.bodySmall, color: colors.text.primary },
    secondary: { ...mentaTypography.bodySmall, color: colors.text.secondary },
    footnote: { ...mentaTypography.caption, color: colors.text.secondary },
    permissionFootnote: { marginTop: 'auto', paddingTop: mentaSpacing[4] },
  }),
});
