import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useAuthStore } from '@/store/auth-store';
import { useReferralStore } from '@/store/referral-store';
import { useTranslation } from '@/lib/localization';
import { isValidReferralCode, normalizeInviteCode } from '@/lib/invite-links';

export default function InviteRedirectScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setPendingReferral, clearPendingReferral } = useReferralStore();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasCompletedOnboarding = useAuthStore(
    state => state.hasCompletedOnboarding
  );
  const params = useLocalSearchParams<{ ref?: string | string[] }>();
  const [savedReferralCode, setSavedReferralCode] = useState<string | null>(
    null
  );
  const [hasMissingReferral, setHasMissingReferral] = useState(false);
  const [isExistingAccountReferral, setIsExistingAccountReferral] =
    useState(false);

  const referralCode = useMemo(() => {
    const value = Array.isArray(params.ref) ? params.ref[0] : params.ref;
    return normalizeInviteCode(value);
  }, [params.ref]);

  useEffect(() => {
    if (!isValidReferralCode(referralCode)) {
      setHasMissingReferral(true);
      setSavedReferralCode(null);
      setIsExistingAccountReferral(false);
      return;
    }

    if (isAuthenticated && hasCompletedOnboarding) {
      if (user?.id) {
        clearPendingReferral(user.id, referralCode);
      }
      setSavedReferralCode(null);
      setHasMissingReferral(false);
      setIsExistingAccountReferral(true);
      return;
    }

    try {
      setPendingReferral(referralCode, user?.id ?? null);
      setSavedReferralCode(referralCode);
      setHasMissingReferral(false);
      setIsExistingAccountReferral(false);
    } catch {
      setHasMissingReferral(true);
      setSavedReferralCode(null);
      setIsExistingAccountReferral(false);
      return;
    }

    const redirectTimer = setTimeout(() => {
      router.replace('/');
    }, 700);

    return () => clearTimeout(redirectTimer);
  }, [
    clearPendingReferral,
    hasCompletedOnboarding,
    isAuthenticated,
    referralCode,
    router,
    setPendingReferral,
    user?.id,
  ]);

  const handleContinue = () => {
    router.replace('/');
  };

  const title = hasMissingReferral
    ? t('groups.redirect.referral_missing_title')
    : isExistingAccountReferral
      ? t('groups.redirect.referral_existing_title')
      : t('groups.redirect.referral_opening');
  const subtitle = hasMissingReferral
    ? t('groups.redirect.referral_missing_subtitle')
    : isExistingAccountReferral
      ? t('groups.redirect.referral_existing_subtitle')
      : t('groups.redirect.referral_opening_subtitle');

  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
      testID="invite-referral-screen"
    >
      <AppTopBar
        title={t('groups.redirect.referral_title')}
        titleIsHeading={false}
      />
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {hasMissingReferral ? (
          <>
            <AppInlineNotice
              title={t('groups.redirect.referral_missing_notice')}
              description={t('groups.redirect.referral_missing_detail')}
              tone="warning"
              testID="invite-referral-missing-notice"
            />
            <AppButton
              title={t('groups.redirect.without_referral')}
              onPress={handleContinue}
              fullWidth
            />
          </>
        ) : isExistingAccountReferral ? (
          <>
            <AppInlineNotice
              title={t('groups.redirect.account_ready')}
              description={t('groups.redirect.account_ready_detail')}
              tone="info"
              testID="invite-referral-existing-account-notice"
            />
            <AppButton
              title={t('groups.redirect.continue_menta')}
              onPress={handleContinue}
              fullWidth
            />
          </>
        ) : (
          <AppInlineNotice
            title={
              savedReferralCode
                ? t('groups.redirect.referral_saved')
                : t('groups.redirect.one_moment')
            }
            description={
              savedReferralCode
                ? t('groups.redirect.referral_saved_detail')
                : t('groups.redirect.referral_checking')
            }
            tone={savedReferralCode ? 'success' : 'info'}
            testID="invite-referral-status-notice"
          />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: mentaSpacing[4],
    paddingTop: mentaSpacing[2],
  },
  content: {
    alignSelf: 'center',
    flex: 1,
    gap: mentaSpacing[6],
    justifyContent: 'center',
    maxWidth: mentaLayout.taskLane,
    width: '100%',
  },
  heading: {
    gap: mentaSpacing[2],
  },
  title: {
    ...mentaTypography.heading,
    color: mentaColors.text.primary,
  },
  subtitle: {
    ...mentaTypography.body,
    color: mentaColors.text.secondary,
  },
});
