import {
  describeJoinGroupConfirmSpend,
  describeJoinGroupCostNotice,
  describeJoinGroupPreviewSpend,
  formatJoinGroupSpend,
  resolveJoinGroupPreview,
} from '../join-group-copy';

describe('join group cost copy', () => {
  it('names a first membership as free instead of a 10 Momenta charge', () => {
    expect(describeJoinGroupCostNotice(0)).toContain(
      'first join is free, whether it’s a promise or a group'
    );
    expect(describeJoinGroupPreviewSpend(0)).toBe('This join is free.');
    expect(formatJoinGroupSpend(0)).toBe('0 Momenta');
  });

  it('names a later join as a confirmed Momenta spend', () => {
    expect(describeJoinGroupCostNotice(10)).toContain(
      'Joining spends 10 Momenta'
    );
    expect(describeJoinGroupPreviewSpend(10)).toContain(
      'Joining spends 10 Momenta'
    );
    expect(formatJoinGroupSpend(10)).toBe('10 Momenta');
  });

  it('does not invent a price when the server quote is missing', () => {
    expect(describeJoinGroupCostNotice(null)).toContain(
      'If joining costs Momenta, you will see the amount'
    );
    expect(describeJoinGroupPreviewSpend(null)).toContain(
      'Previewing it has not changed anything'
    );
  });

  it('blocks a third active group before the join request', () => {
    expect(
      resolveJoinGroupPreview({
        cost: 10,
        activeGroups: 2,
        isPro: false,
      })
    ).toEqual({ kind: 'quota', limit: 2 });
  });

  it('lets Pro skip the free group cap', () => {
    expect(
      resolveJoinGroupPreview({
        cost: 10,
        activeGroups: 2,
        isPro: true,
      })
    ).toEqual({ kind: 'paid', cost: 10 });
  });

  it('quotes a free first join when the account is under the cap', () => {
    expect(
      resolveJoinGroupPreview({
        cost: 0,
        activeGroups: 0,
        isPro: false,
      })
    ).toEqual({ kind: 'free' });
  });
});

describe('join group confirm helper', () => {
  it('teaches guests that previewing has not joined them', () => {
    expect(describeJoinGroupConfirmSpend(50, false)).toContain(
      'Joining adds you to this group'
    );
    expect(describeJoinGroupConfirmSpend(50, false)).toContain(
      'Previewing it has not changed anything'
    );
  });

  it('names a signed-in first join as free instead of a 0 Momenta charge', () => {
    const copy = describeJoinGroupConfirmSpend(0, true);

    expect(copy).toContain('first join is free');
    expect(copy.toLowerCase()).not.toMatch(/costs 0|0 momenta/);
  });

  it('names a later join as a Momenta spend after the group accepts', () => {
    expect(describeJoinGroupConfirmSpend(50, true)).toContain(
      'Joining spends 50 Momenta'
    );
    expect(describeJoinGroupConfirmSpend(50, true)).toContain(
      'code is used only after the group accepts you'
    );
  });

  it('does not invent a price when the signed-in quote is missing', () => {
    expect(describeJoinGroupConfirmSpend(null, true)).toContain(
      'If joining costs Momenta, you will see the amount'
    );
  });
});
