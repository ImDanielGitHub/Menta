import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';

import GroupInviteScreen, { getInviteQrSize } from '@/app/group-invite';
import { mentaLayout } from '@/constants/MentaDesignSystem';

const mockRouter = {
  back: jest.fn(),
  replace: jest.fn(),
};
const mockFetchGroupDetails = jest.fn();
const mockShareGroup = jest.fn();
const mockRotateGroupInviteCode = jest.fn();
const mockGroupStoreState = {
  fetchGroupDetails: mockFetchGroupDetails,
  rotateGroupInviteCode: mockRotateGroupInviteCode,
  shareGroup: mockShareGroup,
};

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({
    groupId: 'group-1',
    groupName: 'Morning walk group',
  }),
  useRouter: () => mockRouter,
}));

jest.mock('@/store/group-store', () => ({
  useGroupStore: (selector: (state: typeof mockGroupStoreState) => unknown) =>
    selector(mockGroupStoreState),
}));

jest.mock('@/lib/meta-ads', () => ({
  trackMetaAdsInviteFriend: jest.fn(),
}));

jest.mock('@/components/group/GroupInviteQRCode', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GroupInviteQRCode: ({ size }: { size: number }) =>
      React.createElement(View, {
        testID: 'mock-group-invite-qr',
        style: { height: size, width: size },
      }),
  };
});

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 47, right: 0, bottom: 34, left: 0 },
    }}
  >
    {children}
  </SafeAreaProvider>
);

describe('Group invite visual hierarchy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchGroupDetails.mockImplementation(() => new Promise(() => {}));
    mockShareGroup.mockImplementation(() => new Promise(() => {}));
    mockRotateGroupInviteCode.mockResolvedValue({
      code: 'NEWCODE',
      previousCodeInvalidated: true,
    });
  });

  it('keeps the QR useful on compact phones and lets large phones use more width', () => {
    expect(getInviteQrSize(320)).toBe(244);
    expect(getInviteQrSize(390)).toBe(294);
    expect(getInviteQrSize(430)).toBe(300);
  });

  it('keeps loading in the same full-width structure as the active invite', async () => {
    render(<GroupInviteScreen />, { wrapper });

    expect(screen.getByText('Invite people')).toBeTruthy();
    expect(screen.getByText('Morning walk group')).toBeTruthy();
    expect(screen.getByLabelText('Loading active invite')).toHaveProp(
      'accessibilityRole',
      'progressbar'
    );

    const qrPlaceholder = screen.getByTestId('group-invite-loading-qr', {
      includeHiddenElements: true,
    });
    const qrViews = within(qrPlaceholder).UNSAFE_getAllByType(View);
    expect(
      qrViews.some(view => {
        const style = StyleSheet.flatten(view.props.style);
        return style.width === '100%' && style.maxWidth === 300;
      })
    ).toBe(true);

    expect(
      screen.getByTestId('group-invite-loading-intro', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(
      screen.getByTestId('group-invite-loading-actions', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(
      screen.getByTestId('group-invite-loading-footer', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();

    await waitFor(() => {
      expect(mockFetchGroupDetails).toHaveBeenCalledWith('group-1');
      expect(mockShareGroup).toHaveBeenCalledWith(
        'group-1',
        'Morning walk group'
      );
    });
  });

  it('makes the active invite artefact dominant and keeps destructive rotation secondary', async () => {
    mockFetchGroupDetails.mockResolvedValue({
      id: 'group-1',
      name: 'Morning walk group',
    });
    mockShareGroup.mockResolvedValue({
      code: 'MILES8',
      shareUrl: 'https://menta.app/join/MILES8',
    });

    render(<GroupInviteScreen />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText('Invite people to Morning walk group')
      ).toBeTruthy();
    });

    expect(screen.getByTestId('group-invite-qr-block')).toBeTruthy();
    expect(screen.getByTestId('mock-group-invite-qr')).toBeTruthy();
    expect(screen.getByText('MILES8')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Share invite' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Replace invite code' })
    ).toBeTruthy();

    fireEvent.press(
      screen.getByRole('button', { name: 'Replace invite code' })
    );
    expect(screen.getByText('Replace this invite?')).toBeTruthy();
    expect(
      screen.getByText(/current link, QR code and code will stop working/i)
    ).toBeTruthy();
  });

  it('keeps the working frame capped for large phones', () => {
    expect(mentaLayout.workingFrameMax).toBe(430);
  });
});
