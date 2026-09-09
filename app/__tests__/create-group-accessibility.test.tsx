import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import CreateGroupScreen from '@/app/create-group';

const mockRouter = {
  back: jest.fn(),
  dismissTo: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
};
let mockSearchParams: {
  groupName?: string;
  source?: string;
  firstPromiseId?: string;
} = {
  groupName: 'Morning Miles',
};
const pendingPromiseLink = {
  version: 1 as const,
  request: {
    challengeId: '10000000-0000-4000-8000-000000000001',
    clientEventId: '20000000-0000-4000-8000-000000000002',
  },
  createdAt: '2026-09-01T11:00:00.000Z',
};
const mockFirstGroupCreatedReceipt = jest.fn((_props: unknown) => null);
const mockCreateGroupWithPayment = jest.fn();
const mockCreateOnboardingGroupWithFirstPromise = jest.fn();
const mockReconcilePendingGroupCreation = jest.fn();
const mockResumePendingGroupCreation = jest.fn();
const mockClearPendingGroupCreation = jest.fn();
const mockCheckUserCooldown = jest.fn();
const mockGetCreateGroupCost = jest.fn();
const mockFetchBalance = jest.fn();
const mockGateCreate = jest.fn();
const mockResolveAdaptiveLayout = jest.fn();
const mockLoadPendingSavedGroupLink = jest.fn();
const mockMarkPendingSavedGroupCreated = jest.fn();
const mockClearPendingSavedGroupLink = jest.fn();
const mockAttachPromiseToSavedGroup = jest.fn();
const mockGroupState = {
  createGroupWithPayment: mockCreateGroupWithPayment,
  createOnboardingGroupWithFirstPromise:
    mockCreateOnboardingGroupWithFirstPromise,
  reconcilePendingGroupCreation: mockReconcilePendingGroupCreation,
  resumePendingGroupCreation: mockResumePendingGroupCreation,
  clearPendingGroupCreation: mockClearPendingGroupCreation,
  checkUserCooldown: mockCheckUserCooldown,
  getCreateGroupCost: mockGetCreateGroupCost,
  groups: [] as unknown[],
  userGroups: [] as unknown[],
};
const mockMomentaState = {
  balance: 100,
  fetchBalance: mockFetchBalance,
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => mockRouter,
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

jest.mock('expo-haptics', () => ({
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
  notificationAsync: jest.fn(),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

class MockSavedGroupCreationUnknownError extends Error {
  clientEventId: string;

  constructor(message: string) {
    super(message);
    this.name = 'SavedGroupCreationUnknownError';
    this.clientEventId = '10000000-0000-4000-8000-000000000001';
  }
}

jest.mock('@/store/group-store', () => ({
  useGroupStore: (selector: (state: typeof mockGroupState) => unknown) =>
    selector(mockGroupState),
  SavedGroupCreationFailureError: class SavedGroupCreationFailureError extends Error {
    code = 'GROUP_CREATION_FAILED';
  },
  isSavedGroupCreationUnknownError: (error: unknown) =>
    error instanceof Error && error.name === 'SavedGroupCreationUnknownError',
}));

jest.mock('@/store/momenta-store', () => ({
  useMomentaStore: Object.assign(
    (selector: (state: typeof mockMomentaState) => unknown) =>
      selector(mockMomentaState),
    { getState: () => mockMomentaState }
  ),
}));

jest.mock('@/lib/hooks/useActionCosts', () => ({
  useActionCosts: () => ({ create_group: 0 }),
}));

jest.mock('@/constants/responsive-layout', () => ({
  ...jest.requireActual('@/constants/responsive-layout'),
  resolveAdaptiveLayout: (...args: unknown[]) =>
    mockResolveAdaptiveLayout(...args),
}));

jest.mock('@/lib/hooks/useQuotaGate', () => ({
  useQuotaGate: () => ({ gateCreate: mockGateCreate }),
}));

jest.mock('@/lib/paywall/revenuecat', () => ({
  RevenueCatAPI: {
    isPro: jest.fn().mockResolvedValue(true),
    refreshCustomerInfo: jest.fn(),
  },
}));

jest.mock('@/components/paywall/PaywallModal', () => () => null);
jest.mock('@/components/ui/MentaMascot', () => ({ MentaMascot: () => null }));
jest.mock('@/components/groups/GroupCreationStates', () => ({
  FirstGroupCreatedReceipt: (props: unknown) =>
    mockFirstGroupCreatedReceipt(props),
  GroupTemplatePickerSheet: () => null,
}));

const mockTrackMetaAdsCreateGroup = jest.fn();
jest.mock('@/lib/meta-ads', () => ({
  trackMetaAdsCreateGroup: () => mockTrackMetaAdsCreateGroup(),
}));

jest.mock('@/lib/promises/pending-saved-group-link', () => ({
  loadPendingSavedGroupLink: (...args: unknown[]) =>
    mockLoadPendingSavedGroupLink(...args),
  markPendingSavedGroupCreated: (...args: unknown[]) =>
    mockMarkPendingSavedGroupCreated(...args),
  clearPendingSavedGroupLink: (...args: unknown[]) =>
    mockClearPendingSavedGroupLink(...args),
}));

jest.mock('@/lib/promises/saved-group-link', () => ({
  attachPromiseToSavedGroup: (...args: unknown[]) =>
    mockAttachPromiseToSavedGroup(...args),
}));

jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: (source: string, receiptId: string) => ({
    confirmed: true,
    receiptId,
    source,
  }),
  emitConfirmedOutcome: jest.fn().mockResolvedValue(true),
  emitConfirmedSuccess: jest.fn().mockResolvedValue(true),
  emitHaptic: jest.fn().mockResolvedValue(true),
}));

describe('CreateGroupScreen loading accessibility', () => {
  const reachConfirmedReceipt = async () => {
    mockCreateGroupWithPayment.mockResolvedValueOnce({
      id: 'group-1',
      name: 'Morning Miles',
    });

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });

    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));

    await act(async () => {
      for (let index = 0; index < 8; index += 1) {
        await Promise.resolve();
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAttachPromiseToSavedGroup.mockReset();
    mockLoadPendingSavedGroupLink.mockReset();
    mockMarkPendingSavedGroupCreated.mockReset();
    mockClearPendingSavedGroupLink.mockReset();
    jest.useFakeTimers();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    mockCheckUserCooldown.mockResolvedValue({ inCooldown: false });
    mockGetCreateGroupCost.mockResolvedValue(0);
    mockFetchBalance.mockResolvedValue(undefined);
    mockGateCreate.mockResolvedValue({ allowed: true });
    mockReconcilePendingGroupCreation.mockResolvedValue({ kind: 'none' });
    mockClearPendingGroupCreation.mockResolvedValue(undefined);
    mockLoadPendingSavedGroupLink.mockResolvedValue(null);
    mockMarkPendingSavedGroupCreated.mockImplementation(
      async (
        _actorId: string,
        pending: typeof pendingPromiseLink,
        group: { id: string; name: string }
      ) => ({ ...pending, group })
    );
    mockClearPendingSavedGroupLink.mockResolvedValue(undefined);
    mockMomentaState.balance = 100;
    mockSearchParams = { groupName: 'Morning Miles' };
    mockResolveAdaptiveLayout.mockReturnValue({
      windowClass: 'phone',
      navigationMode: 'bottom',
      usableWidth: 342,
      gutter: 24,
      laneWidth: 342,
      workspaceEligible: false,
      presentationGeometry: 'edge',
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('announces draft restoration as one progress region', () => {
    mockSearchParams = {};
    render(<CreateGroupScreen />);

    const progressRegions = screen.getAllByRole('progressbar');
    expect(progressRegions).toHaveLength(1);
    expect(progressRegions[0].props.accessibilityLabel).toBe(
      'Restoring your group draft'
    );
  });

  it('keeps variable step content separate from the fixed action footer', async () => {
    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(screen.getByTestId('create-group-body-scroll')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Choose who can join' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Exit setup' })).toBeTruthy();
  });

  it('uses the shared focused lane for compact and wide group creation', () => {
    const compact = render(<CreateGroupScreen />);
    expect(screen.getByTestId('create-group-task-frame')).toHaveStyle({
      maxWidth: 390,
    });
    compact.unmount();

    mockResolveAdaptiveLayout.mockReturnValue({
      windowClass: 'wide',
      navigationMode: 'bottom',
      usableWidth: 944,
      gutter: 40,
      laneWidth: 944,
      workspaceEligible: true,
      presentationGeometry: 'edge',
    });
    render(<CreateGroupScreen />);

    expect(screen.getByTestId('create-group-task-frame')).toHaveStyle({
      maxWidth: 1024,
    });
  });

  it('announces group creation as one progress region', async () => {
    let resolveCreate:
      | ((group: { id: string; name: string }) => void)
      | undefined;
    mockCreateGroupWithPayment.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveCreate = resolve;
        })
    );

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });

    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));

    await act(async () => {
      for (let index = 0; index < 8; index += 1) {
        await Promise.resolve();
      }
    });
    expect(mockCreateGroupWithPayment).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('create-group-status-screen')).toBeTruthy();
    const progressRegions = screen.getAllByRole('progressbar');
    expect(progressRegions).toHaveLength(1);
    expect(progressRegions[0].props.accessibilityLabel).toBe(
      'Creating Morning Miles'
    );

    await act(async () => {
      resolveCreate?.({ id: 'group-1', name: 'Morning Miles' });
      await Promise.resolve();
    });
  });

  it('shows one action hierarchy and dismisses to the confirmed group', async () => {
    await reachConfirmedReceipt();

    expect(mockFirstGroupCreatedReceipt).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groupName: 'Morning Miles',
        showActions: false,
      })
    );
    expect(
      screen.getAllByRole('button', { name: 'Add first promise' })
    ).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Open group' })).toHaveLength(
      1
    );
    expect(screen.queryByRole('button', { name: 'Invite people' })).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Open group' }));

    expect(mockRouter.dismissTo).toHaveBeenCalledWith({
      pathname: '/groups/[id]',
      params: { id: 'group-1', created: '1' },
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockTrackMetaAdsCreateGroup).toHaveBeenCalledTimes(1);
  });

  it('replaces the creation modal with a group promise draft', async () => {
    await reachConfirmedReceipt();

    fireEvent.press(screen.getByRole('button', { name: 'Add first promise' }));

    expect(mockRouter.dismissTo).toHaveBeenCalledWith(
      '/create-challenge?mode=group&createSource=group_detail&groupId=group-1'
    );
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('links the onboarding promise and makes Invite people the primary action', async () => {
    mockSearchParams = {
      groupName: 'Evening walkers',
      source: 'onboarding',
      firstPromiseId: 'promise-1',
    };
    mockCreateOnboardingGroupWithFirstPromise.mockResolvedValueOnce({
      group: { id: 'group-linked', name: 'Evening walkers' },
      receipt: {
        economy: { cost: 0, newBalance: 100 },
        firstPromise: {
          id: 'promise-1',
          title: 'Walk for 20 minutes after work',
        },
        group: { durationDays: 30 },
      },
    });

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await act(async () => {
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(mockCreateOnboardingGroupWithFirstPromise).toHaveBeenCalledWith(
      expect.objectContaining({
        first_promise_id: 'promise-1',
        name: 'Evening walkers',
        description: 'A group for your first promise.',
      })
    );
    expect(mockCreateGroupWithPayment).not.toHaveBeenCalled();
    expect(mockFirstGroupCreatedReceipt).toHaveBeenLastCalledWith(
      expect.objectContaining({
        linkedPromiseTitle: 'Walk for 20 minutes after work',
        linkedPromiseDurationDays: 30,
      })
    );
    expect(screen.getByRole('button', { name: 'Invite people' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to Today' })).toBeTruthy();
    expect(screen.queryByText('Add first promise')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Invite people' }));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith({
      pathname: '/group-invite',
      params: { groupId: 'group-linked', groupName: 'Evening walkers' },
    });
  });

  it('preserves the onboarding draft and claims no group when linking is rejected', async () => {
    mockSearchParams = {
      groupName: 'Evening walkers',
      source: 'onboarding',
      firstPromiseId: 'promise-1',
    };
    mockCreateOnboardingGroupWithFirstPromise.mockRejectedValueOnce(
      new Error(
        'Your original promise cannot become this group’s promise because it has already started or changed. Your group draft is still here. You can return later and explicitly create an empty group instead.'
      )
    );

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await act(async () => {
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(
      screen.getByText(/cannot become this group’s promise/i)
    ).toBeTruthy();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    expect(screen.queryByText('Invite people')).toBeNull();
    expect(screen.queryByText('Add first promise')).toBeNull();
    expect(mockCreateGroupWithPayment).not.toHaveBeenCalled();
  });

  it('blocks a malformed onboarding handoff instead of creating an empty group', async () => {
    mockSearchParams = {
      groupName: 'Evening walkers',
      source: 'onboarding',
      firstPromiseId: '   ',
    };

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/cannot connect this group/i)).toBeTruthy();
    expect(mockCreateOnboardingGroupWithFirstPromise).not.toHaveBeenCalled();
    expect(mockCreateGroupWithPayment).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('shows a draft-preserving message when the free onboarding group is unavailable', async () => {
    mockSearchParams = {
      groupName: 'Evening walkers',
      source: 'onboarding',
      firstPromiseId: 'promise-1',
    };
    mockCreateOnboardingGroupWithFirstPromise.mockRejectedValueOnce(
      new Error(
        'This first-promise group is only available before you create another group. Your group draft is still here. You can return later and explicitly create an empty group instead.'
      )
    );

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await act(async () => {
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(screen.getByText(/only available before/i)).toBeTruthy();
    expect(screen.getByText(/group draft is still here/i)).toBeTruthy();
    expect(mockCreateGroupWithPayment).not.toHaveBeenCalled();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('uses the server cost for a returning owner after a fresh launch', async () => {
    mockGetCreateGroupCost.mockResolvedValue(50);

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });

    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));

    expect(screen.getByText('50 Momenta')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await act(async () => {
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(mockCreateGroupWithPayment).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Confirm 50 Momenta' })
    ).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Confirm 50 Momenta' }));
    await act(async () => {
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(mockCreateGroupWithPayment).toHaveBeenCalledWith(
      expect.objectContaining({ cost: 50 })
    );
  });

  it('checks an unknown result before offering the same request again', async () => {
    mockCreateGroupWithPayment.mockRejectedValueOnce(
      new MockSavedGroupCreationUnknownError(
        'The connection ended before Menta could read the receipt.'
      )
    );
    mockReconcilePendingGroupCreation.mockResolvedValueOnce({
      kind: 'safe-to-retry',
      attempt: {
        clientEventId: '10000000-0000-4000-8000-000000000001',
      },
      message: 'Menta confirmed that no group receipt exists for this request.',
    });

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await act(async () => {
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(mockCreateGroupWithPayment).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Check group status' })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Check group status' }));
    await act(async () => {
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(mockReconcilePendingGroupCreation).toHaveBeenCalledTimes(1);
    expect(mockCreateGroupWithPayment).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Finish creating group' })
    ).toBeTruthy();

    mockResumePendingGroupCreation.mockResolvedValueOnce({
      id: 'group-recovered',
      name: 'Morning Miles',
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Finish creating group' })
    );
    await act(async () => {
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(mockResumePendingGroupCreation).toHaveBeenCalledTimes(1);
    expect(mockCreateGroupWithPayment).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Add first promise' })
    ).toBeTruthy();
  });

  it('retries an unknown promise link with the same event and shows connected actions only after confirmation', async () => {
    mockSearchParams = {
      groupName: 'Sunday crew',
      source: 'promise_accountability',
    };
    mockLoadPendingSavedGroupLink.mockResolvedValue(pendingPromiseLink);
    mockCreateGroupWithPayment.mockResolvedValue({
      id: '30000000-0000-4000-8000-000000000003',
      name: 'Sunday crew',
    });
    let resolveInitialLink: ((value: unknown) => void) | undefined;
    mockAttachPromiseToSavedGroup
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveInitialLink = resolve;
          })
      )
      .mockResolvedValueOnce({
        outcome: 'confirmed',
        code: 'PROMISE_LINKED',
        receipt: {
          id: '40000000-0000-4000-8000-000000000004',
          challengeId: pendingPromiseLink.request.challengeId,
          challengeTitle: 'Walk after work',
          groupId: '30000000-0000-4000-8000-000000000003',
          groupName: 'Sunday crew',
          clientEventId: pendingPromiseLink.request.clientEventId,
          linkedAt: '2026-09-01T12:00:00.000Z',
          idempotent: true,
          promiseContainerPreserved: true,
          confirmedMembersCanView: true,
          reviewAuthority: 'confirmed_saved_group_members',
        },
      });

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await act(async () => {
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(screen.getByText('Adding your promise…')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Adding promise…' }).props
        .accessibilityState.disabled
    ).toBe(true);
    await act(async () => {
      resolveInitialLink?.({
        outcome: 'unknown',
        code: 'RESULT_UNKNOWN',
        request: {
          ...pendingPromiseLink.request,
          groupId: '30000000-0000-4000-8000-000000000003',
        },
        retryWithSameClientEvent: true,
      });
      for (let index = 0; index < 8; index += 1) await Promise.resolve();
    });

    expect(
      screen.getByText('Group created. Promise link needs checking.')
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Check promise link' })
    ).toBeTruthy();
    expect(screen.queryByText('Add first promise')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Check promise link' }));
    await act(async () => {
      for (let index = 0; index < 12; index += 1) await Promise.resolve();
    });

    expect(mockAttachPromiseToSavedGroup).toHaveBeenCalledTimes(2);
    expect(mockAttachPromiseToSavedGroup.mock.calls[0]?.[0]).toEqual(
      mockAttachPromiseToSavedGroup.mock.calls[1]?.[0]
    );
    expect(mockFirstGroupCreatedReceipt).toHaveBeenLastCalledWith(
      expect.objectContaining({ linkedPromiseTitle: 'Walk after work' })
    );
    expect(screen.getByRole('button', { name: 'Invite people' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open group' })).toBeTruthy();
    expect(screen.queryByText('Add first promise')).toBeNull();
  });

  it('keeps a definitively unlinked created group and never offers a second promise', async () => {
    mockSearchParams = {
      groupName: 'Sunday crew',
      source: 'promise_accountability',
    };
    mockLoadPendingSavedGroupLink.mockResolvedValue(pendingPromiseLink);
    mockCreateGroupWithPayment.mockResolvedValue({
      id: '30000000-0000-4000-8000-000000000003',
      name: 'Sunday crew',
    });
    mockAttachPromiseToSavedGroup.mockResolvedValue({
      outcome: 'failed',
      code: 'PROMISE_NOT_AVAILABLE',
      safeToRetry: false,
    });

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await act(async () => {
      for (let index = 0; index < 12; index += 1) await Promise.resolve();
    });

    expect(screen.getByText('Group created. Promise not added.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open group' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Return to promise' })
    ).toBeTruthy();
    expect(screen.queryByText('Add first promise')).toBeNull();
  });

  it('does not attach or offer another promise when the created-group handoff cannot be persisted', async () => {
    mockSearchParams = {
      groupName: 'Sunday crew',
      source: 'promise_accountability',
    };
    mockLoadPendingSavedGroupLink.mockResolvedValue(pendingPromiseLink);
    mockCreateGroupWithPayment.mockResolvedValue({
      id: '30000000-0000-4000-8000-000000000003',
      name: 'Sunday crew',
    });
    mockMarkPendingSavedGroupCreated.mockRejectedValueOnce(
      new Error('Storage unavailable')
    );

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });
    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await act(async () => {
      for (let index = 0; index < 12; index += 1) await Promise.resolve();
    });

    expect(screen.getByText('Group created. Promise not added.')).toBeTruthy();
    expect(mockAttachPromiseToSavedGroup).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Open group' })).toBeTruthy();
    expect(screen.queryByText('Add first promise')).toBeNull();
  });

  it('keeps a pending promise request inert in ordinary group creation', async () => {
    mockLoadPendingSavedGroupLink.mockResolvedValue(pendingPromiseLink);
    mockSearchParams = { groupName: 'Morning Miles', source: 'groups' };

    render(<CreateGroupScreen />);
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(mockLoadPendingSavedGroupLink).not.toHaveBeenCalled();
    expect(mockAttachPromiseToSavedGroup).not.toHaveBeenCalled();
  });
});
