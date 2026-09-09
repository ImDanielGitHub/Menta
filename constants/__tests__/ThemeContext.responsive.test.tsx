import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { ThemeProvider, useTheme } from '@/constants/ThemeContext';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;

function DimensionsProbe() {
  const { dimensions } = useTheme();
  return (
    <Text testID="theme-dimensions">
      {dimensions.width}x{dimensions.height}
    </Text>
  );
}

describe('ThemeProvider responsive dimensions', () => {
  it('updates the theme when the live viewport changes', () => {
    mockedUseWindowDimensions.mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 1,
    });

    const view = render(
      <ThemeProvider>
        <DimensionsProbe />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-dimensions')).toHaveTextContent('390x844');

    mockedUseWindowDimensions.mockReturnValue({
      width: 430,
      height: 932,
      scale: 3,
      fontScale: 1.1,
    });
    view.rerender(
      <ThemeProvider>
        <DimensionsProbe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-dimensions')).toHaveTextContent('430x932');
  });
});
