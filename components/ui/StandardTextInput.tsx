import React, { forwardRef } from 'react';
import { TextInputProps, TextStyle, ViewStyle, StyleProp } from 'react-native';
import { AppTextField, type AppTextFieldRef } from './AppFields';

export interface StandardTextInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

interface StandardTextInputProps extends Omit<TextInputProps, 'blurOnSubmit'> {
  nextInputRef?: React.RefObject<StandardTextInputRef | null>;
  onSubmitEditing?: () => void;
  dismissKeyboardOnSubmit?: boolean;
  autoCompleteType?: 'off' | 'username' | 'email' | 'password' | 'new-password';
  preventAutofill?: boolean;
  isNewPassword?: boolean;
  isConfirmPassword?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  style?: StyleProp<TextStyle>;
}

export const StandardTextInput = forwardRef<
  StandardTextInputRef,
  StandardTextInputProps
>(
  (
    {
      nextInputRef,
      onSubmitEditing,
      dismissKeyboardOnSubmit = false,
      returnKeyType,
      autoCompleteType,
      preventAutofill = false,
      isNewPassword = false,
      isConfirmPassword = false,
      secureTextEntry,
      textContentType,
      autoComplete,
      left,
      right,
      containerStyle,
      inputStyle,
      style,
      ...props
    },
    ref
  ) => {
    const resolvedAutoComplete =
      preventAutofill || isConfirmPassword
        ? 'off'
        : autoCompleteType ?? autoComplete;

    const resolvedTextContentType =
      isConfirmPassword
        ? 'none'
        : isNewPassword
          ? 'newPassword'
          : textContentType;

    return (
      <AppTextField
        {...props}
        ref={ref as React.Ref<AppTextFieldRef>}
        secureTextEntry={secureTextEntry}
        autoComplete={resolvedAutoComplete}
        textContentType={resolvedTextContentType}
        autoCapitalize={
          preventAutofill || isConfirmPassword ? 'none' : props.autoCapitalize
        }
        autoCorrect={
          preventAutofill || isConfirmPassword ? false : props.autoCorrect
        }
        nextInputRef={nextInputRef as React.RefObject<AppTextFieldRef | null>}
        dismissKeyboardOnSubmit={dismissKeyboardOnSubmit}
        onSubmitEditing={onSubmitEditing}
        left={left}
        right={right}
        containerStyle={containerStyle}
        inputStyle={inputStyle ?? style}
        returnKeyType={
          returnKeyType ??
          (dismissKeyboardOnSubmit ? 'done' : nextInputRef ? 'next' : 'done')
        }
      />
    );
  }
);

StandardTextInput.displayName = 'StandardTextInput';
