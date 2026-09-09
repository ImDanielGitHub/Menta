import React from 'react';
import { render } from '@testing-library/react-native';
import { SoloSubmissionTimeline } from '../SoloSubmissionTimeline';

// Mock theme to avoid needing a provider
jest.mock('@/constants/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: { primary: '#fff' },
      text: { primary: '#000', secondary: '#666', tertiary: '#999' },
      status: { success: '#22c55e', error: '#ef4444' },
      border: { primary: '#e5e7eb' },
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
    typography: {
      h4: { fontSize: 16, fontWeight: '600' },
      body: { fontSize: 14 },
      caption: { fontSize: 12 },
      sizes: { xs: 10, sm: 12, base: 14, lg: 16 },
    },
    borderRadius: { sm: 4, md: 8, lg: 12 },
  }),
}));

describe('SoloSubmissionTimeline', () => {
  it('keeps the current day open and records submitted and missed days', () => {
    // Build dates relative to now
    const today = new Date();
    const toYmd = (d: Date) =>
      new Date(d.toISOString().split('T')[0]).toISOString().split('T')[0];
    const d0 = toYmd(today);
    const d1 = toYmd(
      new Date(new Date(today).setUTCDate(today.getUTCDate() - 1))
    ); // yesterday
    const d2 = toYmd(
      new Date(new Date(today).setUTCDate(today.getUTCDate() - 2))
    ); // two days ago

    const { getAllByText } = render(
      <SoloSubmissionTimeline
        startDate={d2}
        durationDays={3} // d2, d1, d0 active
        userJoinedAt={d2}
        submissionDates={[d2]}
        lookbackDays={3} // shows d0, d1, d2
      />
    );

    // Today stays open as inactive, yesterday is missed, and the join day was submitted.
    expect(getAllByText('On time').length).toBe(1);
    expect(getAllByText('Missed').length).toBe(1);
    expect(getAllByText('Open').length).toBe(1);
  });

  it('does not mark beyond-challenge days as missed (they are inactive)', () => {
    const today = new Date();
    const toYmd = (d: Date) =>
      new Date(d.toISOString().split('T')[0]).toISOString().split('T')[0];
    const d0 = toYmd(today);
    const d1 = toYmd(
      new Date(new Date(today).setUTCDate(today.getUTCDate() - 1))
    ); // yesterday
    const d2 = toYmd(
      new Date(new Date(today).setUTCDate(today.getUTCDate() - 2))
    ); // two days ago

    const { getAllByText, queryByText } = render(
      <SoloSubmissionTimeline
        startDate={d2}
        durationDays={1} // Only d2 is active
        userJoinedAt={d2}
        submissionDates={[d2]}
        lookbackDays={3} // shows d0, d1, d2
      />
    );

    // 1 submitted (On time) for d2; 2 inactive (—) for d1 and d0; no missed
    expect(getAllByText('On time').length).toBe(1);
    expect(getAllByText('—').length).toBe(2);
    expect(queryByText('Missed')).toBeNull();
  });
});
