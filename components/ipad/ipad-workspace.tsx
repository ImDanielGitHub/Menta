import React from 'react';
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { mentaColors, mentaSpacing } from '@/constants/MentaDesignSystem';
import {
  IPAD_TWO_COLUMN_CONTENT_MIN,
  resolveAdaptiveLayout,
} from '@/constants/responsive-layout';

export const IPAD_PORTRAIT_WORKSPACE_MIN_WIDTH =
  IPAD_TWO_COLUMN_CONTENT_MIN + mentaSpacing[8] * 2;

export const shouldUseIPadPortraitWorkspace = (
  width: number,
  isIPad: boolean
): boolean =>
  resolveAdaptiveLayout({ width, isIPad, lane: 'working' }).workspaceEligible;

export const useIPadPortraitWorkspace = (): boolean => {
  const { width } = useWindowDimensions();
  return shouldUseIPadPortraitWorkspace(
    width,
    Platform.OS === 'ios' && Platform.isPad
  );
};

type IPadTwoPaneWorkspaceProps = {
  enabled: boolean;
  primary: React.ReactNode;
  secondary: React.ReactNode;
  primaryStyle?: StyleProp<ViewStyle>;
  secondaryStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const IPadTwoPaneWorkspace = ({
  enabled,
  primary,
  secondary,
  primaryStyle,
  secondaryStyle,
  style,
  testID,
}: IPadTwoPaneWorkspaceProps) => {
  if (!enabled) return <>{primary}</>;

  return (
    <View style={[styles.workspace, style]} testID={testID}>
      <View style={[styles.primary, primaryStyle]}>{primary}</View>
      <View style={[styles.secondary, secondaryStyle]}>{secondary}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  workspace: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[6],
    width: '100%',
  },
  primary: {
    flex: 1.72,
    minWidth: 0,
  },
  secondary: {
    alignSelf: 'stretch',
    borderLeftColor: mentaColors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: mentaSpacing[4],
    minWidth: 0,
    paddingLeft: mentaSpacing[6],
  },
});
