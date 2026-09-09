import React from 'react';
import { Text, View, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  text: string;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          fontSize: 10,
        };
      case 'medium':
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 14,
        };
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getVariantColors = () => {
    switch (variant) {
      case 'error':
        return { bg: '#ef4444', foreground: '#ffffff', border: '#ef4444' };
      case 'warning':
        return { bg: '#f59e0b', foreground: '#ffffff', border: '#f59e0b' };
      case 'success':
        return { bg: '#10b981', foreground: '#ffffff', border: '#10b981' };
      case 'info':
        return { bg: '#3b82f6', foreground: '#ffffff', border: '#3b82f6' };
      case 'secondary':
        return { bg: '#6b7280', foreground: '#ffffff', border: '#6b7280' };
      case 'outline':
        return { bg: 'transparent', foreground: '#6b7280', border: '#d4d4d4' };
      default:
        return { bg: '#3b82f6', foreground: '#ffffff', border: '#3b82f6' };
    }
  };

  const colors = getVariantColors();

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          borderRadius: 4,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            color: colors.foreground,
            fontSize: sizeStyles.fontSize,
            fontWeight: '600',
            textTransform: 'uppercase',
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};
