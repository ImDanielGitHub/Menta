import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthRequiredScreen from '@/app/auth-required';
import { ThemeProvider } from '@/constants/ThemeContext';
import { useProtectedRouteStore } from '@/store/protected-route-store';
import { resolvePhoneLayout } from '@/constants/phone-layout';

let mockPhoneLayout = resolvePhoneLayout({
  width: 390,
  height: 844,
  fontScale: 1,
});

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(),
};
let mockParams: {
  next?: string | string[];
  context?: string | string[];
} = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
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

const renderScreen = () =>
  render(
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthRequiredScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('AuthRequiredScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProtectedRouteStore.setState({ pending: null });
    mockRouter.canGoBack.mockReturnValue(false);
    mockParams = {};
    mockPhoneLayout = resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 1,
    });
  });

  it.each([
    { width: 320, height: 568, fontSize: 38.4, lineHeight: 45.6 },
    { width: 390, height: 844, fontSize: 41.6, lineHeight: 49.4 },
    { width: 430, height: 932, fontSize: 44.8, lineHeight: 53.2 },
  ])(
    'fits the protected gate to the $width-point AXXL envelope',
    ({ width, height, fontSize, lineHeight }) => {
      mockPhoneLayout = resolvePhoneLayout({
        width,
        height,
        fontScale: 2.35,
      });
      mockParams = { next: '/groups/group-1' };

      renderScreen();

      expect(screen.getByText('Sign in to join this group')).toHaveStyle({
        fontSize,
        lineHeight,
      });
      expect(screen.getByText('Sign in')).toBeTruthy();
      expect(screen.getByText('Keep browsing')).toBeTruthy();
    }
  );

  it('renders the protected account gate with browse-safe recovery', () => {
    mockParams = { next: '/verification' };

    renderScreen();

    expect(screen.queryByText('Account required')).toBeNull();
    expect(screen.getByText('Sign in to add proof')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta saves this proof with the right promise and account.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('You can browse without signing in.')).toBeNull();
    expect(screen.getByText('Sign in')).toBeTruthy();
    expect(screen.getByText('Keep browsing')).toBeTruthy();
  });

  it('opens login from the gate without losing the protected context', () => {
    mockParams = { next: '/groups/group-1' };

    renderScreen();

    fireEvent.press(screen.getByText('Sign in'));

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
    expect(useProtectedRouteStore.getState().pending).toMatchObject({
      path: '/groups/group-1',
      source: 'auth_gate',
    });
  });

  it('keeps an event capability out of auth navigation', () => {
    const capability = 'opaque_event_capability_1234567890';
    useProtectedRouteStore
      .getState()
      .setPendingRoute(
        `/events/11111111-1111-4111-8111-111111111111?shareToken=${capability}`,
        'auth_gate'
      );
    mockParams = { context: 'events' };

    renderScreen();
    expect(
      screen.getByText('Sign in to continue with this event')
    ).toBeTruthy();
    fireEvent.press(screen.getByText('Sign in'));

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
    expect(JSON.stringify(mockRouter.push.mock.calls)).not.toContain(
      capability
    );
  });

  it('returns to the previous surface when browsing can continue backward', () => {
    mockRouter.canGoBack.mockReturnValue(true);
    useProtectedRouteStore
      .getState()
      .setPendingRoute('/review-queue', 'auth_gate');

    renderScreen();

    fireEvent.press(screen.getByText('Keep browsing'));

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(useProtectedRouteStore.getState().pending).toBeNull();
  });

  it('falls back to the public intro when there is no route history', () => {
    renderScreen();

    fireEvent.press(screen.getByText('Keep browsing'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/onboarding-again');
  });
});
