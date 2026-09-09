import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  dismissOptionalUpdate,
  getStoreAttemptUpgradeOutcome,
  hasDismissedOptionalUpdate,
  recordStoreOpenAttempt,
} from '@/lib/app-update-state';

describe('app update adoption state', () => {
  beforeEach(() => AsyncStorage.clear());

  it('dismisses only the current optional target', async () => {
    await dismissOptionalUpdate('1.9.2');
    await expect(hasDismissedOptionalUpdate('1.9.2')).resolves.toBe(true);
    await expect(hasDismissedOptionalUpdate('1.9.3')).resolves.toBe(false);
  });

  it('distinguishes a return without updating from a successful upgrade', async () => {
    await recordStoreOpenAttempt('1.9.2');
    await expect(getStoreAttemptUpgradeOutcome('1.9.1')).resolves.toBe(
      'still_old_version'
    );
    await expect(getStoreAttemptUpgradeOutcome('1.9.2')).resolves.toBe(
      'successful_upgrade'
    );
    await expect(getStoreAttemptUpgradeOutcome('1.9.2')).resolves.toBe('none');
  });
});
