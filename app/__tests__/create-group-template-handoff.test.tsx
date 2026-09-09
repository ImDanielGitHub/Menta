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
const mockCreateGroupWithPayment = jest.fn();
const mockCreateOnboardingGroupWithFirstPromise = jest.fn();
const mockReconcilePendingGroupCreation = jest.fn();
const mockResumePendingGroupCreation = jest.fn();
const mockClearPendingGroupCreation = jest.fn();
const mockCheckUserCooldown = jest.fn();
const mockGetCreateGroupCost = jest.fn();
const mockFetchBalance = jest.fn();
const mockGateCreate = jest.fn();
const mockGroupState = {
  createGroupWithPayment: mockCreateGroupWithPayment,
  createOnboardingGroupWithFirstPromise:
    mockCreateOnboardingGroupWithFirstPromise,
  reconcilePendingGroupCreation: mockReconcilePendingGroupCreation,
  resumePendingGroupCreation: mockResumePendingGroupCreation,
  clearPendingGroupCreation: mockClearPendingGroupCreation,
  checkUserCooldown: mockCheckUserCooldown,
  getCreateGroupCost: mockGetCreateGroupCost,
  groups: [{ id: 'existing', kind: 'saved' }] as unknown[],
  userGroups: [{ id: 'existing' }] as unknown[],
};
const mockMomentaState = { balance: 100, fetchBalance: mockFetchBalance };

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ templateId: 'morning_walk' }),
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

jest.mock('@/store/group-store', () => ({
  useGroupStore: (selector: (state: typeof mockGroupState) => unknown) =>
    selector(mockGroupState),
  SavedGroupCreationFailureError: class SavedGroupCreationFailureError extends Error {},
  isSavedGroupCreationUnknownError: () => false,
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
  FirstGroupCreatedReceipt: () => null,
  GroupTemplatePickerSheet: () => null,
  SelectedGroupStartingPoint: () => null,
}));

jest.mock('@/lib/meta-ads', () => ({
  trackMetaAdsCreateGroup: jest.fn(),
}));

describe('group creation from a chosen starting point', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    mockCreateGroupWithPayment.mockResolvedValue({
      id: 'group-1',
      name: 'Morning walk group',
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const settle = async () => {
    await act(async () => {
      jest.advanceTimersByTime(400);
      for (let index = 0; index < 10; index += 1) await Promise.resolve();
    });
  };

  it('carries the chosen starting point into the first promise', async () => {
    render(<CreateGroupScreen />);
    await settle();

    const movePreset = screen.getByRole('radio', {
      name: 'Walking or exercise',
    });
    const focusPreset = screen.getByRole('radio', { name: 'Study' });
    expect(movePreset.props.accessibilityState.selected).toBe(true);
    fireEvent.press(focusPreset);
    expect(focusPreset.props.accessibilityState.selected).toBe(true);

    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );
    fireEvent.press(screen.getByRole('button', { name: 'Review group' }));
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));
    await settle();

    expect(mockCreateGroupWithPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        duration_days: 7,
        image_preset: 'focus',
        name: 'Morning walk group',
      })
    );
    expect(mockCreateOnboardingGroupWithFirstPromise).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Add first promise' }));

    // Picking a starting point used to change only the suggested group name, so
    // the first promise opened blank and the choice looked like it did nothing.
    const [href] = mockRouter.dismissTo.mock.calls.at(-1) as [string];
    expect(href).toContain('templateId=morning_walk');
    expect(href).toContain('groupId=group-1');
  });

  it('keeps the route starting point ahead of an unrelated saved draft', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        version: 1,
        groupName: 'Old saved group',
        privacy: 'public',
        memberNudges: false,
      })
    );

    render(<CreateGroupScreen />);
    await settle();

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(
      'menta.saved-group-create-attempt.v1:user-1'
    );
    expect(screen.getByTestId('create-group-name-input').props.value).toBe(
      'Morning walk group'
    );
    expect(
      screen.getByRole('button', { name: 'Choose who can join' })
    ).toBeEnabled();
  });

  it('states the privacy choice as a consequence and exposes selection', async () => {
    render(<CreateGroupScreen />);
    await settle();

    fireEvent.press(
      screen.getByRole('button', { name: 'Choose who can join' })
    );

    const inviteOnly = screen.getByRole('radio', {
      name: 'Only people you invite',
    });
    const findable = screen.getByRole('radio', { name: 'Anyone can find it' });

    fireEvent.press(findable);
    expect(findable.props.accessibilityState.selected).toBe(true);
    expect(inviteOnly.props.accessibilityState.selected).toBe(false);

    fireEvent.press(inviteOnly);
    expect(inviteOnly.props.accessibilityState.selected).toBe(true);
  });
});
