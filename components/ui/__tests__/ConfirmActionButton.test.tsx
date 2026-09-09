import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ConfirmActionButton from '@/components/ui/ConfirmActionButton';
import { ThemeProvider } from '@/constants/ThemeContext';
import { emitHaptic } from '@/lib/motion/haptics';

jest.mock('@/lib/motion/haptics', () => ({
  emitHaptic: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/lib/motion/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    reduceMotion: true,
    duration: (value: number) => value,
    distance: (value: number) => value,
  }),
}));

describe('ConfirmActionButton semantic feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the insufficient-Momenta blocked cue without running the action', () => {
    const onConfirm = jest.fn();
    const onInsufficient = jest.fn();

    render(
      <ThemeProvider>
        <ConfirmActionButton
          balance={10}
          cost={50}
          onConfirm={onConfirm}
          onInsufficient={onInsufficient}
          title="Join group"
        />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    fireEvent.press(button);
    fireEvent.press(button);

    expect(emitHaptic).toHaveBeenNthCalledWith(1, { type: 'confirm' });
    expect(emitHaptic).toHaveBeenNthCalledWith(2, {
      type: 'blocked',
      reason: 'insufficient-momenta',
    });
    expect(onInsufficient).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
