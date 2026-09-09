import { supabase } from './supabase';
import { useAuthStore } from '@/store/auth-store';
import { logError } from './sentry';
import { getMyProfile } from './profile-api';
import { translate } from '@/lib/localization';

export interface AuthValidationResult {
  isValid: boolean;
  userId: string | null;
  error?: string;
  shouldRefresh?: boolean;
}

/**
 * Validates that the current user is properly authenticated
 * and returns the user ID for database operations
 */
export async function validateAuth(): Promise<AuthValidationResult> {
  try {
    // First check if we have a valid session in the auth store
    const authState = useAuthStore.getState();

    if (!authState.isAuthenticated || !authState.user || !authState.session) {
      return {
        isValid: false,
        userId: null,
        error: translate('en-NZ', 'domain.auth.user_not_authenticated'),
        shouldRefresh: false,
      };
    }

    // Verify the session is still valid by checking with Supabase
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('[AuthHelper] Session validation error:', error);
      return {
        isValid: false,
        userId: null,
        error: translate('en-NZ', 'domain.auth.session_validation_failed'),
        shouldRefresh: true,
      };
    }

    if (!session || !session.user) {
      return {
        isValid: false,
        userId: null,
        error: translate('en-NZ', 'domain.auth.no_valid_session'),
        shouldRefresh: true,
      };
    }

    // Ensure the session user matches our stored user
    if (session.user.id !== authState.user.id) {
      console.error('[AuthHelper] User ID mismatch between store and session');
      return {
        isValid: false,
        userId: null,
        error: translate('en-NZ', 'domain.auth.user_id_mismatch'),
        shouldRefresh: true,
      };
    }

    return {
      isValid: true,
      userId: session.user.id,
    };
  } catch (error) {
    console.error('[AuthHelper] Auth validation error:', error);
    logError(error as Error, {
      component: 'AuthHelper',
      action: 'validateAuth',
    });

    return {
      isValid: false,
      userId: null,
      error: translate('en-NZ', 'domain.auth.validation_failed'),
      shouldRefresh: true,
    };
  }
}

/**
 * Ensures the user is authenticated before performing database operations
 * Throws an error if authentication fails
 */
export async function ensureAuthenticated(): Promise<string> {
  const authResult = await validateAuth();

  if (!authResult.isValid) {
    if (authResult.shouldRefresh) {
      // Try to refresh the session
      try {
        await useAuthStore.getState().refreshSession();
        const retryResult = await validateAuth();

        if (retryResult.isValid && retryResult.userId) {
          return retryResult.userId;
        }
      } catch (refreshError) {
        console.error('[AuthHelper] Session refresh failed:', refreshError);
      }
    }

    throw new Error(
      authResult.error ||
        translate('en-NZ', 'domain.auth.authentication_required')
    );
  }

  return authResult.userId!;
}

/**
 * Wraps a database operation with authentication validation
 * and proper error handling
 */
export async function withAuth<T>(
  operation: (userId: string) => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> {
  try {
    const userId = await ensureAuthenticated();
    return await operation(userId);
  } catch (error) {
    console.error(`[AuthHelper] ${operationName} failed:`, error);

    // Log the error for monitoring
    logError(error as Error, {
      component: 'AuthHelper',
      action: operationName,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
    });

    throw error;
  }
}

/**
 * Checks if the current user has sufficient balance for an operation
 */
export async function checkBalance(requiredAmount: number): Promise<boolean> {
  try {
    const authResult = await validateAuth();
    if (!authResult.isValid || !authResult.userId) {
      return false;
    }

    const user = await getMyProfile();

    if (!user || user.id !== authResult.userId) {
      console.error('[AuthHelper] Failed to fetch user balance');
      return false;
    }

    return (user.momenta_balance || 0) >= requiredAmount;
  } catch (error) {
    console.error('[AuthHelper] Balance check failed:', error);
    return false;
  }
}
