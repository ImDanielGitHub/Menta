import Constants from 'expo-constants';

const TRUEISH_VALUES = new Set(['1', 'true', 'yes', 'on']);

const normalizeFlag = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
};

const readExpoExtra = (): Record<string, unknown> => {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== 'object') {
    return {};
  }

  return extra as Record<string, unknown>;
};

export const getExpoExtraString = (key: string): string | undefined => {
  const value = readExpoExtra()[key];
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const isE2EMode = (): boolean => {
  const envValue = normalizeFlag(process.env.EXPO_PUBLIC_E2E_MODE);
  if (TRUEISH_VALUES.has(envValue)) {
    return true;
  }

  const extraValue = normalizeFlag(readExpoExtra().e2eMode);
  return TRUEISH_VALUES.has(extraValue);
};
