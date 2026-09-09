import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { TodayFamilyGallery } from '@/components/paper-gallery/TodayFamilyGallery';
import { TODAY_FAMILY_PAPER_STATES } from '@/lib/paper-state-registry/today';

jest.mock('@/components/ui/MentaMascot', () => ({
  MentaMascot: () => null,
}));

describe('TodayFamilyGallery', () => {
  it('renders every Paper state with its exact Paper node id', () => {
    const { getByTestId } = render(<TodayFamilyGallery />);

    TODAY_FAMILY_PAPER_STATES.forEach(state => {
      expect(getByTestId(`today-paper-${state.id}`)).toBeTruthy();
    });
  });

  it('returns the selected state and explicit action to a later dev-only navigator', () => {
    const onAction = jest.fn();
    const state = TODAY_FAMILY_PAPER_STATES.find(
      item => item.id === 'STREAK-02'
    );
    if (!state) throw new Error('Missing STREAK-02 fixture');

    const { getByLabelText } = render(
      <TodayFamilyGallery onAction={onAction} states={[state]} />
    );

    fireEvent.press(getByLabelText(state.primaryAction.label));

    expect(onAction).toHaveBeenCalledWith(state.primaryAction, state);
  });
});
