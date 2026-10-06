import { describeCreatedGroup } from '../create-group-copy';

describe('created group description copy', () => {
  it('names the chosen length as a shared-promise group', () => {
    expect(describeCreatedGroup(14)).toBe(
      'A 14-day group for shared promises.'
    );
    expect(describeCreatedGroup(1)).toBe('A 1-day group for shared promises.');
  });

  it('does not reuse the first-promise description for an ordinary group', () => {
    expect(describeCreatedGroup(21)).not.toContain('first promise');
    expect(describeCreatedGroup(21)).toBe(
      'A 21-day group for shared promises.'
    );
  });

  it('falls back to a 14-day group when the length is not a real duration', () => {
    expect(describeCreatedGroup(0)).toBe('A 14-day group for shared promises.');
    expect(describeCreatedGroup(Number.NaN)).toBe(
      'A 14-day group for shared promises.'
    );
  });
});
