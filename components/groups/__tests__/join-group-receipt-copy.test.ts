import { getJoinGroupReceiptCopy } from '@/components/groups/JoinGroupOutcomeSections';

describe('getJoinGroupReceiptCopy', () => {
  it('names a paid join as Momenta spent instead of a stake', () => {
    const copy = getJoinGroupReceiptCopy({
      alreadyMember: false,
      joinCost: 25,
      groupName: 'Night Shift',
    });

    expect(copy.spendLabel).toBe('Momenta spent');
    expect(copy.spendValue).toBe('25 Momenta');
    expect(copy.description).toContain('You spent 25 Momenta');
    expect(copy.description.toLowerCase()).not.toContain('stake');
  });

  it('says the first group is free when nothing was spent', () => {
    const copy = getJoinGroupReceiptCopy({
      alreadyMember: false,
      joinCost: 0,
      groupName: 'Night Shift',
    });

    expect(copy.spendValue).toBe('0 Momenta');
    expect(copy.description).toContain('Your first group is free');
  });

  it('keeps an already-member receipt at zero spend', () => {
    const copy = getJoinGroupReceiptCopy({
      alreadyMember: true,
      joinCost: 25,
      groupName: 'Night Shift',
    });

    expect(copy.spendValue).toBe('0 Momenta');
    expect(copy.description).toContain('No Momenta spent');
  });
});
