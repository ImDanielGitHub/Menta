/**
 * Comprehensive Error Handling System
 * Provides contextual error messages, recovery actions, and user-friendly error states
 */

import { showToast } from '@/components/ui/Toast';
import { emitHaptic } from '@/lib/motion/haptics';
import { translate } from '@/lib/localization';

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  SUBMISSION = 'submission',
  REVIEW = 'review',
  CAMERA = 'camera',
  UPLOAD = 'upload',
  DATABASE = 'database',
  CHALLENGE_STATE = 'challenge_state',
  GROUP = 'group',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  recoveryActions: RecoveryAction[];
  metadata?: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  challengeId?: string;
  groupId?: string;
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  isPrimary?: boolean;
  icon?: string;
}

class ErrorHandler {
  private errorHistory: ErrorContext[] = [];
  private maxHistorySize = 50;

  /**
   * Handle an error with contextual information and recovery options
   */
  handleError(
    error: Error | string,
    context?: Partial<ErrorContext>
  ): ErrorContext {
    const errorContext = this.createErrorContext(error, context);

    // Add to history
    this.errorHistory.unshift(errorContext);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.pop();
    }

    // Log error for debugging
    console.error(`[${errorContext.type}] ${errorContext.message}`, {
      severity: errorContext.severity,
      metadata: errorContext.metadata,
      timestamp: errorContext.timestamp,
    });

    // Show user-facing error message
    this.showUserError(errorContext);

    if (
      errorContext.severity === ErrorSeverity.HIGH ||
      errorContext.severity === ErrorSeverity.CRITICAL
    ) {
      void emitHaptic({ type: 'error' });
    }

    return errorContext;
  }

  /**
   * Create standardized error context
   */
  private createErrorContext(
    error: Error | string,
    context?: Partial<ErrorContext>
  ): ErrorContext {
    const message = typeof error === 'string' ? error : error.message;
    const type = context?.type || this.inferErrorType(message);
    const severity = context?.severity || this.inferSeverity(type, message);

    return {
      type,
      severity,
      message,
      userMessage:
        context?.userMessage || this.generateUserMessage(type, message),
      recoveryActions:
        context?.recoveryActions || this.generateRecoveryActions(type),
      metadata: context?.metadata || {},
      timestamp: new Date(),
      userId: context?.userId,
      challengeId: context?.challengeId,
      groupId: context?.groupId,
    };
  }

  /**
   * Infer error type from error message
   */
  private inferErrorType(message: string): ErrorType {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('timeout')
    ) {
      return ErrorType.NETWORK;
    }
    if (
      lowerMessage.includes('auth') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('forbidden')
    ) {
      return ErrorType.AUTHENTICATION;
    }
    if (
      lowerMessage.includes('permission') ||
      lowerMessage.includes('denied')
    ) {
      return ErrorType.PERMISSION;
    }
    if (
      lowerMessage.includes('validation') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('required')
    ) {
      return ErrorType.VALIDATION;
    }
    if (
      lowerMessage.includes('camera') ||
      lowerMessage.includes('photo') ||
      lowerMessage.includes('video')
    ) {
      return ErrorType.CAMERA;
    }
    if (lowerMessage.includes('upload') || lowerMessage.includes('file')) {
      return ErrorType.UPLOAD;
    }
    if (
      lowerMessage.includes('database') ||
      lowerMessage.includes('query') ||
      lowerMessage.includes('sql')
    ) {
      return ErrorType.DATABASE;
    }
    if (lowerMessage.includes('challenge') || lowerMessage.includes('state')) {
      return ErrorType.CHALLENGE_STATE;
    }
    if (lowerMessage.includes('group') || lowerMessage.includes('member')) {
      return ErrorType.GROUP;
    }
    if (lowerMessage.includes('review') || lowerMessage.includes('approval')) {
      return ErrorType.REVIEW;
    }
    if (
      lowerMessage.includes('submit') ||
      lowerMessage.includes('verification')
    ) {
      return ErrorType.SUBMISSION;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Infer error severity
   */
  private inferSeverity(type: ErrorType, message: string): ErrorSeverity {
    const lowerMessage = message.toLowerCase();

    // Critical errors that block core functionality
    if (type === ErrorType.AUTHENTICATION || type === ErrorType.DATABASE) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors that significantly impact UX
    if (
      type === ErrorType.CAMERA ||
      type === ErrorType.UPLOAD ||
      type === ErrorType.SUBMISSION
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity for feature-specific issues
    if (
      type === ErrorType.REVIEW ||
      type === ErrorType.GROUP ||
      type === ErrorType.CHALLENGE_STATE
    ) {
      return ErrorSeverity.MEDIUM;
    }

    // Network errors vary by context
    if (type === ErrorType.NETWORK) {
      if (
        lowerMessage.includes('timeout') ||
        lowerMessage.includes('offline')
      ) {
        return ErrorSeverity.HIGH;
      }
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Generate user-friendly error messages
   */
  private generateUserMessage(
    type: ErrorType,
    _originalMessage: string
  ): string {
    switch (type) {
      case ErrorType.NETWORK:
        return translate('en-NZ', 'domain.error.network');

      case ErrorType.AUTHENTICATION:
        return translate('en-NZ', 'domain.error.authentication');

      case ErrorType.PERMISSION:
        return translate('en-NZ', 'domain.error.permission');

      case ErrorType.VALIDATION:
        return translate('en-NZ', 'domain.error.validation');

      case ErrorType.CAMERA:
        return translate('en-NZ', 'domain.error.camera');

      case ErrorType.UPLOAD:
        return translate('en-NZ', 'domain.error.upload');

      case ErrorType.SUBMISSION:
        return translate('en-NZ', 'domain.error.submission');

      case ErrorType.REVIEW:
        return translate('en-NZ', 'domain.error.review');

      case ErrorType.DATABASE:
        return translate('en-NZ', 'domain.error.database');

      case ErrorType.CHALLENGE_STATE:
        return translate('en-NZ', 'domain.error.challenge');

      case ErrorType.GROUP:
        return translate('en-NZ', 'domain.error.group');

      case ErrorType.UNKNOWN:
      default:
        return translate('en-NZ', 'domain.error.unknown');
    }
  }

  /**
   * Generate contextual recovery actions
   */
  private generateRecoveryActions(type: ErrorType): RecoveryAction[] {
    const baseActions: RecoveryAction[] = [
      {
        label: translate('en-NZ', 'domain.action.try_again'),
        action: () => {
          // This will be overridden by the calling component
        },
        isPrimary: true,
        icon: 'refresh-cw',
      },
    ];

    switch (type) {
      case ErrorType.NETWORK:
        return [
          ...baseActions,
          {
            label: translate('en-NZ', 'domain.action.check_connection'),
            action: () => {
              showToast.info(
                translate('en-NZ', 'domain.error.connection_tips'),
                translate('en-NZ', 'domain.error.connection_tips_body')
              );
            },
            icon: 'wifi',
          },
        ];

      case ErrorType.AUTHENTICATION:
        return [
          {
            label: translate('en-NZ', 'domain.action.log_in'),
            action: () => {
              // Navigation to login will be handled by calling component
            },
            isPrimary: true,
            icon: 'log-in',
          },
        ];

      case ErrorType.PERMISSION:
        return [
          {
            label: translate('en-NZ', 'domain.action.grant_permissions'),
            action: () => {
              // Permission request will be handled by calling component
            },
            isPrimary: true,
            icon: 'shield-check',
          },
          {
            label: translate('en-NZ', 'domain.action.open_settings'),
            action: () => {
              // Settings navigation will be handled by calling component
            },
            icon: 'settings',
          },
        ];

      case ErrorType.CAMERA:
        return [
          ...baseActions,
          {
            label: translate('en-NZ', 'domain.action.check_permissions'),
            action: () => {
              showToast.info(
                translate('en-NZ', 'domain.error.camera_permissions'),
                translate('en-NZ', 'domain.error.camera_permissions_body')
              );
            },
            icon: 'camera',
          },
        ];

      case ErrorType.UPLOAD:
        return [
          ...baseActions,
          {
            label: translate('en-NZ', 'domain.action.save_draft'),
            action: () => {
              // Draft saving will be handled by calling component
            },
            icon: 'save',
          },
        ];

      case ErrorType.SUBMISSION:
        return [
          {
            label: translate('en-NZ', 'domain.action.retry_submission'),
            action: () => {
              // Retry logic will be handled by calling component
            },
            isPrimary: true,
            icon: 'upload',
          },
          {
            label: translate('en-NZ', 'domain.action.save_for_later'),
            action: () => {
              // Draft saving will be handled by calling component
            },
            icon: 'clock',
          },
        ];

      default:
        return baseActions;
    }
  }

  /**
   * Show user-facing error message
   */
  private showUserError(errorContext: ErrorContext): void {
    const toastType = this.getToastType(errorContext.severity);
    const primaryAction = errorContext.recoveryActions.find(
      action => action.isPrimary
    );

    showToast[toastType](
      this.getErrorTitle(errorContext.type),
      errorContext.userMessage,
      {
        duration: this.getToastDuration(errorContext.severity),
        action: primaryAction
          ? {
              label: primaryAction.label,
              onPress: primaryAction.action,
            }
          : undefined,
      }
    );
  }

  /**
   * Get toast type based on severity
   */
  private getToastType(severity: ErrorSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }

  /**
   * Get error title based on type
   */
  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return translate('en-NZ', 'domain.error.title.network');
      case ErrorType.AUTHENTICATION:
        return translate('en-NZ', 'domain.error.title.authentication');
      case ErrorType.PERMISSION:
        return translate('en-NZ', 'domain.error.title.permission');
      case ErrorType.VALIDATION:
        return translate('en-NZ', 'domain.error.title.validation');
      case ErrorType.CAMERA:
        return translate('en-NZ', 'domain.error.title.camera');
      case ErrorType.UPLOAD:
        return translate('en-NZ', 'domain.error.title.upload');
      case ErrorType.SUBMISSION:
        return translate('en-NZ', 'domain.error.title.submission');
      case ErrorType.REVIEW:
        return translate('en-NZ', 'domain.error.title.review');
      case ErrorType.DATABASE:
        return translate('en-NZ', 'domain.error.title.database');
      case ErrorType.CHALLENGE_STATE:
        return translate('en-NZ', 'domain.error.title.challenge');
      case ErrorType.GROUP:
        return translate('en-NZ', 'domain.error.title.group');
      case ErrorType.UNKNOWN:
      default:
        return translate('en-NZ', 'domain.error.title.unknown');
    }
  }

  /**
   * Get toast duration based on severity
   */
  private getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 8000; // 8 seconds
      case ErrorSeverity.HIGH:
        return 6000; // 6 seconds
      case ErrorSeverity.MEDIUM:
        return 4000; // 4 seconds
      case ErrorSeverity.LOW:
      default:
        return 3000; // 3 seconds
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(): ErrorContext[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get recent errors of specific type
   */
  getRecentErrors(type?: ErrorType, limit: number = 10): ErrorContext[] {
    let errors = this.errorHistory;

    if (type) {
      errors = errors.filter(error => error.type === type);
    }

    return errors.slice(0, limit);
  }

  /**
   * Check if error type has occurred recently
   */
  hasRecentError(type: ErrorType, withinMinutes: number = 5): boolean {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    return this.errorHistory.some(
      error => error.type === type && error.timestamp > cutoff
    );
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Utility functions for common error scenarios
export const handleNetworkError = (
  error: Error,
  context?: Partial<ErrorContext>
) => {
  return errorHandler.handleError(error, {
    type: ErrorType.NETWORK,
    ...context,
  });
};

export const handleAuthError = (
  error: Error,
  context?: Partial<ErrorContext>
) => {
  return errorHandler.handleError(error, {
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.CRITICAL,
    ...context,
  });
};

export const handleCameraError = (
  error: Error,
  context?: Partial<ErrorContext>
) => {
  return errorHandler.handleError(error, {
    type: ErrorType.CAMERA,
    severity: ErrorSeverity.HIGH,
    ...context,
  });
};

export const handleUploadError = (
  error: Error,
  context?: Partial<ErrorContext>
) => {
  return errorHandler.handleError(error, {
    type: ErrorType.UPLOAD,
    severity: ErrorSeverity.HIGH,
    ...context,
  });
};

export const handleSubmissionError = (
  error: Error,
  context?: Partial<ErrorContext>
) => {
  return errorHandler.handleError(error, {
    type: ErrorType.SUBMISSION,
    severity: ErrorSeverity.HIGH,
    ...context,
  });
};

export const handleValidationError = (
  message: string,
  context?: Partial<ErrorContext>
) => {
  return errorHandler.handleError(message, {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    ...context,
  });
};

export const handleDatabaseError = (
  error: Error,
  context?: Partial<ErrorContext>
) => {
  return errorHandler.handleError(error, {
    type: ErrorType.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    ...context,
  });
};

export default errorHandler;
