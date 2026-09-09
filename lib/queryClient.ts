import {
  focusManager,
  onlineManager,
  QueryClient,
} from '@tanstack/react-query';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import NetInfo from '@react-native-community/netinfo';
import { appStateManager } from './app-state-manager';
import { logError as logSentryError } from '@/lib/sentry';
import { isNonRetryableQueryError } from '@/lib/query-retry';

const queryClientDebugLog = (..._args: unknown[]) => {
  void _args;
};

const getErrorMessage = (error: unknown): unknown =>
  error && typeof error === 'object' && 'message' in error
    ? (error as { message?: unknown }).message
    : error;

// Global error handler for React Query
const queryErrorHandler = (error: unknown) => {
  // Log errors to your error tracking service
  console.error('React Query Error:', error);

  // You could also show user-friendly error messages here
  // or send to error tracking services like Sentry
  try {
    logSentryError(error, { source: 'react-query' });
  } catch {}
};

// Create persister for offline support
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'supabase-cache',
  throttleTime: 1000, // Only write to storage once per second
});

// Configure React Query client with optimized performance settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduced stale time for frequently-changing data (groups, challenges)
      staleTime: 2 * 60 * 1000, // 2 minutes (was 5 minutes)
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests with exponential backoff
      retry: (failureCount, error: unknown) => {
        if (isNonRetryableQueryError(error)) return false;

        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus AND reconnect for fresh data
      refetchOnWindowFocus: true,
      refetchOnReconnect: true, // Enable reconnect refetch (was false)

      // Network mode - 'online' means only fetch when online
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,

      // Handle mutation errors
      onError: queryErrorHandler,
    },
  },
});

// ============================================================================
// Specialized Query Configurations
// ============================================================================

/**
 * Config for interactive screens that should feel instant on revisit.
 * Short stale time, no polling — invalidate after mutations instead.
 */
export const interactiveQueryConfig = {
  staleTime: 30 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

/**
 * Config for real-time data (group stats, live challenges)
 * Shorter cache, more aggressive refetching
 */
export const realtimeQueryConfig = {
  staleTime: 30 * 1000, // 30 seconds
  gcTime: 2 * 60 * 1000, // 2 minutes
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 60 * 1000, // Poll every minute for live data
};

/**
 * Config for static/slow-changing data (user profiles, settings)
 * Longer cache, less aggressive refetching
 */
export const staticQueryConfig = {
  staleTime: 10 * 60 * 1000, // 10 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

/**
 * Config for infinite scroll queries (lists with pagination)
 */
export const infiniteQueryConfig = {
  staleTime: 60 * 1000, // 1 minute
  gcTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
};

// Focus manager - refetch when the app crosses a real foreground boundary.
focusManager.setEventListener(() => {
  const unsubscribe = appStateManager.addListener(state => {
    focusManager.setFocused(state === 'active');
  });

  focusManager.setFocused(AppState.currentState === 'active');

  return unsubscribe;
});

// Online manager - only fetch when online
onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(!!state.isConnected);
  });
});

// Export persister for use in app setup
export { asyncStoragePersister };

// Utility function to clear all cached data
export const clearAllCache = async () => {
  await queryClient.clear();
  await asyncStoragePersister.removeClient();
};

// Utility function to get cache stats
export const getCacheStats = () => {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  return {
    totalQueries: queries.length,
    staleQueries: queries.filter(q => q.isStale()).length,
    fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching')
      .length,
    errorQueries: queries.filter(q => q.state.status === 'error').length,
    successQueries: queries.filter(q => q.state.status === 'success').length,
  };
};

// Performance monitoring utilities
export const queryPerformanceLogger = {
  // Log slow queries
  logSlowQuery: (queryKey: readonly unknown[], duration: number) => {
    if (duration > 5000) {
      // Log queries taking more than 5 seconds
      console.warn('Slow query detected:', {
        queryKey,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Log query errors with context
  logQueryError: (queryKey: readonly unknown[], error: unknown) => {
    console.error('Query error:', {
      queryKey,
      error: getErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
  },

  // Log cache hits/misses
  logCacheEvent: (type: 'hit' | 'miss', queryKey: readonly unknown[]) => {
    if (__DEV__) {
      queryClientDebugLog(`Cache ${type}:`, queryKey);
    }
  },
};
