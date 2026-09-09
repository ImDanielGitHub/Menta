import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CreateScreen from '@/app/(tabs)/create';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

let mockAuthState: {
  user: { id: string; email?: string; username?: string | null } | null;
};
let mockChallengeState: {
  userChallenges: Array<{ challengeId: string; currentStreak: number }>;
};
let mockGroupState: {
  groups: Array<{ id: string; name: string; status: 'active' | 'failed' }>;
};
let mockInviteState: {
  pending: null | {
    type: 'group' | 'challenge';
    code: string;
    timestamp: number;
  };
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/hooks/useGroupCooldownCheck', () => ({
  useGroupCooldownCheck: () => jest.fn().mockResolvedValue(false),
}));

jest.mock('@/components/ui/Toast', () => ({
  showToast: {
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector?: (state: typeof mockAuthState) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState,
}));

jest.mock('@/store/challenge-store', () => ({
  useChallengeStore: (
    selector?: (state: typeof mockChallengeState) => unknown
  ) => (selector ? selector(mockChallengeState) : mockChallengeState),
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: (selector?: (state: typeof mockGroupState) => unknown) =>
    selector ? selector(mockGroupState) : mockGroupState,
}));

jest.mock('@/store/invite-store', () => ({
  useInviteStore: (selector?: (state: typeof mockInviteState) => unknown) =>
    selector ? selector(mockInviteState) : mockInviteState,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

const renderCreate = () =>
  render(
    <SafeAreaProvider>
      <ThemeProvider>
        <CreateScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('Create tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      user: {
        id: 'user-1',
        email: 'dummy@example.com',
        username: 'Dummy',
      },
    };
    mockChallengeState = { userChallenges: [] };
    mockGroupState = { groups: [] };
    mockInviteState = { pending: null };
  });

  it('renders direct create choices and opens promise creation', async () => {
    renderCreate();

    expect(screen.getByTestId('create-tab-bridge')).toBeTruthy();
    expect(screen.getByText('What do you want to create?')).toBeTruthy();
    expect(screen.getByText('Create a promise')).toBeTruthy();
    expect(screen.getByText('Join a public promise')).toBeTruthy();
    expect(screen.getByText('Create with a group')).toBeTruthy();
    expect(screen.queryByText('NEW COMMITMENT')).toBeNull();

    fireEvent.press(screen.getByTestId('create-bridge-promise'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/create-challenge?mode=solo&createSource=create_tab'
      );
    });
  });

  it('opens the bounded solo challenge browser', async () => {
    renderCreate();

    fireEvent.press(screen.getByTestId('create-bridge-solo-run'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/solo-challenges');
    });
  });

  it('uses the first active group for group promise creation', async () => {
    mockGroupState = {
      groups: [{ id: 'group-1', name: 'Morning crew', status: 'active' }],
    };

    renderCreate();

    fireEvent.press(screen.getByTestId('create-bridge-group'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/create-challenge?mode=group&createSource=create_tab&groupId=group-1'
      );
    });
  });

  it('starts group creation when no active group exists', async () => {
    renderCreate();

    fireEvent.press(screen.getByTestId('create-bridge-group'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/create-group?createSource=create_tab'
      );
    });
  });

  it('opens creation help without claiming an action occurred', () => {
    renderCreate();

    fireEvent.press(screen.getByText('How promises work'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/support',
      params: { source: 'create_tab' },
    });
  });
});
