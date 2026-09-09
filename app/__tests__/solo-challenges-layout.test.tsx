import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import SoloChallengesScreen from '@/app/solo-challenges';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRpc = jest.fn();
let mockPhoneLayout = {
  isShortHeight: false,
};

const mockParticipantQuery = {
  select: jest.fn(() => mockParticipantQuery),
  eq: jest.fn(() => mockParticipantQuery),
  order: jest.fn(() =>
    Promise.resolve({
      data: [
        {
          current_streak: 0,
          joined_at: '2026-09-01T00:00:00.000Z',
          streak_freezes_remaining: 0,
          challenges: {
            id: 'promise-1',
            title: 'Read the Bible daily',
            category: 'personal',
            start_date: '2026-09-01',
            end_date: '2026-09-14',
            duration: 14,
            status: 'active',
            allow_self_review: true,
            submission_text: 'Show the page I read',
            verification_type: 'photo',
          },
        },
      ],
      error: null,
    })
  ),
};

const mockSubmissionQuery = {
  select: jest.fn(() => mockSubmissionQuery),
  eq: jest.fn(() => mockSubmissionQuery),
  in: jest.fn(() => mockSubmissionQuery),
  order: jest.fn(() => mockSubmissionQuery),
  limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
};

const mockFrom = jest.fn((table: string) =>
  table === 'challenge_participants'
    ? mockParticipantQuery
    : mockSubmissionQuery
);

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock('expo-router/react-navigation', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('@/components/ui', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppButton: ({
      onPress,
      testID,
      title,
    }: {
      onPress: () => void;
      testID?: string;
      title: string;
    }) =>
      React.createElement(
        Pressable,
        { accessibilityLabel: title, onPress, testID },
        React.createElement(Text, null, title)
      ),
    AppScreen: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
    }) => React.createElement(View, { testID }, children),
    ProgressBar: () =>
      React.createElement(View, { testID: 'promise-progress' }),
  };
});

jest.mock('@/components/challenge/ChallengeSubmissionsModal', () => ({
  ChallengeSubmissionsModal: () => null,
}));

jest.mock('@/components/challenge/promise-runtime-states', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    PromiseProofWeek: () =>
      React.createElement(View, { testID: 'promise-proof-week' }),
    SoloChallengesEmptyState: () =>
      React.createElement(View, { testID: 'solo-empty' }),
    SoloChallengesLoadingState: () =>
      React.createElement(View, { testID: 'solo-loading' }),
  };
});

jest.mock('@/components/ipad/ipad-workspace', () => ({
  IPadTwoPaneWorkspace: ({ primary }: { primary: React.ReactNode }) => primary,
  useIPadPortraitWorkspace: () => false,
}));

jest.mock('@/components/ui/Toast', () => ({
  showToast: { error: jest.fn() },
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock('@/lib/navigation/create-entry', () => ({
  openCreateSoloChallenge: jest.fn(),
}));

jest.mock('@/lib/solo-submission-status', () => ({
  decodeTodaysSubmissionStatus: () => 'none',
  getLegacyTodayStatus: () => 'none',
  getSoloTodayAction: () => 'submit',
  hasAuthoritativeLocalDay: () => true,
}));

jest.mock('@/lib/promise/personal-promise-overview', () => ({
  resolvePersonalPromiseLifecycle: () => 'active',
}));

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => mockPhoneLayout,
}));

describe('Personal Promises screen layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPhoneLayout = { isShortHeight: false };
    mockRpc.mockResolvedValue({ data: { status: 'none' }, error: null });
  });

  it('separates orientation, filters, and the real promise object', async () => {
    const screen = render(
      <ThemeProvider>
        <SoloChallengesScreen />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Read the Bible daily')).toBeTruthy();
    });

    expect(screen.getByTestId('personal-promises-content')).toHaveStyle({
      paddingTop: 12,
      width: '100%',
    });
    expect(screen.getByTestId('personal-promises-header-cluster')).toHaveStyle({
      gap: 20,
      marginBottom: 24,
    });
    expect(screen.getByTestId('personal-promises-tabs')).toHaveStyle({
      marginBottom: 20,
    });
    expect(screen.getByTestId('personal-promises-list')).toHaveStyle({
      width: '100%',
    });
    expect(screen.getByTestId('personal-promise-card-promise-1')).toHaveStyle({
      gap: 20,
      padding: 20,
    });
    expect(screen.getByText('Personal promises')).toHaveProp(
      'accessibilityRole',
      'header'
    );
    expect(screen.getByText('Personal promises').props.allowFontScaling).toBe(
      undefined
    );
    expect(screen.getAllByRole('tab')[0]).toHaveStyle({ minHeight: 44 });
    expect(screen.getAllByRole('tab')[0]).toHaveProp('accessibilityState', {
      selected: true,
    });
  });

  it('keeps the same hierarchy with a tighter top inset on short phones', async () => {
    mockPhoneLayout = { isShortHeight: true };
    const screen = render(
      <ThemeProvider>
        <SoloChallengesScreen />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Read the Bible daily')).toBeTruthy();
    });

    expect(screen.getByTestId('personal-promises-content')).toHaveStyle({
      paddingTop: 8,
    });
    expect(screen.getByTestId('personal-promises-tabs')).toBeTruthy();
    expect(screen.getByTestId('personal-promises-list')).toBeTruthy();
  });
});
