import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';

export type ShopReceiptFact = {
  label: string;
  value: string;
  /** Emphasise the value that changes, for example the balance after. */
  emphasis?: boolean;
};

type ShopReceiptCardProps = {
  title?: string;
  facts: readonly ShopReceiptFact[];
  testID?: string;
};

/**
 * Onboarding's cream receipt card for commerce facts that come from the
 * server or the current catalogue: price, balance and ownership.
 */
export function ShopReceiptCard({
  title,
  facts,
  testID = 'shop-receipt-card',
}: ShopReceiptCardProps) {
  if (facts.length === 0) return null;

  return (
    <View style={styles.card} testID={testID}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {facts.map((fact, index) => (
        <View
          accessible
          accessibilityLabel={`${fact.label}: ${fact.value}`}
          key={`${fact.label}:${fact.value}`}
          style={[
            styles.row,
            (index > 0 || Boolean(title)) && styles.rowDivider,
          ]}
        >
          <Text style={styles.label}>{fact.label}</Text>
          <Text style={[styles.value, fact.emphasis && styles.valueEmphasis]}>
            {fact.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: mentaColors.paper,
    borderRadius: mentaRadii.large,
    overflow: 'hidden',
    width: '100%',
  },
  title: {
    color: mentaColors.text.onPaper,
    ...mentaTypography.title,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[4],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: mentaSpacing[5],
    paddingVertical: mentaSpacing[3],
  },
  rowDivider: {
    borderTopColor: mentaColors.borderPaper,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: {
    color: mentaColors.text.mutedOnPaper,
    ...mentaTypography.bodySmall,
    flexShrink: 1,
  },
  value: {
    color: mentaColors.text.onPaper,
    ...mentaTypography.bodySmallMedium,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  valueEmphasis: {
    color: mentaColors.actionOnPaper,
    ...mentaTypography.bodySemibold,
  },
});
