import { translate } from '@/lib/localization';
import { getProofMediaErrorCopy } from '../proof-media-copy';

describe('proof media error copy', () => {
  it('names a missing or unreadable file as a saved proof on this phone', () => {
    expect(getProofMediaErrorCopy('missing')).toBe(
      'Menta could not reopen the saved proof on this phone.'
    );
    expect(getProofMediaErrorCopy('reopen')).toBe(
      'Menta could not reopen the saved proof on this phone.'
    );
  });

  it('names a failed prepare or oversize file as another capture, not media jargon', () => {
    expect(getProofMediaErrorCopy('prepare')).toBe(
      'Menta could not prepare that proof. Choose another capture and try again.'
    );
    expect(getProofMediaErrorCopy('too_large')).toBe(
      'Menta could not prepare that proof. Choose another capture and try again.'
    );
    expect(getProofMediaErrorCopy('too_large')).not.toMatch(/media/i);
    expect(getProofMediaErrorCopy('prepare')).not.toMatch(/this photo/i);
  });

  it('follows the chosen language instead of leftover English', () => {
    const t = (key: Parameters<typeof translate>[1], values = {}) =>
      translate('de-DE', key, values);

    expect(getProofMediaErrorCopy('missing', t)).not.toBe(
      'The saved proof file is no longer available on this phone.'
    );
    expect(getProofMediaErrorCopy('too_large', t)).not.toBe(
      'Choose proof media smaller than 50 MB.'
    );
  });
});
