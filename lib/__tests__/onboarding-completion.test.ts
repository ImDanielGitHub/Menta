import {
  buildFirstPromiseCompletionHref,
  chooseOnboardingCompletionDestination,
  getOnboardingReceiptContinuation,
  getValidatedOnboardingReceiptContinuation,
  ONBOARDING_COMPLETION_TTL_MS,
  useOnboardingCompletionStore,
} from '@/lib/navigation/onboarding-completion';
import { useInviteStore } from '@/store/invite-store';
import { useProtectedRouteStore } from '@/store/protected-route-store';

describe('onboarding completion navigation', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    useOnboardingCompletionStore.setState({ pending: null });
    useInviteStore.setState({ pending: null });
    useProtectedRouteStore.setState({ pending: null });
  });

  it('selects exactly one destination in invite, route, promise, tabs order', () => {
    const completion = {
      ownerUserId: 'user-a',
      firstPromiseId: 'promise-1',
      accountabilityChoice: 'just_me' as const,
      timestamp: 1_000,
    };
    const protectedRoute = { path: '/review-queue' };
    const invite = { type: 'group' as const, code: 'ABC123' };

    expect(
      chooseOnboardingCompletionDestination({
        pendingInvite: invite,
        pendingProtectedRoute: protectedRoute,
        completion,
      })
    ).toEqual({
      kind: 'invite',
      href: '/join-group',
    });
    expect(
      JSON.stringify(
        chooseOnboardingCompletionDestination({
          pendingInvite: invite,
          pendingProtectedRoute: protectedRoute,
          completion,
        })
      )
    ).not.toContain('ABC123');
    expect(
      chooseOnboardingCompletionDestination({
        pendingInvite: null,
        pendingProtectedRoute: null,
        completion: { ...completion, accountabilityChoice: 'new_group' },
      })
    ).toEqual({
      kind: 'promise_accountability',
      href: {
        pathname: '/promise-accountability',
        params: { source: 'onboarding', challengeId: 'promise-1' },
      },
    });
    expect(
      JSON.stringify(
        chooseOnboardingCompletionDestination({
          pendingInvite: null,
          pendingProtectedRoute: null,
          completion: { ...completion, accountabilityChoice: 'new_group' },
        })
      )
    ).not.toMatch(/token|bearer|secret/i);
    expect(
      chooseOnboardingCompletionDestination({
        pendingInvite: invite,
        pendingProtectedRoute: protectedRoute,
        completion: { ...completion, accountabilityChoice: 'new_group' },
      }).kind
    ).toBe('invite');
    expect(
      chooseOnboardingCompletionDestination({
        pendingInvite: null,
        pendingProtectedRoute: protectedRoute,
        completion: { ...completion, accountabilityChoice: 'new_group' },
      }).kind
    ).toBe('protected_route');
    expect(
      chooseOnboardingCompletionDestination({
        pendingInvite: null,
        pendingProtectedRoute: protectedRoute,
        completion,
      })
    ).toEqual({ kind: 'protected_route', href: '/review-queue' });
    const protectedEvent = chooseOnboardingCompletionDestination({
      pendingInvite: null,
      pendingProtectedRoute: {
        path: '/events/event-1/check-in?inviteToken=event-secret',
      },
      completion,
    });
    expect(protectedEvent).toEqual({
      kind: 'protected_route',
      href: '/events/event-1/check-in',
    });
    expect(JSON.stringify(protectedEvent)).not.toContain('event-secret');
    expect(
      chooseOnboardingCompletionDestination({
        pendingInvite: null,
        pendingProtectedRoute: null,
        completion,
      })
    ).toEqual({
      kind: 'first_promise',
      href: {
        pathname: '/challenges/[id]',
        params: { id: 'promise-1' },
      },
    });
    expect(
      chooseOnboardingCompletionDestination({
        pendingInvite: null,
        pendingProtectedRoute: null,
        completion: null,
      })
    ).toEqual({ kind: 'tabs', href: '/(tabs)' });
  });

  it('queues an account-bound first-promise handoff and consumes it once', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const store = useOnboardingCompletionStore.getState();

    expect(
      store.queueCompletion({
        ownerUserId: 'user-a',
        firstPromiseId: 'promise-1',
        accountabilityChoice: 'just_me',
      })
    ).toBe(true);
    expect(store.peekCompletionForUser('user-b')).toBeNull();
    expect(store.consumeCompletionForUser('user-b')).toBeNull();
    expect(store.peekCompletionForUser('user-a')).toEqual({
      ownerUserId: 'user-a',
      firstPromiseId: 'promise-1',
      accountabilityChoice: 'just_me',
      timestamp: 1_000,
    });

    const completion = store.consumeCompletionForUser('user-a');
    expect(completion).toEqual({
      ownerUserId: 'user-a',
      firstPromiseId: 'promise-1',
      accountabilityChoice: 'just_me',
      timestamp: 1_000,
    });
    expect(buildFirstPromiseCompletionHref(completion!)).toEqual({
      pathname: '/challenges/[id]',
      params: { id: 'promise-1' },
    });
    expect(store.consumeCompletionForUser('user-a')).toBeNull();
  });

  it('deduplicates the same fresh completion receipt', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const store = useOnboardingCompletionStore.getState();

    expect(
      store.queueCompletion({
        ownerUserId: 'user-a',
        firstPromiseId: 'promise-1',
        accountabilityChoice: 'just_me',
      })
    ).toBe(true);
    now.mockReturnValue(2_000);
    expect(
      store.queueCompletion({
        ownerUserId: 'user-a',
        firstPromiseId: 'promise-1',
        accountabilityChoice: 'just_me',
      })
    ).toBe(true);
    expect(useOnboardingCompletionStore.getState().pending?.timestamp).toBe(
      1_000
    );
  });

  it('clears only the outgoing account completion and expires stale receipts', () => {
    jest.spyOn(Date, 'now').mockReturnValue(10_000);
    useOnboardingCompletionStore.setState({
      pending: {
        ownerUserId: 'user-a',
        firstPromiseId: 'promise-1',
        accountabilityChoice: 'just_me',
        timestamp: 10_000,
      },
    });

    useOnboardingCompletionStore.getState().clearOwnedCompletion('user-b');
    expect(useOnboardingCompletionStore.getState().pending).not.toBeNull();
    useOnboardingCompletionStore.getState().clearOwnedCompletion('user-a');
    expect(useOnboardingCompletionStore.getState().pending).toBeNull();

    useOnboardingCompletionStore.setState({
      pending: {
        ownerUserId: 'user-a',
        firstPromiseId: 'promise-2',
        accountabilityChoice: 'just_me',
        timestamp: 10_000 - ONBOARDING_COMPLETION_TTL_MS - 1,
      },
    });
    expect(
      useOnboardingCompletionStore.getState().peekCompletionForUser('user-a')
    ).toBeNull();
    expect(useOnboardingCompletionStore.getState().pending).toBeNull();
  });

  it('rejects incomplete completion identifiers', () => {
    const store = useOnboardingCompletionStore.getState();
    expect(
      store.queueCompletion({
        ownerUserId: ' ',
        firstPromiseId: 'promise-1',
        accountabilityChoice: 'just_me',
      })
    ).toBe(false);
    expect(
      store.queueCompletion({
        ownerUserId: 'user-a',
        firstPromiseId: '',
        accountabilityChoice: 'just_me',
      })
    ).toBe(false);
    expect(useOnboardingCompletionStore.getState().pending).toBeNull();
  });

  it('orients the receipt to held capabilities without claiming their outcome', () => {
    const invite = getOnboardingReceiptContinuation({
      currentUserId: 'user-a',
      pendingInvite: { type: 'group', ownerUserId: 'user-a' },
      pendingProtectedRoute: {
        path: '/events/event-1/check-in?inviteToken=secret',
        ownerUserId: 'user-a',
      },
      accountabilityChoice: 'new_group',
    });
    expect(invite).toEqual({
      label: 'Review group invite',
      message:
        'Your group invite is still held. Review it next; joining remains a separate action.',
    });
    expect(JSON.stringify(invite)).not.toContain('secret');

    const event = getOnboardingReceiptContinuation({
      currentUserId: 'user-a',
      pendingInvite: null,
      pendingProtectedRoute: {
        path: '/events/event-1/check-in?inviteToken=secret',
        ownerUserId: 'user-a',
      },
      accountabilityChoice: 'new_group',
    });
    expect(event).toEqual({
      label: 'Open event',
      message:
        'Your event is still held. Open it next; this promise receipt does not claim participation.',
    });
    expect(JSON.stringify(event)).not.toContain('secret');

    expect(
      getOnboardingReceiptContinuation({
        currentUserId: 'user-b',
        pendingInvite: { type: 'challenge', ownerUserId: 'user-a' },
        pendingProtectedRoute: null,
        accountabilityChoice: 'just_me',
      })
    ).toBeNull();
  });

  it('does not orient receipt copy from malformed or stale pending state', () => {
    jest.spyOn(Date, 'now').mockReturnValue(10_000_000);
    useInviteStore.setState({
      pending: {
        type: 'group',
        code: 'bad',
        timestamp: 10_000_000,
        ownerUserId: 'user-a',
        navigationClaimedAt: null,
      },
    });
    useProtectedRouteStore.setState({
      pending: {
        path: '/events/not-an-event/check-in?inviteToken=short',
        source: 'onboarding_gate',
        timestamp: 1,
        ownerUserId: 'user-a',
      },
    });

    expect(
      getValidatedOnboardingReceiptContinuation({
        currentUserId: 'user-a',
        accountabilityChoice: 'just_me',
      })
    ).toBeNull();
    expect(useProtectedRouteStore.getState().pending).toBeNull();
  });
});
