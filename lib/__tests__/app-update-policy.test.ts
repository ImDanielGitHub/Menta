import {
  compareAppVersions,
  getMentaStoreUrl,
  resolveAppUpdateDecision,
  shouldPresentOptionalUpdateOnPath,
  shouldPresentRequiredUpdateOnPath,
} from '@/lib/app-update-policy';

const payload = {
  schema_version: 1,
  release: '1.9.2',
  platforms: {
    ios: { minimum_version: '1.9.2', store_available: true },
    android: { minimum_version: '1.9.2', store_available: false },
  },
};

describe('1.9.2 app update policy', () => {
  it('compares numeric app versions without lexical mistakes', () => {
    expect(compareAppVersions('1.9.1', '1.9.2')).toBe(-1);
    expect(compareAppVersions('1.9.2', '1.9.2')).toBe(0);
    expect(compareAppVersions('1.10.0', '1.9.2')).toBe(1);
    expect(compareAppVersions('development', '1.9.2')).toBeNull();
  });

  it('fails open until fresh remote authority is loaded', () => {
    expect(
      resolveAppUpdateDecision({
        currentVersion: '1.9.1',
        flagsLoaded: false,
        flagPayload: payload,
        flagValue: 'required',
        platform: 'ios',
      })
    ).toEqual({ status: 'authority_unknown' });
  });

  it('treats explicit false as the safe kill switch', () => {
    expect(
      resolveAppUpdateDecision({
        currentVersion: '1.9.1',
        flagsLoaded: true,
        flagPayload: payload,
        flagValue: false,
        platform: 'ios',
      })
    ).toEqual({ status: 'kill_switch' });
  });

  it('does not offer an update before store availability is confirmed', () => {
    expect(
      resolveAppUpdateDecision({
        currentVersion: '1.9.1',
        flagsLoaded: true,
        flagPayload: payload,
        flagValue: 'required',
        platform: 'android',
      })
    ).toEqual({ status: 'authority_unknown' });
  });

  it.each(['optional', 'required'] as const)(
    'resolves the %s phase only for an older eligible install',
    mode => {
      expect(
        resolveAppUpdateDecision({
          currentVersion: '1.9.1',
          flagsLoaded: true,
          flagPayload: JSON.stringify(payload),
          flagValue: mode,
          platform: 'ios',
        })
      ).toEqual({
        status: 'offer',
        mode,
        minimumVersion: '1.9.2',
        storeUrl: getMentaStoreUrl('ios'),
      });
    }
  );

  it('keeps current and newer versions out of the gate', () => {
    expect(
      resolveAppUpdateDecision({
        currentVersion: '1.9.2',
        flagsLoaded: true,
        flagPayload: payload,
        flagValue: 'required',
        platform: 'ios',
      })
    ).toEqual({ status: 'current' });
  });

  it('rejects malformed or wrong-release payloads', () => {
    expect(
      resolveAppUpdateDecision({
        currentVersion: '1.9.1',
        flagsLoaded: true,
        flagPayload: { ...payload, release: '1.9.3' },
        flagValue: 'required',
        platform: 'ios',
      })
    ).toEqual({ status: 'authority_unknown' });
  });

  it('preserves recovery and support while gating ordinary deep-link destinations', () => {
    expect(shouldPresentRequiredUpdateOnPath('/password-recovery')).toBe(false);
    expect(
      shouldPresentRequiredUpdateOnPath('/password-recovery/callback')
    ).toBe(false);
    expect(shouldPresentRequiredUpdateOnPath('/email-confirmation')).toBe(
      false
    );
    expect(
      shouldPresentRequiredUpdateOnPath('/email-confirmation/callback')
    ).toBe(false);
    expect(shouldPresentRequiredUpdateOnPath('/invite-activation')).toBe(false);
    expect(shouldPresentRequiredUpdateOnPath('/join-event')).toBe(false);
    expect(shouldPresentRequiredUpdateOnPath('/join-promise')).toBe(false);
    expect(shouldPresentRequiredUpdateOnPath('/support')).toBe(false);
    expect(shouldPresentRequiredUpdateOnPath('/report-issue')).toBe(false);
    expect(shouldPresentRequiredUpdateOnPath('/group-invite')).toBe(true);
    expect(shouldPresentRequiredUpdateOnPath('/review-queue')).toBe(true);
    expect(shouldPresentRequiredUpdateOnPath('/events/event-1')).toBe(true);
  });

  it('keeps optional prompting on settled Today only', () => {
    expect(shouldPresentOptionalUpdateOnPath('/')).toBe(true);
    expect(shouldPresentOptionalUpdateOnPath('/(tabs)')).toBe(true);
    expect(shouldPresentOptionalUpdateOnPath('/settings')).toBe(false);
  });
});
