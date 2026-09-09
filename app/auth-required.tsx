import { useTranslation } from '@/lib/localization';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton, AppScreen } from '@/components/ui';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import {
  mentaColors,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useProtectedRouteStore } from '@/store/protected-route-store';

import { backOrReplace } from '@/lib/navigation/safe-back';
import { usePhoneLayout } from '@/constants/use-phone-layout';
const getParamValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const getProtectedContext = (
  next: string | undefined,
  explicitContext: string | undefined,
  t: ReturnType<typeof useTranslation>['t']
) => {
  if (explicitContext === 'events') {
    return {
      label: t('fullAuth.auth_required.events'),
      title: t('fullAuth.auth_required.sign_in_to_continue_with_this_event'),
      description: t(
        'fullAuth.auth_required.your_place_check_in_and_event_photos_are_saved_t'
      ),
    };
  }

  if (!next) {
    return {
      label: t('fullAuth.auth_required.menta'),
      title: t('fullAuth.auth_required.sign_in_to_continue'),
      description: t(
        'fullAuth.auth_required.your_promises_proof_groups_and_reviews_stay_with'
      ),
    };
  }

  if (next.includes('verification') || next.includes('camera')) {
    return {
      label: t('fullAuth.auth_required.proof'),
      title: t('fullAuth.auth_required.sign_in_to_add_proof'),
      description: t(
        'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an'
      ),
    };
  }

  if (next.includes('group') || next.includes('join')) {
    return {
      label: t('fullAuth.auth_required.groups'),
      title: t('fullAuth.auth_required.sign_in_to_join_this_group'),
      description: t(
        'fullAuth.auth_required.your_invitation_and_group_activity_stay_with_you'
      ),
    };
  }

  if (next.includes('momenta') || next.includes('shop')) {
    return {
      label: t('fullAuth.auth_required.momenta'),
      title: t('fullAuth.auth_required.sign_in_to_use_momenta'),
      description: t(
        'fullAuth.auth_required.your_balance_purchases_and_items_stay_with_your_'
      ),
    };
  }

  if (next.includes('review')) {
    return {
      label: t('fullAuth.auth_required.reviews'),
      title: t('fullAuth.auth_required.sign_in_to_review_proof'),
      description: t(
        'fullAuth.auth_required.menta_records_the_review_under_your_account'
      ),
    };
  }

  return {
    label: t('fullAuth.auth_required.menta'),
    title: t('fullAuth.auth_required.sign_in_to_continue'),
    description: t(
      'fullAuth.auth_required.sign_in_to_complete_this_action_and_return_here_'
    ),
  };
};

export default function AuthRequiredScreen() {
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{
    next?: string | string[];
    context?: string | string[];
  }>();
  const next = getParamValue(params.next);
  const explicitContext = getParamValue(params.context);
  const setPendingProtectedRoute = useProtectedRouteStore(
    state => state.setPendingRoute
  );
  const clearPendingProtectedRoute = useProtectedRouteStore(
    state => state.clearPendingRoute
  );

  const protectedContext = useMemo(
    () => getProtectedContext(next, explicitContext, t),
    [explicitContext, next, t]
  );

  useEffect(() => {
    if (next) {
      setPendingProtectedRoute(next, 'auth_gate');
    }
  }, [next, setPendingProtectedRoute]);

  const handleSignIn = () => {
    if (next) {
      setPendingProtectedRoute(next, 'auth_gate');
    }
    router.push('/login');
  };

  const handleKeepBrowsing = () => {
    clearPendingProtectedRoute();

    backOrReplace(router, '/onboarding-again');
  };

  return (
    <AppScreen
      lane="focused"
      contentContainerStyle={{
        ...styles.screenContent,
        paddingHorizontal: phoneLayout.screenInset,
      }}
      hasTabBar={false}
      scrollable
      testID="auth-required"
    >
      <View style={styles.content}>
        <View style={styles.intro}>
          <Text
            accessibilityRole="header"
            style={styles.title}
            textScale={phoneLayout.textScale}
          >
            {protectedContext.title}
          </Text>
          <Text style={styles.body} textScale={phoneLayout.textScale}>
            {protectedContext.description}
          </Text>
        </View>
        <View style={styles.stack}>
          <AppButton
            title={t('fullAuth.auth_required.sign_in')}
            onPress={handleSignIn}
            fullWidth
            testID="auth-required-sign-in"
            variant="accent"
            textScale={phoneLayout.textScale}
          />
          <AppButton
            title={t('fullAuth.auth_required.keep_browsing')}
            variant="secondary"
            onPress={handleKeepBrowsing}
            fullWidth
            testID="auth-required-keep-browsing"
            textScale={phoneLayout.textScale}
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: mentaSpacing[8],
    maxWidth: mentaLayout.taskLane,
    width: '100%',
  },
  intro: {
    gap: mentaSpacing[3],
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.heading,
  },
  body: {
    color: mentaColors.text.secondary,
    ...mentaTypography.body,
  },
  stack: {
    gap: mentaSpacing[3],
  },
});
