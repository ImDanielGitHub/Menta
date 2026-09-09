import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { AppStoreCandidateCapture } from '@/components/app-store-capture/AppStoreCandidateCapture';
import { ThemeProvider } from '@/constants/ThemeContext';
import {
  APP_STORE_CAPTURE_CANDIDATES,
  APP_STORE_CAPTURE_DEVICE,
} from '@/lib/app-store-capture-registry';

jest.mock('@/components/ui/AppShell', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    AppListRow: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    AppSectionHeader: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

describe('AppStoreCandidateCapture', () => {
  it('keeps six Paper-mapped candidates at the iPhone capture contract', () => {
    expect(APP_STORE_CAPTURE_CANDIDATES).toHaveLength(6);
    expect(
      APP_STORE_CAPTURE_CANDIDATES.map(candidate => candidate.paperId)
    ).toEqual(['FV0-0', 'FWX-0', 'FYF-0', 'G02-0', 'G1T-0', 'G4A-0']);
    expect(APP_STORE_CAPTURE_DEVICE).toEqual({
      width: 390,
      height: 844,
      contentLane: 342,
    });
  });

  it.each(APP_STORE_CAPTURE_CANDIDATES)(
    'renders $id only as an accessibility-labelled deterministic fixture',
    candidate => {
      render(
        <ThemeProvider>
          <AppStoreCandidateCapture candidateId={candidate.id} />
        </ThemeProvider>
      );

      expect(
        screen.getByTestId(`app-store-capture-${candidate.id.toLowerCase()}`)
      ).toBeTruthy();
      expect(screen.getByLabelText(candidate.accessibilityLabel)).toBeTruthy();
      expect(screen.getByLabelText(candidate.fixtureBoundary)).toBeTruthy();
    }
  );
});
