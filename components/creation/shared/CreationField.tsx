import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { getCreationFormTokens } from '@/components/creation/shared/creation-form-tokens';

type CreationFieldProps = {
  label: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
  counterText?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelAccessory?: React.ReactNode;
};

export const CreationField: React.FC<CreationFieldProps> = ({
  label,
  required = false,
  helperText,
  errorText,
  counterText,
  children,
  style,
  labelAccessory,
}) => {
  const theme = useTheme();
  const tokens = getCreationFormTokens(theme);
  const helperColor = errorText
    ? theme.colors.status.error
    : theme.colors.text.tertiary;

  return (
    <View style={[{ gap: tokens.fieldGap }, style]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: tokens.labelSize,
            fontWeight: '600',
            color: theme.colors.text.primary,
          }}
        >
          {label}
          {required ? ' *' : ''}
        </Text>
        {labelAccessory ?? null}
      </View>

      {children}

      {errorText || helperText || counterText ? (
        <View
          style={{
            minHeight: tokens.helperSize * theme.typography.lineHeights.normal,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing.sm,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: tokens.helperSize,
              color: helperColor,
            }}
          >
            {errorText || helperText || ''}
          </Text>
          {counterText ? (
            <Text
              style={{
                fontSize: tokens.counterSize,
                color: theme.colors.text.tertiary,
              }}
            >
              {counterText}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export default CreationField;
