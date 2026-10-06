import { getOptionalUpdateDismissCopy } from '@/lib/app-update-copy';
import { translate } from '@/lib/localization/translate';

describe('optional update dismiss copy', () => {
  it('names keeping this version instead of Not now', () => {
    expect(getOptionalUpdateDismissCopy()).toBe('Keep this version');
    expect(getOptionalUpdateDismissCopy().toLowerCase()).not.toContain(
      'not now'
    );
  });

  it('uses the dedicated update key rather than ad measurement copy', () => {
    expect(getOptionalUpdateDismissCopy()).not.toBe(
      translate('en-NZ', 'shared.adTracking.notNow')
    );
  });
});
