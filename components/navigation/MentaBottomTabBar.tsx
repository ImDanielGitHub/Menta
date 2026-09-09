import React from 'react';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  HomeIcon,
  ShoppingBagIcon,
  UserIcon,
  UsersIcon,
} from '@/components/ui/icons';
import {
  mentaLayout,
  mentaSpacing,
  mentaTypography,
} from '@/constants/MentaDesignSystem';
import { useTheme } from '@/constants/ThemeContext';
import { emitHaptic } from '@/lib/motion/haptics';
import { useTranslation } from '@/lib/localization/use-translation';
import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

const VISIBLE_TABS = ['index', 'groups', 'shop-tab', 'profile'] as const;
type VisibleTab = (typeof VISIBLE_TABS)[number];

export const resolveVisibleTabLabel = (
  routeName: VisibleTab,
  options?: { tabBarLabel?: unknown; title?: string },
  localise?: (key: TranslationKey) => string
): string => {
  if (typeof options?.tabBarLabel === 'string') return options.tabBarLabel;
  if (typeof options?.title === 'string') return options.title;
  switch (routeName) {
    case 'index':
      return localise
        ? localise('navigation.tab.today')
        : translate('en-NZ', 'navigation.tab.today');
    case 'groups':
      return localise
        ? localise('navigation.tab.groups')
        : translate('en-NZ', 'navigation.tab.groups');
    case 'profile':
      return localise
        ? localise('navigation.tab.profile')
        : translate('en-NZ', 'navigation.tab.profile');
    case 'shop-tab':
      return localise
        ? localise('commerce.nav.shop')
        : translate('en-NZ', 'commerce.nav.shop');
  }
};

const isVisibleTab = (routeName: string): routeName is VisibleTab =>
  VISIBLE_TABS.some(name => name === routeName);

const TabIcon = ({ name, color }: { name: VisibleTab; color: string }) => {
  const props = { color, size: 24 };

  if (name === 'groups') return <UsersIcon {...props} />;
  if (name === 'profile') return <UserIcon {...props} />;
  if (name === 'shop-tab') return <ShoppingBagIcon {...props} />;
  return <HomeIcon {...props} />;
};

/**
 * Four primary destinations. Colour and accessibility state identify the
 * current destination without a second rounded surface around every tab.
 */
export function MentaBottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('shared.accessibility.primaryNavigation')}
      style={[
        styles.container,
        styles.bottomContainer,
        {
          paddingBottom: Math.max(insets.bottom, mentaSpacing[5]),
          paddingTop: mentaSpacing[2],
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.primary,
          borderRightColor: colors.border.primary,
        },
      ]}
      testID="menta-bottom-tab-bar"
    >
      {state.routes.map((route, index) => {
        if (!isVisibleTab(route.name)) return null;

        const selected = state.index === index;
        const options = descriptors[route.key]?.options;
        const label = resolveVisibleTabLabel(route.name, options, t);
        const accessibilityRole = Platform.OS === 'ios' ? 'button' : 'tab';
        const testID =
          route.name === 'index'
            ? 'tab-today'
            : route.name === 'shop-tab'
              ? 'tab-shop'
              : `tab-${route.name}`;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (selected || event.defaultPrevented) return;

          navigation.navigate(route.name, route.params);
          void emitHaptic({ type: 'selection' });
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole={accessibilityRole}
            accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
            accessibilityState={{ selected }}
            accessibilityHint={
              selected
                ? t('shared.accessibility.tabSelected', { label })
                : t('shared.accessibility.tabOpens', { label })
            }
            onLongPress={onLongPress}
            onPress={onPress}
            role={accessibilityRole}
            style={({ pressed }) => [
              styles.item,
              pressed && !selected ? styles.pressed : null,
            ]}
            testID={testID}
          >
            <View style={styles.itemVisual} testID={`${testID}-surface`}>
              <TabIcon
                name={route.name}
                color={selected ? colors.accent.primary : colors.text.secondary}
              />
              <Text
                accessible={false}
                maxFontSizeMultiplier={1.5}
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: selected
                      ? colors.accent.primary
                      : colors.text.secondary,
                  },
                ]}
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 88,
    alignItems: 'flex-start',
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: mentaSpacing[6],
    borderTopWidth: 1,
  },
  item: {
    flex: 1,
    minHeight: mentaLayout.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemVisual: {
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    minHeight: 56,
    maxWidth: 96,
    width: '100%',
  },
  pressed: { opacity: 0.68 },
  label: {
    ...mentaTypography.label,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0,
  },
});
