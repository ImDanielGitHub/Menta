/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars, prefer-const -- Legacy native provider adapters remain outside this callback-binding patch. */
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { withRetry, networkManager } from '@/lib/network';
import { showGlobalToast } from '@/lib/toast-provider';
import {
  captureError as sentryCapture,
  addBreadcrumb as sentryBreadcrumb,
} from '@/lib/sentry';
import Constants from 'expo-constants';
import {
  extractOAuthCodeFromCallback,
  isExpectedOAuthCallbackUrl,
} from '@/lib/oauth-callback';
import { translate } from '@/lib/localization';

const OAUTH_TOAST_ERROR = 'error' as const;

// Minimal base64url decoder that works in RN/Expo (no external deps)
function atobFallback(input: string): string {
  // Use native atob when available
  const g: any = globalThis as any;
  if (typeof g.atob === 'function') return g.atob(input);
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = String(input).replace(/=+$/, '');
  let output = '';
  let bc = 0;
  let bs = 0;
  let buffer = 0;
  let idx = 0;
  for (; (buffer = chars.indexOf(str.charAt(idx++))) !== -1; ) {
    bs = bc % 4 ? bs * 64 + buffer : buffer;
    if (bc++ % 4) {
      const charCode = 255 & (bs >> ((-2 * bc) & 6));
      output += String.fromCharCode(charCode);
    }
  }
  return output;
}

// Ensure auth session is completed on web (noop on native)
try {
  WebBrowser.maybeCompleteAuthSession?.();
} catch {}

const safeOAuthError = (error: unknown, fallback: string): string => {
  const message = error instanceof Error ? error.message : '';
  if (/network|offline|internet|connection|timed out/i.test(message)) {
    return translate('en-NZ', 'domain.oauth.offline');
  }
  if (
    /sign-in was cancelled|sign in was cancelled|isn't available|already open|couldn't finish|couldn't open|wasn't authorised/i.test(
      message
    )
  ) {
    return message;
  }
  return fallback;
};

// Extract OAuth error parameters from callback URL if present
function extractOAuthErrorFromUrl(url: string): {
  error?: string;
  error_description?: string;
} {
  try {
    const parse = (s: string) => new URLSearchParams(s);
    const hashIndex = url.indexOf('#');
    if (hashIndex >= 0) {
      const hash = url.substring(hashIndex + 1);
      const params = parse(hash);
      const error = params.get('error') || undefined;
      const error_description = params.get('error_description') || undefined;
      if (error || error_description) return { error, error_description };
    }
    const qIndex = url.indexOf('?');
    if (qIndex >= 0) {
      const query = url.substring(qIndex + 1);
      const params = parse(query);
      const error = params.get('error') || undefined;
      const error_description = params.get('error_description') || undefined;
      if (error || error_description) return { error, error_description };
    }
  } catch {}
  return {};
}

function base64UrlToUtf8(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atobFallback(padded);
  // Convert binary string to UTF-8 string
  try {
    return decodeURIComponent(
      binary
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return binary;
  }
}

function decodeJwtNonce(idToken: string): string | undefined {
  try {
    const parts = idToken.split('.');
    if (parts.length < 2) return undefined;
    const json = base64UrlToUtf8(parts[1]);
    const payload = JSON.parse(json) as Record<string, unknown>;
    const nonce = payload?.nonce;
    return typeof nonce === 'string' && nonce.length > 0 ? nonce : undefined;
  } catch {
    return undefined;
  }
}

function createSecureNonce(byteCount = 32): string {
  try {
    return Array.from(Crypto.getRandomBytes(byteCount))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return Crypto.randomUUID();
  }
}

// Resolve Google Sign-In only on native platforms, and only when actually needed
let googleConfigured = false;
function getGoogleSignin(): any | null {
  try {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
    const {
      GoogleSignin,
    } = require('@react-native-google-signin/google-signin');
    if (!googleConfigured) {
      try {
        GoogleSignin.configure({
          webClientId: GOOGLE_CONFIG.webClientId,
          iosClientId: GOOGLE_CONFIG.iosClientId,
          offlineAccess: true,
          hostedDomain: '',
          forceCodeForRefreshToken: true,
        });
      } catch {}
      googleConfigured = true;
    }
    return GoogleSignin;
  } catch {
    return null;
  }
}

// Configuration constants
// Google OAuth Configuration
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, any>;
const GOOGLE_CONFIG = {
  webClientId:
    (extra.googleWebClientId as string | undefined) ||
    (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined) ||
    '',
  iosClientId:
    (extra.googleIosClientId as string | undefined) ||
    (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string | undefined) ||
    '',
  androidClientId:
    (extra.googleAndroidClientId as string | undefined) ||
    (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID as string | undefined) ||
    '',
};

// (No top-level initialization; configured lazily in getGoogleSignin())

export interface OAuthResult {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
  cancelled?: boolean;
}

function isAppleAuthCancellation(error: any): boolean {
  const code = String(error?.code || error?.name || '');
  const message = String(error?.message || '').toLowerCase();
  return (
    code === 'ERR_REQUEST_CANCELED' ||
    code === 'ERR_CANCELED' ||
    code === 'ERR_CANCELLED' ||
    message.includes('sign-in was cancelled') ||
    message.includes('sign in was cancelled') ||
    message.includes('user canceled') ||
    message.includes('user cancelled')
  );
}

function isGoogleAuthCancellation(error: any): boolean {
  const code = String(error?.code || error?.name || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return (
    code.includes('SIGN_IN_CANCELLED') ||
    code.includes('SIGN_IN_CANCELED') ||
    code === 'ERR_CANCELED' ||
    code === 'ERR_CANCELLED' ||
    message.includes('sign-in was cancelled') ||
    message.includes('sign in was cancelled') ||
    message.includes('user canceled') ||
    message.includes('user cancelled')
  );
}

function getAppleFullName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null
): string | undefined {
  if (!fullName) return undefined;
  try {
    const formatted = AppleAuthentication.formatFullName(fullName, 'default');
    if (formatted?.trim()) return formatted.trim();
  } catch {}

  const fallback = [
    fullName.givenName,
    fullName.middleName,
    fullName.familyName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fallback || undefined;
}

async function persistAppleProfileMetadata(
  credential: AppleAuthentication.AppleAuthenticationCredential
) {
  const fullName = getAppleFullName(credential.fullName);
  const givenName = credential.fullName?.givenName?.trim();
  const familyName = credential.fullName?.familyName?.trim();
  const email = credential.email?.trim();

  const metadata: Record<string, string> = {};
  if (fullName) metadata.full_name = fullName;
  if (givenName) metadata.given_name = givenName;
  if (familyName) metadata.family_name = familyName;
  if (email) metadata.apple_email = email;

  if (Object.keys(metadata).length === 0) return;

  try {
    const { error } = await supabase.auth.updateUser({ data: metadata });
    if (error) throw error;
    sentryBreadcrumb('apple_profile_metadata_saved', {
      provider: 'apple',
      hasFullName: Boolean(fullName),
      hasEmail: Boolean(email),
    } as any);
  } catch (error) {
    sentryCapture(error, {
      provider: 'apple',
      flow: 'native',
      action: 'persist_profile_metadata',
    });
  }
}

export class OAuthService {
  /**
   * Sign in with Google using native authentication
   */
  static async signInWithGoogle(): Promise<OAuthResult> {
    try {
      sentryBreadcrumb('google_signin_native_start', {
        provider: 'google',
        flow: 'native',
      } as any);
      if (!networkManager.isOnline()) {
        const msg = translate('en-NZ', 'domain.oauth.offline');
        showGlobalToast(msg, OAUTH_TOAST_ERROR);
        return { success: false, error: msg };
      }
      const GoogleSignin = getGoogleSignin();
      // If native module missing, enforce native-only and do not fallback
      if (!GoogleSignin) {
        const msg = translate('en-NZ', 'domain.oauth.google_unavailable');
        showGlobalToast(msg, OAUTH_TOAST_ERROR);
        return { success: false, error: msg };
      }

      // Check if Google Play Services are available (Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      // Sign in with Google (request server auth code to enable token exchange if needed)
      // Native provider sheets are user interactions, not retryable network
      // requests. Retrying here can reopen a sheet after the person cancels.
      const userInfo: any = await GoogleSignin.signIn();
      sentryBreadcrumb('google_signin_native_result', {
        hasUserInfo: !!userInfo,
        resultType: userInfo?.type,
      } as any);

      // @react-native-google-signin/google-signin v14 resolves cancellation
      // instead of rejecting it. Treat that native result as an expected exit
      // before asking the module for tokens or emitting error telemetry.
      if (userInfo?.type === 'cancelled') {
        return {
          success: false,
          error: translate('en-NZ', 'domain.oauth.google_cancelled'),
          cancelled: true,
        };
      }

      const signedInUser =
        userInfo?.type === 'success' ? userInfo.data : userInfo;

      // Try to obtain an ID token and access token
      let idToken: string | undefined = signedInUser?.idToken;
      let accessToken: string | undefined = undefined;
      if (GoogleSignin?.getTokens) {
        try {
          const tokens = await GoogleSignin.getTokens();
          idToken = idToken || tokens?.idToken;
          accessToken = tokens?.accessToken;
          sentryBreadcrumb('google_signin_tokens', {
            hasId: !!idToken,
            hasAccess: !!accessToken,
          } as any);
        } catch (e) {
          sentryBreadcrumb('google_signin_tokens_error', {
            message: (e as any)?.message,
          } as any);
        }
      }
      if (!idToken) {
        throw new Error(translate('en-NZ', 'domain.oauth.google_finish'));
      }

      // Extract nonce from the ID token if present
      const nonce = decodeJwtNonce(idToken);
      const includedNonce = Boolean(nonce);

      // First attempt: include nonce only if the token contains it
      let firstAttemptError: any | null = null;
      let signInData: any | null = null;
      try {
        const request = includedNonce
          ? {
              provider: 'google' as const,
              token: idToken!,
              nonce: nonce as string,
              access_token: accessToken,
            }
          : {
              provider: 'google' as const,
              token: idToken!,
              access_token: accessToken,
            };
        const { data, error } = await withRetry(
          () => supabase.auth.signInWithIdToken(request),
          2,
          800,
          'supabase_google_id_token'
        );
        if (error) throw error;
        signInData = data;
        sentryBreadcrumb('google_signin_supabase_success', {
          attempt: 'first',
          includesNonce: includedNonce,
        } as any);
      } catch (err: any) {
        firstAttemptError = err;
        sentryBreadcrumb('google_signin_supabase_error', {
          attempt: 'first',
          message: String(err?.message || err),
        } as any);
      }

      // If we hit a nonce presence error, retry once toggling nonce presence
      const nonceErrorText = String(
        firstAttemptError?.message || ''
      ).toLowerCase();
      const isPresenceError =
        firstAttemptError &&
        (nonceErrorText.includes('should either both exist') ||
          nonceErrorText.includes('nonce') ||
          nonceErrorText.includes('id_token'));

      if (firstAttemptError && isPresenceError) {
        try {
          const toggledRequest = includedNonce
            ? {
                provider: 'google' as const,
                token: idToken!,
                access_token: accessToken,
              } // previously included -> omit now
            : nonce
              ? {
                  provider: 'google' as const,
                  token: idToken!,
                  nonce: nonce as string,
                  access_token: accessToken,
                } // previously omitted -> include if available
              : {
                  provider: 'google' as const,
                  token: idToken!,
                  access_token: accessToken,
                };
          const { data, error } = await withRetry(
            () => supabase.auth.signInWithIdToken(toggledRequest),
            2,
            800,
            'supabase_google_id_token_retry'
          );
          if (error) throw error;
          signInData = data;
          sentryBreadcrumb('google_signin_supabase_success', {
            attempt: 'retry',
            toggledNonce: true,
          } as any);
        } catch (finalErr: any) {
          sentryBreadcrumb('google_signin_supabase_error', {
            attempt: 'retry',
            message: String(finalErr?.message || finalErr),
          } as any);
          throw finalErr;
        }
      } else if (firstAttemptError && !isPresenceError) {
        throw firstAttemptError;
      }

      const data = signInData!;
      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error: any) {
      if (isGoogleAuthCancellation(error)) {
        return {
          success: false,
          error: translate('en-NZ', 'domain.oauth.google_cancelled'),
          cancelled: true,
        };
      }

      console.error('Google Sign-In Error:', error);
      try {
        sentryCapture(error, { provider: 'google', flow: 'native' });
      } catch {}

      let errorMessage = translate('en-NZ', 'domain.oauth.google_failed');

      if (error.code === 'IN_PROGRESS') {
        errorMessage = translate('en-NZ', 'domain.oauth.google_already_open');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = translate(
          'en-NZ',
          'domain.oauth.google_device_unavailable'
        );
      }

      const friendly = safeOAuthError(error, errorMessage);
      showGlobalToast(friendly, OAUTH_TOAST_ERROR);
      // Native-only: do not fallback to OAuth
      return { success: false, error: friendly || errorMessage };
    }
  }

  /**
   * Sign in with Apple using native authentication
   */
  static async signInWithApple(): Promise<OAuthResult> {
    try {
      if (!networkManager.isOnline()) {
        const msg = translate('en-NZ', 'domain.oauth.offline');
        showGlobalToast(msg, OAUTH_TOAST_ERROR);
        return { success: false, error: msg };
      }
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (!isAvailable) {
        throw new Error(translate('en-NZ', 'domain.oauth.apple_unavailable'));
      }

      // Generate a raw nonce and its SHA256 hash as required by Apple
      const rawNonce = createSecureNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Request Apple authentication (pass hashed nonce)
      sentryBreadcrumb('apple_signin_attempt', {
        provider: 'apple',
        flow: 'native',
      } as any);
      // Do not retry the native provider sheet. Cancellation and denied
      // consent are terminal user choices; only the later token exchange may
      // use the network retry helper.
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken || credential.identityToken === null) {
        throw new Error(translate('en-NZ', 'domain.oauth.apple_finish'));
      }

      // Sign in with Supabase using the Apple ID token
      const { data, error } = await withRetry(
        () =>
          supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken as string,
            // Pass the RAW nonce here; Supabase verifies against hashed nonce in the ID token
            nonce: rawNonce,
          }),
        2,
        800,
        'supabase_apple_id_token'
      );

      if (error) {
        throw error;
      }

      await persistAppleProfileMetadata(credential);

      sentryBreadcrumb('apple_signin_success', {
        provider: 'apple',
        flow: 'native',
      } as any);
      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error: any) {
      console.error('Apple Sign-In Error:', error);
      try {
        sentryCapture(error, {
          provider: 'apple',
          flow: 'native',
          code: error?.code,
          message: error?.message,
        });
      } catch {}

      if (isAppleAuthCancellation(error)) {
        return {
          success: false,
          error: translate('en-NZ', 'domain.oauth.apple_cancelled'),
          cancelled: true,
        };
      }

      let errorMessage = translate(
        'en-NZ',
        'fullAuth.residual.oauth.apple_sign_in_fallback'
      );

      const friendly = safeOAuthError(error, errorMessage);
      showGlobalToast(friendly, OAUTH_TOAST_ERROR);
      return { success: false, error: friendly || errorMessage };
    }
  }

  /**
   * Sign in with Google using OAuth flow (fallback for web or when native fails)
   */
  static async signInWithGoogleOAuth(): Promise<OAuthResult> {
    try {
      sentryBreadcrumb('oauth_google_start', {
        provider: 'google',
        flow: 'oauth',
      } as any);
      if (!networkManager.isOnline()) {
        const msg = translate('en-NZ', 'domain.oauth.offline');
        showGlobalToast(msg, OAUTH_TOAST_ERROR);
        return { success: false, error: msg };
      }
      // Force app scheme to avoid dev localhost/expo proxy redirects
      const redirectTo: string = Linking.createURL('auth/callback');
      sentryBreadcrumb('oauth_redirect_set', {
        provider: 'google',
        redirectTo,
      } as any);

      const { data, error } = await withRetry(
        () =>
          supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo,
              skipBrowserRedirect: true,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          }),
        2,
        800,
        'supabase_oauth_google'
      );

      if (error) {
        throw error;
      }

      const authUrl = (data as any)?.url as string | undefined;
      if (!authUrl) {
        throw new Error(translate('en-NZ', 'domain.oauth.google_open'));
      }
      sentryBreadcrumb('oauth_authorize_url', {
        provider: 'google',
        hasUrl: !!authUrl,
        urlLength: authUrl.length,
      } as any);

      // Open the browser session and wait for redirect back
      const res = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
      sentryBreadcrumb('oauth_browser_result', {
        provider: 'google',
        type: res.type,
        hasUrl: !!(res as any)?.url,
      } as any);
      if (res.type !== 'success' || !res.url) {
        throw new Error(
          res.type === 'cancel'
            ? translate('en-NZ', 'domain.oauth.google_cancelled')
            : translate('en-NZ', 'domain.oauth.google_not_finished')
        );
      }

      if (!isExpectedOAuthCallbackUrl(res.url, redirectTo)) {
        throw new Error(translate('en-NZ', 'domain.oauth.google_unsafe'));
      }

      // If provider returned error in URL, surface it
      const providerErr = extractOAuthErrorFromUrl(res.url);
      if (providerErr.error || providerErr.error_description) {
        try {
          sentryCapture(new Error('oauth_provider_error'), {
            provider: 'google',
            ...providerErr,
          } as any);
        } catch {}
        const msg = translate('en-NZ', 'domain.oauth.google_unauthorised');
        showGlobalToast(msg, OAUTH_TOAST_ERROR);
        return { success: false, error: msg };
      }

      const code = extractOAuthCodeFromCallback(res.url, redirectTo);
      if (code) {
        sentryBreadcrumb('oauth_exchange_code_start', {
          provider: 'google',
        } as any);
        const { data: exData, error: exErr } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exErr) throw exErr;
        sentryBreadcrumb('oauth_exchange_code_success', {
          provider: 'google',
          hasUser: !!exData?.user,
        } as any);
        return {
          success: true,
          user: exData.user,
          session: exData.session,
        } as any;
      }

      throw new Error(translate('en-NZ', 'domain.oauth.google_return'));
    } catch (error: any) {
      console.error('Google OAuth Error:', error);
      try {
        sentryCapture(error, { provider: 'google', flow: 'oauth' });
      } catch {}
      const friendly = safeOAuthError(
        error,
        translate('en-NZ', 'domain.oauth.google_return')
      );
      showGlobalToast(friendly, OAUTH_TOAST_ERROR);
      return { success: false, error: friendly };
    }
  }

  /**
   * Sign in with Apple using OAuth flow (fallback for web)
   */
  static async signInWithAppleOAuth(): Promise<OAuthResult> {
    try {
      sentryBreadcrumb('oauth_apple_start', {
        provider: 'apple',
        flow: 'oauth',
      } as any);
      if (!networkManager.isOnline()) {
        const msg = translate('en-NZ', 'domain.oauth.offline');
        showGlobalToast(msg, OAUTH_TOAST_ERROR);
        return { success: false, error: msg };
      }
      const redirectTo = Linking.createURL('auth/callback');
      sentryBreadcrumb('oauth_redirect_set', {
        provider: 'apple',
        redirectTo,
      } as any);

      const { data, error } = await withRetry(
        () =>
          supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
              redirectTo,
              skipBrowserRedirect: true,
            },
          }),
        2,
        800,
        'supabase_oauth_apple'
      );

      if (error) {
        throw error;
      }

      const authUrl = (data as any)?.url as string | undefined;
      if (!authUrl) {
        throw new Error(translate('en-NZ', 'domain.oauth.apple_open'));
      }

      const res = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
      sentryBreadcrumb('oauth_browser_result', {
        provider: 'apple',
        type: res.type,
        hasUrl: !!(res as any)?.url,
      } as any);
      if (res.type !== 'success' || !res.url) {
        if (res.type === 'cancel') {
          return {
            success: false,
            error: translate('en-NZ', 'domain.oauth.apple_cancelled'),
            cancelled: true,
          };
        }
        throw new Error(translate('en-NZ', 'domain.oauth.apple_not_finished'));
      }

      if (!isExpectedOAuthCallbackUrl(res.url, redirectTo)) {
        throw new Error(translate('en-NZ', 'domain.oauth.apple_unsafe'));
      }

      // If provider returned error in URL, surface it
      const providerErr = extractOAuthErrorFromUrl(res.url);
      if (providerErr.error || providerErr.error_description) {
        try {
          sentryCapture(new Error('oauth_provider_error'), {
            provider: 'apple',
            ...providerErr,
          } as any);
        } catch {}
        const msg = translate('en-NZ', 'domain.oauth.apple_unauthorised');
        showGlobalToast(msg, OAUTH_TOAST_ERROR);
        return { success: false, error: msg };
      }

      const code = extractOAuthCodeFromCallback(res.url, redirectTo);
      if (code) {
        sentryBreadcrumb('oauth_exchange_code_start', {
          provider: 'apple',
        } as any);
        const { data: exData, error: exErr } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exErr) throw exErr;
        sentryBreadcrumb('oauth_exchange_code_success', {
          provider: 'apple',
          hasUser: !!exData?.user,
        } as any);
        return {
          success: true,
          user: exData.user,
          session: exData.session,
        } as any;
      }

      throw new Error(translate('en-NZ', 'domain.oauth.apple_return'));
    } catch (error: any) {
      console.error('Apple OAuth Error:', error);
      try {
        sentryCapture(error, {
          provider: 'apple',
          flow: 'oauth',
          message: error?.message,
        });
      } catch {}
      const friendly = safeOAuthError(
        error,
        translate('en-NZ', 'domain.oauth.apple_return')
      );
      showGlobalToast(friendly, OAUTH_TOAST_ERROR);
      return { success: false, error: friendly };
    }
  }

  /**
   * Sign out from Google
   */
  static async signOutGoogle(): Promise<void> {
    const GoogleSignin = getGoogleSignin();
    if (!GoogleSignin) return;
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
    }
  }

  /**
   * Check if user is signed in with Google
   */
  static async isGoogleSignedIn(): Promise<boolean> {
    const GoogleSignin = getGoogleSignin();
    if (!GoogleSignin) return false;
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current Google user info
   */
  static async getCurrentGoogleUser() {
    const GoogleSignin = getGoogleSignin();
    if (!GoogleSignin) return null;
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      return null;
    }
  }
}

export default OAuthService;
