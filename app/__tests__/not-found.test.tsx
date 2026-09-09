import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import NotFoundScreen from '@/app/+not-found';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));
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

describe('NotFoundScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.canGoBack.mockReturnValue(false);
  });

  it('recovers a cold route by replacing home instead of issuing a dead back action', () => {
    render(<NotFoundScreen />);

    expect(screen.getByText('This page isn’t available')).toBeTruthy();
    fireEvent.press(screen.getByTestId('top-bar-back'));
    fireEvent.press(screen.getByTestId('support-system-not-found-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });
});
