import React from 'react';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MentaBottomTabBar } from '@/components/navigation/MentaBottomTabBar';
import { mentaColors } from '@/constants/MentaDesignSystem';
import { ThemeProvider } from '@/constants/ThemeContext';
import { emitHaptic } from '@/lib/motion/haptics';

jest.mock('@/lib/motion/haptics', () => ({
  emitHaptic: jest.fn(() => Promise.resolve(true)),
}));

const routes = [
  { key: 'index-key', name: 'index', params: undefined },
  { key: 'groups-key', name: 'groups', params: undefined },
  { key: 'create-key', name: 'create', params: undefined },
  { key: 'profile-key', name: 'profile', params: undefined },
  { key: 'settings-key', name: 'settings-tab', params: undefined },
  { key: 'shop-key', name: 'shop', params: undefined },
];

const buildProps = (selectedIndex = 0) => {
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();

  const props = {
    state: {
      stale: false,
      type: 'tab',
      key: 'tabs',
      index: selectedIndex,
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
          render: jest.fn(),
        },
      ])
    ),
    navigation: { emit, navigate },
    insets: { top: 0, right: 0, bottom: 34, left: 0 },
  } as unknown as BottomTabBarProps;

  return { emit, navigate, props };
};

const renderBar = (
  props: BottomTabBarProps,
  equippedThemeSku?: string | null
) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider equippedThemeSku={equippedThemeSku}>
        <MentaBottomTabBar {...props} />
      </ThemeProvider>
    </SafeAreaProvider>
  );

describe('MentaBottomTabBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the four primary destinations with selected semantics', () => {
    const { props } = buildProps();
    renderBar(props);

    expect(screen.getByTestId('menta-bottom-tab-bar')).toHaveStyle({
      backgroundColor: mentaColors.surface,
      borderTopColor: mentaColors.border,
      borderTopWidth: 1,
    });
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Together')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByTestId('tab-settings')).toBeTruthy();
    expect(screen.queryByText('Create')).toBeNull();
    expect(screen.queryByText('Shop')).toBeNull();
    expect(screen.getByTestId('tab-today').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('tab-today')).toHaveProp(
      'accessibilityRole',
      'button'
    );
    expect(screen.getByTestId('tab-today')).toHaveProp('role', 'button');
    expect(screen.getByText('Today')).toHaveProp('accessible', false);
    expect(screen.getByText('Today')).toHaveProp('numberOfLines', 1);
    expect(screen.getByText('Today')).toHaveProp('maxFontSizeMultiplier', 1.5);
    expect(screen.getByTestId('tab-today-surface')).toHaveStyle({
      backgroundColor: mentaColors.actionSoft,
      maxWidth: 96,
      minHeight: 64,
      width: '100%',
    });
    expect(screen.getByTestId('tab-groups-surface')).not.toHaveStyle({
      backgroundColor: mentaColors.actionSoft,
    });
  });

  it('emits tabPress before navigating and only haptics a real change', () => {
    const { emit, navigate, props } = buildProps();
    renderBar(props);

    fireEvent.press(screen.getByTestId('tab-groups'));

    expect(emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'groups-key',
      canPreventDefault: true,
    });
    expect(emitHaptic).toHaveBeenCalledWith({ type: 'selection' });
    expect(navigate).toHaveBeenCalledWith('groups', undefined);

    jest.clearAllMocks();
    fireEvent.press(screen.getByTestId('tab-today'));
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emitHaptic).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('honours a prevented tab event', () => {
    const { emit, navigate, props } = buildProps();
    emit.mockReturnValueOnce({ defaultPrevented: true });
    renderBar(props);

    fireEvent.press(screen.getByTestId('tab-profile'));

    expect(navigate).not.toHaveBeenCalled();
    expect(emitHaptic).not.toHaveBeenCalled();
  });

  it('uses the equipped theme across the persistent navigation shell', () => {
    const { props } = buildProps();
    renderBar(props, 'profile_theme_ember');

    expect(screen.getByTestId('menta-bottom-tab-bar')).toHaveStyle({
      backgroundColor: '#17120F',
      borderTopColor: mentaColors.border,
    });
    expect(screen.getByTestId('tab-today-surface')).toHaveStyle({
      backgroundColor: 'rgba(231, 168, 109, 0.14)',
    });
    expect(screen.getByText('Today')).toHaveStyle({ color: '#E7A86D' });
  });

  it('keeps bottom-tab semantics and uses localisation-aware visible labels', () => {
    const { props } = buildProps();
    props.descriptors['index-key'].options.title = 'Heute';
    props.descriptors['groups-key'].options.title = 'Gruppen';
    props.descriptors['profile-key'].options.title = 'Du';
    renderBar(props);

    expect(screen.getByTestId('menta-bottom-tab-bar')).toHaveProp(
      'accessibilityLabel',
      'Primary navigation'
    );
    expect(screen.getByTestId('menta-bottom-tab-bar')).toHaveStyle({
      borderTopWidth: 1,
      flexDirection: 'row',
    });
    expect(screen.getByText('Heute')).toBeTruthy();
    expect(screen.getByText('Gruppen')).toBeTruthy();
    expect(screen.getByText('Du')).toBeTruthy();
    expect(screen.getByTestId('tab-today').props.accessibilityState).toEqual({
      selected: true,
    });
  });
});
