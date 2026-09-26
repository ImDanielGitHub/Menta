import React from 'react';
import { Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { LegacyAppUpdateGate } from '@/components/update/LegacyAppUpdateGate';
import { ThemeProvider } from '@/constants/ThemeContext';
import type { LegacyUpdateDecision } from '@/lib/legacy-app-update-policy';

let mockPathname = '/';
let mockForegroundListener: ((state: string) => void) | undefined;
let mockDismissedVersion: string | null = null;
const mockPolicy = jest.fn<Promise<LegacyUpdateDecision>, [unknown]>();
const mockTrack = jest.fn();
const mockCapture = jest.fn();
const mockRecordStoreOpen = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.9.4' }));
jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/lib/legacy-app-update-policy-client', () => ({
  loadLegacyUpdatePolicy: (options: unknown) => mockPolicy(options),
}));
jest.mock('@/lib/app-state-manager', () => ({
  appStateManager: {
    addListener: (listener: (state: string) => void) => {
      mockForegroundListener = listener;
      return () => {
        mockForegroundListener = undefined;
      };
    },
  },
}));
jest.mock('@/lib/posthog', () => ({
  trackProductEvent: (...args: unknown[]) => mockTrack(...args),
}));
jest.mock('@/lib/sentry', () => ({
  captureError: (...args: unknown[]) => mockCapture(...args),
}));
jest.mock('@/lib/app-update-state', () => ({
  hasDismissedOptionalUpdate: async (version: string) =>
    mockDismissedVersion === version,
  dismissOptionalUpdate: async (version: string) => {
    mockDismissedVersion = version;
  },
  getStoreAttemptUpgradeOutcome: async () => 'none',
  recordStoreOpenAttempt: (...args: unknown[]) => mockRecordStoreOpen(...args),
}));
jest.mock('@/components/ui/modal/ModalCard', () => ({
  __esModule: true,
  default: ({
    children,
    testID,
    visible,
  }: {
    children: React.ReactNode;
    testID: string;
    visible: boolean;
  }) => {
    const { View } = require('react-native') as typeof import('react-native');
    return visible ? <View testID={testID}>{children}</View> : null;
  },
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native') as typeof import('react-native');
  return { SafeAreaView: View };
});

const offer = (
  mode: 'required' | 'optional' = 'required',
  minimumVersion = '1.9.5'
): LegacyUpdateDecision => ({
  status: 'offer',
  mode,
  minimumVersion,
  storeUrl: 'https://apps.apple.com/app/id6747362646',
});
const gate = (enabled = true) => (
  <ThemeProvider>
    <LegacyAppUpdateGate enabled={enabled} />
  </ThemeProvider>
);

describe('native update gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
    mockDismissedVersion = null;
    mockForegroundListener = undefined;
    mockPolicy.mockResolvedValue(offer());
    mockRecordStoreOpen.mockResolvedValue(undefined);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('keeps a mandatory update out of startup and invite completion, with support reachable', async () => {
    const view = render(gate(false));
    expect(mockPolicy).not.toHaveBeenCalled();
    view.rerender(gate());
    await view.findByTestId('app-update-required');
    expect(view.getByText('1.9.5')).toBeTruthy();
    expect(view.queryByTestId('app-update-not-now')).toBeNull();
    fireEvent.press(view.getByTestId('app-update-get-help'));
    expect(mockPush).toHaveBeenCalledWith('/support');

    mockPathname = '/invite-activation';
    view.rerender(gate());
    expect(view.queryByTestId('app-update-required')).toBeNull();
  });

  it('shows a recoverable store-link error and lets the same action retry', async () => {
    jest
      .mocked(Linking.openURL)
      .mockRejectedValueOnce(new Error('store unavailable'));
    const view = render(gate());
    await view.findByTestId('app-update-open-store');
    fireEvent.press(view.getByTestId('app-update-open-store'));
    await view.findByTestId('app-update-store-error');
    expect(view.getByText('Try again')).toBeTruthy();
    expect(mockTrack).toHaveBeenCalledWith('App Update Journey', {
      mode: 'required',
      outcome: 'store_open_failed',
      release: 'native',
    });

    fireEvent.press(view.getByTestId('app-update-open-store'));
    await waitFor(() =>
      expect(mockRecordStoreOpen).toHaveBeenCalledWith('1.9.5')
    );
    expect(Linking.openURL).toHaveBeenLastCalledWith(
      'https://apps.apple.com/app/id6747362646'
    );
    expect(view.queryByTestId('app-update-store-error')).toBeNull();
    expect(mockTrack).toHaveBeenCalledWith('App Update Journey', {
      mode: 'required',
      outcome: 'store_opened',
      release: 'native',
    });
  });

  it('persists optional dismissal per target version and offers a later target', async () => {
    mockPolicy.mockResolvedValue(offer('optional'));
    const first = render(gate());
    await first.findByTestId('app-update-not-now');
    fireEvent.press(first.getByTestId('app-update-not-now'));
    await waitFor(() =>
      expect(first.queryByTestId('app-update-optional')).toBeNull()
    );
    first.unmount();

    const reopened = render(gate());
    await act(async () => {});
    expect(reopened.queryByTestId('app-update-optional')).toBeNull();
    mockPolicy.mockResolvedValue(offer('optional', '1.9.6'));
    await act(async () => {
      mockForegroundListener?.('active');
    });
    expect(await reopened.findByTestId('app-update-optional')).toBeTruthy();
    expect(reopened.getByText('1.9.6')).toBeTruthy();
    expect(reopened.getByText('A new Menta update is ready')).toBeTruthy();
  });

  it('rereads authority on foreground and removes a withdrawn mandatory gate', async () => {
    const view = render(gate());
    await view.findByTestId('app-update-required');
    mockPolicy.mockResolvedValue({ status: 'kill_switch' });
    await act(async () => {
      mockForegroundListener?.('active');
    });
    expect(mockPolicy).toHaveBeenLastCalledWith({
      currentVersion: '1.9.4',
      platform: 'ios',
      forceRefresh: true,
    });
    expect(view.queryByTestId('app-update-required')).toBeNull();
  });
});
