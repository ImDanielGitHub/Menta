import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  ShopCollectionSkeleton,
  ShopFilterChips,
  ShopListRow,
  ShopSectionHeader,
  ShopStatePanel,
} from '@/components/shop/ShopPrimitives';
import { ThemeProvider } from '@/constants/ThemeContext';

describe('ShopCollectionSkeleton', () => {
  it('reserves the balance, filter, section and row geometry of the destination', () => {
    render(
      <ThemeProvider>
        <ShopCollectionSkeleton
          title="Loading shop"
          message="Checking current items."
          metricCount={3}
          testID="shop-loading-state"
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('shop-loading-state')).toBeTruthy();
    expect(screen.getByTestId('shop-loading-metrics')).toBeTruthy();
    expect(screen.getByTestId('shop-loading-filters')).toBeTruthy();
    expect(screen.getByTestId('shop-loading-section')).toBeTruthy();
    expect(screen.getByTestId('shop-loading-skeleton')).toBeTruthy();
    expect(screen.getByLabelText('Loading shop')).toBeTruthy();
  });

  it('can omit obsolete filter geometry when the destination uses direct shelves', () => {
    render(
      <ThemeProvider>
        <ShopCollectionSkeleton
          title="Loading shop"
          showFilters={false}
          testID="shop-loading-state"
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('shop-loading-state')).toBeTruthy();
    expect(screen.queryByTestId('shop-loading-filters')).toBeNull();
    expect(screen.getByTestId('shop-loading-section')).toBeTruthy();
  });
});

describe('ShopSectionHeader', () => {
  it('keeps section meaning and count in one readable hierarchy', () => {
    render(
      <ThemeProvider>
        <ShopSectionHeader
          title="Automatic protection"
          description="Menta applies these after an eligible missed day."
          count={2}
          testID="inventory-section-heading"
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('inventory-section-heading')).toBeTruthy();
    expect(screen.getByText('Automatic protection')).toBeTruthy();
    expect(
      screen.getByText('Menta applies these after an eligible missed day.')
    ).toBeTruthy();
    expect(screen.getByLabelText('2 items')).toBeTruthy();
  });
});

describe('ShopStatePanel', () => {
  it('uses catalogue-shaped skeleton rows while the account state loads', () => {
    render(
      <ThemeProvider>
        <ShopStatePanel
          kind="loading"
          title="Loading inventory"
          message="Checking boosts and styles tied to your account."
          testID="inventory-loading-state"
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('inventory-loading-state')).toBeTruthy();
    expect(screen.getByTestId('shop-loading-skeleton')).toBeTruthy();
    expect(screen.queryByText('No items ready yet.')).toBeNull();
  });

  it('renders the ownership-unknown recovery state without implying an empty kit', () => {
    const onRetry = jest.fn();

    render(
      <ThemeProvider>
        <ShopStatePanel
          kind="error"
          title="Your kit is unavailable."
          message="Menta could not load owned items. No equipped item was removed or changed."
          actionTitle="Try again"
          onAction={onRetry}
          testID="inventory-unavailable-state"
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId('inventory-unavailable-state')).toBeTruthy();
    expect(screen.getByText('Your kit is unavailable.')).toBeTruthy();
    expect(screen.queryByText('No items ready yet.')).toBeNull();

    fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ShopListRow', () => {
  it('does not repeat a category label inside an already grouped shelf', () => {
    render(
      <ThemeProvider>
        <ShopListRow
          item={{
            id: 'ember-theme',
            name: 'Ember Theme',
            category: 'cosmetic',
          }}
          showCategoryLabel={false}
          stateLabel="Available"
          onPress={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Ember Theme')).toBeTruthy();
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.queryByText('Style')).toBeNull();
  });

  it('keeps the inline action separate from opening item details', () => {
    const onAction = jest.fn();
    const onPress = jest.fn();

    render(
      <ThemeProvider>
        <ShopListRow
          item={{
            id: 'streak-freeze',
            name: 'Streak Freeze',
            category: 'power_up',
          }}
          actionLabel="Use"
          onAction={onAction}
          onPress={onPress}
        />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByLabelText('Use Streak Freeze'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Open Streak Freeze'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe('ShopFilterChips', () => {
  it('uses the equipped accent for the selected filter', () => {
    render(
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        <ShopFilterChips
          filters={[
            { id: 'all', label: 'All', count: 4 },
            { id: 'cosmetic', label: 'Style', count: 2 },
          ]}
          selectedId="cosmetic"
          onSelect={jest.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Style')).toHaveStyle({ color: '#E7A86D' });
    expect(screen.getByTestId('shop-filter-cosmetic')).toHaveStyle({
      borderColor: '#E7A86D',
    });
  });
});
