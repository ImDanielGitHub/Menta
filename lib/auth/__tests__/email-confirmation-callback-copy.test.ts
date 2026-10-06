import { translate } from '@/lib/localization/translate';
import { getEmailConfirmationCallbackCopy } from '../email-confirmation-callback-copy';

describe('email confirmation callback copy', () => {
  it('names the link exchange as restoring the saved confirmation', () => {
    expect(getEmailConfirmationCallbackCopy('checking')).toBe(
      'Restoring your email confirmation…'
    );
    expect(getEmailConfirmationCallbackCopy('confirmed')).toBe(
      'Restoring your email confirmation…'
    );
  });

  it('does not keep leftover English about checking a link or restoring a promise', () => {
    expect(getEmailConfirmationCallbackCopy('checking')).not.toBe(
      'Checking your confirmation link…'
    );
    expect(getEmailConfirmationCallbackCopy('confirmed')).not.toBe(
      'Email confirmed. Restoring your promise…'
    );
  });

  it('uses the active locale instead of a hardcoded English receipt', () => {
    expect(
      getEmailConfirmationCallbackCopy('checking', (key, values) =>
        translate('de-DE', key, values)
      )
    ).toBe(translate('de-DE', 'fullAuth.source.email_confirmation.restoring'));
  });
});
