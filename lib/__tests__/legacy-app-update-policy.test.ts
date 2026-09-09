import {
  compareLegacyAppVersions,
  resolveLegacyUpdateDecision,
  shouldPresentLegacyUpdate,
} from '@/lib/legacy-app-update-policy';
import type { Tables } from '@/lib/database.types';

const policy = (
  overrides: Partial<Tables<'app_update_policies'>> = {}
): Tables<'app_update_policies'> => ({
  android_minimum_version: '1.9.2',
  android_store_available: false,
  enabled: true,
  ios_minimum_version: '1.9.2',
  ios_store_available: true,
  key: 'menta_1_9_2_update_policy',
  mode: 'required',
  release: '1.9.2',
  schema_version: 1,
  updated_at: '2026-08-30T00:00:00.000Z',
  ...overrides,
});

describe('legacy app update policy', () => {
  it('compares installed versions without lexical ordering mistakes', () => {
    expect(compareLegacyAppVersions('1.9', '1.9.2')).toBe(-1);
    expect(compareLegacyAppVersions('1.10.0', '1.9.2')).toBe(1);
    expect(compareLegacyAppVersions('1.9.2', '1.9.2')).toBe(0);
    expect(compareLegacyAppVersions('unknown', '1.9.2')).toBeNull();
  });

  it('requires the iOS update only when fresh public authority enables it', () => {
    expect(
      resolveLegacyUpdateDecision({
        currentVersion: '1.9.0',
        platform: 'ios',
        row: policy(),
      })
    ).toMatchObject({
      status: 'offer',
      mode: 'required',
      minimumVersion: '1.9.2',
    });

    expect(
      resolveLegacyUpdateDecision({
        currentVersion: '1.9.2',
        platform: 'ios',
        row: policy(),
      })
    ).toEqual({ status: 'current' });
  });

  it('fails open for missing, disabled, malformed or unavailable authority', () => {
    expect(
      resolveLegacyUpdateDecision({
        currentVersion: '1.8.0',
        platform: 'ios',
        row: null,
      })
    ).toEqual({ status: 'authority_unknown' });

    expect(
      resolveLegacyUpdateDecision({
        currentVersion: '1.8.0',
        platform: 'ios',
        row: policy({ enabled: false }),
      })
    ).toEqual({ status: 'kill_switch' });

    expect(
      resolveLegacyUpdateDecision({
        currentVersion: '1.8.0',
        platform: 'ios',
        row: policy({ mode: 'surprise' }),
      })
    ).toEqual({ status: 'authority_unknown' });

    expect(
      resolveLegacyUpdateDecision({
        currentVersion: '1.8.0',
        platform: 'android',
        row: policy(),
      })
    ).toEqual({ status: 'authority_unknown' });
  });

  it('keeps account recovery and support reachable in required mode', () => {
    expect(shouldPresentLegacyUpdate('/(tabs)', 'required')).toBe(true);
    expect(shouldPresentLegacyUpdate('/password-recovery', 'required')).toBe(
      false
    );
    expect(shouldPresentLegacyUpdate('/support', 'required')).toBe(false);
  });
});
