import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AtRiskBanner } from '../AtRiskBanner';
import { FreezeInventoryCard } from '../FreezeInventoryCard';

jest.mock('@/components/ui/MentaMascot', () => ({
  MentaMascot: () => null,
}));

describe('streak freeze user states', () => {
  it('keeps unresolved proof factual while making proof the main action', () => {
    const onSubmitProof = jest.fn();
    const onOpenFreezes = jest.fn();

    render(
      <AtRiskBanner
        visible
        freezeCount={2}
        currentStreak={6}
        onSubmitProof={onSubmitProof}
        onOpenFreezes={onOpenFreezes}
      />
    );

    expect(screen.getByText('Proof is still due today')).toBeTruthy();
    expect(screen.getByText(/Your 6-day streak is still active/)).toBeTruthy();
    expect(screen.getByText(/You have 2 freezes available/)).toBeTruthy();
    expect(screen.queryByText(/automatically/)).toBeNull();
    expect(screen.queryByText(/activate/i)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Add proof' }));
    expect(onSubmitProof).toHaveBeenCalledTimes(1);
  });

  it('lets the person pause coach reminders for four hours', async () => {
    const onRemindLater = jest.fn().mockResolvedValue(undefined);

    render(
      <AtRiskBanner
        visible
        freezeCount={0}
        onSubmitProof={jest.fn()}
        onOpenFreezes={jest.fn()}
        onRemindLater={onRemindLater}
      />
    );

    fireEvent.press(
      screen.getByRole('button', { name: 'Remind me in 4 hours' })
    );
    expect(onRemindLater).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('coach-snooze-receipt')).toBeTruthy();
    expect(screen.getByText('Reminders paused for 4 hours.')).toBeTruthy();
  });

  it('exposes the freeze count and automatic-use rule to assistive technology', () => {
    const onPress = jest.fn();

    render(<FreezeInventoryCard freezeCount={1} onPress={onPress} />);

    const row = screen.getByRole('button', {
      name: /Streak freezes\. 1 available\. Menta uses one automatically/i,
    });
    expect(screen.getByText('Open items')).toBeTruthy();

    fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
