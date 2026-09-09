import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import JoinRedirectScreen from '@/app/join';
import { ThemeProvider } from '@/constants/ThemeContext';
import { useInviteStore } from '@/store/invite-store';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(),
};

let mockParams: Record<string, string | string[] | undefined> = {};

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

const renderJoinRedirect = () =>
  render(
    <SafeAreaProvider>
      <ThemeProvider>
        <JoinRedirectScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('JoinRedirectScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockParams = {};
    useInviteStore.setState({ pending: null });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('opens group invites in the non-consuming preview handoff', () => {
    mockParams = { invite: 'abc123' };

    renderJoinRedirect();

    expect(screen.getByText('Opening group invite')).toBeTruthy();
    expect(screen.getByText('Group invite found')).toBeTruthy();
    expect(screen.getByText('ABC123')).toBeTruthy();
    expect(useInviteStore.getState().pending).toBeNull();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/join-group',
      params: { code: 'ABC123' },
    });
  });

  it('keeps uppercase pasted query params valid for group invites', () => {
    mockParams = { INVITE: 'ABC123' };

    renderJoinRedirect();

    expect(screen.getByText('Group invite found')).toBeTruthy();
    expect(useInviteStore.getState().pending).toBeNull();
  });

  it('opens challenge invites in the non-consuming promise preview', () => {
    mockParams = { challenge: 'fit2026' };

    renderJoinRedirect();

    expect(screen.getByText('Promise invite saved')).toBeTruthy();
    expect(screen.getByText('FIT2026')).toBeTruthy();
    expect(useInviteStore.getState().pending).toMatchObject({
      type: 'challenge',
      code: 'FIT2026',
    });

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/join-promise',
      params: { code: 'FIT2026' },
    });
  });

  it('keeps missing invite links recoverable', () => {
    renderJoinRedirect();

    expect(screen.getByText('Invite link needs a code')).toBeTruthy();
    expect(screen.getByText('Missing invite code')).toBeTruthy();

    fireEvent.press(screen.getByText('Enter group code'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/join-group');

    fireEvent.press(screen.getByText('Continue without invite'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    expect(useInviteStore.getState().pending).toBeNull();
  });
});
