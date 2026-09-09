import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Avatar } from '@/components/ui/Avatar';

import {
  ClockIcon,
  PaletteIcon,
  SnowflakeIcon,
  SparklesIcon,
} from '@/components/ui/icons';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import {
  formatStreakUnlockCopy,
  getAppearanceSupport,
  getCatalogItemSku,
  getUnlockStreakDays,
  type AppearanceSupport,
} from '@/lib/shop/catalogSupport';
import {
  getPowerUpDisplayCopy,
  powerUpIsAutoConsumed,
  powerUpRequiresChallengeId,
} from '@/lib/shop/powerUpSupport';
import { useLargeTypeLineLimit } from '@/lib/accessibility';
import { useTranslation } from '@/lib/localization/use-translation';
import type { TranslationKey } from '@/lib/localization/en-NZ';

import type { ShopDisplayItem } from './ShopPrimitives';

type PreviewModel = {
  context: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  kind: 'freeze' | 'extension' | 'theme' | 'frame' | 'generic';
  factLabel: string;
  factValue: string;
  appearance?: AppearanceSupport | null;
};

type ShopItemImpactPreviewProps = {
  item: ShopDisplayItem;
  inventoryCount?: number;
  owned?: boolean;
  equipped?: boolean;
  compact?: boolean;
  testID?: string;
  profileImageUrl?: string | null;
  profileName?: string | null;
};

function buildPreviewModel({
  item,
  inventoryCount,
  owned,
  equipped,
  t,
}: {
  item: ShopDisplayItem;
  inventoryCount: number;
  owned: boolean;
  equipped: boolean;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}): PreviewModel {
  const sku = getCatalogItemSku(item);
  const powerUp = getPowerUpDisplayCopy(sku, t);
  const appearance = getAppearanceSupport(sku);
  const unlockDays = getUnlockStreakDays(sku, item.unlock_streak_days);
  const lockedUnlockCopy = unlockDays
    ? formatStreakUnlockCopy(unlockDays, t)
    : null;

  if (powerUp && powerUpIsAutoConsumed(sku)) {
    return {
      context: t('commerce.shop.automaticProtection'),
      title: t('commerce.shop.coversMissedDay'),
      body: powerUp.useSummary,
      icon: <SnowflakeIcon size={22} color={mentaColors.text.onPaper} />,
      kind: 'freeze',
      factLabel: t('commerce.shop.readyLabel'),
      factValue:
        inventoryCount > 0
          ? t('commerce.shop.availableCount', { count: inventoryCount })
          : t('commerce.shop.afterPurchase'),
    };
  }

  if (powerUp && powerUpRequiresChallengeId(sku)) {
    return {
      context: t('commerce.shop.promiseDeadline'),
      title: t('commerce.shop.addsDeadline'),
      body: t('commerce.shop.choosePromiseAfter'),
      icon: <ClockIcon size={22} color={mentaColors.text.onPaper} />,
      kind: 'extension',
      factLabel: t('commerce.shop.use'),
      factValue:
        inventoryCount > 0
          ? t('commerce.shop.ready', { count: inventoryCount })
          : t('commerce.shop.choosePromise'),
    };
  }

  if (appearance?.equipCategory === 'theme') {
    return {
      context: t('commerce.shop.appearancePreview'),
      title: t('commerce.shop.appearanceWarm', { name: appearance.label }),
      body:
        unlockDays && !owned
          ? t('commerce.shop.reachStreakAuto', { days: unlockDays })
          : t('commerce.shop.buttonsColours'),
      icon: <PaletteIcon size={22} color={mentaColors.text.onPaper} />,
      kind: 'theme',
      factLabel: t('commerce.shop.state'),
      factValue: equipped
        ? t('commerce.shop.activeNow')
        : owned
          ? t('commerce.shop.readyToEquip')
          : lockedUnlockCopy || t('commerce.shop.activatesAfterPurchase'),
      appearance,
    };
  }

  if (appearance?.equipCategory === 'avatar_frame') {
    return {
      context: t('commerce.shop.profilePreview'),
      title: t('commerce.shop.frameTitle', { name: appearance.label }),
      body:
        unlockDays && !owned
          ? t('commerce.shop.frameLockedBody', { days: unlockDays })
          : t('commerce.shop.frameProfile'),
      icon: <SparklesIcon size={22} color={mentaColors.text.onPaper} />,
      kind: 'frame',
      factLabel: t('commerce.shop.state'),
      factValue: equipped
        ? t('commerce.shop.activeNow')
        : owned
          ? t('commerce.shop.readyToEquip')
          : lockedUnlockCopy || t('commerce.shop.activatesAfterPurchase'),
      appearance,
    };
  }

  return {
    context: t('commerce.shop.itemOutcome'),
    title: t('commerce.shop.underYourItems', { name: item.name }),
    body: item.description?.trim() || t('commerce.shop.genericReview'),
    icon: <SparklesIcon size={22} color={mentaColors.text.onPaper} />,
    kind: 'generic',
    factLabel: t('commerce.shop.access'),
    factValue:
      owned || inventoryCount > 0
        ? t('commerce.shop.owned')
        : t('commerce.shop.afterPurchase'),
  };
}

function FreezeDiagram() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.freezeDays}
    >
      {[0, 1, 2, 3, 4, 5, 6].map(day => (
        <View
          key={day}
          testID="shop-impact-freeze-day"
          style={[
            styles.freezeDay,
            day < 3 && styles.freezeDayComplete,
            day === 3 && styles.freezeDayProtected,
          ]}
        >
          {day === 3 ? (
            <SnowflakeIcon size={15} color={mentaColors.text.onPaper} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function ExtensionDiagram({ t }: { t: (key: TranslationKey) => string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.timeline}
    >
      <View style={styles.timelinePoint} />
      <View style={styles.timelineLine} />
      <View style={[styles.timelinePoint, styles.timelineDuePoint]} />
      <View style={[styles.timelineLine, styles.timelineExtendedLine]} />
      <View style={[styles.timelinePoint, styles.timelineExtendedPoint]} />
      <View style={styles.timelineLabels}>
        <Text style={styles.timelineLabel}>{t('commerce.shop.now')}</Text>
        <Text style={styles.timelineLabel}>{t('commerce.shop.due')}</Text>
        <Text style={styles.timelineLabel}>
          {t('commerce.shop.plusTwelveHours')}
        </Text>
      </View>
    </View>
  );
}

function AppearanceDiagram({
  kind,
  appearance,
  profileImageUrl,
  profileName,
  t,
}: {
  kind: 'theme' | 'frame';
  appearance?: AppearanceSupport | null;
  profileImageUrl?: string | null;
  profileName?: string | null;
  t: (key: TranslationKey) => string;
}) {
  const profileNameLines = useLargeTypeLineLimit(1);
  if (kind === 'frame') {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.profilePreview}
      >
        <Avatar
          frameSku={appearance?.sku}
          name={profileName || 'You'}
          size={60}
          source={profileImageUrl ? { uri: profileImageUrl } : undefined}
          style={styles.profileAvatar}
          testID="shop-frame-profile-preview"
        />
        <View style={styles.profileLines}>
          <Text numberOfLines={profileNameLines} style={styles.profileName}>
            {profileName?.trim() || 'You'}
          </Text>
          <Text style={styles.profileMeta}>
            {t('commerce.shop.profilePreview')}
          </Text>
        </View>
      </View>
    );
  }

  const accent = appearance?.theme?.primary || mentaColors.actionOnPaper;
  const secondary = appearance?.theme?.secondary || mentaColors.action;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.themePreview}
    >
      <View style={[styles.themeAccent, { backgroundColor: accent }]} />
      <View style={styles.themeCopy}>
        <View style={styles.themeLineStrong} />
        <View style={styles.themeLine} />
      </View>
      <View style={[styles.themeAction, { backgroundColor: secondary }]} />
    </View>
  );
}

export function ShopItemImpactPreview({
  item,
  inventoryCount = 0,
  owned = false,
  equipped = false,
  compact = false,
  testID = 'shop-item-impact-preview',
  profileImageUrl,
  profileName,
}: ShopItemImpactPreviewProps) {
  const { t } = useTranslation();
  const model = useMemo(
    () => buildPreviewModel({ item, inventoryCount, owned, equipped, t }),
    [equipped, inventoryCount, item, owned, t]
  );

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${model.context}. ${model.title} ${
        model.kind === 'frame' && profileName?.trim()
          ? `Previewed for ${profileName.trim()}. `
          : ''
      }${model.body} ${model.factLabel}: ${model.factValue}.`}
      style={[styles.container, compact && styles.containerCompact]}
      testID={testID}
    >
      <View style={styles.headingRow}>
        <View style={styles.iconPlane}>{model.icon}</View>
        <Text style={styles.context}>{model.context}</Text>
      </View>

      <Text style={[styles.title, compact && styles.titleCompact]}>
        {model.title}
      </Text>
      <Text style={styles.body}>{model.body}</Text>

      {!compact || model.kind === 'frame' ? (
        <View style={[styles.diagram, compact && styles.diagramCompact]}>
          {model.kind === 'freeze' ? <FreezeDiagram /> : null}
          {model.kind === 'extension' ? <ExtensionDiagram t={t} /> : null}
          {model.kind === 'theme' || model.kind === 'frame' ? (
            <AppearanceDiagram
              kind={model.kind}
              appearance={model.appearance}
              profileImageUrl={profileImageUrl}
              profileName={profileName}
              t={t}
            />
          ) : null}
          {model.kind === 'generic' ? (
            <View style={styles.genericDiagram}>
              <SparklesIcon size={20} color={mentaColors.actionOnPaper} />
              <View style={styles.genericLine} />
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.factRow}>
        <Text style={styles.factLabel}>{model.factLabel}</Text>
        <Text style={styles.factValue}>{model.factValue}</Text>
      </View>
    </View>
  );
}

export function ShopItemImpactSkeleton({
  compact = false,
  testID = 'shop-item-impact-skeleton',
}: {
  compact?: boolean;
  testID?: string;
}) {
  return (
    <View
      accessible={false}
      style={[styles.container, compact && styles.containerCompact]}
      testID={testID}
    >
      <View style={styles.headingRow}>
        <SkeletonLoader announce={false} style={styles.skeletonIcon} />
        <SkeletonLoader announce={false} style={styles.skeletonContext} />
      </View>
      <SkeletonLoader announce={false} style={styles.skeletonTitle} />
      <SkeletonLoader announce={false} style={styles.skeletonBody} />
      <View
        style={styles.skeletonDiagram}
        testID="shop-impact-skeleton-diagram"
      >
        <SkeletonLoader announce={false} style={styles.skeletonDiagramLine} />
        <SkeletonLoader
          announce={false}
          style={styles.skeletonDiagramLineShort}
        />
      </View>
      <View style={styles.factRow}>
        <SkeletonLoader announce={false} style={styles.skeletonFactLabel} />
        <SkeletonLoader announce={false} style={styles.skeletonFactValue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: mentaColors.paper,
    borderColor: mentaColors.borderPaper,
    borderCurve: 'continuous',
    borderRadius: mentaRadii.large,
    borderWidth: 1,
    gap: mentaSpacing[3],
    padding: mentaSpacing[5],
  },
  containerCompact: {
    gap: mentaSpacing[2],
    padding: mentaSpacing[4],
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[2],
  },
  iconPlane: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  context: {
    color: mentaColors.text.mutedOnPaper,
    ...mentaTypography.bodySmallMedium,
  },
  title: {
    color: mentaColors.text.onPaper,
    ...mentaTypography.journeyTitle,
  },
  titleCompact: {
    ...mentaTypography.title,
  },
  body: {
    color: mentaColors.text.mutedOnPaper,
    ...mentaTypography.bodySmall,
  },
  skeletonIcon: {
    borderRadius: mentaRadii.medium,
    height: 32,
    width: 32,
  },
  skeletonContext: {
    borderRadius: mentaRadii.small,
    height: 12,
    width: 126,
  },
  skeletonTitle: {
    borderRadius: mentaRadii.small,
    height: 26,
    width: '88%',
  },
  skeletonBody: {
    borderRadius: mentaRadii.small,
    height: 13,
    width: '96%',
  },
  skeletonDiagram: {
    gap: mentaSpacing[2],
    justifyContent: 'center',
    minHeight: 78,
  },
  skeletonDiagramLine: {
    borderRadius: mentaRadii.small,
    height: 18,
    width: '100%',
  },
  skeletonDiagramLineShort: {
    borderRadius: mentaRadii.small,
    height: 12,
    width: '64%',
  },
  skeletonFactLabel: {
    borderRadius: mentaRadii.small,
    height: 11,
    width: 72,
  },
  skeletonFactValue: {
    borderRadius: mentaRadii.small,
    height: 13,
    width: 108,
  },
  diagram: {
    minHeight: 78,
    justifyContent: 'center',
  },
  diagramCompact: {
    minHeight: 60,
  },
  factRow: {
    alignItems: 'center',
    borderTopColor: mentaColors.borderPaper,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: mentaSpacing[3],
  },
  factLabel: {
    color: mentaColors.text.mutedOnPaper,
    ...mentaTypography.bodySmall,
  },
  factValue: {
    color: mentaColors.text.onPaper,
    ...mentaTypography.bodySmallMedium,
  },
  freezeDays: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[1],
    justifyContent: 'space-between',
  },
  freezeDay: {
    alignItems: 'center',
    backgroundColor: mentaColors.paperPressed,
    borderColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.small,
    borderWidth: 1,
    flex: 1,
    height: 38,
    justifyContent: 'center',
    maxWidth: 34,
    minWidth: 0,
  },
  freezeDayComplete: {
    backgroundColor: mentaColors.successSoft,
    borderColor: mentaColors.success,
  },
  freezeDayProtected: {
    backgroundColor: 'rgba(184, 140, 255, 0.18)',
    borderColor: mentaColors.actionOnPaper,
  },
  timeline: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: mentaSpacing[5],
    position: 'relative',
  },
  timelinePoint: {
    backgroundColor: mentaColors.text.mutedOnPaper,
    borderRadius: mentaRadii.round,
    height: 12,
    width: 12,
  },
  timelineDuePoint: {
    backgroundColor: mentaColors.text.onPaper,
  },
  timelineExtendedPoint: {
    backgroundColor: mentaColors.actionOnPaper,
  },
  timelineLine: {
    backgroundColor: mentaColors.borderPaper,
    flex: 1,
    height: 2,
  },
  timelineExtendedLine: {
    backgroundColor: mentaColors.actionOnPaper,
  },
  timelineLabels: {
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  timelineLabel: {
    color: mentaColors.text.mutedOnPaper,
    ...mentaTypography.caption,
  },
  themePreview: {
    alignItems: 'center',
    backgroundColor: mentaColors.canvas,
    borderCurve: 'continuous',
    borderRadius: mentaRadii.medium,
    flexDirection: 'row',
    gap: mentaSpacing[3],
    minHeight: 68,
    padding: mentaSpacing[3],
  },
  themeAccent: {
    borderRadius: mentaRadii.medium,
    height: 40,
    width: 40,
  },
  themeCopy: {
    flex: 1,
    gap: mentaSpacing[2],
  },
  themeLineStrong: {
    backgroundColor: mentaColors.text.primary,
    borderRadius: mentaRadii.round,
    height: 7,
    width: '72%',
  },
  themeLine: {
    backgroundColor: mentaColors.text.muted,
    borderRadius: mentaRadii.round,
    height: 5,
    width: '52%',
  },
  themeAction: {
    borderRadius: mentaRadii.round,
    height: 30,
    width: 30,
  },
  profilePreview: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[4],
  },
  profileAvatar: {
    flexShrink: 0,
  },
  profileLines: {
    flex: 1,
    gap: mentaSpacing[2],
    minWidth: 0,
  },
  profileName: {
    color: mentaColors.text.onPaper,
    ...mentaTypography.bodyMedium,
  },
  profileMeta: {
    color: mentaColors.text.mutedOnPaper,
    ...mentaTypography.bodySmall,
  },
  genericDiagram: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mentaSpacing[3],
  },
  genericLine: {
    backgroundColor: mentaColors.borderPaper,
    borderRadius: mentaRadii.round,
    flex: 1,
    height: 2,
  },
});
