import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { MomentaSectionNav } from '@/components/momenta/MomentaSectionNav';
import { ThemeProvider } from '@/constants/ThemeContext';

const mockRouter = {
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

describe('MomentaSectionNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps Wallet, Shop and Items as peer destinations', () => {
    render(
      <ThemeProvider>
        <MomentaSectionNav active="shop" />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('momenta-section-nav-shop').props.accessibilityState
    ).toEqual({ selected: true });
    expect(
      screen.getByTestId('momenta-section-nav-wallet').props.accessibilityState
    ).toEqual({ selected: false });
    expect(
      screen.getByTestId('momenta-section-nav-items').props.accessibilityState
    ).toEqual({ selected: false });

    fireEvent.press(screen.getByTestId('momenta-section-nav-items'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/inventory');
  });

  it('does not replace the active destination', () => {
    render(
      <ThemeProvider>
        <MomentaSectionNav active="wallet" />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByTestId('momenta-section-nav-wallet'));

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
