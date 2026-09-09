import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { OnboardingAccountabilityChoice } from '@/lib/onboarding-draft';
import { useOnboardingCompletionStore } from '@/lib/navigation/onboarding-completion';

type InvitationOutcome = 'private' | 'shared' | 'skipped';
export type OnboardingInvitationLifecycle = {
  ownerUserId: string;
  firstPromiseId: string;
  status: 'pending' | 'complete';
  outcome: InvitationOutcome | null;
  updatedAt: number;
  navigationAcknowledgedAt?: number;
};

type InvitationLifecycleState = {
  hydrated: boolean;
  entries: Record<string, OnboardingInvitationLifecycle>;
  blockedOwners: Record<string, number>;
};

const STORAGE_KEY = '@menta/onboarding-invitation-lifecycle:v1';
export const useOnboardingInvitationLifecycleStore =
  create<InvitationLifecycleState>(() => ({
    hydrated: false,
    entries: {},
    blockedOwners: {},
  }));
let hydration: Promise<void> | null = null;
let writes = Promise.resolve();
let blockRevision = 0;

const boundedLocalTransition = (
  operation: Promise<boolean>
): Promise<boolean> =>
  new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), 1_500);
    void operation.then(
      result => {
        clearTimeout(timer);
        resolve(result);
      },
      () => {
        clearTimeout(timer);
        resolve(false);
      }
    );
  });

const isIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 160;

export function hydrateOnboardingInvitationLifecycle(): Promise<void> {
  if (hydration) return hydration;
  hydration = (async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const entries: Record<string, OnboardingInvitationLifecycle> = {};
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [ownerId, value] of Object.entries(parsed)) {
          if (!value || typeof value !== 'object') continue;
          const entry = value as Partial<OnboardingInvitationLifecycle>;
          if (
            !isIdentifier(ownerId) ||
            entry.ownerUserId !== ownerId ||
            !isIdentifier(entry.firstPromiseId) ||
            !Number.isFinite(entry.updatedAt)
          )
            continue;
          if (
            (entry.status === 'pending' && entry.outcome === null) ||
            (entry.status === 'complete' &&
              ['private', 'shared', 'skipped'].includes(entry.outcome ?? ''))
          ) {
            entries[ownerId] = entry as OnboardingInvitationLifecycle;
          }
        }
      }
    }
    useOnboardingInvitationLifecycleStore.setState({ entries, hydrated: true });
  })().catch(() => {
    // Unknown state must never authorise a review or feedback interruption.
    useOnboardingInvitationLifecycleStore.setState({ hydrated: false });
    hydration = null;
  });
  return hydration;
}

const saveTransition = (
  transition: (
    entries: InvitationLifecycleState['entries']
  ) => OnboardingInvitationLifecycle | null
): Promise<boolean> => {
  let result = false;
  const operation = writes
    .then(async () => {
      await hydrateOnboardingInvitationLifecycle();
      const state = useOnboardingInvitationLifecycleStore.getState();
      if (!state.hydrated) return;
      const entry = transition(state.entries);
      if (!entry) return;
      const entries = { ...state.entries, [entry.ownerUserId]: entry };
      // Block immediately when inviting starts. Completion becomes visible only
      // after its durable write, so restoring the app cannot undo the guard.
      if (entry.status === 'pending')
        useOnboardingInvitationLifecycleStore.setState({ entries });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      useOnboardingInvitationLifecycleStore.setState({ entries });
      result = true;
    })
    .catch(() => undefined);
  writes = operation;
  return operation.then(() => result);
};

/** Call with the confirmed first-promise receipt before releasing onboarding. */
export function beginOnboardingInvitation(input: {
  ownerUserId: string;
  firstPromiseId: string;
  accountabilityChoice: OnboardingAccountabilityChoice;
}): Promise<boolean> {
  if (!isIdentifier(input.ownerUserId) || !isIdentifier(input.firstPromiseId))
    return Promise.resolve(false);
  // Block synchronously before navigation can advance. Slow local persistence
  // may continue, but it must not make the first Invite tap feel unresponsive.
  const initial = useOnboardingInvitationLifecycleStore.getState();
  const revision = ++blockRevision;
  useOnboardingInvitationLifecycleStore.setState({
    blockedOwners: { ...initial.blockedOwners, [input.ownerUserId]: revision },
  });
  const operation = saveTransition(entries => {
    const current = entries[input.ownerUserId];
    // Route restoration must not reopen an invitation already shared/skipped.
    if (
      current?.firstPromiseId === input.firstPromiseId &&
      current.status === 'complete' &&
      current.outcome !== 'private'
    )
      return current;
    if (
      current?.firstPromiseId === input.firstPromiseId &&
      current.status === 'pending' &&
      input.accountabilityChoice === 'new_group'
    )
      return current;
    return {
      ownerUserId: input.ownerUserId,
      firstPromiseId: input.firstPromiseId,
      status:
        input.accountabilityChoice === 'new_group' ? 'pending' : 'complete',
      outcome: input.accountabilityChoice === 'new_group' ? null : 'private',
      updatedAt: Date.now(),
    };
  }).then(saved => {
    if (
      saved &&
      useOnboardingInvitationLifecycleStore.getState().blockedOwners[
        input.ownerUserId
      ] === revision
    ) {
      const remaining = {
        ...useOnboardingInvitationLifecycleStore.getState().blockedOwners,
      };
      delete remaining[input.ownerUserId];
      useOnboardingInvitationLifecycleStore.setState({
        blockedOwners: remaining,
      });
    }
    return saved;
  });
  return boundedLocalTransition(operation);
}

/** Generic back, unmount, invite preparation and share dismissal never finish. */
export function completeOnboardingInvitation(
  ownerUserId: string,
  firstPromiseId: string,
  outcome: 'shared' | 'skipped'
): Promise<boolean> {
  return boundedLocalTransition(
    saveTransition(entries => {
      const current = entries[ownerUserId];
      if (!current || current.firstPromiseId !== firstPromiseId) return null;
      if (current.status === 'complete' && current.outcome === 'shared')
        return current;
      return { ...current, status: 'complete', outcome, updatedAt: Date.now() };
    })
  );
}

export function isOnboardingInvitationComplete(ownerUserId: string): boolean {
  const state = useOnboardingInvitationLifecycleStore.getState();
  if (state.blockedOwners[ownerUserId]) return false;
  return state.hydrated && state.entries[ownerUserId]?.status === 'complete';
}

export function getOnboardingInvitationReviewGate(
  ownerUserId: string
): 'loading' | 'pending' | 'complete' | 'legacy' {
  const state = useOnboardingInvitationLifecycleStore.getState();
  if (state.blockedOwners[ownerUserId]) return 'pending';
  if (!state.hydrated || !useOnboardingCompletionStore.persist.hasHydrated())
    return 'loading';
  const entry = state.entries[ownerUserId];
  const handoff = useOnboardingCompletionStore.getState().pending;
  if (
    handoff?.ownerUserId === ownerUserId &&
    handoff.accountabilityChoice === 'new_group' &&
    (entry?.firstPromiseId !== handoff.firstPromiseId ||
      entry.status !== 'complete')
  )
    return 'pending';
  if (entry?.status === 'pending') return 'pending';
  return entry?.status === 'complete' ? 'complete' : 'legacy';
}

/** Claim the real Today arrival once, independently of native prompt eligibility. */
export async function acknowledgeOnboardingInvitationNavigation(
  ownerUserId: string
): Promise<boolean> {
  let claimed = false;
  const saved = await saveTransition(entries => {
    const current = entries[ownerUserId];
    if (
      !current ||
      current.status !== 'complete' ||
      current.outcome === 'private' ||
      current.navigationAcknowledgedAt
    )
      return null;
    claimed = true;
    return { ...current, navigationAcknowledgedAt: Date.now() };
  });
  return claimed && saved;
}
