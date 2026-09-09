import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ADVANCED_DIAGNOSTICS_STORAGE_KEY,
  getAdvancedDiagnosticsEnabled,
  setAdvancedDiagnosticsEnabled,
} from '@/lib/advanced-diagnostics-preference';

describe('advanced diagnostics preference', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to off when no explicit device choice exists', async () => {
    await expect(getAdvancedDiagnosticsEnabled()).resolves.toBe(false);
  });

  it('persists an explicit opt-in and later revocation', async () => {
    await setAdvancedDiagnosticsEnabled(true);
    await expect(getAdvancedDiagnosticsEnabled()).resolves.toBe(true);

    await setAdvancedDiagnosticsEnabled(false);
    await expect(getAdvancedDiagnosticsEnabled()).resolves.toBe(false);
  });

  it('keeps malformed storage safely off', async () => {
    await AsyncStorage.setItem(ADVANCED_DIAGNOSTICS_STORAGE_KEY, '{bad-json');

    await expect(getAdvancedDiagnosticsEnabled()).resolves.toBe(false);
  });

  it('requires fresh consent after the replay disclosure expands', async () => {
    await AsyncStorage.setItem(
      'menta.advanced-diagnostics.v1',
      JSON.stringify({
        enabled: true,
        updatedAt: '2026-08-14T00:00:00.000Z',
        version: 1,
      })
    );

    await expect(getAdvancedDiagnosticsEnabled()).resolves.toBe(false);
  });
});
