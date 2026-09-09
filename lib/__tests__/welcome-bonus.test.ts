import {
  getWelcomeBonusClaimLaterKey,
  getWelcomeBonusGrantedKey,
  isWelcomeBonusTransaction,
} from '@/lib/welcome-bonus';

describe('welcome bonus helpers', () => {
  it('recognizes canonical welcome bonus ledger entries', () => {
    expect(
      isWelcomeBonusTransaction({
        external_reference_id: 'welcome_bonus_v1:user-1',
        transaction_type: 'bonus',
      })
    ).toBe(true);
    expect(
      isWelcomeBonusTransaction({
        reason: 'Welcome bonus',
        transaction_type: 'bonus',
      })
    ).toBe(true);
    expect(
      isWelcomeBonusTransaction({
        description: 'Onboarding bonus',
        transaction_type: 'bonus',
      })
    ).toBe(true);
  });

  it('does not treat unrelated bonus transactions as welcome claims', () => {
    expect(
      isWelcomeBonusTransaction({
        transaction_type: 'bonus',
        reason: 'rewarded_ad',
        description: 'Watched an ad',
      })
    ).toBe(false);
  });

  it('keeps local cache keys explicit', () => {
    expect(getWelcomeBonusGrantedKey('user-1')).toBe(
      'welcome_bonus_granted_user-1'
    );
    expect(getWelcomeBonusClaimLaterKey('user-1')).toBe(
      'welcome_bonus_claim_later_user-1'
    );
  });
});
