import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  migrateMomentaPersistedState,
  useMomentaStore,
  MomentaTransaction,
  PurchaseableItem,
} from '../momenta-store';
import { supabase } from '@/lib/supabase';
import { getMyProfile } from '@/lib/profile-api';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/profile-api', () => ({
  getMyProfile: jest.fn(),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockGetMyProfile = getMyProfile as jest.MockedFunction<
  typeof getMyProfile
>;

// Mock the auth store to provide authenticated user context
const mockAuthStore = {
  getState: () => ({
    user: { id: 'user-1' },
    isAuthenticated: true,
  }),
};

jest.mock('../auth-store', () => ({
  useAuthStore: mockAuthStore,
}));

describe('MomentaStore', () => {
  const mockLatestTransactionQuery = (transaction: any, error: any = null) => {
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: transaction,
                error,
              }),
            }),
          }),
        }),
      }),
    });
  };

  const mockOwnedItemRefresh = () => {
    const originalFetchOwnedItems = useMomentaStore.getState().fetchOwnedItems;
    const originalFetchPurchasedItems =
      useMomentaStore.getState().fetchPurchasedItems;
    const fetchOwnedItems = jest.fn().mockResolvedValue(undefined);
    const fetchPurchasedItems = jest.fn().mockResolvedValue(undefined);

    useMomentaStore.setState({ fetchOwnedItems, fetchPurchasedItems });

    return {
      fetchOwnedItems,
      fetchPurchasedItems,
      restore: () =>
        useMomentaStore.setState({
          fetchOwnedItems: originalFetchOwnedItems,
          fetchPurchasedItems: originalFetchPurchasedItems,
        }),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMyProfile.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: null,
      momenta_balance: 0,
      has_completed_onboarding: true,
      created_at: '2026-08-04T00:00:00.000Z',
      updated_at: '2026-08-04T00:00:00.000Z',
      is_pro: false,
      is_approved: true,
    });
    // Reset store state
    useMomentaStore.getState().clearMomentaData();
    useMomentaStore.getState().activateAccountScope('user-1');

    // Setup default mocks
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useMomentaStore());

      expect(result.current.balance).toBe(0);
      expect(result.current.transactions).toEqual([]);
      expect(result.current.purchasedItems).toEqual([]);
      expect(result.current.equippedItems).toEqual({});
      expect(result.current.equippedItemSkus).toEqual({});
      expect(result.current.isLoading).toBe(false);
      expect(result.current.walletSyncError).toBeNull();
      expect(result.current.transactionHistoryError).toBeNull();
      expect(result.current.pendingPurchaseAttempt).toBeNull();
    });

    it('migrates legacy persisted account data to an ownerless empty scope', () => {
      const migrated = migrateMomentaPersistedState(
        {
          balance: 90,
          purchasedItems: ['item-owned-by-a'],
          equippedItems: { theme: 'item-owned-by-a' },
          equippedItemSkus: { theme: 'theme-a' },
          ownedItems: [{ item_id: 'item-owned-by-a' }],
          transactions: [{ id: 'transaction-owned-by-a' }],
        },
        4
      );

      expect(migrated).toMatchObject({
        activeAccountId: null,
        accountScopeVersion: 1,
        balance: 0,
        purchasedItems: [],
        equippedItems: {},
        equippedItemSkus: {},
        ownedItems: [],
        transactions: [],
      });
    });

    it('preserves a valid keyed purchase retry across persisted reloads', () => {
      const pendingPurchaseAttempt = {
        userId: 'user-1',
        itemId: 'item-1',
        clientEventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      };

      expect(
        migrateMomentaPersistedState({ pendingPurchaseAttempt }, 6)
      ).toMatchObject({ pendingPurchaseAttempt });
      expect(
        migrateMomentaPersistedState(
          {
            pendingPurchaseAttempt: {
              ...pendingPurchaseAttempt,
              clientEventId: 'not-a-uuid',
            },
          },
          6
        )
      ).toMatchObject({ pendingPurchaseAttempt: null });
    });

    it('keeps confirmed ownership when an ownership refresh fails', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const confirmedOwnership = {
        id: 'purchase-1',
        user_id: 'user-1',
        item_id: 'item-1',
        purchased_at: '2026-08-05T00:00:00.000Z',
        usage_count: 1,
        catalog_items: {
          id: 'item-1',
          sku: 'streak_freeze',
          name: 'Streak Freeze',
          description: 'Protect one eligible miss.',
          cost: 240,
          category: 'power_up',
          is_disabled: false,
          created_at: '2026-08-05T00:00:00.000Z',
        },
      };
      useMomentaStore.setState({
        ownedItems: [confirmedOwnership],
        purchasedItems: ['item-1'],
      });
      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Ownership refresh offline' },
          }),
        }),
      });

      await act(async () => {
        await expect(
          useMomentaStore
            .getState()
            .fetchOwnedItems('user-1', { throwOnError: true })
        ).rejects.toThrow('Ownership refresh offline');
      });

      expect(useMomentaStore.getState()).toMatchObject({
        ownedItems: [confirmedOwnership],
        purchasedItems: ['item-1'],
      });
      consoleError.mockRestore();
    });

    it('does not commit stale ownership reads after the account scope changes', async () => {
      let resolveOwned:
        | ((value: { data: unknown[]; error: null }) => void)
        | undefined;
      let resolvePurchased:
        | ((value: { data: unknown[]; error: null }) => void)
        | undefined;
      let resolveEquipped:
        | ((value: { data: unknown[]; error: null }) => void)
        | undefined;
      let resolveHistory:
        | ((value: { data: unknown[]; error: null }) => void)
        | undefined;
      let resolveBalance:
        | ((value: Awaited<ReturnType<typeof getMyProfile>>) => void)
        | undefined;
      const ownedResult = new Promise<{ data: unknown[]; error: null }>(
        resolve => {
          resolveOwned = resolve;
        }
      );
      const purchasedResult = new Promise<{ data: unknown[]; error: null }>(
        resolve => {
          resolvePurchased = resolve;
        }
      );
      const equippedResult = new Promise<{ data: unknown[]; error: null }>(
        resolve => {
          resolveEquipped = resolve;
        }
      );
      const historyResult = new Promise<{ data: unknown[]; error: null }>(
        resolve => {
          resolveHistory = resolve;
        }
      );
      const balanceResult = new Promise<
        Awaited<ReturnType<typeof getMyProfile>>
      >(resolve => {
        resolveBalance = resolve;
      });
      mockGetMyProfile.mockReturnValueOnce(balanceResult);

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'wallet_transactions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue(historyResult),
                }),
              }),
            }),
          };
        }

        return {
          select: jest.fn((columns: string) => ({
            eq: jest
              .fn()
              .mockReturnValue(
                table === 'equipped_items'
                  ? equippedResult
                  : columns.includes('catalog_items')
                    ? ownedResult
                    : purchasedResult
              ),
          })),
        };
      });

      const pendingReads = Promise.all([
        useMomentaStore
          .getState()
          .fetchBalance('user-1', { throwOnError: true }),
        useMomentaStore.getState().fetchTransactions('user-1'),
        useMomentaStore
          .getState()
          .fetchOwnedItems('user-1', { throwOnError: true }),
        useMomentaStore
          .getState()
          .fetchPurchasedItems('user-1', { throwOnError: true }),
        useMomentaStore
          .getState()
          .fetchEquippedItems('user-1', { throwOnError: true }),
      ]);

      act(() => {
        useMomentaStore.getState().activateAccountScope('user-2');
      });
      resolveOwned?.({
        data: [{ item_id: 'item-owned-by-a', catalog_items: {} }],
        error: null,
      });
      resolvePurchased?.({
        data: [{ item_id: 'item-owned-by-a' }],
        error: null,
      });
      resolveEquipped?.({
        data: [
          {
            category: 'theme',
            item_id: 'item-owned-by-a',
            catalog_items: { sku: 'theme-a', category: 'cosmetic' },
          },
        ],
        error: null,
      });
      resolveHistory?.({
        data: [
          {
            id: 'transaction-owned-by-a',
            user_id: 'user-1',
            amount: 90,
            transaction_type: 'earned',
            description: 'Account A reward',
          },
        ],
        error: null,
      });
      resolveBalance?.({
        id: 'user-1',
        email: 'a@example.com',
        username: 'account-a',
        display_name: 'Account A',
        avatar_url: null,
        momenta_balance: 90,
        has_completed_onboarding: true,
        created_at: '2026-08-05T00:00:00.000Z',
        updated_at: '2026-08-05T00:00:00.000Z',
        is_pro: false,
        is_approved: true,
      });

      await act(async () => {
        await pendingReads;
      });

      expect(useMomentaStore.getState()).toMatchObject({
        activeAccountId: 'user-2',
        balance: 0,
        ownedItems: [],
        purchasedItems: [],
        equippedItems: {},
        equippedItemSkus: {},
        transactions: [],
      });
    });

    it('keeps the last confirmed balance and exposes refresh failure without a fatal log', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockGetMyProfile.mockRejectedValueOnce(
        new TypeError('Network request failed')
      );
      useMomentaStore.setState({ balance: 40, walletSyncError: null });

      await act(async () => {
        await useMomentaStore.getState().fetchBalance('user-1');
      });

      expect(useMomentaStore.getState()).toMatchObject({
        balance: 40,
        walletSyncError: 'Network request failed',
      });
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('addMomenta', () => {
    it('fails closed for positive rewards instead of inferring authority from copy', async () => {
      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        await expect(
          result.current.addMomenta(100, 'bonus', 'Welcome bonus')
        ).resolves.toBe(false);
        await expect(
          result.current.addMomenta(100, 'bonus', 'Onboarding complete')
        ).resolves.toBe(false);
        await expect(
          result.current.addMomenta(10, 'bonus', 'Ad reward')
        ).resolves.toBe(false);
      });

      expect(mockSupabase.rpc).not.toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
      expect(result.current.balance).toBe(0);
      expect(result.current.transactions).toEqual([]);
    });

    it('handles a legacy server adjustment error', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        const success = await result.current.addMomenta(
          -50,
          'adjustment',
          'Legacy reconciliation'
        );
        expect(success).toBe(false);
      });

      expect(result.current.balance).toBe(0);
      expect(result.current.transactions).toHaveLength(0);
    });

    it('handles user not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        const success = await result.current.addMomenta(50, 'earned', 'Test');
        expect(success).toBe(false);
      });
    });

    it('does not commit a late adjustment receipt into a new account scope', async () => {
      let resolveReward:
        | ((value: { data: null; error: null }) => void)
        | undefined;
      const rewardResponse = new Promise<{
        data: null;
        error: null;
      }>(resolve => {
        resolveReward = resolve;
      });
      (mockSupabase.rpc as jest.Mock).mockReturnValueOnce(rewardResponse);
      const { result } = renderHook(() => useMomentaStore());

      const pendingReward = result.current.addMomenta(
        -10,
        'adjustment',
        'Legacy reconciliation'
      );
      await waitFor(() =>
        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          'add_momenta_transaction',
          {
            p_amount: -10,
            p_reason: 'Legacy reconciliation',
            p_transaction_type: 'adjustment',
            p_user_id: 'user-1',
          }
        )
      );
      act(() => {
        useMomentaStore.getState().activateAccountScope('user-2');
        useMomentaStore.setState({ balance: 25 });
      });
      resolveReward?.({
        data: null,
        error: null,
      });

      let applied: boolean | undefined;
      await act(async () => {
        applied = await pendingReward;
      });

      expect(applied).toBe(false);
      expect(useMomentaStore.getState()).toMatchObject({
        activeAccountId: 'user-2',
        balance: 25,
        transactions: [],
        isLoading: false,
      });
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('claimAdReward', () => {
    it('uses the server amount and refreshes the account receipt', async () => {
      const transaction = {
        id: 'transaction-1',
        user_id: 'user-1',
        amount: 10,
        transaction_type: 'bonus',
        description: 'Ad reward',
        created_at: '2026-08-10T00:00:00.000Z',
      };
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true, amount: 10, new_balance: 110 },
        error: null,
      });
      mockGetMyProfile.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null,
        momenta_balance: 110,
        has_completed_onboarding: true,
        created_at: '2026-08-04T00:00:00.000Z',
        updated_at: '2026-08-10T00:00:00.000Z',
        is_pro: false,
        is_approved: true,
      });
      mockLatestTransactionQuery(transaction);

      const result = await useMomentaStore.getState().claimAdReward();

      expect(result).toEqual({ earned: true, amount: 10 });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('claim_momenta_reward', {
        p_user_id: 'user-1',
        p_reward_type: 'ad_reward',
      });
      expect(useMomentaStore.getState()).toMatchObject({
        balance: 110,
        transactionHistoryError: null,
      });
      expect(useMomentaStore.getState().transactions[0]).toMatchObject({
        id: 'transaction-1',
        amount: 10,
      });
    });

    it('returns plain copy for a server reward limit', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: false, error: 'DAILY_LIMIT' },
        error: null,
      });

      const result = await useMomentaStore.getState().claimAdReward();

      expect(result).toMatchObject({
        earned: false,
        amount: 0,
        reason: 'daily-limit',
      });
      expect(result.message).toContain("today's sponsor rewards");
      expect(result.message).not.toContain('DAILY_LIMIT');
    });

    it('keeps one authoritative reward claim in flight per account', async () => {
      let resolveReward:
        | ((value: {
            data: { success: false; error: 'DAILY_LIMIT' };
            error: null;
          }) => void)
        | undefined;
      const rewardResponse = new Promise<{
        data: { success: false; error: 'DAILY_LIMIT' };
        error: null;
      }>(resolve => {
        resolveReward = resolve;
      });
      (mockSupabase.rpc as jest.Mock).mockReturnValueOnce(rewardResponse);

      const firstClaim = useMomentaStore.getState().claimAdReward();
      await waitFor(() =>
        expect(mockSupabase.rpc).toHaveBeenCalledWith('claim_momenta_reward', {
          p_user_id: 'user-1',
          p_reward_type: 'ad_reward',
        })
      );

      await expect(
        useMomentaStore.getState().claimAdReward()
      ).resolves.toMatchObject({
        earned: false,
        amount: 0,
        reason: 'in-progress',
      });
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);

      resolveReward?.({
        data: { success: false, error: 'DAILY_LIMIT' },
        error: null,
      });
      await expect(firstClaim).resolves.toMatchObject({
        earned: false,
        amount: 0,
        reason: 'daily-limit',
      });
    });

    it('does not accept a malformed reward receipt', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true, amount: '10', new_balance: 110 },
        error: null,
      });

      const result = await useMomentaStore.getState().claimAdReward();

      expect(result).toMatchObject({
        earned: false,
        amount: 0,
        reason: 'unknown',
      });
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('does not apply a late reward to a new account scope', async () => {
      let resolveReward:
        | ((value: {
            data: { success: true; amount: number; new_balance: number };
            error: null;
          }) => void)
        | undefined;
      const rewardResponse = new Promise<{
        data: { success: true; amount: number; new_balance: number };
        error: null;
      }>(resolve => {
        resolveReward = resolve;
      });
      (mockSupabase.rpc as jest.Mock).mockReturnValueOnce(rewardResponse);

      const pendingReward = useMomentaStore.getState().claimAdReward();
      await waitFor(() =>
        expect(mockSupabase.rpc).toHaveBeenCalledWith('claim_momenta_reward', {
          p_user_id: 'user-1',
          p_reward_type: 'ad_reward',
        })
      );
      act(() => {
        useMomentaStore.getState().activateAccountScope('user-2');
        useMomentaStore.setState({ balance: 25 });
      });
      resolveReward?.({
        data: { success: true, amount: 10, new_balance: 110 },
        error: null,
      });

      const result = await pendingReward;

      expect(result).toMatchObject({
        earned: false,
        amount: 0,
        reason: 'unauthenticated',
      });
      expect(useMomentaStore.getState()).toMatchObject({
        activeAccountId: 'user-2',
        balance: 25,
        transactions: [],
      });
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('spendMomenta', () => {
    it('successfully spends momenta', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        user_id: 'user-1',
        amount: -30,
        transaction_type: 'spent',
        description: 'Item purchase',
        created_at: new Date().toISOString(),
      };

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true },
        error: null,
      });
      mockLatestTransactionQuery(mockTransaction);

      const { result } = renderHook(() => useMomentaStore());

      // Set initial balance
      act(() => {
        result.current.clearMomentaData();
        result.current.activateAccountScope('user-1');
        useMomentaStore.setState({ balance: 100 });
      });

      await act(async () => {
        const success = await result.current.spendMomenta(
          30,
          'spent',
          'Item purchase'
        );
        expect(success).toBe(true);
      });

      expect(result.current.balance).toBe(70);
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0]).toMatchObject({
        amount: -30,
        transaction_type: 'spent',
        description: 'Item purchase',
      });
    });

    it('prevents spending more than available balance', async () => {
      const { result } = renderHook(() => useMomentaStore());

      // Set initial balance
      act(() => {
        useMomentaStore.setState({ balance: 30 });
      });

      await act(async () => {
        const success = await result.current.spendMomenta(50, 'spent', 'Test');
        expect(success).toBe(false);
      });

      expect(result.current.balance).toBe(30); // Should remain unchanged
    });

    it('handles spend momenta database error', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useMomentaStore());

      // Set initial balance
      act(() => {
        useMomentaStore.setState({ balance: 100 });
      });

      await act(async () => {
        const success = await result.current.spendMomenta(30, 'spent', 'Test');
        expect(success).toBe(false);
      });

      expect(result.current.balance).toBe(100); // Should remain unchanged on error
    });

    it('does not commit a late spend receipt into a new account scope', async () => {
      let resolveSpend:
        | ((value: { data: { success: true }; error: null }) => void)
        | undefined;
      const spendResponse = new Promise<{
        data: { success: true };
        error: null;
      }>(resolve => {
        resolveSpend = resolve;
      });
      (mockSupabase.rpc as jest.Mock).mockReturnValueOnce(spendResponse);
      const { result } = renderHook(() => useMomentaStore());
      act(() => {
        useMomentaStore.setState({ balance: 100 });
      });

      const pendingSpend = result.current.spendMomenta(
        30,
        'spent',
        'Item purchase'
      );
      await waitFor(() =>
        expect(mockSupabase.rpc).toHaveBeenCalledWith(
          'add_momenta_transaction',
          {
            p_user_id: 'user-1',
            p_amount: -30,
            p_reason: 'Item purchase',
            p_transaction_type: 'spent',
          }
        )
      );
      act(() => {
        useMomentaStore.getState().activateAccountScope('user-2');
        useMomentaStore.setState({ balance: 25 });
      });
      resolveSpend?.({ data: { success: true }, error: null });

      let applied: boolean | undefined;
      await act(async () => {
        applied = await pendingSpend;
      });

      expect(applied).toBe(false);
      expect(useMomentaStore.getState()).toMatchObject({
        activeAccountId: 'user-2',
        balance: 25,
        transactions: [],
        isLoading: false,
      });
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('purchaseItem', () => {
    const clientEventId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const mockItem: PurchaseableItem = {
      id: 'item-1',
      name: 'Test Item',
      description: 'A test item',
      price: 50,
      category: 'avatar_skin',
      icon: 'test-icon',
      isOwned: false,
    };

    it('successfully purchases an item', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        user_id: 'user-1',
        amount: -50,
        transaction_type: 'purchase',
        description: 'Purchased Test Item',
        reference_id: 'item-1',
        created_at: new Date().toISOString(),
      };

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          client_event_id: clientEventId,
          item_id: mockItem.id,
          new_balance: 50,
          item_name: mockItem.name,
          item_sku: mockItem.id,
          cost: mockItem.price,
          quantity: 1,
        },
        error: null,
      });
      const refresh = mockOwnedItemRefresh();

      const { result } = renderHook(() => useMomentaStore());

      // Set initial balance
      act(() => {
        useMomentaStore.setState({ balance: 100 });
      });

      let purchase:
        | Awaited<ReturnType<typeof useMomentaStore.getState>['purchaseItem']>
        | undefined;
      await act(async () => {
        purchase = await result.current.purchaseItem(
          'user-1',
          mockItem.id,
          clientEventId
        );
      });

      expect(purchase).toMatchObject({
        success: true,
        outcome: 'confirmed',
        receipt: {
          clientEventId,
          itemName: mockItem.name,
          itemSku: mockItem.id,
          cost: mockItem.price,
          newBalance: 50,
          quantity: 1,
        },
      });
      expect(result.current.balance).toBe(50);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('purchase_shop_item', {
        p_user_id: 'user-1',
        p_item_id: 'item-1',
        p_client_event_id: clientEventId,
      });
      expect(refresh.fetchOwnedItems).toHaveBeenCalledWith('user-1');
      expect(refresh.fetchPurchasedItems).toHaveBeenCalledWith('user-1');
      refresh.restore();
    });

    it('keeps a decoded receipt confirmed when ownership refresh rejects', async () => {
      const consoleWarn = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          client_event_id: clientEventId,
          item_id: mockItem.id,
          new_balance: 50,
          item_name: mockItem.name,
          item_sku: mockItem.id,
          cost: mockItem.price,
          quantity: 1,
        },
        error: null,
      });
      const refresh = mockOwnedItemRefresh();
      refresh.fetchOwnedItems.mockRejectedValueOnce(
        new Error('Ownership refresh offline')
      );

      const { result } = renderHook(() => useMomentaStore());
      act(() => {
        useMomentaStore.setState({ balance: 100 });
      });

      let purchase:
        | Awaited<ReturnType<typeof useMomentaStore.getState>['purchaseItem']>
        | undefined;
      await act(async () => {
        purchase = await result.current.purchaseItem(
          'user-1',
          mockItem.id,
          clientEventId
        );
      });

      expect(purchase).toMatchObject({ success: true, outcome: 'confirmed' });
      expect(result.current).toMatchObject({
        balance: 50,
        isLoading: false,
        lastPurchaseError: null,
      });
      expect(consoleWarn).toHaveBeenCalledWith(
        'Purchase receipt confirmed but ownership refresh failed:',
        expect.any(Error)
      );
      refresh.restore();
      consoleWarn.mockRestore();
    });

    it('does not commit an old account purchase receipt into a new account scope', async () => {
      let resolvePurchase:
        | ((value: {
            data: {
              success: true;
              client_event_id: string;
              item_id: string;
              new_balance: number;
              item_name: string;
              item_sku: string;
              cost: number;
              quantity: number;
            };
            error: null;
          }) => void)
        | undefined;
      const purchaseResponse = new Promise<{
        data: {
          success: true;
          client_event_id: string;
          item_id: string;
          new_balance: number;
          item_name: string;
          item_sku: string;
          cost: number;
          quantity: number;
        };
        error: null;
      }>(resolve => {
        resolvePurchase = resolve;
      });
      (mockSupabase.rpc as jest.Mock).mockReturnValueOnce(purchaseResponse);
      const refresh = mockOwnedItemRefresh();
      const { result } = renderHook(() => useMomentaStore());

      act(() => {
        useMomentaStore.setState({ balance: 100 });
      });
      const pendingPurchase = result.current.purchaseItem(
        'user-1',
        mockItem.id,
        clientEventId
      );

      act(() => {
        useMomentaStore.getState().activateAccountScope('user-2');
        useMomentaStore.setState({ balance: 25 });
      });
      resolvePurchase?.({
        data: {
          success: true,
          client_event_id: clientEventId,
          item_id: mockItem.id,
          new_balance: 50,
          item_name: mockItem.name,
          item_sku: mockItem.id,
          cost: mockItem.price,
          quantity: 1,
        },
        error: null,
      });

      let purchase:
        | Awaited<ReturnType<typeof useMomentaStore.getState>['purchaseItem']>
        | undefined;
      await act(async () => {
        purchase = await pendingPurchase;
      });

      expect(purchase).toMatchObject({ success: true, outcome: 'confirmed' });
      expect(useMomentaStore.getState()).toMatchObject({
        activeAccountId: 'user-2',
        balance: 25,
        pendingPurchaseAttempt: null,
        purchasedItems: [],
      });
      expect(refresh.fetchOwnedItems).not.toHaveBeenCalled();
      expect(refresh.fetchPurchasedItems).not.toHaveBeenCalled();
      refresh.restore();
    });

    it('prevents purchasing with insufficient balance', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: false,
          error: 'Insufficient balance',
        },
        error: null,
      });

      const { result } = renderHook(() => useMomentaStore());

      // Set insufficient balance
      act(() => {
        useMomentaStore.setState({ balance: 30 });
      });

      let purchase:
        | Awaited<ReturnType<typeof useMomentaStore.getState>['purchaseItem']>
        | undefined;
      await act(async () => {
        purchase = await result.current.purchaseItem(
          'user-1',
          mockItem.id,
          clientEventId
        );
      });

      expect(purchase).toMatchObject({
        success: false,
        outcome: 'insufficient-balance',
      });
      expect(result.current.balance).toBe(30);
      expect(result.current.purchasedItems).not.toContain('item-1');
      expect(result.current.lastPurchaseError).toBe(
        "The purchase didn't go through. Nothing was spent."
      );
      expect(result.current.pendingPurchaseAttempt).toBeNull();
    });

    it('reuses the original request key after a thrown HTTP 502 response loss', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      (mockSupabase.rpc as jest.Mock).mockRejectedValueOnce(
        new Error('HTTP 502 Bad Gateway')
      );
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          client_event_id: clientEventId,
          item_id: mockItem.id,
          new_balance: 50,
          item_name: mockItem.name,
          item_sku: mockItem.id,
          cost: mockItem.price,
          quantity: 1,
        },
        error: null,
      });
      const refresh = mockOwnedItemRefresh();

      const { result } = renderHook(() => useMomentaStore());
      act(() => {
        useMomentaStore.setState({ balance: 100 });
      });

      let purchase:
        | Awaited<ReturnType<typeof useMomentaStore.getState>['purchaseItem']>
        | undefined;
      await act(async () => {
        purchase = await result.current.purchaseItem(
          'user-1',
          mockItem.id,
          clientEventId
        );
      });

      expect(purchase).toMatchObject({
        success: false,
        outcome: 'unknown',
        clientEventId,
      });
      expect(result.current.pendingPurchaseAttempt).toEqual({
        userId: 'user-1',
        itemId: mockItem.id,
        clientEventId,
      });

      await act(async () => {
        purchase = await result.current.purchaseItem('user-1', mockItem.id);
      });

      expect(purchase).toMatchObject({
        success: true,
        outcome: 'confirmed',
        clientEventId,
      });
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
        1,
        'purchase_shop_item',
        {
          p_user_id: 'user-1',
          p_item_id: mockItem.id,
          p_client_event_id: clientEventId,
        }
      );
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
        2,
        'purchase_shop_item',
        {
          p_user_id: 'user-1',
          p_item_id: mockItem.id,
          p_client_event_id: clientEventId,
        }
      );
      expect(result.current.balance).toBe(50);
      expect(result.current.pendingPurchaseAttempt).toBeNull();
      refresh.restore();
      consoleError.mockRestore();
    });

    it('blocks a different item while a saved purchase still needs replay', async () => {
      useMomentaStore.setState({
        pendingPurchaseAttempt: {
          userId: 'user-1',
          itemId: mockItem.id,
          clientEventId,
        },
      });

      const result = await useMomentaStore
        .getState()
        .purchaseItem(
          'user-1',
          'item-2',
          'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
        );

      expect(result).toMatchObject({
        success: false,
        outcome: 'unknown',
        clientEventId,
      });
      expect(result.message).toContain('another purchase');
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
      expect(useMomentaStore.getState().pendingPurchaseAttempt).toEqual({
        userId: 'user-1',
        itemId: mockItem.id,
        clientEventId,
      });
    });

    it('reuses the original request key after a malformed purchase receipt', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          client_event_id: clientEventId,
          item_id: mockItem.id,
          item_name: mockItem.name,
          item_sku: mockItem.id,
          cost: mockItem.price,
          new_balance: 50,
          // A response without the server-owned quantity is not a receipt.
        },
        error: null,
      });
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          client_event_id: clientEventId,
          item_id: mockItem.id,
          item_name: mockItem.name,
          item_sku: mockItem.id,
          cost: mockItem.price,
          new_balance: 50,
          quantity: 1,
        },
        error: null,
      });
      const refresh = mockOwnedItemRefresh();

      const { result } = renderHook(() => useMomentaStore());
      act(() => {
        useMomentaStore.setState({ balance: 100 });
      });

      let purchase:
        | Awaited<ReturnType<typeof useMomentaStore.getState>['purchaseItem']>
        | undefined;
      await act(async () => {
        purchase = await result.current.purchaseItem(
          'user-1',
          mockItem.id,
          clientEventId
        );
      });

      expect(purchase).toMatchObject({ success: false, outcome: 'unknown' });
      expect(result.current).toMatchObject({
        balance: 100,
        purchasedItems: [],
        pendingPurchaseAttempt: {
          userId: 'user-1',
          itemId: mockItem.id,
          clientEventId,
        },
      });

      await act(async () => {
        purchase = await result.current.purchaseItem('user-1', mockItem.id);
      });

      expect(purchase).toMatchObject({
        success: true,
        outcome: 'confirmed',
        clientEventId,
      });
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
        2,
        'purchase_shop_item',
        {
          p_user_id: 'user-1',
          p_item_id: mockItem.id,
          p_client_event_id: clientEventId,
        }
      );
      expect(result.current.pendingPurchaseAttempt).toBeNull();
      refresh.restore();
    });

    it('reuses the original request key after a resolved HTTP 502 RPC error', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'HTTP 502 Bad Gateway' },
      });
      (mockSupabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: {
          success: true,
          client_event_id: clientEventId,
          item_id: mockItem.id,
          item_name: mockItem.name,
          item_sku: mockItem.id,
          cost: mockItem.price,
          new_balance: 50,
          quantity: 1,
        },
        error: null,
      });
      const refresh = mockOwnedItemRefresh();

      const { result } = renderHook(() => useMomentaStore());
      act(() => {
        useMomentaStore.setState({ balance: 100 });
      });

      let purchase:
        | Awaited<ReturnType<typeof useMomentaStore.getState>['purchaseItem']>
        | undefined;
      await act(async () => {
        purchase = await result.current.purchaseItem(
          'user-1',
          mockItem.id,
          clientEventId
        );
      });

      expect(purchase).toMatchObject({
        success: false,
        outcome: 'unknown',
      });
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
      expect(result.current.balance).toBe(100);
      expect(result.current.purchasedItems).not.toContain(mockItem.id);
      expect(result.current.pendingPurchaseAttempt).toEqual({
        userId: 'user-1',
        itemId: mockItem.id,
        clientEventId,
      });

      await act(async () => {
        purchase = await result.current.purchaseItem('user-1', mockItem.id);
      });

      expect(purchase).toMatchObject({
        success: true,
        outcome: 'confirmed',
        clientEventId,
      });
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
        1,
        'purchase_shop_item',
        {
          p_user_id: 'user-1',
          p_item_id: mockItem.id,
          p_client_event_id: clientEventId,
        }
      );
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(
        2,
        'purchase_shop_item',
        {
          p_user_id: 'user-1',
          p_item_id: mockItem.id,
          p_client_event_id: clientEventId,
        }
      );
      expect(result.current.pendingPurchaseAttempt).toBeNull();
      refresh.restore();
    });

    it('allows purchasing zero-cost items', async () => {
      const freeItem: PurchaseableItem = {
        ...mockItem,
        price: 0,
      };

      const mockTransaction = {
        id: 'transaction-1',
        user_id: 'user-1',
        amount: 0,
        transaction_type: 'purchase',
        description: 'Purchased Test Item',
        reference_id: 'item-1',
        created_at: new Date().toISOString(),
      };

      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          client_event_id: clientEventId,
          item_id: freeItem.id,
          new_balance: 100,
          item_name: freeItem.name,
          item_sku: freeItem.id,
          cost: freeItem.price,
          quantity: 1,
        },
        error: null,
      });
      const refresh = mockOwnedItemRefresh();

      const { result } = renderHook(() => useMomentaStore());

      act(() => {
        useMomentaStore.setState({ balance: 100 });
      });

      await act(async () => {
        const success = await result.current.purchaseItem(
          'user-1',
          freeItem.id,
          clientEventId
        );
        expect(success.success).toBe(true);
      });

      expect(result.current.balance).toBe(100); // Should remain unchanged
      expect(refresh.fetchOwnedItems).toHaveBeenCalledWith('user-1');
      expect(refresh.fetchPurchasedItems).toHaveBeenCalledWith('user-1');
      refresh.restore();
    });
  });

  describe('usePowerUp', () => {
    const clientEventId = '11111111-1111-4111-8111-111111111111';
    const challengeId = '22222222-2222-4222-8222-222222222222';

    it('passes a retry key and accepts a matching extension receipt', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          client_event_id: clientEventId,
          item_sku: 'time_extension_1',
          effect_type: 'deadline_extension_12h',
          effects: {
            remaining: 1,
            challenge_id: challengeId,
            expires_at: '2026-08-11T12:00:00.000Z',
          },
        },
        error: null,
      });

      const result = await useMomentaStore
        .getState()
        .usePowerUp(
          'user-1',
          'time_extension_1',
          challengeId,
          undefined,
          clientEventId
        );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('use_power_up', {
        p_user_id: 'user-1',
        p_item_sku: 'time_extension_1',
        p_challenge_id: challengeId,
        p_target_data: null,
        p_client_event_id: clientEventId,
      });
      expect(result).toMatchObject({
        success: true,
        outcome: 'confirmed',
        clientEventId,
        message: '12 hours were added to the selected promise.',
      });
    });

    it('does not expose raw server codes', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: false,
          error: 'NO_INVENTORY',
          client_event_id: clientEventId,
        },
        error: null,
      });

      const result = await useMomentaStore
        .getState()
        .usePowerUp(
          'user-1',
          'time_extension_1',
          challengeId,
          undefined,
          clientEventId
        );

      expect(result).toMatchObject({ success: false, outcome: 'failed' });
      expect(result.message).toContain('No extensions are available');
      expect(result.message).not.toContain('NO_INVENTORY');
    });

    it('keeps an unverifiable receipt in an unknown state', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          client_event_id: '33333333-3333-4333-8333-333333333333',
          item_sku: 'time_extension_1',
          effect_type: 'deadline_extension_12h',
          effects: { remaining: 0 },
        },
        error: null,
      });

      const result = await useMomentaStore
        .getState()
        .usePowerUp(
          'user-1',
          'time_extension_1',
          challengeId,
          undefined,
          clientEventId
        );

      expect(result).toMatchObject({ success: false, outcome: 'unknown' });
    });

    it('never manually consumes an automatic streak freeze', async () => {
      const result = await useMomentaStore
        .getState()
        .usePowerUp(
          'user-1',
          'streak_freeze_basic',
          challengeId,
          undefined,
          clientEventId
        );

      expect(result).toMatchObject({ success: false, outcome: 'failed' });
      expect(result.message).toContain('used automatically');
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('equipItem', () => {
    it('successfully equips a purchased item', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true, item_sku: 'item-1' },
        error: null,
      });
      const { result } = renderHook(() => useMomentaStore());

      // Set item as purchased
      await act(async () => {
        useMomentaStore.setState({ purchasedItems: ['item-1'] });
        await result.current.equipItem('item-1', 'avatar_skin');
      });

      expect(result.current.equippedItems['avatar_skin']).toBe('item-1');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('equip_owned_item', {
        p_user_id: 'user-1',
        p_item_id: 'item-1',
        p_category: 'avatar_skin',
      });
    });

    it('stores equipped item SKU when provided', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true, item_sku: 'avatar_gold_frame' },
        error: null,
      });
      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        await result.current.equipItem(
          'item-1',
          'avatar_frame',
          'avatar_gold_frame'
        );
      });

      expect(result.current.equippedItems.avatar_frame).toBe('item-1');
      expect(result.current.equippedItemSkus.avatar_frame).toBe(
        'avatar_gold_frame'
      );
    });

    it('rejects an item when the backend reports it is not owned', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: false, error: 'ITEM_NOT_OWNED' },
        error: null,
      });
      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        await expect(
          result.current.equipItem('unpurchased-item', 'avatar_skin')
        ).rejects.toThrow('ITEM_NOT_OWNED');
      });

      expect(result.current.equippedItems['avatar_skin']).toBeUndefined();
    });

    it('prevents equipping already equipped items', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true, item_sku: 'item-1' },
        error: null,
      });
      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        useMomentaStore.setState({
          purchasedItems: ['item-1'],
          equippedItems: { avatar_skin: 'item-1' },
        });
        await result.current.equipItem('item-1', 'avatar_skin');
      });

      expect(result.current.equippedItems['avatar_skin']).toBe('item-1');
    });

    it('does not commit a late equip receipt into a new account scope', async () => {
      let resolveEquip:
        | ((value: {
            data: { success: true; item_sku: string };
            error: null;
          }) => void)
        | undefined;
      const equipResponse = new Promise<{
        data: { success: true; item_sku: string };
        error: null;
      }>(resolve => {
        resolveEquip = resolve;
      });
      (mockSupabase.rpc as jest.Mock).mockReturnValueOnce(equipResponse);
      const { result } = renderHook(() => useMomentaStore());

      const pendingEquip = result.current.equipItem(
        'item-1',
        'avatar_skin',
        'avatar_gold_frame'
      );
      await waitFor(() =>
        expect(mockSupabase.rpc).toHaveBeenCalledWith('equip_owned_item', {
          p_user_id: 'user-1',
          p_item_id: 'item-1',
          p_category: 'avatar_skin',
        })
      );
      act(() => {
        useMomentaStore.getState().activateAccountScope('user-2');
      });
      resolveEquip?.({
        data: { success: true, item_sku: 'avatar_gold_frame' },
        error: null,
      });

      await act(async () => {
        await pendingEquip;
      });

      expect(useMomentaStore.getState()).toMatchObject({
        activeAccountId: 'user-2',
        equippedItems: {},
        equippedItemSkus: {},
      });
    });
  });

  describe('unequipItem', () => {
    it('successfully unequips an equipped item', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true },
        error: null,
      });
      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        useMomentaStore.setState({
          equippedItems: { avatar_skin: 'item-1', theme: 'item-2' },
          equippedItemSkus: {
            avatar_skin: 'avatar_gold_frame',
            theme: 'profile_theme_ember',
          },
        });
        await result.current.unequipItem('avatar_skin');
      });

      expect(result.current.equippedItems['avatar_skin']).toBeUndefined();
      expect(result.current.equippedItems['theme']).toBe('item-2');
      expect(result.current.equippedItemSkus['avatar_skin']).toBeUndefined();
      expect(result.current.equippedItemSkus['theme']).toBe(
        'profile_theme_ember'
      );
    });

    it('handles unequipping non-equipped item gracefully', async () => {
      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        useMomentaStore.setState({
          equippedItems: { avatar_skin: 'item-1', theme: 'item-2' },
        });
        await result.current.unequipItem('badge'); // Category not equipped
      });

      expect(result.current.equippedItems).toEqual({
        avatar_skin: 'item-1',
        theme: 'item-2',
      });
    });

    it('does not apply a late unequip receipt to a new account scope', async () => {
      let resolveUnequip:
        | ((value: { data: { success: true }; error: null }) => void)
        | undefined;
      const unequipResponse = new Promise<{
        data: { success: true };
        error: null;
      }>(resolve => {
        resolveUnequip = resolve;
      });
      (mockSupabase.rpc as jest.Mock).mockReturnValueOnce(unequipResponse);
      const { result } = renderHook(() => useMomentaStore());
      act(() => {
        useMomentaStore.setState({
          equippedItems: { avatar_skin: 'item-1' },
          equippedItemSkus: { avatar_skin: 'avatar_gold_frame' },
        });
      });

      const pendingUnequip = result.current.unequipItem('avatar_skin');
      await waitFor(() =>
        expect(mockSupabase.rpc).toHaveBeenCalledWith('unequip_item', {
          p_user_id: 'user-1',
          p_category: 'avatar_skin',
        })
      );
      act(() => {
        useMomentaStore.getState().activateAccountScope('user-2');
        useMomentaStore.setState({
          equippedItems: { theme: 'user-2-theme' },
          equippedItemSkus: { theme: 'profile_theme_ember' },
        });
      });
      resolveUnequip?.({ data: { success: true }, error: null });

      await act(async () => {
        await pendingUnequip;
      });

      expect(useMomentaStore.getState()).toMatchObject({
        activeAccountId: 'user-2',
        equippedItems: { theme: 'user-2-theme' },
        equippedItemSkus: { theme: 'profile_theme_ember' },
      });
    });
  });

  describe('Backend Sync', () => {
    it('hydrates equipped items with catalog SKUs', async () => {
      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'equipped_items') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    category: 'theme',
                    item_id: 'theme-item-1',
                    catalog_items: { sku: 'profile_theme_ember' },
                  },
                  {
                    category: 'avatar_frame',
                    item_id: 'frame-item-1',
                    catalog_items: [{ sku: 'avatar_gold_frame' }],
                  },
                ],
                error: null,
              }),
            }),
          };
        }
      });

      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        await result.current.fetchEquippedItems('user-1');
      });

      expect(result.current.equippedItems).toEqual({
        theme: 'theme-item-1',
        avatar_frame: 'frame-item-1',
      });
      expect(result.current.equippedItemSkus).toEqual({
        theme: 'profile_theme_ember',
        avatar_frame: 'avatar_gold_frame',
      });
    });

    it('successfully syncs with backend', async () => {
      const mockBalance = { momenta_balance: 80 };
      mockGetMyProfile.mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null,
        momenta_balance: mockBalance.momenta_balance,
        has_completed_onboarding: true,
        created_at: '2026-08-04T00:00:00.000Z',
        updated_at: '2026-08-04T00:00:00.000Z',
        is_pro: false,
        is_approved: true,
      });
      const mockTransactions = [
        {
          id: 'transaction-1',
          user_id: 'user-1',
          amount: 50,
          transaction_type: 'earned',
          description: 'Test transaction',
          created_at: new Date().toISOString(),
        },
      ];
      const mockPurchases = [{ user_id: 'user-1', item_id: 'item-1' }];

      (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockBalance,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'wallet_transactions') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockTransactions,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'purchases') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: mockPurchases,
                error: null,
              }),
            }),
          };
        } else if (table === 'equipped_items') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
      });

      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        await result.current.syncWithBackend('user-1');
      });

      expect(result.current.balance).toBe(80);
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.walletSyncError).toBeNull();
      expect(result.current.transactionHistoryError).toBeNull();
      expect(result.current.purchasedItems).toContain('item-1');
    }, 15000);

    it('keeps transaction history failures visible without clearing stale rows', async () => {
      useMomentaStore.setState({
        transactions: [
          {
            id: 'previous-transaction',
            user_id: 'user-1',
            amount: 12,
            transaction_type: 'earned',
            description: 'Previous reward',
            created_at: new Date().toISOString(),
          },
        ],
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'History offline' },
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        await result.current.fetchTransactions('user-1');
      });

      expect(result.current.transactionHistoryError).toBe('History offline');
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0]?.description).toBe(
        'Previous reward'
      );
    });

    it('clears transaction history errors after a successful refresh', async () => {
      useMomentaStore.setState({
        transactionHistoryError: 'History offline',
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'transaction-1',
                    user_id: 'user-1',
                    amount: 8,
                    transaction_type: 'earned',
                    description: 'Review reward',
                    created_at: new Date().toISOString(),
                  },
                ],
                error: null,
              }),
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        await result.current.fetchTransactions('user-1');
      });

      expect(result.current.transactionHistoryError).toBeNull();
      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0]?.description).toBe('Review reward');
    });

    it('handles backend sync with authenticated user', async () => {
      mockGetMyProfile.mockRejectedValueOnce(new Error('Not found'));
      (mockSupabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useMomentaStore());

      await act(async () => {
        await result.current.syncWithBackend('user-1');
      });

      // Should keep the app interactive while making the failed sync visible.
      expect(result.current.isLoading).toBe(false);
      expect(result.current.walletSyncError).toBe('Not found');
    });
  });

  describe('Persistence', () => {
    it('clears persisted state', async () => {
      const { result } = renderHook(() => useMomentaStore());

      // Set some state first
      act(() => {
        useMomentaStore.setState({
          balance: 100,
          purchasedItems: ['item-1'],
          equippedItems: { avatar_skin: 'item-1' },
        });
      });

      await act(async () => {
        result.current.clearMomentaData();
      });

      expect(result.current.balance).toBe(0);
      expect(result.current.purchasedItems).toEqual([]);
      expect(result.current.equippedItems).toEqual({});
      expect(result.current.equippedItemSkus).toEqual({});
    });
  });
});
