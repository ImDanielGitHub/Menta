import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { SettingsAccountFamilyGallery } from '@/components/paper-gallery/SettingsAccountFamilyGallery';
import { settingsAccountPaperStates } from '@/lib/paper-state-registry/settings-account';

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

jest.mock('@/components/ui/AppFields', () => {
  const React = require('react') as typeof import('react');
  const { Pressable, Text, TextInput, View } =
    require('react-native') as typeof import('react-native');
  return {
    AppFieldRow: ({
      title,
      subtitle,
      value,
      onPress,
    }: {
      title: string;
      subtitle?: string;
      value?: string;
      onPress?: () => void;
    }) =>
      React.createElement(
        Pressable,
        { onPress },
        React.createElement(Text, null, title),
        subtitle ? React.createElement(Text, null, subtitle) : null,
        value ? React.createElement(Text, null, value) : null
      ),
    AppTextField: ({
      value,
      onChangeText,
      testID,
    }: {
      value: string;
      onChangeText: (value: string) => void;
      testID: string;
    }) => React.createElement(TextInput, { value, onChangeText, testID }),
  };
});

const renderState = (
  stateId: Parameters<typeof SettingsAccountFamilyGallery>[0]['stateId']
) =>
  render(
    <ThemeProvider>
      <SettingsAccountFamilyGallery stateId={stateId} galleryMode />
    </ThemeProvider>
  );

describe('SettingsAccountFamilyGallery', () => {
  it('registers every Paper state and keeps the exact artboard ids', () => {
    expect(settingsAccountPaperStates).toHaveLength(25);
    expect(
      settingsAccountPaperStates.map(
        state => `${state.id}:${state.paperNodeId}`
      )
    ).toEqual([
      'YOU-00:9US-0',
      'YOU-01:AC7-0',
      'YOU-03:ADR-0',
      'YOU-04:82G-0',
      'OUT-02:CTJ-0',
      'OUT-04:CWL-0',
      'DEL-01:CY4-0',
      'DEL-02:CZN-0',
      'DEL-03:D16-0',
      'DEL-04:D2P-0',
      'DEL-06:6OW-0',
      'DEL-07:D48-0',
      'DEL-09:D7A-0',
      'DEL-14:DDE-0',
      'NOT-01:C85-0',
      'SET-00:6PW-0',
      'SET-01:6GS-0',
      'SET-02:B6L-0',
      'SET-03:B8V-0',
      'INV-01:AVS-0',
      'INV-02:AXX-0',
      'INV-03:AZC-0',
      'INV-04:B0X-0',
      'INV-05:B32-0',
      'INV-06:B4M-0',
    ]);
  });

  it('uses a structure-shaped loading state instead of a spinner', () => {
    renderState('YOU-00');

    expect(screen.getByTestId('settings-account-family-you-00')).toBeTruthy();
    expect(screen.queryByText('Loading…')).toBeNull();
  });

  it('renders every new Settings and invitation state deterministically', () => {
    const stateIds = [
      'SET-00',
      'SET-01',
      'SET-02',
      'SET-03',
      'INV-01',
      'INV-02',
      'INV-03',
      'INV-04',
      'INV-05',
      'INV-06',
    ] as const;

    for (const stateId of stateIds) {
      const view = renderState(stateId);
      expect(view.toJSON()).toBeTruthy();
      view.unmount();
    }
  });

  it('keeps the share return and clipboard states honest', () => {
    const returned = renderState('INV-04');
    expect(
      screen.getByText('No recipient or delivery state came back to Menta.')
    ).toBeTruthy();
    returned.unmount();

    renderState('INV-05');
    expect(
      screen.getByText('Clipboard receipt only, not sent or joined.')
    ).toBeTruthy();
  });

  it('does not enable a final deletion request until DELETE is exact', () => {
    renderState('DEL-06');

    const submit = screen.getByTestId('settings-account-family-del-06-submit');
    expect(submit.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(
      screen.getByTestId('settings-account-family-del-06-input'),
      'DELETE'
    );

    expect(
      screen.getByTestId('settings-account-family-del-06-submit').props
        .accessibilityState?.disabled
    ).toBe(false);
    expect(
      screen.getByText('Exact match. You can send this request.')
    ).toBeTruthy();
  });

  it('keeps the sign-out retry and notification failure states honest', () => {
    const signOut = renderState('OUT-04');
    expect(screen.getByText('This device is still signed in.')).toBeTruthy();
    expect(screen.getByText('Try signing out again')).toBeTruthy();

    signOut.unmount();
    renderState('NOT-01');
    expect(
      screen.getByText('Notification settings did not load.')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Nothing on this screen claims that a reminder is scheduled.'
      )
    ).toBeTruthy();
  });

  it('only supplies an example retry time to explicit gallery inputs', () => {
    renderState('DEL-09');
    expect(screen.getByText('3:20 PM')).toBeTruthy();
  });
});
