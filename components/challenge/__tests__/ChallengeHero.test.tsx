import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ChallengeHero } from '@/components/challenge/detail/ChallengeHero';

jest.mock('@/components/ui/icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = () => <View />;

  return {
    ArrowLeftIcon: Icon,
    MoreVerticalIcon: Icon,
    Share2Icon: Icon,
  };
});

describe('ChallengeHero promise actions', () => {
  it('names the user-facing actions after the promise, not the route', () => {
    const onShare = jest.fn();
    const onMore = jest.fn();
    const { getByLabelText, queryByLabelText } = render(
      <ChallengeHero
        title="Walk after work"
        description="Walk for 20 minutes."
        onBack={jest.fn()}
        onShare={onShare}
        onMore={onMore}
      />
    );

    fireEvent.press(getByLabelText('Share invite'));
    fireEvent.press(getByLabelText('Promise actions'));

    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onMore).toHaveBeenCalledTimes(1);
    expect(queryByLabelText('Share promise')).toBeNull();
    expect(queryByLabelText('Share challenge')).toBeNull();
    expect(queryByLabelText('Challenge actions')).toBeNull();
  });

  it('shows the promise and its own wording without a schedule table', () => {
    const { getByText, queryByText } = render(
      <ChallengeHero
        title="Read Bible"
        description="Every day I want to post a photo of me reading my Bible."
        onBack={jest.fn()}
        onMore={jest.fn()}
      />
    );

    expect(getByText('YOUR PROMISE')).toBeTruthy();
    expect(getByText('Read Bible')).toBeTruthy();
    expect(getByText('DAILY MINIMUM')).toBeTruthy();
    expect(
      getByText('Every day I want to post a photo of me reading my Bible.')
    ).toBeTruthy();

    // Schedule, review and people facts belong below the proof action so they
    // cannot push the immediate task off the first viewport.
    for (const label of ['Window', 'Proof', 'Review', 'People']) {
      expect(queryByText(label)).toBeNull();
    }
  });
});
