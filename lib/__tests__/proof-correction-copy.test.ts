import {
  getCorrectionComposeNotice,
  getCorrectionFollowUpNote,
  sanitizeCorrectionReason,
} from '@/lib/proof-correction-copy';

describe('proof correction copy', () => {
  it('keeps only a real reviewer note', () => {
    expect(sanitizeCorrectionReason('  Show the full route marker.  ')).toBe(
      'Show the full route marker.'
    );
    expect(sanitizeCorrectionReason('   ')).toBeNull();
    expect(sanitizeCorrectionReason(null)).toBeNull();
  });

  it('repeats the reviewer note on the next capture', () => {
    expect(getCorrectionComposeNotice('Show the full route marker.')).toEqual({
      title: 'What to change',
      description: 'Show the full route marker.',
    });
    expect(getCorrectionComposeNotice(null)).toBeNull();
  });

  it('uses the reviewer note as the follow-up fact when one exists', () => {
    expect(getCorrectionFollowUpNote('Show the finish line.')).toBe(
      'Show the finish line.'
    );
    expect(getCorrectionFollowUpNote(null)).toContain('clearer follow-up');
  });
});
