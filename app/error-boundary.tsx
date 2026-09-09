import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router as expoRouter, useRouter } from 'expo-router';
import {
  captureError as sentryCapture,
  addBreadcrumb as sentryBreadcrumb,
  setRuntimeContext,
} from '@/lib/sentry';
import {
  AppButton,
  AppInlineNotice,
  AppScreen,
  AppTopBar,
} from '@/components/ui';
import { SupportPageHeader } from '@/components/support/SupportPageHeader';
import {
  SupportIconTile,
  SupportLedgerCard,
} from '@/components/support/SupportSurface';
import { AlertCircleIcon, AlertTriangleIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { useTranslation } from '@/lib/localization/use-translation';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError?: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  translate?: (
    key: TranslationKey,
    values?: Record<string, string | number>
  ) => string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  reportAcknowledged: boolean;
}

const DEFAULT_ERROR_BOUNDARY_COPY: Partial<
  Record<TranslationKey, (values: Record<string, string | number>) => string>
> = {
  'shared.rootError.title': values =>
    translate('en-NZ', 'shared.rootError.title', values),
  'shared.rootError.description': values =>
    translate('en-NZ', 'shared.rootError.description', values),
  'shared.rootError.supportReference': values =>
    translate('en-NZ', 'shared.rootError.supportReference', values),
  'shared.rootError.generatingReference': values =>
    translate('en-NZ', 'shared.rootError.generatingReference', values),
  'shared.rootError.reportIncluded': values =>
    translate('en-NZ', 'shared.rootError.reportIncluded', values),
  'shared.rootError.noStateChangedDescription': values =>
    translate('en-NZ', 'shared.rootError.noStateChangedDescription', values),
  'shared.rootError.noStateChanged': values =>
    translate('en-NZ', 'shared.rootError.noStateChanged', values),
  'shared.action.tryAgain': values =>
    translate('en-NZ', 'shared.action.tryAgain', values),
  'shared.rootError.reportFormOpened': values =>
    translate('en-NZ', 'shared.rootError.reportFormOpened', values),
  'shared.action.reportIssue': values =>
    translate('en-NZ', 'shared.action.reportIssue', values),
  'shared.rootError.linkOutOfDate': values =>
    translate('en-NZ', 'shared.rootError.linkOutOfDate', values),
  'shared.rootError.linkDidNotChange': values =>
    translate('en-NZ', 'shared.rootError.linkDidNotChange', values),
  'shared.rootError.linkedItemMoved': values =>
    translate('en-NZ', 'shared.rootError.linkedItemMoved', values),
  'shared.rootError.returnSupport': values =>
    translate('en-NZ', 'shared.rootError.returnSupport', values),
};

const defaultErrorBoundaryTranslate = (
  key: TranslationKey,
  values: Record<string, string | number> = {}
): string => DEFAULT_ERROR_BOUNDARY_COPY[key]?.(values) ?? key;

// Web-specific error forwarding removed since web is not supported

export class ErrorBoundaryBase extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      reportAcknowledged: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId, reportAcknowledged: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Sentry is the single crash-reporting owner for this boundary.
    try {
      sentryBreadcrumb('React ErrorBoundary triggered', {
        component: 'RootErrorBoundary',
      });
      sentryCapture(error, {
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
      });
    } catch {}

    setRuntimeContext({
      appState: 'crashed',
      memoryWarning: false,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    setRuntimeContext({
      appState: 'recovered',
    });

    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      reportAcknowledged: false,
    });
  };

  handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      try {
        sentryBreadcrumb('User acknowledged crash report', {
          component: 'RootErrorBoundary',
          errorId: this.state.errorId,
        });
      } catch {}

      this.setState({ reportAcknowledged: true });
      expoRouter.push({
        pathname: '/report-issue',
        params: {
          source: 'error_boundary',
          crashReference: this.state.errorId,
        },
      });
    }
  };

  render() {
    const t = this.props.translate ?? defaultErrorBoundaryTranslate;
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error || undefined}
            resetError={this.handleRetry}
          />
        );
      }

      return (
        <AppScreen
          lane="focused"
          hasTabBar={false}
          scrollable
          contentContainerStyle={styles.crashScreen}
          testID="app-recovery-screen"
        >
          <AppTopBar />
          <View style={styles.intro}>
            <SupportIconTile size={52} tone="danger">
              <AlertTriangleIcon color={mentaColors.danger} size={26} />
            </SupportIconTile>
            <Text accessibilityRole="header" style={styles.title}>
              {t('shared.rootError.title')}
            </Text>
            <Text style={styles.description}>
              {t('shared.rootError.description')}
            </Text>
          </View>
          <SupportLedgerCard style={styles.reference}>
            <Text style={styles.referenceLabel}>
              {t('shared.rootError.supportReference')}
            </Text>
            <Text selectable style={styles.referenceValue}>
              {this.state.errorId ?? t('shared.rootError.generatingReference')}
            </Text>
          </SupportLedgerCard>
          <AppInlineNotice
            description={
              this.state.reportAcknowledged
                ? t('shared.rootError.reportIncluded')
                : t('shared.rootError.noStateChangedDescription')
            }
            testID="error-boundary-notice"
            title={t('shared.rootError.noStateChanged')}
            tone={this.state.reportAcknowledged ? 'info' : 'warning'}
          />
          <View style={styles.footerActions}>
            <AppButton
              fullWidth
              onPress={this.handleRetry}
              title={t('shared.action.tryAgain')}
            />
            <AppButton
              disabled={this.state.reportAcknowledged}
              fullWidth
              onPress={this.handleReportError}
              title={
                this.state.reportAcknowledged
                  ? t('shared.rootError.reportFormOpened')
                  : t('shared.action.reportIssue')
              }
              variant="secondary"
            />
          </View>
        </AppScreen>
      );
    }

    if (this.props.children) return this.props.children;
    return <ErrorBoundaryRoute />;
  }
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = props => {
  const { t } = useTranslation();
  return <ErrorBoundaryBase {...props} translate={t} />;
};

/**
 * Expo Router also treats this module as `/error-boundary`. Keep that route a
 * safe recovery screen while the named class above remains the global boundary.
 */
const ErrorBoundaryRoute = () => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <AppScreen
      lane="focused"
      hasTabBar={false}
      scrollable
      contentContainerStyle={styles.screen}
    >
      <SupportPageHeader
        onBack={() => backOrReplace(router, '/support')}
        title={t('shared.rootError.linkOutOfDate')}
      />
      <View style={styles.routeRecoveryBody}>
        <SupportIconTile size={52} tone="action">
          <AlertCircleIcon color={mentaColors.action} size={24} />
        </SupportIconTile>
        <Text style={styles.description}>
          {t('shared.rootError.linkDidNotChange')}
        </Text>
      </View>
      <AppInlineNotice
        description={t('shared.rootError.linkedItemMoved')}
        title={t('shared.rootError.noStateChanged')}
        tone="warning"
      />
      <AppButton
        fullWidth
        onPress={() => router.replace('/support')}
        title={t('shared.rootError.returnSupport')}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  screen: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[8],
    width: '100%',
  },
  crashScreen: {
    alignSelf: 'center',
    flexGrow: 1,
    gap: mentaSpacing[4],
    paddingBottom: mentaSpacing[6],
    width: '100%',
  },
  intro: { gap: mentaSpacing[3], paddingTop: mentaSpacing[8] },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.journeyTitle,
  },
  description: { color: mentaColors.text.secondary, ...mentaTypography.body },
  reference: {
    gap: mentaSpacing[1],
    padding: mentaSpacing[4],
  },
  referenceLabel: { color: mentaColors.text.muted, ...mentaTypography.label },
  referenceValue: {
    color: mentaColors.text.secondary,
    ...mentaTypography.bodySmallMedium,
  },
  footerActions: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[2],
    marginTop: 'auto',
    paddingTop: mentaSpacing[4],
  },
  routeRecoveryBody: {
    gap: mentaSpacing[4],
    paddingTop: mentaSpacing[8],
  },
});

export default ErrorBoundary;
