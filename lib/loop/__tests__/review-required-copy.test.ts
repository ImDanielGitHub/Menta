import { getReviewRequiredDetail } from '@/lib/loop/review-required-copy';

describe('review-required copy', () => {
  it('names a note, photo, or video without inventing a photo', () => {
    expect(getReviewRequiredDetail({ proofType: 'text' })).toContain(
      'Read the note, then approve it or ask for one clear correction.'
    );
    expect(getReviewRequiredDetail({ proofType: 'photo' })).toContain(
      'Check the photo, then approve it or ask for one clear correction.'
    );
    expect(getReviewRequiredDetail({ proofType: 'video' })).toContain(
      'Watch the video, then approve it or ask for one clear correction.'
    );
  });

  it('keeps unknown proof generic and still names the review earn', () => {
    const copy = getReviewRequiredDetail();

    expect(copy).toContain(
      'Check the proof, then approve it or ask for one clear correction.'
    );
    expect(copy.toLowerCase()).not.toContain('photo');
    expect(copy).toContain(
      'Each confirmed review adds 8 Momenta, up to 20 a day.'
    );
  });
});
