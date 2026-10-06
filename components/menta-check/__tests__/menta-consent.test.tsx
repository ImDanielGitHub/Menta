import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { MentaConsent, MentaPermission } from '../menta-consent';
import { mentaCheckEnNZ as mockCopy } from '@/lib/localization/catalogues/en-NZ/menta-check';

const mockAccept = jest.fn();
const mockLegacyConsent = jest.fn();
let mockOwner: string | undefined = 'account-a';
const confirmed = {
  success: true,
  consented: true,
  policy_version: 2,
  acknowledgement_id: '30000000-0000-4000-8000-000000000001',
  acknowledged_at: '2026-10-04T05:00:00.000Z',
};
jest.mock('@/store/auth-store', () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) =>
      selector({ user: mockOwner ? { id: mockOwner } : null }),
    { getState: () => ({ user: mockOwner ? { id: mockOwner } : null }) }
  ),
}));
jest.mock('@/lib/menta-check/api', () => ({
  acceptMentaCheckMediaConsentV2: (...args: unknown[]) => mockAccept(...args),
  setMentaCheckConsent: (...args: unknown[]) => mockLegacyConsent(...args),
}));
jest.mock('@/constants/ThemeContext', () => ({
  __esModule: true,
  default: jest.requireActual('react').createContext({}),
  useTheme: () => ({ isDark: true, colors: {} }),
}));
jest.mock('@/lib/localization', () => ({
  useTranslation: () => ({
    t: (key: keyof typeof mockCopy) => mockCopy[key],
  }),
}));
jest.mock('@/components/ui/SkeletonLoader', () => ({
  SkeletonLoader: () => null,
}));
jest.mock('@/components/onboarding/MentaNarrator', () => ({
  MentaNarrator: ({ message }: { message: string }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text accessibilityRole="header">{message}</Text>;
  },
}));
jest.mock('@/components/ui/AppShell', () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => children,
  AppTopBar: ({ onBack }: { onBack: () => void }) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
      >
        <Text>Back</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/components/ui/AppButton', () => ({
  AppButton: ({
    title,
    onPress,
    disabled,
    loading,
  }: {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={onPress}
      >
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

beforeEach(() => {
  mockOwner = 'account-a';
  mockAccept.mockReset().mockResolvedValue(confirmed);
  mockLegacyConsent.mockReset();
});
const allow = () =>
  fireEvent.press(screen.getByRole('button', { name: 'Allow AI checks' }));

it('discloses media, sound, recipient, purpose, scope, exclusions and withdrawal before permission', () => {
  render(
    <MentaConsent
      visible
      source="onboarding"
      onAccepted={jest.fn()}
      onClose={jest.fn()}
    />
  );
  for (const key of [
    'media',
    'purpose',
    'scope',
    'exclusions',
    'withdrawal',
  ] as const) {
    expect(
      screen.getByText(mockCopy[`mentaCheck.consent.${key}`])
    ).toBeTruthy();
  }
  expect(
    screen.queryByText('AI checks stay off until you allow them.')
  ).toBeNull();
  expect(mockAccept).not.toHaveBeenCalled();
  expect(mockLegacyConsent).not.toHaveBeenCalled();
});

it.each([false, true])(
  'Not now closes renewal=%s without accepting or withdrawing',
  renewal => {
    const close = jest.fn();
    const accepted = jest.fn();
    render(
      <MentaConsent
        visible
        source="settings"
        renewal={renewal}
        onAccepted={accepted}
        onClose={close}
      />
    );
    if (renewal)
      expect(
        screen.getByText('Your existing review settings stay the same.')
      ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(accepted).not.toHaveBeenCalled();
    expect(mockAccept).not.toHaveBeenCalled();
    expect(mockLegacyConsent).not.toHaveBeenCalled();
  }
);

it('accepts explicitly through v2 and reports only confirmed success', async () => {
  const accepted = jest.fn();
  render(
    <MentaConsent
      visible
      source="create"
      onAccepted={accepted}
      onClose={jest.fn()}
    />
  );
  allow();
  await waitFor(() => expect(accepted).toHaveBeenCalledTimes(1));
  expect(mockAccept).toHaveBeenCalledWith('create');
  expect(mockLegacyConsent).not.toHaveBeenCalled();
});

it('guards duplicate taps and keeps close actions from racing an in-flight save', async () => {
  let resolve!: (value: unknown) => void;
  mockAccept.mockImplementationOnce(
    () =>
      new Promise(r => {
        resolve = r;
      })
  );
  const accepted = jest.fn();
  const close = jest.fn();
  render(
    <MentaConsent
      visible
      source="settings"
      onAccepted={accepted}
      onClose={close}
    />
  );
  act(() => {
    allow();
    allow();
  });
  fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(mockAccept).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
  await act(async () => {
    resolve(confirmed);
  });
  expect(accepted).toHaveBeenCalledTimes(1);
});

it.each(['account', 'unmount', 'hidden', 'source'] as const)(
  'ignores completion after %s changes',
  async change => {
    let resolve!: (value: unknown) => void;
    mockAccept.mockImplementationOnce(
      () =>
        new Promise(r => {
          resolve = r;
        })
    );
    const accepted = jest.fn();
    const props = {
      visible: true,
      source: 'settings' as const,
      onAccepted: accepted,
      onClose: jest.fn(),
    };
    const view = render(<MentaConsent {...props} />);
    allow();
    if (change === 'account') {
      mockOwner = 'account-b';
      view.rerender(<MentaConsent {...props} />);
    } else if (change === 'unmount') view.unmount();
    else if (change === 'hidden')
      view.rerender(<MentaConsent {...props} visible={false} />);
    else view.rerender(<MentaConsent {...props} source="create" />);
    await act(async () => {
      resolve(confirmed);
    });
    expect(accepted).not.toHaveBeenCalled();
  }
);

it.each(['missing RPC', 'refused receipt', 'transport'] as const)(
  'keeps %s failures visible without fallback and permits an explicit retry',
  async reason => {
    if (reason === 'refused receipt')
      mockAccept.mockResolvedValueOnce({
        success: false,
        code: 'CONSENT_NOT_CONFIRMED',
      });
    else mockAccept.mockRejectedValueOnce(new Error(reason));
    const accepted = jest.fn();
    render(
      <MentaConsent
        visible
        source="settings"
        onAccepted={accepted}
        onClose={jest.fn()}
      />
    );
    allow();
    await screen.findByRole('alert');
    expect(accepted).not.toHaveBeenCalled();
    expect(mockLegacyConsent).not.toHaveBeenCalled();
    allow();
    await waitFor(() => expect(accepted).toHaveBeenCalledTimes(1));
  }
);

it('does not save consent for an absent account', () => {
  mockOwner = undefined;
  render(
    <MentaConsent
      visible
      source="settings"
      onAccepted={jest.fn()}
      onClose={jest.fn()}
    />
  );
  allow();
  expect(mockAccept).not.toHaveBeenCalled();
});

it.each([false, true])(
  'permission confirmed=%s offers only the appropriate explicit action',
  confirmed => {
    const review = jest.fn();
    const withdraw = jest.fn();
    render(
      <MentaPermission
        visible
        state={confirmed ? 'allowed' : 'needs-review'}
        onRetry={jest.fn()}
        onReview={review}
        onWithdraw={withdraw}
        onClose={jest.fn()}
      />
    );
    const title = confirmed ? 'Withdraw permission' : 'Review permission';
    expect(
      screen.getByRole('header', {
        name: confirmed ? 'Permission allowed' : 'Permission needs review',
      })
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: title }));
    expect(confirmed ? withdraw : review).toHaveBeenCalledTimes(1);
    expect(confirmed ? review : withdraw).not.toHaveBeenCalled();
    expect(mockAccept).not.toHaveBeenCalled();
    expect(mockLegacyConsent).not.toHaveBeenCalled();
  }
);

it.each(['loading', 'error'] as const)(
  'never shows permission actions while server state is %s',
  state => {
    const retry = jest.fn();
    render(
      <MentaPermission
        visible
        state={state}
        onRetry={retry}
        onClose={jest.fn()}
        onReview={jest.fn()}
        onWithdraw={jest.fn()}
      />
    );
    expect(screen.queryByText('Permission allowed')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Review permission' })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Withdraw permission' })
    ).toBeNull();
    if (state === 'error') {
      fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
      expect(retry).toHaveBeenCalledTimes(1);
    }
  }
);
