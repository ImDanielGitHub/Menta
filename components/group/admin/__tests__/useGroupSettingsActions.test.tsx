import React from 'react';
import { act, renderHook } from '@testing-library/react-native';

import { useGroupSettingsActions } from '@/components/group/admin/useGroupSettingsActions';
import { backOrReplace } from '@/lib/navigation/safe-back';
import { emitConfirmedOutcome, emitHaptic } from '@/lib/motion/haptics';

jest.mock('@/lib/navigation/safe-back', () => ({
  backOrReplace: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: {
    getState: () => ({ groups: [] }),
  },
}));

const mockBackOrReplace = backOrReplace as jest.MockedFunction<
  typeof backOrReplace
>;
jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: jest.fn((source: string, receiptId: string) => ({
    confirmed: true,
    receiptId,
    source,
  })),
  emitConfirmedOutcome: jest.fn(() => Promise.resolve(true)),
  emitHaptic: jest.fn(() => Promise.resolve(true)),
}));

const mockedEmitConfirmedOutcome = jest.mocked(emitConfirmedOutcome);
const mockedEmitHaptic = jest.mocked(emitHaptic);

const createGroup = (id: string) =>
  ({
    id,
    name: `Group ${id}`,
    description: '',
    privacy: 'public',
  }) as never;

describe('useGroupSettingsActions back recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the currently loaded group after a restored route changes', () => {
    const router = {
      back: jest.fn(),
      canGoBack: jest.fn(() => false),
      replace: jest.fn(),
    } as never;
    const stableProps = {
      deleteGroup: jest.fn(),
      description: '',
      fetchGroups: jest.fn(),
      hasChanges: false,
      isOwner: true,
      leaveGroupAction: jest.fn(),
      name: 'Group',
      privacy: 'public' as const,
      router,
      userId: 'user-1',
    };

    const { result, rerender } = renderHook(
      ({ groupId }: { groupId: string }) =>
        useGroupSettingsActions({
          ...stableProps,
          group: createGroup(groupId),
        }),
      { initialProps: { groupId: 'group-one' } }
    );

    act(() => {
      result.current.handleBack();
    });
    expect(mockBackOrReplace).toHaveBeenLastCalledWith(router, {
      pathname: '/groups/[id]',
      params: { id: 'group-one' },
    });

    rerender({ groupId: 'group-two' });
    act(() => {
      result.current.handleBack();
    });
    expect(mockBackOrReplace).toHaveBeenLastCalledWith(router, {
      pathname: '/groups/[id]',
      params: { id: 'group-two' },
    });
  });

  it('keeps an unknown leave result silent after the destructive dispatch cue', async () => {
    const leaveGroupAction = jest.fn().mockResolvedValue({
      kind: 'unknown',
      action: 'leave-group',
      message: 'Check membership before trying again.',
      requiresStateCheck: true,
    });
    const router = { replace: jest.fn() } as never;
    const { result } = renderHook(() =>
      useGroupSettingsActions({
        deleteGroup: jest.fn(),
        description: '',
        fetchGroups: jest.fn(),
        group: createGroup('group-one'),
        hasChanges: false,
        isOwner: false,
        leaveGroupAction,
        name: 'Group group-one',
        privacy: 'public',
        router,
        userId: 'user-one',
      })
    );

    await act(async () => {
      await result.current.leaveGroup();
    });

    expect(mockedEmitHaptic).toHaveBeenNthCalledWith(1, {
      type: 'destructive-commit',
    });
    expect(mockedEmitHaptic).toHaveBeenNthCalledWith(2, { type: 'unknown' });
    expect(mockedEmitConfirmedOutcome).not.toHaveBeenCalled();
  });

  it('confirms group deletion only from the governance receipt', async () => {
    const deleteGroup = jest.fn().mockResolvedValue({
      kind: 'confirmed',
      receipt: {
        action: 'delete-group',
        groupId: 'group-one',
        verifiedBy: 'state-check',
      },
    });
    const router = { replace: jest.fn() } as never;
    const { result } = renderHook(() =>
      useGroupSettingsActions({
        deleteGroup,
        description: '',
        fetchGroups: jest.fn(),
        group: createGroup('group-one'),
        hasChanges: false,
        isOwner: true,
        leaveGroupAction: jest.fn(),
        name: 'Group group-one',
        privacy: 'public',
        router,
        userId: 'user-one',
      })
    );

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(mockedEmitConfirmedOutcome).toHaveBeenCalledWith(
      'entity-deleted',
      expect.objectContaining({
        receiptId: 'group-one',
        source: 'destructive-change',
      })
    );
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/groups');
  });
});
