import { type MentaPalette, mentaSpacing } from '@/constants/MentaDesignSystem';
import { useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  IPAD_TWO_COLUMN_CONTENT_MIN,
  resolveAdaptiveLayout,
} from '@/constants/responsive-layout';

export const IPAD_PORTRAIT_WORKSPACE_MIN_WIDTH =
  IPAD_TWO_COLUMN_CONTENT_MIN + mentaSpacing[8] * 2;

export const shouldUseIPadPortraitWorkspace = (
  width: number,
  isIPad: boolean,
  safeAreaHorizontal = 0
): boolean =>
  resolveAdaptiveLayout({ width, isIPad, safeAreaHorizontal, lane: 'working' })
    .workspaceEligible;

export const useIPadPortraitWorkspace = (): boolean => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return shouldUseIPadPortraitWorkspace(
    width,
    Platform.OS === 'ios' && Platform.isPad,
    insets.left + insets.right
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
  const { styles } = useMentaStyles(createPaletteStyles);

  if (!enabled) return <>{primary}</>;

  return (
    <View style={[styles.workspace, style]} testID={testID}>
      <View style={[styles.primary, primaryStyle]}>{primary}</View>
      <View style={[styles.secondary, secondaryStyle]}>{secondary}</View>
    </View>
  );
};

const createPaletteStyles = (mentaColors: MentaPalette) => {
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
  return { styles };
};
