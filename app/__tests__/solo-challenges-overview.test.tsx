import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { format, subDays } from 'date-fns';

import SoloChallengesScreen from '@/app/solo-challenges';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockPush = jest.fn();
const mockRpc = jest.fn();
const mockOpenCreate = jest.fn();

const today = new Date();
const localDay = (daysAgo: number) =>
  format(subDays(today, daysAgo), 'yyyy-MM-dd');

type ParticipantRow = {
  current_streak: number;
  joined_at: string;
  streak_freezes_remaining: number;
  challenges: {
    id: string;
    title: string;
    category: string;
    start_date: string;
    end_date: string | null;
    duration: number;
    status: string;
    allow_self_review: boolean;
    submission_text: string;
    verification_type: string;
  };
};

const promiseRow = (
  id: string,
  title: string,
  overrides: Partial<ParticipantRow['challenges']> = {},
  streak = 0
): ParticipantRow => ({
  current_streak: streak,
  joined_at: `${localDay(3)}T08:00:00.000Z`,
  streak_freezes_remaining: 1,
  challenges: {
    id,
    title,
    category: 'personal',
    start_date: localDay(3),
    end_date: null,
    duration: 30,
    status: 'active',
    allow_self_review: true,
    submission_text: 'Show the page',
    verification_type: 'photo',
    ...overrides,
  },
});

let mockRows: ParticipantRow[] = [];
let mockSubmissions: {
  id: string;
  challenge_id: string;
  status: string;
  submission_date: string;
  local_day: string;
  media_url?: string | null;
}[] = [];

const mockParticipantQuery = {
  select: jest.fn(() => mockParticipantQuery),
  eq: jest.fn(() => mockParticipantQuery),
  order: jest.fn(() => Promise.resolve({ data: mockRows, error: null })),
};

const mockSubmissionQuery = {
  select: jest.fn(() => mockSubmissionQuery),
  eq: jest.fn(() => mockSubmissionQuery),
  in: jest.fn(() => mockSubmissionQuery),
  order: jest.fn(() => mockSubmissionQuery),
  limit: jest.fn(() => Promise.resolve({ data: mockSubmissions, error: null })),
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
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
        { accessibilityRole: 'button', onPress, testID },
        React.createElement(Text, null, title)
      ),
    AppScreen: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
    }) => React.createElement(View, { testID }, children),
    ProgressBar: () => null,
  };
});

jest.mock('@/components/challenge/ChallengeSubmissionsModal', () => ({
  ChallengeSubmissionsModal: () => null,
}));

jest.mock('@/components/challenge/promise-runtime-states', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    PromiseProofWeek: () => null,
    SoloChallengesEmptyState: () =>
      React.createElement(View, { testID: 'solo-empty' }),
    SoloChallengesLoadingState: () =>
      React.createElement(View, { testID: 'solo-loading' }),
  };
});

jest.mock('@/components/ui/SignedImage', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SignedImage: ({ uri }: { uri: string }) =>
      React.createElement(View, { testID: `proof-photo:${uri}` }),
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
    from: (table: string) =>
      table === 'challenge_participants'
        ? mockParticipantQuery
        : mockSubmissionQuery,
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock('@/lib/navigation/create-entry', () => ({
  openCreateSoloChallenge: (...args: unknown[]) => mockOpenCreate(...args),
}));

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: () => ({ isShortHeight: false }),
}));

const todayStatusFor = (statusById: Record<string, string | null>) =>
  mockRpc.mockImplementation(
    (_name: string, { p_challenge_id }: { p_challenge_id: string }) => {
      const status = statusById[p_challenge_id] ?? null;
      return Promise.resolve({
        data: status
          ? { has_submitted: true, submission_status: status }
          : { has_submitted: false },
        error: null,
      });
    }
  );

const renderScreen = () =>
  render(
    <ThemeProvider>
      <SoloChallengesScreen />
    </ThemeProvider>
  );

describe('Personal promises overview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRows = [];
    mockSubmissions = [];
  });

  it('leads with what is left today and sends a due promise straight to proof', async () => {
    mockRows = [
      promiseRow('read', 'Read ten pages before bed', {}, 3),
      promiseRow('walk', 'Walk after work'),
    ];
    mockSubmissions = [
      {
        id: 's1',
        challenge_id: 'read',
        status: 'approved',
        submission_date: `${localDay(1)}T20:00:00.000Z`,
        local_day: localDay(1),
      },
    ];
    todayStatusFor({ walk: 'approved' });

    const screen = renderScreen();
    await waitFor(() =>
      expect(screen.getByText('One left to check in today.')).toBeTruthy()
    );

    expect(screen.getByText('Day 4 of 30 · 3-day streak')).toBeTruthy();
    expect(screen.getByText('Counted')).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();

    fireEvent.press(screen.getByTestId('personal-promise-action-read'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/verification',
      params: {
        challengeId: 'read',
        verificationType: 'photo',
        suggestedVerificationType: 'photo',
        source: 'solo',
      },
    });

    fireEvent.press(screen.getByTestId('personal-promise-row-walk'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/challenges/[id]',
      params: { id: 'walk' },
    });
  });

  it('shows the week once for every running promise and keeps an open today out of the count', async () => {
    mockRows = [promiseRow('read', 'Read ten pages before bed')];
    mockSubmissions = [
      {
        id: 's1',
        challenge_id: 'read',
        status: 'approved',
        submission_date: `${localDay(1)}T20:00:00.000Z`,
        local_day: localDay(1),
        media_url: 'proofs/read-yesterday.jpg',
      },
    ];
    todayStatusFor({});

    const screen = renderScreen();
    await waitFor(() =>
      expect(screen.getByTestId('personal-promise-week-read')).toBeTruthy()
    );

    const daysSinceMonday = (today.getDay() + 6) % 7;
    const eligible = Math.min(daysSinceMonday, 3);
    const kept = daysSinceMonday >= 1 ? 1 : 0;
    expect(
      screen.getByLabelText(
        `Read ten pages before bed: ${kept} of ${eligible} days kept this week`
      )
    ).toBeTruthy();
    // The row cover and, within this week, the day tile both show the photo.
    expect(
      screen.getAllByTestId('proof-photo:proofs/read-yesterday.jpg')
    ).toHaveLength(daysSinceMonday >= 1 ? 2 : 1);
  });

  it('moves ended promises into Finished and says when all of today is in', async () => {
    mockRows = [
      promiseRow('walk', 'Walk after work'),
      promiseRow('phone', 'No phone after 10 pm', {
        status: 'completed',
        duration: 14,
      }),
    ];
    mockSubmissions = Array.from({ length: 14 }, (_, index) => ({
      id: `p${index}`,
      challenge_id: 'phone',
      status: 'approved',
      submission_date: `${localDay(20 + index)}T20:00:00.000Z`,
      local_day: localDay(20 + index),
      media_url: `proofs/phone-${index}.jpg`,
    }));
    todayStatusFor({ walk: 'pending' });

    const screen = renderScreen();
    await waitFor(() =>
      expect(screen.getByText('All checked in for today.')).toBeTruthy()
    );

    expect(screen.getByText('Waiting')).toBeTruthy();
    expect(screen.getByText('Kept 14 of 14 days')).toBeTruthy();
    expect(screen.getByTestId('proof-photo:proofs/phone-0.jpg')).toBeTruthy();
    expect(screen.getByTestId('proof-photo:proofs/phone-2.jpg')).toBeTruthy();
    expect(screen.queryByTestId('proof-photo:proofs/phone-3.jpg')).toBeNull();
    expect(screen.getByText('+11')).toBeTruthy();
    expect(screen.queryByTestId('personal-promise-row-phone')).toBeNull();
    expect(screen.queryByTestId('personal-promise-week-phone')).toBeNull();

    fireEvent.press(screen.getByTestId('personal-promise-finished-phone'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/challenges/[id]',
      params: { id: 'phone' },
    });
  });

  it('offers a new promise when only finished ones remain', async () => {
    mockRows = [
      promiseRow('phone', 'No phone after 10 pm', { status: 'completed' }),
    ];
    todayStatusFor({});

    const screen = renderScreen();
    await waitFor(() =>
      expect(screen.getByText('Nothing running right now.')).toBeTruthy()
    );

    fireEvent.press(screen.getByText('Create a promise'));
    expect(mockOpenCreate).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'solo_screen' })
    );
  });
});
