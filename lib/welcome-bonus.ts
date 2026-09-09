export type WelcomeBonusTransactionLike = {
  transaction_type?: string | null;
  reason?: string | null;
  description?: string | null;
  external_reference_id?: string | null;
};

export const getWelcomeBonusGrantedKey = (userId: string) =>
  `welcome_bonus_granted_${userId}`;

export const getWelcomeBonusClaimLaterKey = (userId: string) =>
  `welcome_bonus_claim_later_${userId}`;

export const isWelcomeBonusTransaction = (
  row: WelcomeBonusTransactionLike
): boolean => {
  const reference = String(row.external_reference_id || '').toLowerCase();
  const reason = String(row.reason || '').toLowerCase();
  const description = String(row.description || '').toLowerCase();

  return (
    reference.startsWith('welcome_bonus_v1:') ||
    reason.includes('welcome') ||
    description.includes('welcome bonus') ||
    description.includes('onboarding bonus')
  );
};
