import type { CompleteCatalogue } from '@/lib/localization/en-NZ';

/** Canadian French terminology where it materially differs from neutral French. */
export const accountabilityFrCAOverrides = {
  'fullAuth.source.email_confirmation.callback_failed_description':
    'Votre inscription est toujours en attente. Ouvrez de nouveau le lien dans le courriel ou renvoyez-le ci-dessous.',
  'fullAuth.source.email_confirmation.change_email':
    'Changer d’adresse courriel',
  'fullAuth.source.email_confirmation.confirmed_action':
    'J’ai confirmé mon adresse courriel',
  'fullAuth.source.email_confirmation.email_accessibility':
    'Courriel de confirmation {email}',
  'fullAuth.source.email_confirmation.email_label': 'Courriel de confirmation',
  'fullAuth.source.email_confirmation.expired_description':
    'Votre promesse et votre invitation sont toujours enregistrées. Demandez un nouveau courriel de confirmation ci-dessous.',
  'fullAuth.source.email_confirmation.heading': 'Consultez vos courriels',
  'fullAuth.source.email_confirmation.invalid_description':
    'Il a peut-être déjà été utilisé. Vérifiez de nouveau cet appareil, renvoyez le courriel ou connectez-vous.',
  'fullAuth.source.email_confirmation.no_pending_description':
    'Aucune confirmation par courriel n’est à reprendre sur cet appareil. Connectez-vous si vous avez déjà un compte Menta.',
  'fullAuth.source.email_confirmation.reopen_failed_description':
    'Menta a conservé l’adresse courriel en attente pour éviter d’envoyer deux fois la même inscription. Réessayez.',
  'fullAuth.source.email_confirmation.resend_rate_limited':
    'Menta ne peut pas encore envoyer un autre courriel. Attendez un instant, puis réessayez.',
  'fullAuth.source.email_confirmation.restore_failed_description':
    'Menta n’a pas pu lire l’adresse courriel enregistrée sur cet appareil. Vous pouvez tout de même vous connecter en toute sécurité.',
  'fullAuth.source.email_confirmation.restoring':
    'Restauration de votre confirmation par courriel…',
  'fullAuth.source.email_confirmation.saved_state_description':
    'Votre promesse inachevée et tout parrainage ou toute invitation enregistrés restent sur cet appareil. Menta conserve les versions des documents et l’heure de votre accord, les vérifie de nouveau après la connexion et ne terminera pas l’accueil tant qu’une session correspondant à cette adresse courriel n’est pas confirmée.',
  'fullAuth.source.email_confirmation.storage_description':
    'Le courriel de confirmation a été demandé, mais cet appareil n’a pas pu enregistrer le relais pour la prochaine ouverture de l’app.',
} as const satisfies Partial<CompleteCatalogue>;
