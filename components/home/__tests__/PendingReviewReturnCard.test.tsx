import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { PendingReviewReturnCard } from '@/components/home/PendingReviewReturnCard';
import type { TodaysSubmission } from '@/store/group-store';

const submission: TodaysSubmission = {
  id: 'submission-1',
  groupId: 'group-1',
  challengeId: 'challenge-1',
  groupName: 'Morning crew',
  challengeTitle: 'Morning walk',
  dayNumber: 4,
  totalDays: 14,
  memberCount: 5,
  submissionType: 'photo',
  isUrgent: false,
  timeRemaining: '8h',
  hasSubmittedToday: true,
  submissionStatus: 'pending',
  isSolo: false,
};

const renderCard = (
  props?: Partial<React.ComponentProps<typeof PendingReviewReturnCard>>
) => {
  const onPress = jest.fn();

  return {
    onPress,
    ...render(
      <ThemeProvider>
        <PendingReviewReturnCard
          submission={submission}
          pendingCount={1}
          onPress={onPress}
          {...props}
        />
      </ThemeProvider>
    ),
  };
};

describe('PendingReviewReturnCard', () => {
  it('keeps pending proof status and review action visible', () => {
    const { onPress } = renderCard();

    expect(screen.getByTestId('pending-review-return-card')).toBeTruthy();
    expect(screen.getByText('Proof sent for review')).toBeTruthy();
    expect(
      screen.getByText(
        'A reviewer can now check it against the promise. The proof for Morning walk counts after approval.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Waiting for review')).toBeTruthy();
    expect(screen.getByText('Does not count yet')).toBeTruthy();

    fireEvent.press(screen.getByText('Review another proof'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows extra pending proof count without changing the route action', () => {
    renderCard({ pendingCount: 3 });

    expect(
      screen.getByText('Review another proof · 2 more waiting')
    ).toBeTruthy();
  });
});
