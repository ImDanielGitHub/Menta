import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import AdTrackingPermissionScreen from '@/app/ad-tracking-permission';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  replace: jest.fn(),
};

const mockGetMetaAdsTrackingStatus = jest.fn();
const mockRequestMetaAdsTrackingPermission = jest.fn();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));

jest.mock('@/lib/meta-ads', () => ({
  getMetaAdsTrackingStatus: (...args: unknown[]) =>
    mockGetMetaAdsTrackingStatus(...args),
  requestMetaAdsTrackingPermission: (...args: unknown[]) =>
    mockRequestMetaAdsTrackingPermission(...args),
}));

jest.mock('@/components/ui/AppShell', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    AppTopBar: ({ title, onBack }: { title?: string; onBack?: () => void }) => (
      <View>
        {title ? <Text>{title}</Text> : null}
        {onBack ? <Pressable onPress={onBack} testID="top-bar-back" /> : null}
      </View>
    ),
  };
});

jest.mock('@/components/ui/AppButton', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    AppButton: ({
      title,
      onPress,
      testID,
    }: {
      title: string;
      onPress: () => void;
      testID?: string;
    }) => (
      <Pressable onPress={onPress} testID={testID ?? `button-${title}`}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/components/ui/AppFeedback', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    AppInlineNotice: ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) => (
      <View>
        <Text>{title}</Text>
        <Text>{description}</Text>
      </View>
    ),
  };
});

describe('AdTrackingPermissionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.canGoBack.mockReturnValue(false);
    mockGetMetaAdsTrackingStatus.mockResolvedValue('undetermined');
    mockRequestMetaAdsTrackingPermission.mockResolvedValue('granted');
  });

  it('explains Meta measurement before asking the phone', async () => {
    render(<AdTrackingPermissionScreen />);

    expect(
      await screen.findByText('Measure whether Meta ads helped?')
    ).toBeTruthy();
    expect(
      screen.getByText(/You can decline and still use Menta/)
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('ad-tracking-education-continue'));

    await waitFor(() =>
      expect(mockRequestMetaAdsTrackingPermission).toHaveBeenCalledTimes(1)
    );
    expect(await screen.findByText('Ad measurement is on')).toBeTruthy();
    expect(screen.queryByTestId('ad-tracking-granted-done')).toBeNull();

    fireEvent.press(screen.getByTestId('top-bar-back'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/settings');
  });

  it('lets people skip the phone prompt and still use Menta', async () => {
    render(<AdTrackingPermissionScreen />);

    expect(
      await screen.findByTestId('ad-tracking-education-not-now')
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('ad-tracking-education-not-now'));

    expect(mockRequestMetaAdsTrackingPermission).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/settings');
  });
});
