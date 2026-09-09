import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from 'react';
import {
  Stack,
  useGlobalSearchParams,
  usePathname,
  useNavigationContainerRef,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Platform,
  InteractionManager,
  LogBox,
  StyleSheet,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/store/auth-store';
import { useChallengeStore } from '@/store/challenge-store';
import { useGroupStore } from '@/store/group-store';
import { useReferralStore } from '@/store/referral-store';
import { useInviteStore } from '@/store/invite-store';
import { useMomentaStore } from '@/store/momenta-store';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import { useEmailConfirmationStore } from '@/store/email-confirmation-store';
import {
  canResumeOwnedOnboardingCompletion,
  chooseOnboardingCompletionDestination,
  useOnboardingCompletionStore,
} from '@/lib/navigation/onboarding-completion';
import { FullScreenLoading } from '@/components/ui/FullScreenLoading';
import { ThemeProvider, useTheme } from '@/constants/ThemeContext';
import { DensityProvider } from '@/constants/DensityContext';
import { WebNotSupported } from '@/components/WebNotSupported';
import PaywallHost from '@/components/paywall/PaywallHost';
import { LegacyAppUpdateGate } from '@/components/update/LegacyAppUpdateGate';
import {
  bootstrapSentry,
  setUser as setSentryUser,
  clearUser as clearSentryUser,
  addBreadcrumb,
  wrap as sentryWrap,
  setRouteContext,
  setRuntimeContext,
  logCrash,
  logEvent,
} from '@/lib/sentry';
import { useOperationalFlag } from '@/hooks/useOperationalFlag';
import { notificationService } from '@/lib/services/notification-service';
import { retentionNotificationClient } from '@/lib/notifications/retention-notification-client';
import { appStateManager } from '@/lib/app-state-manager';
import { QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from '@/lib/queryClient';
import ErrorBoundary from './error-boundary';
import { initializeAds } from '@/lib/ads';
import { showToast, ToastProvider } from '@/components/ui/Toast';
// ServiceBanner removed
import { useOtaUpdates } from '@/hooks/useOtaUpdates';
import {
  isValidReferralCode,
  normalizeInviteCode,
  PRIMARY_INVITE_HOST,
} from '@/lib/invite-links';
import { getAppIntentDeepLinkAction } from '@/lib/app-intents/deep-links';
import { getInviteDeepLinkAction } from '@/lib/navigation/invite-deep-link';
import {
  buildEventInviteEntryHref,
  holdPendingEventInviteEntry,
  projectPendingEventInviteEntry,
} from '@/lib/invites/inbound-invite-entry';
import {
  buildReviewQueuePath,
  buildReviewQueueRouteParams,
} from '@/lib/navigation/review-queue-params';
import {
  dispatchNativeEventNavigation,
  getProtectedEventPathFromRouterState,
  getSafeNativeIntentContext,
  normalizeNativeIntentPath,
} from '@/lib/app-intents/native-router-path';
import {
  parseCreateHubFromNormalizedPath,
  queueCreateHubOpen,
} from '@/lib/navigation/create-entry';
import { attachQueuedProofSubmissionProcessor } from '@/lib/services/proof-submission-service';
import {
  attachUpdatesListeners,
  logUpdatesContextAtStartup,
} from '@/lib/updates-diagnostics';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isE2EMode } from '@/lib/e2e';
import * as SplashScreen from 'expo-splash-screen';
import { useMentaFonts } from '@/lib/menta-fonts';
import {
  getPasswordRecoveryConfinementDestination,
  getStartupRouteState,
  shouldHydratePasswordRecoveryAtRoot,
  shouldHoldStartupLoading,
  shouldResumePendingEmailConfirmation,
} from '@/lib/navigation/startup-route-gate';
import {
  initializeAmplitude,
  setAmplitudeSessionReplayHold,
  setAmplitudeUserId,
  shouldHoldAmplitudeReplayForPathname,
} from '@/lib/amplitude';
import { initializeMetaAds } from '@/lib/meta-ads';
import {
  getPasswordRecoveryUserId,
  subscribePasswordRecoverySession,
} from '@/lib/auth/password-recovery-session';
import {
  initializeProductAnalytics,
  MentaPostHogProvider,
  setProductAnalyticsUserId,
  trackProductEvent,
} from '@/lib/posthog';
import { AppUpdateGateHost } from '@/components/update/AppUpdateGateHost';
import { OtaUpdateReadyHost } from '@/components/update/OtaUpdateReadyHost';
import { useTranslation } from '@/lib/localization/use-translation';

const e2eMode = isE2EMode();

if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync().catch(error => {
    void error;
  });
}
const rootDebugLog = (...args: unknown[]) => {
  void args;
};

const getAuthRequiredNextPath = (segments: string[]) => {
  const cleanSegments = segments.filter(Boolean);
  if (cleanSegments.length === 0 || cleanSegments[0] === '(tabs)') {
    return '/(tabs)';
  }

  return `/${cleanSegments.join('/')}`;
};

// Load advanced-diagnostics consent, then start Sentry. Replay sample rates are
// fixed at native init, so the preference must be applied before initSentry.
void bootstrapSentry();

// Persist and hydrate React Query cache for faster cold starts
try {
  persistQueryClient({
    queryClient,
    persister: asyncStoragePersister,
    maxAge: 24 * 60 * 60 * 1000,
  });
} catch {}

// Amplitude remains live product-event ingestion. PostHog is added for governed
// events and flags. Replay remains behind its separate privacy and build gate.
initializeAmplitude();
initializeProductAnalytics();
initializeMetaAds();

// In development, suppress noisy SDK transport messages so simulator QA remains readable.
try {
  if (__DEV__) {
    LogBox.ignoreLogs([
      'Transport disabled',
      'Edge Function returned a non-2xx status code',
      'supabase_request_error',
    ]);
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      try {
        const first = args?.[0];
        const text = typeof first === 'string' ? first : String(first ?? '');
        // Suppress common noisy dev-only messages in Expo Go
        if (
          text.includes('Edge Function returned a non-2xx status code') ||
          text.includes('Transport disabled') ||
          text.includes('supabase_request_error')
        ) {
          return;
        }
      } catch {}
      return originalConsoleError(...args);
    };
  }
} catch {}

// Native app component that uses theme and side-effect hooks.
function NativeRootLayoutContent() {
  const { t } = useTranslation();
  const {
    isAuthenticated,
    hasCompletedOnboarding,
    isInitialized,
    isLoading,
    initializeAuth,
    user,
  } = useAuthStore();

  const { setPendingReferral, clearPendingReferral } = useReferralStore();
  const { pending, setPendingGroup, setPendingChallenge } = useInviteStore();
  const pendingProtectedRoute = useProtectedRouteStore(state => state.pending);
  const pendingEmailConfirmation = useEmailConfirmationStore(
    state => state.pending
  );
  const emailConfirmationHydrated = useEmailConfirmationStore(
    state => state.hasHydrated
  );
  const hydrateEmailConfirmation = useEmailConfirmationStore(
    state => state.hydrate
  );
  const pendingOnboardingCompletion = useOnboardingCompletionStore(
    state => state.pending
  );
  const completionNavigationRequest = useOnboardingCompletionStore(
    state => state.navigationRequest
  );
  const setPendingProtectedRoute = useProtectedRouteStore(
    state => state.setPendingRoute
  );

  const theme = useTheme();
  const segments = useSegments();
  const pathname = usePathname();
  const globalSearchParams = useGlobalSearchParams();
  const currentSegment = segments[0] as string | undefined;
  const startupRoute = useMemo(
    () => getStartupRouteState(currentSegment),
    [currentSegment]
  );
  const router = useRouter();
  const navigation = useNavigationContainerRef();
  const rootNavigationState = useRootNavigationState();
  const rootNavigationReady = Boolean(rootNavigationState?.key);
  const activeRootRouteKey =
    rootNavigationState?.routes[rootNavigationState.index ?? 0]?.key ?? '';
  const handledInitialUrlRef = useRef<string | null>(null);
  const completionNavigationRef = useRef<string | null>(null);
  const completionGateDiagnosticRef = useRef<string | null>(null);
  const [accountBoundaryEpoch, setAccountBoundaryEpoch] = useState(0);
  const [navigationAccount, setNavigationAccount] = useState<{
    id: string | null;
    epoch: number;
  } | null>(null);
  const [accountResetTarget, setAccountResetTarget] = useState<{
    key: string;
    accountId: string | null;
    epoch: number;
  } | null>(null);
  const currentNavigationAccountId = isAuthenticated
    ? (user?.id ?? null)
    : null;
  const accountResetAcknowledged = Boolean(
    accountResetTarget &&
    rootNavigationState?.routes.length === 1 &&
    activeRootRouteKey === accountResetTarget.key
  );
  const accountBoundaryPending =
    Boolean(
      navigationAccount &&
      (navigationAccount.id !== currentNavigationAccountId ||
        navigationAccount.epoch !== accountBoundaryEpoch)
    ) || Boolean(accountResetTarget && !accountResetAcknowledged);

  useEffect(
    () =>
      useAuthStore.subscribe((next, previous) => {
        const nextId = next.isAuthenticated ? (next.user?.id ?? null) : null;
        const previousId = previous.isAuthenticated
          ? (previous.user?.id ?? null)
          : null;
        if (nextId !== previousId) setAccountBoundaryEpoch(epoch => epoch + 1);
      }),
    []
  );
  const [handoffsHydrated, setHandoffsHydrated] = useState(false);
  const [recoveryGateResolved, setRecoveryGateResolved] = useState(false);
  const [recoveryUserId, setRecoveryUserId] = useState<string | null>(null);
  const recoveryConfinementDestination =
    getPasswordRecoveryConfinementDestination({
      recoveryUserId,
      route: startupRoute,
    });
  const protectedEventPath = getProtectedEventPathFromRouterState(
    pathname,
    globalSearchParams as Record<string, string | string[] | undefined>
  );
  const canResumeOwnedCompletion =
    startupRoute.inOnboardingFlow &&
    !startupRoute.inIntroReplay &&
    canResumeOwnedOnboardingCompletion({
      completion: pendingOnboardingCompletion,
      currentUserId: user?.id ?? null,
      hasCompletedOnboarding,
      isAuthenticated,
      isInitialized,
    });
  const { enabled: safeMode } = useOperationalFlag('safe_mode');

  useEffect(() => {
    if (!emailConfirmationHydrated) {
      void hydrateEmailConfirmation().catch(() => undefined);
    }
  }, [emailConfirmationHydrated, hydrateEmailConfirmation]);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribePasswordRecoverySession(userId => {
      if (!mounted) return;
      setRecoveryUserId(userId);
      setRecoveryGateResolved(true);
    });
    if (!shouldHydratePasswordRecoveryAtRoot(startupRoute)) {
      setRecoveryGateResolved(true);
      return () => {
        mounted = false;
        unsubscribe();
      };
    }
    void getPasswordRecoveryUserId()
      .then(userId => {
        if (!mounted) return;
        setRecoveryUserId(userId);
        setRecoveryGateResolved(true);
      })
      .catch(() => {
        if (!mounted) return;
        setRecoveryUserId(null);
        setRecoveryGateResolved(true);
      });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [startupRoute]);

  useEffect(() => {
    setAmplitudeUserId(user?.id ?? null);
    setProductAnalyticsUserId(user?.id ?? null);
  }, [user?.id]);

  useEffect(() => {
    setAmplitudeSessionReplayHold(
      'route',
      shouldHoldAmplitudeReplayForPathname(pathname)
    );
  }, [pathname]);

  const { enabled: adsEnabled } = useOperationalFlag('ads_enabled');
  // Background OTA update checks with unobtrusive banner prompt
  useOtaUpdates({ checkIntervalMs: 60_000 });

  useEffect(() => {
    const updateHydrationState = () => {
      setHandoffsHydrated(
        useInviteStore.persist.hasHydrated() &&
          useProtectedRouteStore.persist.hasHydrated() &&
          useOnboardingCompletionStore.persist.hasHydrated()
      );
    };

    const unsubscribeInvite =
      useInviteStore.persist.onFinishHydration(updateHydrationState);
    const unsubscribeProtectedRoute =
      useProtectedRouteStore.persist.onFinishHydration(updateHydrationState);
    const unsubscribeCompletion =
      useOnboardingCompletionStore.persist.onFinishHydration(
        updateHydrationState
      );

    updateHydrationState();

    return () => {
      unsubscribeInvite();
      unsubscribeProtectedRoute();
      unsubscribeCompletion();
    };
  }, []);

  // Capture OTA context and events very early to diagnose startup issues
  useEffect(() => {
    let detach: (() => void) | null = null;
    (async () => {
      try {
        await logUpdatesContextAtStartup();
      } catch {}
      try {
        detach = attachUpdatesListeners();
      } catch {}
    })();
    return () => {
      try {
        detach?.();
      } catch {}
    };
  }, []);

  // Batch all non-critical initializations for better performance
  useEffect(() => {
    if (e2eMode) {
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      // Keep non-critical service initialisation outside the first interaction.
      startTransition(() => {
        (async () => {
          // Batch initialize all services in parallel for faster startup
          const initTasks = [];

          setRuntimeContext({
            appState: 'initializing',
            networkStatus: 'unknown',
          });

          // Ads initialization (if enabled)
          if (adsEnabled && !safeMode) {
            initTasks.push(
              (async () => {
                try {
                  // Rewarded requests are configured as non-personalised.
                  // ATT is not an operating-system prerequisite for them.
                  await initializeAds();
                  rootDebugLog('[RootLayout] Ads initialized successfully');
                } catch (error) {
                  console.error(
                    '[RootLayout] Ads initialization failed:',
                    error
                  );
                }
              })()
            );
          }

          // Notifications initialization
          initTasks.push(
            (async () => {
              try {
                await notificationService.initialize({
                  requestPermissionNow: false,
                });
                rootDebugLog(
                  '[RootLayout] Notification service initialized successfully'
                );
                setRuntimeContext({ appState: 'notifications_ready' });
              } catch (error) {
                console.error(
                  '[RootLayout] Notification service initialization failed:',
                  error
                );
                if (!__DEV__) {
                  logCrash(error as Error, {
                    type: 'notification_initialization_failure',
                    context: 'root_layout',
                    isFatal: false,
                  });
                }
              }
            })()
          );

          // Production selects OneSignal only when its reviewed App ID,
          // provider name, privacy gate, and release switch are all present.
          initTasks.push(retentionNotificationClient.initialize());

          // Wait for all services to initialize in parallel (fail gracefully)
          await Promise.allSettled(initTasks);
          rootDebugLog('[RootLayout] All services initialized');
        })();
      });
    });
    return () => task.cancel?.();
  }, [adsEnabled, safeMode]);

  // Initialize app state manager (must be done early - synchronous)
  useEffect(() => {
    try {
      appStateManager.initialize();
      rootDebugLog('[RootLayout] AppState manager initialized successfully');
    } catch (error) {
      console.error(
        '[RootLayout] AppState manager initialization failed:',
        error
      );
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    return attachQueuedProofSubmissionProcessor(user.id, result => {
      if (result.submitted > 0) {
        setRuntimeContext({
          appState: 'queued_proofs_submitted',
        });
        rootDebugLog('[RootLayout] Queued proofs submitted', result);
      }
      if (result.failed > 0) {
        console.warn('[RootLayout] Queued proof retry incomplete', result);
      }
    });
  }, [isAuthenticated, user?.id]);

  // Notifications disabled for production testing
  // Initialize auth on app start
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeAuth();

        // Update crash context after auth initialization
        setRuntimeContext({
          appState: 'auth_initialized',
        });
      } catch (error) {
        console.error('[RootLayout] Auth initialization failed:', error);

        // Log auth initialization failure
        if (!__DEV__) {
          logCrash(error as Error, {
            type: 'auth_initialization_failure',
            context: 'root_layout',
            isFatal: false,
          });
        }
      }
    };

    initAuth();
  }, [initializeAuth]);

  // Handle deep links for referrals
  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          if (handledInitialUrlRef.current === initialUrl) {
            return;
          }
          handledInitialUrlRef.current = initialUrl;
          rootDebugLog('[RootLayout] App opened with an initial URL');
          try {
            setRouteContext(
              'deeplink_initial',
              getSafeNativeIntentContext(initialUrl)
            );
          } catch {}
          handleDeepLink(initialUrl);
        }
      } catch (error) {
        console.error('[RootLayout] Error getting initial URL:', error);
      }
    };

    // Handle incoming URLs while app is running
    const handleURL = (event: { url: string }) => {
      try {
        setRouteContext(
          'deeplink_event',
          getSafeNativeIntentContext(event.url)
        );
      } catch {}
      handleDeepLink(event.url);
    };

    const handleDeepLink = async (url: string) => {
      try {
        const safeIntentContext = getSafeNativeIntentContext(url);
        try {
          setRouteContext('deeplink_parsed', safeIntentContext);
        } catch {}

        const handledEvent = dispatchNativeEventNavigation(
          {
            path: url,
            isAuthenticated,
            hasCompletedOnboarding,
          },
          {
            requireAuth: path => {
              const entry = holdPendingEventInviteEntry({
                path,
                source: 'deep_link',
                currentUserId: null,
              });
              if (entry) router.replace(buildEventInviteEntryHref(entry));
            },
            finishOnboarding: path => {
              const entry = holdPendingEventInviteEntry({
                path,
                source: 'deep_link',
                currentUserId: user?.id ?? null,
              });
              if (entry) router.replace(buildEventInviteEntryHref(entry));
            },
            openEvent: path => {
              const entry = holdPendingEventInviteEntry({
                path,
                source: 'deep_link',
                currentUserId: user?.id ?? null,
              });
              if (entry) router.replace(buildEventInviteEntryHref(entry));
            },
          }
        );

        if (handledEvent) {
          return;
        }

        const parsed = Linking.parse(url);

        const appIntentAction = getAppIntentDeepLinkAction(parsed);

        const linkHost = parsed.hostname?.toLowerCase() || '';
        const isKnownUniversalHost =
          linkHost === PRIMARY_INVITE_HOST ||
          linkHost === `www.${PRIMARY_INVITE_HOST}` ||
          linkHost === 'lockedinpro.com' ||
          linkHost === 'www.lockedinpro.com';

        // Handle referral links: menta://invite?ref=ABCDEF.
        // menta.quest is canonical; lockedinpro.com stays parser-only legacy.
        if (
          (parsed.path === 'invite' || isKnownUniversalHost) &&
          parsed.queryParams?.ref
        ) {
          const referralCode = normalizeInviteCode(parsed.queryParams.ref);

          if (!isValidReferralCode(referralCode)) {
            setRuntimeContext({
              appState: 'referral_link_invalid',
            });
            return;
          }

          if (isAuthenticated && hasCompletedOnboarding) {
            if (user?.id) {
              clearPendingReferral(user.id, referralCode);
            }
            showToast.info(
              t('shared.rootLayout.referralExisting.title'),
              t('shared.rootLayout.referralExisting.message')
            );
            setRuntimeContext({
              appState: 'referral_link_existing_account',
            });
            return;
          }

          // Store the referral code for processing after signup/login
          setPendingReferral(referralCode, user?.id ?? null);

          // If user is not authenticated, they'll be redirected to login/register
          // The referral will be processed after successful authentication

          setRuntimeContext({
            appState: 'referral_link_received',
          });
        }

        // Handle quick check-ins: menta://checkin?challengeId=XYZ
        else if (appIntentAction?.type === 'checkin') {
          let challengeId = appIntentAction.challengeId;

          if (!isAuthenticated) {
            setPendingProtectedRoute('/(tabs)', 'deep_link', null);
            router.push({
              pathname: '/auth-required',
              params: { context: 'proof', next: '/(tabs)' },
            });
            return;
          }

          if (!hasCompletedOnboarding) {
            setPendingProtectedRoute('/(tabs)', 'deep_link', user?.id ?? null);
            router.replace('/onboarding');
            return;
          }

          // If no challengeId provided, try to pick the first pending submission
          if (!challengeId) {
            try {
              const { getTodaysSubmissions } = useGroupStore.getState();
              const subs = await getTodaysSubmissions(user!.id);
              const pending = subs.find(s => !s.hasSubmittedToday);
              if (pending) {
                challengeId = pending.challengeId;
              }
            } catch (error) {
              console.warn(
                '[RootLayout] Failed to resolve pending submission for quick check-in',
                error
              );
            }
          }

          if (!challengeId) {
            router.replace('/(tabs)');
            showToast.info(
              t('shared.rootLayout.noProofDue.title'),
              t('shared.rootLayout.noProofDue.message')
            );
            return;
          }

          const { challenges: challengeState } = useChallengeStore.getState();
          const challenge = challengeState.find(c => c.id === challengeId);
          const verificationType = challenge?.verificationType;
          const supportedMediaTypes: ReadonlySet<string> = new Set([
            'photo',
            'video',
            'text',
          ]);

          if (verificationType && supportedMediaTypes.has(verificationType)) {
            router.push({
              pathname: '/verification',
              params: {
                challengeId,
                verificationType,
                suggestedVerificationType: verificationType,
                source: 'quick_checkin',
              },
            });
          } else {
            router.push(`/challenges/${challengeId}`);
          }
        }

        // Handle review queue deep links:
        // menta://review-queue?groupId=G&challengeId=C&submissionId=S
        else if (appIntentAction?.type === 'reviewQueue') {
          const reviewParams = buildReviewQueueRouteParams(appIntentAction);
          const reviewPath = buildReviewQueuePath(reviewParams);

          if (!isAuthenticated) {
            setPendingProtectedRoute(reviewPath, 'deep_link', null);
            router.push({
              pathname: '/auth-required',
              params: { next: reviewPath },
            });
            return;
          }

          if (!hasCompletedOnboarding) {
            setPendingProtectedRoute(reviewPath, 'deep_link', user?.id ?? null);
            router.replace('/onboarding');
            return;
          }

          if (isAuthenticated && hasCompletedOnboarding) {
            router.push(reviewPath as never);
          }
        }

        // Handle group/challenge invites from custom schemes and HTTPS links:
        // - menta://join?invite=GROUPCODE
        // - lockedin://join?code=GROUPCODE
        // - lockedinprod://join?challenge=CHALLENGECODE
        // - https://menta.quest/join?invite=GROUPCODE
        // - https://menta.quest/join?challenge=CHALLENGECODE
        // - https://menta.quest/join/CODE
        else {
          const authState = useAuthStore.getState();
          const readyToAccept =
            authState.isAuthenticated &&
            authState.hasCompletedOnboarding &&
            Boolean(authState.user?.id);
          const inviteAction = getInviteDeepLinkAction(url, readyToAccept);

          if (!inviteAction) {
            const normalizedAppPath = normalizeNativeIntentPath(url);
            if (!normalizedAppPath) {
              return;
            }

            if (!isAuthenticated) {
              setPendingProtectedRoute(normalizedAppPath, 'deep_link', null);
              router.push({
                pathname: '/auth-required',
                params: { next: normalizedAppPath },
              });
              return;
            }

            if (!hasCompletedOnboarding) {
              setPendingProtectedRoute(
                normalizedAppPath,
                'deep_link',
                user?.id ?? null
              );
              router.replace('/onboarding');
              return;
            }

            const createHubParams =
              parseCreateHubFromNormalizedPath(normalizedAppPath);
            if (createHubParams) {
              queueCreateHubOpen({
                ...createHubParams,
                createModalNonce: String(Date.now()),
              });
              router.replace('/(tabs)');
              return;
            }

            router.push(normalizedAppPath as never);
            return;
          }

          if (inviteAction.kind === 'open_group_join') {
            setPendingGroup(inviteAction.code, authState.user?.id ?? null);
            router.push({
              pathname: '/join-group',
              params: { code: inviteAction.code },
            });
            return;
          }

          if (inviteAction.kind === 'save_group') {
            try {
              setPendingGroup(inviteAction.code, authState.user?.id ?? null);
            } catch {}
            router.push({
              pathname: '/join-group',
              params: { code: inviteAction.code },
            });
            return;
          }

          if (inviteAction.kind === 'save_challenge') {
            try {
              setPendingChallenge(
                inviteAction.code,
                authState.user?.id ?? null
              );
            } catch {}
            router.push({
              pathname: '/join-promise',
              params: { code: inviteAction.code },
            } as never);
            return;
          }

          if (inviteAction.kind === 'open_challenge_preview') {
            setPendingChallenge(inviteAction.code, authState.user?.id ?? null);
            router.push({
              pathname: '/join-promise',
              params: { code: inviteAction.code },
            } as never);
            return;
          }
        }
      } catch (error) {
        console.error('[RootLayout] Error parsing deep link:', error);

        if (!__DEV__) {
          logCrash(error as Error, {
            type: 'deep_link_parsing_error',
            context: 'root_layout',
            isFatal: false,
            additionalContext: getSafeNativeIntentContext(url),
          });
        }
      }
    };

    // Set up listeners; defer initial URL parse until after first interactions
    const initialTask = InteractionManager.runAfterInteractions(() => {
      handleInitialURL();
    });
    const subscription = Linking.addEventListener('url', handleURL);

    // Cleanup
    return () => {
      initialTask.cancel?.();
      subscription?.remove();
    };
  }, [
    clearPendingReferral,
    setPendingReferral,
    setPendingGroup,
    setPendingChallenge,
    setPendingProtectedRoute,
    isAuthenticated,
    hasCompletedOnboarding,
    protectedEventPath,
    router,
    user,
    t,
  ]);

  // Keep Sentry and purchase identity aligned with the current account.
  useEffect(() => {
    if (user) {
      startTransition(() => {
        // Set user context in Sentry (non-blocking)
        try {
          setSentryUser({
            id: user.id,
          });
        } catch {}

        // CRITICAL: Log in to RevenueCat with user's Supabase ID
        // This ensures purchases are associated with the correct user
        // and webhooks can match the app_user_id to our database
        import('@/lib/paywall/revenuecat')
          .then(({ RevenueCatAPI }) => {
            RevenueCatAPI.logIn(user.id).catch(e => {
              console.warn('[RootLayout] RevenueCat login failed:', e);
            });
          })
          .catch(error => {
            rootDebugLog('[RootLayout] RevenueCat module unavailable', error);
          });

        // Keep shared diagnostics context non-identifying.
        setRuntimeContext({
          appState: 'authenticated',
        });
      });
    } else {
      startTransition(() => {
        // Clear user context in Sentry
        try {
          clearSentryUser();
        } catch {}

        // Update crash context for unauthenticated state
        setRuntimeContext({
          appState: 'unauthenticated',
        });
      });
    }
  }, [user]);

  // Navigation logic with enhanced error handling (+ Beta Gate pre-auth)
  useEffect(() => {
    // Wait for the matching account profile before making an onboarding or
    // completion decision. A fresh auth session is exposed before its profile
    // arrives, so routing while `isLoading` is true can briefly send a
    // returning account into onboarding and strand a protected handoff there.
    const recordCompletionGate = (reason: string) => {
      if (!pendingOnboardingCompletion) {
        completionGateDiagnosticRef.current = null;
        return;
      }
      const key = `${reason}:${canResumeOwnedCompletion}:${handoffsHydrated}`;
      if (completionGateDiagnosticRef.current === key) return;
      completionGateDiagnosticRef.current = key;
      addBreadcrumb('onboarding_completion_navigation_gate', {
        reason,
        auth_loading: isLoading,
        can_resume_owned_completion: canResumeOwnedCompletion,
        handoffs_hydrated: handoffsHydrated,
      });
    };

    if (!rootNavigationReady) {
      recordCompletionGate('navigator_not_ready');
      return;
    }
    if (!isInitialized) {
      recordCompletionGate('auth_not_initialized');
      return;
    }
    if (!recoveryGateResolved) {
      recordCompletionGate('recovery_gate_unresolved');
      return;
    }
    if (!emailConfirmationHydrated) {
      recordCompletionGate('email_confirmation_unhydrated');
      return;
    }
    if (isLoading && !canResumeOwnedCompletion) {
      recordCompletionGate('auth_loading');
      return;
    }
    if (!pendingOnboardingCompletion) {
      completionGateDiagnosticRef.current = null;
    }

    try {
      // Seed the first authoritative startup without replacing its deep link.
      // Later identity changes prune history, while same-account refresh and
      // onboarding completion leave the mounted navigator untouched.
      if (!navigationAccount) {
        setNavigationAccount({
          id: currentNavigationAccountId,
          epoch: accountBoundaryEpoch,
        });
      } else if (accountBoundaryPending) {
        if (!handoffsHydrated || !navigation.isReady()) return;
        const liveAuth = useAuthStore.getState();
        const liveAccountId = liveAuth.isAuthenticated
          ? (liveAuth.user?.id ?? null)
          : null;
        if (liveAccountId !== currentNavigationAccountId) return;
        if (
          accountResetTarget?.accountId === currentNavigationAccountId &&
          accountResetTarget.epoch === accountBoundaryEpoch
        ) {
          if (!accountResetAcknowledged) return;
          setNavigationAccount({
            id: currentNavigationAccountId,
            epoch: accountBoundaryEpoch,
          });
          setAccountResetTarget(null);
          completionNavigationRef.current = null;
        } else {
          const currentRoute =
            rootNavigationState?.routes[rootNavigationState.index ?? 0];
          const preserveAuthHandoff = Boolean(
            !navigationAccount.id &&
            currentNavigationAccountId &&
            currentRoute &&
            startupRoute.isPublicPreAuthRoute
          );
          const preservePublicEntry = Boolean(
            currentRoute &&
            (startupRoute.inInviteEntry ||
              startupRoute.inPasswordRecoveryFlow ||
              (!currentNavigationAccountId &&
                startupRoute.currentSegment === 'account-deleted'))
          );
          const freshKey = `account-boundary-${accountBoundaryEpoch}-${Date.now()}`;
          const nextRoute =
            preserveAuthHandoff && currentRoute
              ? {
                  name: currentRoute.name,
                  params: currentRoute.params,
                  key: currentRoute.key,
                }
              : preservePublicEntry && currentRoute
                ? {
                    name: currentRoute.name,
                    params: currentRoute.params,
                    key: freshKey,
                  }
                : {
                    name:
                      currentNavigationAccountId && hasCompletedOnboarding
                        ? 'login'
                        : 'onboarding',
                    key: freshKey,
                  };
          const expectedKey = nextRoute.key;
          setAccountResetTarget({
            key: expectedKey,
            accountId: currentNavigationAccountId,
            epoch: accountBoundaryEpoch,
          });
          completionNavigationRef.current = null;
          navigation.resetRoot({ index: 0, routes: [nextRoute] });
          logEvent('info', 'account_navigation_history_reset', {
            boundary: !currentNavigationAccountId
              ? 'signed_out'
              : navigationAccount.id
                ? 'account_switched'
                : 'signed_in',
            handoff_preserved: preserveAuthHandoff || preservePublicEntry,
          });
          trackProductEvent('Account Navigation Reset', {
            boundary: !currentNavigationAccountId
              ? 'signed_out'
              : navigationAccount.id
                ? 'account_switched'
                : 'signed_in',
            handoff_preserved: preserveAuthHandoff || preservePublicEntry,
          });
          return;
        }
      }
      const {
        currentSegment,
        inAuthFlow,
        inIntroReplay,
        inInviteEntry,
        inLegalAcceptanceFlow,
        inOnboardingFlow,
        inPasswordRecoveryFlow,
        inTabGroup,
        isPublicPreAuthRoute,
      } = startupRoute;
      if (recoveryConfinementDestination) {
        setRuntimeContext({ appState: 'password_recovery_confined' });
        router.replace(recoveryConfinementDestination);
        return;
      }
      const isCompletionExit =
        (inAuthFlow && !inPasswordRecoveryFlow) ||
        (inOnboardingFlow && !inIntroReplay);

      if (!isCompletionExit) {
        completionNavigationRef.current = null;
      }

      if (!isAuthenticated) {
        // User is not authenticated
        setRuntimeContext({
          appState: 'navigating_to_auth',
        });
        if (
          shouldResumePendingEmailConfirmation({
            currentSegment,
            hasPendingConfirmation: Boolean(pendingEmailConfirmation),
            isAuthenticated,
          })
        ) {
          router.replace('/email-confirmation');
          return;
        }
        if (protectedEventPath) {
          const entry = holdPendingEventInviteEntry({
            path: protectedEventPath,
            source: 'deep_link',
            currentUserId: null,
          });
          if (entry) {
            router.replace(buildEventInviteEntryHref(entry));
            return;
          }
        }
        if (inTabGroup || !currentSegment) {
          router.replace('/onboarding');
        } else if (!isPublicPreAuthRoute) {
          const nextPath =
            protectedEventPath ?? getAuthRequiredNextPath(segments);
          setPendingProtectedRoute(nextPath, 'auth_gate', null);
          if (protectedEventPath) {
            router.replace({
              pathname: '/auth-required',
              params: { context: 'events' },
            });
          } else {
            router.replace({
              pathname: '/auth-required',
              params: { next: nextPath },
            } as never);
          }
        }
      } else if (!hasCompletedOnboarding) {
        // User is authenticated but hasn't completed onboarding
        setRuntimeContext({
          appState: 'navigating_to_onboarding',
        });

        if (protectedEventPath && !inInviteEntry) {
          const entry = holdPendingEventInviteEntry({
            path: protectedEventPath,
            source: 'deep_link',
            currentUserId: user?.id ?? null,
          });
          if (entry) {
            router.replace(buildEventInviteEntryHref(entry));
            return;
          }
        }

        if (handoffsHydrated && user?.id) {
          const heldPromiseInvite = useInviteStore
            .getState()
            .peekPendingNavigationForUser(user.id);
          const heldEventInvite = projectPendingEventInviteEntry({
            pendingRoute: useProtectedRouteStore
              .getState()
              .peekPendingRouteForUser(user.id),
            currentUserId: user.id,
          });
          if (
            (heldPromiseInvite || heldEventInvite) &&
            !inInviteEntry &&
            currentSegment !== 'invite-activation'
          ) {
            router.replace('/invite-activation');
            return;
          }
        }

        if (
          !inOnboardingFlow &&
          !inInviteEntry &&
          !inLegalAcceptanceFlow &&
          !inPasswordRecoveryFlow
        ) {
          if (!inAuthFlow && !inIntroReplay) {
            setPendingProtectedRoute(
              protectedEventPath ?? getAuthRequiredNextPath(segments),
              'onboarding_gate',
              user?.id ?? null
            );
          }
          router.replace('/onboarding');
        }
      } else {
        // User is authenticated and has completed onboarding
        setRuntimeContext({
          appState: 'navigating_to_main_app',
        });

        if (isCompletionExit && !inPasswordRecoveryFlow) {
          if (!handoffsHydrated) {
            recordCompletionGate('handoffs_unhydrated');
            return;
          }
          if (!user?.id) {
            recordCompletionGate('missing_current_user');
            return;
          }
          completionGateDiagnosticRef.current = null;

          const navigationKey = `${user.id}:${activeRootRouteKey}:${completionNavigationRequest}`;
          if (completionNavigationRef.current === navigationKey) {
            if (pendingOnboardingCompletion) {
              trackProductEvent('Accountability Invite Journey', {
                context: 'present',
                source: 'onboarding',
                stage: 'handoff_suppressed',
              });
            }
            return;
          }

          const inviteStore = useInviteStore.getState();
          const pendingInvite = inviteStore.peekPendingNavigationForUser(
            user.id
          );
          const protectedRouteStore = useProtectedRouteStore.getState();
          const pendingRoute = protectedRouteStore.peekPendingRouteForUser(
            user.id
          );
          const completionStore = useOnboardingCompletionStore.getState();
          const pendingCompletion = completionStore.peekCompletionForUser(
            user.id
          );
          const destination = chooseOnboardingCompletionDestination({
            pendingInvite,
            pendingProtectedRoute: pendingRoute,
            completion: pendingCompletion,
          });
          const dispatchCompletion = () => {
            if (pendingCompletion) {
              trackProductEvent('Accountability Invite Journey', {
                context: 'present',
                source: 'onboarding',
                stage: 'handoff_dispatch',
              });
            }
            router.replace(destination.href);
            completionNavigationRef.current = navigationKey;
          };

          if (destination.kind === 'invite') {
            const claimedInvite = inviteStore.claimPendingNavigationForUser(
              user.id
            );
            if (claimedInvite) {
              dispatchCompletion();
              return;
            }
            return;
          }

          if (destination.kind === 'protected_route') {
            const route = protectedRouteStore.claimPendingRouteForUser(user.id);
            if (route) {
              dispatchCompletion();
              return;
            }
            return;
          }

          if (destination.kind === 'promise_accountability') {
            const completion = pendingCompletion;
            if (completion) {
              logEvent('info', 'onboarding_completion_handoff', {
                destination: destination.kind,
                accountability_choice: completion.accountabilityChoice,
                source: 'root_layout',
              });
              trackProductEvent('Accountability Invite Journey', {
                context: 'present',
                source: 'onboarding',
                stage: 'handoff_routed',
              });
              dispatchCompletion();
              return;
            }
            return;
          }

          if (destination.kind === 'first_promise') {
            const completion = pendingCompletion;
            if (completion) {
              logEvent('info', 'onboarding_completion_handoff', {
                destination: destination.kind,
                accountability_choice: completion.accountabilityChoice,
                source: 'root_layout',
              });
              dispatchCompletion();
              return;
            }
            return;
          }

          dispatchCompletion();
        }
      }

      // After computing routing decisions, set Sentry route context
      try {
        const path = segments.join('/') || '(root)';
        setRouteContext(path);
      } catch {}
    } catch (error) {
      // A failed dispatch must not permanently claim an unmounted destination.
      completionNavigationRef.current = null;
      console.error('[RootLayout] Navigation error:', error);

      // Log navigation errors for production monitoring
      if (!__DEV__) {
        logCrash(error as Error, {
          type: 'navigation_error',
          context: 'root_layout_navigation_effect',
          isFatal: false,
          additionalContext: {
            isAuthenticated,
            hasCompletedOnboarding,
            currentSegments: segments.join('/'),
          },
        });
      }
    }
  }, [
    isAuthenticated,
    accountBoundaryEpoch,
    accountBoundaryPending,
    accountResetAcknowledged,
    accountResetTarget,
    currentNavigationAccountId,
    navigation,
    navigationAccount,
    rootNavigationState,
    activeRootRouteKey,
    completionNavigationRequest,
    canResumeOwnedCompletion,
    hasCompletedOnboarding,
    handoffsHydrated,
    emailConfirmationHydrated,
    isInitialized,
    isLoading,
    recoveryGateResolved,
    recoveryConfinementDestination,
    pending,
    pendingOnboardingCompletion,
    pendingProtectedRoute,
    pendingEmailConfirmation,
    protectedEventPath,
    segments,
    router,
    rootNavigationReady,
    setPendingProtectedRoute,
    startupRoute,
    user?.id,
  ]);

  // Keep the root navigator mounted so a gated route can actually navigate.
  // Mask its content while authority is unresolved instead of destroying the
  // stack that must acknowledge an onboarding completion.
  const startupBlocked =
    accountBoundaryPending ||
    !rootNavigationReady ||
    !recoveryGateResolved ||
    !emailConfirmationHydrated ||
    Boolean(recoveryConfinementDestination) ||
    shouldHoldStartupLoading({
      canResumeOwnedCompletion,
      isAuthenticated,
      hasCompletedOnboarding,
      isInitialized,
      isLoading,
      route: startupRoute,
    });

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Additional error handling if needed
        console.error(
          '[RootLayout] Error boundary triggered:',
          error,
          errorInfo
        );
      }}
    >
      <View
        style={{ flex: 1, opacity: startupBlocked ? 0 : 1 }}
        pointerEvents={startupBlocked ? 'none' : 'auto'}
        accessibilityElementsHidden={startupBlocked}
        importantForAccessibility={
          startupBlocked ? 'no-hide-descendants' : 'auto'
        }
      >
        <Stack
          screenOptions={{
            headerShown: false,
            presentation: 'card',
            gestureEnabled: Platform.OS === 'ios',
            contentStyle: { backgroundColor: theme.colors.background.primary },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth-required" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="email-auth" options={{ headerShown: false }} />
          <Stack.Screen
            name="email-confirmation"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="email-confirmation/callback"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="password-recovery"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="password-recovery/callback"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen
            name="legal-acceptance"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen
            name="invite-activation"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="onboarding-again"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="join-group"
            options={{
              headerShown: false,
              presentation: 'modal',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="create-challenge"
            options={{
              headerShown: false,
              presentation: 'modal',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="create-group"
            options={{
              headerShown: false,
              presentation: 'modal',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen name="group-invite" options={{ headerShown: false }} />
          <Stack.Screen name="join-promise" options={{ headerShown: false }} />
          <Stack.Screen name="join-event" options={{ headerShown: false }} />
          <Stack.Screen
            name="promise-accountability"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="challenges/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="groups/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="camera"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="verification"
            options={{
              headerShown: false,
              presentation: 'modal',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="shop"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="inventory" options={{ headerShown: false }} />
          <Stack.Screen name="momenta" options={{ headerShown: false }} />
          <Stack.Screen name="group-members" options={{ headerShown: false }} />
          <Stack.Screen
            name="group-settings"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="notification-settings"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="language-settings"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen
            name="ad-tracking-permission"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="support" options={{ headerShown: false }} />
          <Stack.Screen name="report-issue" options={{ headerShown: false }} />
          <Stack.Screen
            name="error-boundary"
            options={{ headerShown: false }}
          />
        </Stack>
      </View>
      {startupBlocked ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.background.primary, zIndex: 1000 },
          ]}
          accessibilityViewIsModal
          importantForAccessibility="yes"
          pointerEvents="auto"
          onStartShouldSetResponder={() => true}
        >
          <FullScreenLoading message={t('shared.rootLayout.initialising')} />
        </View>
      ) : null}
      <AppUpdateGateHost
        enabled={
          !startupBlocked &&
          isAuthenticated &&
          hasCompletedOnboarding &&
          handoffsHydrated &&
          recoveryGateResolved &&
          !recoveryConfinementDestination
        }
      />
      <OtaUpdateReadyHost
        enabled={
          !startupBlocked &&
          isAuthenticated &&
          hasCompletedOnboarding &&
          handoffsHydrated &&
          recoveryGateResolved &&
          !recoveryConfinementDestination
        }
      />
      <StatusBar style="light" />
    </ErrorBoundary>
  );
}

function RootLayoutContent() {
  if (Platform.OS === 'web') {
    return <WebNotSupported />;
  }

  return <NativeRootLayoutContent />;
}

// Root component with providers and enhanced error handling
export default sentryWrap(function RootLayout() {
  const [fontsLoaded, fontError] = useMentaFonts();
  const equippedThemeSku = useMomentaStore(
    state => state.equippedItemSkus.theme
  );

  useEffect(() => {
    if (Platform.OS !== 'web' && (fontsLoaded || fontError)) {
      void SplashScreen.hideAsync().catch(error => {
        void error;
      });
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(
          '[RootLayout] Top-level error boundary triggered:',
          error,
          errorInfo
        );
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <MentaPostHogProvider>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider equippedThemeSku={equippedThemeSku}>
                <DensityProvider>
                  <ToastProvider>
                    <RootLayoutContent />
                    <LegacyAppUpdateGate />
                    {/** Global Paywall Host to present paywall anywhere */}
                    <PaywallHost />
                  </ToastProvider>
                </DensityProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </MentaPostHogProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
});
