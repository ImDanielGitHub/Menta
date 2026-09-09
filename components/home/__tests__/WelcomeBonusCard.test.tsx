import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import WelcomeBonusCard from '@/components/home/WelcomeBonusCard';
import { ThemeProvider } from '@/constants/ThemeContext';
import { mentaColors } from '@/constants/MentaDesignSystem';

const renderCard = (
  props?: Partial<React.ComponentProps<typeof WelcomeBonusCard>>
) =>
  render(
    <ThemeProvider>
      <WelcomeBonusCard receipt={null} {...props} />
    </ThemeProvider>
  );

describe('WelcomeBonusCard', () => {
  it('stays hidden until activation provides a confirmed receipt', () => {
    renderCard();

    expect(screen.queryByTestId('welcome-bonus-receipt')).toBeNull();
    expect(screen.queryByText('Add 100 Momenta')).toBeNull();
  });

  it('shows the server-confirmed first-promise receipt without a claim action', () => {
    renderCard({ receipt: { confirmed: true, amount: 100 } });

    expect(screen.getByText('You have 100 Momenta')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta added them when you saved your first promise. Use Momenta in the shop. It has no cash value.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Add 100 Momenta')).toBeNull();
    expect(screen.queryByText('Claim later')).toBeNull();
    expect(screen.queryByText('Close')).toBeNull();
  });

  it('rejects an incomplete or invalid receipt', () => {
    const { rerender } = renderCard({
      receipt: { confirmed: true, amount: 0 },
    });

    expect(screen.queryByTestId('welcome-bonus-receipt')).toBeNull();

    rerender(
      <ThemeProvider>
        <WelcomeBonusCard receipt={{ confirmed: true, amount: Number.NaN }} />
      </ThemeProvider>
    );

    expect(screen.queryByTestId('welcome-bonus-receipt')).toBeNull();
  });

  it('offers only the caller-owned continuation after confirmation', () => {
    const onContinue = jest.fn();
    renderCard({
      receipt: { confirmed: true, amount: 100 },
      onContinue,
    });

    fireEvent.press(screen.getByText('Close'));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('keeps the paper surface when presented inside a sheet', () => {
    renderCard({
      receipt: { confirmed: true, amount: 100 },
      presentation: 'modal',
    });

    const card = screen.getByTestId('welcome-bonus-receipt');
    const flattened = Object.assign(
      {},
      ...[card.props.style].flat(Infinity).filter(Boolean)
    );

    expect(flattened.backgroundColor).toBe(mentaColors.paper);
  });
});
