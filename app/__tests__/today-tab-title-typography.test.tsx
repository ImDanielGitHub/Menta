import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import TodayScreen from '@/app/(tabs)/index';
import { TAB_BAR_PEEK_CLEARANCE } from '@/components/ui/ScreenWrapper';
import { mentaTypography } from '@/constants/MentaDesignSystem';

const mockPush = jest.fn();
const mockStoreReviewRequestHost = jest.fn();
let mockFocusCallback: (() => void | (() => void)) | undefined;
let mockRefreshControl: React.ReactElement | undefined;
let mockContentContainerStyle: StyleProp<ViewStyle>;
let mockHasTabBar: boolean | undefined;
let mockUser: { id: string } | null = null;
const mockShouldUseTwoColumns = jest.fn(() => false);
let mockPresentationState = 'loading';
let mockPhoneLayout = {
  isShortHeight: false,
  screenInset: 24,
  textScale: 1.4,
};

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    mockFocusCallback = callback;
  },
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock('@/components/loop/TodayStateCard', () => ({
  TodayStateCard: () => {
    const { View } =
      jest.requireActual<typeof import('react-native')>('react-native');
    return <View testID="today-state-card" />;
  },
}));

jest.mock('@/components/home/NotificationBell', () => ({
  NotificationBell: () => {
    const { View } =
      jest.requireActual<typeof import('react-native')>('react-native');
    return <View testID="notification-bell" />;
  },
}));

jest.mock('@/components/ui/AppShell', () => ({
  AppScreen: ({
    children,
    contentContainerStyle,
    hasTabBar,
    refreshControl,
  }: {
    children: React.ReactNode;
    contentContainerStyle?: StyleProp<ViewStyle>;
    hasTabBar?: boolean;
    refreshControl?: React.ReactElement;
  }) => {
    const { View } =
      jest.requireActual<typeof import('react-native')>('react-native');
    mockRefreshControl = refreshControl;
    mockContentContainerStyle = contentContainerStyle;
    mockHasTabBar = hasTabBar;
    return <View>{children}</View>;
  },
}));

jest.mock('@/components/ui/AppButton', () => ({
  AppButton: ({ title }: { title: string }) => {
    const { Text } =
      jest.requireActual<typeof import('react-native')>('react-native');
    return <Text>{title}</Text>;
  },
}));

jest.mock('@/components/ui/SkeletonLoader', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SkeletonLoader: () => React.createElement(View),
  };
});

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

jest.mock('@/constants/responsive-layout', () => ({
  ...jest.requireActual('@/constants/responsive-layout'),
  shouldUseIPadTwoColumnLayout: (...args: unknown[]) =>
    mockShouldUseTwoColumns(...args),
}));

jest.mock('@/store/selectors', () => ({
  useUser: () => mockUser,
}));

jest.mock('@/lib/network', () => ({
  useNetworkState: () => ({ isOnline: true }),
}));

jest.mock('@/lib/navigation/create-entry', () => ({
  openCreateHub: jest.fn(),
}));

jest.mock('@/components/home/StoreReviewRequestHost', () => ({
  StoreReviewRequestHost: ({ ready }: { ready: boolean }) => {
    mockStoreReviewRequestHost(ready);
    return null;
  },
}));

jest.mock('@/components/loop/build-daily-loop-facts', () => ({
  buildInitialServerFacts: () => ({
    fetchStatus: 'idle',
    fetchedAtIso: null,
    groupRisks: [],
    hasServerSnapshot: false,
    lastConfirmedReceipt: null,
    localDay: '2026-08-11',
    obligations: [],
    pendingReviews: [],
    timezone: 'Pacific/Auckland',
  }),
  buildReadyServerFacts: jest.fn(),
  markServerFactsFailed: jest.fn((facts: unknown) => facts),
  markServerFactsRefreshing: jest.fn((facts: unknown) => facts),
  normalizeObligationProofStatus: jest.fn(),
}));

jest.mock('@/components/loop/today-copy', () => ({
  resolveTodayPresentation: () => ({
    accent: 'muted',
    animateMascot: false,
    dateLabel: 'Today',
    detail: 'Loading your day.',
    layout: 'system',
    mascot: null,
    primaryAction: 'wait',
    primaryLabel: 'Loading',
    secondaryLabel: null,
    state: mockPresentationState,
    title: 'Loading Today',
  }),
}));

jest.mock('@/lib/loop', () => ({
  buildLoopDayContext: () => ({ localDay: '2026-08-11' }),
  decodeGroupRiskSnapshot: jest.fn(),
  selectDailyLoopState: () => 'loading',
}));

jest.mock('@/lib/proof-drafts', () => ({
  loadProofDrafts: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/lib/services/proof-submission-service', () => ({
  resumeProofSubmission: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn() },
}));

describe('Today tab title typography', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCallback = undefined;
    mockRefreshControl = undefined;
    mockContentContainerStyle = undefined;
    mockHasTabBar = undefined;
    mockUser = null;
    mockShouldUseTwoColumns.mockReturnValue(false);
    mockPresentationState = 'loading';
    mockPhoneLayout = {
      isShortHeight: false,
      screenInset: 24,
      textScale: 1.4,
    };
  });

  it('renders Today with the canonical section-heading role used by Groups', () => {
    render(<TodayScreen />);

    const titleStyle = StyleSheet.flatten(
      screen.getByText('Today').props.style
    );
    expect(screen.getByText('Today').props.maxFontSizeMultiplier).toBe(2);
    expect(screen.getByText('Today').props.accessibilityRole).toBe('header');
    expect(screen.getByText('Today')).toHaveProp('allowFontScaling', false);

    expect(titleStyle).toMatchObject({
      fontFamily: mentaTypography.heading.fontFamily,
      fontSize: 44.8,
      letterSpacing: mentaTypography.heading.letterSpacing,
      lineHeight: 53.2,
    });
    expect(screen.getByText('Personal promises')).toHaveStyle({
      fontSize: 22.4,
      lineHeight: 32.2,
    });
    expect(screen.getByText('View your personal promises')).toHaveStyle({
      fontSize: 18.2,
      lineHeight: 25.2,
    });
  });

  it('keeps personal promises reachable while Today is still loading', () => {
    render(<TodayScreen />);

    fireEvent.press(screen.getByTestId('today-personal-promises'));

    expect(mockPush).toHaveBeenCalledWith('/solo-challenges');
    expect(screen.getByTestId('today-ledger-loading')).toBeTruthy();
    expect(screen.getByLabelText('Loading more of Today')).toBeTruthy();
  });

  it('preserves the shared floating-tab clearance for lower Today actions', () => {
    render(<TodayScreen />);

    const contentStyle = StyleSheet.flatten(mockContentContainerStyle);

    expect(mockHasTabBar).toBe(true);
    expect(contentStyle?.paddingBottom).toBeUndefined();
    expect(screen.getByTestId('today-tab-scroll-spacer')).toHaveStyle({
      height: TAB_BAR_PEEK_CLEARANCE,
    });
  });

  it('uses the viewport gutter and healthy top rhythm on regular and compact phones', () => {
    const regular = render(<TodayScreen />);

    expect(StyleSheet.flatten(mockContentContainerStyle)).toMatchObject({
      gap: 24,
      paddingHorizontal: 24,
      paddingTop: 24,
    });
    expect(screen.getByTestId('today-header')).toHaveStyle({ minHeight: 48 });
    regular.unmount();

    mockPhoneLayout = {
      isShortHeight: true,
      screenInset: 20,
      textScale: 1.2,
    };
    render(<TodayScreen />);

    expect(StyleSheet.flatten(mockContentContainerStyle)).toMatchObject({
      gap: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
    });
  });

  it('lets a wide simple Today state use the full primary lane', () => {
    mockShouldUseTwoColumns.mockReturnValue(true);
    mockPresentationState = 'missed';
    render(<TodayScreen />);

    expect(screen.getByTestId('today-stacked-layout')).toBeTruthy();
    expect(screen.queryByTestId('today-dashboard-secondary')).toBeNull();
  });

  it('uses adjacent Today lanes only when real secondary content is visible', () => {
    mockShouldUseTwoColumns.mockReturnValue(true);
    mockPresentationState = 'loading';
    render(<TodayScreen />);

    expect(screen.getByTestId('today-ipad-two-column')).toBeTruthy();
    expect(screen.getByTestId('today-dashboard-secondary')).toBeTruthy();
  });

  it('keeps focus refreshes out of the pull-to-refresh spinner', () => {
    mockUser = { id: 'today-user' };
    render(<TodayScreen />);

    expect(mockRefreshControl?.props.refreshing).toBe(false);

    act(() => {
      mockFocusCallback?.();
    });

    expect(mockRefreshControl?.props.refreshing).toBe(false);
  });

  it('keeps the system review request deferred until Today settles', () => {
    render(<TodayScreen />);

    expect(mockStoreReviewRequestHost).toHaveBeenCalled();
    expect(mockStoreReviewRequestHost.mock.calls).toEqual(
      expect.arrayContaining([[false]])
    );
    expect(
      mockStoreReviewRequestHost.mock.calls.every(([ready]) => !ready)
    ).toBe(true);
  });
});
