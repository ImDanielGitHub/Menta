import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  AdminContractUnavailableScreen,
  SupportSystemFamilyGallery,
} from '@/components/paper-gallery/SupportSystemFamilyGallery';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('@/components/ui/AppShell', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    AppDivider: () => null,
    AppListRow: ({ title }: { title: string }) =>
      React.createElement(View, { accessibilityLabel: title }),
    AppScreen: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    AppTopBar: () => null,
  };
});

const renderState = (
  stateId: Parameters<typeof SupportSystemFamilyGallery>[0]['stateId']
) =>
  render(
    <ThemeProvider>
      <SupportSystemFamilyGallery galleryMode stateId={stateId} />
    </ThemeProvider>
  );

describe('SupportSystemFamilyGallery', () => {
  it('keeps an admin queue unavailable without an authoritative receipt', () => {
    renderState('ADM-00');

    expect(screen.getByText('ROLE RECEIPT PENDING')).toBeTruthy();
    expect(
      screen.getByTestId('support-system-admin-wait').props.accessibilityState
        ?.disabled
    ).toBe(true);
  });

  it('keeps a reject decision disabled until the review acknowledgement', () => {
    renderState('ADM-08');

    const submit = screen.getByTestId('support-system-reject-submit');
    expect(submit.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(screen.getByTestId('support-system-reject-confirmation'));

    expect(
      screen.getByTestId('support-system-reject-submit').props
        .accessibilityState?.disabled
    ).toBe(false);
  });

  it('uses the canonical skeleton and names the static Reduce Motion state', () => {
    renderState('SYS-04');

    expect(screen.getByTestId('support-system-account-loading')).toBeTruthy();
    expect(
      screen.getByText('Reduce Motion keeps this loading state still.')
    ).toBeTruthy();
  });

  it('does not make an offline state sound like a clear queue', () => {
    renderState('OFF-02');

    expect(screen.getByText('LAST CONFIRMED STATE')).toBeTruthy();
    expect(
      screen.getByText(
        'Offline does not mean zero reports, no saved proof, or all clear.'
      )
    ).toBeTruthy();
  });

  it('renders the production admin route as a truthful unavailable contract', () => {
    render(
      <ThemeProvider>
        <AdminContractUnavailableScreen onBack={jest.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByText('Admin access required')).toBeTruthy();
    expect(screen.getByText('ROLE OR QUEUE CONTRACT UNAVAILABLE')).toBeTruthy();
    expect(screen.queryByText('Issue queue')).toBeNull();
  });

  it('renders the stale-route recovery through visible actions', () => {
    const onGoHome = jest.fn();
    const onBack = jest.fn();
    render(
      <ThemeProvider>
        <SupportSystemFamilyGallery
          actions={{ onBack, onGoHome }}
          stateId="SYS-03"
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Route Not Found')).toBeTruthy();
    fireEvent.press(screen.getByText('Go home'));
    fireEvent.press(screen.getByText('Go back'));
    expect(onGoHome).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
