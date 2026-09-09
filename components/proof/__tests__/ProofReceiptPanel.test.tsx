import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProofReceiptPanel } from '@/components/proof/ProofReceiptPanel';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('@/components/ui/SkeletonLoader', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SkeletonLoader: () => React.createElement(View),
  };
});

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>
  );

jest.mock('@/components/ui/SignedImage', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SignedImage: ({ alt }: { alt?: string }) =>
      React.createElement(View, { accessibilityLabel: alt }),
  };
});

describe('ProofReceiptPanel detail', () => {
  it('uses one receipt hierarchy and exposes transfer progress directly', () => {
    const { getAllByText, getByLabelText, queryByText } = renderWithProviders(
      <ProofReceiptPanel status="uploading" showSpinner />
    );

    expect(getAllByText('Sending proof')).toHaveLength(1);
    expect(queryByText('SENDING SECURELY')).toBeNull();
    expect(getByLabelText('Sending proof')).toBeTruthy();
  });

  it('opens the private full view without changing receipt state', () => {
    const onReportIssue = jest.fn();
    const { getAllByText, getByText, getByTestId } = renderWithProviders(
      <ProofReceiptPanel
        status="accepted"
        preview={{
          proofType: 'photo',
          remoteMediaUri: 'proof/walk.jpg',
          updatedAt: '2026-08-06T07:52:00.000Z',
        }}
        onReportIssue={onReportIssue}
      />
    );

    expect(getAllByText('Proof approved')).toHaveLength(1);

    fireEvent.press(getByText('Report an issue'));
    expect(onReportIssue).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Open full view'));
    expect(getByTestId('proof-full-view')).toBeTruthy();
    expect(getByText('Private proof')).toBeTruthy();
    expect(getByText('Close')).toBeTruthy();
  });
});
