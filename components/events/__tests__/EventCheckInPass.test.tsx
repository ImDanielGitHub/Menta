import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { EventCheckInPass } from '@/components/events/EventCheckInPass';
import { mentaColors } from '@/constants/MentaDesignSystem';

const mockQrCode = jest.fn();

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react') as typeof import('react');
  const { View } = require('react-native') as typeof import('react-native');

  return function MockQrCode(props: Record<string, unknown>) {
    mockQrCode(props);
    return React.createElement(View, { testID: 'event-check-in-qr-svg' });
  };
});

describe('EventCheckInPass', () => {
  beforeEach(() => {
    mockQrCode.mockClear();
  });

  it('renders a full-width paper receipt without exposing the raw token', () => {
    const token = 'private-organiser-check-in-token';

    render(<EventCheckInPass code={token} />);

    expect(screen.getByText('Organiser check-in code')).toBeTruthy();
    expect(
      screen.getByText(
        'Attendees scan this to record attendance. It does not share or approve a photo.'
      )
    ).toBeTruthy();
    expect(screen.queryByText(token)).toBeNull();
    expect(
      screen.getByRole('image', { name: 'Organiser check-in QR code' })
    ).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId('event-check-in-pass').props.style)
    ).toMatchObject({ alignSelf: 'stretch', width: '100%' });
    expect(mockQrCode).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundColor: mentaColors.paper,
        color: mentaColors.text.onPaper,
        size: 216,
        value: token,
      })
    );
  });

  it('keeps requested QR geometry within the readable 208–224pt range', () => {
    const view = render(<EventCheckInPass code="token" size={190} />);

    expect(mockQrCode).toHaveBeenLastCalledWith(
      expect.objectContaining({ size: 208 })
    );

    view.rerender(<EventCheckInPass code="token" size={260} />);

    expect(mockQrCode).toHaveBeenLastCalledWith(
      expect.objectContaining({ size: 224 })
    );
  });
});
