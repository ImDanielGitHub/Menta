import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import {
  ShopItemImpactPreview,
  ShopItemImpactSkeleton,
} from '@/components/shop/ShopItemImpactPreview';
import { ThemeProvider } from '@/constants/ThemeContext';

describe('ShopItemImpactPreview', () => {
  it('explains automatic streak protection before purchase', () => {
    render(
      <ThemeProvider>
        <ShopItemImpactPreview
          item={{
            id: 'freeze-1',
            sku: 'streak_freeze_basic',
            name: 'Streak Freeze',
            category: 'power_up',
          }}
          inventoryCount={2}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Automatic protection')).toBeTruthy();
    expect(
      screen.getByText('Covers the next eligible missed day.')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Menta uses one automatically after an eligible missed day.'
      )
    ).toBeTruthy();
    expect(screen.getByText('2 available')).toBeTruthy();
  });

  it('makes the 12-hour deadline outcome explicit', () => {
    render(
      <ThemeProvider>
        <ShopItemImpactPreview
          item={{
            id: 'extension-1',
            sku: 'time_extension_1',
            name: '12-hour Extension',
            category: 'power_up',
          }}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Promise deadline')).toBeTruthy();
    expect(screen.getByText('Moves one deadline 12 hours later.')).toBeTruthy();
    expect(
      screen.getByText(
        'Choose the active promise after purchase or later from Your items.'
      )
    ).toBeTruthy();
  });

  it('explains the visible theme update in user-facing language', () => {
    render(
      <ThemeProvider>
        <ShopItemImpactPreview
          item={{
            id: 'theme-1',
            sku: 'profile_theme_ember',
            name: 'Ember Theme',
            category: 'cosmetic',
          }}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Appearance preview')).toBeTruthy();
    expect(
      screen.getByText('Ember Theme gives Menta a warmer look.')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Buttons, highlights and selected items use Ember’s warm colours.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Activates after purchase')).toBeTruthy();
    expect(screen.queryByText(/semantic|stay the same/i)).toBeNull();
  });

  it('distinguishes an owned appearance from one that still needs buying', () => {
    render(
      <ThemeProvider>
        <ShopItemImpactPreview
          item={{
            id: 'theme-owned',
            sku: 'profile_theme_ember',
            name: 'Ember Theme',
            category: 'cosmetic',
          }}
          owned
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Ready to equip')).toBeTruthy();
    expect(screen.queryByText('Activates after purchase')).toBeNull();
  });

  it('tells the truth about streak-gated frames before they are owned', () => {
    render(
      <ThemeProvider>
        <ShopItemImpactPreview
          item={{
            id: 'frame-week',
            sku: 'avatar_frame_week',
            name: 'Week Frame',
            category: 'cosmetic',
          }}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('Profile preview')).toBeTruthy();
    expect(
      screen.getByText('Week Frame frames your profile photo.')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Reach a 7-day streak. The frame appears on your profile photo once unlocked.'
      )
    ).toBeTruthy();
    expect(screen.getByText('Unlocks after a 7-day streak')).toBeTruthy();
    expect(
      screen.getByTestId('shop-frame-profile-preview', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
  });

  it('uses the signed-in person in each frame preview', () => {
    render(
      <ThemeProvider>
        <ShopItemImpactPreview
          item={{
            id: 'frame-season',
            sku: 'avatar_frame_season',
            name: 'Season Frame',
            category: 'cosmetic',
          }}
          profileImageUrl="https://cdn.example.com/profile.jpg"
          profileName="Daniel Aneke"
        />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('shop-frame-profile-preview', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(
      screen.getByText('Daniel Aneke', { includeHiddenElements: true })
    ).toBeTruthy();
    expect(screen.getByLabelText(/Previewed for Daniel Aneke/)).toBeTruthy();
    expect(
      screen
        .UNSAFE_getAllByType(Image)
        .some(
          image =>
            image.props.source?.uri === 'https://cdn.example.com/profile.jpg'
        )
    ).toBe(true);
    expect(
      screen.getByTestId('avatar-frame-artwork-avatar_frame_season', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
  });

  it.each([
    'avatar_gold_frame',
    'avatar_gradient_frame',
    'avatar_frame_ice',
    'avatar_frame_neon',
    'avatar_frame_obsidian',
    'avatar_frame_spark',
    'avatar_frame_week',
    'avatar_frame_fortnight',
    'avatar_frame_month',
    'avatar_frame_season',
  ])('renders the artwork selected for %s', sku => {
    render(
      <ThemeProvider>
        <ShopItemImpactPreview
          item={{ id: sku, sku, name: 'Profile frame', category: 'cosmetic' }}
          profileName="Daniel Aneke"
        />
      </ThemeProvider>
    );

    const artwork = screen.getByTestId(`avatar-frame-artwork-${sku}`, {
      includeHiddenElements: true,
    });
    expect(artwork.props.accessible).toBe(false);
    expect(artwork.props.source).toBeTruthy();
  });

  it('keeps the selected frame visible in the compact purchase preview', () => {
    render(
      <ThemeProvider>
        <ShopItemImpactPreview
          compact
          item={{
            id: 'avatar-frame-month',
            sku: 'avatar_frame_month',
            name: 'Month Frame',
            category: 'cosmetic',
          }}
          profileName="Daniel Aneke"
        />
      </ThemeProvider>
    );

    expect(
      screen.getByTestId('avatar-frame-artwork-avatar_frame_month', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
  });

  it('keeps the seven-day protection diagram flexible on compact phone widths', () => {
    render(
      <ThemeProvider>
        <ShopItemImpactPreview
          item={{
            id: 'freeze-compact',
            sku: 'streak_freeze_basic',
            name: 'Streak Freeze',
            category: 'power_up',
          }}
        />
      </ThemeProvider>
    );

    const days = screen.getAllByTestId('shop-impact-freeze-day', {
      includeHiddenElements: true,
    });
    expect(days).toHaveLength(7);
    days.forEach(day => {
      expect(StyleSheet.flatten(day.props.style)).toMatchObject({
        flex: 1,
        minWidth: 0,
      });
    });
  });

  it('reserves the same paper outcome geometry while item detail loads', () => {
    render(
      <ThemeProvider>
        <ShopItemImpactSkeleton testID="shop-item-impact-skeleton" />
      </ThemeProvider>
    );

    expect(screen.getByTestId('shop-item-impact-skeleton')).toBeTruthy();
    expect(screen.getByTestId('shop-impact-skeleton-diagram')).toBeTruthy();
  });
});
