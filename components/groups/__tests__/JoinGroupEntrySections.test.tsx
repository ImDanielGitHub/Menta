import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import {
  JoinGroupCodeEntrySection,
  JoinGroupScanSection,
} from '@/components/groups/JoinGroupEntrySections';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('@/components/ui/AppFields', () => {
  const React = require('react');
  const { Text, TextInput, View } = require('react-native');
  return {
    AppTextField: ({ helperText, ...props }: { helperText?: string }) =>
      React.createElement(
        View,
        null,
        React.createElement(TextInput, props),
        helperText ? React.createElement(Text, null, helperText) : null
      ),
  };
});

const renderWithTheme = (node: React.ReactElement) =>
  render(<ThemeProvider>{node}</ThemeProvider>);

describe('JoinGroupEntrySections', () => {
  beforeEach(() => {
    (Haptics.impactAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it('opens the scanner and switches back to manual code entry', () => {
    const onOpenScanner = jest.fn();
    const onEnterCode = jest.fn();

    renderWithTheme(
      <JoinGroupScanSection
        onOpenScanner={onOpenScanner}
        onEnterCode={onEnterCode}
      />
    );

    expect(
      screen.getByText(
        'Open the camera only when someone is showing you the invite QR.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Open camera')).toBeTruthy();
    expect(
      screen.getByText('Point your phone at the invite poster or QR code.')
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Open camera'));
    fireEvent.press(screen.getByText('Enter invite code instead'));

    expect(onOpenScanner).toHaveBeenCalledTimes(1);
    expect(onEnterCode).toHaveBeenCalledTimes(1);
  });

  it('keeps manual invite entry, Paper code prompt, and QR/paste actions together', () => {
    const onInviteCodeChange = jest.fn();
    const onScanInstead = jest.fn();
    const onPasteCode = jest.fn();

    renderWithTheme(
      <JoinGroupCodeEntrySection
        inviteCode="ABC123"
        joinCost={25}
        balance={100}
        isJoining={false}
        signedIn
        onInviteCodeChange={onInviteCodeChange}
        onJoin={jest.fn()}
        onInsufficient={jest.fn()}
        onScanInstead={onScanInstead}
        onPasteCode={onPasteCode}
      />
    );

    expect(screen.getByText('Invite code *')).toBeTruthy();
    expect(screen.getByLabelText('Invite code')).toBeTruthy();
    expect(screen.getByText('6/32')).toBeTruthy();
    expect(
      screen.getByText(
        'Paste the code from your invite message or group poster.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Scan QR')).toBeTruthy();
    expect(screen.getByText('Paste code')).toBeTruthy();
    expect(
      screen.getByText(
        'Entering a code only previews the group. Joining spends 25 Momenta. Your code is used only after the group accepts you.'
      )
    ).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('WALK-7K2'), 'go9');
    fireEvent.press(screen.getByText('Scan QR'));
    fireEvent.press(screen.getByText('Paste code'));

    expect(onInviteCodeChange).toHaveBeenCalledWith('go9');
    expect(onScanInstead).toHaveBeenCalledTimes(1);
    expect(onPasteCode).toHaveBeenCalledTimes(1);
  });

  it('blocks empty codes and shows signed-out join copy', () => {
    const onJoin = jest.fn();

    renderWithTheme(
      <JoinGroupCodeEntrySection
        inviteCode=""
        joinCost={25}
        balance={100}
        isJoining={false}
        signedIn={false}
        onInviteCodeChange={jest.fn()}
        onJoin={onJoin}
        onInsufficient={jest.fn()}
        onScanInstead={jest.fn()}
        onPasteCode={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText('Sign in to join'));

    expect(onJoin).not.toHaveBeenCalled();
  });

  it('routes insufficient Momenta through the owning route callback', () => {
    const onJoin = jest.fn();
    const onInsufficient = jest.fn();

    renderWithTheme(
      <JoinGroupCodeEntrySection
        inviteCode="ABC123"
        joinCost={25}
        balance={0}
        isJoining={false}
        signedIn
        onInviteCodeChange={jest.fn()}
        onJoin={onJoin}
        onInsufficient={onInsufficient}
        onScanInstead={jest.fn()}
        onPasteCode={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText(/Join group.*25 Momenta/));
    fireEvent.press(screen.getByText(/Tap again.*25 Momenta/));

    expect(onInsufficient).toHaveBeenCalledTimes(1);
    expect(onJoin).not.toHaveBeenCalled();
  });

  it('shows loading copy while the route is joining', () => {
    renderWithTheme(
      <JoinGroupCodeEntrySection
        inviteCode="ABC123"
        joinCost={25}
        balance={100}
        isJoining
        signedIn
        onInviteCodeChange={jest.fn()}
        onJoin={jest.fn()}
        onInsufficient={jest.fn()}
        onScanInstead={jest.fn()}
        onPasteCode={jest.fn()}
      />
    );

    expect(screen.getByText(/Joining\.\.\..*25 Momenta/)).toBeTruthy();
  });
});
