import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ReminderStatusRow } from '../ReminderStatusRow';

describe('ReminderStatusRow', () => {
  it('shows the preferred time without claiming an exact delivery time', () => {
    render(
      <ReminderStatusRow remindersEnabled preferredReminderTime="20:00:00" />
    );

    expect(screen.getByText('Proof reminders')).toBeTruthy();
    expect(screen.getByText(/Preferred time:/)).toBeTruthy();
    expect(
      screen.getByText(
        'A proof deadline or quiet hours may change the actual send time.'
      )
    ).toBeTruthy();
    expect(screen.queryByText(/30 min before risk/i)).toBeNull();
  });

  it('states when proof reminders are off', () => {
    render(
      <ReminderStatusRow
        remindersEnabled={false}
        preferredReminderTime={null}
      />
    );

    expect(screen.getByText('Proof reminders are off')).toBeTruthy();
    expect(screen.getByText('Off')).toBeTruthy();
  });
});
