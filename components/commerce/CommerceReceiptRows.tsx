import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppFieldRow } from '@/components/ui/AppFields';
import { mentaColors } from '@/constants/MentaDesignSystem';

export type CommerceReceiptFact = {
  label: string;
  value: string;
  detail?: string;
};

type CommerceReceiptRowsProps = {
  facts: readonly CommerceReceiptFact[];
  testID?: string;
};

/**
 * Family-owned receipt surface for entitlement, wallet, purchase and
 * ownership proof. It intentionally uses direct rows and dividers rather than
 * a card so every value reads as evidence, not decoration.
 */
export const CommerceReceiptRows = ({
  facts,
  testID,
}: CommerceReceiptRowsProps) => {
  if (facts.length === 0) return null;

  return (
    <View style={styles.rows} testID={testID}>
      {facts.map((fact, index) => (
        <AppFieldRow
          key={`${fact.label}:${fact.value}`}
          showChevron={false}
          showDivider={index < facts.length - 1}
          subtitle={fact.detail}
          title={fact.label}
          value={fact.value}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  rows: {
    borderBottomColor: mentaColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: mentaColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
