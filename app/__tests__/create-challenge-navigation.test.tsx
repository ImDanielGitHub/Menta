import React from 'react';
jest.mock('@/hooks/use-menta-check', () => ({
  useMentaCheckToday: () => ({ data: [] }),
  useMentaCheckOverview: () => ({
    data: mockMentaOverview,
    refetch: mockMentaRefetch,
  }),
}));
jest.mock('@/components/menta-check/menta-trial-notice', () => ({
  MentaTrialNotice: () => null,
}));
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';

import type {
  PromiseCreationDraftInput,
  PromiseReceiptRecovery,
} from '@/lib/promise-creation-draft';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateChallengeRoute from '@/app/create-challenge';
import PaywallHost from '@/components/paywall/PaywallHost';
import { NavigationContext } from 'expo-router/react-navigation';
import * as paywallApi from '@/lib/paywall/manager';

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
let mockDraftRuntime: typeof import('@/lib/promise-creation-draft');
const mockIsLegalAcceptanceRequiredError = jest.fn();
const mockIsPro = jest.fn();
const mockEmitConfirmedOutcome = jest.fn();
let mockUserId = 'user-1';
let mockFocused = true;
const mockFocusListeners = {
  focus: new Set<() => void>(),
  blur: new Set<() => void>(),
};
const mockNavigation = {
  isFocused: () => mockFocused,
  addListener: (event: 'focus' | 'blur', listener: () => void) => {
    mockFocusListeners[event].add(listener);
    return () => mockFocusListeners[event].delete(listener);
  },
};
const setFocused = (focused: boolean) => {
  mockFocused = focused;
  mockFocusListeners[focused ? 'focus' : 'blur'].forEach(listener =>
    listener()
  );
};
const CreateChallengeScreen = () => (
  <NavigationContext.Provider value={mockNavigation as never}>
    <CreateChallengeRoute />
    <PaywallHost />
  </NavigationContext.Provider>
);
jest.mock('expo-router/react-navigation', () => ({
  ...jest.requireActual(
    'expo-router/build/react-navigation/core/NavigationContext'
  ),
  ...jest.requireActual(
    'expo-router/build/react-navigation/core/useFocusEffect'
  ),
}));
jest.mock('@/lib/hooks/use-rewarded-momenta-ad', () => ({
  useRewardedMomentaAd: () => ({ watch: jest.fn(), available: false }),
}));
jest.mock('@/lib/hooks/useAdReward', () => ({ useAdRewardAmount: () => 10 }));
const mockMentaOverview = { consented: true, isPro: false, passCost: 20 };
const mockMentaRefetch = jest.fn();

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
  useAuthStore: () => ({ user: { id: mockUserId } }),
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
  withPromiseCreationRequest: (
    owner: string,
    operation: () => Promise<unknown>
  ) => mockDraftRuntime.withPromiseCreationRequest(owner, operation),
  retainPromiseCreationReceipt: (input: PromiseCreationDraftInput) =>
    mockDraftRuntime.retainPromiseCreationReceipt(input),
  subscribePromiseCreationReceipts: (
    owner: string,
    listener: (receipt: PromiseReceiptRecovery) => void
  ) => mockDraftRuntime.subscribePromiseCreationReceipts(owner, listener),
  getPromiseCreationReceiptRecovery: (owner: string) =>
    mockDraftRuntime.getPromiseCreationReceiptRecovery(owner),
  cancelPromiseCreationAttempt: (
    ...args: Parameters<typeof mockDraftRuntime.cancelPromiseCreationAttempt>
  ) => mockDraftRuntime.cancelPromiseCreationAttempt(...args),
  saveFreshPromiseCreationDraft: (
    ...args: Parameters<typeof mockDraftRuntime.saveFreshPromiseCreationDraft>
  ) => mockDraftRuntime.saveFreshPromiseCreationDraft(...args),
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
    return ({
      onClose,
      onBuyPro,
      onContinueFree,
      visible,
    }: {
      onClose: () => void;
      onBuyPro: () => Promise<void>;
      onContinueFree?: () => void;
      visible: boolean;
    }) =>
      visible ? (
        <>
          {onContinueFree ? (
            <Pressable accessibilityRole="button" onPress={onContinueFree}>
              <Text>Continue with free</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={onClose}>
            <Text>Return to draft</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await onBuyPro();
              onClose();
            }}
          >
            <Text>Confirmed Pro activation</Text>
          </Pressable>
        </>
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
const advanceToReview = async (reviewer?: 'menta' | 'friend') => {
  const view = render(<CreateChallengeScreen />);

  await waitFor(() => {
    expect(screen.getByTestId('create-promise-primary-name')).toBeEnabled();
  });

  fireEvent.press(screen.getByTestId('create-promise-primary-name'));
  fireEvent.press(screen.getByTestId('create-promise-primary-proof'));
  if (screen.queryByTestId('create-promise-primary-who')) {
    if (reviewer)
      fireEvent.press(
        screen.getByTestId(`create-promise-reviewer-${reviewer}`)
      );
    fireEvent.press(screen.getByTestId('create-promise-primary-who'));
  }
  fireEvent.press(screen.getByTestId('create-promise-primary-length'));
  await waitFor(() => {
    expect(screen.getByTestId('create-promise-primary-review')).toBeTruthy();
  });
  return view;
};

const reachFirstPromiseReceipt = async () => {
  await advanceToReview();
  fireEvent.press(screen.getByTestId('create-promise-primary-review'));

  await waitFor(() => {
    expect(screen.getByTestId('create-challenge-receipt-sheet')).toBeTruthy();
  });
};

const storageImplementations = {
  getItem: (AsyncStorage.getItem as jest.Mock).getMockImplementation()!,
  setItem: (AsyncStorage.setItem as jest.Mock).getMockImplementation()!,
  removeItem: (AsyncStorage.removeItem as jest.Mock).getMockImplementation()!,
};
const restoreStorageImplementations = () => {
  for (const key of ['getItem', 'setItem', 'removeItem'] as const)
    (AsyncStorage[key] as jest.Mock).mockImplementation(
      storageImplementations[key]
    );
};

describe('CreateChallengeScreen confirmed receipt navigation', () => {
  beforeEach(async () => {
    restoreStorageImplementations();
    jest.isolateModules(() => {
      mockDraftRuntime = jest.requireActual('@/lib/promise-creation-draft');
    });
    await Promise.all(
      ['user-1', 'user-2'].map(owner =>
        mockDraftRuntime.clearPromiseCreationDraft(owner)
      )
    );
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockUserId = 'user-1';
    mockFocused = true;
    mockFocusListeners.focus.clear();
    mockFocusListeners.blur.clear();
    mockMentaRefetch.mockResolvedValue({ data: mockMentaOverview });
    Object.keys(mockRouteParams).forEach(key => delete mockRouteParams[key]);
    Object.assign(mockRouteParams, {
      mode: 'solo',
      templateId: 'morning_walk',
    });
    mockMomentaState.balance = 100;
    mockChallengeState.userChallenges = [];
    mockIsPro.mockResolvedValue(true);
    mockLoadPromiseCreationDraft.mockReset().mockResolvedValue(null);
    mockSavePromiseCreationDraft
      .mockReset()
      .mockImplementation(async input =>
        mockDraftRuntime.buildPromiseCreationDraft(input)
      );
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
    mockCreateChallengeWithPayment.mockReset().mockResolvedValue({
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

  afterEach(() => {
    jest.restoreAllMocks();
    restoreStorageImplementations();
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

    expect(mockLoadPromiseCreationDraft).toHaveBeenCalledWith('user-1');
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

  it('refreshes the server quote and removes the quota notice after confirmed Pro activation without creating automatically', async () => {
    mockGetCreatePromiseQuote.mockResolvedValue({
      cost: 30,
      activePromises: 99,
      challengesCreatedThisMonth: 99,
      isPro: false,
    });
    await advanceToReview();
    fireEvent.press(screen.getByTestId('create-promise-primary-review'));
    await screen.findByRole('button', { name: 'Confirmed Pro activation' });
    expect(screen.getByText('You’re at the free promise limit')).toBeTruthy();
    mockGetCreatePromiseQuote.mockResolvedValue({
      cost: 0,
      activePromises: 99,
      challengesCreatedThisMonth: 99,
      isPro: true,
    });
    await act(async () => {
      fireEvent.press(
        screen.getByRole('button', { name: 'Confirmed Pro activation' })
      );
    });
    expect(screen.queryByText('You’re at the free promise limit')).toBeNull();
    expect(screen.queryByText('Save draft and exit')).toBeNull();
    expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('create-promise-primary-review'));
    await waitFor(() =>
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Morning walk', cost: 0 })
      )
    );
  });

  it.each(['still-free', 'read-failed'])(
    'retains the quota notice when post-purchase readback is %s',
    async outcome => {
      mockGetCreatePromiseQuote.mockResolvedValue({
        cost: 30,
        activePromises: 99,
        challengesCreatedThisMonth: 99,
        isPro: false,
      });
      await advanceToReview();
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await screen.findByRole('button', { name: 'Confirmed Pro activation' });
      if (outcome === 'read-failed')
        mockGetCreatePromiseQuote.mockRejectedValueOnce(new Error('offline'));
      await act(async () => {
        fireEvent.press(
          screen.getByRole('button', { name: 'Confirmed Pro activation' })
        );
      });
      expect(screen.getByText('You’re at the free promise limit')).toBeTruthy();
      expect(screen.getByText('Save draft and exit')).toBeTruthy();
      expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
    }
  );

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
  describe('free Menta Check fallback', () => {
    const openMentaGate = async () => {
      const view = await advanceToReview('menta');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await screen.findByText('Continue with free');
      return view;
    };
    it('uses the real host to return to A friend without creating or losing proof fields', async () => {
      await openMentaGate();
      fireEvent.press(screen.getByText('Continue with free'));
      expect(screen.getByTestId('create-promise-reviewer-friend')).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ checked: true })
      );
      expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
      expect(mockSavePromiseCreationDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          reviewer: { kind: 'friend' },
          proofType: 'photo',
          title: 'Morning walk',
          mentaBackup: false,
          mentaMomenta: false,
        })
      );
      expect(screen.queryByText('Continue with free')).toBeNull();
    });
    it('preserves the reviewer on ordinary close instead of treating it as free consent', async () => {
      await openMentaGate();
      fireEvent.press(screen.getByText('Return to draft'));
      expect(screen.getByTestId('create-promise-primary-review')).toBeTruthy();
      expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
      expect(
        mockSavePromiseCreationDraft.mock.calls.some(
          ([draft]) => draft.reviewer?.kind === 'friend'
        )
      ).toBe(false);
    });
    it.each(['blur', 'unmount', 'account'] as const)(
      'ignores an old free choice after %s',
      async leave => {
        const spy = jest.spyOn(paywallApi, 'openPaywall');
        const view = await openMentaGate();
        const choice = spy.mock.calls.at(-1)![0]!.onContinueFree!;
        if (leave === 'unmount') view.unmount();
        else if (leave === 'blur') act(() => setFocused(false));
        else {
          mockUserId = 'user-2';
          view.rerender(<CreateChallengeScreen />);
        }
        mockSavePromiseCreationDraft.mockClear();
        await act(async () => choice());
        expect(mockSavePromiseCreationDraft).not.toHaveBeenCalled();
        expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
        spy.mockRestore();
        restoreStorageImplementations();
      }
    );
    it('does not let a delayed paid continuation undo the free reviewer choice or create automatically', async () => {
      const spy = jest.spyOn(paywallApi, 'openPaywall');
      await openMentaGate();
      const options = spy.mock.calls.at(-1)![0]!;
      fireEvent.press(screen.getByText('Continue with free'));
      mockMentaRefetch.mockClear();
      await act(async () => {
        options.onContinueFree?.();
        options.onProConfirmed?.();
      });
      expect(mockMentaRefetch).not.toHaveBeenCalled();
      expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
      expect(screen.getByTestId('create-promise-reviewer-friend')).toHaveProp(
        'accessibilityState',
        expect.objectContaining({ checked: true })
      );
      spy.mockRestore();
      restoreStorageImplementations();
    });
    it('retains every extended field when the draft resumes through the free choice', async () => {
      delete mockRouteParams.templateId;
      mockLoadPromiseCreationDraft.mockResolvedValue({
        ownerUserId: 'user-1',
        currentStep: 3,
        stepId: 'review',
        title: 'Evening music practice',
        description: 'Practise for twenty minutes.',
        proofType: 'video',
        proofDescription: 'Show the full practice session.',
        submissionText: 'What did you practise?',
        duration: 30,
        difficulty: 'hard',
        templateId: 'morning_walk',
        checkInPlan: { kind: 'custom', days: [1, 3, 5] },
        reviewer: { kind: 'menta' },
        mentaBackup: true,
        mentaMomenta: false,
        unknownCreateResultAt: null,
        todayReadbackRequestedAt: null,
      });
      render(<CreateChallengeScreen />);
      await waitFor(() =>
        expect(
          screen.getByTestId('create-promise-primary-review')
        ).toBeEnabled()
      );
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      fireEvent.press(await screen.findByText('Continue with free'));
      expect(mockSavePromiseCreationDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Evening music practice',
          description: 'Practise for twenty minutes.',
          proofType: 'video',
          proofDescription: 'Show the full practice session.',
          submissionText: 'What did you practise?',
          duration: 30,
          difficulty: 'hard',
          templateId: 'morning_walk',
          checkInPlan: { kind: 'custom', days: [1, 3, 5] },
          reviewer: { kind: 'friend' },
          mentaBackup: false,
          mentaMomenta: false,
        })
      );
    });
    it('creates once with self-review off, persists the confirmed ID and reuses reviewer setup', async () => {
      await advanceToReview('friend');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await screen.findByText('Waiting for a reviewer');
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledWith(
        expect.objectContaining({ allowSelfReview: false })
      );
      expect(mockSavePromiseCreationDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          pendingFriendChallengeId: CREATED_CHALLENGE_ID,
        })
      );
      expect(mockClearPromiseCreationDraft).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(
          screen.getByTestId('create-promise-primary-review')
        ).toBeEnabled()
      );
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockRouter.push).toHaveBeenCalledWith({
          pathname: '/promise-accountability',
          params: {
            challengeId: CREATED_CHALLENGE_ID,
            source: 'promise',
            requiredReviewer: '1',
          },
        })
      );
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
    });
    it.each(['account', 'unmount', 'blur', 'blur-refocus'] as const)(
      'keeps a late friend receipt owned by A without changing the %s screen',
      async leave => {
        let resolveCreate!: (value: unknown) => void;
        mockCreateChallengeWithPayment.mockImplementationOnce(
          () =>
            new Promise(resolve => {
              resolveCreate = resolve;
            })
        );
        const view = await advanceToReview('friend');
        fireEvent.press(screen.getByTestId('create-promise-primary-review'));
        await waitFor(() =>
          expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1)
        );
        if (leave === 'account') {
          mockUserId = 'user-2';
          view.rerender(<CreateChallengeScreen />);
        } else if (leave === 'unmount') view.unmount();
        else {
          act(() => setFocused(false));
          if (leave === 'blur-refocus') act(() => setFocused(true));
        }
        mockSavePromiseCreationDraft.mockClear();
        await act(async () =>
          resolveCreate({
            challenge: createdChallenge,
            receipt: { isFirstPromise: true },
          })
        );
        expect(mockSavePromiseCreationDraft).toHaveBeenCalledWith(
          expect.objectContaining({
            ownerUserId: 'user-1',
            pendingFriendChallengeId: CREATED_CHALLENGE_ID,
          })
        );
        expect(
          mockSavePromiseCreationDraft.mock.calls.some(
            ([draft]) =>
              draft.ownerUserId === 'user-2' &&
              draft.pendingFriendChallengeId === CREATED_CHALLENGE_ID
          )
        ).toBe(false);
        expect(mockRouter.push).not.toHaveBeenCalled();
        if (leave === 'blur-refocus')
          expect(
            await screen.findByText('Waiting for a reviewer')
          ).toBeTruthy();
        else if (leave !== 'unmount')
          expect(screen.queryByText('Waiting for a reviewer')).toBeNull();
        if (leave === 'account') {
          await waitFor(() =>
            expect(
              screen.getByTestId('create-promise-primary-name')
            ).toBeEnabled()
          );
          fireEvent.press(screen.getByTestId('create-promise-primary-name'));
          expect(
            screen.getByTestId('create-promise-primary-proof')
          ).toBeTruthy();
          expect(mockRouter.push).not.toHaveBeenCalled();
          expect(
            mockSavePromiseCreationDraft.mock.calls.some(
              ([draft]) =>
                draft.ownerUserId === 'user-2' &&
                draft.pendingFriendChallengeId === CREATED_CHALLENGE_ID
            )
          ).toBe(false);
        }
      }
    );

    it('does not let A completion release B active submission or open A setup', async () => {
      let resolveA!: (value: unknown) => void;
      let resolveB!: (value: unknown) => void;
      mockCreateChallengeWithPayment
        .mockImplementationOnce(
          () =>
            new Promise(resolve => {
              resolveA = resolve;
            })
        )
        .mockImplementationOnce(
          () =>
            new Promise(resolve => {
              resolveB = resolve;
            })
        );
      const view = await advanceToReview('friend');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1)
      );
      mockUserId = 'user-2';
      view.rerender(<CreateChallengeScreen />);
      await waitFor(() =>
        expect(screen.getByTestId('create-promise-primary-name')).toBeEnabled()
      );
      fireEvent.press(screen.getByTestId('create-promise-primary-name'));
      fireEvent.press(screen.getByTestId('create-promise-primary-proof'));
      fireEvent.press(screen.getByTestId('create-promise-reviewer-friend'));
      fireEvent.press(screen.getByTestId('create-promise-primary-who'));
      fireEvent.press(screen.getByTestId('create-promise-primary-length'));
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(2)
      );
      await act(async () =>
        resolveA({ challenge: createdChallenge, receipt: {} })
      );
      expect(
        screen.getByTestId('create-promise-primary-review')
      ).toBeDisabled();
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(2);
      expect(mockRouter.push).not.toHaveBeenCalled();
      const bId = '22222222-2222-4222-8222-222222222222';
      await act(async () =>
        resolveB({
          challenge: { ...createdChallenge, id: bId, creatorId: 'user-2' },
          receipt: {},
        })
      );
      await screen.findByText('Waiting for a reviewer');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({ challengeId: bId }),
          })
        )
      );
      expect(
        mockSavePromiseCreationDraft.mock.calls
          .filter(([draft]) => draft.ownerUserId === 'user-2')
          .every(
            ([draft]) => draft.pendingFriendChallengeId !== CREATED_CHALLENGE_ID
          )
      ).toBe(true);
    });
    it('ignores A rejected creation after B becomes the current owner', async () => {
      let rejectA!: (error: Error) => void;
      mockCreateChallengeWithPayment.mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectA = reject;
          })
      );
      const view = await advanceToReview('friend');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1)
      );
      mockUserId = 'user-2';
      view.rerender(<CreateChallengeScreen />);
      mockSavePromiseCreationDraft.mockClear();
      await act(async () => rejectA(new Error('Network request failed')));
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(screen.getByTestId('create-promise-primary-name')).toBeEnabled();
      expect(
        mockSavePromiseCreationDraft.mock.calls
          .filter(([draft]) => draft.ownerUserId === 'user-2')
          .every(
            ([draft]) =>
              !draft.unknownCreateResultAt && !draft.pendingFriendChallengeId
          )
      ).toBe(true);
    });
    it('does not reopen A setup when its durable receipt save completes after an account switch', async () => {
      let resolveSave!: () => void;
      mockSavePromiseCreationDraft.mockImplementation(draft =>
        draft.pendingFriendChallengeId
          ? new Promise<void>(resolve => {
              resolveSave = resolve;
            })
          : Promise.resolve(mockDraftRuntime.buildPromiseCreationDraft(draft))
      );
      const view = await advanceToReview('friend');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockSavePromiseCreationDraft).toHaveBeenCalledWith(
          expect.objectContaining({
            ownerUserId: 'user-1',
            pendingFriendChallengeId: CREATED_CHALLENGE_ID,
          })
        )
      );
      mockUserId = 'user-2';
      view.rerender(<CreateChallengeScreen />);
      await act(async () => resolveSave());
      expect(screen.queryByText('Waiting for a reviewer')).toBeNull();
      fireEvent.press(screen.getByTestId('create-promise-primary-name'));
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(
        mockSavePromiseCreationDraft.mock.calls
          .filter(([draft]) => draft.ownerUserId === 'user-2')
          .every(
            ([draft]) => draft.pendingFriendChallengeId !== CREATED_CHALLENGE_ID
          )
      ).toBe(true);
      mockSavePromiseCreationDraft
        .mockReset()
        .mockImplementation(async input =>
          mockDraftRuntime.buildPromiseCreationDraft(input)
        );
    });

    it.each(['before-receipt', 'after-receipt'] as const)(
      'resumes one Momenta-funded create after same-owner refocus %s',
      async refocus => {
        const actualDraft = mockDraftRuntime;
        mockLoadPromiseCreationDraft.mockImplementation(
          actualDraft.loadPromiseCreationDraft
        );
        mockSavePromiseCreationDraft.mockImplementation(
          actualDraft.savePromiseCreationDraft
        );
        mockGetCreatePromiseQuote.mockResolvedValue({
          cost: 20,
          activePromises: 0,
          challengesCreatedThisMonth: 0,
          isPro: false,
        });
        let resolveCreate!: (value: unknown) => void;
        mockCreateChallengeWithPayment.mockImplementationOnce(
          () =>
            new Promise(resolve => {
              resolveCreate = resolve;
            })
        );
        await advanceToReview('friend');
        fireEvent.press(screen.getByTestId('create-promise-primary-review'));
        await waitFor(() =>
          expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1)
        );
        act(() => setFocused(false));
        if (refocus === 'before-receipt') act(() => setFocused(true));
        await act(async () =>
          resolveCreate({ challenge: createdChallenge, receipt: {} })
        );
        if (refocus === 'after-receipt') act(() => setFocused(true));
        fireEvent.press(screen.getByTestId('create-promise-primary-review'));
        await screen.findByText('Waiting for a reviewer');
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
        await waitFor(() =>
          expect(mockRouter.push).toHaveBeenCalledWith(
            expect.objectContaining({
              params: expect.objectContaining({
                challengeId: CREATED_CHALLENGE_ID,
              }),
            })
          )
        );
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledWith(
          expect.objectContaining({
            creatorId: 'user-1',
            cost: 20,
            allowSelfReview: false,
          })
        );
        expect(
          await actualDraft.loadPromiseCreationDraft('user-1')
        ).toMatchObject({
          ownerUserId: 'user-1',
          pendingFriendChallengeId: CREATED_CHALLENGE_ID,
        });
        expect(await actualDraft.loadPromiseCreationDraft('user-2')).toBeNull();
      }
    );

    it('waits for the earlier owned request after remount instead of charging again', async () => {
      const actual = mockDraftRuntime;
      mockLoadPromiseCreationDraft.mockImplementation(
        actual.loadPromiseCreationDraft
      );
      mockSavePromiseCreationDraft.mockImplementation(
        actual.savePromiseCreationDraft
      );
      let resolveCreate!: (value: unknown) => void;
      mockCreateChallengeWithPayment.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveCreate = resolve;
          })
      );
      const oldView = await advanceToReview('friend');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1)
      );
      oldView.unmount();
      render(<CreateChallengeScreen />);
      await waitFor(() =>
        expect(
          screen.getByTestId('create-promise-primary-review')
        ).toBeDisabled()
      );
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
      await act(async () =>
        resolveCreate({ challenge: createdChallenge, receipt: {} })
      );
      await screen.findByText('Waiting for a reviewer');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              challengeId: CREATED_CHALLENGE_ID,
            }),
          })
        )
      );
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
      expect(await actual.loadPromiseCreationDraft('user-1')).toMatchObject({
        pendingFriendChallengeId: CREATED_CHALLENGE_ID,
      });
    });
    it('restores a confirmed receipt ahead of template defaults after remount', async () => {
      const actual = mockDraftRuntime;
      mockLoadPromiseCreationDraft.mockImplementation(
        actual.loadPromiseCreationDraft
      );
      mockSavePromiseCreationDraft.mockImplementation(
        actual.savePromiseCreationDraft
      );
      const view = await advanceToReview('friend');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await screen.findByText('Waiting for a reviewer');
      const owned = await actual.loadPromiseCreationDraft('user-1');
      view.unmount();
      render(<CreateChallengeScreen />);
      await screen.findByText('Waiting for a reviewer');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() => expect(mockRouter.push).toHaveBeenCalledTimes(1));
      expect(mockRouter.push.mock.calls[0][0].params.challengeId).toBe(
        CREATED_CHALLENGE_ID
      );
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
      expect(await actual.loadPromiseCreationDraft('user-1')).toMatchObject({
        title: owned.title,
        pendingFriendChallengeId: CREATED_CHALLENGE_ID,
      });
    });
    it('keeps a late receipt separate from B and restores it only when A returns', async () => {
      const actual = mockDraftRuntime;
      mockLoadPromiseCreationDraft.mockImplementation(
        actual.loadPromiseCreationDraft
      );
      mockSavePromiseCreationDraft.mockImplementation(
        actual.savePromiseCreationDraft
      );
      let resolveCreate!: (value: unknown) => void;
      mockCreateChallengeWithPayment.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveCreate = resolve;
          })
      );
      const view = await advanceToReview('friend');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1)
      );
      mockUserId = 'user-2';
      view.rerender(<CreateChallengeScreen />);
      await act(async () =>
        resolveCreate({ challenge: createdChallenge, receipt: {} })
      );
      fireEvent.press(screen.getByTestId('create-promise-primary-name'));
      expect(screen.getByTestId('create-promise-primary-proof')).toBeTruthy();
      expect(mockRouter.push).not.toHaveBeenCalled();
      const bDraft = await actual.loadPromiseCreationDraft('user-2');
      expect(bDraft?.pendingFriendChallengeId ?? null).toBeNull();
      mockUserId = 'user-1';
      view.rerender(<CreateChallengeScreen />);
      await screen.findByText('Waiting for a reviewer');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() => expect(mockRouter.push).toHaveBeenCalledTimes(1));
      expect(mockRouter.push.mock.calls[0][0].params.challengeId).toBe(
        CREATED_CHALLENGE_ID
      );
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
    });
    it('ignores an owned receipt read that becomes stale before it returns', async () => {
      const actual = mockDraftRuntime;
      mockLoadPromiseCreationDraft.mockImplementation(
        actual.loadPromiseCreationDraft
      );
      mockSavePromiseCreationDraft.mockImplementation(
        actual.savePromiseCreationDraft
      );
      const view = await advanceToReview('friend');
      let resolveRead!: (value: unknown) => void;
      mockLoadPromiseCreationDraft.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveRead = resolve;
          })
      );
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(
          screen.getByTestId('create-promise-primary-review')
        ).toBeDisabled()
      );
      mockUserId = 'user-2';
      view.rerender(<CreateChallengeScreen />);
      await act(async () =>
        resolveRead({
          ownerUserId: 'user-1',
          pendingFriendChallengeId: CREATED_CHALLENGE_ID,
        })
      );
      expect(screen.queryByText('Waiting for a reviewer')).toBeNull();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
      fireEvent.press(screen.getByTestId('create-promise-primary-name'));
      expect(screen.getByTestId('create-promise-primary-proof')).toBeTruthy();
      expect(
        (await actual.loadPromiseCreationDraft('user-2'))
          ?.pendingFriendChallengeId ?? null
      ).toBeNull();
    });
    it('does not create if the pre-create receipt read fails, and resumes on retry', async () => {
      const actual = mockDraftRuntime;
      mockLoadPromiseCreationDraft.mockImplementation(
        actual.loadPromiseCreationDraft
      );
      mockSavePromiseCreationDraft.mockImplementation(
        actual.savePromiseCreationDraft
      );
      await advanceToReview('friend');
      mockLoadPromiseCreationDraft.mockRejectedValueOnce(
        new Error('storage unavailable')
      );
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(
          screen.getByTestId('create-promise-primary-review')
        ).toBeEnabled()
      );
      expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(
          screen.getByTestId('create-promise-primary-review')
        ).toBeEnabled()
      );
      expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await screen.findByText('Waiting for a reviewer');
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
    });

    it('resumes the confirmed ID after refocus and a failed receipt write', async () => {
      const actual = mockDraftRuntime;
      mockLoadPromiseCreationDraft.mockImplementation(
        actual.loadPromiseCreationDraft
      );
      mockSavePromiseCreationDraft.mockImplementation(
        actual.savePromiseCreationDraft
      );
      const originalSet = (
        AsyncStorage.setItem as jest.Mock
      ).getMockImplementation()!;
      const spy = jest
        .spyOn(AsyncStorage, 'setItem')
        .mockImplementation((key, raw) => {
          if (JSON.parse(raw).pendingFriendChallengeId)
            return Promise.reject(new Error('receipt storage unavailable'));
          return originalSet(key, raw);
        });
      let resolveCreate!: (value: unknown) => void;
      mockCreateChallengeWithPayment.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveCreate = resolve;
          })
      );
      await advanceToReview('friend');
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1)
      );
      act(() => {
        setFocused(false);
        setFocused(true);
      });
      await act(async () =>
        resolveCreate({ challenge: createdChallenge, receipt: {} })
      );
      spy.mockRestore();
      restoreStorageImplementations();
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() =>
        expect(
          mockRouter.push.mock.calls.length > 0 ||
            mockCreateChallengeWithPayment.mock.calls.length > 1
        ).toBe(true)
      );
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              challengeId: CREATED_CHALLENGE_ID,
            }),
          })
        )
      );
    });

    it('blocks a new RPC when its durable attempt cannot be written', async () => {
      const actual = mockDraftRuntime;
      mockLoadPromiseCreationDraft.mockImplementation(
        actual.loadPromiseCreationDraft
      );
      mockSavePromiseCreationDraft.mockImplementation(
        actual.savePromiseCreationDraft
      );
      await advanceToReview('friend');
      const originalSet = storageImplementations.setItem;
      const spy = jest
        .spyOn(AsyncStorage, 'setItem')
        .mockImplementation((key, raw) =>
          JSON.parse(raw).unknownCreateResultAt
            ? Promise.reject(new Error('attempt write unavailable'))
            : originalSet(key, raw)
        );
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await screen.findByText('Draft not saved');
      expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
      spy.mockRestore();
      restoreStorageImplementations();
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await screen.findByText('Waiting for a reviewer');
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
    });

    it('blocks recreation after process restart when only the durable attempt survived', async () => {
      const actual = mockDraftRuntime;
      mockLoadPromiseCreationDraft.mockImplementation(
        actual.loadPromiseCreationDraft
      );
      mockSavePromiseCreationDraft.mockImplementation(
        actual.savePromiseCreationDraft
      );
      const view = await advanceToReview('friend');
      const originalSet = storageImplementations.setItem;
      const spy = jest
        .spyOn(AsyncStorage, 'setItem')
        .mockImplementation((key, raw) =>
          JSON.parse(raw).pendingFriendChallengeId
            ? Promise.reject(new Error('receipt write unavailable'))
            : originalSet(key, raw)
        );
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await screen.findByText('Your promise was created');
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
      view.unmount();
      spy.mockRestore();
      restoreStorageImplementations();
      jest.isolateModules(() => {
        mockDraftRuntime = jest.requireActual('@/lib/promise-creation-draft');
      });
      mockLoadPromiseCreationDraft.mockImplementation(
        mockDraftRuntime.loadPromiseCreationDraft
      );
      mockSavePromiseCreationDraft.mockImplementation(
        mockDraftRuntime.savePromiseCreationDraft
      );
      expect(
        mockDraftRuntime.getPromiseCreationReceiptRecovery('user-1')
      ).toBeNull();
      render(<CreateChallengeScreen />);
      await waitFor(() =>
        expect(
          screen.getByTestId('create-promise-primary-review')
        ).toBeDisabled()
      );
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
      expect(
        (await mockDraftRuntime.loadPromiseCreationDraft('user-1'))
          ?.unknownCreateResultAt
      ).toEqual(expect.any(String));
    });

    it.each(
      (
        [
          'focused',
          'blurred',
          'refocused',
          'unmounted',
          'changed-owner',
        ] as const
      ).flatMap(context =>
        (['before-response', 'after-response'] as const).flatMap(timing =>
          (['read', 'write'] as const).map(failure => ({
            context,
            timing,
            failure,
          }))
        )
      )
    )(
      'recovers original receipt with $failure failure, $context $timing',
      async ({ context, timing, failure }) => {
        const actual = mockDraftRuntime;
        mockLoadPromiseCreationDraft.mockImplementation(
          actual.loadPromiseCreationDraft
        );
        mockSavePromiseCreationDraft.mockImplementation(
          actual.savePromiseCreationDraft
        );
        mockGetCreatePromiseQuote.mockResolvedValue({
          cost: 20,
          activePromises: 0,
          challengesCreatedThisMonth: 0,
          isPro: false,
        });
        let resolveCreate!: (value: unknown) => void;
        mockCreateChallengeWithPayment.mockImplementationOnce(
          () =>
            new Promise(resolve => {
              resolveCreate = resolve;
            })
        );
        let view = await advanceToReview('friend');
        fireEvent.press(screen.getByTestId('create-promise-primary-review'));
        await waitFor(() =>
          expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1)
        );
        const originalGet = (
          AsyncStorage.getItem as jest.Mock
        ).getMockImplementation()!;
        const originalSet = (
          AsyncStorage.setItem as jest.Mock
        ).getMockImplementation()!;
        const spy =
          failure === 'read'
            ? jest
                .spyOn(AsyncStorage, 'getItem')
                .mockImplementation(key =>
                  key === actual.getPromiseCreationDraftKey('user-1')
                    ? Promise.reject(new Error('read unavailable'))
                    : originalGet(key)
                )
            : jest
                .spyOn(AsyncStorage, 'setItem')
                .mockImplementation((key, raw) =>
                  key === actual.getPromiseCreationDraftKey('user-1') &&
                  JSON.parse(raw).pendingFriendChallengeId
                    ? Promise.reject(new Error('write unavailable'))
                    : originalSet(key, raw)
                );
        const leave = () => {
          if (context === 'changed-owner') {
            mockUserId = 'user-2';
            view.rerender(<CreateChallengeScreen />);
          } else if (context === 'unmounted') view.unmount();
          else if (context === 'blurred' || context === 'refocused') {
            act(() => setFocused(false));
            if (context === 'refocused') act(() => setFocused(true));
          }
        };
        if (timing === 'before-response') leave();
        await act(async () =>
          resolveCreate({ challenge: createdChallenge, receipt: {} })
        );
        if (timing === 'after-response') leave();
        expect(
          actual.getPromiseCreationReceiptRecovery('user-1')?.draft
            .pendingFriendChallengeId
        ).toBe(CREATED_CHALLENGE_ID);
        expect(actual.getPromiseCreationReceiptRecovery('user-2')).toBeNull();
        if (context === 'changed-owner') {
          expect(screen.queryByText('Waiting for a reviewer')).toBeNull();
          expect(
            (await actual.loadPromiseCreationDraft('user-2'))
              ?.pendingFriendChallengeId ?? null
          ).toBeNull();
        }
        spy.mockRestore();
        restoreStorageImplementations();
        if (context === 'changed-owner') {
          mockUserId = 'user-1';
          view.rerender(<CreateChallengeScreen />);
        } else if (context === 'unmounted')
          view = render(<CreateChallengeScreen />);
        else if (context === 'blurred') act(() => setFocused(true));
        await waitFor(() =>
          expect(
            screen.getByTestId('create-promise-primary-review')
          ).toBeEnabled()
        );
        fireEvent.press(screen.getByTestId('create-promise-primary-review'));
        fireEvent.press(screen.getByTestId('create-promise-primary-review'));
        await waitFor(() =>
          expect(mockRouter.push).toHaveBeenCalledWith(
            expect.objectContaining({
              params: expect.objectContaining({
                challengeId: CREATED_CHALLENGE_ID,
              }),
            })
          )
        );
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledTimes(1);
        expect(mockCreateChallengeWithPayment).toHaveBeenCalledWith(
          expect.objectContaining({
            creatorId: 'user-1',
            cost: 20,
            allowSelfReview: false,
          })
        );
        expect(
          JSON.parse(
            (await AsyncStorage.getItem(
              actual.getPromiseCreationDraftKey('user-1')
            ))!
          )
        ).toMatchObject({
          ownerUserId: 'user-1',
          pendingFriendChallengeId: CREATED_CHALLENGE_ID,
          unknownCreateResultAt: null,
        });
      }
    );

    it('resumes confirmed friend setup without creating or charging again', async () => {
      delete mockRouteParams.templateId;
      mockLoadPromiseCreationDraft.mockResolvedValue({
        ownerUserId: 'user-1',
        currentStep: 3,
        stepId: 'review',
        title: createdChallenge.title,
        description: createdChallenge.description,
        proofType: 'photo',
        proofDescription: createdChallenge.verificationDescription,
        submissionText: createdChallenge.submissionText,
        duration: 7,
        difficulty: 'easy',
        reviewer: { kind: 'friend' },
        pendingFriendChallengeId: CREATED_CHALLENGE_ID,
        unknownCreateResultAt: null,
        todayReadbackRequestedAt: null,
      });
      render(<CreateChallengeScreen />);
      await screen.findByText('Waiting for a reviewer');
      await waitFor(() =>
        expect(
          screen.getByTestId('create-promise-primary-review')
        ).toBeEnabled()
      );
      fireEvent.press(screen.getByTestId('create-promise-primary-review'));
      await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
      expect(mockCreateChallengeWithPayment).not.toHaveBeenCalled();
      expect(mockRouter.push.mock.calls[0][0].params.challengeId).toBe(
        CREATED_CHALLENGE_ID
      );
      expect(screen.queryByTestId('create-promise-edit')).toBeNull();
    });
  });
});
