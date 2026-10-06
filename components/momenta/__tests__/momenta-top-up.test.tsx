import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MomentaTopUp } from '@/components/momenta/momenta-top-up';
import { ThemeProvider } from '@/constants/ThemeContext';

const now = Date.parse('2026-09-27T09:00:00Z');

const renderTopUp = (
  props: Partial<React.ComponentProps<typeof MomentaTopUp>> = {}
) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 430, height: 932 },
        insets: { top: 59, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ThemeProvider>
        <MomentaTopUp
          subject="promise"
          shortfall={10}
          balance={20}
          required={30}
          adReward={10}
          onWatchAd={jest.fn()}
          adLoading={false}
          adRest={null}
          credited={0}
          onGoPro={jest.fn()}
          onCheckProof={jest.fn()}
          onClose={jest.fn()}
          {...props}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('MomentaTopUp ad rest (Paper M03)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('leads with the ad when one can pay out', () => {
    renderTopUp();
    expect(screen.getByTestId('momenta-top-up-option-ad')).toBeChecked();
    expect(screen.getByText('Watch and get 10')).toBeTruthy();
  });

  it('keeps the resting ad visible with a live countdown and leads with Pro', () => {
    renderTopUp({ adRest: 'cooldown', adReadyAt: now + 102_000 });

    const ad = screen.getByTestId('momenta-top-up-option-ad');
    expect(ad).toBeDisabled();
    expect(screen.getByText('Next one ready in 1:42')).toBeTruthy();
    expect(screen.getByTestId('momenta-top-up-option-pro')).toBeChecked();
    expect(screen.queryByText('Watch and get 10')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(2_000);
    });
    expect(screen.getByText('Next one ready in 1:40')).toBeTruthy();
  });

  it('keeps a just-watched ad selected and counts down to the next one', () => {
    renderTopUp({
      shortfall: 30,
      balance: 0,
      credited: 10,
      adRest: 'cooldown',
      adReadyAt: now + 118_000,
    });

    expect(screen.getByTestId('momenta-top-up-option-ad')).toBeChecked();
    expect(screen.getByText('Watch another in 1:58')).toBeTruthy();
    expect(screen.getByTestId('momenta-top-up-primary')).toBeDisabled();
  });

  it('explains the daily limit without a countdown', () => {
    renderTopUp({ adRest: 'daily_limit', adReadyAt: now + 60 * 60 * 1000 });
    expect(
      screen.getByText('That’s all for today. More tomorrow.')
    ).toBeTruthy();
    expect(screen.getByTestId('momenta-top-up-option-pro')).toBeChecked();
  });
});

it('offers a reachable wallet top-up without claiming a purchase completed', () => {
  const onOpenWallet = jest.fn();
  renderTopUp({ onOpenWallet });
  fireEvent.press(screen.getByTestId('momenta-top-up-wallet'));
  expect(onOpenWallet).toHaveBeenCalledTimes(1);
});
