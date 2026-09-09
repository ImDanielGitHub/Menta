import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import AdminIssuesScreen from '@/app/admin/issues';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@/components/ui/icons', () => ({
  ChevronRightIcon: () => null,
  ShieldIcon: () => null,
}));
jest.mock('@/components/ui', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    AppTopBar: ({ onBack }: { onBack?: () => void }) =>
      onBack ? <Pressable onPress={onBack} testID="top-bar-back" /> : null,
    AppButton: ({
      onPress,
      testID,
      title,
    }: {
      onPress: () => void;
      testID?: string;
      title: string;
    }) => (
      <Pressable onPress={onPress} testID={testID}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

describe('AdminIssuesScreen authority boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.canGoBack.mockReturnValue(false);
  });

  it('shows no local report sample and returns to Support', () => {
    render(<AdminIssuesScreen />);

    expect(screen.getByText(/No report data has been loaded/)).toBeTruthy();
    expect(screen.queryByText('Upload receipt is missing')).toBeNull();

    fireEvent.press(screen.getByTestId('support-system-admin-required-back'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/support');
  });
});
