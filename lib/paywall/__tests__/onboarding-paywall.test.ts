import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  resolveOnboardingPaywall,
  ONBOARDING_PAYWALL_FLAG,
} from '../onboarding-paywall';
jest.mock('@/store/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'member' } }) },
}));
it('releases a previously assigned hard paywall without consulting remote flags', async () => {
  await AsyncStorage.setItem(
    `@menta/${ONBOARDING_PAYWALL_FLAG}/member`,
    'hard_paywall'
  );
  await expect(resolveOnboardingPaywall('member')).resolves.toEqual({
    variant: 'control',
    enrolled: false,
    requiresPurchase: false,
  });
});
it('does not resolve another account’s onboarding', async () => {
  await expect(resolveOnboardingPaywall('someone-else')).rejects.toThrow(
    'account changed'
  );
});
