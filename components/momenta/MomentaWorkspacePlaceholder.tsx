import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppScreen, AppTopBar } from '@/components/ui/AppShell';
import { AppScaledText as Text } from '@/components/ui/AppScaledText';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  mentaColors,
  mentaRadii,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTranslation } from '@/lib/localization/use-translation';
import { backOrReplace } from '@/lib/navigation/safe-back';
import {
  MomentaSectionNav,
  useMomentaPrimaryTab,
  type MomentaSection,
} from './MomentaSectionNav';

/** Interactive destination chrome while only the selected panel loads. */
export function MomentaWorkspacePlaceholder({
  section,
}: {
  section: MomentaSection;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const inPrimaryTab = useMomentaPrimaryTab();
  const title =
    section === 'shop'
      ? t('commerce.shop.title')
      : section === 'wallet'
        ? t('commerce.wallet.title')
        : t('commerce.nav.items');
  return (
    <AppScreen
      lane="working"
      scrollable
      safeArea
      hasTabBar={inPrimaryTab}
      contentContainerStyle={styles.content}
      testID={`momenta-${section}-opening`}
    >
      {!inPrimaryTab ? (
        <AppTopBar
          onBack={() => backOrReplace(router, '/(tabs)/profile')}
          backLabel={t('commerce.accessibility.goBack')}
        />
      ) : null}
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <MomentaSectionNav active={section} />
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t('commerce.shop.loadingAccount')}
        style={styles.skeleton}
      >
        <SkeletonLoader
          announce={false}
          width="100%"
          height={76}
          borderRadius={mentaRadii.large}
        />
        <SkeletonLoader
          announce={false}
          width="42%"
          height={24}
          borderRadius={mentaRadii.small}
        />
        {[0, 1, 2].map(row => (
          <View key={row} style={styles.row}>
            <SkeletonLoader
              announce={false}
              width={64}
              height={64}
              borderRadius={mentaRadii.medium}
            />
            <View style={styles.copy}>
              <SkeletonLoader
                announce={false}
                width="76%"
                height={20}
                borderRadius={mentaRadii.small}
              />
              <SkeletonLoader
                announce={false}
                width="92%"
                height={14}
                borderRadius={mentaRadii.small}
              />
            </View>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: mentaSpacing[4], gap: mentaSpacing[5] },
  title: { ...mentaTypography.heading, color: mentaColors.text.primary },
  skeleton: { gap: mentaSpacing[5] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mentaSpacing[4],
    minHeight: 88,
  },
  copy: { flex: 1, gap: mentaSpacing[2] },
});
