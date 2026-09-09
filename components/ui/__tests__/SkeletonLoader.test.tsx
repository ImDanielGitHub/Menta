import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { SkeletonLoader, SkeletonText } from '@/components/ui/SkeletonLoader';

jest.mock('@/lib/accessibility', () => ({
  getAccessibleAnimationDuration: (duration: number) => duration,
  useScreenReader: () => ({ isReduceMotionEnabled: true }),
}));

describe('SkeletonLoader', () => {
  it('uses the shared low-contrast shimmer treatment', () => {
    const { getByTestId } = render(
      <SkeletonLoader announce={false} testID="skeleton-bone" />
    );

    fireEvent(getByTestId('skeleton-bone'), 'layout', {
      nativeEvent: { layout: { height: 20, width: 240, x: 0, y: 0 } },
    });

    expect(getByTestId('linear-gradient').props.colors).toEqual([
      'rgba(41, 42, 42, 0)',
      '#292A2A',
      'rgba(41, 42, 42, 0)',
    ]);
  });

  it('announces a group of text bones once', () => {
    const { getAllByRole } = render(<SkeletonText lines={3} />);

    const loadingRegions = getAllByRole('progressbar');
    expect(loadingRegions).toHaveLength(1);
    expect(loadingRegions[0].props.accessibilityLabel).toBe('Loading text');
  });

  it('lets a composed loading region hide child text bones', () => {
    const { queryAllByRole } = render(
      <SkeletonText announce={false} lines={3} />
    );

    expect(queryAllByRole('progressbar')).toHaveLength(0);
  });
});
