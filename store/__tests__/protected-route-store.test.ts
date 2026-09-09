import { act, renderHook } from '@testing-library/react-native';
import {
  PROTECTED_ROUTE_TTL_MS,
  normalizeProtectedRoutePath,
  useProtectedRouteStore,
} from '@/store/protected-route-store';

describe('protected-route-store', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    useProtectedRouteStore.setState({ pending: null });
  });

  it('accepts only internal app routes as protected handoffs', () => {
    expect(normalizeProtectedRoutePath('/review-queue?challengeId=c1')).toBe(
      '/review-queue?challengeId=c1'
    );
    expect(normalizeProtectedRoutePath('/groups/group-1')).toBe(
      '/groups/group-1'
    );

    expect(
      normalizeProtectedRoutePath('https://menta.quest/review')
    ).toBeNull();
    expect(normalizeProtectedRoutePath('//menta.quest/review')).toBeNull();
    expect(normalizeProtectedRoutePath('/login')).toBeNull();
    expect(normalizeProtectedRoutePath('/email-auth?mode=login')).toBeNull();
    expect(
      normalizeProtectedRoutePath('/email-confirmation/callback?code=secret')
    ).toBeNull();
    expect(normalizeProtectedRoutePath('/invite-activation')).toBeNull();
    expect(normalizeProtectedRoutePath('/join-event?eventId=event')).toBeNull();
    expect(normalizeProtectedRoutePath('/join-promise?code=secret')).toBeNull();
    expect(
      normalizeProtectedRoutePath('/legal-acceptance?surface=pre_authoring')
    ).toBeNull();
  });

  it('rejects malformed protected event paths and bearer queries', () => {
    const eventId = '11111111-1111-4111-8111-111111111111';
    const capability = 'opaque_event_capability_1234567890';
    expect(
      normalizeProtectedRoutePath(
        `/events/${eventId}/check-in?inviteToken=${capability}`
      )
    ).toBe(`/events/${eventId}/check-in?inviteToken=${capability}`);
    expect(
      normalizeProtectedRoutePath('/events/not-an-event?inviteToken=short')
    ).toBeNull();
    expect(
      normalizeProtectedRoutePath(
        `/events/${eventId}/unknown?inviteToken=${capability}`
      )
    ).toBeNull();
    expect(
      normalizeProtectedRoutePath(
        `/events/${eventId}?shareToken=${capability}&inviteToken=${capability}`
      )
    ).toBeNull();
  });

  it('stores and consumes a fresh protected route once', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1000);

    const { result } = renderHook(() => useProtectedRouteStore());

    act(() => {
      result.current.setPendingRoute('/review-queue?entryPoint=proof_receipt');
    });

    expect(result.current.pending).toMatchObject({
      path: '/review-queue?entryPoint=proof_receipt',
      source: 'auth_gate',
      timestamp: 1000,
      ownerUserId: null,
    });

    act(() => {
      expect(result.current.consumePendingRoute()).toMatchObject({
        path: '/review-queue?entryPoint=proof_receipt',
      });
    });

    expect(result.current.pending).toBeNull();
    expect(result.current.consumePendingRoute()).toBeNull();
  });

  it('clears stale protected routes instead of navigating later', () => {
    jest.spyOn(Date, 'now').mockReturnValue(5000);
    useProtectedRouteStore.setState({
      pending: {
        path: '/review-queue',
        source: 'deep_link',
        timestamp: 5000 - PROTECTED_ROUTE_TTL_MS - 1,
        ownerUserId: null,
      },
    });

    const { result } = renderHook(() => useProtectedRouteStore());

    let freshRoute:
      | ReturnType<typeof result.current.getFreshPendingRoute>
      | undefined;
    act(() => {
      freshRoute = result.current.getFreshPendingRoute();
    });

    expect(freshRoute).toBeNull();
    expect(useProtectedRouteStore.getState().pending).toBeNull();
  });

  it('lets one account claim an anonymous route without consuming it', () => {
    jest.spyOn(Date, 'now').mockReturnValue(10_000);
    const store = useProtectedRouteStore.getState();
    store.setPendingRoute('/review-queue', 'deep_link');

    expect(store.peekPendingRouteForUser('user-a')).toMatchObject({
      path: '/review-queue',
      ownerUserId: null,
    });
    expect(store.claimPendingRouteForUser('user-a')).toMatchObject({
      path: '/review-queue',
      ownerUserId: 'user-a',
    });
    expect(store.peekPendingRouteForUser('user-b')).toBeNull();
    expect(useProtectedRouteStore.getState().pending).toMatchObject({
      ownerUserId: 'user-a',
    });
  });

  it('consumes only the current account route once', () => {
    jest.spyOn(Date, 'now').mockReturnValue(20_000);
    const store = useProtectedRouteStore.getState();
    store.setPendingRoute('/groups/group-1', 'auth_gate', 'user-a');

    expect(store.consumePendingRouteForUser('user-b')).toBeNull();
    expect(store.consumePendingRouteForUser('user-a')).toMatchObject({
      path: '/groups/group-1',
      ownerUserId: 'user-a',
    });
    expect(store.consumePendingRouteForUser('user-a')).toBeNull();
  });

  it('clears only a route owned by the outgoing account', () => {
    const store = useProtectedRouteStore.getState();
    store.setPendingRoute('/review-queue', 'auth_gate', 'user-a');

    store.clearOwnedPendingRoute('user-b');
    expect(useProtectedRouteStore.getState().pending).not.toBeNull();
    store.clearOwnedPendingRoute('user-a');
    expect(useProtectedRouteStore.getState().pending).toBeNull();

    store.setPendingRoute('/review-queue', 'auth_gate');
    store.clearOwnedPendingRoute('user-a');
    expect(useProtectedRouteStore.getState().pending).toMatchObject({
      ownerUserId: null,
    });
  });
});
