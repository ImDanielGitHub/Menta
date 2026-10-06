import { getResidualSavedProofCopy } from '../residual-proof-copy';

describe('residual saved-proof copy', () => {
  it('names that today does not count yet without server language', () => {
    const copy = getResidualSavedProofCopy();

    expect(copy.title).toBe('Today does not count yet');
    expect(copy.detail).toContain('stays on this device');
    expect(copy.detail).toContain('You do not need to send it again');
    expect(copy.checkAgain).toContain('whether this proof was saved');
    expect(`${copy.title} ${copy.detail} ${copy.checkAgain}`).not.toMatch(
      /server receipt|server status/i
    );
  });
});
