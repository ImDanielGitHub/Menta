import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { FullScreenLoading } from '../FullScreenLoading';
import { ThemeProvider } from '@/constants/ThemeContext';

// Wrapper component to provide theme context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('FullScreenLoading', () => {
  it('renders the Menta launch handoff', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <FullScreenLoading />
      </TestWrapper>
    );

    expect(getByTestId('loading-mark')).toBeTruthy();
    expect(getByTestId('loading-status')).toBeTruthy();
    expect(getByTestId('loading-tip')).toBeTruthy();
  });

  it('shows an optional loading message', () => {
    const { getByText } = render(
      <TestWrapper>
        <FullScreenLoading message="Initializing Menta..." />
      </TestWrapper>
    );

    expect(getByText('Initializing Menta...')).toBeTruthy();
  });

  it('announces the launch handoff as one progress region', () => {
    const { getAllByRole } = render(
      <TestWrapper>
        <FullScreenLoading message="Loading your account" />
      </TestWrapper>
    );

    expect(getAllByRole('progressbar')).toHaveLength(1);
  });

  it('has full screen container style', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <FullScreenLoading />
      </TestWrapper>
    );

    const container = getByTestId('loading-container');
    expect(StyleSheet.flatten(container.props.style)).toEqual(
      expect.objectContaining({
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      })
    );
  });

  it('lets the launch mark shrink inside a compact phone', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <FullScreenLoading />
      </TestWrapper>
    );

    expect(getByTestId('loading-mark-shell')).toHaveStyle({
      aspectRatio: 1,
      maxWidth: 280,
      width: '100%',
    });
    expect(getByTestId('loading-mark')).toHaveStyle({
      height: '100%',
      width: '100%',
    });
  });
});
