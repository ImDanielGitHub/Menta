import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/ThemeContext';
import { useTranslation } from '@/lib/localization/use-translation';

type BoostItem = {
  sku: string;
  label: string;
  count?: number;
  activeUntil?: string | null;
  onPress?: () => void;
  disabled?: boolean;
};

type BoostsRowProps = {
  title?: string;
  items: BoostItem[];
  reserveSpace?: boolean;
};

/**
 * BoostsRow: Consistent chips row anticipating shop features.
 * Reserve height to avoid layout shift when feature flags toggle.
 */
export const BoostsRow: React.FC<BoostsRowProps> = ({
  title,
  items,
  reserveSpace = true,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('shared.boosts.title');
  const { colors, borderRadius } = theme;

  const content = (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border.primary,
          backgroundColor: colors.background.card,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text.secondary }]}>
        {resolvedTitle}
      </Text>
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            {t('shared.boosts.empty')}
          </Text>
        </View>
      ) : (
        <View style={styles.row}>
          {items.map(it => (
            <TouchableOpacity
              key={it.sku}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.primary,
                  borderRadius: borderRadius.full,
                },
                it.disabled && { opacity: 0.5 },
              ]}
              onPress={it.onPress}
              disabled={it.disabled}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {it.label}
              </Text>
              {typeof it.count === 'number' ? (
                <View
                  style={[
                    styles.count,
                    {
                      borderColor: colors.border.primary,
                      backgroundColor: colors.background.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.text.secondary,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {it.count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (!reserveSpace && items.length === 0) return null;
  return content;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyWrap: {
    minHeight: 32,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default BoostsRow;
