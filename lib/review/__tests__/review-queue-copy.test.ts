import { translate } from '@/lib/localization';
import { getReviewQueueEmptyTitle } from '../review-queue-copy';

const t = (
  key: Parameters<typeof translate>[1],
  values?: Record<string, string | number>
) => translate('en-NZ', key, values);

describe('review queue empty titles', () => {
  it('keeps the pending wait in product language', () => {
    expect(getReviewQueueEmptyTitle('pending', t)).toBe(
      'No submissions to review'
    );
    expect(
      getReviewQueueEmptyTitle('pending', t, { entryPoint: 'proof_receipt' })
    ).toBe('Nothing else to review yet');
  });

  it('names approved and retry filters without raw status tokens', () => {
    expect(getReviewQueueEmptyTitle('approved', t)).toBe(
      'No approved proof here'
    );
    expect(getReviewQueueEmptyTitle('rejected', t)).toBe(
      'No proof needs another try'
    );
    expect(getReviewQueueEmptyTitle('all', t)).toBe('No proof here');
    expect(getReviewQueueEmptyTitle('rejected', t)).not.toContain('rejected');
  });
});
