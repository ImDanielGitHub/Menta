import React from 'react';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { MentaBottomTabBar } from '@/components/navigation/MentaBottomTabBar';
import { SHARED_SHELL_PAPER_STATES } from '@/lib/paper-state-registry/shared-shell';

const routes = [
  { key: 'index-key', name: 'index', params: undefined },
  { key: 'groups-key', name: 'groups', params: undefined },
  { key: 'create-key', name: 'create', params: undefined },
  { key: 'profile-key', name: 'profile', params: undefined },
];

const galleryProps = {
  state: {
    stale: false,
    type: 'tab',
    key: 'paper-shell',
    index: 1,
    routeNames: routes.map(route => route.name),
    history: [],
    routes,
    preloadedRouteKeys: [],
  },
  descriptors: Object.fromEntries(
    routes.map(route => [
      route.key,
      {
        options: { tabBarAccessibilityLabel: route.name },
        navigation: {},
        route,
        render: () => null,
      },
    ])
  ),
  navigation: {
    emit: () => ({ defaultPrevented: false }),
    navigate: () => undefined,
  },
  insets: { top: 0, right: 0, bottom: 34, left: 0 },
} as unknown as BottomTabBarProps;

export function SharedShellGallery() {
  return (
    <MentaBottomTabBar
      {...galleryProps}
      key={SHARED_SHELL_PAPER_STATES[0].id}
    />
  );
}
