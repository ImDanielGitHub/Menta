import {
  type MentaPalette,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useMentaPalette, useMentaStyles } from '@/constants/use-menta-palette';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MentaMascot } from '@/components/ui/MentaMascot';

import { mentaFonts } from '@/lib/menta-fonts';
import type {
  StreakWidgetSnapshot,
  WidgetStatusTone,
} from '@/lib/widgets/widget-model';

/** In-app mirror of the Home Screen widget (Paper 19 / W02). */
export function StreakWidgetPreview({
  snapshot,
  large = false,
  size,
}: {
  snapshot: StreakWidgetSnapshot;
  large?: boolean;
  size?: 'small' | 'medium' | 'large';
}) {
  const mentaColors = useMentaPalette();
  const { STATUS_COLOR, styles } = useMentaStyles(createPaletteStyles);

  const variant = size ?? (large ? 'large' : 'medium');
  const status = snapshot.status || snapshot.action;
  const statusColor = STATUS_COLOR[snapshot.statusTone ?? 'action'];

  if (!snapshot.streak) {
    return (
      <View
        accessible
        accessibilityLabel={snapshot.accessibilityText}
        style={[styles.card, styles[variant]]}
      >
        <Text style={styles.invitationHeading}>{snapshot.heading}</Text>
        {variant !== 'small' ? (
          <Text style={styles.detail}>{snapshot.detail}</Text>
        ) : null}
        <View style={styles.flex} />
        <Text style={[styles.status, { color: mentaColors.action }]}>
          {snapshot.action}
        </Text>
      </View>
    );
  }

  const count = (
    <View>
      <Text
        style={[
          styles.number,
          variant === 'small' ? styles.numberSmall : null,
          variant === 'large' ? styles.numberLarge : null,
          snapshot.state === 'risk' ? styles.risk : null,
        ]}
      >
        {snapshot.streak}
      </Text>
      <Text style={styles.label}>{snapshot.streakLabel}</Text>
    </View>
  );
  const statusLine = (
    <Text numberOfLines={1} style={[styles.status, { color: statusColor }]}>
      {status}
    </Text>
  );

  if (variant === 'small') {
    return (
      <View
        accessible
        accessibilityLabel={snapshot.accessibilityText}
        style={[styles.card, styles.small]}
      >
        <View style={styles.row}>
          {count}
          <MentaMascot size="md" state="today-clear" style={styles.mascot} />
        </View>
        <View style={styles.flex} />
        {statusLine}
        <Text numberOfLines={1} style={styles.promiseLine}>
          {snapshot.title}
        </Text>
      </View>
    );
  }

  const week = snapshot.history.length ? (
    <View style={styles.history}>
      {snapshot.history.map((day, index) => (
        <View key={index} style={styles.day}>
          <Text style={styles.label}>{day.label}</Text>
          <Text style={styles.mark}>{day.mark}</Text>
        </View>
      ))}
    </View>
  ) : null;

  if (variant === 'medium') {
    return (
      <View
        accessible
        accessibilityLabel={snapshot.accessibilityText}
        style={[styles.card, styles.medium, styles.mediumRow]}
      >
        <View style={styles.mediumLeft}>
          {count}
          <View style={styles.flex} />
          {statusLine}
        </View>
        <View style={styles.mediumRight}>
          <Text numberOfLines={2} style={styles.promiseTitle}>
            {snapshot.title}
          </Text>
          <Text numberOfLines={2} style={styles.detail}>
            {snapshot.detail}
          </Text>
          <View style={styles.flex} />
          {week}
        </View>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={snapshot.accessibilityText}
      style={[styles.card, styles.large]}
    >
      <View style={styles.row}>
        {count}
        <MentaMascot size="lg" state="today-clear" />
      </View>
      {statusLine}
      <Text style={styles.promiseTitle}>{snapshot.title}</Text>
      <Text style={styles.detail}>{snapshot.detail}</Text>
      <View style={styles.flex} />
      {week}
    </View>
  );
}

const createPaletteStyles = (mentaColors: MentaPalette) => {
  const STATUS_COLOR: Record<WidgetStatusTone, string> = {
    action: mentaColors.action,
    warning: mentaColors.warning,
    success: mentaColors.success,
    muted: mentaColors.text.secondary,
  };
  const styles = StyleSheet.create({
    card: {
      backgroundColor: mentaColors.raised,
      borderRadius: 24,
      padding: 16,
    },
    small: { aspectRatio: 1, width: '100%' },
    medium: { minHeight: 170, width: '100%' },
    large: {
      alignSelf: 'center',
      gap: mentaSpacing[3],
      maxWidth: 430,
      minHeight: 350,
      width: '100%',
    },
    mediumRow: { flexDirection: 'row', gap: mentaSpacing[4] },
    mediumLeft: { width: 92 },
    mediumRight: { flex: 1, gap: 4 },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    flex: { flex: 1, minHeight: 8 },
    number: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.newsreader.semibold,
      fontSize: 56,
      letterSpacing: -1.6,
      lineHeight: 60,
    },
    numberSmall: { fontSize: 44, lineHeight: 48 },
    numberLarge: { fontSize: 82, lineHeight: 86 },
    risk: { color: mentaColors.warning },
    label: { ...mentaTypography.caption, color: mentaColors.text.secondary },
    status: {
      fontFamily: mentaFonts.inter.semibold,
      fontSize: 14,
      lineHeight: 18,
    },
    promiseLine: {
      ...mentaTypography.caption,
      color: mentaColors.text.muted,
    },
    promiseTitle: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.newsreader.semibold,
      fontSize: 20,
      lineHeight: 24,
    },
    invitationHeading: {
      color: mentaColors.text.primary,
      fontFamily: mentaFonts.newsreader.semibold,
      fontSize: 22,
      lineHeight: 26,
    },
    detail: { ...mentaTypography.bodySmall, color: mentaColors.text.secondary },
    mascot: { marginRight: -8, marginTop: -4 },
    history: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
    day: { alignItems: 'center', flexShrink: 1, gap: 4 },
    mark: { ...mentaTypography.bodySmall, color: mentaColors.action },
  });
  return { STATUS_COLOR, styles };
};
