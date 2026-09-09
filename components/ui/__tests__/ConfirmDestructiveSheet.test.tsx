import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ConfirmDestructiveSheet from '@/components/ui/ConfirmDestructiveSheet';
import { ThemeProvider } from '@/constants/ThemeContext';
import { emitHaptic } from '@/lib/motion/haptics';

jest.mock('@/lib/motion/haptics', () => ({
  emitHaptic: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@/components/ui/SimpleBottomSheet', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  const MockSheet = ({
    visible,
    children,
    scrollableBody,
    footer,
    dismissOnBackdrop,
    onClose,
    testID,
  }: {
    visible: boolean;
    children?: React.ReactNode;
    scrollableBody?: React.ReactNode;
    footer?: React.ReactNode;
    dismissOnBackdrop?: boolean;
    onClose: () => void;
    testID?: string;
  }) =>
    visible ? (
      <View testID={testID}>
        <Text>{`dismissOnBackdrop:${String(dismissOnBackdrop)}`}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mock sheet close"
          onPress={onClose}
        >
          <Text>Mock sheet close</Text>
        </Pressable>
        {scrollableBody ?? children}
        {footer}
      </View>
    ) : null;

  return {
    __esModule: true,
    SimpleBottomSheet: MockSheet,
    default: MockSheet,
  };
});

const renderSheet = (props = {}) => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  render(
    <ThemeProvider>
      <ConfirmDestructiveSheet
        visible
        title="Delete your account?"
        description="Login deleted. Profile anonymized. No undo."
        confirmLabel="Delete account"
        destructiveLabel="DELETE"
        nameToType="DELETE"
        onClose={onClose}
        onConfirm={onConfirm}
        {...props}
      />
    </ThemeProvider>
  );

  return { onClose, onConfirm };
};

describe('ConfirmDestructiveSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the confirmation phrase before running the destructive action', () => {
    const { onConfirm } = renderSheet();

    fireEvent.press(screen.getByTestId('confirm-destructive-sheet-confirm'));
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByPlaceholderText('DELETE'), '  delete ');
    fireEvent.press(screen.getByText('Delete account'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(emitHaptic).toHaveBeenCalledWith({ type: 'destructive-commit' });
  });

  it('does not close or confirm while a destructive action is loading', () => {
    const { onClose, onConfirm } = renderSheet({ loading: true });

    expect(screen.getByText('dismissOnBackdrop:false')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Mock sheet close'));
    fireEvent.press(screen.getByText('Cancel'));
    fireEvent.changeText(screen.getByPlaceholderText('DELETE'), 'DELETE');
    fireEvent.press(screen.getByTestId('confirm-destructive-sheet-confirm'));

    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(emitHaptic).not.toHaveBeenCalled();
  });

  it('announces destructive context as an alert', () => {
    renderSheet();

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Delete your account?')).toBeTruthy();
    expect(screen.queryByText('Permanent')).toBeNull();
    expect(screen.getByLabelText('Type DELETE to confirm')).toBeTruthy();
  });
});
