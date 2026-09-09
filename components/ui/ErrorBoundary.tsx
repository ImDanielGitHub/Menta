/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and displays fallback UI.
 */

import React, { Component, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import ThemeContext, { ThemeContextType } from '@/constants/ThemeContext';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { AlertTriangleIcon } from '@/components/ui/icons';
import { captureError } from '@/lib/sentry';
import { useTranslation } from '@/lib/localization/use-translation';
import type { TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'screen' | 'component' | 'critical';
  translate?: Translate;
}

type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const translateEnglish: Translate = (key, values) => {
  switch (key) {
    case 'shared.boundary.critical.title':
      return translate('en-NZ', 'shared.boundary.critical.title', values);
    case 'shared.boundary.critical.message':
      return translate('en-NZ', 'shared.boundary.critical.message', values);
    case 'shared.boundary.screen.title':
      return translate('en-NZ', 'shared.boundary.screen.title', values);
    case 'shared.boundary.screen.message':
      return translate('en-NZ', 'shared.boundary.screen.message', values);
    case 'shared.boundary.component.title':
      return translate('en-NZ', 'shared.boundary.component.title', values);
    case 'shared.boundary.component.message':
      return translate('en-NZ', 'shared.boundary.component.message', values);
    case 'shared.boundary.crashDescription':
      return translate('en-NZ', 'shared.boundary.crashDescription', values);
    case 'shared.boundary.observedBehaviour':
      return translate('en-NZ', 'shared.boundary.observedBehaviour', values);
    case 'shared.boundary.expectedBehaviour':
      return translate('en-NZ', 'shared.boundary.expectedBehaviour', values);
    case 'shared.boundary.boundaryLevel':
      return translate('en-NZ', 'shared.boundary.boundaryLevel', values);
    case 'shared.boundary.errorId':
      return translate('en-NZ', 'shared.boundary.errorId', values);
    case 'shared.boundary.message':
      return translate('en-NZ', 'shared.boundary.message', values);
    case 'shared.boundary.errorDetail':
      return translate('en-NZ', 'shared.boundary.errorDetail', values);
    case 'shared.accessibility.choiceSummary':
      return translate('en-NZ', 'shared.accessibility.choiceSummary', values);
    case 'shared.action.tryAgain':
      return translate('en-NZ', 'shared.action.tryAgain', values);
    case 'shared.action.reportIssue':
      return translate('en-NZ', 'shared.action.reportIssue', values);
    case 'shared.action.backToday':
      return translate('en-NZ', 'shared.action.backToday', values);
    default:
      return '';
  }
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

const fallbackCopy = (
  t: Translate,
  level: 'screen' | 'component' | 'critical'
) =>
  ({
    critical: {
      title: t('shared.boundary.critical.title'),
      message: t('shared.boundary.critical.message'),
    },
    screen: {
      title: t('shared.boundary.screen.title'),
      message: t('shared.boundary.screen.message'),
    },
    component: {
      title: t('shared.boundary.component.title'),
      message: t('shared.boundary.component.message'),
    },
  })[level];

export class ErrorBoundaryBase extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  static contextType = ThemeContext;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = `boundary_${Date.now().toString(36)}`;
    captureError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundaryLevel: this.props.level || 'component',
      errorId,
    });

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });
  };

  handleGoHome = () => {
    router.replace('/(tabs)');
  };

  handleReportIssue = () => {
    const t = this.props.translate ?? translateEnglish;
    router.push({
      pathname: '/report-issue',
      params: {
        reportKind: 'app_error',
        source: 'component_error_boundary',
        contextLabel: `${this.props.level || 'component'} crash`,
        title: `${this.props.level || 'Component'} error`,
        description:
          this.state.error?.message || t('shared.boundary.crashDescription'),
        observedBehavior: t('shared.boundary.observedBehaviour'),
        expectedBehavior: t('shared.boundary.expectedBehaviour'),
        stepsToReproduce: [
          t('shared.boundary.boundaryLevel', {
            level: this.props.level || 'component',
          }),
          t('shared.boundary.errorId', {
            id: this.state.errorId || 'not available',
          }),
          t('shared.boundary.message', {
            message: this.state.error?.message || 'not available',
          }),
        ].join('\n'),
      },
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return this.renderErrorUI();
  }

  private renderErrorUI() {
    const level = this.props.level || 'component';
    const t = this.props.translate ?? translateEnglish;
    const copy = fallbackCopy(t, level);
    const theme = this.context as ThemeContextType;
    const styles = createStyles(theme, level);

    if (level === 'component') {
      return (
        <AppCard
          variant="critical"
          padding={theme.spacing.md}
          style={styles.componentCard}
        >
          <View
            accessible
            accessibilityRole="alert"
            accessibilityLabel={t('shared.accessibility.choiceSummary', {
              title: copy.title,
              description: copy.message,
            })}
            style={styles.componentContent}
          >
            <View style={styles.iconBadge}>
              <AlertTriangleIcon size={18} color={theme.colors.status.error} />
            </View>
            <View style={styles.componentText}>
              <Text selectable style={styles.title}>
                {copy.title}
              </Text>
              <Text selectable style={styles.message}>
                {copy.message}
              </Text>
            </View>
            <View style={styles.componentActions}>
              <AppButton
                title={t('shared.action.tryAgain')}
                onPress={this.handleRetry}
                variant="primary"
                size="small"
              />
              <AppButton
                title={t('shared.action.reportIssue')}
                onPress={this.handleReportIssue}
                variant="outline"
                size="small"
              />
            </View>
          </View>
        </AppCard>
      );
    }

    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={styles.screenContent}
      >
        <View
          accessible
          accessibilityRole="alert"
          accessibilityLabel={t('shared.accessibility.choiceSummary', {
            title: copy.title,
            description: copy.message,
          })}
          style={styles.panel}
        >
          <View style={styles.iconBadge}>
            <AlertTriangleIcon size={28} color={theme.colors.status.error} />
          </View>

          <Text selectable style={styles.title}>
            {copy.title}
          </Text>
          <Text selectable style={styles.message}>
            {copy.message}
          </Text>

          {__DEV__ && this.state.error ? (
            <View style={styles.debugBox}>
              <Text selectable style={styles.debugLabel}>
                {t('shared.boundary.errorDetail')}
              </Text>
              <Text selectable style={styles.debugText}>
                {this.state.error.stack?.split('\n').slice(0, 5).join('\n') ||
                  this.state.error.message}
              </Text>
            </View>
          ) : null}

          {this.state.errorId ? (
            <Text selectable style={styles.errorId}>
              {t('shared.boundary.errorId', { id: this.state.errorId })}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              title={t('shared.action.tryAgain')}
              onPress={this.handleRetry}
              variant="primary"
              fullWidth
            />
            <AppButton
              title={t('shared.action.reportIssue')}
              onPress={this.handleReportIssue}
              variant="outline"
              fullWidth
            />
            {level === 'screen' ? (
              <AppButton
                title={t('shared.action.backToday')}
                onPress={this.handleGoHome}
                variant="ghost"
                fullWidth
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    );
  }
}

const createStyles = (
  theme: ThemeContextType,
  level: 'screen' | 'component' | 'critical'
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    screenContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing['2xl'],
    },
    panel: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: mentaLayout.phoneFrameMax,
      gap: theme.spacing.md,
    },
    componentCard: {
      marginVertical: theme.spacing.sm,
    },
    componentContent: {
      gap: theme.spacing.sm,
    },
    componentText: {
      gap: 4,
    },
    iconBadge: {
      alignItems: 'center',
      alignSelf: 'flex-start',
      justifyContent: 'center',
      width: level === 'component' ? 36 : 48,
      height: level === 'component' ? 36 : 48,
      borderRadius: level === 'component' ? 12 : 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(217, 106, 106, 0.46)',
      backgroundColor: 'rgba(217, 106, 106, 0.12)',
    },
    title: {
      color: theme.colors.text.primary,
      fontSize:
        level === 'component'
          ? theme.typography.sizes.lg
          : theme.typography.sizes['2xl'],
      fontWeight: theme.typography.weights.bold,
      letterSpacing: 0,
      lineHeight: level === 'component' ? 24 : 32,
    },
    message: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.sm,
      lineHeight: 21,
    },
    debugBox: {
      gap: 6,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
      backgroundColor: theme.colors.background.secondary,
    },
    debugLabel: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
      letterSpacing: 0,
    },
    debugText: {
      color: theme.colors.text.tertiary,
      fontFamily: 'Courier',
      fontSize: 11,
      lineHeight: 16,
    },
    errorId: {
      color: theme.colors.text.tertiary,
      fontFamily: 'Courier',
      fontSize: 11,
    },
    actions: {
      gap: theme.spacing.sm,
    },
    componentActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = props => {
  const { t } = useTranslation();
  return <ErrorBoundaryBase {...props} translate={t} />;
};

export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};

export default ErrorBoundary;
