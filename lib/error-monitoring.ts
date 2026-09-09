import { logError } from './sentry';
import { supabase } from './supabase';
import { translate } from '@/lib/localization';

const errorMonitoringDebugLog = (...args: unknown[]) => {
  void args;
};

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  groupId?: string;
  challengeId?: string;
  errorType?: string;
  additionalData?: Record<string, unknown>;
}

export interface CreationAttempt {
  type: 'group' | 'challenge';
  userId: string;
  data: Record<string, unknown>;
  timestamp: string;
  success: boolean;
  error?: string;
}

/**
 * Enhanced error logging with context and monitoring
 */
export function logCreationError(
  error: Error,
  context: ErrorContext,
  attemptData?: Record<string, unknown>
) {
  console.error(`[${context.component}] ${context.action} failed:`, error);

  // Route technical diagnostics through the single crash-reporting service.
  logError(error, {
    ...context,
    errorMessage: error.message,
    stack: error.stack,
    attemptData,
  });

  // Store failed attempt for analysis
  if (attemptData && context.userId) {
    storeFailedAttempt({
      type: context.action.includes('group') ? 'group' : 'challenge',
      userId: context.userId,
      data: attemptData,
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
    }).catch(storeError => {
      console.error('[ErrorMonitoring] Failed to store attempt:', storeError);
    });
  }
}

/**
 * Log successful creation attempts
 */
export function logCreationSuccess(
  context: ErrorContext,
  attemptData: Record<string, unknown>
) {
  errorMonitoringDebugLog(`[${context.component}] ${context.action} succeeded`);

  // Store successful attempt
  if (context.userId) {
    storeFailedAttempt({
      type: context.action.includes('group') ? 'group' : 'challenge',
      userId: context.userId,
      data: attemptData,
      timestamp: new Date().toISOString(),
      success: true,
    }).catch(storeError => {
      console.error('[ErrorMonitoring] Failed to store success:', storeError);
    });
  }
}

/**
 * Store creation attempts in a local table for monitoring
 */
async function storeFailedAttempt(attempt: CreationAttempt) {
  try {
    // Create a simple attempts table if it doesn't exist
    await supabase.from('creation_attempts').insert({
      type: attempt.type,
      user_id: attempt.userId,
      data: attempt.data,
      timestamp: attempt.timestamp,
      success: attempt.success,
      error: attempt.error || null,
    });
  } catch (error) {
    // Don't throw - this is just for monitoring
    console.warn('[ErrorMonitoring] Could not store attempt:', error);
  }
}

/**
 * Get recent failed attempts for analysis
 */
export async function getRecentFailedAttempts(
  type?: 'group' | 'challenge',
  hours: number = 24
): Promise<CreationAttempt[]> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('creation_attempts')
      .select('*')
      .eq('success', false)
      .gte('timestamp', since)
      .order('timestamp', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ErrorMonitoring] Failed to fetch attempts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[ErrorMonitoring] Error fetching attempts:', error);
    return [];
  }
}

/**
 * Enhanced error handler for creation operations
 */
export function createErrorHandler(component: string, action: string) {
  return (
    error: Error,
    userId?: string,
    additionalData?: Record<string, unknown>
  ) => {
    logCreationError(error, {
      component,
      action,
      userId,
      additionalData,
    });
  };
}

/**
 * Check for common error patterns and provide user-friendly messages
 */
export function getFriendlyErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  // Normalize common Postgres/Supabase codes embedded in messages
  const errorCode = (error as Error & { code?: unknown }).code;
  const code =
    (typeof errorCode === 'string' ? errorCode : undefined) ||
    (/\b23\d{3}\b/.exec(error.message)?.[0] ?? '').toUpperCase();

  if (message.includes('unauthorized') || message.includes('auth')) {
    return translate('en-NZ', 'domain.monitoring.login_again');
  }

  if (message.includes('insufficient_balance') || message.includes('balance')) {
    return translate('en-NZ', 'domain.monitoring.more_momenta');
  }

  if (message.includes('network') || message.includes('timeout')) {
    return translate('en-NZ', 'domain.monitoring.network');
  }

  // Postgres check_violation (23514) — constraint failed
  if (
    code === '23514' ||
    message.includes('check constraint') ||
    message.includes('violates check')
  ) {
    if (message.includes('duration') || message.includes('days')) {
      return translate('en-NZ', 'domain.monitoring.duration_range');
    }
    if (message.includes('name') || message.includes('length')) {
      return translate('en-NZ', 'domain.monitoring.name_range');
    }
    return translate('en-NZ', 'domain.monitoring.invalid_values');
  }

  // Postgres unique_violation (23505) — only show duplicate message for entities where it makes sense
  if (
    code === '23505' ||
    message.includes('unique') ||
    message.includes('duplicate key')
  ) {
    if (message.includes('name') || message.includes('groups_name')) {
      return translate('en-NZ', 'domain.monitoring.group_name_exists');
    }
    if (message.includes('invite_code')) {
      return translate('en-NZ', 'domain.monitoring.invite_code_exists');
    }
    // Let specific screens decide exact copy; use neutral duplicate message
    return translate('en-NZ', 'domain.monitoring.already_exists');
  }

  // Postgres foreign_key_violation (23503)
  if (
    code === '23503' ||
    message.includes('foreign key') ||
    message.includes('violates foreign key')
  ) {
    return translate('en-NZ', 'domain.monitoring.referenced_item_missing');
  }

  // Postgres not_null_violation (23502)
  if (
    code === '23502' ||
    message.includes('null value') ||
    message.includes('not-null')
  ) {
    return translate('en-NZ', 'domain.monitoring.required_missing');
  }

  // RLS/permission/beta restrictions
  if (
    message.includes('permission denied') ||
    message.includes('violates row-level security') ||
    message.includes('not allowed') ||
    message.includes('forbidden') ||
    message.includes('rls')
  ) {
    return translate('en-NZ', 'domain.monitoring.access_denied');
  }

  if (message.includes('permission') || message.includes('forbidden')) {
    return translate('en-NZ', 'domain.monitoring.permission_denied');
  }

  // Rate limiting
  if (message.includes('too many') || message.includes('rate limit')) {
    return translate('en-NZ', 'domain.monitoring.rate_limited');
  }

  // Quota/limit errors
  if (message.includes('quota') || message.includes('limit exceeded')) {
    return translate('en-NZ', 'domain.monitoring.usage_limit');
  }

  // Default fallback
  return translate('en-NZ', 'domain.monitoring.generic');
}

/**
 * Retry logic for transient errors
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry for certain types of errors
      if (isNonRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError!;
}

/**
 * Determine if an error should not be retried
 */
function isNonRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  return (
    message.includes('unauthorized') ||
    message.includes('permission') ||
    message.includes('forbidden') ||
    message.includes('invalid') ||
    message.includes('duplicate') ||
    message.includes('already exists')
  );
}
