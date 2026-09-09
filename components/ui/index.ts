import React from 'react';

// Menta UI Component Library
// Consistent, accessible, and themeable React Native components

// Canonical application primitives
export { Avatar } from './Avatar';
export { AppButton } from './AppButton';
export type { AppButtonProps, ButtonSize, ButtonVariant } from './AppButton';
export { AppCard } from './AppCard';
export type { AppCardProps } from './AppCard';
export {
  AppChoiceChip,
  AppMemberStack,
  AppOptionCard,
  AppSegmentedControl,
  AppTag,
} from './AppChoice';
export {
  AppDateTimeRow,
  AppFieldRow,
  AppFormSection,
  AppKeyboardDoneAccessory,
  AppSelectRow,
  AppSecureField,
  AppSwitchRow,
  AppTextArea,
  AppTextField,
} from './AppFields';
export { AppInlineNotice, AppProgressPill } from './AppFeedback';
export { AppReceiptSparkles } from './app-receipt-sparkles';
export type { AppReceiptSparklesProps } from './app-receipt-sparkles';
export {
  AppDivider,
  AppEmptyState,
  AppInsetGroup,
  AppListRow,
  AppScreen,
  AppSectionHeader,
  AppTopBar,
} from './AppShell';
export type { AppScreenLane, AppScreenProps } from './AppShell';

// Compatibility primitives that still have active consumers
export { Badge } from './Badge';
export { ErrorBoundary } from './ErrorBoundary';
export { FullScreenLoading } from './FullScreenLoading';
export { KeyboardDismissWrapper } from './KeyboardDismissWrapper';
export { NetworkErrorHandler } from './NetworkErrorHandler';
export { OAuthButtons } from './OAuthButtons';
export { ProgressBar } from './ProgressBar';
export { ScreenWrapper, TAB_BAR_PEEK_CLEARANCE } from './ScreenWrapper';
export { SegmentedControl } from './SegmentedControl';
export { SignedImage } from './SignedImage';
export { SkeletonButton, SkeletonLoader, SkeletonText } from './SkeletonLoader';
export { StandardTextInput } from './StandardTextInput';
export { StreakBadge } from './StreakBadge';
export { Toast } from './Toast';
export { UnifiedKeyboardContainer } from './UnifiedKeyboardContainer';

export { MentaMascot } from './MentaMascot';
export type { MascotSheetKind, MascotSize, MascotState } from './MentaMascot';
export type { MascotSheetRow } from './menta-mascot-sheet';

export {
  GroupInviteCard,
  GroupSnapshotCard,
  InvitePosterCard,
  ProofReceiptCard,
  ProofSharePreviewCard,
  ReferralProgressCard,
  StreakMilestoneCard,
} from './ShareCards';

// Theme system
export {
  ThemeProvider,
  useTheme,
  useThemedStyles,
} from '@/constants/ThemeContext';
export type { ThemeContextType } from '@/constants/ThemeContext';
export { useAccessibleColors } from '@/constants/useAccessibleColors';
export {
  transitionPresets,
  useThemeTransition,
  withThemeTransition,
} from '@/constants/ThemeTransitions';

// Design tokens
export { accessibility, palette, theme } from '@/constants/colors';

export const validateTheme = (theme: unknown) => {
  if (!theme || typeof theme !== 'object') {
    return false;
  }

  const themeRecord = theme as Record<string, unknown>;
  const requiredProps = [
    'colors',
    'spacing',
    'typography',
    'borderRadius',
    'shadows',
  ];
  const missing = requiredProps.filter(prop => !themeRecord[prop]);

  if (missing.length > 0) {
    console.warn(
      `Theme validation failed. Missing properties: ${missing.join(', ')}`
    );
    return false;
  }

  return true;
};

export const createMemoizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => React.memo(Component, propsAreEqual);
