import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Linking, Pressable, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import NotificationSettingsScreen from '@/app/notification-settings';
import { ThemeProvider } from '@/constants/ThemeContext';
import { notificationService } from '@/lib/services/notification-service';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};
const mockTrackProductEvent = jest.fn();
const mockLogEvent = jest.fn();

const mockAuthState: {
  user: { email?: string; id: string } | null;
  isAuthenticated: boolean;
  clearAuthData: jest.Mock<void, []>;
} = {
  user: { email: 'person@example.com', id: 'user-1' },
  isAuthenticated: true,
  clearAuthData: jest.fn<void, []>(),
};

const mockPreferences = {
  challenge_reminders: true,
  preferred_reminder_time: '20:00:00',
  group_updates: true,
  streak_alerts: true,
  marketing_email_opt_in: false,
  marketing_email_opted_at: null,
  marketing_email_provider_sync_pending: false,
  email_enabled: false,
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => mockRouter,
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthState,
}));

jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    getUserPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
    requestPermissions: jest.fn(),
    requestTestNotification: jest.fn(),
    syncPushRegistrationForUser: jest.fn(),
    syncChallengeRemindersForUser: jest.fn(),
    cancelAllChallengeRemindersForUser: jest.fn(),
    updateAllUserReminderTimes: jest.fn(),
    getCurrentTimezone: jest.fn(),
  },
}));

jest.mock('@/lib/posthog', () => ({
  trackProductEvent: (...args: unknown[]) => mockTrackProductEvent(...args),
  trackProductOperation: jest.fn(),
}));

jest.mock('@/lib/sentry', () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

const mockSyncAudienceTags = jest.fn().mockResolvedValue(true);
const mockSyncEmailSubscription = jest.fn().mockResolvedValue(true);
jest.mock('@/lib/notifications/retention-notification-client', () => ({
  retentionNotificationClient: {
    syncAudienceTags: (...args: unknown[]) => mockSyncAudienceTags(...args),
    syncEmailSubscription: (...args: unknown[]) =>
      mockSyncEmailSubscription(...args),
  },
}));

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return { BellIcon: Icon, BellOffIcon: Icon };
});

jest.mock('@/components/ui/AppFields', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');

  type MockSwitchProps = {
    title: string;
    subtitle?: string;
    value: boolean;
    onChange: (value: boolean) => void;
  };
  type MockDateTimeProps = {
    title: string;
    onChange: (value: Date) => void;
  };

  const AppSwitchRow = ({
    title,
    subtitle,
    value,
    onChange,
  }: MockSwitchProps) =>
    React.createElement(
      Pressable,
      {
        testID: `notification-toggle-${title}`,
        accessibilityState: { checked: value },
        onPress: () => onChange(!value),
      },
      React.createElement(Text, null, title),
      subtitle ? React.createElement(Text, null, subtitle) : null
    );
  const AppDateTimeRow = ({ title, onChange }: MockDateTimeProps) =>
    React.createElement(
      Pressable,
      {
        testID:
          title === 'Reminder time'
            ? 'notification-time-row'
            : `notification-time-${title.toLowerCase().replaceAll(' ', '-')}`,
        onPress: () => onChange(new Date('2026-08-05T18:30:00.000Z')),
      },
      React.createElement(Text, null, title)
    );

  const AppFieldRow = ({
    title,
    subtitle,
    value,
    onPress,
    testID,
  }: {
    title: string;
    subtitle?: string;
    value?: string;
    onPress?: () => void;
    testID?: string;
  }) =>
    React.createElement(
      Pressable,
      { onPress, testID: testID ?? `notification-row-${title}` },
      React.createElement(Text, null, title),
      subtitle ? React.createElement(Text, null, subtitle) : null,
      value ? React.createElement(Text, null, value) : null
    );

  return { AppDateTimeRow, AppFieldRow, AppSwitchRow };
});

jest.mock('@/components/ui/AppFeedback', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');

  type MockNoticeProps = {
    title: string;
    description: string;
    testID?: string;
  };

  const AppInlineNotice = ({ title, description, testID }: MockNoticeProps) =>
    React.createElement(
      View,
      { testID },
      React.createElement(Text, null, title),
      React.createElement(Text, null, description)
    );

  return { AppInlineNotice };
});

jest.mock('@/components/ui/AppButton', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text } =
    require('react-native') as typeof import('react-native');

  const AppButton = ({
    title,
    onPress,
    testID,
  }: {
    title: string;
    onPress: () => void;
    testID?: string;
  }) =>
    React.createElement(
      Pressable,
      { onPress, testID: testID ?? `button-${title}` },
      React.createElement(Text, null, title)
    );

  return { AppButton };
});

jest.mock('@/components/ui/AppShell', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');

  const AppScreen = ({
    children,
    lane,
  }: {
    children: React.ReactNode;
    lane?: 'focused' | 'working';
  }) =>
    React.createElement(
      View,
      { accessibilityLabel: lane ? `${lane} content lane` : undefined },
      children
    );
  const AppTopBar = ({
    title,
    subtitle,
  }: {
    title?: string;
    subtitle?: string;
  }) =>
    React.createElement(
      View,
      null,
      title ? React.createElement(Text, null, title) : null,
      subtitle ? React.createElement(Text, null, subtitle) : null
    );
  const AppSectionHeader = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) =>
    React.createElement(
      View,
      null,
      React.createElement(Text, null, title),
      subtitle ? React.createElement(Text, null, subtitle) : null
    );
  const AppInsetGroup = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);

  return { AppInsetGroup, AppScreen, AppSectionHeader, AppTopBar };
});

const mockedNotificationService =
  notificationService as typeof notificationService & {
    getUserPreferences: jest.Mock;
    updateUserPreferences: jest.Mock;
    requestPermissions: jest.Mock;
    requestTestNotification: jest.Mock;
    syncPushRegistrationForUser: jest.Mock;
    syncChallengeRemindersForUser: jest.Mock;
    cancelAllChallengeRemindersForUser: jest.Mock;
    updateAllUserReminderTimes: jest.Mock;
    getCurrentTimezone: jest.Mock;
  };
const mockNotifications = Notifications as typeof Notifications & {
  getPermissionsAsync: jest.Mock;
};

const renderNotifications = () =>
  render(
    <ThemeProvider>
      <NotificationSettingsScreen />
    </ThemeProvider>
  );

describe('NotificationSettingsScreen release-safe feedback', () => {
  const openSettings = jest.spyOn(Linking, 'openSettings');

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.user = {
      email: 'person@example.com',
      id: 'user-1',
    };
    mockAuthState.isAuthenticated = true;
    mockedNotificationService.getUserPreferences.mockResolvedValue(
      mockPreferences
    );
    mockedNotificationService.updateUserPreferences.mockResolvedValue(
      undefined
    );
    mockedNotificationService.requestPermissions.mockResolvedValue(true);
    mockedNotificationService.requestTestNotification.mockResolvedValue(
      'queued'
    );
    mockedNotificationService.syncPushRegistrationForUser.mockResolvedValue(
      true
    );
    mockedNotificationService.syncChallengeRemindersForUser.mockResolvedValue(
      'scheduled'
    );
    mockedNotificationService.cancelAllChallengeRemindersForUser.mockResolvedValue(
      undefined
    );
    mockedNotificationService.updateAllUserReminderTimes.mockResolvedValue(
      undefined
    );
    mockedNotificationService.getCurrentTimezone.mockReturnValue(
      'Pacific/Auckland'
    );
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    openSettings.mockResolvedValue(undefined);
  });

  it('shows an in-route load notice with a retry action', async () => {
    mockedNotificationService.getUserPreferences.mockRejectedValueOnce(
      new Error('load failed')
    );

    renderNotifications();

    await waitFor(() => {
      expect(
        screen.getByTestId('notification-settings-load-notice')
      ).toBeTruthy();
    });
    expect(
      screen.getByText('Could not load notification settings')
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('notification-settings-retry'));

    await waitFor(() => {
      expect(screen.getByText('Promise reminders')).toBeTruthy();
    });
    expect(mockedNotificationService.getUserPreferences).toHaveBeenCalledTimes(
      2
    );
  });

  it('shows a save failure inline and keeps the previous setting', async () => {
    mockedNotificationService.updateUserPreferences.mockRejectedValueOnce(
      new Error('save failed')
    );

    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('Promise reminders')).toBeTruthy();
    });

    fireEvent.press(
      screen.getByTestId('notification-toggle-Reviews and group activity')
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('notification-settings-status-notice')
      ).toBeTruthy();
    });
    expect(screen.getByText('Could not save your choice')).toBeTruthy();
    expect(
      screen.getByText('Your previous notification choice is still active.')
    ).toBeTruthy();
  });

  it('links an explicitly consented account email and removes it on opt-out', async () => {
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('Email updates')).toBeTruthy();
    });

    fireEvent.press(
      screen.getByTestId('notification-toggle-Menta product news')
    );

    await waitFor(() => {
      expect(screen.getByText('Email updates are on')).toBeTruthy();
    });
    expect(mockSyncEmailSubscription).toHaveBeenCalledWith(
      'person@example.com',
      true
    );
    expect(
      mockedNotificationService.updateUserPreferences
    ).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        marketing_email_opt_in: true,
        marketing_email_opted_at: expect.any(String),
      })
    );

    fireEvent.press(
      screen.getByTestId('notification-toggle-Menta product news')
    );
    await waitFor(() => {
      expect(screen.getByText('Email updates are off')).toBeTruthy();
    });
    expect(mockSyncEmailSubscription).toHaveBeenLastCalledWith(
      'person@example.com',
      false
    );
  });

  it('does not reschedule reminders when the reminder-time preference rolls back', async () => {
    mockedNotificationService.updateUserPreferences.mockRejectedValueOnce(
      new Error('save failed')
    );

    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('Promise reminders')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('notification-time-row'));

    await waitFor(() => {
      expect(screen.getByText('Could not save your choice')).toBeTruthy();
    });
    expect(
      mockedNotificationService.updateAllUserReminderTimes
    ).not.toHaveBeenCalled();
  });

  it('saves the complete quiet-hours window as one account preference update', async () => {
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('Delivery and timing')).toBeTruthy();
    });

    expect(
      screen.queryByTestId('notification-settings-save-quiet-hours')
    ).toBeNull();
    fireEvent.press(
      screen.getByTestId('notification-settings-toggle-advanced')
    );

    fireEvent.press(screen.getByTestId('notification-time-quiet-hours-start'));
    fireEvent.press(screen.getByTestId('notification-time-quiet-hours-end'));
    fireEvent.press(
      screen.getByTestId('notification-settings-save-quiet-hours')
    );

    await waitFor(() => {
      expect(screen.getByText('Quiet hours saved')).toBeTruthy();
    });
    expect(
      mockedNotificationService.updateUserPreferences
    ).toHaveBeenCalledTimes(1);
    expect(
      mockedNotificationService.updateUserPreferences
    ).toHaveBeenCalledWith('user-1', {
      quiet_hours_start: expect.stringMatching(/^\d{2}:\d{2}:00$/),
      quiet_hours_end: expect.stringMatching(/^\d{2}:\d{2}:00$/),
      timezone: 'Pacific/Auckland',
    });
  });

  it('does not claim a reminder was scheduled when there is no active promise', async () => {
    mockedNotificationService.getUserPreferences.mockResolvedValueOnce({
      ...mockPreferences,
      challenge_reminders: false,
    });
    mockedNotificationService.syncChallengeRemindersForUser.mockResolvedValueOnce(
      'no-active-promises'
    );

    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('Promise reminders')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('notification-toggle-Proof reminders'));

    await waitFor(() => {
      expect(screen.getByText('Proof reminders saved')).toBeTruthy();
    });
    expect(screen.queryByText('Reminder scheduled')).toBeNull();
  });

  it('reports a ready phone schedule without claiming delivery', async () => {
    mockedNotificationService.getUserPreferences.mockResolvedValueOnce({
      ...mockPreferences,
      challenge_reminders: false,
    });
    mockedNotificationService.syncChallengeRemindersForUser.mockResolvedValueOnce(
      'scheduled'
    );

    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('Promise reminders')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('notification-toggle-Proof reminders'));

    await waitFor(() => {
      expect(
        screen.getByText('Proof reminders are ready on this phone')
      ).toBeTruthy();
    });
    expect(
      screen.getByText(
        'This phone may show a reminder at your preferred time for active promises.'
      )
    ).toBeTruthy();
    expect(screen.queryByText(/delivered/i)).toBeNull();
  });

  it('queues one signed-in test notification through the registered phone', async () => {
    renderNotifications();
    await waitFor(() => {
      expect(
        screen.getByTestId('notification-settings-permission-summary')
      ).toBeTruthy();
    });

    expect(screen.queryByTestId('notification-settings-send-test')).toBeNull();
    fireEvent.press(
      screen.getByTestId('notification-settings-toggle-advanced')
    );

    fireEvent.press(screen.getByTestId('notification-settings-send-test'));

    await waitFor(() => {
      expect(screen.getByText('Test notification queued')).toBeTruthy();
    });
    expect(
      mockedNotificationService.syncPushRegistrationForUser
    ).toHaveBeenCalledWith('user-1');
    expect(
      mockedNotificationService.requestTestNotification
    ).toHaveBeenCalledWith('user-1');
    expect(
      screen.getByText(
        'It should arrive shortly. Tap it to return to Notification Settings.'
      )
    ).toBeTruthy();
    expect(mockTrackProductEvent.mock.calls).toEqual(
      expect.arrayContaining([
        [
          'Notification Test Journey',
          { stage: 'requested', outcome: 'started' },
        ],
        [
          'Notification Test Journey',
          { stage: 'permission', outcome: 'granted' },
        ],
        [
          'Notification Test Journey',
          { stage: 'registration', outcome: 'ready' },
        ],
        ['Notification Test Journey', { stage: 'server', outcome: 'queued' }],
      ])
    );
    expect(mockLogEvent).toHaveBeenCalledWith(
      'info',
      'notification_test_journey',
      { stage: 'server', outcome: 'queued' }
    );
  });

  it('routes a notification request through in-app education before iOS', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'undetermined',
    });

    renderNotifications();
    await waitFor(() => {
      expect(
        screen.getByTestId('notification-settings-primer-notice')
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('notification-settings-setup'));

    expect(mockRouter.push).toHaveBeenCalledWith('/notification-onboarding');
    expect(mockedNotificationService.requestPermissions).not.toHaveBeenCalled();
  });

  it('does not persist reminder delivery before the device allows it', async () => {
    mockedNotificationService.getUserPreferences.mockResolvedValueOnce({
      ...mockPreferences,
      challenge_reminders: false,
    });
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'undetermined',
    });
    renderNotifications();
    await waitFor(() => {
      expect(screen.getByText('Promise reminders')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('notification-toggle-Proof reminders'));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/notification-onboarding');
    });
    expect(
      mockedNotificationService.updateUserPreferences
    ).not.toHaveBeenCalled();
  });

  it('shows an open-settings failure inside the denied state', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'denied',
    });
    openSettings.mockRejectedValueOnce(new Error('settings unavailable'));

    renderNotifications();
    await waitFor(() => {
      expect(
        screen.getByTestId('notification-settings-denied-instructions')
      ).toBeTruthy();
    });

    fireEvent.press(
      screen.getByTestId('notification-settings-open-system-settings')
    );

    await waitFor(() => {
      expect(screen.getByText('Could not open phone settings')).toBeTruthy();
    });
  });

  it('does not mistake an unreadable permission state for a denial', async () => {
    mockNotifications.getPermissionsAsync.mockRejectedValueOnce(
      new Error('permission status unavailable')
    );

    renderNotifications();

    await waitFor(() => {
      expect(
        screen.getByText('Could not check phone notifications')
      ).toBeTruthy();
    });
    expect(screen.queryByText('Notifications off')).toBeNull();

    fireEvent.press(
      screen.getByTestId('notification-settings-check-permission')
    );

    await waitFor(() => {
      expect(screen.getByText('Promise reminders')).toBeTruthy();
    });
    expect(mockNotifications.getPermissionsAsync).toHaveBeenCalledTimes(2);
  });

  it('never renders account A preferences after the screen switches to account B', async () => {
    let resolveAccountA: (value: typeof mockPreferences) => void = () =>
      undefined;
    mockedNotificationService.getUserPreferences
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveAccountA = resolve;
          })
      )
      .mockResolvedValueOnce({
        ...mockPreferences,
        group_updates: true,
      });

    const view = renderNotifications();
    await waitFor(() =>
      expect(mockedNotificationService.getUserPreferences).toHaveBeenCalledWith(
        'user-1'
      )
    );

    mockAuthState.user = { id: 'user-2' };
    view.rerender(
      <ThemeProvider>
        <NotificationSettingsScreen />
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(mockedNotificationService.getUserPreferences).toHaveBeenCalledWith(
        'user-2'
      )
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('notification-toggle-Reviews and group activity')
          .props.accessibilityState
      ).toMatchObject({ checked: true })
    );

    await act(async () => {
      resolveAccountA({
        ...mockPreferences,
        group_updates: false,
      });
      await Promise.resolve();
    });

    expect(
      screen.getByTestId('notification-toggle-Reviews and group activity').props
        .accessibilityState
    ).toMatchObject({ checked: true });
  });

  it('does not let a late account A write roll back account B preferences', async () => {
    let rejectAccountAWrite: (reason?: unknown) => void = () => undefined;
    mockedNotificationService.getUserPreferences
      .mockResolvedValueOnce({
        ...mockPreferences,
        group_updates: false,
      })
      .mockResolvedValueOnce({
        ...mockPreferences,
        group_updates: true,
      });
    mockedNotificationService.updateUserPreferences.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectAccountAWrite = reject;
        })
    );

    const view = renderNotifications();
    await waitFor(() =>
      expect(
        screen.getByTestId('notification-toggle-Reviews and group activity')
          .props.accessibilityState
      ).toMatchObject({ checked: false })
    );

    fireEvent.press(
      screen.getByTestId('notification-toggle-Reviews and group activity')
    );
    mockAuthState.user = { id: 'user-2' };
    view.rerender(
      <ThemeProvider>
        <NotificationSettingsScreen />
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('notification-toggle-Reviews and group activity')
          .props.accessibilityState
      ).toMatchObject({ checked: true })
    );

    await act(async () => {
      rejectAccountAWrite(new Error('account A write failed'));
      await Promise.resolve();
    });

    expect(
      screen.getByTestId('notification-toggle-Reviews and group activity').props
        .accessibilityState
    ).toMatchObject({ checked: true });
  });
});
