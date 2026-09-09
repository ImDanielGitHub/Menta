import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import PaywallModal from '@/components/paywall/PaywallModal';
import { ThemeProvider } from '@/constants/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockBoolFlags: Record<string, boolean> = {
  ads_enabled: true,
  safe_mode: false,
};

jest.mock('@/hooks/useOperationalFlag', () => ({
  useOperationalFlag: (flagKey: string) => ({
    enabled: mockBoolFlags[flagKey] ?? false,
    loading: false,
    refresh: jest.fn(),
  }),
}));

jest.mock('@/lib/paywall/revenuecat', () => ({
  REVENUECAT_SUPPORTED: true,
  purchasePlan: jest.fn(),
  restorePurchases: jest.fn(),
  RevenueCatAPI: {
    getOfferings: jest.fn(),
    refreshCustomerInfo: jest.fn(),
    confirmServerProAccess: jest.fn(),
    showManageSubscriptions: jest.fn(),
  },
}));

jest.mock('@/lib/posthog', () => ({
  trackProductEvent: jest.fn(),
  usePaywallPlacementFlag: () => 'unset',
  getPaywallPlacementFlag: () => 'unset',
  setSessionReplayHold: jest.fn(),
}));

jest.mock('@/lib/amplitude', () => ({
  setAmplitudeSessionReplayHold: jest.fn(),
}));

jest.mock('react-native-purchases', () => ({
  PACKAGE_TYPE: {
    MONTHLY: 'MONTHLY',
    ANNUAL: 'ANNUAL',
  },
}));

describe('PaywallModal', () => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );

  const EmberWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider equippedThemeSku="profile_theme_ember">
        {children}
      </ThemeProvider>
    </SafeAreaProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockBoolFlags.ads_enabled = true;
    mockBoolFlags.safe_mode = false;
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      REVENUECAT_SUPPORTED: boolean;
      RevenueCatAPI: {
        getOfferings: jest.Mock;
        refreshCustomerInfo: jest.Mock;
        confirmServerProAccess: jest.Mock;
      };
    };
    revenueCat.REVENUECAT_SUPPORTED = true;
    const { RevenueCatAPI } = revenueCat;
    RevenueCatAPI.getOfferings.mockResolvedValue({
      current: {
        availablePackages: [
          {
            identifier: 'com.anekedigitalapps.lockedin.pro_monthly',
            packageType: 'MONTHLY',
            product: {
              price: 9.99,
              currencyCode: 'USD',
              priceString: '$9.99',
            },
          },
          {
            identifier: 'com.anekedigitalapps.lockedin.pro_yearly',
            packageType: 'ANNUAL',
            product: {
              price: 59.99,
              currencyCode: 'USD',
              priceString: '$59.99',
            },
          },
        ],
      },
    });
    RevenueCatAPI.refreshCustomerInfo.mockResolvedValue(false);
    RevenueCatAPI.confirmServerProAccess.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not expose rewarded ads while the dashboard flag is disabled', () => {
    const onWatchAd = jest.fn(async () => ({ earned: false, amount: 0 }));
    mockBoolFlags.ads_enabled = false;
    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onWatchAd={onWatchAd}
        context="general"
        shortfall={20}
        adRewardAmount={50}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.queryByText('Watch ad for +50 Momenta')).toBeNull();
    expect(onWatchAd).not.toHaveBeenCalled();
  });

  it('does not expose rewarded ads while safe mode is active', () => {
    const onWatchAd = jest.fn(async () => ({ earned: false, amount: 0 }));
    mockBoolFlags.safe_mode = true;
    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onWatchAd={onWatchAd}
        context="general"
        shortfall={20}
        adRewardAmount={50}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.queryByText('Watch ad for +50 Momenta')).toBeNull();
    expect(onWatchAd).not.toHaveBeenCalled();
  });

  it('shows a receipt only after the caller confirms the Momenta credit', async () => {
    const onWatchAd = jest.fn(async () => ({ earned: true, amount: 10 }));

    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onWatchAd={onWatchAd}
        context="challenge"
        variant="insufficient"
        shortfall={30}
        adRewardAmount={10}
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(screen.getByText('Watch an ad for 10 Momenta'));

    expect(
      await screen.findByTestId('paywall-ad-success-receipt')
    ).toBeTruthy();
    expect(screen.getByText('Momenta added')).toBeTruthy();
    expect(screen.getByText('+10')).toBeTruthy();
    expect(
      screen.getByText('10 Momenta was added to your balance.')
    ).toBeTruthy();
  });

  it('does not claim a credit when no positive server amount is confirmed', async () => {
    const onWatchAd = jest.fn(async () => ({ earned: true, amount: 0 }));

    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onWatchAd={onWatchAd}
        context="challenge"
        variant="insufficient"
        shortfall={30}
        adRewardAmount={10}
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(screen.getByText('Watch an ad for 10 Momenta'));

    expect(
      await screen.findByText(
        'The reward was not added. Your balance did not change.'
      )
    ).toBeTruthy();
    expect(screen.queryByTestId('paywall-ad-success-receipt')).toBeNull();
  });

  it.each([
    {
      label: 'no available ad',
      result: { earned: false, amount: 0, reason: 'no_fill' as const },
      title: 'No ad is available',
      message: 'Try again later.',
    },
    {
      label: 'ad SDK load failure',
      result: { earned: false, amount: 0, reason: 'load_failed' as const },
      title: "The ad didn't load",
      message: 'Try again in a moment.',
    },
    {
      label: 'daily ad limit',
      result: { earned: false, amount: 0, reason: 'daily_limit' as const },
      title: "You've collected today's ad rewards",
      message: 'Try again tomorrow.',
    },
    {
      label: 'ad cooldown',
      result: { earned: false, amount: 0, reason: 'cooldown' as const },
      title: 'Reward not ready yet',
      message: 'Wait two minutes before watching another ad.',
    },
    {
      label: 'unconfirmed server reward',
      result: {
        earned: false,
        amount: 0,
        reason: 'reward_unconfirmed' as const,
      },
      title: "The reward wasn't added",
      message:
        'Your balance did not change. Refresh before you watch another ad.',
    },
  ])(
    'shows one plain result for $label',
    async ({ result, title, message }) => {
      render(
        <PaywallModal
          visible
          onClose={jest.fn()}
          onWatchAd={jest.fn(async () => result)}
          context="challenge"
          variant="insufficient"
          shortfall={30}
          adRewardAmount={10}
        />,
        { wrapper: Wrapper }
      );

      fireEvent.press(screen.getByText('Watch an ad for 10 Momenta'));

      expect(await screen.findByText(title)).toBeTruthy();
      expect(screen.getByText(message)).toBeTruthy();
      expect(screen.getAllByTestId('paywall-ad-feedback')).toHaveLength(1);
      expect(screen.queryByTestId('paywall-ad-success-receipt')).toBeNull();
    }
  );

  it('keeps an incomplete or cancelled ad distinct from SDK errors', async () => {
    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onWatchAd={jest.fn(async () => ({ earned: false, amount: 0 }))}
        context="challenge"
        variant="insufficient"
        shortfall={30}
        adRewardAmount={10}
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(screen.getByText('Watch an ad for 10 Momenta'));

    expect(await screen.findByText('Reward not earned')).toBeTruthy();
    expect(
      screen.getByText('Watch the full ad to collect the reward.')
    ).toBeTruthy();
    expect(screen.queryByText('Ad unavailable')).toBeNull();
    expect(screen.queryByTestId('paywall-ad-success-receipt')).toBeNull();
  });

  it('shows the exact remaining amount after one ad at the funding gate', () => {
    const onWatchAd = jest.fn(async () => ({ earned: true, amount: 10 }));

    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onWatchAd={onWatchAd}
        context="challenge"
        variant="insufficient"
        shortfall={30}
        adRewardAmount={10}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Need 30 more Momenta')).toBeTruthy();
    expect(
      screen.getByText(
        'Your promise is saved while you choose what to do next.'
      )
    ).toBeTruthy();
    expect(
      screen.getByText('One ad adds 10 Momenta. You would still need 20 more.')
    ).toBeTruthy();
    expect(screen.getByText('Watch an ad for 10 Momenta')).toBeTruthy();
    expect(screen.getByText('See Pro plans')).toBeTruthy();
    expect(screen.getByText('Return to draft')).toBeTruthy();
    expect(screen.getByText('Restore purchases')).toBeTruthy();
    expect(screen.getByText('Terms of Use')).toBeTruthy();
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
  });

  it('only says one ad is enough when its reward covers the shortfall', () => {
    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onWatchAd={jest.fn(async () => ({ earned: true, amount: 50 }))}
        context="challenge"
        variant="insufficient"
        shortfall={20}
        adRewardAmount={50}
      />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByText('One ad adds 50 Momenta, enough for this promise.')
    ).toBeTruthy();
    expect(screen.queryByText(/would still need/i)).toBeNull();
  });

  it('keeps the saved draft and Pro recovery paths when ads are unavailable', () => {
    const onClose = jest.fn();

    render(
      <PaywallModal
        visible
        onClose={onClose}
        context="group"
        variant="insufficient"
        shortfall={25}
      />,
      { wrapper: Wrapper }
    );

    expect(
      screen.getByText('Your group is saved while you choose what to do next.')
    ).toBeTruthy();
    expect(screen.queryByText(/Watch an ad for/)).toBeNull();
    expect(screen.getByText('See Pro plans')).toBeTruthy();

    fireEvent.press(screen.getByText('Return to draft'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the actual monthly renewal price without a value claim', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByText('$9.99')).toBeTruthy();
    expect(screen.getByText('Billed $9.99 monthly')).toBeTruthy();
    expect(screen.queryByText('Best option')).toBeNull();
    expect(screen.queryByText('$2.30/week')).toBeNull();
    expect(screen.getByText('More room to follow through.')).toBeTruthy();
    fireEvent.press(screen.getByTestId('paywall-plan-monthly'));
    expect(screen.getByText('Continue to monthly checkout')).toBeTruthy();
    expect(
      screen.getByText(
        'Auto-renews monthly. $9.99 per month. Cancel anytime in your Apple subscription settings.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Best value')).toBeNull();
  });

  it('explains Pro before asking for a plan choice', async () => {
    const { toJSON } = render(
      <PaywallModal visible onClose={jest.fn()} context="general" />,
      {
        wrapper: Wrapper,
      }
    );

    expect(await screen.findByText('Monthly Pro')).toBeTruthy();
    expect(screen.getByTestId('paywall-plan-options')).toBeTruthy();
    expect(screen.getByTestId('paywall-benefits-section')).toBeTruthy();

    const renderedTree = JSON.stringify(toJSON());
    const firstPlanIndex = renderedTree.indexOf('Monthly Pro');
    const benefitsIndex = renderedTree.indexOf('What Pro changes');

    expect(firstPlanIndex).toBeGreaterThan(-1);
    expect(benefitsIndex).toBeGreaterThan(-1);
    expect(benefitsIndex).toBeLessThan(firstPlanIndex);
  });

  it('opens the direct paywall with one human promise and no ornamental label', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(
      await screen.findByText('More room to follow through.')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Keep more promises and groups moving, without free-plan limits getting in the way.'
      )
    ).toBeTruthy();
    expect(screen.getByText('What Pro changes')).toBeTruthy();
    expect(screen.getByText('Choose a plan')).toBeTruthy();
    expect(screen.queryByText('Choose a Menta Pro plan')).toBeNull();
    expect(screen.queryByText('Included with Pro')).toBeNull();
    expect(screen.queryByText(/^[A-Z][A-Z ]{3,}$/)).toBeNull();
  });

  it('keeps the direct paywall free of the rewarded-ad detour', async () => {
    const onWatchAd = jest.fn(async () => ({ earned: true, amount: 50 }));

    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onWatchAd={onWatchAd}
        context="general"
        adRewardAmount={50}
      />,
      { wrapper: Wrapper }
    );

    expect(await screen.findByText('Monthly Pro')).toBeTruthy();
    expect(screen.queryByText(/Watch ad for/)).toBeNull();
    expect(screen.queryByText(/Watch one short ad/)).toBeNull();
    expect(onWatchAd).not.toHaveBeenCalled();
  });

  it('holds direct paywall, outcome, and compact shells in one phone-frame lane', async () => {
    const { rerender } = render(
      <PaywallModal visible onClose={jest.fn()} context="general" />,
      { wrapper: Wrapper }
    );

    await screen.findByTestId('paywall-plan-monthly');
    const directLane = StyleSheet.flatten(
      screen.getByTestId('paywall-plans').props.contentContainerStyle
    );
    expect(directLane.width).toBe('100%');
    expect(directLane.maxWidth).toBe(430);
    expect(directLane.alignSelf).toBe('center');
    expect(directLane.paddingHorizontal).toBe(24);
    expect(directLane.paddingTop).toBe(64);
    expect(directLane.paddingBottom).toBe(64);

    const closeControl = StyleSheet.flatten(
      screen.getByTestId('paywall-close').props.style
    );
    expect(closeControl.left).toBeUndefined();
    expect(closeControl.right).toBe(16);
    expect(closeControl.width).toBe(44);
    expect(closeControl.minHeight).toBe(44);

    const purchaseCta = StyleSheet.flatten(
      screen.getByTestId('paywall-purchase-cta').props.style
    );
    expect(purchaseCta.width).toBe('100%');
    expect(purchaseCta.alignSelf).toBe('stretch');

    fireEvent.press(screen.getByText('Manage Menta Pro with Apple'));
    const outcomeLane = StyleSheet.flatten(
      screen.getByTestId('paywall-state-manage').props.contentContainerStyle
    );
    expect(outcomeLane.width).toBe('100%');
    expect(outcomeLane.maxWidth).toBe(430);
    expect(outcomeLane.alignSelf).toBe('center');
    expect(outcomeLane.paddingHorizontal).toBe(24);

    rerender(
      <PaywallModal
        visible
        onClose={jest.fn()}
        context="challenge"
        variant="quota"
        quotaContext="challenge"
      />
    );

    expect(screen.getByText('You’ve reached the free limit')).toBeTruthy();
    const compactLane = StyleSheet.flatten(
      screen.getByTestId('paywall-compact').props.style
    );
    expect(compactLane.width).toBe('100%');
    expect(compactLane.maxWidth).toBe(430);
    expect(compactLane.alignSelf).toBe('center');
    expect(compactLane.paddingHorizontal).toBe(24);
  });

  it('offers plan choices as accessible full-width rows with stable geometry', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    const monthly = await screen.findByTestId('paywall-plan-monthly');
    const unselected = StyleSheet.flatten(monthly.props.style);

    expect(monthly.props.accessibilityRole).toBe('radio');
    expect(monthly.props.accessibilityHint).toBe(
      'Selects this plan. You will confirm the purchase with Apple next.'
    );
    expect(monthly.props.accessibilityState.checked).toBe(false);
    expect(unselected.width).toBe('100%');
    expect(unselected.minHeight).toBe(70);
    expect(unselected.borderRadius).toBe(16);
    expect(unselected.borderWidth).toBe(1);

    fireEvent.press(monthly);

    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
    };
    expect(revenueCat.purchasePlan).not.toHaveBeenCalled();

    const selected = StyleSheet.flatten(
      screen.getByTestId('paywall-plan-monthly').props.style
    );
    expect(
      screen.getByTestId('paywall-plan-monthly').props.accessibilityState
        .checked
    ).toBe(true);
    expect(
      screen.getByTestId('paywall-plan-annual').props.accessibilityState.checked
    ).toBe(false);
    expect(selected.borderWidth).toBe(2);
    expect(selected.borderColor).toBe('#B88CFF');
    expect(selected.backgroundColor).toBe('rgba(184, 140, 255, 0.07)');
    expect(selected.borderWidth + selected.paddingHorizontal).toBe(
      unselected.borderWidth + unselected.paddingHorizontal
    );
    expect(selected.borderWidth + selected.paddingVertical).toBe(
      unselected.borderWidth + unselected.paddingVertical
    );
  });

  it('applies the equipped theme to the close control and selected plan semantics', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: EmberWrapper,
    });

    const monthly = await screen.findByTestId('paywall-plan-monthly');
    const closeControl = StyleSheet.flatten(
      screen.getByTestId('paywall-close').props.style
    );

    expect(closeControl.backgroundColor).toBe('rgba(231, 168, 109, 0.14)');
    expect(closeControl.borderColor).toBe('rgba(231, 168, 109, 0.55)');

    fireEvent.press(monthly);

    const selectedPlan = StyleSheet.flatten(
      screen.getByTestId('paywall-plan-monthly').props.style
    );
    const selectedIndicator = StyleSheet.flatten(
      screen.getByTestId('paywall-plan-monthly-indicator').props.style
    );
    const selectedDot = StyleSheet.flatten(
      screen.getByTestId('paywall-plan-monthly-indicator-dot').props.style
    );

    expect(selectedPlan.backgroundColor).toBe('rgba(231, 168, 109, 0.14)');
    expect(selectedPlan.borderColor).toBe('rgba(231, 168, 109, 0.55)');
    expect(selectedIndicator.borderColor).toBe('rgba(231, 168, 109, 0.55)');
    expect(selectedDot.backgroundColor).toBe('#E7A86D');
  });

  it('keeps a long localised price readable beside its plan name', async () => {
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat') as {
      RevenueCatAPI: { getOfferings: jest.Mock };
    };
    RevenueCatAPI.getOfferings.mockResolvedValueOnce({
      current: {
        availablePackages: [
          {
            identifier: 'com.anekedigitalapps.lockedin.pro_monthly',
            packageType: 'MONTHLY',
            product: {
              price: 1590000,
              currencyCode: 'IDR',
              priceString: 'Rp1.590.000,00',
            },
          },
        ],
      },
    });

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    const price = await screen.findByText('Rp1.590.000,00');
    const priceStyle = StyleSheet.flatten(price.props.style);
    const headline = StyleSheet.flatten(
      screen.getByTestId('paywall-plan-monthly-headline').props.style
    );

    expect(priceStyle.flexShrink).toBe(1);
    expect(headline.flexWrap).toBe('wrap');
    expect(screen.getByText('Billed Rp1.590.000,00 monthly')).toBeTruthy();
  });

  it('asks for a plan before offering checkout', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByText('Choose a plan to continue')).toBeTruthy();
    expect(screen.queryByText(/Continue to .* checkout/)).toBeNull();

    fireEvent.press(screen.getByTestId('paywall-plan-annual'));

    expect(screen.getByText('Continue to annual checkout')).toBeTruthy();
    expect(screen.queryByText('Choose a plan to continue')).toBeNull();
  });

  it('keeps the actual monthly price localised from RevenueCat', async () => {
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat') as {
      RevenueCatAPI: {
        getOfferings: jest.Mock;
      };
    };
    RevenueCatAPI.getOfferings.mockResolvedValueOnce({
      current: {
        availablePackages: [
          {
            identifier: 'com.anekedigitalapps.lockedin.pro_monthly',
            packageType: 'MONTHLY',
            product: {
              price: 9.99,
              currencyCode: 'NZD',
              priceString: 'NZ$9.99',
            },
          },
        ],
      },
    });

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByText('NZ$9.99')).toBeTruthy();
    expect(screen.getByText('Billed NZ$9.99 monthly')).toBeTruthy();
  });

  it('does not call a completed purchase failed while entitlement catches up', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
    };
    revenueCat.purchasePlan.mockResolvedValueOnce({
      success: false,
      entitlementPending: true,
      storeTransactionCompleted: true,
    });

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    fireEvent.press(await screen.findByTestId('paywall-plan-monthly'));
    fireEvent.press(screen.getByText('Continue to monthly checkout'));

    await waitFor(() => {
      expect(screen.getByText('Pro is taking longer to activate')).toBeTruthy();
    });
    const { trackProductEvent } = jest.requireMock('@/lib/posthog') as {
      trackProductEvent: jest.Mock;
    };
    expect(trackProductEvent).not.toHaveBeenCalledWith(
      'Subscription Started',
      expect.anything()
    );
    expect(screen.getByText('Check Pro access')).toBeTruthy();
  });

  it('opens an existing Pro account on its active management state', async () => {
    render(
      <PaywallModal
        visible
        initialView="active"
        onClose={jest.fn()}
        context="general"
      />,
      { wrapper: Wrapper }
    );

    expect(await screen.findByText('You have Menta Pro')).toBeTruthy();
    expect(screen.getByText('Manage subscription')).toBeTruthy();
    expect(screen.queryByTestId('paywall-plan-monthly')).toBeNull();
  });

  it('lets the user leave while completed purchase access catches up', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
    };
    const onClose = jest.fn();
    revenueCat.purchasePlan.mockResolvedValueOnce({
      success: false,
      entitlementPending: true,
      storeTransactionCompleted: true,
    });

    render(<PaywallModal visible onClose={onClose} context="general" />, {
      wrapper: Wrapper,
    });

    fireEvent.press(await screen.findByTestId('paywall-plan-monthly'));
    fireEvent.press(screen.getByText('Continue to monthly checkout'));
    fireEvent.press(await screen.findByTestId('paywall-access-delayed-close'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(revenueCat.purchasePlan).toHaveBeenCalledTimes(1);
  });

  it('hands off only after a later RevenueCat access check confirms Pro', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
      RevenueCatAPI: {
        refreshCustomerInfo: jest.Mock;
        confirmServerProAccess: jest.Mock;
      };
    };
    const onBuyPro = jest.fn();
    const onClose = jest.fn();
    revenueCat.purchasePlan.mockResolvedValueOnce({
      success: false,
      entitlementPending: true,
      storeTransactionCompleted: true,
    });
    revenueCat.RevenueCatAPI.refreshCustomerInfo.mockResolvedValueOnce(true);
    revenueCat.RevenueCatAPI.confirmServerProAccess.mockResolvedValueOnce(true);

    render(
      <PaywallModal
        visible
        onClose={onClose}
        onBuyPro={onBuyPro}
        context="general"
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(await screen.findByTestId('paywall-plan-monthly'));
    fireEvent.press(screen.getByText('Continue to monthly checkout'));
    fireEvent.press(await screen.findByText('Check Pro access'));

    expect(await screen.findByText('Menta Pro is active')).toBeTruthy();
    expect(onBuyPro).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Start using Pro'));
    expect(onBuyPro).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps access pending when only the client SDK reports Pro', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
      RevenueCatAPI: {
        refreshCustomerInfo: jest.Mock;
        confirmServerProAccess: jest.Mock;
      };
    };
    const onBuyPro = jest.fn();
    revenueCat.purchasePlan.mockResolvedValueOnce({
      success: false,
      entitlementPending: true,
      storeTransactionCompleted: true,
    });
    revenueCat.RevenueCatAPI.refreshCustomerInfo.mockResolvedValueOnce(true);
    revenueCat.RevenueCatAPI.confirmServerProAccess.mockResolvedValueOnce(
      false
    );

    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onBuyPro={onBuyPro}
        context="general"
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(await screen.findByTestId('paywall-plan-monthly'));
    fireEvent.press(screen.getByText('Continue to monthly checkout'));
    fireEvent.press(await screen.findByText('Check Pro access'));

    expect(
      await screen.findByText('Pro is taking longer to activate')
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Don't buy it again. Restore purchases or check Pro access again in a moment."
      )
    ).toBeTruthy();
    expect(
      revenueCat.RevenueCatAPI.confirmServerProAccess
    ).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Start using Pro')).toBeNull();
    expect(onBuyPro).not.toHaveBeenCalled();
  });

  it('does not claim Apple failed when checkout has not returned yet', async () => {
    jest.useFakeTimers();
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
    };
    revenueCat.purchasePlan.mockReturnValueOnce(new Promise(() => {}));

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    await act(async () => {});
    fireEvent.press(screen.getByTestId('paywall-plan-monthly'));
    fireEvent.press(screen.getByText('Continue to monthly checkout'));

    act(() => {
      jest.advanceTimersByTime(30_000);
    });

    expect(screen.getByText('Pro is taking longer to activate')).toBeTruthy();
    expect(
      screen.getByText(
        "We don't know whether the purchase finished. Don't buy it again. When checkout closes, check Pro access or restore purchases."
      )
    ).toBeTruthy();
    expect(screen.queryByText('Apple purchase did not open')).toBeNull();
    expect(screen.queryByText(/No purchase was made/)).toBeNull();
  });

  it('keeps Pro unchanged when Apple checkout is cancelled', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
    };
    const onBuyPro = jest.fn();
    const onClose = jest.fn();
    revenueCat.purchasePlan.mockResolvedValueOnce({
      success: false,
      cancelled: true,
    });

    render(
      <PaywallModal
        visible
        onClose={onClose}
        onBuyPro={onBuyPro}
        context="general"
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(await screen.findByTestId('paywall-plan-monthly'));
    fireEvent.press(screen.getByText('Continue to monthly checkout'));

    expect(await screen.findByText('Purchase cancelled')).toBeTruthy();
    expect(
      screen.getByText(
        'You were not charged. You can choose a plan whenever you’re ready.'
      )
    ).toBeTruthy();
    expect(screen.queryByTestId('paywall-confirmed-mascot')).toBeNull();
    expect(onBuyPro).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows the confirmed Pro state before continuing to the calling screen', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
      RevenueCatAPI: { refreshCustomerInfo: jest.Mock };
    };
    const onBuyPro = jest.fn();
    const onClose = jest.fn();
    revenueCat.purchasePlan.mockResolvedValueOnce({ success: true });
    revenueCat.RevenueCatAPI.refreshCustomerInfo.mockResolvedValueOnce(false);

    render(
      <PaywallModal
        visible
        onClose={onClose}
        onBuyPro={onBuyPro}
        context="general"
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(await screen.findByTestId('paywall-plan-monthly'));
    fireEvent.press(screen.getByText('Continue to monthly checkout'));

    expect(await screen.findByText('Menta Pro is active')).toBeTruthy();
    expect(screen.getByText('You can use your Pro features now.')).toBeTruthy();
    const { trackProductEvent } = jest.requireMock('@/lib/posthog') as {
      trackProductEvent: jest.Mock;
    };
    expect(trackProductEvent).toHaveBeenCalledWith('Subscription Started', {
      plan: 'monthly',
    });
    expect(
      screen.getByTestId('paywall-confirmed-mascot', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(screen.getByTestId('paywall-state-pro-active-receipt')).toBeTruthy();
    expect(screen.getAllByText('Pro access')).toHaveLength(1);
    expect(screen.getAllByText('Active')).toHaveLength(1);

    const confirmedContentStyle = StyleSheet.flatten(
      screen.getByTestId('paywall-state-pro-active').props.contentContainerStyle
    );
    expect(confirmedContentStyle.maxWidth).toBe(430);
    expect(confirmedContentStyle.paddingHorizontal).toBe(24);
    expect(onBuyPro).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Start using Pro'));
    expect(onBuyPro).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows one calm receipt when a previous Pro purchase is restored', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      restorePurchases: jest.Mock;
    };
    const onBuyPro = jest.fn();
    const onClose = jest.fn();
    revenueCat.restorePurchases.mockResolvedValueOnce({ success: true });

    render(
      <PaywallModal
        visible
        onClose={onClose}
        onBuyPro={onBuyPro}
        context="general"
      />,
      { wrapper: Wrapper }
    );

    fireEvent.press(await screen.findByText('Restore purchases'));

    expect(await screen.findByText('Menta Pro is active again')).toBeTruthy();
    expect(
      screen.getByText(
        'Your previous purchase is active on this account. You were not charged again.'
      )
    ).toBeTruthy();
    expect(
      screen.getByTestId('paywall-confirmed-mascot', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(screen.getByTestId('paywall-state-restored-receipt')).toBeTruthy();
    expect(screen.getAllByText('Pro access')).toHaveLength(1);
    expect(screen.getAllByText('Active')).toHaveLength(1);

    fireEvent.press(screen.getByText('Start using Pro'));
    expect(onBuyPro).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an explicit no-charge progress state while Apple restore is pending', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      restorePurchases: jest.Mock;
    };
    let resolveRestore: (result: { success: false }) => void;
    revenueCat.restorePurchases.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveRestore = resolve;
        })
    );

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    fireEvent.press(await screen.findByText('Restore purchases'));

    expect(await screen.findByTestId('paywall-state-restoring')).toBeTruthy();
    expect(screen.getByText('Restoring purchases…')).toBeTruthy();
    expect(
      screen.getByText(
        'Checking purchases linked to this Apple Account. You will not be charged.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Continue to monthly checkout')).toBeNull();

    await act(async () => {
      resolveRestore!({ success: false });
    });
    expect(
      await screen.findByText('No matching purchase was found')
    ).toBeTruthy();
  });

  it('shows a purchase failure instead of only a toast', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
    };
    revenueCat.purchasePlan.mockResolvedValueOnce({
      success: false,
      errorMessage: 'Apple could not complete this purchase.',
    });

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    fireEvent.press(await screen.findByTestId('paywall-plan-monthly'));
    fireEvent.press(screen.getByText('Continue to monthly checkout'));

    expect(await screen.findByText("Purchase didn't go through")).toBeTruthy();
    expect(
      screen.getByText(
        "Pro wasn't activated. Check Pro access before you try again."
      )
    ).toBeTruthy();
  });

  it('distinguishes a failed restore from no matching purchase', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      restorePurchases: jest.Mock;
    };
    revenueCat.restorePurchases.mockResolvedValueOnce({
      success: false,
      errorMessage: 'Apple could not restore purchases.',
    });

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    fireEvent.press(await screen.findByText('Restore purchases'));

    expect(await screen.findByText('Could not restore purchases')).toBeTruthy();
    expect(
      screen.getByText(
        'Check your connection and try again. Nothing was charged.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('No matching purchase was found')).toBeNull();
    expect(screen.queryByText('Restore result')).toBeNull();
    expect(screen.queryByTestId('paywall-confirmed-mascot')).toBeNull();
  });

  it('shows no matching purchase only when restore completed without Pro', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      restorePurchases: jest.Mock;
    };
    revenueCat.restorePurchases.mockResolvedValueOnce({ success: false });

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    fireEvent.press(await screen.findByText('Restore purchases'));

    expect(
      await screen.findByText('No matching purchase was found')
    ).toBeTruthy();
    expect(screen.queryByText('Pro access')).toBeNull();
    expect(screen.queryByTestId('paywall-confirmed-mascot')).toBeNull();
  });

  it('does not invite another purchase while a known restore is still activating', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      restorePurchases: jest.Mock;
    };
    revenueCat.restorePurchases.mockResolvedValueOnce({
      success: false,
      entitlementPending: true,
      storeTransactionCompleted: true,
    });

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    fireEvent.press(await screen.findByText('Restore purchases'));

    expect(
      await screen.findByText('Pro is taking longer to activate')
    ).toBeTruthy();
    expect(
      screen.getByText("Don't buy Pro again while Menta checks your access.")
    ).toBeTruthy();
    expect(screen.queryByText(/Continue to .* checkout/)).toBeNull();
  });

  it('shows an unavailable-plan state when RevenueCat has no current offering', async () => {
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat') as {
      RevenueCatAPI: { getOfferings: jest.Mock };
    };
    RevenueCatAPI.getOfferings.mockResolvedValueOnce(null);

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(
      await screen.findByText('Plans are temporarily unavailable')
    ).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });

  it('does not expose a native checkout when purchases are unsupported', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      REVENUECAT_SUPPORTED: boolean;
      purchasePlan: jest.Mock;
    };
    revenueCat.REVENUECAT_SUPPORTED = false;

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(
      await screen.findByText('Purchases aren’t available on this device')
    ).toBeTruthy();
    expect(screen.getByText('More room to follow through.')).toBeTruthy();
    expect(screen.queryByText(/Continue to .* checkout/)).toBeNull();
    expect(screen.queryByText(/native build|configured/i)).toBeNull();
    expect(revenueCat.purchasePlan).not.toHaveBeenCalled();
  });

  it('shows plan-shaped skeletons while live App Store plans load', async () => {
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat') as {
      RevenueCatAPI: { getOfferings: jest.Mock };
    };
    RevenueCatAPI.getOfferings.mockReturnValueOnce(new Promise(() => {}));

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByTestId('paywall-plan-loading')).toBeTruthy();
    expect(screen.getByText('Loading Pro plans…')).toBeTruthy();
    expect(
      screen.getByText('Prices are loaded from the App Store.')
    ).toBeTruthy();
    expect(screen.queryByText('Monthly Pro')).toBeNull();
  });

  it('explains the Apple handoff before opening subscription management', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    fireEvent.press(await screen.findByText('Manage Menta Pro with Apple'));

    expect(screen.getByTestId('paywall-state-manage')).toBeTruthy();
    expect(screen.getByText('Manage Menta Pro')).toBeTruthy();
    expect(screen.getByText('Continue in Apple Settings')).toBeTruthy();
  });

  it('exposes legal, restore, and Apple management recovery paths', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByText('Restore purchases')).toBeTruthy();
    expect(screen.getByText('Terms of Use')).toBeTruthy();
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getByText('Manage Menta Pro with Apple')).toBeTruthy();
  });

  it.each(['default', 'insufficient', 'quota'] as const)(
    'keeps %s paywall variant in the full-screen shell',
    variant => {
      render(
        <PaywallModal
          visible
          onClose={jest.fn()}
          context="challenge"
          variant={variant}
          shortfall={25}
        />,
        { wrapper: Wrapper }
      );

      const shellStyle = StyleSheet.flatten(
        screen.getByTestId('paywall-shell').props.style
      );

      expect(shellStyle.width).toBe('100%');
      expect(shellStyle.height).toBe('100%');
      expect(shellStyle.borderRadius).toBe(0);
      expect(shellStyle.maxWidth).toBeUndefined();
    }
  );
});
