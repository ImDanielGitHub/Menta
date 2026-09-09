import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { AppState, Linking, StyleSheet } from 'react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { NotificationPrivacyOnboarding } from '@/components/onboarding/NotificationPrivacyOnboarding';
import { notificationService } from '@/lib/services/notification-service';
import * as Notifications from 'expo-notifications';

let mockAppStateListener: ((nextAppState: string) => void) | null = null;

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
}));

jest.mock('@/components/ui/AppShell', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppScreen: ({
      children,
      contentContainerStyle,
      testID,
    }: {
      children: React.ReactNode;
      contentContainerStyle?: unknown;
      testID?: string;
    }) =>
      React.createElement(
        View,
        { style: contentContainerStyle, testID },
        children
      ),
    AppTopBar: () => null,
    AppListRow: ({
      title,
      subtitle,
      value,
    }: {
      title: string;
      subtitle?: string;
      value?: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        subtitle ? React.createElement(Text, null, subtitle) : null,
        value ? React.createElement(Text, null, value) : null
      ),
  };
});

jest.mock('@/components/ui/AppButton', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text } =
    require('react-native') as typeof import('react-native');
  return {
    AppButton: ({
      title,
      onPress,
      testID,
      disabled,
      variant,
    }: {
      title: string;
      onPress: () => void;
      testID?: string;
      disabled?: boolean;
      variant?: string;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityState: { disabled: Boolean(disabled) },
          disabled,
          onPress,
          testID,
          variant,
        },
        React.createElement(Text, null, title)
      ),
  };
});

jest.mock('@/components/ui/AppFeedback', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppInlineNotice: ({
      title,
      description,
      testID,
    }: {
      title: string;
      description: string;
      testID?: string;
    }) =>
      React.createElement(
        View,
        { testID },
        React.createElement(Text, null, title),
        React.createElement(Text, null, description)
      ),
  };
});

jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    requestPermissions: jest.fn(),
    syncPushRegistrationForUser: jest.fn(),
  },
}));

jest.mock('@/lib/notifications/retention-notification-client', () => ({
  retentionNotificationClient: {
    clearInAppState: jest.fn().mockResolvedValue(true),
    requestPushPermission: jest.fn().mockResolvedValue(null),
    subscribePermissionChanges: jest.fn(() => () => undefined),
    syncAudienceTags: jest.fn().mockResolvedValue(true),
    syncInAppState: jest.fn().mockResolvedValue(true),
  },
}));

const mockedNotificationService = notificationService as {
  requestPermissions: jest.Mock;
  syncPushRegistrationForUser: jest.Mock;
};
const mockedNotifications = Notifications as typeof Notifications & {
  getPermissionsAsync: jest.Mock;
};
const mockOpenSettings = jest.spyOn(Linking, 'openSettings');
const mockAppStateAddEventListener = jest.spyOn(AppState, 'addEventListener');

const renderOnboarding = (
  overrides: Partial<
    React.ComponentProps<typeof NotificationPrivacyOnboarding>
  > = {}
) => {
  const props: React.ComponentProps<typeof NotificationPrivacyOnboarding> = {
    userId: 'user-1',
    onBack: jest.fn(),
    onComplete: jest.fn(),
    ...overrides,
  };
  const result = render(
    <ThemeProvider>
      <NotificationPrivacyOnboarding {...props} />
    </ThemeProvider>
  );
  return { ...result, props };
};

describe('NotificationPrivacyOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNotifications.getPermissionsAsync.mockReset();
    mockedNotificationService.requestPermissions.mockReset();
    mockedNotificationService.syncPushRegistrationForUser.mockReset();
    mockAppStateListener = null;
    mockedNotificationService.requestPermissions.mockResolvedValue(true);
    mockedNotificationService.syncPushRegistrationForUser.mockResolvedValue(
      true
    );
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'undetermined',
    });
    mockOpenSettings.mockResolvedValue(undefined);
    mockAppStateAddEventListener.mockImplementation(((
      _eventName: string,
      listener: (nextAppState: string) => void
    ) => {
      mockAppStateListener = listener;
      return { remove: jest.fn() };
    }) as typeof AppState.addEventListener);
  });

  it('educates before calling the native notification permission contract', async () => {
    const { props } = renderOnboarding();

    expect(screen.getByText('Get reminders for your promises?')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta can remind you before proof is due and when someone sends proof for review. Your phone will ask for permission next.'
      )
    ).toBeTruthy();
    expect(screen.getByText('“A proof needs your review”')).toBeTruthy();
    expect(
      screen.getByText('When a promise is close to its deadline')
    ).toBeTruthy();
    expect(screen.queryByText(/nudge/i)).toBeNull();
    expect(screen.getByText('Turn on reminders')).toBeTruthy();
    expect(mockedNotificationService.requestPermissions).not.toHaveBeenCalled();

    fireEvent.press(
      screen.getByTestId('notification-privacy-education-continue')
    );

    await waitFor(() => {
      expect(
        mockedNotificationService.requestPermissions
      ).toHaveBeenCalledTimes(1);
      expect(
        mockedNotificationService.syncPushRegistrationForUser
      ).toHaveBeenCalledWith('user-1');
    });
    expect(
      screen.getByText('This phone is ready for Menta notifications')
    ).toBeTruthy();
    expect(screen.getByTestId('notification-privacy-ready-receipt')).toHaveProp(
      'accessibilityRole',
      'summary'
    );
    expect(props.onComplete).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('notification-privacy-granted-promise'));
    expect(props.onComplete).toHaveBeenCalledTimes(1);
  });

  it('keeps reminder content below the top bar with connected actions', () => {
    renderOnboarding({ promptContext: 'first_promise' });

    expect(
      StyleSheet.flatten(
        screen.getByTestId('notification-privacy-content').props.style
      )
    ).toEqual(
      expect.objectContaining({
        flexGrow: 1,
        gap: 24,
        paddingBottom: 40,
        paddingTop: 32,
      })
    );
    expect(
      screen.getByTestId('notification-privacy-education-mascot', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(screen.getByTestId('notification-preview-due')).toHaveProp(
      'accessible',
      true
    );
    expect(screen.getByTestId('notification-preview-review')).toHaveProp(
      'accessible',
      true
    );
    expect(screen.getByText('Turn on reminders')).toBeTruthy();
    expect(screen.getByText('Continue without reminders')).toBeTruthy();
  });

  it('uses the action colour for the first-promise invite continuation', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    renderOnboarding({
      completionLabel: 'Continue to invite someone',
      promptContext: 'first_promise',
    });

    await waitFor(() =>
      expect(
        screen.getByTestId('notification-privacy-granted-promise')
      ).toHaveProp('variant', 'accent')
    );
  });

  it('renders device registration as pending without claiming delivery', async () => {
    mockedNotificationService.syncPushRegistrationForUser.mockResolvedValue(
      false
    );
    renderOnboarding();

    fireEvent.press(
      screen.getByTestId('notification-privacy-education-continue')
    );

    await waitFor(() => {
      expect(screen.getByText('Reminders are not ready yet')).toBeTruthy();
    });
    expect(screen.getByText('This device is not connected yet')).toBeTruthy();
    expect(screen.getByText('Try reminder setup again')).toBeTruthy();
  });

  it('does not register a device when the operating system keeps permission off', async () => {
    mockedNotificationService.requestPermissions.mockResolvedValue(false);
    renderOnboarding();

    fireEvent.press(
      screen.getByTestId('notification-privacy-education-continue')
    );

    await waitFor(() => {
      expect(screen.getByText('No reminders for now')).toBeTruthy();
    });
    expect(
      mockedNotificationService.syncPushRegistrationForUser
    ).not.toHaveBeenCalled();
    expect(screen.getByText('Continue without reminders')).toBeTruthy();
  });

  it('rechecks a granted device return once, then registers the current account', async () => {
    mockedNotificationService.requestPermissions.mockResolvedValue(false);
    renderOnboarding();

    fireEvent.press(
      screen.getByTestId('notification-privacy-education-continue')
    );
    await waitFor(() => {
      expect(screen.getByText('No reminders for now')).toBeTruthy();
    });

    fireEvent.press(
      screen.getByTestId('notification-privacy-permission-off-settings')
    );
    await waitFor(() => {
      expect(mockOpenSettings).toHaveBeenCalledTimes(1);
      expect(mockAppStateListener).not.toBeNull();
    });
    mockedNotifications.getPermissionsAsync.mockClear();
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });

    act(() => {
      mockAppStateListener?.('background');
      mockAppStateListener?.('active');
    });

    await waitFor(() => {
      expect(mockedNotifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
      expect(
        mockedNotificationService.syncPushRegistrationForUser
      ).toHaveBeenCalledWith('user-1');
      expect(
        screen.getByText('This phone is ready for Menta notifications')
      ).toBeTruthy();
    });

    act(() => {
      mockAppStateListener?.('background');
      mockAppStateListener?.('active');
    });
    expect(
      mockedNotificationService.syncPushRegistrationForUser
    ).toHaveBeenCalledTimes(1);
  });

  it('leaves the flow off after a denied Settings return without registering', async () => {
    mockedNotificationService.requestPermissions.mockResolvedValue(false);
    mockedNotifications.getPermissionsAsync
      .mockResolvedValueOnce({ status: 'undetermined' })
      .mockResolvedValue({ status: 'denied' });
    renderOnboarding();

    fireEvent.press(
      screen.getByTestId('notification-privacy-education-continue')
    );
    await waitFor(() => {
      expect(screen.getByText('No reminders for now')).toBeTruthy();
    });
    fireEvent.press(
      screen.getByTestId('notification-privacy-permission-off-settings')
    );

    act(() => {
      mockAppStateListener?.('background');
      mockAppStateListener?.('active');
    });

    await waitFor(() => {
      expect(screen.getByText('Notifications are still off')).toBeTruthy();
      expect(screen.getByText('No reminders for now')).toBeTruthy();
      expect(
        screen.getByText(
          /Your promises still work\. Menta will not ask again here\./
        )
      ).toBeTruthy();
    });
    expect(
      mockedNotificationService.syncPushRegistrationForUser
    ).not.toHaveBeenCalled();
  });

  it('abandons a Settings return when the account changes before the check resolves', async () => {
    let resolvePermission: (result: { status: string }) => void = () =>
      undefined;
    mockedNotificationService.requestPermissions.mockResolvedValue(false);
    mockedNotifications.getPermissionsAsync
      .mockResolvedValueOnce({ status: 'undetermined' })
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolvePermission = resolve;
          })
      )
      .mockResolvedValue({ status: 'undetermined' });
    const onBack = jest.fn();
    const onComplete = jest.fn();
    const view = render(
      <ThemeProvider>
        <NotificationPrivacyOnboarding
          userId="user-1"
          onBack={onBack}
          onComplete={onComplete}
        />
      </ThemeProvider>
    );

    fireEvent.press(
      screen.getByTestId('notification-privacy-education-continue')
    );
    await waitFor(() => {
      expect(screen.getByText('No reminders for now')).toBeTruthy();
    });
    fireEvent.press(
      screen.getByTestId('notification-privacy-permission-off-settings')
    );
    act(() => {
      mockAppStateListener?.('background');
      mockAppStateListener?.('active');
    });
    await waitFor(() => {
      expect(mockedNotifications.getPermissionsAsync).toHaveBeenCalledTimes(2);
    });

    view.rerender(
      <ThemeProvider>
        <NotificationPrivacyOnboarding
          userId="user-2"
          onBack={onBack}
          onComplete={onComplete}
        />
      </ThemeProvider>
    );
    await act(async () => {
      resolvePermission({ status: 'granted' });
      await Promise.resolve();
    });

    expect(
      mockedNotificationService.syncPushRegistrationForUser
    ).not.toHaveBeenCalled();
  });

  it('ignores a late device-registration receipt after the account changes', async () => {
    let resolveRegistration: (registered: boolean) => void = () => undefined;
    mockedNotificationService.syncPushRegistrationForUser.mockImplementation(
      () =>
        new Promise<boolean>(resolve => {
          resolveRegistration = resolve;
        })
    );
    const onBack = jest.fn();
    const onComplete = jest.fn();
    const view = render(
      <ThemeProvider>
        <NotificationPrivacyOnboarding
          userId="user-1"
          onBack={onBack}
          onComplete={onComplete}
        />
      </ThemeProvider>
    );

    fireEvent.press(
      screen.getByTestId('notification-privacy-education-continue')
    );
    await waitFor(() => {
      expect(
        mockedNotificationService.syncPushRegistrationForUser
      ).toHaveBeenCalledWith('user-1');
      expect(screen.getByText('Reminders are not ready yet')).toBeTruthy();
    });

    view.rerender(
      <ThemeProvider>
        <NotificationPrivacyOnboarding
          userId="user-2"
          onBack={onBack}
          onComplete={onComplete}
        />
      </ThemeProvider>
    );
    await act(async () => {
      resolveRegistration(true);
      await Promise.resolve();
    });

    expect(
      screen.queryByText('This phone is ready for Menta notifications')
    ).toBeNull();
  });

  it('registers directly when permission was already granted before mount', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });

    renderOnboarding();

    await waitFor(() => {
      expect(
        mockedNotificationService.syncPushRegistrationForUser
      ).toHaveBeenCalledTimes(1);
      expect(
        mockedNotificationService.syncPushRegistrationForUser
      ).toHaveBeenCalledWith('user-1');
      expect(
        screen.getByText('This phone is ready for Menta notifications')
      ).toBeTruthy();
    });
    expect(mockedNotificationService.requestPermissions).not.toHaveBeenCalled();
  });

  it('opens the permission-off recovery when permission was denied before mount', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      status: 'denied',
    });

    renderOnboarding();

    expect(await screen.findByText('No reminders for now')).toBeTruthy();
    expect(mockedNotificationService.requestPermissions).not.toHaveBeenCalled();
    expect(
      mockedNotificationService.syncPushRegistrationForUser
    ).not.toHaveBeenCalled();
  });

  it('finishes directly when reminders are skipped', () => {
    const onComplete = jest.fn();
    renderOnboarding({ onComplete });

    fireEvent.press(
      screen.getByTestId('notification-privacy-education-not-now')
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(mockedNotificationService.requestPermissions).not.toHaveBeenCalled();
  });
});
