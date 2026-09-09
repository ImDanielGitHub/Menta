import { useTranslation } from '@/lib/localization';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckIcon } from '@/components/ui/icons';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  SkeletonButton,
  SkeletonLoader,
} from '@/components/ui';
import { MentaMascot } from '@/components/ui/MentaMascot';
import {
  AppScaledText as Text,
  AppTextScaleProvider,
} from '@/components/ui/AppScaledText';
import { LegalDocumentLinks } from '@/components/legal/LegalDocumentLinks';
import {
  acceptCurrentLegalDocuments,
  getMyLegalAcceptanceStatus,
  resolveLegalReturnPath,
  type LegalAcceptanceStatus,
  type LegalAcceptanceSurface,
} from '@/lib/legal-acceptance';
import { networkManager } from '@/lib/network';
import { useAuthStore } from '@/store/auth-store';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const getSurface = (value?: string): LegalAcceptanceSurface => {
  if (value === 'settings') return 'settings';
  if (value === 'material_update') return 'material_update';
  if (value === 'post_auth') return 'post_auth';
  return 'pre_authoring';
};

const AgreementRow = ({
  checked,
  label,
  onPress,
  testID,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}) => (
  <Pressable
    accessibilityLabel={label}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    onPress={onPress}
    style={({ pressed }) => [styles.agreement, pressed && styles.pressed]}
    testID={testID}
  >
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked ? <CheckIcon color={mentaColors.canvas} size={18} /> : null}
    </View>
    <Text style={styles.agreementText}>{label}</Text>
  </Pressable>
);

export default function LegalAcceptanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const phoneLayout = usePhoneLayout();
  const params = useLocalSearchParams<{
    back?: string | string[];
    next?: string | string[];
    surface?: string | string[];
  }>();
  const activeUserId = useAuthStore(state => state.user?.id ?? null);
  const hasCompletedOnboarding = useAuthStore(
    state => state.hasCompletedOnboarding
  );
  const returnPath = resolveLegalReturnPath(
    getParam(params.next),
    hasCompletedOnboarding
  );
  const backPath = resolveLegalReturnPath(
    getParam(params.back) ?? getParam(params.next),
    hasCompletedOnboarding
  );
  const surface = getSurface(getParam(params.surface));
  const loadRequestRef = useRef(0);
  const saveRequestRef = useRef(0);
  const [status, setStatus] = useState<LegalAcceptanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreementConfirmed, setAgreementConfirmed] = useState(false);

  const loadStatus = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setError(null);
    if (!activeUserId) {
      setStatus(null);
      setError(t('fullAuth.residual.legal.sign_in_again'));
      setLoading(false);
      return;
    }
    try {
      const nextStatus = await getMyLegalAcceptanceStatus(activeUserId);
      if (requestId !== loadRequestRef.current) return;
      setStatus(nextStatus);
      setAgreementConfirmed(false);
    } catch {
      if (requestId !== loadRequestRef.current) return;
      setStatus(null);
      setError(
        networkManager.isOnline()
          ? t('fullAuth.residual.legal.load_online')
          : t('fullAuth.residual.legal.load_offline')
      );
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [activeUserId, t]);

  useEffect(() => {
    saveRequestRef.current += 1;
    setSaving(false);
    void loadStatus();
    return () => {
      loadRequestRef.current += 1;
      saveRequestRef.current += 1;
    };
  }, [loadStatus]);

  const accept = async () => {
    if (
      !status ||
      !activeUserId ||
      status.userId !== activeUserId ||
      status.accepted ||
      !agreementConfirmed ||
      saving
    ) {
      return;
    }

    if (!networkManager.isOnline()) {
      setError(t('fullAuth.residual.legal.save_offline'));
      return;
    }

    const requestId = ++saveRequestRef.current;
    const expectedUserId = activeUserId;
    setSaving(true);
    setError(null);
    try {
      await acceptCurrentLegalDocuments(status, surface, expectedUserId);
      if (requestId !== saveRequestRef.current) return;
      router.replace(returnPath as never);
    } catch (acceptError) {
      if (requestId !== saveRequestRef.current) return;
      const message =
        acceptError instanceof Error
          ? acceptError.message
          : String(acceptError);
      if (message.includes('LEGAL_DOCUMENTS_CHANGED')) {
        setError(t('fullAuth.residual.legal.changed'));
        await loadStatus();
      } else {
        setError(
          networkManager.isOnline()
            ? t('fullAuth.residual.legal.save_online')
            : t('fullAuth.residual.legal.save_connection')
        );
      }
    } finally {
      if (requestId === saveRequestRef.current) setSaving(false);
    }
  };

  const needsAcceptance = status?.requiresAcceptance === true;
  const promiseCreationIsBlocked =
    needsAcceptance && status?.enforcement.promiseCreationRequired === true;
  const acceptanceTitle =
    surface === 'post_auth'
      ? t('fullAuth.residual.legal.title_continue')
      : surface === 'material_update'
        ? t('fullAuth.residual.legal.title_update')
        : surface === 'settings'
          ? t('fullAuth.residual.legal.title_settings')
          : t('fullAuth.residual.legal.title_create');
  const continueTitle =
    surface === 'settings'
      ? t('fullAuth.residual.legal.return_settings')
      : surface === 'pre_authoring'
        ? t('fullAuth.residual.legal.continue_create')
        : t('fullAuth.residual.legal.continue_menta');
  const needsAccountConfirmation = !loading && needsAcceptance;
  const pendingBody =
    surface === 'material_update'
      ? t('fullAuth.residual.legal.body_update')
      : surface === 'post_auth'
        ? t('fullAuth.residual.legal.body_post_auth')
        : surface === 'settings'
          ? t('fullAuth.residual.legal.body_settings')
          : t('fullAuth.residual.legal.body_create');

  return (
    <AppScreen
      contentContainerStyle={[
        styles.screen,
        { paddingHorizontal: phoneLayout.screenInset },
      ]}
      hasTabBar={false}
      lane="focused"
      scrollable
      testID="legal-acceptance"
    >
      <AppTextScaleProvider scale={phoneLayout.textScale}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>
            {t('fullAuth.legal_acceptance.menta')}
          </Text>
          <Pressable
            accessibilityLabel={t(
              'fullAuth.legal_acceptance.leave_legal_review'
            )}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.replace(backPath as never)}
            style={({ pressed }) => [
              styles.headerBack,
              pressed && styles.pressed,
            ]}
            testID="legal-acceptance-back"
          >
            <Text numberOfLines={1} style={styles.headerBackText}>
              {t('fullAuth.legal_acceptance.back')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.intro}>
          <View style={styles.introHero}>
            <Text
              accessibilityRole="header"
              style={styles.title}
              testID="legal-acceptance-title"
            >
              {status?.accepted ? (
                'Your agreements are up to date'
              ) : surface === 'material_update' ? (
                acceptanceTitle
              ) : surface === 'settings' ? (
                acceptanceTitle
              ) : surface === 'post_auth' ? (
                <>
                  {t('fullAuth.legal_acceptance.before_you')}{' '}
                  <Text style={styles.titleAccent}>
                    {t('fullAuth.legal_acceptance.continue')}
                  </Text>
                </>
              ) : (
                <>
                  {t('fullAuth.legal_acceptance.before_you')}{' '}
                  <Text style={styles.titleAccent}>
                    {t('fullAuth.legal_acceptance.create')}
                  </Text>
                </>
              )}
            </Text>
            {needsAccountConfirmation ? (
              <MentaMascot
                accessibilityLabel={t(
                  'fullAuth.legal_acceptance.menta_mascot_beside_your_account_confirmation'
                )}
                size="md"
                state="quiet-anchor"
                style={styles.mascot}
                testID="legal-acceptance-mascot"
              />
            ) : null}
          </View>
          <Text style={styles.body}>
            {status?.accepted
              ? t('fullAuth.residual.legal.accepted')
              : pendingBody}
          </Text>
          {needsAcceptance ? (
            <Text style={styles.helper}>
              {promiseCreationIsBlocked
                ? t('fullAuth.residual.legal.leave_blocked')
                : t('fullAuth.residual.legal.leave_available')}
            </Text>
          ) : null}
        </View>

        <LegalDocumentLinks
          documents={status?.current}
          textScale={phoneLayout.textScale}
          onOpenError={label =>
            setError(
              t('fullAuth.residual.legal.document_open_failed', { label })
            )
          }
          presentation="onboarding"
        />

        {loading ? (
          <View
            accessible
            accessibilityLabel={t(
              'fullAuth.legal_acceptance.checking_the_current_legal_documents'
            )}
            accessibilityRole="progressbar"
            testID="legal-acceptance-loading"
            style={styles.loadingRecord}
          >
            <View style={styles.agreements}>
              <View style={styles.agreement}>
                <SkeletonLoader
                  announce={false}
                  borderRadius={mentaRadii.small}
                  height={24}
                  width={24}
                />
                <View style={styles.loadingAgreementCopy}>
                  <SkeletonLoader announce={false} height={14} width="92%" />
                  <SkeletonLoader announce={false} height={14} width="64%" />
                </View>
              </View>
            </View>
            <SkeletonButton />
          </View>
        ) : null}

        {error ? (
          <AppInlineNotice
            description={error}
            testID="legal-acceptance-error"
            title={t('fullAuth.legal_acceptance.couldn_t_check_your_agreement')}
            tone="warning"
            textScale={phoneLayout.textScale}
          />
        ) : null}

        {!loading && needsAcceptance ? (
          <View style={styles.agreements}>
            <AgreementRow
              checked={agreementConfirmed}
              label={t(
                'fullAuth.legal_acceptance.i_agree_to_menta_s_terms_of_use_and_community_st'
              )}
              onPress={() => setAgreementConfirmed(current => !current)}
              testID="legal-acceptance-confirmation-control"
            />
          </View>
        ) : null}

        <View style={styles.actions}>
          {!loading && needsAcceptance ? (
            <AppButton
              disabled={!agreementConfirmed || saving}
              fullWidth
              loading={saving}
              testID="legal-acceptance-submit"
              title={t('fullAuth.legal_acceptance.agree_and_continue')}
              variant="accent"
              onPress={() => void accept()}
            />
          ) : null}
          {!loading && status?.accepted ? (
            <AppButton
              fullWidth
              testID="legal-acceptance-continue"
              title={continueTitle}
              variant="accent"
              onPress={() => router.replace(returnPath as never)}
            />
          ) : null}
          {!loading && !status ? (
            <AppButton
              fullWidth
              testID="legal-acceptance-retry"
              title={t('fullAuth.legal_acceptance.try_again')}
              variant="secondary"
              onPress={() => void loadStatus()}
            />
          ) : null}
          {needsAcceptance ? (
            <Text style={styles.helper}>
              {t(
                'fullAuth.legal_acceptance.you_can_go_back_without_agreeing_your_account_an'
              )}
            </Text>
          ) : null}
        </View>
      </AppTextScaleProvider>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[8],
    paddingTop: mentaSpacing[3],
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: mentaLayout.minimumTouchTarget,
  },
  headerLabel: {
    color: mentaColors.text.primary,
    ...mentaTypography.bodySemibold,
  },
  headerBack: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    minWidth: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaSpacing[2],
  },
  headerBackText: {
    color: mentaColors.action,
    ...mentaTypography.bodySmallMedium,
  },
  intro: { gap: mentaSpacing[3] },
  introHero: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 104,
  },
  title: {
    color: mentaColors.text.primary,
    flex: 1,
    ...mentaTypography.heading,
  },
  titleAccent: { color: mentaColors.action },
  mascot: { flexShrink: 0 },
  body: { color: mentaColors.text.secondary, ...mentaTypography.body },
  helper: {
    alignSelf: 'center',
    color: mentaColors.text.secondary,
    maxWidth: mentaLayout.readingMeasure,
    textAlign: 'center',
    ...mentaTypography.bodySmall,
  },
  agreements: { gap: mentaSpacing[3] },
  agreement: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: mentaLayout.minimumTouchTarget,
    paddingVertical: mentaSpacing[3],
  },
  checkbox: {
    alignItems: 'center',
    borderColor: mentaColors.border,
    borderRadius: mentaRadii.small,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: mentaColors.action,
    borderColor: mentaColors.action,
  },
  agreementText: {
    color: mentaColors.text.primary,
    flex: 1,
    ...mentaTypography.body,
  },
  actions: { gap: mentaSpacing[4], marginTop: 'auto' },
  loadingRecord: { gap: mentaSpacing[5] },
  loadingAgreementCopy: { flex: 1, gap: mentaSpacing[2], paddingTop: 4 },
  pressed: { opacity: 0.72 },
});
