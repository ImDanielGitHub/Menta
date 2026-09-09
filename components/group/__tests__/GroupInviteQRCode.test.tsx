import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { GroupInviteQRCode } from '@/components/group/GroupInviteQRCode';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';
import { getThemeAppearance } from '@/lib/shop/catalogSupport';

const qrProps: {
  value?: string;
  size?: number;
  quietZone?: number;
  color?: string;
  backgroundColor?: string;
}[] = [];

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: (props: { value: string; size: number; quietZone: number }) => {
      qrProps.push(props);
      return <View testID="qr-matrix" />;
    },
  };
});

describe('group invite QR code', () => {
  beforeEach(() => {
    qrProps.length = 0;
  });

  it('spends the frame on the scannable matrix', () => {
    render(
      <GroupInviteQRCode inviteCode="N65BC2L5" size={276} showCode={false} />
    );

    const [props] = qrProps;
    // A phone camera has to read this from across a table, so the matrix keeps
    // most of the frame instead of shrinking to a decorative thumbnail.
    expect(props.size).toBeGreaterThanOrEqual(220);
    expect(props.size).toBeLessThanOrEqual(276);
  });

  it('keeps a quiet zone that scales with the matrix', () => {
    render(
      <GroupInviteQRCode inviteCode="N65BC2L5" size={300} showCode={false} />
    );

    const [props] = qrProps;
    expect(props.quietZone).toBeGreaterThanOrEqual(12);
    expect(props.quietZone).toBeGreaterThanOrEqual(
      Math.round(props.size * 0.05)
    );
  });

  it('encodes the shareable invite link rather than a raw identifier', () => {
    render(<GroupInviteQRCode inviteCode="N65BC2L5" size={200} />);

    const [props] = qrProps;
    expect(props.value).toContain('N65BC2L5');
    expect(props.value).toMatch(/^[a-z]+:/);
  });

  it('themes the surrounding card without recolouring the scannable paper', () => {
    const ember = getThemeAppearance('profile_theme_ember');
    expect(ember).not.toBeNull();

    const view = render(
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        <GroupInviteQRCode inviteCode="N65BC2L5" size={276} showCode={false} />
      </ThemeProvider>
    );

    expect(screen.getByTestId('group-invite-qr-container')).toHaveStyle({
      backgroundColor: ember?.surfacePrimary,
    });
    expect(screen.getByTestId('group-invite-qr-paper')).toHaveStyle({
      backgroundColor: mentaColors.paper,
    });
    expect(qrProps[0]).toMatchObject({
      backgroundColor: mentaColors.paper,
      color: mentaColors.text.onPaper,
    });

    view.rerender(
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        <GroupInviteQRCode
          inviteCode="N65BC2L5"
          size={276}
          showCode={false}
          bare
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('group-invite-qr-container')).toHaveStyle({
      backgroundColor: mentaColors.paper,
    });
  });

  it('describes itself to assistive technology', () => {
    const { getByLabelText } = render(
      <GroupInviteQRCode inviteCode="N65BC2L5" size={200} showCode={false} />
    );

    expect(
      getByLabelText('Group invite QR code for invite N65BC2L5')
    ).toBeTruthy();
  });
});
