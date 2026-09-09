export type VerificationStatus = 'approved' | 'pending' | 'rejected' | 'unknown';

type VerificationPayload = {
  status?: string | null;
  allowSelfReview?: boolean | null;
  data?: {
    status?: string | null;
    allowSelfReview?: boolean | null;
  } | null;
};

export const getVerificationOutcome = (payload: VerificationPayload): {
  status: VerificationStatus;
  isSolo: boolean;
} => {
  const rawStatus = payload?.data?.status ?? payload?.status ?? 'unknown';
  const status: VerificationStatus =
    rawStatus === 'approved' ||
    rawStatus === 'pending' ||
    rawStatus === 'rejected'
      ? rawStatus
      : 'unknown';

  const isSolo = Boolean(
    payload?.allowSelfReview ??
      payload?.data?.allowSelfReview ??
      status === 'approved',
  );

  return { status, isSolo };
};
