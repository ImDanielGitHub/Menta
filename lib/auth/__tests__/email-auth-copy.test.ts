import {
  getEmailAuthDuplicateCopy,
  isDuplicateAccountError,
} from '@/lib/auth/email-auth-copy';
import { translate } from '@/lib/localization/translate';

describe('email auth duplicate account copy', () => {
  it('recognises provider duplicate-account failures', () => {
    expect(isDuplicateAccountError('Email already registered')).toBe(true);
    expect(isDuplicateAccountError('User already exists')).toBe(true);
    expect(isDuplicateAccountError('Invalid login credentials')).toBe(false);
  });

  it('names an existing Menta account instead of the raw provider sentence', () => {
    expect(getEmailAuthDuplicateCopy()).toBe(
      'This email already has a Menta account.'
    );
    expect(getEmailAuthDuplicateCopy()).toBe(
      translate('en-NZ', 'fullAuth.residual.paper_auth.duplicate_email')
    );
  });
});
