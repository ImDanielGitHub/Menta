import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import MentaCheckScreen from '@/app/menta-check';
import { mentaCheckEnNZ as mockCopy } from '@/lib/localization/catalogues/en-NZ/menta-check';

let mockOwner = 'account-a';
let mockConsented = true;
let mockServerPermission: 'allowed' | 'needs-review' | 'unavailable' =
  'needs-review';
const mockReadback = jest.fn();
const mockAccept = jest.fn();
const mockWithdraw = jest.fn();
const mockReview = jest.fn();
const mockRefetch = jest.fn();
const mockInvalidate = jest.fn();
const mockOverview = () => ({
  consented: mockConsented,
  stats: { checks: 0 },
  isPro: false,
  promises: [],
  history: [],
});
jest.mock('@/store/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) =>
      selector({ user: { id: mockOwner } }),
    { getState: () => ({ user: { id: mockOwner } }) }
  ),
}));
jest.mock('@/hooks/use-menta-check', () => ({
  useMentaCheckOverview: () => ({ data: mockOverview(), refetch: mockRefetch }),
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/lib/paywall/manager', () => ({ openPaywall: jest.fn() }));
jest.mock('@/lib/paywall/revenuecat', () => ({
  RevenueCatAPI: { showManageSubscriptions: jest.fn() },
}));
jest.mock('@/lib/menta-check/api', () => ({
  getMentaCheckMediaPermissionV2: (...args: unknown[]) => mockReadback(...args),
  acceptMentaCheckMediaConsentV2: (...args: unknown[]) => mockAccept(...args),
  setMentaCheckConsent: (...args: unknown[]) => mockWithdraw(...args),
  setPromiseReviewMode: (...args: unknown[]) => mockReview(...args),
}));
jest.mock('@/constants/ThemeContext', () => ({
  __esModule: true,
  default: jest.requireActual('react').createContext({}),
  useTheme: () => ({
    colors: {
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
      status: { error: '#f00' },
    },
  }),
}));
jest.mock('@/lib/localization', () => ({
  useTranslation: () => ({ t: (key: keyof typeof mockCopy) => mockCopy[key] }),
}));
jest.mock('@/components/ui/MentaMascot', () => ({ MentaMascot: () => null }));
jest.mock('@/components/ui/SkeletonLoader', () => ({
  SkeletonLoader: () => null,
}));
jest.mock('@/components/onboarding/MentaNarrator', () => ({
  MentaNarrator: ({ message }: { message: string }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text accessibilityRole="header">{message}</Text>;
  },
}));
jest.mock('@/components/ui/AppShell', () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => children,
  AppTopBar: () => null,
  AppListRow: ({ title, onPress }: { title: string; onPress: () => void }) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
      >
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/components/ui/SimpleBottomSheet', () => ({
  SimpleBottomSheet: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: React.ReactNode;
  }) => (visible ? children : null),
}));
jest.mock('@/components/ui/AppButton', () => ({
  AppButton: ({
    title,
    onPress,
    loading,
    disabled,
  }: {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
  }) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        disabled={loading || disabled}
        onPress={onPress}
      >
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));
const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));
const openPermission = () => press('Your AI check permission.');
beforeEach(() => {
  mockOwner = 'account-a';
  mockConsented = true;
  jest.clearAllMocks();
  mockServerPermission = 'needs-review';
  mockReadback.mockImplementation(async () => mockServerPermission);
  mockAccept.mockImplementation(async () => {
    mockServerPermission = 'allowed';
    return {
      success: true,
      consented: true,
      policy_version: 2,
      acknowledgement_id: 'explicit-receipt',
      acknowledged_at: '2026-10-04T05:00:00Z',
    };
  });
  mockWithdraw.mockImplementation(async () => {
    mockServerPermission = 'needs-review';
    return { success: true };
  });
});

it('does not interpret existing legacy consent as explicit media permission or mutate review settings on Not now', async () => {
  render(<MentaCheckScreen />);
  openPermission();
  await screen.findByText('Permission needs review');
  expect(screen.queryByText('Permission allowed')).toBeNull();
  press('Review permission');
  expect(
    screen.getByText('Your existing review settings stay the same.')
  ).toBeTruthy();
  press('Not now');
  await screen.findByText('Permission needs review');
  expect(mockAccept).not.toHaveBeenCalled();
  expect(mockWithdraw).not.toHaveBeenCalled();
  expect(mockReview).not.toHaveBeenCalled();
});

it('shows allowed only after confirmed explicit acceptance and forgets it after withdrawal', async () => {
  render(<MentaCheckScreen />);
  openPermission();
  await screen.findByText('Permission needs review');
  press('Review permission');
  press('Allow AI checks');
  await screen.findByText('Permission allowed');
  expect(mockAccept).toHaveBeenCalledWith('settings');
  expect(mockReview).not.toHaveBeenCalled();
  press('Withdraw permission');
  press('Stop checking');
  await waitFor(() =>
    expect(mockWithdraw).toHaveBeenCalledWith(false, 'settings')
  );
  await act(async () => {});
  openPermission();
  await screen.findByText('Permission needs review');
  expect(mockReview).not.toHaveBeenCalled();
});

it('never carries confirmed permission to another account', async () => {
  const view = render(<MentaCheckScreen />);
  openPermission();
  await screen.findByText('Permission needs review');
  press('Review permission');
  press('Allow AI checks');
  await screen.findByText('Permission allowed');
  mockServerPermission = 'needs-review';
  mockOwner = 'account-b';
  view.rerender(<MentaCheckScreen />);
  await screen.findByText('Permission needs review');
  expect(screen.queryByText('Permission allowed')).toBeNull();
});

it('restores allowed from server after route remount without accepting again', async () => {
  mockServerPermission = 'allowed';
  const first = render(<MentaCheckScreen />);
  openPermission();
  await screen.findByText('Permission allowed');
  first.unmount();
  render(<MentaCheckScreen />);
  openPermission();
  await screen.findByText('Permission allowed');
  expect(mockReadback).toHaveBeenCalledTimes(2);
  expect(mockAccept).not.toHaveBeenCalled();
});
it('waits for readback after acceptance and does not infer allowed from a failed read', async () => {
  render(<MentaCheckScreen />);
  openPermission();
  await screen.findByText('Permission needs review');
  press('Review permission');
  mockReadback.mockRejectedValue(new Error('offline'));
  press('Allow AI checks');
  await screen.findByText('Menta couldn’t load your permission. Try again.');
  expect(screen.queryByText('Permission allowed')).toBeNull();
  mockReadback.mockResolvedValue('allowed');
  press('Try again');
  await screen.findByText('Permission allowed');
  expect(mockAccept).toHaveBeenCalledTimes(1);
});

it('keeps the server-confirmed permission after a failed withdrawal', async () => {
  mockServerPermission = 'allowed';
  mockWithdraw.mockResolvedValue({ success: false, code: 'FAILED' });
  const view = render(<MentaCheckScreen />);
  openPermission();
  await screen.findByText('Permission allowed');
  press('Withdraw permission');
  press('Stop checking');
  await screen.findByText('Menta couldn’t save that. Try again.');
  press('Keep it');
  openPermission();
  await screen.findByText('Permission allowed');
  view.unmount();
  render(<MentaCheckScreen />);
  openPermission();
  await screen.findByText('Permission allowed');
  expect(mockAccept).not.toHaveBeenCalled();
});
