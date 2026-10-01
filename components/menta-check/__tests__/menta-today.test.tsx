import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { MentaToday } from '../menta-today';
import type { MentaTodayItem } from '@/lib/menta-check/types';

const mockPush = jest.fn();
let mockOwner = 'account-a';
const mockInvalidate = jest.fn(async () => undefined);
const mockCount = jest.fn();
const mockFriend = jest.fn();
let mockEvent = 0;
jest.mock('@/store/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) =>
      selector({ user: { id: mockOwner } }),
    { getState: () => ({ user: { id: mockOwner } }) }
  ),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => unknown) => {
    const React = require('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock('@/hooks/use-menta-check', () => ({
  useMentaCheckOverview: () => ({ data: { overrideCost: 15 } }),
}));
jest.mock('@/lib/menta-check/api', () => ({
  newMentaEventId: () => `event-${++mockEvent}`,
  countMentaProofAnyway: (...args: unknown[]) => mockCount(...args),
  askFriendForMentaProof: (...args: unknown[]) => mockFriend(...args),
  reportMentaCheck: jest.fn(),
}));
jest.mock('@/components/ui/SimpleBottomSheet', () => ({
  SimpleBottomSheet: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: React.ReactNode;
  }) => (visible ? children : null),
}));
jest.mock('@/components/onboarding/MentaNarrator', () => ({
  MentaNarrator: () => null,
}));
jest.mock('@/components/today/TodayPromiseReceipt', () => ({
  TodayPromiseReceipt: () => null,
}));
jest.mock('@/components/ui/SignedImage', () => ({
  SignedImage: ({ uri, alt }: { uri: string; alt: string }) => {
    const { Image } = jest.requireActual('react-native');
    return (
      <Image source={{ uri }} accessibilityLabel={alt} testID="proof-photo" />
    );
  },
}));
jest.mock('@/components/ui/AppButton', () => ({
  AppButton: ({ title, onPress }: { title: string; onPress: () => void }) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return (
      <Pressable onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/lib/localization', () => ({
  useTranslation: () => ({ t: (key: string) => key, locale: 'en-NZ' }),
}));

const item: MentaTodayItem = {
  challengeId: 'promise',
  title: 'Evening walk',
  rule: 'Watch showing twenty minutes',
  reviewMode: 'menta',
  backupHours: 24,
  proofKind: 'photo',
  localDay: '2026-09-28',
  submissionId: 'submitted-proof',
  status: 'approved',
  mediaType: 'photo',
  mediaUrl: 'member/promise/photo.jpg',
  submittedAt: null,
  reviewSource: 'menta',
  outcome: 'counted',
  reason: null,
  tip: null,
  flagged: false,
  notYetsToday: 0,
  overridesLeft: 2,
  graceUntil: null,
  state: 'counted',
};

it.each(['counted', 'counted_tip', 'backup_counted', 'unavailable'] as const)(
  'shows the actual submitted photo and opens its exact proof for %s',
  state => {
    render(<MentaToday item={{ ...item, state }} onChanged={jest.fn()} />);
    expect(screen.getByTestId('proof-photo').props.source.uri).toBe(
      item.mediaUrl
    );
    fireEvent.press(
      screen.getByRole('button', {
        name: 'mentaCheck.today.view: mentaCheck.today.yourPhoto',
      })
    );
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/challenges/[id]',
      params: { id: 'promise', view: 'proof', proofId: 'submitted-proof' },
    });
  }
);

it.each(['video', 'text'] as const)(
  'does not present %s evidence as a photo',
  mediaType => {
    render(
      <MentaToday
        item={{ ...item, mediaType, proofKind: mediaType }}
        onChanged={jest.fn()}
      />
    );
    expect(screen.queryByTestId('proof-photo')).toBeNull();
    expect(
      screen.getByText(`todayProof.promise.${mediaType}_proof`)
    ).toBeTruthy();
  }
);

describe('explicit override request lifecycle', () => {
  beforeEach(() => {
    mockOwner = 'account-a';
    mockEvent = 0;
    jest.clearAllMocks();
    mockCount.mockReset().mockResolvedValue({ success: true });
    mockFriend.mockReset().mockResolvedValue({ success: true });
    mockInvalidate.mockReset().mockResolvedValue(undefined);
  });
  const rejected = {
    ...item,
    state: 'not_yet' as const,
    status: 'rejected' as const,
  };
  const open = () =>
    fireEvent.press(screen.getByText('mentaCheck.today.iDidIt'));
  const count = () =>
    fireEvent.press(
      screen.getByText('mentaCheck.override.countTitle · 15 Momenta')
    );
  it('makes one explicit override RPC for double taps and no AI request', async () => {
    let resolve!: (value: unknown) => void;
    mockCount.mockImplementationOnce(
      () =>
        new Promise(r => {
          resolve = r;
        })
    );
    const changed = jest.fn();
    render(<MentaToday item={rejected} onChanged={changed} />);
    open();
    act(() => {
      count();
      count();
    });
    expect(mockCount).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve({ success: true });
    });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(mockFriend).not.toHaveBeenCalled();
  });
  it.each(['account', 'unmount', 'proof'] as const)(
    'ignores count completion after %s changes',
    async change => {
      let resolve!: (value: unknown) => void;
      mockCount.mockImplementationOnce(
        () =>
          new Promise(r => {
            resolve = r;
          })
      );
      const changed = jest.fn();
      const view = render(<MentaToday item={rejected} onChanged={changed} />);
      open();
      count();
      if (change === 'account') {
        mockOwner = 'account-b';
        view.rerender(<MentaToday item={rejected} onChanged={changed} />);
      } else if (change === 'unmount') view.unmount();
      else
        view.rerender(
          <MentaToday
            item={{ ...rejected, submissionId: 'new-proof' }}
            onChanged={changed}
          />
        );
      await act(async () => {
        resolve({ success: true });
      });
      expect(changed).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    }
  );
  it('checks ownership again after asynchronous readback invalidation', async () => {
    let resolve!: (value: undefined) => void;
    mockInvalidate.mockImplementationOnce(
      () =>
        new Promise(r => {
          resolve = r;
        })
    );
    const changed = jest.fn();
    const view = render(<MentaToday item={rejected} onChanged={changed} />);
    open();
    count();
    await waitFor(() => expect(mockInvalidate).toHaveBeenCalledTimes(1));
    mockOwner = 'account-b';
    view.rerender(<MentaToday item={rejected} onChanged={changed} />);
    await act(async () => {
      resolve(undefined);
    });
    expect(changed).not.toHaveBeenCalled();
  });
  it('binds idempotency keys to the proof and keeps the key for a response-loss retry', async () => {
    mockCount.mockRejectedValueOnce(new Error('response lost'));
    const changed = jest.fn();
    const view = render(<MentaToday item={rejected} onChanged={changed} />);
    open();
    count();
    await screen.findByText('mentaCheck.error.generic');
    const first = mockCount.mock.calls[0][1];
    count();
    await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
    expect(mockCount.mock.calls[1][1]).toBe(first);
    view.rerender(
      <MentaToday
        item={{ ...rejected, submissionId: 'new-proof' }}
        onChanged={changed}
      />
    );
    open();
    count();
    await waitFor(() => expect(mockCount).toHaveBeenCalledTimes(3));
    expect(mockCount.mock.calls[2]).toEqual(['new-proof', expect.any(String)]);
    expect(mockCount.mock.calls[2][1]).not.toBe(first);
  });
  it.each(['WEEKLY_LIMIT', 'INSUFFICIENT_BALANCE', 'NOT_FOUND'])(
    'preserves a refused %s result without showing success',
    async code => {
      mockCount.mockResolvedValueOnce({ success: false, code });
      const changed = jest.fn();
      render(<MentaToday item={rejected} onChanged={changed} />);
      open();
      count();
      await waitFor(() => expect(mockCount).toHaveBeenCalledTimes(1));
      await act(async () => {});
      expect(changed).not.toHaveBeenCalled();
      expect(mockInvalidate).not.toHaveBeenCalled();
    }
  );
});
