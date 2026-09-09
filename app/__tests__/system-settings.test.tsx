import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Linking } from 'react-native';

import SystemSettingsScreen from '@/app/system-settings';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@/components/ui', () => {
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

describe('SystemSettingsScreen', () => {
  const openSettingsSpy = jest.spyOn(Linking, 'openSettings');

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.canGoBack.mockReturnValue(false);
  });

  it('uses the native Settings handoff without claiming a device setting changed', async () => {
    openSettingsSpy.mockResolvedValue(undefined);
    render(<SystemSettingsScreen />);

    expect(
      screen.getByText('Change Menta permissions on this phone')
    ).toBeTruthy();
    expect(screen.queryByText(/ad measurement/i)).toBeNull();

    fireEvent.press(screen.getByTestId('support-system-open-settings'));

    await waitFor(() => expect(openSettingsSpy).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Return when you’re done')).toBeTruthy();
    expect(
      screen.getByText(/does not confirm that a permission changed/)
    ).toBeTruthy();
  });

  it('returns a cold settings handoff to Support instead of issuing a dead Back', () => {
    render(<SystemSettingsScreen />);

    fireEvent.press(screen.getByTestId('top-bar-back'));
    fireEvent.press(screen.getByTestId('support-system-settings-later'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/support');
  });
});
