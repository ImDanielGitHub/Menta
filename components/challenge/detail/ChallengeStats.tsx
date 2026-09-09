import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { usePhoneLayout } from '@/constants/use-phone-layout';

type StatRow = {
  label: string;
  value: string;
  helper?: string;
};

type ChallengeStatsProps = {
  accentColor?: string;
  title: string;
  rows: StatRow[];
  progress?: number;
};

export function ChallengeStats({
  accentColor = mentaColors.action,
  title,
  rows,
  progress,
}: ChallengeStatsProps) {
  const phoneLayout = usePhoneLayout();
  const clampedProgress =
    typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <View
      style={[styles.section, { marginHorizontal: phoneLayout.screenInset }]}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {clampedProgress !== null ? (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: accentColor, width: `${clampedProgress}%` },
            ]}
          />
        </View>
      ) : null}
      <View style={styles.rows}>
        {rows.map(row => (
          <View key={row.label} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.label}>{row.label}</Text>
              {row.helper ? (
                <Text style={styles.helper}>{row.helper}</Text>
              ) : null}
            </View>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: mentaLayout.screenInset,
    marginTop: mentaSpacing[6],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    paddingTop: mentaSpacing[4],
  },
  sectionTitle: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
    marginBottom: mentaSpacing[3],
  },
  progressTrack: {
    height: 5,
    borderRadius: mentaRadii.round,
    overflow: 'hidden',
    backgroundColor: mentaColors.border,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
  },
  rows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
  },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mentaColors.border,
    paddingVertical: 10,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16,
  },
  label: {
    ...mentaTypography.bodyMedium,
    color: mentaColors.text.primary,
  },
  helper: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
    marginTop: 3,
  },
  value: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
    textAlign: 'right',
  },
});
