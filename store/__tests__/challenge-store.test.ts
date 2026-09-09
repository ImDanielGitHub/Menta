import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useChallengeStore,
  Challenge,
  UserChallenge,
} from '../challenge-store';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/services/notification-service';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/streak-manager', () => ({
  StreakManager: {
    checkMilestone: jest.fn().mockResolvedValue(null),
  },
}));
jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    setupChallengeReminders: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockNotificationService = notificationService as jest.Mocked<
  typeof notificationService
>;
const approvedProofSubmissionId = '11111111-1111-4111-8111-111111111111';

const paidChallengeInput = {
  title: 'Paid Challenge',
  description: 'A paid challenge',
  category: 'fitness',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  duration: 30,
  creatorId: 'user-1',
  verificationType: 'photo',
  verificationFrequency: 'daily',
  isPublic: true,
  allowSelfReview: true,
  cost: 30,
} as const;

const paidChallengeRow = {
  id: 'challenge-1',
  title: 'Paid Challenge',
  description: 'A paid challenge',
  category: 'fitness',
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  duration: 30,
  created_at: '2024-01-01T00:00:00Z',
  creator_id: 'user-1',
  verification_type: 'photo',
  verification_frequency: 'daily',
  is_public: true,
  difficulty: 'medium',
  points_value: 200,
  allow_extensions: true,
  max_extensions: 2,
  deadline_type: 'fixed',
  status: 'active',
  extension_count: 0,
  allow_self_review: true,
};

const mockActiveAccount = (accountId: string | null) => {
  (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: {
      session: accountId
        ? { user: { id: accountId }, access_token: 'test-access-token' }
        : null,
    },
    error: null,
  });
};

const createThenableQuery = (result: { data: unknown; error: unknown }) => {
  const query: Record<string, jest.Mock> = {};
  [
    'select',
    'insert',
    'upsert',
    'update',
    'delete',
    'eq',
    'neq',
    'not',
    'in',
    'order',
    'limit',
    'range',
    'maybeSingle',
  ].forEach(method => {
    query[method] = jest.fn(() => query);
  });
  query.single = jest.fn(() => Promise.resolve(result));
  query.maybeSingle = jest.fn(() => Promise.resolve(result));
  query.then = jest.fn((resolve, reject) =>
    Promise.resolve(result).then(resolve, reject)
  );
  query.catch = jest.fn(reject => Promise.resolve(result).catch(reject));
  return query as any;
};

const mockApprovedProofReceipt = (newStreak: number) => {
  (mockSupabase.rpc as jest.Mock).mockImplementation(
    async (
      functionName: string,
      args: Record<string, string | null> | undefined
    ) => {
      if (functionName !== 'submit_challenge_verification' || !args) {
        return { data: null, error: null };
      }

      const clientEventId = args.p_client_event_id;
      const mediaType = args.p_media_type;
      const mediaUrl = args.p_media_url;
      const submissionText = args.p_submission_text;

      return {
        data: {
          success: true,
          inputAccepted: true,
          submissionId: approvedProofSubmissionId,
          clientEventId,
          status: 'approved',
          allowSelfReview: true,
          newStreak,
          longestStreak: Math.max(newStreak, 5),
          freezeUsed: false,
          freezesRemaining: 0,
          dayStatus: 'done',
          milestone: null,
          effectiveLocalDay: '2024-01-10',
          effectiveTimezone: 'Pacific/Auckland',
          isCorrection: false,
          replacesSubmissionId: null,
          data: {
            id: approvedProofSubmissionId,
            client_event_id: clientEventId,
            status: 'approved',
            allowSelfReview: true,
            media_url: mediaUrl,
            media_type: mediaType,
            submission_text: submissionText,
            replaces_submission_id: null,
          },
        },
        error: null,
      };
    }
  );
};

describe('ChallengeStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveAccount('user-1');
    // Reset store state
    useChallengeStore.getState().clearPersistedState();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useChallengeStore());

      expect(result.current.challenges).toEqual([]);
      expect(result.current.userChallenges).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Persistence', () => {
    it('does not persist account-scoped promises across sessions', async () => {
      useChallengeStore.setState({
        challenges: [paidChallengeRow as unknown as Challenge],
        userChallenges: [
          {
            userId: 'user-1',
            challengeId: 'challenge-1',
            currentStreak: 1,
            joinedAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      await waitFor(async () => {
        const stored = await AsyncStorage.getItem('challenge-storage');
        expect(stored).not.toContain('challenge-1');
        expect(JSON.parse(stored || '{}').state).toEqual({
          challenges: [],
          userChallenges: [],
          isLoading: false,
          error: null,
        });
      });
    });

    it('drops a legacy version-one promise payload during rehydration', async () => {
      await AsyncStorage.setItem(
        'challenge-storage',
        JSON.stringify({
          version: 1,
          state: {
            challenges: [
              {
                ...(paidChallengeRow as unknown as Challenge),
                id: 'legacy-challenge',
              },
            ],
            userChallenges: [
              {
                userId: 'deleted-account',
                challengeId: 'legacy-challenge',
                currentStreak: 4,
                joinedAt: '2024-01-01T00:00:00Z',
              },
            ],
          },
        })
      );

      await useChallengeStore.persist.rehydrate();

      expect(useChallengeStore.getState().challenges).toEqual([]);
      expect(useChallengeStore.getState().userChallenges).toEqual([]);
    });
  });

  describe('fetchChallenges', () => {
    it('successfully fetches challenges', async () => {
      const mockChallenges = [
        {
          id: 'challenge-1',
          title: 'Morning Run',
          description: 'Run every morning',
          category: 'fitness',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          creator_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          verification_type: 'photo',
          verification_frequency: 'daily',
          is_public: true,
        },
      ];

      const mockOrderFn = jest.fn().mockResolvedValue({
        data: mockChallenges,
        error: null,
      });

      const mockEqFn = jest.fn().mockReturnValue({
        order: mockOrderFn,
      });

      const mockSelectFn = jest.fn().mockReturnValue({
        eq: mockEqFn,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelectFn,
      } as any);

      const { result } = renderHook(() => useChallengeStore());

      await act(async () => {
        await result.current.fetchChallenges();
      });

      expect(result.current.challenges).toHaveLength(1);
      expect(result.current.challenges[0]).toMatchObject({
        id: 'challenge-1',
        title: 'Morning Run',
        category: 'fitness',
        verificationType: 'photo',
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('handles fetch challenges error', async () => {
      const mockOrderFn = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrderFn,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useChallengeStore());

      await act(async () => {
        try {
          await result.current.fetchChallenges();
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets loading state during fetch', async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise(resolve => {
        resolveFetch = resolve;
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue(fetchPromise),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useChallengeStore());

      act(() => {
        result.current.fetchChallenges();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveFetch({ data: [], error: null });
        await fetchPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('fetchUserChallenges', () => {
    it('successfully fetches user challenges', async () => {
      const mockUserChallenges = [
        {
          user_id: 'user-1',
          challenge_id: 'challenge-1',
          joined_at: '2024-01-01T00:00:00Z',
          current_streak: 5,
          last_check_in: '2024-01-05',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockUserChallenges,
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useChallengeStore());

      await act(async () => {
        await result.current.fetchUserChallenges('user-1');
      });

      expect(result.current.userChallenges).toHaveLength(1);
      expect(result.current.userChallenges[0]).toMatchObject({
        userId: 'user-1',
        challengeId: 'challenge-1',
        currentStreak: 5,
      });
    });

    it('handles fetch user challenges error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' },
          }),
        }),
      } as any);

      const { result } = renderHook(() => useChallengeStore());

      await act(async () => {
        try {
          await result.current.fetchUserChallenges('user-1');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('does not paint delayed user challenges into another account', async () => {
      let resolveFetch!: (value: {
        data: Array<Record<string, unknown>>;
        error: null;
      }) => void;
      const fetchResult = new Promise<{
        data: Array<Record<string, unknown>>;
        error: null;
      }>(resolve => {
        resolveFetch = resolve;
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(fetchResult),
        }),
      } as any);

      const { result } = renderHook(() => useChallengeStore());
      const fetchPromise = result.current.fetchUserChallenges('user-1');

      await waitFor(() => expect(mockSupabase.from).toHaveBeenCalled());
      mockActiveAccount('user-2');
      resolveFetch({
        data: [
          {
            user_id: 'user-1',
            challenge_id: 'challenge-1',
            joined_at: '2024-01-01T00:00:00Z',
            current_streak: 5,
            last_check_in: '2024-01-05',
            challenges: { status: 'active' },
          },
        ],
        error: null,
      });
      await fetchPromise;

      expect(result.current.userChallenges).toEqual([]);
    });
  });

  describe('leaveChallenge', () => {
    it('leaves through server authority and removes confirmed local state', async () => {
      const { result } = renderHook(() => useChallengeStore());

      act(() => {
        useChallengeStore.setState({
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

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          operation: 'CHALLENGE_LEAVE',
          code: 'LEAVE_CONFIRMED',
          receipt: {
            challenge_id: 'challenge-1',
            user_id: 'user-1',
            joined_at: '2024-01-01T00:00:00Z',
            left_at: '2026-08-13T03:00:00Z',
            changed: true,
            idempotent: false,
          },
        },
        error: null,
      } as any);

      let mutationResult;
      await act(async () => {
        mutationResult = await result.current.leaveChallenge(
          'user-1',
          'challenge-1'
        );
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'leave_accountability_challenge_v1',
        { p_challenge_id: 'challenge-1' }
      );
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(mutationResult).toMatchObject({
        outcome: 'confirmed',
        code: 'LEAVE_CONFIRMED',
      });
      expect(result.current.userChallenges).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('keeps local participation when the server receipt does not match', async () => {
      act(() => {
        useChallengeStore.setState({
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

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          operation: 'CHALLENGE_LEAVE',
          code: 'LEAVE_CONFIRMED',
          receipt: {
            challenge_id: 'challenge-2',
            user_id: 'user-1',
          },
        },
        error: null,
      });

      await expect(
        useChallengeStore.getState().leaveChallenge('user-1', 'challenge-1')
      ).resolves.toMatchObject({
        outcome: 'unknown',
        code: 'RECEIPT_MISMATCH',
        recovery: 'safe-retry',
      });

      expect(useChallengeStore.getState().userChallenges).toHaveLength(1);
      expect(useChallengeStore.getState().isLoading).toBe(false);
    });

    it('returns a definitive server rejection without removing local participation', async () => {
      act(() => {
        useChallengeStore.setState({
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
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: false,
          operation: 'CHALLENGE_LEAVE',
          code: 'AUTH_SESSION_REVOKED',
          message: 'Sign in again before leaving.',
        },
        error: null,
      });

      await expect(
        useChallengeStore.getState().leaveChallenge('user-1', 'challenge-1')
      ).resolves.toMatchObject({
        outcome: 'failed',
        code: 'AUTH_SESSION_REVOKED',
      });
      expect(useChallengeStore.getState().userChallenges).toHaveLength(1);
    });

    it('treats transport response loss as unknown and preserves the safe idempotent retry path', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Connection closed after request' },
      });

      await expect(
        useChallengeStore.getState().leaveChallenge('user-1', 'challenge-1')
      ).resolves.toMatchObject({
        outcome: 'unknown',
        recovery: 'safe-retry',
      });
    });
  });

  describe('createChallenge', () => {
    it('sets up creator reminders after paid challenge creation', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          challenge_id: 'challenge-1',
          receipt: {
            is_first_promise: true,
            next_due_at: '2026-08-05T23:00:00+00:00',
          },
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: paidChallengeRow,
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useChallengeStore());

      let creationResult:
        | {
            challenge: Challenge;
            receipt: {
              isFirstPromise: boolean;
              nextDueAt: string | null;
            } | null;
          }
        | undefined;
      await act(async () => {
        creationResult =
          await result.current.createChallengeWithPayment(paidChallengeInput);
      });

      expect(creationResult).toEqual({
        challenge: expect.objectContaining({
          id: 'challenge-1',
          title: 'Paid Challenge',
        }),
        receipt: {
          isFirstPromise: true,
          nextDueAt: '2026-08-05T23:00:00+00:00',
          activation: null,
          referral: null,
        },
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_accountability_challenge',
        expect.not.objectContaining({ p_user_id: expect.any(String) })
      );
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_accountability_challenge',
        expect.objectContaining({
          p_title: 'Paid Challenge',
          p_allow_self_review: true,
        })
      );
      expect(
        mockNotificationService.setupChallengeReminders
      ).toHaveBeenCalledWith('user-1', 'challenge-1', 'Paid Challenge');
    });

    it('uses the idempotent server path for the first promise', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          challenge_id: 'challenge-1',
          replayed: false,
          receipt: {
            is_first_promise: true,
            next_due_at: '2026-08-05T23:00:00+00:00',
            activation: {
              confirmed: true,
              activated: true,
              activated_at: '2026-08-05T01:00:00+00:00',
              first_promise_id: 'challenge-1',
              first_promise_title: 'Paid Challenge',
              source: 'first_promise_v1',
              welcome_momenta: {
                granted: true,
                amount: 100,
                outcome: 'granted_now',
              },
              referral: null,
            },
          },
        },
        error: null,
      });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: paidChallengeRow,
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useChallengeStore());

      let creationResult: Awaited<
        ReturnType<typeof result.current.createFirstPromiseWithPayment>
      >;
      await act(async () => {
        creationResult = await result.current.createFirstPromiseWithPayment(
          paidChallengeInput,
          'user-1'
        );
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'ensure_first_promise_v1',
        expect.objectContaining({
          p_title: 'Paid Challenge',
          p_cost: 30,
        })
      );
      expect(creationResult!).toMatchObject({
        challenge: { id: 'challenge-1' },
        receipt: {
          isFirstPromise: true,
          activation: {
            confirmed: true,
            firstPromiseId: 'challenge-1',
            welcomeMomentaAmount: 100,
          },
        },
      });
      expect(result.current.challenges).toHaveLength(1);
      expect(result.current.userChallenges).toEqual([
        expect.objectContaining({
          userId: 'user-1',
          challengeId: 'challenge-1',
        }),
      ]);
      expect(
        mockNotificationService.setupChallengeReminders
      ).toHaveBeenCalledWith('user-1', 'challenge-1', 'Paid Challenge');
    });

    it('requires a complete server receipt for the first promise', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          challenge_id: 'challenge-1',
          receipt: {
            is_first_promise: true,
            next_due_at: '2026-08-05T23:00:00+00:00',
          },
        },
        error: null,
      });

      const { result } = renderHook(() => useChallengeStore());

      await expect(
        result.current.createFirstPromiseWithPayment(
          paidChallengeInput,
          'user-1'
        )
      ).rejects.toThrow('complete first-promise activation receipt');

      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result.current.challenges).toEqual([]);
      expect(result.current.userChallenges).toEqual([]);
      expect(
        mockNotificationService.setupChallengeReminders
      ).not.toHaveBeenCalled();
    });

    it('does not recover first-promise conflicts by matching a local title', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
        },
      });

      const { result } = renderHook(() => useChallengeStore());

      await expect(
        result.current.createFirstPromiseWithPayment(
          paidChallengeInput,
          'user-1'
        )
      ).rejects.toMatchObject({ code: '23505' });

      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result.current.challenges).toEqual([]);
    });

    it('drops a delayed first-promise result after the account changes', async () => {
      let resolveRpc!: (value: {
        data: Record<string, unknown>;
        error: null;
      }) => void;
      const rpcResult = new Promise<{
        data: Record<string, unknown>;
        error: null;
      }>(resolve => {
        resolveRpc = resolve;
      });
      (mockSupabase.rpc as jest.Mock).mockReturnValue(rpcResult);

      const { result } = renderHook(() => useChallengeStore());
      const creationPromise = result.current.createFirstPromiseWithPayment(
        paidChallengeInput,
        'user-1'
      );

      await waitFor(() => {
        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          'ensure_first_promise_v1',
          expect.any(Object)
        );
      });
      mockActiveAccount('user-2');
      resolveRpc({
        data: {
          success: true,
          challenge_id: 'challenge-1',
          receipt: {
            is_first_promise: true,
            next_due_at: null,
            activation: {
              confirmed: true,
              activated: true,
              activated_at: '2026-08-05T01:00:00+00:00',
              first_promise_id: 'challenge-1',
              first_promise_title: 'Paid Challenge',
              source: 'first_promise_v1',
              welcome_momenta: {
                granted: true,
                amount: 100,
                outcome: 'granted_now',
              },
            },
          },
        },
        error: null,
      });

      await expect(creationPromise).rejects.toThrow('account changed');
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result.current.challenges).toEqual([]);
      expect(result.current.userChallenges).toEqual([]);
      expect(
        mockNotificationService.setupChallengeReminders
      ).not.toHaveBeenCalled();
    });

    it('invalidates delayed first-promise work during account teardown', async () => {
      let resolveRpc!: (value: {
        data: Record<string, unknown>;
        error: null;
      }) => void;
      const rpcResult = new Promise<{
        data: Record<string, unknown>;
        error: null;
      }>(resolve => {
        resolveRpc = resolve;
      });
      (mockSupabase.rpc as jest.Mock).mockReturnValue(rpcResult);

      const { result } = renderHook(() => useChallengeStore());
      const creationPromise = result.current.createFirstPromiseWithPayment(
        paidChallengeInput,
        'user-1'
      );

      await waitFor(() => expect(mockSupabase.rpc).toHaveBeenCalled());
      await result.current.clearPersistedState();
      resolveRpc({
        data: {
          success: true,
          challenge_id: 'challenge-1',
          receipt: {
            is_first_promise: true,
            next_due_at: null,
            activation: {
              confirmed: true,
              activated: true,
              activated_at: '2026-08-05T01:00:00+00:00',
              first_promise_id: 'challenge-1',
              source: 'first_promise_v1',
              welcome_momenta: {
                granted: true,
                amount: 100,
                outcome: 'granted_now',
              },
            },
          },
        },
        error: null,
      });

      await expect(creationPromise).rejects.toThrow('account changed');
      expect(result.current.challenges).toEqual([]);
      expect(result.current.userChallenges).toEqual([]);
      expect(
        mockNotificationService.setupChallengeReminders
      ).not.toHaveBeenCalled();
    });
  });

  describe('submitProof', () => {
    beforeEach(() => {
      const receiptQuery: Record<string, jest.Mock> = {};
      receiptQuery.select = jest.fn(() => receiptQuery);
      receiptQuery.eq = jest.fn(() => receiptQuery);
      receiptQuery.maybeSingle = jest.fn(async () => {
        const latestRpcCall = (mockSupabase.rpc as jest.Mock).mock.calls.at(-1);
        const rpcArgs = latestRpcCall?.[1] as
          | Record<string, string | null>
          | undefined;

        return {
          data: rpcArgs
            ? {
                id: approvedProofSubmissionId,
                challenge_id: rpcArgs.p_challenge_id,
                client_event_id: rpcArgs.p_client_event_id,
                media_type: rpcArgs.p_media_type,
                media_url: rpcArgs.p_media_url,
                submission_text: rpcArgs.p_submission_text,
                status: 'approved',
              }
            : null,
          error: null,
        };
      });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'challenge_participants') {
          const participantQuery: Record<string, jest.Mock> = {};
          participantQuery.select = jest.fn(() => participantQuery);
          participantQuery.eq = jest.fn(() => participantQuery);
          participantQuery.maybeSingle = jest.fn().mockResolvedValue({
            data: { challenge_id: 'challenge-1', status: 'active' },
            error: null,
          });
          return participantQuery as any;
        }
        return receiptQuery as any;
      });

      // Set up initial user challenge state
      act(() => {
        useChallengeStore.setState({
          userChallenges: [
            {
              userId: 'user-1',
              challengeId: 'challenge-1',
              currentStreak: 2,
              lastCheckIn: '2024-01-09', // Yesterday relative to test date
              joinedAt: '2024-01-01T00:00:00Z',
            },
          ],
        });
      });
    });

    it('successfully submits proof and updates streak', async () => {
      mockApprovedProofReceipt(3);

      const { result } = renderHook(() => useChallengeStore());

      await act(async () => {
        await result.current.submitProof(
          'user-1',
          'challenge-1',
          'test-url',
          'photo'
        );
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'submit_challenge_verification',
        expect.objectContaining({
          p_challenge_id: 'challenge-1',
          p_media_url: 'test-url',
          p_media_type: 'photo',
        })
      );
      expect(result.current.userChallenges[0].currentStreak).toBe(3);
      expect(result.current.userChallenges[0].lastCheckIn).toBe('2024-01-10');
    });

    it('submits text proof through the shared proof contract', async () => {
      mockApprovedProofReceipt(3);

      const { result } = renderHook(() => useChallengeStore());

      await act(async () => {
        await result.current.submitProof(
          'user-1',
          'challenge-1',
          '  Finished the reading notes.  ',
          'text'
        );
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'submit_challenge_verification',
        expect.objectContaining({
          p_challenge_id: 'challenge-1',
          p_media_url: null,
          p_media_type: 'text',
          p_submission_text: 'Finished the reading notes.',
        })
      );
    });

    it('applies server-returned streak reset', async () => {
      act(() => {
        useChallengeStore.setState({
          userChallenges: [
            {
              userId: 'user-1',
              challengeId: 'challenge-1',
              currentStreak: 5,
              lastCheckIn: '2024-01-07', // 3 days ago
              joinedAt: '2024-01-01T00:00:00Z',
            },
          ],
        });
      });

      mockApprovedProofReceipt(1);

      const { result } = renderHook(() => useChallengeStore());

      await act(async () => {
        await result.current.submitProof(
          'user-1',
          'challenge-1',
          'test-url',
          'photo'
        );
      });

      expect(result.current.userChallenges[0].currentStreak).toBe(1);
    });

    it('handles error when user challenge not found', async () => {
      // Clear user challenges
      act(() => {
        useChallengeStore.setState({
          userChallenges: [],
        });
      });

      const { result } = renderHook(() => useChallengeStore());

      await act(async () => {
        try {
          await result.current.submitProof(
            'user-1',
            'challenge-1',
            'test-url',
            'photo'
          );
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toBe(
            'User challenge not found. Please join the challenge first.'
          );
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('getVerificationsByStatus', () => {
    it('scopes global review rows through participant and group challenge access', async () => {
      const participantQuery = createThenableQuery({
        data: [{ challenge_id: 'challenge-1' }],
        error: null,
      });
      const membershipQuery = createThenableQuery({
        data: [{ group_id: 'group-1' }],
        error: null,
      });
      const teamChallengeQuery = createThenableQuery({
        data: [{ challenge_id: 'challenge-2' }],
        error: null,
      });
      const submissionsQuery = createThenableQuery({
        data: [
          {
            id: 'submission-1',
            challenge_id: 'challenge-1',
            user_id: 'user-2',
            media_url: null,
            media_type: 'text',
            submission_text: 'Ran before work.',
            status: 'pending',
            submission_date: '2024-01-10T00:00:00Z',
            profiles: {
              username: 'runner',
              avatar_url: null,
            },
            challenges: {
              title: 'Morning run',
              category: 'fitness',
              allow_self_review: false,
            },
          },
          {
            id: 'submission-2',
            challenge_id: 'challenge-2',
            user_id: 'user-3',
            media_url: null,
            media_type: 'text',
            submission_text: 'Posted the receipt.',
            status: 'pending',
            submission_date: '2024-01-11T00:00:00Z',
            profiles: {
              username: 'builder',
              avatar_url: null,
            },
            challenges: {
              title: 'Ship proof',
              category: 'work',
              allow_self_review: false,
            },
          },
        ],
        error: null,
      });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'challenge_participants') return participantQuery;
        if (table === 'team_members') return membershipQuery;
        if (table === 'team_challenges') return teamChallengeQuery;
        if (table === 'challenge_submissions') return submissionsQuery;
        return createThenableQuery({ data: null, error: null });
      });

      const { result } = renderHook(() => useChallengeStore());

      let reviews: any[] = [];
      await act(async () => {
        reviews = await result.current.getVerificationsByStatus(
          undefined,
          'pending',
          'user-1'
        );
      });

      expect(mockSupabase.from).toHaveBeenNthCalledWith(
        1,
        'challenge_participants'
      );
      expect(participantQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(participantQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'team_members');
      expect(membershipQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSupabase.from).toHaveBeenNthCalledWith(3, 'team_challenges');
      expect(teamChallengeQuery.in).toHaveBeenCalledWith('group_id', [
        'group-1',
      ]);
      expect(mockSupabase.from).toHaveBeenNthCalledWith(
        4,
        'challenge_submissions'
      );
      expect(submissionsQuery.in).toHaveBeenCalledWith('challenge_id', [
        'challenge-1',
        'challenge-2',
      ]);
      expect(submissionsQuery.eq).toHaveBeenCalledWith('status', 'pending');
      expect(reviews).toHaveLength(2);
    });

    it('returns an empty queue when a requested challenge is outside reviewer access', async () => {
      const participantQuery = createThenableQuery({
        data: [],
        error: null,
      });
      const membershipQuery = createThenableQuery({
        data: [],
        error: null,
      });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'challenge_participants') return participantQuery;
        if (table === 'team_members') return membershipQuery;
        return createThenableQuery({ data: null, error: null });
      });

      const { result } = renderHook(() => useChallengeStore());

      let reviews: any[] = [];
      await act(async () => {
        reviews = await result.current.getVerificationsByStatus(
          'challenge-1',
          'pending',
          'user-1'
        );
      });

      expect(participantQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(participantQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(participantQuery.eq).toHaveBeenCalledWith(
        'challenge_id',
        'challenge-1'
      );
      expect(mockSupabase.from).not.toHaveBeenCalledWith(
        'challenge_submissions'
      );
      expect(reviews).toEqual([]);
    });

    it('filters group review rows through team_challenges while preserving challenge filtering', async () => {
      const groupChallengeQuery = createThenableQuery({
        data: [{ challenge_id: 'challenge-1' }],
        error: null,
      });
      const submissionsQuery = createThenableQuery({
        data: [
          {
            id: 'submission-1',
            challenge_id: 'challenge-1',
            user_id: 'user-2',
            media_url: null,
            media_type: 'text',
            submission_text: 'Logged the workout.',
            status: 'pending',
            submission_date: '2024-01-10T00:00:00Z',
            profiles: {
              username: 'peer',
              avatar_url: null,
            },
            challenges: {
              title: 'Workout',
              category: 'fitness',
              allow_self_review: false,
            },
          },
        ],
        error: null,
      });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_challenges') return groupChallengeQuery;
        if (table === 'challenge_submissions') return submissionsQuery;
        return createThenableQuery({ data: null, error: null });
      });

      const { result } = renderHook(() => useChallengeStore());

      let reviews: any[] = [];
      await act(async () => {
        reviews = await result.current.getVerificationsByStatus(
          'challenge-1',
          'pending',
          'user-1',
          'group-1'
        );
      });

      expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'team_challenges');
      expect(groupChallengeQuery.eq).toHaveBeenCalledWith(
        'group_id',
        'group-1'
      );
      expect(groupChallengeQuery.eq).toHaveBeenCalledWith(
        'challenge_id',
        'challenge-1'
      );
      expect(mockSupabase.from).toHaveBeenNthCalledWith(
        2,
        'challenge_submissions'
      );
      expect(submissionsQuery.in).toHaveBeenCalledWith('challenge_id', [
        'challenge-1',
      ]);
      expect(submissionsQuery.eq).toHaveBeenCalledWith(
        'challenge_id',
        'challenge-1'
      );
      expect(submissionsQuery.eq).toHaveBeenCalledWith('status', 'pending');
      expect(reviews).toHaveLength(1);
      expect(reviews[0]).toMatchObject({
        id: 'submission-1',
        media_type: 'text',
        submission_text: 'Logged the workout.',
      });
    });

    it('propagates review-scope fetch failures instead of showing an empty queue', async () => {
      const scopeError = { message: 'permission lookup failed' };
      const groupChallengeQuery = createThenableQuery({
        data: null,
        error: scopeError,
      });

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'team_challenges') return groupChallengeQuery;
        return createThenableQuery({ data: null, error: null });
      });

      const { result } = renderHook(() => useChallengeStore());

      await expect(
        result.current.getVerificationsByStatus(
          undefined,
          'pending',
          'user-1',
          'group-1'
        )
      ).rejects.toBe(scopeError);
    });
  });

  describe('reviewVerification', () => {
    it('returns the authoritative server decision receipt', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: {
            id: 'submission-1',
            status: 'approved',
            review_notes: null,
            reviewer_id: 'reviewer-1',
            reviewed_at: '2026-08-05T01:00:00.000Z',
          },
        },
        error: null,
      });
      const { result } = renderHook(() => useChallengeStore());

      await expect(
        result.current.reviewVerification('submission-1', 'approved')
      ).resolves.toEqual({
        id: 'submission-1',
        status: 'approved',
        reviewNotes: null,
        reviewerId: 'reviewer-1',
        reviewedAt: '2026-08-05T01:00:00.000Z',
      });
    });

    it('returns a typed conflict when another reviewer decided first', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: false,
          code: 'ALREADY_DECIDED',
          message: 'This proof changed while you were reviewing it.',
          current_status: 'rejected',
        },
        error: null,
      });
      const { result } = renderHook(() => useChallengeStore());

      await expect(
        result.current.reviewVerification('submission-1', 'approved')
      ).rejects.toMatchObject({
        code: 'already_decided',
        currentStatus: 'rejected',
      });
    });
  });

  describe('create promise quote', () => {
    it('reads create cost and active promises from the economy contract', async () => {
      mockActiveAccount('user-1');
      (mockSupabase.rpc as jest.Mock).mockImplementation(
        async (functionName: string) => {
          if (functionName === 'get_economy_contract_v1') {
            return {
              data: {
                viewer: {
                  createChallengeCost: 0,
                  activePromises: 0,
                  isPro: false,
                },
              },
              error: null,
            };
          }
          if (functionName === 'quota_status') {
            return {
              data: { challenges_created_this_month: 0 },
              error: null,
            };
          }
          return { data: null, error: null };
        }
      );

      await expect(
        useChallengeStore.getState().getCreatePromiseQuote('user-1')
      ).resolves.toEqual({
        cost: 0,
        activePromises: 0,
        challengesCreatedThisMonth: 0,
        isPro: false,
      });
    });
  });

  describe('clearPersistedState', () => {
    it('successfully clears persisted state', async () => {
      const { result } = renderHook(() => useChallengeStore());

      // Add some state first
      act(() => {
        useChallengeStore.setState({
          challenges: [{ id: 'test' } as Challenge],
          userChallenges: [{ userId: 'test' } as UserChallenge],
        });
      });

      await act(async () => {
        await result.current.clearPersistedState();
      });

      expect(result.current.challenges).toEqual([]);
      expect(result.current.userChallenges).toEqual([]);
    });
  });
});
