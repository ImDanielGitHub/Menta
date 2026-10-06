import { translate } from '@/lib/localization/translate';

it('describes the German proof destination as the account', () => {
  expect(
    translate(
      'de-DE',
      'fullAuth.auth_required.menta_saves_this_proof_with_the_right_promise_an'
    )
  ).toBe(
    'Menta speichert diesen Nachweis mit dem richtigen Versprechen und Konto.'
  );
});
it.each(['es-ES', 'es-MX'])(
  'keeps %s legal fallbacks on the canonical URLs',
  locale => {
    expect(
      translate(
        locale,
        'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_terms_in_your_bro'
      )
    ).toContain('menta.quest/terms');
    expect(
      translate(
        locale,
        'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_privacy_in_your_b'
      )
    ).toContain('menta.quest/privacy');
    expect(
      translate(
        locale,
        'fullAuth.component_onboarding_paperauthsurface.try_again_or_visit_menta_quest_community_standar'
      )
    ).toContain('menta.quest/community-standards');
  }
);
