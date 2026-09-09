import {
  getWalletBalanceNote,
  getWalletEarnSheetCopy,
  getWalletEmptyActivityCopy,
} from '@/lib/momenta/wallet-copy';

describe('wallet spend and earn copy', () => {
  it('teaches why Momenta exists without framing it as cash or a stake', () => {
    const note = getWalletBalanceNote();

    expect(note).toContain('first promise and group are free');
    expect(note).toContain('extra promises, groups, freezes and shop items');
    expect(note).toContain('no cash value');
    expect(note.toLowerCase()).not.toMatch(/crypto|stake|token/);
  });

  it('keeps earnings confirmed and optional', () => {
    expect(getWalletEmptyActivityCopy().detail).toContain('Confirmed rewards');
    expect(getWalletEarnSheetCopy().subtitle).toContain('confirmed reviews');
    expect(getWalletEarnSheetCopy().subtitle).toContain('optional sponsor');
  });
});
