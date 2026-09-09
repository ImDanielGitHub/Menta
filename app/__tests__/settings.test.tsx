import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Linking, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SettingsScreen from '@/app/settings';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getMyProfile } from '@/lib/profile-api';
import {
  getAdsPrivacyOptionsRequirement,
  showAdsPrivacyOptions,
} from '@/lib/ads';
import {
  AccountDeletionNotCompletedError,
  deleteMentaAccount,
} from '@/lib/account-deletion';
import { saveAccountDeletionReceipt } from '@/lib/account-deletion-receipt';
import {
  readAccountDeletionPreflight,
  type AccountDeletionPreflight,
} from '@/lib/account-deletion-preflight';
import { notificationService } from '@/lib/services/notification-service';
import { openPaywall } from '@/lib/paywall/manager';
import {
  getAdvancedDiagnosticsEnabled,
  setAdvancedDiagnosticsEnabled,
} from '@/lib/advanced-diagnostics-preference';
import { setAdvancedDiagnosticsCollectionEnabled } from '@/lib/sentry';
import {
  downloadAvailableOtaUpdate,
  restartIntoDownloadedOta,
} from '@/lib/ota-updates';
import { emitConfirmedOutcome, emitHaptic } from '@/lib/motion/haptics';

import type { ReactNode } from 'react';

const mockOpenStoreWriteReview = jest.fn().mockResolvedValue(true);

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockAuthState: {
  user: { id: string } | null;
  isAuthenticated: boolean;
  logout: jest.Mock<Promise<void>, []>;
  clearAuthData: jest.Mock<void, []>;
} = {
  user: { id: 'user-1' },
  isAuthenticated: true,
  logout: jest.fn<Promise<void>, []>(),
  clearAuthData: jest.fn<void, []>(),
};

const mockChallengeState = { userChallenges: [] };
const mockGroupState = { groups: [] };
const mockNetworkState = { isOnline: true };
let mockAdsEnabled = true;
let mockSafeMode = false;
let mockSentryReplayReleaseEnabled = false;
let mockPathname = '/settings';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthState,
}));

jest.mock('@/store/challenge-store', () => ({
  useChallengeStore: () => mockChallengeState,
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: () => mockGroupState,
}));

jest.mock('@/lib/profile-api', () => ({
  getMyProfile: jest.fn(),
}));

jest.mock('@/lib/paywall/manager', () => ({
  openPaywall: jest.fn(),
}));

jest.mock('@/lib/advanced-diagnostics-preference', () => ({
  getAdvancedDiagnosticsEnabled: jest.fn(),
  setAdvancedDiagnosticsEnabled: jest.fn(),
}));

jest.mock('@/lib/sentry', () => ({
  isSentryReplayReleaseEnabled: jest.fn(() => mockSentryReplayReleaseEnabled),
  setAdvancedDiagnosticsCollectionEnabled: jest.fn(),
}));

jest.mock('@/lib/posthog', () => ({
  trackProductOperation: jest.fn(),
}));

jest.mock('@/lib/network', () => ({
  useNetworkState: () => mockNetworkState,
}));

jest.mock('@/hooks/useOperationalFlag', () => ({
  useOperationalFlag: (key: string) => ({
    enabled: key === 'ads_enabled' ? mockAdsEnabled : mockSafeMode,
    loading: false,
  }),
}));

jest.mock('@/lib/ads', () => ({
  getAdsPrivacyOptionsRequirement: jest.fn(),
  showAdsPrivacyOptions: jest.fn(),
}));

jest.mock('@/lib/account-deletion', () => {
  class AccountDeletionNotCompletedError extends Error {
    constructor() {
      super('The server confirmed that account deletion did not complete.');
      this.name = 'AccountDeletionNotCompletedError';
    }
  }

  return {
    AccountDeletionNotCompletedError,
    deleteMentaAccount: jest.fn(),
  };
});

jest.mock('@/lib/account-deletion-receipt', () => ({
  saveAccountDeletionReceipt: jest.fn(),
}));

jest.mock('@/lib/account-deletion-preflight', () => ({
  canOpenAccountDeletionConfirmation: (
    preflight: AccountDeletionPreflight | null
  ) => preflight?.status === 'resolved' && preflight.canProceed,
  readAccountDeletionPreflight: jest.fn(),
}));

jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: jest.fn((source: string, receiptId: string) => ({
    confirmed: true,
    receiptId,
    source,
  })),
  emitConfirmedOutcome: jest.fn(() => Promise.resolve(true)),
  emitHaptic: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/services/notification-service', () => ({
  notificationService: {
    startUserScopedWork: jest.fn(),
  },
}));

jest.mock('@/lib/store-review', () => ({
  openStoreWriteReview: (...args: unknown[]) =>
    mockOpenStoreWriteReview(...args),
}));

jest.mock('@/lib/ota-updates', () => ({
  downloadAvailableOtaUpdate: jest.fn(),
  restartIntoDownloadedOta: jest.fn(),
}));

jest.mock('@/components/ui/icons', () => {
  const Icon = () => null;
  return {
    HelpCircleIcon: Icon,
    BellIcon: Icon,
    GlobeIcon: Icon,
    InfoIcon: Icon,
    LogOutIcon: Icon,
    RefreshCwIcon: Icon,
    ChevronRightIcon: Icon,
    ShieldIcon: Icon,
    ShoppingCartIcon: Icon,
    StarIcon: Icon,
    TargetIcon: Icon,
    Trash2Icon: Icon,
    UserIcon: Icon,
  };
});

jest.mock('@/components/ui/SimpleBottomSheet', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SimpleBottomSheet: ({
      children,
      scrollableBody,
      footer,
      visible,
      testID,
    }: {
      children?: ReactNode;
      scrollableBody?: ReactNode;
      footer?: ReactNode;
      visible: boolean;
      testID?: string;
    }) =>
      visible
        ? React.createElement(
            View,
            { testID },
            scrollableBody ?? children,
            footer
          )
        : null,
  };
});

jest.mock('@/components/ui/AppFields', () => {
  const React = require('react') as typeof import('react');
  const { Text, TextInput, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppTextField: ({
      label,
      ...props
    }: {
      label?: string;
      [key: string]: unknown;
    }) =>
      React.createElement(
        View,
        null,
        label ? React.createElement(Text, null, label) : null,
        React.createElement(TextInput, props)
      ),
  };
});

jest.mock('@/components/ui/AppShell', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    AppScreen: ({ children }: { children: ReactNode }) =>
      React.createElement(View, null, children),
    AppDivider: () => null,
    AppTopBar: () => null,
  };
});

jest.mock('@/components/ui', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');

  type MockRowProps = {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    testID?: string;
  };
  type MockNoticeProps = {
    title: string;
    description: string;
    testID?: string;
  };

  const AppFieldRow = ({ title, subtitle, onPress, testID }: MockRowProps) =>
    React.createElement(
      Pressable,
      { onPress, testID: testID ?? `settings-row-${title}` },
      React.createElement(Text, null, title),
      subtitle ? React.createElement(Text, null, subtitle) : null
    );
  const AppInlineNotice = ({ title, description, testID }: MockNoticeProps) =>
    React.createElement(
      View,
      { testID },
      React.createElement(Text, null, title),
      React.createElement(Text, null, description)
    );

  return { AppFieldRow, AppInlineNotice };
});

jest.mock('@/components/ui/ConfirmDestructiveSheet', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');

  type MockConfirmProps = {
    visible: boolean;
    onConfirm: () => void;
    onClose: () => void;
    title: string;
    testID?: string;
  };

  const ConfirmDestructiveSheet = ({
    visible,
    onConfirm,
    onClose,
    title,
    testID = 'confirm-destructive-sheet',
  }: MockConfirmProps) =>
    visible
      ? React.createElement(
          View,
          { testID },
          React.createElement(Text, null, title),
          React.createElement(
            Pressable,
            { onPress: onConfirm, testID: `${testID}-confirm` },
            React.createElement(Text, null, 'Confirm delete')
          ),
          React.createElement(
            Pressable,
            { onPress: onClose, testID: `${testID}-cancel` },
            React.createElement(Text, null, 'Cancel')
          )
        )
      : null;

  return {
    __esModule: true,
    default: ConfirmDestructiveSheet,
  };
});

const mockedGetMyProfile = getMyProfile as jest.MockedFunction<
  typeof getMyProfile
>;
const mockedGetAdsPrivacyOptionsRequirement =
  getAdsPrivacyOptionsRequirement as jest.MockedFunction<
    typeof getAdsPrivacyOptionsRequirement
  >;
const mockedShowAdsPrivacyOptions =
  showAdsPrivacyOptions as jest.MockedFunction<typeof showAdsPrivacyOptions>;
const mockedDeleteMentaAccount = jest.mocked(deleteMentaAccount);
const mockedSaveAccountDeletionReceipt = jest.mocked(
  saveAccountDeletionReceipt
);
const mockedReadAccountDeletionPreflight = jest.mocked(
  readAccountDeletionPreflight
);
const mockedStartUserScopedWork = jest.mocked(
  notificationService.startUserScopedWork
);
const mockedGetAdvancedDiagnosticsEnabled = jest.mocked(
  getAdvancedDiagnosticsEnabled
);
const mockedSetAdvancedDiagnosticsEnabled = jest.mocked(
  setAdvancedDiagnosticsEnabled
);
const mockedDownloadAvailableOtaUpdate = jest.mocked(
  downloadAvailableOtaUpdate
);
const mockedRestartIntoDownloadedOta = jest.mocked(restartIntoDownloadedOta);
const mockedEmitConfirmedOutcome = jest.mocked(emitConfirmedOutcome);
const mockedEmitHaptic = jest.mocked(emitHaptic);

const mockProfile = {
  id: 'user-1',
  email: 'daniel@example.com',
  username: 'Daniel',
  display_name: null,
  avatar_url: null,
  momenta_balance: 0,
  has_completed_onboarding: true,
  created_at: '2026-08-05T00:00:00.000Z',
  updated_at: '2026-08-05T00:00:00.000Z',
  is_pro: false,
  is_approved: true,
};

const clearDeletionPreflight: AccountDeletionPreflight = {
  account: { status: 'verified', userId: 'user-1' },
  canProceed: true,
  ownership: { groups: [], status: 'clear' },
  status: 'resolved',
  subscription: { status: 'inactive' },
};

const blockedDeletionPreflight: AccountDeletionPreflight = {
  account: { status: 'verified', userId: 'user-1' },
  canProceed: false,
  ownership: {
    blockingGroups: [
      {
        id: 'group-shared',
        kind: 'saved',
        name: 'Morning Run Club',
        otherMemberCount: 2,
        status: 'active',
        willBeDeleted: true,
      },
    ],
    groups: [
      {
        id: 'group-shared',
        kind: 'saved',
        name: 'Morning Run Club',
        otherMemberCount: 2,
        status: 'active',
        willBeDeleted: true,
      },
    ],
    status: 'blocked',
  },
  status: 'resolved',
  subscription: { status: 'inactive' },
};

const renderSettings = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider>
        <SettingsScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

const waitForSettingsAccountCheck = async () => {
  await waitFor(
    () => {
      expect(screen.queryByTestId('settings-account-loading')).toBeNull();
    },
    { timeout: 5000 }
  );
};

describe('SettingsScreen release-safe account feedback', () => {
  const openURL = jest.spyOn(Linking, 'openURL');

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.user = { id: 'user-1' };
    mockAuthState.isAuthenticated = true;
    mockNetworkState.isOnline = true;
    mockAdsEnabled = true;
    mockSafeMode = false;
    mockSentryReplayReleaseEnabled = false;
    mockPathname = '/settings';
    mockAuthState.logout.mockResolvedValue(undefined);
    mockedGetMyProfile.mockResolvedValue(mockProfile);
    mockedGetAdvancedDiagnosticsEnabled.mockResolvedValue(false);
    mockedSetAdvancedDiagnosticsEnabled.mockResolvedValue(undefined);
    mockedDownloadAvailableOtaUpdate.mockResolvedValue('current');
    mockedRestartIntoDownloadedOta.mockResolvedValue(undefined);
    mockedGetAdsPrivacyOptionsRequirement.mockResolvedValue('required');
    mockedShowAdsPrivacyOptions.mockResolvedValue({
      shown: true,
      canRequestAds: true,
      privacyOptionsRequired: true,
    });
    mockedDeleteMentaAccount.mockResolvedValue({
      success: true,
      appleAuthorization: 'manual_revocation_required',
    });
    mockedReadAccountDeletionPreflight.mockResolvedValue(
      clearDeletionPreflight
    );
    mockedSaveAccountDeletionReceipt.mockResolvedValue(undefined);
    openURL.mockResolvedValue(undefined);
  });

  const submitDeletion = async () => {
    fireEvent.press(screen.getByTestId('settings-delete-account'));
    fireEvent.press(
      await screen.findByTestId('settings-delete-preflight-continue')
    );
    fireEvent.changeText(
      screen.getByTestId('settings-delete-confirmation-input'),
      'DELETE'
    );
    fireEvent.press(
      screen.getByTestId('settings-delete-account-sheet-confirm')
    );
  };

  it('renders the exact loaded direct-row destinations', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();

    expect(screen.getByText('Sign out')).toBeTruthy();
    expect(screen.getByText('Menta Pro')).toBeTruthy();
    expect(screen.getByText('Check for updates')).toBeTruthy();
    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.queryByText('Ad measurement')).toBeNull();
    expect(screen.queryByTestId('settings-ad-measurement')).toBeNull();
    expect(screen.queryByText('Edit profile')).toBeNull();
    expect(screen.queryByText('Personal promises')).toBeNull();
    expect(screen.queryByText('Momenta')).toBeNull();
    expect(screen.getByText('Privacy policy')).toBeTruthy();
    expect(screen.getByText('Terms you accepted')).toBeTruthy();
    expect(await screen.findByText('Ad privacy choices')).toBeTruthy();
    expect(screen.getByText('Community Standards')).toBeTruthy();
    expect(screen.getByText('Terms of use')).toBeTruthy();
    expect(screen.getByText('Feedback and support')).toBeTruthy();
    expect(screen.queryByText('Share feedback')).toBeNull();
    expect(screen.queryByText('Report a problem')).toBeNull();
    expect(screen.getByText('Leave a review')).toBeTruthy();
    expect(
      screen.getByText('Share your experience and help others discover Menta.')
    ).toBeTruthy();
    expect(screen.getByText('Delete account')).toBeTruthy();
  });

  it('checks for an OTA and restarts after the update downloads', async () => {
    mockedDownloadAvailableOtaUpdate.mockResolvedValueOnce('ready');
    renderSettings();
    await waitForSettingsAccountCheck();

    fireEvent.press(screen.getByTestId('settings-check-for-updates'));

    await waitFor(() => {
      expect(screen.getByText('Menta update ready')).toBeTruthy();
    });
    expect(mockedDownloadAvailableOtaUpdate).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Restart')).toBeTruthy();

    fireEvent.press(screen.getByTestId('settings-check-for-updates'));

    await waitFor(() => {
      expect(mockedRestartIntoDownloadedOta).toHaveBeenCalledTimes(1);
    });
  });

  it('confirms when the installed OTA is current', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();

    fireEvent.press(screen.getByTestId('settings-check-for-updates'));

    await waitFor(() => {
      expect(screen.getByText('Menta is up to date')).toBeTruthy();
    });
    expect(mockedRestartIntoDownloadedOta).not.toHaveBeenCalled();
  });

  it('uses tab chrome when Settings is a persistent destination', async () => {
    mockPathname = '/settings-tab';

    renderSettings();
    await waitForSettingsAccountCheck();

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.queryByLabelText('Back to You')).toBeNull();
    expect(screen.queryByText('Back to You')).toBeNull();
  });

  it('opens Menta Pro in the canonical paywall instead of Momenta', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();

    fireEvent.press(screen.getByTestId('settings-open-pro'));

    expect(mockRouter.push).not.toHaveBeenCalledWith('/momenta');
    expect(openPaywall).toHaveBeenCalledWith({
      context: 'general',
      initialView: 'plans',
    });
  });

  it('opens active Pro management without showing purchase plans', async () => {
    mockedGetMyProfile.mockResolvedValueOnce({
      ...mockProfile,
      is_pro: true,
    });
    renderSettings();
    await waitForSettingsAccountCheck();

    expect(
      screen.getByText('Active. View or manage your subscription.')
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('settings-open-pro'));

    expect(openPaywall).toHaveBeenCalledWith({
      context: 'general',
      initialView: 'active',
    });
  });

  it('uses one support entry before disclosing report and feedback actions', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();

    fireEvent.press(screen.getByText('Feedback and support'));

    expect(mockRouter.push).toHaveBeenCalledWith('/support');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/report-issue');
    expect(screen.queryByText('Share feedback')).toBeNull();
    expect(screen.queryByText('Report a problem')).toBeNull();
  });

  it('opens the store review page from the clearer review action', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();

    fireEvent.press(screen.getByTestId('settings-write-review'));

    expect(mockOpenStoreWriteReview).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).not.toHaveBeenCalledWith('/report-issue');
  });

  it('keeps optional replay controls out of ordinary settings until someone has opted in', async () => {
    mockSentryReplayReleaseEnabled = true;
    renderSettings();
    await waitForSettingsAccountCheck();

    await waitFor(() =>
      expect(screen.queryByTestId('settings-advanced-diagnostics')).toBeNull()
    );
    expect(mockedSetAdvancedDiagnosticsEnabled).not.toHaveBeenCalled();
    expect(setAdvancedDiagnosticsCollectionEnabled).not.toHaveBeenCalled();
  });

  it('lets the person revoke advanced diagnostics without changing crash reporting', async () => {
    mockedGetAdvancedDiagnosticsEnabled.mockResolvedValueOnce(true);
    renderSettings();
    await waitForSettingsAccountCheck();
    await waitFor(() => expect(screen.getByText('On')).toBeTruthy());

    fireEvent.press(screen.getByTestId('settings-advanced-diagnostics'));
    expect(
      screen.getByText(
        'Ordinary crash reports stay on when advanced diagnostics are off.'
      )
    ).toBeTruthy();
    fireEvent.press(
      screen.getByTestId('settings-advanced-diagnostics-confirm')
    );

    await waitFor(() => {
      expect(mockedSetAdvancedDiagnosticsEnabled).toHaveBeenCalledWith(false);
      expect(setAdvancedDiagnosticsCollectionEnabled).toHaveBeenCalledWith(
        false
      );
      expect(screen.getByText('Advanced diagnostics are off')).toBeTruthy();
    });
  });

  it('opens the saved legal record and the public Community Standards', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();

    fireEvent.press(screen.getByTestId('settings-legal-acceptance'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/legal-acceptance',
      params: { next: '/settings', surface: 'settings' },
    });

    fireEvent.press(
      screen.getByRole('button', {
        name: 'Community Standards. Rules for promises, proof and groups.',
      })
    );
    expect(openURL).toHaveBeenCalledWith(
      'https://menta.quest/community-standards'
    );
  });

  it('shows Google ad privacy choices only when the current consent update requires them', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();

    fireEvent.press(await screen.findByTestId('settings-ad-privacy-options'));

    await waitFor(() => {
      expect(mockedShowAdsPrivacyOptions).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText('Ad privacy choices did not open')).toBeNull();
  });

  it('does not render an ad-privacy row when UMP does not require one', async () => {
    mockedGetAdsPrivacyOptionsRequirement.mockResolvedValue('not_required');

    renderSettings();
    await waitForSettingsAccountCheck();
    await waitFor(() => {
      expect(mockedGetAdsPrivacyOptionsRequirement).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByTestId('settings-ad-privacy-options')).toBeNull();
  });

  it('keeps a failed privacy-options form in route with one truthful notice', async () => {
    mockedShowAdsPrivacyOptions.mockResolvedValue({
      shown: false,
      canRequestAds: false,
      privacyOptionsRequired: true,
      reason: 'error',
    });

    renderSettings();
    await waitForSettingsAccountCheck();
    fireEvent.press(await screen.findByTestId('settings-ad-privacy-options'));

    expect(
      await screen.findByText('Ad privacy choices did not open')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Try again later. Optional ads stay unavailable until you review these choices.'
      )
    ).toBeTruthy();
  });

  it('confirms sign-out before ending the current session', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();

    fireEvent.press(screen.getByTestId('settings-sign-out'));
    expect(screen.getByTestId('settings-sign-out-sheet')).toBeTruthy();
    expect(mockAuthState.logout).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('settings-sign-out-confirm'));

    await waitFor(() => {
      expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });

  it('keeps the account visible when sign-out is not confirmed', async () => {
    mockAuthState.logout.mockRejectedValueOnce(new Error('network down'));

    renderSettings();
    await waitForSettingsAccountCheck();
    fireEvent.press(screen.getByTestId('settings-sign-out'));

    expect(
      screen.getByTestId('settings-sign-out-controls').props.accessibilityRole
    ).toBeUndefined();
    expect(
      screen.getByTestId('settings-sign-out-status').props.accessibilityRole
    ).toBeUndefined();
    expect(
      screen.getByTestId('settings-sign-out-confirm').props.accessibilityRole
    ).toBe('button');

    fireEvent.press(screen.getByTestId('settings-sign-out-confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-sign-out-failed')).toBeTruthy();
    });
    expect(
      screen.getByTestId('settings-sign-out-controls').props.accessibilityRole
    ).toBeUndefined();
    expect(
      screen.getByTestId('settings-sign-out-status').props.accessibilityRole
    ).toBe('alert');
    expect(
      screen.getByTestId('settings-sign-out-confirm').props.accessibilityRole
    ).toBe('button');
    expect(screen.getByText('You are still signed in')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/login');
  });

  it('shows a resolved no-group preflight without sending anything', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();
    fireEvent.press(screen.getByTestId('settings-delete-account'));

    expect(
      await screen.findByTestId('settings-delete-preflight-resolved')
    ).toBeTruthy();

    expect(screen.getByText('Group ownership')).toBeTruthy();
    expect(screen.getByText('No owned groups need attention.')).toBeTruthy();
    expect(screen.getByText('No active Menta Pro entitlement.')).toBeTruthy();
    expect(screen.getByText('Delete your account?')).toBeTruthy();
    expect(mockAuthState.logout).not.toHaveBeenCalled();
    expect(mockedDeleteMentaAccount).not.toHaveBeenCalled();
  });

  it('blocks typed confirmation while a shared owned group still exists', async () => {
    mockedReadAccountDeletionPreflight.mockResolvedValue(
      blockedDeletionPreflight
    );

    renderSettings();
    await waitForSettingsAccountCheck();
    fireEvent.press(screen.getByTestId('settings-delete-account'));

    expect(
      await screen.findByTestId('settings-delete-preflight-blocked')
    ).toBeTruthy();
    expect(screen.getByText('Delete shared groups first')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta cannot transfer ownership yet. Open each group below and delete it before deleting your account.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Morning Run Club')).toBeTruthy();
    expect(
      screen.getByText(
        '2 other members. Delete this group before deleting your account.'
      )
    ).toBeTruthy();
    expect(
      screen.queryByTestId('settings-delete-preflight-continue')
    ).toBeNull();
    expect(
      screen.queryByTestId('settings-delete-confirmation-input')
    ).toBeNull();
    fireEvent.press(
      screen.getByTestId('settings-delete-owned-group-group-shared')
    );
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/groups/[id]',
      params: { id: 'group-shared' },
    });
    expect(mockedDeleteMentaAccount).not.toHaveBeenCalled();
  });

  it('shows active subscription authority as a notice without blocking deletion', async () => {
    mockedReadAccountDeletionPreflight.mockResolvedValue({
      ...clearDeletionPreflight,
      subscription: { status: 'active' },
    });

    renderSettings();
    await waitForSettingsAccountCheck();
    fireEvent.press(screen.getByTestId('settings-delete-account'));

    expect(
      await screen.findByText(
        'Deleting your account does not cancel this subscription.'
      )
    ).toBeTruthy();
    expect(
      screen.getByTestId('settings-delete-preflight-continue')
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('settings-delete-subscription-status'));
    expect(openPaywall).toHaveBeenCalledWith({
      context: 'general',
      initialView: 'active',
    });
  });

  it('keeps typed confirmation unavailable when the preflight result is unknown', async () => {
    mockedReadAccountDeletionPreflight.mockResolvedValue({
      canProceed: false,
      reason: 'ownership-unavailable',
      status: 'unknown',
    });

    renderSettings();
    await waitForSettingsAccountCheck();
    fireEvent.press(screen.getByTestId('settings-delete-account'));

    expect(
      await screen.findByText('Could not check your account')
    ).toBeTruthy();
    expect(
      screen.queryByTestId('settings-delete-preflight-continue')
    ).toBeNull();
    expect(
      screen.queryByTestId('settings-delete-confirmation-input')
    ).toBeNull();
    expect(mockedDeleteMentaAccount).not.toHaveBeenCalled();
  });

  it('keeps the final deletion input behind an explicit truthful preflight', async () => {
    renderSettings();
    await waitForSettingsAccountCheck();
    fireEvent.press(screen.getByTestId('settings-delete-account'));

    expect(
      await screen.findByTestId('settings-delete-preflight-resolved')
    ).toBeTruthy();

    expect(
      screen.queryByTestId('settings-delete-confirmation-input')
    ).toBeNull();

    fireEvent.press(screen.getByTestId('settings-delete-preflight-continue'));

    expect(
      screen.getByTestId('settings-delete-confirmation-input')
    ).toBeTruthy();
    expect(mockAuthState.clearAuthData).not.toHaveBeenCalled();
  });

  it('rechecks authority after DELETE is typed and blocks a newly shared group', async () => {
    mockedReadAccountDeletionPreflight
      .mockResolvedValueOnce(clearDeletionPreflight)
      .mockResolvedValueOnce(blockedDeletionPreflight);

    renderSettings();
    await waitForSettingsAccountCheck();
    await submitDeletion();

    expect(
      await screen.findByTestId('settings-delete-preflight-blocked')
    ).toBeTruthy();
    expect(mockedReadAccountDeletionPreflight).toHaveBeenCalledTimes(2);
    expect(mockedDeleteMentaAccount).not.toHaveBeenCalled();
    expect(mockedEmitHaptic).not.toHaveBeenCalledWith({
      type: 'destructive-commit',
    });
    expect(mockedEmitConfirmedOutcome).not.toHaveBeenCalled();
  });

  it('opens the durable public receipt after confirmed account deletion', async () => {
    const receipt = {
      success: true as const,
      appleAuthorization: 'manual_revocation_required' as const,
    };
    mockedDeleteMentaAccount.mockResolvedValueOnce(receipt);

    renderSettings();
    await waitForSettingsAccountCheck();
    await submitDeletion();

    await waitFor(() => {
      expect(mockedSaveAccountDeletionReceipt).toHaveBeenCalledWith(receipt);
      expect(mockRouter.replace).toHaveBeenCalledWith('/account-deleted');
      expect(mockAuthState.logout).toHaveBeenCalledTimes(1);
    });
    expect(mockedDeleteMentaAccount).toHaveBeenCalledWith('user-1');
    expect(mockedStartUserScopedWork).not.toHaveBeenCalled();
    expect(mockedEmitHaptic).toHaveBeenCalledWith({
      type: 'destructive-commit',
    });
    expect(mockedEmitConfirmedOutcome).toHaveBeenCalledWith(
      'account-deleted',
      expect.objectContaining({
        receiptId: 'user-1',
        source: 'account-deletion',
      })
    );
  });

  it('restarts account notifications after a definitive deletion failure', async () => {
    mockedDeleteMentaAccount.mockRejectedValueOnce(
      new AccountDeletionNotCompletedError()
    );

    renderSettings();
    await waitForSettingsAccountCheck();
    await submitDeletion();

    expect(await screen.findByText('Account was not deleted')).toBeTruthy();
    expect(mockedStartUserScopedWork).toHaveBeenCalledWith('user-1');
    expect(mockedSaveAccountDeletionReceipt).not.toHaveBeenCalled();
    expect(mockAuthState.logout).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/account-deleted');
    expect(mockedEmitHaptic).toHaveBeenCalledWith({
      type: 'failed',
      operation: 'delete',
    });
    expect(mockedEmitConfirmedOutcome).not.toHaveBeenCalled();
  });

  it('keeps notification work paused while a deletion result is unknown', async () => {
    mockedDeleteMentaAccount.mockRejectedValueOnce(
      new Error('connection ended before a receipt arrived')
    );

    renderSettings();
    await waitForSettingsAccountCheck();
    await submitDeletion();

    expect(await screen.findByText('Deletion result unknown')).toBeTruthy();
    expect(mockedStartUserScopedWork).not.toHaveBeenCalled();
    expect(mockedSaveAccountDeletionReceipt).not.toHaveBeenCalled();
    expect(mockAuthState.logout).not.toHaveBeenCalled();
    expect(mockedEmitHaptic).toHaveBeenCalledWith({ type: 'unknown' });
    expect(mockedEmitConfirmedOutcome).not.toHaveBeenCalled();
  });

  it('does not apply a delayed deletion result to a different account', async () => {
    let resolveDeletion:
      | ((value: {
          success: true;
          appleAuthorization: 'manual_revocation_required';
        }) => void)
      | undefined;
    mockedDeleteMentaAccount.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveDeletion = resolve;
        })
    );
    mockedGetMyProfile.mockImplementation(async () => ({
      ...mockProfile,
      id: mockAuthState.user?.id ?? 'user-1',
    }));

    const view = renderSettings();
    await waitForSettingsAccountCheck();
    await submitDeletion();
    await waitFor(() => {
      expect(mockedDeleteMentaAccount).toHaveBeenCalledWith('user-1');
    });

    mockAuthState.user = { id: 'user-2' };
    view.rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <ThemeProvider>
          <SettingsScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    );

    await act(async () => {
      resolveDeletion?.({
        success: true,
        appleAuthorization: 'manual_revocation_required',
      });
      await Promise.resolve();
    });

    expect(mockedSaveAccountDeletionReceipt).not.toHaveBeenCalled();
    expect(mockedStartUserScopedWork).not.toHaveBeenCalled();
    expect(mockAuthState.logout).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/account-deleted');
  });

  it('keeps external-link failures in route with a recoverable notice', async () => {
    openURL.mockRejectedValueOnce(new Error('link unavailable'));

    renderSettings();
    await waitForSettingsAccountCheck();
    fireEvent.press(
      screen.getByRole('button', {
        name: 'Terms of use. Read Menta’s terms.',
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId('settings-notice')).toBeTruthy();
    });

    expect(screen.getByText('Terms of use did not open')).toBeTruthy();
    expect(
      screen.getByText(
        'Try again in a moment, or open the link from the App Store listing.'
      )
    ).toBeTruthy();
  });

  it('routes an unavailable account to sign-in rather than a deletion request', async () => {
    mockAuthState.user = null;

    renderSettings();
    await waitForSettingsAccountCheck();

    await waitFor(() => {
      expect(screen.getByTestId('settings-sign-in-again')).toBeTruthy();
    });
  });

  it('keeps sign-out reachable from cached settings while offline without exposing deletion', async () => {
    mockNetworkState.isOnline = false;

    renderSettings();
    await waitForSettingsAccountCheck();
    expect(
      screen.getByText('Your saved settings are still here.')
    ).toBeTruthy();
    expect(screen.queryByTestId('settings-delete-account')).toBeNull();

    fireEvent.press(screen.getByTestId('settings-sign-out'));
    expect(screen.getByTestId('settings-sign-out-sheet')).toBeTruthy();
    expect(mockAuthState.logout).not.toHaveBeenCalled();
  });

  it('shows a real account-check loading state before account-sensitive actions', async () => {
    let resolveProfile: ((value: typeof mockProfile) => void) | undefined;
    mockedGetMyProfile.mockImplementationOnce(
      () =>
        new Promise<typeof mockProfile>(resolve => {
          resolveProfile = resolve;
        })
    );

    renderSettings();

    expect(screen.getByTestId('settings-account-loading')).toBeTruthy();
    expect(screen.getByTestId('settings-sign-out')).toBeTruthy();

    fireEvent.press(screen.getByTestId('settings-sign-out'));
    expect(screen.getByTestId('settings-sign-out-sheet')).toBeTruthy();
    fireEvent.press(screen.getByTestId('settings-sign-out-cancel'));

    resolveProfile?.(mockProfile);
    await waitForSettingsAccountCheck();
  });

  it('does not send a deletion request while the account check is pending', async () => {
    mockedGetMyProfile.mockImplementationOnce(
      () => new Promise<typeof mockProfile>(() => undefined)
    );

    renderSettings();

    expect(screen.getByTestId('settings-account-loading')).toBeTruthy();
    expect(screen.queryByTestId('settings-delete-account')).toBeNull();
    fireEvent.press(screen.getByTestId('settings-sign-out'));
    expect(screen.getByTestId('settings-sign-out-sheet')).toBeTruthy();
    expect(mockAuthState.logout).not.toHaveBeenCalled();
  });

  it('uses the current account state without a profile request when offline', async () => {
    mockNetworkState.isOnline = false;

    renderSettings();

    await waitFor(() => {
      expect(
        screen.getByText('Your saved settings are still here.')
      ).toBeTruthy();
    });
    expect(mockedGetMyProfile).not.toHaveBeenCalled();

    expect(screen.getByTestId('settings-sign-out')).toBeTruthy();
    expect(screen.queryByText('Edit profile')).toBeNull();
  });

  it('names and retries the failed profile read without blaming notifications', async () => {
    mockedGetMyProfile.mockRejectedValue(
      new Error('profile check unavailable')
    );

    renderSettings();

    await waitFor(() => {
      expect(screen.getByTestId('settings-retry-profile')).toBeTruthy();
    });
    expect(screen.getByText('Could not load your profile.')).toBeTruthy();
    expect(
      screen.getByText('Try loading your name and profile photo again.')
    ).toBeTruthy();
    expect(
      screen.getByText('Proof reminders, reviews and group updates.')
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('settings-sign-out'));
    expect(screen.getByTestId('settings-sign-out-sheet')).toBeTruthy();
    expect(mockAuthState.logout).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('settings-sign-out-cancel'));

    fireEvent.press(
      screen.getByRole('button', {
        name: 'Notifications. Proof reminders, reviews and group updates.',
      })
    );
    expect(mockRouter.push).toHaveBeenCalledWith('/notification-settings');

    mockedGetMyProfile.mockResolvedValue(mockProfile);
    fireEvent.press(screen.getByTestId('settings-retry-profile'));

    await waitFor(() => {
      expect(mockedGetMyProfile).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Notifications')).toBeTruthy();
    });
  });

  it('offers sign-in recovery instead of using a missing profile', async () => {
    mockedGetMyProfile.mockResolvedValue(null);

    renderSettings();

    await waitFor(() => {
      expect(screen.getByTestId('settings-sign-in-again')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('settings-sign-in-again'));

    expect(mockAuthState.clearAuthData).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });

  it('clears a revoked local session before returning to sign-in', async () => {
    mockAuthState.isAuthenticated = false;

    renderSettings();

    await waitFor(() => {
      expect(screen.getByTestId('settings-sign-in-again')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('settings-sign-in-again'));

    expect(mockedGetMyProfile).not.toHaveBeenCalled();
    expect(mockAuthState.clearAuthData).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');
  });

  it('ignores a completed check for the account that signed out during it', async () => {
    const resolveFirstChecks: Array<(value: typeof mockProfile) => void> = [];
    const nextAccountProfile = { ...mockProfile, id: 'user-2' };
    mockedGetMyProfile.mockImplementation(() =>
      mockAuthState.user?.id === 'user-1'
        ? new Promise<typeof mockProfile>(resolve => {
            resolveFirstChecks.push(resolve);
          })
        : Promise.resolve(nextAccountProfile)
    );

    const view = renderSettings();
    await waitFor(() => {
      expect(mockedGetMyProfile).toHaveBeenCalledTimes(1);
    });

    mockAuthState.user = { id: 'user-2' };
    view.rerender(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <ThemeProvider>
          <SettingsScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    );

    await waitFor(() => {
      expect(mockedGetMyProfile).toHaveBeenCalledTimes(2);
    });
    resolveFirstChecks.forEach(resolve => resolve(mockProfile));

    await waitForSettingsAccountCheck();
    expect(screen.queryByTestId('settings-sign-in-again')).toBeNull();
  });
});
