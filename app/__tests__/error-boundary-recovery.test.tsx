import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ErrorBoundary from '@/app/error-boundary';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: {
    push: (...args: Parameters<typeof mockRouter.push>) =>
      mockRouter.push(...args),
  },
  useRouter: () => mockRouter,
}));

jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
  setRuntimeContext: jest.fn(),
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
    AppButton: ({ title, onPress }: { title: string; onPress: () => void }) => (
      <Pressable testID={`button-${title}`} onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

const ThrowingChild = () => {
  throw new Error('Sensitive implementation error');
};

describe('ErrorBoundary support handoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.canGoBack.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps the failure screen truthful and sends only a technical reference to the report route', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong in Menta.')).toBeTruthy();
    expect(screen.getByText('No state changed')).toBeTruthy();
    expect(screen.queryByText('Sensitive implementation error')).toBeNull();

    fireEvent.press(screen.getByTestId('button-Report issue'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/report-issue',
      params: expect.objectContaining({
        source: 'error_boundary',
        crashReference: expect.stringMatching(/^error_/),
      }),
    });
  });

  it('recovers the cold error-boundary route through Support', () => {
    render(<ErrorBoundary />);

    fireEvent.press(screen.getByTestId('top-bar-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/support');
  });
});
