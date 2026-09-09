import React, { createContext, useContext } from 'react';
import { useRouter, type Href } from 'expo-router';

import {
  AppSegmentedControl,
  type AppSegmentedOption,
} from '@/components/ui/AppSegmentedControl';
import { useTranslation } from '@/lib/localization/use-translation';

export type MomentaSection = 'wallet' | 'shop' | 'items';

const ROUTES: Record<MomentaSection, Href> = {
  wallet: '/momenta',
  shop: '/shop',
  items: '/inventory',
};

export const MomentaSectionContext = createContext<{
  active: MomentaSection | null;
  inPrimaryTab: boolean;
  select: (section: MomentaSection) => void;
} | null>(null);

export function useMomentaPrimaryTab() {
  return useContext(MomentaSectionContext)?.inPrimaryTab ?? false;
}

export function useMomentaSectionNavigation() {
  const workspace = useContext(MomentaSectionContext);
  const router = useRouter();
  return workspace?.select ?? (section => router.replace(ROUTES[section]));
}

export function useMomentaSectionIsActive(section: MomentaSection) {
  const workspace = useContext(MomentaSectionContext);
  return !workspace || workspace.active === section;
}

export function MomentaSectionNav({ active }: { active: MomentaSection }) {
  const selectSection = useMomentaSectionNavigation();
  const { t } = useTranslation();
  const options: readonly AppSegmentedOption<MomentaSection>[] = [
    { label: t('commerce.nav.wallet'), value: 'wallet' },
    { label: t('commerce.nav.shop'), value: 'shop' },
    { label: t('commerce.nav.items'), value: 'items' },
  ];

  return (
    <AppSegmentedControl
      accessibilityLabel={t('commerce.nav.sections')}
      onChange={selectSection}
      options={options}
      testID="momenta-section-nav"
      value={active}
    />
  );
}
