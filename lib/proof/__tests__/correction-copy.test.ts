import {
  correctionProofKind,
  getCorrectionFeedbackCopy,
} from '@/lib/proof/correction-copy';

describe('correction feedback copy', () => {
  it('keeps the reviewer note as the only detail', () => {
    const copy = getCorrectionFeedbackCopy({
      proofType: 'text',
      correctionReason: '  Add the finish time.  ',
    });

    expect(copy.title).toBe('One clearer note, then you’re done');
    expect(copy.detail).toBe('Add the finish time.');
    expect(copy.primaryLabel).toBe('Add a clearer note');
    expect(copy.detail).not.toContain('original');
  });

  it.each([
    ['photo', 'photo'],
    ['video', 'video'],
    ['text', 'note'],
  ] as const)('names a %s follow-up as %s', (proofType, kind) => {
    const copy = getCorrectionFeedbackCopy({ proofType });

    expect(correctionProofKind(proofType)).toBe(kind);
    expect(copy.title).toBe(`One clearer ${kind}, then you’re done`);
    expect(copy.primaryLabel).toBe(`Add a clearer ${kind}`);
  });

  it('does not invent a photo when the proof type is unknown', () => {
    const copy = getCorrectionFeedbackCopy({});

    expect(copy.title).toBe('One clearer proof, then you’re done');
    expect(copy.primaryLabel).toBe('Add clearer proof');
    expect(copy.detail.toLowerCase()).not.toContain('photo');
  });
});
