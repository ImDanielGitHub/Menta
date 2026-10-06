import { supabase } from './supabase';
import { showGlobalToast } from './toast-provider';
import { translate } from '@/lib/localization';

const EDGE_TOAST_ERROR = 'error' as const;

/**
 * Centralized edge function caller with error handling
 * Wraps all supabase.functions.invoke calls with consistent error handling
 */
export async function callEdgeFunction<
  TRequest = Record<string, unknown>,
  TResponse = unknown,
>(
  functionName: string,
  body?: TRequest,
  options?: {
    showUserError?: boolean; // Whether to show user-friendly error messages
    userErrorMessage?: string; // Custom error message for users
  }
): Promise<TResponse> {
  const { showUserError = true, userErrorMessage } = options || {};

  try {
    // Attach current user's access token explicitly to avoid missing-sub / missing Authorization issues
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const { data, error } = await supabase.functions.invoke<TResponse>(
      functionName,
      {
        body: body as NonNullable<
          Parameters<typeof supabase.functions.invoke>[1]
        >['body'],
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      }
    );

    if (error) {
      console.error(`❌ Edge function ${functionName} returned error:`, error);
      throw error;
    }

    if (!data) {
      const noDataError = new Error(
        `Edge function ${functionName} returned no data`
      );
      console.error(`❌ ${noDataError.message}`);
      throw noDataError;
    }

    return data;
  } catch (err: unknown) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? err.message
        : undefined;
    const errorMessage =
      typeof message === 'string' && message
        ? message
        : `Failed to call ${functionName}`;
    console.error(`🔥 Edge function ${functionName} failed:`, err);

    // Show user-friendly error if requested
    if (showUserError) {
      const displayMessage =
        userErrorMessage ||
        translate('en-NZ', 'domain.edge.failed', {
          functionName: functionName.replace('-', ' '),
        });

      // Use global toast for better UX; callers still receive the thrown error.
      try {
        showGlobalToast(displayMessage, EDGE_TOAST_ERROR);
      } catch (toastError) {
        console.warn('Failed to show edge-function error toast:', toastError);
      }
    }

    // Re-throw the error so callers can handle it if needed
    throw new Error(errorMessage);
  }
}

/**
 * Wrapper for maintenance/admin functions with specific error handling
 */
export async function callMaintenanceFunction<
  TRequest = Record<string, unknown>,
  TResponse = unknown,
>(functionName: string, body?: TRequest): Promise<TResponse> {
  return callEdgeFunction(functionName, body, {
    showUserError: true,
    userErrorMessage: translate('en-NZ', 'domain.edge.maintenance_failed'),
  });
}

/**
 * Wrapper for user-facing functions with friendly error messages
 */
export async function callUserFunction<
  TRequest = Record<string, unknown>,
  TResponse = unknown,
>(
  functionName: string,
  body?: TRequest,
  friendlyName?: string
): Promise<TResponse> {
  const displayName = friendlyName || functionName.replace('-', ' ');
  return callEdgeFunction(functionName, body, {
    showUserError: true,
    userErrorMessage: translate('en-NZ', 'domain.edge.user_failed', {
      displayName,
    }),
  });
}
