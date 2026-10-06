import {
  getJoinFundingMembershipWithoutReceiptCopy,
  getJoinFundingNoReceiptCopy,
  getJoinFundingRetryLabel,
} from '../join-funding-copy';

describe('join funding receipt fallbacks', () => {
  it('keeps an owned membership message and does not invent a debit', () => {
    expect(
      getJoinFundingMembershipWithoutReceiptCopy(
        'Membership is confirmed, but there is no join debit receipt. No Momenta charge is being claimed.'
      )
    ).toBe(
      'Membership is confirmed, but there is no join debit receipt. No Momenta charge is being claimed.'
    );
  });

  it('names a missing membership receipt as no claimed Momenta debit', () => {
    const copy = getJoinFundingMembershipWithoutReceiptCopy(null);

    expect(copy).toContain('Membership is confirmed');
    expect(copy).toContain('no join debit receipt');
    expect(copy).toContain('No Momenta charge is being claimed');
    expect(copy.toLowerCase()).not.toMatch(/authoritative|server|this screen/);
  });

  it('names a missing join result as a safe retry, not an internal failure', () => {
    const copy = getJoinFundingNoReceiptCopy('   ');

    expect(copy).toContain('No membership or join receipt was found');
    expect(copy).toContain('retry the same request safely');
    expect(copy.toLowerCase()).not.toMatch(/authoritative|server/);
    expect(getJoinFundingRetryLabel()).toBe('Try again');
  });
});
