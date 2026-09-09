import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { translate } from '@/lib/localization';
import { showToast } from '@/components/ui/Toast';
import { openPaywall } from '@/lib/paywall/manager';
import { captureError as sentryCapture } from '@/lib/sentry';
import {
  getCatalogItemSku,
  getEquipCategoryForCatalogItem,
} from '@/lib/shop/catalogSupport';
import { getMyProfile } from '@/lib/profile-api';
import { isOfflineCommerceError } from '@/lib/commerce/commerce-state';
import {
  decodePowerUpUseResponse,
  decodeMomentaBalance,
  decodeShopPurchaseResponse,
  type PowerUpUseOutcome,
} from '@/lib/commerce/commerce-readback';
import { waitForRevenueCatAdRewardReceipt } from '@/lib/ads/revenuecat-reward-receipt';
import { createClientEventId } from '@/lib/client-event-id';
import { getPowerUpSupport } from '@/lib/shop/powerUpSupport';

export type PurchaseableItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category:
    | 'streak_freeze'
    | 'avatar_skin'
    | 'theme'
    | 'badge'
    | 'booster'
    | 'emote'
    | 'effect'
    | 'ai_upgrade'
    | 'name_style'
    | 'power_up';
  icon: string;
  isOwned: boolean;
  isEquipped?: boolean;
  is_disabled?: boolean;
  previewImage?: string;
  colors?: string[];
};

export type TransactionType =
  | 'earned'
  | 'spent'
  | 'bonus'
  | 'purchase'
  | 'adjustment';

const TRANSACTION_TYPES: readonly TransactionType[] = [
  'earned',
  'spent',
  'bonus',
  'purchase',
  'adjustment',
];

const toTransactionType = (value: unknown): TransactionType =>
  TRANSACTION_TYPES.includes(value as TransactionType)
    ? (value as TransactionType)
    : 'adjustment';

export interface MomentaTransaction {
  id?: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  description: string;
  reference_id?: string; // Challenge ID, purchase ID, etc.
  created_at?: string;
}

export interface ShopItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  cost: number;
  category: 'power_up' | 'cosmetic' | 'ai_upgrade' | string;
  is_disabled: boolean;
  created_at: string;
  unlock_streak_days?: number | null;
}

export interface OwnedItem {
  id: string;
  user_id: string;
  item_id: string;
  purchased_at: string;
  usage_count?: number;
  catalog_items: ShopItem;
}

export type ShopPurchaseOutcome =
  | 'confirmed'
  | 'insufficient-balance'
  | 'failed'
  | 'unknown';

export type ShopPurchaseReceipt = {
  clientEventId: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  cost: number;
  newBalance: number;
  quantity: number;
};

export type ShopPurchaseResult = {
  success: boolean;
  message: string;
  outcome: ShopPurchaseOutcome;
  clientEventId: string;
  receipt?: ShopPurchaseReceipt;
};

export type PendingShopPurchaseAttempt = {
  userId: string;
  itemId: string;
  clientEventId: string;
};

export type PowerUpUseResult = {
  success: boolean;
  message: string;
  outcome: PowerUpUseOutcome;
  clientEventId: string;
  effects?: Record<string, unknown>;
};

export type AdRewardClaimResult = {
  earned: boolean;
  amount: number;
  reason?:
    | 'daily-limit'
    | 'cooldown'
    | 'unauthenticated'
    | 'in-progress'
    | 'unknown';
  message?: string;
};

type FetchOptions = {
  throwOnError?: boolean;
};

type WalletTransactionRow = {
  id?: string | number | null;
  user_id?: string | null;
  amount?: number | null;
  transaction_type?: string | null;
  description?: string | null;
  reason?: string | null;
  reference_id?: string | null;
  source_uuid?: string | null;
  created_at?: string | null;
};

type EquippedCatalogRow = {
  sku?: unknown;
  category?: unknown;
};

type EquippedItemRow = {
  category?: unknown;
  item_id?: unknown;
  catalog_items?: EquippedCatalogRow | EquippedCatalogRow[] | null;
};

const getStoreErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof (error as { message?: unknown })?.message === 'string') {
    return String((error as { message: string }).message);
  }
  return fallback;
};

interface MomentaState {
  activeAccountId: string | null;
  accountScopeVersion: number;
  balance: number;
  shopItems: ShopItem[];
  ownedItems: OwnedItem[];
  isLoading: boolean;
  lastPurchaseError: string | null;
  walletSyncError: string | null;
  transactionHistoryError: string | null;
  pendingPurchaseAttempt: PendingShopPurchaseAttempt | null;
  purchasedItems: string[]; // IDs of purchased items
  equippedItems: Record<string, string>; // category -> itemId
  equippedItemSkus: Record<string, string>; // category -> item SKU
  transactions: MomentaTransaction[];

  // Actions
  fetchBalance: (userId: string, options?: FetchOptions) => Promise<void>;
  fetchShopItems: (options?: FetchOptions) => Promise<void>;
  fetchOwnedItems: (userId: string, options?: FetchOptions) => Promise<void>;
  purchaseItem: (
    userId: string,
    itemId: string,
    clientEventId?: string
  ) => Promise<ShopPurchaseResult>;
  usePowerUp: (
    userId: string,
    itemSku: string,
    challengeId?: string,
    targetData?: unknown,
    clientEventId?: string
  ) => Promise<PowerUpUseResult>;
  checkPowerUpInventory: (
    userId: string,
    itemSku: string
  ) => Promise<{ owned: boolean; remaining: number }>;
  earnMomenta: (
    userId: string,
    amount: number,
    source: string
  ) => Promise<void>;
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => void;
  addMomenta: (
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string
  ) => Promise<boolean>;
  claimAdReward: (clientTransactionId?: string) => Promise<AdRewardClaimResult>;
  spendMomenta: (
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string
  ) => Promise<boolean>;
  equipItem: (
    itemId: string,
    category: string,
    itemSku?: string
  ) => Promise<void>;
  unequipItem: (category: string) => Promise<void>;
  isPurchased: (itemId: string) => boolean;
  isEquipped: (itemId: string) => boolean;

  // Backend sync actions
  fetchTransactions: (userId: string) => Promise<void>;
  fetchPurchasedItems: (
    userId: string,
    options?: FetchOptions
  ) => Promise<void>;
  fetchEquippedItems: (userId: string, options?: FetchOptions) => Promise<void>;
  syncWithBackend: (userId: string) => Promise<void>;
  activateAccountScope: (userId: string) => void;
  clearMomentaData: () => void;
}

const isCurrentAccountScope = (
  state: Pick<MomentaState, 'activeAccountId' | 'accountScopeVersion'>,
  userId: string,
  requestScopeVersion: number
) =>
  state.activeAccountId === userId &&
  state.accountScopeVersion === requestScopeVersion;

const isSamePendingPurchase = (
  attempt: PendingShopPurchaseAttempt | null,
  userId: string,
  itemId: string,
  clientEventId?: string
) =>
  attempt?.userId === userId &&
  attempt.itemId === itemId &&
  (clientEventId === undefined || attempt.clientEventId === clientEventId);

const adRewardClaimsInFlight = new Set<string>();
const AD_REWARD_REASON_IN_PROGRESS = 'in-progress' as const;

const isPersistablePendingPurchase = (
  value: unknown
): value is PendingShopPurchaseAttempt => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.userId === 'string' &&
    candidate.userId.length > 0 &&
    typeof candidate.itemId === 'string' &&
    candidate.itemId.length > 0 &&
    typeof candidate.clientEventId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      candidate.clientEventId
    )
  );
};

export const migrateMomentaPersistedState = (
  persistedState: unknown,
  version: number
) => {
  let nextState: Partial<MomentaState> =
    typeof persistedState === 'object' && persistedState !== null
      ? (persistedState as Partial<MomentaState>)
      : {};

  if (version < 2) {
    // Migration from v1 to v2: add new fields and reset balance to sync from backend
    nextState = {
      ...nextState,
      balance: 0, // Will be loaded from backend
      transactions: [],
      isLoading: false,
      equippedItemSkus: {},
    };
  }
  if (version < 3) {
    nextState = {
      ...nextState,
      equippedItemSkus: nextState?.equippedItemSkus || {},
    };
  }
  if (version < 4) {
    nextState = {
      ...nextState,
      walletSyncError: null,
      transactionHistoryError: null,
    };
  }
  if (version < 5) {
    // v4 did not record an owner for persisted balance or inventory state. Do
    // not show it until the active auth session establishes its account scope.
    return {
      ...nextState,
      activeAccountId: null,
      accountScopeVersion: Number(nextState?.accountScopeVersion || 0) + 1,
      balance: 0,
      purchasedItems: [],
      equippedItems: {},
      equippedItemSkus: {},
      ownedItems: [],
      transactions: [],
      walletSyncError: null,
      transactionHistoryError: null,
      isLoading: false,
      pendingPurchaseAttempt: null,
    };
  }
  if (version < 6) {
    nextState = {
      ...nextState,
      pendingPurchaseAttempt: null,
    };
  }
  return {
    ...nextState,
    pendingPurchaseAttempt: isPersistablePendingPurchase(
      nextState.pendingPurchaseAttempt
    )
      ? nextState.pendingPurchaseAttempt
      : null,
  };
};

export const useMomentaStore = create<MomentaState>()(
  persist(
    (set, get) => ({
      activeAccountId: null,
      accountScopeVersion: 0,
      balance: 0,
      shopItems: [],
      ownedItems: [],
      isLoading: false,
      lastPurchaseError: null,
      walletSyncError: null,
      transactionHistoryError: null,
      pendingPurchaseAttempt: null,
      purchasedItems: [],
      equippedItems: {},
      equippedItemSkus: {},
      transactions: [],

      fetchBalance: async (userId, options) => {
        const requestScopeVersion = get().accountScopeVersion;
        try {
          const profile = await getMyProfile();
          if (!profile || profile.id !== userId) {
            throw new Error('PROFILE_NOT_FOUND');
          }

          if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            return;
          }

          const decodedBalance = decodeMomentaBalance(profile.momenta_balance);
          if (decodedBalance === null) {
            throw new Error('Wallet balance readback could not be verified.');
          }

          set({ balance: decodedBalance, walletSyncError: null });
        } catch (error) {
          if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            return;
          }

          const message = getStoreErrorMessage(
            error,
            'Could not refresh wallet balance.'
          );
          // Wallet refresh can fail during a transient network handoff. Keep
          // the last confirmed balance and expose a recoverable state instead
          // of raising a fatal-looking React Native LogBox.
          set({ walletSyncError: message });
          if (options?.throwOnError) throw new Error(message);
        }
      },

      fetchShopItems: async options => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('catalog_items')
            .select('*')
            .eq('is_disabled', false)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({ shopItems: data || [], isLoading: false });
        } catch (error) {
          console.error('Error fetching shop items:', error);
          set({ isLoading: false });
          const message = getStoreErrorMessage(
            error,
            'Could not refresh the shop catalogue.'
          );
          if (options?.throwOnError) throw new Error(message);
        }
      },

      fetchOwnedItems: async (userId, options) => {
        const requestScopeVersion = get().accountScopeVersion;
        try {
          const { data, error } = await supabase
            .from('purchases')
            .select(
              `
              *,
              catalog_items (*)
            `
            )
            .eq('user_id', userId);

          if (error) throw error;

          if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            return;
          }

          set({ ownedItems: data || [] });
          // Also maintain a quick purchasedItems list for UI checks
          set({
            purchasedItems: ((data || []) as { item_id: string }[]).map(
              row => row.item_id
            ),
          });
        } catch (error) {
          console.error('Error fetching owned items:', error);
          const message = getStoreErrorMessage(
            error,
            'Could not refresh owned items.'
          );
          if (options?.throwOnError) throw new Error(message);
        }
      },

      purchaseItem: async (userId, itemId, clientEventId) => {
        const requestScopeVersion = get().accountScopeVersion;
        const savedAttempt = get().pendingPurchaseAttempt;
        const requestId =
          savedAttempt && isSamePendingPurchase(savedAttempt, userId, itemId)
            ? savedAttempt.clientEventId
            : clientEventId || createClientEventId();

        if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
          return {
            success: false,
            message: translate('en-NZ', 'commerce.readback.shop.unauthorized'),
            outcome: 'failed',
            clientEventId: requestId,
          };
        }

        if (savedAttempt?.userId === userId && savedAttempt.itemId !== itemId) {
          const message =
            'Menta is still confirming another purchase. Return to that item and try it again before buying something else.';
          set({ isLoading: false, lastPurchaseError: message });
          return {
            success: false,
            message,
            outcome: 'unknown',
            clientEventId: savedAttempt.clientEventId,
          };
        }

        set({
          isLoading: true,
          lastPurchaseError: null,
          pendingPurchaseAttempt: {
            userId,
            itemId,
            clientEventId: requestId,
          },
        });
        try {
          const { data, error } = await supabase.rpc('purchase_shop_item', {
            p_user_id: userId,
            p_item_id: itemId,
            p_client_event_id: requestId,
          });

          if (error) {
            if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
              set({
                isLoading: false,
                lastPurchaseError: error.message,
              });
            }
            return {
              success: false,
              message: error.message,
              // The request reached the RPC boundary, so any top-level error
              // can represent response loss after the server committed it.
              // Keep the request key until the RPC returns a domain result.
              outcome: 'unknown',
              clientEventId: requestId,
            };
          }

          const decoded = decodeShopPurchaseResponse(data, itemId, requestId);
          if (!decoded.success) {
            const message = decoded.message;
            if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
              set(state => ({
                isLoading: false,
                lastPurchaseError: message,
                pendingPurchaseAttempt:
                  decoded.outcome !== 'unknown' &&
                  isSamePendingPurchase(
                    state.pendingPurchaseAttempt,
                    userId,
                    itemId,
                    requestId
                  )
                    ? null
                    : state.pendingPurchaseAttempt,
              }));
            }
            return {
              success: false,
              message,
              outcome: decoded.outcome,
              clientEventId: requestId,
            };
          }

          // A balance or ownership update is only permitted after the whole
          // server receipt has decoded for the exact item that was requested.
          if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            set(state => ({
              balance: decoded.receipt.newBalance,
              isLoading: false,
              lastPurchaseError: null,
              pendingPurchaseAttempt: isSamePendingPurchase(
                state.pendingPurchaseAttempt,
                userId,
                itemId,
                requestId
              )
                ? null
                : state.pendingPurchaseAttempt,
            }));
          }

          // The decoded RPC receipt is the authoritative purchase outcome.
          // Ownership refresh is best-effort convenience data: a failed
          // readback must not relabel a completed atomic debit/grant as a
          // retryable failure.
          if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            try {
              await Promise.all([
                get().fetchOwnedItems(userId),
                get().fetchPurchasedItems(userId),
              ]);
            } catch (refreshError) {
              console.warn(
                'Purchase receipt confirmed but ownership refresh failed:',
                refreshError
              );
            }
          }

          return {
            success: true,
            message: `Successfully purchased ${decoded.receipt.itemName}!`,
            outcome: 'confirmed',
            clientEventId: requestId,
            receipt: decoded.receipt,
          };
        } catch (error) {
          console.error('Error purchasing item:', error);
          const message =
            error instanceof Error ? error.message : 'Purchase failed';
          if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            set({
              isLoading: false,
              lastPurchaseError: message,
            });
          }
          return {
            success: false,
            message,
            // The pending request key remains persisted after response loss.
            // Retrying the same item replays the server receipt instead of
            // performing another debit or inventory grant.
            outcome: 'unknown',
            clientEventId: requestId,
          };
        }
      },

      usePowerUp: async (
        userId,
        itemSku,
        challengeId,
        targetData,
        clientEventId
      ) => {
        const requestScopeVersion = get().accountScopeVersion;
        const requestId = clientEventId || createClientEventId();
        const support = getPowerUpSupport(itemSku);

        if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
          return {
            success: false,
            outcome: 'failed',
            clientEventId: requestId,
            message: translate(
              'en-NZ',
              'commerce.readback.powerUp.unauthorized'
            ),
          };
        }

        if (!support || support.autoConsumed) {
          return {
            success: false,
            outcome: 'failed',
            clientEventId: requestId,
            message: support?.autoConsumed
              ? translate('en-NZ', 'sourceGate.momenta.freezeAutoConsumed')
              : translate('en-NZ', 'sourceGate.momenta.oldBoostUnavailable'),
          };
        }

        if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
          set({ isLoading: true });
        }
        try {
          const { data, error } = await supabase.rpc('use_power_up', {
            p_user_id: userId,
            p_item_sku: itemSku,
            p_challenge_id: challengeId || null,
            p_target_data: targetData || null,
            p_client_event_id: requestId,
          });

          if (error) {
            if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
              set({ isLoading: false });
            }
            const unknown = isOfflineCommerceError(error);
            return {
              success: false,
              outcome: unknown ? 'unknown' : 'failed',
              clientEventId: requestId,
              message: unknown
                ? translate('en-NZ', 'sourceGate.momenta.extensionUnknown')
                : translate('en-NZ', 'commerce.readback.powerUp.failed'),
            };
          }

          const decoded = decodePowerUpUseResponse(data, requestId);
          if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            set({ isLoading: false });
          }
          if (!decoded.success) return decoded;
          if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            return {
              success: false,
              outcome: 'unknown',
              clientEventId: requestId,
              message: translate(
                'en-NZ',
                'sourceGate.momenta.extensionAccountChanged'
              ),
            };
          }

          return {
            success: true,
            outcome: 'confirmed',
            clientEventId: requestId,
            message: support.successMessage || 'The extension was confirmed.',
            effects: decoded.effects,
          };
        } catch (error) {
          console.error('Error using boost:', error);
          if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            set({ isLoading: false });
          }
          const unknown = isOfflineCommerceError(error);
          return {
            success: false,
            outcome: unknown ? 'unknown' : 'failed',
            clientEventId: requestId,
            message: unknown
              ? translate('en-NZ', 'sourceGate.momenta.extensionUnknown')
              : translate('en-NZ', 'commerce.readback.powerUp.failed'),
          };
        }
      },

      checkPowerUpInventory: async (userId, itemSku) => {
        try {
          // Prefer per-SKU RPC if available
          const { data, error } = await supabase.rpc(
            'check_power_up_inventory_for_sku',
            {
              p_user_id: userId,
              p_item_sku: itemSku,
            }
          );

          if (!error && data) {
            return {
              owned: Boolean(data.owned),
              remaining: Number(data.remaining || 0),
            };
          }

          // Fallback: count purchases directly
          const { count, error: countError } = await supabase
            .from('purchases')
            .select('item_id', { count: 'planned', head: true })
            .eq('user_id', userId)
            .in(
              'item_id',
              (
                (
                  await supabase
                    .from('catalog_items')
                    .select('id')
                    .eq('sku', itemSku)
                ).data || []
              ).map((row: { id: string }) => row.id)
            );

          if (countError) throw countError;
          return { owned: (count || 0) > 0, remaining: count || 0 };
        } catch (error) {
          console.error('Error checking boost inventory:', error);
          return { owned: false, remaining: 0 };
        }
      },

      earnMomenta: async (userId, amount, source) => {
        try {
          // Record via ledger RPC to keep server as source of truth
          const { error: rpcError } = await supabase.rpc(
            'add_momenta_transaction',
            {
              p_user_id: userId,
              p_amount: amount,
              p_reason: source,
              p_transaction_type: 'earned',
            }
          );
          if (rpcError) throw rpcError;

          // Refresh balance from server
          try {
            await get().fetchBalance(userId);
          } catch {}
        } catch (error) {
          console.error('Error earning momenta:', error);
        }
      },

      addBalance: amount => {
        set(state => ({ balance: state.balance + amount }));
      },

      deductBalance: amount => {
        set(state => ({ balance: Math.max(0, state.balance - amount) }));
      },

      claimAdReward: async clientTransactionId => {
        const requestAccountId = get().activeAccountId;
        const requestScopeVersion = get().accountScopeVersion;
        if (!requestAccountId || !clientTransactionId) {
          return { earned: false, amount: 0, reason: 'unknown' };
        }
        const claimKey = `${requestAccountId}:${requestScopeVersion}:${clientTransactionId}`;
        if (adRewardClaimsInFlight.has(claimKey)) {
          return {
            earned: false,
            amount: 0,
            reason: AD_REWARD_REASON_IN_PROGRESS,
          };
        }
        adRewardClaimsInFlight.add(claimKey);
        try {
          // Read only: RevenueCat's verified webhook already owns the grant.
          // Never convert a client ad callback into a wallet mutation.
          const receipt = await waitForRevenueCatAdRewardReceipt(
            clientTransactionId,
            { attempts: 1 }
          );
          if (
            !isCurrentAccountScope(get(), requestAccountId, requestScopeVersion)
          ) {
            return { earned: false, amount: 0, reason: 'unauthenticated' };
          }
          if (receipt?.status !== 'applied' || receipt.amount <= 0) {
            return {
              earned: false,
              amount: 0,
              reason:
                receipt?.reason === 'daily_limit'
                  ? 'daily-limit'
                  : receipt?.reason === 'cooldown'
                    ? 'cooldown'
                    : 'unknown',
            };
          }
          // The receipt balance is a historical snapshot; refresh current balance
          // so a later purchase cannot be overwritten by an older ad receipt.
          await get().fetchBalance(requestAccountId);
          if (
            !isCurrentAccountScope(get(), requestAccountId, requestScopeVersion)
          ) {
            return { earned: false, amount: 0, reason: 'unauthenticated' };
          }
          return { earned: true, amount: receipt.amount };
        } catch (error) {
          sentryCapture(error, { context: 'read_ad_reward_receipt' });
          return { earned: false, amount: 0, reason: 'unknown' };
        } finally {
          adRewardClaimsInFlight.delete(claimKey);
        }
      },

      addMomenta: async (amount, type, description, referenceId) => {
        const requestAccountId = get().activeAccountId;
        const requestScopeVersion = get().accountScopeVersion;
        if (!requestAccountId) return false;

        set({ isLoading: true });
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');
          if (
            user.id !== requestAccountId ||
            !isCurrentAccountScope(get(), user.id, requestScopeVersion)
          ) {
            return false;
          }

          // Validate UUID referenceId (DB column is uuid). If invalid, omit it.
          const isValidUuid =
            typeof referenceId === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              referenceId
            );

          const fetchLatestTransaction = async () => {
            const { data, error } = await supabase
              .from('wallet_transactions')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (error) throw error;
            return data;
          };

          if (amount > 0) {
            // A generic description is not a reward authority. Welcome
            // Momenta is granted only by first-promise activation, while
            // explicit reward flows use their own typed server RPCs.
            return false;
          }

          // Prefer RPC to ensure consistent server-side logic
          const rpcArgs: {
            p_user_id: string;
            p_amount: number;
            p_reason: string;
            p_transaction_type: TransactionType;
            p_reference_id?: string;
          } = {
            p_user_id: user.id,
            p_amount: amount,
            p_reason: description,
            p_transaction_type: type,
          };
          if (isValidUuid) {
            rpcArgs.p_reference_id = referenceId;
          }

          const { error: rpcError } = await supabase.rpc(
            'add_momenta_transaction',
            rpcArgs
          );
          if (rpcError) throw rpcError;

          if (!isCurrentAccountScope(get(), user.id, requestScopeVersion)) {
            return false;
          }

          const data = await fetchLatestTransaction();
          if (!isCurrentAccountScope(get(), user.id, requestScopeVersion)) {
            return false;
          }

          // Update local state
          const newBalance = get().balance + amount;
          set(state => ({
            balance: newBalance,
            transactions: data
              ? [data, ...state.transactions]
              : state.transactions,
          }));

          return true;
        } catch (error) {
          if (
            !isCurrentAccountScope(get(), requestAccountId, requestScopeVersion)
          ) {
            return false;
          }
          console.error('Error adding momenta:', error);
          try {
            sentryCapture(error, {
              context: 'add_momenta_failure',
              amount,
              type,
              description,
              referenceId,
            });
          } catch {}
          return false;
        } finally {
          if (
            isCurrentAccountScope(get(), requestAccountId, requestScopeVersion)
          ) {
            set({ isLoading: false });
          }
        }
      },

      spendMomenta: async (amount, type, description, referenceId) => {
        const requestAccountId = get().activeAccountId;
        const requestScopeVersion = get().accountScopeVersion;
        if (!requestAccountId) return false;

        set({ isLoading: true });
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            showToast.error(
              translate('en-NZ', 'sourceGate.momenta.loginRequired'),
              translate('en-NZ', 'sourceGate.momenta.loginRequiredDetail')
            );
            return false;
          }
          if (
            user.id !== requestAccountId ||
            !isCurrentAccountScope(get(), user.id, requestScopeVersion)
          ) {
            return false;
          }

          // Check if user has enough balance
          if (get().balance < amount) {
            const shortfall = Math.max(amount - get().balance, 0);
            openPaywall({ context: 'general', shortfall });
            return false;
          }

          // Validate UUID referenceId (DB column is uuid). If invalid, omit it.
          const isValidUuid =
            typeof referenceId === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              referenceId
            );

          const rpcArgs: {
            p_user_id: string;
            p_amount: number;
            p_reason: string;
            p_transaction_type: TransactionType;
            p_reference_id?: string;
          } = {
            p_user_id: user.id,
            p_amount: -amount,
            p_reason: description,
            p_transaction_type: type,
          };
          if (isValidUuid) {
            rpcArgs.p_reference_id = referenceId;
          }

          const { error: rpcError } = await supabase.rpc(
            'add_momenta_transaction',
            rpcArgs
          );
          if (rpcError) throw rpcError;

          if (!isCurrentAccountScope(get(), user.id, requestScopeVersion)) {
            return false;
          }

          // Fetch the latest transaction row for state (optional best-effort)
          const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (error) throw error;
          if (!isCurrentAccountScope(get(), user.id, requestScopeVersion)) {
            return false;
          }

          // Update local state
          const newBalance = get().balance - amount;
          set(state => ({
            balance: newBalance,
            transactions: [data, ...state.transactions],
          }));

          return true;
        } catch (error) {
          if (
            !isCurrentAccountScope(get(), requestAccountId, requestScopeVersion)
          ) {
            return false;
          }
          console.error('Error spending momenta:', error);
          showToast.error(
            translate('en-NZ', 'sourceGate.momenta.transactionFailed'),
            translate('en-NZ', 'sourceGate.momenta.transactionFailedDetail')
          );
          return false;
        } finally {
          if (
            isCurrentAccountScope(get(), requestAccountId, requestScopeVersion)
          ) {
            set({ isLoading: false });
          }
        }
      },

      equipItem: async (itemId, category, itemSku) => {
        const requestAccountId = get().activeAccountId;
        const requestScopeVersion = get().accountScopeVersion;
        if (!requestAccountId) throw new Error('Account scope unavailable');

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');
          if (
            user.id !== requestAccountId ||
            !isCurrentAccountScope(get(), user.id, requestScopeVersion)
          ) {
            return;
          }

          const resolvedSku =
            itemSku ||
            getCatalogItemSku(
              get().shopItems.find(item => item.id === itemId) || {
                id: itemId,
              }
            );

          const { data, error } = await supabase.rpc('equip_owned_item', {
            p_user_id: user.id,
            p_item_id: itemId,
            p_category: category,
          });

          if (error) throw error;
          if (!data?.success) {
            throw new Error(data?.error || 'Item could not be equipped');
          }
          if (!isCurrentAccountScope(get(), user.id, requestScopeVersion)) {
            return;
          }

          set(state => ({
            equippedItems: {
              ...state.equippedItems,
              [category]: itemId,
            },
            equippedItemSkus: {
              ...state.equippedItemSkus,
              [category]: resolvedSku,
            },
          }));
        } catch (e) {
          if (
            !isCurrentAccountScope(get(), requestAccountId, requestScopeVersion)
          ) {
            return;
          }
          console.error('Failed to equip item:', e);
          throw e;
        }
      },

      unequipItem: async category => {
        const requestAccountId = get().activeAccountId;
        const requestScopeVersion = get().accountScopeVersion;
        if (!requestAccountId) throw new Error('Account scope unavailable');

        try {
          if (!get().equippedItems[category]) return;

          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');
          if (
            user.id !== requestAccountId ||
            !isCurrentAccountScope(get(), user.id, requestScopeVersion)
          ) {
            return;
          }

          const { data, error } = await supabase.rpc('unequip_item', {
            p_user_id: user.id,
            p_category: category,
          });

          if (error) throw error;
          if (!data?.success) {
            throw new Error(data?.error || 'Item could not be unequipped');
          }
          if (!isCurrentAccountScope(get(), user.id, requestScopeVersion)) {
            return;
          }

          set(state => {
            const newEquipped = { ...state.equippedItems };
            const newEquippedSkus = { ...state.equippedItemSkus };
            delete newEquipped[category];
            delete newEquippedSkus[category];
            return {
              equippedItems: newEquipped,
              equippedItemSkus: newEquippedSkus,
            };
          });
        } catch (e) {
          if (
            !isCurrentAccountScope(get(), requestAccountId, requestScopeVersion)
          ) {
            return;
          }
          console.error('Failed to unequip item:', e);
          throw e;
        }
      },

      isPurchased: itemId => {
        return get().purchasedItems.includes(itemId);
      },

      isEquipped: itemId => {
        const { equippedItems } = get();
        return Object.values(equippedItems).includes(itemId);
      },

      fetchTransactions: async userId => {
        const requestScopeVersion = get().accountScopeVersion;
        try {
          const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;

          if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            return;
          }

          // Map database columns to interface fields
          const transactions: MomentaTransaction[] = (
            (data || []) as WalletTransactionRow[]
          ).map(row => ({
            id: row.id?.toString(),
            user_id: String(row.user_id || userId),
            amount: Number(row.amount || 0),
            transaction_type: toTransactionType(row.transaction_type),
            description: row.description || row.reason || '',
            reference_id: row.reference_id || row.source_uuid || undefined,
            created_at: row.created_at || undefined,
          }));

          set({ transactions, transactionHistoryError: null });
        } catch (error) {
          if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            return;
          }

          console.error('Error fetching transactions:', error);
          const message = getStoreErrorMessage(
            error,
            'Could not refresh wallet activity.'
          );
          set({ transactionHistoryError: message });
        }
      },

      fetchPurchasedItems: async (userId, options) => {
        const requestScopeVersion = get().accountScopeVersion;
        try {
          const { data, error } = await supabase
            .from('purchases')
            .select('item_id')
            .eq('user_id', userId);

          if (error) throw error;

          if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            return;
          }

          set({ purchasedItems: data ? data.map(item => item.item_id) : [] });
        } catch (error) {
          console.error('Error fetching purchased items:', error);
          const message = getStoreErrorMessage(
            error,
            'Could not refresh purchases.'
          );
          if (options?.throwOnError) throw new Error(message);
        }
      },

      fetchEquippedItems: async (userId, options) => {
        const requestScopeVersion = get().accountScopeVersion;
        try {
          const { data, error } = await supabase
            .from('equipped_items')
            .select(
              `
              category,
              item_id,
              catalog_items (sku, category)
            `
            )
            .eq('user_id', userId);

          if (error) throw error;

          if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            return;
          }

          const equippedItems: Record<string, string> = {};
          const equippedItemSkus: Record<string, string> = {};

          for (const row of (data || []) as EquippedItemRow[]) {
            const storedCategory = String(row.category || '');
            const itemId = String(row.item_id || '');
            if (!itemId) continue;

            const catalog = Array.isArray(row.catalog_items)
              ? row.catalog_items[0]
              : row.catalog_items;
            const sku = String(catalog?.sku || '');
            const category = getEquipCategoryForCatalogItem({
              id: itemId,
              sku,
              category: String(catalog?.category || storedCategory),
            });

            if (category === 'catalog' || category === 'power_up') continue;

            equippedItems[category] = itemId;
            if (sku) equippedItemSkus[category] = sku;
          }

          set({ equippedItems, equippedItemSkus });
        } catch (error) {
          console.error('Error fetching equipped items:', error);
          const message = getStoreErrorMessage(
            error,
            'Could not refresh equipped items.'
          );
          if (options?.throwOnError) throw new Error(message);
        }
      },

      syncWithBackend: async userId => {
        const requestScopeVersion = get().accountScopeVersion;
        if (!isCurrentAccountScope(get(), userId, requestScopeVersion)) return;

        set({ isLoading: true, walletSyncError: null });
        try {
          const results = await Promise.allSettled([
            get().fetchBalance(userId, { throwOnError: true }),
            get().fetchTransactions(userId),
            get().fetchPurchasedItems(userId, { throwOnError: true }),
            get().fetchOwnedItems(userId, { throwOnError: true }),
            get().fetchEquippedItems(userId, { throwOnError: true }),
          ]);
          const coreFailure = results.find(
            (result, index) => index !== 1 && result.status === 'rejected'
          );

          if (
            coreFailure?.status === 'rejected' &&
            isCurrentAccountScope(get(), userId, requestScopeVersion)
          ) {
            set({
              walletSyncError: getStoreErrorMessage(
                coreFailure.reason,
                'Could not refresh wallet.'
              ),
            });
          }
        } catch (error) {
          if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            console.error('Error syncing with backend:', error);
            set({
              walletSyncError: getStoreErrorMessage(
                error,
                'Could not refresh wallet.'
              ),
            });
          }
        } finally {
          if (isCurrentAccountScope(get(), userId, requestScopeVersion)) {
            set({ isLoading: false });
          }
        }
      },

      activateAccountScope: userId => {
        set(state => {
          if (state.activeAccountId === userId) return {};

          return {
            activeAccountId: userId,
            accountScopeVersion: state.accountScopeVersion + 1,
            balance: 0,
            purchasedItems: [],
            equippedItems: {},
            equippedItemSkus: {},
            ownedItems: [],
            transactions: [],
            walletSyncError: null,
            transactionHistoryError: null,
            pendingPurchaseAttempt: null,
            isLoading: false,
          };
        });
      },

      clearMomentaData: () => {
        set(state => ({
          activeAccountId: null,
          accountScopeVersion: state.accountScopeVersion + 1,
          balance: 0,
          purchasedItems: [],
          equippedItems: {},
          equippedItemSkus: {},
          ownedItems: [],
          transactions: [],
          walletSyncError: null,
          transactionHistoryError: null,
          pendingPurchaseAttempt: null,
          isLoading: false,
        }));
      },
    }),
    {
      name: 'momenta-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 6,
      migrate: migrateMomentaPersistedState,
    }
  )
);
