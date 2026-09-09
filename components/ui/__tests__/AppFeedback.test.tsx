import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AppInlineNotice, AppProgressPill } from '@/components/ui/AppFeedback';
import { ThemeProvider } from '@/constants/ThemeContext';

jest.mock('expo-haptics', () => ({
  AndroidHaptics: {
    Confirm: 'confirm',
    Context_Click: 'context-click',
    Drag_Start: 'drag-start',
    Keyboard_Tap: 'keyboard-tap',
    Long_Press: 'long-press',
    Reject: 'reject',
    Segment_Frequent_Tick: 'segment-frequent-tick',
    Segment_Tick: 'segment-tick',
  },
  NotificationFeedbackType: {
    Error: 'error',
    Success: 'success',
    Warning: 'warning',
  },
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  performAndroidHapticsAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Rigid: 'rigid',
    Soft: 'soft',
  },
}));

const renderNotice = (props = {}) =>
  render(
    <ThemeProvider>
      <AppInlineNotice
        title="Upload failed"
        description="Retry without losing your proof."
        {...props}
      />
    </ThemeProvider>
  );

describe('AppInlineNotice', () => {
  it('announces warning and error notices as alerts', () => {
    renderNotice({ tone: 'error' });

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(
      screen.getByLabelText('Upload failed. Retry without losing your proof.')
    ).toBeTruthy();
  });

  it('keeps informational notices non-blocking with summary semantics', () => {
    renderNotice({
      tone: 'info',
      title: 'Proof saved',
      description: 'Your streak is safe for today.',
    });

    expect(screen.getByRole('summary')).toBeTruthy();
    expect(screen.getByText('Proof saved')).toBeTruthy();
  });

  it('uses readable geometry and does not rely on decorative progress styling', () => {
    render(
      <ThemeProvider>
        <AppProgressPill label="Current streak" value="12 days" />
      </ThemeProvider>
    );

    const valueStyle = StyleSheet.flatten(
      screen.getByText('12 days').props.style
    );
    const labelStyle = StyleSheet.flatten(
      screen.getByText('Current streak').props.style
    );
    expect(valueStyle.fontSize).toBeGreaterThanOrEqual(17);
    expect(labelStyle.textTransform).toBeUndefined();
  });

  it('supports an optional inline recovery action', () => {
    const onAction = jest.fn();

    renderNotice({
      actionLabel: 'Retry upload',
      onAction,
    });

    fireEvent.press(screen.getByText('Retry upload'));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('keeps semantic colour in the icon instead of drawing alert boxes', () => {
    const { getByTestId, rerender } = render(
      <ThemeProvider>
        <AppInlineNotice
          testID="feedback-notice"
          tone="warning"
          title="Review before continuing"
          description="Check the result before you continue."
        />
      </ThemeProvider>
    );

    const warningStyle = StyleSheet.flatten(
      getByTestId('feedback-notice').props.style
    );
    expect(warningStyle.borderTopWidth).toBe(StyleSheet.hairlineWidth);
    expect(warningStyle.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
    expect(warningStyle.borderLeftWidth).toBeUndefined();
    expect(warningStyle.borderRadius).toBeUndefined();
    expect(warningStyle.backgroundColor).toBe('transparent');

    rerender(
      <ThemeProvider>
        <AppInlineNotice
          testID="feedback-notice"
          tone="error"
          title="Purchase failed"
          description="Nothing was charged."
        />
      </ThemeProvider>
    );

    const errorStyle = StyleSheet.flatten(
      getByTestId('feedback-notice').props.style
    );
    expect(errorStyle.backgroundColor).toBe(warningStyle.backgroundColor);
    expect(errorStyle.borderColor).toBe(warningStyle.borderColor);
  });
});
