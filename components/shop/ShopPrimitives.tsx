import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { MentaMascot } from '@/components/ui/MentaMascot';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { RefreshCcwIcon } from '@/components/ui/icons';
import {
  mentaColors,
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { normalizeShopCategory } from '@/lib/shop/powerUpSupport';
import { useTranslation } from '@/lib/localization/use-translation';
import { usePhoneLayout } from '@/constants/use-phone-layout';

export type ShopCategoryId = 'all' | 'power_up' | 'cosmetic' | 'ai_upgrade';

export type ShopDisplayItem = {
  id: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  cost?: number | null;
  category?: string | null;
  unlock_streak_days?: number | null;
};

export type ShopFilter = {
  id: ShopCategoryId;
  label: string;
  count: number;
};

export function getShopItemSku(item: Pick<ShopDisplayItem, 'id' | 'sku'>) {
  return String(item.sku || item.id || '');
}

export function getShopCategoryId(
  category?: string | null
): Exclude<ShopCategoryId, 'all'> {
  const normalized = normalizeShopCategory(category);
  if (normalized === 'cosmetic') return 'cosmetic';
  if (normalized === 'ai_upgrade') return 'ai_upgrade';
  return 'power_up';
}

export function ShopFilterChips({
  filters,
  selectedId,
  onSelect,
}: {
  filters: ShopFilter[];
  selectedId: ShopCategoryId;
  onSelect: (id: ShopCategoryId) => void;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const phoneLayout = usePhoneLayout();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.filterContent,
        { paddingHorizontal: phoneLayout.screenInset },
      ]}
      style={[
        styles.filterScroll,
        { marginHorizontal: -phoneLayout.screenInset },
      ]}
    >
      {filters.map(filter => {
        const selected = filter.id === selectedId;
        return (
          <Pressable
            key={filter.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(filter.id)}
            testID={`shop-filter-${filter.id}`}
            style={({ pressed }) => [
              styles.filterChip,
              selected && styles.filterChipSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.filterText, selected && styles.filterTextSelected]}
            >
              {filter.label}
            </Text>
            <Text
              style={[
                styles.filterCount,
                selected && styles.filterTextSelected,
              ]}
            >
              {filter.count}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function ShopSectionHeader({
  title,
  description,
  count,
  testID,
}: {
  title: string;
  description?: string;
  count?: number;
  testID?: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();

  return (
    <View style={styles.sectionHeader} testID={testID}>
      <View style={styles.sectionCopy}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.sectionDescription}>{description}</Text>
        ) : null}
      </View>
      {typeof count === 'number' ? (
        <Text
          accessibilityLabel={t('commerce.shop.itemsCount', { count })}
          style={styles.sectionCount}
        >
          {count.toLocaleString()}
        </Text>
      ) : null}
    </View>
  );
}

function SkeletonCard({ showCopyLines = 2 }: { showCopyLines?: number }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.skeletonCard}>
      <SkeletonLoader announce={false} style={styles.skeletonArt} />
      <View style={styles.skeletonCopy}>
        <SkeletonLoader announce={false} style={styles.skeletonTitle} />
        {showCopyLines > 1 ? (
          <SkeletonLoader announce={false} style={styles.skeletonDescription} />
        ) : null}
      </View>
      <SkeletonLoader announce={false} style={styles.skeletonTrail} />
    </View>
  );
}

/**
 * Destination-shaped loading: the same card, art and price geometry the shelf
 * uses, across the full content width.
 */
export function ShopCollectionSkeleton({
  title,
  message,
  metricCount = 1,
  rowCount = 4,
  showFilters = true,
  testID = 'shop-collection-loading',
}: {
  title: string;
  message?: string;
  metricCount?: number;
  rowCount?: number;
  showFilters?: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={title}
      style={styles.collectionLoading}
      testID={testID}
    >
      <View style={styles.collectionLoadingCopy}>
        <Text style={styles.collectionLoadingTitle}>{title}</Text>
        {message ? (
          <Text style={styles.collectionLoadingMessage}>{message}</Text>
        ) : null}
      </View>

      <View style={styles.collectionSkeletonBody}>
        {metricCount > 0 ? (
          <View style={styles.skeletonMetricRow} testID="shop-loading-metrics">
            {Array.from({ length: metricCount }, (_, index) => (
              <SkeletonLoader
                key={index}
                announce={false}
                style={styles.skeletonMetric}
              />
            ))}
          </View>
        ) : null}

        {showFilters ? (
          <View style={styles.skeletonFilters} testID="shop-loading-filters">
            {[70, 82, 64].map(width => (
              <SkeletonLoader
                key={width}
                announce={false}
                style={[styles.skeletonFilter, { width }]}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.skeletonSection} testID="shop-loading-section">
          <SkeletonLoader
            announce={false}
            style={styles.skeletonSectionTitle}
          />
          <SkeletonLoader announce={false} style={styles.skeletonSectionBody} />
        </View>

        <View style={styles.skeletonList} testID="shop-loading-skeleton">
          {Array.from({ length: rowCount }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </View>
      </View>
    </View>
  );
}

export function ShopStatePanel({
  kind = 'empty',
  title,
  message,
  actionTitle,
  onAction,
  testID,
}: {
  kind?: 'empty' | 'loading' | 'error';
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
  testID?: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (kind === 'loading') {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={title}
        style={styles.loadingState}
        testID={testID}
      >
        <Text style={styles.collectionLoadingTitle}>{title}</Text>
        {message ? (
          <Text style={styles.collectionLoadingMessage}>{message}</Text>
        ) : null}
        <View style={styles.skeletonList} testID="shop-loading-skeleton">
          {[0, 1, 2, 3].map(index => (
            <SkeletonCard key={index} showCopyLines={1} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.statePanel} testID={testID}>
      <MentaMascot
        state={kind === 'error' ? 'calm-warning' : 'empty-guide'}
        size="md"
      />
      <View style={styles.stateCopy}>
        <Text accessibilityRole="header" style={styles.stateTitle}>
          {title}
        </Text>
        {message ? <Text style={styles.stateText}>{message}</Text> : null}
      </View>
      {actionTitle && onAction ? (
        <AppButton
          title={actionTitle}
          variant={kind === 'error' ? 'outline' : 'accent'}
          size="large"
          fullWidth
          icon={
            kind === 'error' ? (
              <RefreshCcwIcon size={15} color={theme.colors.text.primary} />
            ) : undefined
          }
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    pressed: {
      opacity: 0.72,
    },
    filterScroll: {
      marginHorizontal: -mentaSpacing[6],
    },
    filterContent: {
      gap: mentaSpacing[2],
    },
    filterChip: {
      minHeight: mentaLayout.minimumTouchTarget,
      flexDirection: 'row',
      alignItems: 'center',
      gap: mentaSpacing[2],
      borderRadius: mentaRadii.round,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      paddingHorizontal: mentaSpacing[4],
    },
    filterChipSelected: {
      backgroundColor: mentaColors.actionSoft,
      borderColor: theme.colors.accent.primary,
    },
    filterText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmallMedium,
    },
    filterCount: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.caption,
    },
    filterTextSelected: {
      color: theme.colors.accent.primary,
    },
    sectionHeader: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: mentaSpacing[4],
      justifyContent: 'space-between',
      paddingBottom: mentaSpacing[1],
    },
    sectionCopy: {
      flex: 1,
      gap: mentaSpacing[1],
      minWidth: 0,
    },
    sectionTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
    },
    sectionDescription: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    sectionCount: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.bodySmallMedium,
      fontVariant: ['tabular-nums'],
    },
    collectionLoading: {
      gap: mentaSpacing[5],
    },
    collectionLoadingCopy: {
      gap: mentaSpacing[2],
    },
    collectionLoadingTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.title,
    },
    collectionLoadingMessage: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
    },
    collectionSkeletonBody: {
      gap: mentaSpacing[5],
    },
    skeletonMetricRow: {
      flexDirection: 'row',
      gap: mentaSpacing[3],
    },
    skeletonMetric: {
      borderRadius: mentaRadii.large,
      flex: 1,
      height: 64,
    },
    skeletonFilters: {
      flexDirection: 'row',
      gap: mentaSpacing[3],
    },
    skeletonFilter: {
      borderRadius: mentaRadii.round,
      height: 44,
    },
    skeletonSection: {
      gap: mentaSpacing[2],
    },
    skeletonSectionTitle: {
      borderRadius: mentaRadii.small,
      height: 26,
      width: 132,
    },
    skeletonSectionBody: {
      borderRadius: mentaRadii.small,
      height: 14,
      width: '68%',
    },
    skeletonList: {
      gap: mentaSpacing[3],
      marginTop: mentaSpacing[1],
    },
    skeletonCard: {
      alignItems: 'center',
      borderColor: theme.colors.border.secondary,
      borderRadius: mentaRadii.large,
      borderWidth: 1,
      flexDirection: 'row',
      gap: mentaSpacing[4],
      minHeight: 96,
      paddingHorizontal: mentaSpacing[4],
    },
    skeletonArt: {
      borderRadius: 18,
      height: 64,
      width: 64,
    },
    skeletonCopy: {
      flex: 1,
      gap: mentaSpacing[2],
    },
    skeletonTitle: {
      borderRadius: mentaRadii.small,
      height: 17,
      width: '64%',
    },
    skeletonDescription: {
      borderRadius: mentaRadii.small,
      height: 13,
      width: '90%',
    },
    skeletonTrail: {
      borderRadius: mentaRadii.round,
      height: 36,
      width: 72,
    },
    loadingState: {
      gap: mentaSpacing[2],
      paddingTop: mentaSpacing[1],
    },
    statePanel: {
      alignItems: 'center',
      gap: mentaSpacing[4],
      justifyContent: 'center',
      minHeight: 280,
      paddingVertical: mentaSpacing[6],
    },
    stateCopy: {
      alignItems: 'center',
      gap: mentaSpacing[2],
      maxWidth: mentaLayout.readingMeasure,
    },
    stateTitle: {
      ...mentaTypography.title,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    stateText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
      textAlign: 'center',
    },
  });
