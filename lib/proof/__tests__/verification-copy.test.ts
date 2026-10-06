import { translate } from '@/lib/localization';
import {
  getProofFailedDetail,
  getProofSafetyDisclosure,
  getProofSubmissionReceiptOverride,
  getTextProofValidationError,
} from '../verification-copy';

const t = (
  key: Parameters<typeof translate>[1],
  values?: Record<string, string | number>
) => translate('en-NZ', key, values);

describe('verification proof copy', () => {
  it('names a second send as already received', () => {
    expect(
      getProofSubmissionReceiptOverride('DAILY_SUBMISSION_EXISTS', t)
    ).toBe(
      "Today's proof is already on this promise. You do not need to send it again."
    );
  });

  it('names joining before sending proof', () => {
    expect(getProofSubmissionReceiptOverride('NOT_JOINED', t)).toBe(
      'You need to join this promise before you can send proof.'
    );
  });

  it('does not invent a receipt for other codes', () => {
    expect(getProofSubmissionReceiptOverride('DEADLINE_PASSED', t)).toBeNull();
    expect(getProofSubmissionReceiptOverride(null, t)).toBeNull();
  });

  it('keeps the failed send and the draft on this device', () => {
    expect(getProofFailedDetail(t)).toContain('Proof was not sent');
    expect(getProofFailedDetail(t)).toContain('draft stays here');
  });

  it('rejects a generic Done note without a vague next step', () => {
    expect(getTextProofValidationError(t)).toBe(
      'Add a detail. “Done” alone is not enough.'
    );
  });

  it('keeps the SFW proof safety line in product language', () => {
    expect(getProofSafetyDisclosure(t)).toContain('safe for work (SFW)');
    expect(getProofSafetyDisclosure(t)).toContain('authorised Menta staff');
  });
});
