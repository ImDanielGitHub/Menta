import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LegalAcceptanceScreen from '@/app/legal-acceptance';
import { ThemeProvider } from '@/constants/ThemeContext';
import { resolvePhoneLayout } from '@/constants/phone-layout';

let mockPhoneLayout = resolvePhoneLayout({
  width: 390,
  height: 844,
  fontScale: 1,
});

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

const mockReplace = jest.fn();
const mockGetStatus = jest.fn();
const mockAccept = jest.fn();
let mockParams: {
  back?: string;
  next: string;
  surface: string;
} = {
  next: '/create-challenge?mode=solo',
  surface: 'pre_authoring',
};
let mockUserId: string | null = 'user-a';
let mockHasCompletedOnboarding = true;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/lib/network', () => ({
  networkManager: { isOnline: () => true },
}));

jest.mock('@/lib/legal-acceptance', () => {
  const actual = jest.requireActual('@/lib/legal-acceptance');
  return {
    ...actual,
    acceptCurrentLegalDocuments: (...args: unknown[]) => mockAccept(...args),
    getMyLegalAcceptanceStatus: (...args: unknown[]) => mockGetStatus(...args),
  };
});

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: mockUserId ? { id: mockUserId } : null,
      hasCompletedOnboarding: mockHasCompletedOnboarding,
    }),
}));

jest.mock('@/components/ui/icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => React.createElement(View);
  return {
    AlertCircleIcon: Icon,
    AlertTriangleIcon: Icon,
    ArrowLeftIcon: Icon,
    CheckCircleIcon: Icon,
    CheckIcon: Icon,
    ChevronRightIcon: Icon,
    FileTextIcon: Icon,
    ExternalLinkIcon: Icon,
    InfoIcon: Icon,
    LockIcon: Icon,
    ShieldIcon: Icon,
    UsersIcon: Icon,
  };
});

const status = {
  userId: 'user-a',
  accepted: false,
  requiresAcceptance: true,
  reason: 'missing_or_stale',
  current: {
    terms: {
      version: '2026-08-13',
      url: 'https://menta.quest/terms',
      effectiveAt: '2026-08-13T00:00:00.000Z',
    },
    privacy: {
      version: '2026-08-13',
      url: 'https://menta.quest/privacy',
      effectiveAt: '2026-08-13T00:00:00.000Z',
    },
    community_standards: {
      version: '2026-08-13',
      url: 'https://menta.quest/community-standards',
      effectiveAt: '2026-08-13T00:00:00.000Z',
    },
  },
  enforcement: { promiseCreationRequired: true },
  receipt: null,
} as const;

const renderRoute = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>
        <LegalAcceptanceScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('LegalAcceptanceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'user-a';
    mockHasCompletedOnboarding = true;
    mockParams = {
      next: '/create-challenge?mode=solo',
      surface: 'pre_authoring',
    };
    mockGetStatus.mockResolvedValue(status);
    mockAccept.mockResolvedValue({
      ...status,
      accepted: true,
      requiresAcceptance: false,
      reason: 'current',
      receipt: { id: 'receipt-1' },
    });
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
    'fits post-auth legal review to the $width-point AXXL envelope',
    async ({ width, height, fontSize, lineHeight }) => {
      mockPhoneLayout = resolvePhoneLayout({
        width,
        height,
        fontScale: 2.35,
      });
      renderRoute();

      expect(await screen.findByTestId('legal-acceptance-title')).toHaveStyle({
        fontSize,
        lineHeight,
      });
      expect(screen.getByText('Terms of Use')).toBeTruthy();
      expect(screen.getByTestId('legal-acceptance-submit')).toBeTruthy();
    }
  );

  it('requires one explicit confirmation and continues only after server confirmation', async () => {
    renderRoute();

    await waitFor(() =>
      expect(screen.getByTestId('legal-acceptance-title')).toBeTruthy()
    );
    expect(
      screen.getByTestId('legal-document-links-terms').props.accessibilityLabel
    ).toBe('Terms of Use. Read the current terms.');

    expect(screen.getByTestId('legal-acceptance-mascot')).toBeTruthy();
    expect(
      screen.getByText(
        'Read the three short documents below, then agree before creating a promise.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Terms of Use')).toBeTruthy();
    expect(screen.getByText('Community Standards')).toBeTruthy();
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getByText('Back').props.numberOfLines).toBe(1);

    const confirmation = screen.getByTestId(
      'legal-acceptance-confirmation-control'
    );
    const submit = screen.getByTestId('legal-acceptance-submit');
    expect(confirmation.props.accessibilityState).toEqual({ checked: false });
    expect(submit.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(confirmation);
    fireEvent.press(screen.getByTestId('legal-acceptance-submit'));

    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalledWith(
        status,
        'pre_authoring',
        'user-a'
      );
      expect(mockReplace).toHaveBeenCalledWith('/create-challenge?mode=solo');
    });
  });

  it('keeps public document links and a retry when status cannot load', async () => {
    mockGetStatus.mockRejectedValueOnce(new Error('offline'));
    renderRoute();

    await waitFor(() =>
      expect(screen.getByTestId('legal-acceptance-retry')).toBeTruthy()
    );
    expect(screen.getByTestId('legal-document-links-terms')).toBeTruthy();
    expect(
      screen.getByTestId('legal-document-links-community_standards')
    ).toBeTruthy();
    expect(screen.getByTestId('legal-document-links-privacy')).toBeTruthy();
    expect(screen.queryByTestId('legal-acceptance-submit')).toBeNull();
  });

  it('returns a current receipt to the exact onboarding resume marker', async () => {
    mockParams = {
      back: '/onboarding?resume=legal-declined',
      next: '/onboarding?resume=legal-accepted',
      surface: 'pre_authoring',
    };
    mockGetStatus.mockResolvedValueOnce({
      ...status,
      accepted: true,
      requiresAcceptance: false,
      reason: 'current',
      receipt: {
        id: 'receipt-1',
        acceptedAt: '2026-08-13T01:00:00.000Z',
        surface: 'pre_authoring',
        appVersion: '1.8.0',
        appBuild: '118',
        platform: 'ios',
        locale: 'en-NZ',
      },
    });
    renderRoute();

    await waitFor(() =>
      expect(screen.getByTestId('legal-acceptance-continue')).toBeTruthy()
    );
    fireEvent.press(screen.getByTestId('legal-acceptance-continue'));

    expect(mockReplace).toHaveBeenCalledWith(
      '/onboarding?resume=legal-accepted'
    );
    expect(mockAccept).not.toHaveBeenCalled();
  });

  it('uses a different onboarding return when the user leaves without accepting', async () => {
    mockHasCompletedOnboarding = false;
    mockParams = {
      back: '/onboarding?resume=legal-declined',
      next: '/onboarding?resume=legal-accepted',
      surface: 'pre_authoring',
    };
    renderRoute();

    await waitFor(() =>
      expect(screen.getByTestId('legal-acceptance-submit')).toBeTruthy()
    );
    fireEvent.press(screen.getByRole('button', { name: 'Leave legal review' }));

    expect(mockReplace).toHaveBeenCalledWith(
      '/onboarding?resume=legal-declined'
    );
  });

  it('does not let an incomplete account return to a protected route', async () => {
    mockHasCompletedOnboarding = false;
    mockParams = {
      next: '/create-challenge?mode=solo',
      surface: 'pre_authoring',
    };
    renderRoute();

    await waitFor(() =>
      expect(screen.getByTestId('legal-acceptance-submit')).toBeTruthy()
    );
    fireEvent.press(
      screen.getByTestId('legal-acceptance-confirmation-control')
    );
    fireEvent.press(screen.getByTestId('legal-acceptance-submit'));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/onboarding')
    );
  });
});
