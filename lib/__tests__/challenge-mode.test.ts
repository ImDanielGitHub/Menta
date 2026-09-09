import { resolveChallengeMode } from '@/lib/challenge-mode';

describe('resolveChallengeMode', () => {
  it('uses explicit mode=solo and clears groupId', () => {
    const resolved = resolveChallengeMode({
      mode: 'solo',
      groupId: 'group-1',
    });

    expect(resolved).toEqual({
      mode: 'solo',
      groupId: null,
      usedLegacyParams: false,
    });
  });

  it('uses explicit mode=group and keeps groupId', () => {
    const resolved = resolveChallengeMode({
      mode: 'group',
      groupId: 'group-1',
    });

    expect(resolved).toEqual({
      mode: 'group',
      groupId: 'group-1',
      usedLegacyParams: false,
    });
  });

  it('falls back to legacy solo params', () => {
    const withType = resolveChallengeMode({ type: 'solo' });
    const withAllow = resolveChallengeMode({ allowSelfReview: 'true' });
    const withSolo = resolveChallengeMode({ solo: '1' });

    expect(withType.mode).toBe('solo');
    expect(withAllow.mode).toBe('solo');
    expect(withSolo.mode).toBe('solo');
    expect(withType.usedLegacyParams).toBe(true);
  });

  it('defaults to group when no solo signal exists', () => {
    const resolved = resolveChallengeMode({
      groupId: 'group-2',
    });

    expect(resolved).toEqual({
      mode: 'group',
      groupId: 'group-2',
      usedLegacyParams: true,
    });
  });
});
