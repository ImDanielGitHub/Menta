import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';
import type { OnboardingAccountabilityChoice } from '@/lib/onboarding-draft';
import { useInviteStore } from '@/store/invite-store';
import { useProtectedRouteStore } from '@/store/protected-route-store';

export const ONBOARDING_COMPLETION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type OnboardingCompletionHandoff = {
  ownerUserId: string;
  firstPromiseId: string;
  accountabilityChoice: OnboardingAccountabilityChoice;
  timestamp: number;
};

type QueueOnboardingCompletionInput = {
  ownerUserId: string;
  firstPromiseId: string;
  accountabilityChoice: OnboardingAccountabilityChoice;
};

type OnboardingCompletionState = {
  pending: OnboardingCompletionHandoff | null;
  navigationRequest: number;
  requestNavigationForUser: (userId: string) => boolean;
  queueCompletion: (input: QueueOnboardingCompletionInput) => boolean;
  peekCompletionForUser: (userId: string) => OnboardingCompletionHandoff | null;
  consumeCompletionForUser: (
    userId: string
  ) => OnboardingCompletionHandoff | null;
  clearOwnedCompletion: (userId: string) => void;
  clearCompletion: () => void;
};

type OnboardingCopyTranslator = (key: TranslationKey) => string;

const normaliseIdentifier = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalised = value.trim();
  return normalised && normalised.length <= 160 ? normalised : null;
};

const isFreshCompletion = (
  completion: OnboardingCompletionHandoff,
  now = Date.now()
) => {
  const age = now - completion.timestamp;
  return (
    Number.isFinite(completion.timestamp) &&
    age >= 0 &&
    age <= ONBOARDING_COMPLETION_TTL_MS
  );
};

const normaliseAccountabilityChoice = (
  value: unknown
): OnboardingAccountabilityChoice =>
  value === 'new_group' ? 'new_group' : 'just_me';

const readCompletionForUser = (
  completion: OnboardingCompletionHandoff | null,
  userId: string,
  now = Date.now()
): OnboardingCompletionHandoff | null => {
  const normalisedUserId = normaliseIdentifier(userId);
  if (
    !completion ||
    !normalisedUserId ||
    completion.ownerUserId !== normalisedUserId ||
    !isFreshCompletion(completion, now)
  ) {
    return null;
  }

  return completion;
};

export const canResumeOwnedOnboardingCompletion = ({
  completion,
  currentUserId,
  hasCompletedOnboarding,
  isAuthenticated,
  isInitialized,
  now = Date.now(),
}: {
  completion: OnboardingCompletionHandoff | null;
  currentUserId: string | null;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  now?: number;
}): boolean =>
  Boolean(
    isInitialized &&
    isAuthenticated &&
    hasCompletedOnboarding &&
    currentUserId &&
    readCompletionForUser(completion, currentUserId, now)
  );

/**
 * Holds the one navigation receipt created after an account's first promise is
 * confirmed. RootLayout routes it and the mounted destination acknowledges it.
 */
export const useOnboardingCompletionStore = create<OnboardingCompletionState>()(
  persist(
    (set, get) => ({
      pending: null,
      navigationRequest: 0,
      requestNavigationForUser: userId => {
        if (!get().peekCompletionForUser(userId)) return false;
        // Receipt deduplication preserves durable identity. A new confirmed
        // button action still needs its own observable navigation request.
        set(state => ({ navigationRequest: state.navigationRequest + 1 }));
        return true;
      },
      queueCompletion: input => {
        const ownerUserId = normaliseIdentifier(input.ownerUserId);
        const firstPromiseId = normaliseIdentifier(input.firstPromiseId);
        if (!ownerUserId || !firstPromiseId) return false;
        const accountabilityChoice = normaliseAccountabilityChoice(
          input.accountabilityChoice
        );

        const current = get().pending;
        if (
          current?.ownerUserId === ownerUserId &&
          current.firstPromiseId === firstPromiseId &&
          current.accountabilityChoice === accountabilityChoice &&
          isFreshCompletion(current)
        ) {
          return true;
        }

        set({
          pending: {
            ownerUserId,
            firstPromiseId,
            accountabilityChoice,
            timestamp: Date.now(),
          },
        });
        return true;
      },
      peekCompletionForUser: userId => {
        const completion = get().pending;
        const owned = readCompletionForUser(completion, userId);
        if (!owned && completion && !isFreshCompletion(completion)) {
          set({ pending: null });
        }
        return owned;
      },
      consumeCompletionForUser: userId => {
        const completion = get().peekCompletionForUser(userId);
        if (!completion) return null;

        if (get().pending === completion) {
          set({ pending: null });
        }
        return completion;
      },
      clearOwnedCompletion: userId => {
        const ownerUserId = normaliseIdentifier(userId);
        if (!ownerUserId || get().pending?.ownerUserId !== ownerUserId) {
          return;
        }
        set({ pending: null });
      },
      clearCompletion: () => set({ pending: null }),
    }),
    {
      name: 'onboarding-completion-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ pending: state.pending }),
      version: 2,
      migrate: persistedState => {
        const state = persistedState as {
          pending?: Omit<
            OnboardingCompletionHandoff,
            'accountabilityChoice'
          > & {
            accountabilityChoice?: unknown;
          };
        };
        return {
          pending: state.pending
            ? {
                ...state.pending,
                accountabilityChoice: normaliseAccountabilityChoice(
                  state.pending.accountabilityChoice
                ),
              }
            : null,
        };
      },
    }
  )
);

export const buildFirstPromiseCompletionHref = (
  completion: OnboardingCompletionHandoff
): Href => ({
  pathname: '/challenges/[id]',
  params: { id: completion.firstPromiseId },
});

export type OnboardingCompletionDestination =
  | {
      kind: 'invite';
      href: Href;
    }
  | {
      kind: 'protected_route';
      href: Href;
    }
  | {
      kind: 'first_promise';
      href: Href;
    }
  | {
      kind: 'promise_accountability';
      href: Href;
    }
  | {
      kind: 'tabs';
      href: Href;
    };

export type OnboardingReceiptContinuation = {
  label: string;
  message: string;
};

export const getOnboardingReceiptContinuation = ({
  currentUserId,
  pendingInvite,
  pendingProtectedRoute,
  accountabilityChoice,
  localise,
}: {
  currentUserId: string | null;
  pendingInvite: {
    type: 'group' | 'challenge';
    ownerUserId?: string | null;
  } | null;
  pendingProtectedRoute: {
    path: string;
    ownerUserId?: string | null;
  } | null;
  accountabilityChoice: OnboardingAccountabilityChoice;
  localise?: OnboardingCopyTranslator;
}): OnboardingReceiptContinuation | null => {
  const owns = (ownerUserId?: string | null) =>
    Boolean(currentUserId && (!ownerUserId || ownerUserId === currentUserId));

  if (pendingInvite && owns(pendingInvite.ownerUserId)) {
    return pendingInvite.type === 'challenge'
      ? {
          label: localise
            ? localise('fullAuth.onboarding.review_promise_invite')
            : translate('en-NZ', 'fullAuth.onboarding.review_promise_invite'),
          message: localise
            ? localise('fullAuth.onboarding.promise_invite_held')
            : translate('en-NZ', 'fullAuth.onboarding.promise_invite_held'),
        }
      : {
          label: localise
            ? localise('fullAuth.onboarding.review_group_invite')
            : translate('en-NZ', 'fullAuth.onboarding.review_group_invite'),
          message: localise
            ? localise('fullAuth.onboarding.group_invite_held')
            : translate('en-NZ', 'fullAuth.onboarding.group_invite_held'),
        };
  }

  if (
    pendingProtectedRoute &&
    owns(pendingProtectedRoute.ownerUserId) &&
    pendingProtectedRoute.path.startsWith('/events/')
  ) {
    return {
      label: localise
        ? localise('fullAuth.onboarding.open_event')
        : translate('en-NZ', 'fullAuth.onboarding.open_event'),
      message: localise
        ? localise('fullAuth.onboarding.event_held')
        : translate('en-NZ', 'fullAuth.onboarding.event_held'),
    };
  }

  if (accountabilityChoice === 'new_group') {
    return {
      label: localise
        ? localise('fullAuth.onboarding.create_my_group')
        : translate('en-NZ', 'fullAuth.onboarding.create_my_group'),
      message: localise
        ? localise('fullAuth.onboarding.create_my_group_detail')
        : translate('en-NZ', 'fullAuth.onboarding.create_my_group_detail'),
    };
  }

  return null;
};

export const getValidatedOnboardingReceiptContinuation = ({
  currentUserId,
  accountabilityChoice,
  localise,
}: {
  currentUserId: string | null;
  accountabilityChoice: OnboardingAccountabilityChoice;
  localise?: OnboardingCopyTranslator;
}): OnboardingReceiptContinuation | null => {
  const pendingInvite = currentUserId
    ? useInviteStore.getState().peekPendingNavigationForUser(currentUserId)
    : null;
  const pendingProtectedRoute = currentUserId
    ? useProtectedRouteStore.getState().peekPendingRouteForUser(currentUserId)
    : null;
  return getOnboardingReceiptContinuation({
    currentUserId,
    pendingInvite,
    pendingProtectedRoute,
    accountabilityChoice,
    localise,
  });
};

export const chooseOnboardingCompletionDestination = ({
  pendingInvite,
  pendingProtectedRoute,
  completion,
}: {
  pendingInvite: { type: 'group' | 'challenge'; code: string } | null;
  pendingProtectedRoute: { path: string } | null;
  completion: OnboardingCompletionHandoff | null;
}): OnboardingCompletionDestination => {
  if (pendingInvite) {
    return {
      kind: 'invite',
      href:
        pendingInvite.type === 'challenge' ? '/join-funding' : '/join-group',
    };
  }

  if (pendingProtectedRoute) {
    return {
      kind: 'protected_route',
      href: pendingProtectedRoute.path.split('?', 1)[0] as Href,
    };
  }

  if (completion) {
    if (completion.accountabilityChoice === 'new_group') {
      return {
        kind: 'promise_accountability',
        href: {
          pathname: '/promise-accountability',
          params: {
            source: 'onboarding',
            challengeId: completion.firstPromiseId,
          },
        },
      };
    }
    return {
      kind: 'first_promise',
      href: buildFirstPromiseCompletionHref(completion),
    };
  }

  return { kind: 'tabs', href: '/(tabs)' };
};
