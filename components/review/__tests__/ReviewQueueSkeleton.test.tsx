import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { resolvePhoneLayout } from '@/constants/phone-layout';
import { usePhoneLayout } from '@/constants/use-phone-layout';

import { ReviewQueueSkeleton } from '../StreamlinedReviewQueue';

jest.mock('@/components/ui/AppShell', () => ({
  AppTopBar: ({
    title,
    onBack,
    trailing,
  }: {
    title?: string;
    onBack?: () => void;
    trailing?: React.ReactNode;
  }) => {
    const { Pressable, Text, View } =
      require('react-native') as typeof import('react-native');
    return (
      <View>
        {onBack ? (
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            onPress={onBack}
          >
            <Text>Back</Text>
          </Pressable>
        ) : null}
        <Text>{title}</Text>
        {trailing}
      </View>
    );
  },
}));

jest.mock('@/components/ui/SkeletonLoader', () => ({
  SkeletonLoader: ({
    testID = 'review-skeleton-bone',
    width,
  }: {
    testID?: string;
    width?: number | string;
  }) => {
    const { View } = require('react-native') as typeof import('react-native');
    return <View style={{ width }} testID={testID} />;
  },
}));

jest.mock('@/constants/use-phone-layout', () => ({
  usePhoneLayout: jest.fn(() =>
    jest.requireActual('@/constants/phone-layout').resolvePhoneLayout({
      width: 390,
      height: 844,
      fontScale: 1,
    })
  ),
}));

const mockedUsePhoneLayout = usePhoneLayout as jest.MockedFunction<
  typeof usePhoneLayout
>;

describe('ReviewQueueSkeleton', () => {
  beforeEach(() => {
    mockedUsePhoneLayout.mockReturnValue(
      resolvePhoneLayout({ width: 390, height: 844, fontScale: 1 })
    );
  });

  it('keeps the Paper loading geometry behind one accessible progress region', () => {
    const onBack = jest.fn();
    const { getAllByTestId, getByLabelText, getByText, queryByLabelText } =
      render(<ReviewQueueSkeleton onBack={onBack} />);

    expect(getByText('Review proof')).toBeTruthy();
    expect(getByLabelText('Review proof loading')).toBeTruthy();
    expect(getAllByTestId(/review-skeleton-/)).toHaveLength(17);
    expect(queryByLabelText('Approve submission')).toBeNull();

    fireEvent.press(getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('uses relative bar widths on a compact screen', () => {
    const phoneLayout = resolvePhoneLayout({
      width: 320,
      height: 568,
      fontScale: 1,
    });
    mockedUsePhoneLayout.mockReturnValue(phoneLayout);

    const { getAllByTestId } = render(
      <ReviewQueueSkeleton onBack={jest.fn()} />
    );
    const widths = getAllByTestId('review-skeleton-bone')
      .map(node => node.props.style?.width)
      .filter((width): width is string => typeof width === 'string');

    expect(widths).toEqual(expect.arrayContaining(['94%', '54%', '100%']));
  });
});
