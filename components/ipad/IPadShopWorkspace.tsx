import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/constants/ThemeContext';
import { mentaSpacing } from '@/constants/MentaDesignSystem';

type WorkspaceProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
};

type DetailWorkspaceProps = {
  actions: React.ReactNode;
  details: React.ReactNode;
  visual: React.ReactNode;
};

/** A full-width iPad catalogue with persistent context beside the shelves. */
export function IPadShopCatalogueWorkspace({
  children,
  sidebar,
}: WorkspaceProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.catalogue} testID="ipad-shop-catalogue-workspace">
      <View style={styles.sidebar}>{sidebar}</View>
      <View style={styles.catalogueMain}>{children}</View>
    </View>
  );
}

/** A native iPad product workspace: visual context left, decision surface right. */
export function IPadShopDetailWorkspace({
  actions,
  details,
  visual,
}: DetailWorkspaceProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.detail} testID="ipad-shop-detail-workspace">
      <View style={styles.visualPane}>{visual}</View>
      <View style={styles.detailPane}>
        <View style={styles.detailBody}>{details}</View>
        <View style={styles.actions}>{actions}</View>
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    catalogue: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: mentaSpacing[8],
      width: '100%',
    },
    sidebar: {
      flexBasis: 280,
      flexGrow: 0,
      flexShrink: 0,
      gap: mentaSpacing[5],
      minWidth: 0,
      paddingRight: mentaSpacing[6],
    },
    catalogueMain: {
      borderLeftColor: theme.colors.border.secondary,
      borderLeftWidth: StyleSheet.hairlineWidth,
      flex: 1,
      minWidth: 0,
      paddingLeft: mentaSpacing[8],
    },
    detail: {
      alignItems: 'stretch',
      flexDirection: 'row',
      gap: mentaSpacing[8],
      minHeight: 620,
      width: '100%',
    },
    visualPane: {
      flex: 1.05,
      minWidth: 0,
      paddingRight: mentaSpacing[4],
    },
    detailPane: {
      borderLeftColor: theme.colors.border.secondary,
      borderLeftWidth: StyleSheet.hairlineWidth,
      flex: 0.95,
      justifyContent: 'space-between',
      minWidth: 0,
      paddingLeft: mentaSpacing[8],
    },
    detailBody: {
      gap: mentaSpacing[6],
    },
    actions: {
      borderTopColor: theme.colors.border.secondary,
      borderTopWidth: StyleSheet.hairlineWidth,
      gap: mentaSpacing[2],
      marginTop: mentaSpacing[8],
      paddingTop: mentaSpacing[5],
    },
  });
