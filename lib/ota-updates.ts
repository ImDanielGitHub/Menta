import * as Updates from 'expo-updates';

export type OtaUpdateDownloadResult = 'current' | 'ready' | 'unavailable';

export const downloadAvailableOtaUpdate =
  async (): Promise<OtaUpdateDownloadResult> => {
    if (__DEV__ || !Updates.isEnabled) return 'unavailable';

    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return 'current';

    const fetched = await Updates.fetchUpdateAsync();
    return fetched.isNew ? 'ready' : 'current';
  };

export const restartIntoDownloadedOta = async (): Promise<void> => {
  await Updates.reloadAsync();
};
