import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { NotificationsPrivacyFamilyGallery } from '@/components/paper-gallery/NotificationsPrivacyFamilyGallery';

jest.mock('@/components/ui/AppShell', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppScreen: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
    }) => React.createElement(View, { testID }, children),
    AppTopBar: () => null,
    AppDivider: () => null,
    AppListRow: ({
      title,
      subtitle,
      value,
    }: {
      title: string;
      subtitle?: string;
      value?: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        subtitle ? React.createElement(Text, null, subtitle) : null,
        value ? React.createElement(Text, null, value) : null
      ),
  };
});

jest.mock('@/components/ui/AppButton', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text } =
    require('react-native') as typeof import('react-native');
  return {
    AppButton: ({
      title,
      testID,
      disabled,
    }: {
      title: string;
      testID?: string;
      disabled?: boolean;
    }) =>
      React.createElement(
        Pressable,
        { accessibilityState: { disabled: Boolean(disabled) }, testID },
        React.createElement(Text, null, title)
      ),
  };
});

jest.mock('@/components/ui/AppFeedback', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppInlineNotice: ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        React.createElement(Text, null, description)
      ),
  };
});

jest.mock('@/components/ui/AppFields', () => {
  const React = require('react') as typeof import('react');
  const { Text, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppDateTimeRow: ({
      title,
      subtitle,
    }: {
      title: string;
      subtitle?: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, title),
        subtitle ? React.createElement(Text, null, subtitle) : null
      ),
    AppSwitchRow: () => null,
  };
});

const renderState = (
  stateId: Parameters<typeof NotificationsPrivacyFamilyGallery>[0]['stateId']
) =>
  render(
    <ThemeProvider>
      <NotificationsPrivacyFamilyGallery stateId={stateId} />
    </ThemeProvider>
  );

describe('NotificationsPrivacyFamilyGallery', () => {
  it('renders the native handoff without claiming an outcome', () => {
    renderState('NOT-03');

    expect(screen.getByText('Your phone is asking.')).toBeTruthy();
    expect(screen.getByText('Open system prompt')).toBeTruthy();
    expect(screen.queryByText(/notification delivered/i)).toBeNull();
  });

  it('keeps the previously saved quiet-hours range authoritative after a failed save', () => {
    renderState('NOT-17');

    expect(screen.getByText('10:00 PM — 7:00 AM')).toBeTruthy();
    expect(screen.getByText('9:30 PM — 6:30 AM')).toBeTruthy();
    expect(screen.getByText('Try saving again')).toBeTruthy();
  });

  it('distinguishes pending device registration from notification delivery', () => {
    renderState('AUTH-09');

    expect(
      screen.getByText('Permission is on. Delivery is catching up.')
    ).toBeTruthy();
    expect(screen.getByText('Try registration again')).toBeTruthy();
    expect(
      screen.getByText(/No reminder has been claimed as delivered yet\./)
    ).toBeTruthy();
  });
});
