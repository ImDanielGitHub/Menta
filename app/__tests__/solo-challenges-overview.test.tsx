import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { SoloChallengeCard } from '@/app/solo-challenges';
import { ThemeProvider } from '@/constants/ThemeContext';

const renderWithTheme = (node: React.ReactElement) =>
  render(<ThemeProvider>{node}</ThemeProvider>);

describe('personal promises overview', () => {
  it('keeps one promise, its due state, and one primary action together', () => {
    const onPrimary = jest.fn();
    const onDetails = jest.fn();
    const screen = renderWithTheme(
      <SoloChallengeCard
        challenge={{
          id: 'promise-1',
          title: 'Read my Bible',
          duration: 30,
          verificationType: 'photo',
          currentStreak: 0,
          freezesRemaining: 0,
          lifecycle: 'active',
        }}
        todayStatus="none"
        submissions={[]}
        onPrimary={onPrimary}
        onDetails={onDetails}
        onViewSubmissions={jest.fn()}
      />
    );

    expect(
      screen.getByText('30-day promise · Photo proof · Private')
    ).toBeTruthy();
    expect(screen.getByText('Due today')).toBeTruthy();
    expect(screen.getByText('No streak yet · 0 freezes left')).toBeTruthy();
    expect(screen.getByTestId('promise-proof-week')).toBeTruthy();
    expect(screen.getByTestId('personal-promise-card-promise-1')).toHaveStyle({
      gap: 20,
      padding: 20,
    });
    expect(screen.queryByText(/No proof yet/)).toBeNull();
    expect(screen.queryByText('Details')).toBeNull();

    fireEvent.press(screen.getByLabelText('Open Read my Bible'));
    fireEvent.press(screen.getByText('Check in today'));
    expect(onDetails).toHaveBeenCalledTimes(1);
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('keeps a past promise factual and removes the check-in action', () => {
    const onPrimary = jest.fn();
    const screen = renderWithTheme(
      <SoloChallengeCard
        challenge={{
          id: 'promise-past',
          title: 'Walk after lunch',
          duration: 14,
          verificationType: 'text',
          currentStreak: 12,
          freezesRemaining: 1,
          status: 'completed',
          lifecycle: 'past',
        }}
        todayStatus="approved"
        submissions={[]}
        onPrimary={onPrimary}
        onDetails={jest.fn()}
        onViewSubmissions={jest.fn()}
      />
    );

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('View promise')).toBeTruthy();
    expect(screen.queryByText('Check in today')).toBeNull();
    fireEvent.press(screen.getByText('View promise'));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('uses a compact selected row for the iPad list pane', () => {
    const screen = renderWithTheme(
      <SoloChallengeCard
        challenge={{
          id: 'promise-selected',
          title: 'Read one chapter and write a short note about the main idea',
          duration: 30,
          verificationType: 'text',
          currentStreak: 4,
          freezesRemaining: 2,
          lifecycle: 'active',
        }}
        compact
        selected
        todayStatus="pending"
        submissions={[]}
        onPrimary={jest.fn()}
        onDetails={jest.fn()}
        onViewSubmissions={jest.fn()}
      />
    );

    expect(screen.getByText('Waiting for review')).toBeTruthy();
    expect(screen.getByTestId('promise-proof-week')).toBeTruthy();
    expect(screen.queryByText('View today’s proof')).toBeNull();
  });
});
