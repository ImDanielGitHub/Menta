import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  WifiOffIcon,
} from '@/components/ui/icons';
import {
  ThemeContextType,
  useTheme,
  useThemedStyles,
} from '@/constants/ThemeContext';
import { AppButton } from './AppButton';
import { useTranslation } from '@/lib/localization/use-translation';
import { translate } from '@/lib/localization/translate';

export interface NetworkError {
  code?: string;
  message: string;
  statusCode?: number;
  isNetworkError?: boolean;
  isTimeout?: boolean;
}

interface NetworkErrorHandlerProps {
  error: NetworkError | Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
  compact?: boolean;
}

export const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  showDismiss = false,
  compact = false,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const getErrorInfo = () => {
    let errorMessage = '';
    let errorType: 'network' | 'timeout' | 'server' | 'unknown' = 'unknown';
    let statusCode: number | undefined;

    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = error.message;
      statusCode = error.statusCode;
      if (error.isNetworkError) errorType = 'network';
      if (error.isTimeout) errorType = 'timeout';
    }

    // Detect common network error patterns
    if (
      errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('connection') ||
      errorMessage.toLowerCase().includes('fetch')
    ) {
      errorType = 'network';
    } else if (errorMessage.toLowerCase().includes('timeout')) {
      errorType = 'timeout';
    } else if (statusCode && statusCode >= 500) {
      errorType = 'server';
    }

    return { errorMessage, errorType, statusCode };
  };

  const { errorMessage, errorType, statusCode } = getErrorInfo();

  const getErrorConfig = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: (
            <WifiOffIcon size={compact ? 20 : 24} color={colors.status.error} />
          ),
          title: t('shared.error.networkHandler.network.title'),
          message: t('shared.error.network.message'),
          backgroundColor: colors.status.error + '10',
          borderColor: colors.status.error + '30',
        };
      case 'timeout':
        return {
          icon: (
            <AlertTriangleIcon
              size={compact ? 20 : 24}
              color={colors.status.warning}
            />
          ),
          title: t('shared.error.networkHandler.timeout.title'),
          message: t('shared.error.networkHandler.timeout.message'),
          backgroundColor: colors.status.warning + '10',
          borderColor: colors.status.warning + '30',
        };
      case 'server':
        return {
          icon: (
            <AlertTriangleIcon
              size={compact ? 20 : 24}
              color={colors.status.error}
            />
          ),
          title: t('shared.error.networkHandler.server.title'),
          message: statusCode
            ? t('shared.error.networkHandler.server.withStatus', {
                status: statusCode,
              })
            : t('shared.error.networkHandler.server.withoutStatus'),
          backgroundColor: colors.status.error + '10',
          borderColor: colors.status.error + '30',
        };
      default:
        return {
          icon: (
            <AlertTriangleIcon
              size={compact ? 20 : 24}
              color={colors.status.warning}
            />
          ),
          title: t('shared.error.networkHandler.unknown.title'),
          message:
            errorMessage || t('shared.error.networkHandler.unknown.message'),
          backgroundColor: colors.status.warning + '10',
          borderColor: colors.status.warning + '30',
        };
    }
  };

  const config = getErrorConfig();

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            backgroundColor: config.backgroundColor,
            borderColor: config.borderColor,
          },
        ]}
      >
        <View style={styles.compactContent}>
          {config.icon}
          <Text style={[styles.compactMessage, { color: colors.text.primary }]}>
            {config.message}
          </Text>
          {showRetry && onRetry && (
            <TouchableOpacity
              style={styles.compactRetryButton}
              onPress={onRetry}
            >
              <RefreshCwIcon size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{config.icon}</View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {config.title}
          </Text>
          <Text style={[styles.message, { color: colors.text.secondary }]}>
            {config.message}
          </Text>
          {__DEV__ && errorMessage && (
            <Text
              style={[styles.debugMessage, { color: colors.text.tertiary }]}
            >
              {t('shared.error.debug', { message: errorMessage })}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {showRetry && onRetry && (
          <AppButton
            title={
              errorType === 'network'
                ? t('shared.action.retryConnection')
                : t('shared.action.tryAgain')
            }
            onPress={onRetry}
            variant="primary"
            size="small"
            icon={<RefreshCwIcon size={16} color={colors.text.inverse} />}
            style={styles.retryButton}
          />
        )}
        {showDismiss && onDismiss && (
          <AppButton
            title={t('shared.action.keepCurrentScreen')}
            onPress={onDismiss}
            variant="secondary"
            size="small"
            style={styles.dismissButton}
          />
        )}
      </View>
    </View>
  );
};

// Hook for handling network errors with automatic retry logic
export const useNetworkErrorHandler = () => {
  const [retryCount, setRetryCount] = React.useState(0);
  const { t } = useTranslation();
  const maxRetries = 3;

  const handleNetworkError = React.useCallback(
    (error: unknown, retryFn?: () => Promise<unknown>) => {
      const canRetry = retryCount < maxRetries && Boolean(retryFn);
      const errorObject =
        typeof error === 'object' && error !== null
          ? (error as {
              code?: unknown;
              message?: unknown;
              name?: unknown;
              status?: unknown;
              statusCode?: unknown;
            })
          : null;
      const message =
        error instanceof Error
          ? error.message
          : typeof errorObject?.message === 'string'
            ? errorObject.message
            : typeof error === 'string'
              ? error
              : t('shared.error.networkHandler.network.title');
      const name =
        error instanceof Error
          ? error.name
          : typeof errorObject?.name === 'string'
            ? errorObject.name
            : '';
      const status =
        typeof errorObject?.status === 'number'
          ? errorObject.status
          : typeof errorObject?.statusCode === 'number'
            ? errorObject.statusCode
            : undefined;

      const errorInfo: NetworkError = {
        message,
        isNetworkError:
          name === 'TypeError' && message.toLowerCase().includes('fetch'),
        isTimeout:
          name === 'AbortError' || message.toLowerCase().includes('timeout'),
        statusCode: status,
        code:
          typeof errorObject?.code === 'string' ? errorObject.code : undefined,
      };

      const retry = async () => {
        if (canRetry && retryFn) {
          setRetryCount(prev => prev + 1);
          try {
            await retryFn();
            setRetryCount(0); // Reset on success
          } catch (retryError) {
            // Handle retry failure
            throw retryError;
          }
        }
      };

      return {
        error: errorInfo,
        canRetry,
        retry,
        retryCount,
        resetRetryCount: () => setRetryCount(0),
      };
    },
    [retryCount, t]
  );

  return handleNetworkError;
};

// Utility function to create standardized network errors
export const createNetworkError = (
  message: string,
  options?: {
    isNetworkError?: boolean;
    isTimeout?: boolean;
    statusCode?: number;
    code?: string;
  }
): NetworkError => ({
  message,
  ...options,
});

// Common network error messages
export const getNetworkErrorMessages = (locale?: string) => ({
  CONNECTION_FAILED: translate(
    locale,
    'shared.error.networkHandler.networkMessages'
  ),
  TIMEOUT: translate(locale, 'shared.error.networkHandler.timeoutMessage'),
  SERVER_ERROR: translate(locale, 'shared.error.networkHandler.serverMessage'),
  NOT_FOUND: translate(locale, 'shared.error.networkHandler.notFoundMessage'),
  UNAUTHORIZED: translate(
    locale,
    'shared.error.networkHandler.unauthorisedMessage'
  ),
  FORBIDDEN: translate(locale, 'shared.error.networkHandler.forbiddenMessage'),
  BAD_REQUEST: translate(
    locale,
    'shared.error.networkHandler.badRequestMessage'
  ),
  UNKNOWN: translate(locale, 'shared.error.networkHandler.unknownMessage'),
});

/** Backwards-compatible English snapshot for non-rendering callers. */
export const NetworkErrorMessages = getNetworkErrorMessages('en-NZ');

const createStyles = (_theme: ThemeContextType) =>
  StyleSheet.create({
    container: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 16,
      margin: 16,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    iconContainer: {
      marginRight: 12,
      marginTop: 2,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
    },
    debugMessage: {
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    retryButton: {
      minWidth: 100,
    },
    dismissButton: {
      minWidth: 80,
    },
    compactContainer: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
      marginVertical: 4,
    },
    compactContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    compactMessage: {
      fontSize: 14,
      flex: 1,
      marginLeft: 8,
      marginRight: 8,
    },
    compactRetryButton: {
      padding: 4,
    },
  });
