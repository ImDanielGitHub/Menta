import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppTopBar } from '@/components/ui';
import { mentaColors, mentaTypography } from '@/constants/MentaDesignSystem';

type SupportPageHeaderProps = {
  title: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
};

/**
 * Paper's support family keeps route controls in fixed side lanes while the
 * editorial title occupies one stable centre lane. AppTopBar still owns the
 * native back control and its accessibility behaviour.
 */
export const SupportPageHeader = ({
  title,
  onBack,
  trailing,
}: SupportPageHeaderProps) => (
  <View style={styles.header}>
    <AppTopBar
      onBack={onBack}
      style={StyleSheet.absoluteFill}
      trailing={trailing}
    />
    <View
      accessible
      accessibilityRole="header"
      pointerEvents="none"
      style={[styles.copy, !onBack && styles.copyWithoutBack]}
    >
      <Text style={styles.title}>{title}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    justifyContent: 'center',
    minHeight: 64,
    position: 'relative',
  },
  copy: {
    marginLeft: 56,
    marginRight: 56,
    minWidth: 0,
  },
  copyWithoutBack: {
    marginLeft: 0,
  },
  title: {
    color: mentaColors.text.primary,
    ...mentaTypography.title,
  },
});
