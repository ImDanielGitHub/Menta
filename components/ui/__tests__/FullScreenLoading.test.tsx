import React from 'react';
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
    expect(getByTestId('loading-wordmark')).toBeTruthy();
    expect(getByTestId('loading-progress-track')).toBeTruthy();
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
    expect(container.props.style).toEqual(
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
      maxWidth: 264,
      width: '100%',
    });
    expect(getByTestId('loading-mark')).toHaveStyle({
      height: '100%',
      width: '100%',
    });
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <TestWrapper>
        <FullScreenLoading />
      </TestWrapper>
    );
    const locationIndependentTree = toJSON();
    const normaliseAssetUris = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(normaliseAssetUris);
        return;
      }
      if (!value || typeof value !== 'object') return;

      const record = value as Record<string, unknown>;
      if (typeof record.testUri === 'string') {
        record.testUri = record.testUri.split('/').at(-1);
      }
      Object.values(record).forEach(normaliseAssetUris);
    };
    normaliseAssetUris(locationIndependentTree);

    expect(locationIndependentTree).toMatchSnapshot();
  });
});
