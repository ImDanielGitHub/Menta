import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MentaMascot } from '@/components/ui/MentaMascot';
import { StreakWidgetPreview } from '@/components/widgets/StreakWidgetPreview';
import { mentaColors } from '@/constants/MentaDesignSystem';
import type { StreakWidgetSnapshot } from '@/lib/widgets/widget-model';

const ICON = 'rgba(255, 255, 255, 0.16)';

/**
 * Paper 19 / W01: the widget shown where it will live, on a Home Screen, with
 * Menta pointing at it. Decorative; the steps below carry the instructions.
 */
export function WidgetHomeScene({
  snapshot,
}: {
  snapshot: StreakWidgetSnapshot;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.scene}
      testID="widget-home-scene"
    >
      <View style={styles.phone}>
        <View style={styles.wallpaperGlow} />
        <View style={styles.row}>
          <View style={styles.widget}>
            <StreakWidgetPreview size="small" snapshot={snapshot} />
          </View>
          <View style={styles.iconGrid}>
            <View style={styles.iconRow}>
              <View style={styles.icon} />
              <View style={styles.icon} />
            </View>
            <View style={styles.iconRow}>
              <View style={styles.icon} />
              <View style={styles.icon} />
            </View>
          </View>
        </View>
        <View style={styles.iconRow}>
          <View style={styles.icon} />
          <View style={styles.icon} />
          <View style={styles.icon} />
          <View style={styles.icon} />
        </View>
      </View>
      <View style={styles.fade} />
      <MentaMascot size="xl" state="widget-guide" style={styles.mascot} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    alignItems: 'center',
    height: 340,
    overflow: 'hidden',
    width: '100%',
  },
  phone: {
    backgroundColor: '#221A36',
    borderColor: '#232424',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    borderWidth: 8,
    borderBottomWidth: 0,
    gap: 18,
    height: 340,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 44,
    width: 356,
  },
  wallpaperGlow: {
    backgroundColor: '#3A2C5C',
    borderRadius: 400,
    height: 420,
    left: -120,
    opacity: 0.8,
    position: 'absolute',
    top: -220,
    width: 520,
  },
  row: { flexDirection: 'row', gap: 18 },
  widget: {
    borderColor: mentaColors.action,
    borderRadius: 26,
    borderWidth: 2,
    width: 144,
  },
  iconGrid: { gap: 18 },
  iconRow: { flexDirection: 'row', gap: 18 },
  icon: { backgroundColor: ICON, borderRadius: 14, height: 56, width: 56 },
  fade: {
    backgroundColor: mentaColors.canvas,
    bottom: 0,
    height: 70,
    left: 0,
    opacity: 0.85,
    position: 'absolute',
    right: 0,
  },
  mascot: { bottom: -6, position: 'absolute', right: 8 },
});
