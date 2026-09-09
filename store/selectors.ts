/**
 * Optimized store selectors using shallow comparison
 * Prevents unnecessary re-renders when selecting multiple fields
 */

import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from './auth-store';
import { useGroupStore } from './group-store';
import { useMomentaStore } from './momenta-store';

// ============================================================================
// Auth Store Optimized Selectors
// ============================================================================

/**
 * Select user and loading state with shallow comparison
 * Only re-renders when user or isLoading changes
 */
export const useAuthState = () =>
  useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isLoading: state.isLoading,
      isAuthenticated: state.isAuthenticated,
    }))
  );

/**
 * Select authentication status fields
 */
export const useAuthStatus = () =>
  useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
    }))
  );

/**
 * Select user identity fields only
 */
export const useUserIdentity = () =>
  useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }))
  );

// ============================================================================
// Group Store Optimized Selectors
// ============================================================================

/**
 * Select groups and loading state with shallow comparison
 */
export const useGroupsState = () =>
  useGroupStore(
    useShallow((state) => ({
      groups: state.groups,
      isLoading: state.isLoading,
    }))
  );

/**
 * Select user-specific groups
 */
export const useUserGroupsState = () =>
  useGroupStore(
    useShallow((state) => ({
      groups: state.groups,
      userGroups: state.userGroups,
      isLoading: state.isLoading,
    }))
  );

/**
 * Select discover groups for exploration
 */
export const useDiscoverGroupsState = () =>
  useGroupStore(
    useShallow((state) => ({
      discoverGroups: state.discoverGroups,
      isLoading: state.isLoading,
    }))
  );

/**
 * Select group actions only (stable references)
 */
export const useGroupActions = () =>
  useGroupStore(
    useShallow((state) => ({
      fetchGroups: state.fetchGroups,
      fetchUserGroups: state.fetchUserGroups,
      fetchDiscoverGroups: state.fetchDiscoverGroups,
      joinGroup: state.joinGroup,
      leaveGroup: state.leaveGroup,
      createGroup: state.createGroup,
      deleteGroup: state.deleteGroup,
      shareGroup: state.shareGroup,
    }))
  );

// ============================================================================
// Momenta Store Optimized Selectors
// ============================================================================

/**
 * Select balance and loading state
 */
export const useMomentaBalance = () =>
  useMomentaStore(
    useShallow((state) => ({
      balance: state.balance,
      isLoading: state.isLoading,
    }))
  );

/**
 * Select shop items and owned items
 */
export const useShopState = () =>
  useMomentaStore(
    useShallow((state) => ({
      shopItems: state.shopItems,
      ownedItems: state.ownedItems,
      isLoading: state.isLoading,
    }))
  );

/**
 * Select momenta actions only
 */
export const useMomentaActions = () =>
  useMomentaStore(
    useShallow((state) => ({
      fetchBalance: state.fetchBalance,
      addMomenta: state.addMomenta,
      spendMomenta: state.spendMomenta,
      purchaseItem: state.purchaseItem,
    }))
  );

// ============================================================================
// Single-field Selectors (Most Performant)
// ============================================================================

/**
 * Select only the current user (most common use case)
 * Only re-renders when user object reference changes
 */
export const useUser = () => useAuthStore((state) => state.user);

/**
 * Select only authentication status
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

/**
 * Select only groups array
 */
export const useGroups = () => useGroupStore((state) => state.groups);

/**
 * Select only user groups array
 */
export const useUserGroupIds = () => useGroupStore((state) => state.userGroups);

/**
 * Select only momenta balance
 */
export const useBalance = () => useMomentaStore((state) => state.balance);

/**
 * Select only shop items
 */
export const useShopItems = () => useMomentaStore((state) => state.shopItems);
