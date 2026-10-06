import { supabase } from '@/lib/supabase';

export type DueProofTarget = {
  challengeId: string;
  verificationType: string | null;
};

const decodeDueProofTarget = (value: unknown): DueProofTarget | null => {
  if (!Array.isArray(value) || value.length === 0) return null;

  const first = value[0];
  if (!first || typeof first !== 'object') return null;

  const row = first as Record<string, unknown>;
  if (
    typeof row.challenge_id !== 'string' ||
    row.challenge_id.trim().length === 0
  ) {
    return null;
  }

  return {
    challengeId: row.challenge_id,
    verificationType:
      typeof row.verification_type === 'string' ? row.verification_type : null,
  };
};

export const getMyFirstDueProofTarget = async (
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
): Promise<DueProofTarget | null> => {
  const { data, error } = await supabase.rpc('get_my_due_proof_targets_v1', {
    p_timezone: timezone,
  });

  if (error) throw error;
  return decodeDueProofTarget(data);
};
