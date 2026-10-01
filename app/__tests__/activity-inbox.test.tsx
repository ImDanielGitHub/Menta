import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import ActivityInboxScreen from '@/app/activity-inbox';
import NotificationBell from '@/components/home/NotificationBell';

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: () => false,
};
const mockMarkRead = jest.fn();
const mockRefresh = jest.fn();
const mockItem = {
  id: 42,
  title: 'Proof approved',
  body: 'Your result is ready',
  payload: { action: 'open_challenge', challengeId: 'promise-a' },
  created_at: '2026-10-01T00:00:00Z',
  is_read: false,
};
const mockInbox = {
  items: [mockItem],
  loading: false,
  failed: false,
  markRead: mockMarkRead,
  refresh: mockRefresh,
};
const mockTrack = jest.fn();
jest.mock('@/lib/posthog', () => ({
  trackProductEvent: (...args: unknown[]) => mockTrack(...args),
}));
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Stack: { Screen: () => null },
}));
jest.mock('@/hooks/use-activity-inbox', () => ({
  useActivityInbox: () => mockInbox,
}));
jest.mock('@/constants/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      accent: { background: '#fff' },
      background: { secondary: '#fff' },
      border: { primary: '#000' },
      text: { secondary: '#000' },
    },
  }),
}));
jest.mock('@/components/ui/icons', () => ({ BellIcon: () => null }));
jest.mock('@/components/ui/AppShell', () => {
  const { View, Text } = require('react-native');
  return {
    AppScreen: View,
    AppInsetGroup: View,
    AppTopBar: ({ title }: { title: string }) => <Text>{title}</Text>,
  };
});
jest.mock('@/components/ui/AppFields', () => {
  const { Pressable, Text } = require('react-native');
  return {
    AppFieldRow: ({
      title,
      value,
      onPress,
      testID,
    }: {
      title: string;
      value?: string;
      onPress: () => void;
      testID?: string;
    }) => (
      <Pressable onPress={onPress} testID={testID}>
        <Text>{title}</Text>
        <Text>{value}</Text>
      </Pressable>
    ),
  };
});
jest.mock('@/components/ui/AppFeedback', () => {
  const { Text } = require('react-native');
  return {
    AppInlineNotice: ({ title }: { title: string }) => <Text>{title}</Text>,
  };
});
jest.mock('@/components/ui/SkeletonLoader', () => ({
  SkeletonLoader: () => null,
}));

describe('activity inbox navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarkRead.mockResolvedValue(true);
    mockInbox.items = [mockItem];
    mockInbox.loading = false;
    mockInbox.failed = false;
  });
  it('opens activity from the Today bell and retains settings access', () => {
    const view = render(<NotificationBell />);
    fireEvent.press(screen.getByTestId('today-notification-button'));
    expect(mockRouter.push).toHaveBeenCalledWith('/activity-inbox');
    view.unmount();
    render(<ActivityInboxScreen />);
    fireEvent.press(screen.getByText('Notification settings'));
    expect(mockRouter.push).toHaveBeenCalledWith('/notification-settings');
  });
  it('saves read state before opening the safe destination', async () => {
    let confirm!: (value: boolean) => void;
    mockMarkRead.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          confirm = resolve;
        })
    );
    render(<ActivityInboxScreen />);
    fireEvent.press(screen.getByTestId('activity-item-42'));
    expect(mockRouter.push).not.toHaveBeenCalled();
    await act(async () => confirm(true));
    expect(mockRouter.push).toHaveBeenCalledWith('/challenges/promise-a');
    expect(mockTrack).toHaveBeenCalledWith('Activity Inbox', {
      stage: 'receipt_opened',
    });
  });
  it('keeps unread activity in place when its receipt cannot be saved', async () => {
    mockMarkRead.mockRejectedValueOnce(new Error('write failed'));
    render(<ActivityInboxScreen />);
    fireEvent.press(screen.getByTestId('activity-item-42'));
    await waitFor(() =>
      expect(screen.getByText('Could not update activity')).toBeTruthy()
    );
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(screen.getByText('Unread')).toBeTruthy();
  });
  it('does not navigate when the account changed while saving', async () => {
    mockMarkRead.mockResolvedValueOnce(false);
    render(<ActivityInboxScreen />);
    await act(async () =>
      fireEvent.press(screen.getByTestId('activity-item-42'))
    );
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  it('recovers to Today for an untrusted route', async () => {
    mockInbox.items = [
      {
        ...mockItem,
        payload: { action: 'untrusted', challengeId: 'promise-a' },
      },
    ];
    render(<ActivityInboxScreen />);
    await act(async () =>
      fireEvent.press(screen.getByTestId('activity-item-42'))
    );
    expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)');
  });
});
