import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PaperStateGallery } from '@/components/paper-gallery/PaperStateGallery';
import { ThemeProvider } from '@/constants/ThemeContext';
import {
  PAPER_GALLERY_FAMILIES,
  PAPER_GALLERY_STATE_COUNT,
} from '@/lib/paper-state-registry';

jest.mock('@/components/ui/AppShell', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');
  return {
    AppScreen: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    AppDivider: () => null,
    AppTopBar: () => null,
  };
});

describe('PaperStateGallery', () => {
  it('registers the complete integrated family wave without duplicate ids', () => {
    const ids = PAPER_GALLERY_FAMILIES.flatMap(family => family.stateIds);

    expect(PAPER_GALLERY_STATE_COUNT).toBe(199);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('renders a deterministic Today state without a public route', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="today" stateId="HOME-01" />
      </ThemeProvider>
    );

    expect(screen.getByTestId('paper-state-gallery-today')).toBeTruthy();
    expect(screen.getByTestId('today-paper-HOME-01')).toBeTruthy();
  });

  it('renders a deterministic onboarding recovery state', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="onboarding-auth" stateId="ONB-02B" />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('paper-state-gallery-onboarding-auth')
    ).toBeTruthy();
    expect(screen.getByText('Nothing has been sent yet.')).toBeTruthy();
  });

  it('renders a deterministic Settings state', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="settings-account" stateId="NOT-01" />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('paper-state-gallery-settings-account')
    ).toBeTruthy();
    expect(
      screen.getByText('Notification settings did not load.')
    ).toBeTruthy();
  });

  it('renders the deterministic invitation handoff without a sent receipt', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="settings-account" stateId="INV-03" />
      </ThemeProvider>
    );

    expect(
      screen.getByText(
        'Your phone share sheet owns recipients and delivery. Menta cannot inspect a destination or claim sent.'
      )
    ).toBeTruthy();
  });

  it('renders a deterministic Promise state', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="promise" stateId="DTL-00" />
      </ThemeProvider>
    );

    expect(screen.getByTestId('paper-state-gallery-promise')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toHaveProp(
      'accessibilityLabel',
      'Loading promise details'
    );
  });

  it('renders the server-confirmed group promise receipt state', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="promise" stateId="GRP-10" />
      </ThemeProvider>
    );

    expect(screen.getByTestId('paper-state-gallery-promise')).toBeTruthy();
    expect(screen.getByText('Morning walk is ready.')).toBeTruthy();
    expect(screen.getByText('No one has been invited yet.')).toBeTruthy();
  });

  it('renders a deterministic Events state', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="events" stateId="89Y-0" />
      </ThemeProvider>
    );

    expect(screen.getByTestId('paper-state-gallery-events')).toBeTruthy();
    expect(screen.getByText('Your post has not been sent.')).toBeTruthy();
  });

  it('renders a deterministic Support/System state without a public route', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="support-system" stateId="SYS-04" />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('paper-state-gallery-support-system')
    ).toBeTruthy();
    expect(screen.getByTestId('support-system-account-loading')).toBeTruthy();
  });

  it('renders a deterministic Bootstrap/email recovery state', () => {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <ThemeProvider>
          <PaperStateGallery
            family="bootstrap-email-recovery"
            stateId="BOOT-00"
          />
        </ThemeProvider>
      </SafeAreaProvider>
    );

    expect(
      screen.getByTestId('paper-state-gallery-bootstrap-email-recovery')
    ).toBeTruthy();
    expect(
      screen.getByText('Checking what is ready on this phone…')
    ).toBeTruthy();
  });

  it('renders a deterministic Commerce state without inventing a price', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="commerce" stateId="PAY-02" />
      </ThemeProvider>
    );

    expect(screen.getByTestId('paper-state-gallery-commerce')).toBeTruthy();
    expect(screen.getByTestId('commerce-paper-PAY-02-skeleton')).toBeTruthy();
    expect(screen.getByText('Loading live plans.')).toBeTruthy();
  });

  it('renders a deterministic group archive failure state', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="groups-admin-archive" stateId="4ZB-0" />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('paper-state-gallery-groups-admin-archive')
    ).toBeTruthy();
    expect(screen.getByText("Archived groups couldn't load")).toBeTruthy();
  });

  it('renders a deterministic notification permission handoff', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="notifications-privacy" stateId="NOT-03" />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('paper-state-gallery-notifications-privacy')
    ).toBeTruthy();
    expect(screen.getByText('Your phone is asking.')).toBeTruthy();
  });

  it('renders a deterministic proof evidence recovery state', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="proof-recovery" stateId="REV-02B" />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('paper-state-gallery-proof-recovery')
    ).toBeTruthy();
    expect(
      screen.getByText('The proof cannot be opened right now')
    ).toBeTruthy();
  });

  it('renders an App Store candidate through the unregistered dev gallery', () => {
    render(
      <ThemeProvider>
        <PaperStateGallery family="app-store-candidates" stateId="ASC-01" />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('paper-state-gallery-app-store-candidates')
    ).toBeTruthy();
    expect(screen.getByTestId('app-store-capture-asc-01')).toBeTruthy();
  });

  it('renders the real shared bottom navigation shell', () => {
    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <PaperStateGallery family="shared-shell" stateId="SHELL-TAB-01" />
      </SafeAreaProvider>
    );

    expect(screen.getByTestId('paper-state-gallery-shared-shell')).toBeTruthy();
    expect(screen.getByTestId('menta-bottom-tab-bar')).toBeTruthy();
    expect(screen.getByTestId('tab-groups').props.accessibilityState).toEqual({
      selected: true,
    });
  });
});
