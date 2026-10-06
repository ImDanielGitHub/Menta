import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HomeWidgetSync } from '../HomeWidgetSync';
import WidgetOpenScreen from '@/app/widget-open';
import {
  refreshHomeWidget,
  useHomeWidgetStore,
} from '@/store/home-widget-store';
import { makeWidgetFallback } from '@/lib/widgets/widget-model';
import type { StreakWidgetSnapshot } from '@/lib/widgets/widget-model';

const mockAuth = {
  isInitialized: false,
  isAuthenticated: true,
  user: { id: 'owner-a' } as { id: string } | null,
};
const mockReadTimeline = jest.fn();
const mockReadAccountability = jest.fn();
const mockRouter = { replace: jest.fn() };
const mockPublished: StreakWidgetSnapshot[] = [];
const mockPendingReads: ((value: {
  source: 'v2';
  rows: Record<string, unknown>[];
}) => void)[] = [];

jest.mock('@/store/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector: (state: typeof mockAuth) => unknown) => selector(mockAuth),
    { getState: () => mockAuth }
  ),
}));
jest.mock('@/lib/localization', () => ({
  useTranslation: () => ({ locale: 'en-NZ', t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({
  usePathname: () => '/(tabs)',
  useLocalSearchParams: () => ({ promise: promiseId }),
  useRouter: () => mockRouter,
  Stack: { Screen: () => null },
}));
jest.mock('@/components/ui/AppShell', () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/ui/SkeletonLoader', () => ({
  SkeletonLoader: () => null,
}));
jest.mock('@/lib/loop/accountability', () => ({
  readTodayAccountability: () => mockReadAccountability(),
}));
jest.mock('@/lib/supabase', () => {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: async () => ({ data: [], error: null }),
  };
  return { supabase: { from: () => query } };
});
jest.mock('@/lib/widgets/widget-native', () => ({
  homeWidgetsAvailable: () => true,
  readWidgetTimeline: () => mockReadTimeline(),
  publishWidgetTimeline: async (
    entries: { props: StreakWidgetSnapshot }[],
    current: () => boolean
  ) => {
    if (current()) mockPublished.push(entries[0].props);
  },
}));

const promiseId = '10b09cc1-3bfb-4c13-82b1-c77b6fdfb759';
const authoritativeRead = () => ({
  source: 'v2' as const,
  rows: [
    {
      challenge_id: promiseId,
      challenge_title: 'Read my private journal',
      current_streak: 9,
      local_day: new Date().toISOString().slice(0, 10),
      effective_timezone: 'UTC',
      proof_status: 'none',
      verification_type: 'text',
      is_solo: true,
    },
  ],
});
const cached = (): StreakWidgetSnapshot => ({
  ...makeWidgetFallback('choose', 'en-NZ'),
  ownerId: 'owner-a',
  state: 'due',
  title: 'Read my private journal',
  streak: '8',
  expiresAt: Date.now() + 60_000,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPublished.length = 0;
  mockReadAccountability.mockImplementation(
    () => new Promise(resolve => mockPendingReads.push(resolve))
  );
  Object.assign(mockAuth, {
    isInitialized: false,
    isAuthenticated: true,
    user: { id: 'owner-a' },
  });
  useHomeWidgetStore.setState({
    ownerId: null,
    ready: false,
    available: false,
    loading: false,
    saving: false,
    error: null,
    preferences: { promiseId: null, showText: false, dismissed: false },
    promises: [],
    snapshot: makeWidgetFallback('signed-out', 'en-NZ'),
  });
  mockReadTimeline.mockResolvedValue([
    { date: new Date(Date.now() - 1000), props: cached() },
  ]);
  jest
    .mocked(AsyncStorage.getItem)
    .mockImplementation(async key =>
      key.endsWith('owner-a')
        ? JSON.stringify({ promiseId, showText: true })
        : null
    );
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const resolve of mockPendingReads.splice(0))
      resolve({ source: 'v2', rows: [] });
  });
});

it('preserves a fresh same-account widget throughout auth and network startup', async () => {
  const screen = render(<HomeWidgetSync />);
  expect(mockPublished).toEqual([]);
  mockAuth.isInitialized = true;
  screen.rerender(<HomeWidgetSync />);
  await waitFor(() =>
    expect(useHomeWidgetStore.getState()).toMatchObject({
      ready: true,
      loading: true,
    })
  );
  expect(useHomeWidgetStore.getState().snapshot.streak).toBe('8');
  expect(mockPublished).toEqual([]);
});

it('redacts a confirmed account switch before the new account finishes loading', async () => {
  mockAuth.isInitialized = true;
  const screen = render(<HomeWidgetSync />);
  await waitFor(() =>
    expect(useHomeWidgetStore.getState()).toMatchObject({
      ready: true,
      loading: true,
    })
  );
  mockAuth.user = { id: 'owner-b' };
  screen.rerender(<HomeWidgetSync />);
  expect(mockPublished.at(-1)).toMatchObject({
    ownerId: 'owner-b',
    state: 'choose',
    streak: '',
  });
  expect(JSON.stringify(mockPublished)).not.toContain(
    'Read my private journal'
  );
});

it('clears the native timeline only after signed-out auth is confirmed', async () => {
  mockAuth.isAuthenticated = false;
  mockAuth.user = null;
  const screen = render(<HomeWidgetSync />);
  expect(mockPublished).toEqual([]);
  mockAuth.isInitialized = true;
  screen.rerender(<HomeWidgetSync />);
  expect(mockPublished.at(-1)).toMatchObject({
    state: 'signed-out',
    streak: '',
  });
});

it.each(['different-owner', 'expired'])(
  'does not preserve a %s native snapshot',
  async kind => {
    mockAuth.isInitialized = true;
    const props = cached();
    if (kind === 'different-owner') props.ownerId = 'owner-b';
    else props.expiresAt = Date.now() - 1;
    mockReadTimeline.mockResolvedValue([
      { date: new Date(Date.now() - 1000), props },
    ]);
    render(<HomeWidgetSync />);
    await waitFor(() => expect(mockPublished.length).toBeGreaterThan(0));
    expect(mockPublished[0]).toMatchObject({ state: 'choose', streak: '' });
    expect(JSON.stringify(mockPublished)).not.toContain(
      'Read my private journal'
    );
  }
);

it('loads the saved selection and refreshes even when the native cache read fails', async () => {
  mockAuth.isInitialized = true;
  mockReadTimeline.mockRejectedValue(new Error('Native cache unavailable'));
  mockReadAccountability.mockResolvedValue(authoritativeRead());
  render(<HomeWidgetSync />);
  await waitFor(() =>
    expect(mockPublished.at(-1)).toMatchObject({
      ownerId: 'owner-a',
      streak: '9',
    })
  );
  expect(useHomeWidgetStore.getState()).toMatchObject({
    ready: true,
    error: null,
    preferences: { promiseId },
  });
});

it('redacts a valid owned widget after a preference read failure and retries on the next refresh', async () => {
  mockAuth.isInitialized = true;
  jest
    .mocked(AsyncStorage.getItem)
    .mockRejectedValueOnce(new Error('Storage busy'));
  mockReadAccountability.mockResolvedValue(authoritativeRead());
  render(<HomeWidgetSync />);
  await waitFor(() =>
    expect(useHomeWidgetStore.getState()).toMatchObject({
      ready: false,
      loading: false,
      error: 'read',
    })
  );
  expect(useHomeWidgetStore.getState().snapshot.title).not.toBe(
    'Read my private journal'
  );
  expect(mockPublished.at(-1)?.title).not.toBe('Read my private journal');
  expect(mockPublished.length).toBeGreaterThan(0);
  await act(async () => {
    await refreshHomeWidget();
  });
  await waitFor(() =>
    expect(mockPublished.at(-1)).toMatchObject({
      streak: '9',
      ownerId: 'owner-a',
    })
  );
  expect(useHomeWidgetStore.getState()).toMatchObject({
    ready: true,
    error: null,
    preferences: { promiseId },
  });
});

it('keeps an unreadable unowned cache neutral and still retries saved preferences', async () => {
  mockAuth.isInitialized = true;
  mockReadTimeline.mockResolvedValue([]);
  jest
    .mocked(AsyncStorage.getItem)
    .mockRejectedValueOnce(new Error('Storage busy'));
  mockReadAccountability.mockResolvedValue(authoritativeRead());
  render(<HomeWidgetSync />);
  await waitFor(() =>
    expect(useHomeWidgetStore.getState()).toMatchObject({
      ready: false,
      error: 'read',
    })
  );
  expect(mockPublished.at(-1)).toMatchObject({ state: 'stale', streak: '' });
  await act(async () => {
    await refreshHomeWidget();
  });
  await waitFor(() => expect(mockPublished.at(-1)?.streak).toBe('9'));
});

it.each([false, true])(
  'revalidates a widget tap while preference loading=%s has an error',
  async loading => {
    mockAuth.isInitialized = true;
    useHomeWidgetStore.setState({
      ownerId: 'owner-a',
      available: true,
      ready: false,
      loading,
      error: 'read',
    });
    mockReadAccountability.mockResolvedValue(authoritativeRead());
    render(<WidgetOpenScreen />);
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: '/verification',
        params: {
          challengeId: promiseId,
          verificationType: 'text',
          source: 'solo',
        },
      })
    );
    expect(mockReadAccountability).toHaveBeenCalledTimes(1);
  }
);

it('waits for confirmed authentication before revalidating a widget tap', async () => {
  mockReadAccountability.mockResolvedValue(authoritativeRead());
  const screen = render(<WidgetOpenScreen />);
  expect(mockReadAccountability).not.toHaveBeenCalled();
  mockAuth.isInitialized = true;
  screen.rerender(<WidgetOpenScreen />);
  await waitFor(() =>
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/verification' })
    )
  );
});

it('does not open a promise that the server no longer returns for this account', async () => {
  mockAuth.isInitialized = true;
  mockReadAccountability.mockResolvedValue({ source: 'v2', rows: [] });
  render(<WidgetOpenScreen />);
  await waitFor(() =>
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)')
  );
});

it.each(['pending', 'approved'])(
  'opens history for server-confirmed %s proof',
  async proofStatus => {
    mockAuth.isInitialized = true;
    const read = authoritativeRead();
    read.rows[0].proof_status = proofStatus;
    mockReadAccountability.mockResolvedValue(read);
    render(<WidgetOpenScreen />);
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: '/challenges/[id]',
        params: { id: promiseId, view: 'history' },
      })
    );
  }
);

it('ignores a widget response from the account that was left during the read', async () => {
  mockAuth.isInitialized = true;
  const screen = render(<WidgetOpenScreen />);
  mockAuth.user = { id: 'owner-b' };
  screen.rerender(<WidgetOpenScreen />);
  await act(async () => {
    mockPendingReads.shift()?.(authoritativeRead());
  });
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

it('allows setup to replace malformed saved preferences without disclosing cached text', async () => {
  mockAuth.isInitialized = true;
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('not-json');
  mockReadAccountability.mockResolvedValue(authoritativeRead());
  render(<HomeWidgetSync />);
  await waitFor(() => expect(useHomeWidgetStore.getState().ready).toBe(true));
  expect(useHomeWidgetStore.getState().preferences).toMatchObject({
    promiseId: null,
    showText: false,
  });
  expect(mockPublished.at(-1)).toMatchObject({ state: 'choose', streak: '' });
  await act(async () => {
    await refreshHomeWidget(true);
  });
  expect(useHomeWidgetStore.getState().promises).toHaveLength(1);
});

it('returns to Today after a failed widget revalidation without a retry loop', async () => {
  mockAuth.isInitialized = true;
  useHomeWidgetStore.setState({
    ownerId: 'owner-a',
    available: true,
    ready: true,
  });
  mockReadAccountability.mockRejectedValue(new Error('Offline'));
  render(<WidgetOpenScreen />);
  await waitFor(() =>
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)')
  );
  expect(mockReadAccountability).toHaveBeenCalledTimes(1);
});
