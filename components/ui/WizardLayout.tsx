import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  useTheme,
  useThemedStyles,
  type ThemeContextType,
} from '@/constants/ThemeContext';
import { AppButton } from '@/components/ui/AppButton';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  XIcon,
} from '@/components/ui/icons';
import { mentaLayout } from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization/use-translation';

const noop = () => undefined;

export interface WizardStep {
  id: number | string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export interface WizardLayoutProps {
  steps: WizardStep[];
  currentStep: number;
  onNext?: () => void;
  onBack?: () => void;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  nextLabel?: string;
  backLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  isBackDisabled?: boolean;
  showBackButton?: boolean;
  showNextButton?: boolean;
  customFooter?: React.ReactNode;
  sidePaneContent?: React.ReactNode;
  contentMode?: 'fit' | 'scroll';
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({
  steps,
  currentStep,
  onNext,
  onBack,
  onClose,
  title,
  children,
  nextLabel,
  backLabel,
  isNextDisabled = false,
  isNextLoading = false,
  isBackDisabled = false,
  showBackButton = true,
  showNextButton = true,
  customFooter,
  sidePaneContent,
  contentMode = 'fit',
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedNextLabel = nextLabel ?? t('shared.action.next');
  const resolvedBackLabel = backLabel ?? t('accessibility.back');
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const activeStep = steps[currentStep];
  const progress = steps.length > 0 ? (currentStep + 1) / steps.length : 0;
  const shouldScroll = contentMode === 'scroll';

  const footer = customFooter ?? (
    <View style={styles.footer}>
      {showBackButton && currentStep > 0 ? (
        <AppButton
          title={resolvedBackLabel}
          variant="outline"
          onPress={onBack ?? noop}
          disabled={isBackDisabled || isNextLoading || !onBack}
          leftIcon={
            <ArrowLeftIcon size={16} color={theme.colors.text.primary} />
          }
          style={styles.footerButton}
        />
      ) : null}
      {showNextButton ? (
        <AppButton
          title={isNextLoading ? t('shared.action.working') : resolvedNextLabel}
          onPress={onNext ?? noop}
          disabled={isNextDisabled || isNextLoading || !onNext}
          loading={isNextLoading}
          rightIcon={
            currentStep >= steps.length - 1 ? (
              <CheckIcon size={16} color={theme.colors.text.inverse} />
            ) : (
              <ArrowRightIcon size={16} color={theme.colors.text.inverse} />
            )
          }
          style={styles.footerButton}
        />
      ) : null}
    </View>
  );

  const content = shouldScroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fitContent}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.close')}
            onPress={onClose}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <XIcon size={18} color={theme.colors.text.primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              {title}
            </Text>
            <Text style={styles.headerMeta}>
              {t('shared.wizard.stepOf', {
                current: currentStep + 1,
                total: steps.length,
              })}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>

        <View style={isWide ? styles.wideBody : styles.body}>
          {isWide ? (
            <View style={styles.sidePane}>
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                return (
                  <View key={step.id} style={styles.sideStep}>
                    <View
                      style={[
                        styles.sideDot,
                        isActive && styles.sideDotActive,
                        isComplete && styles.sideDotComplete,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sideDotText,
                          (isActive || isComplete) && styles.sideDotTextActive,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.sideTitle,
                        isActive && styles.sideTitleActive,
                      ]}
                      numberOfLines={2}
                    >
                      {step.title}
                    </Text>
                  </View>
                );
              })}
              {sidePaneContent}
            </View>
          ) : null}

          <View style={styles.mainPane}>
            <View style={styles.stepIntro}>
              <Text style={styles.stepTitle}>{activeStep?.title}</Text>
              {activeStep?.subtitle ? (
                <Text style={styles.stepSubtitle}>{activeStep.subtitle}</Text>
              ) : null}
            </View>
            {content}
          </View>
        </View>

        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ThemeContextType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    keyboard: {
      flex: 1,
    },
    header: {
      minHeight: 56,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    iconButton: {
      width: mentaLayout.minimumTouchTarget,
      height: mentaLayout.minimumTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    headerCopy: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    headerTitle: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.base,
      fontWeight: theme.typography.weights.semibold,
      letterSpacing: 0,
    },
    headerMeta: {
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.medium,
      letterSpacing: 0,
    },
    headerSpacer: {
      width: mentaLayout.minimumTouchTarget,
      height: mentaLayout.minimumTouchTarget,
    },
    progressTrack: {
      height: 1,
      backgroundColor: theme.colors.border.secondary,
    },
    progressFill: {
      height: 1,
      backgroundColor: theme.colors.text.primary,
    },
    body: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    wideBody: {
      flex: 1,
      flexDirection: 'row',
      alignSelf: 'center',
      width: '100%',
      maxWidth: 940,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
      gap: theme.spacing.xl,
    },
    sidePane: {
      width: 250,
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
    },
    sideStep: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    sideDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideDotActive: {
      borderColor: theme.colors.text.primary,
      backgroundColor: theme.colors.text.primary,
    },
    sideDotComplete: {
      borderColor: theme.colors.text.primary,
    },
    sideDotText: {
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
    },
    sideDotTextActive: {
      color: theme.colors.text.inverse,
    },
    sideTitle: {
      flex: 1,
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium,
      lineHeight: 18,
    },
    sideTitleActive: {
      color: theme.colors.text.primary,
    },
    mainPane: {
      flex: 1,
      minWidth: 0,
    },
    stepIntro: {
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.lg,
    },
    stepTitle: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes['3xl'],
      fontWeight: theme.typography.weights.semibold,
      lineHeight: 34,
      letterSpacing: 0,
    },
    stepSubtitle: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.base,
      lineHeight: 23,
      letterSpacing: 0,
    },
    fitContent: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    footer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom:
        Platform.OS === 'ios' ? theme.spacing.lg : theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
      backgroundColor: theme.colors.background.primary,
    },
    footerButton: {
      flex: 1,
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },
  });

export default WizardLayout;
