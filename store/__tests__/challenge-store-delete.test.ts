import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChallengeStore } from '../challenge-store';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('ChallengeStore - deleteChallenge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST202',
        message:
          'Could not find the function public.delete_accountability_challenge_v2',
      },
    } as any);
    act(() => {
      useChallengeStore.setState({
        challenges: [],
        userChallenges: [],
        isLoading: false,
        error: null,
      });
    });
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('successfully deletes a challenge', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          user: { id: 'user-1' },
        },
      },
      error: null,
    } as any);

    mockSupabase.functions.invoke.mockResolvedValue({
      data: { success: true, message: 'Challenge deleted successfully' },
      error: null,
    });

    act(() => {
      useChallengeStore.setState({
        challenges: [
          {
            id: 'challenge-1',
            title: 'Test Challenge',
            description: 'Test',
            category: 'fitness',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            duration: 30,
            createdAt: '2024-01-01T00:00:00Z',
            creatorId: 'user-1',
            verificationType: 'photo',
            verificationFrequency: 'daily',
            isPublic: true,
          },
        ],
        userChallenges: [
          {
            userId: 'user-1',
            challengeId: 'challenge-1',
            currentStreak: 5,
            joinedAt: '2024-01-01T00:00:00Z',
          },
        ],
      });
    });

    const { result } = renderHook(() => useChallengeStore());

    let deletionResult;
    await act(async () => {
      deletionResult = await result.current.deleteChallenge(
        'challenge-1',
        'client-event-1'
      );
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'delete-challenge',
      {
        body: { challengeId: 'challenge-1' },
        headers: {
          Authorization: 'Bearer mock-token',
        },
      }
    );

    expect(result.current.challenges).toHaveLength(0);
    expect(result.current.userChallenges).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
    expect(deletionResult).toMatchObject({
      outcome: 'confirmed',
      code: 'LEGACY_DELETE_CONFIRMED',
    });
  });

  it('throws error when delete function reports missing challenge', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          user: { id: 'user-1' },
        },
      },
      error: null,
    } as any);
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { success: false, error: 'Challenge not found' },
      error: null,
    });

    const { result } = renderHook(() => useChallengeStore());

    await act(async () => {
      await expect(
        result.current.deleteChallenge('missing')
      ).resolves.toMatchObject({
        outcome: 'failed',
        message: 'The promise was not changed. Please try again.',
      });
    });
  });

  it('throws error when session is invalid', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid session' },
    } as any);

    act(() => {
      useChallengeStore.setState({
        challenges: [
          {
            id: 'challenge-1',
            title: 'Test Challenge',
            description: 'Test',
            category: 'fitness',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            duration: 30,
            createdAt: '2024-01-01T00:00:00Z',
            creatorId: 'user-1',
            verificationType: 'photo',
            verificationFrequency: 'daily',
            isPublic: true,
          },
        ],
      });
    });

    const { result } = renderHook(() => useChallengeStore());

    await act(async () => {
      await expect(
        result.current.deleteChallenge('challenge-1')
      ).resolves.toMatchObject({
        outcome: 'failed',
        code: 'AUTH_REQUIRED',
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('throws error when function call fails', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          user: { id: 'user-1' },
        },
      },
      error: null,
    } as any);

    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Permission denied' },
    });

    act(() => {
      useChallengeStore.setState({
        challenges: [
          {
            id: 'challenge-1',
            title: 'Test Challenge',
            description: 'Test',
            category: 'fitness',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            duration: 30,
            createdAt: '2024-01-01T00:00:00Z',
            creatorId: 'user-1',
            verificationType: 'photo',
            verificationFrequency: 'daily',
            isPublic: true,
          },
        ],
      });
    });

    const { result } = renderHook(() => useChallengeStore());

    await act(async () => {
      await expect(
        result.current.deleteChallenge('challenge-1')
      ).resolves.toMatchObject({
        outcome: 'unknown',
        message:
          'Menta could not confirm whether this promise was deleted. Check its status before trying again.',
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.challenges).toHaveLength(1);
  });

  it('throws error when function returns failure', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          user: { id: 'user-1' },
        },
      },
      error: null,
    } as any);

    mockSupabase.functions.invoke.mockResolvedValue({
      data: { success: false, error: 'Database error' },
      error: null,
    });

    act(() => {
      useChallengeStore.setState({
        challenges: [
          {
            id: 'challenge-1',
            title: 'Test Challenge',
            description: 'Test',
            category: 'fitness',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            duration: 30,
            createdAt: '2024-01-01T00:00:00Z',
            creatorId: 'user-1',
            verificationType: 'photo',
            verificationFrequency: 'daily',
            isPublic: true,
          },
        ],
      });
    });

    const { result } = renderHook(() => useChallengeStore());

    await act(async () => {
      await expect(
        result.current.deleteChallenge('challenge-1')
      ).resolves.toMatchObject({
        outcome: 'failed',
        message: 'The promise was not changed. Please try again.',
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.challenges).toHaveLength(1);
  });

  it('uses the v2 receipt directly and never calls the legacy Edge Function', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: {
        operation: 'PROMISE_DELETE',
        outcome: 'confirmed',
        code: 'DELETE_CONFIRMED',
        message: 'The promise was deleted.',
        challenge_id: 'challenge-1',
        client_event_id: 'client-event-2',
        receipt: {
          receipt_id: 'client-event-2',
          challenge_id: 'challenge-1',
          client_event_id: 'client-event-2',
        },
      },
      error: null,
    } as any);
    act(() => {
      useChallengeStore.setState({
        challenges: [{ id: 'challenge-1' } as any],
        userChallenges: [
          { userId: 'user-1', challengeId: 'challenge-1' } as any,
        ],
      });
    });

    await expect(
      useChallengeStore
        .getState()
        .deleteChallenge('challenge-1', 'client-event-2')
    ).resolves.toMatchObject({
      outcome: 'confirmed',
      receipt: { id: 'client-event-2' },
    });
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    expect(useChallengeStore.getState().challenges).toEqual([]);
  });

  it('does not call the legacy deletion after v2 transport response loss', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Connection closed after commit' },
    } as any);
    act(() => {
      useChallengeStore.setState({
        challenges: [{ id: 'challenge-1' } as any],
      });
    });

    await expect(
      useChallengeStore
        .getState()
        .deleteChallenge('challenge-1', 'client-event-3')
    ).resolves.toMatchObject({
      outcome: 'unknown',
      recovery: 'status-check',
    });
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    expect(useChallengeStore.getState().challenges).toHaveLength(1);
  });

  it('reconciles response loss by status only and removes local state from the returned receipt', async () => {
    mockSupabase.rpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection closed after commit' },
      } as any)
      .mockResolvedValueOnce({
        data: {
          operation: 'PROMISE_DELETE',
          outcome: 'confirmed',
          code: 'DELETE_CONFIRMED',
          message: 'The promise was deleted.',
          challenge_id: 'challenge-1',
          client_event_id: 'client-event-4',
          idempotent: true,
          receipt: {
            receipt_id: 'client-event-4',
            challenge_id: 'challenge-1',
            client_event_id: 'client-event-4',
          },
        },
        error: null,
      } as any);
    act(() => {
      useChallengeStore.setState({
        challenges: [{ id: 'challenge-1' } as any],
      });
    });

    await useChallengeStore
      .getState()
      .deleteChallenge('challenge-1', 'client-event-4');
    await expect(
      useChallengeStore
        .getState()
        .reconcileDeleteChallenge('challenge-1', 'client-event-4')
    ).resolves.toMatchObject({
      outcome: 'confirmed',
      receipt: { id: 'client-event-4', idempotent: true },
    });

    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      1,
      'delete_accountability_challenge_v2',
      {
        p_challenge_id: 'challenge-1',
        p_client_event_id: 'client-event-4',
        p_check_only: false,
      }
    );
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
      2,
      'delete_accountability_challenge_v2',
      {
        p_challenge_id: 'challenge-1',
        p_client_event_id: 'client-event-4',
        p_check_only: true,
      }
    );
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    expect(useChallengeStore.getState().challenges).toEqual([]);
  });

  it('returns the server safe-retry gate without repeating deletion', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: {
        operation: 'PROMISE_DELETE',
        outcome: 'failed',
        code: 'DELETE_NOT_APPLIED',
        message: 'It is safe to try again.',
        challenge_id: 'challenge-1',
        client_event_id: 'client-event-5',
        safe_to_retry: true,
      },
      error: null,
    } as any);

    await expect(
      useChallengeStore
        .getState()
        .reconcileDeleteChallenge('challenge-1', 'client-event-5')
    ).resolves.toMatchObject({
      outcome: 'failed',
      code: 'DELETE_NOT_APPLIED',
      safeToRetry: true,
    });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('sets loading state correctly during deletion', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          user: { id: 'user-1' },
        },
      },
      error: null,
    } as any);

    let resolveFn: (value: any) => void;
    const invokePromise = new Promise(resolve => {
      resolveFn = resolve;
    });

    mockSupabase.functions.invoke.mockReturnValue(invokePromise as any);

    act(() => {
      useChallengeStore.setState({
        challenges: [
          {
            id: 'challenge-1',
            title: 'Test Challenge',
            description: 'Test',
            category: 'fitness',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            duration: 30,
            createdAt: '2024-01-01T00:00:00Z',
            creatorId: 'user-1',
            verificationType: 'photo',
            verificationFrequency: 'daily',
            isPublic: true,
          },
        ],
      });
    });

    const { result } = renderHook(() => useChallengeStore());

    act(() => {
      result.current.deleteChallenge('challenge-1');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFn!({
        data: { success: true, message: 'Challenge deleted successfully' },
        error: null,
      });
      await invokePromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
