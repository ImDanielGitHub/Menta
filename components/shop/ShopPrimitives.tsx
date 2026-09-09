import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton, type AppButtonProps } from '@/components/ui/AppButton';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  AlertTriangleIcon,
  BotIcon,
  ChevronRightIcon,
  ClockIcon,
  CrownIcon,
  DiamondIcon,
  FlameIcon,
  PaletteIcon,
  RefreshCcwIcon,
  ShoppingBagIcon,
  SnowflakeIcon,
  SparklesIcon,
  WalletIcon,
  ZapIcon,
} from '@/components/ui/icons';
import {
  mentaLayout,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
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

export function formatShopCategory(
  category?: string | null,
  t: (key: import('@/lib/localization/en-NZ').TranslationKey) => string = key =>
    (
      ({
        'commerce.shop.categoryStyle': 'Style',
        'commerce.shop.categoryAi': 'AI',
        'commerce.shop.categoryBoost': 'Boost',
      }) as Record<string, string>
    )[key] ?? key
) {
  const normalized = getShopCategoryId(category);
  if (normalized === 'cosmetic') return t('commerce.shop.categoryStyle');
  if (normalized === 'ai_upgrade') return t('commerce.shop.categoryAi');
  return t('commerce.shop.categoryBoost');
}

export function ShopItemGlyph({
  item,
  color,
  size = 28,
}: {
  item: Pick<ShopDisplayItem, 'sku' | 'name'>;
  color: string;
  size?: number;
}) {
  const sku = String(item.sku || '').toLowerCase();
  const name = item.name.toLowerCase();
  const props = { size, color };

  if (sku.includes('freeze') || name.includes('freeze')) {
    return <SnowflakeIcon {...props} />;
  }
  if (sku.includes('time') || sku.includes('extension')) {
    return <ClockIcon {...props} />;
  }
  if (sku.includes('double') || sku.includes('point')) {
    return <FlameIcon {...props} />;
  }
  if (sku.includes('booster') || sku.includes('boost')) {
    return <ZapIcon {...props} />;
  }
  if (sku.includes('frame') || name.includes('frame')) {
    return <SparklesIcon {...props} />;
  }
  if (name.includes('theme')) return <PaletteIcon {...props} />;
  if (name.includes('badge')) return <DiamondIcon {...props} />;
  if (name.includes('ai') || sku.includes('ai')) return <BotIcon {...props} />;
  if (name.includes('streak')) return <CrownIcon {...props} />;
  return <SparklesIcon {...props} />;
}

export function ShopHeaderBlock({
  label,
  title,
  subtitle,
  icon,
}: {
  label: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.header}>
      <View style={styles.headerLabelRow}>
        {icon}
        <Text style={styles.headerLabel}>{label}</Text>
      </View>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function ShopMetricStrip({
  metrics,
}: {
  metrics: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    onPress?: () => void;
  }[];
}) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.metricStrip}>
      {metrics.map((metric, index) => {
        const content = (
          <>
            <View style={styles.metricTop}>
              {metric.icon}
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
          </>
        );

        if (metric.onPress) {
          return (
            <Pressable
              key={metric.label}
              accessibilityRole="button"
              onPress={metric.onPress}
              style={({ pressed }) => [
                styles.metricCell,
                index < metrics.length - 1 && styles.metricCellBorder,
                pressed && styles.pressed,
              ]}
            >
              {content}
            </Pressable>
          );
        }

        return (
          <View
            key={metric.label}
            style={[
              styles.metricCell,
              index < metrics.length - 1 && styles.metricCellBorder,
            ]}
          >
            {content}
          </View>
        );
      })}
    </View>
  );
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

export function ShopListRow({
  item,
  eyebrow,
  showCategoryLabel = true,
  stateLabel,
  rightLabel,
  actionLabel,
  actionVariant = 'primary',
  actionDisabled = false,
  actionLoading = false,
  onPress,
  onAction,
  testID,
}: {
  item: ShopDisplayItem;
  eyebrow?: string;
  showCategoryLabel?: boolean;
  stateLabel?: string;
  rightLabel?: string;
  actionLabel?: string;
  actionVariant?: AppButtonProps['variant'];
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onPress: () => void;
  onAction?: () => void;
  testID?: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { t } = useTranslation();
  const phoneLayout = usePhoneLayout();
  const useStackedAction =
    phoneLayout.isCompactWidth || phoneLayout.fontScale >= 1.2;
  const descriptionLines = useLargeTypeLineLimit(2);
  const titleLines = useLargeTypeLineLimit(1);
  const priceLines = useLargeTypeLineLimit(1);
  const description = item.description?.trim();
  const categoryLabel = showCategoryLabel
    ? eyebrow || formatShopCategory(item.category, t)
    : eyebrow;

  const itemIdentity = (
    <>
      <View style={styles.itemIconPlane}>
        <ShopItemGlyph item={item} color={theme.colors.text.primary} />
      </View>

      <View style={styles.itemCopy}>
        {categoryLabel || stateLabel ? (
          <View style={styles.itemMetaRow}>
            {categoryLabel ? (
              <Text style={styles.itemEyebrow}>{categoryLabel}</Text>
            ) : null}
            {stateLabel ? (
              <Text style={styles.itemState}>{stateLabel}</Text>
            ) : null}
          </View>
        ) : null}
        <Text numberOfLines={titleLines} style={styles.itemTitle}>
          {item.name}
        </Text>
        {description ? (
          <Text style={styles.itemDescription} numberOfLines={descriptionLines}>
            {description}
          </Text>
        ) : null}
      </View>
    </>
  );

  if (actionLabel && onAction) {
    return (
      <View
        style={[styles.itemRow, useStackedAction && styles.itemRowStacked]}
        testID={testID}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('commerce.shop.openItem', { name: item.name })}
          onPress={onPress}
          style={({ pressed }) => [
            styles.itemIdentityAction,
            pressed && styles.pressed,
          ]}
        >
          {itemIdentity}
        </Pressable>

        <View
          style={[
            styles.itemTrail,
            useStackedAction && styles.itemTrailStacked,
          ]}
        >
          <AppButton
            title={
              actionLoading ? t('commerce.accessibility.checking') : actionLabel
            }
            accessibilityLabel={`${actionLabel} ${item.name}`}
            variant={actionVariant}
            size="small"
            disabled={actionDisabled}
            loading={actionLoading}
            preserveLabelPositionOnLoading
            onPress={onAction}
            fullWidth={useStackedAction}
          />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('commerce.shop.openItem', { name: item.name })}
      onPress={onPress}
      style={({ pressed }) => [styles.itemRow, pressed && styles.pressed]}
      testID={testID}
    >
      {itemIdentity}

      <View style={styles.itemTrail}>
        {rightLabel ? (
          <Text numberOfLines={priceLines} style={styles.itemRight}>
            {rightLabel}
          </Text>
        ) : null}
        <ChevronRightIcon size={18} color={theme.colors.text.tertiary} />
      </View>
    </Pressable>
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
        <Text style={styles.sectionTitle}>{title}</Text>
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
        <View style={styles.skeletonMetricStrip} testID="shop-loading-metrics">
          {Array.from({ length: metricCount }, (_, index) => (
            <View
              key={index}
              style={[
                styles.skeletonMetric,
                index < metricCount - 1 && styles.skeletonMetricBorder,
              ]}
            >
              <SkeletonLoader
                announce={false}
                style={styles.skeletonMetricLabel}
              />
              <SkeletonLoader
                announce={false}
                style={styles.skeletonMetricValue}
              />
            </View>
          ))}
        </View>

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
            <View key={index} style={styles.skeletonRow}>
              <SkeletonLoader announce={false} style={styles.skeletonGlyph} />
              <View style={styles.skeletonCopy}>
                <SkeletonLoader
                  announce={false}
                  style={styles.skeletonEyebrow}
                />
                <SkeletonLoader announce={false} style={styles.skeletonTitle} />
                <SkeletonLoader
                  announce={false}
                  style={styles.skeletonDescription}
                />
              </View>
              <SkeletonLoader announce={false} style={styles.skeletonTrail} />
            </View>
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
        <Text style={styles.stateTitle}>{title}</Text>
        {message ? <Text style={styles.stateText}>{message}</Text> : null}
        <View style={styles.skeletonList} testID="shop-loading-skeleton">
          {[0, 1, 2, 3].map(index => (
            <View key={index} style={styles.skeletonRow}>
              <SkeletonLoader announce={false} style={styles.skeletonGlyph} />
              <View style={styles.skeletonCopy}>
                <SkeletonLoader
                  announce={false}
                  style={styles.skeletonEyebrow}
                />
                <SkeletonLoader announce={false} style={styles.skeletonTitle} />
              </View>
              <SkeletonLoader announce={false} style={styles.skeletonTrail} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const icon =
    kind === 'error' ? (
      <AlertTriangleIcon size={28} color={theme.colors.text.primary} />
    ) : (
      <ShoppingBagIcon size={28} color={theme.colors.text.primary} />
    );

  return (
    <View style={styles.statePanel} testID={testID}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.stateGlyph}
      >
        {icon}
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      {message ? <Text style={styles.stateText}>{message}</Text> : null}
      {actionTitle && onAction ? (
        <AppButton
          title={actionTitle}
          variant={kind === 'error' ? 'outline' : 'primary'}
          size="medium"
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

export function ShopWalletIcon({ size = 16 }: { size?: number }) {
  const theme = useTheme();
  return <WalletIcon size={size} color={theme.colors.text.secondary} />;
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    header: {
      gap: 9,
    },
    headerLabelRow: {
      minHeight: 22,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    headerLabel: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.labelBold,
    },
    headerTitle: {
      ...mentaTypography.display,
      color: theme.colors.text.primary,
    },
    headerSubtitle: {
      color: theme.colors.text.secondary,
      ...mentaTypography.body,
    },
    metricStrip: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
    },
    metricCell: {
      flex: 1,
      minHeight: 70,
      paddingVertical: 14,
      paddingRight: 12,
      justifyContent: 'center',
      gap: 5,
    },
    metricCellBorder: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: theme.colors.border.secondary,
    },
    metricTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    metricLabel: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.labelBold,
    },
    metricValue: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySemibold,
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
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
      paddingHorizontal: mentaSpacing[3],
    },
    filterChipSelected: {
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
    itemRow: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    itemRowStacked: {
      alignItems: 'stretch',
      flexDirection: 'column',
      gap: mentaSpacing[3],
      paddingVertical: mentaSpacing[4],
    },
    itemIdentityAction: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.992 }],
    },
    itemIconPlane: {
      width: 32,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    itemMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    itemEyebrow: {
      color: theme.colors.text.tertiary,
      ...mentaTypography.labelBold,
    },
    itemState: {
      flexShrink: 1,
      color: theme.colors.text.tertiary,
      ...mentaTypography.label,
      textAlign: 'right',
    },
    itemTitle: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySemibold,
      minWidth: 0,
    },
    itemDescription: {
      color: theme.colors.text.secondary,
      ...mentaTypography.caption,
    },
    itemTrail: {
      minWidth: 56,
      flexShrink: 0,
      alignItems: 'flex-end',
      gap: 8,
    },
    itemTrailStacked: {
      alignItems: 'stretch',
      minWidth: 0,
      width: '100%',
    },
    itemRight: {
      color: theme.colors.text.primary,
      ...mentaTypography.bodySmallMedium,
      maxWidth: 108,
      minWidth: 0,
      textAlign: 'right',
    },
    sectionHeader: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: mentaSpacing[4],
      justifyContent: 'space-between',
      paddingTop: mentaSpacing[2],
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
    skeletonMetricStrip: {
      borderBottomColor: theme.colors.border.secondary,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
    },
    skeletonMetric: {
      flex: 1,
      gap: mentaSpacing[2],
      justifyContent: 'center',
      minHeight: 70,
      paddingRight: mentaSpacing[3],
      paddingVertical: mentaSpacing[3],
    },
    skeletonMetricBorder: {
      borderRightColor: theme.colors.border.secondary,
      borderRightWidth: StyleSheet.hairlineWidth,
    },
    skeletonMetricLabel: {
      borderRadius: mentaRadii.small,
      height: 9,
      width: '58%',
    },
    skeletonMetricValue: {
      borderRadius: mentaRadii.small,
      height: 17,
      width: '76%',
    },
    skeletonFilters: {
      flexDirection: 'row',
      gap: mentaSpacing[3],
    },
    skeletonFilter: {
      borderRadius: mentaRadii.round,
      height: 36,
    },
    skeletonSection: {
      gap: mentaSpacing[2],
    },
    skeletonSectionTitle: {
      borderRadius: mentaRadii.small,
      height: 22,
      width: 132,
    },
    skeletonSectionBody: {
      borderRadius: mentaRadii.small,
      height: 12,
      width: '68%',
    },
    statePanel: {
      minHeight: 220,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 32,
      paddingHorizontal: 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border.secondary,
    },
    stateGlyph: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
    },
    stateTitle: {
      ...mentaTypography.heading,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    stateText: {
      color: theme.colors.text.secondary,
      ...mentaTypography.bodySmall,
      textAlign: 'center',
    },
    loadingState: {
      gap: 8,
      paddingTop: 4,
    },
    skeletonList: {
      marginTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border.secondary,
    },
    skeletonRow: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.secondary,
    },
    skeletonGlyph: {
      width: 28,
      height: 28,
      borderRadius: mentaRadii.small,
    },
    skeletonCopy: {
      flex: 1,
      gap: 8,
    },
    skeletonEyebrow: {
      width: 62,
      height: 8,
      borderRadius: mentaRadii.small,
    },
    skeletonTitle: {
      width: '70%',
      height: 15,
      borderRadius: mentaRadii.small,
    },
    skeletonDescription: {
      borderRadius: mentaRadii.small,
      height: 10,
      width: '88%',
    },
    skeletonTrail: {
      width: 42,
      height: 16,
      borderRadius: mentaRadii.small,
    },
  });
