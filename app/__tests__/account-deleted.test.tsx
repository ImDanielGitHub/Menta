import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Linking } from 'react-native';

import AccountDeletedScreen from '@/app/account-deleted';
import {
  clearAccountDeletionReceipt,
  readAccountDeletionReceipt,
} from '@/lib/account-deletion-receipt';

const mockRouter = { replace: jest.fn() };

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('@/lib/account-deletion-receipt', () => ({
  clearAccountDeletionReceipt: jest.fn(),
  readAccountDeletionReceipt: jest.fn(),
}));

jest.mock('@/components/ui', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');

  return {
    AppScreen: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
    }) => <View testID={testID}>{children}</View>,
    AppInlineNotice: ({
      title,
      description,
      testID,
    }: {
      title: string;
      description: string;
      testID?: string;
    }) => (
      <View testID={testID}>
        <Text>{title}</Text>
        <Text>{description}</Text>
      </View>
    ),
    AppButton: ({
      title,
      onPress,
      testID,
    }: {
      title: string;
      onPress: () => void;
      testID?: string;
    }) => (
      <Pressable onPress={onPress} testID={testID}>
        <Text>{title}</Text>
      </Pressable>
    ),
    SkeletonButton: () => <View testID="account-deleted-skeleton-button" />,
    SkeletonLoader: () => <View testID="account-deleted-skeleton-line" />,
  };
});

const mockedReadReceipt = jest.mocked(readAccountDeletionReceipt);
const mockedClearReceipt = jest.mocked(clearAccountDeletionReceipt);

describe('AccountDeletedScreen', () => {
  const openURL = jest.spyOn(Linking, 'openURL');

  beforeEach(() => {
    jest.clearAllMocks();
    mockedClearReceipt.mockResolvedValue(undefined);
    openURL.mockResolvedValue(undefined);
  });

  it('shows a durable signed-out receipt and clears it on continue', async () => {
    mockedReadReceipt.mockResolvedValue({
      success: true,
      appleAuthorization: 'revoked',
    });

    render(<AccountDeletedScreen />);

    expect(await screen.findByText('Your account was deleted')).toBeTruthy();
    expect(screen.getByTestId('account-deleted-frame')).toHaveStyle({
      flexGrow: 1,
      justifyContent: 'center',
    });
    expect(
      screen.getByText('Sign in with Apple access was also removed.')
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('account-deleted-continue'));
    await waitFor(() => {
      expect(mockedClearReceipt).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });

  it('does not ask email or Google users to manage Apple access', async () => {
    mockedReadReceipt.mockResolvedValue({
      success: true,
      appleAuthorization: 'not_applicable',
    });

    render(<AccountDeletedScreen />);

    expect(await screen.findByText('Your account was deleted')).toBeTruthy();
    expect(screen.queryByTestId('account-deleted-apple-manual')).toBeNull();
    expect(
      screen.queryByText(/Sign in with Apple access was also removed/)
    ).toBeNull();
  });

  it('gives the official manual Apple route without weakening the deletion receipt', async () => {
    mockedReadReceipt.mockResolvedValue({
      success: true,
      appleAuthorization: 'manual_revocation_required',
    });

    render(<AccountDeletedScreen />);

    expect(
      await screen.findByTestId('account-deleted-apple-manual')
    ).toBeTruthy();
    fireEvent.press(
      screen.getByTestId('account-deleted-open-apple-instructions')
    );

    await waitFor(() => {
      expect(openURL).toHaveBeenCalledWith(
        'https://support.apple.com/en-nz/102571'
      );
    });
  });

  it('returns to sign in when the one-time receipt is no longer stored', async () => {
    mockedReadReceipt.mockResolvedValue(null);

    render(<AccountDeletedScreen />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByText('No deletion receipt is stored')).toBeNull();
  });
});
