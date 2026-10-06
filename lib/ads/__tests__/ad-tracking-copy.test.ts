import { getAdTrackingSkipCopy } from '@/lib/ads/ad-tracking-copy';
import { translate } from '@/lib/localization/translate';

describe('ad tracking skip copy', () => {
  it('names Settings as the destination instead of Not now', () => {
    expect(getAdTrackingSkipCopy()).toBe('Back to settings');
    expect(getAdTrackingSkipCopy().toLowerCase()).not.toContain('not now');
  });

  it('reuses the shared settings back label rather than ad measurement Not now', () => {
    expect(getAdTrackingSkipCopy()).toBe(
      translate('en-NZ', 'fullAuth.shared.back_to_settings')
    );
    expect(getAdTrackingSkipCopy()).not.toBe(
      translate('en-NZ', 'shared.adTracking.notNow')
    );
  });
});
