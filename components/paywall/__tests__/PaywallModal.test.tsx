import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';
import { ProOfferJourney } from '@/components/paywall/pro-offer-journey';
import PaywallModal from '@/components/paywall/PaywallModal';
import { ThemeProvider } from '@/constants/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockBoolFlags: Record<string, boolean> = {
  ads_enabled: true,
  safe_mode: false,
};
let mockPaywallAllowed = true;

jest.mock('@/lib/paywall/use-paywall-allowed', () => ({
  usePaywallAllowed: () => mockPaywallAllowed,
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'paywall-user' } }),
}));

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
    WEEKLY: 'WEEKLY',
    ANNUAL: 'ANNUAL',
  },
}));

describe('PaywallModal', () => {
  const reviewWeeklyOffer = async () => {
    fireEvent.press(screen.getByText('See Pro plans'));
    fireEvent.press(await screen.findByRole('radio', { name: /^Weekly/ }));
    fireEvent.press(screen.getByText(/^Continue with (weekly|yearly)/i));
    await screen.findByText('Your Pro plan.');
  };

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
    mockPaywallAllowed = true;
    mockBoolFlags.ads_enabled = true;
    mockBoolFlags.safe_mode = false;
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      REVENUECAT_SUPPORTED: boolean;
      purchasePlan: jest.Mock;
      restorePurchases: jest.Mock;
      RevenueCatAPI: {
        getOfferings: jest.Mock;
        refreshCustomerInfo: jest.Mock;
        confirmServerProAccess: jest.Mock;
      };
    };
    revenueCat.REVENUECAT_SUPPORTED = true;
    revenueCat.purchasePlan.mockReset().mockResolvedValue({ success: false });
    revenueCat.restorePurchases
      .mockReset()
      .mockResolvedValue({ success: false });
    const { RevenueCatAPI } = revenueCat;
    RevenueCatAPI.getOfferings.mockReset();
    RevenueCatAPI.refreshCustomerInfo.mockReset();
    RevenueCatAPI.confirmServerProAccess.mockReset();
    RevenueCatAPI.getOfferings.mockResolvedValue({
      current: {
        availablePackages: [
          {
            identifier: '$rc_weekly',
            packageType: 'WEEKLY',
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

  it.each(['benefits', 'plans', 'offer'] as const)(
    'offers one explicit free choice on %s',
    async stage => {
      const onFree = jest.fn();
      const onClose = jest.fn();
      const { purchasePlan, restorePurchases } = jest.requireMock(
        '@/lib/paywall/revenuecat'
      );
      render(
        <PaywallModal
          visible
          context="menta_check"
          onClose={onClose}
          onContinueFree={onFree}
        />,
        { wrapper: Wrapper }
      );
      if (stage !== 'benefits')
        fireEvent.press(screen.getByText('See Pro plans'));
      if (stage === 'offer') {
        fireEvent.press(await screen.findByRole('radio', { name: /^Weekly/ }));
        fireEvent.press(screen.getByText(/^Continue with weekly/i));
        await screen.findByText('Your Pro plan.');
      }
      const free = screen.getByRole('button', { name: 'Continue with free' });
      fireEvent.press(free);
      fireEvent.press(free);
      expect(onFree).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(purchasePlan).not.toHaveBeenCalled();
      expect(restorePurchases).not.toHaveBeenCalled();
    }
  );
  it('does not interpret an ordinary close as choosing free', () => {
    const onFree = jest.fn();
    const onClose = jest.fn();
    const view = render(
      <PaywallModal visible onClose={onClose} onContinueFree={onFree} />,
      { wrapper: Wrapper }
    );
    view.rerender(
      <PaywallModal visible={false} onClose={onClose} onContinueFree={onFree} />
    );
    expect(onFree).not.toHaveBeenCalled();
  });
  it.each(['purchase', 'restore'] as const)(
    'blocks free while native %s is unresolved',
    async operation => {
      const onFree = jest.fn();
      const onClose = jest.fn();
      const api = jest.requireMock('@/lib/paywall/revenuecat');
      const pending =
        operation === 'purchase' ? api.purchasePlan : api.restorePurchases;
      pending.mockImplementation(() => new Promise(() => {}));
      render(
        <PaywallModal visible onClose={onClose} onContinueFree={onFree} />,
        { wrapper: Wrapper }
      );
      const capturedChoice =
        screen.UNSAFE_getByType(ProOfferJourney).props.onContinueFree;
      if (operation === 'purchase') {
        await reviewWeeklyOffer();
        fireEvent.press(screen.getByText('Subscribe to Pro'));
      } else
        fireEvent.press(
          screen.getByRole('button', { name: 'Restore purchases' })
        );
      await waitFor(() => expect(pending).toHaveBeenCalledTimes(1));
      act(() => capturedChoice());
      expect(onFree).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    }
  );

  it('offers a return to setup instead of promising free access in hard onboarding', async () => {
    const onClose = jest.fn();
    render(<PaywallModal visible context="onboarding" onClose={onClose} />, {
      wrapper: Wrapper,
    });
    expect(await screen.findByText('Menta checks every promise')).toBeTruthy();
    expect(screen.queryByText('Keep using Menta for free')).toBeNull();
    fireEvent.press(screen.getByText('Back'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes without loading offers when onboarding excludes the paywall', () => {
    mockPaywallAllowed = false;
    const onClose = jest.fn();
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat');

    render(<PaywallModal visible onClose={onClose} />, { wrapper: Wrapper });

    expect(screen.queryByTestId('paywall-modal')).toBeNull();
    expect(RevenueCatAPI.getOfferings).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    const { trackProductEvent } = jest.requireMock('@/lib/posthog');
    expect(trackProductEvent).toHaveBeenCalledWith('Paywall Journey', {
      stage: 'entry_blocked',
      context: 'general',
      plan: 'none',
      reason: 'onboarding_gate',
    });
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

    fireEvent.press(screen.getByText('Watch and get 10'));

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

    fireEvent.press(screen.getByText('Watch and get 10'));

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

      fireEvent.press(screen.getByText('Watch and get 10'));

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

    fireEvent.press(screen.getByText('Watch and get 10'));

    expect(await screen.findByText('Reward not earned')).toBeTruthy();
    expect(
      screen.getByText('Watch the full ad to collect the reward.')
    ).toBeTruthy();
    expect(screen.queryByText('Ad unavailable')).toBeNull();
    expect(screen.queryByTestId('paywall-ad-success-receipt')).toBeNull();
  });

  it('shows the exact remaining amount and the next ad at the funding gate', async () => {
    const onWatchAd = jest.fn(async () => ({ earned: true, amount: 10 }));

    render(
      <PaywallModal
        visible
        onClose={jest.fn()}
        onWatchAd={onWatchAd}
        context="challenge"
        variant="insufficient"
        shortfall={30}
        balance={0}
        requiredAmount={30}
        adRewardAmount={10}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('30 Momenta to go')).toBeTruthy();
    expect(
      screen.getByText('Pick a way. Your promise waits here.')
    ).toBeTruthy();
    expect(screen.getByText('You have 0')).toBeTruthy();
    expect(screen.getByText('New promise · 30')).toBeTruthy();

    fireEvent.press(screen.getByText('Watch and get 10'));

    expect(await screen.findByText('+10 in. 20 to go.')).toBeTruthy();
    expect(screen.getByText('2 more ads and you’re there.')).toBeTruthy();
    expect(screen.getByTestId('paywall-ad-success-receipt')).toBeTruthy();
    expect(
      screen.getByTestId('momenta-top-up-primary').props.accessibilityLabel ??
        screen.getAllByText('Watch another').length
    ).toBeTruthy();
  });

  it('says the person is set only once confirmed ads cover the shortfall', async () => {
    const onClose = jest.fn();
    render(
      <PaywallModal
        visible
        onClose={onClose}
        onWatchAd={jest.fn(async () => ({ earned: true, amount: 50 }))}
        context="challenge"
        variant="insufficient"
        shortfall={20}
        adRewardAmount={50}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.queryByText('You’re all set')).toBeNull();
    fireEvent.press(screen.getByText('Watch and get 50'));

    expect(await screen.findByText('You’re all set')).toBeTruthy();
    fireEvent.press(screen.getByText('Back to my promise'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the saved draft and Pro path when ads are unavailable', async () => {
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

    expect(screen.getByText('Pick a way. Your group waits here.')).toBeTruthy();
    expect(screen.queryByText(/Watch and get/)).toBeNull();
    expect(screen.queryByTestId('momenta-top-up-option-ad')).toBeNull();

    fireEvent.press(screen.getByTestId('momenta-top-up-primary'));
    fireEvent.press(await screen.findByText('See Pro plans'));
    expect(await screen.findByRole('radio', { name: /^Weekly/ })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Restore purchases' })
    ).toBeTruthy();
  });

  it('closes back to the draft from the top-up sheet', () => {
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

    fireEvent.press(screen.getByTestId('momenta-top-up-not-now'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the actual weekly renewal price before checkout without a value claim', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    await reviewWeeklyOffer();
    expect(screen.getByText('$9.99')).toBeTruthy();
    expect(
      screen.getAllByText('$9.99 billed each week. Renews automatically.')
    ).not.toHaveLength(0);
    expect(screen.queryByText('Best option')).toBeNull();
    expect(screen.queryByText('$2.30/week')).toBeNull();
    expect(screen.getByText('Subscribe to Pro')).toBeTruthy();
    expect(
      screen.getByText(
        'Cancel in your store subscription settings before the next renewal. Your access continues until the paid period ends.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Best value')).toBeNull();
  });

  it('explains Pro before asking for a plan choice', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText('More active promises and groups')).toBeTruthy();
    expect(screen.queryByRole('radio')).toBeNull();
    fireEvent.press(screen.getByText('See Pro plans'));
    expect(await screen.findByRole('radio', { name: /^Weekly/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /^Yearly/ })).toBeTruthy();
    expect(screen.queryByText('Subscribe to Pro')).toBeNull();
  });

  it('opens the direct paywall with one human promise and no ornamental label', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByText('Menta Pro')).toBeTruthy();
    expect(
      screen.getByText(
        'Menta Pro gives you more space for the promises you want to keep.'
      )
    ).toBeTruthy();
    expect(screen.getByText('More active promises and groups')).toBeTruthy();
    expect(screen.getByText('See Pro plans')).toBeTruthy();
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

    fireEvent.press(screen.getByText('See Pro plans'));
    expect(await screen.findByRole('radio', { name: /^Weekly/ })).toBeTruthy();
    expect(screen.queryByText(/Watch ad for/)).toBeNull();
    expect(screen.queryByText(/Watch one short ad/)).toBeNull();
    expect(onWatchAd).not.toHaveBeenCalled();
  });

  it('keeps the close action available through offer and purchase recovery', async () => {
    const onClose = jest.fn();
    render(<PaywallModal visible onClose={onClose} context="general" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByRole('button', { name: 'Close paywall' })).toBeTruthy();
    await reviewWeeklyOffer();
    fireEvent.press(screen.getByText('Subscribe to Pro'));
    expect(await screen.findByText("Purchase didn't go through")).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Close paywall' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('exposes mutually exclusive plan choices without starting checkout', async () => {
    const { purchasePlan } = jest.requireMock('@/lib/paywall/revenuecat');
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });
    fireEvent.press(screen.getByText('See Pro plans'));
    const weekly = await screen.findByRole('radio', { name: /^Weekly/ });
    const annual = screen.getByRole('radio', { name: /^Yearly/ });
    // Paper J02 leads with yearly.
    expect(weekly.props.accessibilityState.checked).toBe(false);
    expect(annual.props.accessibilityState.checked).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Continue with yearly' })
    ).toBeEnabled();
    fireEvent.press(weekly);
    expect(
      screen.getByRole('button', { name: 'Continue with weekly' })
    ).toBeEnabled();
    expect(
      screen.getByRole('radio', { name: /^Weekly/ }).props.accessibilityState
        .checked
    ).toBe(true);
    expect(
      screen.getByRole('radio', { name: /^Yearly/ }).props.accessibilityState
        .checked
    ).toBe(false);
    fireEvent.press(annual);
    expect(
      screen.getByRole('radio', { name: /^Weekly/ }).props.accessibilityState
        .checked
    ).toBe(false);
    expect(
      screen.getByRole('radio', { name: /^Yearly/ }).props.accessibilityState
        .checked
    ).toBe(true);
    expect(purchasePlan).not.toHaveBeenCalled();
  });
  it('applies the equipped theme to the selected plan while preserving radio semantics', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: EmberWrapper,
    });
    fireEvent.press(screen.getByText('See Pro plans'));
    fireEvent.press(await screen.findByRole('radio', { name: /^Weekly/ }));
    const selected = screen.getByRole('radio', { name: /^Weekly/ });
    expect(selected.props.accessibilityState.checked).toBe(true);
    expect(
      selected
        .findAllByType(View)
        .some(
          node =>
            StyleSheet.flatten(node.props.style)?.borderColor ===
            'rgba(231, 168, 109, 0.55)'
        )
    ).toBe(true);
    expect(screen.getByRole('button', { name: 'Close paywall' })).toBeTruthy();
  });
  it('keeps a long localised price in the accessible option and exact checkout terms', async () => {
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat');
    RevenueCatAPI.getOfferings.mockResolvedValueOnce({
      current: {
        availablePackages: [
          {
            identifier: '$rc_weekly',
            packageType: 'WEEKLY',
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
    fireEvent.press(screen.getByText('See Pro plans'));
    const option = await screen.findByRole('radio', { name: /^Weekly/ });
    expect(option.props.accessibilityLabel).toContain(
      'Rp1.590.000,00 billed each week.'
    );
    fireEvent.press(option);
    fireEvent.press(screen.getByText(/^Continue with (weekly|yearly)/i));
    expect(await screen.findByText('Rp1.590.000,00')).toBeTruthy();
    expect(
      screen.getAllByText(
        'Rp1.590.000,00 billed each week. Renews automatically.'
      )
    ).not.toHaveLength(0);
  });
  it('requires a review of exact terms before offering checkout', async () => {
    const { purchasePlan } = jest.requireMock('@/lib/paywall/revenuecat');
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });
    fireEvent.press(screen.getByText('See Pro plans'));
    expect(screen.queryByText('Subscribe to Pro')).toBeNull();
    fireEvent.press(await screen.findByRole('radio', { name: /^Yearly/ }));
    expect(screen.queryByText('Subscribe to Pro')).toBeNull();
    fireEvent.press(screen.getByText(/^Continue with (weekly|yearly)/i));
    expect(await screen.findByText('Your Pro plan.')).toBeTruthy();
    expect(
      screen.getAllByText('$59.99 billed each year. Renews automatically.')
    ).not.toHaveLength(0);
    expect(screen.getByText('Subscribe to Pro')).toBeTruthy();
    expect(purchasePlan).not.toHaveBeenCalled();
  });
  it('keeps the weekly price localised from RevenueCat', async () => {
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat');
    RevenueCatAPI.getOfferings.mockResolvedValueOnce({
      current: {
        availablePackages: [
          {
            identifier: '$rc_weekly',
            packageType: 'WEEKLY',
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
    fireEvent.press(screen.getByText('See Pro plans'));
    const option = await screen.findByRole('radio', { name: /^Weekly/ });
    expect(option.props.accessibilityLabel).toContain(
      'NZ$9.99 billed each week.'
    );
    fireEvent.press(option);
    fireEvent.press(screen.getByText(/^Continue with (weekly|yearly)/i));
    expect(await screen.findByText('NZ$9.99')).toBeTruthy();
    expect(
      screen.getAllByText('NZ$9.99 billed each week. Renews automatically.')
    ).not.toHaveLength(0);
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

    await reviewWeeklyOffer();
    fireEvent.press(screen.getByText('Subscribe to Pro'));

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

    await reviewWeeklyOffer();
    fireEvent.press(screen.getByText('Subscribe to Pro'));
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

    await reviewWeeklyOffer();
    fireEvent.press(screen.getByText('Subscribe to Pro'));
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

    await reviewWeeklyOffer();
    fireEvent.press(screen.getByText('Subscribe to Pro'));
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
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat') as {
      purchasePlan: jest.Mock;
    };
    revenueCat.purchasePlan.mockReturnValueOnce(new Promise(() => {}));

    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });

    await act(async () => {});
    await reviewWeeklyOffer();
    jest.useFakeTimers();
    fireEvent.press(screen.getByText('Subscribe to Pro'));

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

    await reviewWeeklyOffer();
    fireEvent.press(screen.getByText('Subscribe to Pro'));

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

    await reviewWeeklyOffer();
    fireEvent.press(screen.getByText('Subscribe to Pro'));

    expect(await screen.findByText('Menta Pro is active')).toBeTruthy();
    expect(screen.getByText('You can use your Pro features now.')).toBeTruthy();
    const { trackProductEvent } = jest.requireMock('@/lib/posthog') as {
      trackProductEvent: jest.Mock;
    };
    expect(trackProductEvent).toHaveBeenCalledWith('Subscription Started', {
      plan: 'weekly',
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

    fireEvent.press(screen.getByText('See Pro plans'));
    fireEvent.press(
      await screen.findByRole('button', { name: 'Restore purchases' })
    );

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

    fireEvent.press(screen.getByText('See Pro plans'));
    fireEvent.press(
      await screen.findByRole('button', { name: 'Restore purchases' })
    );

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

    await reviewWeeklyOffer();
    fireEvent.press(screen.getByText('Subscribe to Pro'));

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

    fireEvent.press(screen.getByText('See Pro plans'));
    fireEvent.press(
      await screen.findByRole('button', { name: 'Restore purchases' })
    );

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

    fireEvent.press(screen.getByText('See Pro plans'));
    fireEvent.press(
      await screen.findByRole('button', { name: 'Restore purchases' })
    );

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

    fireEvent.press(screen.getByText('See Pro plans'));
    fireEvent.press(
      await screen.findByRole('button', { name: 'Restore purchases' })
    );

    expect(
      await screen.findByText('Pro is taking longer to activate')
    ).toBeTruthy();
    expect(
      screen.getByText("Don't buy Pro again while Menta checks your access.")
    ).toBeTruthy();
    expect(screen.queryByText(/Continue to .* checkout/)).toBeNull();
  });

  it('shows an unavailable-plan state when RevenueCat has no current offering', async () => {
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat');
    RevenueCatAPI.getOfferings.mockResolvedValueOnce(null);
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });
    fireEvent.press(screen.getByText('See Pro plans'));
    expect(
      await screen.findByText('Plans aren’t available right now')
    ).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /^Continue with (?!free)/i })
    ).toBeDisabled();
  });
  it('does not expose a native checkout when purchases are unsupported', async () => {
    const revenueCat = jest.requireMock('@/lib/paywall/revenuecat');
    revenueCat.REVENUECAT_SUPPORTED = false;
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Menta Pro')).toBeTruthy();
    fireEvent.press(screen.getByText('See Pro plans'));
    expect(
      await screen.findByText('Plans aren’t available right now')
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /^Continue with (?!free)/i })
    ).toBeDisabled();
    expect(screen.queryByText('Subscribe to Pro')).toBeNull();
    expect(screen.queryByText(/native build|configured/i)).toBeNull();
    expect(revenueCat.purchasePlan).not.toHaveBeenCalled();
  });
  it('announces loading and prevents checkout while live store plans load', async () => {
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat');
    RevenueCatAPI.getOfferings.mockReturnValueOnce(new Promise(() => {}));
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });
    fireEvent.press(screen.getByText('See Pro plans'));
    expect(
      await screen.findByRole('progressbar', {
        name: 'Loading plans from the store',
      })
    ).toBeTruthy();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(
      screen.getByRole('button', { name: /^Continue with (?!free)/i })
    ).toBeDisabled();
    expect(screen.queryByText('Subscribe to Pro')).toBeNull();
  });
  it('explains the Apple handoff before opening subscription management', async () => {
    const { RevenueCatAPI } = jest.requireMock('@/lib/paywall/revenuecat');
    render(
      <PaywallModal
        visible
        initialView="active"
        onClose={jest.fn()}
        context="general"
      />,
      { wrapper: Wrapper }
    );
    fireEvent.press(await screen.findByText('Manage subscription'));
    expect(screen.getByTestId('paywall-state-manage')).toBeTruthy();
    expect(screen.getByText('Manage Menta Pro')).toBeTruthy();
    expect(screen.getByText('Continue in Apple Settings')).toBeTruthy();
    expect(RevenueCatAPI.showManageSubscriptions).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Continue in Apple Settings'));
    await waitFor(() =>
      expect(RevenueCatAPI.showManageSubscriptions).toHaveBeenCalledTimes(1)
    );
  });
  it('exposes legal links and restore before the subscription decision', async () => {
    render(<PaywallModal visible onClose={jest.fn()} context="general" />, {
      wrapper: Wrapper,
    });
    await reviewWeeklyOffer();
    expect(
      screen.getByRole('button', { name: 'Restore purchases' })
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeTruthy();
    expect(screen.getByText('Subscribe to Pro')).toBeTruthy();
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
      expect(shellStyle.flex).toBe(1);
      expect(shellStyle.minHeight).toBe(0);
      expect(shellStyle.borderRadius).toBe(0);
      expect(shellStyle.maxWidth).toBeUndefined();
    }
  );
});
