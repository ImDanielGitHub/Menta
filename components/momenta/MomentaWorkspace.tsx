import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useIsFocused } from 'expo-router/react-navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  MomentaSectionContext,
  type MomentaSection,
} from './MomentaSectionNav';
import { MomentaWorkspacePlaceholder } from './MomentaWorkspacePlaceholder';

// Commit the selected section and its layout before evaluating commerce SDKs.
// Loaded panels stay mounted, so returning preserves their data and scroll.
const loadPanel = <T,>(load: () => Promise<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    const run = () => void load().then(resolve, reject);
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run);
    else run();
  });

const sections = {
  wallet: lazy(() => loadPanel(() => import('./screens/WalletScreen'))),
  shop: lazy(() => loadPanel(() => import('./screens/ShopScreen'))),
  items: lazy(() => loadPanel(() => import('./screens/InventoryScreen'))),
};

const MomentaPanel = React.memo(function MomentaPanel({
  section,
  visible,
  focused,
  inPrimaryTab,
  select,
}: {
  section: MomentaSection;
  visible: boolean;
  focused: boolean;
  inPrimaryTab: boolean;
  select: (section: MomentaSection) => void;
}) {
  const navigation = useMemo(
    () => ({
      active: visible && focused ? section : null,
      select,
      inPrimaryTab,
    }),
    [focused, inPrimaryTab, section, select, visible]
  );
  const Screen = sections[section];
  return (
    <MomentaSectionContext.Provider value={navigation}>
      <View
        style={{ flex: 1, display: visible ? 'flex' : 'none' }}
        pointerEvents={visible ? 'auto' : 'none'}
        accessibilityElementsHidden={!visible}
        importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      >
        <Suspense fallback={<MomentaWorkspacePlaceholder section={section} />}>
          <Screen />
        </Suspense>
      </View>
    </MomentaSectionContext.Provider>
  );
});

export function MomentaWorkspace({
  initialSection,
  inPrimaryTab = false,
}: {
  initialSection: MomentaSection;
  inPrimaryTab?: boolean;
}) {
  const userId = useAuthStore(state => state.user?.id);
  return (
    <MomentaWorkspaceTabs
      key={userId ?? 'signed-out'}
      initialSection={initialSection}
      inPrimaryTab={inPrimaryTab}
    />
  );
}

function MomentaWorkspaceTabs({
  initialSection,
  inPrimaryTab,
}: {
  initialSection: MomentaSection;
  inPrimaryTab: boolean;
}) {
  const [active, setActive] = useState(initialSection);
  const isFocused = useIsFocused();
  const [visited, setVisited] = useState<ReadonlySet<MomentaSection>>(
    () => new Set([initialSection])
  );
  const select = useCallback((section: MomentaSection) => {
    setVisited(current =>
      current.has(section) ? current : new Set([...current, section])
    );
    setActive(section);
  }, []);
  return (
    <>
      {(Object.keys(sections) as MomentaSection[]).map(section => {
        if (!visited.has(section)) return null;
        return (
          <MomentaPanel
            key={section}
            section={section}
            visible={section === active}
            focused={isFocused && section === active}
            inPrimaryTab={inPrimaryTab}
            select={select}
          />
        );
      })}
    </>
  );
}
