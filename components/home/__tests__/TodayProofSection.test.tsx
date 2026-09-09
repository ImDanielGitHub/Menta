import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { TodayProofSection } from '@/components/home/TodayProofSection';
import type { TodaysSubmission } from '@/store/group-store';

const submissions: TodaysSubmission[] = [
  {
    id: 'submission-1',
    groupId: 'group-1',
    challengeId: 'challenge-1',
    groupName: 'Morning crew',
    challengeTitle: 'Morning walk',
    dayNumber: 2,
    totalDays: 14,
    memberCount: 5,
    submissionType: 'photo',
    isUrgent: true,
    timeRemaining: '1h',
    hasSubmittedToday: false,
    submissionStatus: 'not_submitted',
    isSolo: false,
  },
  {
    id: 'submission-2',
    groupId: 'group-1',
    challengeId: 'challenge-2',
    groupName: 'Morning crew',
    challengeTitle: 'Desk cleanup',
    dayNumber: 3,
    totalDays: 7,
    memberCount: 5,
    submissionType: 'text',
    isUrgent: false,
    timeRemaining: '',
    hasSubmittedToday: true,
    submissionStatus: 'pending',
    isSolo: false,
  },
  {
    id: 'submission-3',
    challengeId: 'challenge-3',
    challengeTitle: 'Read ten pages',
    dayNumber: 5,
    totalDays: 30,
    memberCount: 1,
    submissionType: 'text',
    isUrgent: false,
    timeRemaining: '',
    hasSubmittedToday: true,
    submissionStatus: 'approved',
    isSolo: true,
  },
];

const renderSection = (
  props?: Partial<React.ComponentProps<typeof TodayProofSection>>
) => {
  const handlers = {
    onSubmitProof: jest.fn(),
    onOpenSubmittedProof: jest.fn(),
    onStartSolo: jest.fn(),
  };

  return {
    ...handlers,
    ...render(
      <ThemeProvider>
        <TodayProofSection submissions={submissions} {...handlers} {...props} />
      </ThemeProvider>
    ),
  };
};

describe('TodayProofSection', () => {
  it('keeps due, pending, and completed proof rows visible', () => {
    const { onSubmitProof, onOpenSubmittedProof } = renderSection();

    expect(screen.getByText('Up next')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Morning walk')).toBeTruthy();
    expect(
      screen.getByText('Morning crew · Day 2/14 · Proof due now')
    ).toBeTruthy();
    expect(screen.getByText('Desk cleanup')).toBeTruthy();
    expect(
      screen.getByText('Morning crew · Day 3/7 · Waiting for review')
    ).toBeTruthy();
    expect(screen.getByText('Read ten pages')).toBeTruthy();
    expect(screen.getByText('Solo · Day 5/30 · Proof approved')).toBeTruthy();

    fireEvent.press(screen.getByText('Morning walk'));
    fireEvent.press(screen.getByText('Desk cleanup'));

    expect(onSubmitProof).toHaveBeenCalledWith(submissions[0]);
    expect(onOpenSubmittedProof).toHaveBeenCalledWith(submissions[1]);
  });

  it('keeps the empty up-next state actionable', () => {
    const { onStartSolo } = renderSection({ submissions: [] });

    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('No promises yet')).toBeTruthy();
    expect(
      screen.getByText(
        'Make a promise and your first check-in will appear here.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Make one'));

    expect(onStartSolo).toHaveBeenCalledTimes(1);
  });

  it('uses proof-method-specific action copy for due rows', () => {
    renderSection({
      submissions: [
        {
          id: 'submission-text-due',
          challengeId: 'challenge-text',
          challengeTitle: 'Evening journal',
          dayNumber: 1,
          totalDays: 7,
          memberCount: 1,
          submissionType: 'text',
          isUrgent: false,
          timeRemaining: '',
          hasSubmittedToday: false,
          submissionStatus: 'not_submitted',
          isSolo: true,
        },
      ],
    });

    expect(screen.getByText('Write')).toBeTruthy();
  });
});
