import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization';
import type { ProfileFollowThroughDay } from '@/lib/profile/follow-through';

export const ProfileFollowThroughChart = ({
  days,
  currentStreak,
  activePromiseCount,
  groupCount,
  onOpenHistory,
}: {
  days: readonly ProfileFollowThroughDay[];
  currentStreak: number;
  activePromiseCount: number;
  groupCount: number;
  onOpenHistory: () => void;
}) => {
  const { t } = useTranslation();
  const defaultDay = useMemo(
    () =>
      [...days].reverse().find(day => day.approvedProofs > 0) ?? days.at(-1),
    [days]
  );
  const [selectedLocalDay, setSelectedLocalDay] = useState(
    defaultDay?.localDay ?? ''
  );
  const selected =
    days.find(day => day.localDay === selectedLocalDay) ?? defaultDay;
  const maximum = Math.max(1, ...days.map(day => day.approvedProofs));

  if (!selected) return null;

  const selectedOutcome =
    selected.outcome === 'missed'
      ? t('todayProof.streak.missed')
      : selected.outcome === 'protected'
        ? t('todayProof.residual.a_previous_day_was_protected')
        : null;

  return (
    <View style={styles.section} testID="profile-rhythm-panel">
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('fullAuth.tabs_profile.your_rhythm')}
          </Text>
          <Text style={styles.range}>{t('todayProof.residual.this_week')}</Text>
        </View>
        <Pressable
          accessibilityLabel={t('todayProof.promise.proof_history')}
          accessibilityRole="button"
          onPress={onOpenHistory}
          style={({ pressed }) => [
            styles.historyAction,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.historyActionText}>
            {t('todayProof.promise.proof_history')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.plot}
        horizontal
        showsHorizontalScrollIndicator={false}
        testID="profile-follow-through-plot"
      >
        {days.map(day => {
          const selectedBar = day.localDay === selected.localDay;
          const barHeight = Math.max(
            4,
            Math.round((day.approvedProofs / maximum) * 80)
          );
          const outcomeLabel =
            day.outcome === 'missed'
              ? t('todayProof.streak.missed')
              : day.outcome === 'protected'
                ? t('todayProof.residual.a_previous_day_was_protected')
                : null;
          const label = [
            day.longLabel,
            t('todayProof.profile.approved_proof_count', {
              count: day.approvedProofs,
            }),
            outcomeLabel,
          ]
            .filter(Boolean)
            .join('. ');

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedBar }}
              key={day.localDay}
              onPress={() => setSelectedLocalDay(day.localDay)}
              style={({ pressed }) => [
                styles.day,
                selectedBar ? styles.daySelected : null,
                pressed ? styles.pressed : null,
              ]}
              testID={`profile-follow-through-${day.localDay}`}
            >
              <View style={styles.barLane}>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight },
                    selectedBar ? styles.barSelected : null,
                    day.outcome === 'missed' ? styles.barMissed : null,
                    day.outcome === 'protected' ? styles.barProtected : null,
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{day.shortLabel}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View accessible accessibilityRole="summary" style={styles.selection}>
        <Text style={styles.selectionDay}>{selected.longLabel}</Text>
        <Text style={styles.selectionValue}>
          {t('todayProof.profile.approved_proof_count', {
            count: selected.approvedProofs,
          })}
        </Text>
        {selectedOutcome ? (
          <Text style={styles.selectionOutcome}>{selectedOutcome}</Text>
        ) : null}
      </View>
      <View style={styles.facts}>
        <View style={styles.fact}>
          <Text selectable style={styles.factValue}>
            {currentStreak}
          </Text>
          <Text style={styles.factLabel}>
            {t('fullAuth.tabs_profile.day_streak')}
          </Text>
        </View>
        <View style={styles.fact}>
          <Text selectable style={styles.factValue}>
            {activePromiseCount}
          </Text>
          <Text style={styles.factLabel}>
            {t('fullAuth.tabs_profile.active_promises')}
          </Text>
        </View>
        <View style={styles.fact}>
          <Text selectable style={styles.factValue}>
            {groupCount}
          </Text>
          <Text style={styles.factLabel}>
            {t('fullAuth.tabs_profile.groups')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: mentaSpacing[4],
    paddingVertical: mentaSpacing[5],
  },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: mentaSpacing[4],
    justifyContent: 'space-between',
  },
  headingCopy: { flex: 1, gap: 2, minWidth: 0 },
  title: { ...mentaTypography.title, color: mentaColors.text.primary },
  range: { ...mentaTypography.caption, color: mentaColors.text.secondary },
  historyAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: mentaLayout.minimumTouchTarget,
    paddingHorizontal: mentaSpacing[2],
  },
  historyActionText: {
    ...mentaTypography.bodySmallMedium,
    color: mentaColors.action,
  },
  plot: { gap: mentaSpacing[2], paddingRight: mentaSpacing[2] },
  day: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: mentaRadii.small,
    borderWidth: 1,
    justifyContent: 'flex-end',
    minHeight: 124,
    paddingBottom: mentaSpacing[2],
    paddingHorizontal: mentaSpacing[1],
    width: mentaLayout.minimumTouchTarget,
  },
  daySelected: { backgroundColor: mentaColors.actionSoft },
  barLane: { height: 84, justifyContent: 'flex-end' },
  bar: {
    backgroundColor: mentaColors.raised,
    borderRadius: mentaRadii.round,
    width: 18,
  },
  barSelected: { backgroundColor: mentaColors.action },
  barMissed: { backgroundColor: mentaColors.danger },
  barProtected: { backgroundColor: mentaColors.warning },
  dayLabel: { ...mentaTypography.micro, color: mentaColors.text.secondary },
  selection: { gap: 2 },
  selectionDay: {
    ...mentaTypography.bodySemibold,
    color: mentaColors.text.primary,
  },
  selectionValue: {
    ...mentaTypography.caption,
    color: mentaColors.text.secondary,
  },
  selectionOutcome: { ...mentaTypography.caption, color: mentaColors.warning },
  facts: {
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: mentaSpacing[4],
    paddingTop: mentaSpacing[4],
  },
  fact: { flex: 1, gap: 2 },
  factValue: {
    ...mentaTypography.title,
    color: mentaColors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  factLabel: { ...mentaTypography.micro, color: mentaColors.text.secondary },
  pressed: { opacity: 0.72 },
});
