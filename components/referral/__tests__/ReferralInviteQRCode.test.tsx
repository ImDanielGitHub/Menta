import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ReferralInviteQRCode } from '@/components/referral/ReferralInviteQRCode';
import { mentaColors } from '@/constants/MentaDesignSystem';

const qrProps: {
  backgroundColor?: string;
  color?: string;
  quietZone?: number;
  size?: number;
  value?: string;
}[] = [];

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');

  return {
    __esModule: true,
    default: (props: (typeof qrProps)[number]) => {
      qrProps.push(props);
      return React.createElement(View, { testID: 'referral-qr-matrix' });
    },
  };
});

describe('ReferralInviteQRCode', () => {
  beforeEach(() => {
    qrProps.length = 0;
  });

  it('encodes the complete account-scoped referral link', () => {
    const link = 'https://menta.quest/invite?ref=ACTIVE';

    render(<ReferralInviteQRCode link={link} state="ready" />);

    expect(screen.getByTestId('referral-qr-matrix')).toBeTruthy();
    expect(qrProps[0]).toMatchObject({
      backgroundColor: mentaColors.paper,
      color: mentaColors.text.onPaper,
      value: link,
    });
    expect(qrProps[0].size).toBeGreaterThanOrEqual(200);
    expect(qrProps[0].quietZone).toBeGreaterThanOrEqual(12);
    expect(screen.getByText('Let them scan to join')).toBeTruthy();
  });

  it('describes the ready code to assistive technology', () => {
    render(
      <ReferralInviteQRCode
        link="https://menta.quest/invite?ref=ACTIVE"
        state="ready"
      />
    );

    expect(
      screen.getByLabelText(
        'Referral invite QR code. Scan to open the invite link.'
      )
    ).toBeTruthy();
  });

  it('keeps the QR area stable while the link is loading', () => {
    render(<ReferralInviteQRCode link={null} state="preparing" />);

    expect(screen.getByTestId('referral-invite-qr-placeholder')).toBeTruthy();
    expect(screen.getByText('Preparing your QR code…')).toBeTruthy();
    expect(screen.queryByTestId('referral-qr-matrix')).toBeNull();
  });

  it('offers the other sharing actions when QR preparation fails', () => {
    render(<ReferralInviteQRCode link={null} state="unavailable" />);

    expect(
      screen.getByText(
        'QR code unavailable. You can still try the share or copy options below.'
      )
    ).toBeTruthy();
  });
});
