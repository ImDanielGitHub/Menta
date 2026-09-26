import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';

import CreateChallengeScreen from '@/app/create-challenge';

const CREATED_CHALLENGE_ID = '11111111-1111-4111-8111-111111111111';

const mockRouter = {
  back: jest.fn(),
  dismissTo: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
const mockRouteParams: Record<string, string> = {};
const mockQueryClient = {
  invalidateQueries: jest.fn(),
  setQueryData: jest.fn(),
};
const mockCreateChallengeWithPayment = jest.fn();
const mockGetCreatePromiseQuote = jest.fn();
const mockFetchBalance = jest.fn();
const mockGateCreate = jest.fn();
const mockClearPromiseCreationDraft = jest.fn();
const mockLoadPromiseCreationDraft = jest.fn();
const mockSavePromiseCreationDraft = jest.fn();
const mockIsLegalAcceptanceRequiredError = jest.fn();
const mockIsPro = jest.fn();
const mockEmitConfirmedOutcome = jest.fn();

const mockChallengeState = {
  createChallengeWithPayment: mockCreateChallengeWithPayment,
  getCreatePromiseQuote: mockGetCreatePromiseQuote,
  getOrCreateChallengeInviteCode: jest.fn(),
  isLoading: false,
  shareChallenge: jest.fn(),
  userChallenges: [] as unknown[],
};
const mockMomentaState = {
  balance: 100,
  fetchBalance: mockFetchBalance,
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockRouteParams,
  useRouter: () => mockRouter,
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('@/store/challenge-store', () => ({
  useChallengeStore: (
    selector: (state: typeof mockChallengeState) => unknown
  ) => selector(mockChallengeState),
}));

jest.mock('@/store/momenta-store', () => ({
  useMomentaStore: Object.assign(
    (selector: (state: typeof mockMomentaState) => unknown) =>
      selector(mockMomentaState),
    { getState: () => mockMomentaState }
  ),
}));

jest.mock('@/store/group-store', () => {
  const mockGroupState = {
    groups: [] as unknown[],
    userGroups: [] as string[],
    fetchUserGroups: () => Promise.resolve(),
  };
  return {
    useGroupStore: (selector: (state: typeof mockGroupState) => unknown) =>
      selector(mockGroupState),
  };
});

jest.mock('@/lib/hooks/useActionCosts', () => ({
  useActionCosts: () => ({ create_challenge: 30 }),
}));

jest.mock('@/lib/hooks/useQuotaGate', () => ({
  useQuotaGate: () => ({ gateCreate: mockGateCreate }),
}));

jest.mock('@/lib/paywall/revenuecat', () => ({
  RevenueCatAPI: {
    isPro: (...args: unknown[]) => mockIsPro(...args),
    refreshCustomerInfo: jest.fn(),
  },
}));

jest.mock('@/lib/promise-creation-draft', () => ({
  clearPromiseCreationDraft: (...args: unknown[]) =>
    mockClearPromiseCreationDraft(...args),
  loadPromiseCreationDraft: (...args: unknown[]) =>
    mockLoadPromiseCreationDraft(...args),
  savePromiseCreationDraft: (...args: unknown[]) =>
    mockSavePromiseCreationDraft(...args),
}));

jest.mock('@/lib/onboarding-draft', () => ({
  clearOnboardingDraft: jest.fn(),
}));

jest.mock('@/lib/legal-acceptance', () => ({
  isLegalAcceptanceRequiredError: (...args: unknown[]) =>
    mockIsLegalAcceptanceRequiredError(...args),
}));

jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: (source: string, receiptId: string) => ({
    confirmed: true,
    receiptId,
    source,
  }),
  emitConfirmedOutcome: (...args: unknown[]) =>
    mockEmitConfirmedOutcome(...args),
}));

jest.mock('@/components/paywall/PaywallModal', () => {
  const mockModule = (() => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return ({ onClose, visible }: { onClose: () => void; visible: boolean }) =>
      visible ? (
        <Pressable accessibilityRole="button" onPress={onClose}>
          <Text>Return to draft</Text>
        </Pressable>
      ) : null;
  })();
  const mockExport = mockModule?.__esModule ? mockModule.default : mockModule;
  return { __esModule: true, default: mockExport, PaywallModal: mockExport };
});

const createdChallenge = {
  id: CREATED_CHALLENGE_ID,
  title: 'Morning release walk',
  description: 'Walk outside before the workday begins.',
  category: 'health',
  startDate: '2026-08-10',
  endDate: '2026-08-16',
  duration: 7,
  createdAt: '2026-08-10T00:00:00.000Z',
  creatorId: 'user-1',
  verificationType: 'photo',
  verificationFrequency: 'daily',
  isPublic: false,
  difficulty: 'easy' as const,
  pointsValue: 100,
  verificationDescription: 'Post one clear photo from the walk.',
  submissionText: 'Share one thing you noticed.',
  allowExtensions: true,
  maxExtensions: 3,
  deadlineType: 'fixed' as const,
  status: 'active',
  extensionCount: 0,
  allowSelfReview: true,
};

/** Walks name → proof → (who) → length and stops on the review step. */
const advanceToReview = async () => {
  render(<CreateChallengeScreen />);

  await waitFor(() => {
    expect(screen.getByTestId('create-promise-primary-name')).toBeEnabled();
  });

  fireEvent.press(screen.getByTestId('create-promise-primary-name'));
  fireEvent.press(screen.getByTestId('create-promise-primary-proof'));
  if (screen.queryByTestId('create-promise-primary-who')) {
    fireEvent.press(screen.getByTestId('create-promise-primary-who'));
  }
  fireEvent.press(screen.getByTestId('create-promise-primary-length'));
  await waitFor(() => {
    expect(screen.getByTestId('create-promise-primary-review')).toBeTruthy();
  });
};

const reachFirstPromiseReceipt = async () => {
  await advanceToReview();
  fireEvent.press(screen.getByTestId('create-promise-primary-review'));

  await waitFor(() => {
    expect(screen.getByTestId('create-challenge-receipt-sheet')).toBeTruthy();
  });
};

describe('CreateChallengeScreen confirmed receipt navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockRouteParams).forEach(key => delete mockRouteParams[key]);
    Object.assign(mockRouteParams, {
      mode: 'solo',
      templateId: 'morning_walk',
    });
    mockMomentaState.balance = 100;
    mockChallengeState.userChallenges = [];
    mockIsPro.mockResolvedValue(true);
    mockLoadPromiseCreationDraft.mockResolvedValue(null);
    mockSavePromiseCreationDraft.mockResolvedValue(undefined);
    mockClearPromiseCreationDraft.mockResolvedValue(undefined);
    mockFetchBalance.mockResolvedValue(undefined);
    mockGateCreate.mockResolvedValue({ allowed: true });
    mockGetCreatePromiseQuote.mockResolvedValue({
      cost: 0,
      activePromises: 0,
      challengesCreatedThisMonth: 0,
      isPro: false,
    });
    mockIsLegalAcceptanceRequiredError.mockReturnValue(false);
    mockCreateChallengeWithPayment.mockResolvedValue({
      challenge: createdChallenge,
      receipt: {
        isFirstPromise: true,
        nextDueAt: '2026-08-10T13:00:00.000Z',
      },
    });
    mockQueryClient.invalidateQueries.mockResolvedValue(undefined);
    mockQueryClient.setQueryData.mockImplementation((_queryKey, updater) =>
      updater([])
    );
  });

  it('primes the group promise query before opening the created group', async () => {
    Object.assign(mockRouteParams, {
      mode: 'group',
      groupId: 'group-1',
    });

    await reachFirstPromiseReceipt();

    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['groups', 'account', 'user-1', 'detail', 'group-1', 'challenges'],
      expect.any(Function)
    );
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: [
        'groups',
        'account',
        'user-1',
        'detail',
        'group-1',
        'challenges',
      ],
    });

    const cached = mockQueryClient.setQueryData.mock.results[0]?.value;
    expect(cached).toEqual([
      expect.objectContaining({
        id: CREATED_CHALLENGE_ID,
        title: 'Morning release walk',
      }),
    ]);
    expect(screen.getByText('Group members review')).toBeTruthy();
    expect(screen.getByText('Group members')).toBeTruthy();
    expect(mockEmitConfirmedOutcome).toHaveBeenCalledWith('promise-created', {
      confirmed: true,
      receiptId: CREATED_CHALLENGE_ID,
      source: 'promise-creation',
    });

    fireEvent.press(screen.getByRole('button', { name: 'Open group' }));
    expect(mockRouter.replace).toHaveBeenCalledWith('/groups/group-1');
  });

  it('exits the creation modal and opens the server-confirmed promise', async () => {
    await reachFirstPromiseReceipt();

    expect(screen.getByText('Saved to your account')).toBeTruthy();
    expect(screen.getByText('First due')).toBeTruthy();
    // Daily promises start counting tomorrow; the receipt must agree with the
    // review instead of rendering the server's legacy UTC deadline hour.
    const receipt = within(
      screen.getByTestId('create-challenge-first-promise-receipt')
    );
    expect(receipt.getByText('Tomorrow')).toBeTruthy();
    expect(receipt.queryByText(/\d:\d\d\s?(AM|PM|am|pm)/)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Open my promise' })
    ).toBeTruthy();

    await act(async () => {
      fireEvent.press(
        screen.getByTestId('create-challenge-view-first-promise')
      );
    });

    expect(mockRouter.dismissTo).toHaveBeenCalledWith({
      pathname: '/challenges/[id]',
      params: { id: CREATED_CHALLENGE_ID },
    });
    expect(mockRouter.replace).not.toHaveBeenCalledWith(
      expect.stringContaining('/challenges/')
    );
  });

  it('keeps Back to Today on the main-tab destination', async () => {
    await reachFirstPromiseReceipt();

    fireEvent.press(screen.getByRole('button', { name: 'Back to Today' }));

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });

  it('walks the promise steps with canonical radio choices', async () => {
    render(<CreateChallengeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('create-promise-primary-name')).toBeEnabled();
    });
    expect(screen.getByTestId('create-promise-progress')).toBeTruthy();

    fireEvent.press(screen.getByTestId('create-promise-primary-name'));

    expect(screen.getByRole('radio', { name: /^Photo/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /^Note/ })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /^Video/ })).not.toBeChecked();

    const proofRule = screen.getByTestId(
      'create-promise-reviewer-instructions-input'
    );
    fireEvent.changeText(proofRule, 'Yeshq q');
    expect(screen.getByTestId('create-promise-primary-proof')).toBeDisabled();
    fireEvent.changeText(proofRule, 'Yeshq qq');
    expect(screen.getByTestId('create-promise-primary-proof')).toBeEnabled();

    fireEvent.press(screen.getByTestId('create-promise-primary-proof'));
    expect(
      screen.getByRole('radio', { name: /^Just me for now/ })
    ).toBeChecked();
    expect(
      screen.getByTestId('create-promise-reviewer-friend')
    ).not.toBeChecked();

    fireEvent.press(screen.getByTestId('create-promise-primary-who'));
    const checkedDurations = [7, 14, 30].filter(days => {
      const row = screen.getByTestId(`create-promise-duration-${days}`);
      return row.props.accessibilityState?.checked === true;
    });
    expect(checkedDurations).toHaveLength(1);
    expect(screen.getByTestId('create-promise-days-weekdays')).toBeTruthy();

    fireEvent.press(screen.getByTestId('create-promise-primary-length'));
    expect(screen.getByText('Ready to start?')).toBeTruthy();
    expect(screen.getByText(/Every day/)).toBeTruthy();
    expect(screen.getByText('Tomorrow')).toBeTruthy();
  });

  it('creates a weekday promise that counts only Monday to Friday', async () => {
    render(<CreateChallengeScreen />);
    await waitFor(() =>
      expect(screen.getByTestId('create-promise-primary-name')).toBeEnabled()
    );
    fireEvent.press(screen.getByTestId('create-promise-primary-name'));
    fireEvent.press(screen.getByTestId('create-promise-primary-proof'));
    fireEvent.press(screen.getByTestId('create-promise-primary-who'));

    fireEvent.press(screen.getByTestId('create-promise-days-weekdays'));
    expect(screen.getByTestId('create-promise-days-weekdays')).toBeChecked();

    fireEvent.press(screen.getByTestId('create-promise-primary-length'));
    expect(screen.getByText(/Weekdays/)).toBeTruthy();

    fireEvent.press(screen.getByTestId('create-promise-primary-review'));
    await waitFor(() =>
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledWith(
        expect.objectContaining({ checkInWeekdays: [1, 2, 3, 4, 5] })
      )
    );
  });

  it('keeps an explicit route template ahead of an unrelated saved draft', async () => {
    mockLoadPromiseCreationDraft.mockResolvedValueOnce({
      ownerUserId: 'user-1',
      currentStep: 0,
      title: '',
      description: '',
      proofType: 'photo',
      proofDescription: '',
      submissionText: '',
      duration: 14,
      difficulty: 'medium',
      unknownCreateResultAt: null,
      todayReadbackRequestedAt: null,
    });

    render(<CreateChallengeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('create-promise-primary-name')).toBeEnabled();
    });

    expect(mockLoadPromiseCreationDraft).not.toHaveBeenCalled();
    expect(screen.getByTestId('create-promise-name-input').props.value).toBe(
      'Morning walk'
    );
    fireEvent.press(screen.getByTestId('create-promise-primary-name'));
    expect(
      screen
        .getByTestId('create-promise-reviewer-instructions-input')
        .props.value.trim().length
    ).toBeGreaterThanOrEqual(8);
  });

  it('offers a top-up from the review when Momenta is short', async () => {
    mockMomentaState.balance = 20;
    mockIsPro.mockResolvedValue(false);
    mockGetCreatePromiseQuote.mockResolvedValue({
      cost: 30,
      activePromises: 1,
      challengesCreatedThisMonth: 1,
      isPro: false,
    });

    await advanceToReview();

    await waitFor(() => expect(screen.getByText('Almost there')).toBeTruthy());
    expect(screen.getByText('YOU HAVE')).toBeTruthy();
    expect(screen.getByText('20 Momenta')).toBeTruthy();

    fireEvent.press(
      screen.getByRole('button', { name: 'Get 10 more Momenta' })
    );
    expect(
      await screen.findByRole('button', { name: 'Return to draft' })
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Return to draft' }));

    // Closing the top-up returns to the same review, not an error notice.
    expect(screen.getByText('Almost there')).toBeTruthy();
    expect(screen.queryByText('Save draft and exit')).toBeNull();
    expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
    expect(mockEmitConfirmedOutcome).not.toHaveBeenCalled();
  });

  it('shows the cost beside the start button and spends it in one tap', async () => {
    mockGetCreatePromiseQuote.mockResolvedValue({
      cost: 30,
      activePromises: 1,
      challengesCreatedThisMonth: 1,
      isPro: false,
    });

    await advanceToReview();

    await waitFor(() => expect(screen.getByText('70 of 100')).toBeTruthy());
    expect(screen.getByText('30 Momenta')).toBeTruthy();
    expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Start my promise' }));
    await waitFor(() =>
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1)
    );
    expect(mockCreateChallengeWithPayment).toHaveBeenCalledWith(
      expect.objectContaining({ cost: 30 })
    );
  });

  it('preserves the draft and opens explicit legal acceptance when authoring is gated', async () => {
    const legalError = new Error('LEGAL_ACCEPTANCE_REQUIRED');
    mockCreateChallengeWithPayment.mockRejectedValueOnce(legalError);
    mockIsLegalAcceptanceRequiredError.mockImplementation(
      error => error === legalError
    );

    await advanceToReview();
    fireEvent.press(screen.getByTestId('create-promise-primary-review'));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/legal-acceptance',
        params: {
          next: '/create-challenge?mode=solo',
          surface: 'pre_authoring',
        },
      })
    );
    expect(mockSavePromiseCreationDraft).toHaveBeenCalled();
  });
});
