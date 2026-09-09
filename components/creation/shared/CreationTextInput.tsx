import React, { forwardRef } from 'react';
import { type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import {
  StandardTextInput,
  type StandardTextInputRef,
} from '@/components/ui/StandardTextInput';
import { useTheme } from '@/constants/ThemeContext';
import { getCreationFormTokens } from '@/components/creation/shared/creation-form-tokens';
import { CreationField } from '@/components/creation/shared/CreationField';

type StandardProps = React.ComponentProps<typeof StandardTextInput>;

export interface CreationTextInputProps extends Omit<
  StandardProps,
  'containerStyle' | 'inputStyle'
> {
  label: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  counterText?: string;
  fieldStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const CreationTextInput = forwardRef<
  StandardTextInputRef,
  CreationTextInputProps
>(
  (
    {
      label,
      required = false,
      helperText,
      errorText,
      counterText,
      fieldStyle,
      inputContainerStyle,
      inputStyle,
      multiline,
      numberOfLines,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const tokens = getCreationFormTokens(theme);

    return (
      <CreationField
        label={label}
        required={required}
        helperText={helperText}
        errorText={errorText}
        counterText={counterText}
        style={fieldStyle}
      >
        <StandardTextInput
          ref={ref}
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          multiline={multiline}
          numberOfLines={numberOfLines}
          containerStyle={[
            {
              minHeight: multiline
                ? tokens.inputMultilineMinHeight
                : tokens.inputMinHeight,
              borderWidth: 1,
              borderColor: errorText
                ? theme.colors.status.error
                : theme.colors.border.primary,
              borderRadius: tokens.inputRadius,
              backgroundColor: theme.colors.background.secondary,
              paddingHorizontal: tokens.inputHorizontalPadding,
              paddingVertical: tokens.inputVerticalPadding,
              alignItems: multiline ? 'flex-start' : 'center',
            },
            inputContainerStyle,
          ]}
          inputStyle={[
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.sizes.base,
              paddingVertical: multiline ? tokens.inputVerticalPadding : 0,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
        />
      </CreationField>
    );
  }
);

CreationTextInput.displayName = 'CreationTextInput';

export default CreationTextInput;
