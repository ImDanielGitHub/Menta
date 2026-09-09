import {
  buildInviteShareMessage,
  buildInviteShareUrl,
  buildReferralShareUrl,
  parseInviteLink,
  resolveGroupInviteInput,
} from '@/lib/invite-links';

describe('invite-links', () => {
  it.each([
    ['LOCKEDIN', 'group', 'LOCKEDIN'],
    ['lockedin', 'group', 'LOCKEDIN'],
    ['lock ed-in', 'group', 'LOCKEDIN'],
    ['menta://join?invite=abc123', 'group', 'ABC123'],
    ['lockedin://join?code=abc123', 'group', 'ABC123'],
    ['lockedinprod://join?invite=abc123', 'group', 'ABC123'],
    ['https://menta.quest/join?invite=abc123', 'group', 'ABC123'],
    ['HTTPS://MENTA.QUEST/JOIN?INVITE=ABC123', 'group', 'ABC123'],
    ['https://www.menta.quest/join/abc123', 'group', 'ABC123'],
    ['https://lockedinpro.com/join?invite=abc123', 'group', 'ABC123'],
    ['https://www.lockedinpro.com/join/abc123', 'group', 'ABC123'],
    ['menta://join?challenge=fit2026', 'challenge', 'FIT2026'],
    ['MENTA://JOIN?CHALLENGE=FIT2026', 'challenge', 'FIT2026'],
    ['lockedinprod://join?type=challenge&code=fit2026', 'challenge', 'FIT2026'],
    ['https://menta.quest/join?challenge=fit2026', 'challenge', 'FIT2026'],
    ['https://menta.quest/join/challenge/fit2026', 'challenge', 'FIT2026'],
    ['https://lockedinpro.com/join?challenge=fit2026', 'challenge', 'FIT2026'],
    ['https://lockedinpro.com/join/challenge/fit2026', 'challenge', 'FIT2026'],
  ])('normalizes %s', (url, expectedKind, expectedCode) => {
    expect(parseInviteLink(url)).toMatchObject({
      kind: expectedKind,
      code: expectedCode,
    });
  });

  it('ignores unsupported hosts and malformed codes', () => {
    expect(
      parseInviteLink('https://example.com/join?invite=ABC123')
    ).toBeNull();
    expect(parseInviteLink('https://menta.quest/join?invite=bad!')).toBeNull();
    expect(parseInviteLink('http://menta.quest/join?invite=ABC123')).toBeNull();
    expect(parseInviteLink('https://menta.quest/privacy')).toBeNull();
    expect(parseInviteLink('https://menta.quest/terms')).toBeNull();
    expect(
      parseInviteLink('menta://checkin?challengeId=challenge-1')
    ).toBeNull();
  });

  it.each([
    ['ABC123', 'group', 'ABC123', 'direct_code'],
    ['abc-123', 'group', 'ABC123', 'direct_code'],
    ['https://menta.quest/join?invite=abc123', 'group', 'ABC123', 'https'],
    ['HTTPS://MENTA.QUEST/JOIN?INVITE=ABC123', 'group', 'ABC123', 'https'],
    ['menta://join?challenge=fit2026', 'challenge', 'FIT2026', 'custom_scheme'],
    [
      'https://menta.quest/join/challenge/fit2026',
      'challenge',
      'FIT2026',
      'https',
    ],
  ])(
    'resolves group-join input %s as %s',
    (input, expectedStatus, expectedCode, expectedSource) => {
      expect(resolveGroupInviteInput(input)).toMatchObject({
        status: expectedStatus,
        code: expectedCode,
        source: expectedSource,
      });
    }
  );

  it('classifies empty, malformed, and unsupported group-join input as invalid', () => {
    expect(resolveGroupInviteInput('')).toMatchObject({
      status: 'invalid',
      code: '',
    });
    expect(
      resolveGroupInviteInput('https://example.com/join?invite=ABC123')
    ).toMatchObject({
      status: 'invalid',
    });
    expect(resolveGroupInviteInput('bad!')).toMatchObject({
      status: 'invalid',
    });
    expect(resolveGroupInviteInput(null)).toMatchObject({
      status: 'invalid',
      code: '',
    });
  });

  it('builds canonical HTTPS share URLs by default', () => {
    expect(buildInviteShareUrl('group', 'abc123')).toBe(
      'https://menta.quest/join?invite=ABC123'
    );
    expect(buildInviteShareUrl('challenge', 'fit2026')).toBe(
      'https://menta.quest/join?challenge=FIT2026'
    );
  });

  it('can build legacy custom-scheme URLs for registered schemes', () => {
    expect(buildInviteShareUrl('group', 'abc123', 'menta')).toBe(
      'menta://join?invite=ABC123'
    );
    expect(buildInviteShareUrl('challenge', 'fit2026', 'lockedinprod')).toBe(
      'lockedinprod://join?challenge=FIT2026'
    );
  });

  it('builds share copy with both code and fallback link', () => {
    expect(
      buildInviteShareMessage({
        kind: 'group',
        code: 'abc123',
        title: 'Morning Miles',
      })
    ).toContain('https://menta.quest/join?invite=ABC123');
  });

  it('builds app referral links with HTTPS fallback by default', () => {
    const code = '00112233445566778899AABBCCDDEEFF';
    expect(buildReferralShareUrl(code.toLowerCase())).toBe(
      `https://menta.quest/invite?ref=${code}`
    );
    expect(buildReferralShareUrl(code.toLowerCase(), 'menta')).toBe(
      `menta://invite?ref=${code}`
    );
  });

  it('keeps referral capabilities distinct from shorter invite codes', () => {
    expect(() => buildReferralShareUrl('FRIEND42')).toThrow(
      'Invalid referral code'
    );
  });
});
