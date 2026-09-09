/**
 * Error State Components
 * Provides contextual error states for different scenarios with recovery actions
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { AppButton } from './AppButton';
import { MentaMascot } from './MentaMascot';
import {
  AlertCircleIcon,
  CameraIcon,
  ShieldIcon,
  UploadIcon,
  WifiOffIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { useTranslation } from '@/lib/localization/use-translation';

type ErrorStateTone = 'error' | 'warning' | 'info';

interface BaseErrorStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  iconFramed?: boolean;
  primaryAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  tone?: ErrorStateTone;
  testID?: string;
}

const BaseErrorState: React.FC<BaseErrorStateProps> = ({
  title,
  message,
  icon,
  iconFramed = true,
  primaryAction,
  secondaryAction,
  style,
  compact = false,
  tone = 'error',
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors, spacing, typography } = theme;
  const toneColor =
    tone === 'warning'
      ? colors.status.warning
      : tone === 'info'
        ? colors.status.info
        : colors.status.error;

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: compact ? spacing[4] : spacing[6],
    },
    iconContainer: {
      marginBottom: spacing[4],
      padding: spacing[3],
      borderRadius: compact ? 20 : 32,
      backgroundColor: toneColor + '15',
    },
    unframedIcon: {
      marginBottom: spacing[4],
    },
    title: {
      ...typography.h3,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing[2],
    },
    message: {
      ...typography.body,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing[6],
      alignSelf: 'stretch',
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: compact ? 'row' : 'column',
      gap: spacing[3],
      width: '100%',
    },
  });

  return (
    <View
      accessible
      accessibilityRole={tone === 'info' ? 'summary' : 'alert'}
      accessibilityLabel={t('shared.accessibility.choiceSummary', {
        title,
        description: message,
      })}
      testID={testID}
      style={[styles.container, style]}
    >
      {icon && (
        <View style={iconFramed ? styles.iconContainer : styles.unframedIcon}>
          {icon}
        </View>
      )}

      <Text selectable style={styles.title}>
        {title}
      </Text>
      <Text selectable style={styles.message}>
        {message}
      </Text>

      <View style={styles.buttonContainer}>
        {primaryAction && (
          <AppButton
            title={primaryAction.label}
            onPress={primaryAction.onPress}
            variant="primary"
            loading={primaryAction.loading}
            fullWidth={!compact}
            size={compact ? 'small' : 'medium'}
          />
        )}

        {secondaryAction && (
          <AppButton
            title={secondaryAction.label}
            onPress={secondaryAction.onPress}
            variant="outline"
            fullWidth={!compact}
            size={compact ? 'small' : 'medium'}
          />
        )}
      </View>
    </View>
  );
};

interface NetworkErrorStateProps {
  onRetry: () => void;
  onGoOffline?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({
  onRetry,
  onGoOffline,
  retrying = false,
  compact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <BaseErrorState
      title={t('shared.error.network.title')}
      message={t('shared.error.network.message')}
      icon={
        <WifiOffIcon
          size={compact ? 20 : 24}
          color={theme.colors.status.error}
        />
      }
      primaryAction={{
        label: t('shared.action.retryConnection'),
        onPress: onRetry,
        loading: retrying,
      }}
      secondaryAction={
        onGoOffline
          ? {
              label: t('shared.action.workOffline'),
              onPress: onGoOffline,
            }
          : undefined
      }
      compact={compact}
    />
  );
};

interface CameraErrorStateProps {
  onRetry: () => void;
  onOpenSettings: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export const CameraErrorState: React.FC<CameraErrorStateProps> = ({
  onRetry,
  onOpenSettings,
  retrying = false,
  compact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <BaseErrorState
      title={t('shared.error.camera.title')}
      message={t('shared.error.camera.message')}
      icon={
        <CameraIcon
          size={compact ? 20 : 24}
          color={theme.colors.status.error}
        />
      }
      primaryAction={{
        label: t('shared.action.tryCameraAgain'),
        onPress: onRetry,
        loading: retrying,
      }}
      secondaryAction={{
        label: t('shared.action.openSettings'),
        onPress: onOpenSettings,
      }}
      compact={compact}
    />
  );
};

interface UploadErrorStateProps {
  onRetry: () => void;
  onSaveDraft?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export const UploadErrorState: React.FC<UploadErrorStateProps> = ({
  onRetry,
  onSaveDraft,
  retrying = false,
  compact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <BaseErrorState
      title={t('shared.error.upload.title')}
      message={t('shared.error.upload.message')}
      icon={
        <UploadIcon
          size={compact ? 20 : 24}
          color={theme.colors.status.error}
        />
      }
      primaryAction={{
        label: t('shared.action.retryUpload'),
        onPress: onRetry,
        loading: retrying,
      }}
      secondaryAction={
        onSaveDraft
          ? {
              label: t('shared.action.saveProofForLater'),
              onPress: onSaveDraft,
            }
          : undefined
      }
      compact={compact}
    />
  );
};

interface AuthErrorStateProps {
  onLogin: () => void;
  onCreateAccount?: () => void;
  compact?: boolean;
}

export const AuthErrorState: React.FC<AuthErrorStateProps> = ({
  onLogin,
  onCreateAccount,
  compact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <BaseErrorState
      title={t('shared.error.auth.title')}
      message={t('shared.error.auth.message')}
      icon={
        <ShieldIcon
          size={compact ? 20 : 24}
          color={theme.colors.status.error}
        />
      }
      primaryAction={{
        label: t('shared.action.signInNow'),
        onPress: onLogin,
      }}
      secondaryAction={
        onCreateAccount
          ? {
              label: t('shared.action.createAccount'),
              onPress: onCreateAccount,
            }
          : undefined
      }
      compact={compact}
    />
  );
};

interface SubmissionErrorStateProps {
  onRetry: () => void;
  onSaveForLater?: () => void;
  onContactSupport?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export const SubmissionErrorState: React.FC<SubmissionErrorStateProps> = ({
  onRetry,
  onSaveForLater,
  onContactSupport,
  retrying = false,
  compact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <BaseErrorState
      title={t('shared.error.submission.title')}
      message={t('shared.error.submission.message')}
      icon={
        <XCircleIcon
          size={compact ? 20 : 24}
          color={theme.colors.status.error}
        />
      }
      primaryAction={{
        label: t('shared.action.retrySubmission'),
        onPress: onRetry,
        loading: retrying,
      }}
      secondaryAction={
        onSaveForLater
          ? {
              label: t('shared.action.saveForLater'),
              onPress: onSaveForLater,
            }
          : onContactSupport
            ? {
                label: t('shared.action.contactSupport'),
                onPress: onContactSupport,
              }
            : undefined
      }
      compact={compact}
    />
  );
};

interface ValidationErrorStateProps {
  title?: string;
  message: string;
  onFix: () => void;
  onHelp?: () => void;
  compact?: boolean;
}

export const ValidationErrorState: React.FC<ValidationErrorStateProps> = ({
  title,
  message,
  onFix,
  onHelp,
  compact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <BaseErrorState
      title={title ?? t('shared.error.validation.title')}
      message={message}
      icon={
        <AlertCircleIcon
          size={compact ? 20 : 24}
          color={theme.colors.status.warning}
        />
      }
      primaryAction={{
        label: t('shared.action.fixDetails'),
        onPress: onFix,
      }}
      secondaryAction={
        onHelp
          ? {
              label: t('shared.action.getHelp'),
              onPress: onHelp,
            }
          : undefined
      }
      compact={compact}
      tone="warning"
    />
  );
};

interface GenericErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  onGoHome?: () => void;
  onContactSupport?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export const GenericErrorState: React.FC<GenericErrorStateProps> = ({
  title,
  message,
  onRetry,
  onGoHome,
  onContactSupport,
  retrying = false,
  compact = false,
}) => {
  const { t } = useTranslation();
  return (
    <BaseErrorState
      title={title ?? t('shared.error.generic.title')}
      message={message ?? t('shared.error.generic.message')}
      icon={
        <MentaMascot
          size={compact ? 'sm' : 'md'}
          state="calm-warning"
          testID="generic-error-mascot"
        />
      }
      iconFramed={false}
      primaryAction={{
        label: t('shared.action.tryAgain'),
        onPress: onRetry,
        loading: retrying,
      }}
      secondaryAction={
        onGoHome
          ? {
              label: t('shared.action.backToday'),
              onPress: onGoHome,
            }
          : onContactSupport
            ? {
                label: t('shared.action.contactSupport'),
                onPress: onContactSupport,
              }
            : undefined
      }
      compact={compact}
    />
  );
};

export default BaseErrorState;
