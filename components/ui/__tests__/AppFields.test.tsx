import React, { createRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/constants/ThemeContext';
import { AppTextScaleProvider } from '@/components/ui/AppScaledText';
import {
  AppFieldRow,
  AppSecureField,
  AppSwitchRow,
  AppTextField,
  type AppTextFieldRef,
} from '../AppFields';

jest.mock('@expo/ui/swift-ui', () => {
  const React = require('react');
  const { Pressable, TextInput, View } = require('react-native');

  const useNativeState = (initialValue: string) => {
    const value = React.useRef(initialValue);
    const [, renderNativeValue] = React.useReducer(
      (version: number) => version + 1,
      0
    );
    const state = React.useRef<any>(null);

    if (!state.current) {
      state.current = {
        get: () => value.current,
        set: (nextValue: string) => {
          value.current = nextValue;
          renderNativeValue();
        },
      };
    }

    return state.current;
  };

  const NativeStateTextField = React.forwardRef(
    (
      { text, onTextChange, onFocusChange, secureTextEntry, ...props }: any,
      ref: React.Ref<any>
    ) => {
      const accessibilityLabel = props.modifiers?.find(
        (modifier: { $type?: string }) =>
          modifier.$type === 'accessibilityLabel'
      )?.label;

      React.useImperativeHandle(ref, () => ({
        focus: async () => onFocusChange?.(true),
        blur: async () => onFocusChange?.(false),
        clear: async () => {
          text?.set('');
          onTextChange?.('');
        },
        setText: async (nextValue: string) => {
          text?.set(nextValue);
          onTextChange?.(nextValue);
        },
      }));

      return (
        <TextInput
          {...props}
          accessibilityLabel={accessibilityLabel}
          secureTextEntry={secureTextEntry}
          value={text?.get() ?? ''}
          onChangeText={(nextValue: string) => {
            text?.set(nextValue);
            onTextChange?.(nextValue);
          }}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
        />
      );
    }
  );

  return {
    Host: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    TextField: NativeStateTextField,
    SecureField: React.forwardRef((props: any, ref: React.Ref<any>) => (
      <NativeStateTextField {...props} ref={ref} secureTextEntry />
    )),
    Toggle: ({
      isOn,
      onIsOnChange,
      modifiers,
    }: {
      isOn: boolean;
      onIsOnChange: (next: boolean) => void;
      modifiers?: { $type?: string; label?: string }[];
    }) => {
      const accessibilityLabel = modifiers?.find(
        (modifier: { $type?: string }) =>
          modifier.$type === 'accessibilityLabel'
      )?.label;

      return (
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="switch"
          accessibilityState={{ checked: isOn }}
          onPress={() => onIsOnChange(!isOn)}
        >
          <View />
        </Pressable>
      );
    },
    DatePicker: () => <View />,
    useNativeState,
  };
});

jest.mock('react-native-date-picker', () => 'RNDatePicker');

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('AppFields', () => {
  it('applies one viewport envelope to a field, label, and helper', () => {
    const { getByLabelText, getByText } = render(
      <TestWrapper>
        <AppTextScaleProvider scale={1.3}>
          <AppTextField
            helperText="Saved on this phone."
            label="My promise"
            multiline
            testID="scaled-field"
            value="Walk after dinner"
          />
        </AppTextScaleProvider>
      </TestWrapper>
    );

    expect(getByText('My promise')).toHaveStyle({
      fontSize: 19.5,
      lineHeight: 27.3,
    });
    expect(getByText('Saved on this phone.')).toHaveStyle({
      fontSize: 16.9,
      lineHeight: 23.4,
    });
    expect(getByLabelText('My promise')).toHaveProp('allowFontScaling', false);
    expect(getByLabelText('My promise')).toHaveStyle({
      fontSize: 20.8,
      lineHeight: 29.9,
    });
  });

  it('binds an initial default value to the SDK 56 native text state', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <AppTextField testID="native-field" defaultValue="First promise" />
      </TestWrapper>
    );

    expect(getByTestId('native-field').props.value).toBe('First promise');
  });

  it('names the SDK 56 native text field from its visible label', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <AppTextField label="Event name" testID="event-name-field" value="" />
      </TestWrapper>
    );

    expect(getByLabelText('Event name').props.testID).toBe('event-name-field');
  });

  it('prefers an explicit accessible name for the SDK 56 native field', () => {
    const { getByLabelText, queryByLabelText } = render(
      <TestWrapper>
        <AppTextField
          accessibilityLabel="Account email"
          label="Email"
          testID="email-field"
          value=""
        />
      </TestWrapper>
    );

    expect(getByLabelText('Account email').props.testID).toBe('email-field');
    expect(queryByLabelText('Email')).toBeNull();
  });

  it('names the SDK 56 native secure field from its visible label', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <AppSecureField label="Password" testID="password-field" value="" />
      </TestWrapper>
    );

    expect(getByLabelText('Password').props.testID).toBe('password-field');
  });

  it('names a React Native fallback field from its visible label', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <AppTextField
          label="What happened?"
          multiline
          testID="details-field"
          value=""
        />
      </TestWrapper>
    );

    expect(getByLabelText('What happened?').props.testID).toBe('details-field');
  });

  it('syncs controlled value updates into the SDK 56 native text state', async () => {
    const view = render(
      <TestWrapper>
        <AppTextField testID="native-field" value="Before" />
      </TestWrapper>
    );

    view.rerender(
      <TestWrapper>
        <AppTextField testID="native-field" value="After" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(view.getByTestId('native-field').props.value).toBe('After');
    });
  });

  it('reports native text changes and keeps the observable value in sync', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <AppTextField
          testID="native-field"
          defaultValue="Before"
          onChangeText={onChangeText}
        />
      </TestWrapper>
    );

    fireEvent.changeText(getByTestId('native-field'), 'After typing');

    expect(onChangeText).toHaveBeenLastCalledWith('After typing');
    expect(getByTestId('native-field').props.value).toBe('After typing');
  });

  it('exposes clear, focus and blur through the canonical field ref', () => {
    const fieldRef = createRef<AppTextFieldRef>();
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <TestWrapper>
        <AppTextField
          ref={fieldRef}
          testID="native-field"
          defaultValue="Clear me"
          onChangeText={onChangeText}
        />
      </TestWrapper>
    );

    act(() => fieldRef.current?.focus());
    expect(fieldRef.current?.isFocused()).toBe(true);

    act(() => fieldRef.current?.blur());
    expect(fieldRef.current?.isFocused()).toBe(false);

    act(() => fieldRef.current?.clear());
    expect(onChangeText).toHaveBeenLastCalledWith('');
    expect(getByTestId('native-field').props.value).toBe('');
  });

  it('triggers AppFieldRow presses', () => {
    const onPress = jest.fn();
    const { getByRole, getByText } = render(
      <TestWrapper>
        <AppFieldRow
          title="Notification Settings"
          subtitle="Adjust reminders."
          value="Enabled"
          onPress={onPress}
        />
      </TestWrapper>
    );

    expect(getByText('Enabled')).toBeTruthy();
    fireEvent.press(
      getByRole('button', {
        name: 'Notification Settings. Adjust reminders. Enabled',
      })
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('toggles AppSwitchRow values', () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <TestWrapper>
        <AppSwitchRow
          title="Daily reminders"
          subtitle="Warn me before my streak expires."
          value={false}
          onChange={onChange}
        />
      </TestWrapper>
    );

    const reminderSwitch = getByRole('switch', { name: 'Daily reminders' });
    fireEvent.press(reminderSwitch);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('gives password visibility a labelled 44pt toggle', () => {
    const { getByRole } = render(
      <TestWrapper>
        <AppSecureField label="Password" value="secret" />
      </TestWrapper>
    );

    const showPassword = getByRole('button', { name: 'Show password' });
    expect(showPassword.props.accessibilityState).toEqual({ expanded: false });
    expect(StyleSheet.flatten(showPassword.props.style)).toEqual(
      expect.objectContaining({ height: 44, width: 44 })
    );

    fireEvent.press(showPassword);

    const hidePassword = getByRole('button', { name: 'Hide password' });
    expect(hidePassword.props.accessibilityState).toEqual({ expanded: true });
  });

  it('preserves a controlled password while revealing and hiding it', () => {
    const PasswordHarness = () => {
      const [password, setPassword] = useState('secret');
      return (
        <AppSecureField
          label="Password"
          testID="password-field"
          value={password}
          onChangeText={setPassword}
        />
      );
    };

    const { getByRole, getByTestId } = render(
      <TestWrapper>
        <PasswordHarness />
      </TestWrapper>
    );

    const passwordField = getByTestId('password-field');
    expect(passwordField.props.secureTextEntry).toBe(true);
    fireEvent.changeText(passwordField, 'updated-secret');

    fireEvent.press(getByRole('button', { name: 'Show password' }));
    expect(getByTestId('password-field').props.value).toBe('updated-secret');
    expect(getByTestId('password-field').props.secureTextEntry).toBe(false);

    fireEvent.press(getByRole('button', { name: 'Hide password' }));
    expect(getByTestId('password-field').props.value).toBe('updated-secret');
    expect(getByTestId('password-field').props.secureTextEntry).toBe(true);
  });

  it('submits a native fallback field and focuses the requested next field', () => {
    const onSubmitEditing = jest.fn();
    const focusNext = jest.fn();
    const nextInputRef = {
      current: {
        focus: focusNext,
        blur: jest.fn(),
        clear: jest.fn(),
        isFocused: jest.fn(() => false),
      },
    };
    const { getByTestId } = render(
      <TestWrapper>
        <AppTextField
          testID="multiline-field"
          multiline
          nextInputRef={nextInputRef}
          onSubmitEditing={onSubmitEditing}
        />
      </TestWrapper>
    );

    fireEvent(getByTestId('multiline-field'), 'submitEditing');

    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
    expect(focusNext).toHaveBeenCalledTimes(1);
  });
});
