import {
  type MentaPalette,
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import { useTranslation } from '@/lib/localization';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton, AppScreen } from '@/components/ui';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { getProtectedAuthCopy } from '@/lib/auth/protected-gate-copy';
import { useProtectedRouteStore } from '@/store/protected-route-store';

import { backOrReplace } from '@/lib/navigation/safe-back';
import { usePhoneLayout } from '@/constants/use-phone-layout';
const getParamValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default function AuthRequiredScreen() {
  const { styles } = useMentaStyles(createPaletteStyles);

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
    () => getProtectedAuthCopy({ next, explicitContext, t }),
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

const createPaletteStyles = (mentaColors: MentaPalette) => {
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
  return { styles };
};
