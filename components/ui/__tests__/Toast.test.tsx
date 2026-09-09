import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { Toast } from '@/components/ui/Toast';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, right: 0, bottom: 34, left: 0 }),
}));

jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureMessage: jest.fn(),
}));

describe('Toast', () => {
  it('announces the real message and exposes the recovery action', async () => {
    const onAction = jest.fn();
    const onDismiss = jest.fn();
    const screen = render(
      <Toast
        id="toast-1"
        type="error"
        title="Proof was not sent"
        message="Your saved proof is still on this phone."
        duration={60_000}
        action={{ label: 'Open saved proof', onPress: onAction }}
        onDismiss={onDismiss}
      />
    );

    expect(
      screen.getByRole('alert', {
        name: 'Proof was not sent. Your saved proof is still on this phone.',
      })
    ).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Open saved proof' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onDismiss).toHaveBeenCalledWith('toast-1'));
  });

  it('uses a quiet dismiss row when no recovery action is needed', async () => {
    const onDismiss = jest.fn();
    const screen = render(
      <Toast
        id="toast-2"
        type="info"
        title="Clipboard empty"
        message="Copy an invite code, then come back and paste it here."
        duration={60_000}
        onDismiss={onDismiss}
      />
    );

    fireEvent.press(
      screen.getByRole('button', { name: 'Dismiss notification' })
    );
    await waitFor(() => expect(onDismiss).toHaveBeenCalledWith('toast-2'));
  });
});
