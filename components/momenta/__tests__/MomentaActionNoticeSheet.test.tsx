import React from 'react';
import { View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  MomentaActionNoticeSheet,
  type MomentaActionNotice,
} from '@/components/momenta/MomentaActionNoticeSheet';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('@/components/ui/SimpleBottomSheet', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    __esModule: true,
    default: ({
      visible,
      children,
      dismissOnBackdrop,
      onClose,
      testID,
      maxHeight,
      scrollableBody,
      footer,
    }: {
      visible: boolean;
      children?: React.ReactNode;
      dismissOnBackdrop?: boolean;
      onClose: () => void;
      testID?: string;
      maxHeight?: number;
      scrollableBody?: React.ReactNode;
      footer?: React.ReactNode;
    }) =>
      visible ? (
        <View testID={testID}>
          <Text>{`dismissOnBackdrop:${String(dismissOnBackdrop)}`}</Text>
          <Text>{`maxHeight:${String(maxHeight)}`}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mock sheet close"
            onPress={onClose}
          >
            <Text>Mock sheet close</Text>
          </Pressable>
          <View testID="mock-scrollable-body">{scrollableBody}</View>
          <View testID="mock-footer">{footer}</View>
        </View>
      ) : null,
  };
});

const renderSheet = (notice: MomentaActionNotice | null, props = {}) => {
  const onClose = jest.fn();
  const onRefresh = jest.fn();

  render(
    <ThemeProvider>
      <View>
        <MomentaActionNoticeSheet
          visible={Boolean(notice)}
          notice={notice}
          onClose={onClose}
          onRefresh={onRefresh}
          testID="notice-sheet"
          {...props}
        />
      </View>
    </ThemeProvider>
  );

  return { onClose, onRefresh };
};

describe('MomentaActionNoticeSheet', () => {
  it('renders receipt proof as direct label and value rows', () => {
    renderSheet({
      kind: 'info',
      eyebrow: 'Store receipt pending',
      title: 'Your receipt is being checked.',
      message: 'No Momenta is available until Menta confirms the receipt.',
      facts: [
        { label: 'Apple handoff', value: 'Returned' },
        { label: 'Momenta credit', value: 'Waiting for Menta' },
      ],
    });

    expect(screen.queryByText('Store receipt pending')).toBeNull();
    expect(screen.getByText('Your receipt is being checked.')).toBeTruthy();
    expect(screen.getByText('Apple handoff')).toBeTruthy();
    expect(screen.getByText('Returned')).toBeTruthy();
    expect(screen.getByText('Waiting for Menta')).toBeTruthy();
  });

  it('renders error notices as an alert with retry and close actions', () => {
    const { onClose, onRefresh } = renderSheet({
      kind: 'error',
      title: 'Refresh failed',
      message: 'Try again in a moment.',
      refreshActionTitle: 'Try refresh again',
    });

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Refresh failed')).toBeTruthy();
    expect(screen.getByText('Try again in a moment.')).toBeTruthy();

    fireEvent.press(screen.getByText('Try refresh again'));
    fireEvent.press(screen.getByText('Close'));

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the notice body scrollable and retry and close independently accessible in the footer', () => {
    renderSheet({
      kind: 'error',
      title: 'Refresh failed',
      message: 'Try again in a moment.',
      refreshActionTitle: 'Try refresh again',
      facts: [{ label: 'Receipt status', value: 'Needs review' }],
    });

    const alert = screen.getByRole('alert');
    const retry = screen.getByRole('button', { name: 'Try refresh again' });
    const close = screen.getByRole('button', { name: 'Close' });

    expect(screen.getByTestId('mock-scrollable-body')).toContainElement(alert);
    expect(alert).not.toContainElement(screen.getByText('Receipt status'));
    expect(screen.getByTestId('mock-scrollable-body')).toContainElement(
      screen.getByText('Receipt status')
    );
    expect(screen.getByTestId('mock-footer')).toContainElement(retry);
    expect(screen.getByTestId('mock-footer')).toContainElement(close);
  });

  it('does not impose a default max height', () => {
    renderSheet({
      kind: 'success',
      title: 'Purchase confirmed',
      message: 'Your items are ready.',
    });

    expect(screen.getByText('maxHeight:undefined')).toBeTruthy();
  });

  it('passes an explicit max height through to the shared sheet', () => {
    renderSheet(
      {
        kind: 'success',
        title: 'Purchase confirmed',
        message: 'Your items are ready.',
      },
      { maxHeight: 480 }
    );

    expect(screen.getByText('maxHeight:480')).toBeTruthy();
  });

  it('does not show a refresh action when the notice has no retry affordance', () => {
    renderSheet({
      kind: 'success',
      title: 'Inventory updated',
      message: 'Owned items and equipped styles are current.',
    });

    expect(screen.queryByText('Try refresh again')).toBeNull();
    expect(screen.getByText('Inventory updated')).toBeTruthy();
    expect(screen.getByText('Close')).toBeTruthy();
  });

  it('renders the reward check as a progress state without claiming success', () => {
    renderSheet({
      kind: 'progress',
      title: 'Checking your reward',
      message: 'Keep this open until it finishes.',
    });

    expect(screen.getByText('Checking your reward')).toBeTruthy();
    expect(screen.getByText('Keep this open until it finishes.')).toBeTruthy();
    expect(
      screen.getByRole('progressbar', { name: 'Checking reward status' })
    ).toBeTruthy();
    expect(screen.queryByText('Momenta added')).toBeNull();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('keeps retrying notices open while refresh is loading', () => {
    const { onClose } = renderSheet(
      {
        kind: 'error',
        title: 'Refresh failed',
        message: 'Try again in a moment.',
        refreshActionTitle: 'Try refresh again',
      },
      { refreshing: true }
    );

    expect(screen.getByText('dismissOnBackdrop:false')).toBeTruthy();
    expect(screen.getByText('Refreshing balance…')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Mock sheet close'));
    fireEvent.press(screen.getByText('Close'));

    expect(onClose).not.toHaveBeenCalled();
  });
});
