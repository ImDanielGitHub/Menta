import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import JoinPromiseRoute from '@/app/join-promise';

const CODE = 'BOOK2026';
const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  replace: jest.fn(),
};
const mockLoad = jest.fn();
const mockSetPending = jest.fn();
const mockDismiss = jest.fn();
let mockUser: { id: string } | null = null;
let mockHasCompletedOnboarding = false;
let mockCurrentPending: {
  type: 'challenge';
  code: string;
  timestamp: number;
  ownerUserId: string | null;
  navigationClaimedAt: null;
} | null = null;

const preview = {
  promiseTitle: 'Read before bed',
  promiseDescription: 'Read for twenty minutes.',
  proofRule: 'Show the book and reading spot.',
  durationDays: 14,
  role: 'reviewer' as const,
  inviterName: 'Alex',
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ code: CODE }),
  useRouter: () => mockRouter,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (
    selector: (state: {
      user: typeof mockUser;
      hasCompletedOnboarding: boolean;
    }) => unknown
  ) =>
    selector({
      user: mockUser,
      hasCompletedOnboarding: mockHasCompletedOnboarding,
    }),
}));

jest.mock('@/store/invite-store', () => {
  const useInviteStore = (
    selector: (state: Record<string, unknown>) => unknown
  ) =>
    selector({
      pending: mockCurrentPending,
      setPendingChallenge: mockSetPending,
      dismissPending: mockDismiss,
    });
  useInviteStore.getState = () => ({
    pending: mockCurrentPending,
    dismissPending: mockDismiss,
  });
  return { useInviteStore };
});

jest.mock('@/lib/promises/accountability', () => ({
  accountabilityRoleCopy: () => ({ title: 'Review my proof' }),
  loadPromiseAccountabilityInvitePreview: (...args: unknown[]) =>
    mockLoad(...args),
}));

jest.mock('@/components/challenge/PromiseArtefact', () => {
  const { Text, View } = require('react-native');
  return {
    PromiseArtefact: ({ promise }: { promise: string }) => (
      <View>
        <Text>{promise}</Text>
      </View>
    ),
  };
});

jest.mock('@/components/ui', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    AppButton: ({
      onPress,
      testID,
      title,
    }: {
      onPress: () => void;
      testID?: string;
      title: string;
    }) => (
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
        onPress={onPress}
        testID={testID}
      >
        <Text>{title}</Text>
      </Pressable>
    ),
    AppInlineNotice: ({
      actionLabel,
      description,
      onAction,
      title,
    }: {
      actionLabel?: string;
      description: string;
      onAction?: () => void;
      title: string;
    }) => (
      <View>
        <Text>{title}</Text>
        <Text>{description}</Text>
        {actionLabel ? (
          <Pressable accessibilityRole="button" onPress={onAction}>
            <Text>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    ),
    AppScreen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    AppTopBar: ({
      backLabel,
      onBack,
      title,
    }: {
      backLabel: string;
      onBack: () => void;
      title: string;
    }) => (
      <View>
        <Text>{title}</Text>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text>{backLabel}</Text>
        </Pressable>
      </View>
    ),
    SkeletonLoader: () => <View testID="skeleton" />,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter.canGoBack.mockReturnValue(false);
  mockUser = null;
  mockHasCompletedOnboarding = false;
  mockCurrentPending = {
    type: 'challenge',
    code: CODE,
    timestamp: 1_000,
    ownerUserId: null,
    navigationClaimedAt: null,
  };
  mockLoad.mockResolvedValue({ kind: 'ready', preview });
});

describe('promise invite entry route', () => {
  it('shows a server-backed inviter and promise before a new user onboards', async () => {
    render(<JoinPromiseRoute />);

    expect(await screen.findByText('Alex invited you.')).toBeTruthy();
    expect(screen.getByText('Read before bed')).toBeTruthy();
    fireEvent.press(screen.getByTestId('join-promise-continue'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });

  it('sends an existing user to authoritative join details without accepting', async () => {
    mockUser = { id: 'user-a' };
    mockHasCompletedOnboarding = true;
    render(<JoinPromiseRoute />);

    fireEvent.press(await screen.findByTestId('join-promise-continue'));
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/join-funding',
      params: { code: CODE },
    });
  });

  it('keeps an existing unfinished account in onboarding with the invite held', async () => {
    mockUser = { id: 'user-a' };
    render(<JoinPromiseRoute />);

    fireEvent.press(await screen.findByTestId('join-promise-continue'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/invite-activation');
  });

  it('clears a server-confirmed terminal invite but keeps the reason generic', async () => {
    mockLoad.mockResolvedValue({
      kind: 'terminal',
      message:
        'This promise invitation is no longer available. It may have expired or already been used.',
    });
    render(<JoinPromiseRoute />);

    expect(await screen.findByText('Invitation unavailable')).toBeTruthy();
    await waitFor(() =>
      expect(mockDismiss).toHaveBeenCalledWith(mockCurrentPending)
    );
    expect(screen.queryByText('Try again')).toBeNull();
  });

  it('keeps a transport failure held and retryable', async () => {
    mockLoad
      .mockResolvedValueOnce({
        kind: 'retry',
        message: 'Menta could not check this promise invitation.',
      })
      .mockResolvedValueOnce({ kind: 'ready', preview });
    render(<JoinPromiseRoute />);

    fireEvent.press(await screen.findByText('Try again'));
    await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(2));
    expect(mockDismiss).not.toHaveBeenCalled();
    expect(await screen.findByText('Alex invited you.')).toBeTruthy();
  });

  it('dismisses only the promise invite represented by this screen', async () => {
    render(<JoinPromiseRoute />);

    fireEvent.press(await screen.findByText('Not now'));
    expect(mockDismiss).toHaveBeenCalledWith(mockCurrentPending);
    expect(mockRouter.replace).toHaveBeenCalledWith('/onboarding');
  });
});
