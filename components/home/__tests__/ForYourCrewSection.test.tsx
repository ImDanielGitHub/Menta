import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { ForYourCrewSection } from '@/components/home/ForYourCrewSection';
import type { PendingReview } from '@/store/group-store';

const pendingReview: PendingReview = {
  id: 'review-1',
  challengeId: 'challenge-1',
  challengeTitle: 'Morning walk',
  groupId: 'group-1',
  groupName: 'Morning crew',
  submitterName: 'Sam Morgan',
  submissionDate: '2026-06-01',
  isSolo: false,
  hoursAgo: 2,
};

const renderSection = (
  props?: Partial<React.ComponentProps<typeof ForYourCrewSection>>
) => {
  const handlers = {
    onOpenReviewQueue: jest.fn(),
    onOpenReview: jest.fn(),
    onOpenGroup: jest.fn(),
  };

  return {
    ...handlers,
    ...render(
      <ThemeProvider>
        <ForYourCrewSection
          reviews={[pendingReview]}
          pressureGroups={[{ id: 'group-2', name: 'Evening gym' }]}
          {...handlers}
          {...props}
        />
      </ThemeProvider>
    ),
  };
};

describe('ForYourCrewSection', () => {
  it('keeps review and group pressure actions visible', () => {
    const { onOpenReview, onOpenGroup, onOpenReviewQueue } = renderSection();

    expect(screen.getByText('For your groups')).toBeTruthy();
    expect(screen.getByText('2 waiting')).toBeTruthy();
    expect(screen.getByText("Review Sam's proof")).toBeTruthy();
    expect(
      screen.getByText('Morning crew · Check it against the promise')
    ).toBeTruthy();
    expect(screen.getByText('Evening gym needs a check-in')).toBeTruthy();
    expect(
      screen.getByText('Open the group to see what is still due.')
    ).toBeTruthy();

    fireEvent.press(screen.getByText("Review Sam's proof"));
    fireEvent.press(screen.getByText('Evening gym needs a check-in'));
    fireEvent.press(screen.getByText('2 waiting'));

    expect(onOpenReview).toHaveBeenCalledWith(pendingReview);
    expect(onOpenGroup).toHaveBeenCalledWith('group-2');
    expect(onOpenReviewQueue).toHaveBeenCalledTimes(1);
  });

  it('states exactly when nobody is waiting', () => {
    renderSection({ reviews: [], pressureGroups: [] });

    expect(screen.getByText('0 waiting')).toBeTruthy();
    expect(screen.getByText('No reviews waiting')).toBeTruthy();
    expect(
      screen.getByText('No one is waiting for your review right now.')
    ).toBeTruthy();
  });
});
