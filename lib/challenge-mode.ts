export type ChallengeMode = 'solo' | 'group';

type ParamValue = string | string[] | undefined;

export type ChallengeCreateSearchParams = {
  mode?: ParamValue;
  solo?: ParamValue;
  type?: ParamValue;
  allowSelfReview?: ParamValue;
  groupId?: ParamValue;
  templateId?: ParamValue;
  title?: ParamValue;
  verificationType?: ParamValue;
  reminderTime?: ParamValue;
  source?: ParamValue;
};

const toSingle = (value: ParamValue): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const isTruthy = (value: ParamValue): boolean => {
  const single = toSingle(value);
  if (!single) return false;
  const normalized = single.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

export const resolveChallengeMode = (
  params: ChallengeCreateSearchParams
): {
  mode: ChallengeMode;
  groupId: string | null;
  usedLegacyParams: boolean;
} => {
  const explicitMode = toSingle(params.mode)?.trim().toLowerCase();
  const groupId = toSingle(params.groupId) ?? null;

  if (explicitMode === 'solo' || explicitMode === 'group') {
    return {
      mode: explicitMode,
      groupId: explicitMode === 'solo' ? null : groupId,
      usedLegacyParams: false,
    };
  }

  const legacySolo =
    toSingle(params.type)?.trim().toLowerCase() === 'solo' ||
    isTruthy(params.allowSelfReview) ||
    isTruthy(params.solo);

  return {
    mode: legacySolo ? 'solo' : 'group',
    groupId: legacySolo ? null : groupId,
    usedLegacyParams: true,
  };
};
