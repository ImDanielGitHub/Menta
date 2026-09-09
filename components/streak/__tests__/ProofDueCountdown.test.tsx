import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ProofDueCountdown } from '../ProofDueCountdown';
import { AppTextScaleProvider } from '@/components/ui/AppScaledText';

jest.mock('@/lib/time/proof-due', () => {
  const actual = jest.requireActual('@/lib/time/proof-due');
  return {
    ...actual,
    resolveProofDueCountdown: jest.fn(() => ({
      phase: 'due',
      hours: 2,
      minutes: 14,
      proofDueLabel: '8:00 PM',
      remainingLabel: '2 h 14 m',
      helperLabel: 'Aim to send by 8:00 PM. Proof counts until midnight.',
      isVisible: true,
    })),
  };
});

describe('ProofDueCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows hours and minutes to the reminder without inventing a deadline', () => {
    render(
      <AppTextScaleProvider scale={1.3}>
        <ProofDueCountdown
          visible
          localDay="2026-08-14"
          timeZone="Pacific/Auckland"
          preferredReminderTime="20:00:00"
          promiseLabel="Walk before dusk"
        />
      </AppTextScaleProvider>
    );

    expect(screen.getByTestId('proof-due-countdown')).toBeTruthy();
    expect(screen.getByText('Reminder in')).toBeTruthy();
    expect(screen.getByText('2 h 14 m')).toBeTruthy();
    expect(screen.getByText('2 h 14 m')).toHaveStyle({
      fontSize: 31.2,
      lineHeight: 40.3,
    });
    expect(
      screen.getByText(
        /Walk before dusk · aim to send by 8:00 PM.*counts until midnight/i
      )
    ).toBeTruthy();
    expect(screen.queryByText(/\d+s/)).toBeNull();
  });

  it('renders the same reminder as an unboxed Today hero fact', () => {
    render(
      <ProofDueCountdown
        visible
        localDay="2026-08-14"
        timeZone="Pacific/Auckland"
        preferredReminderTime="20:00:00"
        promiseLabel="Walk before dusk"
        variant="hero"
      />
    );

    expect(screen.getByText('2 h 14 m to reminder')).toBeTruthy();
    expect(screen.getByText('2 h 14 m to reminder')).toHaveStyle({
      fontSize: 40,
      lineHeight: 46,
    });
    expect(screen.queryByText('Reminder in')).toBeNull();
    expect(screen.queryByText(/Walk before dusk/)).toBeNull();
  });
});
