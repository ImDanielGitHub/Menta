import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import ChallengeDetailScreen from '../challenges/[id]';
import {
  confirmedPromiseMutation,
  failedPromiseMutation,
} from '@/lib/promises/mutation-result';

let mockOwner = 'account-a';
let mockRoute = 'promise-a';
let mockFocused = true;
let mockDismiss: () => void = () => {};
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockDelete = jest.fn();
const mockRefresh = jest.fn(async () => {});
const mockChallenge = {
  id: 'promise-a',
  title: 'Evening walk',
  description: 'Walk outside',
  creator_id: 'account-a',
  category: 'fitness',
  start_date: '2026-10-01',
  end_date: '2026-10-30',
  verification_type: 'photo',
  verification_frequency: 'daily',
  allow_self_review: true,
  is_public: false,
  status: 'active',
  duration: 30,
  difficulty: 'medium',
  verification_description: 'Show the route',
};
let mockUserChallenges = [
  {
    challengeId: 'promise-a',
    userId: 'account-a',
    status: 'active',
    currentStreak: 0,
  },
];
let mockSheetMounts = 0;
const mockStatus = jest.fn(async () => ({
  hasSubmittedToday: false,
  submissionStatus: null,
  canSubmit: true,
  shouldShowPending: false,
  shouldShowApproved: false,
  shouldShowRejected: false,
}));
const mockCompletion = jest.fn(async () => ({
  completed_days: 0,
  total_days: 30,
  is_completed: false,
}));
const mockQuery = (table: string) => {
  const result = {
    data: table === 'challenges' ? mockChallenge : [],
    error: null,
  };
  const q: any = {};
  for (const name of ['select', 'eq', 'in', 'order', 'limit', 'gte', 'lte'])
    q[name] = () => q;
  q.single = async () => result;
  q.maybeSingle = async () => result;
  q.then = (resolve: (r: unknown) => void) =>
    Promise.resolve(result).then(resolve);
  return q;
};
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockQuery(table),
    rpc: jest.fn(async () => ({ data: [], error: null })),
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { user: { id: mockOwner } } },
        error: null,
      })),
    },
  },
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector?: (s: unknown) => unknown) => {
      const state = {
        user: { id: mockOwner },
        isAuthenticated: true,
        hasCompletedOnboarding: true,
      };
      return selector ? selector(state) : state;
    },
    { getState: () => ({ user: { id: mockOwner } }) }
  ),
}));
jest.mock('@/store/challenge-store', () => ({
  useChallengeStore: () => ({
    userChallenges: mockUserChallenges,
    fetchChallenges: mockRefresh,
    fetchUserChallenges: mockRefresh,
    leaveChallenge: jest.fn(),
    deleteChallenge: mockDelete,
    reconcileDeleteChallenge: mockDelete,
    getComprehensiveSubmissionStatus: mockStatus,
    getChallengeCompletion: mockCompletion,
    shareChallenge: jest.fn(),
  }),
}));
jest.mock('@/store/group-store', () => ({
  useGroupStore: () => ({ groups: [] }),
}));
jest.mock('@/store/momenta-store', () => ({
  useMomentaStore: () => ({ usePowerUp: jest.fn() }),
}));
jest.mock('@/hooks/useStreakState', () => ({
  useStreakState: () => ({
    streakState: null,
    isLoading: false,
    refresh: mockRefresh,
  }),
}));
jest.mock('@/hooks/usePromiseAccountability', () => ({
  usePromiseAccountability: () => ({ data: null }),
}));
jest.mock('@/lib/network', () => ({
  useNetworkState: () => ({ isOnline: true }),
}));
jest.mock('@/lib/services/proof-submission-service', () => ({
  getQueuedProofSubmissions: jest.fn(async () => []),
}));
jest.mock('@/lib/navigation/onboarding-completion', () => ({
  useOnboardingCompletionStore: Object.assign(
    (selector?: (s: unknown) => unknown) =>
      selector
        ? selector({ pendingCompletion: null })
        : { pendingCompletion: null },
    {
      getState: () => ({
        pendingCompletion: null,
        peekCompletionForUser: () => null,
        consumeCompletionForUser: jest.fn(),
      }),
    }
  ),
}));
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
}));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: mockRoute }),
  useIsFocused: () => mockFocused,
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => true,
    push: jest.fn(),
  }),
  useFocusEffect: (cb: () => unknown) => {
    const React = require('react');
    React.useEffect(cb, [cb]);
  },
}));
jest.mock('@/components/challenge/promise-runtime-states', () => {
  const React = require('react');
  const { View, Pressable, Text } = require('react-native');
  const State = (props: any) => (
    <View>
      <Text>{props.promiseTitle}</Text>
      {props.onDelete ? (
        <Pressable testID="delete-promise" onPress={props.onDelete}>
          <Text>Delete</Text>
        </Pressable>
      ) : null}
    </View>
  );
  return Object.fromEntries(
    [
      'PromiseCompleteState',
      'PromiseDetailSkeletonState',
      'PromiseHistoryState',
      'PromiseActiveState',
      'PromiseProofDetailState',
      'PromiseRulesState',
      'PromiseUnavailableState',
      'PromiseWaitingReviewState',
    ].map(name => [name, State])
  );
});
jest.mock('@/components/ui/ConfirmDestructiveSheet', () => ({
  ConfirmDestructiveSheet: ({
    visible,
    onConfirm,
    onDismiss,
    loading,
  }: any) => {
    mockDismiss = onDismiss;
    const React = require('react');
    React.useEffect(() => {
      mockSheetMounts++;
    }, []);
    const { Pressable, Text } = require('react-native');
    return visible ? (
      <Pressable testID="confirm-delete" onPress={onConfirm} disabled={loading}>
        <Text>Confirm delete</Text>
      </Pressable>
    ) : null;
  },
}));
jest.mock('@/components/challenge/detail/DailyLoopPanel', () => ({
  DailyLoopPanel: () => null,
}));
jest.mock('@/components/ui/Toast', () => ({
  showToast: { success: jest.fn() },
}));
jest.mock('@/components/menta-check/menta-group-feedback', () => ({
  MentaGroupFeedback: () => null,
}));
const receipt = confirmedPromiseMutation({
  operation: 'delete',
  challengeId: 'promise-a',
  clientEventId: 'event-a',
  code: 'DELETE_CONFIRMED',
  message: 'Deleted',
  receiptId: 'receipt-a',
});
beforeEach(() => {
  mockSheetMounts = 0;
  mockUserChallenges = [
    {
      challengeId: 'promise-a',
      userId: 'account-a',
      status: 'active',
      currentStreak: 0,
    },
  ];
  mockOwner = 'account-a';
  mockRoute = 'promise-a';
  mockFocused = true;
  jest.clearAllMocks();
  mockDelete.mockReset().mockResolvedValue(receipt);
});
const open = async () => {
  const view = render(<ChallengeDetailScreen />);
  await screen.findByTestId('delete-promise');
  fireEvent.press(screen.getByTestId('delete-promise'));
  return view;
};
it('keeps the native dismissal boundary ahead of navigation after confirmed deletion', async () => {
  await open();
  fireEvent.press(screen.getByTestId('confirm-delete'));
  await waitFor(() =>
    expect(screen.queryByTestId('confirm-delete')).toBeNull()
  );
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(mockBack).not.toHaveBeenCalled();
  act(() => mockDismiss());
  expect(mockBack).toHaveBeenCalledTimes(1);
});
it('stays on the promise after a refused deletion', async () => {
  mockDelete.mockResolvedValue(
    failedPromiseMutation({
      operation: 'delete',
      challengeId: 'promise-a',
      clientEventId: 'event-a',
      code: 'NOT_AUTHORISED',
      message: 'Not changed',
    })
  );
  await open();
  fireEvent.press(screen.getByTestId('confirm-delete'));
  await waitFor(() =>
    expect(screen.queryByTestId('confirm-delete')).toBeNull()
  );
  act(() => mockDismiss());
  expect(mockBack).not.toHaveBeenCalled();
});
it.each(['owner', 'route', 'focus', 'unmount'] as const)(
  'ignores a pending deletion after %s changes',
  async change => {
    let resolve!: (r: typeof receipt) => void;
    mockDelete.mockImplementationOnce(
      () =>
        new Promise(r => {
          resolve = r;
        })
    );
    const view = await open();
    fireEvent.press(screen.getByTestId('confirm-delete'));
    expect(mockDelete).toHaveBeenCalledTimes(1);
    if (change === 'unmount') view.unmount();
    else {
      if (change === 'owner') mockOwner = 'account-b';
      if (change === 'route') mockRoute = 'promise-b';
      if (change === 'focus') mockFocused = false;
      view.rerender(<ChallengeDetailScreen />);
    }
    await act(async () => {
      resolve(receipt);
    });
    act(() => mockDismiss());
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  }
);

it('preserves the native sheet instance while confirmed deletion removes participation from cache', async () => {
  let resolve!: (r: typeof receipt) => void;
  mockDelete.mockImplementationOnce(
    () =>
      new Promise(r => {
        resolve = r;
      })
  );
  const view = await open();
  expect(mockSheetMounts).toBe(1);
  fireEvent.press(screen.getByTestId('confirm-delete'));
  mockUserChallenges = [];
  view.rerender(<ChallengeDetailScreen />);
  expect(mockSheetMounts).toBe(1);
  await act(async () => {
    resolve(receipt);
  });
  expect(mockBack).not.toHaveBeenCalled();
  act(() => mockDismiss());
  expect(mockBack).toHaveBeenCalledTimes(1);
});
