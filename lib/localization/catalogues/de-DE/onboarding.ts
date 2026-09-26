import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingDeDE = {
  'onboarding.paywall.required':
    'Starte dein Vorhaben mit Menta Pro. Wähle einen Tarif, um fortzufahren.',
  'onboarding.paywall.capacity':
    'Halte mehr Vorhaben und Gruppen gleichzeitig aktiv.',
  'onboarding.welcome.title': 'Halte die Versprechen, die du dir selbst gibst.',
  'onboarding.welcome.body':
    'Beginne mit einem Versprechen. Geh einen Tag nach dem anderen an.',
  'onboarding.welcome.action.start': 'Mein erstes Versprechen wählen',
  'onboarding.welcome.action.sign_in': 'Ich nutze Menta bereits',
  'onboarding.meet.message':
    'Hi, ich bin Menta! Ich helfe Menschen, das zu tun, was sie sich vorgenommen haben.',
  'onboarding.obstacle.question':
    'Mal ehrlich: Was kommt dir meistens dazwischen?',
  'onboarding.obstacle.fades': 'Ich starte stark, dann lässt es nach',
  'onboarding.obstacle.unnoticed': 'Niemand merkt es, wenn ich aussetze',
  'onboarding.obstacle.forget': 'Ich vergesse es, bis der Tag vorbei ist',
  'onboarding.obstacle.too_big': 'Meine Ziele werden zu groß',
  'onboarding.evidence.stat': '76 %',
  'onboarding.evidence.title':
    'Wer einem Freund jede Woche berichtete, erreichte sein Ziel deutlich öfter oder kam mindestens halb so weit.',
  'onboarding.evidence.with_friend': 'Mit einem Freund',
  'onboarding.evidence.alone': 'Allein',
  'onboarding.evidence.alone_stat': '43 %',
  'onboarding.evidence.source':
    'Zielstudie von Dr. Gail Matthews, Dominican University of California. Die 76-%-Gruppe hat ihre Ziele außerdem aufgeschrieben und sich zu konkreten Schritten verpflichtet.',
  'onboarding.evidence.menta': 'Darum frage ich nach einem Nachweis.',
  'onboarding.evidence.action': 'Mein erstes Versprechen erstellen',
  'onboarding.proof.question':
    'Wenn du es geschafft hast, wie zeigst du es mir?',
  'onboarding.duration.question': 'Wie lange möchtest du dranbleiben?',
  'onboarding.continue': 'Weiter',
  'onboarding.legal.terms_summary':
    'Wie dein Konto und deine Versprechen funktionieren.',
  'onboarding.legal.community_summary':
    'Nachweise bleiben jugendfrei. Respektiere die Privatsphäre anderer.',
  'onboarding.legal.privacy_summary':
    'Was Menta erfasst und wie es genutzt wird.',
  'onboarding.preview.question': 'Hier ist dein Versprechen. Passt alles?',
  'onboarding.accountability.question': 'Wer soll deinen Nachweis prüfen?',
  'onboarding.accountability.trusted': 'Jemand, dem ich vertraue',
  'onboarding.accountability.trusted_detail':
    'Diese Person sieht deinen Nachweis und bestätigt ihn mit einem Tippen. Du lädst sie nach dem Speichern ein.',
  'onboarding.accountability.private': 'Erst mal nur ich',
  'onboarding.accountability.private_detail':
    'Bleibt privat. Du kannst später jemanden einladen.',
  'onboarding.accountability.recommended': 'Empfohlen',
  'onboarding.accountability.note':
    'Niemand wird hinzugefügt, bis du eine Einladung sendest.',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
