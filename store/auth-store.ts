import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { supabase, SupabaseUser, SUPABASE_URL } from '@/lib/supabase';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useMomentaStore } from './momenta-store';
import { handleNetworkError, withRetry, networkManager } from '@/lib/network';
import { isOperationalFeatureEnabled } from '@/lib/operational-flags';
import { OAuthService, OAuthResult } from '@/lib/oauth';
import Constants from 'expo-constants';
import { notificationService } from '@/lib/services/notification-service';
import { showGlobalToast } from '@/lib/toast-provider';
import {
  setUser as sentrySetUser,
  clearUser as sentryClearUser,
  logError,
} from '@/lib/sentry';
import {
  isNewAuthUser,
  resolveMetaAdsRegistrationMethod,
  trackMetaAdsSignUp,
} from '@/lib/meta-ads';
import { RevenueCatAPI } from '@/lib/paywall/revenuecat';
import {
  getMyProfile,
  updateMyProfile,
  type MyProfilePatch,
} from '@/lib/profile-api';
import { clearAccountScopedState } from '@/lib/account-session-lifecycle';
import {
  loadOnboardingDraftForUser,
  type OnboardingAccountabilityChoice,
} from '@/lib/onboarding-draft';
import { useOnboardingCompletionStore } from '@/lib/navigation/onboarding-completion';
import { retentionNotificationClient } from '@/lib/notifications/retention-notification-client';
import { translate } from '@/lib/localization';
import {
  getMainAuthEventAction,
  shouldRejectMainAuthEvent,
} from '@/lib/auth/main-auth-event-policy';
import { getDefaultSupabaseAuthStorageKey } from '@/lib/auth/password-recovery-config';
import {
  confineUnexpectedMainRecovery,
  getMainRecoveryQuarantineUserId,
} from '@/lib/auth/main-recovery-quarantine';
import { EMAIL_CONFIRMATION_REDIRECT_PATH } from '@/lib/auth/email-confirmation-config';
import {
  isEmailConfirmationForSession,
  useEmailConfirmationStore,
} from '@/store/email-confirmation-store';
import { trackProductEvent, trackProductOperation } from '@/lib/posthog';
import { withTimeout } from '@/utils/api';

const AUTH_CANCELLED_CODE = 'AUTH_CANCELLED';
const ONBOARDING_ACCOUNT_CHANGED_CODE = 'ONBOARDING_ACCOUNT_CHANGED';
const ONBOARDING_COMPLETION_TIMEOUT_MS = 15_000;
const authStoreDebugLog = (..._args: unknown[]) => undefined;
const mainAuthStorageKey =
  getDefaultSupabaseAuthStorageKey(SUPABASE_URL) ??
  'menta-main-auth-storage-unresolved';

const isExpectedSessionEndError = (error: unknown): boolean => {
  const message = String(
    (error as { message?: unknown } | null)?.message ?? error ?? ''
  ).toLowerCase();
  return (
    message.includes('auth session missing') ||
    message.includes('refresh token not found') ||
    message.includes('invalid refresh token') ||
    message.includes('auth session revoked') ||
    message.includes('session revoked') ||
    message.includes('user not found')
  );
};

const isSessionCheckTimeout = (error: unknown): boolean =>
  String(
    (error as { message?: unknown } | null)?.message ?? error ?? ''
  ).includes('Session check timeout');

const isAuthCancelled = (error: unknown) => {
  const anyError = error as { code?: unknown; message?: unknown };
  const code = String(anyError?.code || '');
  const message = String(anyError?.message || '').toLowerCase();
  return (
    code === AUTH_CANCELLED_CODE ||
    message.includes('sign-in was cancelled') ||
    message.includes('sign in was cancelled')
  );
};

const createAuthCancelledError = () => {
  const error = new Error('Sign-in was cancelled');
  (error as Error & { code?: string }).code = AUTH_CANCELLED_CODE;
  return error;
};

const createOnboardingAccountChangedError = () => {
  const error = new Error(
    'Your account changed while Menta confirmed onboarding. Reopen onboarding to continue.'
  );
  (error as Error & { code?: string }).code = ONBOARDING_ACCOUNT_CHANGED_CODE;
  return error;
};

// Define our App User structure, potentially merging Supabase Auth and DB profile data
export interface User {
  id: string; // From Supabase Auth
  username: string; // From DB
  email?: string; // From Supabase Auth
  avatarUrl?: string; // From DB
  momentaBalance?: number; // From DB
  isAdmin?: boolean;
  // Add other fields from your 'users' table as needed
}

export type EmailRegistrationResult =
  | {
      status: 'session_confirmed';
      email: string;
      userId: string;
    }
  | {
      status: 'confirmation_required';
      email: string;
      userId: string | null;
    };

const EMAIL_REGISTRATION_SESSION_CONFIRMED = 'session_confirmed' as const;
const EMAIL_REGISTRATION_CONFIRMATION_REQUIRED =
  'confirmation_required' as const;

export type EmailConfirmationSessionRecoveryResult =
  | 'session_confirmed'
  | 'no_session'
  | 'account_mismatch';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  hasCompletedOnboarding: boolean;

  // Singleton auth listener management
  authListenerActive: boolean;

  // Actions
  initializeAuth: () => Promise<void>;
  setUserAndSession: (
    supabaseUser: SupabaseUser | null,
    session: Session | null
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<EmailRegistrationResult>;
  resendEmailConfirmation: (email: string) => Promise<void>;
  recoverEmailConfirmationSession: (
    email: string
  ) => Promise<EmailConfirmationSessionRecoveryResult>;
  logout: () => Promise<void>;
  clearAuthData: () => void;
  completeOnboarding: (context?: {
    activationPath:
      | 'first_promise'
      | 'promise_invite'
      | 'group_invite'
      | 'event_invite';
    referralUsed?: boolean;
    completionHandoff?: {
      firstPromiseId: string;
      accountabilityChoice: OnboardingAccountabilityChoice;
    };
  }) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (params: {
    username?: string;
    avatarUrl?: string | null;
  }) => Promise<void>;

  // OAuth methods
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogleOAuth: () => Promise<void>;
  signInWithAppleOAuth: () => Promise<void>;
}

interface AuthPersistedState {
  hasCompletedOnboarding: boolean;
}

// Single instance of auth state change subscription
let authStateSubscription: ReturnType<
  typeof supabase.auth.onAuthStateChange
> | null = null;

// This epoch represents account authority, not access-token rotation. Supabase
// refreshes JWTs during one session; that must not invalidate in-flight work
// which still belongs to the same user.
let accountIdentityEpoch = 0;
// Only a server-confirmed completion in this account lifetime can supersede
// a profile read that started before the completion write committed.
let completedOnboardingAccountEpoch: number | null = null;
let accountTeardownBarrier: Promise<void> = Promise.resolve();
let emailRegistrationInFlight: Promise<EmailRegistrationResult> | null = null;
let emailConfirmationResendInFlight: Promise<void> | null = null;

const queueAccountTeardown = (
  userId: string | null | undefined
): Promise<void> => {
  const teardown = accountTeardownBarrier.then(() =>
    clearAccountScopedState(userId)
  );
  // A later session transition must wait until the current account teardown
  // has settled, even when that teardown reports an error to its own caller.
  accountTeardownBarrier = teardown.catch(() => undefined);
  return teardown;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      hasCompletedOnboarding: false,
      authListenerActive: false,

      initializeAuth: async () => {
        const currentState = get();

        // Prevent multiple initializations
        if (currentState.isInitialized || currentState.isLoading) {
          return;
        }

        set({ isLoading: true });

        try {
          // Set up the auth state change listener FIRST (if not already active)
          if (!currentState.authListenerActive && !authStateSubscription) {
            authStateSubscription = supabase.auth.onAuthStateChange(
              async (event: AuthChangeEvent, session: Session | null) => {
                // Use setTimeout to avoid deadlocks as recommended by Supabase
                setTimeout(async () => {
                  const store = get();
                  const eventAction = getMainAuthEventAction(event);
                  const quarantinedUserId =
                    eventAction === 'accept_session'
                      ? await getMainRecoveryQuarantineUserId()
                      : null;

                  const rejectMainRecovery = async (userId: string) => {
                    try {
                      await confineUnexpectedMainRecovery({
                        storageKey: mainAuthStorageKey,
                        userId,
                        signOut: () =>
                          supabase.auth.signOut({ scope: 'local' }),
                      });
                    } catch {
                      // The durable quarantine remains when local token
                      // removal cannot be verified.
                    } finally {
                      store.clearAuthData();
                    }
                  };

                  if (
                    shouldRejectMainAuthEvent({
                      action: eventAction,
                      hasRecoveryQuarantine: Boolean(quarantinedUserId),
                    })
                  ) {
                    await rejectMainRecovery(
                      quarantinedUserId ??
                        session?.user.id ??
                        'unknown-recovery-user'
                    );
                    return;
                  }

                  if (eventAction === 'ignore') {
                    return;
                  }

                  switch (event) {
                    case 'INITIAL_SESSION':
                      if (session?.user) {
                        await store.setUserAndSession(session.user, session);
                      }
                      break;

                    case 'SIGNED_IN':
                      if (session?.user) {
                        const current = get();
                        const sameReadyAccount =
                          current.isInitialized &&
                          !current.isLoading &&
                          current.isAuthenticated &&
                          current.user?.id === session.user.id;

                        if (sameReadyAccount) {
                          // A confirmed session for the account already on
                          // screen is not a new account transition.
                          set({ session });
                        } else {
                          await store.setUserAndSession(session.user, session);
                        }
                      }
                      break;

                    case 'TOKEN_REFRESHED':
                      if (session?.user) {
                        const current = get();
                        if (
                          current.isAuthenticated &&
                          current.user?.id === session.user.id
                        ) {
                          // JWT rotation is session maintenance. Keep the
                          // existing profile and routing authority mounted.
                          set({ session });
                        } else {
                          // Recover an unexpected refresh event only when the
                          // local account is not established yet.
                          await store.setUserAndSession(session.user, session);
                        }
                      }
                      break;

                    case 'SIGNED_OUT':
                      store.clearAuthData();
                      break;

                    case 'USER_UPDATED':
                      if (session?.user) {
                        // Refresh user data when user is updated
                        await store.setUserAndSession(session.user, session);
                      }
                      break;
                  }
                }, 0);
              }
            );

            set({ authListenerActive: true });
            authStoreDebugLog('[AuthStore] Auth state listener set up');
          }

          // Get the initial session with a short timeout to avoid blocking UI
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Session check timeout')), 2000)
          );

          try {
            const {
              data: { session },
              error,
            } = await Promise.race([sessionPromise, timeoutPromise]);

            if (error) {
              const previousUserId = get().user?.id;
              if (isExpectedSessionEndError(error)) {
                await clearAccountScopedState(previousUserId);
                set({
                  isInitialized: true,
                  isLoading: false,
                  isAuthenticated: false,
                  user: null,
                  session: null,
                  hasCompletedOnboarding: false,
                });
              } else {
                console.error(
                  '[AuthStore] Error getting initial session:',
                  error
                );
                // A transport failure is not proof that the local session
                // ended. Preserve any active account until Supabase emits a
                // definitive session event or a later check succeeds.
                set({ isInitialized: true, isLoading: false });
              }
              return;
            }

            authStoreDebugLog(
              '[AuthStore] Initial session check completed:',
              !!session
            );

            if (session?.user) {
              // Restore directly as well as listening for auth events. The
              // listener can be delayed or silent during persisted-session
              // hydration; setUserAndSession deduplicates the same token.
              await get().setUserAndSession(session.user, session);
            } else {
              set({
                isInitialized: true,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                session: null,
              });
            }
          } catch (sessionError) {
            const previousUserId = get().user?.id;
            if (isExpectedSessionEndError(sessionError)) {
              await clearAccountScopedState(previousUserId);
              set({
                isInitialized: true,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                session: null,
                hasCompletedOnboarding: false,
              });
            } else if (isSessionCheckTimeout(sessionError)) {
              console.warn(
                '[AuthStore] Session check timed out - this may happen on slow networks'
              );
              console.warn(
                '[AuthStore] App will continue to function, authentication will work when network improves'
              );
            } else {
              console.warn(
                '[AuthStore] Session check failed; preserving current auth state'
              );
              set({ isInitialized: true, isLoading: false });
            }
            if (isSessionCheckTimeout(sessionError)) {
              set({ isInitialized: true, isLoading: false });
            }
          }
        } catch (error) {
          console.error('[AuthStore] Auth initialization error:', error);
          set({
            isInitialized: true,
            isLoading: false,
          });
        }
      },

      setUserAndSession: async (
        supabaseUser: SupabaseUser | null,
        session: Session | null
      ) => {
        authStoreDebugLog(
          '[AuthStore] Setting user and session:',
          !!supabaseUser,
          !!session
        );

        const currentState = get();
        const sameReadyAccount =
          Boolean(supabaseUser && session) &&
          currentState.isAuthenticated &&
          currentState.isInitialized &&
          !currentState.isLoading &&
          currentState.user?.id === supabaseUser?.id;
        if (sameReadyAccount && session) {
          // A same-account session update can rotate credentials without
          // invalidating the profile or replacing the visible navigator.
          set({ session });
          return;
        }

        const currentUserId = currentState.user?.id ?? null;
        const nextUserId = supabaseUser?.id ?? null;
        const accountIdentityChanged =
          !supabaseUser || !session || currentUserId !== nextUserId;
        const accountEpoch = accountIdentityChanged
          ? ++accountIdentityEpoch
          : accountIdentityEpoch;

        if (!supabaseUser || !session) {
          const previousUserId = currentState.user?.id;
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: true,
            hasCompletedOnboarding: false,
          });
          if (previousUserId) {
            await queueAccountTeardown(previousUserId);
          }
          if (accountEpoch !== accountIdentityEpoch) return;
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
            hasCompletedOnboarding: false,
          });
          useMomentaStore.getState().clearMomentaData();
          try {
            sentryClearUser();
          } catch {}
          return;
        }

        try {
          const isAccountSwitch = Boolean(
            currentState.user?.id && currentState.user.id !== supabaseUser.id
          );
          if (isAccountSwitch) {
            // Supabase has already changed session authority. Remove account A
            // from the interactive UI before any asynchronous teardown so no
            // action can run under B's credentials while displaying A.
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: true,
              hasCompletedOnboarding: false,
            });
            await queueAccountTeardown(currentState.user?.id);
          } else {
            await accountTeardownBarrier;
          }

          if (accountEpoch !== accountIdentityEpoch) return;

          const isSameAccount = currentState.user?.id === supabaseUser.id;
          // Activation is intentionally unconditional: a v4 persisted Momenta
          // snapshot has no owner, even when auth restores the same user id.
          useMomentaStore.getState().activateAccountScope(supabaseUser.id);

          // 1) Fast-path: set minimal authenticated state immediately to unblock navigation
          const minimalUser: User = {
            id: supabaseUser.id,
            username: supabaseUser.user_metadata?.username || '',
            email: supabaseUser.email || undefined,
            avatarUrl: supabaseUser.user_metadata?.avatar_url || undefined,
            // Never display a previous account's balance while this account's
            // profile is still loading after a session handoff.
            momentaBalance:
              currentState.user?.id === supabaseUser.id
                ? (currentState.user.momentaBalance ?? 0)
                : 0,
          };
          set({
            user: minimalUser,
            session,
            isAuthenticated: true,
            isInitialized: true,
            // Route authority is not ready until the matching profile confirms
            // this account's onboarding state. Exposing the temporary false
            // value can send an existing user back through onboarding.
            isLoading: true,
            // Never carry an earlier account's completion state across handoff.
            hasCompletedOnboarding: isSameAccount
              ? currentState.hasCompletedOnboarding ||
                completedOnboardingAccountEpoch === accountEpoch
              : false,
          });
          const isCurrentAccountSession = () => {
            const latest = get();
            return (
              accountEpoch === accountIdentityEpoch &&
              latest.user?.id === supabaseUser.id &&
              latest.isAuthenticated
            );
          };
          // Set Sentry user context early
          try {
            sentrySetUser({
              id: minimalUser.id,
            });
          } catch {}

          // 2) Background: fetch additional user profile data to enrich state
          // Fetch additional user profile data from our custom table
          const profile = await getMyProfile();

          // A delayed profile response must never overwrite a newer account
          // after A -> B switching or a revoked-session clear.
          if (!isCurrentAccountSession()) {
            return;
          }

          if (!profile) {
            notificationService.stopUserScopedWork(supabaseUser.id);
            await queueAccountTeardown(supabaseUser.id);
            if (!isCurrentAccountSession()) return;
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
              hasCompletedOnboarding: false,
            });
            useMomentaStore.getState().clearMomentaData();
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError && !isExpectedSessionEndError(signOutError)) {
              console.warn(
                '[AuthStore] Could not finish missing-profile sign-out:',
                signOutError
              );
            }
            return;
          }

          const appUser: User = {
            id: supabaseUser.id,
            username: profile.username ?? '',
            email: supabaseUser.email,
            avatarUrl:
              profile.avatar_url ||
              supabaseUser.user_metadata?.avatar_url ||
              undefined,
            momentaBalance: profile.momenta_balance || 0,
          };

          try {
            await loadOnboardingDraftForUser({
              userId: appUser.id,
              hasCompletedOnboarding:
                profile.has_completed_onboarding === true ||
                completedOnboardingAccountEpoch === accountEpoch,
            });
          } catch (draftError) {
            console.warn(
              '[AuthStore] Could not reconcile the local onboarding draft:',
              draftError
            );
          }

          if (!isCurrentAccountSession()) {
            return;
          }

          authStoreDebugLog(
            '[AuthStore] User profile loaded successfully, onboarding:',
            profile.has_completed_onboarding
          );
          notificationService.startUserScopedWork(appUser.id);
          set({
            user: appUser,
            // Keep a token rotated while profile hydration was in flight.
            session: get().session ?? session,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            hasCompletedOnboarding:
              profile.has_completed_onboarding === true ||
              completedOnboardingAccountEpoch === accountEpoch,
          });

          try {
            const confirmationStore = useEmailConfirmationStore.getState();
            const pendingConfirmation = confirmationStore.hasHydrated
              ? confirmationStore.pending
              : await confirmationStore.hydrate();
            if (
              pendingConfirmation &&
              isEmailConfirmationForSession(pendingConfirmation, supabaseUser)
            ) {
              await useEmailConfirmationStore
                .getState()
                .clearForEmail(pendingConfirmation.email);
            }
          } catch {
            // A confirmed account remains authoritative even if the optional
            // confirmation-screen receipt cannot be cleaned up immediately.
          }

          // External notification identity is allowed only after the matching
          // database profile is confirmed. The facade serialises later
          // account teardown and degrades to a no-op until a provider is
          // explicitly configured.
          void retentionNotificationClient
            .bindConfirmedProfile({
              userId: appUser.id,
              profileConfirmed: true,
            })
            .then(async bound => {
              if (!bound) return false;
              const notificationPreferences =
                await notificationService.getUserPreferences(appUser.id);
              if (!isCurrentAccountSession()) return false;

              const emailNeedsSync = Boolean(
                appUser.email &&
                (notificationPreferences?.marketing_email_opt_in ||
                  notificationPreferences?.marketing_email_provider_sync_pending)
              );
              const results = await Promise.allSettled([
                retentionNotificationClient.recordEvent('app_opened', {
                  source: 'system',
                }),
                retentionNotificationClient.syncAudienceTags({
                  marketing_email_opt_in:
                    notificationPreferences?.marketing_email_opt_in ?? false,
                  notification_permission:
                    notificationPreferences?.device_permission_status ??
                    'undetermined',
                }),
                emailNeedsSync && appUser.email
                  ? retentionNotificationClient.syncEmailSubscription(
                      appUser.email,
                      notificationPreferences?.marketing_email_opt_in ?? false
                    )
                  : Promise.resolve(false),
              ]);
              const emailResult = results[2];
              if (
                emailNeedsSync &&
                emailResult.status === 'fulfilled' &&
                emailResult.value === true &&
                isCurrentAccountSession()
              ) {
                await notificationService.updateUserPreferences(appUser.id, {
                  marketing_email_provider_sync_pending: false,
                });
              }
              return true;
            })
            .catch(() => undefined);

          // Update Sentry user context (non-blocking)
          try {
            sentrySetUser({
              id: appUser.id,
            });
          } catch {}

          if (isNewAuthUser(supabaseUser)) {
            trackMetaAdsSignUp({
              userId: appUser.id,
              method: resolveMetaAdsRegistrationMethod(supabaseUser),
            });
          }

          // Store any temporary push token that was obtained during initialization (non-blocking)
          void notificationService
            .storeTemporaryTokenForUser(appUser.id)
            .catch(tokenError => {
              console.warn(
                '[AuthStore] Failed to store temporary push token:',
                tokenError
              );
            });

          // Re-sync local challenge reminders after login in case schedules were lost
          // (e.g. fresh install, TestFlight upgrade, or OS-level schedule reset).
          void notificationService
            .syncChallengeRemindersForUser(appUser.id)
            .catch(reminderSyncError => {
              console.warn(
                '[AuthStore] Failed to sync challenge reminders:',
                reminderSyncError
              );
            });

          // Sync momenta data (non-blocking)
          void useMomentaStore
            .getState()
            .syncWithBackend(appUser.id)
            .catch(syncError => {
              console.warn(
                '[AuthStore] Failed to sync momenta data:',
                syncError
              );
            });

          // Referral acceptance belongs to the first-promise activation flow.
          // Authentication only restores the account and its local referral
          // code; it must not create referral or reward facts in parallel.
        } catch (error) {
          if (accountEpoch !== accountIdentityEpoch) return;
          if (isExpectedSessionEndError(error)) {
            notificationService.stopUserScopedWork(supabaseUser.id);
            await queueAccountTeardown(supabaseUser.id);
            if (accountEpoch !== accountIdentityEpoch) return;
            try {
              sentryClearUser();
            } catch {}
          } else {
            console.error('[AuthStore] Error in setUserAndSession:', error);
          }
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
          });
          useMomentaStore.getState().clearMomentaData();
        }
      },

      refreshSession: async () => {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.refreshSession();
          if (error) throw error;

          if (session?.user) {
            await get().setUserAndSession(session.user, session);
          } else {
            // A successful refresh response with no session is authoritative:
            // the local account has ended even when Supabase returns no error.
            await get().setUserAndSession(null, null);
          }
        } catch (error) {
          if (!isExpectedSessionEndError(error)) {
            console.error('[AuthStore] Failed to refresh session:', error);
            return;
          }
          await get().setUserAndSession(null, null);
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Offline guard
          if (!networkManager.isOnline()) {
            const msg = translate('en-NZ', 'domain.network.no_connection');
            showGlobalToast(msg, 'error');
            throw new Error(msg);
          }
          const authData = await withRetry(async () => {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) throw error;
            return data;
          });

          if (authData.session?.user) {
            await get().setUserAndSession(
              authData.session.user as SupabaseUser,
              authData.session
            );
            // Reaching this line proves the person explicitly completed a
            // password sign-in. It is safe to retire an earlier pending
            // signup, including when they chose a different existing account.
            await useEmailConfirmationStore.getState().clear();
          }

          authStoreDebugLog('Login successful');
          showGlobalToast(
            translate('en-NZ', 'sourceGate.auth.signedInSuccessfully'),
            'success'
          );
          // Auth state change listener will handle the session update
        } catch (error) {
          logError(new Error('Login failed'), {
            email: email?.substring(0, 3) + '***',
            component: 'AuthStore',
            action: 'login',
          });
          const friendlyError = handleNetworkError(error);
          showGlobalToast(friendlyError, 'error');
          throw new Error(friendlyError);
        } finally {
          set({ isLoading: false });
        }
      },

      register: (email, password, username) => {
        if (emailRegistrationInFlight) return emailRegistrationInFlight;

        const normalizedEmail = email.trim().toLowerCase();
        const attempt = (async (): Promise<EmailRegistrationResult> => {
          set({ isLoading: true });
          try {
            if (!networkManager.isOnline()) {
              throw new Error(
                translate('en-NZ', 'domain.network.no_connection')
              );
            }

            // A signup email is a send operation. Do not automatically replay
            // it after a transport ambiguity; the confirmation screen owns a
            // bounded resend action.
            const { data, error } = await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                data: {
                  username,
                },
                emailRedirectTo: Linking.createURL(
                  EMAIL_CONFIRMATION_REDIRECT_PATH
                ),
              },
            });

            if (error) throw error;
            trackMetaAdsSignUp({
              userId: data.user?.id,
              method: 'email',
            });
            authStoreDebugLog('Registration request accepted');

            if (data.session?.user) {
              await get().setUserAndSession(
                data.session.user as SupabaseUser,
                data.session
              );
              await useEmailConfirmationStore
                .getState()
                .clearForEmail(normalizedEmail);
              return {
                status: EMAIL_REGISTRATION_SESSION_CONFIRMED,
                email: normalizedEmail,
                userId: data.session.user.id,
              };
            }

            if (!data.user) {
              throw new Error(
                'Menta could not confirm whether the signup request was accepted.'
              );
            }

            // A returned user without a session means email confirmation is
            // still required. It is not an authenticated account receipt.
            return {
              status: EMAIL_REGISTRATION_CONFIRMATION_REQUIRED,
              email: normalizedEmail,
              userId: data.user.id || null,
            };
          } catch (error) {
            logError(new Error('Registration failed'), {
              email: normalizedEmail.substring(0, 3) + '***',
              username: username?.substring(0, 3) + '***',
              component: 'AuthStore',
              action: 'register',
            });
            const friendlyError = handleNetworkError(error);
            throw new Error(friendlyError);
          } finally {
            set({ isLoading: false });
          }
        })();

        emailRegistrationInFlight = attempt;
        const releaseLock = () => {
          if (emailRegistrationInFlight === attempt) {
            emailRegistrationInFlight = null;
          }
        };
        void attempt.then(releaseLock, releaseLock);
        return attempt;
      },

      resendEmailConfirmation: email => {
        if (emailConfirmationResendInFlight) {
          return emailConfirmationResendInFlight;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const attempt = (async () => {
          if (!networkManager.isOnline()) {
            throw new Error(translate('en-NZ', 'domain.network.no_connection'));
          }

          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: normalizedEmail,
            options: {
              emailRedirectTo: Linking.createURL(
                EMAIL_CONFIRMATION_REDIRECT_PATH
              ),
            },
          });
          if (error) throw error;
        })();

        emailConfirmationResendInFlight = attempt;
        const releaseLock = () => {
          if (emailConfirmationResendInFlight === attempt) {
            emailConfirmationResendInFlight = null;
          }
        };
        void attempt.then(releaseLock, releaseLock);
        return attempt;
      },

      recoverEmailConfirmationSession: async email => {
        const normalizedEmail = email.trim().toLowerCase();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session?.user) return 'no_session';

        const pending = useEmailConfirmationStore.getState().pending;
        if (
          session.user.email?.trim().toLowerCase() !== normalizedEmail ||
          (pending && !isEmailConfirmationForSession(pending, session.user))
        ) {
          return 'account_mismatch';
        }

        await get().setUserAndSession(session.user as SupabaseUser, session);
        await useEmailConfirmationStore
          .getState()
          .clearForEmail(normalizedEmail);
        return 'session_confirmed';
      },

      logout: async () => {
        if (get().isLoading) {
          throw new Error('A session change is already in progress.');
        }

        set({ isLoading: true });
        const userId = get().user?.id;
        try {
          // Pause user-scoped services before asking Supabase to end the
          // session, but do not clear local account state until the sign-out
          // request has a trustworthy result. A failed request must leave the
          // signed-in account authoritative and retryable.
          if (userId) {
            notificationService.stopUserScopedWork(userId);
          }

          const { error } = await supabase.auth.signOut();
          if (error && !isExpectedSessionEndError(error)) {
            throw error;
          }

          await RevenueCatAPI.logOut();
          get().clearAuthData();
        } catch (e) {
          if (userId && get().user?.id === userId && get().isAuthenticated) {
            notificationService.startUserScopedWork(userId);
          }
          throw e;
        } finally {
          set({ isLoading: false });
        }
      },

      clearAuthData: () => {
        accountIdentityEpoch += 1;
        const userId = get().user?.id;
        if (userId) {
          notificationService.stopUserScopedWork(userId);
        }
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
          hasCompletedOnboarding: false,
          // Keep authListenerActive true.
        });
        useMomentaStore.getState().clearMomentaData();
        void queueAccountTeardown(userId).catch(() => undefined);
        try {
          sentryClearUser();
        } catch {}
      },

      completeOnboarding: async context => {
        const currentState = get();
        const expectedUserId = currentState.user?.id;
        const expectedAccountEpoch = accountIdentityEpoch;
        const activationPath = context?.activationPath ?? 'first_promise';
        const completionHandoff = context?.completionHandoff;

        trackProductOperation({
          area: 'onboarding',
          authority: 'client',
          operation: 'complete_onboarding',
          outcome: 'started',
          phase: 'intent',
          source: activationPath === 'first_promise' ? 'onboarding' : 'invite',
        });

        if (
          !expectedUserId ||
          !currentState.session ||
          !currentState.isAuthenticated
        ) {
          trackProductOperation({
            area: 'onboarding',
            authority: 'client',
            operation: 'complete_onboarding',
            outcome: 'blocked',
            phase: 'eligibility',
            source:
              activationPath === 'first_promise' ? 'onboarding' : 'invite',
          });
          throw new Error('No authenticated user found');
        }

        const queueCompletionHandoff = async () => {
          if (!completionHandoff) return;
          if (!useOnboardingCompletionStore.persist.hasHydrated()) {
            await useOnboardingCompletionStore.persist.rehydrate();
          }
          const queued = useOnboardingCompletionStore
            .getState()
            .queueCompletion({
              ownerUserId: expectedUserId,
              firstPromiseId: completionHandoff.firstPromiseId,
              accountabilityChoice: completionHandoff.accountabilityChoice,
            });
          if (!queued) {
            throw new Error(
              'Menta could not preserve the onboarding destination.'
            );
          }
        };

        // Hydrate and validate the receipt before changing server state. The
        // same receipt is asserted again immediately before the local auth
        // state changes, so an overlapping account/profile transition cannot
        // turn Invite someone into the default Today destination.
        await queueCompletionHandoff();

        trackProductOperation({
          area: 'onboarding',
          authority: 'client',
          operation: 'complete_onboarding',
          outcome: 'eligible',
          phase: 'eligibility',
          source: activationPath === 'first_promise' ? 'onboarding' : 'invite',
        });

        try {
          const profile = await withTimeout(
            updateMyProfile({
              has_completed_onboarding: true,
            }),
            ONBOARDING_COMPLETION_TIMEOUT_MS,
            'complete_onboarding_profile_update'
          );
          const latestState = get();
          const returnedProfileOwnerId =
            typeof profile?.id === 'string' ? profile.id : null;
          const isCurrentAccountSession =
            expectedAccountEpoch === accountIdentityEpoch &&
            latestState.isAuthenticated &&
            latestState.user?.id === expectedUserId &&
            (!returnedProfileOwnerId ||
              returnedProfileOwnerId === expectedUserId);

          if (!isCurrentAccountSession) {
            throw createOnboardingAccountChangedError();
          }

          await queueCompletionHandoff();

          // Receipt persistence yields to other auth work. Validate again
          // before granting completion authority to this account lifetime.
          if (
            expectedAccountEpoch !== accountIdentityEpoch ||
            !get().isAuthenticated ||
            get().user?.id !== expectedUserId
          ) {
            throw createOnboardingAccountChangedError();
          }
          completedOnboardingAccountEpoch = expectedAccountEpoch;

          trackProductEvent('Onboarding Completed', {
            activation_path: activationPath,
            referral_used: context?.referralUsed === true,
          });
          trackProductOperation({
            area: 'onboarding',
            authority: 'server',
            operation: 'complete_onboarding',
            outcome: 'confirmed',
            phase: 'authority',
            source:
              activationPath === 'first_promise' ? 'onboarding' : 'invite',
          });
          set({ hasCompletedOnboarding: true });
          if (
            completionHandoff &&
            useOnboardingCompletionStore
              .getState()
              .requestNavigationForUser(expectedUserId)
          ) {
            trackProductEvent('Accountability Invite Journey', {
              context:
                completionHandoff.accountabilityChoice === 'new_group'
                  ? 'shared'
                  : 'private',
              source: 'onboarding',
              stage: 'handoff_queued',
            });
          }
          authStoreDebugLog('[AuthStore] Onboarding completed successfully');
        } catch (error) {
          const code = String((error as { code?: unknown } | null)?.code ?? '');
          trackProductOperation({
            area: 'onboarding',
            authority: 'server',
            operation: 'complete_onboarding',
            outcome:
              code === ONBOARDING_ACCOUNT_CHANGED_CODE ? 'blocked' : 'unknown',
            phase:
              code === ONBOARDING_ACCOUNT_CHANGED_CODE
                ? 'eligibility'
                : 'reconciliation',
            source:
              activationPath === 'first_promise' ? 'onboarding' : 'invite',
          });
          console.error('[AuthStore] Error completing onboarding:', error);
          throw error;
        }
      },

      updateProfile: async ({ username, avatarUrl }) => {
        const currentUser = get().user;
        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        const updates: MyProfilePatch = {};
        const metadataUpdates: Record<string, unknown> = {};

        if (username !== undefined && username !== currentUser.username) {
          updates.username = username;
          metadataUpdates.username = username;
        }

        if (avatarUrl !== undefined && avatarUrl !== currentUser.avatarUrl) {
          updates.avatar_url = avatarUrl ?? null;
          metadataUpdates.avatar_url = avatarUrl ?? null;
        }

        if (Object.keys(updates).length === 0) {
          return;
        }

        try {
          const data = await updateMyProfile(updates);

          if (Object.keys(metadataUpdates).length > 0) {
            const { error: authError } = await supabase.auth.updateUser({
              data: metadataUpdates,
            });
            if (authError) {
              console.warn(
                '[AuthStore] Failed to update auth metadata:',
                authError
              );
            }
          }

          set({
            user: {
              ...currentUser,
              username: data?.username ?? currentUser.username,
              avatarUrl: data?.avatar_url ?? undefined,
              momentaBalance:
                data?.momenta_balance ?? currentUser.momentaBalance,
            },
          });
        } catch (error) {
          console.error('[AuthStore] Profile update failed:', error);
          throw error;
        }
      },

      signInWithGoogle: async () => {
        // App-owned release switch; Google stays available by default.
        const googleLoginDisabled = await isOperationalFeatureEnabled(
          'disable_google_login'
        );
        if (googleLoginDisabled) {
          throw new Error('Google login is currently disabled');
        }
        set({ isLoading: true });
        try {
          // Offline guard
          if (!networkManager.isOnline()) {
            const msg = translate('en-NZ', 'domain.network.no_connection');
            showGlobalToast(msg, 'error');
            throw new Error(msg);
          }
          // Enforce native-only Google sign-in
          const result: OAuthResult = await OAuthService.signInWithGoogle();

          if (!result.success) {
            if (result.cancelled) {
              throw createAuthCancelledError();
            }
            const msg = result.error || 'Google sign-in failed';
            showGlobalToast(msg, 'error');
            throw new Error(msg);
          }

          // If session is immediately available (native flow or completed OAuth), update store to trigger navigation
          if (result.session?.access_token && result.user?.id) {
            await get().setUserAndSession(
              result.user as SupabaseUser,
              result.session as Session
            );
          }

          // Beta gate removed: no post-OAuth approval re-check

          // Auth state change listener will handle the session update
          authStoreDebugLog('Google sign-in successful');
          showGlobalToast(
            translate('en-NZ', 'sourceGate.auth.signedInWithGoogle'),
            'success'
          );
        } catch (error) {
          if (isAuthCancelled(error)) {
            throw error;
          }
          logError(new Error('Google Sign-In failed'), {
            component: 'AuthStore',
            action: 'signInWithGoogle',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          const friendlyError = handleNetworkError(error);
          showGlobalToast(friendlyError, 'error');
          throw new Error(friendlyError);
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithApple: async () => {
        const useWeb = Boolean(Constants.expoConfig?.extra?.oauthUseWeb);
        // App-owned release switch; Apple stays available by default.
        const appleLoginDisabled = await isOperationalFeatureEnabled(
          'disable_apple_login'
        );
        if (appleLoginDisabled) {
          throw new Error('Apple login is currently disabled');
        }
        set({ isLoading: true });
        try {
          // Offline guard
          if (!networkManager.isOnline()) {
            const msg = translate('en-NZ', 'domain.network.no_connection');
            showGlobalToast(msg, 'error');
            throw new Error(msg);
          }
          // Prefer native by default; use web OAuth only when explicitly configured
          const result: OAuthResult = useWeb
            ? await OAuthService.signInWithAppleOAuth()
            : await OAuthService.signInWithApple();

          if (!result.success) {
            if (result.cancelled) {
              throw createAuthCancelledError();
            }
            const msg = result.error || 'Apple sign-in failed';
            showGlobalToast(msg, 'error');
            throw new Error(msg);
          }

          if (result.session?.access_token && result.user?.id) {
            await get().setUserAndSession(
              result.user as SupabaseUser,
              result.session as Session
            );
          }

          // Beta gate removed: no post-OAuth approval re-check

          // Auth state change listener will handle the session update
          authStoreDebugLog('Apple sign-in successful');
          showGlobalToast(
            translate('en-NZ', 'sourceGate.auth.signedInWithApple'),
            'success'
          );
        } catch (error) {
          if (isAuthCancelled(error)) {
            throw error;
          }
          logError(
            new Error(
              useWeb ? 'Apple OAuth Sign-In failed' : 'Apple Sign-In failed'
            ),
            {
              component: 'AuthStore',
              action: useWeb ? 'signInWithAppleOAuth' : 'signInWithApple',
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
          const friendlyError = handleNetworkError(error);
          showGlobalToast(friendlyError, 'error');
          throw new Error(friendlyError);
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithGoogleOAuth: async () => {
        // Apply the same operational switch to the web OAuth flow.
        const googleLoginDisabled = await isOperationalFeatureEnabled(
          'disable_google_login'
        );
        if (googleLoginDisabled) {
          throw new Error('Google login is currently disabled');
        }
        set({ isLoading: true });
        try {
          if (!networkManager.isOnline()) {
            const msg = translate('en-NZ', 'domain.network.no_connection');
            showGlobalToast(msg, 'error');
            throw new Error(msg);
          }
          const result: OAuthResult =
            await OAuthService.signInWithGoogleOAuth();

          if (!result.success) {
            const msg = result.error || 'Google OAuth sign-in failed';
            showGlobalToast(msg, 'error');
            throw new Error(msg);
          }

          // Auth state change listener will handle the session update
          authStoreDebugLog('Google OAuth sign-in successful');
          showGlobalToast(
            translate('en-NZ', 'sourceGate.auth.signedInWithGoogle'),
            'success'
          );
        } catch (error) {
          logError(new Error('Google OAuth Sign-In failed'), {
            component: 'AuthStore',
            action: 'signInWithGoogleOAuth',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          const friendlyError = handleNetworkError(error);
          showGlobalToast(friendlyError, 'error');
          throw new Error(friendlyError);
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithAppleOAuth: async () => {
        // Apply the same operational switch to the web OAuth flow.
        const appleLoginDisabled = await isOperationalFeatureEnabled(
          'disable_apple_login'
        );
        if (appleLoginDisabled) {
          throw new Error('Apple login is currently disabled');
        }
        set({ isLoading: true });
        try {
          if (!networkManager.isOnline()) {
            const msg = translate('en-NZ', 'domain.network.no_connection');
            showGlobalToast(msg, 'error');
            throw new Error(msg);
          }
          const result: OAuthResult = await OAuthService.signInWithAppleOAuth();

          if (!result.success) {
            if (result.cancelled) {
              throw createAuthCancelledError();
            }
            const msg = result.error || 'Apple OAuth sign-in failed';
            showGlobalToast(msg, 'error');
            throw new Error(msg);
          }

          if (result.session?.access_token && result.user?.id) {
            await get().setUserAndSession(
              result.user as SupabaseUser,
              result.session as Session
            );
          }

          // Auth state change listener will handle the session update
          authStoreDebugLog('Apple OAuth sign-in successful');
          showGlobalToast(
            translate('en-NZ', 'sourceGate.auth.signedInWithApple'),
            'success'
          );
        } catch (error) {
          if (isAuthCancelled(error)) {
            throw error;
          }
          logError(new Error('Apple OAuth Sign-In failed'), {
            component: 'AuthStore',
            action: 'signInWithAppleOAuth',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          const friendlyError = handleNetworkError(error);
          showGlobalToast(friendlyError, 'error');
          throw new Error(friendlyError);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      version: 1,
      migrate: (
        persistedState: unknown,
        version: number
      ): AuthPersistedState => {
        if (version === 0) {
          return { hasCompletedOnboarding: false };
        }
        return persistedState as AuthPersistedState;
      },
    }
  )
);
