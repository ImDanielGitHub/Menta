import {
  buildReferralShareCopy,
  resolveReferralShareName,
} from '../share-copy';

describe('referral share copy', () => {
  it('asks the person to create a first promise instead of completing a referral', () => {
    const copy = buildReferralShareCopy(
      'https://menta.quest/invite?ref=ACTIVE'
    );

    expect(copy.title).toBe('Invite someone to Menta');
    expect(copy.message).toBe(
      'Join me on Menta. Use this link, then create your first promise.\n\nhttps://menta.quest/invite?ref=ACTIVE'
    );
    expect(copy.message).not.toContain('complete the referral');
  });

  it('names the inviter only when a real name is present', () => {
    expect(resolveReferralShareName('  ')).toBeNull();
    expect(resolveReferralShareName('mia')).toBe('mia');
    expect(
      buildReferralShareCopy('https://menta.quest/invite?ref=ACTIVE', 'mia')
        .title
    ).toBe('Join mia on Menta');
  });
});
