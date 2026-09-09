import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import {
  ProofConnectionMosaic,
  type ProofConnectionMosaicItem,
} from '@/components/proof/ProofConnectionMosaic';

jest.mock('@/components/ui/SignedImage', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');

  return {
    SignedImage: ({ alt }: { alt?: string }) => (
      <View accessibilityLabel={alt ? `image: ${alt}` : 'proof image'} />
    ),
  };
});

jest.mock('@/components/ui/SkeletonLoader', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');

  return {
    SkeletonLoader: ({ style }: { style?: object }) => <View style={style} />,
  };
});

jest.mock('@/components/ui/icons', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  const Icon = (props: object) => <View {...props} />;

  return {
    AlertCircleIcon: Icon,
    CameraIcon: Icon,
    CheckIcon: Icon,
    HeartIcon: Icon,
    ImageIcon: Icon,
    PlayIcon: Icon,
    PlusIcon: Icon,
    VideoIcon: Icon,
  };
});

const photoProof: ProofConnectionMosaicItem = {
  id: 'photo-proof',
  mediaType: 'photo',
  mediaUrl: 'proofs/walk-after-work.jpg',
  contributorName: 'Daniel',
  submittedLabel: 'Today',
  state: 'approved',
  reactionCount: 3,
  encouragedByCurrentUser: true,
};

const videoProof: ProofConnectionMosaicItem = {
  id: 'video-proof',
  mediaType: 'video',
  mediaUrl: 'proofs/read-before-bed.mp4',
  thumbnailUrl: 'proofs/read-before-bed-thumb.jpg',
  contributorName: 'Alex',
  submittedLabel: 'Yesterday',
  state: 'approved',
  durationLabel: '0:12',
};

describe('ProofConnectionMosaic', () => {
  it('keeps photo and video proof visual and opens the exact selected item', () => {
    const onOpenProof = jest.fn();
    const onToggleEncouragement = jest.fn();
    const { getByTestId, getByText, getByLabelText } = render(
      <ProofConnectionMosaic
        items={[photoProof, videoProof]}
        onOpenProof={onOpenProof}
        onToggleEncouragement={onToggleEncouragement}
        title="Walk after work"
        visibilityLabel="Only you and Alex"
      />
    );

    expect(getByText('2 proofs · Only you and Alex')).toBeTruthy();
    expect(getByText('0:12')).toBeTruthy();
    expect(
      getByLabelText('image: Photo proof, from Daniel, Today, Approved')
    ).toBeTruthy();
    expect(
      getByLabelText('image: Video proof, from Alex, Yesterday, Approved')
    ).toBeTruthy();

    fireEvent.press(
      getByTestId('proof-connection-mosaic-item-photo-proof-open')
    );
    fireEvent.press(
      getByTestId('proof-connection-mosaic-item-video-proof-open')
    );

    expect(onOpenProof).toHaveBeenNthCalledWith(1, photoProof, 0);
    expect(onOpenProof).toHaveBeenNthCalledWith(2, videoProof, 1);

    fireEvent.press(
      getByTestId('proof-connection-mosaic-item-video-proof-encourage')
    );
    expect(onToggleEncouragement).toHaveBeenCalledWith(videoProof, true);
  });

  it('uses one direct empty action and a destination-shaped loading state', () => {
    const onAddProof = jest.fn();
    const screen = render(
      <ProofConnectionMosaic
        items={[]}
        onAddProof={onAddProof}
        onOpenProof={jest.fn()}
      />
    );

    expect(screen.getByText('No shared proof yet')).toBeTruthy();
    fireEvent.press(screen.getByTestId('proof-connection-mosaic-empty-add'));
    expect(onAddProof).toHaveBeenCalledTimes(1);

    screen.rerender(
      <ProofConnectionMosaic
        items={[]}
        loading
        onAddProof={onAddProof}
        onOpenProof={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Loading shared proof')).toBeTruthy();
    expect(screen.getByTestId('proof-connection-mosaic-loading')).toBeTruthy();
    expect(screen.queryByText('No shared proof yet')).toBeNull();
  });

  it('preserves the last proof mosaic when refresh fails and offers inline recovery', () => {
    const onRetry = jest.fn();
    const onOpenProof = jest.fn();
    const { getByTestId, getByText } = render(
      <ProofConnectionMosaic
        errorMessage="The latest proof could not be checked."
        items={[photoProof]}
        onOpenProof={onOpenProof}
        onRetry={onRetry}
      />
    );

    expect(getByText('The latest proof could not be checked.')).toBeTruthy();
    expect(
      getByTestId('proof-connection-mosaic-item-photo-proof-open')
    ).toBeTruthy();

    fireEvent.press(getByTestId('proof-connection-mosaic-retry'));
    fireEvent.press(
      getByTestId('proof-connection-mosaic-item-photo-proof-open')
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onOpenProof).toHaveBeenCalledWith(photoProof, 0);
  });

  it('keeps the contact sheet usable at 320 points and exposes overflow', () => {
    const onViewAll = jest.fn();
    const items = Array.from({ length: 7 }, (_, index) => ({
      ...photoProof,
      id: `proof-${index + 1}`,
      contributorName: index % 2 === 0 ? 'Daniel' : 'Alex',
    }));

    const { getByLabelText, getByTestId } = render(
      <ProofConnectionMosaic
        contentWidth={272}
        items={items}
        onOpenProof={jest.fn()}
        onViewAll={onViewAll}
      />
    );

    expect(
      StyleSheet.flatten(
        getByTestId('proof-connection-mosaic-top-row').props.style
      ).height
    ).toBe(260);
    expect(
      StyleSheet.flatten(
        getByTestId('proof-connection-mosaic-bottom-row').props.style
      ).height
    ).toBe(140);
    expect(getByLabelText('2 more proofs')).toBeTruthy();
    fireEvent.press(getByTestId('proof-connection-mosaic-item-proof-5-open'));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('keeps encouragement controls at the minimum touch size', () => {
    const { getByTestId } = render(
      <ProofConnectionMosaic
        items={[videoProof]}
        onOpenProof={jest.fn()}
        onToggleEncouragement={jest.fn()}
      />
    );

    const reactionStyle = StyleSheet.flatten(
      getByTestId('proof-connection-mosaic-item-video-proof-encourage').props
        .style
    );
    expect(reactionStyle.minHeight).toBe(44);
    expect(reactionStyle.minWidth).toBe(44);
  });

  it('expands real media on an explicitly supplied iPad lane', () => {
    const { getByTestId } = render(
      <ProofConnectionMosaic
        contentWidth={560}
        items={[photoProof, videoProof]}
        onOpenProof={jest.fn()}
      />
    );

    expect(
      StyleSheet.flatten(
        getByTestId('proof-connection-mosaic-top-row').props.style
      ).height
    ).toBe(457);
  });
});
