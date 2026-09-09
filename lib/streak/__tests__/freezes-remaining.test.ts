import { resolveFreezesRemaining } from '@/lib/streak/freezes-remaining';

describe('resolveFreezesRemaining', () => {
  it('treats a missing count as none, not two unearned freezes', () => {
    expect(resolveFreezesRemaining(undefined)).toBe(0);
    expect(resolveFreezesRemaining(null)).toBe(0);
  });

  it('keeps a confirmed remaining count', () => {
    expect(resolveFreezesRemaining(0)).toBe(0);
    expect(resolveFreezesRemaining(1)).toBe(1);
    expect(resolveFreezesRemaining(3)).toBe(3);
  });

  it('does not surface fractional, negative, or non-finite counts', () => {
    expect(resolveFreezesRemaining(-1)).toBe(0);
    expect(resolveFreezesRemaining(1.8)).toBe(1);
    expect(resolveFreezesRemaining(Number.NaN)).toBe(0);
    expect(resolveFreezesRemaining(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
