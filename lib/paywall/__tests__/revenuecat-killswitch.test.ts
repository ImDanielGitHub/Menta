const mockFlags: Record<string, boolean> = {
  safe_mode: false,
  revenuecat_enabled: true,
};
const mockConfigure = jest.fn();
const mockLogIn = jest.fn();
const mockOfferings = jest.fn().mockResolvedValue({ current: null });
const mockPurchase = jest.fn();
const mockRestore = jest.fn();
jest.mock('@/lib/operational-flags', () => ({
  getOperationalFlag: (key: string) => mockFlags[key],
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: 'standalone',
    expoConfig: { extra: { revenuecatIosKey: 'appl_test_public' } },
  },
}));
jest.mock('react-native-purchases', () => ({
  configure: mockConfigure,
  logIn: mockLogIn,
  getOfferings: mockOfferings,
  purchasePackage: mockPurchase,
  restorePurchases: mockRestore,
}));
jest.mock('@/lib/toast-provider', () => ({ showGlobalToast: jest.fn() }));
jest.mock('@/lib/localization/translate', () => ({
  translate: (_locale: string, key: string) => key,
}));
jest.mock('@/lib/profile-api', () => ({
  getMyProAuthority: jest.fn().mockResolvedValue({ isPro: false }),
}));
jest.mock('@/store/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'account' } }) },
}));
jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockFlags.safe_mode = false;
  mockFlags.revenuecat_enabled = true;
});
it.each(['safe_mode', 'revenuecat_enabled'])(
  'blocks SDK import/use through every commerce entry point when %s disables commerce',
  async flag => {
    mockFlags[flag] = flag === 'safe_mode';
    const api = require('../revenuecat') as typeof import('../revenuecat');
    await api.RevenueCatAPI.initialize('account');
    await api.RevenueCatAPI.logIn('account');
    await api.RevenueCatAPI.getOfferings();
    await api.purchasePlan('weekly');
    await api.purchaseCredits('large');
    await api.restorePurchases();
    expect(mockConfigure).not.toHaveBeenCalled();
    expect(mockLogIn).not.toHaveBeenCalled();
    expect(mockOfferings).not.toHaveBeenCalled();
    expect(mockPurchase).not.toHaveBeenCalled();
    expect(mockRestore).not.toHaveBeenCalled();
  }
);
it('allows the SDK when enabled and stops further SDK calls when safe mode changes', async () => {
  const api = require('../revenuecat') as typeof import('../revenuecat');
  await api.RevenueCatAPI.initialize('account');
  await api.RevenueCatAPI.getOfferings();
  expect(mockConfigure).toHaveBeenCalledTimes(1);
  expect(mockOfferings).toHaveBeenCalledTimes(1);
  mockFlags.safe_mode = true;
  await api.RevenueCatAPI.getOfferings();
  await api.RevenueCatAPI.logIn('account');
  expect(mockOfferings).toHaveBeenCalledTimes(1);
  expect(mockLogIn).not.toHaveBeenCalled();
});
it('does not purchase when commerce is disabled during an offering request', async () => {
  mockOfferings.mockImplementationOnce(async () => {
    mockFlags.safe_mode = true;
    return {
      current: {
        identifier: 'default',
        availablePackages: [
          {
            identifier: '$rc_weekly',
            packageType: 'WEEKLY',
            product: { identifier: 'pro_weekly' },
          },
        ],
      },
      all: {},
    };
  });
  const api = require('../revenuecat') as typeof import('../revenuecat');
  await api.purchasePlan('weekly');
  expect(mockPurchase).not.toHaveBeenCalled();
});
