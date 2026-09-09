import { translate } from '@/lib/localization';

describe('auth and account localisation', () => {
  it('keeps dynamic account copy as a complete interpolated template', () => {
    expect(
      translate(
        'en-NZ',
        'fullAuth.notification_settings.occasional_updates_to_email_unsubscribe_here',
        {
          email: 'daniel@example.com',
        }
      )
    ).toBe(
      'Occasional updates to daniel@example.com. Unsubscribe here at any time.'
    );
  });

  it('preserves product terms in the English source catalogue', () => {
    expect(
      translate(
        'en-NZ',
        'fullAuth.onboarding.first_promise_firstpromisecost_momenta_after_cre',
        {
          firstPromiseCost: 0,
          welcomeBonus: 100,
        }
      )
    ).toContain('Momenta');
  });

  it('keeps newly externalised auth copy exact and interpolated', () => {
    expect(
      translate('en-NZ', 'fullAuth.residual.paper_auth.password_minimum', {
        length: 8,
      })
    ).toBe('Use at least 8 characters.');
    expect(
      translate('en-NZ', 'fullAuth.residual.legal.document_open_failed', {
        label: 'Privacy Policy',
      })
    ).toBe('Privacy Policy did not open. Try again.');
    expect(
      translate('en-NZ', 'fullAuth.residual.oauth.apple_sign_in_fallback')
    ).toBe("Couldn't sign in with Apple. Try again or use email.");
  });

  it('provides German copy for every new auth residual key', () => {
    expect(
      translate('de-DE', 'fullAuth.residual.paper_auth.password_minimum', {
        length: 8,
      })
    ).toBe('Verwende mindestens 8 Zeichen.');
    expect(
      translate('de-DE', 'fullAuth.residual.legal.document_open_failed', {
        label: 'Datenschutzrichtlinie',
      })
    ).toBe('Datenschutzrichtlinie wurde nicht geöffnet. Versuche es erneut.');
    expect(
      translate('de-DE', 'fullAuth.residual.oauth.apple_sign_in_fallback')
    ).toBe(
      'Die Anmeldung mit Apple war nicht möglich. Versuche es erneut oder verwende deine E-Mail-Adresse.'
    );
  });
});
