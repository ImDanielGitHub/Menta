export type ProofAdBreakHint = {
  due: boolean;
  ordinal: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

/**
 * Decode optional cadence metadata without making it part of proof authority.
 * The hint RPC includes `success`; a future submit receipt may omit it.
 */
export const decodeProofAdBreakHint = (
  value: unknown
): ProofAdBreakHint | null => {
  if (!isRecord(value)) return null;
  if (value.success !== undefined && value.success !== true) return null;
  if (typeof value.due !== 'boolean' || !isPositiveInteger(value.ordinal)) {
    return null;
  }
  return { due: value.due, ordinal: value.ordinal };
};
