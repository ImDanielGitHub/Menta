import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { EventAlbumMosaic } from '@/components/events/EventAlbumMosaic';
import type { EventAlbumItem } from '@/types/event';

const OCCURRENCE_ID = '22222222-2222-4222-8222-222222222222';

const item = (index: number): EventAlbumItem => ({
  postId: `0000000${index}-0000-4000-8000-00000000000${index}`,
  occurrenceId: OCCURRENCE_ID,
  caption: null,
  createdAt: '2026-08-05T06:12:00.000Z',
  attendeeUsername: `attendee-${index}`,
  checkedInAt: '2026-08-05T05:59:00.000Z',
  approvedAt: '2026-08-05T06:20:00.000Z',
  mediaPreviewUrl: `https://preview.example.test/event-${index}.jpg`,
  mediaPreviewExpiresInSeconds: 60,
});

describe('EventAlbumMosaic', () => {
  it('preserves the Paper ratio while allowing a narrow lane to contract', () => {
    const { getByTestId } = render(
      <EventAlbumMosaic items={[item(1), item(2), item(3), item(4)]} />
    );

    expect(
      StyleSheet.flatten(getByTestId('event-album-mosaic').props.style)
    ).toMatchObject({ aspectRatio: 342 / 198, width: '100%' });
    expect(
      StyleSheet.flatten(
        getByTestId('event-album-image-00000001-0000-4000-8000-000000000001')
          .props.style
      )
    ).toMatchObject({ flex: 226, height: '100%' });
    expect(
      StyleSheet.flatten(
        getByTestId('event-album-image-00000002-0000-4000-8000-000000000002')
          .props.style
      )
    ).toMatchObject({ flex: 1, width: '100%' });
  });

  it('makes the remaining-photo count an explicit accessibility element', () => {
    const { getByTestId } = render(
      <EventAlbumMosaic items={[item(1), item(2), item(3), item(4)]} />
    );
    const more = getByTestId('event-album-more-count');

    expect(more.props.accessible).toBe(true);
    expect(more.props.accessibilityRole).toBe('text');
    expect(more.props.accessibilityLabel).toBe('1 more approved event photo');
  });
});
