import { requireOptionalNativeModule } from 'expo-modules-core';
import { redirectSystemPath } from '@/app/+native-intent';
import { normalizeNativeIntentPath } from '@/lib/app-intents/native-router-path';

jest.mock('expo-modules-core', () => ({
  ...jest.requireActual('expo-modules-core'),
  requireOptionalNativeModule: jest.fn(),
}));

const nativeModule = jest.mocked(requireOptionalNativeModule);

describe('widget setup launch intent after OTA restart', () => {
  beforeEach(() => {
    nativeModule.mockReturnValue({ initialContext: { restartCount: 1 } });
  });

  it.each([
    'menta://home-widget',
    'lockedin:///home-widget',
    '/home-widget?from=widget',
  ])('does not replay the cached setup URL %s on JS restart', path => {
    expect(redirectSystemPath({ path, initial: true })).toBe('/(tabs)');
  });

  it('does not allow the secondary root URL handler to reopen setup after the redirect', () => {
    const cachedUrl = 'menta://home-widget';
    expect(redirectSystemPath({ path: cachedUrl, initial: true })).toBe(
      '/(tabs)'
    );
    expect(normalizeNativeIntentPath(cachedUrl)).toBeNull();
  });

  it('preserves a fresh cold widget tap', () => {
    nativeModule.mockReturnValue({ initialContext: { restartCount: 0 } });
    expect(
      redirectSystemPath({ path: 'menta://home-widget', initial: true })
    ).toBe('menta://home-widget');
  });

  it('preserves explicit warm widget links after an earlier OTA restart', () => {
    expect(
      redirectSystemPath({ path: 'menta://home-widget', initial: false })
    ).toBe('menta://home-widget');
  });

  it('leaves the setup route available when the native counter is unavailable', () => {
    nativeModule.mockReturnValue(null);
    expect(
      redirectSystemPath({ path: 'menta://home-widget', initial: true })
    ).toBe('menta://home-widget');
  });

  it('preserves actionable promise links and other destinations', () => {
    expect(
      redirectSystemPath({
        path: 'menta://widget-open?promise=123',
        initial: true,
      })
    ).toBe('menta://widget-open?promise=123');
    expect(
      redirectSystemPath({ path: 'menta://settings', initial: true })
    ).toBe('/settings');
  });
});
