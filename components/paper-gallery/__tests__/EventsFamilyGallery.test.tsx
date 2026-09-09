import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { EventsFamilyGallery } from '@/components/paper-gallery/EventsFamilyGallery';
import { eventPaperStateContracts } from '@/lib/paper-state-registry/events';

describe('EventsFamilyGallery', () => {
  it('renders all non-system Events Paper states deterministically', () => {
    const { getByTestId } = render(<EventsFamilyGallery />);
    const productStates = eventPaperStateContracts.filter(
      state => !state.paperId.startsWith('F9')
    );

    expect(productStates).toHaveLength(18);
    productStates.forEach(state => {
      expect(getByTestId(`events-paper-${state.paperId}`)).toBeTruthy();
    });
  });

  it('reports the local organiser draft action without presenting publish', () => {
    const onAction = jest.fn();
    const unavailable = eventPaperStateContracts.find(
      state => state.paperId === '923-0'
    );
    if (!unavailable) throw new Error('Missing create-event contract');

    const { getByText } = render(
      <EventsFamilyGallery onAction={onAction} states={[unavailable]} />
    );
    fireEvent.press(getByText('Create event draft'));

    expect(onAction).toHaveBeenCalledWith({
      id: 'create_event_draft',
      paperId: '923-0',
    });
  });

  it('reports the visible state action instead of a generic return action', () => {
    const onAction = jest.fn();
    const reviewQueue = eventPaperStateContracts.find(
      state => state.paperId === '8A0-0'
    );
    if (!reviewQueue) throw new Error('Missing organiser review queue');

    const { getByText } = render(
      <EventsFamilyGallery onAction={onAction} states={[reviewQueue]} />
    );
    fireEvent.press(getByText('Review next post'));

    expect(onAction).toHaveBeenCalledWith({
      id: 'review_next_post',
      paperId: '8A0-0',
    });
  });

  it('keeps the rejected receipt and replacement action distinct', () => {
    const onAction = jest.fn();
    const correction = eventPaperStateContracts.find(
      state => state.paperId === '925-0'
    );
    if (!correction) throw new Error('Missing evidence correction state');

    const { getByText } = render(
      <EventsFamilyGallery onAction={onAction} states={[correction]} />
    );
    expect(getByText('Your attendance is confirmed.')).toBeTruthy();
    fireEvent.press(getByText('Replace event photo'));

    expect(onAction).toHaveBeenCalledWith({
      id: 'replace_event_photo',
      paperId: '925-0',
    });
  });

  it.each([
    ['89Z-0', 'Open attendee album', 'open_attendee_album'],
    ['924-0', 'Open event recap', 'open_event_recap'],
  ] as const)(
    'makes the implemented %s late-family state actionable',
    (paperId, label, id) => {
      const onAction = jest.fn();
      const state = eventPaperStateContracts.find(
        contract => contract.paperId === paperId
      );
      if (!state) throw new Error(`Missing ${paperId} contract`);

      const { getByText, queryByText } = render(
        <EventsFamilyGallery onAction={onAction} states={[state]} />
      );
      expect(queryByText('Unavailable in this build')).toBeNull();
      fireEvent.press(getByText(label));

      expect(onAction).toHaveBeenCalledWith({ id, paperId });
    }
  );
});
