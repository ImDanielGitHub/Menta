import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PasswordRecoveryCallbackScreen from '@/app/password-recovery/callback';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockReplace = jest.fn();
const mockRecoveryExchange = jest.fn();
const mockOrdinaryExchange = jest.fn();
const mockMarkRecovery = jest.fn();
const mockClearRecovery = jest.fn();
let mockCode: string | string[] | undefined = 'recovery-code';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ code: mockCode }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/lib/supabase', () => ({
  passwordRecoverySupabase: {
    auth: {
      exchangeCodeForSession: (...args: unknown[]) =>
        mockRecoveryExchange(...args),
    },
  },
  supabase: {
    auth: {
      exchangeCodeForSession: (...args: unknown[]) =>
        mockOrdinaryExchange(...args),
    },
  },
}));

jest.mock('@/lib/auth/password-recovery-session', () => ({
  clearPasswordRecoverySession: (...args: unknown[]) =>
    mockClearRecovery(...args),
  markPasswordRecoverySession: (...args: unknown[]) =>
    mockMarkRecovery(...args),
}));

const renderCallback = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 430, height: 932 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>
        <PasswordRecoveryCallbackScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('PasswordRecoveryCallbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCode = 'recovery-code';
    mockMarkRecovery.mockResolvedValue(undefined);
    mockClearRecovery.mockResolvedValue(undefined);
  });

  it('accepts only a PKCE exchange identified as recovery', async () => {
    mockRecoveryExchange.mockResolvedValue({
      data: {
        redirectType: 'recovery',
        session: { user: { id: 'recovery-user' } },
      },
      error: null,
    });

    renderCallback();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/password-recovery')
    );
    expect(mockRecoveryExchange).toHaveBeenCalledWith('recovery-code');
    expect(mockMarkRecovery).toHaveBeenCalledWith('recovery-user');
    expect(mockOrdinaryExchange).not.toHaveBeenCalled();
  });

  it('rejects an expired exchange and clears the isolated recovery state', async () => {
    mockRecoveryExchange.mockResolvedValue({
      data: { redirectType: null, session: null },
      error: new Error('PKCE code is invalid'),
    });

    renderCallback();

    await waitFor(() => expect(mockClearRecovery).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith(
      '/password-recovery?status=invalid'
    );
    expect(mockMarkRecovery).not.toHaveBeenCalled();
    expect(mockOrdinaryExchange).not.toHaveBeenCalled();
  });

  it('never exchanges an ordinary OAuth code on the recovery callback client', async () => {
    mockRecoveryExchange.mockResolvedValue({
      data: {
        redirectType: null,
        session: { user: { id: 'ordinary-login' } },
      },
      error: null,
    });

    renderCallback();

    await waitFor(() => expect(mockClearRecovery).toHaveBeenCalledTimes(1));
    expect(mockOrdinaryExchange).not.toHaveBeenCalled();
    expect(mockMarkRecovery).not.toHaveBeenCalled();
  });

  it('does not exchange duplicated callback codes', async () => {
    mockCode = ['first', 'second'];

    renderCallback();

    await waitFor(() => expect(mockClearRecovery).toHaveBeenCalledTimes(1));
    expect(mockRecoveryExchange).not.toHaveBeenCalled();
    expect(mockOrdinaryExchange).not.toHaveBeenCalled();
  });

  it('still reaches the expired state when durable cleanup storage fails', async () => {
    mockCode = undefined;
    mockClearRecovery.mockRejectedValueOnce(new Error('storage unavailable'));

    renderCallback();

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(
        '/password-recovery?status=invalid'
      )
    );
  });
});
