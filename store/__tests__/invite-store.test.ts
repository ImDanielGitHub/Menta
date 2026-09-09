import { act, renderHook } from '@testing-library/react-native';
import { PENDING_INVITE_TTL_MS, useInviteStore } from '../invite-store';
import { useChallengeStore } from '../challenge-store';
import { useGroupStore } from '../group-store';

jest.mock('../group-store', () => ({
  useGroupStore: {
    getState: jest.fn(),
  },
}));

jest.mock('../challenge-store', () => ({
  useChallengeStore: {
    getState: jest.fn(),
  },
}));

const mockUseGroupStore = useGroupStore as unknown as {
  getState: jest.Mock;
};
const mockUseChallengeStore = useChallengeStore as unknown as {
  getState: jest.Mock;
};

describe('invite-store', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    useInviteStore.setState({ pending: null });
    jest.clearAllMocks();
  });

  it('persists normalized group invite codes for post-auth acceptance', () => {
    const { result } = renderHook(() => useInviteStore());

    act(() => {
      result.current.setPendingGroup('abc-123');
    });

    expect(result.current.pending).toMatchObject({
      type: 'group',
      code: 'ABC123',
      ownerUserId: null,
      navigationClaimedAt: null,
    });
  });

  it('does not replace a valid pending invite with malformed input', () => {
    const { result } = renderHook(() => useInviteStore());

    act(() => {
      result.current.setPendingGroup('abc123');
      result.current.setPendingGroup('https://example.com/join?invite=bad!');
    });

    expect(result.current.pending).toMatchObject({
      type: 'group',
      code: 'ABC123',
    });
  });

  it('keeps a saved invite untouched until an authenticated account is ready', async () => {
    const { result } = renderHook(() => useInviteStore());
    act(() => {
      result.current.setPendingChallenge('fit2026');
    });

    await expect(result.current.processIfAny('')).resolves.toEqual({
      status: 'none',
    });
    expect(result.current.pending).toMatchObject({
      type: 'challenge',
      code: 'FIT2026',
    });
  });

  it('routes a group invite once and retains it until verified preview', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const { result } = renderHook(() => useInviteStore());
    act(() => {
      result.current.setPendingGroup('abc123');
    });

    let processResult:
      | Awaited<ReturnType<typeof result.current.processIfAny>>
      | undefined;
    await act(async () => {
      processResult = await result.current.processIfAny('user-1');
    });

    expect(processResult).toEqual({
      status: 'preview_required',
      invite: {
        type: 'group',
        code: 'ABC123',
        timestamp: 1_000,
        ownerUserId: 'user-1',
        navigationClaimedAt: 1_000,
      },
    });
    expect(mockUseGroupStore.getState).not.toHaveBeenCalled();
    expect(result.current.pending).toMatchObject({
      type: 'group',
      code: 'ABC123',
      ownerUserId: 'user-1',
      navigationClaimedAt: 1_000,
    });
    expect(await result.current.processIfAny('user-1')).toEqual({
      status: 'none',
    });
  });

  it('routes pending challenge invites to funding preview without accepting them', async () => {
    const { result } = renderHook(() => useInviteStore());
    act(() => {
      result.current.setPendingChallenge('fit2026');
    });

    let processResult:
      | Awaited<ReturnType<typeof result.current.processIfAny>>
      | undefined;
    await act(async () => {
      processResult = await result.current.processIfAny('user-1');
    });

    expect(processResult).toEqual({
      status: 'preview_required',
      invite: {
        type: 'challenge',
        code: 'FIT2026',
        timestamp: expect.any(Number),
        ownerUserId: 'user-1',
        navigationClaimedAt: expect.any(Number),
      },
    });
    expect(mockUseChallengeStore.getState).not.toHaveBeenCalled();
    expect(result.current.pending).toMatchObject({
      type: 'challenge',
      code: 'FIT2026',
      ownerUserId: 'user-1',
    });
  });

  it('allows only one account to claim an anonymous invite', async () => {
    const { result } = renderHook(() => useInviteStore());
    act(() => {
      result.current.setPendingGroup('abc123');
    });

    expect(result.current.peekPendingNavigationForUser('user-a')).toMatchObject(
      {
        code: 'ABC123',
        ownerUserId: null,
      }
    );

    let claimed: ReturnType<
      typeof result.current.claimPendingNavigationForUser
    > = null;
    act(() => {
      claimed = result.current.claimPendingNavigationForUser('user-a');
    });
    expect(claimed).toMatchObject({
      code: 'ABC123',
      ownerUserId: 'user-a',
      navigationClaimedAt: expect.any(Number),
    });
    expect(result.current.peekPendingForUser('user-b')).toBeNull();
    expect(result.current.claimPendingNavigationForUser('user-b')).toBeNull();
    expect(result.current.claimPendingNavigationForUser('user-a')).toBeNull();
  });

  it('treats a timestamp of zero as an existing navigation claim', () => {
    jest.spyOn(Date, 'now').mockReturnValue(0);
    const { result } = renderHook(() => useInviteStore());
    act(() => {
      result.current.setPendingGroup('abc123');
    });

    expect(
      result.current.claimPendingNavigationForUser('user-a')
    ).toMatchObject({
      navigationClaimedAt: 0,
    });
    expect(result.current.claimPendingNavigationForUser('user-a')).toBeNull();
  });

  it('clears only an invite owned by the outgoing account', () => {
    const { result } = renderHook(() => useInviteStore());
    act(() => {
      result.current.setPendingChallenge('fit2026', 'user-a');
      result.current.clearOwnedPendingInvite('user-b');
    });
    expect(result.current.pending).toMatchObject({ ownerUserId: 'user-a' });

    act(() => {
      result.current.clearOwnedPendingInvite('user-a');
    });
    expect(result.current.pending).toBeNull();

    act(() => {
      result.current.setPendingGroup('abc123');
      result.current.clearOwnedPendingInvite('user-a');
    });
    expect(result.current.pending).toMatchObject({ ownerUserId: null });
  });

  it('requires the matching owner and code for verified-preview clearing', () => {
    const { result } = renderHook(() => useInviteStore());
    act(() => {
      result.current.setPendingGroup('abc123', 'user-a');
    });

    act(() => {
      expect(result.current.clearPendingForUser('user-b', 'ABC123')).toBe(
        false
      );
      expect(result.current.clearPendingForUser('user-a', 'OTHER1')).toBe(
        false
      );
    });
    expect(result.current.pending).not.toBeNull();
    act(() => {
      expect(result.current.clearPendingForUser('user-a', 'abc-123')).toBe(
        true
      );
    });
    expect(result.current.pending).toBeNull();
  });

  it('dismisses only the exact invite that the visible preview owns', () => {
    const { result } = renderHook(() => useInviteStore());
    act(() => {
      result.current.setPendingChallenge('fit2026');
    });
    const visibleInvite = result.current.pending;
    expect(visibleInvite).not.toBeNull();

    act(() => {
      result.current.setPendingChallenge('next2026');
    });

    act(() => {
      expect(
        visibleInvite && result.current.dismissPending(visibleInvite)
      ).toBe(false);
    });
    expect(result.current.pending).toMatchObject({
      type: 'challenge',
      code: 'NEXT2026',
    });

    const currentInvite = result.current.pending;
    act(() => {
      expect(
        currentInvite && result.current.dismissPending(currentInvite)
      ).toBe(true);
    });
    expect(result.current.pending).toBeNull();
  });

  it('clears malformed persisted invites without hitting accept endpoints', async () => {
    useInviteStore.setState({
      pending: {
        type: 'group',
        code: 'BAD!',
        timestamp: Date.now(),
      },
    });

    const { result } = renderHook(() => useInviteStore());

    await act(async () => {
      await expect(result.current.processIfAny('user-1')).resolves.toEqual({
        status: 'cleared',
        reason: 'malformed',
        invite: {
          type: 'group',
          code: 'BAD!',
          timestamp: expect.any(Number),
        },
      });
    });

    expect(mockUseGroupStore.getState).not.toHaveBeenCalled();
    expect(mockUseChallengeStore.getState).not.toHaveBeenCalled();
    expect(result.current.pending).toBeNull();
  });

  it('clears a stale persisted invite before receipt or root navigation can use it', () => {
    jest.spyOn(Date, 'now').mockReturnValue(10_000_000);
    useInviteStore.setState({
      pending: {
        type: 'group',
        code: 'GROUP1234',
        timestamp: 10_000_000 - PENDING_INVITE_TTL_MS - 1,
        ownerUserId: 'user-1',
        navigationClaimedAt: null,
      },
    });

    expect(
      useInviteStore.getState().peekPendingNavigationForUser('user-1')
    ).toBeNull();
    expect(useInviteStore.getState().pending).toBeNull();
  });
});
