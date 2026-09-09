import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthStore } from '@/store/auth-store';
import { showToast } from '@/components/ui/Toast';
import { AppInlineNotice } from '@/components/ui/AppFeedback';
import { GoogleGlyph } from '@/components/ui/google-glyph';
import { googleProviderLabelTypography } from '@/components/ui/google-provider-style';
import { useTranslation } from '@/lib/localization/use-translation';
import type { TranslationKey } from '@/lib/localization/en-NZ';

const tokens = {
  panel: '#101111',
  panelRaised: '#181919',
  text: '#F8F7F1',
  divider: 'rgba(248, 247, 241, 0.16)',
};

const isAuthCancelled = (message: string) =>
  message.toLowerCase().includes('sign-in was cancelled') ||
  message.toLowerCase().includes('sign in was cancelled');

type OAuthProvider = 'google' | 'apple';

const providerFailureMessage = (
  provider: OAuthProvider,
  error: unknown,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
): string => {
  const providerName = provider === 'google' ? 'Google' : 'Apple';
  const message = error instanceof Error ? error.message : '';
  if (/network|offline|internet|connection|timed out/i.test(message)) {
    return t('shared.oauth.offline');
  }
  if (/not available|unavailable|missing/i.test(message)) {
    return t('shared.oauth.providerUnavailable', { provider: providerName });
  }
  return t('shared.oauth.providerFailed', { provider: providerName });
};

type OAuthNotice = {
  title: string;
  message: string;
  tone: 'info' | 'error';
} | null;

interface OAuthButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

const GoogleSignInButton: React.FC<OAuthButtonProps> = ({
  onPress,
  disabled = false,
  compact = false,
  style,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handlePress = useCallback(async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);
    try {
      await onPress();
    } catch (error) {
      console.error('[OAuthButtons] Google sign-in error:', error);
      showToast.error(
        t('shared.oauth.providerFailed', { provider: 'Google' }),
        providerFailureMessage('google', error, t)
      );
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isLoading, onPress, t]);

  return (
    <ProviderButton
      label={t('shared.oauth.continueGoogle')}
      icon={<GoogleGlyph />}
      onPress={handlePress}
      disabled={disabled}
      loading={isLoading}
      compact={compact}
      testID="btnGoogleSignInFallback"
      style={style}
    />
  );
};

const AppleSignInButton: React.FC<OAuthButtonProps> = ({
  onPress,
  disabled = false,
  compact = false,
  style,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const [isAvailable, setIsAvailable] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let mounted = true;
    AppleAuthentication.isAvailableAsync()
      .then(available => mounted && setIsAvailable(available))
      .catch(() => mounted && setIsAvailable(true));
    return () => {
      mounted = false;
    };
  }, []);

  const handlePress = useCallback(async () => {
    if (isLoading || disabled || !isAvailable) return;
    setIsLoading(true);
    try {
      await onPress();
    } catch (error) {
      console.error('[OAuthButtons] Apple sign-in error:', error);
      showToast.error(
        t('shared.oauth.providerFailed', { provider: 'Apple' }),
        providerFailureMessage('apple', error, t)
      );
    } finally {
      setIsLoading(false);
    }
  }, [disabled, isAvailable, isLoading, onPress, t]);

  if (Platform.OS !== 'ios' || !isAvailable) {
    return null;
  }

  const locked = disabled || isLoading;

  return (
    <View
      pointerEvents={locked ? 'none' : 'auto'}
      style={[
        styles.nativeButtonWrap,
        compact && styles.nativeButtonWrapCompact,
        locked && styles.disabled,
        style,
      ]}
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={10}
        style={[styles.appleButton, compact && styles.appleButtonCompact]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={t('shared.oauth.continueApple')}
        accessibilityState={{ disabled: locked, busy: isLoading }}
        testID="btnAppleSignIn"
      />
      {isLoading ? <ProviderLoadingOverlay dark /> : null}
    </View>
  );
};

const ProviderButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  testID: string;
  style?: StyleProp<ViewStyle>;
}> = ({ label, icon, onPress, disabled, loading, compact, testID, style }) => (
  <View style={[styles.buttonWrap, compact && styles.buttonWrapCompact, style]}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.providerButton,
        compact && styles.providerButtonCompact,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      <View style={styles.iconSlot}>{icon}</View>
      <Text style={styles.providerText}>{label}</Text>
      <View style={styles.iconSlot} />
    </Pressable>
    {loading ? <ProviderLoadingOverlay /> : null}
  </View>
);

const ProviderLoadingOverlay: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <View style={styles.loadingOverlay}>
    <View style={[styles.loadingPill, dark && styles.loadingPillDark]}>
      <ActivityIndicator size="small" color={dark ? '#080909' : tokens.text} />
    </View>
  </View>
);

export const OAuthButtons: React.FC<{
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  pendingDescription?: string;
  onPendingChange?: (
    isPending: boolean,
    provider: OAuthProvider | null
  ) => void;
  onSuccess?: (provider: OAuthProvider) => void | Promise<void>;
}> = ({
  compact = false,
  style,
  disabled = false,
  pendingDescription,
  onPendingChange,
  onSuccess,
}) => {
  const { signInWithGoogle, signInWithApple } = useAuthStore();
  const { t } = useTranslation();
  const resolvedPendingDescription =
    pendingDescription ?? t('shared.oauth.pending');
  const [notice, setNotice] = useState<OAuthNotice>(null);
  const [activeProvider, setActiveProvider] = useState<OAuthProvider | null>(
    null
  );
  const isPending = Boolean(activeProvider);

  const handleOAuth = useCallback(
    async (provider: OAuthProvider, action: () => Promise<void>) => {
      if (activeProvider || disabled) return;

      try {
        setActiveProvider(provider);
        onPendingChange?.(true, provider);
        setNotice(null);
        await action();
        await onSuccess?.(provider);
      } catch (err: unknown) {
        const rawMessage = err instanceof Error ? err.message : '';
        if (isAuthCancelled(rawMessage)) {
          setNotice({
            title: t('shared.oauth.cancelled.title'),
            message: t('shared.oauth.cancelled.message'),
            tone: 'info',
          });
          return;
        }
        const providerName = provider === 'google' ? 'Google' : 'Apple';
        const title = t('shared.oauth.providerFailed', {
          provider: providerName,
        });
        const message = providerFailureMessage(provider, err, t);
        console.error(`[OAuthButtons] ${provider} sign-in error:`, err);
        setNotice({
          title,
          message,
          tone: 'error',
        });
        showToast.error(title, message);
      } finally {
        setActiveProvider(null);
        onPendingChange?.(false, null);
      }
    },
    [activeProvider, disabled, onPendingChange, onSuccess, t]
  );

  const appleHandler = useMemo(
    () => () => handleOAuth('apple', signInWithApple),
    [handleOAuth, signInWithApple]
  );
  const googleHandler = useMemo(
    () => () => handleOAuth('google', signInWithGoogle),
    [handleOAuth, signInWithGoogle]
  );

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      {isPending ? (
        <AppInlineNotice
          testID="oauth-pending-notice"
          title={t('shared.oauth.opening', {
            provider: activeProvider === 'google' ? 'Google' : 'Apple',
          })}
          description={resolvedPendingDescription}
          tone="info"
        />
      ) : null}
      {notice ? (
        <AppInlineNotice
          testID="oauth-status-notice"
          title={notice.title}
          description={notice.message}
          tone={notice.tone}
        />
      ) : null}
      <AppleSignInButton
        compact={compact}
        disabled={disabled || isPending}
        onPress={appleHandler}
      />
      <GoogleSignInButton
        compact={compact}
        disabled={disabled || isPending}
        onPress={googleHandler}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    width: '100%',
  },
  containerCompact: {
    gap: 8,
  },
  nativeButtonWrap: {
    height: 54,
    justifyContent: 'center',
    width: '100%',
  },
  nativeButtonWrapCompact: {
    height: 50,
  },
  appleButton: {
    height: 54,
    width: '100%',
  },
  appleButtonCompact: {
    height: 50,
  },
  buttonWrap: {
    minHeight: 54,
    width: '100%',
  },
  buttonWrapCompact: {
    minHeight: 50,
  },
  providerButton: {
    alignItems: 'center',
    backgroundColor: tokens.panelRaised,
    borderColor: tokens.divider,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  providerButtonCompact: {
    borderRadius: 10,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  providerText: {
    color: tokens.text,
    flex: 1,
    ...googleProviderLabelTypography,
    textAlign: 'center',
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 9, 9, 0.72)',
    borderRadius: 18,
    height: 38,
    justifyContent: 'center',
    width: 54,
  },
  loadingPillDark: {
    backgroundColor: 'rgba(248, 247, 241, 0.82)',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.48,
  },
});

export default OAuthButtons;
