import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import SupportScreen from '@/app/support';
import { listOpenReportDraftsForUser } from '@/lib/report-drafts';
import type { ReportDraft } from '@/lib/report-drafts';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockAuthState: {
  isAuthenticated: boolean;
  user: { id: string } | null;
} = {
  isAuthenticated: true,
  user: { id: 'account-one' },
};

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.3',
  nativeBuildVersion: '7',
}));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => mockRouter,
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => mockAuthState,
}));
jest.mock('@/lib/network', () => ({
  useNetworkState: () => ({
    isConnected: true,
    isInternetReachable: true,
    refresh: jest.fn(),
  }),
}));
jest.mock('@/lib/proof-drafts', () => ({
  listResumableProofDrafts: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/report-drafts', () => ({
  getReportDraftCopy: (status: string) => ({
    title:
      status === 'result-unknown'
        ? 'Send result unknown'
        : 'Draft saved on this phone',
    description: 'Nothing has been sent to support.',
  }),
  listOpenReportDraftsForUser: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/paywall/revenuecat', () => ({
  restorePurchases: jest.fn(),
}));
jest.mock('@/components/support/OfflineSupportNotice', () => ({
  OfflineSupportNotice: () => null,
}));
jest.mock('@/components/ui/icons', () => ({
  AlertTriangleIcon: () => null,
  ArrowRightIcon: () => null,
  ChevronRightIcon: () => null,
  FileTextIcon: () => null,
  HelpCircleIcon: () => null,
  MessageSquareIcon: () => null,
  RefreshCcwIcon: () => null,
  SettingsIcon: () => null,
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
    AppButton: ({
      disabled,
      onPress,
      testID,
      title,
    }: {
      disabled?: boolean;
      onPress?: () => void;
      testID?: string;
      title: string;
    }) => (
      <Pressable disabled={disabled} onPress={onPress} testID={testID}>
        <Text>{title}</Text>
      </Pressable>
    ),
    AppInlineNotice: ({ title }: { title: string }) => <Text>{title}</Text>,
    AppListRow: ({ title }: { title: string }) => <Text>{title}</Text>,
    SkeletonLoader: () => null,
  };
});

describe('SupportScreen navigation and copy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.canGoBack.mockReturnValue(false);
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'account-one' };
    jest.mocked(listOpenReportDraftsForUser).mockResolvedValue([]);
  });

  it('preserves the exact sharing boundary and recovers a cold route through Settings', () => {
    render(<SupportScreen />);

    expect(
      screen.getByText(
        'Choose what you need. You can review everything before sending.'
      )
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('top-bar-back'));

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/settings');
  });

  it('shows support destinations as readable rows while preserving routes', async () => {
    render(<SupportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Report an issue')).toBeTruthy();
      expect(screen.getByText('Share feedback')).toBeTruthy();
    });
    expect(screen.getByText('Check app and connection')).toBeTruthy();
    expect(screen.getByText('Open phone settings')).toBeTruthy();
    expect(screen.queryByTestId('support-toggle-more-help')).toBeNull();

    fireEvent.press(screen.getByTestId('support-report-issue'));
    expect(mockRouter.push).toHaveBeenCalledWith('/report-issue');

    fireEvent.press(screen.getByTestId('support-share-feedback'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/report-issue',
      params: {
        mode: 'feedback',
        newReport: '1',
        source: 'settings_feedback',
      },
    });

    fireEvent.press(screen.getByText('Open phone settings'));
    expect(mockRouter.push).toHaveBeenCalledWith('/system-settings');
  });

  it('does not report a failed receipt check as no purchase found', async () => {
    const { restorePurchases } = jest.requireMock(
      '@/lib/paywall/revenuecat'
    ) as { restorePurchases: jest.Mock };
    restorePurchases.mockResolvedValueOnce({
      success: false,
      errorMessage: 'Apple receipt service was unavailable.',
    });

    render(<SupportScreen />);
    fireEvent.press(screen.getByTestId('support-restore-purchases'));

    expect(
      await screen.findByText('Could not check earlier purchases')
    ).toBeTruthy();
    expect(screen.queryByText('No matching purchase was found')).toBeNull();
  });

  it('reopens the selected saved report by its stable draft ID', async () => {
    const makeDraft = (id: string, title: string): ReportDraft => ({
      id,
      userId: 'account-one',
      contextKey: `support:${id}`,
      status: 'draft',
      title,
      description: `${title} details`,
      observedBehavior: '',
      expectedBehavior: '',
      stepsToReproduce: '',
      source: 'support',
      reportKind: 'challenge',
      challengeId: id,
      groupId: null,
      submissionId: null,
      contextLabel: 'Morning walk',
      crashReference: null,
      attachments: [],
      submissionSnapshot: null,
      serverReceiptId: null,
      lastError: null,
      attemptCount: 0,
      createdAt: '2026-08-12T00:00:00.000Z',
      updatedAt: '2026-08-12T00:00:00.000Z',
    });
    jest
      .mocked(listOpenReportDraftsForUser)
      .mockResolvedValueOnce([
        makeDraft('draft-two', 'Camera stayed black'),
        makeDraft('draft-one', 'Receipt did not appear'),
      ]);

    render(<SupportScreen />);

    expect(await screen.findByText('Saved reports')).toBeTruthy();
    expect(screen.getByText('Camera stayed black')).toBeTruthy();
    expect(screen.getByText('Receipt did not appear')).toBeTruthy();

    fireEvent.press(screen.getByTestId('support-report-draft-draft-one'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/report-issue',
      params: { draftId: 'draft-one' },
    });
  });

  it('keeps signed-out help visible while private actions require sign-in', () => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.user = null;

    render(<SupportScreen />);

    expect(screen.getByText('Sign in to report an issue')).toBeTruthy();
    expect(listOpenReportDraftsForUser).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('support-report-issue'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/auth-required',
      params: { next: '/report-issue' },
    });

    fireEvent.press(screen.getByTestId('top-bar-back'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/login');

    fireEvent.press(screen.getByTestId('support-restore-purchases'));
    expect(mockRouter.push).toHaveBeenLastCalledWith({
      pathname: '/auth-required',
      params: { next: '/support' },
    });
  });
});
