import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import PromiseAccountabilityRoute from '@/app/promise-accountability';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLeave = jest.fn();
const mockReconcile = jest.fn();
const mockEmitResult = jest.fn().mockResolvedValue(false);
const mockReadSavedGroups = jest.fn();
const mockAttachSavedGroup = jest.fn();
const mockBeginPendingSavedGroupLink = jest.fn();
const mockEmitConfirmedOutcome = jest.fn().mockResolvedValue(true);
const mockEmitHaptic = jest.fn().mockResolvedValue(true);
const mockTrackProductOperation = jest.fn();
let mockCanInvite = false;
let mockViewerRole: 'owner' | 'partner' = 'partner';
let mockParams: { challengeId: string; source?: string } = {
  challengeId: 'promise-1',
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: jest.fn(), push: mockPush, replace: mockReplace }),
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { id: 'user-1' } }),
}));

jest.mock('@/hooks/usePromiseAccountability', () => ({
  promiseAccountabilityQueryKey: (id: string) => ['promise-accountability', id],
  usePromiseAccountability: () => ({
    data: {
      promise: {
        id: 'promise-1',
        title: 'Walk after work',
        description: 'Walk for 20 minutes',
        verificationDescription: 'Add a photo',
      },
      group: { id: 'group-1', name: 'Walk after work', kind: 'promise' },
      members: [
        {
          id: 'user-1',
          name: 'Daniel',
          avatarUrl: null,
          role: mockViewerRole,
          participates: true,
          proofStatus: 'none',
        },
      ],
      acceptedCount: 1,
      isShared: true,
      canInvite: mockCanInvite,
      invite: null,
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/lib/promises/accountability', () => ({
  accountabilityRoleCopy: () => ({ title: 'Partner', description: '' }),
  buildPromiseAccountabilityShareMessage: jest.fn(),
  preparePromiseAccountabilityInvite: jest.fn(),
  managePromiseAccountabilityMember: jest.fn(),
  leavePromiseAccountability: (...args: unknown[]) => mockLeave(...args),
  reconcilePromiseAccountabilityLeave: (...args: unknown[]) =>
    mockReconcile(...args),
}));

jest.mock('@/lib/motion/promise-mutation-haptics', () => ({
  emitPromiseMutationResultHaptic: (...args: unknown[]) =>
    mockEmitResult(...args),
}));

jest.mock('@/lib/client-event-id', () => ({
  createClientEventId: () => 'client-event-1',
}));

jest.mock('@/lib/promises/saved-group-options', () => ({
  readAttachableSavedGroups: (...args: unknown[]) =>
    mockReadSavedGroups(...args),
}));

jest.mock('@/lib/promises/saved-group-link', () => ({
  attachPromiseToSavedGroup: (...args: unknown[]) =>
    mockAttachSavedGroup(...args),
}));

jest.mock('@/lib/promises/pending-saved-group-link', () => ({
  beginPendingSavedGroupLink: (...args: unknown[]) =>
    mockBeginPendingSavedGroupLink(...args),
}));

jest.mock('@/lib/motion/haptics', () => ({
  createConfirmedReceipt: (source: string, receiptId: string) => ({
    confirmed: true,
    receiptId,
    source,
  }),
  emitConfirmedOutcome: (...args: unknown[]) =>
    mockEmitConfirmedOutcome(...args),
  emitHaptic: (...args: unknown[]) => mockEmitHaptic(...args),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/lib/posthog', () => ({
  trackProductEvent: jest.fn(),
  trackProductOperation: (...args: unknown[]) =>
    mockTrackProductOperation(...args),
}));
jest.mock('@/lib/sentry', () => ({ logEvent: jest.fn() }));
jest.mock('@/components/challenge/PromiseArtefact', () => ({
  PromiseArtefact: () => null,
}));
jest.mock('@/components/ui/SimpleBottomSheet', () => ({
  SimpleBottomSheet: ({
    visible,
    scrollableBody,
    footer,
    testID,
  }: {
    visible: boolean;
    scrollableBody?: React.ReactNode;
    footer?: React.ReactNode;
    testID?: string;
  }) => {
    const React = require('react') as typeof import('react');
    const { View } = require('react-native') as typeof import('react-native');
    return visible
      ? React.createElement(View, { testID }, scrollableBody, footer)
      : null;
  },
}));
jest.mock('react-native-qrcode-svg', () => () => null);

jest.mock('@/components/ui/ConfirmDestructiveSheet', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text } =
    require('react-native') as typeof import('react-native');
  return {
    ConfirmDestructiveSheet: ({
      visible,
      onConfirm,
    }: {
      visible: boolean;
      onConfirm: () => void;
    }) =>
      visible
        ? React.createElement(
            Pressable,
            { testID: 'confirm-leave', onPress: onConfirm },
            React.createElement(Text, null, 'Confirm leave')
          )
        : null,
  };
});

jest.mock('@/components/ui', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');
  const container = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  return {
    AppButton: ({
      title,
      onPress,
      disabled,
      testID,
    }: {
      title: string;
      onPress?: () => void;
      disabled?: boolean;
      testID?: string;
    }) =>
      React.createElement(
        Pressable,
        { disabled, onPress, testID },
        React.createElement(Text, null, title)
      ),
    AppCard: container,
    AppInlineNotice: ({
      title,
      actionLabel,
      onAction,
      testID,
    }: {
      title: string;
      actionLabel?: string;
      onAction?: () => void;
      testID?: string;
    }) =>
      React.createElement(
        View,
        { testID },
        React.createElement(Text, null, title),
        actionLabel
          ? React.createElement(
              Pressable,
              { onPress: onAction },
              React.createElement(Text, null, actionLabel)
            )
          : null
      ),
    AppOptionCard: container,
    AppScreen: container,
    AppTopBar: () => null,
    SkeletonLoader: () => null,
  };
});

describe('promise accountability mutation route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanInvite = false;
    mockViewerRole = 'partner';
    mockParams = { challengeId: 'promise-1' };
    mockReadSavedGroups.mockResolvedValue([]);
    mockBeginPendingSavedGroupLink.mockResolvedValue(undefined);
    mockLeave.mockResolvedValue({
      outcome: 'unknown',
      operation: 'leave',
      challengeId: 'promise-1',
      clientEventId: 'client-event-1',
      code: 'RESULT_UNKNOWN',
      message: 'Check the result before trying again.',
      recovery: 'status-check',
      requiresStatusCheck: true,
    });
    mockReconcile.mockResolvedValue({
      outcome: 'confirmed',
      operation: 'leave',
      challengeId: 'promise-1',
      code: 'LEAVE_CONFIRMED',
      message: 'You left this promise.',
      receipt: {
        id: 'client-event-1',
        challengeId: 'promise-1',
        clientEventId: 'client-event-1',
        idempotent: true,
        verifiedBy: 'status-check',
      },
    });
  });

  it('holds response loss for a silent status check and never repeats leave', async () => {
    render(
      <ThemeProvider>
        <PromiseAccountabilityRoute />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByText('Leave this promise'));
    fireEvent.press(screen.getByTestId('confirm-leave'));
    expect(await screen.findByText('Result not confirmed')).toBeTruthy();

    fireEvent.press(screen.getByText('Check status'));
    await waitFor(() => expect(mockReconcile).toHaveBeenCalledTimes(1));
    expect(mockLeave).toHaveBeenCalledTimes(1);
    expect(mockEmitResult).toHaveBeenLastCalledWith(
      expect.objectContaining({ outcome: 'confirmed' }),
      'recovery'
    );
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/groups');
  });

  it('keeps the first-promise handoff focused on choosing an invite role', () => {
    mockCanInvite = true;
    mockParams = { challengeId: 'promise-1', source: 'onboarding' };

    render(
      <ThemeProvider>
        <PromiseAccountabilityRoute />
      </ThemeProvider>
    );

    expect(screen.getByText('How should they help?')).toBeTruthy();
    expect(screen.getByTestId('prepare-promise-invitation')).toBeTruthy();
    expect(screen.getByText('Go to Today')).toBeTruthy();
    expect(screen.queryByText('Create group')).toBeNull();
  });

  it('lets the owner attach to a saved group and reuses the same request after an unknown result', async () => {
    mockCanInvite = true;
    mockViewerRole = 'owner';
    mockReadSavedGroups.mockResolvedValue([
      {
        id: 'saved-group-1',
        name: 'Sunday crew',
        privacy: 'private',
        imageUrl: 'menta-preset:move',
        memberCount: 5,
        viewerRole: 'owner',
      },
    ]);
    mockAttachSavedGroup
      .mockResolvedValueOnce({
        outcome: 'unknown',
        code: 'RESULT_UNKNOWN',
        request: {
          challengeId: 'promise-1',
          groupId: 'saved-group-1',
          clientEventId: 'client-event-1',
        },
        retryWithSameClientEvent: true,
      })
      .mockResolvedValueOnce({
        outcome: 'confirmed',
        code: 'PROMISE_LINKED',
        receipt: {
          id: 'receipt-1',
          challengeId: 'promise-1',
          challengeTitle: 'Walk after work',
          groupId: 'saved-group-1',
          groupName: 'Sunday crew',
          clientEventId: 'client-event-1',
          linkedAt: '2026-09-01T00:00:00.000Z',
          idempotent: true,
          promiseContainerPreserved: true,
          confirmedMembersCanView: true,
          reviewAuthority: 'confirmed_saved_group_members',
        },
      });

    render(
      <ThemeProvider>
        <PromiseAccountabilityRoute />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByText('Do this with a group'));
    expect(await screen.findByText('Sunday crew')).toBeTruthy();
    const option = screen.getByTestId('saved-group-option-saved-group-1');
    expect(option.props.accessibilityRole).toBe('radio');
    expect(option.props.accessibilityState).toEqual({
      checked: true,
      disabled: false,
    });

    fireEvent.press(screen.getByText('Continue with Sunday crew'));
    expect(await screen.findByText('Link not confirmed')).toBeTruthy();
    fireEvent.press(screen.getByText('Check again'));

    await waitFor(() => expect(mockAttachSavedGroup).toHaveBeenCalledTimes(2));
    expect(mockAttachSavedGroup.mock.calls[0]?.[0]).toEqual(
      mockAttachSavedGroup.mock.calls[1]?.[0]
    );
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/groups/[id]',
        params: { id: 'saved-group-1' },
      })
    );
    expect(mockEmitConfirmedOutcome).toHaveBeenCalledWith(
      'promise-joined',
      expect.objectContaining({ receiptId: 'receipt-1' })
    );
    expect(mockEmitHaptic).not.toHaveBeenCalled();
    expect(mockTrackProductOperation).not.toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: expect.anything() })
    );
  });

  it('persists the promise link event before opening the existing group creator', async () => {
    mockCanInvite = true;
    mockViewerRole = 'owner';

    render(
      <ThemeProvider>
        <PromiseAccountabilityRoute />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByText('Do this with a group'));
    expect(await screen.findByText('No saved groups yet')).toBeTruthy();
    fireEvent.press(screen.getByText('Create a new group'));

    await waitFor(() =>
      expect(mockBeginPendingSavedGroupLink).toHaveBeenCalledWith('user-1', {
        challengeId: 'promise-1',
        clientEventId: 'client-event-1',
      })
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/create-group',
      params: { source: 'promise_accountability' },
    });
  });
});
